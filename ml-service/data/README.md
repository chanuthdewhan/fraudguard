# Data

This folder is intentionally excluded from git (see root `.gitignore`) -
raw data files are large and easily re-downloaded, so they don't belong
in version control. This file exists so anyone cloning the repo knows
exactly what should be here and how to get it.

## Dataset

**Name:** PaySim - Synthetic Financial Datasets For Fraud Detection  
**Source:** https://www.kaggle.com/datasets/ealaxi/paysim1  
**License:** CC BY-SA 4.0 (per Kaggle dataset page - verify before any redistribution)

**Shape:** 6,362,620 rows x 11 columns  
**Columns:** `step`, `type`, `amount`, `nameOrig`, `oldbalanceOrg`,
`newbalanceOrig`, `nameDest`, `oldbalanceDest`, `newbalanceDest`,
`isFraud`, `isFlaggedFraud`

Note the raw column names are inconsistently cased in the source file
(`oldbalanceOrg` vs `newbalanceOrig`) - `preprocessing.py` renames these
to consistent camelCase on load; the raw file itself is left untouched.

## How to get it

1. Create a free Kaggle account and generate an API token at
   https://www.kaggle.com/settings/api (see repo docs for the full setup).
2. From `ml-service/`, run:
   ```bash
   uvx --from kaggle kaggle datasets download -d ealaxi/paysim1 -p data/raw --unzip
   ```
3. Confirm `data/raw/PS_20174392719_1491204439457_log.csv` exists (~493MB).

## Sampling note

Full-size EDA and prototyping is fine on this file directly, but model
training uses a downsampled subset (all fraud rows + a random sample of
non-fraud rows) per the plan in `docs/fraud-risk-engine-full-brief.md` -
see `notebooks/01_eda.ipynb` for the actual sampling code once written.
