import React, {useContext, useEffect, useReducer} from 'react';

import {getProvider} from '../hooks/useWeb3';

import {IFlightSuretyApp, initialState, IState, reducer} from './ContractContextReducer';

const Contract = require('@truffle/contract');
const abi = require('../contracts/FlightSuretyApp.json');
const config = require('../config.json');

const Contractontext = React.createContext<IState | undefined>(undefined);

export const ContractContextProvider: React.FC = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const run = async () => {
      dispatch({type: 'GET_CONTRACT'});
      const contract = Contract(abi, config.localhost.appAddress);
      const provider = await getProvider();

      contract.setProvider(provider);
      const instance = (await contract.deployed()) as IFlightSuretyApp;
      dispatch({type: 'SET_CONTRACT', payload: instance});
    };

    run();
  }, []);

  return <Contractontext.Provider value={state}>{children}</Contractontext.Provider>;
};

export const useContractontext = () => {
  const context = useContext(Contractontext);

  if (context === undefined) {
    throw Error('Could not find provider of Contractontext');
  }

  return context;
};

export default useContractontext;
