
const supabase = require('../config/supabase');

// Get all audit logs
const getAllAuditLogs = async () => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get log by ID
const getAuditLogById = async (id) => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Get logs by user
const getAuditLogsByUser = async (userId) => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Get logs by table
const getAuditLogsByTable = async (tableName) => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Create audit log
const createAuditLog = async (logData) => {
    const { data, error } = await supabase
        .from('audit_logs')
        .insert([logData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser,
    getAuditLogsByTable,
    createAuditLog
};
