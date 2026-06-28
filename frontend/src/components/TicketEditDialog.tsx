import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { api, errorMessage } from '../api';
import type { Category, Priority, Role, Status, Ticket, User } from '../types';
import {
  CATEGORY_OPTIONS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  getAvailableStatusOptions,
} from '../utils/helpdesk';

type Props = {
  open: boolean;
  ticket: Ticket | null;
  analysts: User[];
  role?: Role;
  onClose: () => void;
  onUpdated: (message: string) => Promise<void> | void;
};

type FormState = {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status | '';
  technicianId: number | '';
};

const initialForm: FormState = {
  title: '',
  description: '',
  category: 'OUTROS',
  priority: 'MEDIA',
  status: '',
  technicianId: '',
};

export default function TicketEditDialog({
  open,
  ticket,
  analysts,
  role,
  onClose,
  onUpdated,
}: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statusOptions = useMemo(
    () => (ticket ? getAvailableStatusOptions(ticket, role) : []),
    [role, ticket]
  );

  useEffect(() => {
    if (!ticket) {
      return;
    }

    setForm({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status === 'ABERTO' ? '' : ticket.status,
      technicianId: ticket.technician?.id ?? '',
    });
    setError('');
  }, [ticket, open]);

  if (!ticket) {
    return null;
  }

  const canManageAdvancedFields = role === 'ADMIN';
  const canEdit = role === 'ADMIN' || role === 'TECNICO';

  const handleSubmit = async () => {
    if (!canEdit) {
      return;
    }
    if (form.title.trim().length < 3) {
      setError('O titulo deve ter pelo menos 3 caracteres.');
      return;
    }
    if (form.description.trim().length < 10) {
      setError('A descricao deve ter pelo menos 10 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.patch(`/tickets/${ticket.id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        ...(form.status && form.status !== ticket.status ? { status: form.status } : {}),
        ...(canManageAdvancedFields ? { priority: form.priority } : {}),
        ...(canManageAdvancedFields && form.technicianId
          ? { technicianId: Number(form.technicianId) }
          : {}),
      });
      await onUpdated(`Chamado #${ticket.id} atualizado com sucesso.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar chamado</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Titulo"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            inputProps={{ maxLength: 160 }}
            autoFocus
            fullWidth
          />

          <TextField
            label="Descricao"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            multiline
            minRows={5}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value as Category }))
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                displayEmpty
                label="Status"
                value={form.status}
                renderValue={(value) =>
                  value ? STATUS_LABELS[value as Status] : 'Selecione o novo status'
                }
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as Status | '' }))
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {canManageAdvancedFields && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  label="Prioridade"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priority: event.target.value as Priority }))
                  }
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Analista</InputLabel>
                <Select
                  label="Analista"
                  value={form.technicianId}
                  onChange={(event) => {
                    const value = event.target.value as unknown as number | '';
                    setForm((current) => ({
                      ...current,
                      technicianId: value === '' ? '' : Number(value),
                    }));
                  }}
                >
                  <MenuItem value="">Nao atribuido</MenuItem>
                  {analysts.map((analyst) => (
                    <MenuItem key={analyst.id} value={analyst.id}>
                      {analyst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !canEdit}>
          {loading ? 'Salvando...' : 'Salvar alteracoes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
