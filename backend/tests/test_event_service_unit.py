from datetime import date, timedelta

import pytest

from app.services import event_service


@pytest.mark.parametrize(
    "raw_status, expected",
    [
        ("Publié", "published"),
        ("publie", "published"),
        ("published", "published"),
        ("Dépublié", "depublished"),
        ("unpublished", "depublished"),
        ("Brouillon", "draft"),
        ("draft", "draft"),
        ("Terminé", "finished"),
        ("finished", "finished"),
    ],
)
def test_normalize_status_maps_known_variants(raw_status: str, expected: str) -> None:
    assert event_service._normalize_status(raw_status) == expected


def test_normalize_status_trims_and_lowercases_unknown_values() -> None:
    assert event_service._normalize_status("  CuStOm  ") == "custom"


def test_is_past_event_date_with_relative_dates() -> None:
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    assert event_service._is_past_event_date(yesterday)
    assert not event_service._is_past_event_date(today)
    assert not event_service._is_past_event_date(tomorrow)


def test_is_past_event_date_handles_datetime_like_and_invalid_values() -> None:
    yesterday_datetime_text = f"{(date.today() - timedelta(days=1)).isoformat()}T20:00:00"

    assert event_service._is_past_event_date(yesterday_datetime_text)
    assert not event_service._is_past_event_date("not-a-date")
    assert not event_service._is_past_event_date(None)
