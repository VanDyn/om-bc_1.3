const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledMarket = require('./build/Market.json');
//const compiledContract = require('./build/Contract.json');

//Specifies accounts unlock and specifiy what outside node to connect
const provider = new HDWalletProvider(
  'twice weather link runway caution parent action share woman toast afford hungry',
   'http://localhost:9545'
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(compiledMarket.interface))
    .deploy({data: compiledMarket.bytecode})
    .send({gas: '1000000', from: accounts[0]});

  console.log('Contract deployed to', result.options.address);

};
deploy();
