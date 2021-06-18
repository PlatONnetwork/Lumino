import { HttpClient } from 'setup-mpc-common';
import { Account } from '@alayanetwork/web3x/account';
import { hexToBuffer } from '@alayanetwork/web3x/utils';
import { Address } from '@alayanetwork/web3x/address';

async function main() {
  const {
    LUMINO_API_URL = 'http://127.0.0.1:8080/api',
    LUMINO_PRIVATE_KEY = '',
    LUMINO_TIER = 2,
  } = process.env;

  if (!LUMINO_PRIVATE_KEY && !process.stdout.isTTY) {
    throw new Error('If spectating (no private key) you must run in interactive mode.');
  }

  const myAccount = LUMINO_PRIVATE_KEY ? Account.fromPrivate(hexToBuffer(LUMINO_PRIVATE_KEY)) : undefined;
  const server = new HttpClient(LUMINO_API_URL, myAccount);

  const fs = require('fs');
  const readline = require('readline');
  const fileStream = fs.createReadStream('accounts.txt');
  const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
  });
  for await (const line of rl) {
    await server.addParticipant(Address.fromString(line), +LUMINO_TIER);
  }

  //await server.addParticipant(Address.fromString("atp10fy6qc99mfzkvwzc4wqn63hvttgahs66cgrwe3"),2);
  //await server.addParticipant(Address.fromString("atp1wxadw8yzr6qxdw5yl3f2surp6ue6f03ekgqqlh"),2);
}

main().catch(err => console.log(err.message));
