from alman.bench.almanbench import AlmanBenchItem, load_almanbench_items


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


def test_fixed_expressions_drop_archaic_dative_e() -> None:
    items = {item.id: item for item in load_almanbench_items()}
    horse = items["almanbench/canonical/01011"]
    house = items["almanbench/modern-tatoeba/pub-045"]

    assert all("zu Pferd" in rendering for rendering in horse.accepted)
    assert all("zu Pferde" not in rendering for rendering in horse.accepted)
    assert house.accepted == ["Gestern war ich bei ihm zu Haus."]
    assert "Fixed expressions are not exempt" in (horse.note or "")
    assert "drops under §3a" in (house.note or "")
