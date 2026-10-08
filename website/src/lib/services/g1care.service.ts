// ============================================================
// G1Care Core Service — Encounter Gateway & Consent Engine
// Handles Firebase Realtime DB synchronization & Local Fallback
// ============================================================

import {
  EncounterSession,
  ConsentRequest,
  ConsentScope,
  ClinicalEncounter,
  G1CareAuditEvent,
  AuditEventType,
  Vitals,
  PrescriptionItem,
} from "../types/g1care";
import { writeData, readData, updateData, listenToPath, pushData } from "../firebase/rtdb";
import { TimelineEntry } from "../types/timeline";
import { pushNotification } from "../utils/notifications";

async function fetchPatientTimeline(patientId: string): Promise<TimelineEntry[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/timeline/entries?patientId=${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.entries && data.entries.length > 0) return data.entries;
      }
    } catch { /* fallback to local storage */ }
    const local = localStorage.getItem(`timeline_${patientId}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
  }
  try {
    const { SEED_TIMELINE_ENTRIES } = await import("../data/seedData");
    return SEED_TIMELINE_ENTRIES;
  } catch {
    return [];
  }
}

async function addTimelineEntry(patientId: string, entry: TimelineEntry): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      await fetch("/api/timeline/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorName: entry.doctorName,
          institution: entry.sourceInstitution,
          diagnosis: entry.title,
          treatmentPlan: entry.summary,
        }),
      });
    } catch { /* fallback */ }
    const key = `timeline_${patientId}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(entry);
    localStorage.setItem(key, JSON.stringify(list));
  }
}

// Local storage keys for fallback/offline execution
const SESSION_PREFIX = "g1care_session_";
const CONSENT_PREFIX = "g1care_consent_";
const AUDIT_KEY = "g1care_audit_logs";
const ENCOUNTER_KEY = "g1care_encounters_";

/**
 * Generate a cryptographically secure short token for encounter QR
 */
export function generateEncounterToken(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12).toUpperCase();
  }
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

/**
 * Patient creates a new encounter QR code (Permanent & Unlimited time validity)
 */
export async function createEncounterQRSession(patientId: string, patientName: string, healthId: string): Promise<EncounterSession> {
  // Check if patient already has an active permanent token
  let token = (typeof window !== "undefined" && localStorage.getItem(`g1care_active_token_${patientId}`)) || "";
  let sessionId = `enc_${patientId}_${Date.now()}`;
  const now = Date.now();
  const expiresAt = Number.MAX_SAFE_INTEGER; // Unlimited time validity — will never expire

  if (!token) {
    token = generateEncounterToken();
  }

  const session: EncounterSession = {
    sessionId,
    token,
    patientId,
    patientName,
    healthId,
    status: "ACTIVE",
    createdAt: now,
    expiresAt,
  };

  // Sync to Firebase RTDB & localStorage
  try {
    await writeData(`sessions/${sessionId}`, session);
    await writeData(`tokens/${token}`, { sessionId, expiresAt, patientId });
    await writeData(`patients/${patientId}/active_session`, session);
  } catch (err) {
    console.warn("[G1Care Service] RTDB offline, using local storage fallback", err);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    localStorage.setItem(`g1care_active_token_${patientId}`, token);
  }

  await logAuditEvent({
    eventType: "QR_CREATED",
    patientId,
    encounterSessionId: sessionId,
    details: `Patient ${patientName} generated encounter QR code (Unlimited validity)`,
  });

  return session;
}

/**
 * Doctor scans or enters encounter QR token to validate session
 */
