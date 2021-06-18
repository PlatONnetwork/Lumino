import humanizeDuration from 'humanize-duration';
import moment, { Moment } from 'moment';
import { cloneMpcState, MpcState, Participant } from 'setup-mpc-common';
import { Account } from '@alayanetwork/web3x/account';
import { Address } from '@alayanetwork/web3x/address';
import { leftPad } from '@alayanetwork/web3x/utils';
import { TerminalKit } from './terminal-kit';

export class TerminalInterface {
  private banner = false;
  private bannerY!: number;
  private listY!: number;
  private offset = 0;
  private state?: MpcState;
  public lastUpdate?: Moment;
  public error?: string;

  constructor(private term: TerminalKit, private myAccount?: Account) {}

  private render() {
    this.term.clear();
    this.term.hideCursor();
    this.term.cyan('Latticex Trustless Setup Multi Party Computation\n\n');
    this.renderStatus();
    this.renderList();
  }

  public resize(width: number, height: number) {
    this.term.width = width;
    this.term.height = height;
    this.render();
  }

  public hideCursor(hide: boolean = true) {
    this.term.hideCursor(hide);
  }

  private renderStatus() {
    this.term.moveTo(0, 2);
    this.term.eraseLine();

    if (!this.state) {
      this.term.white(this.error || 'Awaiting update from server...');
      return;
    }

    const { startTime, completedAt } = this.state;

    const { ceremonyState } = this.state;
    switch (ceremonyState) {
      case 'PRESELECTION':
      case 'SELECTED': {
        const startedStr = `${startTime.utc().format('MMM Do YYYY HH:mm:ss')} UTC`;
        this.term.white(
          `The ceremony will begin at ${startedStr} in T-${Math.max(startTime.diff(moment(), 's'), 0)}s.\n\n`
        );
        break;
      }
      case 'RUNNING':
        this.term.white(
          `The ceremony is in progress and started at ${startTime.utc().format('MMM Do YYYY HH:mm:ss')} UTC.\n\n`
        );
        break;
      case 'COMPLETE': {
        const completedStr = `${completedAt!.utc().format('MMM Do YYYY HH:mm:ss')} UTC`;
        const duration = completedAt!.diff(startTime);
        const durationText = humanizeDuration(duration, { largest: 2, round: true });
        this.term.white(`The ceremony was completed at ${completedStr} taking ${durationText}.\n\n`);
        break;
      }
    }

    this.bannerY = this.term.getCursorLocation().y;
    this.renderBanner(true);

    this.term.nextLine(1);

    const { y } = this.term.getCursorLocation();
    this.listY = y;
  }

  private renderBanner(force: boolean = false) {
    const banner = this.myAccount && new Date().getTime() % 20000 < 10000;

    if (banner && (!this.banner || force)) {
      this.term.moveTo(0, this.bannerY);
      this.term.eraseLine();
      this.banner = true;
      this.renderYourStatus();
    } else if (!banner && (this.banner || force)) {
      const { participants } = this.state!;
      this.term.moveTo(0, this.bannerY);
      this.term.eraseLine();
      this.banner = false;
      const online = participants.reduce((a, p) => a + (p.online ? 1 : 0), 0);
      const offline = participants.length - online;
      this.term.white(`Server status: `);
      if (!this.lastUpdate || this.lastUpdate.isBefore(moment().subtract(10, 's'))) {
        this.term.red('DISCONNECTED');
      } else {
        this.term
          .white(`(participants: ${participants.length}) (online: `)
          .green(`${online}`)
          .white(`) (offline: `)
          .red(`${offline}`)
          .white(`)\n`);
      }
    }
  }

