# G1Care Hackathon Demo Script

## End-to-End Walkthrough Script

### STEP 1: Patient Open Health QR
1. Open Patient Dashboard.
2. Click **MY HEALTH QR**.
3. Display active dynamic 5-minute QR code (`TOKEN`).

### STEP 2: Doctor Scans QR
1. Open Doctor Dashboard (`/doctor`).
2. Click **SCAN PATIENT QR**.
3. Enter or click **⚡ Auto-Scan Demo Token**.
4. System confirms: **PATIENT FOUND ✓ (Rohit Dhangar)**.

### STEP 3: Doctor Requests Consent
1. Purpose: **General Consultation**.
2. Select scopes: **Diagnoses, Medications, Allergies, Reports, Prescriptions**.
3. Click **REQUEST CONSENT**.

### STEP 4: Patient Grants Access
1. Patient receives instant **Access Request** modal on device.
2. Patient reviews requested categories & duration.
3. Patient clicks **ALLOW ACCESS**.

### STEP 5: Doctor Views Scoped History
1. Doctor screen instantly unlocks session.
2. Doctor sees **Patient Brief** and permitted longitudinal timeline.

### STEP 6: Doctor Creates New Clinical Encounter
1. Doctor clicks **CREATE NEW CLINICAL ENCOUNTER**.
2. Fills Vitals (Temp 101.2°F, BP 120/80, SpO2 98%).
3. Enters Diagnosis (**Viral Fever**) and Prescription (**Paracetamol 500mg**).
4. Clicks **SAVE ENCOUNTER**.

### STEP 7: Patient Realtime Timeline Update & Provenance
1. Patient receives instant notification: **New Health Record Added by Dr. Sharma**.
2. **WHAT CHANGED TODAY** highlight appears at top of patient dashboard.
3. Provenance badge confirms: **Verified Doctor Record (Dr. Sharma, City Care Hospital)**.
4. Access History log updated in **Patient Control Center**.

**Final Statement**: "With G1Care, every consultation does not create another isolated record. It becomes the next verified event in the patient's longitudinal health journey."
