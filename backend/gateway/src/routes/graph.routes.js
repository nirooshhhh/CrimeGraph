const express = require('express');
const router = express.Router();

const graphController = require('../controllers/graph.controller');

router.get('/case/:caseId', graphController.getGraph);

module.exports = router;