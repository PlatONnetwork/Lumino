import { EventEmitter } from 'events';
import { EthNet } from 'setup-mpc-common';
import { Address } from '@fksyuan/web3x/address';
import { Eth } from '@fksyuan/web3x/eth';
import { HttpProvider } from '@fksyuan/web3x/providers';
import { getNetwork } from "./network";

export class ParticipantSelectorFactory {
  constructor(private signupAddress: Address) {}

  public create(ethNet: EthNet, startBlock: number, selectBlock: number) {
    return new ParticipantSelector(ethNet, this.signupAddress, startBlock, selectBlock);
  }

  public async getCurrentBlockHeight(ethNet: any) {
    const network = getNetwork(ethNet);
    const provider = new HttpProvider(network.host);
    const eth = new Eth(provider);
    return await eth.getBlockNumber();
  }
}

export class ParticipantSelector extends EventEmitter {
  private provider: HttpProvider;
  private eth: Eth;
  private cancelled = false;

  constructor(
    ethNet: EthNet,
    private signupAddress: Address,
    private startBlock: number,
    private selectBlock: number,
  ) {
    super();

    //console.log(`ParticipantSelector constructor ethNet is ${ethNet}`);
    const network = getNetwork(ethNet);
    this.provider = new HttpProvider(network.host);
    this.eth = new Eth(this.provider);
  }

  public async run() {
    console.log('Block processor starting...');
    let currentBlock = this.startBlock;
    while (!this.cancelled) {
      try {
        const block = await this.eth.getBlock(currentBlock, true);
        //console.log('block=', block);
        // const participants = block.transactions
        //   .filter(t => (t.to ? t.to.equals(this.signupAddress) : false))
        //   .map(t => t.from);
        // this.emit('newParticipants', participants, currentBlock);
        //console.log(`currentBlock=${currentBlock}, selectBlock=${this.selectBlock}`);
        if (currentBlock === this.selectBlock) {
          this.emit('selectParticipants', block.hash);
        }
        currentBlock += 1;
      } catch (err) {
        //console.log('err=',err);
        await new Promise<void>(resolve => setTimeout(resolve, 10000));
      }
    }
    console.log('Block processor complete.');
  }

  public stop() {
    this.cancelled = true;
    this.removeAllListeners();
  }
}
