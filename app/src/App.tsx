import React, {useEffect, useState} from 'react';

import {StylesProvider, ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import styled, {ThemeProvider as SCThemeProvider} from 'styled-components';

import {Theme} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import DoneIcon from '@material-ui/icons/Done';

import useWeb3Context, {Web3ContextProvider} from './providers/Web3Context';
import {DataContractContextProvider} from './providers/DataContractContext';
import useContractontext, {ContractContextProvider} from './providers/ContractContext';

import {AirlineView} from './pages/airline';
import {AuthorizeContract} from './pages/owner';

import {PassengerView} from './pages/passenger';

import './App.css';

const theme = createMuiTheme({
  spacing: 8,
  palette: {
    // primary: '',
    // secondary: green
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SCThemeProvider theme={theme}>
        <StylesProvider injectFirst>
          <Web3ContextProvider>
            <DataContractContextProvider>
              <ContractContextProvider>
                <div className="App">
                  <Test />
                </div>
              </ContractContextProvider>
            </DataContractContextProvider>
          </Web3ContextProvider>
        </StylesProvider>
      </SCThemeProvider>
    </ThemeProvider>
  );
}

export default App;

const ownerAddress = '0x88B976CA8b27D857Bb0BE20987AD1e82F64C8631';

const airlineAdresses = [
  '0x3fd361d00A6fB6D1f72f6EE4f97Ac90b90A857C4',
  '0xCA4A34a0e61cac31786bA7Bd4cbB7A9cbF471039',
  '0x81AccA6854428C11aeE60CD6440eF26F6b167B33',
  '0x38fB6F024FD642fEf86dC3435A4FDd721DF2509f',
  '0x5ef5d126EaB1e3AE263279Af804257dD01863F24',
  '0x6dE876233069DA924930C16B4B5C6d1B6F85B81e',
  '0xEe02587d6160fe69258BB8a3F2bd12160af5258f',
];

const passengerAdresses = [
  '0xA43Cbc4802317b5d99EC027542cAf67c776b5bb0',
  '0x3dEbCcFFd924355B79e4035d7ca29E0dc49eDf44',
  // or any other
];

const Test: React.FC = () => {
  const {account, loading} = useWeb3Context();

  const [isOperational, setIsOperational] = useState(false);
  const {status, contract} = useContractontext();

  useEffect(() => {
    const run = async () => {
      const result = await contract?.isOperational();

      setIsOperational(Boolean(result));
    };

    if (status === 'success') {
      run();
    }
  }, [status, contract]);

  if (loading) {
    return (
      <Box p={2}>
        <WarningChip size="small" label="Loading" />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box p={2}>
        <ErrorChip size="small" label="Error: Could not get account" />
      </Box>
    );
  }

  if (!isOperational) {
    return (
      <Box p={2}>
        <ErrorChip size="small" label="Status: Not operational" />
      </Box>
    );
  }

  if (account === ownerAddress) {
    return (
      <Box p={2}>
        <SucccessChip size="small" avatar={<DoneIcon />} label="Operational" />
        <Box py={2} />
        <AuthorizeContract account={account} />
      </Box>
    );
  } else if (airlineAdresses.includes(account)) {
    return (
      <Box p={2}>
        <SucccessChip size="small" avatar={<DoneIcon />} label="Operational" />
        <Box py={2} />
        <AirlineView account={account} />
      </Box>
    );
  } else {
    return (
      <Box p={2}>
        <SucccessChip size="small" avatar={<DoneIcon />} label="Operational" />
        <Box py={2} />
        <PassengerView account={account} />
      </Box>
    );
  }
};
const StyledChip = styled(Chip)`
  ${(props: {theme: Theme}) => `
  color: #fff;
  font-size: 0.7em;
  font-weight: 600;
    
    .MuiSvgIcon-root {
      color: #fff;

    }
  `}
`;

const ErrorChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.error.main};
  `}
`;

const WarningChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.warning.main};
  `}
`;

const SucccessChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.success.main};
  `}
`;
