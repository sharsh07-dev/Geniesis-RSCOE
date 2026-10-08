"use client";

import React from "react";
import { Sparkles, CheckCircle, FileText, Pill, Activity, Calendar, ShieldCheck } from "lucide-react";
import { ClinicalEncounter } from "../../lib/types/g1care";
import styles from "./G1Care.module.css";

interface WhatChangedCardProps {
  encounter: ClinicalEncounter;
  onViewRecord?: () => void;
}

export default function WhatChangedCard({ encounter, onViewRecord }: WhatChangedCardProps) {
  return (
    <div className={styles.whatChangedCard}>
      <div className={styles.whatChangedHeader}>
        <div className={styles.whatChangedTitle}>
          <Sparkles size={20} color="#10B981" className={styles.pulseIcon} />
          <h3>WHAT CHANGED TODAY</h3>
        </div>
        <span className={styles.provenanceBadge}>
          <ShieldCheck size={14} /> Added by Dr. {encounter.providerName} ({encounter.facilityName})
        </span>
      </div>

      <div className={styles.changesGrid}>
        <div className={styles.changeItem}>
          <FileText size={18} color="#3B82F6" />
          <div>
            <strong>New Diagnosis:</strong>
            <span>{encounter.diagnosis}</span>
          </div>
        </div>

        {encounter.prescriptions && encounter.prescriptions.length > 0 && (
          <div className={styles.changeItem}>
            <Pill size={18} color="#10B981" />
            <div>
              <strong>New Prescription:</strong>
              <span>{encounter.prescriptions.map((p) => `${p.medicineName} (${p.dosage})`).join(", ")}</span>
            </div>
          </div>
        )}

        {encounter.vitals && (
          <div className={styles.changeItem}>
            <Activity size={18} color="#EC4899" />
            <div>
              <strong>Updated Vitals:</strong>
              <span>
                Temp: {encounter.vitals.temperatureF || 98.6}°F | BP: {encounter.vitals.bpSystolic}/{encounter.vitals.bpDiastolic} | SpO2: {encounter.vitals.spO2Percent}%
              </span>
            </div>
          </div>
        )}

        {encounter.followUpDate && (
          <div className={styles.changeItem}>
            <Calendar size={18} color="#F59E0B" />
            <div>
              <strong>Follow-up Scheduled:</strong>
              <span>{encounter.followUpDate} ({encounter.followUpInstructions || "OPD Review"})</span>
            </div>
          </div>
        )}
      </div>

      {onViewRecord && (
        <button className={styles.viewRecordBtn} onClick={onViewRecord}>
          View Provenance & Detailed Record →
        </button>
      )}
    </div>
  );
}
