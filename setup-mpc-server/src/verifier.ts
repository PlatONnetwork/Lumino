import { ChildProcess, spawn } from 'child_process';
import { MemoryFifo } from 'setup-mpc-common';
import { Address } from '@alayanetwork/web3x/address';
import { TranscriptStore } from './transcript-store';

export interface VerifyItem {
  address: Address;
  num: number;
}

export class Verifier {
  private queue: MemoryFifo<VerifyItem> = new MemoryFifo();
  public lastCompleteAddress?: Address;
  public runningAddress?: Address;
  private proc?: ChildProcess;
  private cancelled = false;
  //public runningCnt = 0;

  constructor(
    private store: TranscriptStore,
    private filesCount: number,
    private cb: (address: Address, num: number, verified: boolean) => Promise<void>,
    private progresscb: (address: Address, progress: number) => Promise<void>
  ) {}

  public async active() {
    return this.proc || (await this.queue.length());
  }

  /*public async run() {
    console.log('Verifier started...');
    while (true) {
      const item = await this.queue.get();
      if (!item) {
        break;
      }
      const { address, num } = item;
      const transcriptPath = this.store.getUnverifiedTranscriptPath(address, num);

      try {
        if (!this.runningAddress) {
          // If we dequeued an item, someone should be running.
          throw new Error('No running address set.');
        }

        if (!this.runningAddress.equals(address)) {
          // This address is no longer running. Just skip.
          continue;
        }

        if (await this.verifyTranscript(address, num, transcriptPath)) {
          console.log(`Verification succeeded: ${transcriptPath}...`);

          await this.cb(address, num, true);
        } else {
          await this.store.eraseUnverified(address, num);
          if (!this.cancelled) {
            await this.cb(address, num, false);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    console.log('Verifier completed.');
  }*/

  public async put(item: VerifyItem) {
    //this.queue.put(item);
    if (!this.runningAddress) {
      // If we dequeued an item, someone should be running.
      console.error('No running address set.');
    }

    if (this.runningAddress && !this.runningAddress.equals(item.address)) {
      // This address is no longer running. Just skip.
      console.log('This address is no longer running. Just skip.');
      return;
    }

    console.log(`verify put address=${item.address}, num=${item.num}`);

    if (item.num === this.filesCount - 1) {
      if (await this.verifyTranscript(item.address)) {
        console.log(`Verification succeeded: ${item.address.toString()}`);
        for(var num = 0; num < this.filesCount; num++) {
          await this.cb(item.address, num, true);
        }
      }
      else {
        for(var num = 0; num < this.filesCount; num++) {
          await this.store.eraseUnverified(item.address, num);
          if (!this.cancelled) {
            await this.cb(item.address, num, false);
          }
        }
      }
    }
  }

  public cancel() {
    this.cancelled = true;
    this.queue.cancel();
    if (this.proc) {
      this.proc.kill();
    }
  }

  private async verifyTranscript(address: Address) {
    console.log('verifyTranscript path:', this.store.getUnverifiedBasePath(address) + '/');
    const args = [
      '--input',
      this.store.getUnverifiedBasePath(address) + '/'
    ];

    if (this.lastCompleteAddress) {
      args.push('--previous');
      args.push(this.store.getVerifiedBasePath(this.lastCompleteAddress) + '/');
    }

    console.log(`Verifiying transcript ${address.toString()}...`);
    return new Promise<boolean>(resolve => {
      const binPath = '../algorithm/target/release/verify';
      const verify = spawn(binPath, args);
      this.proc = verify;

      verify.stdout.on('data', data => {
        console.log(data.toString());
        const params = data
          .toString()
          .replace('\n', ' ')
          .split(' ');
        const cmd = params.shift()!;
        switch (cmd) {
          case 'progress': {
            this.progresscb(address, +params[0]);
            break;
          }
        }
      });

      verify.stderr.on('data', data => {
        console.log(data.toString());
      });

      verify.on('close', code => {
        this.proc = undefined;
        resolve(code === 0);
      });
    });
  }
}
