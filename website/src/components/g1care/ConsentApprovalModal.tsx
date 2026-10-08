"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, Clock, Hospital, UserCheck, X } from "lucide-react";
import { ConsentRequest, ConsentScope } from "../../lib/types/g1care";
import { getConsentById, grantConsentRequest, denyConsentRequest } from "../../lib/services/g1care.service";
import styles from "./G1Care.module.css";

interface ConsentApprovalModalProps {
  consentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConsentGranted: (consent: ConsentRequest) => void;
  onConsentDenied: () => void;
  initialConsent?: ConsentRequest | null;
}

const ALL_SCOPES: { id: ConsentScope; label: string; desc: string }[] = [
  { id: "diagnoses", label: "Diagnoses", desc: "Past & active medical diagnoses" },
  { id: "medications", label: "Medications", desc: "Current prescription list" },
  { id: "allergies", label: "Allergies", desc: "Drug & food allergy flags" },
  { id: "lab_reports", label: "Reports & Tests", desc: "Diagnostic & laboratory results" },
  { id: "prescriptions", label: "Prescriptions", desc: "Pharmacy prescription history" },
  { id: "previous_encounters", label: "Previous Encounters", desc: "Full prior clinical history" },
];

export default function ConsentApprovalModal({
  consentId,
  isOpen,
  onClose,
  onConsentGranted,
  onConsentDenied,
  initialConsent,
}: ConsentApprovalModalProps) {
  const [consent, setConsent] = useState<ConsentRequest | null>(initialConsent || null);
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>([
    "diagnoses",
    "medications",
    "allergies",
    "lab_reports",
    "prescriptions",
  ]);
  const [duration, setDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialConsent) {
      setConsent(initialConsent);
      if (initialConsent.requestedScopes && initialConsent.requestedScopes.length > 0) {
        setSelectedScopes(initialConsent.requestedScopes);
      }
      if (initialConsent.durationMinutes) {
        setDuration(initialConsent.durationMinutes);
      }
    }
  }, [initialConsent]);

  useEffect(() => {
    if (isOpen && consentId) {
      getConsentById(consentId).then((req) => {
        if (req) {
          setConsent(req);
          if (req.requestedScopes && req.requestedScopes.length > 0) {
            setSelectedScopes(req.requestedScopes);
          }
          if (req.durationMinutes) {
            setDuration(req.durationMinutes);
          }
        }
      });
    }
  }, [isOpen, consentId]);

  if (!isOpen || !consent) return null;

  const toggleScope = (scope: ConsentScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleGrant = async () => {
    if (selectedScopes.length === 0) {
      alert("Please select at least one data category to grant access.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await grantConsentRequest(consent.id, selectedScopes);
      onConsentGranted(updated);
      onClose();
    } catch (e) {
      console.error("Grant consent error", e);
      alert("Failed to grant consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    setSubmitting(true);
    try {
      await denyConsentRequest(consent.id, "Patient declined access request");
      onConsentDenied();
      onClose();
    } catch (e) {
      console.error("Deny consent error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.consentCard}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className={styles.consentHeader}>
          <div className={styles.requestIconBadge}>
            <ShieldCheck size={28} color="#10B981" />
          </div>
          <h2 className={styles.consentTitle}>Access Request</h2>
          <p className={styles.consentSubtitle}>
            A healthcare provider has scanned your QR code and requested access to your Personal Health Record.
          </p>
        </div>

        <div className={styles.doctorInfoBox}>
          <div className={styles.doctorAvatar}>
            <UserCheck size={24} color="#3B82F6" />
          </div>
          <div className={styles.doctorMeta}>
            <h4 className={styles.doctorName}>Dr. {consent.providerName || "Sharma"}</h4>
            <span className={styles.facilityName}>
              <Hospital size={14} /> {consent.facilityName || "City Care Hospital"}
            </span>
            <div className={styles.purposeTag}>
              Purpose: <strong>{consent.purpose || "General Consultation"}</strong>
            </div>
          </div>
        </div>

        <div className={styles.scopeSection}>
          <label className={styles.sectionLabel}>Select Permitted Data Categories:</label>
          <div className={styles.scopeGrid}>
            {ALL_SCOPES.map((item) => {
              const isChecked = selectedScopes.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`${styles.scopeTile} ${isChecked ? styles.scopeTileActive : ""}`}
                  onClick={() => toggleScope(item.id)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleScope(item.id)}
                    className={styles.checkboxInput}
                  />
                  <div className={styles.scopeTileText}>
                    <span className={styles.scopeTileTitle}>{item.label}</span>
                    <span className={styles.scopeTileDesc}>{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.durationSection}>
          <label className={styles.sectionLabel}>
            <Clock size={16} /> Access Duration Limit:
          </label>
          <div className={styles.durationOptions}>
            {[15, 30, 60, 120].map((mins) => (
              <button
                key={mins}
                className={`${styles.durationBtn} ${duration === mins ? styles.durationBtnActive : ""}`}
                onClick={() => setDuration(mins)}
              >
                {mins < 60 ? `${mins} min` : `${mins / 60} hour`}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.consentActions}>
          <button className={styles.denyBtn} onClick={handleDeny} disabled={submitting}>
            Deny Access
          </button>
          <button className={styles.allowBtn} onClick={handleGrant} disabled={submitting}>
            <Lock size={16} /> Allow Access
          </button>
        </div>

        <div className={styles.consentFooterNote}>
          <AlertTriangle size={14} color="#F59E0B" /> You can revoke access at any time from your <strong>Access Log</strong> control center.
        </div>
      </div>
    </div>
  );
}
