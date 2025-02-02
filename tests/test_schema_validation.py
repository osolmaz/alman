import json
import os
from pathlib import Path
from jsonschema import validate, ValidationError
import pytest

# Define schema paths
SCHEMA_DIR = Path("spec/schemas")
SECTIONS_DIR = Path("spec/sections")

def load_schema(schema_name: str) -> dict:
    """Load a schema file from the schemas directory."""
    schema_path = SCHEMA_DIR / schema_name
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_json_file(file_path: Path) -> dict:
    """Load a JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def test_main_document():
    """Test that the main document follows the main schema."""
    main_schema = load_schema("main.schema.json")
    main_doc_path = Path("spec/main.json")

    if not main_doc_path.exists():
        pytest.skip("Main document not found")

    main_doc = load_json_file(main_doc_path)
    validate(instance=main_doc, schema=main_schema)

def test_sections():
    """Test that all section files follow the section schema."""
    section_schema = load_schema("section.schema.json")

    # Find all section.json files
    section_files = list(SECTIONS_DIR.glob("*/section.json"))
    if not section_files:
        pytest.skip("No section files found")

    for section_file in section_files:
        section_data = load_json_file(section_file)
        try:
            validate(instance=section_data, schema=section_schema)
        except ValidationError as e:
            raise ValidationError(f"Validation failed for {section_file}: {str(e)}")

def test_rules():
    """Test that all rule files follow the rule schema."""
    rule_schema = load_schema("rule.schema.json")

    # Find all rule.json files
    rule_files = list(SECTIONS_DIR.glob("*/paragraphs/*/rules/*/rule.json"))
    if not rule_files:
        pytest.skip("No rule files found")

    for rule_file in rule_files:
        rule_data = load_json_file(rule_file)
        try:
            validate(instance=rule_data, schema=rule_schema)
        except ValidationError as e:
            raise ValidationError(f"Validation failed for {rule_file}: {str(e)}")

def test_numbering_map():
    """Test that the numbering map follows its schema."""
    numbering_schema = load_schema("numbering_map.schema.json")
    numbering_map_path = Path("spec/numbering_map.json")

    if not numbering_map_path.exists():
        pytest.skip("Numbering map not found")

    numbering_map = load_json_file(numbering_map_path)
    validate(instance=numbering_map, schema=numbering_schema)

def test_paragraphs():
    """Test that all paragraph files are valid JSON."""
    # Find all paragraph.json files
    paragraph_files = list(SECTIONS_DIR.glob("*/paragraphs/*/paragraph.json"))
    if not paragraph_files:
        pytest.skip("No paragraph files found")

    for paragraph_file in paragraph_files:
        try:
            load_json_file(paragraph_file)
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(
                f"Invalid JSON in {paragraph_file}: {str(e)}",
                e.doc,
                e.pos
            )