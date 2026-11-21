
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

module.exports = router;
