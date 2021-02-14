import React, {useContext, useEffect, useReducer} from 'react';

import {getProvider} from '../hooks/useWeb3';

import {IFlightSuretyData, initialState, IState, reducer} from './DataContractContextReducer';

const Contract = require('@truffle/contract');
const abi = require('../contracts/FlightSuretyData.json');
const config = require('../config.json');

const DataContractContext = React.createContext<IState | undefined>(undefined);

export const DataContractContextProvider: React.FC = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const run = async () => {
      dispatch({type: 'GET_CONTRACT'});
      const contract = Contract(abi, config.localhost.appAddress);
      const provider = await getProvider();

      contract.setProvider(provider);
      const instance = (await contract.deployed()) as IFlightSuretyData;
      dispatch({type: 'SET_CONTRACT', payload: instance});
    };

    run();
  }, []);

  return <DataContractContext.Provider value={state}>{children}</DataContractContext.Provider>;
};

export const useDataContractContext = () => {
  const context = useContext(DataContractContext);

  if (context === undefined) {
    throw Error('Could not find provider of DataContractContext');
  }

  return context;
};

export default useDataContractContext;
