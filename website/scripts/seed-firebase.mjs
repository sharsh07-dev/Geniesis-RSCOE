// ============================================================
// Unified G1Care + Mobile Android Shared Realtime Database Seeder Script
// Merges Android App Schema + Web Encounter Gateway Engine Schema
// ============================================================

const FIREBASE_DB_URL = "https://genesis-6ff38-default-rtdb.firebaseio.com";

// 1. Unified Users node ($user_uid)
const SEED_USERS = {
  // Demo Patient 1: Rohit Dhangar
  "pat_101": {
    uid: "pat_101",
    name: "Rohit Dhangar",
    email: "rohit.dhangar@example.com",
    phone: "+919876543210",
    role: "patient",
    healthId: "91-4829-1029-4821",
    // Extended G1Care Web App Fields
    dateOfBirth: "1994-05-15",
    gender: "Male",
    bloodGroup: "O+",
    vitals: { temperature: "98.6 °F", bp: "120/80", heartRate: "76 bpm", spO2: "98%" },
    allergies: ["Penicillin"],
    criticalMeds: ["Paracetamol 500mg"]
  },

  // Demo Patient 2: Priya Sharma
  "pat_102": {
    uid: "pat_102",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+919812345678",
    role: "patient",
    healthId: "91-7721-3094-1182",
    dateOfBirth: "1998-11-20",
    gender: "Female",
    bloodGroup: "A+",
    vitals: { temperature: "98.4 °F", bp: "115/75", heartRate: "72 bpm", spO2: "99%" },
    allergies: ["Sulfa drugs"],
    criticalMeds: ["Thyroxin 50mcg"]
  },

  // Demo Doctor 1: Dr. Ananya Sharma
  "doc_202": {
    uid: "doc_202",
    name: "Dr. Ananya Sharma",
    email: "dr.sharma@aiims.edu.in",
    phone: "+919811223344",
    role: "doctor",
    hospital: "AIIMS New Delhi",
    specialization: "Cardiologist",
    licenseNumber: "MCI-88901",
    verificationStatus: "verified"
  },

  // Demo Doctor 2: Dr. Rajesh Patel
  "doc_303": {
    uid: "doc_303",
    name: "Dr. Rajesh Patel",
    email: "dr.patel@apollo.in",
    phone: "+919822334455",
    role: "doctor",
    hospital: "Apollo Health Clinic",
    specialization: "General Physician",
    licenseNumber: "MCI-991024",
    verificationStatus: "verified"
  }
};

