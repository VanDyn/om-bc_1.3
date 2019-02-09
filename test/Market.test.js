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
  it('deploys market and contract', () => {
    assert.ok(market.options.address);
    assert.ok(contract.options.address);
  });
  it('allows participants to join the market', async () => {
    const participant = await market.methods.Participants('0').call();
    assert.equal(accounts[0], participant.agentAcc);
  });
  it('allows participants to retrieve contract address', async () => {
    const conAdd = await market.methods.getContractAddress(accounts[0]).call();
    assert.ok(conAdd);
  });
  
})
