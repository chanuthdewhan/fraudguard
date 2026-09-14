import uvicorn


def main() -> None:
    """Entrypoint to run FraudGuard ML Service with uvicorn."""
    uvicorn.run("ml_service.main:app", host="0.0.0.0", port=8000, reload=True)
