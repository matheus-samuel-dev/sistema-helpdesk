declare module '@mui/icons-material/*' {
  import type { SvgIconProps } from '@mui/material/SvgIcon';
  import type { ComponentType } from 'react';

  const IconComponent: ComponentType<SvgIconProps>;
  export default IconComponent;
}
