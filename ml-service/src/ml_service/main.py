from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FraudGuard ML Service",
    description="Real-time transaction fraud scoring and SHAP explainability service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fraudguard-ml-service",
        "version": "0.1.0",
        "model_loaded": False,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("ml_service.main:app", host="0.0.0.0", port=8000, reload=True)