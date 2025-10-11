from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
async def register_user():
    return {}

@router.get("/get-user")
async def get_user():
    return {}

@router.post("/login")
async def login_user():
    return {}

@router.get("/logout")
async def logout_user():
    return {}

@router.get("/refresh-token")
async def refresh_token():
    return {}


@router.post("/verify-email")
async def verify_email():
    return {}