  private renderYourStatus() {
    const { participants, selectBlock, ceremonyState, latestBlock } = this.state!;

    this.term.eraseLine();

    const myIndex = participants.findIndex(p => p.address.equals(this.myAccount!.address));
    if (myIndex === -1) {
      this.term.white(`Private key does not match an address. You are currently spectating.\n`);
    } else {
      const myState = participants[myIndex];
      switch (myState.state) {
        case 'WAITING':
          if (ceremonyState === 'PRESELECTION') {
            const selectCountdown = selectBlock - latestBlock;
            this.term.white(
              `Your position in the queue will determined at block number ${selectBlock} (B-${selectCountdown}).\n`
            );
          } else if (ceremonyState !== 'RUNNING' && ceremonyState !== 'SELECTED') {
            this.term.white('Participants are no longer being selected.\n');
          } else {
            const first = participants.find(p => p.state === 'WAITING')!;
            const inFront = myState.position - first.position;
            this.term.white(
              `You are in position ${myState.position} (${inFront ? inFront + ' in front' : 'next in line'}).\n`
            );
          }
          break;
        case 'RUNNING':
          if (myState.runningState === 'OFFLINE') {
            this.term.white(`It's your turn. You have opted to perform the computation externally.\n`);
          } else {
            this.term.white(`You are currently processing your part of the ceremony...\n`);
          }
          break;
        case 'COMPLETE':
          this.term.white(
            `Your part is complete and you can close the program at any time. Thank you for participating.\n`
          );
          break;
        case 'INVALIDATED':
          this.term.white(`You failed to compute your part of the ceremony.\n`);
          break;
      }
    }
  }

  private async renderList() {
    if (!this.state) {
      return;
    }

    const { participants } = this.state;
    const linesLeft = this.term.height - this.listY;
    this.offset = this.getRenderOffset(linesLeft);

    const toRender = participants.slice(this.offset, this.offset + linesLeft);

    toRender.forEach((p, i) => {
      this.renderLine(p, i);
      this.term.nextLine(1);
    });

    if (toRender.length < linesLeft) {
      this.term.eraseDisplayBelow();
    }
  }

  private getRenderOffset(linesForList: number) {
    const { participants } = this.state!;
    // Find first RUNNING or WAITING.
    let selectedIndex = participants.findIndex(p => p.state !== 'COMPLETE' && p.state !== 'INVALIDATED');
    if (selectedIndex < 0) {
      // None found, pick last in list.
      selectedIndex = this.state!.participants.length - 1;
    }
    const midLine = Math.floor(linesForList / 2);
    return Math.min(Math.max(0, selectedIndex - midLine), Math.max(0, this.state!.participants.length - linesForList));
  }

  private renderLine(p: Participant, i: number) {
    if (i < 0 || this.listY + i >= this.term.height) {
      return;
    }
    this.term.moveTo(0, this.listY + i);
    this.term.eraseLine();
    if (p.online) {
      this.term.green('\u25CF ');
    } else {
      this.term.red('\u25CF ');
    }
    this.term.white(`${leftPad(p.position.toString(), 2)}. `);
    switch (p.state) {
      case 'WAITING':
        this.term.grey(`${p.address.toString()}`);
        if (this.state!.ceremonyState !== 'PRESELECTION') {
          this.term.grey(` (${p.priority})`);
        }
        break;
      case 'RUNNING':
        this.renderRunningLine(p);
        break;
      case 'COMPLETE':
        this.term.green(p.address.toString());
        this.term.grey(` (${p.priority}) (${p.completedAt!.diff(p.startedAt!, 's')}s)`);
        break;
      case 'INVALIDATED':
        this.term.red(p.address.toString());
        if (p.error) {
          this.term.grey(` (${p.priority}) (${p.error})`);
        }
        break;
    }

    if (this.myAccount && p.address.equals(this.myAccount.address)) {
      this.term.white(' (you)');
    }
  }

