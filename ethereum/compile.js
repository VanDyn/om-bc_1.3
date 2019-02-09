const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

//delete and rebuild path upon compilation
const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

//Get contents of market
const marketPath = path.resolve(__dirname, 'contracts', 'Market.sol');
const source = fs.readFileSync(marketPath, 'utf8');
const output = solc.compile(source ,1).contracts; //output of all contracts

//ensure build folder exists
fs.ensureDirSync(buildPath);

//write contents of each contract to build directory
for (let contract in output){
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(':','') + '.json'),
    output[contract]
  );
}
