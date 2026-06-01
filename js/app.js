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
// 🚀 MAGIC HUD ENGINE (Cockpit Dashboard)
// ==========================================

// ==========================================
// 📈 PEDIATRIC PREDICTIVE VITALS ENGINE
// ==========================================
window.predictExpectedVitals = function(yrs, mos) {
    let totalMos = (yrs * 12) + mos;
    let expected = { wt: "", ht: "", hc: "", mac: "" };

    if (totalMos > 0) {
        // Weight (Weech's Formula)
        if (totalMos < 12) expected.wt = ((totalMos + 9) / 2).toFixed(1);
        else if (yrs <= 6) expected.wt = ((yrs * 2) + 8).toFixed(1);
        else if (yrs <= 12) expected.wt = (((yrs * 7) - 5) / 2).toFixed(1);

        // Height
        if (totalMos < 3) expected.ht = 60;
        else if (totalMos < 6) expected.ht = 65;
        else if (totalMos < 9) expected.ht = 70;
        else if (totalMos < 12) expected.ht = 75;
        else if (yrs <= 12) expected.ht = (yrs * 6) + 77;

        // Head Circumference
        if (totalMos <= 1) expected.hc = 35;
        else if (totalMos <= 3) expected.hc = 40;
        else if (totalMos <= 6) expected.hc = 43;
        else if (totalMos <= 12) expected.hc = 46;
        else if (yrs === 2) expected.hc = 48;
        else if (yrs === 3) expected.hc = 49;
        else if (yrs === 4) expected.hc = 50;
        else if (yrs >= 5 && yrs <= 12) expected.hc = 51;

        // MAC / MUAC
        if (totalMos >= 6 && yrs <= 5) expected.mac = 15.5;
        else if (yrs > 5 && yrs <= 10) expected.mac = 17.0;
        else if (yrs > 10) expected.mac = 20.0;
    }
    return expected;
};

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

