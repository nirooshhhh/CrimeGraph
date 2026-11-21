
const express = require('express');
const router = express.Router();

const documentsController = require('../controllers/documents.controller');
const upload = require('../middleware/upload.middleware');

// Upload document
router.post(
    '/upload',
    upload.single('file'),
    documentsController.uploadDocument
);

// Retrieve documents
router.get('/', documentsController.getAllDocuments);
router.get('/case/:caseId', documentsController.getDocumentsByCase);

// Retrieve mentions extracted from a document
router.get('/:id/mentions', documentsController.getDocumentMentions);

// Retrieve one document
router.get('/:id', documentsController.getDocumentById);

// Create document record
router.post('/', documentsController.createDocument);

// Download document
router.get('/:id/download', documentsController.downloadDocument);

module.exports = router;
