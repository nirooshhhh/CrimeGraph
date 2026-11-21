
const service = require('../services/entityMatchCandidates.service');

const getAllCandidates = async (req, res) => {
    try {
        const data = await service.getAllCandidates();
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getCandidatesByStatus = async (req, res) => {
    try {
        const allowed = ['pending', 'accepted', 'rejected'];
        if (!allowed.includes(req.params.status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const data = await service.getCandidatesByStatus(req.params.status);
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getCandidateById = async (req, res) => {
    try {
        const data = await service.getCandidateById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createCandidate = async (req, res) => {
    try {
        const {
            entity_id_1,
            entity_id_2,
            similarity_score,
            explanation
        } = req.body || {};

        if (
            !entity_id_1 ||
            !entity_id_2 ||
            similarity_score === undefined ||
            similarity_score === null
        ) {
            return res.status(400).json({
                success: false,
                message: 'Both entity IDs and similarity_score are required'
            });
        }

        if (entity_id_1 === entity_id_2) {
            return res.status(400).json({
                success: false,
                message: 'Entity IDs must be different'
            });
        }

        const score = Number(similarity_score);
        if (!Number.isFinite(score) || score < 0 || score > 1) {
            return res.status(400).json({
                success: false,
                message: 'similarity_score must be between 0 and 1'
            });
        }

        // Database requires entity_id_1 < entity_id_2
        const [firstId, secondId] = [entity_id_1, entity_id_2].sort();

        const data = await service.createCandidate({
            entity_id_1: firstId,
            entity_id_2: secondId,
            similarity_score: score,
            explanation: explanation || {}
        });

        res.status(201).json({
            success: true,
            message: 'Match candidate created successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const reviewCandidate = async (req, res) => {
    try {
        const { status, reviewed_by, review_notes } = req.body || {};

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be accepted or rejected'
            });
        }

        const data = await service.reviewCandidate(req.params.id, {
            status,
            reviewed_by: reviewed_by || null,
            reviewed_at: new Date().toISOString(),
            review_notes: review_notes || null
        });

        res.status(200).json({
            success: true,
            message: 'Candidate reviewed successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllCandidates,
    getCandidatesByStatus,
    getCandidateById,
    createCandidate,
    reviewCandidate
};
