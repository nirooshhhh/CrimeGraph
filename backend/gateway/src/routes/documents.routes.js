
const express = require('express');
const router = express.Router();

const documentsController = require('../controllers/documents.controller');
const upload = require('../middleware/upload.middleware');

// Upload document with Multer debugging
router.post(
    '/upload',
    (req, res, next) => {
        console.log('CONTENT TYPE:', req.headers['content-type']);
        next();
    },
    upload.single('file'),
    (req, res, next) => {
        console.log('--- MULTER DEBUG ---');
        console.log('Request body:', req.body);
        console.log('Uploaded file:', req.file);
        next();
    },
    documentsController.uploadDocument
);

// Retrieve documents
router.get('/', documentsController.getAllDocuments);
router.get('/case/:caseId', documentsController.getDocumentsByCase);
router.get('/:id', documentsController.getDocumentById);

// Create document record
router.post('/', documentsController.createDocument);

// Download document
router.get('/:id/download', documentsController.downloadDocument);

module.exports = router;
