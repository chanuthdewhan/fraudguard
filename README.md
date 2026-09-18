# FraudGuard

Transaction risk scoring system with explainable ML predictions.

## Overview

FraudGuard is a full-stack fraud monitoring application that ingests transaction data, scores risk using an ML model, and surfaces explainable insights in a dashboard. The project is split into a backend API, a frontend dashboard, and a Python ML service.

## Status

In development. The backend, frontend, and ML service are scaffolded and configured for local development.

## Architecture

- `backend/` - Express + TypeScript API for business logic, routes, validation, and orchestration
- `ml-service/` - Python + FastAPI service for feature engineering and risk prediction
- `frontend/` - React + Vite + Tailwind dashboard for transaction review and portfolio insights

## Repository structure

```text
fraudguard/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── ml-service/
│   ├── app/
│   ├── requirements.txt
│   └── README.md
├── README.md
└── .gitignore
