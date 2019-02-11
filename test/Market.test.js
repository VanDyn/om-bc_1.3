const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledMarket = require('../ethereum/build/Market.json');
const compiledContract = require('../ethereum/build/Contract.json');

let accounts;
let market;
let marketAddress;
let contract;
let contractAddress;

//executes before each describe function
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  market = await new web3.eth.Contract(JSON.parse(compiledMarket.interface))
  .deploy({data: compiledMarket.bytecode})
  .send({ from: accounts[0], gas: '1000000'});

  marketAddress = market.options.address;

  //anytime call function it is asyncronous operation so use await
  await market.methods.joinMarket("Human").send({
    from: accounts[0],
    gas: '1000000'
  });

  await market.methods.joinMarket("Drone").send({
    from: accounts[1],
    gas: '1000000'
  });

  await market.methods.addContract('1','2','3').send({
    from: accounts[0],
    gas: '1000000'
  });

  contractAddress = await market.methods.getContractAddress(accounts[0]).call();

  contract = await new web3.eth.Contract(
    JSON.parse(compiledContract.interface),
    contractAddress
  );

});

describe('Market', () => {
  it('deploys market', () => {
    assert.ok(market.options.address);
  });
  it('allows participants to join the market', async () => {
    const participant = await market.methods.Participants('0').call();
    assert.equal(accounts[0], participant.agentAcc);
  });
  it('Only allows partcipants of market to retreive contract details', async () => {
    let err = null;
    try {
      await market.methods.getContractAddress(accounts[3]).send({
        from: accounts[3],
        gas: '1000000'
      });
    } catch (error) {
      err = error;
    }
    assert.ok(err instanceof Error);
    const conAdd = await market.methods.getContractAddress(accounts[0]).send({
      from: accounts[0],
      gas: '1000000'
    });
    assert.ok(conAdd);
  });

});

//Test Contract contract
describe('Contract', () => {
  it('deploys a contract', () => {
    assert.ok(contract.options.address);
  });
  it('does not let owner bid on own contract', async () => {

    let err = null;
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

    it('only allows the owner to end the bidding', async () => {
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
    await contract.methods.auctionEnd().send({
      from: accounts[0],
      gas: '1000000'
    });
    assert.equal(await contract.methods.ended().call(), true);
    });
});
