
const documentsService = require('../services/documents.service');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const getAllDocuments = async (req, res) => {
    try {
        const documents = await documentsService.getAllDocuments();

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getDocumentsByCase = async (req, res) => {
    try {
        const documents = await documentsService.getDocumentsByCase(
            req.params.caseId
        );

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await documentsService.getDocumentById(req.params.id);

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const createDocument = async (req, res) => {
    try {
        const {
            case_id,
            source_id,
            file_name,
            file_type,
            storage_path,
            file_hash,
            extracted_text
        } = req.body;

        if (!case_id || !file_name || !storage_path) {
            return res.status(400).json({
                success: false,
                message: 'case_id, file_name and storage_path are required'
            });
        }

        const documentData = {
            case_id,
            file_name,
            storage_path
        };

        if (source_id) documentData.source_id = source_id;
        if (file_type) documentData.file_type = file_type;
        if (file_hash) documentData.file_hash = file_hash;
        if (extracted_text) documentData.extracted_text = extracted_text;

        const document = await documentsService.createDocument(documentData);

        res.status(201).json({
            success: true,
            message: 'Document record created successfully',
            data: document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


const uploadDocument = async (req, res) => {
    try {
        const { case_id, source_id } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select a file'
            });
        }

        if (!case_id) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message: 'case_id is required'
            });
        }

        const fileBuffer = fs.readFileSync(req.file.path);

        const fileHash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

        const documentData = {
            case_id,
            file_name: req.file.originalname,
            file_type: req.file.mimetype,
            storage_path: `uploads/${req.file.filename}`,
            file_hash: fileHash
        };

        if (source_id) {
            documentData.source_id = source_id;
        }

        const document = await documentsService.createDocument(documentData);

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: document
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const downloadDocument = async (req, res) => {
    try {
        const document = await documentsService.getDocumentById(req.params.id);

        const storageRoot = path.resolve(__dirname, '../../../../storage');
        const filePath = path.resolve(storageRoot, document.storage_path);

        if (!filePath.startsWith(storageRoot + path.sep)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid storage path'
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Stored file not found'
            });
        }

        res.download(filePath, document.file_name);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllDocuments,
    getDocumentsByCase,
    getDocumentById,
    createDocument,
    uploadDocument,
    downloadDocument
};
