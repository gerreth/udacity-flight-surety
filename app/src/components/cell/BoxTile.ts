import styled from 'styled-components';

import Box from '@material-ui/core/Box';
import {Theme} from '@material-ui/core/styles';

const BoxTile = styled(Box)`
  ${(props: {theme: Theme}) => `
    padding: ${props.theme.spacing(5)}px;
    border: solid rgba(0, 0, 0, 0.15) 1px;
    width: 400px;
    margin: ${props.theme.spacing(4)}px auto;
  `}
`;

export default BoxTile;
