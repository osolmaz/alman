from alman.bench.almanbench import AlmanBenchItem


def _payload() -> dict:
    return {
        "id": "almanbench/test/000",
        "tier": "naturalistic",
        "bin": "test",
        "set": "public",
        "source": "Der Mann kommt.",
        "accepted": ["Die Mann kommt."],
        "covers": ["non-genitive-articles"],
        "register": "modern",
        "guard": False,
        "orthography_archaic": False,
        "work": {},
    }


def test_translator_note_is_optional() -> None:
    item = AlmanBenchItem.model_validate(_payload())
    assert item.note is None


def test_translator_note_is_preserved() -> None:
    payload = _payload()
    payload["note"] = "The definite article becomes invariant `die`."
    item = AlmanBenchItem.model_validate(payload)
    assert item.note == payload["note"]
