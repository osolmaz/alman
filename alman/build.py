import json
from pathlib import Path
from typing import Dict, List

SPEC_DIR = Path("spec")
OUTPUT_FILE = Path("build/spec.md")

def load_json(path: Path) -> dict:
    """Load JSON file with error handling."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {path}: {str(e)}")
        return {}

def process_examples(examples: List[Dict]) -> str:
    """Convert examples to markdown table."""
    if not examples:
        return ""

    table = [
        "| Standard German | Alman |",
        "|------------------|-------|"
    ]
    for ex in examples:
        table.append(f"| {ex['standard']} | {ex['alman']} |")
    return "\n".join(table)

def main():
    """Main compilation function."""
    output = []

    # Load main document
    main_doc = load_json(SPEC_DIR / "main.json")
    output.append(f"# {main_doc.get('documentTitle', 'Alman Documentation')}\n")
    output.append(f"**Version**: {main_doc.get('documentVersion', '')}  \n")
    output.append(f"**Last Updated**: {main_doc.get('lastUpdated', '')}\n")

    # Process sections
    for section_ref in main_doc.get("sections", []):
        section_path = SPEC_DIR / "sections" / section_ref["id"] / "section.json"
        section = load_json(section_path)

        if not section:
            continue

        output.append(f"\n## {section.get('title', '')}\n")
        output.append(section.get("body", "") + "\n")

        # Process paragraphs
        for para_ref in section.get("paragraphs", []):
            para_path = (SPEC_DIR / "sections" / section_ref["id"] / "paragraphs"
                         / para_ref["id"] / "paragraph.json")
            paragraph = load_json(para_path)

            if not paragraph:
                continue

            output.append(f"\n### {paragraph.get('title', '')}\n")
            output.append(paragraph.get("body", "") + "\n")

            # Process rules
            for rule in paragraph.get("rules", []):
                output.append(f"\n#### {rule.get('title', '')}\n")
                output.append(rule.get("description", "") + "\n")

                # Add examples table
                examples_md = process_examples(rule.get("examples", []))
                if examples_md:
                    output.append("\n**Examples:**\n")
                    output.append(examples_md)
                output.append("\n")

    # Write final output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        final_md = "\n".join(output)
        # Replace placeholders
        final_md = final_md.replace("<alman />", "Alman").replace("<sd />", "Standard German")
        f.write(final_md)

if __name__ == "__main__":
    main()
    print(f"Document compiled to {OUTPUT_FILE}")
