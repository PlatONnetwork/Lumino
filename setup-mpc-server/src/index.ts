import http from 'http';
import { Address } from '@alayanetwork/web3x/address';
import { appFactory } from './app';
import { mkdirAsync } from './fs-async';
import { ParticipantSelectorFactory } from './participant-selector';
import { Server } from './server';
import { DiskStateStore } from './state-store';
import { defaultState } from './state/default-state';
import { DiskTranscriptStoreFactory } from './transcript-store';
import {EvidenceStore} from "./evidence";
import { EthNet } from 'setup-mpc-common';

const { PORT = 8080, STORE_PATH = './store' } = process.env;

async function main() {
  const shutdown = async () => process.exit(0);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  const {
    ADMIN_ADDRESS = '',
    CONTRACT_ADDRESS = '',
    NETWORK = 'alaya',
  } = process.env;
  const adminAddress = Address.fromString(ADMIN_ADDRESS);
  console.log('ADMIN_ADDRESS =', adminAddress.toString());
  const participantSelectorFactory = new ParticipantSelectorFactory(adminAddress);
  const checkContractAddr = Address.fromString(CONTRACT_ADDRESS);
  console.log('CONTRACT_ADDRESS =', checkContractAddr.toString());
  console.log('NETWORK =', NETWORK);
  const contractAddress = CONTRACT_ADDRESS;
  const abi = `[{"inputs":[{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"},{"internalType":"bytes","name":"fileSign","type":"bytes"},{"internalType":"bytes","name":"fileEndpoint","type":"bytes"},{"internalType":"uint256","name":"fileNumber","type":"uint256"},{"internalType":"uint256","name":"fileUploadTime","type":"uint256"}],"name":"saveEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"}],"name":"getEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"},{"internalType":"bytes","name":"fHash","type":"bytes"},{"internalType":"bytes","name":"fSign","type":"bytes"},{"internalType":"bytes","name":"fEndpoint","type":"bytes"},{"internalType":"uint256","name":"fNumber","type":"uint256"},{"internalType":"uint256","name":"fUpLoadTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUsers","outputs":[{"internalType":"address[]","name":"users","type":"address[]"}],"stateMutability":"view","type":"function"}]`;
  const evidence = new EvidenceStore(NETWORK, abi, contractAddress)
  const latestBlock = await participantSelectorFactory.getCurrentBlockHeight(NETWORK);
  // console.log(`latest block is ${latestBlock}`);
  const defaults = defaultState(latestBlock, NETWORK);
  const stateStore = new DiskStateStore(STORE_PATH + '/state', defaults);
  const transcriptStoreFactory = new DiskTranscriptStoreFactory(STORE_PATH);

  const server = new Server(transcriptStoreFactory, evidence, stateStore, participantSelectorFactory);
  await server.start();

  const tmpPath = STORE_PATH + '/tmp';
  await mkdirAsync(tmpPath, { recursive: true });
  const app = appFactory(server, adminAddress, participantSelectorFactory, '/api', tmpPath);

  const httpServer = http.createServer(app.callback());
  httpServer.listen(PORT);
  console.log(`Server listening on port ${PORT}.`);
}

main().catch(console.log);
