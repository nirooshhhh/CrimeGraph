
const auditLogsService = require('../services/auditLogs.service');

const getAllAuditLogs = async (req, res) => {
    try {
        const logs = await auditLogsService.getAllAuditLogs();
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAuditLogById = async (req, res) => {
    try {
        const log = await auditLogsService.getAuditLogById(req.params.id);
        res.status(200).json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAuditLogsByUser = async (req, res) => {
    try {
        const logs = await auditLogsService.getAuditLogsByUser(req.params.userId);
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAuditLogsByTable = async (req, res) => {
    try {
        const logs = await auditLogsService.getAuditLogsByTable(req.params.tableName);
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createAuditLog = async (req, res) => {
    try {
        const {
            user_id,
            action,
            table_name,
            record_id,
            details,
            ip_address
        } = req.body || {};

        if (!action) {
            return res.status(400).json({
                success: false,
                message: 'action is required'
            });
        }

        const log = await auditLogsService.createAuditLog({
            user_id: user_id || null,
            action,
            table_name: table_name || null,
            record_id: record_id || null,
            details: details || {},
            ip_address: ip_address || null
        });

        res.status(201).json({
            success: true,
            message: 'Audit log created successfully',
            data: log
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser,
    getAuditLogsByTable,
    createAuditLog
};
