
const entitiesService = require('../services/entities.service');

const allowedTypes = [
    'person',
    'phone',
    'vehicle',
    'location',
    'organization',
    'account',
    'other'
];

const getAllEntities = async (req, res) => {
    try {
        const entities = await entitiesService.getAllEntities();

        res.status(200).json({
            success: true,
            count: entities.length,
            data: entities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getEntityById = async (req, res) => {
    try {
        const entity = await entitiesService.getEntityById(req.params.id);

        res.status(200).json({
            success: true,
            data: entity
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

const createEntity = async (req, res) => {
    try {
        const { entity_type, canonical_name, attributes } = req.body || {};

        if (!entity_type || !canonical_name) {
            return res.status(400).json({
                success: false,
                message: 'entity_type and canonical_name are required'
            });
        }

        if (!allowedTypes.includes(entity_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entity_type'
            });
        }

        const normalized_name = canonical_name.trim().toLowerCase();

        const entity = await entitiesService.createEntity({
            entity_type,
            canonical_name: canonical_name.trim(),
            normalized_name,
            attributes: attributes || {}
        });

        res.status(201).json({
            success: true,
            message: 'Entity created successfully',
            data: entity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllEntities,
    getEntityById,
    createEntity
};