// 2. Android Schema Medical Records ($record_id)
const SEED_MEDICAL_RECORDS = {
  "rec_1001": {
    recordId: "rec_1001",
    patientUid: "pat_101",
    title: "Blood Test Report & CBC",
    type: "Lab Report",
    doctorName: "Dr. Ananya Sharma",
    hospitalName: "AIIMS New Delhi",
    date: "2026-10-05",
    cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1631234567/sample_lab_report.pdf",
    cloudinaryPublicId: "sample_lab_report_pat101",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  "rec_1002": {
    recordId: "rec_1002",
    patientUid: "pat_101",
    title: "Post-Fever Prescription",
    type: "Prescription",
    doctorName: "Dr. Ananya Sharma",
    hospitalName: "AIIMS New Delhi",
    date: "2026-10-08",
    cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1631234568/sample_prescription.pdf",
    cloudinaryPublicId: "sample_prescription_pat101",
    createdAt: Date.now() - 12 * 60 * 60 * 1000
  },
  "rec_1003": {
    recordId: "rec_1003",
    patientUid: "pat_102",
    title: "Thyroid Function Test",
    type: "Lab Report",
    doctorName: "Dr. Rajesh Patel",
    hospitalName: "Apollo Health Clinic",
    date: "2026-09-24",
    cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1631234569/sample_thyroid.pdf",
    cloudinaryPublicId: "sample_thyroid_pat102",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000
  }
};

// 3. Android Schema Access Requests ($request_id)
const SEED_ACCESS_REQUESTS = {
  "req_5001": {
    requestId: "req_5001",
    doctorUid: "doc_202",
    doctorName: "Dr. Ananya Sharma",
    patientUid: "pat_101",
    status: "approved",
    timestamp: Date.now() - 2 * 3600 * 1000
  },
  "req_5002": {
    requestId: "req_5002",
    doctorUid: "doc_303",
    doctorName: "Dr. Rajesh Patel",
    patientUid: "pat_102",
    status: "pending",
    timestamp: Date.now() - 30 * 60 * 1000
  }
};

// 4. Web Gateway Specific Nodes (QR tokens, Active Encounter Sessions & Append-only Records)
const SEED_TOKENS = {
  "DEMO789012": {
    sessionId: "enc_demo_101",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  },
  "PAT2026CODE": {
    sessionId: "enc_demo_102",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }
};

const SEED_SESSIONS = {
  "enc_demo_101": {
    sessionId: "enc_demo_101",
    token: "DEMO789012",
    patientId: "pat_101",
    patientName: "Rohit Dhangar",
    healthId: "91-4829-1029-4821",
    status: "ACTIVE",
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  },
  "enc_demo_102": {
    sessionId: "enc_demo_102",
    token: "PAT2026CODE",
    patientId: "pat_102",
    patientName: "Priya Sharma",
    healthId: "91-7721-3094-1182",
    status: "ACTIVE",
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }
};

const SEED_ENCOUNTERS = {
  "pat_101": [
    {
      encounterId: "enc_rec_101_1",
      patientId: "pat_101",
      providerId: "doc_202",
      providerName: "Dr. Ananya Sharma",
      providerRegistration: "MCI-88901",
      facilityId: "fac_10",
      facilityName: "AIIMS New Delhi",
      encounterDate: "2026-10-08",
      chiefComplaint: "High fever and dry cough",
      diagnosis: "Viral Fever",
      clinicalNotes: "Patient presents with fever. Throat mild congestion. Rest and hydration advised.",
      vitals: { temperatureF: 101.2, bpSystolic: 120, bpDiastolic: 80, pulseBpm: 86, spO2Percent: 98 },
      prescriptions: [{ medicineName: "Paracetamol 500mg", dosage: "500mg", frequency: "Twice Daily", duration: "3 days" }],
      provenance: {
        recordId: "enc_rec_101_1",
        patientId: "pat_101",
        providerName: "Dr. Ananya Sharma",
        facilityName: "AIIMS New Delhi",
        sourceType: "DOCTOR_ENCOUNTER",
        recordStatus: "VERIFIED_ENCOUNTER",
      }
    }
  ],
  "pat_102": [
    {
      encounterId: "enc_rec_102_1",
      patientId: "pat_102",
      providerId: "doc_303",
      providerName: "Dr. Rajesh Patel",
      providerRegistration: "MCI-991024",
      facilityId: "fac_22",
      facilityName: "Apollo Health Clinic",
      encounterDate: "2026-09-24",
      chiefComplaint: "Routine hypothyroidism review",
      diagnosis: "Hypothyroidism",
      clinicalNotes: "TSH levels stable at 2.4 mIU/L. Continue current dosage.",
      vitals: { temperatureF: 98.4, bpSystolic: 115, bpDiastolic: 75, pulseBpm: 72, spO2Percent: 99 },
      prescriptions: [{ medicineName: "Thyroxin 50mcg", dosage: "50mcg", frequency: "Once Daily before breakfast", duration: "30 days" }],
      provenance: {
        recordId: "enc_rec_102_1",
        patientId: "pat_102",
        providerName: "Dr. Rajesh Patel",
        facilityName: "Apollo Health Clinic",
        sourceType: "DOCTOR_ENCOUNTER",
        recordStatus: "VERIFIED_ENCOUNTER",
      }
    }
  ]
};

async function seedUnifiedFirebase() {
  console.log("🌱 Starting Unified G1Care + Android Shared Database Seeding...");

  try {
    // 1. Seed Users (Android + Web shared profiles)
    console.log("  -> Seeding /users node...");
    await fetch(`${FIREBASE_DB_URL}/users.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_USERS),
    });

    // Also populate legacy /patients node for existing web query compatibility
    console.log("  -> Seeding /patients node (for backward compatibility)...");
    await fetch(`${FIREBASE_DB_URL}/patients.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_USERS),
    });

    // 2. Seed Medical Records (Cloudinary attachments & Android uploads)
    console.log("  -> Seeding /medical_records node...");
    await fetch(`${FIREBASE_DB_URL}/medical_records.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_MEDICAL_RECORDS),
    });

    // 3. Seed Access Requests
    console.log("  -> Seeding /access_requests node...");
    await fetch(`${FIREBASE_DB_URL}/access_requests.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_ACCESS_REQUESTS),
    });

    // 4. Seed Encounter QR Tokens
    console.log("  -> Seeding /tokens node...");
    await fetch(`${FIREBASE_DB_URL}/tokens.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_TOKENS),
    });

    // 5. Seed Encounter Sessions
    console.log("  -> Seeding /sessions node...");
    await fetch(`${FIREBASE_DB_URL}/sessions.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_SESSIONS),
    });

    // 6. Seed Patient Encounters
    console.log("  -> Seeding /patient_encounters node...");
    await fetch(`${FIREBASE_DB_URL}/patient_encounters.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SEED_ENCOUNTERS),
    });

    console.log("✅ Unified Realtime Database Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Error seeding Unified Realtime Database:", error);
  }
}

seedUnifiedFirebase();
