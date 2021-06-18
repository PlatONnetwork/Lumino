import BN from 'bn.js';
import { createWriteStream, unlink } from 'fs';
import Koa from 'koa';
import koaBody from 'koa-body';
import compress from 'koa-compress';
import Router from 'koa-router';
import moment from 'moment';
import readline from 'readline';
import { hashFiles, MpcServer } from 'setup-mpc-common';
import { PassThrough } from 'stream';
import meter from 'stream-meter';
import { isNumber, isString } from 'util';
import { Address } from '@alayanetwork/web3x/address';
import { bufferToHex, randomBuffer, recover } from '@alayanetwork/web3x/utils';
import { writeFileAsync } from './fs-async';
import { ParticipantSelectorFactory } from './participant-selector';
import { defaultState } from './state/default-state';

const cors = require('@koa/cors');

// 1GB
const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024;

function normaliseSettings(settings: any) {
  if (isString(settings.startTime)) {
    settings.startTime = moment(settings.startTime);
  } else if (isNumber(settings.startTime)) {
    settings.startTime = moment().add(settings.startTime, 's');
  }

  if (isString(settings.endTime)) {
    settings.endTime = moment(settings.endTime);
  } else if (isNumber(settings.endTime)) {
    settings.endTime = moment(settings.startTime).add(settings.endTime, 's');
  }

  if (settings.selectBlock < 0) {
    // If select block is negative, use it as an offset from the latest block.
    settings.selectBlock = settings.latestBlock - settings.selectBlock;
  }
}

