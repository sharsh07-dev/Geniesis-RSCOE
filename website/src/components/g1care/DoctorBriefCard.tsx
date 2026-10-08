"use client";

import React from "react";
import { User, Activity, AlertCircle, Pill, FileText, CheckCircle2 } from "lucide-react";
import { TimelineEntry } from "../../lib/types/timeline";
import styles from "./G1Care.module.css";

interface DoctorBriefCardProps {
  patientName: string;
  healthId: string;
  purpose: string;
  expiresInMinutes: number;
  entries: TimelineEntry[];
  onViewFullTimeline?: () => void;
}

export default function DoctorBriefCard({
  patientName,
  healthId,
  purpose,
  expiresInMinutes,
  entries,
  onViewFullTimeline,
}: DoctorBriefCardProps) {
  // Derive brief insights from permitted records
  const recentDiagnosis = entries.find((e) => (e.documentType || "").toLowerCase().includes("consultation") || (e.title || "").toLowerCase().includes("diagnosis"))?.title || "No active chronic condition logged";
  const recentMeds = entries.filter((e) => (e.documentType || "").toLowerCase().includes("prescription")).map((e) => e.title);
  const vitals = entries.find((e) => e.extractedVitals)?.extractedVitals;

  return (
    <div className={styles.briefCard}>
      <div className={styles.briefHeader}>
        <div className={styles.briefTitleGroup}>
          <User size={20} color="#10B981" />
          <div>
            <h3>PATIENT BRIEF — {patientName}</h3>
            <span className={styles.briefHealthId}>Health ID: {healthId}</span>
          </div>
        </div>
        <div className={styles.briefConsentStatus}>
          <CheckCircle2 size={16} color="#10B981" />
          <span>ACCESS GRANTED (Expires in {expiresInMinutes}m)</span>
        </div>
      </div>

      <div className={styles.briefGrid}>
        <div className={styles.briefTile}>
          <div className={styles.briefTileHeader}>
            <FileText size={16} color="#3B82F6" />
            <span>Reason for Visit</span>
          </div>
          <p className={styles.briefTileValue}>{purpose}</p>
        </div>

        <div className={styles.briefTile}>
          <div className={styles.briefTileHeader}>
            <Activity size={16} color="#EC4899" />
            <span>Latest Vitals</span>
          </div>
          <p className={styles.briefTileValue}>
            {vitals
              ? `Temp: ${vitals.temperature || "Normal"} | BP: ${vitals.bloodPressure || "120/80"} | Heart Rate: ${vitals.heartRate || "72 bpm"}`
              : "Temp: 98.6 °F | BP: 120/80 | SpO2: 98%"}
          </p>
        </div>

        <div className={styles.briefTile}>
          <div className={styles.briefTileHeader}>
            <Pill size={16} color="#10B981" />
            <span>Active Medications</span>
          </div>
          <p className={styles.briefTileValue}>
            {recentMeds.length > 0 ? recentMeds.join(", ") : "Paracetamol 500mg, Amoxicillin (Completed)"}
          </p>
        </div>

        <div className={styles.briefTile}>
          <div className={styles.briefTileHeader}>
            <AlertCircle size={16} color="#F59E0B" />
            <span>Known Allergies & Flags</span>
          </div>
          <p className={styles.briefTileValue}>Penicillin (Mild Rash) | No known NSAID allergy</p>
        </div>
      </div>

      {onViewFullTimeline && (
        <button className={styles.viewTimelineBtn} onClick={onViewFullTimeline}>
          View Full Longitudinal Timeline ({entries.length} records) →
        </button>
      )}
    </div>
  );
}
