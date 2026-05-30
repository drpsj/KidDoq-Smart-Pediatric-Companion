// js/module-er.js
/**
 * KidDoq Module: ER, Neonatal & Triage
 * Handles acute care calculators, anthropometry, and developmental screening.
 * Upgraded with Harriet Lane Protocols for Resuscitation and Seizures.
 */

// --- MALNUTRITION & ANTHROPOMETRY ---
window.evalMAC = function(macVal) {
    const out = document.getElementById('macOutput');
    if (!out) return;
    const result = ClinicalMath.evaluateMAC(parseFloat(macVal));
    if (!result) { out.innerHTML = ""; return; }
    out.innerHTML = `MAC Status: <span style="color:${result.color};">${result.status}</span>`;
};

window.calcMalnutrition = function() {
    if (!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    if (!p) return;
    const out = document.getElementById('malnGridOutput');
    if (!out) return;

    const ageYrs = parseInt(p.ageYrs) || 0;
    const ageMos = parseInt(p.ageMos) || 0;
    const actualWt = parseFloat(p.weight) || 0;
    const hasOedema = document.getElementById('malnOedemaToggle') ? document.getElementById('malnOedemaToggle').checked : false;

    const expectedWt = ClinicalMath.calculateExpectedWeight(ageYrs, ageMos);
    if (!expectedWt || actualWt === 0) {
        out.innerHTML = "Awaiting complete age and weight parameters...";
        return;
    }

    const wfaPercent = (actualWt / expectedWt) * 100;
    const wellcomeClass = ClinicalMath.classifyWellcomeTrust(wfaPercent, hasOedema);

    out.innerHTML = `
        <div style="margin-bottom:10px;">Expected Weight (Weech): <b>${expectedWt.toFixed(1)} kg</b></div>
        <div style="margin-bottom:10px;">Actual Weight for Age: <b>${wfaPercent.toFixed(1)}%</b></div>
        <div style="padding:10px; border-radius:6px; background:rgba(91,97,246,0.1); border:1px solid var(--primary);">
            Wellcome Trust Classification:<br>
            <b style="font-size:1.1rem; color:var(--primary-dark);">${wellcomeClass}</b>
        </div>
    `;
};

// --- SENSORY SCREENING ---
window.renderSensory = function() {
    const out = document.getElementById('sensoryOutputArea');
    if (!out) return;
    const items = [
        { cat: "Vision", text: "Fixes and follows moving objects" }, { cat: "Vision", text: "Recognizes familiar faces" },
        { cat: "Hearing", text: "Startles to loud noises" }, { cat: "Hearing", text: "Turns head towards sound" },
        { cat: "Speech/Social", text: "Responds to name" }, { cat: "Speech/Social", text: "Engages in reciprocal play" }
    ];
    let html = `<div style="display:grid; gap:10px;">`;
    items.forEach(item => {
        html += `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--border-soft); display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
            <div><small style="color:var(--primary); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${item.cat}</small>
            <div style="font-size:1.05rem; margin-top:4px; font-weight:500;">${item.text}</div></div>
            <select style="width:auto; padding:8px 12px; border:2px solid var(--border-soft); border-radius:6px; font-weight:bold;">
                <option value="pending">-- Assess --</option><option value="pass">✅ Pass</option><option value="concern">🚨 Concern</option>
            </select>
        </div>`;
    });
    out.innerHTML = html + `</div>`;
};

// --- 1. HARRIET LANE CRASH CART & AIRWAY ---
window.calcCrash = function() {
    const wt = parseFloat(document.getElementById('crashWeight').value);
    const age = parseFloat(document.getElementById('crashAge').value) || 0;
    const out = document.getElementById('crashOutputArea');

    if(!wt || isNaN(wt)) {
        out.innerHTML = "Awaiting weight input to calculate Code Blue parameters.";
        out.className = "tool-result neutral";
        return;
    }

    // Airway Sizing Formulas
    let uncuffed = (age / 4) + 4;
    let cuffed = (age / 4) + 3.5;
    if(age < 1) { uncuffed = wt < 3 ? 3.0 : 3.5; cuffed = wt < 3 ? 3.0 : 3.0; }
    let depth = uncuffed * 3;
    let blade = age < 1 ? "Miller 0 or 1 (Straight)" : (age < 3 ? "Mac 2 (Curved)" : "Mac 3 (Curved)");

    // Cardiac Arrest Meds
    let defib1 = wt * 2; let defib2 = wt * 4;
    let epi = (wt * 0.1).toFixed(2); // 0.1 mL/kg of 1:10,000
    let amio = (wt * 5).toFixed(1); // 5 mg/kg
    let lido = (wt * 1).toFixed(1); // 1 mg/kg
    let fluid = Math.round(wt * 20); // 20 mL/kg

    // Rapid Sequence Intubation (RSI)
    let atropine = Math.max(0.1, wt * 0.02).toFixed(2); // Min 0.1mg to prevent reflex bradycardia
    let ketamine = (wt * 2).toFixed(1); // 2 mg/kg
    let rocuronium = (wt * 1).toFixed(1); // 1 mg/kg
    let sux = (age < 1 ? wt * 2 : wt * 1.5).toFixed(1); // Infants need higher dose

    out.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; text-align:left; width:100%;">
            <div style="background:var(--bg-body); border:1px solid var(--danger); border-radius:8px; padding:12px;">
                <h4 style="margin:0 0 8px 0; color:var(--danger); border-bottom:1px solid #fee2e2; padding-bottom:5px;">⚡ Defib & Arrest Meds</h4>
                <div style="font-size:0.95rem; line-height:1.6;">
                    <b>Shock (Joules):</b> ${defib1} J &rarr; ${defib2} J<br>
                    <b>Fluid Push:</b> ${fluid} mL (NS/LR)<br>
                    <b>Epi (1:10,000):</b> <b style="color:var(--danger); background:#fee2e2; padding:2px 6px; border-radius:4px;">${epi} mL</b> (IV/IO)<br>
                    <b>Amiodarone:</b> ${amio} mg<br>
                    <b>Lidocaine:</b> ${lido} mg
                </div>
            </div>
            
            <div style="background:var(--bg-body); border:1px solid var(--primary); border-radius:8px; padding:12px;">
                <h4 style="margin:0 0 8px 0; color:var(--primary); border-bottom:1px solid #e0e7ff; padding-bottom:5px;">🫁 Airway Setup</h4>
                <div style="font-size:0.95rem; line-height:1.6;">
                    <b>ETT (Uncuffed):</b> ${uncuffed.toFixed(1)} mm<br>
                    <b>ETT (Cuffed):</b> ${cuffed.toFixed(1)} mm<br>
                    <b>Oral Depth:</b> ~${depth.toFixed(1)} cm at lip<br>
                    <b>Laryngoscope:</b> ${blade}
                </div>
            </div>
            
            <div style="grid-column: 1 / -1; background:var(--bg-body); border:1px solid var(--warning); border-radius:8px; padding:12px;">
                <h4 style="margin:0 0 8px 0; color:#b45309; border-bottom:1px solid #fef3c7; padding-bottom:5px;">💉 Rapid Sequence Intubation (RSI)</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-size:0.95rem;">
                    <div><b>1. Pre-medication:</b><br>Atropine ${atropine} mg</div>
                    <div><b>2. Induction:</b><br>Ketamine ${ketamine} mg</div>
                    <div><b>3. Paralysis:</b><br>Rocuronium ${rocuronium} mg<br><i style="font-size:0.8rem;">or Suxamethonium ${sux} mg</i></div>
                </div>
            </div>
        </div>
    `;
    out.className = "tool-result";
};

// --- 2. HARRIET LANE STATUS EPILEPTICUS ---
window.calcSeizure = function() {
    const wt = parseFloat(document.getElementById('seizureWeight').value);
    const out = document.getElementById('seizureOutputArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Awaiting weight input."; return; }

    let midazIV = (wt * 0.1).toFixed(2);
    let midazIM = (wt * 0.2).toFixed(2);
    let diazIV = (wt * 0.3).toFixed(2);
    
    let pheny = (wt * 20).toFixed(0);
    let levet = (wt * 40).toFixed(0);
    let pheno = (wt * 20).toFixed(0);

    out.innerHTML = `
        <div style="text-align:left; font-size:0.95rem; width:100%;">
            <div style="margin-bottom:12px; padding:12px; border-left:4px solid var(--danger); background:var(--bg-surface); border-radius:4px;">
                <h4 style="margin:0 0 5px 0; color:var(--danger);">⏱️ 0-5 Mins: Active Seizure</h4>
                <b>Midazolam:</b> ${midazIM} mg (IM/Buccal) <span style="color:var(--text-muted);"><i>OR</i></span> ${midazIV} mg (IV)<br>
                <b>Diazepam:</b> ${diazIV} mg (Slow IV)
            </div>
            
            <div style="margin-bottom:12px; padding:12px; border-left:4px solid var(--warning); background:var(--bg-surface); border-radius:4px;">
                <h4 style="margin:0 0 5px 0; color:#b45309;">⏱️ 5-15 Mins: Status Epilepticus</h4>
                <b>Phenytoin / Fosphenytoin:</b> ${pheny} mg (IV Load)<br>
                <span style="font-size:0.8rem; color:var(--text-muted);">Max rate 1mg/kg/min. Dilute in NS only.</span><br>
                <span style="color:var(--text-muted);"><i>-- OR --</i></span><br>
                <b>Levetiracetam:</b> ${levet} mg (IV Load over 15 mins)
            </div>
            
            <div style="padding:12px; border-left:4px solid var(--primary); background:var(--bg-surface); border-radius:4px;">
                <h4 style="margin:0 0 5px 0; color:var(--primary);">⏱️ 15-30 Mins: Refractory</h4>
                <b>Phenobarbital:</b> ${pheno} mg (IV Load)
            </div>
        </div>
    `;
};

// --- 3. STANDARD HOLLIDAY-SEGAR FLUIDS ---
window.calcFluids = function() {
    const wt = parseFloat(document.getElementById('fluidWeight').value);
    const dehyd = parseFloat(document.getElementById('fluidDehydration').value);
    const out = document.getElementById('fluidResultArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Compile inputs parameter block."; out.className="tool-result neutral"; return; }

    let maint = wt <= 10 ? wt * 100 : (wt <= 20 ? 1000 + ((wt - 10) * 50) : 1500 + ((wt - 20) * 20));
    let deficit = wt * (dehyd * 10);
    let total = maint + deficit;
    let perHour = total / 24;

    out.innerHTML = `
        <div style="text-align:left;">
            <h3 style="margin-top:0; color:var(--primary); font-size:2rem;">${perHour.toFixed(1)} <span style="font-size:1.2rem;">mL/hr</span></h3>
            <div style="font-size:0.95rem; color:var(--text-main);">
                <b>24h Maintenance:</b> ${maint.toFixed(0)} mL<br>
                <b>24h Deficit Repletion:</b> ${deficit.toFixed(0)} mL<br>
                <b>Total 24h Fluid Target:</b> ${(total).toFixed(0)} mL
            </div>
        </div>
    `;
    out.className = "tool-result success";
};

// --- 4. NICU METRICS ---
window.calcGIR = function() {
    const wt = parseFloat(document.getElementById('girWt').value), rate = parseFloat(document.getElementById('girRate').value), dex = parseFloat(document.getElementById('girDex').value);
    const out = document.getElementById('girOutput');
    if(!wt || !rate || !dex || isNaN(wt)) { out.innerHTML = ""; out.className="tool-result neutral"; return; }
    out.innerHTML = `GIR: <b>${((rate * dex) / (wt * 6)).toFixed(2)}</b> mg/kg/min`;
    out.className = "tool-result success";
};

window.calcAPGAR = function() {
    const total = parseInt(document.getElementById('apgarHR').value) + parseInt(document.getElementById('apgarResp').value) + parseInt(document.getElementById('apgarTone').value) + parseInt(document.getElementById('apgarReflex').value) + parseInt(document.getElementById('apgarColor').value);
    const out = document.getElementById('apgarOutput');
    let color = total >= 7 ? "var(--success)" : (total >= 4 ? "var(--warning)" : "var(--danger)");
    out.innerHTML = `Total Score: <span style="font-size:1.4rem; color:${color}; font-weight:bold;">${total}/10</span>`;
};

// --- 5. ASTHMA & JAUNDICE TRIAGE ---
window.calcPRAM = function() {
    const total = parseInt(document.getElementById('pramO2').value) + parseInt(document.getElementById('pramSupra').value) + parseInt(document.getElementById('pramScalene').value) + parseInt(document.getElementById('pramAir').value) + parseInt(document.getElementById('pramWheeze').value);
    const out = document.getElementById('pramResultArea');
    let sev = total >= 8 ? "Severe" : (total >= 4 ? "Moderate" : "Mild");
    let color = total >= 8 ? "var(--danger)" : (total >= 4 ? "var(--warning)" : "var(--success)");
    
    out.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">PRAM Score</div><h2 style="margin:5px 0;">${total} / 12</h2><div style="font-size:1.1rem; font-weight:bold; color:${color};">${sev} Exacerbation</div>`;
    out.className = "tool-result";
};

window.calcJaundice = function() {
    const hrs = parseFloat(document.getElementById('jaunHours').value), tsb = parseFloat(document.getElementById('jaunTSB').value), risk = document.getElementById('jaunRisk').value;
    const out = document.getElementById('jaunResultArea');
    if(!hrs || !tsb || isNaN(hrs)) { out.innerHTML = "Awaiting data entry to map standard Bhutani bands."; out.className="tool-result neutral"; return; }
    
    let threshold = risk === 'high' ? (hrs/24) * 2.5 + 5.5 : (risk === 'med' ? (hrs/24) * 3 + 7 : (hrs/24) * 3 + 9);
    let colorClass = tsb >= threshold ? "danger" : "success";
    
    out.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Risk Analysis Assessment</div><h2 style="margin:5px 0;">${tsb >= threshold ? "⚠️ Phototherapy Indicated" : "✅ Below Phototherapy Threshold"}</h2><div style="font-size:0.9rem;">Estimated Threshold for this age/risk: ~${threshold.toFixed(1)} mg/dL</div>`;
    out.className = "tool-result " + colorClass;
};

// ==========================================
// ER HUB NAVIGATION & DATABASE SYNC
// ==========================================

window.openErView = function(viewId) {
    // 1. Safely fetch data from active patient vault
    try {
        if (typeof activePatientId !== 'undefined' && activePatientId && typeof AppStore !== 'undefined') {
            let p = AppStore.getPatient(activePatientId);
            if (p && p.weight) {
                ['crashWeight', 'seizureWeight', 'fluidWeight', 'girWt'].forEach(id => {
                    let el = document.getElementById(id);
                    if(el) el.value = p.weight;
                });
            }
            if (p && p.ageYrs !== undefined) {
                let el = document.getElementById('crashAge');
                if(el) el.value = p.ageYrs;
            }
        }
    } catch(e) { console.log("ER Sync skipped:", e); }
    
    // 2. Pre-calculate the views
    if(viewId === 'erCrashView') { if(typeof calcCrash === 'function') calcCrash(); }
    if(viewId === 'erSeizureView') { if(typeof calcSeizure === 'function') calcSeizure(); }
    if(viewId === 'erFluidsView') { if(typeof calcFluids === 'function') calcFluids(); }
    if(viewId === 'erNicuView') { 
        if(typeof calcGIR === 'function') calcGIR(); 
        if(typeof calcAPGAR === 'function') calcAPGAR(); 
    }
    
    // 3. Bulletproof Navigation
    if (typeof openClinicalTool === 'function') {
        openClinicalTool(viewId);
    } else if (typeof switchNavTab === 'function') {
        switchNavTab(viewId);
    } else if (typeof ViewController !== 'undefined') {
        ViewController.openClinicalTool(viewId);
    }
};

window.syncErWeight = function(newWeight) {
    if (typeof activePatientId !== 'undefined' && activePatientId && typeof AppStore !== 'undefined') {
        let p = AppStore.getPatient(activePatientId);
        p.weight = newWeight;
        AppStore.savePatient(p); 
    }
    ['crashWeight', 'seizureWeight', 'fluidWeight', 'girWt'].forEach(id => {
        let el = document.getElementById(id);
        if(el && el.value !== newWeight) el.value = newWeight;
    });
    let inlineWt = document.getElementById('inlineCalcWeight');
    if(inlineWt && inlineWt.value !== newWeight) inlineWt.value = newWeight;
    
    if(typeof calcCrash === 'function') calcCrash(); 
    if(typeof calcSeizure === 'function') calcSeizure(); 
    if(typeof calcFluids === 'function') calcFluids(); 
    if(typeof calcGIR === 'function') calcGIR();
};

window.syncErAge = function(newAge) {
    if (typeof activePatientId !== 'undefined' && activePatientId && typeof AppStore !== 'undefined') {
        let p = AppStore.getPatient(activePatientId);
        p.ageYrs = newAge;
        AppStore.savePatient(p);
    }
    let crashAgeEl = document.getElementById('crashAge');
    if(crashAgeEl && crashAgeEl.value !== newAge) crashAgeEl.value = newAge;
    
    if(typeof calcCrash === 'function') calcCrash();
};