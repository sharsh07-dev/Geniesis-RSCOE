"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, ShieldCheck, Share2, X, CheckCircle2, UserCheck, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createEncounterQRSession, getSessionById } from "../../lib/services/g1care.service";
import { listenToPath } from "../../lib/firebase/rtdb";
import { EncounterSession } from "../../lib/types/g1care";
import { useLanguage } from "../../hooks/useLanguage";
import styles from "./G1Care.module.css";

interface HealthQRModalProps {
  patientId: string;
  patientName: string;
  healthId: string;
  isOpen: boolean;
  onClose: () => void;
  onConsentRequested?: (sessionId: string, consentId: string) => void;
}

export default function HealthQRModal({
  patientId,
  patientName,
  healthId,
  isOpen,
  onClose,
  onConsentRequested,
}: HealthQRModalProps) {
  const { t } = useLanguage();
  const [session, setSession] = useState<EncounterSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const initQR = async () => {
    setLoading(true);
    try {
      const sess = await createEncounterQRSession(patientId, patientName, healthId);
      setSession(sess);
    } catch (e) {
      console.error("Failed to generate QR session", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initQR();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patientId]);

  // Real-time Firebase listener + fallback polling
  useEffect(() => {
    if (!isOpen || !session?.sessionId) return;

    // 1. Instant WebSocket listener via Firebase Realtime Database
    const unsubscribe = listenToPath<EncounterSession>(
      `sessions/${session.sessionId}`,
      (updated) => {
        if (updated) {
          setSession(updated);
          if (updated.status === "CONSENT_PENDING" && updated.consentId) {
            if (onConsentRequested) {
              onConsentRequested(updated.sessionId, updated.consentId);
            }
          }
        }
      }
    );

    // 2. Secondary fallback poll every 2 seconds
    const poll = setInterval(async () => {
      if (session?.sessionId) {
        const updated = await getSessionById(session.sessionId);
        if (updated && updated.status !== session.status) {
          setSession(updated);
          if (updated.status === "CONSENT_PENDING" && updated.consentId) {
            if (onConsentRequested) {
              onConsentRequested(updated.sessionId, updated.consentId);
            }
          }
        }
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [isOpen, session?.sessionId, session?.status, onConsentRequested]);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (navigator.clipboard && session?.token) {
      navigator.clipboard.writeText(session.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.qrModalCard}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className={styles.qrHeader}>
          <div className={styles.badgeRow}>
            <span className={styles.activeBadge} style={{ background: "#ECFDF5", color: "#047857", borderColor: "#A7F3D0" }}>
              <ShieldCheck size={14} /> {t("qr_active_gateway")}
            </span>
          </div>
          <h2 className={styles.qrTitle}>{t("qr_modal_title")}</h2>
          <p className={styles.qrSubtitle}>{t("qr_modal_subtitle")}</p>
        </div>

        <div className={styles.qrDisplayContainer} style={{ padding: "20px" }}>
          {loading ? (
            <div className={styles.qrLoading}>
              <RefreshCw className={styles.spinIcon} size={36} color="#059669" />
              <span style={{ marginTop: "10px", fontWeight: 600, color: "#475569" }}>Initializing Real-Time QR...</span>
            </div>
          ) : session?.status === "CONSENT_PENDING" ? (
            <div className={styles.qrPendingBox}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <UserCheck size={32} color="#D97706" />
              </div>
              <h4 style={{ color: "#92400E", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px" }}>
                {t("qr_doctor_scanned")}
              </h4>
              <p style={{ color: "#78350F", fontSize: "0.85rem", margin: "0 0 10px" }}>
                Dr. {session.providerName || "Sharma"} {t("consent_request_desc")}
              </p>
              <span className={styles.pendingHint} style={{ fontWeight: 600, color: "#059669" }}>
                Opening consent window...
              </span>
            </div>
          ) : (
            <div className={styles.qrCodeWrapper} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* REAL ISO/IEC COMPLIANT SCANNABLE QR CODE */}
              <div
                style={{
                  background: "#FFFFFF",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                  border: "2px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {session?.token ? (
                  <QRCodeSVG
                    value={session.token}
                    size={220}
                    level="M"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                ) : (
                  <RefreshCw className={styles.spinIcon} size={36} color="#059669" />
                )}
              </div>

              {/* TOKEN DISPLAY */}
              <div className={styles.tokenDisplay} style={{ marginTop: "16px", textAlign: "center" }}>
                <span className={styles.tokenLabel} style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
                  {t("qr_token_label")}
                </span>
                <span
                  className={styles.tokenValue}
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  {session?.token || "..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* UNLIMITED TIME INDICATOR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "#059669",
            fontSize: "0.85rem",
            fontWeight: 700,
            margin: "4px 0 16px",
            padding: "8px 12px",
            background: "#ECFDF5",
            borderRadius: "8px",
            border: "1px solid #A7F3D0",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{t("qr_unlimited_validity")}</span>
        </div>

        <div className={styles.qrFooterActions}>
          <button className={styles.secondaryBtn} onClick={initQR} disabled={loading} title="Generate a fresh code">
            <RefreshCw size={15} /> {t("btn_refresh")}
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={handleCopyToken}
            style={{ minWidth: "130px" }}
          >
            {copied ? (
              <>
                <Check size={15} color="#059669" /> {t("btn_copied")}
              </>
            ) : (
              <>
                <Copy size={15} /> {t("btn_copy")}
              </>
            )}
          </button>
        </div>

        <div className={styles.securityNotice} style={{ marginTop: "14px", fontSize: "0.78rem", color: "#64748B" }}>
          🔒 {t("qr_privacy_guarantee")}
        </div>
      </div>
    </div>
  );
}
