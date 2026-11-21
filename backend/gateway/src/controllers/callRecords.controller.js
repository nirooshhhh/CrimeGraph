
const callRecordsService = require('../services/callRecords.service');

// Get all call records
const getAllCallRecords = async (req, res) => {
    try {
        const records = await callRecordsService.getAllCallRecords();

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get call record by ID
const getCallRecordById = async (req, res) => {
    try {
        const record = await callRecordsService.getCallRecordById(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get calls involving an entity
const getCallRecordsByEntity = async (req, res) => {
    try {
        const records = await callRecordsService.getCallRecordsByEntity(
            req.params.entityId
        );

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create a call record
const createCallRecord = async (req, res) => {
    try {
        const {
            caller_entity_id,
            receiver_entity_id,
            source_id,
            call_time,
            duration_seconds,
            call_type,
            reference_code
        } = req.body || {};

        if (
            !caller_entity_id ||
            !receiver_entity_id ||
            !call_time
        ) {
            return res.status(400).json({
                success: false,
                message: 'Caller, receiver and call_time are required'
            });
        }

        if (caller_entity_id === receiver_entity_id) {
            return res.status(400).json({
                success: false,
                message: 'Caller and receiver cannot be the same entity'
            });
        }

        if (
            duration_seconds !== undefined &&
            (!Number.isInteger(duration_seconds) || duration_seconds < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'duration_seconds must be a non-negative integer'
            });
        }

        const record = await callRecordsService.createCallRecord({
            caller_entity_id,
            receiver_entity_id,
            source_id: source_id || null,
            call_time,
            duration_seconds: duration_seconds ?? null,
            call_type: call_type || null,
            reference_code: reference_code || null
        });

        res.status(201).json({
            success: true,
            message: 'Call record created successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllCallRecords,
    getCallRecordById,
    getCallRecordsByEntity,
    createCallRecord
};
