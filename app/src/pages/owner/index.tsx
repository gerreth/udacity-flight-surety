import React, {useState} from 'react';

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import useDataContractContext from '../../providers/DataContractContext';
import BoxTile from '../../components/cell/BoxTile';

const config = require('../../config.json');

interface IAuthorizeContract {
  account: string;
}

export const AuthorizeContract: React.FC<IAuthorizeContract> = ({account}) => {
  const dataContract = useDataContractContext();
  const [address, setAdress] = useState(config.localhost.appAddress);

  const authorizeContract = dataContract.contract?.authorizeContract;

  if (!authorizeContract) {
    return null;
  }

  return (
    <BoxTile>
      <TextField
        fullWidth
        label="Address"
        value={address}
        size="small"
        onChange={(event) => {
          setAdress(event.target.value);
        }}
      />
      <Box my={4} />
      <Button
        variant="contained"
        disableElevation
        color="primary"
        size="small"
        onClick={() => authorizeContract(address, {from: account})}
      >
        Authorize contract
      </Button>
    </BoxTile>
  );
};
