import os
import unittest
from unittest.mock import patch

from scraper_config import validate_config


class ScraperConfigTests(unittest.TestCase):
    def test_missing_secrets_fail_with_actionable_name(self):
        with patch.dict(os.environ, {"FANDOMRATES_ENV": "ci"}, clear=True):
            with self.assertRaisesRegex(ValueError, "DB_HOST"):
                validate_config()

    def test_invalid_port_is_rejected(self):
        env = {
            "FANDOMRATES_ENV": "ci",
            "DB_HOST": "db.example",
            "DB_USER": "postgres",
            "DB_PASSWORD": "secret",
            "DB_NAME": "postgres",
            "DB_PORT": "not-a-port",
        }
        with patch.dict(os.environ, env, clear=True):
            with self.assertRaisesRegex(ValueError, "DB_PORT"):
                validate_config()

    def test_valid_config_has_secure_default_tls(self):
        env = {
            "FANDOMRATES_ENV": "ci",
            "DB_HOST": "db.example",
            "DB_USER": "postgres",
            "DB_PASSWORD": "secret",
            "DB_NAME": "postgres",
            "DB_PORT": "5432",
        }
        with patch.dict(os.environ, env, clear=True):
            config = validate_config()
        self.assertEqual(config.sslmode, "require")
        self.assertEqual(config.connect_timeout, 15)


if __name__ == "__main__":
    unittest.main()
