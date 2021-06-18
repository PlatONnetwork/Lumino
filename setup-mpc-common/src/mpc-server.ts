import { Moment } from 'moment';
import { Readable } from 'stream';
import { Address } from '@fksyuan/web3x/address';

export type CeremonyState =
  | 'PRESELECTION'
  | 'SELECTED'
  | 'RUNNING'
  | 'COMPLETE';
export type ParticipantState = 'WAITING' | 'RUNNING' | 'COMPLETE' | 'INVALIDATED';
export type ParticipantRunningState = 'OFFLINE' | 'WAITING' | 'RUNNING' | 'COMPLETE';
export type TranscriptState = 'WAITING' | 'VERIFYING' | 'COMPLETE';

export interface Transcript {
  // Server controlled data.
  state: TranscriptState;
  // Client controlled data.
  num: number;
  fromAddress?: Address;
  size: number;
  downloaded: number;
  uploaded: number;
}

export interface Participant {
  // Server controlled data.
  sequence: number;
  address: Address;
  state: ParticipantState;
  // Position in the queue (can vary due to online/offline changes), or position computation took place (fixed).
  position: number;
  // Priority is randomised at the selection date, after which it is fixed. It's used to determine position.
  priority: number;
  tier: number;
  verifyProgress: number;
  lastVerified?: Moment;
  addedAt: Moment;
  startedAt?: Moment;
  completedAt?: Moment;
  error?: string;
  online: boolean;
  lastUpdate?: Moment;
  location?: ParticipantLocation;
  invalidateAfter?: number;

  // Client controlled data.
  runningState: ParticipantRunningState;
  transcripts: Transcript[]; // Except 'complete'.
  computeProgress: number;
  fast: boolean;
}

export interface ParticipantLocation {
  city?: string;
  country?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
}

export type EthNet = 'platon' | 'alaya' | 'alaya-dev';

export interface MpcState {
  name: string;
  sequence: number;
  startSequence: number;
  statusSequence: number;
  ceremonyState: CeremonyState;
  paused: boolean;
  maxTier2: number;
  minParticipants: number;
  filesCount: number;
  invalidateAfter: number;
  startTime: Moment;
  endTime: Moment;
  network: EthNet;
  latestBlock: number;
  selectBlock: number;
  completedAt?: Moment;
  participants: Participant[];
}

export interface ResetState {
  name: string;
  startTime: Moment;
  endTime: Moment;
  network: EthNet;
  latestBlock: number;
  selectBlock: number;
  maxTier2: number;
  minParticipants: number;
  filesCount: number;
  invalidateAfter: number;
  participants0: Address[];
  participants1: Address[];
  participants2: Address[];
}

export interface PatchState {
  paused: boolean;
  startTime?: Moment;
  endTime?: Moment;
  selectBlock?: number;
  maxTier2?: number;
  minParticipants?: number;
  filesCount?: number;
  invalidateAfter?: number;
}

export interface FileStoreRecord {
  num: number;
  size: number;
  name: string | undefined;
}

export interface MpcServer {
  resetState(resetState: ResetState): Promise<void>;
  loadState(name: string): Promise<void>;
  patchState(state: PatchState): Promise<MpcState>;
  getState(sequence?: number): Promise<MpcState>;
  ping(address: Address, ip?: string): Promise<void>;
  addParticipant(address: Address, tier: number): Promise<void>;
  updateParticipant(participant: Participant, admin?: boolean): Promise<void>;
  downloadData(address: Address, transcriptNumber: number): Promise<Readable>;
  downloadSignature(address: Address, num: number): Promise<string>;
  uploadData(
    address: Address,
    transcriptNumber: number,
    transcriptPath: string,
    signaturePath?: string,
    progressCb?: (transferred: number) => void
  ): Promise<void>;
  flushWaiting(): Promise<void>;
  getFiles(address: Address): Promise<FileStoreRecord[]>;
}
