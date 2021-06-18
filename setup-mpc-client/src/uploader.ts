import { EventEmitter } from 'events';
import { unlink } from 'fs';
import { MemoryFifo, MpcServer } from 'setup-mpc-common';
import { Address } from '@alayanetwork/web3x/address';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class Uploader extends EventEmitter {
  private cancelled = false;
  private queue: MemoryFifo<number> = new MemoryFifo();

  constructor(private server: MpcServer, private address: Address) {
    super();
  }

  public async run() {
    // console.log('Uploader starting at: ', new Date());
    while (true) {
      const num = await this.queue.get();
      if (num === null) {
        break;
      }
      await this.uploadTranscriptWithRetry(num);
    }
    // console.log('Uploader complete at: ', new Date());
  }

  public put(transcriptNum: number) {
    this.queue.put(transcriptNum);
  }

  public cancel() {
    this.cancelled = true;
    this.queue.cancel();
  }

  public end() {
    this.queue.end();
  }

  private async uploadTranscriptWithRetry(num: number) {
    const filename = `../algorithm/target/release/output/file_${num}.dat`;
    while (!this.cancelled) {
      try {
        //console.error(`Uploading: `, filename);
        await this.server.uploadData(this.address, num, filename, undefined, transferred => {
          this.emit('progress', num, transferred);
        });
        await new Promise(resolve => unlink(filename, resolve));
        this.emit('uploaded', num);
        break;
      } catch (err) {
        console.error(`Failed to upload transcript ${num}: ${err.message}`);
        await sleep(1000);
      }
    }
  }
}
