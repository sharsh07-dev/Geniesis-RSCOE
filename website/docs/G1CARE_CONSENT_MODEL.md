# G1Care Consent Model

## 1. Granular Scopes
Patients explicitly approve or deny individual data categories:
- `previous_encounters`: Full prior clinical history
- `diagnoses`: Past & active diagnoses
- `medications`: Current prescription list
- `allergies`: Drug & food allergies
- `lab_reports`: Laboratory & diagnostic test results
- `prescriptions`: Pharmacy prescriptions

## 2. Duration & Revocation
- **Duration**: Scoped to explicit time limits (15 min, 30 min, 1 hour, 2 hours).
- **Revocation**: Instant patient-initiated revocation from the **Patient Control Center** (`/access`).
