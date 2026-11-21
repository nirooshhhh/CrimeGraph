
const supabase = require('../config/supabase');

// Get all call records
const getAllCallRecords = async () => {
    const { data, error } = await supabase
        .from('call_records')
        .select('*')
        .order('call_time', { ascending: false });

    if (error) throw error;
    return data;
};

// Get call record by ID
const getCallRecordById = async (id) => {
    const { data, error } = await supabase
        .from('call_records')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Get calls involving an entity
const getCallRecordsByEntity = async (entityId) => {
    const { data, error } = await supabase
        .from('call_records')
        .select('*')
        .or(
            `caller_entity_id.eq.${entityId},receiver_entity_id.eq.${entityId}`
        )
        .order('call_time', { ascending: false });

    if (error) throw error;
    return data;
};

// Create a call record
const createCallRecord = async (callData) => {
    const { data, error } = await supabase
        .from('call_records')
        .insert([callData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllCallRecords,
    getCallRecordById,
    getCallRecordsByEntity,
    createCallRecord
};
