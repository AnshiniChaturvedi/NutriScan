from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes.auth import router as auth_router
from .services.database import initialize_database


def create_app() -> FastAPI:
    """
    Application factory for NutriScan AI backend.
    
    NOTE: The modern ML pipeline is now integrated into the Next.js frontend
    via the ML bridge (frontend_infer.py). This backend serves as a fallback
    for system information and can be extended for future microservices.
    """
    settings = get_settings()

    app = FastAPI(
        title="NutriScan AI Backend",
        version="0.2.0",
        description="Backend infrastructure for NutriScan AI (ML pipeline is now in the frontend).",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # CORS configuration – allow the Next.js frontend during development.
    # Add your production domain here when deploying.
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup_event() -> None:
        initialize_database()

    @app.get("/health", tags=["system"])
    async def health_check():
        """Basic health check endpoint."""
        return {"status": "ok", "service": "nutriscan-ai-backend"}

    app.include_router(auth_router)

    return app


app = create_app()

