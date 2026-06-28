ALTER TABLE tickets
ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'OUTROS';

CREATE INDEX idx_ticket_category ON tickets(category);
