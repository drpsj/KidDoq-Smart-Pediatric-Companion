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
window.syncHudAge = function() {
    const yrs = parseInt(document.getElementById('hudAgeYrs').value) || 0;
    const mos = parseInt(document.getElementById('hudAgeMos').value) || 0;
    document.getElementById('hudAge').value = (yrs * 12) + mos;
};

window.broadcastGlobalParameters = function() {
    const ageMos = parseInt(document.getElementById('hudAge').value) || 0;
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;
    const ht = parseFloat(document.getElementById('hudHeight').value) || 0;
    const gender = document.getElementById('hudGender').value || 'male';

    // 1. Context Shifting
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
    if(typeof renderHudVitals === 'function') renderHudVitals(ageMos);
    if(typeof renderHudFluids === 'function') renderHudFluids(wt);
    if(typeof renderHudRedFlags === 'function') renderHudRedFlags(ageMos);
    if(typeof renderHudVax === 'function') renderHudVax(ageMos);
    if(typeof renderHudMilestones === 'function') renderHudMilestones(ageMos);
    if(typeof renderHudCrash === 'function') renderHudCrash(wt);
    if(typeof renderHudSmartCards === 'function') renderHudSmartCards(wt);
    
    // Trigger quick dose update if a drug is selected
    if(typeof runHudQuickDose === 'function') runHudQuickDose();
};

function renderHudGrowth(wt, ht, ageMos, gender) {
    const out = document.getElementById('hudGrowthOutput');
    if(!out) return;
    if(!wt || !ht || !ageMos) { out.innerHTML = 'Enter Wt, Ht & Age to view triage.'; out.className = 'hud-empty-state'; return; }
    
    // Approximate Expected Weight (Weech's Formula)
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
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;
    const ht = parseFloat(document.getElementById('hudHeight').value) || 0;
    const gender = document.getElementById('hudGender').value || 'male';

    renderHudGrowth(wt, ht, ageMos, gender);
    renderHudVitals(ageMos);
    renderHudFluids(wt);
    renderHudRedFlags(ageMos);
    renderHudVax(ageMos);
    renderHudMilestones(ageMos);
    renderHudCrash(wt);
    renderHudFever(wt);
};

function renderHudGrowth(wt, ht, ageMos, gender) {
    const out = document.getElementById('hudGrowthOutput');
    if(!out) return;
    if(!wt || !ht || !ageMos) { out.innerHTML = 'Enter Wt, Ht & Age to view triage.'; out.className = 'hud-empty-state'; return; }
    
    // Simplistic fallback logic for HUD (integrates seamlessly into visual grid)
    const htM = ht / 100;
    const bmi = wt / (htM * htM);
    let status = "Normal"; let bg = "#dcfce3"; let col = "#166534";
    
    if (bmi < 14) { status = "Severe Wasting (SAM)"; bg = "#fee2e2"; col = "#991b1b"; }
    else if (bmi < 15.5) { status = "Moderate Wasting (MAM)"; bg = "#fef3c7"; col = "#92400e"; }
    else if (bmi > 25) { status = "Overweight"; bg = "#fef3c7"; col = "#92400e"; }

    out.className = '';
    out.innerHTML = `
        <div style="background:${bg}; color:${col}; padding:12px; border-radius:8px; font-weight:800; text-align:center; margin-bottom:8px; border:1px solid ${col}40;">
            ${status}
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-main);">
            <span><b>BMI:</b> ${bmi.toFixed(1)}</span>
            <span><b>Wt/Age:</b> Evaluated</span>
        </div>
    `;
}

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

    // AAP Simplified BP 95th Percentile Shortcut
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

function renderHudFluids(wt) {
    const out = document.getElementById('hudFluidsOutput');
    const ageMos = parseInt(document.getElementById('hudAge').value) || 0;
    if(!out) return;
    if(!wt) { out.innerHTML = 'Enter Wt & Age for targets.'; out.className = 'hud-empty-state'; return; }
    
    // 1. Fluids (Holliday-Segar)
    let fluid = 0;
    if(wt <= 10) fluid = wt * 100;
    else if(wt <= 20) fluid = 1000 + ((wt-10)*50);
    else fluid = 1500 + ((wt-20)*20);
    let hrRate = fluid / 24;

    // 2. ICMR Energy & Protein Mapping
    let cals = 0; let pro = 0;
    if (ageMos < 6) { cals = wt * 92; pro = wt * 1.16; }
    else if (ageMos < 12) { cals = wt * 80; pro = wt * 1.69; }
    else if (ageMos < 48) { cals = 1060; pro = 16.7; }
    else if (ageMos < 84) { cals = 1350; pro = 20.1; }
    else if (ageMos < 120) { cals = 1690; pro = 29.5; }
    else { cals = wt * 60; pro = wt * 1.0; } // Fallback

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

function renderHudCrash(wt) {
    const out = document.getElementById('hudCrashOutput');
    const ageMos = parseInt(document.getElementById('hudAge').value) || 0;
    if(!out) return;
    if(!wt) { out.innerHTML = 'Enter Wt for emergency dosing.'; out.className = 'hud-empty-state'; return; }
    
    let epi = (wt * 0.1).toFixed(1);
    let fluid = (wt * 20).toFixed(0);
    let midaz = (wt * 0.1).toFixed(2);
    let diazepam = (wt * 0.3).toFixed(1);
    
    // Dextrose formulation adaptation (D10W for infants vs D25W for older)
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
    let amox228 = (wt * 40) / (200/5); // Amox/Clav 228 (200mg/5ml base) standard BID
    let amox457 = (wt * 40) / (400/5); // Amox/Clav 457 (400mg/5ml base)

    const cardStyle = `scroll-snap-align: start; flex: 0 0 140px; background: rgba(91,97,246,0.05); border: 1px solid var(--primary-light); padding: 12px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; justify-content: center;`;
    
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
    formSelect.innerHTML = '<option value="">-- Select Drug --</option>';
    if(!cat) return;
    
    let db = typeof getUnifiedDB === 'function' ? getUnifiedDB() : window.drugsDb;
    if(!db) return;
    const filtered = db.filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
    runHudQuickDose();
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
    
    // Grab HTML directly from the HUD
    let growthHtml = document.getElementById('hudGrowthOutput').innerHTML;
    let vitalsHtml = document.getElementById('hudVitalsOutput').innerHTML;
    let pcm = (wt * 15) / 24; // 120/5
    let ibu = (wt * 10) / 20; // 100/5

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