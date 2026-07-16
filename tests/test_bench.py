import json

import pytest

from alman.bench.dataset import (
    find_spec_example_overlaps,
    load_curated_items,
    load_items,
    spec_rule_ids,
)
from alman.bench.pattern import PatternError, expand_pattern
from alman.bench.scoring import is_accepted, lint, normalize
from alman.bench.task import alman_bench


@pytest.fixture(scope="module")
def items():
    return load_items()


@pytest.fixture(scope="module")
def items_by_id(items):
    return {item.id: item for item in items}


@pytest.fixture(scope="module")
def curated_items():
    return load_curated_items()


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

    def test_singular_they_examples(self, items_by_id):
        generic = items_by_id[
            "pronouns-and-determiners/pronouns/gender-neutral-referents/4"
        ]
        assert generic.accepted == ["Die Mensch? Sie sind ein Rätsel."]
        unknown = items_by_id[
            "pronouns-and-determiners/pronouns/gender-neutral-referents/5"
        ]
        assert unknown.accepted == ["Jemand hat angerufen. Sie waren freundlich."]

    def test_ein_compound_base_form(self, items_by_id):
        item = items_by_id[
            "pronouns-and-determiners/determiners/possessive-determiners-kein/4"
        ]
        assert item.source == "mit irgendeiner Besorgung"
        assert item.accepted == ["mit irgendein Besorgung"]

    def test_apposition_agreement_examples(self, items_by_id):
        von = items_by_id["articles/definite-articles/von-die-usage/2"]
        assert von.accepted == ["bei die Lehren von sein Vater, die Gelehrte"]
        name = items_by_id["articles/definite-articles/von-die-usage/3"]
        assert name.accepted == [
            "die Werke Goethes, der Dichter",
            "die Werke von Goethe, die Dichter",
        ]


class TestPattern:
    def test_plain_text(self):
        assert expand_pattern("die Mann") == ["die Mann"]

    def test_alternation_canonical_first(self):
        assert expand_pattern("Die Buch {der|von die} Schüler") == [
            "Die Buch der Schüler",
            "Die Buch von die Schüler",
        ]

    def test_independent_groups_cross_product(self):
        assert expand_pattern("{a|b} und {c|d}") == [
            "a und c",
            "a und d",
            "b und c",
            "b und d",
        ]

    def test_optional_omitted_in_canonical(self):
        assert expand_pattern("die Sessel[s]") == ["die Sessel", "die Sessels"]

    def test_linked_groups_covary(self):
        assert expand_pattern(
            "die Name {g:Gotamas|von Gotama}, {g:der|die} Buddha"
        ) == [
            "die Name Gotamas, der Buddha",
            "die Name von Gotama, die Buddha",
        ]

    def test_rule_annotation_ignored(self):
        assert expand_pattern("wegen {der|die}@1b Wetter") == [
            "wegen der Wetter",
            "wegen die Wetter",
        ]

    def test_nested_groups(self):
        assert expand_pattern("{a {b|c}|d}") == ["a b", "a c", "d"]

    def test_escapes(self):
        assert expand_pattern(r"kein \{Muster\} \| hier") == ["kein {Muster} | hier"]

    def test_duplicates_removed(self):
        assert expand_pattern("{a|a} x") == ["a x"]

    def test_linked_branch_count_mismatch(self):
        with pytest.raises(PatternError):
            expand_pattern("{g:a|b} {g:c|d|e}")

    def test_unclosed_group(self):
        with pytest.raises(PatternError):
            expand_pattern("die {der|von die Mann")

    def test_stray_closer(self):
        with pytest.raises(PatternError):
            expand_pattern("die } Mann")

    def test_variant_cap(self):
        pattern = " ".join("{a|b}" for _ in range(20))
        with pytest.raises(PatternError):
            expand_pattern(pattern, max_variants=100)


