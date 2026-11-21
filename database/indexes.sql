

-- Case & RBAC lookups
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_case_assignments_user_id ON case_assignments(user_id);

-- Document & Source lookups
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_source_id ON documents(source_id);

-- Entity exact & trigram fuzzy matching (pg_trgm)
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_normalized_name ON entities(normalized_name);
CREATE INDEX idx_entities_name_trgm ON entities USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX idx_entity_aliases_trgm ON entity_aliases USING GIN (normalized_alias gin_trgm_ops);

-- Mention traceability & resolution
CREATE INDEX idx_mentions_document_id ON entity_mentions(document_id);
CREATE INDEX idx_mentions_resolved_entity ON entity_mentions(resolved_entity_id);
CREATE INDEX idx_mentions_normalized_text ON entity_mentions(normalized_text);

-- Cross-case & Match Candidate filtering
CREATE INDEX idx_case_entities_entity_id ON case_entities(entity_id);
CREATE INDEX idx_match_candidates_status ON entity_match_candidates(status);

-- Graph traversal (Relationships, CDRs, Transactions)
CREATE INDEX idx_relationships_entity_1 ON relationships(entity_id_1);
CREATE INDEX idx_relationships_entity_2 ON relationships(entity_id_2);
CREATE INDEX idx_relationships_status ON relationships(status);

CREATE INDEX idx_call_records_time ON call_records(call_time);
CREATE INDEX idx_call_records_caller ON call_records(caller_entity_id);
CREATE INDEX idx_call_records_receiver ON call_records(receiver_entity_id);

CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_sender ON transactions(sender_entity_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_entity_id);

-- Evidence, Alerts & Audit trail
CREATE INDEX idx_relationship_evidence_relationship ON relationship_evidence(relationship_id);
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alert_evidence_alert ON alert_evidence(alert_id);
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);