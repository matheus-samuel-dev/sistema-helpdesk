import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  Activity,
  ActivityEventType,
  Attachment,
  Category,
  Comment,
  Dashboard,
  History,
  HistoryEventType,
  Page,
  Priority,
  Role,
  SearchResponse,
  SlaStatus,
  Status,
  TechnicianProductivity,
  Ticket,
  User,
} from '../types';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../utils/helpdesk';
import { getStoredToken, getStoredUser } from '../utils/authStorage';

export const DEMO_ADMIN_EMAIL = 'admin@helpdesk.com';
export const DEMO_ADMIN_PASSWORD = 'Admin@123';
export const DEMO_TOKEN_PREFIX = 'helpdesk-demo-local';

const DEMO_STORAGE_KEY = 'helpdesk.demo.state.v2';

type DemoHistory = History & { ticketId: number };
type DemoActivity = Omit<Activity, 'ticket'> & { ticketId?: number };

type DemoState = {
  users: User[];
  tickets: Ticket[];
  comments: Comment[];
  history: DemoHistory[];
  attachments: Attachment[];
  activities: DemoActivity[];
  sequences: {
    user: number;
    ticket: number;
    comment: number;
    history: number;
    attachment: number;
    activity: number;
  };
};

const SLA_HOURS: Record<Priority, number> = {
  BAIXA: 72,
  MEDIA: 48,
  ALTA: 24,
  URGENTE: 8,
  CRITICA: 4,
};

const defaultPageSize = 10;

export function isDemoCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD;
}

export function isDemoToken(token?: string | null) {
  return Boolean(token?.startsWith(`${DEMO_TOKEN_PREFIX}.`));
}

export function createDemoSession() {
  const state = ensureDemoState();
  const admin = state.users.find((user) => user.email === DEMO_ADMIN_EMAIL) ?? state.users[0];
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    token: `${DEMO_TOKEN_PREFIX}.${randomId}`,
    user: admin,
  };
}

export function isDemoSession() {
  return isDemoToken(getStoredToken());
}

export async function maybeHandleDemoRequest(config: InternalAxiosRequestConfig) {
  if (!isDemoSession()) {
    return null;
  }
  return handleDemoRequest(config);
}

export function resetDemoDataForTests() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

async function handleDemoRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? 'get').toUpperCase();
  const { path, params } = readRequest(config);
  const state = ensureDemoState();

  if (path === '/auth/logout' && method === 'POST') {
    return respond(null, config, 204, 'No Content');
  }

  if (path === '/dashboard' && method === 'GET') {
    return respond(buildDashboard(state), config);
  }

  if (path === '/search' && method === 'GET') {
    return respond(searchDemo(state, String(getParam(params, 'q') ?? '')), config);
  }

  if (path === '/activities' && method === 'GET') {
    return respond(listActivities(state, params), config);
  }

  if (path === '/users' && method === 'GET') {
    return respond(listUsers(state, params), config);
  }

  if (path === '/users' && method === 'POST') {
    const user = createUser(state, parseBody(config.data));
    saveDemoState(state);
    return respond(user, config, 201, 'Created');
  }

  if (path.startsWith('/users/') && method === 'PUT') {
    const id = Number(path.split('/')[2]);
    const user = updateUser(state, id, parseBody(config.data));
    saveDemoState(state);
    return respond(user, config);
  }

  if (path === '/tickets' && method === 'GET') {
    return respond(listTickets(state, params), config);
  }

  if (path === '/tickets' && method === 'POST') {
    const ticket = createTicket(state, parseBody(config.data));
    saveDemoState(state);
    return respond(ticket, config, 201, 'Created');
  }

  const ticketRoute = parseTicketRoute(path);
  if (ticketRoute) {
    const { ticketId, resource, childId, download } = ticketRoute;
    const ticket = findTicket(state, ticketId);

    if (!resource && method === 'GET') {
      return respond(ticket, config);
    }

    if (!resource && method === 'PATCH') {
      const updated = updateTicket(state, ticketId, parseBody(config.data));
      saveDemoState(state);
      return respond(updated, config);
    }

    if (resource === 'comments' && method === 'GET') {
      return respond(state.comments.filter((comment) => comment.ticketId === ticketId), config);
    }

    if (resource === 'comments' && method === 'POST') {
      const comment = createComment(state, ticket, parseBody(config.data));
      saveDemoState(state);
      return respond(comment, config, 201, 'Created');
    }

    if (resource === 'comments' && childId && method === 'PUT') {
      const comment = updateComment(state, ticket, childId, parseBody(config.data));
      saveDemoState(state);
      return respond(comment, config);
    }

    if (resource === 'comments' && childId && method === 'DELETE') {
      deleteComment(state, ticket, childId);
      saveDemoState(state);
      return respond(null, config, 204, 'No Content');
    }

    if (resource === 'history' && method === 'GET') {
      return respond(
        state.history
          .filter((item) => item.ticketId === ticketId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map(({ ticketId: _ticketId, ...item }) => item),
        config
      );
    }

    if (resource === 'attachments' && method === 'GET' && !childId) {
      return respond(state.attachments.filter((attachment) => attachment.ticketId === ticketId), config);
    }

    if (resource === 'attachments' && method === 'POST') {
      const attachment = createAttachment(state, ticket, config.data);
      saveDemoState(state);
      return respond(attachment, config, 201, 'Created');
    }

    if (resource === 'attachments' && childId && download && method === 'GET') {
      const attachment = state.attachments.find((item) => item.id === childId && item.ticketId === ticketId);
      if (!attachment) {
        return respond({ message: 'Anexo nao encontrado.' }, config, 404, 'Not Found');
      }
      const content = `Arquivo demo: ${attachment.name}`;
      const data = typeof Blob !== 'undefined' ? new Blob([content], { type: attachment.contentType }) : content;
      return respond(data, config);
    }
  }

  return respond({ message: 'Endpoint demo nao implementado.' }, config, 404, 'Not Found');
}

