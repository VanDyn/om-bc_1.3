const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
//Required to point to BC. For a private blockchain last 4 digits are port number
const web3 = new Web3('http://localhost:9545');
//Require contract bytecode and ABI
const compiledMarket = require('../ethereum/build/Market.json');
const compiledContract = require('../ethereum/build/Contract.json');

let accounts;
let market;
let marketAddress;
let contract;
let contractAddress;

//executes before each function
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

//deploy market contract
  market = await new web3.eth.Contract(JSON.parse(compiledMarket.interface))
  .deploy({data: compiledMarket.bytecode})
  .send({ from: accounts[0], gas: '4000000'});

  marketAddress = market.options.address;

//anytime call function it is asyncronous operation so use await

//Account 0 adds a contract to the market
  await market.methods.addContract('1','2','3','4').send({
    from: accounts[0],
    gas: '1000000'
  });

//retrieve address contract is pulbihsed at
  contractAddress = await market.methods.getContractAddress(accounts[0]).call();

//Create ability to intract with contract through web3 plugin
  contract = await new web3.eth.Contract(
    JSON.parse(compiledContract.interface),
    contractAddress
  );
});

//Test market contract
describe('Market', () => {
  //check contract has been deployed
  it('deploys market', () => {
    assert.ok(market.options.address);
  });

  //Throws an error if account not a participant in market place tries to get
  //contract
  it('allows partcipants to retreive contract details', async () => {

    //Allows market particpant to get contract
    const conAdd = await market.methods.getContractAddress(accounts[0]).send({
      from: accounts[0],
      gas: '1000000'
    });
    assert.ok(conAdd);
  });

  //Check auctioneers who refuse to pay can be reported and recorded
  it('records auctioneers who do not pay', async () =>{

    await contract.methods.submitBid('2000000000000000000').send({
      from: accounts[1],
      gas: '1000000'
    });

    await new Promise(resolve=> {
      console.log('waiting 4 seconds');
      setTimeout(resolve,4001);
    });

    await contract.methods.auctionEnd().send({
      from: accounts[0],
      gas: '1000000'
    });

    await market.methods.reportNoPayment(accounts[0]).send({
      from: accounts[1],
      gas: '1000000'
    });

    assert.equal(accounts[0], await market.methods.badPayer(0).call());
  }).timeout(5000);

});

//Test Contract contract
describe('Contract', () => {
  //Check deoplyment
  it('deploys a contract', () => {
    assert.ok(contract.options.address);
  });
  //Ensure owner cannot bid on own contract
  it('does not let owner bid on own contract', async () => {
    let err = null;
    //throw error if owner bids
    try {
    await contract.methods.submitBid('2').send({
      from: accounts[0],
      gas: '1000000'
    });
  } catch (error) {
    err = error;
  }
  // check error is thrown
    assert.ok(err instanceof Error);
  });

  //Make sure contract is accepting lowest bid
  it('allows accounts to submit bids and accepts lowest', async () => {
    await contract.methods.submitBid('2').send({
      from: accounts[1],
      gas: '1000000'
    });
    await contract.methods.submitBid('1').send({
      from: accounts[2],
      gas: '1000000'
    });
    const lowestBid = await contract.methods.lowestBid().call();
    assert.equal('1', lowestBid);
    });

    //Measures and prints how long it takes to submit a bid
    it('Measures how long it takes to submit one bid', async () => {
      console.time('time:');
      await contract.methods.submitBid('2').send({
        from: accounts[1],
        gas: '1000000'
      });
      console.timeEnd('time:');

    });

    //end auction
    it('only allows the owner to end the bidding and after specified time', async () => {
      let err = null;
      try {
        await contract.methods.auctionEnd().send({
          from: accounts[1],
          gas: '1000000'
        });
      } catch (error) {
        err = error;
      }
      assert.ok(err instanceof Error);

      err = null;
      try {
        await contract.methods.auctionEnd().send({
          from: accounts[0],
          gas: '1000000'
        });
      } catch (error) {
        err = error;
      }
      assert.ok(err instanceof Error);

      await new Promise(resolve=> {
        console.log('waiting 4 seconds');
        setTimeout(resolve,4001);
      });

      await contract.methods.auctionEnd().send({
        from: accounts[0],
        gas: '1000000'
      });
      assert.equal(true, await contract.methods.ended().call());
    }).timeout(5000);
    //Check payment system
    it('Pays account what is owed', async () => {

      await contract.methods.submitBid('2000000000000000000').send({
        from: accounts[1],
        gas: '1000000'
      });

      await new Promise(resolve=> {
        console.log('waiting 4 seconds');
        setTimeout(resolve,4001);
      });

      await contract.methods.auctionEnd().send({
        from: accounts[0],
        gas: '1000000'
      });

      await contract.methods.payBidder().send({
        from: accounts[0],
        value: web3.utils.toWei('2', 'ether'),
        gas: '1000000'
      });
      //No assertion - check GUI
    }).timeout(5000);
});

describe('Operational sequence', async() =>{
  it('measures how long bidding takes', async () => {
    console.time("Auction takes")
    await contract.methods.submitBid('2000000000000000000').send({
      from: accounts[1],
      gas: '1000000'
    });

    await new Promise(resolve=> {
      console.log('waiting 4 seconds');
      setTimeout(resolve,4001);
    });

    await contract.methods.auctionEnd().send({
      from: accounts[0],
      gas: '1000000'
    });
    console.timeEnd("Auction takes");



  }).timeout(5000);
});
