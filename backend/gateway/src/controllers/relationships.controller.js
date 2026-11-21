
const relationshipsService = require('../services/relationships.service');

const getAllRelationships = async (req, res) => {
    try {
        const relationships =
            await relationshipsService.getAllRelationships();

        res.status(200).json({
            success: true,
            count: relationships.length,
            data: relationships
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getEntityRelationships = async (req, res) => {
    try {
        const relationships =
            await relationshipsService.getEntityRelationships(
                req.params.entityId
            );

        res.status(200).json({
            success: true,
            count: relationships.length,
            data: relationships
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const createRelationship = async (req, res) => {
    try {
        const {
            entity_id_1,
            entity_id_2,
            relationship_type
        } = req.body || {};

        if (!entity_id_1 || !entity_id_2 || !relationship_type) {
            return res.status(400).json({
                success: false,
                message: 'Both entity IDs and relationship_type are required'
            });
        }

        if (entity_id_1 === entity_id_2) {
            return res.status(400).json({
                success: false,
                message: 'An entity cannot have a relationship with itself'
            });
        }

        const relationship =
            await relationshipsService.createRelationship({
                entity_id_1,
                entity_id_2,
                relationship_type,
                status: 'under_review'
            });

        res.status(201).json({
            success: true,
            message: 'Relationship created successfully',
            data: relationship
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllRelationships,
    getEntityRelationships,
    createRelationship
};