function ensureDemoState() {
  const current = loadDemoState();
  if (current) {
    return current;
  }
  const seeded = seedDemoState();
  saveDemoState(seeded);
  return seeded;
}

function loadDemoState(): DemoState | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

function saveDemoState(state: DemoState) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

function seedDemoState(): DemoState {
  const now = new Date();
  const users: User[] = [
    user(1, 'Administrador HelpDesk', DEMO_ADMIN_EMAIL, 'ADMIN', daysAgo(now, 35)),
    user(2, 'Joao Analista', 'tecnico@helpdesk.com', 'TECNICO', daysAgo(now, 33)),
    user(3, 'Ana Suporte', 'ana.suporte@helpdesk.com', 'TECNICO', daysAgo(now, 31)),
    user(4, 'Bruno Infra', 'bruno.infra@helpdesk.com', 'TECNICO', daysAgo(now, 28)),
    user(5, 'Maria Cliente', 'cliente@helpdesk.com', 'CLIENTE', daysAgo(now, 27)),
    user(6, 'Carlos Operacoes', 'carlos.operacoes@helpdesk.com', 'CLIENTE', daysAgo(now, 24)),
    user(7, 'Fernanda Financeiro', 'fernanda.financeiro@helpdesk.com', 'CLIENTE', daysAgo(now, 22)),
    user(8, 'Rafael Logistica', 'rafael.logistica@helpdesk.com', 'CLIENTE', daysAgo(now, 20)),
    user(9, 'Patricia RH', 'patricia.rh@helpdesk.com', 'CLIENTE', daysAgo(now, 18)),
  ];

  type TicketSeedRow = [
    string,
    string,
    number,
    number | undefined,
    Status,
    Priority,
    Category,
    number,
    number,
    number?,
  ];

  const ticketRows: TicketSeedRow[] = [
    ['VPN da diretoria indisponivel', 'Usuarios da diretoria nao conseguem autenticar na VPN antes da reuniao semanal.', 6, 2, 'RESOLVIDO', 'CRITICA', 'ACESSO', 52, 12, 12],
    ['Lentidao no compartilhamento financeiro', 'Compartilhamentos de rede apresentam lentidao intermitente durante o fechamento mensal.', 7, 2, 'EM_ANDAMENTO', 'URGENTE', 'REDE', 15, 1],
    ['Impressora do RH sem toner', 'Impressora principal do RH parou apos alerta de suprimento e precisa de validacao.', 9, 3, 'ABERTO', 'MEDIA', 'IMPRESSORA', 7, 2],
    ['Notebook nao liga', 'Equipamento reserva nao inicializa e impede atendimento presencial da equipe comercial.', 5, 4, 'EM_ANDAMENTO', 'ALTA', 'HARDWARE', 31, 3],
    ['Erro ao abrir sistema comercial', 'Aplicacao exibe falha ao carregar pedidos pendentes desde a ultima atualizacao.', 5, 3, 'ABERTO', 'ALTA', 'SOFTWARE', 5, 2],
    ['Solicitacao duplicada de periferico', 'Pedido cancelado porque ja havia chamado aberto para o mesmo periferico.', 5, 4, 'CANCELADO', 'BAIXA', 'HARDWARE', 80, 74],
    ['Acesso ao BI executivo', 'Novo usuario precisa de permissao para painel executivo do BI.', 8, 2, 'ABERTO', 'MEDIA', 'ACESSO', 3, 1],
    ['Backup do banco com alerta', 'Monitoramento indicou falha em rotina de backup incremental do banco de dados.', 6, 3, 'EM_ANDAMENTO', 'URGENTE', 'BANCO_DE_DADOS', 11, 1],
    ['Wi-Fi intermitente na sala de treinamento', 'Equipe relata quedas curtas de Wi-Fi durante treinamento de onboarding.', 5, 4, 'EM_ANDAMENTO', 'MEDIA', 'REDE', 22, 5],
    ['Email bloqueado por politica', 'Conta corporativa bloqueada apos multiplas tentativas de autenticacao.', 7, 3, 'RESOLVIDO', 'ALTA', 'ACESSO', 44, 20, 20],
    ['Servidor de arquivos com espaco baixo', 'Volume de arquivos esta acima de 90% de uso e precisa de limpeza orientada.', 6, 4, 'EM_ANDAMENTO', 'ALTA', 'INFRAESTRUTURA', 28, 4],
    ['Relatorio fiscal nao gera PDF', 'Sistema financeiro conclui processamento mas nao disponibiliza arquivo PDF.', 7, 3, 'RESOLVIDO', 'MEDIA', 'SOFTWARE', 120, 72, 72],
    ['Mouse sem fio falhando', 'Usuario relata falhas constantes no mouse sem fio do posto de atendimento.', 8, undefined, 'ABERTO', 'BAIXA', 'HARDWARE', 9, 9],
    ['Impressao presa na fila', 'Documentos ficam presos na fila de impressao da area de contratos.', 6, 2, 'RESOLVIDO', 'MEDIA', 'IMPRESSORA', 66, 42, 42],
    ['Atualizacao de antivirus pendente', 'Endpoint do setor comercial nao recebeu assinatura mais recente do antivirus.', 5, 2, 'RESOLVIDO', 'ALTA', 'INFRAESTRUTURA', 96, 54, 54],
    ['Consulta SQL muito lenta', 'Consulta de relatorio analitico esta demorando mais de 2 minutos no horario de pico.', 7, 3, 'EM_ANDAMENTO', 'ALTA', 'BANCO_DE_DADOS', 27, 6],
    ['Criar usuario de rede', 'Novo colaborador precisa de acesso a rede, e-mail e pastas compartilhadas.', 9, undefined, 'ABERTO', 'MEDIA', 'ACESSO', 2, 2],
    ['Dashboard interno fora do ar', 'Painel interno de indicadores apresenta erro 500 para todos os usuarios.', 6, 4, 'RESOLVIDO', 'URGENTE', 'SOFTWARE', 36, 8, 8],
    ['Troca de monitor solicitada', 'Monitor apresenta linhas verticais e dificulta leitura de planilhas.', 8, 4, 'CANCELADO', 'BAIXA', 'HARDWARE', 140, 118],
    ['Permissao em pasta do projeto', 'Solicitante precisa gravar arquivos em diretorio compartilhado do projeto Alfa.', 7, 2, 'RESOLVIDO', 'MEDIA', 'ACESSO', 75, 49, 49],
    ['Falha em certificado SSL interno', 'Servico interno apresenta alerta de certificado expirando para usuarios da intranet.', 6, 4, 'ABERTO', 'URGENTE', 'INFRAESTRUTURA', 6, 1],
    ['Planilha XLSX corrompida', 'Arquivo compartilhado usado pela logistica nao abre apos sincronizacao.', 8, 3, 'RESOLVIDO', 'BAIXA', 'OUTROS', 70, 58, 58],
    ['Rede cabeada da sala 3 sem link', 'Pontos de rede da sala 3 nao recebem link no switch do andar.', 9, 4, 'CANCELADO', 'MEDIA', 'REDE', 96, 90],
    ['Acesso ao banco homologacao', 'Equipe precisa de acesso temporario ao banco de homologacao para validacao.', 5, undefined, 'ABERTO', 'BAIXA', 'BANCO_DE_DADOS', 1, 1],
  ];

  const ticketCases: Array<{
    title: string;
    description: string;
    clientId: number;
    technicianId?: number;
    status: Status;
    priority: Priority;
    category: Category;
    createdHoursAgo: number;
    updatedHoursAgo: number;
    resolvedHoursAgo?: number;
  }> = ticketRows.map(([title, description, clientId, technicianId, status, priority, category, createdHoursAgo, updatedHoursAgo, resolvedHoursAgo]) => ({
    title,
    description,
    clientId,
    technicianId,
    status,
    priority,
    category,
    createdHoursAgo,
    updatedHoursAgo,
    resolvedHoursAgo,
  }));

  const tickets = ticketCases.map((item, index) =>
    hydrateTicket({
      id: index + 101,
      title: `[Demo] ${item.title}`,
      description: item.description,
      client: findUser(users, item.clientId),
      technician: item.technicianId ? findUser(users, item.technicianId) : undefined,
      status: item.status,
      priority: item.priority,
      category: item.category,
      createdAt: hoursAgo(now, item.createdHoursAgo),
      updatedAt: hoursAgo(now, item.updatedHoursAgo),
      resolvedAt: item.resolvedHoursAgo ? hoursAgo(now, item.resolvedHoursAgo) : undefined,
      slaDueAt: '',
      slaStatus: 'DENTRO_DO_PRAZO',
      slaMinutesRemaining: 0,
      openMinutes: 0,
      resolutionMinutes: null,
    })
  );

  const history: DemoHistory[] = [];
  const comments: Comment[] = [];
  const attachments: Attachment[] = [];
  const activities: DemoActivity[] = [];
  let historyId = 1;
  let commentId = 1;
  let attachmentId = 1;
  let activityId = 1;
  const admin = users[0];

  tickets.forEach((ticket, index) => {
    history.push({
      id: historyId++,
      ticketId: ticket.id,
      eventType: 'CRIACAO',
      description: `Chamado criado com prioridade ${PRIORITY_LABELS[ticket.priority]} na categoria ${CATEGORY_LABELS[ticket.category]}.`,
      actor: ticket.client,
      createdAt: ticket.createdAt,
    });
    activities.push(activity(activityId++, 'CHAMADO_CRIADO', 'Chamado criado', `${ticket.client.name} abriu o chamado ${ticket.title}.`, ticket.client, ticket.id, ticket.createdAt));

    if (ticket.technician) {
      history.push({
        id: historyId++,
        ticketId: ticket.id,
        eventType: 'ATRIBUICAO_TECNICO',
        description: `Analista ${ticket.technician.name} atribuido ao chamado.`,
        actor: admin,
        createdAt: addMinutes(ticket.createdAt, 25),
      });
      activities.push(activity(activityId++, 'ANALISTA_ATRIBUIDO', 'Analista atribuido', `${ticket.technician.name} assumiu o chamado #${ticket.id}.`, admin, ticket.id, addMinutes(ticket.createdAt, 25)));
    }

    if (ticket.status !== 'ABERTO') {
      history.push({
        id: historyId++,
        ticketId: ticket.id,
        eventType: 'ALTERACAO_STATUS',
        description: `Status alterado para ${STATUS_LABELS[ticket.status]}.`,
        actor: ticket.technician ?? admin,
        createdAt: addMinutes(ticket.createdAt, 70),
      });
      activities.push(activity(activityId++, statusToActivity(ticket.status), STATUS_LABELS[ticket.status], `Status do chamado #${ticket.id} alterado para ${STATUS_LABELS[ticket.status]}.`, ticket.technician ?? admin, ticket.id, addMinutes(ticket.createdAt, 70)));
    }

    const publicComment: Comment = {
      id: commentId++,
      ticketId: ticket.id,
      author: ticket.client,
      text: 'Inclui detalhes adicionais para facilitar a triagem do atendimento.',
      internal: false,
      createdAt: addMinutes(ticket.createdAt, 45),
      updatedAt: addMinutes(ticket.createdAt, 45),
    };
    comments.push(publicComment);
    history.push({
      id: historyId++,
      ticketId: ticket.id,
      eventType: 'COMENTARIO',
      description: 'Comentario publico adicionado pelo solicitante.',
      actor: ticket.client,
      createdAt: publicComment.createdAt,
    });

    if (ticket.technician && index % 2 === 0) {
      const internalComment: Comment = {
        id: commentId++,
        ticketId: ticket.id,
        author: ticket.technician,
        text: 'Triagem realizada. Proxima acao registrada para acompanhamento interno.',
        internal: true,
        createdAt: addMinutes(ticket.createdAt, 95),
        updatedAt: addMinutes(ticket.createdAt, 95),
      };
      comments.push(internalComment);
    }

    if (index % 5 === 0) {
      attachments.push({
        id: attachmentId++,
        ticketId: ticket.id,
        name: `evidencia-chamado-${ticket.id}.pdf`,
        contentType: 'application/pdf',
        sizeBytes: 186000 + index * 4200,
        author: ticket.client,
        createdAt: addMinutes(ticket.createdAt, 55),
      });
    }
  });

  return {
    users,
    tickets,
    comments,
    history,
    attachments,
    activities: activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    sequences: {
      user: users.length + 1,
      ticket: 200,
      comment: commentId,
      history: historyId,
      attachment: attachmentId,
      activity: activityId,
    },
  };
}

