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
          minHeight: { xs: 218, sm: 238 },
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

  const orderedItems = [...items].sort(
    (a, b) => b.productivityPercent - a.productivityPercent || b.resolved - a.resolved || b.assigned - a.assigned
  );

  return (
    <Stack
      spacing={1.05}
      sx={{
        maxHeight: { xs: 360, lg: 300 },
        overflowY: 'auto',
        overflowX: 'hidden',
        pr: 0.4,
      }}
    >
      {orderedItems.map((item, index) => (
        <Box
          key={item.technician}
          sx={{
            p: 1.25,
            borderRadius: 2.4,
            border: '1px solid',
            borderColor: index === 0 ? 'rgba(23, 105, 210, 0.2)' : 'divider',
            bgcolor: index === 0 ? 'rgba(23, 105, 210, 0.035)' : 'rgba(255,255,255,0.72)',
            transition: 'transform .18s ease, box-shadow .18s ease',
            animation: `dashboardEnter .45s ease ${index * 0.05}s both`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 14px 30px rgba(20, 34, 60, 0.08)',
            },
          }}
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#e9f2ff', color: '#1769d2', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {getInitials(item.technician)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
                  <Typography fontWeight={800} fontSize={13.5} noWrap>
                    {item.technician}
                  </Typography>
                  {index === 0 && (
                    <Box
                      component="span"
                      sx={{
                        px: 0.7,
                        py: 0.18,
                        borderRadius: 999,
                        bgcolor: 'rgba(27, 152, 80, 0.1)',
                        color: '#148448',
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                      }}
                    >
                      Top
                    </Box>
                  )}
                </Stack>
                <Tooltip title="Índice baseado em chamados resolvidos e em andamento dentro da fila atribuída.">
                  <Typography fontWeight={900} color="primary.main" fontSize={13.5} sx={{ minWidth: 42, textAlign: 'right' }}>
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
                  mt: 0.85,
                  bgcolor: 'rgba(23, 32, 51, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    bgcolor: item.productivityPercent >= 70 ? '#1b9850' : item.productivityPercent >= 35 ? '#f0a51c' : '#d94b4b',
                  },
                }}
              />
              <Stack direction="row" columnGap={1.1} rowGap={0.35} flexWrap="wrap" mt={0.75}>
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
          { label: 'Meus chamados', value: data.total, icon: <ConfirmationNumberOutlined />, tone: '#172033', hint: 'Volume total registrado por você.' },
          { label: 'Abertos', value: data.open, icon: <TodayOutlined />, tone: '#1769d2', hint: 'Solicitações aguardando atendimento.' },
          { label: 'Em andamento', value: data.inProgress, icon: <TrendingUpOutlined />, tone: '#f0a51c', hint: 'Demandas em acompanhamento técnico.' },
          { label: 'Resolvidos', value: data.resolved, icon: <TaskAlt />, tone: '#1b9850', hint: 'Atendimentos concluídos.' },
          { label: 'Cancelados', value: data.canceled, icon: <CancelOutlined />, tone: '#d94b4b', hint: 'Solicitações encerradas sem resolução.' },
          { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814', hint: 'Chamados que exigem acompanhamento.' },
        ]
      : user?.role === 'TECNICO'
        ? [
            { label: 'Atribuídos a mim', value: data.total, icon: <AssignmentIndOutlined />, tone: '#172033', hint: 'Fila sob sua responsabilidade.' },
            { label: 'Abertos', value: data.open, icon: <TodayOutlined />, tone: '#1769d2', hint: 'Aguardando início do atendimento.' },
            { label: 'Em andamento', value: data.inProgress, icon: <TrendingUpOutlined />, tone: '#f0a51c', hint: 'Chamados atualmente em execução.' },
            { label: 'Resolvidos', value: data.resolved, icon: <TaskAlt />, tone: '#1b9850', hint: 'Total concluído na sua fila.' },
            { label: 'Vencidos pelo SLA', value: data.overdueSla, icon: <ReportProblemOutlined />, tone: '#d94b4b', hint: 'Exigem ação imediata.' },
            { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814', hint: 'Em risco de atraso.' },
            { label: 'Resolvidos hoje', value: data.resolvedToday, icon: <TaskAlt />, tone: '#1b9850', hint: 'Finalizados nas últimas 24h.' },
            { label: 'Produtividade da semana', value: data.resolvedThisWeek, icon: <TrendingUpOutlined />, tone: '#365ec7', hint: 'Conclusões nos últimos 7 dias.' },
            { label: 'Tempo médio', value: formatMinutes(data.averageResolutionMinutes), icon: <AccessTimeRounded />, tone: '#1b9850', hint: 'Média dos chamados concluídos.' },
          ]
        : [
            { label: 'Total de chamados', value: data.total, icon: <ConfirmationNumberOutlined />, tone: '#172033', hint: 'Volume total registrado.' },
            { label: 'Criados hoje', value: data.createdToday, icon: <TodayOutlined />, tone: '#1769d2', hint: 'Novas demandas abertas hoje.' },
            { label: 'Resolvidos hoje', value: data.resolvedToday, icon: <TaskAlt />, tone: '#1b9850', hint: 'Finalizados nas últimas 24h.' },
            { label: 'Vencidos pelo SLA', value: data.overdueSla, icon: <ReportProblemOutlined />, tone: '#d94b4b', hint: 'Exigem atenção imediata.' },
            { label: 'Próximos do SLA', value: data.nearDueSla, icon: <WarningAmberOutlined />, tone: '#d67814', hint: 'Em risco de atraso.' },
            { label: 'Dentro do SLA', value: data.withinSla, icon: <TaskAlt />, tone: '#1b9850', hint: 'Dentro do prazo combinado.' },
            { label: 'Chamados da semana', value: data.createdThisWeek, icon: <TrendingUpOutlined />, tone: '#365ec7', hint: 'Movimento dos últimos 7 dias.' },
            { label: 'Tempo médio de resolução', value: formatMinutes(data.averageResolutionMinutes), icon: <AccessTimeRounded />, tone: '#1b9850', hint: 'Média dos chamados concluídos.' },
          ];

  const categoryRanking: RankingItem[] = Object.entries(data.byCategory).map(([label, total]) => ({
    label: CATEGORY_LABELS[label as keyof typeof CATEGORY_LABELS],
    total,
  }));
  const recentTicketsPreview = data.recentTickets.slice(0, isMobile ? 5 : 6);
  const recentCommentsPreview = data.recentComments.slice(0, 5);
  const operationalActivities = data.recentActivities.filter(
    (activity) => activity.type !== 'LOGIN_REALIZADO' && activity.type !== 'LOGOUT_REALIZADO'
  );
  const recentActivitiesPreview = (operationalActivities.length ? operationalActivities : data.recentActivities).slice(0, 5);

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
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%', animation: `dashboardEnter .45s ease ${index * 0.05}s both` }}>
              <CardContent sx={{ minHeight: 142, p: { xs: 2, sm: 2.25 }, '&:last-child': { pb: { xs: 2, sm: 2.25 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: item.tone, mt: 1 }}>
                      {item.value}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12} mt={0.8}>
                      {item.hint}
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

      <Grid container spacing={2} mb={2} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ maxHeight: { xs: 340, md: 360, lg: 378 }, overflow: 'hidden' }}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2, sm: 2.45 },
                '&:last-child': { pb: { xs: 2, sm: 2.45 } },
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
                minHeight: { xs: 308, lg: 330 },
                maxHeight: { xs: 430, lg: 420 },
                overflow: 'hidden',
              }}
            >
              <CardContent
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 2, sm: 2.35 },
                  '&:last-child': { pb: { xs: 2, sm: 2.35 } },
                }}
              >
                <Box sx={{ mb: 1.4 }}>
                  <Typography fontWeight={700}>
                    {user?.role === 'TECNICO' ? 'Produtividade da semana' : 'Produtividade por técnico'}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12.5}>
                    Ranking operacional por fila atribuída e resoluções.
                  </Typography>
                </Box>
                <TechnicianProductivityPanel items={data.technicianProductivity ?? []} />
              </CardContent>
            </Card>

            <Card sx={{ maxHeight: { xs: 330, lg: 300 }, overflow: 'hidden' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.35 }, '&:last-child': { pb: { xs: 2, sm: 2.35 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', mb: 1.4 }}>
                  <Box>
                    <Typography fontWeight={700}>
                      Chamados por categoria
                    </Typography>
                    <Typography color="text.secondary" fontSize={12.5}>
                      Categorias com maior volume.
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => navigate('/tickets')}>
                    Ver todas
                  </Button>
                </Box>
                <RankingBars items={categoryRanking} label="categoria" maxItems={5} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography fontWeight={700}>
                    {user?.role === 'TECNICO' ? 'Meus chamados' : user?.role === 'CLIENTE' ? 'Últimos chamados' : 'Últimos chamados atualizados'}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12.5}>
                    Chamados com movimentação mais recente.
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/tickets')}>
                  Ver todos os chamados
                </Button>
              </Box>

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
                  {recentTicketsPreview.map((ticket) => (
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
                    <TableHead
                      sx={{
                        '& .MuiTableCell-root': {
                          color: 'text.secondary',
                          fontSize: 11.5,
                          fontWeight: 800,
                          letterSpacing: 0.3,
                          textTransform: 'uppercase',
                          borderBottomColor: '#e6edf5',
                        },
                      }}
                    >
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
                      {recentTicketsPreview.map((ticket) => (
                        <TableRow
                          hover
                          key={ticket.id}
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(23, 105, 210, 0.045)',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main', whiteSpace: 'nowrap' }}>#{ticket.id}</TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Tooltip title={ticket.title} arrow>
                              <Typography fontWeight={700} noWrap>
                                {ticket.title}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusBadge value={ticket.status} /></TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}><PriorityBadge value={ticket.priority} /></TableCell>
                          <TableCell>
                            <Stack spacing={0.4}>
                              <SlaBadge value={ticket.slaStatus} />
                              <Typography color="text.secondary" fontSize={12}>
                                {formatSignedMinutes(ticket.slaMinutesRemaining)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 160 }}>
                            <Typography color="text.secondary" fontSize={13} noWrap>
                              {ticket.technician?.name ?? 'Não atribuído'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(ticket.updatedAt)}</TableCell>
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
            <Card sx={{ maxHeight: 392, overflow: 'hidden' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography fontWeight={700}>
                    Últimos comentários recebidos
                  </Typography>
                  <Typography color="text.secondary" fontSize={12.5}>
                    Interações recentes nos chamados.
                  </Typography>
                </Box>
                {data.recentComments.length === 0 ? (
                  <EmptyState compact title="Sem comentários recentes" description="Novas interações aparecerão aqui." />
                ) : (
                  <>
                    <Stack spacing={1} sx={{ maxHeight: { xs: 280, xl: 262 }, overflowY: 'auto', pr: 0.4 }}>
                      {recentCommentsPreview.map((comment) => (
                        <Box
                          key={comment.id}
                          onClick={() => navigate(`/tickets/${comment.ticketId}`)}
                          sx={{
                            p: 1.15,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              borderColor: 'primary.light',
                              bgcolor: 'rgba(23, 105, 210, 0.035)',
                              boxShadow: '0 10px 22px rgba(20, 34, 60, 0.07)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#e9f2ff', color: '#1769d2', fontSize: 12, fontWeight: 800 }}>
                              {getInitials(comment.author.name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography fontWeight={700} fontSize={13.2} noWrap>{comment.author.name}</Typography>
                              <Typography color="text.secondary" fontSize={12.5} noWrap>
                                {comment.text}
                              </Typography>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mt={0.45}>
                                <Typography color="text.secondary" fontSize={11.5} noWrap>
                                  #{comment.ticketId} · {formatDateTime(comment.createdAt)}
                                </Typography>
                                <Button size="small" sx={{ minHeight: 28, px: 1 }} onClick={(event) => { event.stopPropagation(); navigate(`/tickets/${comment.ticketId}`); }}>
                                  Abrir
                                </Button>
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                    <Button size="small" sx={{ alignSelf: 'flex-start', mt: 1 }} onClick={() => navigate('/activities')}>
                      Ver todos
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card sx={{ maxHeight: 392, overflow: 'hidden' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography fontWeight={700}>
                    Últimas alterações
                  </Typography>
                  <Typography color="text.secondary" fontSize={12.5}>
                    Eventos operacionais mais relevantes.
                  </Typography>
                </Box>
                {recentActivitiesPreview.length === 0 ? (
                  <EmptyState compact title="Sem atividades recentes" description="A timeline global será atualizada automaticamente." />
                ) : (
                  <>
                    <Stack spacing={1} sx={{ maxHeight: { xs: 280, xl: 262 }, overflowY: 'auto', pr: 0.4 }}>
                      {recentActivitiesPreview.map((activity) => (
                        <Box
                          key={activity.id}
                          onClick={() => activity.ticket && navigate(`/tickets/${activity.ticket.id}`)}
                          sx={{
                            p: 1.12,
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
                          <Typography fontWeight={800} fontSize={13.2} noWrap>{ACTIVITY_LABELS[activity.type] ?? activity.title}</Typography>
                          <Typography color="text.secondary" fontSize={12.5} noWrap>
                            {activity.description}
                          </Typography>
                          <Typography color="text.secondary" fontSize={11.5} noWrap>
                            {formatDateTime(activity.createdAt)}
                            {activity.actor ? ` · ${activity.actor.name}` : ''}
                            {activity.ticket ? ` · chamado #${activity.ticket.id}` : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Button size="small" sx={{ alignSelf: 'flex-start', mt: 1 }} onClick={() => navigate('/activities')}>
                      Ver todos
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
