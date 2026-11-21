
const supabase = require('../config/supabase');

const getAllDocuments = async () => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
};

const getDocumentsByCase = async (caseId) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
};

const getDocumentById = async (id) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

const createDocument = async (documentData) => {
    const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllDocuments,
    getDocumentsByCase,
    getDocumentById,
    createDocument
};