function user(id: number, name: string, email: string, role: Role, createdAt: string): User {
  return { id, name, email, role, active: true, createdAt, updatedAt: createdAt };
}

function findUser(users: User[], id: number) {
  const user = users.find((item) => item.id === id);
  if (!user) {
    throw new Error(`Usuario demo ${id} nao encontrado.`);
  }
  return user;
}

function findTicket(state: DemoState, id: number) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) {
    throw new Error(`Chamado demo ${id} nao encontrado.`);
  }
  return hydrateTicket(ticket);
}

function hydrateTicket(ticket: Ticket): Ticket {
  const now = new Date();
  const created = new Date(ticket.createdAt);
  const due = new Date(created.getTime() + SLA_HOURS[ticket.priority] * 60 * 60 * 1000);
  const end = ticket.resolvedAt ? new Date(ticket.resolvedAt) : now;
  const remaining = Math.round((due.getTime() - now.getTime()) / 60000);
  const slaStatus: SlaStatus =
    remaining < 0 ? 'VENCIDO' : remaining <= Math.max(120, SLA_HOURS[ticket.priority] * 12) ? 'PROXIMO_DO_VENCIMENTO' : 'DENTRO_DO_PRAZO';

  return {
    ...ticket,
    slaDueAt: due.toISOString(),
    slaStatus,
    slaMinutesRemaining: remaining,
    openMinutes: Math.max(0, Math.round((end.getTime() - created.getTime()) / 60000)),
    resolutionMinutes: ticket.resolvedAt
      ? Math.max(0, Math.round((new Date(ticket.resolvedAt).getTime() - created.getTime()) / 60000))
      : null,
  };
}

