from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """
    Application factory for NutriScan AI backend.
    
    NOTE: The modern ML pipeline is now integrated into the Next.js frontend
    via the ML bridge (frontend_infer.py). This backend serves as a fallback
    for system information and can be extended for future microservices.
    """
    app = FastAPI(
        title="NutriScan AI Backend",
        version="0.2.0",
        description="Backend infrastructure for NutriScan AI (ML pipeline is now in the frontend).",
    )

    # CORS configuration – allow the Next.js frontend during development.
    # Add your production domain here when deploying.
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    async def health_check():
        """Basic health check endpoint."""
        return {"status": "ok", "service": "nutriscan-ai-backend"}

    return app


app = create_app()

