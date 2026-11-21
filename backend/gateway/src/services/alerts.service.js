
const supabase = require('../config/supabase');

// Get all alerts
const getAllAlerts = async () => {
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get alert by ID
const getAlertById = async (id) => {
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Get alerts by case
const getAlertsByCase = async (caseId) => {
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Create alert
const createAlert = async (alertData) => {
    const { data, error } = await supabase
        .from('alerts')
        .insert([alertData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Update alert status
const updateAlertStatus = async (id, updateData) => {
    const { data, error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllAlerts,
    getAlertById,
    getAlertsByCase,
    createAlert,
    updateAlertStatus
};
