import pytest

from alman.bench.dataset import load_items
from alman.bench.scoring import is_accepted, lint, normalize


@pytest.fixture(scope="module")
def items():
    return load_items()


@pytest.fixture(scope="module")
def items_by_id(items):
    return {item.id: item for item in items}


class TestExtraction:
    def test_item_count(self, items):
        # 173 spec examples, some of which expand into multiple items
        # (multiple Standard German source variants).
        assert len(items) >= 173

    def test_ids_unique(self, items):
        ids = [item.id for item in items]
        assert len(ids) == len(set(ids))

    def test_every_item_has_accepted(self, items):
        assert all(item.accepted for item in items)

    def test_simple_pair(self, items_by_id):
        item = items_by_id["articles/definite-articles/non-genitive-articles/0"]
        assert item.source == "der Mann (Nominative)"
        assert item.note == "Nominative"
        assert item.accepted == ["die Mann"]

    def test_target_variants_become_acceptance_set(self, items_by_id):
        item = items_by_id["articles/definite-articles/genitive-articles/3"]
        assert item.source == "wegen des Wetters"
        assert item.accepted == ["wegen der Wetter", "wegen die Wetter"]

    def test_three_way_acceptance_set(self, items_by_id):
        item = items_by_id["pronouns-and-determiners/determiners/genitive-handling/2"]
        assert item.accepted == [
            "die Urteil von diejenige Mann",
            "die Urteil von jene Mann",
            "die Urteil derjenige Mann",
        ]

    def test_source_variants_become_separate_items(self, items_by_id):
        first = items_by_id["lexical-gender/job-titles/occupational-titles/0.0"]
        second = items_by_id["lexical-gender/job-titles/occupational-titles/0.1"]
        assert first.source == "der Lehrer"
        assert second.source == "die Lehrerin"
        assert first.accepted == second.accepted == ["die Lehrer"]

    def test_paired_variants_align_by_position(self, items_by_id):
        # der Sessel (singular)/die Sessel (plural) -> die Sessel/die Sessels
        singular = items_by_id["nouns/noun-morphology/optional-plural-marking/1.0"]
        plural = items_by_id["nouns/noun-morphology/optional-plural-marking/1.1"]
        assert singular.source == "der Sessel (singular)"
        assert singular.accepted == ["die Sessel"]
        assert plural.source == "die Sessel (plural)"
        assert plural.accepted == ["die Sessels"]

    def test_slash_inside_parens_not_split(self, items_by_id):
        item = items_by_id["articles/definite-articles/non-genitive-articles/3"]
        assert item.source == "die Frau (Nominative/Accusative)"
        assert item.accepted == ["die Frau"]

    def test_target_notes_stripped(self, items_by_id):
        item = items_by_id["nouns/noun-morphology/case-neutralization/6"]
        assert item.source == "die Kollegen (Plural)"
        assert item.accepted == ["die Kollegen"]

    def test_markdown_bold_stripped(self, items_by_id):
        item = items_by_id[
            "pronouns-and-determiners/determiners/indefinite-negative-quantifiers/8"
        ]
        assert item.source == "Vielen Dank!"
        assert item.accepted == ["Viel Dank!"]

    def test_paradigm_override_applied(self, items_by_id):
        item = items_by_id[
            "pronouns-and-determiners/determiners/unified-non-genitive-forms/0"
        ]
        assert "diese" in item.accepted
        assert "diese, diese, diese, diese, diese" in item.accepted


class TestNormalize:
    def test_whitespace_collapsed(self):
        assert normalize("die  Mann \n") == "die Mann"

    def test_trailing_period_stripped(self):
        assert normalize("Ich gehe in die Kino.") == normalize("Ich gehe in die Kino")

    def test_exclamation_preserved(self):
        assert normalize("Gib mir die Buch!") != normalize("Gib mir die Buch")

    def test_typographic_apostrophe(self):
        assert normalize("Hans\u2019 Fahrrad") == normalize("Hans' Fahrrad")

    def test_wrapping_quotes_stripped(self):
        assert normalize('"die Mann"') == "die Mann"

    def test_case_preserved(self):
        assert normalize("Sie ist nett") != normalize("sie ist nett")


class TestAcceptance:
    def test_accepts_any_variant(self):
        accepted = ["wegen der Wetter", "wegen die Wetter"]
        assert is_accepted("wegen die Wetter", accepted)
        assert is_accepted("wegen der Wetter", accepted)
        assert not is_accepted("wegen des Wetters", accepted)


class TestLint:
    def test_flags_forbidden_forms(self):
        violations = lint("Ich gehe im Garten mit dem Hund.")
        assert len(violations) == 2

    def test_clean_alman_passes(self):
        assert lint("Ich gehe in die Garten mit die Hund.") == []

    def test_retained_man_pronoun_forms_allowed(self):
        assert lint("Das ärgert einen.") == []
        assert lint("Das hilft einem sehr.") == []

    def test_all_spec_targets_pass_lint(self, items):
        """Self-consistency: no accepted spec rendering violates the linter."""
        failures = [
            (item.id, variant, violations)
            for item in items
            for variant in item.accepted
            if (violations := lint(variant))
        ]
        assert failures == []
