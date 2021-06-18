import moment = require('moment');
import { MpcState } from 'setup-mpc-common';

export function defaultState(latestBlock: number, network: any): MpcState {
  return {
    name: 'Lumino',
    sequence: 0,
    statusSequence: 0,
    startSequence: 0,
    ceremonyState: 'PRESELECTION',
    paused: false,
    startTime: moment().add(20, 'seconds'),
    endTime: moment().add(1440, 'hour'),
    network: network,
    latestBlock,
    selectBlock: latestBlock + 81338,
    maxTier2: 1000,
    minParticipants: 10,
    filesCount: 17,
    invalidateAfter: 54000,
    participants: [],
  };
}
