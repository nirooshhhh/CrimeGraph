"""
Unit tests for CrimeGraph NLP Entity Extractor.
Tests label mapping, regex identifiers, account context requirement,
overlap resolution, UTF-16 offset indexing, stop-list filtering, and fallback mode.
"""

import unittest
import spacy
from app.extractors.entity_extractor import (
    extract_entity_mentions,
    to_utf16_offset,
    normalize_phone,
    normalize_email,
    normalize_vehicle,
    normalize_account,
    SPACY_LABEL_MAP,
    STOP_LIST,
)


class TestEntityExtractor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            cls.nlp = spacy.load("en_core_web_sm")
        except Exception:
            cls.nlp = None

    def test_phone_normalization(self):
        self.assertEqual(normalize_phone("+91 98765-43210"), "9876543210")
        self.assertEqual(normalize_phone("919876543210"), "9876543210")
        self.assertEqual(normalize_phone("9876543210"), "9876543210")

    def test_email_normalization(self):
        self.assertEqual(
            normalize_email("  Officer.Investigator@CrimeGraph.ORG  "),
            "officer.investigator@crimegraph.org"
        )

    def test_vehicle_normalization(self):
        self.assertEqual(normalize_vehicle("ka 01 ab 1234"), "KA01AB1234")
        self.assertEqual(normalize_vehicle("MH-12-CD-5678"), "MH12CD5678")

    def test_account_normalization(self):
        self.assertEqual(normalize_account("1234-5678-9012"), "123456789012")
        self.assertEqual(normalize_account("9876 5432 1012"), "987654321012")

    def test_account_requires_context_keyword(self):
        # Without keyword: bare number should NOT be detected as account
        bare_text = "The code was 987654321012 yesterday."
        res_bare = extract_entity_mentions(bare_text, nlp_model=None)
        self.assertFalse(any(m["entity_type"] == "account" for m in res_bare["mentions"]))

        # With keyword: should be detected as account, and span MUST be digits only
        with_kw = "Suspect bank A/C No. 987654321012 was frozen."
        res_kw = extract_entity_mentions(with_kw, nlp_model=None)
        accounts = [m for m in res_kw["mentions"] if m["entity_type"] == "account"]
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0]["mention_text"], "987654321012")
        self.assertEqual(accounts[0]["normalized_text"], "987654321012")
        self.assertEqual(accounts[0]["confidence"], 0.85)
        self.assertEqual(accounts[0]["extraction_method"], "rule_based")
        # Ensure context keyword "A/C No." is NOT in the span
        self.assertNotIn("A/C", accounts[0]["mention_text"])
        self.assertNotIn("No", accounts[0]["mention_text"])

    def test_spacy_ner_label_mapping(self):
        if not self.nlp:
            self.skipTest("spaCy model not loaded")

        text = "Rajesh Kumar works at Tata Consultancy Services in Mumbai near Chhatrapati Shivaji Terminus."
        res = extract_entity_mentions(text, nlp_model=self.nlp)
        self.assertEqual(res["ner_engine"], "spacy_en_core_web_sm")

        types_found = {m["entity_type"] for m in res["mentions"]}
        self.assertIn("person", types_found)
        self.assertIn("organization", types_found)
        self.assertIn("location", types_found)

        # Check confidences and methods
        for m in res["mentions"]:
            if m["extraction_method"] == "spacy_ner":
                if m["entity_type"] == "person":
                    self.assertEqual(m["confidence"], 0.75)
                elif m["entity_type"] == "organization":
                    self.assertEqual(m["confidence"], 0.70)
                elif m["entity_type"] == "location":
                    self.assertIn(m["confidence"], [0.70, 0.65, 0.60])

    def test_unmapped_labels_discarded(self):
        if not self.nlp:
            self.skipTest("spaCy model not loaded")

        # Text with date, cardinal numbers, and money
        text = "On January 15, 2024, the suspect transferred 50000 rupees to two associates."
        res = extract_entity_mentions(text, nlp_model=self.nlp)
        # DATE, CARDINAL, MONEY should not appear
        for m in res["mentions"]:
            self.assertNotIn(m["entity_type"], ["DATE", "TIME", "MONEY", "CARDINAL", "PERCENT", "ORDINAL"])

    def test_stop_list_filtering(self):
        text = (
            "Curriculum Vitae of the applicant.\n"
            "Work Experience and Technical Skills.\n"
            "The Investigation was conducted by Police Department."
        )
        res = extract_entity_mentions(text, nlp_model=self.nlp)
        for m in res["mentions"]:
            self.assertNotIn(m["normalized_text"], STOP_LIST)

    def test_overlap_resolution_priority(self):
        # Email containing a vehicle-like pattern or phone digits
        text = "Contact MH12AB1234@police.gov.in regarding case."
        res = extract_entity_mentions(text, nlp_model=self.nlp)
        # Email has priority over vehicle
        emails = [m for m in res["mentions"] if m["entity_type"] == "other"]
        vehicles = [m for m in res["mentions"] if m["entity_type"] == "vehicle"]
        self.assertEqual(len(emails), 1)
        self.assertEqual(len(vehicles), 0)

    def test_utf16_offset_calculation_with_emojis(self):
        # Characters outside BMP (like 🚨 = U+1F6A8) take 2 code units in UTF-16
        text = "🚨 Case Alert: Rajesh Kumar met Priya Sharma in Mumbai."
        res = extract_entity_mentions(text, nlp_model=self.nlp)

        u16_bytes = text.encode("utf-16-le")
        for m in res["mentions"]:
            start = m["start_offset"]
            end = m["end_offset"]
            sliced = u16_bytes[start * 2 : end * 2].decode("utf-16-le")
            self.assertEqual(sliced, m["mention_text"])

    def test_fallback_mode_when_spacy_unavailable(self):
        text = "Rajesh Kumar was seen near vehicle KA 01 AB 1234 and phone 9876543210."
        res = extract_entity_mentions(text, nlp_model=None)
        self.assertEqual(res["ner_engine"], "regex_only")

        # Person should still be extracted via regex fallback
        persons = [m for m in res["mentions"] if m["entity_type"] == "person"]
        self.assertTrue(len(persons) >= 1)
        self.assertEqual(persons[0]["confidence"], 0.60)
        self.assertEqual(persons[0]["extraction_method"], "rule_based")

        # Phone and vehicle still present
        phones = [m for m in res["mentions"] if m["entity_type"] == "phone"]
        vehicles = [m for m in res["mentions"] if m["entity_type"] == "vehicle"]
        self.assertEqual(len(phones), 1)
        self.assertEqual(len(vehicles), 1)


if __name__ == "__main__":
    unittest.main()
