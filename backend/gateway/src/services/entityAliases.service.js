
const supabase = require('../config/supabase');

// Get all aliases
const getAllAliases = async () => {
    const { data, error } = await supabase
        .from('entity_aliases')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get aliases for an entity
const getAliasesByEntity = async (entityId) => {
    const { data, error } = await supabase
        .from('entity_aliases')
        .select('*')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Create alias
const createAlias = async (aliasData) => {
    const { data, error } = await supabase
        .from('entity_aliases')
        .insert([aliasData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Delete alias
const deleteAlias = async (id) => {
    const { data, error } = await supabase
        .from('entity_aliases')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllAliases,
    getAliasesByEntity,
    createAlias,
    deleteAlias
};
