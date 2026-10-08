// ============================================================
// ArogyaSutra / G1Care Comprehensive Clinical Seed Dataset
// Populates all 10 anatomical body zones, clinical records,
// vitals trends, checkup history, and appointments for demonstration.
// ============================================================

import type { MedicalRecord } from "../../components/body3d/BodyModel3D";
import type { TimelineEntry } from "../types/timeline";
import type { CheckupEntry } from "../aws/dynamodb";
import type { Appointment } from "../types/appointment";
import type { PatientData } from "../../components/dashboard/DoctorDashboard";

// Helper to format ISO dates relative to today so appointments and records stay fresh
function getRelativeDateStr(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
}

// ------------------------------------------------------------
// 1. ANATOMICAL RECORDS (Covering all 10 3D Body Zones)
// ------------------------------------------------------------
export const SEED_TIMELINE_RECORDS: MedicalRecord[] = [
    // ── HEAD / BRAIN ──
    {
        entryId: "rec_head_01",
        title: "Brain MRI with Contrast — Normal Cranial Study",
        date: "2026-02-14",
        documentType: "Imaging",
        summary: "High-resolution 3T MRI of the brain and cranial nerves. Normal cerebral and cerebellar parenchyma. No acute infarct, hemorrhage, midline shift, or intracranial mass lesion. Ventricles and basal cisterns are within normal limits.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Head",
    },
    {
        entryId: "rec_head_02",
        title: "Neurology Consultation & Migraine Assessment",
        date: "2026-01-28",
        documentType: "Consult",
        summary: "Evaluated for episodic tension-type headaches and ocular strain. Neurological examination unremarkable. Cranial nerves II–XII intact. Fundoscopy normal. Advised lifestyle modifications, screen hydration breaks, and SOS Rizatriptan.",
        sourceInstitution: "Max Super Speciality Hospital, Delhi",
        bodyPart: "Head",
    },

    // ── CHEST / LUNGS / HEART ──
    {
        entryId: "rec_chest_01",
        title: "12-Lead Electrocardiogram (ECG) — Normal Sinus Rhythm",
        date: "2026-03-01",
        documentType: "Lab",
        summary: "12-lead standard resting ECG. Heart rate: 72 bpm. PR interval: 156 ms, QRS duration: 88 ms, QTc: 412 ms. Normal sinus rhythm, normal electrical axis. No ST-T segment elevation or ischemic changes observed.",
        sourceInstitution: "Fortis Escorts Heart Institute",
        bodyPart: "Chest",
    },
    {
        entryId: "rec_chest_02",
        title: "Digital Chest Radiograph (PA View) — Clear Lung Fields",
        date: "2026-02-10",
        documentType: "Imaging",
        summary: "Standard posteroanterior chest X-Ray. Bilateral lung parenchymal fields are clear without focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is normal (0.44). Costophrenic angles sharp.",
        sourceInstitution: "AIIMS, New Delhi",
        bodyPart: "Chest",
    },
    {
        entryId: "rec_chest_03",
        title: "Transthoracic 2D Echocardiogram & Color Doppler",
        date: "2026-01-15",
        documentType: "Consult",
        summary: "Comprehensive 2D Echo report. Left ventricular ejection fraction (LVEF): 62%. Normal left ventricular cavity size and systolic function. All cardiac valves structurally intact with trivial physiological tricuspid regurgitation.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Chest",
    },

    // ── ABDOMEN ──
    {
        entryId: "rec_abdo_01",
        title: "Whole Abdomen Ultrasound (USG) — Unremarkable",
        date: "2026-02-20",
        documentType: "Imaging",
        summary: "High-resolution abdominal ultrasound scan. Liver measures 13.8 cm with homogenous echotexture. Gall bladder wall thin and calculi-free. Pancreas, spleen, and bilateral kidneys show normal parenchymal thickness and corticomedullary differentiation.",
        sourceInstitution: "Medanta - The Medicity",
        bodyPart: "Abdomen",
    },
    {
        entryId: "rec_abdo_02",
        title: "Comprehensive Liver Function Test (LFT) Panel",
        date: "2026-02-18",
        documentType: "Lab",
        summary: "Total Bilirubin: 0.8 mg/dL (Normal: 0.2–1.2). SGOT (AST): 22 U/L. SGPT (ALT): 26 U/L. Alkaline Phosphatase: 74 U/L. Total Serum Protein: 7.2 g/dL with Albumin/Globulin ratio 1.5. All hepatic enzyme markers in optimal clinical range.",
        sourceInstitution: "Thyrocare Technologies",
        bodyPart: "Abdomen",
    },
    {
        entryId: "rec_abdo_03",
        title: "Gastroenterology Upper GI Endoscopy Report",
        date: "2025-11-22",
        documentType: "H",
        summary: "Diagnostic upper GI endoscopy for mild dyspeptic symptoms. Normal esophagus and gastroesophageal junction. Mild non-erosive antral erythema noted; rapid urease test (RUT) for H. pylori negative. Duodenal bulb normal.",
        sourceInstitution: "Max Super Speciality Hospital, Delhi",
        bodyPart: "Abdomen",
    },

    // ── PELVIS / HIP ──
    {
        entryId: "rec_pelv_01",
        title: "DEXA Dual-Energy Bone Mineral Density (BMD) Scan",
        date: "2026-01-08",
        documentType: "Imaging",
        summary: "Bone density evaluation of lumbar spine (L1–L4) and left femoral neck. Total femur T-score: +0.2; Lumbar spine T-score: +0.4. Classified as Normal bone mineral density with negligible osteopenia risk.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Pelvis",
    },
    {
        entryId: "rec_pelv_02",
        title: "Renal & Urinary Bladder Ultrasound (USG KUB)",
        date: "2025-12-18",
        documentType: "Lab",
        summary: "Bilateral kidneys normal in position and axis. Urinary bladder shows smooth mucosal margins and normal wall thickness. Pre-void volume: 320 mL; post-void residual volume: 15 mL (physiologically normal).",
        sourceInstitution: "Fortis Healthcare",
        bodyPart: "Pelvis",
    },

    // ── LEFT ARM / SHOULDER ──
    {
        entryId: "rec_larm_01",
        title: "Left Shoulder Rotator Cuff MRI — Intact Tendons",
        date: "2026-01-19",
        documentType: "Imaging",
        summary: "Magnetic resonance imaging of left shoulder joint. Supraspinatus, infraspinatus, subscapularis, and teres minor tendons are intact without high-grade tear. Trace subacromial-subdeltoid bursal fluid noted.",
        sourceInstitution: "AIIMS, New Delhi",
        bodyPart: "Left Arm",
    },
    {
        entryId: "rec_larm_02",
        title: "Orthopedic Shoulder Rehabilitation Prescription",
        date: "2026-01-20",
        documentType: "RX",
        summary: "Physical medicine & rehabilitation prescription for left shoulder deltoid stability. Active rotator cuff strengthening, scapular stabilization, and isometric exercises 3x weekly. Paracetamol 500mg SOS for post-exercise soreness.",
        sourceInstitution: "Max Healthcare, Delhi",
        bodyPart: "Left Arm",
    },

    // ── RIGHT ARM / SHOULDER ──
    {
        entryId: "rec_rarm_01",
        title: "Right Arm Digital Radiograph (Humerus & Elbow)",
        date: "2025-12-05",
        documentType: "Imaging",
        summary: "Anteroposterior and lateral radiographs of the right arm and elbow joint. Normal bone mineralization and cortex alignment. No cortical discontinuity, periosteal reaction, joint effusion, or loose bodies detected.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Right Arm",
    },
    {
        entryId: "rec_rarm_02",
        title: "Adult Booster Vaccination — Tdap & Hepatitis B",
        date: "2025-10-12",
        documentType: "Vacc",
        summary: "Administered Tdap (Tetanus, Diphtheria, Pertussis) booster and Hepatitis B third dose via intramuscular injection into the right deltoid muscle. Tolerated without adverse allergic or local inflammatory reaction.",
        sourceInstitution: "City Health Care Clinic",
        bodyPart: "Right Arm",
    },

    // ── LEFT HAND / WRIST ──
    {
        entryId: "rec_lhand_01",
        title: "Left Wrist Scaphoid PA & Oblique Radiograph",
        date: "2026-02-02",
        documentType: "Imaging",
        summary: "Specialized 4-view scaphoid series of the left wrist. Intact cortical contour of scaphoid, lunate, and radius. Scapholunate joint space is 1.8 mm (normal). No occult fracture line or avascular necrosis.",
        sourceInstitution: "Medanta Bone & Joint Institute",
        bodyPart: "Left Hand",
    },
    {
        entryId: "rec_lhand_02",
        title: "Nerve Conduction Velocity (NCV) Study — Left Median Nerve",
        date: "2025-11-10",
        documentType: "Lab",
        summary: "Electrophysiological evaluation of left upper extremity. Median sensory nerve conduction velocity across carpal tunnel is 54.2 m/s (normal > 50 m/s); distal motor latency is 3.4 ms. Rules out carpal tunnel syndrome.",
        sourceInstitution: "AIIMS Department of Neurology",
        bodyPart: "Left Hand",
    },

    // ── RIGHT HAND / WRIST ──
    {
        entryId: "rec_rhand_01",
        title: "Right Hand Metacarpal Joint Ultrasound & Synovium",
        date: "2026-01-12",
        documentType: "Lab",
        summary: "Musculoskeletal ultrasound of MCP and PIP joints of right hand. No synovial hypertrophy, tenosynovitis, or abnormal hypervascularity on power Doppler examination. Joint capsules clean and normal.",
        sourceInstitution: "Fortis Hospital",
        bodyPart: "Right Hand",
    },
    {
        entryId: "rec_rhand_02",
        title: "Rheumatoid Factor (RF) & Anti-CCP Serology Panel",
        date: "2026-01-10",
        documentType: "Lab",
        summary: "Rheumatoid Factor (RF Quantitative): < 9.4 IU/mL (Normal < 14). Anti-Cyclic Citrullinated Peptide (Anti-CCP): 4.2 U/mL (Negative < 20). Erythrocyte sedimentation rate (ESR): 8 mm/hr. Normal serology profile.",
        sourceInstitution: "Dr Lal PathLabs",
        bodyPart: "Right Hand",
    },

    // ── LEFT LEG / KNEE ──
    {
        entryId: "rec_lleg_01",
        title: "Left Knee 3T MRI — Post-Arthroscopic Follow-up",
        date: "2025-10-18",
        documentType: "Imaging",
        summary: "High-field MRI of the left knee following prior arthroscopic partial medial meniscectomy. Surgical site well-healed with stable residual meniscal contour. Anterior and posterior cruciate ligaments (ACL/PCL) intact. No significant joint effusion.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Left Leg",
    },
    {
        entryId: "rec_lleg_02",
        title: "Surgical Discharge Summary — Left Knee Arthroscopy",
        date: "2024-08-20",
        documentType: "H",
        summary: "Elective left knee diagnostic arthroscopy and trimming of degenerate medial meniscus tear under spinal anesthesia. Uneventful recovery. Full weight-bearing resumed with crutches on post-op day 1.",
        sourceInstitution: "Max Super Speciality Hospital, Delhi",
        bodyPart: "Left Leg",
    },

    // ── RIGHT LEG / KNEE ──
    {
        entryId: "rec_rleg_01",
        title: "Right Leg Tibia-Fibula Stress Radiograph",
        date: "2025-11-28",
        documentType: "Imaging",
        summary: "Full-length AP and lateral radiographs of the right lower leg. Cortical margins of tibia and fibula are smooth and intact. No periosteal reaction, stress fracture, or osteolytic change identified.",
        sourceInstitution: "Fortis Healthcare",
        bodyPart: "Right Leg",
    },
    {
        entryId: "rec_rleg_02",
        title: "Bilateral Lower Extremity Venous Duplex Doppler",
        date: "2025-09-14",
        documentType: "Imaging",
        summary: "Color Doppler ultrasound of deep and superficial veins of bilateral lower limbs. Common femoral, superficial femoral, and popliteal veins are fully compressible with phasic flow and respiratory augmentation. No deep vein thrombosis (DVT).",
        sourceInstitution: "AIIMS Department of Radiodiagnosis",
        bodyPart: "Right Leg",
    },

    // ── GENERAL CLINICAL, PRESCRIPTIONS & INSURANCE ──
    {
        entryId: "rec_rx_01",
        title: "Cardiovascular Preventive Regimen — Atorvastatin 10mg",
        date: "2026-02-25",
        documentType: "RX",
        summary: "Prescription for primary prevention of cardiovascular risk: Tab. Atorvastatin 10mg once daily at bedtime, Tab. CoQ10 100mg OD. Refills allowed: 6 months. Advised follow-up lipid profile in 6 months.",
        sourceInstitution: "Apollo Hospitals, Bangalore",
        bodyPart: "Chest",
    },
    {
        entryId: "rec_rx_02",
        title: "Gastroenterology Acid-Peptic Therapy — Pantoprazole 40mg",
        date: "2026-01-30",
        documentType: "RX",
        summary: "Tab. Pantoprazole 40mg once daily before breakfast for 4 weeks. Cap. Pre & Probiotic once daily after dinner. Advised avoidance of spicy foods and late-night meals.",
        sourceInstitution: "Max Super Speciality Hospital, Delhi",
        bodyPart: "Abdomen",
    },
    {
        entryId: "rec_ins_01",
        title: "Star Health Comprehensive Medical Insurance Policy (Gold Care Shield)",
        date: "2026-01-05",
        documentType: "Insurance",
        summary: "Annual health indemnity insurance policy #SH-829104-2025. Sum insured: INR 15,00,000. Covers cashless inpatient hospitalization, pre/post-hospitalization expenses, daycare procedures, and annual health checkup.",
        sourceInstitution: "Star Health & Allied Insurance Co.",
        bodyPart: "Chest",
    },
    {
        entryId: "rec_ins_02",
        title: "HDFC ERGO Cashless Health Claim Settlement Approval",
        date: "2024-08-22",
        documentType: "Insurance",
        summary: "Cashless authorization letter #CL-481902 for Left Knee Arthroscopic Procedure at Max Super Speciality. Pre-approved claim amount: INR 85,000. Co-payment: Nil. Deductible: Settled directly.",
        sourceInstitution: "HDFC ERGO General Insurance",
        bodyPart: "Left Leg",
    },
    {
        entryId: "rec_consult_01",
        title: "Annual Comprehensive Executive Health Assessment",
        date: "2026-03-02",
        documentType: "Consult",
        summary: "Comprehensive wellness evaluation. Vitals stable: BP 120/80 mmHg, Pulse 72 bpm, BMI 22.9 kg/m². Systemic examination within normal limits. Fasting glucose: 94 mg/dL, HbA1c: 5.4%. Cleared for all physical activities.",
        sourceInstitution: "Fortis Escorts Clinic",
        bodyPart: "Chest",
    },
];

