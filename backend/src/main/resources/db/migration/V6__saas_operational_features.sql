ALTER TABLE comments
  ADD COLUMN internal BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN updated_at TIMESTAMPTZ;

UPDATE comments SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE comments
  ALTER COLUMN updated_at SET NOT NULL;

CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(120) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_attachments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_events (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(700) NOT NULL,
  actor_id BIGINT REFERENCES users(id),
  ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reset_token_value ON password_reset_tokens(token);
CREATE INDEX idx_reset_token_user ON password_reset_tokens(user_id);
CREATE INDEX idx_attachment_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_activity_created_at ON activity_events(created_at DESC);
CREATE INDEX idx_activity_type ON activity_events(type);
CREATE INDEX idx_activity_actor ON activity_events(actor_id);
CREATE INDEX idx_activity_ticket ON activity_events(ticket_id);
