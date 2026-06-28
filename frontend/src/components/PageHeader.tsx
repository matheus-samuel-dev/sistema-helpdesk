import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  breadcrumb: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, breadcrumb, actions }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        flexWrap: 'wrap',
        mb: 2.5,
      }}
    >
      <Stack spacing={0.6}>
        <Typography
          color="text.secondary"
          fontSize={12}
          fontWeight={700}
          letterSpacing={0.3}
          sx={{ textTransform: 'uppercase' }}
        >
          {breadcrumb}
        </Typography>
        <Typography variant="h5">{title}</Typography>
      </Stack>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}
