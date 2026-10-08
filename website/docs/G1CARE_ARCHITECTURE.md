# G1Care Architecture Overview

**Product**: G1Care — Patient-Controlled Clinical Encounter Bridge
**Tagline**: "Scan. Consent. Treat. Update."

---

## 1. System Core Architecture
G1Care transforms static medical record storage into an interactive, consent-governed clinical encounter gateway.

```
                      PATIENT DEVICE
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
       [ SHOW HEALTH QR ]       [ PATIENT DASHBOARD ]
               │                         ▲
               ▼                         │ (Realtime Update)
       [ DOCTOR SCANNER ] ───────► [ NEW ENCOUNTER ]
               │                         ▲
               ▼                         │ (Append Record)
       [ CONSENT REQUEST ] ──(Approve)───┘
```

## 2. Core Service Boundaries
- **Encounter Gateway (`g1care.service.ts`)**: Manages dynamic, short-lived encounter QR tokens (5-minute auto-expiry).
- **Consent Engine**: Handles granular patient authorization (`diagnoses`, `medications`, `allergies`, `lab_reports`, `prescriptions`, `previous_encounters`).
- **Append-Only Clinical Ledger**: Enforces immutable doctor encounter entries with full provenance metadata (`providerRegistrationNumber`, `facilityId`, `consentId`).
- **Realtime Database**: Firebase Realtime DB + local fallback for immediate live updates across patient and doctor screens.

---

## 3. Technology Stack Integration
- **Next.js 16.1 App Router**: Server and client rendering engine.
- **Firebase Realtime Database (`rtdb`)**: Realtime state synchronization.
- **Web Crypto API (AES-256-GCM)**: Zero-knowledge client-side record encryption.
- **TypeScript 5**: Strict type definitions for encounter state machine and provenance.
