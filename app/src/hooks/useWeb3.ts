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
      if (window.ethereum) {
        console.log('using MetaMask');
      } else {
        console.log('not using MetaMask');
      }
      resolve(window.ethereum || new Web3.providers.HttpProvider('http://localhost:7545'));
    } else {
      if (window.ethereum) {
        console.log('using MetaMask');
      } else {
        console.log('not using MetaMask');
      }
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

export const INIT = 'INIT';
export const SET_WEB3 = 'SET_WEB3';
export const GET_ACCOUNT = 'GET_ACCOUNT';
export const SET_ACCOUNT = 'SET_ACCOUNT';
export const SET_ACCOUNT_ERROR = 'SET_ACCOUNT_ERROR';
export const SET_BALANCE = 'SET_BALANCE';

interface State {
  account?: string;
  balance?: string;
  connected: boolean;
  loading: boolean;
  error?: string;
  web3?: Web3;
}

type Action =
  | {type: typeof INIT}
  | {type: typeof SET_WEB3; payload: {web3: Web3; connected: boolean}}
  | {type: typeof GET_ACCOUNT}
  | {type: typeof SET_ACCOUNT; payload: {account: string}}
  | {type: typeof SET_ACCOUNT_ERROR}
  | {type: typeof SET_BALANCE; payload: {balance: string}};

const initialState = {
  account: undefined,
  balance: undefined,
  error: undefined,
  connected: false,
  loading: true,
  web3: undefined,
};

const reducer = (state: State, action: Action) => {
  console.log(state);
  console.log(action);
  switch (action.type) {
    case INIT:
      return {
        ...state,
        loading: true,
        error: undefined,
      };
    case SET_WEB3:
      return {
        ...state,
        web3: action.payload.web3,
        connected: action.payload.connected,
      };
    case GET_ACCOUNT:
      return {
        ...state,
        loading: true,
        error: undefined,
      };
    case SET_ACCOUNT:
      return {
        ...state,
        account: action.payload.account,
      };
    case SET_ACCOUNT_ERROR:
      return {
        ...state,
        loading: false,
        error: 'Could not get account. Are you connected with MetaMask?',
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
    try {
      const [account] = await web3.eth.getAccounts();

      if (!account) {
        dispatch({type: SET_ACCOUNT_ERROR});
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
      dispatch({type: SET_ACCOUNT_ERROR});
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      dispatch({type: INIT});

      const payload = await getWeb3();

      dispatch({type: SET_WEB3, payload});
    };

    if (!state.web3) {
      run();
    }
  }, [getAccount, state.web3]);

  useEffect(() => {
    const run = async (web3: Web3) => {
      dispatch({type: GET_ACCOUNT});

      await getAccount(web3);
    };

    if (state.web3) {
      run(state.web3);
    }
  }, [getAccount, state.web3]);

  return {state, dispatch, getAccount};
};

export default useWeb3;
