import { HttpClient } from 'setup-mpc-common';
import { Account } from '@fksyuan/web3x/account';
import { hexToBuffer } from '@fksyuan/web3x/utils';
import { Address } from '@fksyuan/web3x/address';

async function main() {
    const API_URL = 'http://127.0.0.1:8080/api';
    const PRIVATE_KEY = '0xa3078b3cb624bdf9c213f029ae87f2d8b0e02f6a3da046cdfd1d7db282cf4bd2';

  if (!PRIVATE_KEY && !process.stdout.isTTY) {
    throw new Error('If spectating (no private key) you must run in interactive mode.');
  }

  const myAccount = PRIVATE_KEY ? Account.fromPrivate(hexToBuffer(PRIVATE_KEY)) : undefined;
  const server = new HttpClient(API_URL, myAccount);
  await server.addParticipant(Address.fromString("atp10fy6qc99mfzkvwzc4wqn63hvttgahs66cgrwe3"),2);
  await server.addParticipant(Address.fromString("atp1wxadw8yzr6qxdw5yl3f2surp6ue6f03ekgqqlh"),2);
}

main().catch(err => console.log(err.message));
