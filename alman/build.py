import argparse
import json
from pathlib import Path
from typing import Dict, List

SPEC_DIR = Path("spec")

# One generated document per locale. "en" is the canonical text; "de" and
# "al" are read from the optional "i18n" blocks in the spec JSON files and
# fall back to English where a translation is missing.
OUTPUT_FILES = {
    "en": Path("_includes/spec.md"),
    "de": Path("_includes/spec.de.md"),
    "al": Path("_includes/spec.al.md"),
}

STRINGS = {
    "en": {
        "toc": "Table of Contents",
        "examples": "**Examples:**",
        "version": "Version",
        "updated": "Last Updated",
        "col_standard": "Standard German",
        "col_alman": "Alman",
        "col_english": "English",
        "sd": "**Standard German**",
    },
    "de": {
        "toc": "Inhaltsverzeichnis",
        "examples": "**Beispiele:**",
        "version": "Version",
        "updated": "Stand",
        "col_standard": "Standarddeutsch",
        "col_alman": "Alman",
        "col_english": "Englisch",
        "sd": "**Standarddeutsch**",
    },
    "al": {
        "toc": "Inhaltsverzeichnis",
        "examples": "**Beispiele:**",
        "version": "Version",
        "updated": "Stand",
        "col_standard": "Standarddeutsch",
        "col_alman": "Alman",
        "col_english": "Englisch",
        "sd": "**Standarddeutsch**",
    },
}


