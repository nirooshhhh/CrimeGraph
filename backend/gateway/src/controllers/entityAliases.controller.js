
const service = require('../services/entityAliases.service');

const getAllAliases = async (req, res) => {
    try {
        const data = await service.getAllAliases();
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAliasesByEntity = async (req, res) => {
    try {
        const data = await service.getAliasesByEntity(req.params.entityId);
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createAlias = async (req, res) => {
    try {
        const { entity_id, alias_name, source_type, added_by } = req.body || {};

        if (!entity_id || !alias_name || !alias_name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'entity_id and alias_name are required'
            });
        }

        const normalized = alias_name.trim().toLowerCase();

        const data = await service.createAlias({
            entity_id,
            alias_name: alias_name.trim(),
            normalized_alias: normalized,
            source_type: source_type || 'manual',
            added_by: added_by || null
        });

        res.status(201).json({
            success: true,
            message: 'Entity alias created successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteAlias = async (req, res) => {
    try {
        const data = await service.deleteAlias(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Alias deleted successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllAliases,
    getAliasesByEntity,
    createAlias,
    deleteAlias
};
