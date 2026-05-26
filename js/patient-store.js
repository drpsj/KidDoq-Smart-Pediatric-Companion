// js/patient-store.js

/**
 * KidDoq Firebase Database Bridge
 * Seamlessly connects the local AppStore to Google Cloud Firestore.
 */

// 1. YOUR FIREBASE KEYS (Paste the config you copied from Phase 2 here)
const firebaseConfig = {
    apiKey: "AIzaSyAEjBBT-K3MA-zLD4UDoVwcyD5yMIuUbpk",
    authDomain: "kiddoq.firebaseapp.com",
    projectId: "kiddoq",
    storageBucket: "kiddoq.firebasestorage.app",
    messagingSenderId: "287851471860",
    appId: "1:287851471860:web:8dcded798b97ce20b78fa1"
  };

// 2. INITIALIZE FIREBASE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

// 3. THE DB OBJECT (Acts as our background Cloud Sync)
const DB = {
    
    // Fetch all patients (For the main dashboard list)
    getAllPatients: async function() {
        try {
            const snapshot = await firestore.collection('patients').get();
            let patients = {};
            snapshot.forEach(doc => {
                patients[doc.id] = doc.data();
            });
            return patients;
        } catch (error) {
            console.error("🔥 Firebase Read Error:", error);
            return {};
        }
    },

    // Save or update a patient record seamlessly in the background
    savePatient: async function(patientData) {
        if (!patientData || !patientData.id) return null;
        
        try {
            // Update the cloud timestamp
            if (!patientData._meta) patientData._meta = {};
            patientData._meta.lastUpdated = new Date().toISOString();

            // Push to Firestore (merge: true ensures we don't accidentally overwrite missing fields)
            await firestore.collection('patients').doc(patientData.id).set(patientData, { merge: true });
            
            console.log(`☁️ Synced to Cloud: ${patientData.name}`);
            return patientData;
        } catch (error) {
            console.error("🔥 Firebase Write Error:", error);
            return null;
        }
    }
};