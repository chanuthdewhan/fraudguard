# FraudGuard

A full-stack fraud risk-scoring system that predicts whether a financial transaction is fraudulent and explains _why_, using SHAP (SHapley Additive exPlanations) feature attribution. Built around a fraud analyst's actual workflow - reviewing flagged transactions and deciding quickly whether to approve, hold, or escalate - rather than being a bare classifier.

Built by **Model Mates**.

---

## Live Deployment

| Service         | URL                                                     |
| --------------- | ------------------------------------------------------- |
| **Frontend**    | https://fraudguard-frontend-indol.vercel.app            |
| **Backend API** | https://fraudguard-backend-rho.vercel.app               |
| **ML Service**  | https://fraudguard-ml-service-a51c05d6.fastapicloud.dev |
| **Database**    | PostgreSQL via Supabase                                 |

All three services are deployed independently and communicate over HTTPS, matching the architecture described below.

---

## Why this project

Payment fraud losses run into tens of billions of dollars industry-wide, and the cost of **falsely declining legitimate customers** is consistently reported as several times larger than the direct cost of fraud itself. Aggressive fraud filters that block genuine transactions drive customers away and cost more than the fraud they prevent. FraudGuard is built around that trade-off - catching fraud while minimising false positives - and around growing regulatory expectations that automated decisions affecting people be explainable, not just accurate.

Full reasoning, EDA findings, and model evaluation are documented in [`PROJECT-REPORT.md`](./PROJECT-REPORT.md).

---

## Architecture

Three independently deployable services in one monorepo:

```
frontend/    React + TypeScript + Vite + Tailwind + shadcn/ui  ->  Vercel
backend/     Express + TypeScript + Prisma + PostgreSQL         ->  Vercel
ml-service/  FastAPI + XGBoost + SHAP                            ->  FastAPI Cloud
database/    PostgreSQL                                          ->  Supabase
```

```
  Frontend  ->  Backend (Express)  ->  ML Service (FastAPI)
                     |                       |
               PostgreSQL              XGBoost + SHAP
              (Supabase)
```

The backend is the single point of contact between the frontend and the ML service - the frontend never calls the ML service directly. All three services agree on a shared contract documented in [`docs/api-contract.md`](./docs/api-contract.md).

---

## Tech Stack

| Layer          | Technology                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query             |
| Backend        | Express, TypeScript, Prisma ORM, PostgreSQL                                  |
| ML Service     | FastAPI, Python, XGBoost, SHAP, Pydantic                                     |
| Model training | pandas, scikit-learn, XGBoost, SHAP, Jupyter                                 |
| Deployment     | Vercel (frontend + backend), FastAPI Cloud (ML service), Supabase (database) |

---

## Dataset & Model

- **Dataset:** [PaySim](https://www.kaggle.com/datasets/ealaxi/paysim1) - 6.36M synthetic mobile money transactions, 0.129% fraud rate
- **Model:** XGBoost with `scale_pos_weight` for class imbalance, benchmarked against a Logistic Regression baseline (fraud recall improved from 0.61 to 0.999, PR-AUC from 0.786 to 0.999)
- **Explainability:** SHAP `TreeExplainer`, returning the top contributing features and a base value for every prediction

**Important limitation:** the model's near-perfect benchmark performance is very likely inflated by a known artifact of how PaySim simulates fraud (fraudulent transactions are drained with suspiciously exact arithmetic that legitimate transactions don't replicate as consistently). This is discussed in detail, along with independent manual validation testing that confirms the model still learned the genuine account-draining pattern, in [`PROJECT-REPORT.md`](./PROJECT-REPORT.md) and [`ML-VIVA-EXPLAINER.md`](./ML-VIVA-EXPLAINER.md).

---

## Running Locally

Each service can also run locally against the same deployed Supabase database, or a local Postgres instance.

### 1. Database

```bash
docker compose up -d   # local PostgreSQL, or point at Supabase directly
```

### 2. ML Service

```bash
cd ml-service
uv sync
uv run uvicorn ml_service.main:app --reload
# -> http://localhost:8000
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, ML_SERVICE_URL
npx prisma generate
npm run dev
# -> http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL, VITE_USE_MOCKS
npm run dev
# -> http://localhost:5173
```

Set `VITE_USE_MOCKS=true` in the frontend's `.env` to develop against realistic fixture data without running the backend or ML service.

---

## API Overview

| Method | Endpoint            | Description                                                           |
| ------ | ------------------- | --------------------------------------------------------------------- |
| `POST` | `/predict`          | Scores a transaction and persists it with its prediction              |
| `POST` | `/simulate`         | Scores a hypothetical transaction without saving it (What-If Sandbox) |
| `GET`  | `/transactions`     | Lists recent transactions, optionally filtered by risk tier           |
| `GET`  | `/transactions/:id` | Retrieves one transaction with its full prediction                    |
| `GET`  | `/stats`            | Aggregate dashboard statistics                                        |
| `GET`  | `/health`           | Health check                                                          |

Full request/response shapes: [`docs/api-contract.md`](./docs/api-contract.md).

---

## Project Structure

```
fraudguard/
├── frontend/            React app
├── backend/             Express API
├── ml-service/          FastAPI service + trained model
│   ├── notebooks/       EDA and model training notebooks
│   ├── src/ml_service/
│   └── models/           Serialized model artifacts (committed - required to run)
├── docs/                 API contract and architecture decisions
└── README.md
```

---

## Features

- **Dashboard** - real-time risk metrics and tier distribution
- **Review Queue** - transactions sorted by risk score with SHAP-backed reasoning
- **Transaction Detail** - full SHAP explanation for any individual prediction
- **What-If Sandbox** - adjust a hypothetical transaction and see the real model's score respond live, without saving anything
- **Model Insights** - model comparison, feature engineering rationale, and an honest discussion of the model's known limitations

---

## Documentation

- [`PROJECT-REPORT.md`](./PROJECT-REPORT.md) - full write-up covering EDA, feature engineering, model comparison, SHAP explainability, and known limitations
- [`docs/api-contract.md`](./docs/api-contract.md) - shared request/response contract across all three services
- [`docs/architecture-decision-record.md`](./docs/architecture-decision-record.md) - key architecture decisions and their reasoning

---

## License

This project uses the [PaySim dataset](https://www.kaggle.com/datasets/ealaxi/paysim1) for educational and research purposes.
