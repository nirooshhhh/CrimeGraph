
const transactionsService = require('../services/transactions.service');

// Get all transactions
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await transactionsService.getAllTransactions();

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
    try {
        const transaction = await transactionsService.getTransactionById(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get transactions involving an entity
const getTransactionsByEntity = async (req, res) => {
    try {
        const transactions = await transactionsService.getTransactionsByEntity(
            req.params.entityId
        );

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create a transaction
const createTransaction = async (req, res) => {
    try {
        const {
            sender_entity_id,
            receiver_entity_id,
            source_id,
            amount,
            currency,
            transaction_time,
            transaction_reference,
            transaction_type
        } = req.body || {};

        if (
            !sender_entity_id ||
            !receiver_entity_id ||
            amount === undefined ||
            amount === null ||
            !transaction_time
        ) {
            return res.status(400).json({
                success: false,
                message: 'Sender, receiver, amount and transaction_time are required'
            });
        }

        if (sender_entity_id === receiver_entity_id) {
            return res.status(400).json({
                success: false,
                message: 'Sender and receiver cannot be the same entity'
            });
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a non-negative number'
            });
        }

        const transaction = await transactionsService.createTransaction({
            sender_entity_id,
            receiver_entity_id,
            source_id: source_id || null,
            amount: Number(amount),
            currency: currency || 'INR',
            transaction_time,
            transaction_reference: transaction_reference || null,
            transaction_type: transaction_type || null
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllTransactions,
    getTransactionById,
    getTransactionsByEntity,
    createTransaction
};
