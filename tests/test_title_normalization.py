import unittest

from scraper import normalize_title_for_search


class TitleNormalizationTests(unittest.TestCase):
    def test_normalizes_case_punctuation_and_spacing(self):
        self.assertEqual(
            normalize_title_for_search("  Re:ZERO -Starting Life in Another World- "),
            "re zero starting life in another world",
        )

    def test_removes_diacritic_without_changing_search_key_shape(self):
        self.assertEqual(normalize_title_for_search("Pokémon"), "pokemon")

    def test_empty_or_symbol_only_titles_are_empty(self):
        self.assertEqual(normalize_title_for_search("---"), "")
        self.assertEqual(normalize_title_for_search(None), "")


if __name__ == "__main__":
    unittest.main()
