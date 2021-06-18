import { EvidenceStore } from "./evidence";

describe('evidence', () => {
    // const network = {
    //     host: "http://47.241.91.2:6789",
    //     hrp: "atp",
    //     chainId: 201030,
    // }
    const contractAddress = "atp187perwhnrlhxnvr7n05c3seuqv94st4etykk69";
    const abi = `[{"inputs":[{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"},{"internalType":"bytes","name":"fileSign","type":"bytes"},{"internalType":"bytes","name":"fileEndpoint","type":"bytes"},{"internalType":"uint256","name":"fileNumber","type":"uint256"},{"internalType":"uint256","name":"fileUploadTime","type":"uint256"}],"name":"saveEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bytes","name":"fileHash","type":"bytes"}],"name":"getEvidence","outputs":[{"internalType":"uint256","name":"code","type":"uint256"},{"internalType":"bytes","name":"fHash","type":"bytes"},{"internalType":"bytes","name":"fSign","type":"bytes"},{"internalType":"bytes","name":"fEndpoint","type":"bytes"},{"internalType":"uint256","name":"fNumber","type":"uint256"},{"internalType":"uint256","name":"fUpLoadTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUsers","outputs":[{"internalType":"address[]","name":"users","type":"address[]"}],"stateMutability":"view","type":"function"}]`;
    const evidence = new EvidenceStore("alaya", abi, contractAddress)
    const owner = "atp1838yver6m09g343zflgtnnv5e7e0q5lnaad9n5";
    const fileHash = "hash";
    const fileSign = "sign";
    const fileEndpoint = "endpoint";
    const fileNumber = 0;
    const fileUploadTime = Date.now();

    describe('save evidence', () => {
        it('should return tx hash', async () => {
            const txReceipt = await　 evidence.saveEvidence(owner, fileHash, fileSign, fileEndpoint, fileNumber, fileUploadTime)
            expect(txReceipt.status).toBe(true)
        });
    });

    describe('get evidence', () => {
        it('should return evidence saved', async () => {
            const evidenceRecord = await evidence.getEvidence(owner, fileHash);
            expect(evidenceRecord.fileHash).toBe(fileHash);
            expect(evidenceRecord.fileSign).toBe(fileSign);
            expect(evidenceRecord.fileNumber).toBe(fileNumber);
            expect(evidenceRecord.fileEndpoint).toBe(fileEndpoint);
        });
    });
});
