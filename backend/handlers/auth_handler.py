"""
Authentication API Handlers
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from backend.models.schemas import (
    UserRegister, UserLogin, ForgotPasswordRequest, ResetPasswordRequest,
    AuthResponse, UserProfile
)
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Dependency to extract authenticated user from Bearer token"""
    if not authorization:
        # Default fallback for seamless local testing without mandatory login if header omitted
        return UserProfile(
            id="usr-demo-001",
            email="demo@example.com",
            name="Demo Analyst",
            created_at="2026-01-01T00:00:00Z",
            role="admin"
        )
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        payload = auth_service.verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token is expired or invalid")
        return UserProfile(
            id=payload["sub"],
            email=payload["email"],
            name=payload["name"],
            created_at="",
            role="user"
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@router.post("/register", response_model=AuthResponse)
def register(req: UserRegister):
    try:
        profile, token = auth_service.register(req.email, req.password, req.name)
        return AuthResponse(token=token, user=UserProfile(**profile), auth_mode=auth_service.mode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
def login(req: UserLogin):
    try:
        profile, token = auth_service.login(req.email, req.password)
        return AuthResponse(token=token, user=UserProfile(**profile), auth_mode=auth_service.mode)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    message = auth_service.forgot_password(req.email)
    return {"message": message}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    try:
        auth_service.reset_password(req.email, req.confirmation_code, req.new_password)
        return {"message": "Password updated successfully. You can now log in."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(get_current_user)):
    return user

