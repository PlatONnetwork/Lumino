// import yargs from 'yargs';
import { EvidenceStore } from "./evidence";
import { toBech32Address } from "@alayanetwork/web3-utils";
import { bufferToHex } from "@alayanetwork/web3x/utils";
import { getNetwork } from "./network";

// const contractAddress = "atp1n5nxkznvst0f2xhqjxzxcr0z64m87hl6s5qtj6";
const abi = `[{"inputs":[{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newAdmin","type":"address"}],"name":"NewAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"NewOwner","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"kill","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"},{"internalType":"bytes","name":"fileSign","type":"bytes"},{"internalType":"bytes","name":"fileEndpoint","type":"bytes"},{"internalType":"uint256","name":"fileNumber","type":"uint256"},{"internalType":"uint256","name":"fileUploadTime","type":"uint256"}],"name":"saveEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"}],"name":"getEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"},{"internalType":"bytes","name":"fHash","type":"bytes"},{"internalType":"bytes","name":"fSign","type":"bytes"},{"internalType":"bytes","name":"fEndpoint","type":"bytes"},{"internalType":"uint256","name":"fNumber","type":"uint256"},{"internalType":"uint256","name":"fUpLoadTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUsers","outputs":[{"internalType":"address[]","name":"users","type":"address[]"}],"stateMutability":"view","type":"function"}]`;
const ethNet = 'alaya'

const setOwner = async (contractAddr: string, addr: string) => {
    const evidence = new EvidenceStore(ethNet, abi, contractAddr)
    const txReceipt = await evidence.setOwner(addr);
    console.log(txReceipt);
    return txReceipt
}

const getOwner = async (contractAddr: string) => {
    const evidence = new EvidenceStore(ethNet, abi, contractAddr)
    const owner = await evidence.getOwner();
    const network = getNetwork(ethNet);
    console.log("owner: ", toBech32Address(network.hrp, bufferToHex(owner.toBuffer()).toString().slice(2)));
    return owner
}

const setAdmin = async (contractAddr: string, addr: string) => {
    const evidence = new EvidenceStore(ethNet, abi, contractAddr)
    const txReceipt = await evidence.setAdmin(addr);
    console.log(txReceipt);
    return txReceipt
}

const getAdmin = async (contractAddr: string) => {
    const evidence = new EvidenceStore(ethNet, abi, contractAddr)
    const admin = await evidence.getAdmin();
    const network = getNetwork(ethNet);
    console.log("admin: ", toBech32Address(network.hrp, bufferToHex(admin.toBuffer()).toString().slice(2)));
    return admin
}

const kill = async (contractAddr: string) => {
    const evidence = new EvidenceStore(ethNet, abi, contractAddr)
    const txReceipt = await evidence.kill();
    console.log("txReceipt: ", txReceipt);
    return txReceipt
}

require('yargs/yargs')(process.argv.slice(2))
    .command({
        command: 'setOwner',
        description: 'Set evidence contract owner',
        // @ts-ignore
        builder: (yargs) => {
            return yargs
                .option('address', {
                    describe: "Set evidence contract owner to this address",
                    alias: 'addr',
                    string: true,
                    required: true
                })
                .option('contractAddress', {
                    describe: "Assign evidence contract address",
                    alias: 'caddr',
                    string: true,
                    required: true
                })
                .argv
        },
        handler: (argv: any) => {
            setOwner(argv.contractAddress, argv.address);
        }
    })
    .command({
        command: 'setAdmin',
        description: 'Set evidence contract admin',
        // @ts-ignore
        builder: (yargs) => {
            return yargs
                .option('address', {
                    describe: "Set evidence contract admin to address",
                    alias: 'addr',
                    string: true,
                    required: true
                })
                .option('contractAddress', {
                    describe: "Assign evidence contract address",
                    alias: 'caddr',
                    string: true,
                    required: true
                })
                .argv
        },
        handler: (argv: any) => {
            setAdmin(argv.contractAddress, argv.address);
        }
    })
    .command({
        command: 'getOwner',
        description: 'Get evidence contract owner address',
        // @ts-ignore
        builder: (yargs) => {
            return yargs
                .option('contractAddress', {
                    describe: "Assign evidence contract address",
                    alias: 'caddr',
                    string: true,
                    required: true
                })
                .argv
        },
        handler: (argv: any) => {
            getOwner(argv.contractAddress);
        }
    })
    .command({
        command: 'getAdmin',
        description: 'Get evidence contract admin address',
        // @ts-ignore
        builder: (yargs) => {
            return yargs
                .option('contractAddress', {
                    describe: "Assign evidence contract address",
                    alias: 'caddr',
                    string: true,
                    required: true
                })
                .argv
        },
        handler: (argv: any) => {
            getAdmin(argv.contractAddress);
        }
    })
    .command({
        command: 'kill',
        description: 'Kill evidence contract',
        // @ts-ignore
        builder: (yargs) => {
            return yargs
                .option('contractAddress', {
                    describe: "Assign evidence contract address",
                    alias: 'caddr',
                    string: true,
                    required: true
                })
                .argv
        },
        handler: (argv: any) => {
            kill(argv.contractAddress);
        }
    })
    .demandCommand()
    .help()
    .wrap(72)
    .argv
