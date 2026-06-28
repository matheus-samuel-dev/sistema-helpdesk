import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { RoleBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import type { Activity, ActivityEventType, Page, Role } from '../types';
import { ACTIVITY_LABELS, ROLE_OPTIONS, formatDateTime, getInitials } from '../utils/helpdesk';

const activityOptions = Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({
  value: value as ActivityEventType,
  label,
}));

export default function Activities() {
  const navigate = useNavigate();
  const [data, setData] = useState<Page<Activity>>();
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [type, setType] = useState<ActivityEventType | ''>('');
  const [role, setRole] = useState<Role | ''>('');
  const [ticketId, setTicketId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const deferredText = useDeferredValue(text);

  const groupedActivities = useMemo(() => {
    const items = data?.content ?? [];
    return items.reduce<Array<{ date: string; items: Activity[] }>>((groups, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'full' });
      const current = groups.find((group) => group.date === date);
      if (current) {
        current.items.push(activity);
      } else {
        groups.push({ date, items: [activity] });
      }
      return groups;
    }, []);
  }, [data?.content]);

  const clearFilters = () => {
    setText('');
    setType('');
    setRole('');
    setTicketId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const activityColor = (activityType: ActivityEventType) => {
    if (activityType.includes('CANCELADO') || activityType.includes('REMOVIDO')) {
      return '#d94b4b';
    }
    if (activityType.includes('RESOLVIDO') || activityType.includes('CRIADO')) {
      return '#1b9850';
    }
    if (activityType.includes('COMENTARIO') || activityType.includes('ANEXO')) {
      return '#1769d2';
    }
    if (activityType.includes('PRIORIDADE') || activityType.includes('STATUS')) {
      return '#f0a51c';
    }
    return '#365ec7';
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setError('');
      api
        .get('/activities', {
          params: {
            page: page - 1,
            size: 10,
            sort: 'createdAt,desc',
            text: deferredText || undefined,
            type: type || undefined,
            role: role || undefined,
            ticketId: ticketId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        })
        .then((response) => setData(response.data))
        .catch((err) => setError(errorMessage(err)));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [deferredText, endDate, page, role, startDate, ticketId, type]);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Central de Atividades</Typography>
        <Typography color="text.secondary">
          Acompanhe os eventos importantes do atendimento com filtros, histórico e rastreabilidade por perfil.
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                value={text}
                onChange={(event) => {
                  setPage(1);
                  setText(event.target.value);
                }}
                placeholder="Pesquisar atividade, autor ou chamado"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1.8 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={type}
                  onChange={(event) => {
                    setPage(1);
                    setType(event.target.value as ActivityEventType | '');
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {activityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1.8 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Perfil</InputLabel>
                <Select
                  label="Perfil"
                  value={role}
                  onChange={(event) => {
                    setPage(1);
                    setRole(event.target.value as Role | '');
                  }}
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
            <Grid size={{ xs: 6, md: 1.2 }}>
              <TextField
                fullWidth
                size="small"
                label="Chamado"
                value={ticketId}
                onChange={(event) => {
                  setPage(1);
                  setTicketId(event.target.value.replace(/\D/g, ''));
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 1.2 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Inicial"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(event) => {
                  setPage(1);
                  setStartDate(event.target.value);
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 1.2 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Final"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(event) => {
                  setPage(1);
                  setEndDate(event.target.value);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1.8 }}>
              <Button fullWidth color="inherit" onClick={clearFilters}>
                Limpar
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
            <Loading label="Carregando atividades..." />
          ) : data.content.length === 0 ? (
            <EmptyState
              title="Nenhuma atividade encontrada"
              description="As movimentações relevantes do sistema aparecerão aqui conforme a operação acontecer."
            />
          ) : (
            <Stack spacing={0}>
              {groupedActivities.map((group) => (
                <Box key={group.date} sx={{ mb: 2 }}>
                  <Typography
                    fontSize={11}
                    fontWeight={900}
                    color="text.secondary"
                    textTransform="uppercase"
                    letterSpacing={0.8}
                    sx={{ mb: 1.5 }}
                  >
                    {group.date}
                  </Typography>

                  {group.items.map((activity, index) => {
                    const color = activityColor(activity.type);
                    return (
                      <Box key={activity.id} sx={{ display: 'flex', gap: 1.6, minHeight: 106 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: `${color}16`, color }}>
                            <TimelineOutlined />
                          </Avatar>
                          {index < group.items.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: '#dde5ef', mt: 1 }} />}
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            pb: 2,
                            p: 1.4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'rgba(255,255,255,0.62)',
                            cursor: activity.ticket ? 'pointer' : 'default',
                            transition: 'transform .18s ease, box-shadow .18s ease',
                            '&:hover': activity.ticket
                              ? { transform: 'translateY(-2px)', boxShadow: '0 14px 28px rgba(20, 34, 60, 0.08)' }
                              : undefined,
                          }}
                          onClick={() => activity.ticket && navigate(`/tickets/${activity.ticket.id}`)}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontWeight={800}>{ACTIVITY_LABELS[activity.type] ?? activity.title}</Typography>
                            {activity.actor?.role && <RoleBadge value={activity.actor.role} />}
                            {activity.ticket && (
                              <Typography
                                component="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/tickets/${activity.ticket?.id}`);
                                }}
                                sx={{ border: 0, bgcolor: 'transparent', color: 'primary.main', fontWeight: 800, cursor: 'pointer' }}
                              >
                                #{activity.ticket.id}
                              </Typography>
                            )}
                          </Stack>
                          <Typography color="text.secondary" fontSize={13} mt={0.4}>
                            {activity.description}
                          </Typography>
                          <Typography color="text.secondary" fontSize={12} mt={0.8}>
                            {formatDateTime(activity.createdAt)} · {activity.actor ? `${activity.actor.name} (${getInitials(activity.actor.name)})` : 'Sistema'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <Typography color="text.secondary" fontSize={13}>
                  {data.totalElements} atividade(s)
                </Typography>
                <Pagination count={Math.max(data.totalPages, 1)} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </>
  );
}
