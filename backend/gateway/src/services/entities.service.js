
const supabase = require('../config/supabase');

// Get all entities
const getAllEntities = async () => {
    const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get entity by ID
const getEntityById = async (id) => {
    const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Create entity
const createEntity = async (entityData) => {
    const { data, error } = await supabase
        .from('entities')
        .insert([entityData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Find an existing entity
const findEntity = async (entityType, normalizedName) => {
    const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('normalized_name', normalizedName)
        .limit(1);

    if (error) throw error;
    return data.length > 0 ? data[0] : null;
};

// Save an extracted mention
const createEntityMention = async (mentionData) => {
    const { data, error } = await supabase
        .from('entity_mentions')
        .insert([mentionData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const linkEntityToCase = async (caseId, entityId) => {
    const { data, error } = await supabase
        .from('case_entities')
        .upsert(
            {
                case_id: caseId,
                entity_id: entityId,
                association_type: 'mentioned'
            },
            {
                onConflict: 'case_id,entity_id',
                ignoreDuplicates: true
            }
        )
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
};

const getMentionsByDocument = async (documentId) => {
    const { data, error } = await supabase
        .from('entity_mentions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

module.exports = {
    getAllEntities,
    getEntityById,
    createEntity,
    findEntity,
    createEntityMention,
    linkEntityToCase,
    getMentionsByDocument
};
