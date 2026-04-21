import pytest

from app.services import comment_service


@pytest.mark.parametrize(
    "raw_text, expected",
    [
        ('{"flagged": true}', True),
        ('{"flagged": false}', False),
        ('{"flagged": "true"}', True),
        ('```json\n{"flagged": true}\n```', True),
        ('model output: {"flagged": false} end', False),
        ('no-json-response', False),
    ],
)
def test_extract_flagged_from_gemini_text(raw_text: str, expected: bool) -> None:
    assert comment_service._extract_flagged_from_gemini_text(raw_text) is expected


def test_serialize_comment_sets_admin_author_and_hidden_flags() -> None:
    doc = {
        "_id": "abc123",
        "event_id": 7,
        "user_id": 2,
        "user_email": "admin@example.com",
        "rating": 4,
        "content": "test comment",
        "author_role": "ADMIN",
        "is_hidden": True,
        "hidden_by": "ADMIN",
        "hidden_reason": "admin_action",
    }

    serialized = comment_service._serialize_comment(doc)

    assert serialized["is_admin_author"] is True
    assert serialized["is_hidden"] is True
    assert serialized["hidden_by"] == "ADMIN"
    assert serialized["hidden_reason"] == "admin_action"


def test_is_flagged_by_gemini_returns_false_when_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(comment_service, "GEMINI_ENABLED", False)

    assert comment_service._is_flagged_by_gemini("offensive sample") is False


def test_is_flagged_by_gemini_returns_false_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(comment_service, "GEMINI_ENABLED", True)
    monkeypatch.setattr(comment_service, "GEMINI_API_KEY", "")

    assert comment_service._is_flagged_by_gemini("offensive sample") is False
