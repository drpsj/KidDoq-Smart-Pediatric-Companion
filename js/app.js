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
// 🌐 DYNAMIC VIEW LOADER (Combats HTML Bloat)
// ==========================================
window.ViewLoader = {
    loadedViews: new Set(),
    async loadAndOpen(viewId) {
        const container = document.getElementById(viewId);
        
        // Fetch external HTML if not loaded yet
        if (container && container.dataset.external && !this.loadedViews.has(viewId)) {
            try {
                const response = await fetch(container.dataset.external);
                if (!response.ok) throw new Error("Network response was not ok");
                const html = await response.text();
                container.innerHTML = html;
                this.loadedViews.add(viewId);
            } catch (err) {
                console.error("Failed to load view:", viewId, err);
                container.innerHTML = `<div class="tool-result danger" style="margin:20px;">Failed to load module. Ensure you are running a local server (e.g., Live Server) for fetch() to work.</div>`;
            }
        }
        
        // Route to original open function safely
        if (typeof window.openClinicalTool === 'function') {
            window.openClinicalTool(viewId);
        }
    }
};

// ==========================================
// 📈 PEDIATRIC PREDICTIVE VITALS ENGINE
// ==========================================
window.predictExpectedVitals = ClinicalMath.predictExpectedVitals;

// 1. Intercept Registry Modal Inputs
window.estimateWeightFromAge = function() {
    let yrs = parseInt(document.getElementById('ageYrs').value) || 0;
    let mos = parseInt(document.getElementById('ageMos').value) || 0;
    let expected = predictExpectedVitals(yrs, mos);

    let wtInput = document.getElementById('pWeight');
    let htInput = document.getElementById('htCm');
    let hcInput = document.getElementById('hcCm');
    
    // Auto-fill only if the field is empty, allowing manual overrides
    if (wtInput && wtInput.value === "" && expected.wt) wtInput.value = expected.wt;
    if (htInput && htInput.value === "" && expected.ht) htInput.value = expected.ht;
    if (hcInput && hcInput.value === "" && expected.hc) hcInput.value = expected.hc;
    
    if(typeof saveAndRegisterPatient === 'function') saveAndRegisterPatient(true);
};

// 2. Intercept Dashboard HUD Inputs
window.syncHudAge = function() {
    const yrs = parseInt(document.getElementById('hudAgeYrs').value) || 0;
    const mos = parseInt(document.getElementById('hudAgeMos').value) || 0;
    document.getElementById('hudAge').value = (yrs * 12) + mos;

    let expected = predictExpectedVitals(yrs, mos);
    let wtInput = document.getElementById('hudWeight');
    let htInput = document.getElementById('hudHeight');
    let hcInput = document.getElementById('hudHc');
    let macInput = document.getElementById('hudMac');

    if (wtInput && wtInput.value === "" && expected.wt) wtInput.value = expected.wt;
    if (htInput && htInput.value === "" && expected.ht) htInput.value = expected.ht;
    if (hcInput && hcInput.value === "" && expected.hc) hcInput.value = expected.hc;
    if (macInput && macInput.value === "" && expected.mac) macInput.value = expected.mac;
};

// --- NEW: DIRECT REGISTRY SHORTCUT ---
window.openPrefilledRegistry = function() {
    // Copy data from HUD to Modal
    document.getElementById('ageYrs').value = document.getElementById('hudAgeYrs').value || "";
    document.getElementById('ageMos').value = document.getElementById('hudAgeMos').value || "";
    document.getElementById('pWeight').value = document.getElementById('hudWeight').value || "";
    document.getElementById('htCm').value = document.getElementById('hudHeight').value || "";
    
    let hcInput = document.getElementById('hcCm');
    if(hcInput) hcInput.value = document.getElementById('hudHc') ? document.getElementById('hudHc').value : "";
    
    document.getElementById('gender').value = document.getElementById('hudGender').value || "male";
    
    // Open Modal
    document.getElementById('registryModal').classList.add('active');
    if(typeof showSystemToast === 'function') showSystemToast("✨ Vitals Copied. Enter Name to save to database.");
};

