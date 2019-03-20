pragma solidity ^0.4.22;
contract Market {
    //specifies the structure of the contractor carrying out task
    struct Contractor {
      address contractAdd;
      address contractor;
      bool status;
      bool exists;
    }

    //publishedContracts are unawarded contracts
    mapping(address=>address) public publishedContracts;
    //awardedContracts store the contracts underway
    mapping(address=>Contractor) public awardedContracts;
    //Dead contracts are unauctioned or complete
    mapping(address=>Contractor) public deadContracts;
    address public marketPublisher;
    address[] public badPayer;
    //Logs when an auctioneer refuses to pay
    event didNotPay(address bidder);

    function Market() public {
        marketPublisher = msg.sender;
    }
    //Deploy a new job contract
    function addContract(uint _x, uint _y, uint _z, uint _liveFor) public {     //Add a contract to the market for auction
        address newContract = new Contract(_x, _y, _z, msg.sender,_liveFor,this);
        publishedContracts[msg.sender] = newContract;
    }
    //Retreive contract address by specifying who published it
    function getContractAddress(address _contractOwner) view public returns (address){
      return publishedContracts[_contractOwner];
    }
    //Award the contract to lowest bidder
    function awardContract(address _to, address _contract, address _owner) public {
      require(publishedContracts[_owner]!=0);

      Contractor memory c = Contractor({
        contractAdd: _contract,
        contractor: _to,
        status: false,
        exists: true
      });

      awardedContracts[_contract]=c;
      delete(publishedContracts[_owner]);
    }

//Vunerable to being called without contractor being paid
    function contractComplete(address _contract) public {
      // require(awardedContracts[_contract].exists == true);
      // require(awardedContracts[_contract].status == false);
      // awardedContracts[_contract].exists = false;
      // awardedContracts[_contract].status = true;
      deadContracts[_contract] = awardedContracts[_contract];
      delete(awardedContracts[_contract]);
    }
//Auctioneers who refuse or don't apy can be reported
    function reportNoPayment(address _owner) public {
        require(awardedContracts[_owner].status != true);
        badPayer.push(_owner);
        emit didNotPay(_owner);
    }
}


contract Contract {
//Define what a job Contract looks like here
    struct contractStructure {
        uint x;
        uint y;
        uint z;
    }

    uint public lowestBid;
    address public lowestBidder;
    mapping(address=>uint) submittedBids;

    uint public startTime;
    uint public liveFor; //Specifies the minimum time the contract will be auctioned for
    uint public endTime;
    bool public ended;

    address public Owner;
    address public contractAdd;
    address public marketAdd;
    Market public market;
    mapping (address => contractStructure) private contracts;

    event newLowestBid(address bidder, uint amount);
    event contractAwarded(address winner, uint amount);

    function Contract(uint _x, uint _y, uint _z, address _owner, uint _liveFor, address _marketAdd) public {
        Owner = _owner;
        marketAdd = _marketAdd;
        contractAdd = this;
        var liveContract = contracts[Owner];
        liveContract.x = _x;
        liveContract.y = _y;
        liveContract.z = _z;
        startTime = now;
        liveFor = _liveFor;
        endTime = startTime + liveFor;
        market = Market(marketAdd);
    }

//return details of contrat structure
    function getContract() view public returns (uint, uint, uint){
        return (contracts[Owner].x, contracts[Owner].y, contracts[Owner].z);
    }
//return the address this contract is stored at
    function getContractAddress() view public returns(address){
      return this;
    }
//allow participants to submit a bid to win the contract
    function submitBid(uint v) public {
        //make sure bid beats current lowest
        if(lowestBid > 0) { require(v < lowestBid); }
        //make sure bid is greater than 0
        require(v > 0);
        //make sure owner doesn't bid on own contract
        require(msg.sender != Owner, "Owner cannot bid on contract");
        require(!ended, "Contract already awarded....");
        submittedBids[msg.sender] = v;
        lowestBid = v;
        lowestBidder = msg.sender;
        emit newLowestBid(lowestBidder, lowestBid);

    }
//Close the auction
    function auctionEnd() public {
        require(msg.sender == Owner);
        require(!ended, "Contract already awarded....");
        require(endTime <= now);
        ended = true;
        emit contractAwarded(lowestBidder,lowestBid);
        market.awardContract(lowestBidder,contractAdd,Owner);
    }
//Allow the auctioneer to pay the contractor
    function payBidder() payable public {
        require(msg.sender == Owner);
        if(msg.value != lowestBid) revert();
        market.contractComplete(contractAdd);
        selfdestruct(lowestBidder);
    }

}
