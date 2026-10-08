"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Clock, UserCheck, Hospital, Lock, RefreshCw, XCircle } from "lucide-react";
import { getG1CareAuditLogs, revokeActiveConsent } from "../../lib/services/g1care.service";
import { G1CareAuditEvent } from "../../lib/types/g1care";
import styles from "./G1Care.module.css";

interface AccessHistoryViewProps {
  patientId: string;
}

export default function AccessHistoryView({ patientId }: AccessHistoryViewProps) {
  const [logs, setLogs] = useState<G1CareAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getG1CareAuditLogs(patientId);
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch access audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [patientId]);

  const handleRevoke = async (consentId?: string) => {
    if (!consentId) return;
    if (!confirm("Are you sure you want to revoke active access for this doctor immediately?")) return;
    try {
      await revokeActiveConsent(consentId);
      alert("Access revoked successfully.");
      fetchLogs();
    } catch (e) {
      console.error("Failed to revoke consent", e);
    }
  };

  return (
    <div className={styles.accessViewContainer}>
      <div className={styles.accessHeaderRow}>
        <div>
          <h2>Patient Control Center — Access History & Audit Log</h2>
          <p className={styles.subtext}>
            Transparent, zero-knowledge audit trail of every encounter scan, consent request, and clinical view.
          </p>
        </div>
        <button className={styles.secondaryBtn} onClick={fetchLogs}>
          <RefreshCw size={16} /> Refresh Log
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>Loading access history...</div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyAccessBox}>
          <ShieldCheck size={36} color="#10B981" />
          <h4>No External Access Yet</h4>
          <p>Your health record has not been accessed by any provider. Generate a Health QR to initiate a consented encounter.</p>
        </div>
      ) : (
        <div className={styles.auditLogList}>
          {logs.map((log) => {
            const dateStr = new Date(log.timestamp).toLocaleString();
            const isGranted = log.eventType === "CONSENT_GRANTED";
            const isDenied = log.eventType === "CONSENT_DENIED";
            const isRevoked = log.eventType === "CONSENT_REVOKED";

            return (
              <div key={log.eventId} className={styles.auditLogCard}>
                <div className={styles.logLeftCol}>
                  <div
                    className={`${styles.eventBadgeIcon} ${
                      isGranted ? styles.badgeGranted : isDenied ? styles.badgeDenied : isRevoked ? styles.badgeRevoked : styles.badgeDefault
                    }`}
                  >
                    {isGranted ? <ShieldCheck size={18} /> : isDenied || isRevoked ? <ShieldAlert size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <h4 className={styles.logEventType}>{log.eventType.replace("_", " ")}</h4>
                    <span className={styles.logTimestamp}>{dateStr}</span>
                  </div>
                </div>

                <div className={styles.logMiddleCol}>
                  <div className={styles.logProviderInfo}>
                    <UserCheck size={14} /> Dr. {log.providerName || "Sharma"}{" "}
                    {log.facilityName && (
                      <span className={styles.logFacility}>
                        (<Hospital size={12} /> {log.facilityName})
                      </span>
                    )}
                  </div>
                  <p className={styles.logDetails}>{log.details}</p>
                  {log.scopes && log.scopes.length > 0 && (
                    <div className={styles.scopesPills}>
                      {log.scopes.map((s) => (
                        <span key={s} className={styles.scopePill}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.logRightCol}>
                  {isGranted && log.consentId && (
                    <button className={styles.revokeBtn} onClick={() => handleRevoke(log.consentId)}>
                      <XCircle size={14} /> Revoke Access
                    </button>
                  )}
                  {isRevoked && <span className={styles.statusRevokedTag}>REVOKED</span>}
                  {isDenied && <span className={styles.statusDeniedTag}>DENIED</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
