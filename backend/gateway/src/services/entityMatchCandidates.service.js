
const supabase = require('../config/supabase');

// Get all candidates
const getAllCandidates = async () => {
    const { data, error } = await supabase
        .from('entity_match_candidates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get candidates by status
const getCandidatesByStatus = async (status) => {
    const { data, error } = await supabase
        .from('entity_match_candidates')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get candidate by ID
const getCandidateById = async (id) => {
    const { data, error } = await supabase
        .from('entity_match_candidates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Create candidate
const createCandidate = async (candidateData) => {
    const { data, error } = await supabase
        .from('entity_match_candidates')
        .insert([candidateData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Review candidate
const reviewCandidate = async (id, reviewData) => {
    const { data, error } = await supabase
        .from('entity_match_candidates')
        .update(reviewData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllCandidates,
    getCandidatesByStatus,
    getCandidateById,
    createCandidate,
    reviewCandidate
};
