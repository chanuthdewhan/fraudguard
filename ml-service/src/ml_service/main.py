from fastapi import FastAPI

app = FastAPI(title="FraudGuard ML Service")

@app.get("/health")
def health():
    return {"status": "ok", "message": "FraudGuard ML Service is running."}