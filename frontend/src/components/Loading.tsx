import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading({ label = 'Carregando informações...' }: { label?: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 280,
        textAlign: 'center',
        gap: 1.5,
      }}
      aria-live="polite"
    >
      <CircularProgress size={34} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
