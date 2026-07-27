from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def _get_fernet() -> Fernet:
    """Derive a valid Fernet key from ENCRYPTION_KEY."""
    # Fernet requires a 32-byte URL-safe base64 key
    key_bytes = hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_value(value: str) -> str:
    """Encrypt a plaintext string using AES-Fernet."""
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt an AES-Fernet encrypted string."""
    f = _get_fernet()
    return f.decrypt(encrypted_value.encode()).decode()


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

