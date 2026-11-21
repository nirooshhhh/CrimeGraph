
const express = require('express');
const router = express.Router();

const alertsController = require('../controllers/alerts.controller');

router.get('/', alertsController.getAllAlerts);
router.get('/case/:caseId', alertsController.getAlertsByCase);
router.get('/:id', alertsController.getAlertById);
router.post('/', alertsController.createAlert);
router.patch('/:id/status', alertsController.updateAlertStatus);

module.exports = router;