function listTickets(state: DemoState, params: URLSearchParams): Page<Ticket> {
  let items = state.tickets.map(hydrateTicket);
  const text = normalize(String(getParam(params, 'text') ?? ''));
  const status = getParam(params, 'status') as Status | null;
  const priority = getParam(params, 'priority') as Priority | null;
  const category = getParam(params, 'category') as Category | null;
  const technicianId = Number(getParam(params, 'technicianId') || 0);
  const clientId = Number(getParam(params, 'clientId') || 0);
  const startDate = String(getParam(params, 'startDate') ?? '');
  const endDate = String(getParam(params, 'endDate') ?? '');

  if (text) {
    items = items.filter((ticket) =>
      [
        String(ticket.id),
        ticket.title,
        ticket.description,
        ticket.client.name,
        ticket.client.email,
        ticket.technician?.name,
        ticket.technician?.email,
        STATUS_LABELS[ticket.status],
        CATEGORY_LABELS[ticket.category],
      ]
        .filter(Boolean)
        .some((value) => normalize(String(value)).includes(text))
    );
  }
  if (status) items = items.filter((ticket) => ticket.status === status);
  if (priority) items = items.filter((ticket) => ticket.priority === priority);
  if (category) items = items.filter((ticket) => ticket.category === category);
  if (technicianId) items = items.filter((ticket) => ticket.technician?.id === technicianId);
  if (clientId) items = items.filter((ticket) => ticket.client.id === clientId);
  if (startDate) items = items.filter((ticket) => ticket.createdAt.slice(0, 10) >= startDate);
  if (endDate) items = items.filter((ticket) => ticket.createdAt.slice(0, 10) <= endDate);

  sortTickets(items, String(getParam(params, 'sortBy') ?? 'updatedAt'), String(getParam(params, 'direction') ?? 'desc'));
  return paginate(items, Number(getParam(params, 'page') ?? 0), Number(getParam(params, 'size') ?? defaultPageSize));
}

function sortTickets(items: Ticket[], sortBy: string, direction: string) {
  const multiplier = direction === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    const getValue = (ticket: Ticket) => {
      if (sortBy === 'title') return ticket.title;
      if (sortBy === 'status') return ticket.status;
      if (sortBy === 'priority') return priorityWeight(ticket.priority);
      if (sortBy === 'sla') return ticket.slaMinutesRemaining;
      if (sortBy === 'createdAt') return new Date(ticket.createdAt).getTime();
      return new Date(ticket.updatedAt).getTime();
    };
    const left = getValue(a);
    const right = getValue(b);
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right) * multiplier;
    }
    return (Number(left) - Number(right)) * multiplier;
  });
}

