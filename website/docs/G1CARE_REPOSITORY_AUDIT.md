# G1CARE Repository Audit Report

**Date**: October 8, 2026
**Target Product**: G1Care — "Scan. Consent. Treat. Update."
**Baseline Repository**: ArogyaSutra (`https://github.com/Dawn-Of-Justice/ArogyaSutra.git`)

---

## 1. Existing Architecture & Baseline Stack
- **Framework**: Next.js 16.1 (App Router), React 19, TypeScript 5
- **Styling**: Modular CSS (`*.module.css`) + Global CSS Design Tokens & Utilities
- **State & Storage**: Client-side state, IndexedDB (idb), Web Crypto API (AES-256-GCM / PBKDF2), Firebase Realtime Database (`rtdb`), AWS DynamoDB / S3 / Bedrock fallback capabilities.
- **PWA & Offline**: `next-pwa` service worker integration with client-side cache and IndexedDB fallback.
- **Security**: Zero-Knowledge client-side encryption, hashed session storage, role-based controls (Patient, Doctor, Guardian, Admin).

---

## 2. Route Structure (`src/app`)
- `/` — Main single page application dashboard shell supporting tabbed navigation (`dashboard`, `timeline`, `assistant`, `access`, `help`, `settings`, `doctor-dashboard`, `profile`).
- `/admin` — System administration dashboard.
- `/api/auth/*` — Patient & Doctor authentication endpoints.
- `/api/timeline/*` — Document scanning, record retrieval, notes, and prescriptions.
- `/api/access-log/*` — Scoped record view logs and audit trails.
- `/api/emergency/*` — Break-glass emergency protocol access.
- `/api/assistant/*` — MedVision AI & RAG patient/doctor assistants.

---

## 3. Existing Component Structure (`src/components`)
- `layout/`: `AppShell.tsx` (Sidebar, Topbar, Search, Role switching).
- `dashboard/`: `PatientDashboard.tsx`, `DoctorDashboard.tsx`.
- `timeline/`: `TimelineView.tsx`, `TimelineCard.tsx`, `RecordDetailModal.tsx`.
- `access/`: `AccessLogView.tsx`.
- `assistant/`: `AIAssistantView.tsx`.
- `emergency/`: `EmergencyCard.tsx`, `EmergencyAccessModal.tsx`.
- `profile/`: `ProfileScreen.tsx`.
- `settings/`: `SettingsScreen.tsx`.
- `notifications/`: `NotificationDropdown.tsx`.

---

## 4. G1Care Core Integration Plan
G1Care extends the existing ArogyaSutra foundation with:
1. **Health QR Encounter Gateway**: Dynamic, short-lived, encrypted encounter session QR codes with automatic expiration.
2. **Scoped Consent Engine**: Granular patient permission approval UI for data categories (`diagnoses`, `medications`, `allergies`, `reports`, `prescriptions`, `previous_encounters`) and duration limit.
3. **Doctor QR Scanner & Patient Brief**: Doctor camera scanning with fallback code input, instant patient context summary, and granted history viewer.
4. **Append-Only Clinical Encounter Engine**: Full clinical form (Chief Complaint, Vitals, Diagnosis, Clinical Notes, Prescriptions, Attachments) that appends immutable events.
5. **Realtime Patient Timeline Update & Provenance**: Immediate update on patient device, notification dispatch, provenance verification badges, and "What Changed Today" highlight.
6. **Immutable Audit Trail & Control Center**: Full tracking of every session, scan, request, grant, denial, and encounter write.

---

## 5. Summary of Reusable Modules
- **Crypto**: `src/lib/crypto/engine.ts`, `src/lib/crypto/keys.ts`
- **Notifications**: `src/lib/utils/notifications.tsx`
- **Timeline Engine**: `src/lib/services/timeline.service.ts`
- **Firebase Realtime DB**: `src/lib/firebase/index.ts`, `src/lib/firebase/rtdb.ts`
- **FHIR Exporter**: `src/lib/services/export.service.ts`