// Convert to full longitudinal TimelineEntry objects
export const SEED_TIMELINE_ENTRIES: TimelineEntry[] = SEED_TIMELINE_RECORDS.map((r, i) => ({
    entryId: r.entryId,
    patientId: "AS-1001-2024-8899",
    title: r.title,
    documentType: (r.documentType as any) || "Consult",
    statusFlags: ["VERIFIED"],
    doctorName: i % 2 === 0 ? "Dr. Ananya Sharma" : "Dr. Rajesh Mehta",
    sourceInstitution: r.sourceInstitution,
    date: r.date,
    createdAt: new Date(`${r.date}T10:00:00Z`).toISOString(),
    updatedAt: new Date(`${r.date}T10:00:00Z`).toISOString(),
    encryptedBlobKey: `blob_${r.entryId}`,
    fhirResourceIds: [`FHIR-RES-${i + 101}`],
    confidenceScore: 98,
    addedBy: {
        type: "DOCTOR",
        userId: "doc_202",
        name: i % 2 === 0 ? "Dr. Ananya Sharma" : "Dr. Rajesh Mehta",
        mciNumber: "MCI-849201",
    },
    metadata: {
        bodyPart: r.bodyPart,
        summary: r.summary,
        diagnoses: [r.title],
        medications: r.documentType === "RX" ? [{ name: "Paracetamol 500mg" }, { name: "Pantoprazole 40mg" }] : [],
    },
    summary: r.summary,
    extractedVitals: {
        temperature: "98.6 °F",
        bloodPressure: "120/80 mmHg",
        heartRate: "72 bpm",
        spO2: "98%",
    },
    rawExtractedText: `${r.title}\nInstitution: ${r.sourceInstitution}\nDate: ${r.date}\nSummary: ${r.summary}`,
}));

