import {Contract, ContractAbi} from "@fksyuan/web3x/contract";
import {HttpProvider} from "@fksyuan/web3x/providers";
import {Eth} from "@fksyuan/web3x/eth";
import {numberToHex, bufferToHex, hexToBuffer} from "@fksyuan/web3x/utils";
import {Account} from "@fksyuan/web3x/account";
import {toBech32Address} from "@alayanetwork/web3-utils";
import utf8 from "utf8";
import {Network, getNetwork} from "./network";
import { TransactionReceipt } from "@fksyuan/web3x/formatters";

export interface EvidenceRecord {
    fileHash: string;
    fileSign: string;
    fileEndpoint: string;
    fileNumber: number;
    fileUploadTime: number;
    owner: string;
}

export interface Evidence {
    saveEvidence(address: string, fileHash: string, fileSign: string, fileEndpoint: string, fileNumber: number, fileUploadTime: number): Promise<TransactionReceipt>;
    getEvidence(address: string, fileHash: string): Promise<EvidenceRecord>;
}

function stringToBytes(input: string): Uint8Array {
    input = utf8.encode(input);
    let bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        bytes[i] = input.charCodeAt(i);
    }
    return bytes;
}

export class EvidenceStore implements Evidence {
    private contractAddress: string;
    private contractABI: string;
    private network: Network;
    private eth: Eth;
    private contract: Contract;
    private account: Account;

    constructor(private ethNet: string, private abi: string, private contractAddr: string) {
        this.network = getNetwork(ethNet);
        this.contractABI = abi;
        this.contractAddress = contractAddr;
        this.eth = new Eth(new HttpProvider(this.network.host))
        // @ts-ignore
        this.contract = new Contract(this.eth, new ContractAbi(JSON.parse(abi)), contractAddr);
        const { ADMIN_PRIVATE_KEY = '0xa3078b3cb624bdf9c213f029ae87f2d8b0e02f6a3da046cdfd1d7db282cf4bd2' } = process.env
        this.account = Account.fromPrivate(hexToBuffer(ADMIN_PRIVATE_KEY));
    }

    public async waitToGetTxReceipt(txHash: string) :Promise<TransactionReceipt> {
        while (true) {
            const receipt = await this.eth.getTransactionReceipt(txHash);
            if (receipt) {
                return receipt
            } else {
                await new Promise<void>(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    public async saveEvidence(address: string, fileHash: string, fileSign: string, fileEndpoint: string, fileNumber: number, fileUploadTime: number): Promise<TransactionReceipt> {
        const gasPrice = numberToHex(await this.eth.getGasPrice());
        const gas = numberToHex((await this.eth.getBlock("latest")).gasLimit);
        if (fileUploadTime <= 0) {
            fileUploadTime = Date.now();
        }
        const from = toBech32Address(this.network.hrp, bufferToHex(this.account.address.toBuffer()).toString().slice(2));
        const to = this.contractAddress;

        const data = bufferToHex(this.contract.methods["saveEvidence"].apply(this.contract.methods, [address, stringToBytes(fileHash), stringToBytes(fileSign), stringToBytes(fileEndpoint), fileNumber, fileUploadTime]).encodeABI()).toString().slice(2);
        // @ts-ignore
        const nonce = numberToHex(await this.eth.getTransactionCount(from));
        const chainId = this.network.chainId;
        const tx = { from, gasPrice, gas, nonce, chainId, data, to };
        // console.log("tx: ", tx);
        // @ts-ignore
        const signTx = await this.account.signTransaction(tx, this.eth);
        // console.log("signTx: ", signTx);
        let txHash = await this.eth.sendSignedTransaction(signTx.rawTransaction).getTxHash();
        console.log("存证交易Hash: ", txHash);
        const receipt = await this.waitToGetTxReceipt(txHash);
        return receipt;
    }
    public async getEvidence(address: string, hash: string): Promise<EvidenceRecord> {
        const from = toBech32Address(this.network.hrp, bufferToHex(this.account.address.toBuffer()).toString().slice(2));
        // 查看代币名称
        const getMethod = this.contract.methods["getEvidence"].apply(this.contract.methods, [address, stringToBytes(hash)]);
        // @ts-ignore
        const res = await getMethod.call({from}, "latest");
        return {
            fileHash: hexToBuffer(res.fHash).toString(),
            fileSign: hexToBuffer(res.fSign).toString(),
            fileEndpoint: hexToBuffer(res.fEndpoint).toString(),
            fileNumber: parseInt(res.fNumber),
            fileUploadTime: parseInt(res.fUpLoadTime),
            owner: address,
        };
    }
}
