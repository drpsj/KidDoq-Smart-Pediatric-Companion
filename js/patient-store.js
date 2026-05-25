// js/patient-store.js

/**
 * KidDoq Patient Data Repository
 * Currently uses localStorage, structured asynchronously to allow seamless
 * drop-in of Firebase/Supabase in the future.
 */

const DB = {
    // --- 1. CONFIGURATION (Prep for Cloud Auth) ---
    _tenantMeta: {
        doctorId: "doc_local_admin", // Will be replaced by Firebase Auth UID later
        clinicId: "clinic_local_01"
    },

    // --- 2. NETWORK SIMULATION ---
    // Simulates cloud latency to ensure UI doesn't break when moving to async backend
    _delay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

    // --- 3. CORE CRUD OPERATIONS ---

    // Fetch the entire patient roster (for the database search view)
    getAllPatients: async function() {
        await this._delay();
        try {
            return JSON.parse(localStorage.getItem('nis_patients')) || {};
        } catch (e) {
            console.error("Local DB Corruption Error:", e);
            return {};
        }
    },

    // Fetch a specific patient by ID
    getPatient: async function(patientId) {
        await this._delay();
        const patients = await this.getAllPatients();
        return patients[patientId] || null;
    },

    // Save or update a patient record
    savePatient: async function(patientData) {
        await this._delay();
        const patients = await this.getAllPatients();

        // Inject tenant metadata if it's a new record
        if (!patientData._meta) {
            patientData._meta = {
                createdAt: new Date().toISOString(),
                createdBy: this._tenantMeta.doctorId,
                clinicId: this._tenantMeta.clinicId
            };
        }
        patientData._meta.lastUpdated = new Date().toISOString();

        patients[patientData.id] = patientData;
        localStorage.setItem('nis_patients', JSON.stringify(patients));
        return patientData;
    },

    // Delete a patient (Prep for privacy compliance)
    deletePatient: async function(patientId) {
        await this._delay();
        const patients = await this.getAllPatients();
        if(patients[patientId]) {
            delete patients[patientId];
            localStorage.setItem('nis_patients', JSON.stringify(patients));
            return true;
        }
        return false;
    }
};