def load_json(path: Path) -> dict:
    """Load JSON file with error handling."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {path}: {str(e)}")
        return {}


def text(obj: dict, field: str, locale: str) -> str:
    """Localized prose field with English fallback."""
    if locale != "en":
        localized = obj.get("i18n", {}).get(locale, {}).get(field)
        if localized:
            return localized
    return obj.get(field, "")


def process_examples(examples: List[Dict], locale: str) -> str:
    """Convert examples to markdown table."""
    if not examples:
        return ""

    s = STRINGS[locale]
    # Check if any example has an English translation
    has_english = any("english" in ex for ex in examples)

    if has_english:
        table = [
            f"| {s['col_standard']} | {s['col_alman']} | {s['col_english']} |",
            "|------------------|--------|---------|",
        ]
        for ex in examples:
            table.append(
                f"| {ex['standard']} | {ex['alman']} | {ex.get('english', '')} |"
            )
    else:
        table = [
            f"| {s['col_standard']} | {s['col_alman']} |",
            "|------------------|-------|",
        ]
        for ex in examples:
            table.append(f"| {ex['standard']} | {ex['alman']} |")

    return "\n".join(table)


class NumberingSystem:
    def __init__(self):
        self.numbering_map_path = SPEC_DIR / "numbering_map.json"
        self.map: dict = {
            "section_numbers": {},
            "paragraph_numbers": {},
            "rule_letters": {},
        }

        # Load existing map if available
        if self.numbering_map_path.exists():
            with open(self.numbering_map_path, "r", encoding="utf-8") as f:
                self.map = json.load(f)

    def get_section_number(self, section_id: str) -> int:
        """Get or assign a section number"""
        if section_id in self.map["section_numbers"]:
            return self.map["section_numbers"][section_id]

        # Find next available number
        existing_numbers = set(self.map["section_numbers"].values())
        next_num = 1
        while next_num in existing_numbers:
            next_num += 1

        self.map["section_numbers"][section_id] = next_num
        return next_num

    def get_paragraph_number(self, paragraph_id: str) -> int:
        """Get or assign a global paragraph number"""
        if paragraph_id in self.map["paragraph_numbers"]:
            return self.map["paragraph_numbers"][paragraph_id]

        existing_numbers = set(self.map["paragraph_numbers"].values())
        next_num = 1
        while next_num in existing_numbers:
            next_num += 1

        self.map["paragraph_numbers"][paragraph_id] = next_num
        return next_num

    def get_rule_letter(self, paragraph_id: str, rule_id: str) -> str:
        """Get or assign a rule letter within paragraph"""
        key = f"{paragraph_id}/{rule_id}"
        if key in self.map["rule_letters"]:
            return self.map["rule_letters"][key]

        # Get existing letters in this paragraph
        existing = [
            v
            for k, v in self.map["rule_letters"].items()
            if k.startswith(f"{paragraph_id}/")
        ]

        # Find next available letter
        letter = "a"
        while letter in existing:
            letter = chr(ord(letter) + 1)
            if letter > "z":
                letter = "a"  # wrap around if needed

        self.map["rule_letters"][key] = letter
        return letter

    def save(self):
        """Persist numbering map to file"""
        with open(self.numbering_map_path, "w", encoding="utf-8") as f:
            json.dump(self.map, f, indent=2)


def build_document(locale: str, numbering: NumberingSystem) -> str:
    s = STRINGS[locale]
    output = []
    toc = []

    # Load main document
    main_doc = load_json(SPEC_DIR / "main.json")
    output.append(
        f"# {text(main_doc, 'documentTitle', locale) or 'Alman Documentation'}\n"
    )
    output.append(f"**{s['version']}**: {main_doc.get('documentVersion', '')}  \n")
    output.append(f"**{s['updated']}**: {main_doc.get('lastUpdated', '')}\n")

    # Collect all sections for TOC
    all_sections = main_doc.get("sections", [])
    for section_ref in all_sections:
        section_id = section_ref["id"]
        section_path = SPEC_DIR / "sections" / section_id / "section.json"
        section = load_json(section_path)

        if section:
            # Start section list item
            section_item = [
                f'<li><a href="#{section_id}">{text(section, "title", locale)}</a>'
            ]
            para_items = []

            # Process paragraphs
            for para_ref in section.get("paragraphs", []):
                para_id = para_ref["id"]
                para_path = (
                    SPEC_DIR
                    / "sections"
                    / section_id
                    / "paragraphs"
                    / para_id
                    / "paragraph.json"
                )
                paragraph = load_json(para_path)

                if paragraph:
                    para_num = numbering.get_paragraph_number(para_id)
                    para_items.append(
                        f'<li><a href="#{para_id}">§{para_num} {text(paragraph, "title", locale)}</a></li>'
                    )

            # Add paragraphs if any
            if para_items:
                section_item.append(
                    '<ul style="list-style: none; padding-left: 20px; margin-left: 0;">\n'
                    + "\n".join(para_items)
                    + "\n</ul>"
                )

            section_item.append("</li>")
            toc.append("\n".join(section_item))

    # Process Introduction first
    if all_sections:
        intro_ref = all_sections[0]
        section_id = intro_ref["id"]
        section_path = SPEC_DIR / "sections" / section_id / "section.json"
        section = load_json(section_path)

        if section:
            output.append(f"\n## {text(section, 'title', locale)} {{#{section_id}}}\n")
            output.append(text(section, "body", locale) + "\n")

    # Add TOC after Introduction
    output.append(f"\n## {s['toc']}\n")
    output.append("""<div class="toc-container" style="
        list-style: none;
        padding-left: 0;
        margin-left: 0;
    ">\n""")
    output.append('<ul style="list-style: none; padding-left: 0; margin-left: 0;">\n')
    output.append("\n".join(toc))
    output.append("</ul>\n")
    output.append("</div>\n")

    # Process remaining sections
    for section_ref in all_sections[1:]:
        section_id = section_ref["id"]
        section_path = SPEC_DIR / "sections" / section_id / "section.json"
        section = load_json(section_path)

        if not section:
            continue

        output.append(f"\n## {text(section, 'title', locale)} {{#{section_id}}}\n")
        output.append(text(section, "body", locale) + "\n")

        # Process paragraphs
        for para_ref in section.get("paragraphs", []):
            para_id = para_ref["id"]
            para_path = (
                SPEC_DIR
                / "sections"
                / section_id
                / "paragraphs"
                / para_id
                / "paragraph.json"
            )
            paragraph = load_json(para_path)

            if not paragraph:
                continue

            # Get global paragraph number
            para_num = numbering.get_paragraph_number(para_id)
            output.append(
                f"\n### §{para_num}. {text(paragraph, 'title', locale)} {{#{para_id}}}\n"
            )
            output.append(text(paragraph, "body", locale) + "\n")

            # Process rules
            rules = paragraph.get("rules", [])
            for rule in rules:
                rule_id = rule["id"]

                # Skip rule number/letter if there's only one rule
                if len(rules) == 1:
                    # If rule title matches paragraph title, don't show rule title
                    if rule.get("title") != paragraph.get("title"):
                        output.append(f"\n#### {text(rule, 'title', locale)}\n")
                else:
                    letter = numbering.get_rule_letter(para_id, rule_id)
                    output.append(
                        f"\n#### §{para_num}{letter}. {text(rule, 'title', locale)}\n"
                    )

                output.append(text(rule, "description", locale) + "\n")

                # Add examples table
                examples_md = process_examples(rule.get("examples", []), locale)
                if examples_md:
                    output.append(f"\n{s['examples']}\n")
                    output.append(examples_md)
                output.append("\n")

    final_md = "\n".join(output)
    return final_md.replace("<alman />", "**Alman**").replace("<sd />", s["sd"])


def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Build Alman documentation")
    parser.add_argument(
        "--fill-missing-numbering",
        action="store_true",
        help="Save numbering map for missing entries",
    )
    args = parser.parse_args()

    numbering = NumberingSystem()

    for locale, output_file in OUTPUT_FILES.items():
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(build_document(locale, numbering))
        print(f"Document compiled to {output_file}")

    # Save numbering map only if flag is present
    if args.fill_missing_numbering:
        numbering.save()


if __name__ == "__main__":
    main()