window.broadcastGlobalParameters = function() {
    const ageMos = parseInt(document.getElementById('hudAge').value) || 0;
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;
    const ht = parseFloat(document.getElementById('hudHeight').value) || 0;
    
    let hcInput = document.getElementById('hudHc');
    let macInput = document.getElementById('hudMac');
    const hc = hcInput ? parseFloat(hcInput.value) || 0 : 0;
    const mac = macInput ? parseFloat(macInput.value) || 0 : 0;
    
    const gender = document.getElementById('hudGender').value || 'male';

    // Context Shifting
    const neoView = document.getElementById('hudNeonatalContext');
    const pedView = document.getElementById('hudPediatricContext');
    if (neoView && pedView) {
        if (ageMos > 0 && ageMos < 1) { 
            neoView.style.display = 'flex'; pedView.style.display = 'none'; 
        } else { 
            neoView.style.display = 'none'; pedView.style.display = 'flex'; 
        }
    }

    if(typeof renderHudGrowth === 'function') renderHudGrowth(wt, ht, ageMos, gender);
    if(typeof renderHudAnthro === 'function') renderHudAnthro(hc, mac, ageMos);
    if(typeof renderHudVitals === 'function') renderHudVitals(ageMos);
    if(typeof renderHudFluids === 'function') renderHudFluids(wt, ageMos);
    if(typeof renderHudRedFlags === 'function') renderHudRedFlags(ageMos);
    if(typeof renderHudVax === 'function') renderHudVax(ageMos);
    if(typeof renderHudMilestones === 'function') renderHudMilestones(ageMos);
    if(typeof renderHudCrash === 'function') renderHudCrash(wt, ageMos);
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
    
    let expected = typeof predictExpectedVitals === 'function' ? predictExpectedVitals(Math.floor(ageMos/12), ageMos % 12) : {};
    
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
    out.innerHTML = `
        ${hcHtml}
        ${macHtml}
    `;
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

function renderHudVax(ageMos) {
    const out = document.getElementById('hudVaxOutput');
    if(!out) return;
    if(!ageMos && ageMos !== 0) { out.innerHTML = 'Enter Age to see due vaccines.'; out.className = 'hud-empty-state'; return; }
    
    let due = "Annual Flu / Catch-up Check";
    let color = "var(--success)"; let bg = "rgba(16,185,129,0.1)";

    if(ageMos < 1.0) { due = "Birth: BCG, OPV 0, Hep B 0"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 1.0 && ageMos < 2.0) { due = "6 Wks: Penta 1, OPV 1, Rota 1, fIPV 1"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 2.0 && ageMos < 3.0) { due = "10 Wks: Penta 2, OPV 2, Rota 2"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 3.0 && ageMos < 8.0) { due = "14 Wks: Penta 3, OPV 3, Rota 3, fIPV 2"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 8.0 && ageMos <= 12.0) { due = "9 Mos: MR 1, JE 1, fIPV 3, Vit A"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos > 12.0 && ageMos <= 24.0) { due = "16-24 Mos: MR 2, JE 2, DPT B1, OPV B"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 54 && ageMos <= 72) { due = "5-6 Yrs: DPT Booster 2"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 114 && ageMos <= 126) { due = "10 Yrs: Td (Tetanus & Diphtheria)"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 186 && ageMos <= 198) { due = "16 Yrs: Td (Tetanus & Diphtheria)"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    
    out.className = '';
    // Turned into a clickable trigger to launch the deep tool
    out.innerHTML = `
        <div onclick="launchVaxToolFromHud()" style="cursor:pointer; font-weight:700; color:${color}; font-size:0.95rem; padding:12px; background:${bg}; border-radius:6px; border:1px solid ${color}40; text-align:center; line-height:1.4; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
            ${due}
            <div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">Tap to open full tracker ➔</div>
        </div>`;
}

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

function renderHudMilestones(ageMos) {
    const out = document.getElementById('hudMilestonesOutput');
    if(!out) return;
    if(!ageMos && ageMos !== 0) { out.innerHTML = 'Enter Age for expected milestones.'; out.className = 'hud-empty-state'; return; }
    let ms = ["Observe general development."];
    if(ageMos >= 2 && ageMos < 4) ms = ["Social smile", "Coos", "Holds head steady"];
    else if(ageMos >= 4 && ageMos < 6) ms = ["Rolls over", "Laughs out loud", "Reaches for objects"];
    else if(ageMos >= 6 && ageMos < 9) ms = ["Sits without support", "Babbles", "Transfers objects"];
    else if(ageMos >= 9 && ageMos < 12) ms = ["Stands holding on", "Pincer grasp", "Waves bye-bye"];
    else if(ageMos >= 12 && ageMos < 18) ms = ["Walks alone", "1-2 words with meaning", "Points to objects"];
    else if(ageMos >= 18 && ageMos < 24) ms = ["Runs", "10+ words", "Eats with spoon"];
    else if(ageMos >= 24) ms = ["Kicks ball", "2-word phrases", "Copies others"];

    out.className = '';
    out.innerHTML = `<ul style="margin:0; padding-left:18px; color:var(--brand-pink); font-size:0.9rem; line-height:1.6; font-weight:600;">${ms.map(m=>`<li style="margin-bottom:4px;">${m}</li>`).join('')}</ul>`;
}

function renderHudCrash(wt, ageMos) {
    const out = document.getElementById('hudCrashOutput');
    if(!out) return;
    if(!wt) { out.innerHTML = 'Enter Wt for emergency dosing.'; out.className = 'hud-empty-state'; return; }
    
    let epi = (wt * 0.1).toFixed(1);
    let fluid = (wt * 20).toFixed(0);
    let midaz = (wt * 0.1).toFixed(2);
    let diazepam = (wt * 0.3).toFixed(1);
    
    let dextrose = "";
    if (ageMos < 12) dextrose = `<span style="color:#d97706; font-weight:900;">${(wt * 5).toFixed(0)} mL (D10W)</span>`;
    else dextrose = `<span style="color:#d97706; font-weight:900;">${(wt * 2).toFixed(0)} mL (D25W)</span>`;

    out.className = '';
    out.innerHTML = `
        <div style="font-size:0.85rem; line-height:1.5;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #fee2e2; padding-bottom:4px; margin-bottom:4px;"><b>Adren (1:10k):</b> <span style="color:var(--danger); font-weight:900;">${epi} mL IV/IO</span></div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #fee2e2; padding-bottom:4px; margin-bottom:4px;"><b>NS/RL Bolus:</b> <span style="color:#0ea5e9; font-weight:900;">${fluid} mL</span></div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #fee2e2; padding-bottom:4px; margin-bottom:4px;"><b>Dextrose:</b> ${dextrose}</div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #fee2e2; padding-bottom:4px; margin-bottom:4px;"><b>Midazolam:</b> <span style="color:var(--primary); font-weight:900;">${midaz} mg</span></div>
            <div style="display:flex; justify-content:space-between;"><b>Diazepam:</b> <span style="color:var(--primary); font-weight:900;">${diazepam} mg (IV)</span></div>
        </div>
    `;
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
window.predictExpectedVitals = function(yrs, mos) {
    let totalMos = (yrs * 12) + mos;
    let expected = { wt: "", ht: "", hc: "", mac: "" };

    if (totalMos > 0) {
        if (totalMos < 12) expected.wt = ((totalMos + 9) / 2).toFixed(1);
        else if (yrs <= 6) expected.wt = ((yrs * 2) + 8).toFixed(1);
        else if (yrs <= 12) expected.wt = (((yrs * 7) - 5) / 2).toFixed(1);

        if (totalMos < 3) expected.ht = 60;
        else if (totalMos < 6) expected.ht = 65;
        else if (totalMos < 9) expected.ht = 70;
        else if (totalMos < 12) expected.ht = 75;
        else if (yrs <= 12) expected.ht = (yrs * 6) + 77;

        if (totalMos <= 1) expected.hc = 35;
        else if (totalMos <= 3) expected.hc = 40;
        else if (totalMos <= 6) expected.hc = 43;
        else if (totalMos <= 12) expected.hc = 46;
        else if (yrs === 2) expected.hc = 48;
        else if (yrs === 3) expected.hc = 49;
        else if (yrs === 4) expected.hc = 50;
        else if (yrs >= 5 && yrs <= 12) expected.hc = 51;

        if (totalMos >= 6 && yrs <= 5) expected.mac = 15.5;
        else if (yrs > 5 && yrs <= 10) expected.mac = 17.0;
        else if (yrs > 10) expected.mac = 20.0;
    }
    return expected;
};

window.estimateWeightFromAge = function() {
    let yrs = parseInt(document.getElementById('ageYrs').value) || 0;
    let mos = parseInt(document.getElementById('ageMos').value) || 0;
    let expected = predictExpectedVitals(yrs, mos);

    let wtInput = document.getElementById('pWeight');
    let htInput = document.getElementById('htCm');
    let hcInput = document.getElementById('hcCm');
    
    if (wtInput && wtInput.value === "" && expected.wt) wtInput.value = expected.wt;
    if (htInput && htInput.value === "" && expected.ht) htInput.value = expected.ht;
    if (hcInput && hcInput.value === "" && expected.hc) hcInput.value = expected.hc;
    
    if(typeof saveAndRegisterPatient === 'function') saveAndRegisterPatient(true);
};

window.openPrefilledRegistry = function() {
    document.getElementById('ageYrs').value = document.getElementById('hudAgeYrs').value || "";
    document.getElementById('ageMos').value = document.getElementById('hudAgeMos').value || "";
    document.getElementById('pWeight').value = document.getElementById('hudWeight').value || "";
    document.getElementById('htCm').value = document.getElementById('hudHeight').value || "";
    
    let hcInput = document.getElementById('hcCm');
    if(hcInput) hcInput.value = document.getElementById('hudHc') ? document.getElementById('hudHc').value : "";
    document.getElementById('gender').value = document.getElementById('hudGender').value || "male";
    
    document.getElementById('registryModal').classList.add('active');
    if(typeof showSystemToast === 'function') showSystemToast("✨ Vitals Copied. Enter Name to save to database.");
};

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

window.broadcastGlobalParameters = function() {
    const ageMos = parseInt(document.getElementById('hudAge').value) || 0;
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;
    const ht = parseFloat(document.getElementById('hudHeight').value) || 0;
    
    let hcInput = document.getElementById('hudHc');
    let macInput = document.getElementById('hudMac');
    const hc = hcInput ? parseFloat(hcInput.value) || 0 : 0;
    const mac = macInput ? parseFloat(macInput.value) || 0 : 0;
    const gender = document.getElementById('hudGender').value || 'male';

    const neoView = document.getElementById('hudNeonatalContext');
    const pedView = document.getElementById('hudPediatricContext');
    if (neoView && pedView) {
        if (ageMos > 0 && ageMos < 1) { 
            neoView.style.display = 'flex'; pedView.style.display = 'none'; 
        } else { 
            neoView.style.display = 'none'; pedView.style.display = 'flex'; 
        }
    }

    renderHudGrowth(wt, ht, ageMos, gender);
    renderHudAnthro(hc, mac, ageMos);
    renderHudVitals(ageMos);
    renderHudFluids(wt, ageMos);
    renderHudRedFlags(ageMos);
    renderHudVax(ageMos);
    renderHudMilestones(ageMos);
    renderHudSmartCards(wt);
    
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

function renderHudVax(ageMos) {
    const out = document.getElementById('hudVaxOutput');
    if(!out) return;
    if(!ageMos && ageMos !== 0) { out.innerHTML = 'Enter Age to see due vaccines.'; out.className = 'hud-empty-state'; return; }
    
    let due = "Annual Flu / Catch-up Check";
    let color = "var(--success)"; let bg = "rgba(16,185,129,0.1)";

    if(ageMos < 1.0) { due = "Birth: BCG, OPV 0, Hep B 0"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 1.0 && ageMos < 2.0) { due = "6 Wks: Penta 1, OPV 1, Rota 1, fIPV 1"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 2.0 && ageMos < 3.0) { due = "10 Wks: Penta 2, OPV 2, Rota 2"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 3.0 && ageMos < 8.0) { due = "14 Wks: Penta 3, OPV 3, Rota 3, fIPV 2"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos >= 8.0 && ageMos <= 12.0) { due = "9 Mos: MR 1, JE 1, fIPV 3, Vit A"; color = "#e11d48"; bg = "rgba(225,29,72,0.1)"; }
    else if(ageMos > 12.0 && ageMos <= 24.0) { due = "16-24 Mos: MR 2, JE 2, DPT B1, OPV B"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 54 && ageMos <= 72) { due = "5-6 Yrs: DPT Booster 2"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 114 && ageMos <= 126) { due = "10 Yrs: Td (Tetanus & Diphtheria)"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    else if(ageMos >= 186 && ageMos <= 198) { due = "16 Yrs: Td (Tetanus & Diphtheria)"; color = "#0ea5e9"; bg = "rgba(14,165,233,0.1)"; }
    
    out.className = '';
    out.innerHTML = `<div style="font-weight:700; color:${color}; font-size:0.95rem; padding:12px; background:${bg}; border-radius:6px; border:1px solid ${color}40; text-align:center; line-height:1.4;">${due}</div>`;
}

function renderHudMilestones(ageMos) {
    const out = document.getElementById('hudMilestonesOutput');
    if(!out) return;
    if(!ageMos && ageMos !== 0) { out.innerHTML = 'Enter Age for expected milestones.'; out.className = 'hud-empty-state'; return; }
    let ms = ["Observe general development."];
    if(ageMos >= 2 && ageMos < 4) ms = ["Social smile", "Coos", "Holds head steady"];
    else if(ageMos >= 4 && ageMos < 6) ms = ["Rolls over", "Laughs out loud", "Reaches for objects"];
    else if(ageMos >= 6 && ageMos < 9) ms = ["Sits without support", "Babbles", "Transfers objects"];
    else if(ageMos >= 9 && ageMos < 12) ms = ["Stands holding on", "Pincer grasp", "Waves bye-bye"];
    else if(ageMos >= 12 && ageMos < 18) ms = ["Walks alone", "1-2 words with meaning", "Points to objects"];
    else if(ageMos >= 18 && ageMos < 24) ms = ["Runs", "10+ words", "Eats with spoon"];
    else if(ageMos >= 24) ms = ["Kicks ball", "2-word phrases", "Copies others"];

    out.className = '';
    out.innerHTML = `<ul style="margin:0; padding-left:18px; color:var(--brand-pink); font-size:0.9rem; line-height:1.6; font-weight:600;">${ms.map(m=>`<li style="margin-bottom:4px;">${m}</li>`).join('')}</ul>`;
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

/* ==========================================
   CORTEX PROTOCOL: LOGIC & HAPTICS ENGINE
   ========================================== */

// 1. Core State Controllers
function activateCortexInput() {
    document.getElementById('cortexOverlay').classList.remove('cortex-hidden');
    document.getElementById('cortexInputPod').classList.remove('cortex-hidden');
    document.getElementById('cortexActionPill').classList.add('snapped-out');
}

function dismissCortexInput() {
    document.getElementById('cortexOverlay').classList.add('cortex-hidden');
    document.getElementById('cortexInputPod').classList.add('cortex-hidden');
    // Only bring back the action pill if the Anchor isn't active yet
    if(document.getElementById('cortexAnchorPill').classList.contains('cortex-hidden')) {
        document.getElementById('cortexActionPill').classList.remove('snapped-out');
    }
}

function checkCortexReadiness() {
    // Enable the confirm button only if Weight is entered (Age is highly recommended but Wt is critical for doses)
    const wt = parseFloat(document.getElementById('hudWeight').value);
    const btn = document.querySelector('.action-btn-mini');
    
    if (wt > 0) {
        btn.disabled = false;
        btn.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.6)"; // Pulse effect
    } else {
        btn.disabled = true;
        btn.style.boxShadow = "none";
    }
}

// 2. The Magnetic Snap (Moves Data from Bottom to Top)
function executeCortexSnap() {
    dismissCortexInput();
    
    // Extract values
    const ageYrs = document.getElementById('hudAgeYrs').value || '0';
    const ageMos = document.getElementById('hudAgeMos').value || '0';
    const wt = document.getElementById('hudWeight').value;
    const gender = document.getElementById('hudGender').value;

    // Format Anchor Text
    let ageText = '';
    if(ageYrs > 0) ageText += `${ageYrs}Y `;
    if(ageMos > 0 || ageYrs == 0) ageText += `${ageMos}M`;
    
    document.getElementById('anchorAge').innerText = ageText;
    document.getElementById('anchorWt').innerText = `${wt} kg`;
    document.getElementById('anchorGender').innerText = gender === 'male' ? 'M' : 'F';

    // Reveal Anchor Pill
    const anchor = document.getElementById('cortexAnchorPill');
    anchor.classList.remove('cortex-hidden');
    anchor.style.transform = 'translateY(-20px)'; // Start slightly high
    
    // Trigger Spring Animation
    setTimeout(() => {
        anchor.style.transform = 'translateY(0)';
    }, 50);
}

// 3. Progressive Disclosure Drawer
function toggleCortexDrawer() {
    const drawer = document.getElementById('cortexDrawer');
    const chevron = document.querySelector('.anchor-chevron');
    
    if(drawer.classList.contains('cortex-collapsed')) {
        drawer.classList.remove('cortex-collapsed');
        chevron.classList.add('expanded-chevron');
    } else {
        drawer.classList.add('cortex-collapsed');
        chevron.classList.remove('expanded-chevron');
    }
}

// 4. THE SCRUB VORTEX (Haptic Touch Increments)
function attachScrubVortex(inputId, stepVal) {
    const el = document.getElementById(inputId);
    let startX = 0;
    let startVal = 0;
    let isScrubbing = false;

    el.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startVal = parseFloat(el.value) || 0;
        isScrubbing = false;
    });

    el.addEventListener('touchmove', (e) => {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // If they drag more than 15 pixels, hijack the input (scrub mode)
        if (Math.abs(deltaX) > 15) {
            isScrubbing = true;
            e.preventDefault(); // Stop screen from scrolling horizontally
            
            // Calculate new value: Every 15px = 1 step
            let steps = Math.floor(deltaX / 15);
            let newVal = startVal + (steps * stepVal);
            
            if(newVal < 0) newVal = 0; // Prevent negative time/weight
            
            // Format decimals cleanly
            el.value = Number.isInteger(newVal) ? newVal : newVal.toFixed(1);
            
            // Trigger calculation engine
            broadcastGlobalParameters();
            checkCortexReadiness();
        }
    }, {passive: false}); // passive: false is required to use e.preventDefault()
}

// Initialize the Vortex on load
document.addEventListener('DOMContentLoaded', () => {
    // Setup initial button state safely
    const actionBtn = document.querySelector('.action-btn-mini');
    if (actionBtn) actionBtn.disabled = true;
    
    // Attach swipe-to-scrub to inputs
    attachScrubVortex('hudAgeMos', 1);   // Swipe changes months by 1
    attachScrubVortex('hudAgeYrs', 1);   // Swipe changes years by 1
    attachScrubVortex('hudWeight', 0.5); // Swipe changes weight by 0.5kg
});