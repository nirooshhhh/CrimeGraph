import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
import pymupdf
import re
import spacy

from app.extractors.entity_extractor import extract_entity_mentions

logger = logging.getLogger("uvicorn.error")

nlp_model = None

try:
    nlp_model = spacy.load("en_core_web_sm")
    logger.info("spaCy model 'en_core_web_sm' loaded successfully.")
except Exception as e:
    logger.warning(f"Could not load spaCy model 'en_core_web_sm': {e}. Using regex fallback.")
    nlp_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp_model
    if nlp_model is None:
        try:
            nlp_model = spacy.load("en_core_web_sm")
            logger.info("spaCy model 'en_core_web_sm' loaded successfully at lifespan startup.")
        except Exception as e:
            logger.warning(f"Lifespan: could not load spaCy model: {e}")
    yield


app = FastAPI(title="CrimeGraph NLP Service", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "CrimeGraph NLP Service is running"
    }


def extract_text(file_bytes, filename):
    if filename.lower().endswith(".pdf"):
        document = pymupdf.open(stream=file_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in document)
        document.close()
        return text

    if filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    raise HTTPException(
        status_code=400,
        detail="Only PDF and TXT files are supported"
    )


def extract_entities(text):
    result = extract_entity_mentions(text, nlp_model)
    seen = set()
    deduped = []
    for m in result["mentions"]:
        key = (m["entity_type"], m["normalized_text"])
        if key not in seen:
            seen.add(key)
            deduped.append({
                "value": m["normalized_text"],
                "type": m["entity_type"],
                "confidence": m["confidence"],
                "extraction_method": m["extraction_method"]
            })
    return deduped


@app.post("/api/extract")
async def extract_document(file: UploadFile = File(...)):
    filename = file.filename or ""

    if not filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported"
        )

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size cannot exceed 10 MB"
        )

    try:
        text = extract_text(file_bytes, filename)
        extraction_res = extract_entity_mentions(text, nlp_model)
        mentions = extraction_res["mentions"]
        ner_engine = extraction_res["ner_engine"]

        seen = set()
        deduped = []
        for m in mentions:
            key = (m["entity_type"], m["normalized_text"])
            if key not in seen:
                seen.add(key)
                deduped.append({
                    "value": m["normalized_text"],
                    "type": m["entity_type"],
                    "confidence": m["confidence"],
                    "extraction_method": m["extraction_method"]
                })

        return {
            "success": True,
            "file_name": filename,
            "text_length": len(text),
            "extracted_text": text,
            "entity_count": len(deduped),
            "entities": deduped,
            "mentions": mentions,
            "ner_engine": ner_engine
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(error)}"
        )
