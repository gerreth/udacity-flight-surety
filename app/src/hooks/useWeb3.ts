import {useCallback, useEffect, useReducer} from 'react';

import Web3 from 'web3';

declare global {
  interface Window {
    ethereum: any;
  }
}

window.ethereum = window.ethereum || undefined;

export const getProvider = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (document.readyState === 'complete') {
      resolve(window.ethereum || new Web3.providers.HttpProvider('http://localhost:7545'));
    } else {
      window.addEventListener('load', () => {
        resolve(window.ethereum || new Web3.providers.HttpProvider('http://localhost:7545'));
      });
    }
  });
};

export const getWeb3 = async (): Promise<Payload> => {
  const provider = await getProvider();

  return {web3: new Web3(provider), connected: Boolean(window.ethereum), provider};
};

type Payload = {web3: Web3; connected: boolean; provider: any};

const INIT = 'INIT';
const SET_WEB3 = 'SET_WEB3';
const SET_ACCOUNT = 'SET_ACCOUNT';
const SET_BALANCE = 'SET_BALANCE';

interface State {
  account?: string;
  balance?: string;
  connected: boolean;
  loading: boolean;
  web3?: Web3;
}

type Action =
  | {type: typeof INIT}
  | {type: typeof SET_WEB3; payload: {web3: Web3; connected: boolean}}
  | {type: typeof SET_ACCOUNT; payload: {account: string}}
  | {type: typeof SET_BALANCE; payload: {balance: string}};

const initialState = {
  account: undefined,
  balance: undefined,
  connected: false,
  loading: true,
  web3: undefined,
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case INIT:
      return {
        ...state,
        loading: true,
      };
    case SET_WEB3:
      return {
        ...state,
        web3: action.payload.web3,
        connected: action.payload.connected,
      };
    case SET_ACCOUNT:
      return {
        ...state,
        account: action.payload.account,
      };
    case SET_BALANCE:
      return {
        ...state,
        balance: action.payload.balance,
        loading: false,
      };
    default:
      return state;
  }
};

const useWeb3 = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getAccount = useCallback(async (web3: Web3) => {
    dispatch({type: INIT});

    try {
      const [account] = await web3.eth.getAccounts();

      if (!account) {
        // dispatch({type: SET_ACCOUNT_ERROR});
        return;
      } else {
        dispatch({type: SET_ACCOUNT, payload: {account}});

        try {
          const balance = await web3.eth.getBalance(account);

          dispatch({type: SET_BALANCE, payload: {balance}});
        } catch (error) {
          console.log({error});
          // dispatch({type: SET_BALANCE_ERROR});
        }
      }
    } catch (error) {
      console.log({error});
      // dispatch({type: SET_ACCOUNT_ERROR});
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      dispatch({type: INIT});

      const payload = await getWeb3();

      dispatch({type: SET_WEB3, payload});

      await getAccount(payload.web3);
    };

    run();
  }, [getAccount]);

  return {state, getAccount};
};

export default useWeb3;
