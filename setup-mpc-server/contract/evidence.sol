pragma solidity ^0.6.12;
contract Evidence{
    uint CODE_SUCCESS = 0;
    uint NO_PERMISSION = 403;
    uint FILE_NOT_EXIST = 3002;
    uint FILE_ALREADY_EXIST  = 3003;
    uint USER_NOT_EXIST = 3004;

    struct FileEvidence{
        bytes fileHash;
        bytes fileSign;
        bytes fileEndpoint;
        uint fileNumber;
        uint fileUploadTime;
        address owner;
    }
    struct User{
        address addr;
        uint count;
        mapping(bytes => FileEvidence) filemap;
    }

    mapping(address => User) userMap;

    address[] userList;
    address public admin;
    address public owner;

    event NewAdmin(address indexed newAdmin);
    event NewOwner(address indexed newOwner);

    constructor(address admin_) public {
        require(admin_ != address(uint160(0)));
        admin = admin_;
        owner = msg.sender;
    }

    function kill() public {
        require(msg.sender == owner);
        selfdestruct(address(uint160(owner)));
    }

    function setOwner(address addr) public {
        require(msg.sender == owner);
        require(addr != address(uint160(0)));
        owner = addr;
        emit NewOwner(owner);
    }

    function setAdmin(address addr) public {
        require(msg.sender == owner);
        require(addr != address(uint160(0)));
        admin = addr;
        emit NewAdmin(admin);
    }

    function saveEvidence(address owner, bytes memory fileHash, bytes memory fileSign, bytes memory fileEndpoint, uint fileNumber, uint fileUploadTime) public returns(uint code) {
        require(msg.sender == admin);
        require(owner != address(uint160(0)));
        //get filemap under sender
        User storage user = userMap[owner];

        if (user.addr == address(uint160(0))) {
            user.addr = owner;
            userList.push(owner);
        }
        FileEvidence storage fileEvidence = user.filemap[fileHash];
        if(fileEvidence.fileHash.length != 0){
            return FILE_ALREADY_EXIST;
        }
        user.count += 1;
        fileEvidence.fileHash = fileHash;
        fileEvidence.fileSign = fileSign;
        fileEvidence.fileEndpoint = fileEndpoint;
        fileEvidence.fileNumber = fileNumber;
        fileEvidence.fileUploadTime = fileUploadTime;
        fileEvidence.owner = owner;
        user.filemap[fileHash] = fileEvidence;
        return CODE_SUCCESS;
    }

    function getEvidence(address owner, bytes memory fileHash) public view returns(uint code,bytes memory fHash,bytes memory fSign,bytes memory fEndpoint,uint fNumber, uint fUpLoadTime){
        //get filemap under sender
        User storage user = userMap[owner];
        if (user.addr == address(uint160(0))) {
            return (USER_NOT_EXIST,"","","",0,0);
        }
        FileEvidence memory fileEvidence = user.filemap[fileHash];
        if(fileEvidence.fileHash.length == 0){
            return (FILE_NOT_EXIST,"","","",0,0);
        }

        return (CODE_SUCCESS,fileEvidence.fileHash,fileEvidence.fileSign,fileEvidence.fileEndpoint,fileEvidence.fileNumber, fileEvidence.fileUploadTime);
    }

    function getUsers() public view returns(address[] memory users){
        return userList;
    }
}
