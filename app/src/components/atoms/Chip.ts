import styled from 'styled-components';

import {Theme} from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';

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

export const ErrorChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.error.main};
  `}
`;

export const WarningChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.warning.main};
  `}
`;

export const SucccessChip = styled(StyledChip)`
  ${(props: {theme: Theme}) => `
    background: ${props.theme.palette.success.main};
  `}
`;