export function appFactory(
  server: MpcServer,
  adminAddress: Address,
  participantSelectorFactory: ParticipantSelectorFactory,
  prefix?: string,
  tmpDir: string = '/tmp',
  maxUploadSize: number = MAX_UPLOAD_SIZE
) {
  const isAdmin = (ctx: Koa.Context) => {
    const signature = ctx.get('X-Signature');
    return adminAddress.equals(recover('SignMeWithYourPrivateKey', signature));
  };

  const adminAuth = async (ctx: Koa.Context, next: any) => {
    if (!isAdmin(ctx)) {
      ctx.status = 401;
      return;
    }
    await next(ctx);
  };

  const router = new Router({ prefix });

  router.get('/', async (ctx: Koa.Context) => {
    ctx.body = 'OK\n';
  });

  router.post('/reset', adminAuth, koaBody(), async (ctx: Koa.Context) => {
    const network = ctx.request.body.network || 'alaya';
    const latestBlock = await participantSelectorFactory.getCurrentBlockHeight(network);
    const resetState = {
      ...defaultState(latestBlock, network),
      participants0: [],
      participants1: [],
      participants2: [],
      ...ctx.request.body,
    };
    normaliseSettings(resetState);

    resetState.participants0 = resetState.participants0.map(Address.fromString);
    resetState.participants1 = resetState.participants1.map(Address.fromString);
    resetState.participants2 = resetState.participants2.map(Address.fromString);

    try {
      await server.resetState(resetState);
      ctx.status = 200;
    } catch (err) {
      ctx.body = { error: err.message };
      ctx.status = 400;
    }
  });

  router.post('/flush-waiting', adminAuth, async (ctx: Koa.Context) => {
    await server.flushWaiting();
  });

  router.get('/state', async (ctx: Koa.Context) => {
    ctx.body = await server.getState(ctx.query.sequence);
  });

  router.get('/state/load/:name', async (ctx: Koa.Context) => {
    ctx.body = await server.loadState(ctx.params.name);
  });

  router.patch('/state', adminAuth, koaBody(), async (ctx: Koa.Context) => {
    normaliseSettings(ctx.request.body);
    ctx.body = await server.patchState(ctx.request.body);
  });

  router.get('/ping/:address', koaBody(), async (ctx: Koa.Context) => {
    const signature = ctx.get('X-Signature');
    const address = Address.fromString(ctx.params.address.toLowerCase());
    if (!address.equals(recover('ping', signature))) {
      ctx.status = 401;
      return;
    }
    await server.ping(address, ctx.request.ip);
    ctx.status = 200;
  });

  router.put('/participant/:address', adminAuth, async (ctx: Koa.Context) => {
    console.log('add participant tier=', ctx.query.tier);
    const address = Address.fromString(ctx.params.address.toLowerCase());
    server.addParticipant(address, +ctx.query.tier);
    ctx.status = 204;
  });

  router.patch('/participant/:address', koaBody(), async (ctx: Koa.Context) => {
    const signature = ctx.get('X-Signature');
    const address = Address.fromString(ctx.params.address.toLowerCase());
    let admin = false;
    if (!address.equals(recover(JSON.stringify(ctx.request.body), signature))) {
      admin = isAdmin(ctx);
      if (!admin) {
        ctx.status = 401;
        return;
      }
    }
    try {
      await server.updateParticipant(
        {
          ...ctx.request.body,
          address,
        },
        admin
      );
    } catch (err) {
      // This is a "not running" error. Just swallow it as the client need not be concerned with this.
    }
    ctx.status = 200;
  });

  router.get('/signature/:address/:num', async (ctx: Koa.Context) => {
    const { address, num } = ctx.params;
    ctx.body = await server.downloadSignature(Address.fromString(address.toLowerCase()), num);
  });

  router.get('/txHash/:address/:num', async (ctx: Koa.Context) => {
    const { address, num } = ctx.params;
    ctx.body = await server.downloadTxHash(Address.fromString(address.toLowerCase()), num);
  });

  router.get('/data/:address/:num', async (ctx: Koa.Context) => {
    let { address, num } = ctx.params;
    if(isNaN(Number(num))) {
      try {
        let fileName = num.toString().split(".")[0];
        num = parseInt(fileName.split("_")[1]);
        if (isNaN(num) || !isNumber(num)) {
          ctx.status = 400;
          return;
        }
      } catch (err) {
        ctx.status = 400;
        return;
      }
    }
    ctx.body = await server.downloadData(Address.fromString(address.toLowerCase()), num);
  });

  router.put('/data/:address/:num', async (ctx: Koa.Context) => {
    const address = Address.fromString(ctx.params.address.toLowerCase());
    const transcriptNum = +ctx.params.num;
    const [pingSig, dataSig] = ctx.get('X-Signature').split(',');

    console.log(`Receiving transcript: /${address.toString()}/${transcriptNum}`);

    // 500, unless we explicitly set it to 200 or something else.
    ctx.status = 500;

    try {
      if (!pingSig || !dataSig) {
        throw new Error('X-Signature header incomplete.');
      }

      // Before reading body, pre-authenticate user.
      if (!address.equals(recover('ping', pingSig))) {
        throw new Error('Ping signature incorrect.');
      }

      const { participants } = await server.getState();
      const participant = participants.find(p => p.address.equals(address));
      if (!participant || participant.state !== 'RUNNING') {
        throw new Error('Can only upload to currently running participant.');
      }

      if (transcriptNum >= 30) {
        throw new Error('Transcript number out of range (max 0-29).');
      }
    } catch (err) {
      console.log(`Rejecting: ${err.message}`);
      ctx.body = { error: err.message };
      ctx.status = 401;
      return;
    }

    const nonce = randomBuffer(8).toString('hex');
    const transcriptPath = `${tmpDir}/file_${ctx.params.address}_${transcriptNum}_${nonce}.dat`;
    const signaturePath = `${tmpDir}/file_${ctx.params.address}_${transcriptNum}_${nonce}.sig`;

    try {
      console.log(`Writing to temporary file: ${transcriptPath}`);
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(transcriptPath);
        const meterStream = meter(maxUploadSize);
        ctx.req.setTimeout(180000, () => reject(new Error('Timeout reading data.')));
        ctx.req
          .on('error', reject)
          .on('aborted', () => reject(new Error('Read was aborted.')))
          .pipe(meterStream)
          .on('error', (err: Error) => {
            ctx.status = 429;
            reject(err || new Error('Upload too large.'));
          })
          .pipe(writeStream)
          .on('error', reject)
          .on('finish', resolve);
      });
      console.log(`Finished receiving transcript: ${transcriptPath}`);

      const hash = await hashFiles([transcriptPath]);
      if (!address.equals(recover(bufferToHex(hash), dataSig))) {
        ctx.status = 401;
        throw new Error('Body signature does not match X-Signature.');
      }

      await writeFileAsync(signaturePath, dataSig);

      await server.uploadData(address, +ctx.params.num, transcriptPath, signaturePath);

      ctx.status = 200;
    } catch (err) {
      console.log(`Rejecting: ${err ? err.message : 'no error information'}`);
      ctx.body = { error: err.message };
      unlink(transcriptPath, () => {});
      unlink(signaturePath, () => {});
      return;
    }
  });

  router.get('/files/:address', async (ctx: Koa.Context) => {
    const address = Address.fromString(ctx.params.address.toLowerCase());
    ctx.body = await server.getFiles(address);
  });

  const app = new Koa();
  app.proxy = true;
  app.use(compress());
  app.use(cors());
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