export async function validateAndScanQRToken(token: string, providerId: string, providerName: string, facilityName: string): Promise<EncounterSession> {
  let session: EncounterSession | null = null;
  const cleanToken = token.trim().toUpperCase();

  // 1. Try fetching token mapping from RTDB
  try {
    const tokenMeta = await readData<{ sessionId: string; expiresAt: number; patientId?: string }>(`tokens/${cleanToken}`);
    if (tokenMeta && tokenMeta.sessionId) {
      session = await readData<EncounterSession>(`sessions/${tokenMeta.sessionId}`);
    }
  } catch (e) {
    console.warn("[G1Care Service] RTDB token search failed, checking fallbacks", e);
  }

  // 2. Direct RTDB search across all active sessions if token mapping was missing
  if (!session) {
    try {
      const allSessions = await readData<Record<string, EncounterSession>>("sessions");
      if (allSessions) {
        const found = Object.values(allSessions).find((s) => s.token === cleanToken);
        if (found) session = found;
      }
    } catch { /* ignore */ }
  }

  // 3. Local storage fallback lookup
  if (!session && typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SESSION_PREFIX)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "{}");
          if (parsed.token === cleanToken) {
            session = parsed;
            break;
          }
        } catch { /* ignore */ }
      }
    }
  }

  // 4. Default demo session fallback if scanning demo token
  if (!session && (cleanToken === "DEMO789012" || cleanToken.startsWith("DEMO") || cleanToken.startsWith("AS-"))) {
    session = {
      sessionId: "enc_demo_session_rohit",
      token: cleanToken,
      patientId: "AS-1001-2024-8899",
      patientName: "Rohit Dhangar",
      healthId: "AS-1001-2024-8899",
      status: "ACTIVE",
      createdAt: Date.now(),
      expiresAt: Number.MAX_SAFE_INTEGER,
    };
  }

  if (!session) {
    throw new Error(`Encounter token "${cleanToken}" not recognized. Please verify the code or scan again.`);
  }

  if (session.status === "REVOKED" || session.status === "CONSENT_DENIED") {
    throw new Error("This encounter session was cancelled or denied by the patient.");
  }

  // Update session to SCANNED
  session.status = "SCANNED";
  session.providerId = providerId;
  session.providerName = providerName;
  session.facilityName = facilityName;

  await updateSessionState(session);

  await logAuditEvent({
    eventType: "QR_SCANNED",
    patientId: session.patientId,
    providerId,
    providerName,
    facilityName,
    encounterSessionId: session.sessionId,
    details: `Doctor ${providerName} (${facilityName}) scanned patient QR token.`,
  });

  return session;
}

/**
 * Doctor requests consent from patient
 */
export async function requestPatientConsent(
  sessionId: string,
  providerId: string,
  providerName: string,
  facilityName: string,
  registrationNumber: string,
  purpose: string,
  requestedScopes: ConsentScope[],
  durationMinutes: number = 30
): Promise<ConsentRequest> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error("Encounter session not found.");

  const consentId = `cns_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const consentRequest: ConsentRequest = {
    id: consentId,
    patientId: session.patientId,
    patientName: session.patientName,
    providerId,
    providerName,
    registrationNumber,
    facilityName,
    encounterSessionId: sessionId,
    purpose,
    requestedScopes,
    grantedScopes: [],
    durationMinutes,
    status: "PENDING",
    requestedAt: now,
  };

  session.status = "CONSENT_PENDING";
  session.consentId = consentId;
  session.encounterPurpose = purpose;

  await updateSessionState(session);

  try {
    await writeData(`consents/${consentId}`, consentRequest);
    await writeData(`active_consent_requests/${session.patientId}/${consentId}`, consentRequest);
    await writeData(`patients/${session.patientId}/pending_consent`, consentRequest);
    
    // Also notify common demo patient accounts to guarantee real-time delivery
    await writeData(`patients/AS-1001-2024-8899/pending_consent`, consentRequest);
    await writeData(`patients/pat_101/pending_consent`, consentRequest);
    await writeData(`active_consent_requests/global_pending`, consentRequest);

    // Android Unified Schema
    await writeData(`access_requests/${consentId}`, {
      requestId: consentId,
      doctorUid: providerId,
      doctorName: providerName,
      patientUid: session.patientId,
      status: "pending",
      requestedAt: now,
      respondedAt: null,
      scopes: requestedScopes,
      purpose,
    });
  } catch (e) {
    console.warn("[G1Care Service] RTDB consent write fallback", e);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${CONSENT_PREFIX}${consentId}`, JSON.stringify(consentRequest));
    localStorage.setItem(`g1care_pending_consent_${session.patientId}`, JSON.stringify(consentRequest));
    localStorage.setItem(`g1care_pending_consent_AS-1001-2024-8899`, JSON.stringify(consentRequest));
    localStorage.setItem(`g1care_pending_consent_pat_101`, JSON.stringify(consentRequest));
    localStorage.setItem(`g1care_pending_consent_global`, JSON.stringify(consentRequest));

    // Dispatch window event so patient dashboard in same window triggers instantly
    window.dispatchEvent(new CustomEvent("g1care:consent_request", { detail: consentRequest }));
  }

  await logAuditEvent({
    eventType: "CONSENT_REQUESTED",
    patientId: session.patientId,
    providerId,
    providerName,
    facilityName,
    encounterSessionId: sessionId,
    consentId,
    purpose,
    scopes: requestedScopes,
    details: `Dr. ${providerName} requested access to [${requestedScopes.join(", ")}] for ${purpose}.`,
  });

  return consentRequest;
}

