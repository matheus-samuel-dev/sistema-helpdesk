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
  const domainMax = Math.max(4, Math.ceil(max * 1.25));
  const yMarkers = [domainMax, Math.round(domainMax / 2), 0];

  if (!values.length || max === 0) {
    return (
      <Box
        sx={{
          height: { xs: 230, sm: 250, md: 270, lg: 292 },
          maxHeight: { xs: 260, md: 290, lg: 320 },
          display: 'flex',
          alignItems: 'stretch',
          '& > *': { flex: 1 },
        }}
      >
        <EmptyState
          compact
          title="Sem evolução semanal"
          description="Os dados aparecerão conforme novos chamados forem criados e resolvidos."
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: { xs: 230, sm: 250, md: 270, lg: 292 },
        maxHeight: { xs: 260, md: 290, lg: 320 },
        display: 'flex',
        flexDirection: 'column',
        pt: 1.1,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="flex-end"
        mb={1}
        sx={{ minHeight: 24 }}
      >
        {[
          { label: 'Criados', color: '#1769d2' },
          { label: 'Resolvidos', color: '#22a365' },
        ].map((item) => (
          <Stack
            key={item.label}
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: 'rgba(15, 23, 42, 0.035)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
            <Typography color="text.secondary" fontSize={11.5} fontWeight={700}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '30px minmax(0, 1fr)',
          gap: { xs: 0.75, sm: 1 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pt: 0.7,
            pb: 3.25,
          }}
        >
          {yMarkers.map((marker) => (
            <Typography key={marker} color="text.secondary" fontSize={10.5} fontWeight={700}>
              {marker}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            position: 'relative',
            minHeight: 0,
            display: 'flex',
            gap: { xs: 0.8, sm: 1.1, md: 1.35 },
            alignItems: 'stretch',
            borderRadius: 3,
            px: { xs: 0.5, sm: 1.1 },
            pt: 0.7,
            pb: 0.4,
            bgcolor: 'rgba(248, 250, 252, 0.68)',
            border: '1px solid rgba(226, 232, 240, 0.72)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '12px 0 32px',
              background:
                'linear-gradient(to bottom, rgba(15, 23, 42, 0.055) 1px, transparent 1px)',
              backgroundSize: '100% 33.33%',
              pointerEvents: 'none',
            },
          }}
        >
          {values.map((item, index) => {
            const createdHeight = item.created === 0 ? 0 : Math.max(18, (item.created / domainMax) * 100);
            const resolvedHeight = item.resolved === 0 ? 0 : Math.max(18, (item.resolved / domainMax) * 100);
            const showCreatedValue = item.created > 0 && (item.created === max || item.created >= domainMax * 0.35);
            const showResolvedValue = item.resolved > 0 && (item.resolved === max || item.resolved >= domainMax * 0.35);

            return (
              <Box
                key={item.date}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'grid',
                  gridTemplateRows: 'minmax(0, 1fr) 26px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Tooltip
                  title={`${formatLocalCalendarDate(item.date, { weekday: 'short', day: '2-digit', month: '2-digit' })} • Criados: ${item.created} • Resolvidos: ${item.resolved}`}
                  arrow
                >
                  <Stack
                    direction="row"
                    spacing={{ xs: 0.45, sm: 0.65, md: 0.8 }}
                    justifyContent="center"
                    alignItems="end"
                    sx={{ minHeight: 0, height: '100%' }}
                  >
                    {[
                      {
                        value: item.created,
                        height: createdHeight,
                        color: '#1769d2',
                        shadow: 'rgba(23,105,210,0.24)',
                        showValue: showCreatedValue,
                      },
                      {
                        value: item.resolved,
                        height: resolvedHeight,
                        color: '#22a365',
                        shadow: 'rgba(34,163,101,0.24)',
                        showValue: showResolvedValue,
                      },
                    ].map((bar, barIndex) => (
                      <Box
                        key={`${item.date}-${bar.color}`}
                        sx={{
                          width: { xs: 12, sm: 15, md: 18, lg: 20 },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          color="text.secondary"
                          fontSize={10}
                          fontWeight={800}
                          sx={{
                            height: 15,
                            opacity: bar.showValue ? 1 : 0,
                            transform: bar.showValue ? 'translateY(0)' : 'translateY(4px)',
                            transition: 'opacity .2s ease, transform .2s ease',
                          }}
                        >
                          {bar.value}
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: bar.value ? `${Math.min(88, bar.height)}%` : 3,
                            minHeight: bar.value ? 16 : 3,
                            borderRadius: '999px 999px 7px 7px',
                            background: bar.value
                              ? `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}dd 100%)`
                              : 'rgba(148, 163, 184, 0.22)',
                            boxShadow: bar.value ? `0 12px 20px ${bar.shadow}` : 'none',
                            opacity: bar.value ? 1 : 0.42,
                            animation: `dashboardRise .5s ease ${(index * 0.055) + (barIndex * 0.04)}s both`,
                            transition: 'height .35s ease, transform .18s ease, box-shadow .18s ease',
                            '&:hover': bar.value
                              ? {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 16px 28px ${bar.shadow}`,
                                }
                              : undefined,
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Tooltip>
                <Typography align="center" fontSize={{ xs: 10.5, sm: 11 }} color="text.secondary" mt={1} noWrap>
                  {formatLocalCalendarDate(item.date)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
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
