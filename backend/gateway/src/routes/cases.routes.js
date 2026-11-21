
const express = require('express');
const router = express.Router();

const casesController = require('../controllers/cases.controller');

router.get('/', casesController.getAllCases);
router.get('/:id', casesController.getCaseById);
router.post('/', casesController.createCase);

module.exports = router;