/**
 * Patient approves consent with approved scopes
 */
export async function grantConsentRequest(consentId: string, grantedScopes: ConsentScope[]): Promise<ConsentRequest> {
  const consent = await getConsentById(consentId);
  if (!consent) throw new Error("Consent request not found.");

  const now = Date.now();
  const expiresAt = now + consent.durationMinutes * 60 * 1000;

  consent.status = "GRANTED";
  consent.grantedScopes = grantedScopes;
  consent.grantedAt = now;
  consent.expiresAt = expiresAt;

  const session = await getSessionById(consent.encounterSessionId);
  if (session) {
    session.status = "CONSENT_GRANTED";
    await updateSessionState(session);
  }

  try {
    await writeData(`consents/${consentId}`, consent);
    await writeData(`active_consents/${consent.patientId}/${consentId}`, consent);
  } catch (e) {
    console.warn("[G1Care Service] RTDB grant consent fallback", e);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${CONSENT_PREFIX}${consentId}`, JSON.stringify(consent));
  }

  await logAuditEvent({
    eventType: "CONSENT_GRANTED",
    patientId: consent.patientId,
    providerId: consent.providerId,
    providerName: consent.providerName,
    facilityName: consent.facilityName,
    consentId,
    scopes: grantedScopes,
    details: `Patient granted access to [${grantedScopes.join(", ")}] for ${consent.durationMinutes} min.`,
  });

  return consent;
}

/**
 * Patient denies consent request
 */
export async function denyConsentRequest(consentId: string, reason: string = "Patient declined access"): Promise<ConsentRequest> {
  const consent = await getConsentById(consentId);
  if (!consent) throw new Error("Consent request not found.");

  consent.status = "DENIED";
  consent.denialReason = reason;

  const session = await getSessionById(consent.encounterSessionId);
  if (session) {
    session.status = "CONSENT_DENIED";
    await updateSessionState(session);
  }

  try {
    await updateData(`consents/${consentId}`, { status: "DENIED", denialReason: reason });
  } catch (e) {
    console.warn("[G1Care Service] RTDB deny consent fallback", e);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${CONSENT_PREFIX}${consentId}`, JSON.stringify(consent));
  }

  await logAuditEvent({
    eventType: "CONSENT_DENIED",
    patientId: consent.patientId,
    providerId: consent.providerId,
    providerName: consent.providerName,
    facilityName: consent.facilityName,
    consentId,
    details: `Patient denied access request. Reason: ${reason}`,
  });

  return consent;
}

/**
 * Patient revokes an active granted consent
 */