// ------------------------------------------------------------
// 2. CHECKUP HISTORY & SPARKLINE VITALS TREND
// ------------------------------------------------------------
export const SEED_CHECKUP_HISTORY: CheckupEntry[] = [
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_01",
        bpSystolic: 120,
        bpDiastolic: 80,
        height: "175",
        weight: "70.0",
        recordedBy: "Dr. Ananya Sharma",
        recordedAt: "2026-03-05T10:30:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_02",
        bpSystolic: 122,
        bpDiastolic: 82,
        height: "175",
        weight: "70.2",
        recordedBy: "Dr. Ananya Sharma",
        recordedAt: "2026-02-18T14:15:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_03",
        bpSystolic: 119,
        bpDiastolic: 79,
        height: "175",
        weight: "69.8",
        recordedBy: "Dr. Rajesh Mehta",
        recordedAt: "2026-01-22T11:00:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_04",
        bpSystolic: 124,
        bpDiastolic: 84,
        height: "175",
        weight: "70.5",
        recordedBy: "Dr. Suresh Verma",
        recordedAt: "2025-12-10T09:45:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_05",
        bpSystolic: 118,
        bpDiastolic: 78,
        height: "175",
        weight: "70.0",
        recordedBy: "Dr. Ananya Sharma",
        recordedAt: "2025-11-14T16:20:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_06",
        bpSystolic: 121,
        bpDiastolic: 80,
        height: "175",
        weight: "70.1",
        recordedBy: "Dr. Priya Nair",
        recordedAt: "2025-10-02T10:00:00Z",
    },
    {
        patientId: "AS-1001-2024-8899",
        checkupId: "chk_07",
        bpSystolic: 120,
        bpDiastolic: 80,
        height: "175",
        weight: "69.9",
        recordedBy: "Dr. Alok Mathur",
        recordedAt: "2025-08-15T11:30:00Z",
    },
];

