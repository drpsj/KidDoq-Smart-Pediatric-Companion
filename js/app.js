// js/app.js
/**
 * KidDoq: Main Application Bootstrapper
 * Initializes global context and boots the application sequence.
 */

var appSettings = AppStore.getSettings();
var globalPatientsStore = AppStore.getAllPatients(); 
var activePatientId = AppStore.getActivePatientId(); 

let customDrugsStore;
try { customDrugsStore = JSON.parse(localStorage.getItem('custom_drugs')) || { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; } catch(e) { customDrugsStore = { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; }

let currentPatientAgeInMonths = 0; 
let wtChartInstance = null; 
let htChartInstance = null;

const masterToolRegistry = [
    { id: 'prescriptionFeatureView', name: 'Rx & Dosing', icon: 'icon-rx.png' },
    { id: 'certificateFeatureView', name: 'Certificates', icon: 'icon-cert.png' },
    { id: 'growthFeatureView', name: 'Growth Curves', icon: 'icon-growth.png' },
    { id: 'trackerFeatureView', name: 'Vaccination', icon: 'icon-vax.png' },
    { id: 'erFeatureView', name: 'ER & Resus', icon: 'icon-er.png' },
    { id: 'milestoneFeatureView', name: 'Milestones', icon: 'icon-miles.png' },
    { id: 'malnutritionFeatureView', name: 'Triage & MAC', icon: 'icon-triage.png' },
    { id: 'nutritionFeatureView', name: 'Diet Recall', icon: 'icon-diet.png' },
    { id: 'jaundiceFeatureView', name: 'Jaundice', icon: 'icon-jaundice.png' },
    { id: 'asthmaFeatureView', name: 'PRAM Score', icon: 'icon-asthma.png' }
];

document.addEventListener("DOMContentLoaded", function() {
    if (typeof applySettingsToUI === 'function') applySettingsToUI();
    if (typeof populateDrugs === 'function') populateDrugs();
    if (typeof buildMilestoneReference === 'function') buildMilestoneReference();
    if (typeof renderFoodDB === 'function' && typeof window.foodsDb !== 'undefined') renderFoodDB(window.foodsDb);
    
    setTimeout(() => { if(typeof updateGreeting === 'function') updateGreeting(); }, 500); 
    document.querySelectorAll('input[type="number"]').forEach(input => { input.setAttribute('inputmode', 'decimal'); });

    if(typeof activeDoctorId !== 'undefined' && activeDoctorId && typeof doctorProfiles !== 'undefined' && doctorProfiles.length > 0) {
        if(typeof loginAsDoctor === 'function') loginAsDoctor(activeDoctorId);
        if (typeof ViewController !== 'undefined') ViewController.switchNavTab('homeDashboardView');
    } else {
        if(typeof showAuthScreen === 'function') showAuthScreen();
    }

    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) splash.classList.add('hidden');
    }, 2000);
});

// ==========================================
// 🧠 KIDDOQ PREDICTIVE AI ENGINE (COPILOT)
// ==========================================
window.updateCopilot = function(pId) {
    const copilotBanner = document.getElementById('aiCopilotBanner');
    const copilotArea = document.getElementById('aiCopilotSuggestions');
    if (!copilotBanner || !copilotArea) return;

    if (!pId) {
        copilotBanner.style.display = 'none';
        return;
    }

    const p = AppStore.getPatient(pId);
    if (!p) return;

    let suggestions = [];
    let totalMonths = p.totalMonths || ((parseInt(p.ageYrs) || 0) * 12 + (parseInt(p.ageMos) || 0));
    let wt = parseFloat(p.weight) || 0;

    // 1. NEONATAL LOGIC (< 1 Month)
    if (totalMonths < 1) {
        suggestions.push({ icon: '🍼', text: 'Bhutani Jaundice', action: "window.openClinicalTool('jaundiceFeatureView')" });
        suggestions.push({ icon: '⚖️', text: 'Calculate GIR', action: "window.openClinicalTool('erFeatureView'); setTimeout(()=> { if(typeof openErView === 'function') openErView('erNicuView'); }, 100);" });
    }

    // 2. VACCINATION LOGIC (Common Immunization Windows)
    const vaxAges = [1, 2, 3, 9, 15, 18, 60];
    if (vaxAges.some(a => Math.abs(totalMonths - a) <= 1.5)) {
        suggestions.push({ icon: '💉', text: 'Due for Vaccines', action: "window.openClinicalTool('trackerFeatureView')" });
    }

    // 3. MILESTONE LOGIC (Developmental Checks)
    const milesAges = [6, 9, 12, 18, 24, 36];
    if (milesAges.some(a => Math.abs(totalMonths - a) <= 1)) {
        suggestions.push({ icon: '🧠', text: `${totalMonths}M Milestones`, action: "window.openClinicalTool('milestoneFeatureView')" });
    }

    // 4. MALNUTRITION / TRIAGE LOGIC
    if (wt > 0 && totalMonths > 0) {
        // Approximate expected weight to flag severe drops
        let expectedWt = ClinicalMath.calculateExpectedWeight(parseInt(p.ageYrs)||0, parseInt(p.ageMos)||0);
        if (expectedWt && wt <= (expectedWt * 0.75)) {
            suggestions.push({ icon: '🚨', text: 'Triage: Underweight', action: "window.openClinicalTool('malnutritionFeatureView')" });
        }
    }

    // 5. CONTEXTUAL REVIEW
    if (p.rxList && p.rxList.length > 0) {
        suggestions.push({ icon: '💊', text: 'Review Active Meds', action: "window.openClinicalTool('prescriptionFeatureView')" });
    } else {
        suggestions.push({ icon: '📝', text: 'Start Case Sheet', action: "window.openClinicalTool('prescriptionFeatureView')" });
    }

    // RENDER THE UI
    if (suggestions.length === 0) {
        copilotBanner.style.display = 'none';
    } else {
        copilotBanner.style.display = 'block';
        let html = '';
        
        // Render top 4 suggestions prioritized by clinical urgency
        suggestions.slice(0, 4).forEach(s => {
            html += `
            <button onclick="${s.action}" style="background:var(--bg-surface); border:1.5px solid var(--primary-light); color:var(--primary-dark); padding:10px 16px; border-radius:var(--radius-pill); font-size:0.85rem; font-weight:700; display:flex; align-items:center; gap:8px; cursor:pointer; box-shadow:var(--shadow-sm); flex-shrink:0; transition:all 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                <span style="font-size:1.2rem;">${s.icon}</span> ${s.text}
            </button>`;
        });
        copilotArea.innerHTML = html;
    }
};

