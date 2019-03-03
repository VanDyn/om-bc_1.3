pragma solidity ^0.4.22;
contract Market {

    struct Contractor {
      address contractAdd;
      address contractor;
      bool status;
      bool exists;
    }

    mapping(address=>address) public publishedContracts;
    mapping(address=>Contractor) public awardedContracts;
    mapping(address=>Contractor) public deadContracts;

    address public marketPublisher;

    function Market() public {
        marketPublisher = msg.sender;
    }

    function addContract(uint _x, uint _y, uint _z, uint _liveFor) public {     //Add a contract to the market for auction
        require(publishedContracts[msg.sender]==0);
        address newContract = new Contract(_x, _y, _z, msg.sender,_liveFor,this);
        publishedContracts[msg.sender] = newContract;
    }

    function getContractAddress(address _contractOwner) view public returns (address){
      return publishedContracts[_contractOwner];
    }

    function awardContract(address _to, address _contract, address _owner) payable {
      require(publishedContracts[_owner]!=0);

      Contractor memory c = Contractor({
        contractAdd: _contract,
        contractor: _to,
        status: false,
        exists: true

      });

      awardedContracts[_owner]=c;
      delete(publishedContracts[_owner]);
    }

    function contractComplete() public {
      require(awardedContracts[msg.sender].exists == true);
      require(awardedContracts[msg.sender].status == false);

      awardedContracts[msg.sender].status = true;
      deadContracts[msg.sender] = awardedContracts[msg.sender];
      delete(awardedContracts[msg.sender]);
    }
}


contract Contract {

    struct contractStructure {
        uint x;
        uint y;
        uint z;
    }

    uint public lowestBid;
    address public lowestBidder;
    mapping(address=>uint) submittedBids;

    uint public startTime;
    uint public liveFor;
    uint public endTime;
    bool public ended;

    address public Owner;
    address public contractAdd;
    address public marketAdd;
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
    }


    function getContract() view public returns (uint, uint, uint){
        return (contracts[Owner].x, contracts[Owner].y, contracts[Owner].z);
    }

    function getContractAddress() view public returns(address){
      return this;
    }

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

    function auctionEnd() public {
        //set this to only be called by owner
        //setup a minimum live time for contract
        require(msg.sender == Owner);
        require(!ended, "Contract already awarded....");
        require(endTime <= now);

        ended = true;
        emit contractAwarded(lowestBidder,lowestBid);
        Market market = Market(marketAdd);
        market.awardContract(lowestBidder,contractAdd,Owner);
    }

}
