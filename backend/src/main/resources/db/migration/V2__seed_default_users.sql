CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Senha de todos os usuários: Admin@123 (BCrypt gerado pelo PostgreSQL)
INSERT INTO users (name, email, password, role, active) VALUES
('Administrador', 'admin@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'ADMIN', true),
('João Técnico', 'tecnico@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'TECNICO', true),
('Maria Cliente', 'cliente@helpdesk.com', crypt('Admin@123', gen_salt('bf', 10)), 'CLIENTE', true);
