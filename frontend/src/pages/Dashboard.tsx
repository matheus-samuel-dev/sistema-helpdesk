import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import Add from '@mui/icons-material/Add';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import TaskAlt from '@mui/icons-material/TaskAlt';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { CategoryBadge, PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import {
  DailyVolumeChart,
  PriorityBarChart,
  RankingBars,
  StatusDonutChart,
} from '../components/DashboardCharts';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import type { Dashboard as DashboardData, RankingItem, TechnicianProductivity } from '../types';
import { ACTIVITY_LABELS, CATEGORY_LABELS, formatDateTime, formatMinutes, formatSignedMinutes, getInitials } from '../utils/helpdesk';

type Metric = {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: string;
  hint?: string;
};

function TechnicianProductivityPanel({ items }: { items: TechnicianProductivity[] }) {
  if (!items.length) {
    return (
      <Box
        sx={{
          minHeight: { xs: 260, sm: 300 },
          display: 'flex',
          alignItems: 'stretch',
          '& > *': {
            flex: 1,
          },
        }}
      >
        <EmptyState
          compact
          icon={<AssignmentIndOutlined sx={{ fontSize: 34 }} />}
          title="Sem dados de produtividade"
          description="Assim que chamados forem atribuídos ou resolvidos, os indicadores por técnico aparecerão aqui."
        />
      </Box>
    );
  }

  return (
    <Stack
      spacing={1.4}
      sx={{
        maxHeight: { lg: 520 },
        overflowY: 'auto',
        overflowX: 'hidden',
        pr: { lg: 0.5 },
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.technician}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255,255,255,0.68)',
            transition: 'transform .18s ease, box-shadow .18s ease',
            animation: `dashboardEnter .45s ease ${index * 0.05}s both`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 14px 30px rgba(20, 34, 60, 0.08)',
            },
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ bgcolor: '#e9f2ff', color: '#1769d2', fontWeight: 800, flexShrink: 0 }}>
              {getInitials(item.technician)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography fontWeight={800} noWrap>
                  {item.technician}
                </Typography>
                <Tooltip title="Índice baseado em chamados resolvidos e em andamento dentro da fila atribuída.">
                  <Typography fontWeight={900} color="primary.main">
                    {item.productivityPercent}%
                  </Typography>
                </Tooltip>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={item.productivityPercent}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  mt: 1,
                  bgcolor: 'rgba(23, 32, 51, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    bgcolor: item.productivityPercent >= 70 ? '#1b9850' : item.productivityPercent >= 35 ? '#f0a51c' : '#d94b4b',
                  },
                }}
              />
              <Stack direction="row" spacing={1.2} flexWrap="wrap" mt={1}>
                <Typography color="text.secondary" fontSize={12}>{item.assigned} atribuídos</Typography>
                <Typography color="text.secondary" fontSize={12}>{item.inProgress} em andamento</Typography>
                <Typography color="text.secondary" fontSize={12}>{item.resolved} resolvidos</Typography>
                <Typography color="text.secondary" fontSize={12}>{item.resolvedThisWeek} na semana</Typography>
                <Typography color="text.secondary" fontSize={12}>média {formatMinutes(item.averageResolutionMinutes)}</Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    api
      .get('/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (!data) {
    return error ? <Alert severity="error">{error}</Alert> : <Loading label="Carregando dashboard..." />;
  }

  const title =
    user?.role === 'TECNICO'
      ? 'Dashboard do técnico'
      : user?.role === 'CLIENTE'
        ? 'Meu portal de chamados'
        : 'Central de operações';

  const breadcrumb =
    user?.role === 'TECNICO'
      ? 'Dashboard / Técnico'
      : user?.role === 'CLIENTE'
        ? 'Dashboard / Meu portal'
        : 'Dashboard / Central de operações';

  const metrics: Metric[] =
    user?.role === 'CLIENTE'
      ? [
          { label: 'Meus chamados', value: data.total, icon: <ConfirmationNumberOutlined />, tone: '#172033' },
          { label: 'Abertos', value: data.open, icon: <TodayOutlined />, tone: '#1769d2' },
          { label: 'Em andamento', value: data.inProgress, icon: <TrendingUpOutlined />, tone: '#f0a51c' },
          { label: 'Resolvidos', value: data.resolved, icon: <TaskAlt />, tone: '#1b9850' },
          { label: 'Cancelados', value: data.canceled, icon: <CancelOutlined />, tone: '#d94b4b' },
          { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814' },
        ]
      : user?.role === 'TECNICO'
        ? [
            { label: 'Atribuídos a mim', value: data.total, icon: <AssignmentIndOutlined />, tone: '#172033' },
            { label: 'Abertos', value: data.open, icon: <TodayOutlined />, tone: '#1769d2' },
            { label: 'Em andamento', value: data.inProgress, icon: <TrendingUpOutlined />, tone: '#f0a51c' },
            { label: 'Resolvidos', value: data.resolved, icon: <TaskAlt />, tone: '#1b9850' },
            { label: 'Vencidos pelo SLA', value: data.overdueSla, icon: <ReportProblemOutlined />, tone: '#d94b4b' },
            { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814' },
            { label: 'Resolvidos hoje', value: data.resolvedToday, icon: <TaskAlt />, tone: '#1b9850' },
            { label: 'Produtividade da semana', value: data.resolvedThisWeek, icon: <TrendingUpOutlined />, tone: '#365ec7' },
            { label: 'Tempo médio', value: formatMinutes(data.averageResolutionMinutes), icon: <AccessTimeRounded />, tone: '#1b9850' },
          ]
        : [
            { label: 'Total de chamados', value: data.total, icon: <ConfirmationNumberOutlined />, tone: '#172033' },
            { label: 'Criados hoje', value: data.createdToday, icon: <TodayOutlined />, tone: '#1769d2' },
            { label: 'Resolvidos hoje', value: data.resolvedToday, icon: <TaskAlt />, tone: '#1b9850' },
            { label: 'Vencidos pelo SLA', value: data.overdueSla, icon: <ReportProblemOutlined />, tone: '#d94b4b' },
            { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814' },
            { label: 'Dentro do SLA', value: data.withinSla, icon: <TaskAlt />, tone: '#1b9850' },
            { label: 'Chamados da semana', value: data.createdThisWeek, icon: <TrendingUpOutlined />, tone: '#365ec7' },
            { label: 'Tempo médio de resolução', value: formatMinutes(data.averageResolutionMinutes), icon: <AccessTimeRounded />, tone: '#1b9850' },
          ];

  const categoryRanking: RankingItem[] = Object.entries(data.byCategory).map(([label, total]) => ({
    label: CATEGORY_LABELS[label as keyof typeof CATEGORY_LABELS],
    total,
  }));

  return (
    <>
      <PageHeader
        title={title}
        breadcrumb={breadcrumb}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tickets/new')}>
            Novo chamado
          </Button>
        }
      />

      <Grid container spacing={2} mb={2}>
        {metrics.map((item, index) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ animation: `dashboardEnter .45s ease ${index * 0.05}s both` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box>
                    <Typography color="text.secondary" fontSize={13}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: item.tone, mt: 1 }}>
                      {item.value}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12} mt={0.8}>
                      {item.hint ??
                        (user?.role === 'CLIENTE'
                          ? 'Considerando apenas seus chamados.'
                          : user?.role === 'TECNICO'
                            ? 'Considerando chamados atribuídos a você.'
                            : `${data.createdThisWeek} criado(s) e ${data.resolvedThisWeek} resolvido(s) na semana.`)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: `${item.tone}14`,
                      color: item.tone,
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography fontWeight={700} mb={3}>
                Chamados por status
              </Typography>
              <StatusDonutChart values={data.byStatus} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={700} mb={1}>
                Chamados por prioridade
              </Typography>
              <Typography color="text.secondary" fontSize={13}>
                Distribuição da fila por urgência operacional.
              </Typography>
              <PriorityBarChart values={data.byPriority} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%', maxHeight: { xs: 360, md: 380, lg: 400 }, overflow: 'hidden' }}>
            <CardContent
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2.25, sm: 3 },
                '&:last-child': { pb: { xs: 2.25, sm: 3 } },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 0.5 }}>
                <Box>
                  <Typography fontWeight={700} mb={0.4}>
                    Evolução semanal
                  </Typography>
                  <Typography color="text.secondary" fontSize={12.5}>
                    Criados e resolvidos nos últimos dias.
                  </Typography>
                </Box>
              </Box>
              <DailyVolumeChart values={data.dailyVolume} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Card
              sx={{
                flex: 1,
                minHeight: { xs: 380, lg: 430 },
                overflow: 'hidden',
              }}
            >
              <CardContent
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 2.25, sm: 3 },
                  '&:last-child': { pb: { xs: 2.25, sm: 3 } },
                }}
              >
                <Typography fontWeight={700} mb={2}>
                  {user?.role === 'TECNICO' ? 'Produtividade da semana' : 'Produtividade por técnico'}
                </Typography>
                <TechnicianProductivityPanel items={data.technicianProductivity ?? []} />
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography fontWeight={700} mb={2}>
                  Chamados por categoria
                </Typography>
                <RankingBars items={categoryRanking} label="categoria" />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} mb={2}>
                {user?.role === 'TECNICO' ? 'Meus chamados' : user?.role === 'CLIENTE' ? 'Últimos chamados' : 'Últimos chamados atualizados'}
              </Typography>

              {data.recentTickets.length === 0 ? (
                <EmptyState
                  compact
                  title={user?.role === 'CLIENTE' ? 'Abra seu primeiro chamado' : 'Nenhum chamado recente'}
                  description={user?.role === 'CLIENTE' ? 'Crie uma solicitação para acompanhar o atendimento por aqui.' : 'As movimentações mais recentes aparecerão aqui.'}
                  actionLabel="Novo chamado"
                  onAction={() => navigate('/tickets/new')}
                />
              ) : isMobile ? (
                <Stack spacing={1.5}>
                  {data.recentTickets.map((ticket) => (
                    <Card key={ticket.id} variant="outlined" onClick={() => navigate(`/tickets/${ticket.id}`)} sx={{ cursor: 'pointer' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1.1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography fontWeight={700}>#{ticket.id}</Typography>
                            <StatusBadge value={ticket.status} />
                          </Box>
                          <Typography fontWeight={700}>{ticket.title}</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <PriorityBadge value={ticket.priority} />
                            <CategoryBadge value={ticket.category} />
                            <SlaBadge value={ticket.slaStatus} />
                          </Stack>
                          <Typography color="text.secondary" fontSize={13}>
                            Atualizado em {formatDateTime(ticket.updatedAt)}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Prioridade</TableCell>
                        <TableCell>SLA</TableCell>
                        <TableCell>Responsável</TableCell>
                        <TableCell>Atualizado em</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentTickets.map((ticket) => (
                        <TableRow hover key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} sx={{ cursor: 'pointer' }}>
                          <TableCell>#{ticket.id}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{ticket.title}</TableCell>
                          <TableCell><StatusBadge value={ticket.status} /></TableCell>
                          <TableCell><PriorityBadge value={ticket.priority} /></TableCell>
                          <TableCell>
                            <Stack spacing={0.4}>
                              <SlaBadge value={ticket.slaStatus} />
                              <Typography color="text.secondary" fontSize={12}>
                                {formatSignedMinutes(ticket.slaMinutesRemaining)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{ticket.technician?.name ?? 'Não atribuído'}</TableCell>
                          <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography fontWeight={700} mb={2}>
                  Últimos comentários recebidos
                </Typography>
                {data.recentComments.length === 0 ? (
                  <EmptyState compact title="Sem comentários recentes" description="Novas interações aparecerão aqui." />
                ) : (
                  <Stack spacing={1.4}>
                    {data.recentComments.map((comment) => (
                      <Box
                        key={comment.id}
                        onClick={() => navigate(`/tickets/${comment.ticketId}`)}
                        sx={{
                          p: 1.4,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: 'primary.light',
                            boxShadow: '0 12px 26px rgba(20, 34, 60, 0.08)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="flex-start">
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#e9f2ff', color: '#1769d2', fontSize: 13, fontWeight: 800 }}>
                            {getInitials(comment.author.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={700}>{comment.author.name}</Typography>
                            <Typography color="text.secondary" fontSize={13} noWrap>
                              {comment.text}
                            </Typography>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mt={0.6}>
                              <Typography color="text.secondary" fontSize={12}>
                                #{comment.ticketId} · {formatDateTime(comment.createdAt)}
                              </Typography>
                              <Button size="small" onClick={(event) => { event.stopPropagation(); navigate(`/tickets/${comment.ticketId}`); }}>
                                Abrir
                              </Button>
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography fontWeight={700} mb={2}>
                  Últimas alterações
                </Typography>
                {data.recentActivities.length === 0 ? (
                  <EmptyState compact title="Sem atividades recentes" description="A timeline global será atualizada automaticamente." />
                ) : (
                  <Stack spacing={1.4}>
                    {data.recentActivities.map((activity) => (
                      <Box
                        key={activity.id}
                        onClick={() => activity.ticket && navigate(`/tickets/${activity.ticket.id}`)}
                        sx={{
                          p: 1.35,
                          borderRadius: 2,
                          bgcolor: 'rgba(23, 105, 210, 0.035)',
                          border: '1px solid rgba(23, 105, 210, 0.08)',
                          cursor: activity.ticket ? 'pointer' : 'default',
                          transition: 'background-color .18s ease, transform .18s ease',
                          '&:hover': activity.ticket
                            ? { backgroundColor: 'rgba(23, 105, 210, 0.07)', transform: 'translateY(-1px)' }
                            : undefined,
                        }}
                      >
                        <Typography fontWeight={800}>{ACTIVITY_LABELS[activity.type] ?? activity.title}</Typography>
                        <Typography color="text.secondary" fontSize={13}>
                          {activity.description}
                        </Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {formatDateTime(activity.createdAt)}
                          {activity.actor ? ` · ${activity.actor.name}` : ''}
                          {activity.ticket ? ` · chamado #${activity.ticket.id}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
