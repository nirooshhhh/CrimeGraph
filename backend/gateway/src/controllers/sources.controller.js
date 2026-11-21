
const sourcesService = require('../services/sources.service');

const getAllSources = async (req, res) => {
    try {
        const sources = await sourcesService.getAllSources();

        res.status(200).json({
            success: true,
            count: sources.length,
            data: sources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getSourcesByCase = async (req, res) => {
    try {
        const sources = await sourcesService.getSourcesByCase(req.params.caseId);

        res.status(200).json({
            success: true,
            count: sources.length,
            data: sources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const createSource = async (req, res) => {
    try {
        const {
            case_id,
            source_type,
            source_name,
            description,
            reference_code
        } = req.body;

        if (!source_type || !source_name) {
            return res.status(400).json({
                success: false,
                message: 'source_type and source_name are required'
            });
        }

        const source = await sourcesService.createSource({
            case_id: case_id || null,
            source_type,
            source_name,
            description,
            reference_code
        });

        res.status(201).json({
            success: true,
            message: 'Source created successfully',
            data: source
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllSources,
    getSourcesByCase,
    createSource
};