  private renderRunningLine(p: Participant) {
    const { term } = this;
    const addrString = p.address.toString();
    const progIndex = addrString.length * ((p.runningState === 'OFFLINE' ? p.verifyProgress : p.computeProgress) / 100);
    term.yellow(addrString.slice(0, progIndex)).grey(addrString.slice(progIndex));
    term.grey(` (${p.priority})`);

    if (p.fast) {
      term.magentaBright(' <');
    } else {
      term.red(' <');
    }
    if (p.lastUpdate || p.runningState === 'OFFLINE') {
      switch (p.runningState) {
        case 'OFFLINE':
          term
            .white(' (')
            .blue('computing offline')
            .white(') (')
            .blue('\u2714')
            .white(` ${p.verifyProgress.toFixed(p.verifyProgress < 100 ? 2 : 0)}%`)
            .white(`)`);
          break;
        case 'RUNNING':
        case 'COMPLETE': {
          const totalData = p.transcripts.reduce((a, t) => a + t.size, 0);
          //console.log('totalData=', totalData);
          const totalDownloaded = p.transcripts.reduce((a, t) => a + t.downloaded, 0);
          //console.log('totalDownloaded=', totalDownloaded);
          const totalUploaded = p.transcripts.reduce((a, t) => a + t.uploaded, 0);
          //console.log('totalUploaded=', totalUploaded);
          const downloadProgress = totalData ? (totalDownloaded / totalData) * 100 : 0;
          const uploadProgress = totalData ? (totalUploaded / totalData) * 100 : 0;
          const computeProgress = p.computeProgress;
          const verifyProgress = p.verifyProgress;
          term
            .white(` (`)
            .blue('\u2b07\ufe0e')
            .white(` ${downloadProgress.toFixed(downloadProgress < 100 ? 2 : 0)}%`)
            .white(`)`);
          term
            .white(` (`)
            .blue('\u2699\ufe0e')
            .white(` ${computeProgress.toFixed(computeProgress < 100 ? 2 : 0)}%`)
            .white(`)`);
          term
            .white(` (`)
            .blue('\u2b06\ufe0e')
            .white(` ${uploadProgress.toFixed(uploadProgress < 100 ? 2 : 0)}%`)
            .white(`)`);
          term
            .white(` (`)
            .blue('\u2714\ufe0e')
            .white(` ${verifyProgress.toFixed(verifyProgress < 100 ? 2 : 0)}%`)
            .white(`)`);
          break;
        }
      }
    }

    const { invalidateAfter } = this.state!;
    const completeWithin = p.invalidateAfter || invalidateAfter;
    const timeout = Math.max(
      0,
      moment(p.startedAt!)
        .add(completeWithin, 's')
        .diff(moment(), 's')
    );

    term.white(` (`).blue('\u25b6\ufe0e\u25b6\ufe0e ');

    term.white(`${timeout}s)`);
  }

  public async updateState(state?: MpcState) {
    const oldState = this.state;
    this.state = state ? cloneMpcState(state) : undefined;

    if (!oldState || !this.state || oldState.startSequence !== this.state.startSequence) {
      // If first time or reset render everything.
      this.render();
      return;
    }

    if (
      this.state.ceremonyState === 'PRESELECTION' ||
      this.state.ceremonyState === 'SELECTED' ||
      this.state.statusSequence !== oldState.statusSequence
    ) {
      // If the ceremony hasn't started, update the status line for the countdown.
      await this.renderStatus();
    } else {
      await this.renderBanner();
    }

    const linesLeft = this.term.height - this.listY;
    const offset = this.getRenderOffset(linesLeft);
    this.state.participants.forEach((p, i) => {
      // Update any new participants, participants that changed, and always the running participant (for the countdown).
      if (
        offset !== this.offset ||
        !oldState.participants[i] ||
        p.sequence !== oldState.participants[i].sequence ||
        p.state === 'RUNNING'
      ) {
        this.renderLine(p, i - offset);
      }
    });
    this.offset = offset;
  }

  public getParticipant(address: Address) {
    return this.state!.participants.find(p => p.address.equals(address))!;
  }
}