function priorityWeight(priority: Priority) {
  return { BAIXA: 1, MEDIA: 2, ALTA: 3, URGENTE: 4, CRITICA: 5 }[priority];
}

function createTicket(state: DemoState, payload: Partial<Ticket> & { clientId?: number }) {
  const actor = getStoredUser() ?? state.users[0];
  const client = actor.role === 'ADMIN'
    ? state.users.find((user) => user.id === Number(payload.clientId)) ?? state.users.find((user) => user.role === 'CLIENTE')!
    : actor;
  const now = new Date().toISOString();
  const ticket = hydrateTicket({
    id: state.sequences.ticket++,
    title: String(payload.title ?? 'Novo chamado demo'),
    description: String(payload.description ?? 'Chamado criado no modo demonstracao.'),
    client,
    status: 'ABERTO',
    priority: (payload.priority as Priority) ?? 'MEDIA',
    category: (payload.category as Category) ?? 'OUTROS',
    createdAt: now,
    updatedAt: now,
    slaDueAt: '',
    slaStatus: 'DENTRO_DO_PRAZO',
    slaMinutesRemaining: 0,
    openMinutes: 0,
    resolutionMinutes: null,
  });
  state.tickets.unshift(ticket);
  addHistory(state, ticket.id, 'CRIACAO', `Chamado criado com prioridade ${PRIORITY_LABELS[ticket.priority]}.`, actor);
  addActivity(state, 'CHAMADO_CRIADO', 'Chamado criado', `${actor.name} criou o chamado ${ticket.title}.`, actor, ticket.id);
  return ticket;
}

function updateTicket(state: DemoState, ticketId: number, payload: Partial<Ticket> & { technicianId?: number }) {
  const index = state.tickets.findIndex((item) => item.id === ticketId);
  if (index < 0) {
    throw new Error('Chamado demo nao encontrado.');
  }
  const actor = getStoredUser() ?? state.users[0];
  const previous = state.tickets[index];
  const next: Ticket = {
    ...previous,
    title: payload.title ?? previous.title,
    description: payload.description ?? previous.description,
    category: (payload.category as Category | undefined) ?? previous.category,
    priority: (payload.priority as Priority | undefined) ?? previous.priority,
    updatedAt: new Date().toISOString(),
  };

  if (payload.technicianId !== undefined) {
    const technician = state.users.find((user) => user.id === Number(payload.technicianId));
    next.technician = technician?.role === 'TECNICO' ? technician : undefined;
  }

  if (payload.status && payload.status !== previous.status) {
    next.status = payload.status as Status;
    next.resolvedAt = next.status === 'RESOLVIDO' ? next.updatedAt : undefined;
  }

  state.tickets[index] = hydrateTicket(next);

  if (payload.status && payload.status !== previous.status) {
    addHistory(state, ticketId, statusToHistory(next.status), `Status alterado de ${STATUS_LABELS[previous.status]} para ${STATUS_LABELS[next.status]}.`, actor);
    addActivity(state, statusToActivity(next.status), 'Status alterado', `Status do chamado #${ticketId} alterado para ${STATUS_LABELS[next.status]}.`, actor, ticketId);
  }
  if (payload.technicianId !== undefined && previous.technician?.id !== next.technician?.id) {
    addHistory(state, ticketId, 'ATRIBUICAO_TECNICO', next.technician ? `Analista ${next.technician.name} atribuido ao chamado.` : 'Analista removido do chamado.', actor);
    addActivity(state, 'ANALISTA_ATRIBUIDO', 'Analista atribuido', next.technician ? `${next.technician.name} assumiu o chamado #${ticketId}.` : `Chamado #${ticketId} ficou sem analista.`, actor, ticketId);
  }
  if (payload.priority && payload.priority !== previous.priority) {
    addHistory(state, ticketId, 'ALTERACAO_PRIORIDADE', `Prioridade alterada de ${PRIORITY_LABELS[previous.priority]} para ${PRIORITY_LABELS[next.priority]}.`, actor);
    addActivity(state, 'PRIORIDADE_ALTERADA', 'Prioridade alterada', `Prioridade do chamado #${ticketId} alterada.`, actor, ticketId);
  }
  if (payload.category && payload.category !== previous.category) {
    addHistory(state, ticketId, 'ALTERACAO_CATEGORIA', `Categoria alterada de ${CATEGORY_LABELS[previous.category]} para ${CATEGORY_LABELS[next.category]}.`, actor);
    addActivity(state, 'CATEGORIA_ALTERADA', 'Categoria alterada', `Categoria do chamado #${ticketId} alterada.`, actor, ticketId);
  }
  if (payload.title || payload.description) {
    addHistory(state, ticketId, 'ATUALIZACAO_DADOS', 'Dados principais do chamado atualizados.', actor);
    addActivity(state, 'CHAMADO_EDITADO', 'Chamado editado', `Chamado #${ticketId} atualizado.`, actor, ticketId);
  }

  return state.tickets[index];
}

function listUsers(state: DemoState, params: URLSearchParams): Page<User> {
  let items = [...state.users];
  const text = normalize(String(getParam(params, 'text') ?? ''));
  const role = getParam(params, 'role') as Role | null;
  const active = getParam(params, 'active');
  if (text) {
    items = items.filter((user) => normalize(`${user.name} ${user.email}`).includes(text));
  }
  if (role) {
    items = items.filter((user) => user.role === role);
  }
  if (active !== null) {
    const expected = String(active) === 'true';
    items = items.filter((user) => user.active === expected);
  }
  return paginate(items, Number(getParam(params, 'page') ?? 0), Number(getParam(params, 'size') ?? 100));
}

