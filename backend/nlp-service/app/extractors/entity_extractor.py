"""
Entity extraction module for CrimeGraph NLP Service.
Combines rule-based extractors (phone, email, vehicle, account) with
spaCy NER (en_core_web_sm) for person, organization, and location entities.
"""

import re
import string
import bisect
from typing import List, Dict, Any, Optional

# Supported spaCy label to CrimeGraph entity type mapping
SPACY_LABEL_MAP = {
    "PERSON": ("person", 0.75),
    "ORG": ("organization", 0.70),
    "GPE": ("location", 0.70),
    "LOC": ("location", 0.65),
    "FAC": ("location", 0.60),
}

# Ignore/stop-list for candidate names/entities (case-insensitive)
STOP_LIST = {
    "curriculum vitae",
    "work experience",
    "personal details",
    "contact details",
    "educational qualification",
    "professional summary",
    "technical skills",
    "project details",
    "the investigation",
    "this document",
    "police department",
    "crime graph",
}

# Compiled regex patterns
PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
VEHICLE_PATTERN = re.compile(r"\b[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}\b", re.IGNORECASE)
ACCOUNT_PATTERN = re.compile(
    r"(?i)\b(?:a/c|ac\s*no\.?|acct|account)\s*(?:no\.?|number|num|#|:|-)*\s*([0-9][0-9\s-]{7,25}[0-9])\b"
)
FALLBACK_PERSON_PATTERN = re.compile(r"\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b")

# Priority ranking for overlap resolution (higher value = higher priority)
PRIORITY_RANK = {
    "account": 50,
    "other": 40,    # email
    "phone": 30,
    "vehicle": 20,
    "spacy": 10,
    "fallback_person": 5,
}

PUNCT_AND_SPACE = string.punctuation + string.whitespace


def to_utf16_offset(text: str, codepoint_offset: int) -> int:
    """
    Convert a Python unicode codepoint offset to a JavaScript UTF-16 code unit offset.
    Crucial for texts containing characters outside BMP (e.g., emojis > U+FFFF).
    """
    return len(text[:codepoint_offset].encode("utf-16-le")) // 2


def build_utf16_offset_map(text: str):
    """
    Build a list of indices of astral characters (ord > 0xFFFF) for O(log K) offset mapping.
    """
    return [i for i, c in enumerate(text) if ord(c) > 0xFFFF]


def fast_utf16_offset(codepoint_offset: int, astral_indices: List[int]) -> int:
    """
    Fast conversion from unicode codepoint offset to JavaScript UTF-16 code unit offset.
    """
    if not astral_indices:
        return codepoint_offset
    return codepoint_offset + bisect.bisect_left(astral_indices, codepoint_offset)


