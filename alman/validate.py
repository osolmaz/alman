import json
import os
import sys
import time

from jsonschema import Draft202012Validator, ValidationError, validate


# from referencing.jsonschema import DRAFT202012
def load_json_file(file_path, deserialize=True) -> dict | str:
    with open(file_path) as schema_file:
        content = schema_file.read()
        # Remove the lines that begin with //. Account for spaces before the //
        content = "\n".join(
            [line for line in content.split("\n") if not line.lstrip().startswith("//")]
        )

        if deserialize:
            return json.loads(content)
        else:
            return content


def validate_json(schema_path, data_path):
    schema = load_json_file(schema_path)
    data = load_json_file(data_path)

    # Create the validator with the registry
    validator = Draft202012Validator(schema)

    try:
        start = time.time()
        validator.validate(data)
        end = time.time()
        elapsed_ms = (end - start) * 1000
        print(f"{data_path} is valid (took {elapsed_ms:.3f}ms)")
        sys.exit(0)
    except ValidationError as e:
        print(f"Validation error: {e}")
        sys.exit(1)
