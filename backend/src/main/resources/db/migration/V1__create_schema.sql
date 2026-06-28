CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','TECNICO','CLIENTE')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  client_id BIGINT NOT NULL REFERENCES users(id),
  technician_id BIGINT REFERENCES users(id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('ABERTO','EM_ANDAMENTO','RESOLVIDO','CANCELADO')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('BAIXA','MEDIA','ALTA','URGENTE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id),
  text VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_history (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id BIGINT NOT NULL REFERENCES users(id),
  event_type VARCHAR(40) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_client ON tickets(client_id);
CREATE INDEX idx_ticket_technician ON tickets(technician_id);
CREATE INDEX idx_ticket_status_priority ON tickets(status, priority);
CREATE INDEX idx_ticket_updated_at ON tickets(updated_at DESC);
CREATE INDEX idx_comment_ticket ON comments(ticket_id);
CREATE INDEX idx_history_ticket ON ticket_history(ticket_id);
