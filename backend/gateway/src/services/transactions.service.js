
const supabase = require('../config/supabase');

// Get all transactions
const getAllTransactions = async () => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_time', { ascending: false });

    if (error) throw error;
    return data;
};

// Get transaction by ID
const getTransactionById = async (id) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Get transactions involving an entity
const getTransactionsByEntity = async (entityId) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(
            `sender_entity_id.eq.${entityId},receiver_entity_id.eq.${entityId}`
        )
        .order('transaction_time', { ascending: false });

    if (error) throw error;
    return data;
};

// Create a transaction
const createTransaction = async (transactionData) => {
    const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    getAllTransactions,
    getTransactionById,
    getTransactionsByEntity,
    createTransaction
};
