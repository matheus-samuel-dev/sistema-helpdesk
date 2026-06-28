export const APP_NAME = 'HelpDesk';
export const APP_DESCRIPTION =
  'HelpDesk centraliza chamados, atendimento e acompanhamento de solicitações em uma única interface.';
export const APP_SHORT_DESCRIPTION = 'Central de chamados e atendimento.';
export const STORAGE_KEYS = {
  token: 'helpdesk_token',
  user: 'helpdesk_user',
} as const;

export function resolvePageMetadata(pathname: string) {
  if (pathname === '/login') {
    return {
      title: `Login | ${APP_NAME}`,
      description: 'Acesse o HelpDesk para acompanhar chamados, atendimento e solicitações.',
    };
  }

  if (pathname === '/dashboard') {
    return {
      title: `Central de Operações | ${APP_NAME}`,
      description: 'Central de operações do HelpDesk com indicadores, filas e visão executiva do suporte.',
    };
  }

  if (pathname === '/tickets') {
    return {
      title: `Chamados | ${APP_NAME}`,
      description: 'Consulte, filtre e acompanhe os chamados registrados no HelpDesk.',
    };
  }

  if (pathname === '/tickets/new') {
    return {
      title: `Novo Chamado | ${APP_NAME}`,
      description: 'Abra um novo chamado no HelpDesk com prioridade, categoria e detalhes do atendimento.',
    };
  }

  if (pathname.startsWith('/tickets/')) {
    return {
      title: `Detalhes do Chamado | ${APP_NAME}`,
      description: 'Acompanhe histórico, comentários e atualizações do chamado no HelpDesk.',
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      title: `Painel de Gestão | ${APP_NAME}`,
      description: 'Gerencie acessos, perfis e a estrutura operacional do HelpDesk.',
    };
  }

  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
  };
}
