
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

module.exports = {
    getAllEntities,
    getEntityById,
    createEntity
};
