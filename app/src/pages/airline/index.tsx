import React, {useEffect, useState} from 'react';

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';

import BoxTile from '../../components/cell/BoxTile';
import useWeb3Context from '../../providers/Web3Context';
import useDataContractContext from '../../providers/DataContractContext';
import useContractontext from '../../providers/ContractContext';
import {
  emptyAddress,
  IAddress,
  IGetAirlineReturn,
} from '../../providers/DataContractContextReducer';

const useGetAirline = (account?: IAddress) => {
  const [airline, setAirline] = useState<IGetAirlineReturn>();
  const dataContract = useDataContractContext();

  useEffect(() => {
    const run = async (account: IAddress) => {
      const result = await dataContract.contract?.getAirline(account);

      setAirline(result);
    };

    if (account) {
      run(account);
    }
  }, [account, dataContract.contract]);

  return airline;
};

interface IAirlineView {
  account: string;
}

export const AirlineView: React.FC<IAirlineView> = ({account}) => {
  const airline = useGetAirline(account);

  if (!airline) {
    return <Box>Error: ...</Box>;
  }

  if (airline.id === emptyAddress) {
    return (
      <Box width={480} margin="0 auto">
        {account} is not registered yet
      </Box>
    );
  }

  return (
    <>
      <Box>
        <AirlineInfos account={account} />
      </Box>
      {airline.isFunded && (
        <BoxTile my={1}>
          <RegisterAirline account={account} />
        </BoxTile>
      )}
      {airline.isFunded && (
        <BoxTile my={1}>
          <RegisterFlight account={account} />
        </BoxTile>
      )}
      {!airline.isFunded && (
        <BoxTile>
          <FundAirline account={account} />
        </BoxTile>
      )}
    </>
  );
};

interface IAirlineInfos {
  account: string;
}

export const AirlineInfos: React.FC<IAirlineInfos> = ({account}) => {
  const airline = useGetAirline(account);
  const {web3} = useWeb3Context();

  if (!airline) {
    return null;
  }

  const getAddress = (address: IAddress) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box width={480} margin="0 auto">
      <Box display="flex" alignItems="flex-end" justifyContent="space-between">
        <Typography variant="h4">{airline.name}</Typography>
        <Box px={2} />
        <Chip size="small" label={getAddress(airline.id)} />
      </Box>
      <Box py={2} />
      <Box display="flex" alignItems="center">
        <Box mr={1}>{airline.isFunded ? 'Is funded:' : 'Not Funded:'}</Box>
        <Chip size="small" color="primary" label={`${web3?.utils.fromWei(airline.funds)}/10`} />
      </Box>
    </Box>
  );
};

interface IRegisterAirline {
  account: string;
}

export const RegisterAirline: React.FC<IRegisterAirline> = ({account}) => {
  const {contract} = useContractontext();
  const [name, setName] = useState('');
  const [address, setAdress] = useState('');

  const registerAirline = contract?.registerAirline;

  if (!registerAirline) {
    return null;
  }

  return (
    <Box>
      <TextField
        fullWidth
        label="Airline address"
        value={address}
        onChange={(event) => {
          setAdress(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
      <TextField
        fullWidth
        label="Airline name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
      <Button
        variant="contained"
        disableElevation
        color="primary"
        onClick={async () => {
          try {
            await registerAirline(address, name, {from: account});
          } catch (error) {
            console.log({error});
          }
        }}
      >
        Register airline
      </Button>
    </Box>
  );
};

interface IRegisterFlight {
  account: string;
}

export const RegisterFlight: React.FC<IRegisterFlight> = ({account}) => {
  const {contract} = useContractontext();
  const [name, setName] = useState('');
  const [timestamp, setTimestamp] = useState('');

  const registerFlight = contract?.registerFlight;

  if (!registerFlight) {
    return null;
  }

  return (
    <Box>
      <TextField
        fullWidth
        label="Timestamp"
        value={timestamp}
        onChange={(event) => {
          setTimestamp(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
      <TextField
        fullWidth
        label="Flight name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
      <Button
        variant="contained"
        disableElevation
        color="primary"
        onClick={async () => {
          try {
            await registerFlight(name, parseInt(timestamp, 10), {from: account});
          } catch (error) {
            console.log({error});
          }
        }}
      >
        Register flight
      </Button>
    </Box>
  );
};

interface IFundAirline {
  account: string;
}

export const FundAirline: React.FC<IFundAirline> = ({account}) => {
  const airline = useGetAirline(account);
  const [amount, setAmount] = useState('');
  const {contract} = useDataContractContext();
  const {web3} = useWeb3Context();

  const fund = contract?.fund;

  if (!web3 || !fund || !airline) {
    return null;
  }

  if (airline.isFunded) {
    return <Box>Already funded</Box>;
  }

  return (
    <Box>
      <TextField
        label="Amount"
        fullWidth
        value={amount}
        onChange={(event) => {
          setAmount(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
      <Button
        variant="contained"
        disableElevation
        color="primary"
        onClick={async () => {
          try {
            await fund({from: account, value: web3.utils.toWei(amount).toString()});
          } catch (error) {
            console.log({error});
          }
        }}
      >
        Fund airline
      </Button>
    </Box>
  );
};
