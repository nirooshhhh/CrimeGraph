
const supabase = require('../config/supabase');

const getGraphData = async (caseId) => {
    // Get entities linked to this case
    const { data: caseEntities, error: caseError } = await supabase
        .from('case_entities')
        .select('entity_id')
        .eq('case_id', caseId);

    if (caseError) throw caseError;

    const entityIds = caseEntities.map(item => item.entity_id);

    if (entityIds.length === 0) {
        return { nodes: [], edges: [] };
    }

    // Fetch only entities belonging to this case
    const { data: entities, error: entityError } = await supabase
        .from('entities')
        .select('id, entity_type, canonical_name, attributes, verification_status')
        .in('id', entityIds);

    if (entityError) throw entityError;

    // Fetch relationships connected to these entities
    const { data: relationships, error: relationshipError } = await supabase
        .from('relationships')
        .select('id, entity_id_1, entity_id_2, relationship_type, status, confidence')
        .in('entity_id_1', entityIds)
        .in('entity_id_2', entityIds);

    if (relationshipError) throw relationshipError;

    const nodes = entities.map(entity => ({
        id: entity.id,
        label: entity.canonical_name,
        type: entity.entity_type,
        attributes: entity.attributes,
        verification_status: entity.verification_status
    }));

    const edges = relationships.map(relationship => ({
        id: relationship.id,
        source: relationship.entity_id_1,
        target: relationship.entity_id_2,
        label: relationship.relationship_type,
        status: relationship.status,
        confidence: relationship.confidence
    }));

    return { nodes, edges };
};

module.exports = { getGraphData };