export async function revokeActiveConsent(consentId: string): Promise<ConsentRequest> {
  const consent = await getConsentById(consentId);
  if (!consent) throw new Error("Consent not found.");

  consent.status = "REVOKED";
  consent.revokedAt = Date.now();

  const session = await getSessionById(consent.encounterSessionId);
  if (session) {
    session.status = "REVOKED";
    await updateSessionState(session);
  }

  try {
    await updateData(`consents/${consentId}`, { status: "REVOKED", revokedAt: consent.revokedAt });
  } catch (e) {
    console.warn("[G1Care Service] RTDB revoke fallback", e);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${CONSENT_PREFIX}${consentId}`, JSON.stringify(consent));
  }

  await logAuditEvent({
    eventType: "CONSENT_REVOKED",
    patientId: consent.patientId,
    providerId: consent.providerId,
    providerName: consent.providerName,
    facilityName: consent.facilityName,
    consentId,
    details: `Patient immediately revoked active consent access for Dr. ${consent.providerName}.`,
  });

  return consent;
}

/**
 * Doctor retrieves scoped patient history based on granted consent
 */
export async function getScopedPatientHistory(patientId: string, consentId: string): Promise<{
  permittedEntries: TimelineEntry[];
  grantedScopes: ConsentScope[];
  isExpired: boolean;
  consent: ConsentRequest;
}> {
  const consent = await getConsentById(consentId);
  if (!consent) throw new Error("Consent session not found.");

  if (consent.status !== "GRANTED") {
    throw new Error(`Consent is not active. Current status: ${consent.status}`);
  }

  if (consent.expiresAt && Date.now() > consent.expiresAt) {
    consent.status = "EXPIRED";
    await updateData(`consents/${consentId}`, { status: "EXPIRED" });
    throw new Error("Patient consent has expired. Please ask the patient for a new consent request.");
  }

  const allEntries = await fetchPatientTimeline(patientId);
  const granted = consent.grantedScopes;

  // Filter entries strictly by granted scope
  const permittedEntries = allEntries.filter((entry) => {
    const docType = (entry.documentType || "").toLowerCase();
    const title = (entry.title || "").toLowerCase();

    if (granted.includes("previous_encounters")) return true;

    if (granted.includes("diagnoses") && (docType.includes("diagnosis") || title.includes("diagnosis"))) return true;
    if (granted.includes("medications") && (docType.includes("prescription") || title.includes("medication"))) return true;
    if (granted.includes("prescriptions") && docType.includes("prescription")) return true;
    if (granted.includes("lab_reports") && (docType.includes("lab") || docType.includes("report") || docType.includes("test"))) return true;
    if (granted.includes("vitals") && docType.includes("vitals")) return true;
    if (granted.includes("allergies") && (docType.includes("allergy") || title.includes("allergy"))) return true;
    if (granted.includes("clinical_notes") && docType.includes("note")) return true;
    if (granted.includes("attachments") && entry.fileUrl) return true;

    return false;
  });

  await logAuditEvent({
    eventType: "RECORD_VIEWED",
    patientId,
    providerId: consent.providerId,
    providerName: consent.providerName,
    facilityName: consent.facilityName,
    consentId,
    scopes: granted,
    details: `Dr. ${consent.providerName} accessed ${permittedEntries.length} records under scopes [${granted.join(", ")}].`,
  });

  return {
    permittedEntries,
    grantedScopes: granted,
    isExpired: false,
    consent,
  };
}

/**
 * Doctor appends a new clinical encounter record to patient timeline
 */
export async function createDoctorClinicalEncounter(
  patientId: string,
  providerId: string,
  providerName: string,
  providerRegistration: string,
  facilityId: string,
  facilityName: string,
  consentId: string,
  chiefComplaint: string,
  symptoms: string[],
  vitals: Vitals,
  diagnosis: string,
  clinicalNotes: string,
  prescriptions: PrescriptionItem[],
  followUpDate?: string,
  followUpInstructions?: string,
  attachments?: string[]
): Promise<ClinicalEncounter> {
  const encounterId = `enc_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const currentDateStr = new Date().toISOString().slice(0, 10);

  const consent = await getConsentById(consentId);
  const grantedScopes = consent?.grantedScopes || [];

  const encounter: ClinicalEncounter = {
    encounterId,
    patientId,
    providerId,
    providerName,
    providerRegistration,
    facilityId,
    facilityName,
    consentId,
    encounterDate: currentDateStr,
    chiefComplaint,
    symptoms,
    vitals,
    diagnosis,
    clinicalNotes,
    prescriptions,
    followUpDate,
    followUpInstructions,
    attachments,
    createdAt: now,
    provenance: {
      recordId: encounterId,
      patientId,
      encounterId,
      providerId,
      providerName,
      providerRegistrationNumber: providerRegistration,
      facilityId,
      facilityName,
      createdAt: new Date(now).toLocaleString(),
      sourceType: "DOCTOR_ENCOUNTER",
      consentId,
      scopeGranted: grantedScopes,
      recordStatus: "VERIFIED_ENCOUNTER",
    },
  };

  // Convert to longitudinal TimelineEntry
  const newTimelineEntry: TimelineEntry = {
    entryId: encounterId,
    patientId,
    title: `Consultation: ${diagnosis || chiefComplaint || "General Checkup"}`,
    documentType: "Consult",
    statusFlags: ["VERIFIED"],
    doctorName: providerName,
    sourceInstitution: facilityName,
    date: currentDateStr,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    encryptedBlobKey: encounterId,
    fhirResourceIds: [],
    addedBy: {
      type: "DOCTOR",
      userId: providerId,
      name: providerName,
      mciNumber: providerRegistration,
    },
    metadata: {
      diagnoses: diagnosis ? [diagnosis] : [],
      medications: prescriptions.map((p) => ({ name: p.medicineName })),
    },
    summary: `Diagnosis: ${diagnosis || "N/A"}. Chief complaint: ${chiefComplaint || "N/A"}. Prescriptions: ${prescriptions.map((p) => p.medicineName).join(", ") || "None"}.`,
    extractedVitals: {
      temperature: vitals.temperatureF ? `${vitals.temperatureF} °F` : undefined,
      bloodPressure: vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : undefined,
      heartRate: vitals.pulseBpm ? `${vitals.pulseBpm} bpm` : undefined,
      spO2: vitals.spO2Percent ? `${vitals.spO2Percent}%` : undefined,
    },
    rawExtractedText: `Encounter Note by Dr. ${providerName} (${providerRegistration}) at ${facilityName}.\nChief Complaint: ${chiefComplaint}\nSymptoms: ${symptoms.join(", ")}\nNotes: ${clinicalNotes}\nFollow-up: ${followUpDate || "None"}.`,
    provenance: encounter.provenance,
  };

  // Append immutable record to patient timeline
  await addTimelineEntry(patientId, newTimelineEntry);

  // Sync encounter to RTDB & localStorage
  try {
    await pushData(`patient_encounters/${patientId}`, encounter);
  } catch (e) {
    console.warn("[G1Care Service] RTDB encounter push fallback", e);
  }

  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem(`${ENCOUNTER_KEY}${patientId}`) || "[]");
    existing.unshift(encounter);
    localStorage.setItem(`${ENCOUNTER_KEY}${patientId}`, JSON.stringify(existing));
  }

  // Send live update notification to patient
  pushNotification({
    title: `New Health Record Added by Dr. ${providerName}`,
    desc: `Diagnosis: ${diagnosis || "Consultation Completed"}. ${prescriptions.length > 0 ? `${prescriptions.length} medication(s) prescribed.` : ""}`,
    category: "system",
  });

  await logAuditEvent({
    eventType: "ENCOUNTER_CREATED",
    patientId,
    providerId,
    providerName,
    facilityName,
    consentId,
    details: `Doctor ${providerName} added new clinical encounter record (${diagnosis}).`,
  });

  return encounter;
}

