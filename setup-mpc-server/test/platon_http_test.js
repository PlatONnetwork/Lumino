var Eth = require('@alayanetwork/web3x/eth');
var Providers = require('@alayanetwork/web3x/providers')
var Account = require('@alayanetwork/web3x/account');
var utils = require('@alayanetwork/web3x/utils');
var Contract = require('@alayanetwork/web3x/contract');
var ethUtil = require('@alayanetwork/web3-utils');
var Address = require('@alayanetwork/web3x/address');
var Wallet = require('@alayanetwork/web3x/wallet');
let hrp = "atp";
var eth = undefined;
var account = undefined;
// 默认为undefined的不要管，程序会自动获取。
var cfg = {
    provider: "http://47.241.91.2:6789", // 请更新成自己的 http 节点
    chainId: 201030, // 请更新成自己的节点id
    privateKey: "d661fb3f093e897e1a5eaa5f9fede2e8aacfbfc5cf13b900499c6dd034529538", // 请更新成自己的私钥(必须有十六进制前缀0x)
    address: undefined, // 请更新成上面私钥对应的地址
    gas: undefined,
    gasPrice: undefined,
    // 合约信息，用来测试的合约文件在与此文件同级目录文件名为 MyToken.sol
    myToken: {
        bin: "0x60806040526003805460ff191660121790553480156200001e57600080fd5b5060405162000c6538038062000c65833981810160405260608110156200004457600080fd5b8151602083018051604051929492938301929190846401000000008211156200006c57600080fd5b9083019060208201858111156200008257600080fd5b82516401000000008111828201881017156200009d57600080fd5b82525081516020918201929091019080838360005b83811015620000cc578181015183820152602001620000b2565b50505050905090810190601f168015620000fa5780820380516001836020036101000a031916815260200191505b50604052602001805160405193929190846401000000008211156200011e57600080fd5b9083019060208201858111156200013457600080fd5b82516401000000008111828201881017156200014f57600080fd5b82525081516020918201929091019080838360005b838110156200017e57818101518382015260200162000164565b50505050905090810190601f168015620001ac5780820380516001836020036101000a031916815260200191505b50604090815260035460ff16600a0a870260048190553360008181526005602090815293812092909255600180546001600160a01b03191690911790558651620001ff955090935090860191506200021f565b508051620002159060029060208401906200021f565b50505050620002c4565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200026257805160ff191683800117855562000292565b8280016001018555821562000292579182015b828111156200029257825182559160200191906001019062000275565b50620002a0929150620002a4565b5090565b620002c191905b80821115620002a05760008155600101620002ab565b90565b61099180620002d46000396000f3fe608060405234801561001057600080fd5b50600436106101215760003560e01c806370a08231116100ad5780639b96eece116100715780639b96eece14610332578063a9059cbb14610358578063c4e41b2214610384578063dd62ed3e1461038c578063f0141d84146103ba57610121565b806370a08231146102ac57806379cc6790146102d2578063893d20e8146102fe5780638da5cb5b1461032257806395d89b411461032a57610121565b806317d7de7c116100f457806317d7de7c1461022b57806318160ddd1461023357806323b872dd1461023b578063313ce5671461027157806342966c681461028f57610121565b806306fdde0314610126578063095ea7b3146101a35780630af4187d146101e35780631507040114610223575b600080fd5b61012e6103c2565b6040805160208082528351818301528351919283929083019185019080838360005b83811015610168578181015183820152602001610150565b50505050905090810190601f1680156101955780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101cf600480360360408110156101b957600080fd5b506001600160a01b038135169060200135610450565b604080519115158252519081900360200190f35b610211600480360360408110156101f957600080fd5b506001600160a01b038135811691602001351661047d565b60408051918252519081900360200190f35b61012e6104a8565b61012e61053b565b61021161059c565b6101cf6004803603606081101561025157600080fd5b506001600160a01b038135811691602081013590911690604001356105a2565b610279610612565b6040805160ff9092168252519081900360200190f35b6101cf600480360360208110156102a557600080fd5b503561061b565b610211600480360360208110156102c257600080fd5b50356001600160a01b0316610693565b6101cf600480360360408110156102e857600080fd5b506001600160a01b0381351690602001356106a5565b610306610776565b604080516001600160a01b039092168252519081900360200190f35b610306610785565b61012e610794565b6102116004803603602081101561034857600080fd5b50356001600160a01b03166107ec565b6101cf6004803603604081101561036e57600080fd5b506001600160a01b038135169060200135610807565b61021161081b565b610211600480360360408110156103a257600080fd5b506001600160a01b0381358116916020013516610821565b61027961083e565b6000805460408051602060026001851615610100026000190190941693909304601f810184900484028201840190925281815292918301828280156104485780601f1061041d57610100808354040283529160200191610448565b820191906000526020600020905b81548152906001019060200180831161042b57829003601f168201915b505050505081565b3360009081526006602090815260408083206001600160a01b039590951683529390529190912055600190565b6001600160a01b03918216600090815260066020908152604080832093909416825291909152205490565b60028054604080516020601f60001961010060018716150201909416859004938401819004810282018101909252828152606093909290918301828280156105315780601f1061050657610100808354040283529160200191610531565b820191906000526020600020905b81548152906001019060200180831161051457829003601f168201915b5050505050905090565b60008054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156105315780601f1061050657610100808354040283529160200191610531565b60045481565b6001600160a01b03831660009081526006602090815260408083203384529091528120548211156105d257600080fd5b6001600160a01b0384166000908152600660209081526040808320338452909152902080548390039055610607848484610847565b506001949350505050565b60035460ff1681565b3360009081526005602052604081205482111561063757600080fd5b3360008181526005602090815260409182902080548690039055600480548690039055815185815291517fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59281900390910190a2506001919050565b60056020526000908152604090205481565b6001600160a01b0382166000908152600560205260408120548211156106ca57600080fd5b6001600160a01b03831660009081526006602090815260408083203384529091529020548211156106fa57600080fd5b6001600160a01b0383166000818152600560209081526040808320805487900390556006825280832033845282529182902080548690039055600480548690039055815185815291517fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59281900390910190a250600192915050565b6001546001600160a01b031690565b6001546001600160a01b031681565b6002805460408051602060018416156101000260001901909316849004601f810184900484028201840190925281815292918301828280156104485780601f1061041d57610100808354040283529160200191610448565b6001600160a01b031660009081526005602052604090205490565b6000610814338484610847565b9392505050565b60045490565b600660209081526000928352604080842090915290825290205481565b60035460ff1690565b60006001600160a01b03831615158061086857506001600160a01b03831615155b61087157600080fd5b6001600160a01b03841660009081526005602052604090205482111561089657600080fd5b6001600160a01b038316600090815260056020526040902054828101116108bc57600080fd5b6001600160a01b0380841660008181526005602090815260408083208054958a1680855282852080548a81039091559486905281548901909155815188815291519390950194927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a36001600160a01b0380851660009081526005602052604080822054928816825290205401149050939250505056fea265627a7a72315820bb50374f4d720625768b6dad57b973f2eb11f12c86b660456d147e6ebe583f8f64736f6c634300050d0032",
        abiStr: `[{"inputs":[{"internalType":"uint256","name":"initialSupply","type":"uint256"},{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"string","name":"tokenSymbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getName","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getSymbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getDecimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTotalSupply","outputs":[{"internalType":"uint256","name":"theTotalSupply","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"getBalanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"getAllowance","outputs":[{"internalType":"uint256","name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`,
        name: "DAI",
        symbol: "DAI",
        decimals: "18",
        supply: "10000000000000",
        rawTransaction: undefined,
        txReceipt: undefined
    },
    ptSub: undefined,

};