// --- NEW: Teleport function from HUD to Tracker ---
window.launchVaxToolFromHud = function() {
    const pId = AppStore.getActivePatientId();
    if (!pId) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please Save Patient in the Cockpit first.");
        return;
    }
    // Launch the tool
    if(typeof openClinicalTool === 'function') openClinicalTool('vaxFeatureView');
    
    // Auto-calculate the timeline using the exact engine you provided
    setTimeout(() => {
        if(typeof calculateAndRenderTimeline === 'function') calculateAndRenderTimeline(pId);
    }, 100);
};

window.populateHudDrugs = function() {
    const cat = document.getElementById('hudQuickCat').value;
    const formSelect = document.getElementById('hudQuickForm');
    formSelect.innerHTML = '<option value="">-- Select Formulation --</option>';
    if(!cat) {
        document.getElementById('hudQuickDoseRes').innerHTML = '';
        return;
    }
    
    let db = typeof getUnifiedDB === 'function' ? getUnifiedDB() : window.drugsDb;
    if(!db) return;
    const filtered = db.filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
    runHudQuickDose();
};

window.runHudQuickDose = function() {
    const wt = parseFloat(document.getElementById('hudWeight').value);
    const drugId = document.getElementById('hudQuickForm').value;
    const res = document.getElementById('hudQuickDoseRes');
    if(!res) return;

    if(!wt) { 
        res.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:8px; border:1px dashed rgba(255,255,255,0.4); text-align:center;">⚠️ Enter patient weight at the top to calculate dose.</div>`; 
        return; 
    }
    if(!drugId) { res.innerHTML = ''; return; }
    
    let db = typeof getUnifiedDB === 'function' ? getUnifiedDB() : window.drugsDb;
    if(!db) return;
    const drug = db.find(d => d.id === drugId);
    if(!drug) return;

    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    
    let warnHTML = math.isMax ? `<div style="color:#fca5a5; font-size:0.85rem; font-weight:bold; margin-top:8px;">⚠️ Adult Max Cap Enforced</div>` : "";
    if (drug.warnings && drug.warnings.length > 0) {
        warnHTML += `<div style="color:#fef08a; font-size:0.8rem; margin-top:8px; text-align:left; line-height:1.4;">${drug.warnings.join("<br>")}</div>`;
    }
    let indHTML = "";
    if (drug.indications && drug.indications.length > 0) {
        indHTML = `<div style="margin-top:10px; margin-bottom:5px;">` + drug.indications.map(i => `<span style="background:rgba(255,255,255,0.2); color:#fff; padding:2px 8px; border-radius:12px; font-size:0.7rem; margin-right:4px; display:inline-block; font-weight:bold; border:1px solid rgba(255,255,255,0.3);">${i}</span>`).join("") + `</div>`;
    }

    res.innerHTML = `
        <div style="background:rgba(255,255,255,0.15); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.3); text-align:center; margin-top:15px; backdrop-filter: blur(5px);">
            <div style="font-size:0.85rem; color:rgba(255,255,255,0.8); text-transform:uppercase; font-weight:bold;">Administer Quantity</div>
            <div style="font-size:3rem; color:#fff; font-weight:900; margin:5px 0; line-height:1;">${math.reqVol.toFixed(1)} <span style="font-size:1.2rem; opacity:0.8;">${unit}</span></div>
            <div style="font-size:1rem; color:var(--primary-dark); font-weight:800; background:#fff; padding:5px 12px; border-radius:20px; display:inline-block; box-shadow:0 4px 6px rgba(0,0,0,0.1); margin-bottom:5px;">${drug.defaultFreq}</div>
            ${indHTML}
            <div style="font-size:0.85rem; color:rgba(255,255,255,0.7); margin-top:10px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.3);">Target: ${math.reqMg.toFixed(0)} mg/dose</div>
            ${warnHTML}
        </div>
    `;
};

