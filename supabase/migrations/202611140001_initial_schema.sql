
-- CrimeGraph: Initial PostgreSQL schema
-- Uses synthetic/fictional data for development and demonstration.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
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

-- 3. SOURCES
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

-- 4. DOCUMENTS
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

-- 5. ENTITIES: canonical/verified entity records
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

-- 6. ENTITY_MENTIONS: raw extracted mentions, separate from entities
CREATE TABLE entity_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
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

-- 7. CASE_ENTITIES: many-to-many association between cases and entities
CREATE TABLE case_entities (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    association_type VARCHAR(50) NOT NULL DEFAULT 'mentioned',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, entity_id)
);

-- 8. ENTITY_MATCH_CANDIDATES: proposed matches require human review
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
    CHECK (entity_id_1 <> entity_id_2),
    CHECK (
        (status = 'pending' AND reviewed_at IS NULL)
        OR
        (status IN ('accepted', 'rejected') AND reviewed_at IS NOT NULL)
    ),
    UNIQUE (entity_id_1, entity_id_2)
);

-- 9. RELATIONSHIPS: documented links between canonical entities
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

-- 10. CALL_RECORDS: synthetic communication metadata
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

-- 11. TRANSACTIONS: synthetic financial transaction metadata
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

-- 12. RELATIONSHIP_EVIDENCE: each row points to exactly one evidence record
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

-- 13. ALERTS: explainable, reviewable alerts
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

-- 14. AUDIT_LOGS: record important user/system actions
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

-- INDEXES
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_source_id ON documents(source_id);
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_normalized_name ON entities(normalized_name);
CREATE INDEX idx_entities_name_trgm ON entities USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX idx_mentions_document_id ON entity_mentions(document_id);
CREATE INDEX idx_mentions_normalized_text ON entity_mentions(normalized_text);
CREATE INDEX idx_case_entities_entity_id ON case_entities(entity_id);
CREATE INDEX idx_match_candidates_status ON entity_match_candidates(status);
CREATE INDEX idx_relationships_entity_1 ON relationships(entity_id_1);
CREATE INDEX idx_relationships_entity_2 ON relationships(entity_id_2);
CREATE INDEX idx_relationships_status ON relationships(status);
CREATE INDEX idx_call_records_time ON call_records(call_time);
CREATE INDEX idx_call_records_caller ON call_records(caller_entity_id);
CREATE INDEX idx_call_records_receiver ON call_records(receiver_entity_id);
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_sender ON transactions(sender_entity_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_entity_id);
CREATE INDEX idx_relationship_evidence_relationship ON relationship_evidence(relationship_id);
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
