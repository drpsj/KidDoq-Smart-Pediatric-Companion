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
        suggestions.push({ icon: '📝', text: 'Start Case File', action: "window.openClinicalTool('prescriptionFeatureView')" });
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

// ==========================================
// 📏 SMART BMI CALCULATOR (DASHBOARD)
// ==========================================
window.runHomeBmiCalc = function() {
    const wt = parseFloat(document.getElementById('homeBmiWt').value);
    const htCm = parseFloat(document.getElementById('homeBmiHt').value);
    const resBox = document.getElementById('homeBmiResult');

    if (!wt || !htCm || htCm <= 0) {
        resBox.innerHTML = `
            <div style="text-align:center; padding:15px; color:rgba(255,255,255,0.8); font-size:0.9rem; border:1px dashed rgba(255,255,255,0.3); border-radius:8px;">
                Enter weight and height to classify BMI based on WHO & Asian criteria.
            </div>`;
        return;
    }

    const htM = htCm / 100;
    const bmi = wt / (htM * htM);

    // Standard WHO
    let whoClass = "Normal"; let whoColor = "var(--success)";
    if (bmi < 18.5) { whoClass = "Underweight"; whoColor = "var(--warning)"; }
    else if (bmi >= 25 && bmi <= 29.9) { whoClass = "Overweight"; whoColor = "var(--warning)"; }
    else if (bmi >= 30) { whoClass = "Obese"; whoColor = "var(--danger)"; }

    // Asian Pacific Guidelines
    let asianClass = "Normal"; let asianColor = "var(--success)";
    if (bmi < 18.5) { asianClass = "Underweight"; asianColor = "var(--warning)"; }
    else if (bmi >= 23 && bmi <= 24.9) { asianClass = "Overweight (At Risk)"; asianColor = "var(--warning)"; }
    else if (bmi >= 25) { asianClass = "Obese"; asianColor = "var(--danger)"; }

    resBox.innerHTML = `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; text-align:center; box-shadow:var(--shadow-md);">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Calculated BMI</div>
            <div style="font-size:2.8rem; color:var(--text-main); font-weight:900; margin:5px 0; line-height:1;">${bmi.toFixed(1)}</div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px; text-align:left;">
                <div style="padding:10px; border-radius:6px; border:1px solid var(--border-soft); background:rgba(91,97,246,0.05);">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:bold; text-transform:uppercase;">WHO Standard</div>
                    <div style="color:${whoColor}; font-weight:800; font-size:0.9rem;">${whoClass}</div>
                </div>
                <div style="padding:10px; border-radius:6px; border:1px solid var(--border-soft); background:rgba(225,29,72,0.05);">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:bold; text-transform:uppercase;">Asian Criteria</div>
                    <div style="color:${asianColor}; font-weight:800; font-size:0.9rem;">${asianClass}</div>
                </div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:10px;">*Note: For children <18y, IAP/WHO BMI percentiles are preferred for exact clinical diagnosis.</div>
        </div>
    `;
};