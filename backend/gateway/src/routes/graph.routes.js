
const express = require('express');
const router = express.Router();

const graphController = require('../controllers/graph.controller');

router.get('/case/:caseId', graphController.getGraph);
router.get('/case/:caseId/analyze', graphController.analyzeGraph);
router.post('/case/:caseId/shortest-path', graphController.shortestPath);

module.exports = router;
