import React, {useContext, useEffect} from 'react';

import Web3 from 'web3';

import useWeb3Hook from '../hooks/useWeb3';

interface IWeb3Context {
  account?: string;
  connected: boolean;
  loading: boolean;
  web3?: Web3;
}

const Web3Context = React.createContext<IWeb3Context | undefined>(undefined);

export const Web3ContextProvider: React.FC = ({children}) => {
  const {state, getAccount} = useWeb3Hook();

  useEffect(() => {
    const run = async () => {
      if (!state.web3) {
        return;
      }

      getAccount(state.web3);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', run);
    }
  }, [state.web3, getAccount]);

  return <Web3Context.Provider value={state}>{children}</Web3Context.Provider>;
};

export const useWeb3Context = () => {
  const context = useContext(Web3Context);

  if (context === undefined) {
    throw Error('Could not find provider of Web3Context');
  }

  return context;
};

export default useWeb3Context;
