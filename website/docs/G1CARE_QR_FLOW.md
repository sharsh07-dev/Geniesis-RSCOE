# G1Care QR Gateway Flow & State Machine

## 1. QR Lifecycle States
The QR code is **NOT** a static container of medical history. It is a short-lived encounter session token.

```
 [CREATE] ──► [ACTIVE] ──► [SCANNED] ──► [CONSENT_PENDING] ──► [CONSENT_GRANTED] ──► [USED]
                 │                           │                        │
                 ▼                           ▼                        ▼
             [EXPIRED]                  [CONSENT_DENIED]         [REVOKED]
```

## 2. Session Properties
- **Expiry**: 5 Minutes (300 Seconds) automatic expiration.
- **Payload Format**: `G1CARE://encounter/<CRYPTOGRAPHIC_TOKEN>`
- **Privacy Assurance**: Contains zero medical history or sensitive clinical payload.