function createUser(state: DemoState, payload: Partial<User>) {
  const now = new Date().toISOString();
  const actor = getStoredUser() ?? state.users[0];
  const user: User = {
    id: state.sequences.user++,
    name: String(payload.name ?? 'Novo usuario demo'),
    email: String(payload.email ?? `usuario${state.sequences.user}@helpdesk.com`).toLowerCase(),
    role: (payload.role as Role) ?? 'CLIENTE',
    active: payload.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
  state.users.push(user);
  addActivity(state, 'USUARIO_CRIADO', 'Usuario criado', `${actor.name} criou o acesso de ${user.name}.`, actor);
  return user;
}

function updateUser(state: DemoState, id: number, payload: Partial<User>) {
  const index = state.users.findIndex((user) => user.id === id);
  if (index < 0) {
    throw new Error('Usuario demo nao encontrado.');
  }
  const actor = getStoredUser() ?? state.users[0];
  const previous = state.users[index];
  const updated: User = {
    ...previous,
    name: payload.name ?? previous.name,
    email: payload.email ?? previous.email,
    role: (payload.role as Role | undefined) ?? previous.role,
    active: payload.active ?? previous.active,
    updatedAt: new Date().toISOString(),
  };
  state.users[index] = updated;
  const type: ActivityEventType =
    previous.active !== updated.active
      ? updated.active
        ? 'USUARIO_ATIVADO'
        : 'USUARIO_DESATIVADO'
      : 'USUARIO_EDITADO';
  addActivity(state, type, 'Usuario atualizado', `${actor.name} atualizou o acesso de ${updated.name}.`, actor);
  state.tickets = state.tickets.map((ticket) => ({
    ...ticket,
    client: ticket.client.id === updated.id ? updated : ticket.client,
    technician: ticket.technician?.id === updated.id ? updated : ticket.technician,
  }));
  state.comments = state.comments.map((comment) => ({
    ...comment,
    author: comment.author.id === updated.id ? updated : comment.author,
  }));
  return updated;
}

function createComment(state: DemoState, ticket: Ticket, payload: Partial<Comment>) {
  const actor = getStoredUser() ?? state.users[0];
  const now = new Date().toISOString();
  const comment: Comment = {
    id: state.sequences.comment++,
    ticketId: ticket.id,
    author: actor,
    text: String(payload.text ?? ''),
    internal: Boolean(payload.internal),
    createdAt: now,
    updatedAt: now,
  };
  state.comments.push(comment);
  touchTicket(state, ticket.id);
  addHistory(state, ticket.id, 'COMENTARIO', comment.internal ? 'Comentario interno adicionado.' : 'Comentario publico adicionado.', actor);
  addActivity(state, 'COMENTARIO_ADICIONADO', 'Comentario adicionado', `${actor.name} comentou no chamado #${ticket.id}.`, actor, ticket.id);
  return comment;
}

function updateComment(state: DemoState, ticket: Ticket, commentId: number, payload: Partial<Comment>) {
  const index = state.comments.findIndex((comment) => comment.id === commentId && comment.ticketId === ticket.id);
  if (index < 0) {
    throw new Error('Comentario demo nao encontrado.');
  }
  const actor = getStoredUser() ?? state.users[0];
  state.comments[index] = {
    ...state.comments[index],
    text: String(payload.text ?? state.comments[index].text),
    internal: payload.internal ?? state.comments[index].internal,
    updatedAt: new Date().toISOString(),
  };
  touchTicket(state, ticket.id);
  addActivity(state, 'COMENTARIO_EDITADO', 'Comentario editado', `${actor.name} editou um comentario no chamado #${ticket.id}.`, actor, ticket.id);
  return state.comments[index];
}

function deleteComment(state: DemoState, ticket: Ticket, commentId: number) {
  const actor = getStoredUser() ?? state.users[0];
  state.comments = state.comments.filter((comment) => !(comment.id === commentId && comment.ticketId === ticket.id));
  touchTicket(state, ticket.id);
  addHistory(state, ticket.id, 'COMENTARIO_REMOVIDO', 'Comentario removido do chamado.', actor);
  addActivity(state, 'COMENTARIO_REMOVIDO', 'Comentario removido', `${actor.name} removeu um comentario do chamado #${ticket.id}.`, actor, ticket.id);
}

function createAttachment(state: DemoState, ticket: Ticket, body: unknown) {
  const actor = getStoredUser() ?? state.users[0];
  const file = body instanceof FormData ? body.get('file') : null;
  const fileLike = file instanceof File ? file : null;
  const now = new Date().toISOString();
  const attachment: Attachment = {
    id: state.sequences.attachment++,
    ticketId: ticket.id,
    name: fileLike?.name ?? `anexo-demo-${ticket.id}.pdf`,
    contentType: fileLike?.type || 'application/pdf',
    sizeBytes: fileLike?.size ?? 128000,
    author: actor,
    createdAt: now,
  };
  state.attachments.push(attachment);
  touchTicket(state, ticket.id);
  addHistory(state, ticket.id, 'ANEXO', `Anexo ${attachment.name} enviado.`, actor);
  addActivity(state, 'ANEXO_ENVIADO', 'Anexo enviado', `${actor.name} enviou ${attachment.name} no chamado #${ticket.id}.`, actor, ticket.id);
  return attachment;
}

function listActivities(state: DemoState, params: URLSearchParams): Page<Activity> {
  let items = state.activities.map((item) => toActivity(state, item));
  const text = normalize(String(getParam(params, 'text') ?? ''));
  const type = getParam(params, 'type') as ActivityEventType | null;
  const role = getParam(params, 'role') as Role | null;
  const ticketId = Number(getParam(params, 'ticketId') || 0);
  const startDate = String(getParam(params, 'startDate') ?? '');
  const endDate = String(getParam(params, 'endDate') ?? '');
  if (text) {
    items = items.filter((activity) =>
      normalize(`${activity.title} ${activity.description} ${activity.actor?.name ?? ''} ${activity.ticket?.title ?? ''} ${activity.ticket?.id ?? ''}`).includes(text)
    );
  }
  if (type) items = items.filter((activity) => activity.type === type);
  if (role) items = items.filter((activity) => activity.actor?.role === role);
  if (ticketId) items = items.filter((activity) => activity.ticket?.id === ticketId);
  if (startDate) items = items.filter((activity) => activity.createdAt.slice(0, 10) >= startDate);
  if (endDate) items = items.filter((activity) => activity.createdAt.slice(0, 10) <= endDate);
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return paginate(items, Number(getParam(params, 'page') ?? 0), Number(getParam(params, 'size') ?? 10));
}

function buildDashboard(state: DemoState): Dashboard {
  const tickets = state.tickets.map(hydrateTicket);
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'RESOLVIDO');
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);

  return {
    total: tickets.length,
    open: count(tickets, (ticket) => ticket.status === 'ABERTO'),
    inProgress: count(tickets, (ticket) => ticket.status === 'EM_ANDAMENTO'),
    resolved: resolvedTickets.length,
    canceled: count(tickets, (ticket) => ticket.status === 'CANCELADO'),
    createdToday: count(tickets, (ticket) => ticket.createdAt.slice(0, 10) === today),
    createdThisWeek: count(tickets, (ticket) => new Date(ticket.createdAt) >= weekStart),
    resolvedToday: count(tickets, (ticket) => ticket.resolvedAt?.slice(0, 10) === today),
    resolvedThisWeek: count(tickets, (ticket) => Boolean(ticket.resolvedAt && new Date(ticket.resolvedAt) >= weekStart)),
    overdueSla: count(tickets, (ticket) => ticket.slaStatus === 'VENCIDO'),
    nearDueSla: count(tickets, (ticket) => ticket.slaStatus === 'PROXIMO_DO_VENCIMENTO'),
    withinSla: count(tickets, (ticket) => ticket.slaStatus === 'DENTRO_DO_PRAZO'),
    averageResolutionMinutes: average(resolvedTickets.map((ticket) => ticket.resolutionMinutes ?? 0)),
    byStatus: enumCounts(tickets, ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'CANCELADO'], (ticket) => ticket.status),
    byPriority: enumCounts(tickets, ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE', 'CRITICA'], (ticket) => ticket.priority),
    byCategory: enumCounts(tickets, ['HARDWARE', 'SOFTWARE', 'REDE', 'IMPRESSORA', 'ACESSO', 'BANCO_DE_DADOS', 'INFRAESTRUTURA', 'OUTROS'], (ticket) => ticket.category),
    byTechnician: ranking(tickets.filter((ticket) => ticket.technician), (ticket) => ticket.technician?.name ?? 'Sem tecnico'),
    byClient: ranking(tickets, (ticket) => ticket.client.name),
    productivityByTechnician: buildProductivity(tickets).map((item) => ({ label: item.technician, total: item.productivityPercent })),
    technicianProductivity: buildProductivity(tickets),
    averageResolutionByCategory: averageByCategory(tickets),
    dailyVolume: dailyVolume(tickets),
    recentTickets: [...tickets].sort(byUpdatedDesc).slice(0, 6),
    recentComments: [...state.comments].sort(byCreatedDesc).slice(0, 5),
    recentActivities: [...state.activities].sort(byCreatedDesc).slice(0, 6).map((item) => toActivity(state, item)),
  };
}

