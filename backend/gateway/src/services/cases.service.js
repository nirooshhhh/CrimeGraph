
const supabase = require('../config/supabase');

// Get all cases
const getAllCases = async () => {
    const { data, error } = await supabase
        .from('cases')
        .select('*');

    if (error) throw error;

    return data;
};

// Get one case by ID
const getCaseById = async (id) => {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    return data;
};

// Create a new case
const createCase = async (caseData) => {
    const { data, error } = await supabase
        .from('cases')
        .insert([caseData])
        .select()
        .single();

    if (error) throw error;

    return data;
};

const linkEntityToCase = async (caseId, entityId) => {
    const { data, error } = await supabase
        .from('case_entities')
        .insert([{
            case_id: caseId,
            entity_id: entityId
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllCases,
    getCaseById,
    createCase,
    linkEntityToCase
};
