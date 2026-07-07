CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE users
SET password = crypt('Admin@123', gen_salt('bf', 10)),
    role = CASE email
      WHEN 'admin@helpdesk.com' THEN 'ADMIN'
      WHEN 'tecnico@helpdesk.com' THEN 'TECNICO'
      WHEN 'ana.suporte@helpdesk.com' THEN 'TECNICO'
      WHEN 'bruno.infra@helpdesk.com' THEN 'TECNICO'
      WHEN 'cliente@helpdesk.com' THEN 'CLIENTE'
      WHEN 'carlos.operacoes@helpdesk.com' THEN 'CLIENTE'
      WHEN 'fernanda.financeiro@helpdesk.com' THEN 'CLIENTE'
      WHEN 'rafael.logistica@helpdesk.com' THEN 'CLIENTE'
      WHEN 'patricia.rh@helpdesk.com' THEN 'CLIENTE'
      ELSE role
    END,
    active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email IN (
  'admin@helpdesk.com',
  'tecnico@helpdesk.com',
  'ana.suporte@helpdesk.com',
  'bruno.infra@helpdesk.com',
  'cliente@helpdesk.com',
  'carlos.operacoes@helpdesk.com',
  'fernanda.financeiro@helpdesk.com',
  'rafael.logistica@helpdesk.com',
  'patricia.rh@helpdesk.com'
);
