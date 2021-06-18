import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import readline from 'readline';
import { cloneParticipant, MemoryFifo, MpcServer, MpcState, Participant, Transcript } from 'setup-mpc-common';
import { Downloader } from './downloader';
import { Uploader } from './uploader';

export class Compute {
  private setupProc?: ChildProcessWithoutNullStreams;
  private computeQueue: MemoryFifo<string> = new MemoryFifo();
  private downloader: Downloader;
  private uploader: Uploader;

  constructor(
    private state: MpcState,
    private myState: Participant,
    server: MpcServer,
    private computeOffline: boolean
  ) {
    this.downloader = new Downloader(server);
    this.uploader = new Uploader(server, myState.address);
  }

  public async start() {
    if (this.computeOffline) {
      this.myState.runningState = 'OFFLINE';
      return;
    } else {
      this.myState.runningState = 'WAITING';
    }

    if (this.myState.runningState === 'WAITING') {
      this.myState.runningState = 'RUNNING';
    }

    await this.populateQueues();
    await this.runDownloader().catch(err => {
      console.error(err);
      this.cancel();
      throw err;
    });

    await Promise.all([this.compute(), this.runUploader()]).catch(err => {
      console.error(err);
      this.cancel();
      throw err;
    });

    this.myState.runningState = 'COMPLETE';
    //console.error('Compute ran to completion.');
  }

  public cancel() {
    this.downloader.cancel();
    this.uploader.cancel();
    this.computeQueue.cancel();
    if (this.setupProc) {
      this.setupProc.kill('SIGINT');
    }
  }

  public getParticipant() {
    return cloneParticipant(this.myState);
  }

  private async populateQueues() {
    this.myState.computeProgress = 0;

    const previousParticipant = this.state.participants
      .slice()
      .reverse()
      .find(p => p.state === 'COMPLETE');

    if (previousParticipant) {
      //console.error('Previous participant found.');

      this.myState.transcripts.forEach(transcript => {
        // Reset download and upload progress as we are starting over.
        if (!this.downloader.isDownloaded(transcript)) {
          transcript.downloaded = 0;
        }
        transcript.uploaded = 0;

        // Add to downloaded queue regardless of if already downloaded. Will shortcut later in the downloader.
        this.downloader.put(transcript);
        //console.log(`populateQueues num=${transcript.num}, size=${transcript.size}`);
      });

      this.downloader.end();
    } else {
      //console.error('We are the first participant.');
      this.downloader.end();

      this.myState.transcripts.forEach(transcript => {
        transcript.uploaded = 0;
        //console.log(`populateQueues first num=${transcript.num}, size=${transcript.size}`);
      });
    }
  }

  private async runDownloader() {
    this.downloader.on('downloaded', (transcript: Transcript) => {
      this.computeQueue.put(`process ${transcript.num}`);
    });

    this.downloader.on('progress', (transcript: Transcript, transferred: number) => {
      transcript.downloaded = transferred;
    });

    await this.downloader.run();

    this.computeQueue.end();
  }

  private async runUploader() {
    this.uploader.on('progress', (num: number, transferred: number) => {
      //console.log(`runUploader progress num=${num}, transferred=${transferred}`);
      //console.log('runUploader progress size=', this.myState.transcripts[num].size);
      this.myState.transcripts[num].uploaded = transferred;
    });

    await this.uploader.run();
  }

  private async compute() {
    return new Promise(async (resolve, reject) => {
      this.myState.fast = !!process.env.FAST;
      //const binPath = process.env.FAST ? '../setup-tools/setup-fast' : '../setup-tools/setup';
      const binPath = '../algorithm/target/release/setup';
      //console.error(`Computing with: ${binPath}`);
      const args = [
        '--output',
        '../algorithm/target/release/output/'
      ];
      const previousParticipant = this.state.participants
      .slice()
      .reverse()
      .find(p => p.state === 'COMPLETE');
      if (previousParticipant) {
        args.push('--input');
        args.push('../algorithm/target/release/input/');
      } else {
        args.push('--genesis');
      }
      const setup = spawn(binPath, args);
      this.setupProc = setup;

      readline
        .createInterface({
          input: setup.stdout,
          terminal: false,
        })
        .on('line', this.handleSetupOutput);
      /*setup.stdout.on('data', function (data) {
          console.log('setup stdout: ' + data);
       });*/

      setup.stderr.on('data', data => {
        console.error(data.toString());
      });

      setup.on('close', code => {
        this.setupProc = undefined;
        this.uploader.end();
        if (code === 0) {
          //console.error(`Compute complete.`);
          resolve();
        } else {
          reject(new Error(`setup exited with code ${code}`));
        }
      });

      setup.on('error', reject);

      //console.error(`Compute starting...`);
      /*while (true) {
        const cmd = await this.computeQueue.get();
        if (!cmd) {
          setup.stdin.end();
          break;
        }
        console.error(`Setup command: ${cmd}`);
        setup.stdin.write(`${cmd}\n`);
      }*/
    });
  }

  private handleSetupOutput = (data: Buffer) => {
    //console.error('From setup: ', data.toString());
    const params = data
      .toString()
      .replace('\n', '')
      .split(' ');
    const cmd = params.shift()!;
    switch (cmd) {
      case 'creating': {
        for (const transcriptDef of params) {
          const [num, size] = transcriptDef.split(':');
          const transcript = this.myState.transcripts[+num];
          transcript.size = +size;
          transcript.downloaded = +size;
          //console.log(`creating num=${num}, size=${size}`);
        }
        break;
      }
      case 'wrote': {
        this.uploader.put(+params[0]);
        break;
      }
      case 'progress': {
        this.myState.computeProgress = +params[0];
        break;
      }
    }
  };
}
