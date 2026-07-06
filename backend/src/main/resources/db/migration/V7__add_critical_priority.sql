DO $$
DECLARE
  priority_constraint TEXT;
BEGIN
  FOR priority_constraint IN
    SELECT checks.constraint_name
    FROM information_schema.check_constraints checks
    JOIN information_schema.constraint_table_usage usage
      ON usage.constraint_catalog = checks.constraint_catalog
     AND usage.constraint_schema = checks.constraint_schema
     AND usage.constraint_name = checks.constraint_name
    WHERE checks.constraint_schema = current_schema()
      AND usage.table_schema = current_schema()
      AND usage.table_name = 'tickets'
      AND checks.check_clause LIKE '%priority%'
  LOOP
    EXECUTE format('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS %I', priority_constraint);
  END LOOP;
END $$;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_priority_check
  CHECK (priority IN ('BAIXA','MEDIA','ALTA','URGENTE','CRITICA'));