// ------------------------------------------------------------
// 3. UPCOMING APPOINTMENTS (Dynamically Scheduled)
// ------------------------------------------------------------
export const SEED_APPOINTMENTS: Appointment[] = [
    {
        patientId: "AS-1001-2024-8899",
        appointmentId: "appt_cardio_01",
        appointmentDate: getRelativeDateStr(3),
        time: "10:30 AM",
        doctorName: "Dr. Ananya Sharma",
        specialty: "Cardiology",
        location: "Apollo Hospitals, OPD Room 302",
        notes: "6-month cardiovascular checkup and resting ECG review.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        patientId: "AS-1001-2024-8899",
        appointmentId: "appt_ortho_02",
        appointmentDate: getRelativeDateStr(10),
        time: "02:00 PM",
        doctorName: "Dr. Rajesh Mehta",
        specialty: "Orthopedics",
        location: "Max Super Speciality Hospital, Block B",
        notes: "Left knee post-arthroscopic rehabilitation functional follow-up.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        patientId: "AS-1001-2024-8899",
        appointmentId: "appt_gen_03",
        appointmentDate: getRelativeDateStr(21),
        time: "11:00 AM",
        doctorName: "Dr. Suresh Verma",
        specialty: "Internal Medicine",
        location: "Fortis Escorts Clinic, Desk 4",
        notes: "Routine comprehensive annual health & metabolic panel review.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        patientId: "AS-1001-2024-8899",
        appointmentId: "appt_pulm_04",
        appointmentDate: getRelativeDateStr(45),
        time: "09:30 AM",
        doctorName: "Dr. Priya Nair",
        specialty: "Pulmonology",
        location: "AIIMS Outpatient Center, Chamber 12",
        notes: "Follow-up spirometry pulmonary function assessment.",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// ------------------------------------------------------------
// 4. FULL SEED PATIENT DATA FOR DOCTOR DASHBOARD
// ------------------------------------------------------------
export const SEED_PATIENT_DATA: PatientData = {
    cardId: "AS-1001-2024-8899",
    name: "Rohit Dhangar",
    age: 32,
    gender: "Male",
    height: "175 cm",
    weight: "70 kg",
    bloodGroup: "O+",
    phone: "+91 98765 43210",
    diagnosis: "General Wellness & Routine Ortho/Cardio Monitoring",
    vitals: {
        bpSystolic: "120",
        bpDiastolic: "80",
    },
    history: [
        {
            type: "checkup",
            label: "Annual Executive Health Checkup",
            date: "2025-11-15",
            active: true,
        },
        {
            type: "surgery",
            label: "Left Knee Arthroscopic Meniscectomy",
            date: "2024-08-20",
        },
        {
            type: "followup",
            label: "Post-Op Physical Therapy & Joint Mobility",
            date: "2024-09-10",
        },
        {
            type: "checkup",
            label: "Pre-Employment Medical Clearance",
            date: "2024-02-14",
        },
    ],
    annotations: [
        {
            bodyPart: "Chest",
            title: "12-Lead ECG Normal Sinus Rhythm (72 bpm)",
            date: "2026-03-01",
        },
        {
            bodyPart: "Head",
            title: "Brain MRI Scan Clear — No Infarct or Lesion",
            date: "2026-02-14",
        },
        {
            bodyPart: "Left Leg",
            title: "Left Knee Arthroscopy Complete Recovery",
            date: "2025-10-18",
        },
    ],
    allergies: [
        "Penicillin (Mild Erythematous Rash)",
        "Dust Mites & Pollen (Seasonal Rhinitis)",
        "Sulfa Antibiotics (Severe Urticaria)",
    ],
    criticalMeds: [
        "Paracetamol 500mg (SOS / As needed)",
        "Atorvastatin 10mg (OD Bedtime)",
        "Vitamin D3 60,000 IU (Once weekly)",
        "Pantoprazole 40mg (OD Morning before food)",
    ],
    checkupHistory: SEED_CHECKUP_HISTORY,
};
