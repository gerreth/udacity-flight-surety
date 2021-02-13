"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const express_1 = __importDefault(require("express"));
const FlightSuretyApp_json_1 = __importDefault(require("../../build/contracts/FlightSuretyApp.json"));
const config_json_1 = __importDefault(require("./config.json"));
const TruffleContract = require('@truffle/contract');
const config = config_json_1.default['localhost'];
const provider = new web3_1.default.providers.WebsocketProvider(config.url.replace('http', 'ws'));
const web3 = new web3_1.default(provider);
const flightSuretyApp = TruffleContract(FlightSuretyApp_json_1.default, config.appAddress);
flightSuretyApp.setProvider(provider);
const oracles = [];
const init = async () => {
    const instance = await flightSuretyApp.deployed();
    const accounts = await web3.eth.getAccounts();
    for (const account of accounts.slice(10, 30)) {
        const oracle = Oracle(instance, account);
        await oracle.init();
        oracles.push(oracle);
    }
    instance.OracleReport(async (error, event) => {
        console.log({ error, event });
    });
    instance.OracleRequest(async (error, event) => {
        console.log('New oracle request:');
        console.log({ event });
        const { index, airline, flight, timestamp } = event.returnValues;
        const responses = [];
        for (const oracle of oracles) {
            const response = oracle.getFlightStatus(index, airline, flight, timestamp);
            if (response) {
                responses.push(Object.assign(Object.assign({}, response), { oracle }));
            }
        }
        for (const { index, airline, flight, timestamp, statusCode, oracle } of responses) {
            console.log({ index });
            instance.submitOracleResponse(index, airline, flight, timestamp, statusCode, {
                from: oracle.account,
                gas: 6721975,
            });
        }
    });
};
init();
const app = express_1.default();
app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!',
        oracles: oracles.map((oracle) => oracle.getIndexes()),
    });
});
exports.default = app;
const Oracle = (contract, account) => {
    const fee = web3.utils.toWei('1', 'ether');
    let indexes = Array(3);
    const registerOracle = async () => {
        await contract.registerOracle({ from: account, value: fee, gas: 6700000 });
        const response = await contract.getMyIndexes({ from: account });
        indexes = response.map((index) => index.toString());
    };
    const init = async () => {
        try {
            await registerOracle();
        }
        catch (error) {
            console.log({ error });
        }
    };
    const getFlightStatus = (index, airline, flight, timestamp) => {
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
    return { account, init, getFlightStatus };
};
