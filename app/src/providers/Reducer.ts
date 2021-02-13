type IAction<T> = {type: 'SET_CONTRACT'; payload: T} | {type: 'GET_CONTRACT'};

export interface IState<T> {
  contract?: T;
  error?: string;
  loading: boolean;
  status: 'initial' | 'loading' | 'error' | 'success';
}

export const initialState: IState<any> = {
  contract: undefined,
  error: undefined,
  loading: false,
  status: 'initial',
};

export const reducer = <T>(state: IState<T>, action: IAction<T>) => {
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
