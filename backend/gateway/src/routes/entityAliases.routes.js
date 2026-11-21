
const express = require('express');
const router = express.Router();

const controller = require('../controllers/entityAliases.controller');

router.get('/', controller.getAllAliases);
router.get('/entity/:entityId', controller.getAliasesByEntity);
router.post('/', controller.createAlias);
router.delete('/:id', controller.deleteAlias);

module.exports = router;
