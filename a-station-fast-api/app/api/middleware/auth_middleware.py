from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.utils import get_default_api_key_pattern, get_api_keys_in_env

#TODO: IT DOESNT WORK
class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exempt_paths: list[str] | None = None):
        super().__init__(app)
        self.pattern = get_default_api_key_pattern()
        self.valid_api_keys = set(get_api_keys_in_env(key_pattern=self.pattern))
        self.exempt_paths = exempt_paths or [
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        self.root_path_exempt = "/"

    async def dispatch(self, request: Request, call_next):
        if self._is_path_exempt(request.url.path):
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")

        if not api_key:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "API key is required. Provide it in the X-API-Key header."}
            )

        if api_key not in self.valid_api_keys:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Invalid API key"}
            )

        response = await call_next(request)
        return response

    def _is_path_exempt(self, path: str) -> bool:
        if path == self.root_path_exempt:
            return True

        for exempt_path in self.exempt_paths:
            if path.startswith(exempt_path):
                return True
        return False
