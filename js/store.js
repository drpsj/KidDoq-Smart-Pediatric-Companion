// js/store.js
/**
 * KidDoq Central State Manager (The "Vault")
 * No other file is allowed to directly mutate patient data or settings.
 * They must use the methods provided by this store.
 */

const AppStore = (function() {
    // --- PRIVATE VARIABLES (Cannot be accessed from outside) ---
    let _settings = {};
    let _patients = {};
    let _customDrugs = {};
    let _activePatientId = null;

    // --- INITIALIZATION ---
    function init() {
        try { _settings = JSON.parse(localStorage.getItem('clinic_settings')) || _getDefaultSettings(); } 
        catch(e) { _settings = _getDefaultSettings(); }

        try { _patients = JSON.parse(localStorage.getItem('nis_patients')) || {}; } 
        catch(e) { _patients = {}; }
        
        try { _customDrugs = JSON.parse(localStorage.getItem('custom_drugs')) || _getDefaultCustomDrugs(); } 
        catch(e) { _customDrugs = _getDefaultCustomDrugs(); }

        console.log("🔒 AppStore Initialized Successfully.");
    }

    // Default Fallbacks
    function _getDefaultSettings() {
        return { docName: "Dr. Peter Suraj Joseph", qual: "MBBS, MD (Pediatrics)", regNo: "", clinicName: "Pediatric Clinical Hub", tagline: "", phone: "", address: "", logo: "", isDark: false, quickTools: ['erFeatureView', 'prescriptionFeatureView', 'growthFeatureView', 'trackerFeatureView'] };
    }
    function _getDefaultCustomDrugs() {
        return { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] };
    }

    // --- PUBLIC API (The only way to read/write data) ---
    return {
        init: init,

        // --- SETTINGS MANAGEMENT ---
        getSettings: () => ({ ..._settings }), // Returns a safe copy
        updateSettings: (newSettings) => {
            _settings = { ..._settings, ...newSettings };
            localStorage.setItem('clinic_settings', JSON.stringify(_settings));
        },

        // --- ACTIVE SESSION MANAGEMENT ---
        setActivePatient: (id) => { _activePatientId = id; },
        getActivePatientId: () => _activePatientId,
        clearActivePatient: () => { _activePatientId = null; },

        // --- PATIENT DATA MANAGEMENT ---
        getAllPatients: () => ({ ..._patients }), // Safe copy
        getPatient: (id) => {
            if (!_patients[id]) return null;
            return JSON.parse(JSON.stringify(_patients[id])); // Deep clone prevents accidental mutation
        },
        savePatient: (patientObj) => {
            if (!patientObj || !patientObj.id) return false;
            
            // Add metadata if new
            if (!patientObj._meta) {
                patientObj._meta = { createdAt: new Date().toISOString() };
            }
            patientObj._meta.lastUpdated = new Date().toISOString();

            _patients[patientObj.id] = patientObj;
            localStorage.setItem('nis_patients', JSON.stringify(_patients));
            return true;
        },
        
        // --- SPECIFIC CLINICAL ACTIONS (Isolated Logic) ---
        addPrescriptionToActivePatient: (rxObj) => {
            if (!_activePatientId || !_patients[_activePatientId]) return false;
            
            let p = _patients[_activePatientId];
            if (!p.rxList) p.rxList = [];
            p.rxList.push(rxObj);
            
            localStorage.setItem('nis_patients', JSON.stringify(_patients));
            return true;
        }
    };
})();

// Initialize the store immediately
AppStore.init();