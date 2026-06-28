import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { api, errorMessage } from '../api';
import type { Role, Status, Ticket } from '../types';
import { STATUS_LABELS, getAvailableStatusOptions } from '../utils/helpdesk';

type Props = {
  open: boolean;
  ticket: Ticket | null;
  role?: Role;
  onClose: () => void;
  onUpdated: (message: string) => Promise<void> | void;
};

export default function TicketStatusDialog({ open, ticket, role, onClose, onUpdated }: Props) {
  const options = useMemo<Status[]>(
    () => (ticket ? getAvailableStatusOptions(ticket, role) : []),
    [role, ticket]
  );
  const [status, setStatus] = useState<Status | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticket) {
      setStatus('');
      setError('');
      return;
    }

    const currentStatus =
      ticket.status !== 'ABERTO' && options.includes(ticket.status)
        ? ticket.status
        : ((options[0] as Status | undefined) ?? '');
    setStatus(currentStatus);
    setError('');
  }, [options, open, ticket]);

  if (!ticket) {
    return null;
  }

  const handleSubmit = async () => {
    if (!status || status === ticket.status) {
      return;
    }
    const nextStatus = status as Status;

    try {
      setLoading(true);
      setError('');
      await api.patch(`/tickets/${ticket.id}`, { status: nextStatus });
      await onUpdated(`Status do chamado #${ticket.id} alterado para ${STATUS_LABELS[nextStatus]}.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Alterar status do chamado</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            Selecione o novo status para o chamado <strong>#{ticket.id}</strong>.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          {options.length > 0 ? (
            <Select
              fullWidth
              value={status}
              onChange={(event) => setStatus(event.target.value as Status)}
              aria-label="Selecionar novo status do chamado"
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {STATUS_LABELS[option]}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Alert severity="info">
              Nao ha mudancas de status disponiveis para este chamado.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={loading}>
          Fechar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !status || status === ticket.status}
        >
          {loading ? 'Atualizando...' : 'Salvar status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
