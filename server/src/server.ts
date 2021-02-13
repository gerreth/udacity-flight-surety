import Web3 from 'web3';
import express from 'express';
// @ts-ignore
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';

import Config from './config.json';

const TruffleContract = require('@truffle/contract');

const config = Config['localhost'];

const provider = new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'));
const web3 = new Web3(provider);
const flightSuretyApp = TruffleContract(FlightSuretyApp, config.appAddress);
flightSuretyApp.setProvider(provider);

const oracles = [] as any;

const init = async () => {
  // setup oracles
  const instance = await flightSuretyApp.deployed();

  const accounts = await web3.eth.getAccounts();

  for (const account of accounts.slice(10, 30)) {
    const oracle = Oracle(instance, account);

    await oracle.init();

    oracles.push(oracle);
  }

  //

  instance.OracleReport(async (error: any, event: any) => {
    console.log({error, event});
  });

  instance.OracleRequest(async (error: any, event: any) => {
    console.log('New oracle request:');
    console.log({event});
    const {index, airline, flight, timestamp} = event.returnValues;

    const responses = [] as any[];
    for (const oracle of oracles) {
      const response = oracle.getFlightStatus(index, airline, flight, timestamp);

      if (response) {
        responses.push({...response, oracle});
      }
    }

    for (const {index, airline, flight, timestamp, statusCode, oracle} of responses) {
      console.log({index});
      instance.submitOracleResponse(index, airline, flight, timestamp, statusCode, {
        from: oracle.account,
        gas: 6721975,
      });
    }
  });
};

init();

const app = express();

app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!',
    oracles: oracles.map((oracle: any) => oracle.getIndexes()),
  });
});

export default app;

/**
 *
 *
 *
 */
type IContract = any;

const Oracle = (contract: IContract, account: string) => {
  const fee = web3.utils.toWei('1', 'ether');

  let indexes = Array(3) as [string, string, string];

  const registerOracle = async () => {
    await contract.registerOracle({from: account, value: fee, gas: 6700000});

    const response = await contract.getMyIndexes({from: account});

    indexes = response.map((index: any) => index.toString());
  };

  const init = async () => {
    try {
      await registerOracle();
    } catch (error) {
      console.log({error});
    }
  };

  const getFlightStatus = (index: string, airline: string, flight: string, timestamp: number) => {
    if (indexes.includes(index)) {
      return {
        index,
        airline,
        flight,
        timestamp,
        statusCode: [0, 10, 20, 30, 40, 50][Math.floor(Math.random() * 6)],
      };
    }

    return null;
  };

  return {account, init, getFlightStatus};
};
