from app.core import security


def test_hash_and_verify_password_roundtrip() -> None:
    password = "StrongPass123!"

    hashed = security.hash_password(password)

    assert hashed != password
    assert security.verify_password(password, hashed)
    assert not security.verify_password("wrong-password", hashed)


def test_create_and_decode_access_token_roundtrip() -> None:
    token = security.create_access_token({"user_id": 42, "role": "ADMIN"})
    decoded = security.decode_token(token)

    assert decoded is not None
    assert decoded["user_id"] == 42
    assert decoded["role"] == "ADMIN"
    assert "exp" in decoded


def test_decode_token_invalid_returns_none() -> None:
    assert security.decode_token("invalid.token.value") is None
