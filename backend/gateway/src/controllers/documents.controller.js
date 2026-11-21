
const documentsService = require('../services/documents.service');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const entitiesService = require('../services/entities.service');
const casesService = require('../services/cases.service');

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


// Detect possible entities in extracted document text
const detectEntities = (text) => {
    const detected = [];

    const patterns = [
        {
            type: 'phone',
            regex: /(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
            confidence: 0.95
        },
        {
            type: 'other',
            regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
            confidence: 0.99
        },
        {
            type: 'vehicle',
            regex: /\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}\b/gi,
            confidence: 0.90
        },
        {
            type: 'person',
            regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g,
            confidence: 0.60
        }
    ];

    const ignoredNames = new Set([
        'Curriculum Vitae',
        'Work Experience',
        'Personal Details',
        'Contact Details',
        'Educational Qualification',
        'Professional Summary',
        'Technical Skills',
        'Project Details'
    ]);

    for (const pattern of patterns) {
        const matches = text.matchAll(pattern.regex);

        for (const match of matches) {
            const mention = match[0].trim();

            if (pattern.type === 'person' && ignoredNames.has(mention)) {
                continue;
            }

            let normalized;

            if (pattern.type === 'phone') {
                normalized = mention.replace(/\D/g, '');

                if (normalized.length === 12 && normalized.startsWith('91')) {
                    normalized = normalized.slice(2);
                }
            } else if (pattern.type === 'other') {
                normalized = mention.toLowerCase();
            } else if (pattern.type === 'vehicle') {
                normalized = mention.replace(/[\s-]/g, '').toUpperCase();
            } else {
                normalized = mention.toLowerCase().replace(/\s+/g, ' ');
            }

            const startOffset = match.index;
            const endOffset = startOffset + mention.length;

            detected.push({
                entity_type: pattern.type,
                mention_text: mention,
                normalized_text: normalized,
                start_offset: startOffset,
                end_offset: endOffset,
                confidence: pattern.confidence,
                extraction_method: 'rule_based'
            });
        }
    }

    // Remove duplicate detections at the same text position
    const unique = new Map();

    for (const item of detected) {
        const key = `${item.entity_type}:${item.normalized_text}:${item.start_offset}`;
        unique.set(key, item);
    }

    return Array.from(unique.values());
};

// Save detected entities and their document mentions
const saveDetectedEntities = async (caseId, documentId, text) => {
    const mentions = detectEntities(text);
    const results = [];

    for (const mention of mentions) {
        let entity = await entitiesService.findEntity(
            mention.entity_type,
            mention.normalized_text
        );

        if (!entity) {
            entity = await entitiesService.createEntity({
                entity_type: mention.entity_type,
                canonical_name: mention.mention_text,
                normalized_name: mention.normalized_text
            });
        }

        await casesService.linkEntityToCase(caseId, entity.id);

        const savedMention = await entitiesService.createEntityMention({
            document_id: documentId,
            resolved_entity_id: entity.id,
            entity_type: mention.entity_type,
            mention_text: mention.mention_text,
            normalized_text: mention.normalized_text,
            start_offset: mention.start_offset,
            end_offset: mention.end_offset,
            confidence: mention.confidence,
            extraction_method: mention.extraction_method
        });

        results.push({
            entity_id: entity.id,
            entity_type: mention.entity_type,
            mention: mention.mention_text,
            mention_id: savedMention.id
        });
    }

    return results;
};



const uploadDocument = async (req, res) => {
    let documentSaved = false;

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

        // Read uploaded file
        const fileBuffer = fs.readFileSync(req.file.path);

        // Generate SHA-256 hash
        const fileHash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

        // Extract text

        // Extract text using Python NLP Service
        let extractedText = '';
        let nlpServiceUsed = false;

        try {
            const formData = new FormData();

            formData.append(
                'file',
                new Blob([fileBuffer], { type: req.file.mimetype }),
                req.file.originalname
            );

            const nlpResponse = await fetch(
                `${process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8002'}/api/extract`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const nlpResult = await nlpResponse.json();

            if (!nlpResponse.ok || !nlpResult.success) {
                throw new Error(nlpResult.detail || 'NLP extraction failed');
            }

            extractedText = nlpResult.extracted_text;
            nlpServiceUsed = true;

        } catch (error) {
            console.error('NLP Service unavailable, using local extraction:', error.message);

            if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
                const pdfData = await pdfParse(fileBuffer);
                extractedText = pdfData.text;
            } else if (req.file.originalname.toLowerCase().endsWith('.txt')) {
                extractedText = fileBuffer.toString('utf8');
            }
        }


        // Save document record
        const documentData = {
            case_id,
            file_name: req.file.originalname,
            file_type: req.file.mimetype,
            storage_path: `uploads/${req.file.filename}`,
            file_hash: fileHash,
            extracted_text: extractedText,
            processing_status: 'completed'
        };

        if (source_id) {
            documentData.source_id = source_id;
        }

        const document = await documentsService.createDocument(documentData);
        documentSaved = true;

        // Detect and save entities
        let detectedEntities = [];
        let extractionError = null;

        try {
            detectedEntities = await saveDetectedEntities(
                case_id,
                document.id,
                extractedText
            );
        } catch (error) {
            console.error('Entity extraction error:', error);
            extractionError = error.message;
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded and text extracted successfully',
            data: document,
            extraction: {
                textLength: extractedText.length,
                nlpServiceUsed,
                entitiesDetected: detectedEntities.length,
                entities: detectedEntities,
                entityExtractionError: extractionError
            }
        });

    } catch (error) {
        console.error('Document upload error:', error);

        // Do not delete the file if its database record was saved
        if (!documentSaved && req.file && fs.existsSync(req.file.path)) {
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

const getDocumentMentions = async (req, res) => {
    try {
        const mentions = await entitiesService.getMentionsByDocument(
            req.params.id
        );

        res.status(200).json({
            success: true,
            count: mentions.length,
            data: mentions
        });
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
    downloadDocument,
    getDocumentMentions
};
