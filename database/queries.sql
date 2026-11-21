

-- 1. FUZZY CANDIDATE MATCHING (Using pg_trgm GIN Index)
SELECT 
    e1.id AS entity_1_id,
    e1.canonical_name AS name_1,
    e2.id AS entity_2_id,
    e2.canonical_name AS name_2,
    ROUND(similarity(e1.normalized_name, e2.normalized_name)::NUMERIC, 4) AS trgm_score
FROM entities e1
JOIN entities e2 
    ON e1.entity_type = e2.entity_type 
   AND e1.id < e2.id
WHERE e1.normalized_name % e2.normalized_name
ORDER BY trgm_score DESC;

-- 2. MULTI-HOP NETWORK TRAVERSAL (Recursive CTE for Cytoscape.js Graph)
WITH RECURSIVE network_hops AS (
    -- Anchor: Direct 1-hop relationships from target entity
    SELECT 
        r.id AS relationship_id,
        r.entity_id_1 AS source_id,
        r.entity_id_2 AS target_id,
        r.relationship_type,
        1 AS hop_depth,
        ARRAY[r.entity_id_1, r.entity_id_2] AS visited_path
    FROM relationships r
    WHERE r.entity_id_1 = '55555555-5555-5555-5555-555555555501'
      AND r.status = 'verified'

    UNION ALL

    -- Recursive step: Traverse up to 3 hops without cycles
    SELECT 
        r.id,
        r.entity_id_1,
        r.entity_id_2,
        r.relationship_type,
        nh.hop_depth + 1,
        nh.visited_path || r.entity_id_2
    FROM relationships r
    JOIN network_hops nh ON r.entity_id_1 = nh.target_id
    WHERE nh.hop_depth < 3
      AND r.status = 'verified'
      AND NOT (r.entity_id_2 = ANY(nh.visited_path))
)
SELECT 
    nh.hop_depth,
    e_src.canonical_name AS source_entity,
    nh.relationship_type,
    e_tgt.canonical_name AS target_entity
FROM network_hops nh
JOIN entities e_src ON nh.source_id = e_src.id
JOIN entities e_tgt ON nh.target_id = e_tgt.id
ORDER BY nh.hop_depth;

-- 3. WINDOW FUNCTION: Rank Top High-Risk Entities by Cross-Case & Transaction Activity
SELECT 
    entity_id,
    canonical_name,
    entity_type,
    total_cases,
    total_relationships,
    total_sent_amount,
    DENSE_RANK() OVER (
        ORDER BY total_cases DESC, total_relationships DESC, total_sent_amount DESC
    ) AS risk_rank
FROM vw_entity_activity_summary;

-- 4. QUERYING ANALYTICAL VIEWS
SELECT * FROM vw_cross_case_entities;
SELECT * FROM vw_entity_activity_summary;

-- 5. EVIDENCE TRACEABILITY QUERY (100% Alert-to-Source Audit)
SELECT 
    a.title AS alert_title,
    a.severity,
    ae.explanation AS evidence_note,
    e.canonical_name AS flagged_entity,
    c.case_number AS linked_case,
    d.file_name AS source_document
FROM alerts a
JOIN alert_evidence ae ON a.id = ae.alert_id
LEFT JOIN entities e ON ae.entity_id = e.id
LEFT JOIN case_entities ce ON e.id = ce.entity_id
LEFT JOIN cases c ON ce.case_id = c.id
LEFT JOIN entity_mentions em ON e.id = em.resolved_entity_id
LEFT JOIN documents d ON em.document_id = d.id;

-- 6. EXECUTE ACID ENTITY MERGE TRANSACTION (Human Approval)
-- CALL sp_approve_entity_merge(
--     '77777777-7777-7777-7777-777777777701', -- candidate_id
--     '55555555-5555-5555-5555-555555555501', -- keep: Suresh Shetty
--     '55555555-5555-5555-5555-555555555502', -- remove: Suresh K Shetty
--     '11111111-1111-1111-1111-111111111101', -- reviewer: Insp. Vikram Rao
--     'Confirmed same individual via bank ledger and FIR phone link.'
-- );

-- 7. QUERY OPTIMIZATION & INDEX VERIFICATION
EXPLAIN ANALYZE
SELECT id, canonical_name 
FROM entities 
WHERE normalized_name % 'suresh shety';