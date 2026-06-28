import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import InboxOutlined from '@mui/icons-material/InboxOutlined';

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  compact?: boolean;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = <InboxOutlined sx={{ fontSize: 34 }} />,
  compact = false,
}: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        px: 3,
        py: compact ? 4 : 6,
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'rgba(255,255,255,0.55)',
      }}
    >
      <Box
        sx={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          mb: 2,
          color: 'primary.main',
          background:
            'radial-gradient(circle at 30% 30%, rgba(23,105,210,0.22), rgba(23,105,210,0.06))',
          boxShadow: 'inset 0 0 0 1px rgba(23,105,210,0.1)',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" mb={0.8}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" sx={{ mt: 2.5 }} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
