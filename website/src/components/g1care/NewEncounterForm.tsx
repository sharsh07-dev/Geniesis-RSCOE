"use client";

import React, { useState } from "react";
import { Plus, Trash2, ShieldCheck, CheckCircle2, FilePlus, Stethoscope, Save, X } from "lucide-react";
import { PrescriptionItem, Vitals, ClinicalEncounter } from "../../lib/types/g1care";
import { createDoctorClinicalEncounter } from "../../lib/services/g1care.service";
import styles from "./G1Care.module.css";

interface NewEncounterFormProps {
  patientId: string;
  patientName: string;
  healthId: string;
  providerId: string;
  providerName: string;
  providerRegistration: string;
  facilityId: string;
  facilityName: string;
  consentId: string;
  onEncounterSaved: (encounter: ClinicalEncounter) => void;
  onCancel: () => void;
}

export default function NewEncounterForm({
  patientId,
  patientName,
  healthId,
  providerId,
  providerName,
  providerRegistration,
  facilityId,
  facilityName,
  consentId,
  onEncounterSaved,
  onCancel,
}: NewEncounterFormProps) {
  const [chiefComplaint, setChiefComplaint] = useState("High grade fever and dry cough for 3 days");
  const [symptomsInput, setSymptomsInput] = useState("Fever, Cough, Body Pain, Fatigue");
  const [vitals, setVitals] = useState<Vitals>({
    temperatureF: 101.2,
    bpSystolic: 120,
    bpDiastolic: 80,
    pulseBpm: 86,
    spO2Percent: 98,
    weightKg: 62,
    respiratoryRate: 18,
  });
  const [diagnosis, setDiagnosis] = useState("Viral Fever with Upper Respiratory Tract Infection");
  const [clinicalNotes, setClinicalNotes] = useState(
    "Patient presenting with acute fever. Lungs clear to auscultation. Throat mild congestion. Advised rest, hydration, and 3-day symptomatic medication course."
  );
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: "p1",
      medicineName: "Paracetamol 500mg",
      dosage: "500mg",
      frequency: "Twice Daily",
      duration: "3 days",
      instructions: "After meals",
    },
    {
      id: "p2",
      medicineName: "Cetirizine 10mg",
      dosage: "10mg",
      frequency: "Once Daily at bedtime",
      duration: "3 days",
      instructions: "May cause drowsiness",
    },
  ]);
  const [followUpDate, setFollowUpDate] = useState("2026-10-13");
  const [followUpInstructions, setFollowUpInstructions] = useState("Review in OPD if fever persists beyond 3 days.");
  const [submitting, setSubmitting] = useState(false);

  const addPrescriptionRow = () => {
    const newRx: PrescriptionItem = {
      id: `p_${Date.now()}`,
      medicineName: "",
      dosage: "500mg",
      frequency: "Twice Daily",
      duration: "3 days",
      instructions: "After meals",
    };
    setPrescriptions([...prescriptions, newRx]);
  };

  const removePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const updatePrescriptionField = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis for the encounter.");
      return;
    }
    setSubmitting(true);
    try {
      const symptomsList = symptomsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const encounter = await createDoctorClinicalEncounter(
        patientId,
        providerId,
        providerName,
        providerRegistration,
        facilityId,
        facilityName,
        consentId,
        chiefComplaint,
        symptomsList,
        vitals,
        diagnosis,
        clinicalNotes,
        prescriptions,
        followUpDate,
        followUpInstructions
      );

      onEncounterSaved(encounter);
    } catch (err) {
      console.error("Failed to save encounter record", err);
      alert("Error saving encounter. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.encounterFormCard}>
      <div className={styles.encounterFormHeader}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.appendBadge}>
              <ShieldCheck size={14} /> IMMUTABLE APPEND-ONLY CLINICAL ENCOUNTER
            </span>
          </div>
          <h2>New Clinical Encounter</h2>
          <p className={styles.subtext}>
            Patient: <strong>{patientName}</strong> ({healthId}) | Provider: <strong>Dr. {providerName}</strong> ({facilityName})
          </p>
        </div>
        <button className={styles.closeBtn} onClick={onCancel} aria-label="Cancel">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formBody}>
        {/* Chief Complaint & Symptoms */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeading}><Stethoscope size={16} /> Encounter Details</h4>
          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label>Chief Complaint:</label>
              <textarea
                className={styles.textAreaInput}
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe patient's chief complaint"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Symptoms (comma separated):</label>
              <textarea
                className={styles.textAreaInput}
                rows={2}
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="Fever, Cough, Body Pain..."
              />
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeading}>Vitals</h4>
          <div className={styles.vitalsGrid}>
            <div className={styles.vitalInputGroup}>
              <label>Temp (°F):</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperatureF || ""}
                onChange={(e) => setVitals({ ...vitals, temperatureF: Number(e.target.value) })}
              />
            </div>
            <div className={styles.vitalInputGroup}>
              <label>BP Systolic:</label>
              <input
                type="number"
                value={vitals.bpSystolic || ""}
                onChange={(e) => setVitals({ ...vitals, bpSystolic: Number(e.target.value) })}
              />
            </div>
            <div className={styles.vitalInputGroup}>
              <label>BP Diastolic:</label>
              <input
                type="number"
                value={vitals.bpDiastolic || ""}
                onChange={(e) => setVitals({ ...vitals, bpDiastolic: Number(e.target.value) })}
              />
            </div>
            <div className={styles.vitalInputGroup}>
              <label>Pulse (bpm):</label>
              <input
                type="number"
                value={vitals.pulseBpm || ""}
                onChange={(e) => setVitals({ ...vitals, pulseBpm: Number(e.target.value) })}
              />
            </div>
            <div className={styles.vitalInputGroup}>
              <label>SpO2 (%):</label>
              <input
                type="number"
                value={vitals.spO2Percent || ""}
                onChange={(e) => setVitals({ ...vitals, spO2Percent: Number(e.target.value) })}
              />
            </div>
            <div className={styles.vitalInputGroup}>
              <label>Weight (kg):</label>
              <input
                type="number"
                value={vitals.weightKg || ""}
                onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Diagnosis & Clinical Notes */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeading}>Diagnosis & Clinical Assessment</h4>
          <div className={styles.formGroup}>
            <label>Primary Diagnosis *:</label>
            <input
              type="text"
              className={styles.textInput}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Clinical Notes & Observations:</label>
            <textarea
              className={styles.textAreaInput}
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Prescriptions */}
        <div className={styles.formSection}>
          <div className={styles.rxHeader}>
            <h4 className={styles.sectionHeading}>Prescription Builder</h4>
            <button type="button" className={styles.addRxBtn} onClick={addPrescriptionRow}>
              <Plus size={14} /> Add Medicine
            </button>
          </div>
          {prescriptions.map((p) => (
            <div key={p.id} className={styles.rxRow}>
              <input
                type="text"
                placeholder="Medicine Name"
                value={p.medicineName}
                onChange={(e) => updatePrescriptionField(p.id, "medicineName", e.target.value)}
                className={styles.rxInputMed}
              />
              <input
                type="text"
                placeholder="Dosage"
                value={p.dosage}
                onChange={(e) => updatePrescriptionField(p.id, "dosage", e.target.value)}
                className={styles.rxInputShort}
              />
              <input
                type="text"
                placeholder="Frequency"
                value={p.frequency}
                onChange={(e) => updatePrescriptionField(p.id, "frequency", e.target.value)}
                className={styles.rxInputMed}
              />
              <input
                type="text"
                placeholder="Duration"
                value={p.duration}
                onChange={(e) => updatePrescriptionField(p.id, "duration", e.target.value)}
                className={styles.rxInputShort}
              />
              <button
                type="button"
                className={styles.deleteRxBtn}
                onClick={() => removePrescriptionRow(p.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Follow Up */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionHeading}>Follow-up Plan</h4>
          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label>Follow-up Date:</label>
              <input
                type="date"
                className={styles.textInput}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Instructions:</label>
              <input
                type="text"
                className={styles.textInput}
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className={styles.formFooterActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.saveEncounterBtn} disabled={submitting}>
            <Save size={18} /> {submitting ? "Saving Encounter..." : "SAVE ENCOUNTER"}
          </button>
        </div>
      </form>
    </div>
  );
}
