import React, {useContext, useEffect, useState} from 'react';

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';

import BoxTile from '../../components/cell/BoxTile';
import useContractContext from '../../providers/ContractContext';
import useDataContractContext from '../../providers/DataContractContext';
import useWeb3Context from '../../providers/Web3Context';
import {IAddress} from '../../providers/DataContractContextReducer';

import FlightContextProvider, {FlightContext} from './context';

interface IPassengerView {
  account: string;
}

export const PassengerView: React.FC<IPassengerView> = ({account}) => {
  const getAddress = (address: IAddress) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box width={480} margin="0 auto">
      <Box display="flex" alignItems="flex-end" justifyContent="space-between">
        <Typography variant="h4">Hi Passenger!</Typography>
        <Box px={2} />
        <Chip size="small" label={getAddress(account)} />
      </Box>
      <FlightContextProvider>
        <BuyInsurance account={account} />
        <FetchFlightStatus account={account} />
        <GetFlightStatus account={account} />
      </FlightContextProvider>
    </Box>
  );
};

interface IBuyInsurance {
  account: string;
}

export const BuyInsurance: React.FC<IBuyInsurance> = ({account}) => {
  const {contract} = useContractContext();
  const {web3} = useWeb3Context();
  const {airline, flight, timestamp} = useContext(FlightContext);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [airline, flight, timestamp]);

  const buyInsurance = contract?.buyInsurance;

  if (!buyInsurance || !web3) {
    return null;
  }

  return (
    <BoxTile>
      <Typography>
        When the flight is late due to the airline's fault, you receive 1.5x your insurance amount.
        You can submit at most 1 Ether.
      </Typography>
      <Box my={3} />
      <TextField
        error={error}
        helperText={error ? 'Could not buy an insurance' : ''}
        fullWidth
        label="Amount"
        type="number"
        value={amount}
        InputProps={{
          endAdornment: <InputAdornment position="end">Ether</InputAdornment>,
        }}
        onChange={(event) => {
          setAmount(event.target.value);
          setError(false);
        }}
        size="small"
      />
      <Box my={3} />
      <Button
        variant="contained"
        disableElevation
        color="primary"
        disabled={
          parseFloat(amount || '0') <= 0 ||
          parseFloat(amount) > 1 ||
          !airline ||
          !flight ||
          !timestamp
        }
        onClick={async () => {
          try {
            await buyInsurance(airline, flight, parseInt(timestamp, 10), {
              from: account,
              value: web3.utils.toWei(amount).toString(),
            });
          } catch (error) {
            console.log({error});
            setError(true);
          }
        }}
      >
        Buy insurance
      </Button>
    </BoxTile>
  );
};

interface IFetchFlightStatus {
  account: string;
}

export const FetchFlightStatus: React.FC<IFetchFlightStatus> = ({account}) => {
  const {contract} = useContractContext();
  const {airline, flight, timestamp} = useContext(FlightContext);
  const disabled = !airline || !flight || !timestamp;

  const fetchFlightStatus = contract?.fetchFlightStatus;

  if (!fetchFlightStatus) {
    return null;
  }

  return (
    <BoxTile>
      <Button
        disabled={disabled}
        variant="contained"
        disableElevation
        color="primary"
        onClick={async () => {
          try {
            await fetchFlightStatus(airline, flight, parseInt(timestamp, 10), {
              from: account,
            });
          } catch (error) {
            console.log({error});
          }
        }}
      >
        Fetch flight status
      </Button>
    </BoxTile>
  );
};

interface IGetFlightStatus {
  account: string;
}

export const GetFlightStatus: React.FC<IGetFlightStatus> = ({account}) => {
  const {contract} = useDataContractContext();
  const {airline, flight, timestamp} = useContext(FlightContext);

  const [status, setStatus] = useState<number | undefined>(undefined);
  const disabled = !airline || !flight || !timestamp;

  const getFlight = contract?.getFlight;

  if (!getFlight) {
    return null;
  }

  if (status !== undefined) {
    return <StatusUpdate status={status} reset={() => setStatus(undefined)} account={account} />;
  }

  return (
    <BoxTile>
      <Button
        disabled={disabled}
        variant="contained"
        disableElevation
        color="primary"
        onClick={async () => {
          try {
            const result = await getFlight(airline, flight, parseInt(timestamp, 10), {
              from: account,
            });

            console.log({result});

            setStatus(parseInt(result.toString(), 10));
          } catch (error) {
            console.log({error});
          }
        }}
      >
        Get flight status
      </Button>
    </BoxTile>
  );
};

interface IStatusUpdate {
  account: string;
  reset: () => void;
  status?: number;
}

export const StatusUpdate: React.FC<IStatusUpdate> = ({account, reset, status}) => {
  const {contract} = useDataContractContext();
  const [error, setError] = useState(false);

  useEffect(() => {
    const run = async () => {
      const result = await contract?.getCredit({from: account});
      // just for debugging
      console.log({result: result.toString()});
    };

    run();
  }, [contract]);

  const statuses = {
    0: 'Unknown',
    10: 'On time',
    20: 'Flight is late, reason: Airline',
    30: 'Flight is late, reason: Weather',
    40: 'Flight is late, reason: Technical issues',
    50: 'Flight is late, reason: Other issues',
  } as {[key: number]: string};

  return (
    <BoxTile>
      {!error && (
        <Typography>
          {statuses[status ?? 0]} ({status})
        </Typography>
      )}
      {error && (
        <Typography color="error">No funds to transfer. Did you withdraw already?</Typography>
      )}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="contained"
          disableElevation
          color="secondary"
          onClick={() => {
            setError(false);
            reset();
          }}
        >
          Reset
        </Button>
        <Button
          disabled={status !== 20}
          variant="contained"
          disableElevation
          color="primary"
          onClick={async () => {
            try {
              const result = await contract?.pay({from: account});

              console.log({result});
            } catch (error) {
              console.log({error});
              setError(true);
            }
          }}
        >
          Payout
        </Button>
      </Box>
    </BoxTile>
  );
};
