
const alertsService = require('../services/alerts.service');

// Get all alerts
const getAllAlerts = async (req, res) => {
    try {
        const alerts = await alertsService.getAllAlerts();

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get alert by ID
const getAlertById = async (req, res) => {
    try {
        const alert = await alertsService.getAlertById(req.params.id);

        res.status(200).json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get alerts by case
const getAlertsByCase = async (req, res) => {
    try {
        const alerts = await alertsService.getAlertsByCase(req.params.caseId);

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create alert
const createAlert = async (req, res) => {
    try {
        const {
            case_id,
            alert_type,
            title,
            description,
            reason,
            severity
        } = req.body || {};

        if (!alert_type || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'alert_type, title and description are required'
            });
        }

        const allowedSeverities = ['low', 'medium', 'high', 'critical'];

        if (severity && !allowedSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid severity'
            });
        }

        const alert = await alertsService.createAlert({
            case_id: case_id || null,
            alert_type,
            title,
            description,
            reason: reason || {},
            severity: severity || 'medium'
        });

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: alert
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update alert status
const updateAlertStatus = async (req, res) => {
    try {
        const { status, reviewed_by } = req.body || {};

        const allowedStatuses = [
            'new', 'reviewing', 'dismissed', 'resolved'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid alert status'
            });
        }

        const updateData = { status };

        if (status !== 'new') {
            updateData.reviewed_at = new Date().toISOString();
            if (reviewed_by) updateData.reviewed_by = reviewed_by;
        } else {
            updateData.reviewed_at = null;
            updateData.reviewed_by = null;
        }

        const alert = await alertsService.updateAlertStatus(
            req.params.id,
            updateData
        );

        res.status(200).json({
            success: true,
            message: 'Alert status updated successfully',
            data: alert
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllAlerts,
    getAlertById,
    getAlertsByCase,
    createAlert,
    updateAlertStatus
};
