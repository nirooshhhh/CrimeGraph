
const express = require('express');
const router = express.Router();

const relationshipsController =
    require('../controllers/relationships.controller');

router.get('/', relationshipsController.getAllRelationships);

router.get(
    '/entity/:entityId',
    relationshipsController.getEntityRelationships
);

router.post('/', relationshipsController.createRelationship);

// Get evidence for a relationship
router.get(
    '/:relationshipId/evidence',
    relationshipsController.getRelationshipEvidence
);

// Add evidence to a relationship
router.post(
    '/:relationshipId/evidence',
    relationshipsController.createRelationshipEvidence
);

module.exports = router;
