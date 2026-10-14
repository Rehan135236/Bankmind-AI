import re
import time
from typing import Optional, Dict
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

# In-memory sliding window rate limiter: {ip: [timestamps]}
RATE_LIMIT_STORAGE: Dict[str, list] = {}
RATE_LIMIT_MAX_REQUESTS = 40  # 40 requests per minute per IP
RATE_LIMIT_WINDOW_SECONDS = 60


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required for administrative operations",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required",
        )
    return payload


def check_rate_limit(request: Request, max_requests: int = RATE_LIMIT_MAX_REQUESTS, window: int = RATE_LIMIT_WINDOW_SECONDS):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    if client_ip not in RATE_LIMIT_STORAGE:
        RATE_LIMIT_STORAGE[client_ip] = []
        
    # Purge old timestamps
    RATE_LIMIT_STORAGE[client_ip] = [ts for ts in RATE_LIMIT_STORAGE[client_ip] if now - ts < window]
    
    if len(RATE_LIMIT_STORAGE[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more queries.",
        )
        
    RATE_LIMIT_STORAGE[client_ip].append(now)


# Sensitive credentials detector (OTP, PIN, Password, Card Number)
SENSITIVE_PATTERNS = [
    (r"\b(?:\d[ -]*?){13,16}\b", "Potential Payment Card Number"),
    (r"\b\d{4,6}\b.*?(?:pin|otp|cvv|password)", "Potential PIN / OTP pattern"),
    (r"(?:my\s+pin\s+is|my\s+otp\s+is|password\s+is)\s+[\w\d]+", "Direct Credential Declaration"),
]

def detect_sensitive_data(text: str) -> Optional[str]:
    for pattern, name in SENSITIVE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return name
    return None
