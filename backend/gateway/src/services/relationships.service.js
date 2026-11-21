
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

module.exports = {
    getAllRelationships,
    getEntityRelationships,
    createRelationship
};