async function main() {
    const provider = new Providers.HttpProvider(cfg.provider);
    eth = new Eth.Eth(provider);
    let gasPrice = utils.numberToHex(await eth.getGasPrice() * 10);
    let gas = utils.numberToHex(parseInt((await eth.getBlock("latest")).gasLimit));
    cfg.gasPrice = gasPrice;
    cfg.gas = gas;
    // hrp = await eth.getAddressHrp();
    // var ethAccounts = new Accounts(web3, hrp);
    account = Account.Account.fromPrivate(cfg.privateKey)
    let wallet = new Wallet.Wallet(0)
    wallet.add(account);
    eth.wallet = wallet;
    cfg.address = utils.bufferToHex(account.address).toString().slice(2);
    console.log("cfg address: ", cfg.address);

    let contract = new Contract.Contract(
        eth,
        new Contract.ContractAbi(JSON.parse(cfg.myToken.abiStr)),
        "atp18snf3xdc6xhkzjt6yzsvqfnllrf0t383tcc9wn",
    );
    let from = ethUtil.toBech32Address(hrp, cfg.address);
    let to = "atp18snf3xdc6xhkzjt6yzsvqfnllrf0t383tcc9wn";

    let toAccount = "atp1838yver6m09g343zflgtnnv5e7e0q5lnaad9n5";
    let transferBalance = "1000";

    let data = utils.bufferToHex(contract.methods["transfer"].apply(contract.methods, [toAccount, transferBalance]).encodeABI()).toString().slice(2);
    console.log('data=', data);
    //let gasPrice = utils.numberToHex(await eth.getGasPrice());
    //let gas = utils.numberToHex(parseInt((await eth.getBlock("latest")).gasLimit / 10));
    let nonce = utils.numberToHex(await eth.getTransactionCount(from));
    let chainId = cfg.chainId;
        // let transferRet = eth.sendTransaction({from, gasPrice, gas, chainId, nonce, to: toAccount, value: 1e18}).getReceipt();
        // console.log("transferRet: ", transferRet);
        // let ret = await contract.methods
        //     .transfer(toAccount, transferBalance)
        //     .send({from, gasPrice, gas, chainId, nonce})
        //     .getReceipt();
        // console.log("ret: ", ret);
    let tx = { from, gasPrice, gas, nonce, chainId, data, to };
    console.log("tx==========: ",tx);
    let signTx = await account.signTransaction(tx, cfg.privateKey);
    console.log("signTx: ", signTx);
    let ret = await eth.sendSignedTransaction(signTx.rawTransaction).getReceipt();
    console.log("ret: ", ret, typeof ret)
    //let receipt = await eth.getTransactionReceipt(ret.toString());
    //console.log("receipt: ", receipt);
    setTimeout(async function() {
        let receipt = await eth.getTransactionReceipt(ret.toString());
        console.log("receipt: ", receipt);
    }, 3000);
}

main().catch(err => console.log(err.message));
