# CrimeGraph NLP Service

FastAPI-based Natural Language Processing service for the CrimeGraph intelligence platform.
Performs text extraction from PDF and TXT documents, along with hybrid entity extraction combining spaCy Named Entity Recognition (NER) and high-precision rule-based extractors.

## Entity Types & Extraction Methods

| Entity Type | Extraction Method | Source / Engine | Confidence |
|---|---|---|---|
| `person` | `spacy_ner` | spaCy (`PERSON` label) | 0.75 |
| `organization` | `spacy_ner` | spaCy (`ORG` label) | 0.70 |
| `location` | `spacy_ner` | spaCy (`GPE`: 0.70, `LOC`: 0.65, `FAC`: 0.60) | 0.60 - 0.70 |
| `account` | `rule_based` | Regex with context keyword (`a/c`, `account no`, etc.) | 0.85 |
| `phone` | `rule_based` | Regex (Indian 10-digit mobile / +91 format) | 0.95 |
| `vehicle` | `rule_based` | Regex (Indian vehicle registration number format) | 0.90 |
| `other` (emails) | `rule_based` | Regex (standard RFC-compliant email pattern) | 0.99 |

When spaCy is not available or fails to initialize, the service gracefully falls back to rule-based person regex extraction (`ner_engine: "regex_only"`) with confidence `0.60`.

## Installation

### 1. Set Up Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download the spaCy Model
```bash
python -m spacy download en_core_web_sm
```

*(Note for Windows Defender / Application Control environments: if downloading native wheels triggers AppLocker/WDAC restrictions, execute `Get-ChildItem -Path .\venv -Recurse | Unblock-File` in PowerShell).*

### 4. (Optional) Install Test Dependencies
```bash
pip install -r requirements-dev.txt
```

## Running Tests

Run the test suite using pytest from the `backend/nlp-service` directory:
```bash
pytest tests/test_entity_extractor.py -v -o "pythonpath=."
```

## Running the Service

Start the Uvicorn development server on port 8002:
```bash
uvicorn app.main:app --port 8002 --reload
```

## API Endpoints

### `GET /health`
Returns health check status:
```json
{
  "success": true,
  "message": "CrimeGraph NLP Service is running"
}
```

### `POST /api/extract`
Upload a document (`multipart/form-data` with `file=@<path>`). Supports `.pdf` and `.txt` files up to 10 MB.

#### Response Format
```json
{
  "success": true,
  "file_name": "incident_report.pdf",
  "text_length": 1037,
  "extracted_text": "...",
  "entity_count": 14,
  "entities": [
    {
      "value": "9876543210",
      "type": "phone",
      "confidence": 0.95,
      "extraction_method": "rule_based"
    }
  ],
  "mentions": [
    {
      "entity_type": "person",
      "mention_text": "Rajesh Kumar",
      "normalized_text": "rajesh kumar",
      "start_offset": 572,
      "end_offset": 584,
      "confidence": 0.75,
      "extraction_method": "spacy_ner"
    }
  ],
  "ner_engine": "spacy_en_core_web_sm"
}
```
Offsets are returned as UTF-16 code unit offsets, ensuring 100% alignment with JavaScript's `String.prototype.slice()`.
