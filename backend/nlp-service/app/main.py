
from fastapi import FastAPI, UploadFile, File, HTTPException
import pymupdf
import re

app = FastAPI(title="CrimeGraph NLP Service")


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
    entities = []

    patterns = {
        "phone": r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)",
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "vehicle": r"\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}\b"
    }

    for entity_type, pattern in patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)

        for match in matches:
            value = match.strip()

            if not any(
                e["value"].lower() == value.lower()
                and e["type"] == entity_type
                for e in entities
            ):
                entities.append({
                    "value": value,
                    "type": entity_type,
                    "confidence": 0.95,
                    "extraction_method": "rule_based"
                })

    # Basic person-name candidates.
    # These are suggestions and should be reviewed before verification.
    name_pattern = r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2}\b"

    excluded = {
        "The Investigation",
        "This Document",
        "Police Department",
        "Crime Graph"
    }

    for match in re.findall(name_pattern, text):
        value = match.strip()

        if value not in excluded and not any(
            e["value"].lower() == value.lower()
            for e in entities
        ):
            entities.append({
                "value": value,
                "type": "person",
                "confidence": 0.55,
                "extraction_method": "rule_based_candidate"
            })

    return entities


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
        entities = extract_entities(text)

        return {
            "success": True,
            "file_name": filename,
            "text_length": len(text),
            "extracted_text": text,
            "entity_count": len(entities),
            "entities": entities
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(error)}"
        )
