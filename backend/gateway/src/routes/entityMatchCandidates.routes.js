
const express = require('express');
const router = express.Router();

const controller = require('../controllers/entityMatchCandidates.controller');

router.get('/', controller.getAllCandidates);
router.get('/status/:status', controller.getCandidatesByStatus);
router.get('/:id', controller.getCandidateById);
router.post('/', controller.createCandidate);
router.patch('/:id/review', controller.reviewCandidate);

module.exports = router;