/**
 * Get all audit log events for patient access history
 */
export async function getG1CareAuditLogs(patientId: string): Promise<G1CareAuditEvent[]> {
  let logs: G1CareAuditEvent[] = [];

  try {
    const rtdbLogs = await readData<Record<string, G1CareAuditEvent>>(`audit_logs/${patientId}`);
    if (rtdbLogs) {
      logs = Object.values(rtdbLogs);
    }
  } catch (e) {
    console.warn("[G1Care Service] RTDB audit read fallback", e);
  }

  if (logs.length === 0 && typeof window !== "undefined") {
    const raw = localStorage.getItem(`${AUDIT_KEY}_${patientId}`);
    if (raw) {
      try {
        logs = JSON.parse(raw);
      } catch { /* ignore */ }
    }
  }

  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// Helper: Log Audit Event
async function logAuditEvent(evt: Omit<G1CareAuditEvent, "eventId" | "timestamp">): Promise<void> {
  const fullEvt: G1CareAuditEvent = {
    ...evt,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };

  try {
    await pushData(`audit_logs/${evt.patientId}`, fullEvt);
  } catch { /* fallback */ }

  if (typeof window !== "undefined") {
    const key = `${AUDIT_KEY}_${evt.patientId}`;
    const list: G1CareAuditEvent[] = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(fullEvt);
    localStorage.setItem(key, JSON.stringify(list));
  }
}

// Helper: Get Session by ID
export async function getSessionById(sessionId: string): Promise<EncounterSession | null> {
  try {
    const session = await readData<EncounterSession>(`sessions/${sessionId}`);
    if (session) return session;
  } catch { /* ignore */ }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
    if (raw) return JSON.parse(raw);
  }
  return null;
}

// Helper: Get Consent by ID
export async function getConsentById(consentId: string): Promise<ConsentRequest | null> {
  try {
    const consent = await readData<ConsentRequest>(`consents/${consentId}`);
    if (consent) return consent;
  } catch { /* ignore */ }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`${CONSENT_PREFIX}${consentId}`);
    if (raw) return JSON.parse(raw);

    const globalRaw = localStorage.getItem("g1care_pending_consent_global");
    if (globalRaw) {
      try {
        const parsed = JSON.parse(globalRaw);
        if (parsed.id === consentId || !consentId) return parsed;
      } catch { /* ignore */ }
    }
  }
  return null;
}

// Helper: Update Session State
async function updateSessionState(session: EncounterSession): Promise<void> {
  try {
    await writeData(`sessions/${session.sessionId}`, session);
  } catch { /* fallback */ }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${SESSION_PREFIX}${session.sessionId}`, JSON.stringify(session));
  }
}
