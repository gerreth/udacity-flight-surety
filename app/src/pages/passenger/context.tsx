import React, {useState} from 'react';

import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';

import BoxTile from '../../components/cell/BoxTile';

interface IState {
  airline: string;
  flight: string;
  timestamp: string;
}

export const FlightContext = React.createContext<IState>({airline: '', flight: '', timestamp: ''});

export const FlightContextProvider: React.FC = ({children}) => {
  const [toggleView, setToggleView] = useState(false);
  const [airline, setAirline] = useState('');
  const [flight, setFlight] = useState('');
  const [timestamp, setTimestamp] = useState('');

  return (
    <FlightContext.Provider value={{airline, flight, timestamp}}>
      <Form
        airline={airline}
        setAirline={setAirline}
        flight={flight}
        setFlight={setFlight}
        timestamp={timestamp}
        setTimestamp={setTimestamp}
        toggleView={toggleView}
        setToggleView={setToggleView}
      />
      {children}
    </FlightContext.Provider>
  );
};

interface IForm {
  airline: string;
  flight: string;
  timestamp: string;
  toggleView: boolean;
  setAirline: (value: string) => void;
  setTimestamp: (value: string) => void;
  setFlight: (value: string) => void;
  setToggleView: (value: boolean) => void;
}

export const Form: React.FC<IForm> = ({
  airline,
  flight,
  timestamp,
  setAirline,
  setFlight,
  setTimestamp,
}) => {
  return (
    <BoxTile>
      <TextField
        fullWidth
        label="Airline address"
        value={airline}
        onChange={(event) => {
          setAirline(event.target.value);
        }}
        size="small"
      />
      <Box my={3} />
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
        value={flight}
        onChange={(event) => {
          setFlight(event.target.value);
        }}
        size="small"
      />
    </BoxTile>
  );
};

export default FlightContextProvider;