function searchDemo(state: DemoState, query: string): SearchResponse {
  const term = normalize(query);
  if (term.length < 2) {
    return { tickets: [], users: [], categories: [], comments: [] };
  }
  const tickets = state.tickets
    .map(hydrateTicket)
    .filter((ticket) =>
      normalize(`${ticket.id} ${ticket.title} ${ticket.description} ${ticket.client.name} ${ticket.technician?.name ?? ''} ${ticket.status} ${CATEGORY_LABELS[ticket.category]}`).includes(term)
    )
    .slice(0, 5)
    .map((ticket) => ({
      type: 'ticket',
      label: `#${ticket.id} ${ticket.title}`,
      description: `${STATUS_LABELS[ticket.status]} · ${ticket.client.name}`,
      targetUrl: `/tickets/${ticket.id}`,
    }));
  const users = state.users
    .filter((user) => normalize(`${user.name} ${user.email} ${user.role}`).includes(term))
    .slice(0, 5)
    .map((user) => ({
      type: 'user',
      label: user.name,
      description: `${user.email} · ${user.role}`,
      targetUrl: '/users',
    }));
  const categories = Object.entries(CATEGORY_LABELS)
    .filter(([value, label]) => normalize(`${value} ${label}`).includes(term))
    .map(([value, label]) => ({
      type: 'category',
      label,
      description: 'Filtrar chamados por categoria',
      targetUrl: `/tickets?category=${value}`,
    }));
  const comments = state.comments
    .filter((comment) => normalize(`${comment.text} ${comment.author.name}`).includes(term))
    .slice(0, 5)
    .map((comment) => ({
      type: 'comment',
      label: `Comentario em #${comment.ticketId}`,
      description: comment.text,
      targetUrl: `/tickets/${comment.ticketId}`,
    }));
  return { tickets, users, categories, comments };
}

