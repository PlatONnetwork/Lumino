import { existsSync, mkdirSync, readFileSync } from 'fs';
import { MpcState, mpcStateFromJSON } from 'setup-mpc-common';
import { existsAsync, renameAsync, writeFileAsync } from './fs-async';

export interface StateStore {
  setState(state: MpcState): Promise<void>;
  getState(): Promise<MpcState>;
  saveState(): Promise<void>;
  restoreState(name: string): Promise<MpcState>;
  exists(name: string): Promise<boolean>;
}

export class MemoryStateStore implements StateStore {
  private state!: MpcState;

  public async setState(state: MpcState) {
    this.state = state;
  }

  public async getState(): Promise<MpcState> {
    return this.state;
  }

  public async saveState() {}

  public async restoreState(name: string): Promise<MpcState> {
    return this.state;
  }

  public async exists(name: string) {
    return false;
  }
}

export class DiskStateStore implements StateStore {
  private state: MpcState;
  private storeFile: string;

  constructor(private storePath: string, defaultState: MpcState) {
    this.storeFile = `${storePath}/state.json`;
    mkdirSync(storePath, { recursive: true });

    if (existsSync(this.storeFile)) {
      const buffer = readFileSync(this.storeFile);
      // In the event that new state is added, we merge in the defaults.
      this.state = {
        ...defaultState,
        ...this.migrate(mpcStateFromJSON(JSON.parse(buffer.toString()))),
      };

      this.state.startSequence = this.state.sequence;
    } else {
      this.state = defaultState;
    }
  }

  public async setState(state: MpcState) {
    try {
      this.state = state;
      // Atomic file update.
      await writeFileAsync(`${this.storeFile}.new`, JSON.stringify(this.state));
      await renameAsync(`${this.storeFile}.new`, this.storeFile);
    } catch (err) {
      console.log(err);
    }
  }

  public async getState(): Promise<MpcState> {
    return this.state;
  }

  public async saveState() {
    const id = this.state.name || this.state.startTime.format('YYYYMMDDHHmmss');
    await writeFileAsync(this.getStatePath(id), JSON.stringify(this.state));
  }

  public async restoreState(name: string): Promise<MpcState> {
    const buffer = readFileSync(this.getStatePath(name));
    this.state = mpcStateFromJSON(JSON.parse(buffer.toString()));
    this.state.startSequence = this.state.sequence;
    return this.state;
  }

  public async exists(name: string) {
    return await existsAsync(this.getStatePath(name));
  }

  private getStatePath = (id: string) =>
    `${this.storePath}/state_${id
      .replace(/[^A-Za-z0-9_ ]/g, '')
      .replace(/ +/g, '_')
      .toLowerCase()}.json`;

  private migrate(state: any) {
    // 001 - Discarded transcript complete flag in favour of state.
    for (const p of state.participants) {
      for (const t of p.transcripts) {
        if (t.complete !== undefined) {
          t.state = t.complete ? 'COMPLETE' : 'WAITING';
          t.complete = undefined;
        }
      }
    }

    return state;
  }
}