def normalize_phone(raw: str) -> str:
    """Normalize phone numbers: extract digits, drop 91 prefix if 12 digits."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    return digits


def normalize_email(raw: str) -> str:
    """Normalize email: lower-case trimmed."""
    return raw.strip().lower()


def normalize_vehicle(raw: str) -> str:
    """Normalize vehicle: uppercase alphanumeric without spaces or hyphens."""
    return re.sub(r"[\s-]", "", raw).upper()


def normalize_account(raw: str) -> str:
    """Normalize account: digits only."""
    return re.sub(r"\D", "", raw)


def normalize_general(raw: str) -> str:
    """Normalize general text: collapsed whitespace, lower-case."""
    return re.sub(r"\s+", " ", raw.strip()).lower()


def extract_regex_mentions(text: str) -> List[Dict[str, Any]]:
    """Extract rule-based mentions (account, email, phone, vehicle)."""
    mentions = []

    # 1. Account
    for match in ACCOUNT_PATTERN.finditer(text):
        raw_digits = match.group(1)
        normalized = normalize_account(raw_digits)
        if 9 <= len(normalized) <= 18:
            start_in_group = match.start(1)
            l_strip = len(raw_digits) - len(raw_digits.lstrip())
            r_strip = len(raw_digits) - len(raw_digits.rstrip())
            start_cp = start_in_group + l_strip
            end_cp = match.end(1) - r_strip
            mention_text = text[start_cp:end_cp]

            mentions.append({
                "entity_type": "account",
                "mention_text": mention_text,
                "normalized_text": normalized,
                "start_cp": start_cp,
                "end_cp": end_cp,
                "confidence": 0.85,
                "extraction_method": "rule_based",
                "priority_group": "account"
            })

    # 2. Email (entity_type = "other")
    for match in EMAIL_PATTERN.finditer(text):
        mention_text = match.group().strip()
        start_cp = match.start()
        end_cp = start_cp + len(mention_text)
        mentions.append({
            "entity_type": "other",
            "mention_text": mention_text,
            "normalized_text": normalize_email(mention_text),
            "start_cp": start_cp,
            "end_cp": end_cp,
            "confidence": 0.99,
            "extraction_method": "rule_based",
            "priority_group": "other"
        })

    # 3. Phone
    for match in PHONE_PATTERN.finditer(text):
        mention_text = match.group().strip()
        start_cp = match.start()
        end_cp = start_cp + len(mention_text)
        mentions.append({
            "entity_type": "phone",
            "mention_text": mention_text,
            "normalized_text": normalize_phone(mention_text),
            "start_cp": start_cp,
            "end_cp": end_cp,
            "confidence": 0.95,
            "extraction_method": "rule_based",
            "priority_group": "phone"
        })

    # 4. Vehicle
    for match in VEHICLE_PATTERN.finditer(text):
        mention_text = match.group().strip()
        start_cp = match.start()
        end_cp = start_cp + len(mention_text)
        mentions.append({
            "entity_type": "vehicle",
            "mention_text": mention_text,
            "normalized_text": normalize_vehicle(mention_text),
            "start_cp": start_cp,
            "end_cp": end_cp,
            "confidence": 0.90,
            "extraction_method": "rule_based",
            "priority_group": "vehicle"
        })

    return mentions


def extract_spacy_mentions(text: str, nlp_model) -> List[Dict[str, Any]]:
    """Extract entities using spaCy and map to CrimeGraph types."""
    mentions = []
    doc = nlp_model(text)

    for ent in doc.ents:
        if ent.label_ not in SPACY_LABEL_MAP:
            continue

        crime_type, confidence = SPACY_LABEL_MAP[ent.label_]

        # Strip leading/trailing punctuation and whitespace
        raw_text = ent.text
        stripped_text = raw_text.strip(PUNCT_AND_SPACE)

        if len(stripped_text) < 3:
            continue

        # Skip if no alphabetic characters
        if not any(c.isalpha() for c in stripped_text):
            continue

        # Skip if contains '@' (email belongs to regex)
        if "@" in stripped_text:
            continue

        normalized = normalize_general(stripped_text)

        # Stop-list check
        if normalized in STOP_LIST:
            continue

        # Compute adjusted codepoint offsets
        l_offset = len(raw_text) - len(raw_text.lstrip(PUNCT_AND_SPACE))
        r_offset = len(raw_text) - len(raw_text.rstrip(PUNCT_AND_SPACE))
        start_cp = ent.start_char + l_offset
        end_cp = ent.end_char - r_offset

        mentions.append({
            "entity_type": crime_type,
            "mention_text": stripped_text,
            "normalized_text": normalized,
            "start_cp": start_cp,
            "end_cp": end_cp,
            "confidence": confidence,
            "extraction_method": "spacy_ner",
            "priority_group": "spacy"
        })

    return mentions


def extract_fallback_mentions(text: str) -> List[Dict[str, Any]]:
    """Fallback person extraction using regex when spaCy is unavailable."""
    mentions = []
    for match in FALLBACK_PERSON_PATTERN.finditer(text):
        mention_text = match.group().strip()
        normalized = normalize_general(mention_text)

        if normalized in STOP_LIST:
            continue

        mentions.append({
            "entity_type": "person",
            "mention_text": mention_text,
            "normalized_text": normalized,
            "start_cp": match.start(),
            "end_cp": match.start() + len(mention_text),
            "confidence": 0.60,
            "extraction_method": "rule_based",
            "priority_group": "fallback_person"
        })
    return mentions


def resolve_overlaps(candidates: List[Dict[str, Any]], text_len: int) -> List[Dict[str, Any]]:
    """
    Resolve overlaps according to priority:
    account > other (email) > phone > vehicle > spaCy entities.
    For same-priority overlaps: prefer longer span, then higher confidence.
    Uses O(1) bytearray slicing to ensure linear overall performance on large documents.
    """
    if not candidates:
        return []

    # Sort candidates by:
    # 1. Priority rank (descending)
    # 2. Span length (descending)
    # 3. Confidence (descending)
    # 4. Start offset (ascending)
    sorted_candidates = sorted(
        candidates,
        key=lambda x: (
            PRIORITY_RANK.get(x["priority_group"], 0),
            (x["end_cp"] - x["start_cp"]),
            x["confidence"],
            -x["start_cp"]
        ),
        reverse=True
    )

    occupied = bytearray(text_len)
    accepted = []

    for cand in sorted_candidates:
        c_start = cand["start_cp"]
        c_end = cand["end_cp"]

        if c_start < 0 or c_end > text_len or c_start >= c_end:
            continue

        # Fast O(1) slice lookup: if any byte in this range is 1, it overlaps with an accepted entity
        if 1 in occupied[c_start:c_end]:
            continue

        # Mark range as occupied
        occupied[c_start:c_end] = b"\x01" * (c_end - c_start)
        accepted.append(cand)

    # Sort accepted mentions by start_cp for consistent ordering
    accepted.sort(key=lambda x: (x["start_cp"], x["end_cp"]))
    return accepted


def extract_entity_mentions(text: str, nlp_model=None) -> Dict[str, Any]:
    """
    Main extraction entrypoint.
    Extracts all entity mentions, resolves overlaps, converts offsets to UTF-16,
    and returns mentions list and ner_engine indicator.
    """
    if not text:
        return {
            "mentions": [],
            "ner_engine": "spacy_en_core_web_sm" if nlp_model is not None else "regex_only"
        }

    text_len = len(text)

    # 1. Run regex extractors (account, email, phone, vehicle)
    all_candidates = extract_regex_mentions(text)

    # 2. Run spaCy or fallback
    ner_engine = "regex_only"
    if nlp_model is not None:
        try:
            spacy_candidates = extract_spacy_mentions(text, nlp_model)
            all_candidates.extend(spacy_candidates)
            ner_engine = "spacy_en_core_web_sm"
        except Exception:
            fallback_candidates = extract_fallback_mentions(text)
            all_candidates.extend(fallback_candidates)
            ner_engine = "regex_only"
    else:
        fallback_candidates = extract_fallback_mentions(text)
        all_candidates.extend(fallback_candidates)
        ner_engine = "regex_only"

    # 3. Resolve overlaps
    resolved = resolve_overlaps(all_candidates, text_len)

    # 4. Convert codepoint offsets to UTF-16 code unit offsets using fast mapping
    astral_indices = build_utf16_offset_map(text)

    final_mentions = []
    for item in resolved:
        start_u16 = fast_utf16_offset(item["start_cp"], astral_indices)
        end_u16 = fast_utf16_offset(item["end_cp"], astral_indices)

        final_mentions.append({
            "entity_type": item["entity_type"],
            "mention_text": item["mention_text"],
            "normalized_text": item["normalized_text"],
            "start_offset": start_u16,
            "end_offset": end_u16,
            "confidence": item["confidence"],
            "extraction_method": item["extraction_method"]
        })

    return {
        "mentions": final_mentions,
        "ner_engine": ner_engine
    }
