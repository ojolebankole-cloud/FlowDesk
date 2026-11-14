-- Audit events are append-only. Application credentials cannot silently rewrite history.
CREATE OR REPLACE FUNCTION flowdesk_reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent records are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_event_no_update ON "AuditEvent";
CREATE TRIGGER audit_event_no_update BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION flowdesk_reject_audit_mutation();
DROP TRIGGER IF EXISTS audit_event_no_truncate ON "AuditEvent";
CREATE TRIGGER audit_event_no_truncate BEFORE TRUNCATE ON "AuditEvent"
FOR EACH STATEMENT EXECUTE FUNCTION flowdesk_reject_audit_mutation();
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
