
-- 1. Cross-Case Entity View (Identifies entities appearing in >1 case)
CREATE OR REPLACE VIEW vw_cross_case_entities AS
SELECT 
    e.id AS entity_id,
    e.entity_type,
    e.canonical_name,
    e.verification_status,
    COUNT(DISTINCT ce.case_id) AS case_count,
    ARRAY_AGG(DISTINCT c.case_number) AS linked_cases
FROM entities e
JOIN case_entities ce ON e.id = ce.entity_id
JOIN cases c ON ce.case_id = c.id
GROUP BY e.id, e.entity_type, e.canonical_name, e.verification_status
HAVING COUNT(DISTINCT ce.case_id) > 1;

-- 2. Entity Network Activity Summary (Aggregates degree, calls & money flow)
CREATE OR REPLACE VIEW vw_entity_activity_summary AS
SELECT 
    e.id AS entity_id,
    e.canonical_name,
    e.entity_type,
    COUNT(DISTINCT ce.case_id) AS total_cases,
    COUNT(DISTINCT r.id) AS total_relationships,
    COALESCE(SUM(t.amount), 0) AS total_sent_amount,
    COUNT(DISTINCT cr.id) AS total_calls_made
FROM entities e
LEFT JOIN case_entities ce ON e.id = ce.entity_id
LEFT JOIN relationships r ON (e.id = r.entity_id_1 OR e.id = r.entity_id_2) AND r.status = 'verified'
LEFT JOIN transactions t ON e.id = t.sender_entity_id
LEFT JOIN call_records cr ON e.id = cr.caller_entity_id
GROUP BY e.id, e.canonical_name, e.entity_type;