function buildProductivity(tickets: Ticket[]): TechnicianProductivity[] {
  const technicians = new Map<string, Ticket[]>();
  tickets.forEach((ticket) => {
    if (ticket.technician) {
      const list = technicians.get(ticket.technician.name) ?? [];
      list.push(ticket);
      technicians.set(ticket.technician.name, list);
    }
  });
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  return [...technicians.entries()]
    .map(([technician, assigned]) => {
      const resolved = assigned.filter((ticket) => ticket.status === 'RESOLVIDO');
      const inProgress = assigned.filter((ticket) => ticket.status === 'EM_ANDAMENTO');
      const resolvedThisWeek = resolved.filter((ticket) => Boolean(ticket.resolvedAt && new Date(ticket.resolvedAt) >= weekStart));
      const averageResolutionMinutes = average(resolved.map((ticket) => ticket.resolutionMinutes ?? 0));
      return {
        technician,
        assigned: assigned.length,
        inProgress: inProgress.length,
        resolved: resolved.length,
        resolvedThisWeek: resolvedThisWeek.length,
        averageResolutionMinutes,
        productivityPercent: Math.round(((resolved.length * 1.5 + inProgress.length) / Math.max(assigned.length * 1.5, 1)) * 100),
      };
    })
    .sort((a, b) => b.productivityPercent - a.productivityPercent);
}

function averageByCategory(tickets: Ticket[]) {
  return Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => {
      const resolved = tickets.filter((ticket) => ticket.category === category && ticket.resolutionMinutes != null);
      return { label, total: average(resolved.map((ticket) => ticket.resolutionMinutes ?? 0)) ?? 0 };
    })
    .filter((item) => item.total > 0);
}

function dailyVolume(tickets: Ticket[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      created: count(tickets, (ticket) => ticket.createdAt.slice(0, 10) === key),
      resolved: count(tickets, (ticket) => ticket.resolvedAt?.slice(0, 10) === key),
    };
  });
}

function enumCounts<T extends string>(tickets: Ticket[], values: T[], getValue: (ticket: Ticket) => T) {
  return values.reduce<Record<T, number>>((acc, value) => {
    acc[value] = count(tickets, (ticket) => getValue(ticket) === value);
    return acc;
  }, {} as Record<T, number>);
}

function ranking(tickets: Ticket[], labelFor: (ticket: Ticket) => string) {
  const result = new Map<string, number>();
  tickets.forEach((ticket) => result.set(labelFor(ticket), (result.get(labelFor(ticket)) ?? 0) + 1));
  return [...result.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
}

function count<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length;
}

function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const safeSize = size > 0 ? size : defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  return {
    content: items.slice(safePage * safeSize, safePage * safeSize + safeSize),
    totalElements: items.length,
    totalPages,
    number: safePage,
    size: safeSize,
  };
}

function addHistory(state: DemoState, ticketId: number, eventType: HistoryEventType, description: string, actor: User) {
  state.history.push({
    id: state.sequences.history++,
    ticketId,
    eventType,
    description,
    actor,
    createdAt: new Date().toISOString(),
  });
}

function addActivity(state: DemoState, type: ActivityEventType, title: string, description: string, actor?: User, ticketId?: number) {
  state.activities.unshift(activity(state.sequences.activity++, type, title, description, actor, ticketId));
}

function activity(id: number, type: ActivityEventType, title: string, description: string, actor?: User, ticketId?: number, createdAt = new Date().toISOString()): DemoActivity {
  return { id, type, title, description, actor, ticketId, createdAt };
}

function toActivity(state: DemoState, activity: DemoActivity): Activity {
  const ticket = activity.ticketId ? state.tickets.find((item) => item.id === activity.ticketId) : undefined;
  return { ...activity, ticket: ticket ? hydrateTicket(ticket) : undefined };
}

function touchTicket(state: DemoState, ticketId: number) {
  const index = state.tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index >= 0) {
    state.tickets[index] = hydrateTicket({ ...state.tickets[index], updatedAt: new Date().toISOString() });
  }
}

function statusToHistory(status: Status): HistoryEventType {
  if (status === 'RESOLVIDO') return 'RESOLUCAO';
  if (status === 'CANCELADO') return 'CANCELAMENTO';
  if (status === 'EM_ANDAMENTO') return 'ALTERACAO_STATUS';
  return 'ALTERACAO_STATUS';
}

function statusToActivity(status: Status): ActivityEventType {
  if (status === 'RESOLVIDO') return 'CHAMADO_RESOLVIDO';
  if (status === 'CANCELADO') return 'CHAMADO_CANCELADO';
  if (status === 'EM_ANDAMENTO') return 'STATUS_ALTERADO';
  return 'STATUS_ALTERADO';
}

function parseTicketRoute(path: string) {
  const [, root, id, resource, child, action] = path.match(/^\/(tickets)\/(\d+)(?:\/([^/]+)(?:\/(\d+)(?:\/([^/]+))?)?)?$/) ?? [];
  if (root !== 'tickets') {
    return null;
  }
  return {
    ticketId: Number(id),
    resource,
    childId: child ? Number(child) : undefined,
    download: action === 'download',
  };
}

function parseBody(data: unknown) {
  if (!data) {
    return {};
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data as Record<string, unknown>;
}

function readRequest(config: InternalAxiosRequestConfig) {
  const url = new URL(config.url ?? '/', 'http://demo.local');
  const params = new URLSearchParams(url.search);
  const configParams = config.params;
  if (configParams instanceof URLSearchParams) {
    configParams.forEach((value, key) => params.set(key, value));
  } else if (configParams && typeof configParams === 'object') {
    Object.entries(configParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
  }
  const path = url.pathname.startsWith('/api/') ? url.pathname.slice(4) : url.pathname;
  return { path, params };
}

function getParam(params: URLSearchParams, key: string) {
  return params.has(key) ? params.get(key) : null;
}

function respond<T>(data: T, config: InternalAxiosRequestConfig, status = 200, statusText = 'OK'): AxiosResponse<T> {
  return {
    data,
    status,
    statusText,
    headers: {},
    config,
  };
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function daysAgo(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(base: Date, hours: number) {
  const date = new Date(base);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function addMinutes(value: string, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function byUpdatedDesc(a: Ticket, b: Ticket) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function byCreatedDesc(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
