
const casesService = require('../services/cases.service');

const getAllCases = async (req, res) => {
    try {
        const cases = await casesService.getAllCases();

        res.status(200).json({
            success: true,
            count: cases.length,
            data: cases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getCaseById = async (req, res) => {
    try {
        const caseData = await casesService.getCaseById(req.params.id);

        res.status(200).json({
            success: true,
            data: caseData
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

const createCase = async (req, res) => {
    try {
        const { case_number, title, description, status, priority, created_by } = req.body;

        if (!case_number || !title) {
            return res.status(400).json({
                success: false,
                message: 'case_number and title are required'
            });
        }

        const newCase = await casesService.createCase({
            case_number,
            title,
            description,
            status,
            priority,
            created_by
        });

        res.status(201).json({
            success: true,
            message: 'Case created successfully',
            data: newCase
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const linkEntity = async (req, res) => {
    try {
        const { entity_id } = req.body;
        const { id } = req.params;

        if (!entity_id) {
            return res.status(400).json({
                success: false,
                message: 'entity_id is required'
            });
        }

        const data = await casesService.linkEntityToCase(id, entity_id);

        res.status(201).json({
            success: true,
            message: 'Entity linked to case successfully',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCases,
    getCaseById,
    createCase,
    linkEntity
};
