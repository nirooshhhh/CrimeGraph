
const supabase = require('../config/supabase');

// Get all relationships
const getAllRelationships = async () => {
    const { data, error } = await supabase
        .from('relationships')
        .select('*');

    if (error) throw error;
    return data;
};

// Get relationships for a particular entity
const getEntityRelationships = async (entityId) => {
    const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .or(`entity_id_1.eq.${entityId},entity_id_2.eq.${entityId}`);

    if (error) throw error;
    return data;
};

// Create a relationship
const createRelationship = async (relationshipData) => {
    const { data, error } = await supabase
        .from('relationships')
        .insert([relationshipData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Get evidence for a relationship
const getRelationshipEvidence = async (relationshipId) => {
    const { data, error } = await supabase
        .from('relationship_evidence')
        .select('*')
        .eq('relationship_id', relationshipId);

    if (error) throw error;
    return data;
};

// Add evidence to a relationship
const createRelationshipEvidence = async (evidenceData) => {
    const { data, error } = await supabase
        .from('relationship_evidence')
        .insert([evidenceData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllRelationships,
    getEntityRelationships,
    createRelationship,
    getRelationshipEvidence,
    createRelationshipEvidence
};
