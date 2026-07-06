import { useDeferredValue, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
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
import Search from '@mui/icons-material/Search';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import AppSnackbar, { initialFeedback } from '../components/AppSnackbar';
import { CategoryBadge, PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import TicketStatusDialog from '../components/TicketStatusDialog';
import type { FeedbackState } from '../components/AppSnackbar';
import type { Category, Page, Priority, Role, Status, Ticket, User } from '../types';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  formatDateTime,
  formatMinutes,
  formatSignedMinutes,
  getAvailableStatusOptions,
} from '../utils/helpdesk';

type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export default function Tickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState<Page<Ticket>>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [analystId, setAnalystId] = useState<number | ''>('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sorting, setSorting] = useState('updatedAt:desc');
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [statusDialogTicket, setStatusDialogTicket] = useState<Ticket | null>(null);

  const deferredSearch = useDeferredValue(search);
  const [sortBy, direction] = sorting.split(':');

  useEffect(() => {
    const categoryParam = searchParams.get('category') as Category | null;
    if (!categoryParam) {
      setCategory('');
      return;
    }
    const isValidCategory = CATEGORY_OPTIONS.some((option) => option.value === categoryParam);
    if (isValidCategory) {
      setCategory(categoryParam);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    Promise.all([
      api.get('/users', { params: { role: 'TECNICO', active: true, size: 100 } }),
      api.get('/users', { params: { role: 'CLIENTE', active: true, size: 100 } }),
    ])
      .then(([analystsResponse, clientsResponse]) => {
        setAnalysts(analystsResponse.data.content);
        setClients(clientsResponse.data.content);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  useEffect(() => {
    setError('');
    api
      .get('/tickets', {
        params: {
          page: page - 1,
          size: pageSize,
          text: deferredSearch || undefined,
          status: status || undefined,
          priority: priority || undefined,
          category: category || undefined,
          technicianId: analystId || undefined,
          clientId: clientId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sortBy,
          direction,
        },
      })
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)));
  }, [
    analystId,
    category,
    clientId,
    deferredSearch,
    direction,
    endDate,
    page,
    pageSize,
    priority,
    sortBy,
    startDate,
    status,
  ]);

  const applyPeriod = (value: PeriodFilter) => {
    const today = new Date();
    const format = (date: Date) => date.toISOString().slice(0, 10);

    setPeriod(value);
    setPage(1);

    if (value === 'ALL') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (value === 'CUSTOM') {
      return;
    }

    if (value === 'TODAY') {
      const formatted = format(today);
      setStartDate(formatted);
      setEndDate(formatted);
      return;
    }

    const start = new Date(today);
    start.setDate(today.getDate() - (value === 'WEEK' ? 6 : 29));
    setStartDate(format(start));
    setEndDate(format(today));
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategory('');
    setAnalystId('');
    setClientId('');
    setPage(1);
    setPageSize(10);
    setSorting('updatedAt:desc');
    setPeriod('ALL');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  const refreshTickets = async (message?: string) => {
    const response = await api.get('/tickets', {
      params: {
        page: page - 1,
        size: pageSize,
        text: deferredSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        technicianId: analystId || undefined,
        clientId: clientId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        direction,
      },
    });
    setData(response.data);
    if (message) {
      setFeedback({ open: true, severity: 'success', message });
    }
  };

  return (
    <>
      <PageHeader
        title="Chamados"
        breadcrumb="Atendimento / Chamados"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tickets/new')}>
            Novo chamado
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Pesquise por ID, título, descrição, solicitante ou analista..."
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                aria-label="Pesquisar chamados"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value as Status | '');
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  label="Prioridade"
                  value={priority}
                  onChange={(event) => {
                    setPage(1);
                    setPriority(event.target.value as Priority | '');
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  label="Categoria"
                  value={category}
                  onChange={(event) => {
                    setPage(1);
                    setCategory(event.target.value as Category | '');
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  label="Período"
                  value={period}
                  onChange={(event) => applyPeriod(event.target.value as PeriodFilter)}
                >
                  <MenuItem value="ALL">Todo o período</MenuItem>
                  <MenuItem value="TODAY">Hoje</MenuItem>
                  <MenuItem value="WEEK">Últimos 7 dias</MenuItem>
                  <MenuItem value="MONTH">Últimos 30 dias</MenuItem>
                  <MenuItem value="CUSTOM">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Ordenação</InputLabel>
                <Select
                  label="Ordenação"
                  value={sorting}
                  onChange={(event) => {
                    setPage(1);
                    setSorting(event.target.value);
                  }}
                >
                  <MenuItem value="updatedAt:desc">Mais recentes</MenuItem>
                  <MenuItem value="createdAt:asc">Mais antigos</MenuItem>
                  <MenuItem value="sla:asc">SLA crítico</MenuItem>
                  <MenuItem value="title:asc">Título A-Z</MenuItem>
                  <MenuItem value="title:desc">Título Z-A</MenuItem>
                  <MenuItem value="status:asc">Status</MenuItem>
                  <MenuItem value="priority:desc">Prioridade</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {user?.role === 'ADMIN' && (
              <>
                <Grid size={{ xs: 6, md: 4, lg: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Analista</InputLabel>
                    <Select
                      label="Analista"
                      value={analystId}
                      onChange={(event) => {
                        const value = event.target.value as unknown as number | '';
                        setPage(1);
                        setAnalystId(value === '' ? '' : Number(value));
                      }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {analysts.map((analyst) => (
                        <MenuItem key={analyst.id} value={analyst.id}>
                          {analyst.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 6, md: 4, lg: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Solicitante</InputLabel>
                    <Select
                      label="Solicitante"
                      value={clientId}
                      onChange={(event) => {
                        const value = event.target.value as unknown as number | '';
                        setPage(1);
                        setClientId(value === '' ? '' : Number(value));
                      }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <TextField
                size="small"
                type="date"
                fullWidth
                label="Data inicial"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(event) => {
                  setPage(1);
                  setPeriod('CUSTOM');
                  setStartDate(event.target.value);
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 4, lg: 2 }}>
              <TextField
                size="small"
                type="date"
                fullWidth
                label="Data final"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(event) => {
                  setPage(1);
                  setPeriod('CUSTOM');
                  setEndDate(event.target.value);
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4, lg: 2 }}>
              <Button fullWidth color="inherit" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : !data ? (
            <Loading label="Carregando chamados..." />
          ) : data.content.length === 0 ? (
            <EmptyState
              title="Nenhum chamado encontrado"
              description="Ajuste os filtros ou cadastre um novo chamado para começar a acompanhar a operação."
              actionLabel="Novo chamado"
              onAction={() => navigate('/tickets/new')}
            />
          ) : (
            <>
              {isMobile ? (
                <Stack spacing={1.5}>
                  {data.content.map((ticket) => {
                    const availableStatus = getAvailableStatusOptions(ticket, user?.role as Role | undefined);
                    return (
                      <Card key={ticket.id} variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                              <Typography fontWeight={700}>#{ticket.id}</Typography>
                              <StatusBadge value={ticket.status} />
                            </Box>
                            <Typography fontWeight={800}>{ticket.title}</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <PriorityBadge value={ticket.priority} />
                              <CategoryBadge value={ticket.category} />
                              <SlaBadge value={ticket.slaStatus} />
                            </Stack>
                            <Typography color="text.secondary" fontSize={13}>
                              Solicitante: {ticket.client.name}
                            </Typography>
                            <Typography color="text.secondary" fontSize={13}>
                              Analista: {ticket.technician?.name ?? 'Não atribuído'}
                            </Typography>
                            <Typography color="text.secondary" fontSize={13}>
                              SLA: {formatSignedMinutes(ticket.slaMinutesRemaining)} · aberto há {formatMinutes(ticket.openMinutes)}
                            </Typography>
                            <Typography color="text.secondary" fontSize={13}>
                              Atualizado em {formatDateTime(ticket.updatedAt)}
                            </Typography>
                            <Divider />
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                startIcon={<VisibilityOutlined />}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                              >
                                Visualizar
                              </Button>
                              <Button
                                size="small"
                                startIcon={<EditOutlined />}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="small"
                                startIcon={<SwapHoriz />}
                                disabled={availableStatus.length === 0}
                                onClick={() => setStatusDialogTicket(ticket)}
                              >
                                Status
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Solicitante</TableCell>
                        <TableCell>Analista</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Prioridade</TableCell>
                        <TableCell>SLA</TableCell>
                        <TableCell>Tempo aberto</TableCell>
                        <TableCell>Atualizado em</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.content.map((ticket) => {
                        const availableStatus = getAvailableStatusOptions(
                          ticket,
                          user?.role as Role | undefined
                        );

                        return (
                          <TableRow key={ticket.id} hover>
                            <TableCell>#{ticket.id}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{ticket.title}</TableCell>
                            <TableCell>
                              <CategoryBadge value={ticket.category} />
                            </TableCell>
                            <TableCell>{ticket.client.name}</TableCell>
                            <TableCell>{ticket.technician?.name ?? 'Não atribuído'}</TableCell>
                            <TableCell>
                              <StatusBadge value={ticket.status} />
                            </TableCell>
                            <TableCell>
                              <PriorityBadge value={ticket.priority} />
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.4}>
                                <SlaBadge value={ticket.slaStatus} />
                                <Typography color="text.secondary" fontSize={12}>
                                  {formatSignedMinutes(ticket.slaMinutesRemaining)}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{formatMinutes(ticket.openMinutes)}</TableCell>
                            <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Visualizar">
                                <IconButton
                                  aria-label={`Visualizar chamado ${ticket.id}`}
                                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                                >
                                  <VisibilityOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton
                                  aria-label={`Editar chamado ${ticket.id}`}
                                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                                >
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Alterar status">
                                <span>
                                  <IconButton
                                    aria-label={`Alterar status do chamado ${ticket.id}`}
                                    disabled={availableStatus.length === 0}
                                    onClick={() => setStatusDialogTicket(ticket)}
                                  >
                                    <SwapHoriz />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  mt: 3,
                }}
              >
                <Typography color="text.secondary" fontSize={13}>
                  {data.totalElements} chamado(s) encontrado(s)
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Registros</InputLabel>
                    <Select
                      label="Registros"
                      value={pageSize}
                      onChange={(event) => {
                        setPage(1);
                        setPageSize(Number(event.target.value));
                      }}
                    >
                      {[10, 20, 50, 100].map((size) => (
                        <MenuItem key={size} value={size}>
                          {size} por página
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Pagination
                    count={Math.max(data.totalPages, 1)}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <TicketStatusDialog
        open={!!statusDialogTicket}
        ticket={statusDialogTicket}
        role={user?.role}
        onClose={() => setStatusDialogTicket(null)}
        onUpdated={async (message) => {
          await refreshTickets(message);
        }}
      />

      <AppSnackbar
        feedback={feedback}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
