
const relationshipsService = require('../services/relationships.service');

// Get all relationships
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

// Get relationships for a particular entity
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

// Create a relationship
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

// Get evidence for a relationship
const getRelationshipEvidence = async (req, res) => {
    try {
        const evidence =
            await relationshipsService.getRelationshipEvidence(
                req.params.relationshipId
            );

        res.status(200).json({
            success: true,
            count: evidence.length,
            data: evidence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add evidence to a relationship
const createRelationshipEvidence = async (req, res) => {
    try {
        const {
            document_id,
            call_record_id,
            transaction_id,
            explanation
        } = req.body || {};

        const sourceIds = [
            document_id,
            call_record_id,
            transaction_id
        ].filter(Boolean);

        if (sourceIds.length !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Provide exactly one evidence source: document_id, call_record_id, or transaction_id'
            });
        }

        const evidence =
            await relationshipsService.createRelationshipEvidence({
                relationship_id: req.params.relationshipId,
                document_id: document_id || null,
                call_record_id: call_record_id || null,
                transaction_id: transaction_id || null,
                explanation: explanation || null
            });

        res.status(201).json({
            success: true,
            message: 'Relationship evidence added successfully',
            data: evidence
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
    createRelationship,
    getRelationshipEvidence,
    createRelationshipEvidence
};
