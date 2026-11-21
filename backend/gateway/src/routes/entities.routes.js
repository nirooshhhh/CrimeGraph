
const express = require('express');
const router = express.Router();

const entitiesController = require('../controllers/entities.controller');

router.get('/', entitiesController.getAllEntities);
router.get('/:id', entitiesController.getEntityById);
router.post('/', entitiesController.createEntity);

module.exports = router;
