// ============================================================
// G1Care Domain Models & Type Definitions
// Core thesis: "Scan. Consent. Treat. Update."
// ============================================================

export type QRSessionStatus =
  | "CREATE"
  | "ACTIVE"
  | "SCANNED"
  | "CONSENT_PENDING"
  | "CONSENT_GRANTED"
  | "CONSENT_DENIED"
  | "EXPIRED"
  | "REVOKED"
  | "USED";

export type ConsentStatus =
  | "PENDING"
  | "GRANTED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED";

export type ConsentScope =
  | "previous_encounters"
  | "diagnoses"
  | "medications"
  | "allergies"
  | "lab_reports"
  | "prescriptions"
  | "procedures"
  | "clinical_notes"
  | "vitals"
  | "attachments";

export interface EncounterSession {
  sessionId: string;
  token: string;
  patientId: string;
  patientName: string;
  healthId: string;
  status: QRSessionStatus;
  createdAt: number;
  expiresAt: number;
  providerId?: string;
  providerName?: string;
  facilityName?: string;
  encounterPurpose?: string;
  consentId?: string;
}

export interface ConsentRequest {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  registrationNumber?: string;
  facilityId?: string;
  facilityName: string;
  encounterSessionId: string;
  purpose: string;
  requestedScopes: ConsentScope[];
  grantedScopes: ConsentScope[];
  durationMinutes: number;
  status: ConsentStatus;
  requestedAt: number;
  grantedAt?: number;
  expiresAt?: number;
  revokedAt?: number;
  denialReason?: string;
}

export interface Vitals {
  temperatureF?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  pulseBpm?: number;
  spO2Percent?: number;
  weightKg?: number;
  respiratoryRate?: number;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ClinicalEncounter {
  encounterId: string;
  patientId: string;
  providerId: string;
  providerName: string;
  providerRegistration: string;
  facilityId: string;
  facilityName: string;
  consentId: string;
  encounterDate: string;
  chiefComplaint: string;
  symptoms: string[];
  vitals: Vitals;
  diagnosis: string;
  clinicalNotes: string;
  prescriptions: PrescriptionItem[];
  followUpDate?: string;
  followUpInstructions?: string;
  attachments?: string[];
  createdAt: number;
  provenance: RecordProvenance;
}

export interface RecordProvenance {
  recordId: string;
  patientId: string;
  encounterId: string;
  providerId: string;
  providerName: string;
  providerRegistrationNumber: string;
  facilityId: string;
  facilityName: string;
  createdAt: string;
  sourceType: "DOCTOR_ENCOUNTER" | "PATIENT_UPLOAD" | "LAB_IMPORT";
  consentId: string;
  scopeGranted: ConsentScope[];
  recordStatus: "VERIFIED_ENCOUNTER" | "PENDING_VERIFICATION";
}

export type AuditEventType =
  | "QR_CREATED"
  | "QR_SCANNED"
  | "CONSENT_REQUESTED"
  | "CONSENT_GRANTED"
  | "CONSENT_DENIED"
  | "CONSENT_EXPIRING"
  | "CONSENT_REVOKED"
  | "RECORD_VIEWED"
  | "ENCOUNTER_CREATED"
  | "PRESCRIPTION_CREATED"
  | "REPORT_ADDED"
  | "PATIENT_NOTIFIED";

export interface G1CareAuditEvent {
  eventId: string;
  eventType: AuditEventType;
  patientId: string;
  providerId?: string;
  providerName?: string;
  facilityName?: string;
  encounterSessionId?: string;
  consentId?: string;
  purpose?: string;
  details: string;
  scopes?: ConsentScope[];
  timestamp: number;
}
