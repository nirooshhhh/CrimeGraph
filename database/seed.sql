

-- 1. USERS
INSERT INTO users (id, full_name, email, role) VALUES
('11111111-1111-1111-1111-111111111101', 'Insp. Vikram Rao', 'vikram.rao@crimegraph.demo', 'admin'),
('11111111-1111-1111-1111-111111111102', 'SI Ananya Nair', 'ananya.nair@crimegraph.demo', 'investigator'),
('11111111-1111-1111-1111-111111111103', 'Rohan Kulkarni', 'rohan.k@crimegraph.demo', 'analyst');

-- 2. CASES
INSERT INTO cases (id, case_number, title, description, status, priority, created_by) VALUES
('22222222-2222-2222-2222-222222222201', 'CG-2026-001', 'Harbor Cargo Theft Ring', 'Organized diversion of electronics shipments near Mangalore port.', 'open', 'high', '11111111-1111-1111-1111-111111111101'),
('22222222-2222-2222-2222-222222222202', 'CG-2026-002', 'Shell Logistics Hawala Network', 'Suspicious high-value transfers linked to unregistered transport operators.', 'under_review', 'critical', '11111111-1111-1111-1111-111111111102');

-- 3. CASE_ASSIGNMENTS
INSERT INTO case_assignments (case_id, user_id, assigned_role, assigned_by) VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'lead_investigator', '11111111-1111-1111-1111-111111111101'),
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'analyst', '11111111-1111-1111-1111-111111111101'),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'lead_investigator', '11111111-1111-1111-1111-111111111101');

