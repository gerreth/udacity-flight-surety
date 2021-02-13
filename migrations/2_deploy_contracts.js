const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const FlightSuretyDataAuthorization = artifacts.require('FlightSuretyDataAuthorization');

const fs = require('fs');

module.exports = async function (deployer, network, accounts) {
  const firstAirline = '0x3fd361d00A6fB6D1f72f6EE4f97Ac90b90A857C4';
  const firstAirlineName = 'Lufthansa';

  await deployer.deploy(FlightSuretyData, firstAirline, firstAirlineName);
  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

  const config = {
    localhost: {
      url: 'http://localhost:7545',
      dataAddress: FlightSuretyData.address,
      appAddress: FlightSuretyApp.address,
    },
  };

  fs.writeFileSync(
    __dirname + '/../app/src/config.json',
    JSON.stringify(config, null, '\t'),
    'utf-8',
  );

  fs.writeFileSync(
    __dirname + '/../server/src/config.json',
    JSON.stringify(config, null, '\t'),
    'utf-8',
  );

  const instance = await FlightSuretyData.deployed();

  await instance.authorizeContract(FlightSuretyApp.address, {from: accounts[0]});
};
