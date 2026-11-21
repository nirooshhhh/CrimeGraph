
const supabase = require('../config/supabase');

const getAllSources = async () => {
    const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

const getSourcesByCase = async (caseId) => {
    const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('case_id', caseId);

    if (error) throw error;
    return data;
};

const createSource = async (sourceData) => {
    const { data, error } = await supabase
        .from('sources')
        .insert([sourceData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllSources,
    getSourcesByCase,
    createSource
};
