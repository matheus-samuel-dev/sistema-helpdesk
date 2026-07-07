CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (name, email, password, role, active) VALUES
('João Analista', 'tecnico@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'TECNICO', true),
('Ana Suporte', 'ana.suporte@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'TECNICO', true),
('Bruno Infra', 'bruno.infra@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'TECNICO', true),
('Carlos Operações', 'carlos.operacoes@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'CLIENTE', true),
('Fernanda Financeiro', 'fernanda.financeiro@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'CLIENTE', true),
('Rafael Logística', 'rafael.logistica@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'CLIENTE', true),
('Patrícia RH', 'patricia.rh@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'CLIENTE', true)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = true,
    updated_at = CURRENT_TIMESTAMP;

DELETE FROM tickets WHERE title LIKE '[Demo]%';

INSERT INTO tickets (
  title,
  description,
  client_id,
  technician_id,
  status,
  priority,
  category,
  created_at,
  updated_at,
  resolved_at
) VALUES
('[Demo] VPN indisponível para diretoria',
 'Usuários da diretoria não conseguem autenticar na VPN corporativa antes da reunião semanal.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'RESOLVIDO',
 'CRITICA',
 'REDE',
 CURRENT_TIMESTAMP - INTERVAL '6 days',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),
('[Demo] Instabilidade no servidor de arquivos',
 'Compartilhamentos de rede apresentam lentidão intermitente durante o expediente.',
 (SELECT id FROM users WHERE email = 'fernanda.financeiro@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'EM_ANDAMENTO',
 'URGENTE',
 'INFRAESTRUTURA',
 CURRENT_TIMESTAMP - INTERVAL '2 days 4 hours',
 CURRENT_TIMESTAMP - INTERVAL '3 hours',
 NULL),
('[Demo] Impressora do RH substituída',
 'Solicitação cancelada após substituição do equipamento pelo fornecedor.',
 (SELECT id FROM users WHERE email = 'cliente@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'CANCELADO',
 'BAIXA',
 'IMPRESSORA',
 CURRENT_TIMESTAMP - INTERVAL '8 days',
 CURRENT_TIMESTAMP - INTERVAL '7 days',
 NULL),
('[Demo] Erro ao abrir sistema comercial',
 'Aplicação exibe mensagem de falha ao carregar pedidos pendentes.',
 (SELECT id FROM users WHERE email = 'cliente@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'ABERTO',
 'MEDIA',
 'SOFTWARE',
 CURRENT_TIMESTAMP - INTERVAL '5 hours',
 CURRENT_TIMESTAMP - INTERVAL '5 hours',
 NULL),
('[Demo] Notebook com superaquecimento',
 'Equipamento reinicia durante chamadas de vídeo e precisa de diagnóstico físico.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'EM_ANDAMENTO',
 'ALTA',
 'HARDWARE',
 CURRENT_TIMESTAMP - INTERVAL '1 day 6 hours',
 CURRENT_TIMESTAMP - INTERVAL '4 hours',
 NULL),
('[Demo] Reset de acesso ao ERP',
 'Usuária bloqueada após múltiplas tentativas inválidas no ERP financeiro.',
 (SELECT id FROM users WHERE email = 'fernanda.financeiro@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'RESOLVIDO',
 'MEDIA',
 'ACESSO',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours',
 CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours'),
('[Demo] Lentidão em relatório SQL',
 'Relatório de fechamento mensal demora mais de cinco minutos para concluir.',
 (SELECT id FROM users WHERE email = 'fernanda.financeiro@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'ABERTO',
 'BAIXA',
 'BANCO_DE_DADOS',
 CURRENT_TIMESTAMP - INTERVAL '9 hours',
 CURRENT_TIMESTAMP - INTERVAL '9 hours',
 NULL),
('[Demo] Atualização crítica do aplicativo interno',
 'Patch emergencial aplicado para corrigir falha que impedia emissão de notas.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'RESOLVIDO',
 'URGENTE',
 'SOFTWARE',
 CURRENT_TIMESTAMP - INTERVAL '4 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days 12 hours',
 CURRENT_TIMESTAMP - INTERVAL '3 days 12 hours'),
('[Demo] Solicitação duplicada de periférico',
 'Pedido cancelado porque já havia chamado aberto para o mesmo periférico.',
 (SELECT id FROM users WHERE email = 'cliente@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'CANCELADO',
 'ALTA',
 'OUTROS',
 CURRENT_TIMESTAMP - INTERVAL '10 days',
 CURRENT_TIMESTAMP - INTERVAL '9 days 20 hours',
 NULL),
('[Demo] Solicitação de acesso ao BI',
 'Novo usuário precisa de permissão para painel executivo do BI.',
 (SELECT id FROM users WHERE email = 'rafael.logistica@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'ABERTO',
 'MEDIA',
 'ACESSO',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 NULL),
('[Demo] Cabo de rede rompido no estoque',
 'Ponto de rede do coletor de dados parou de responder após movimentação física.',
 (SELECT id FROM users WHERE email = 'rafael.logistica@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'EM_ANDAMENTO',
 'ALTA',
 'REDE',
 CURRENT_TIMESTAMP - INTERVAL '18 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 NULL),
('[Demo] Atualização de driver de vídeo',
 'Estação de trabalho apresenta tela piscando após atualização automática.',
 (SELECT id FROM users WHERE email = 'patricia.rh@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'RESOLVIDO',
 'BAIXA',
 'HARDWARE',
 CURRENT_TIMESTAMP - INTERVAL '7 days',
 CURRENT_TIMESTAMP - INTERVAL '6 days 20 hours',
 CURRENT_TIMESTAMP - INTERVAL '6 days 20 hours'),
('[Demo] Erro de certificado no portal',
 'Portal interno alerta certificado inválido para usuários do financeiro.',
 (SELECT id FROM users WHERE email = 'fernanda.financeiro@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'RESOLVIDO',
 'URGENTE',
 'INFRAESTRUTURA',
 CURRENT_TIMESTAMP - INTERVAL '2 days 8 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),
('[Demo] Cadastro duplicado no CRM',
 'Cliente aparece duplicado no CRM e bloqueia atualização de contrato.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'CANCELADO',
 'MEDIA',
 'SOFTWARE',
 CURRENT_TIMESTAMP - INTERVAL '12 days',
 CURRENT_TIMESTAMP - INTERVAL '11 days 18 hours',
 NULL),
('[Demo] Toner baixo na impressora fiscal',
 'Impressora fiscal indica toner baixo e precisa de substituição preventiva.',
 (SELECT id FROM users WHERE email = 'patricia.rh@helpdesk.com'),
 NULL,
 'ABERTO',
 'BAIXA',
 'IMPRESSORA',
 CURRENT_TIMESTAMP - INTERVAL '3 hours',
 CURRENT_TIMESTAMP - INTERVAL '3 hours',
 NULL),
('[Demo] Falha no backup noturno',
 'Rotina de backup finalizou com alerta no job incremental.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'EM_ANDAMENTO',
 'URGENTE',
 'BANCO_DE_DADOS',
 CURRENT_TIMESTAMP - INTERVAL '13 hours',
 CURRENT_TIMESTAMP - INTERVAL '1 hour',
 NULL),
('[Demo] Máquina sem antivírus atualizado',
 'Endpoint do setor comercial não recebeu atualização de assinatura.',
 (SELECT id FROM users WHERE email = 'cliente@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'RESOLVIDO',
 'ALTA',
 'INFRAESTRUTURA',
 CURRENT_TIMESTAMP - INTERVAL '9 days',
 CURRENT_TIMESTAMP - INTERVAL '8 days 22 hours',
 CURRENT_TIMESTAMP - INTERVAL '8 days 22 hours'),
('[Demo] Bloqueio de usuário desligado',
 'Acesso de colaborador desligado precisa ser bloqueado em sistemas internos.',
 (SELECT id FROM users WHERE email = 'patricia.rh@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'RESOLVIDO',
 'ALTA',
 'ACESSO',
 CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours',
 CURRENT_TIMESTAMP - INTERVAL '1 day 4 hours',
 CURRENT_TIMESTAMP - INTERVAL '1 day 4 hours'),
('[Demo] Solicitação de novo monitor',
 'Usuário solicita segundo monitor para estação de atendimento.',
 (SELECT id FROM users WHERE email = 'rafael.logistica@helpdesk.com'),
 NULL,
 'ABERTO',
 'BAIXA',
 'HARDWARE',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 NULL),
('[Demo] Queda intermitente do Wi-Fi',
 'Equipe relata quedas curtas de Wi-Fi na sala de treinamento.',
 (SELECT id FROM users WHERE email = 'cliente@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'bruno.infra@helpdesk.com'),
 'EM_ANDAMENTO',
 'MEDIA',
 'REDE',
 CURRENT_TIMESTAMP - INTERVAL '20 hours',
 CURRENT_TIMESTAMP - INTERVAL '6 hours',
 NULL),
('[Demo] Ajuste de permissão em pasta',
 'Solicitante precisa gravar arquivos em diretório compartilhado do projeto.',
 (SELECT id FROM users WHERE email = 'fernanda.financeiro@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'RESOLVIDO',
 'MEDIA',
 'ACESSO',
 CURRENT_TIMESTAMP - INTERVAL '5 days',
 CURRENT_TIMESTAMP - INTERVAL '4 days 20 hours',
 CURRENT_TIMESTAMP - INTERVAL '4 days 20 hours'),
('[Demo] Sistema de ponto fora do ar',
 'Sistema de ponto não abre para fechamento de jornada no RH.',
 (SELECT id FROM users WHERE email = 'patricia.rh@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'ana.suporte@helpdesk.com'),
 'EM_ANDAMENTO',
 'URGENTE',
 'SOFTWARE',
 CURRENT_TIMESTAMP - INTERVAL '7 hours',
 CURRENT_TIMESTAMP - INTERVAL '45 minutes',
 NULL),
('[Demo] Banco de homologação indisponível',
 'Ambiente de homologação não conecta ao banco após atualização de senha.',
 (SELECT id FROM users WHERE email = 'carlos.operacoes@helpdesk.com'),
 NULL,
 'ABERTO',
 'ALTA',
 'BANCO_DE_DADOS',
 CURRENT_TIMESTAMP - INTERVAL '11 hours',
 CURRENT_TIMESTAMP - INTERVAL '11 hours',
 NULL),
('[Demo] Cancelamento de troca de mouse',
 'Solicitação cancelada porque o usuário encontrou equipamento reserva.',
 (SELECT id FROM users WHERE email = 'rafael.logistica@helpdesk.com'),
 (SELECT id FROM users WHERE email = 'tecnico@helpdesk.com'),
 'CANCELADO',
 'BAIXA',
 'HARDWARE',
 CURRENT_TIMESTAMP - INTERVAL '14 days',
 CURRENT_TIMESTAMP - INTERVAL '13 days 18 hours',
 NULL);

INSERT INTO ticket_history (ticket_id, actor_id, event_type, description, created_at)
SELECT t.id, admin.id, 'CRIACAO', 'Chamado criado para massa demo de produtividade.', t.created_at
FROM tickets t
CROSS JOIN users admin
WHERE admin.email = 'admin@helpdesk.com'
  AND t.title LIKE '[Demo]%'
UNION ALL
SELECT t.id, admin.id, 'ATRIBUICAO_TECNICO', 'Analista atribuído para acompanhamento operacional.', t.created_at + INTERVAL '30 minutes'
FROM tickets t
CROSS JOIN users admin
WHERE admin.email = 'admin@helpdesk.com'
  AND t.title LIKE '[Demo]%'
  AND t.technician_id IS NOT NULL
UNION ALL
SELECT t.id, t.technician_id, 'ALTERACAO_STATUS', 'Status alterado de Aberto para Em andamento.', t.created_at + INTERVAL '2 hours'
FROM tickets t
WHERE t.title LIKE '[Demo]%'
  AND t.status IN ('EM_ANDAMENTO', 'RESOLVIDO')
UNION ALL
SELECT t.id, t.technician_id, 'RESOLUCAO', 'Chamado resolvido após análise técnica.', t.resolved_at
FROM tickets t
WHERE t.title LIKE '[Demo]%'
  AND t.status = 'RESOLVIDO'
UNION ALL
SELECT t.id, admin.id, 'CANCELAMENTO', 'Chamado cancelado após validação da solicitação.', t.updated_at
FROM tickets t
CROSS JOIN users admin
WHERE admin.email = 'admin@helpdesk.com'
  AND t.title LIKE '[Demo]%'
  AND t.status = 'CANCELADO'
UNION ALL
SELECT t.id, t.technician_id, 'COMENTARIO', 'Comentário técnico registrado durante atendimento.', t.updated_at - INTERVAL '45 minutes'
FROM tickets t
WHERE t.title LIKE '[Demo]%'
  AND t.status IN ('EM_ANDAMENTO', 'RESOLVIDO');

INSERT INTO comments (ticket_id, author_id, text, internal, created_at, updated_at)
SELECT t.id, t.client_id, 'Incluí detalhes adicionais para apoiar a análise do atendimento.', false, t.created_at + INTERVAL '1 hour', t.created_at + INTERVAL '1 hour'
FROM tickets t
WHERE t.title LIKE '[Demo]%'
UNION ALL
SELECT t.id, t.technician_id, 'Análise interna registrada para demonstrar produtividade e acompanhamento técnico.', true, t.updated_at - INTERVAL '30 minutes', t.updated_at - INTERVAL '30 minutes'
FROM tickets t
WHERE t.title LIKE '[Demo]%'
  AND t.status IN ('EM_ANDAMENTO', 'RESOLVIDO');

INSERT INTO activity_events (type, title, description, actor_id, ticket_id, created_at)
SELECT 'CHAMADO_CRIADO', 'Chamado criado', 'Chamado demo criado para indicadores de produtividade.', admin.id, t.id, t.created_at
FROM tickets t
CROSS JOIN users admin
WHERE admin.email = 'admin@helpdesk.com'
  AND t.title LIKE '[Demo]%'
UNION ALL
SELECT 'ANALISTA_ATRIBUIDO', 'Analista atribuído', 'Chamado demo atribuído para composição do ranking por técnico.', admin.id, t.id, t.created_at + INTERVAL '30 minutes'
FROM tickets t
CROSS JOIN users admin
WHERE admin.email = 'admin@helpdesk.com'
  AND t.title LIKE '[Demo]%'
  AND t.technician_id IS NOT NULL
UNION ALL
SELECT
  CASE
    WHEN t.status = 'RESOLVIDO' THEN 'CHAMADO_RESOLVIDO'
    WHEN t.status = 'CANCELADO' THEN 'CHAMADO_CANCELADO'
    ELSE 'STATUS_ALTERADO'
  END,
  CASE
    WHEN t.status = 'RESOLVIDO' THEN 'Chamado resolvido'
    WHEN t.status = 'CANCELADO' THEN 'Chamado cancelado'
    ELSE 'Status alterado'
  END,
  'Evento demo registrado para timeline e central de atividades.',
  t.technician_id,
  t.id,
  t.updated_at
FROM tickets t
WHERE t.title LIKE '[Demo]%';

