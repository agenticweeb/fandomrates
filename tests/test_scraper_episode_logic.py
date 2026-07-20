import unittest

from scraper import resolve_part_episode_limit


class ResolvePartEpisodeLimitTests(unittest.TestCase):
    def test_releasing_season_uses_next_airing_episode_minus_one(self):
        part_media = {
            "status": "RELEASING",
            "episodes": 14,
            "nextAiringEpisode": {"episode": 4},
        }
        self.assertEqual(resolve_part_episode_limit(part_media, [], [], fallback_default=1), 3)

    def test_finished_season_uses_media_episode_count(self):
        part_media = {"status": "FINISHED", "episodes": 11}
        self.assertEqual(resolve_part_episode_limit(part_media, [], [], fallback_default=1), 11)

    def test_falls_back_to_jikan_count_when_media_missing(self):
        self.assertEqual(resolve_part_episode_limit(None, [{}, {}, {}], [], fallback_default=1), 3)


if __name__ == "__main__":
    unittest.main()
