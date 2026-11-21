

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'investigator'
        CHECK (role IN ('admin', 'investigator', 'analyst', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CASES
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(60) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'under_review', 'closed', 'archived')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CASE_ASSIGNMENTS (Case-Level RBAC)
CREATE TABLE case_assignments (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_role VARCHAR(30) NOT NULL DEFAULT 'investigator'
        CHECK (assigned_role IN ('lead_investigator', 'investigator', 'analyst', 'viewer')),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, user_id)
);

-- 4. SOURCES
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    source_type VARCHAR(40) NOT NULL,
    source_name VARCHAR(200) NOT NULL,
    description TEXT,
    reference_code VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DOCUMENTS
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(80),
    storage_path TEXT NOT NULL,
    file_hash VARCHAR(128),
    extracted_text TEXT,
    processing_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENTITIES (Canonical Entity Records)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(30) NOT NULL
        CHECK (entity_type IN ('person', 'phone', 'vehicle', 'location', 'organization', 'account', 'other')),
    canonical_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
    verification_status VARCHAR(25) NOT NULL DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified', 'verified', 'disputed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENTITY_ALIASES
CREATE TABLE entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    source_type VARCHAR(40) DEFAULT 'manual',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_id, normalized_alias)
);

-- 8. ENTITY_MENTIONS (Raw Extracted Mentions)
CREATE TABLE entity_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    resolved_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    entity_type VARCHAR(30) NOT NULL,
    mention_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    start_offset INTEGER CHECK (start_offset IS NULL OR start_offset >= 0),
    end_offset INTEGER CHECK (end_offset IS NULL OR end_offset >= 0),
    confidence NUMERIC(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    extraction_method VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        start_offset IS NULL OR end_offset IS NULL OR end_offset >= start_offset
    )
);

-- 9. CASE_ENTITIES
CREATE TABLE case_entities (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    association_type VARCHAR(50) NOT NULL DEFAULT 'mentioned',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, entity_id)
);

-- 10. ENTITY_MATCH_CANDIDATES
CREATE TABLE entity_match_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id_1 UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    entity_id_2 UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5,4) NOT NULL
        CHECK (similarity_score BETWEEN 0 AND 1),
    explanation JSONB NOT NULL DEFAULT '{}'::JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_canonical_entity_order CHECK (entity_id_1 < entity_id_2),
    CHECK (
        (status = 'pending' AND reviewed_at IS NULL)
        OR
        (status IN ('accepted', 'rejected') AND reviewed_at IS NOT NULL)
    ),
    UNIQUE (entity_id_1, entity_id_2)
);

-- 11. RELATIONSHIPS
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id_1 UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    entity_id_2 UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    relationship_type VARCHAR(60) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'under_review'
        CHECK (status IN ('under_review', 'verified', 'rejected')),
    confidence NUMERIC(5,4)
        CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (entity_id_1 <> entity_id_2)
);

-- 12. CALL_RECORDS
CREATE TABLE call_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    caller_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    receiver_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    call_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0
        CHECK (duration_seconds >= 0),
    call_type VARCHAR(30),
    reference_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (caller_entity_id <> receiver_entity_id)
);

-- 13. TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    sender_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    receiver_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    transaction_time TIMESTAMPTZ NOT NULL,
    transaction_reference VARCHAR(120),
    transaction_type VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (sender_entity_id <> receiver_entity_id)
);

-- 14. RELATIONSHIP_EVIDENCE
CREATE TABLE relationship_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE RESTRICT,
    mention_id UUID REFERENCES entity_mentions(id) ON DELETE RESTRICT,
    call_record_id UUID REFERENCES call_records(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE RESTRICT,
    explanation TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        num_nonnulls(document_id, mention_id, call_record_id, transaction_id) = 1
    )
);

