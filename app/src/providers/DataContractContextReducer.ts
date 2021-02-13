type IAction = {type: 'SET_CONTRACT'; payload: IFlightSuretyData} | {type: 'GET_CONTRACT'};

export interface IState {
  contract?: IFlightSuretyData;
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

export const emptyAddress = '0x0000000000000000000000000000000000000000' as IAddress;

export type IPayable = {from: IAddress; value: IAmount};
export type INotPayable = {from: IAddress};
export type IAmount = string;
export type IAddress = string;
export type IGetAirlineReturn = {id: IAddress; name: string; isFunded: boolean; funds: string};

export interface IFlightSuretyData {
  getAirline: (address: IAddress) => Promise<IGetAirlineReturn>;
  fund: (data: IPayable) => Promise<any>;
  pay: (data: INotPayable) => Promise<any>;
  getCredit: (data: INotPayable) => Promise<any>;
  authorizeContract: (address: IAddress, data: INotPayable) => Promise<void>;
  deauthorizedContract: (address: IAddress, data: INotPayable) => Promise<void>;
  getFlight: (
    airline: IAddress,
    flight: string,
    timestamp: number,
    data: INotPayable,
  ) => Promise<{statusCode: string}>;
}