window.printGhostFile = function() {
    const wt = document.getElementById('hudWeight').value;
    const yrs = document.getElementById('hudAgeYrs').value || "0";
    const mos = document.getElementById('hudAgeMos').value || "0";
    
    if(!wt) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Enter Weight to print Quick-Sheet.");
        return;
    }

    const engine = document.getElementById('printEngine'); 
    
    let vitalsHtml = document.getElementById('hudVitalsOutput').innerHTML;
    let pcm = (wt * 15) / 24; 
    let ibu = (wt * 10) / 20; 

    let html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">PEDIATRIC QUICK-SHEET</h2>
            <div style="display:flex; justify-content:space-between; margin-bottom: 20px; font-weight:bold; font-size:1.1rem;">
                <span>Age: ${yrs} Yrs ${mos} Mos</span>
                <span>Weight: ${wt} kg</span>
            </div>
            
            <h3 style="background:#f1f5f9; padding:5px;">Growth & Vitals</h3>
            <div style="margin-bottom:20px; font-size:1rem;">${vitalsHtml}</div>

            <h3 style="background:#f1f5f9; padding:5px;">Emergency / Fever Quick Dose</h3>
            <table style="width:100%; border-collapse: collapse; margin-bottom:20px;">
                <tr><td style="padding:8px; border:1px solid #ccc;"><b>Paracetamol (120mg/5ml)</b></td><td style="padding:8px; border:1px solid #ccc; font-weight:bold;">${pcm.toFixed(1)} mL (SOS)</td></tr>
                <tr><td style="padding:8px; border:1px solid #ccc;"><b>Ibuprofen (100mg/5ml)</b></td><td style="padding:8px; border:1px solid #ccc; font-weight:bold;">${ibu.toFixed(1)} mL (SOS)</td></tr>
            </table>

            <div style="font-size:0.8rem; color:#666; text-align:center; border-top:1px dashed #ccc; padding-top:10px; margin-top:30px;">
                *Clinical reference only. Do not administer without doctor confirmation.
            </div>
        </div>
    `;
    
    engine.innerHTML = html;
    const style = document.createElement('style');
    style.innerHTML = `@media print { body > *:not(#printEngine) { display: none !important; } #printEngine { display: block !important; position: static !important; } }`;
    document.head.appendChild(style);
    
    setTimeout(() => {
        window.print();
        setTimeout(() => { engine.innerHTML = ""; style.remove(); }, 500);
    }, 250);
};

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
// 🚀 MAGIC HUD ENGINE & PREDICTIVE VITALS
// ==========================================

window.broadcastGlobalParameters = function() {
    // 🚀 THE FIX: Use optional chaining (?.) so it never crashes if an ID is missing
    const ageMos = parseInt(document.getElementById('hudAge')?.value) || 0;
    const wt = parseFloat(document.getElementById('hudWeight')?.value) || 0;
    
    // Check for both hudHeight AND hudHt safely
    const htEl = document.getElementById('hudHeight') || document.getElementById('hudHt');
    const ht = htEl ? parseFloat(htEl.value) : 0;
    
    let hcInput = document.getElementById('hudHc');
    let macInput = document.getElementById('hudMac');
    const hc = hcInput ? parseFloat(hcInput.value) || 0 : 0;
    const mac = macInput ? parseFloat(macInput.value) || 0 : 0;
    const gender = document.getElementById('hudGender')?.value || 'male';

    const neoView = document.getElementById('hudNeonatalContext');
    const pedView = document.getElementById('hudPediatricContext');
    
    if (neoView && pedView) {
        if (ageMos > 0 && ageMos < 1) { 
            neoView.style.display = 'flex'; pedView.style.display = 'none'; 
        } else { 
            neoView.style.display = 'none'; pedView.style.display = 'flex'; 
        }
    }

    // Safely fire all the downstream rendering engines
    if(typeof renderHudGrowth === 'function') renderHudGrowth(wt, ht, ageMos, gender);
    if(typeof renderHudAnthro === 'function') window.renderHudAnthro(hc, mac, ageMos);
    if(typeof renderHudVitals === 'function') renderHudVitals(ageMos);
    if(typeof renderHudFluids === 'function') renderHudFluids(wt, ageMos);
    if(typeof window.renderMilestonesAndRedFlags === 'function') window.renderMilestonesAndRedFlags(ageMos);
    if(typeof window.renderVaccinesDue === 'function') window.renderVaccinesDue(ageMos);
    if(typeof renderHudSmartCards === 'function') renderHudSmartCards(wt);
    
    if(typeof runHudQuickDose === 'function') runHudQuickDose();
};

function renderHudGrowth(wt, ht, ageMos, gender) {
    const out = document.getElementById('hudGrowthOutput');
    if(!out) return;
    if(!wt || !ht || !ageMos) { out.innerHTML = 'Enter Wt, Ht & Age to view triage.'; out.className = 'hud-empty-state'; return; }
    
    let expectedWt = 0; let ageYrs = ageMos/12;
    if(ageYrs < 1) expectedWt = (ageMos + 9) / 2;
    else if (ageYrs <= 6) expectedWt = (ageYrs * 2) + 8;
    else if (ageYrs <= 12) expectedWt = (ageYrs * 7 - 5) / 2;
    else expectedWt = wt; 

    let wfaPercent = (wt / expectedWt) * 100;
    let wfaLight = "🟢 Normal"; let wfaColor = "var(--success)";
    if(wfaPercent < 60) { wfaLight = "🔴 Severe (SAM)"; wfaColor = "var(--danger)"; }
    else if(wfaPercent < 80) { wfaLight = "🟡 Mod (MAM)"; wfaColor = "var(--warning)"; }

    const htM = ht / 100;
    const bmi = wt / (htM * htM);
    
    let bmiLight = "🟢 Normal"; let bmiColor = "var(--success)";
    if (bmi < 14) { bmiLight = "🔴 SAM/Severe Wasting"; bmiColor = "var(--danger)"; }
    else if (bmi < 15.5) { bmiLight = "🟡 MAM/Wasting"; bmiColor = "var(--warning)"; }
    else if (bmi > 25) { bmiLight = "🔴 Overweight/Obese"; bmiColor = "var(--danger)"; }

    out.className = '';
    out.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:5px;">
            <span>Weight-for-Age:</span> <b style="color:${wfaColor};">${wfaLight}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:5px;">
            <span>Height-for-Age:</span> <b style="color:var(--success);">🟢 Normal</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span>BMI Classification:</span> <b style="color:${bmiColor};">${bmiLight}</b>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px; text-align:center;">
            Raw BMI: ${bmi.toFixed(1)} | Expected Wt: ~${expectedWt.toFixed(1)}kg
        </div>
    `;
}

window.renderHudAnthro = function(hc, mac, ageMos) {
    const out = document.getElementById('hudAnthroOutput');
    if(!out) return;
    if(!hc && !mac) { out.innerHTML = 'Enter HC & MAC for alerts.'; out.className = 'hud-empty-state'; return; }
    
    let expected = predictExpectedVitals(Math.floor(ageMos/12), ageMos % 12);
    
    let hcHtml = "";
    if (hc) {
        let hcStat = "Normal"; let hcCol = "var(--success)";
        if (expected.hc) {
            let diff = hc - expected.hc;
            if (diff <= -2.5) { hcStat = "Microcephaly Risk"; hcCol = "var(--danger)"; }
            else if (diff >= 2.5) { hcStat = "Macrocephaly Risk"; hcCol = "var(--warning)"; }
        }
        hcHtml = `<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:5px;"><span>HC (${hc} cm):</span> <b style="color:${hcCol};">${hcStat}</b></div>`;
    }

    let macHtml = "";
    if (mac) {
        let macStat = "Normal (>12.5)"; let macCol = "var(--success)";
        if (ageMos >= 6 && ageMos <= 60) {
            if (mac < 11.5) { macStat = "SAM (< 11.5)"; macCol = "var(--danger)"; }
            else if (mac >= 11.5 && mac <= 12.5) { macStat = "MAM (11.5 - 12.5)"; macCol = "var(--warning)"; }
        } else {
            macStat = "Evaluated"; macCol = "var(--text-main)";
        }
        macHtml = `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>MAC (${mac} cm):</span> <b style="color:${macCol};">${macStat}</b></div>`;
    }

    out.className = '';
    out.innerHTML = `${hcHtml}${macHtml}`;
};

