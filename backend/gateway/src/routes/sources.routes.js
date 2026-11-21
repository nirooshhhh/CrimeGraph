
const express = require('express');
const router = express.Router();

const sourcesController = require('../controllers/sources.controller');

router.get('/', sourcesController.getAllSources);
router.get('/case/:caseId', sourcesController.getSourcesByCase);
router.post('/', sourcesController.createSource);

module.exports = router;