-- 15. ALERTS
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    alert_type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    reason JSONB NOT NULL DEFAULT '{}'::JSONB,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'dismissed', 'resolved')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ALERT_EVIDENCE
CREATE TABLE alert_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE RESTRICT,
    relationship_id UUID REFERENCES relationships(id) ON DELETE RESTRICT,
    document_id UUID REFERENCES documents(id) ON DELETE RESTRICT,
    call_record_id UUID REFERENCES call_records(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE RESTRICT,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        num_nonnulls(entity_id, relationship_id, document_id, call_record_id, transaction_id) = 1
    )
);

-- 17. CASE_NOTES
CREATE TABLE case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AUDIT_LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enforce append-only immutability on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.'; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_audit_logs
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- ACID TRANSACTION STORED PROCEDURE (Human-in-the-Loop Entity Merge)
-- ============================================================================
CREATE OR REPLACE PROCEDURE sp_approve_entity_merge(
    p_candidate_id UUID,
    p_keep_entity_id UUID,
    p_remove_entity_id UUID,
    p_reviewer_id UUID,
    p_notes TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_name VARCHAR(255);
    v_old_norm VARCHAR(255);
BEGIN
    IF p_keep_entity_id = p_remove_entity_id THEN
        RAISE EXCEPTION 'Cannot merge an entity with itself.';
    END IF;

    SELECT canonical_name, normalized_name 
    INTO v_old_name, v_old_norm
    FROM entities WHERE id = p_remove_entity_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target entity % to remove does not exist.', p_remove_entity_id;
    END IF;

    UPDATE entity_match_candidates
    SET status = 'accepted',
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        review_notes = p_notes
    WHERE id = p_candidate_id;

    INSERT INTO entity_aliases (entity_id, alias_name, normalized_alias, source_type, added_by)
    VALUES (p_keep_entity_id, v_old_name, v_old_norm, 'entity_merge', p_reviewer_id)
    ON CONFLICT (entity_id, normalized_alias) DO NOTHING;

    UPDATE entity_mentions
    SET resolved_entity_id = p_keep_entity_id
    WHERE resolved_entity_id = p_remove_entity_id;

    UPDATE case_notes
    SET entity_id = p_keep_entity_id
    WHERE entity_id = p_remove_entity_id;

    INSERT INTO case_entities (case_id, entity_id, association_type, added_by)
    SELECT case_id, p_keep_entity_id, association_type, p_reviewer_id
    FROM case_entities
    WHERE entity_id = p_remove_entity_id
    ON CONFLICT (case_id, entity_id) DO NOTHING;

    DELETE FROM case_entities WHERE entity_id = p_remove_entity_id;

    UPDATE relationships SET entity_id_1 = p_keep_entity_id WHERE entity_id_1 = p_remove_entity_id;
    UPDATE relationships SET entity_id_2 = p_keep_entity_id WHERE entity_id_2 = p_remove_entity_id;
    DELETE FROM relationships WHERE entity_id_1 = entity_id_2;

    UPDATE call_records SET caller_entity_id = p_keep_entity_id WHERE caller_entity_id = p_remove_entity_id;
    UPDATE call_records SET receiver_entity_id = p_keep_entity_id WHERE receiver_entity_id = p_remove_entity_id;
    DELETE FROM call_records WHERE caller_entity_id = receiver_entity_id;

    UPDATE transactions SET sender_entity_id = p_keep_entity_id WHERE sender_entity_id = p_remove_entity_id;
    UPDATE transactions SET receiver_entity_id = p_keep_entity_id WHERE receiver_entity_id = p_remove_entity_id;
    DELETE FROM transactions WHERE sender_entity_id = receiver_entity_id;

    UPDATE alert_evidence SET entity_id = p_keep_entity_id WHERE entity_id = p_remove_entity_id;

    DELETE FROM entities WHERE id = p_remove_entity_id;

    INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
    VALUES (
        p_reviewer_id,
        'ENTITY_MERGED',
        'entities',
        p_keep_entity_id,
        jsonb_build_object(
            'merged_from_id', p_remove_entity_id,
            'merged_alias', v_old_name,
            'candidate_id', p_candidate_id
        )
    );
END;
$$;