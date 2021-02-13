import {IAddress, INotPayable, IPayable} from './DataContractContextReducer';

type IAction = {type: 'SET_CONTRACT'; payload: IFlightSuretyApp} | {type: 'GET_CONTRACT'};

export interface IState {
  contract?: IFlightSuretyApp;
  error?: string;
  loading: boolean;
  status: 'initial' | 'loading' | 'error' | 'success';
}

export const initialState: IState = {
  contract: undefined,
  error: undefined,
  loading: false,
  status: 'initial',
};

export const reducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case 'SET_CONTRACT':
      return {
        ...state,
        status: 'success' as 'success',
        contract: action.payload,
        loading: false,
        error: undefined,
      };
    case 'GET_CONTRACT':
      return {
        ...state,
        status: 'loading' as 'loading',
        loading: true,
        error: undefined,
        contract: undefined,
      };
    default:
      return state;
  }
};

type IRegisterAirlineReturn = Promise<[boolean, number]>;

export interface IFlightSuretyApp {
  isOperational: () => Promise<boolean>;
  isContractOwner: () => Promise<boolean>;
  registerAirline: (address: IAddress, name: string, data: INotPayable) => IRegisterAirlineReturn;
  registerFlight: (flight: string, timestamp: number, data: INotPayable) => Promise<boolean>;
  buyInsurance: (
    airline: IAddress,
    flight: string,
    timestamp: number,
    data: IPayable,
  ) => Promise<boolean>;
  fetchFlightStatus: (
    airline: IAddress,
    flight: string,
    timestamp: number,
    data: INotPayable,
  ) => Promise<void>;
}