class TestCurated:
    def test_task_uses_curated_items_by_default(self):
        task = alman_bench()
        assert task.dataset.name == "alman-bench-curated"
        assert len(task.dataset) == 89

    def test_task_accepts_inspect_paragraph_list(self):
        task = alman_bench(paragraphs=["regelabdeckung", "relativsaetze"])
        assert len(task.dataset) == 41
        assert {sample.metadata["paragraph"] for sample in task.dataset} == {
            "regelabdeckung",
            "relativsaetze",
        }

    def test_task_rejects_spec_examples_with_spec_in_prompt(self):
        with pytest.raises(ValueError, match="leaks its answers"):
            alman_bench(dataset="spec")

    def test_task_allows_no_spec_diagnostic(self, items):
        task = alman_bench(dataset="spec", include_spec=False)
        assert task.dataset.name == "alman-bench-spec"
        assert len(task.dataset) == len(items)

    def test_item_count(self, curated_items):
        assert len(curated_items) == 89

    def test_curated_items_do_not_duplicate_spec_examples(self, curated_items):
        assert find_spec_example_overlaps(curated_items) == []

    def test_spec_example_overlap_is_rejected(self, tmp_path):
        (tmp_path / "overlap.json").write_text(
            json.dumps(
                {
                    "collection": "overlap",
                    "items": [
                        {
                            "source": "die Ärztin",
                            "accepted": ["die Arzt"],
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="duplicate specification examples"):
            load_curated_items(tmp_path)

    def test_collections(self, curated_items):
        collections = {item.paragraph for item in curated_items}
        assert collections == {
            "ablaut",
            "berufe",
            "deutsch-alman",
            "die-verwandlung",
            "regelabdeckung",
            "relativsaetze",
            "siddhartha",
            "starke-flexion",
            "steppenwolf",
        }

    def test_singular_they_in_steppenwolf(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        generic = by_id["curated/steppenwolf/0"]
        assert "sie sind vielmehr ein Versuch" in generic.accepted[0]
        assert not any("er ist vielmehr" in v for v in generic.accepted)
        anaphora = by_id["curated/steppenwolf/1"]
        assert "treibt sie die innerste Bestimmung" in anaphora.accepted[0]
        assert "ihr Leben" in anaphora.accepted[0]

    def test_invariant_relativizer_in_siddhartha(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/siddhartha/10"]
        assert "alles, das Siddhartha" in item.accepted[0]
        assert any("alles, die Siddhartha" in value for value in item.accepted)
        # The uninflected free-relative 'was' is retained after indefinite
        # heads (spec rule on relative pronouns).
        assert any("alles, was Siddhartha" in value for value in item.accepted)

    def test_relativsaetze_collection(self, curated_items):
        by_id = {item.id: item for item in curated_items}

        # Canonical rendering uses 'das', 'die' is accepted, and the SD
        # case-marked forms are not.
        object_rel = by_id["curated/relativsaetze/1"]
        assert (
            object_rel.accepted[0] == "Die Film, das wir gestern sahen, war langweilig."
        )
        assert "Die Film, die wir gestern sahen, war langweilig." in object_rel.accepted
        assert not any(", den " in v for v in object_rel.accepted)

        # Genitive: 'dessen' -> 'deren', no das/die alternation.
        genitive = by_id["curated/relativsaetze/5"]
        assert genitive.accepted == [
            "Die Autor, deren Roman ich gerade lese, lebt in Berlin."
        ]

        # Plural 'deren' survives unchanged (identity translation).
        identity = by_id["curated/relativsaetze/6"]
        assert identity.accepted == [identity.source]

        # After indefinite heads the invariant relativizer is canonical and
        # the uninflected free-relative 'was' stays accepted.
        was_rel = by_id["curated/relativsaetze/7"]
        assert was_rel.accepted[0] == "Nichts, das er sagte, war neu."
        assert "Nichts, was er sagte, war neu." in was_rel.accepted

        # Two clauses choose independently: 2 x 2 variants.
        independent = by_id["curated/relativsaetze/12"]
        assert len(independent.accepted) == 4
        assert any(
            ", das er baute" in v and ", die er pflanzte" in v
            for v in independent.accepted
        )

    def test_every_spec_rule_covered(self, curated_items):
        """The curated tier is a minimum demonstrative set: every rule in the
        spec must be the designated target of at least one curated item."""
        covered = {rule for item in curated_items for rule in item.covers}
        uncovered = [rule for rule in spec_rule_ids() if rule not in covered]
        assert uncovered == []

    def test_covers_names_known_rules(self, tmp_path):
        (tmp_path / "x.json").write_text(
            json.dumps(
                {
                    "collection": "x",
                    "items": [
                        {
                            "source": "a",
                            "accepted": ["b"],
                            "covers": ["no-such-rule"],
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="unknown spec rules"):
            load_curated_items(tmp_path)

    def test_regelabdeckung_collection(self, curated_items):
        by_id = {item.id: item for item in curated_items}

        # Stressed attributive DAS becomes 'diese' (all-caps emphasis variant
        # accepted); standalone 'den' becomes the neutral demonstrative 'das'
        # (article-aligned 'die' accepted).
        stressed = by_id["curated/regelabdeckung/1"]
        assert stressed.accepted == [
            "Diese Auto will sie haben, kein andere.",
            "DIESE Auto will sie haben, kein andere.",
        ]
        standalone = by_id["curated/regelabdeckung/2"]
        assert standalone.accepted[0].startswith("Das habe ich")
        assert any(v.startswith("Die habe ich") for v in standalone.accepted)

        # Motion and location collapse onto the same surface form.
        motion = by_id["curated/regelabdeckung/3"]
        location = by_id["curated/regelabdeckung/4"]
        assert motion.accepted == ["Sie geht in die Keller."]
        assert location.accepted == ["Die Fahrräder stehen in die Keller."]

        # Weak noun in the accusative: singular form, not the -en oblique.
        weak = by_id["curated/regelabdeckung/8"]
        assert weak.accepted == ["Ich habe die Student nach die Weg gefragt."]

        # Object-fronted SD source must be reordered subject-first.
        reorder = by_id["curated/regelabdeckung/24"]
        assert reorder.accepted == ["Die Firma hat die Vertrag nie unterschrieben."]

        # Pronoun object may stay fronted (identity).
        pronoun = by_id["curated/regelabdeckung/25"]
        assert pronoun.accepted == [pronoun.source]

    def test_ids_unique_across_tiers(self, items, curated_items):
        ids = [item.id for item in items] + [item.id for item in curated_items]
        assert len(ids) == len(set(ids))

    def test_every_item_has_provenance(self, curated_items):
        assert all(item.provenance for item in curated_items)

    def test_dative_adjective_collapsed(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/starke-flexion/4"]
        assert item.source == "großem Mann (Dative)"
        assert item.accepted == ["große Mann"]

    def test_possessive_base_form(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/berufe/5"]
        assert item.accepted == ["Die Anwalt vertritt ihr Mandanten vor Gericht."]

    def test_ditransitive_acceptance_set(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/deutsch-alman/4"]
        assert item.accepted == [
            "Ich gebe die Arzt die Medikament.",
            "Ich gebe die Medikament an die Arzt.",
        ]

    def test_pattern_expands_genitive_variants(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/siddhartha/0"]
        assert item.pattern is not None
        # 5 independent {der|von die} choice points -> 2^5 variants.
        assert len(item.accepted) == 32
        assert item.accepted[0].startswith("In die Schatten der Haus")
        assert any("von die Salwald" in variant for variant in item.accepted)

    def test_linked_apposition_covaries(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/siddhartha/15"]
        assert any("Gotamas, der Buddha" in variant for variant in item.accepted)
        assert any("von Gotama, die Buddha" in variant for variant in item.accepted)
        assert not any("von Gotama, der Buddha" in variant for variant in item.accepted)
        assert not any("Gotamas, die Buddha" in variant for variant in item.accepted)

    def test_apposition_follows_von_construction(self, curated_items):
        by_id = {item.id: item for item in curated_items}
        item = by_id["curated/siddhartha/2"]
        assert "von sein Vater, die Gelehrte" in item.accepted[0]

    def test_exactly_one_of_pattern_or_accepted(self, tmp_path):
        (tmp_path / "x.json").write_text(
            json.dumps(
                {
                    "collection": "x",
                    "items": [{"source": "a", "accepted": ["b"], "pattern": "b"}],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="exactly one"):
            load_curated_items(tmp_path)

    def test_all_curated_targets_pass_lint(self, curated_items):
        """Self-consistency: no accepted curated rendering violates the linter."""
        failures = [
            (item.id, variant, violations)
            for item in curated_items
            for variant in item.accepted
            if (violations := lint(variant))
        ]
        assert failures == []


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
