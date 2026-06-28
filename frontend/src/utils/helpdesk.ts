import type {
  ActivityEventType,
  Category,
  HistoryEventType,
  Priority,
  Role,
  SlaStatus,
  Status,
  Ticket,
} from '../types';

export const STATUS_LABELS: Record<Status, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  CANCELADO: 'Cancelado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  REDE: 'Rede',
  IMPRESSORA: 'Impressora',
  ACESSO: 'Acesso',
  BANCO_DE_DADOS: 'Banco de Dados',
  INFRAESTRUTURA: 'Infraestrutura',
  OUTROS: 'Outros',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  TECNICO: 'Técnico',
  CLIENTE: 'Cliente',
};

export const SLA_LABELS: Record<SlaStatus, string> = {
  DENTRO_DO_PRAZO: 'Dentro do prazo',
  PROXIMO_DO_VENCIMENTO: 'Próximo do SLA',
  VENCIDO: 'Vencido',
};

export const ACTIVITY_LABELS: Record<ActivityEventType, string> = {
  CHAMADO_CRIADO: 'Chamado criado',
  CHAMADO_EDITADO: 'Chamado editado',
  ANALISTA_ATRIBUIDO: 'Analista atribuído',
  STATUS_ALTERADO: 'Status alterado',
  PRIORIDADE_ALTERADA: 'Prioridade alterada',
  CATEGORIA_ALTERADA: 'Categoria alterada',
  COMENTARIO_ADICIONADO: 'Comentário adicionado',
  COMENTARIO_EDITADO: 'Comentário editado',
  COMENTARIO_REMOVIDO: 'Comentário removido',
  ANEXO_ENVIADO: 'Anexo enviado',
  CHAMADO_REABERTO: 'Chamado reaberto',
  CHAMADO_RESOLVIDO: 'Chamado resolvido',
  CHAMADO_CANCELADO: 'Chamado cancelado',
  USUARIO_CRIADO: 'Usuário criado',
  USUARIO_EDITADO: 'Usuário editado',
  USUARIO_ATIVADO: 'Usuário ativado',
  USUARIO_DESATIVADO: 'Usuário desativado',
  LOGIN_REALIZADO: 'Login realizado',
  LOGOUT_REALIZADO: 'Logout realizado',
  SENHA_REDEFINIDA: 'Senha redefinida',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as Category,
  label,
}));

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as Status,
  label,
}));

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: value as Priority,
  label,
}));

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as Role,
  label,
}));

export function formatDateTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-BR', { dateStyle: 'short' }) : '—';
}

export function formatLocalCalendarDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
) {
  if (!value) {
    return '—';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', options).format(new Date(year, month - 1, day));
  }
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(value));
}

export function formatMinutes(minutes?: number | null) {
  if (minutes == null || Number.isNaN(minutes)) {
    return 'Sem dados';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const remainingMinutes = minutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}min`;
  }
  return `${hours}h`;
}

export function formatSignedMinutes(minutes?: number | null) {
  if (minutes == null || Number.isNaN(minutes)) {
    return 'Sem dados';
  }
  const prefix = minutes < 0 ? 'Atrasado ' : '';
  return `${prefix}${formatMinutes(Math.abs(minutes))}`;
}

export function formatBytes(bytes?: number | null) {
  if (bytes == null || Number.isNaN(bytes)) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function percent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

export function getInitials(name?: string) {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function historyLabel(eventType: HistoryEventType) {
  const labels: Record<HistoryEventType, string> = {
    CRIACAO: 'Chamado criado',
    ALTERACAO_STATUS: 'Status atualizado',
    ALTERACAO_PRIORIDADE: 'Prioridade alterada',
    ALTERACAO_CATEGORIA: 'Categoria alterada',
    ATRIBUICAO_TECNICO: 'Analista atribuído',
    ATUALIZACAO_DADOS: 'Dados atualizados',
    COMENTARIO: 'Comentário adicionado',
    COMENTARIO_REMOVIDO: 'Comentário removido',
    ANEXO: 'Anexo enviado',
    REABERTURA: 'Chamado reaberto',
    RESOLUCAO: 'Chamado resolvido',
    CANCELAMENTO: 'Chamado cancelado',
  };
  return labels[eventType];
}

export function getAvailableStatusOptions(ticket: Pick<Ticket, 'status'>, role?: Role): Status[] {
  if (!role || role === 'CLIENTE') {
    return [];
  }
  if (ticket.status === 'ABERTO') {
    return ['EM_ANDAMENTO', 'CANCELADO'];
  }
  if (ticket.status === 'EM_ANDAMENTO') {
    return ['RESOLVIDO', 'CANCELADO'];
  }
  if (ticket.status === 'RESOLVIDO') {
    return ['EM_ANDAMENTO'];
  }
  return [];
}