-- 4. SOURCES
INSERT INTO sources (id, case_id, source_type, source_name, reference_code, created_by) VALUES
('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'FIR', 'Harbor Police Station FIR #104', 'FIR-104-2026', '11111111-1111-1111-1111-111111111102'),
('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'BANK_STATEMENT', 'Coastal Co-op Ledger Export', 'FIN-889-2026', '11111111-1111-1111-1111-111111111103');

-- 5. DOCUMENTS
INSERT INTO documents (id, case_id, source_id, uploaded_by, file_name, file_type, storage_path, extracted_text, processing_status) VALUES
('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111102', 'fir_104_statement.pdf', 'application/pdf', 'cases/cg-2026-001/fir_104_statement.pdf', 'Witness spotted Suresh Shetty loading crates into truck KA-19-AB-4321 and calling +919800001111.', 'completed'),
('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111103', 'ledger_march_2026.csv', 'text/csv', 'cases/cg-2026-002/ledger_march_2026.csv', 'Transfer of INR 450000 from Apex Freight to Suresh K Shetty.', 'completed');

-- 6. ENTITIES (Notice canonical UUID ordering for candidate pair)
INSERT INTO entities (id, entity_type, canonical_name, normalized_name, verification_status, created_by) VALUES
('55555555-5555-5555-5555-555555555501', 'person', 'Suresh Shetty', 'suresh shetty', 'verified', '11111111-1111-1111-1111-111111111102'),
('55555555-5555-5555-5555-555555555502', 'person', 'Suresh K Shetty', 'suresh k shetty', 'unverified', '11111111-1111-1111-1111-111111111103'),
('55555555-5555-5555-5555-555555555503', 'phone', '+91-9800001111', '919800001111', 'verified', '11111111-1111-1111-1111-111111111102'),
('55555555-5555-5555-5555-555555555504', 'vehicle', 'KA-19-AB-4321', 'ka19ab4321', 'verified', '11111111-1111-1111-1111-111111111102'),
('55555555-5555-5555-5555-555555555505', 'organization', 'Apex Freight Pvt Ltd', 'apex freight pvt ltd', 'verified', '11111111-1111-1111-1111-111111111103');

-- 7. ENTITY_MENTIONS
INSERT INTO entity_mentions (id, document_id, resolved_entity_id, entity_type, mention_text, normalized_text, start_offset, end_offset, confidence, extraction_method) VALUES
('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555501', 'person', 'Suresh Shetty', 'suresh shetty', 16, 29, 0.9850, 'spacy_ner'),
('66666666-6666-6666-6666-666666666602', '44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555504', 'vehicle', 'KA-19-AB-4321', 'ka19ab4321', 55, 68, 0.9990, 'regex'),
('66666666-6666-6666-6666-666666666603', '44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555503', 'phone', '+919800001111', '919800001111', 81, 94, 0.9950, 'regex'),
('66666666-6666-6666-6666-666666666604', '44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555502', 'person', 'Suresh K Shetty', 'suresh k shetty', 44, 59, 0.9600, 'spacy_ner');

-- 8. CASE_ENTITIES (Demonstrates Cross-Case Link for Phone +91-9800001111)
INSERT INTO case_entities (case_id, entity_id, association_type, added_by) VALUES
('22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', 'suspect', '11111111-1111-1111-1111-111111111102'),
('22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555503', 'linked_contact', '11111111-1111-1111-1111-111111111102'),
('22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555504', 'suspect_vehicle', '11111111-1111-1111-1111-111111111102'),
('22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555502', 'beneficiary', '11111111-1111-1111-1111-111111111103'),
('22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555503', 'linked_contact', '11111111-1111-1111-1111-111111111103'),
('22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555505', 'shell_entity', '11111111-1111-1111-1111-111111111103');

-- 9. ENTITY_MATCH_CANDIDATES (Pending human review)
INSERT INTO entity_match_candidates (id, entity_id_1, entity_id_2, similarity_score, explanation, status) VALUES
('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555502', 0.8421, '{"method": "pg_trgm", "reason": "High trigram name similarity across CG-2026-001 and CG-2026-002"}', 'pending');

-- 10. RELATIONSHIPS
INSERT INTO relationships (id, entity_id_1, entity_id_2, relationship_type, description, status, confidence, created_by) VALUES
('88888888-8888-8888-8888-888888888801', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555504', 'OPERATES_VEHICLE', 'Observed loading cargo into KA-19-AB-4321', 'verified', 0.9500, '11111111-1111-1111-1111-111111111102'),
('88888888-8888-8888-8888-888888888802', '55555555-5555-5555-5555-555555555505', '55555555-5555-5555-5555-555555555502', 'TRANSFERRED_FUNDS_TO', 'Direct bank transfer of INR 4.5L', 'verified', 0.9900, '11111111-1111-1111-1111-111111111103');

-- 11. CALL_RECORDS & TRANSACTIONS
INSERT INTO call_records (id, source_id, caller_entity_id, receiver_entity_id, call_time, duration_seconds, call_type, reference_code) VALUES
('99999999-9999-9999-9999-999999999901', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555503', '2026-03-14 23:15:00+05:30', 340, 'outgoing', 'CDR-9001');

INSERT INTO transactions (id, source_id, sender_entity_id, receiver_entity_id, amount, currency, transaction_time, transaction_reference, transaction_type) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555505', '55555555-5555-5555-5555-555555555502', 450000.00, 'INR', '2026-03-15 11:40:00+05:30', 'UTR-77281991', 'NEFT');

-- 12. RELATIONSHIP_EVIDENCE
INSERT INTO relationship_evidence (relationship_id, document_id, explanation, added_by) VALUES
('88888888-8888-8888-8888-888888888801', '44444444-4444-4444-4444-444444444401', 'Corroborated by FIR #104 eyewitness statement.', '11111111-1111-1111-1111-111111111102');

INSERT INTO relationship_evidence (relationship_id, transaction_id, explanation, added_by) VALUES
('88888888-8888-8888-8888-888888888802', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Verified via Coastal Co-op Ledger Export UTR-77281991.', '11111111-1111-1111-1111-111111111103');

-- 13. ALERTS & ALERT_EVIDENCE
INSERT INTO alerts (id, case_id, alert_type, title, description, reason, severity, status) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222202', 'CROSS_CASE_ENTITY', 'Phone Number Linked Across Two Active Investigations', 'Phone +91-9800001111 appears in both CG-2026-001 and CG-2026-002.', '{"rule": "cross_case_occurrence", "case_count": 2}', 'high', 'new');

INSERT INTO alert_evidence (alert_id, entity_id, explanation) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555503', 'Entity +91-9800001111 mapped in case_entities for CG-2026-001 and CG-2026-002.');

-- 14. AUDIT_LOGS
INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES
('11111111-1111-1111-1111-111111111101', 'SEED_INITIALIZED', 'cases', '22222222-2222-2222-2222-222222222201', '{"note": "Synthetic dataset loaded"}');