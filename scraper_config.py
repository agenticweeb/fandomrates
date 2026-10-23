"""Configuration validation for the FandomRates ingestion CLI.

This module intentionally has no network, database, or optional third-party imports so
invalid production configuration fails before side effects can occur.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class DatabaseConfig:
    host: str
    user: str
    password: str
    name: str
    port: int
    sslmode: str
    connect_timeout: int


def _required(name: str) -> str:
    value = os.environ.get(name, "")
    if not value.strip():
        raise ValueError(f"Missing required environment variable: {name}")
    return value.strip()


def validate_config(*, allow_local_dotenv: bool = False) -> DatabaseConfig:
    """Validate the one supported scraper database contract.

    Dotenv loading is deliberately opt-in and must never happen in CI/production.
    The workflow supplies FANDOMRATES_ENV=production, which makes accidental local
    .env leakage impossible during scheduled runs.
    """
    environment = os.environ.get("FANDOMRATES_ENV", "local").strip().lower()
    if environment in {"production", "ci"} and allow_local_dotenv:
        raise ValueError("Local dotenv loading is not permitted in CI or production")

    required = {name: _required(name) for name in ("DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT")}
    port_raw = required["DB_PORT"]
    try:
        port = int(port_raw)
    except ValueError as exc:
        raise ValueError("DB_PORT must be an integer between 1 and 65535") from exc
    if not 1 <= port <= 65535:
        raise ValueError("DB_PORT must be an integer between 1 and 65535")

    sslmode = os.environ.get("DB_SSLMODE", "require").strip().lower()
    if sslmode not in {"require", "verify-ca", "verify-full"}:
        raise ValueError("DB_SSLMODE must be require, verify-ca, or verify-full")

    timeout_raw = os.environ.get("DB_CONNECT_TIMEOUT", "15").strip()
    try:
        connect_timeout = int(timeout_raw)
    except ValueError as exc:
        raise ValueError("DB_CONNECT_TIMEOUT must be a positive integer") from exc
    if not 1 <= connect_timeout <= 120:
        raise ValueError("DB_CONNECT_TIMEOUT must be between 1 and 120 seconds")

    return DatabaseConfig(
        host=required["DB_HOST"],
        user=required["DB_USER"],
        password=required["DB_PASSWORD"],
        name=required["DB_NAME"],
        port=port,
        sslmode=sslmode,
        connect_timeout=connect_timeout,
    )


def load_local_dotenv() -> None:
    """Load dotenv only when explicitly requested for local development."""
    if os.environ.get("FANDOMRATES_ENV", "local").strip().lower() != "local":
        return
    if os.environ.get("FANDOMRATES_LOAD_DOTENV", "0") != "1":
        return
    from dotenv import load_dotenv

    load_dotenv(override=False)
