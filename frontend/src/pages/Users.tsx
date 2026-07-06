import { useDeferredValue, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import Search from '@mui/icons-material/Search';
import { api, errorMessage } from '../api';
import AppSnackbar, { initialFeedback, type FeedbackState } from '../components/AppSnackbar';
import { AccessBadge, RoleBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import type { Page, Role, User } from '../types';
import { ROLE_OPTIONS } from '../utils/helpdesk';

type Form = {
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
};

const initialForm: Form = {
  name: '',
  email: '',
  password: '',
  role: 'CLIENTE',
  active: true,
};

export default function Users() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState<Page<User>>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User>();
  const [form, setForm] = useState<Form>(initialForm);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [saving, setSaving] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const load = () => {
    setError('');
    api
      .get('/users', {
        params: {
          size: 100,
          text: deferredSearch || undefined,
          role: roleFilter || undefined,
          active:
            statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        },
      })
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(() => {
    load();
  }, [deferredSearch, roleFilter, statusFilter]);

  const resetDialog = () => {
    setOpen(false);
    setEditing(undefined);
    setForm(initialForm);
    setSaving(false);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      if (editing) {
        await api.put(`/users/${editing.id}`, { ...form, password: form.password || null });
      } else {
        await api.post('/users', form);
      }
      resetDialog();
      load();
      setFeedback({
        open: true,
        severity: 'success',
        message: editing ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
      });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  const toggleAccess = async (user: User) => {
    try {
      if (user.active) {
        await api.put(`/users/${user.id}`, {
          name: user.name,
          email: user.email,
          role: user.role,
          active: false,
          password: null,
        });
        setFeedback({
          open: true,
          severity: 'success',
          message: `Acesso de ${user.name} bloqueado.`,
        });
      } else {
        await api.put(`/users/${user.id}`, {
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
          password: null,
        });
        setFeedback({
          open: true,
          severity: 'success',
          message: `Acesso de ${user.name} reativado.`,
        });
      }
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Painel de gestão"
        breadcrumb="Administração / Painel de gestão"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setForm(initialForm);
              setEditing(undefined);
              setOpen(true);
            }}
          >
            Novo acesso
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6, lg: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Perfil</InputLabel>
                <Select
                  label="Perfil"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as Role | '')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Acesso</InputLabel>
                <Select
                  label="Acesso"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                  }
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="ACTIVE">Ativos</MenuItem>
                  <MenuItem value="INACTIVE">Bloqueados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3, lg: 2 }}>
              <Button
                fullWidth
                color="inherit"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('ALL');
                }}
              >
                Limpar filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {!data ? (
            <Loading label="Carregando usuários..." />
          ) : data.content.length === 0 ? (
            <EmptyState
              title="Nenhum usuário encontrado"
              description="Tente ajustar a busca ou os filtros para localizar o perfil desejado."
            />
          ) : isMobile ? (
            <Stack spacing={1.5}>
              {data.content.map((user) => (
                <Card key={user.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                        <Typography fontWeight={800}>{user.name}</Typography>
                        <AccessBadge active={user.active} />
                      </Box>
                      <Typography color="text.secondary">{user.email}</Typography>
                      <RoleBadge value={user.role} />
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={() => {
                            setEditing(user);
                            setForm({
                              name: user.name,
                              email: user.email,
                              password: '',
                              role: user.role,
                              active: user.active,
                            });
                            setOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color={user.active ? 'warning' : 'success'}
                          startIcon={<LockResetOutlined />}
                          onClick={() => toggleAccess(user)}
                        >
                          {user.active ? 'Bloquear' : 'Ativar'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.content.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge value={user.role} />
                      </TableCell>
                      <TableCell>
                        <AccessBadge active={user.active} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar usuário">
                          <IconButton
                            onClick={() => {
                              setEditing(user);
                              setForm({
                                name: user.name,
                                email: user.email,
                                password: '',
                                role: user.role,
                                active: user.active,
                              });
                              setOpen(true);
                            }}
                          >
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.active ? 'Bloquear acesso' : 'Ativar acesso'}>
                          <IconButton onClick={() => toggleAccess(user)}>
                            <LockResetOutlined />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={saving ? undefined : resetDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar acesso' : 'Novo acesso'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nome"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <TextField
              fullWidth
              label={editing ? 'Nova senha (opcional)' : 'Senha'}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              helperText={editing ? 'Preencha apenas se quiser redefinir a senha.' : 'Mínimo de 8 caracteres.'}
            />
            <FormControl fullWidth>
              <InputLabel>Perfil</InputLabel>
              <Select
                label="Perfil"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editing && (
              <FormControl fullWidth>
                <InputLabel>Acesso</InputLabel>
                <Select
                  label="Acesso"
                  value={form.active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.value === 'ACTIVE' })
                  }
                >
                  <MenuItem value="ACTIVE">Ativo</MenuItem>
                  <MenuItem value="INACTIVE">Bloqueado</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={resetDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!form.name || !form.email || (!editing && form.password.length < 8) || saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppSnackbar
        feedback={feedback}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