function renderHudVitals(ageMos) {
    const out = document.getElementById('hudVitalsOutput');
    if(!out) return;
    if(!ageMos) { out.innerHTML = 'Enter Age for normal ranges.'; out.className = 'hud-empty-state'; return; }
    let hr = "80 - 120"; let rr = "20 - 30"; let sbp = "90 - 110";
    let ageYrs = ageMos / 12;
    
    if(ageMos < 1) { hr = "100 - 160"; rr = "40 - 60"; sbp = "60 - 80"; }
    else if(ageMos < 12) { hr = "90 - 150"; rr = "30 - 40"; sbp = "70 - 90"; }
    else if(ageYrs <= 5) { hr = "80 - 140"; rr = "22 - 34"; sbp = "80 - 100"; }
    else if(ageYrs <= 12) { hr = "70 - 120"; rr = "18 - 30"; sbp = "90 - 110"; }
    else { hr = "60 - 100"; rr = "12 - 20"; sbp = "100 - 120"; }

    let bp95 = "";
    if (ageYrs >= 1 && ageYrs <= 17) {
        let sys95 = 90 + (2 * Math.floor(ageYrs));
        let dia95 = 60 + (2 * Math.floor(ageYrs));
        bp95 = `<div style="margin-top:8px; font-size:0.8rem; color:var(--danger); border-top:1px dashed var(--border-soft); padding-top:5px;"><b>95th %ile (Stage 1 HTN):</b> &ge; ${sys95}/${dia95}</div>`;
    } else if (ageMos < 12) {
        bp95 = `<div style="margin-top:8px; font-size:0.8rem; color:var(--danger); border-top:1px dashed var(--border-soft); padding-top:5px;"><b>95th %ile:</b> &ge; 105/70</div>`;
    }

    out.className = '';
    out.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:5px;"><span>Heart Rate:</span> <b>${hr} bpm</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:5px;"><span>Resp Rate:</span> <b>${rr} /min</b></div>
        <div style="display:flex; justify-content:space-between;"><span>Typical Systolic:</span> <b>${sbp} mmHg</b></div>
        ${bp95}
    `;
}

function renderHudFluids(wt, ageMos) {
    const out = document.getElementById('hudFluidsOutput');
    if(!out) return;
    if(!wt) { out.innerHTML = 'Enter Wt & Age for targets.'; out.className = 'hud-empty-state'; return; }
    
    let fluid = 0;
    if(wt <= 10) fluid = wt * 100;
    else if(wt <= 20) fluid = 1000 + ((wt-10)*50);
    else fluid = 1500 + ((wt-20)*20);
    let hrRate = fluid / 24;

    let cals = 0; let pro = 0;
    if (ageMos < 6) { cals = wt * 92; pro = wt * 1.16; }
    else if (ageMos < 12) { cals = wt * 80; pro = wt * 1.69; }
    else if (ageMos < 48) { cals = 1060; pro = 16.7; }
    else if (ageMos < 84) { cals = 1350; pro = 20.1; }
    else if (ageMos < 120) { cals = 1690; pro = 29.5; }
    else { cals = wt * 60; pro = wt * 1.0; }

    out.className = '';
    out.innerHTML = `
        <div style="font-size:1.6rem; font-weight:900; color:#0ea5e9; text-align:center; margin-bottom:5px;">${fluid.toFixed(0)} <span style="font-size:0.9rem; font-weight:600; color:var(--text-muted);">mL/day (or ${hrRate.toFixed(1)} mL/hr)</span></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; border-top:1px dashed var(--border-soft); padding-top:10px; text-align:center;">
            <div style="background:#fef3c7; padding:8px; border-radius:6px; border:1px solid #fde68a;">
                <div style="font-size:0.75rem; color:#b45309; font-weight:bold; text-transform:uppercase;">Energy</div>
                <div style="color:#92400e; font-weight:800; font-size:1.1rem;">${cals.toFixed(0)} <span style="font-size:0.75rem;">kcal</span></div>
            </div>
            <div style="background:#e0e7ff; padding:8px; border-radius:6px; border:1px solid #bfdbfe;">
                <div style="font-size:0.75rem; color:#1d4ed8; font-weight:bold; text-transform:uppercase;">Protein</div>
                <div style="color:#1e3a8a; font-weight:800; font-size:1.1rem;">${pro.toFixed(1)} <span style="font-size:0.75rem;">g</span></div>
            </div>
        </div>
    `;
}

function renderHudRedFlags(ageMos) {
    const out = document.getElementById('hudRedFlagsOutput');
    if(!out) return;
    if(!ageMos && ageMos !== 0) { out.innerHTML = 'Enter Age for clinical warnings.'; out.className = 'hud-empty-state'; return; }
    let flags = [];
    if(ageMos < 3) flags.push("Fever >38°C (100.4°F) requires urgent evaluation.");
    if(ageMos < 12) flags.push("Strictly avoid Honey (Botulism risk).");
    if(ageMos < 48) flags.push("Avoid OTC cough/cold syrups.");
    if(ageMos >= 6 && ageMos <= 60) flags.push("Monitor for febrile seizures during spikes.");

    if(flags.length === 0) flags.push("No specific high-risk age alerts active.");

    out.className = '';
    out.innerHTML = `<ul style="margin:0; padding-left:18px; color:var(--danger); font-size:0.85rem; line-height:1.6;">${flags.map(f=>`<li style="margin-bottom:6px;"><b>${f}</b></li>`).join('')}</ul>`;
}

function renderHudSmartCards(wt) {
    const out = document.getElementById('hudSmartDoseCards');
    if(!out) return;
    if(!wt) { out.innerHTML = '<div class="hud-empty-state" style="width:100%;">Enter Wt to unlock Quick Cards.</div>'; return; }

    let pcm120 = (wt * 15) / (120/5);
    let pcm250 = (wt * 15) / (250/5);
    let ibu = (wt * 10) / (100/5);
    let amox228 = (wt * 40) / (200/5);
    let amox457 = (wt * 40) / (400/5);

    const cardStyle = `scroll-snap-align: start; flex: 0 0 130px; background: rgba(91,97,246,0.05); border: 1px solid var(--primary-light); padding: 10px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);`;
    
    out.innerHTML = `
        <div style="${cardStyle} border-color:#fca5a5; background:rgba(254,226,226,0.3);">
            <div style="font-size:0.75rem; color:#e11d48; font-weight:800;">Paracetamol</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">120mg/5mL</div>
            <div style="font-size:1.6rem; font-weight:900; color:#9f1239;">${pcm120.toFixed(1)} <span style="font-size:0.8rem;">mL</span></div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">SOS (Q6H)</div>
        </div>
        <div style="${cardStyle} border-color:#fca5a5; background:rgba(254,226,226,0.3);">
            <div style="font-size:0.75rem; color:#e11d48; font-weight:800;">Paracetamol</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">250mg/5mL</div>
            <div style="font-size:1.6rem; font-weight:900; color:#9f1239;">${pcm250.toFixed(1)} <span style="font-size:0.8rem;">mL</span></div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">SOS (Q6H)</div>
        </div>
        <div style="${cardStyle} border-color:#fdba74; background:rgba(254,243,199,0.4);">
            <div style="font-size:0.75rem; color:#d97706; font-weight:800;">Ibuprofen</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">100mg/5mL</div>
            <div style="font-size:1.6rem; font-weight:900; color:#b45309;">${ibu.toFixed(1)} <span style="font-size:0.8rem;">mL</span></div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">SOS (Q8H)</div>
        </div>
        <div style="${cardStyle}">
            <div style="font-size:0.75rem; color:var(--primary); font-weight:800;">Co-Amoxiclav</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">228mg/5mL</div>
            <div style="font-size:1.6rem; font-weight:900; color:var(--primary-dark);">${amox228.toFixed(1)} <span style="font-size:0.8rem;">mL</span></div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">BID</div>
        </div>
        <div style="${cardStyle}">
            <div style="font-size:0.75rem; color:var(--primary); font-weight:800;">Co-Amoxiclav</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">457mg/5mL</div>
            <div style="font-size:1.6rem; font-weight:900; color:var(--primary-dark);">${amox457.toFixed(1)} <span style="font-size:0.8rem;">mL</span></div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-top:2px;">BID</div>
        </div>
    `;
}

// ==========================================
// KINETIC UI JAVASCRIPT CONTROLLERS
// ==========================================

// 1. Hardware-Accelerated Number Counter
function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Use an ease-out cubic curve for the number rolling
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = (progress * (end - start) + start).toFixed(0);
        
        obj.innerHTML = currentVal;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end; // Ensure exact final value
        }
    };
    window.requestAnimationFrame(step);
}

// 2. Circadian Ambient Lighting
function setCircadianLighting() {
    const hour = new Date().getHours();
    const root = document.documentElement;
    
    // Smooth transition between states
    root.style.setProperty('transition', 'background-color 2s ease, --bg-surface 2s ease');

    if (hour >= 5 && hour < 12) {
        // Morning: Cyan Tint
        root.style.setProperty('--bg-surface', 'rgba(10, 25, 35, 0.35)');
    } else if (hour >= 12 && hour < 17) {
        // Afternoon: Neutral Deep Blue
        root.style.setProperty('--bg-surface', 'rgba(15, 15, 25, 0.4)');
    } else if (hour >= 17 && hour < 21) {
        // Evening: Blue-Violet
        root.style.setProperty('--bg-surface', 'rgba(20, 15, 30, 0.4)');
        root.style.setProperty('--brand-cyan', '#00E5FF'); // Keep primary neon
    } else {
        // Night: Deep Navy/Purple
        root.style.setProperty('--bg-surface', 'rgba(10, 8, 20, 0.45)');
        root.style.setProperty('--brand-blue', '#5A32FA'); 
    }
}
// Run immediately and check every hour
setCircadianLighting();
setInterval(setCircadianLighting, 3600000);

// ==========================================
// 🚀 CENTRAL TELEMETRY BROADCASTER & LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const ageYrsInput = document.getElementById('hudAgeYrs');
    const ageMosInput = document.getElementById('hudAgeMos');
    const weightInput = document.getElementById('hudWeight');

    // Listen for any immediate value changes ('input' is faster than 'change')
    if (ageYrsInput) ageYrsInput.addEventListener('input', window.syncAllDashboards);
    if (ageMosInput) ageMosInput.addEventListener('input', window.syncAllDashboards);
    if (weightInput) weightInput.addEventListener('input', window.syncAllDashboards);
    
    // Fire once automatically on page load to initialize the "Awaiting Input" states
    setTimeout(() => {
        if(typeof window.syncAllDashboards === 'function') window.syncAllDashboards();
    }, 500); 
});