// ==========================================
// 🔍 CLINICAL SPOTLIGHT (OMNI-SEARCH)
// ==========================================
window.runOmniSearch = function(query) {
    const resBox = document.getElementById('omniSearchResults');
    if (!query || query.length < 2) {
        resBox.style.display = 'none';
        return;
    }

    let q = query.toLowerCase();
    let matches = [];

    // 1. Search Standard Tools
    masterToolRegistry.forEach(t => {
        if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) {
            matches.push({ icon: '🧰', text: `Tool: ${t.name}`, action: `window.openClinicalTool('${t.id}')` });
        }
    });

    // 2. Search Smart Keywords & Auto-Trigger Protocols
    const keywords = {
        'fever': { icon: '🔥', text: 'Protocol: Acute Febrile Illness', action: "window.openClinicalTool('prescriptionFeatureView'); setTimeout(()=> { document.getElementById('orderSetSelect').value='os_fever'; applyOrderSet('os_fever'); }, 200);" },
        'asthma': { icon: '🫁', text: 'Protocol: Asthma Exacerbation', action: "window.openClinicalTool('prescriptionFeatureView'); setTimeout(()=> { document.getElementById('orderSetSelect').value='os_asthma'; applyOrderSet('os_asthma'); }, 200);" },
        'wheeze': { icon: '🫁', text: 'Tool: PRAM Score', action: "window.openClinicalTool('asthmaFeatureView')" },
        'dehydration': { icon: '💧', text: 'Protocol: IV Fluids & Maintenance', action: "window.openClinicalTool('erFeatureView'); setTimeout(()=> { if(typeof openErView === 'function') openErView('erFluidsView'); }, 100);" },
        'burns': { icon: '🔥', text: 'Calculator: Parkland Burns', action: "window.openClinicalTool('erFeatureView'); setTimeout(()=> { if(typeof openErView === 'function') openErView('erFluidsView'); }, 100);" },
        'seizure': { icon: '🧠', text: 'Protocol: Status Epilepticus', action: "window.openClinicalTool('erFeatureView'); setTimeout(()=> { if(typeof openErView === 'function') openErView('erSeizureView'); }, 100);" },
        'diet': { icon: '🍎', text: 'Tracker: 24h Recall', action: "window.openClinicalTool('nutritionFeatureView')" }
    };

    for (let [key, val] of Object.entries(keywords)) {
        if (key.includes(q) || q.includes(key)) {
            // Prevent duplicates if they match multiple ways
            if (!matches.some(m => m.text === val.text)) matches.push(val);
        }
    }

    // RENDER RESULTS
    if (matches.length === 0) {
        resBox.innerHTML = `<div style="padding:15px; color:var(--text-muted); text-align:center; font-weight:600;">No direct matches found.</div>`;
    } else {
        let html = '';
        matches.forEach(m => {
            html += `<div onclick="${m.action}; document.getElementById('omniSearchResults').style.display='none'; document.getElementById('omniSearchInput').value='';" style="padding:16px 12px; border-bottom:1px solid var(--border-soft); display:flex; align-items:center; gap:12px; cursor:pointer; border-radius:8px; transition:all 0.2s;" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
                <span style="font-size:1.4rem;">${m.icon}</span>
                <span style="font-weight:700; color:var(--primary-dark); font-size:1rem;">${m.text}</span>
            </div>`;
        });
        resBox.innerHTML = html;
    }
    resBox.style.display = 'block';
};

// Global click listener to close the search box if you tap away
document.addEventListener('click', function(e) {
    const searchInput = document.getElementById('omniSearchInput');
    const searchBox = document.getElementById('omniSearchResults');
    if (searchInput && searchBox && e.target !== searchInput && !searchBox.contains(e.target)) {
        searchBox.style.display = 'none';
    }
});