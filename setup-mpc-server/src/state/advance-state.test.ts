import moment from 'moment';
import { cloneMpcState, MpcState } from 'setup-mpc-common';
import { Wallet } from '@fksyuan/web3x/wallet';
import { TranscriptStore } from '../transcript-store';
import { Verifier } from '../verifier';
import { advanceState } from './advance-state';
import { createParticipant } from './create-participant';
import { defaultState } from './default-state';

type Mockify<T> = { [P in keyof T]: jest.Mock<any> };

describe('advance state', () => {
  const wallet = Wallet.fromMnemonic('alarm disagree index ridge tone outdoor betray pole forum source okay joy', 10);
  const addresses = wallet.currentAddresses();
  const baseTime = moment('2019-01-01');
  let state!: MpcState;
  const mockTranscriptStore: Mockify<Partial<TranscriptStore>> = {};
  const mockVerifier: Mockify<Partial<Verifier>> = {};

  beforeEach(() => {
    state = defaultState(1234);
    state.startTime = moment(baseTime).add(5, 's');
    state.endTime = moment(baseTime).add(60, 's');
    state.filesCount = 17;
    state.participants = addresses.map((a, i) => createParticipant(0, moment(baseTime), i + 1, 1, a));
    mockTranscriptStore.eraseAll = jest.fn().mockResolvedValue(undefined);
    mockTranscriptStore.getVerified = jest.fn();
  });

  it('should mark participants that have not pinged in 10s offline', async () => {
    state.participants.forEach((p, i) => {
      p.online = true;
      p.lastUpdate = moment(baseTime).add(i, 's');
    });
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(15, 's'));

    // Online participants are at the top of the list.
    expect(state.participants.slice(0, 5).every(p => p.online)).toBe(true);
    expect(state.participants.slice(5).every(p => !p.online)).toBe(true);
    expect(state.sequence).toBe(1);
  });

  it('should not change state if ceremony not started', async () => {
    const preState = cloneMpcState(state);
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, baseTime);
    expect(state).toEqual(preState);
  });

  it('should not change state if ceremony ended', async () => {
    state.completedAt = moment(baseTime.add(30, 's'));
    const preState = cloneMpcState(state);
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(60, 's'));
    expect(state).toEqual(preState);
  });

  it('should not change state if ceremony is pre-selection', async () => {
    const preState = cloneMpcState(state);
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(10, 's'));
    expect(state).toEqual(preState);
  });

  it('should shift ceremony to RUNNING state after selection', async () => {
    state.ceremonyState = 'SELECTED';
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(10, 's'));
    expect(state.ceremonyState).toBe('RUNNING');
    expect(state.sequence).toBe(1);
  });

  it('should shift ceremony to SEALING state when min participants and end time met.', async () => {
    state.ceremonyState = 'RUNNING';
    state.minParticipants = 5;
    state.endTime = moment(baseTime).add(2, 'h');
    state.participants.forEach((p, i) => {
      if (i < 4) {
        p.state = 'COMPLETE';
      }
    });

    // Before end time.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(10, 's'));
    expect(state.ceremonyState).toBe('RUNNING');
    expect(state.sequence).toBe(0);

    // After end time but before min participants.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(3, 'h'));
    expect(state.ceremonyState).toBe('RUNNING');
    expect(state.sequence).toBe(0);

    // After end time and after min participants.
    state.participants[4].state = 'COMPLETE';
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(3, 'h'));
    expect(state.ceremonyState).toBe('SEALING');
    expect(state.sequence).toBe(1);
  });

  it('should not shift ceremony to SEALING state with running participant.', async () => {
    state.ceremonyState = 'RUNNING';
    state.minParticipants = 1;
    state.endTime = moment(baseTime).add(1, 'h');
    state.participants[0].state = 'COMPLETE';
    state.participants[1].state = 'RUNNING';

    // After end time and with min participants, but one is still running.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(2, 'h'));
    expect(state.ceremonyState).toBe('RUNNING');
    expect(state.sequence).toBe(0);

    // After end time and after min participants.
    state.participants[1].state = 'COMPLETE';
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(baseTime).add(2, 'h'));
    expect(state.ceremonyState).toBe('SEALING');
    expect(state.sequence).toBe(1);
  });

  it('should shift first waiting online participant to running state', async () => {
    state.ceremonyState = 'RUNNING';
    state.participants[0].online = true;

    const now = moment(state.startTime).add(10, 's');
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, now);

    expect(mockTranscriptStore.getVerified).not.toHaveBeenCalled();
    expect(state.sequence).toBe(1);
    expect(state.participants[0].state).toBe('RUNNING');
    expect(state.participants[0].startedAt).toEqual(now);
    expect(state.participants[0].transcripts).toEqual([
      {
        num: 0,
        size: 0,
        downloaded: 0,
        uploaded: 0,
        state: 'WAITING',
      },
      {
        num: 1,
        size: 0,
        downloaded: 0,
        uploaded: 0,
        state: 'WAITING',
      },
    ]);
  });

  it('should not shift first waiting participant to running state if not online', async () => {
    state.ceremonyState = 'RUNNING';

    const now = moment(state.startTime).add(10, 's');
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, now);

    expect(state.sequence).toBe(0);
    expect(state.participants.some(p => p.state === 'RUNNING')).toBe(false);
  });

  it('should shift next waiting online participant to running state', async () => {
    mockTranscriptStore.getVerified!.mockResolvedValue([{ num: 0, size: 1000 }, { num: 1, size: 1005 }]);

    state.ceremonyState = 'RUNNING';
    state.participants[0].state = 'COMPLETE';
    state.participants[1].online = true;

    const now = moment(state.startTime).add(10, 's');
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, now);

    expect(mockTranscriptStore.getVerified).toHaveBeenCalledWith(state.participants[0].address);
    expect(state.sequence).toBe(1);
    expect(state.participants[1].state).toBe('RUNNING');
    expect(state.participants[1].startedAt).toEqual(now);
    expect(state.participants[1].transcripts).toEqual([
      {
        fromAddress: state.participants[0].address,
        num: 0,
        size: 1000,
        downloaded: 0,
        uploaded: 0,
        state: 'WAITING',
      },
      {
        fromAddress: state.participants[0].address,
        num: 1,
        size: 1005,
        downloaded: 0,
        uploaded: 0,
        state: 'WAITING',
      },
    ]);
  });

  it('should not shift to next waiting online participant when paused', async () => {
    state.ceremonyState = 'RUNNING';
    state.paused = true;
    state.participants[0].state = 'COMPLETE';
    state.participants[1].online = true;

    const now = moment(state.startTime).add(10, 's');
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, now);

    expect(state.sequence).toBe(0);
    expect(state.participants[1].state).toBe('WAITING');
  });

  it('should invalidate running tier 1 participant after timeout', async () => {
    state.ceremonyState = 'RUNNING';
    state.participants[0].startedAt = state.startTime;
    state.participants[0].state = 'RUNNING';

    // Within time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(180, 's'));
    expect(state.sequence).toBe(0);
    expect(state.participants[0].state).toBe('RUNNING');

    // After time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(181, 's'));
    expect(state.sequence).toBe(1);
    expect(state.participants[0].state).toBe('INVALIDATED');
  });

  it('should invalidate running participant and complete ceremony if after endTime', async () => {
    state.ceremonyState = 'RUNNING';
    state.minParticipants = 1;
    state.participants[0].state = 'COMPLETE';
    state.participants[1].startedAt = state.startTime;
    state.participants[1].state = 'RUNNING';
    state.endTime = moment(state.startTime).add(100, 's');

    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(200, 's'));
    expect(state.participants[1].state).toBe('INVALIDATED');
    expect(state.ceremonyState).toBe('SEALING');
  });

  it('should invalidate using participant timeout as priority over global timeout', async () => {
    state.ceremonyState = 'RUNNING';
    state.participants[0].startedAt = state.startTime;
    state.participants[0].state = 'RUNNING';
    state.participants[0].invalidateAfter = 190;

    // Within time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(190, 's'));
    expect(state.sequence).toBe(0);
    expect(state.participants[0].state).toBe('RUNNING');

    // After time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(191, 's'));
    expect(state.sequence).toBe(1);
    expect(state.participants[0].state).toBe('INVALIDATED');
  });

  it('should invalidate running tier 2 participant after verify timeout', async () => {
    state.ceremonyState = 'RUNNING';
    state.participants[0].startedAt = state.startTime;
    state.participants[0].state = 'RUNNING';
    state.participants[0].tier = 2;

    // Within time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(180, 's'));
    expect(state.sequence).toBe(0);
    expect(state.participants[0].state).toBe('RUNNING');

    // After time limit.
    await advanceState(state, mockTranscriptStore as any, mockVerifier as any, moment(state.startTime).add(181, 's'));
    expect(state.sequence).toBe(1);
    expect(state.participants[0].state).toBe('INVALIDATED');
  });
});
