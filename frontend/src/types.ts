export type Role = 'ADMIN' | 'TECNICO' | 'CLIENTE';
export type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CANCELADO';
export type Priority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type Category =
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'REDE'
  | 'IMPRESSORA'
  | 'ACESSO'
  | 'BANCO_DE_DADOS'
  | 'INFRAESTRUTURA'
  | 'OUTROS';

export type SlaStatus = 'DENTRO_DO_PRAZO' | 'PROXIMO_DO_VENCIMENTO' | 'VENCIDO';

export type HistoryEventType =
  | 'CRIACAO'
  | 'ALTERACAO_STATUS'
  | 'ALTERACAO_PRIORIDADE'
  | 'ALTERACAO_CATEGORIA'
  | 'ATRIBUICAO_TECNICO'
  | 'ATUALIZACAO_DADOS'
  | 'COMENTARIO'
  | 'COMENTARIO_REMOVIDO'
  | 'ANEXO'
  | 'REABERTURA'
  | 'RESOLUCAO'
  | 'CANCELAMENTO';

export type ActivityEventType =
  | 'CHAMADO_CRIADO'
  | 'CHAMADO_EDITADO'
  | 'ANALISTA_ATRIBUIDO'
  | 'STATUS_ALTERADO'
  | 'PRIORIDADE_ALTERADA'
  | 'CATEGORIA_ALTERADA'
  | 'COMENTARIO_ADICIONADO'
  | 'COMENTARIO_EDITADO'
  | 'COMENTARIO_REMOVIDO'
  | 'ANEXO_ENVIADO'
  | 'CHAMADO_REABERTO'
  | 'CHAMADO_RESOLVIDO'
  | 'CHAMADO_CANCELADO'
  | 'USUARIO_CRIADO'
  | 'USUARIO_EDITADO'
  | 'USUARIO_ATIVADO'
  | 'USUARIO_DESATIVADO'
  | 'LOGIN_REALIZADO'
  | 'LOGOUT_REALIZADO'
  | 'SENHA_REDEFINIDA';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  client: User;
  technician?: User;
  status: Status;
  priority: Priority;
  category: Category;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  slaDueAt: string;
  slaStatus: SlaStatus;
  slaMinutesRemaining: number;
  openMinutes: number;
  resolutionMinutes?: number | null;
}

export interface Comment {
  id: number;
  ticketId: number;
  author: User;
  text: string;
  internal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  name: string;
  contentType: string;
  sizeBytes: number;
  author: User;
  createdAt: string;
}

export interface History {
  id: number;
  eventType: HistoryEventType;
  description: string;
  actor: User;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RankingItem {
  label: string;
  total: number;
}

export interface TechnicianProductivity {
  technician: string;
  assigned: number;
  inProgress: number;
  resolved: number;
  resolvedThisWeek: number;
  averageResolutionMinutes?: number | null;
  productivityPercent: number;
}

export interface DailyVolume {
  date: string;
  created: number;
  resolved: number;
}

export interface Activity {
  id: number;
  type: ActivityEventType;
  title: string;
  description: string;
  actor?: User;
  ticket?: Ticket;
  createdAt: string;
}

export interface SearchResult {
  type: 'ticket' | 'user' | 'category' | 'comment' | string;
  label: string;
  description: string;
  targetUrl: string;
}

export interface SearchResponse {
  tickets: SearchResult[];
  users: SearchResult[];
  categories: SearchResult[];
  comments: SearchResult[];
}

export interface Dashboard {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  canceled: number;
  createdToday: number;
  createdThisWeek: number;
  resolvedToday: number;
  resolvedThisWeek: number;
  overdueSla: number;
  nearDueSla: number;
  withinSla: number;
  averageResolutionMinutes?: number | null;
  byStatus: Record<Status, number>;
  byPriority: Record<Priority, number>;
  byCategory: Record<Category, number>;
  byTechnician: RankingItem[];
  byClient: RankingItem[];
  productivityByTechnician: RankingItem[];
  technicianProductivity: TechnicianProductivity[];
  averageResolutionByCategory: RankingItem[];
  dailyVolume: DailyVolume[];
  recentTickets: Ticket[];
  recentComments: Comment[];
  recentActivities: Activity[];
}
