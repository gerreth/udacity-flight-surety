# Readme

Udacity Project Submission for Flight Surety Project

## Getting started

The project was built using the following versions

- `truffle: 5.1.59`
- `solidity: 0.7.4`
- `ganache (GUI): 2.5.4`
- `node: 14.4.0`
- `yarn: 1.22.4`
- `TypeScript: 4.1.3`
- `MetaMask: 9.0.5`

After that, you need to install the dependencies for the **dApp** and the **server application** by running `yarn install` in the root folder. Now start the **Ganache GUI** and create a new workspace with the following configuration

- Server

  - Network ID: `1337`

- Accounts & Keys

  - Total accounts to generate: `50`

- Mnemonic: `bracket weird mind uncle truth hawk picture portion cereal acid crater add`

  - <span style="color:#d73a49">**Your mnemonic is a special secret created for you by Ganache. It's used to generate the addresses available during development as - well as sign transactions sent from those addresses.**</span>

    <span style="color:#d73a49">**You should only use this mnemonic during development. If you use a wallet application configured with this mnemonic, ensure you - switch to a separate configuration when using that wallet with production blockchains.**</span>

    <span style="color:#d73a49">**This mnemonic is not secure. You should not trust it to manage blockchain assets.**</span>

and defaults for all the others. After start up, run `yarn migrate`. This compiles the solidity contracts and copies the addresses to the **dApp** and **server application**. Additionally, this also updates the **ABI Specifications** in the **dApp** folder to interact with the contracts.

## Running the application

After that, run `yarn dapp` and `yarn server` to start both applications. The **dApp** should be available at `http://localhost:3000/` and show a green badge with an _Operational_ label. Depending on the on the account you are connected with, the application shows different views for the contract owner, airlines and passengers. These addresses are hardcoded for now in the **dApp**.

### Contract owner

There is not much to do for the contract owner, I just left it there for debugging purposes. The app contract should be authorized on migration already.

### Airline

Switching to the address `0x3fd361d00A6fB6D1f72f6EE4f97Ac90b90A857C4` you should see the account for the automatically registered airline (as defined in `/migrations/2_deploy_contracts.js`). To provide funding, enter the amount (total required is 10) and click the button. After that, reload the page (not automated yet) to check if the airline is funded. Once it is, you should see two boxes, one for registering a new airline, and one for registering a new flight:

**Registering a new airline**: The first 4 airlines can register a new airline right away. If this threshold is reached, a multiparty consensus scheme is applied, which needs the majority of the registered (and funded) airlines to agree on the new airline.

**Registering a flight**: To register a flight, simply provide the timestamp (any number will work so far) and a flight name: Rember/copy this to act as passenger on the flight. One could show a list of registered flights later on by keeping track of these in the smart contract, **though, do not misuse the blockchain as a general purpose database!**

### Passenger

Switching e.g. to the address `0xA43Cbc4802317b5d99EC027542cAf67c776b5bb0` (or choosing any other from the 8. address onwards) you should see the passenger view where you can buy an insurance, submit an oracle request and check the flight status (and possibly request a refund).

**Buy insurance**: To buy an insurance fill in the flight details from above as well as the airline and the amount for the insurance. The latter needs to be between 0 and 1 , which is also verified in the smart contract.

**Fetch flight status**: To submit an oracle request, fill in the flight details and the airline. In your console for your **server application** you should see a log for this request. The oracles submit with a random flight status and once the minimum number of oracles with the same status replied, the flight status should update and the request will be closed. In case of a `statusCode` of `20` , all passengers that bought an insurance for the flight will be credited with `1.5x` of the purchased insurance amount. You may need to go through the process of registering fligts and buying insurances a few times, due to the randomness, or hardcode the `statusCode` to `20` for all oracles in the **server application** to test the case for the insurance payout.

**Get flight status**: Before submitting the oracle request, a click on the button will show the flight status `unknown` and an disabled payout button. After submitting the request, you should see the updated flight status. Once the insurance case applies, the button becomes active and you can withdraw your funds.
