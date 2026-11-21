
const express = require('express');
const router = express.Router();

const auditLogsController = require('../controllers/auditLogs.controller');

router.get('/', auditLogsController.getAllAuditLogs);
router.get('/user/:userId', auditLogsController.getAuditLogsByUser);
router.get('/table/:tableName', auditLogsController.getAuditLogsByTable);
router.get('/:id', auditLogsController.getAuditLogById);
router.post('/', auditLogsController.createAuditLog);

module.exports = router;
