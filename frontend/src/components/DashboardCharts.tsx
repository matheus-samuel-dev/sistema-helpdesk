import { Box, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import type { DailyVolume, Priority, RankingItem, Status } from '../types';
import EmptyState from './EmptyState';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatLocalCalendarDate,
  percent,
} from '../utils/helpdesk';

const statusColors: Record<Status, string> = {
  ABERTO: '#1769d2',
  EM_ANDAMENTO: '#f0a51c',
  RESOLVIDO: '#22a365',
  CANCELADO: '#d94b4b',
};

const priorityColors: Record<Priority, string> = {
  BAIXA: '#22a365',
  MEDIA: '#2779d9',
  ALTA: '#f08a24',
  URGENTE: '#d94b4b',
  CRITICA: '#7f1d1d',
};

export function StatusDonutChart({ values }: { values: Record<Status, number> }) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return (
      <EmptyState
        compact
        title="Sem dados para status"
        description="Assim que houver chamados cadastrados, a distribuição por status aparecerá aqui."
      />
    );
  }

  let current = 0;
  const stops = (Object.keys(values) as Status[]).map((key) => {
    const start = current;
    current += percent(values[key], total);
    return `${statusColors[key]} ${start}% ${current}%`;
  });

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
      <Box
        sx={{
          width: 190,
          height: 190,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: `conic-gradient(${stops.join(', ')})`,
          boxShadow: '0 18px 40px rgba(23, 105, 210, 0.14)',
          animation: 'dashboardEnter .7s ease',
        }}
      >
        <Box
          sx={{
            width: 112,
            height: 112,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="h4">{total}</Typography>
            <Typography color="text.secondary" fontSize={12}>
              chamados
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={1.4} sx={{ width: '100%' }}>
        {(Object.keys(values) as Status[]).map((key) => (
          <Tooltip
            key={key}
            title={`${values[key]} chamado(s) • ${percent(values[key], total)}% do total`}
            arrow
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography fontWeight={600}>{STATUS_LABELS[key]}</Typography>
                <Typography color="text.secondary">
                  {values[key]} • {percent(values[key], total)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percent(values[key], total)}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: 'rgba(23, 32, 51, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    bgcolor: statusColors[key],
                  },
                }}
              />
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
}

export function PriorityBarChart({ values }: { values: Record<Priority, number> }) {
  const max = Math.max(...Object.values(values), 0);
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return (
      <EmptyState
        compact
        title="Sem dados por prioridade"
        description="Acompanhe aqui as prioridades assim que os primeiros chamados forem registrados."
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, minHeight: 220, pt: 2 }}>
      {(Object.keys(values) as Priority[]).map((key, index) => {
        const height = max === 0 ? 12 : Math.max(20, (values[key] / max) * 150);
        return (
          <Tooltip
            key={key}
            title={`${values[key]} chamado(s) • ${percent(values[key], total)}%`}
            arrow
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography fontWeight={700}>{values[key]}</Typography>
              <Typography color="text.secondary" fontSize={12} mb={1}>
                {percent(values[key], total)}%
              </Typography>
              <Box
                sx={{
                  height,
                  borderRadius: '18px 18px 6px 6px',
                  bgcolor: priorityColors[key],
                  transition: 'all .45s ease',
                  animation: `dashboardRise .55s ease ${index * 0.08}s both`,
                  boxShadow: `0 10px 20px ${priorityColors[key]}22`,
                }}
              />
              <Typography color="text.secondary" fontSize={12} mt={1}>
                {PRIORITY_LABELS[key]}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export function DailyVolumeChart({ values }: { values: DailyVolume[] }) {
  const max = Math.max(...values.flatMap((item) => [item.created, item.resolved]), 0);

  if (!values.length || max === 0) {
    return (
      <EmptyState
        compact
        title="Sem evolução diária"
        description="Quando o sistema acumular atividade, você verá a evolução diária dos chamados aqui."
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'stretch', minHeight: { xs: 260, md: 320, lg: 360 }, height: '100%', pt: 2 }}>
      {values.map((item, index) => (
        <Box key={item.date} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Tooltip title={`Criados: ${item.created} • Resolvidos: ${item.resolved}`} arrow>
            <Stack
              direction="row"
              spacing={0.6}
              justifyContent="center"
              alignItems="end"
              sx={{ flex: 1, minHeight: 220 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: `${Math.max(6, (item.created / max) * 100)}%`,
                  maxHeight: '100%',
                  borderRadius: 999,
                  bgcolor: '#1769d2',
                  animation: `dashboardRise .45s ease ${index * 0.06}s both`,
                }}
              />
              <Box
                sx={{
                  width: 10,
                  height: `${Math.max(6, (item.resolved / max) * 100)}%`,
                  maxHeight: '100%',
                  borderRadius: 999,
                  bgcolor: '#22a365',
                  animation: `dashboardRise .45s ease ${(index * 0.06) + 0.05}s both`,
                }}
              />
            </Stack>
          </Tooltip>
          <Typography align="center" fontSize={12} color="text.secondary" mt={1}>
            {formatLocalCalendarDate(item.date)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function RankingBars({
  items,
  label,
}: {
  items: RankingItem[];
  label: string;
}) {
  const visibleItems = items.filter((item) => item.total > 0);

  if (!visibleItems.length) {
    return (
      <EmptyState
        compact
        title={`Sem dados de ${label.toLowerCase()}`}
        description={`Assim que houver volume suficiente, o ranking por ${label.toLowerCase()} aparecerá aqui.`}
      />
    );
  }

  const max = Math.max(...visibleItems.map((item) => item.total), 1);

  return (
    <Stack spacing={1.6}>
      {visibleItems.map((item, index) => (
        <Tooltip key={item.label} title={`${item.total} chamado(s)`} arrow>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
              <Typography fontWeight={600} noWrap>
                {item.label}
              </Typography>
              <Typography color="text.secondary">{item.total}</Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 10,
                borderRadius: 999,
                bgcolor: 'rgba(23, 32, 51, 0.08)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${(item.total / max) * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  bgcolor: index % 2 === 0 ? '#1769d2' : '#2fa8ff',
                  animation: `dashboardEnter .55s ease ${index * 0.06}s both`,
                }}
              />
            </Box>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}
