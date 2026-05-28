// js/module-er.js
/**
 * KidDoq Module: ER, Neonatal & Triage
 * Handles acute care calculators, anthropometry, and developmental screening.
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

// --- ACUTE ER & NEONATAL CALCULATORS ---
window.calcCrash = function() {
    const wt = parseFloat(document.getElementById('crashWeight').value);
    const out = document.getElementById('crashOutputArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Input physical vectors to map lines."; out.className="tool-result neutral"; return; }
    
    out.innerHTML = `
        <div style="display:grid; gap:10px; text-align:left;">
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--danger);"><b>⚡ Defibrillation:</b> ${(wt*2).toFixed(0)} J &rarr; ${(wt*4).toFixed(0)} J</div>
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--info);"><b>💧 Fluid Bolus (NS/RL):</b> ${(wt*20).toFixed(0)} mL (over 10-20 mins)</div>
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--warning);"><b>💉 Adrenaline (1:10,000):</b> ${(wt*0.1).toFixed(2)} mL (IV/IO)</div>
        </div>
    `;
    out.className = "tool-result danger";
};

window.calcFluids = function() {
    const wt = parseFloat(document.getElementById('fluidWeight').value);
    const dehyd = parseFloat(document.getElementById('fluidDehydration').value);
    const out = document.getElementById('fluidResultArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Compile inputs parameter block."; out.className="tool-result neutral"; return; }

    let maint = wt <= 10 ? wt * 100 : (wt <= 20 ? 1000 + ((wt - 10) * 50) : 1500 + ((wt - 20) * 20));
    let deficit = wt * (dehyd * 10);
    let total = maint + deficit;

    out.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">24H Fluid Requirement</div>
            <h2 style="color:var(--info); margin:10px 0;">${total.toFixed(0)} mL / day</h2>
            <div style="font-size:0.95rem;">Maintenance: <b>${maint.toFixed(0)} mL</b> + Deficit: <b>${deficit.toFixed(0)} mL</b></div>
            <div style="font-size:0.95rem; margin-top:5px; color:var(--primary); font-weight:bold;">Flow Rate: ${(total/24).toFixed(1)} mL/hr</div>
        </div>
    `;
    out.className = "tool-result";
};

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