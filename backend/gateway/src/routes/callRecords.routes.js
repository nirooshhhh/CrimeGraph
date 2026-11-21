
const express = require('express');
const router = express.Router();

const callRecordsController =
    require('../controllers/callRecords.controller');

router.get('/', callRecordsController.getAllCallRecords);

router.get(
    '/entity/:entityId',
    callRecordsController.getCallRecordsByEntity
);

router.get('/:id', callRecordsController.getCallRecordById);

router.post('/', callRecordsController.createCallRecord);

module.exports = router;
