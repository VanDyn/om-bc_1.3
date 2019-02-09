pragma solidity ^0.4.22;
contract Market {

    struct Participant {
        address agentAcc;
        string name;
    }

    Participant[] public Participants;
    mapping(address=>address) liveContracts;

    address public marketPublisher;
    Contract private contracts;


    function Market() public {
        marketPublisher = msg.sender;
    }

    function joinMarket(string _name) public {
        //require statement here
        Participant memory agent = Participant({
            agentAcc: msg.sender,
            name: _name
        });
        Participants.push(agent);
    }

    function addContract(uint _x, uint _y, uint _z) public {     //Add a contract to the market for auction
        address newContract = new Contract(_x, _y, _z, msg.sender);
        liveContracts[msg.sender] = newContract;
    }

    function getContractAddress(address _contractOwner) view public returns (address){
        return liveContracts[_contractOwner];
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

    bool ended;

    address public Owner;
    mapping (address => contractStructure) private contracts;

    event newLowestBid(address bidder, uint amount);
    event contractAwarded(address winner, uint amount);

    function Contract(uint _x, uint _y, uint _z, address _owner) public {
        Owner = _owner;
        var liveContract = contracts[Owner];
        liveContract.x = _x;
        liveContract.y = _y;
        liveContract.z = _z;
    }


    function getContract() view public returns (uint, uint, uint){
        return (contracts[Owner].x, contracts[Owner].y, contracts[Owner].z);
    }

    function submitBid() public payable {

        //make sure bid beats current lowest
        if(lowestBid > 0) { require(msg.value < lowestBid); }
        //make sure bid is greater than 0
        require(msg.value > 0);
        //make sure owner doesn't bid on own contract
        require(msg.sender != Owner, "Owner cannot bid on contract");
        require(!ended, "Contract already awarded....");

        submittedBids[msg.sender] = msg.value;

        lowestBid = msg.value;
        lowestBidder = msg.sender;
        emit newLowestBid(lowestBidder, lowestBid);

    }

    function auctionEnd() public {
        //set this to only be called by owner
        //setup a minimum live time for contract
        require(!ended, "Contract already awarded....");

        ended = true;
        emit contractAwarded(lowestBidder,lowestBid);
    }

}
