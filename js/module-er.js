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

    // --- NEW: Actionable Advice Generation ---
    let actionPlan = "";
    let dietAdvice = "";
    
    if (wellcomeClass.includes("Kwashiorkor") || wellcomeClass === "Marasmus" || wellcomeClass === "Marasmic-Kwashiorkor") {
        actionPlan = "🚨 SEVERE ACUTE MALNUTRITION (SAM):\n- Assess for medical complications (hypoglycemia, hypothermia, severe infection).\n- If complicated: Admit for inpatient management (F-75 diet, IV antibiotics).\n- If uncomplicated: Start RUTF (Ready-to-Use Therapeutic Food) and oral antibiotics.\n- Weekly follow-up mandatory.";
        dietAdvice = "High-calorie, high-protein therapeutic diet. Frequent small feeds. Ensure adequate hydration.";
    } else if (wellcomeClass === "Underweight") {
        actionPlan = "⚠️ MODERATE ACUTE MALNUTRITION (MAM):\n- Start supplementary feeding program.\n- Treat concurrent infections.\n- Follow up in 14 days.";
        dietAdvice = "Increase caloric density of home foods (add ghee, oil, jaggery). Include protein-rich foods (eggs, dal, milk). Give daily multivitamin/mineral supplement.";
    } else {
        actionPlan = "✅ Normal Nutritional Status. Continue routine growth monitoring.";
        dietAdvice = "Continue age-appropriate balanced diet per ICMR guidelines.";
    }

    // Expose to window for the auto-appender
    window.latestMalnutritionAdvice = actionPlan + "\n\nDietary Advice:\n" + dietAdvice;

    out.innerHTML = `
        <div style="margin-bottom:10px;">Expected Weight (Weech): <b>${expectedWt.toFixed(1)} kg</b></div>
        <div style="margin-bottom:10px;">Actual Weight for Age: <b>${wfaPercent.toFixed(1)}%</b></div>
        <div style="padding:10px; border-radius:6px; background:rgba(91,97,246,0.1); border:1px solid var(--primary); margin-bottom:10px;">
            Wellcome Trust Classification:<br>
            <b style="font-size:1.1rem; color:var(--primary-dark);">${wellcomeClass}</b>
        </div>
        <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border-left:4px solid var(--warning); font-size:0.85rem; white-space:pre-wrap; margin-bottom:10px; line-height:1.5;">${actionPlan}\n\n<b>Dietary Advice:</b>\n${dietAdvice}</div>
        <button class="action" onclick="appendMalnutritionAdvice()" style="padding:10px; font-size:0.95rem; margin-top:5px; background:var(--primary-dark); box-shadow:var(--shadow-sm);">📋 Add Advice to Rx Pad</button>
    `;
};

// --- NEW: Auto-Appender Function ---
window.appendMalnutritionAdvice = function() {
    const rxAdvice = document.getElementById('rxAdvice');
    if (rxAdvice && window.latestMalnutritionAdvice) {
        let current = rxAdvice.value.trim();
        rxAdvice.value = current ? current + "\n\n" + window.latestMalnutritionAdvice : window.latestMalnutritionAdvice;
        if(typeof showSystemToast === 'function') showSystemToast("✅ Nutritional Plan sent to Prescription Pad");
        if(typeof renderRxCartList === 'function') renderRxCartList();
    } else {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Prescription pad not found or no advice generated.");
    }
};

// --- SENSORY SCREENING ---
window.renderSensory = function() {
    const out = document.getElementById('sensoryOutputArea');
    if (!out) return;
    const items = [
        { id: "s_v1", cat: "Vision", text: "Fixes and follows moving objects" }, 
        { id: "s_v2", cat: "Vision", text: "Recognizes familiar faces" },
        { id: "s_h1", cat: "Hearing", text: "Startles to loud noises" }, 
        { id: "s_h2", cat: "Hearing", text: "Turns head towards sound" },
        { id: "s_c1", cat: "Speech/Social", text: "Responds to name" }, 
        { id: "s_c2", cat: "Speech/Social", text: "Engages in reciprocal play" }
    ];
    let html = `<div style="display:grid; gap:10px;" id="sensoryGrid">`;
    items.forEach(item => {
        html += `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--border-soft); display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
            <div><small style="color:var(--primary); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${item.cat}</small>
            <div style="font-size:1.05rem; margin-top:4px; font-weight:500;">${item.text}</div></div>
            <select class="sensory-eval-select" data-cat="${item.cat}" onchange="evaluateSensory()" style="width:auto; padding:8px 12px; border:2px solid var(--border-soft); border-radius:6px; font-weight:bold;">
                <option value="pending">-- Assess --</option><option value="pass">✅ Pass</option><option value="concern">🚨 Concern</option>
            </select>
        </div>`;
    });
    out.innerHTML = html + `</div><div id="sensoryReferralArea" style="margin-top:15px;"></div>`;
};

window.evaluateSensory = function() {
    const selects = document.querySelectorAll('.sensory-eval-select');
    let concerns = new Set();
    
    selects.forEach(sel => {
        if (sel.value === 'concern') {
            concerns.add(sel.getAttribute('data-cat'));
        }
    });

    const refArea = document.getElementById('sensoryReferralArea');
    if (!refArea) return;

    if (concerns.size === 0) {
        refArea.innerHTML = "";
        return;
    }

    let referrals = [];
    if (concerns.has("Vision")) referrals.push("👁️ Pediatric Ophthalmology for formal visual assessment.");
    if (concerns.has("Hearing")) referrals.push("👂 Audiology for BERA / OAE hearing screening.");
    if (concerns.has("Speech/Social")) referrals.push("🧠 Developmental Pediatrics / Early Intervention for ASD/Speech evaluation.");

    let refHtml = `
        <div style="background:rgba(239, 68, 68, 0.05); border:1px solid var(--danger); padding:15px; border-radius:8px; border-left:4px solid var(--danger);">
            <h4 style="margin:0 0 10px 0; color:var(--danger);">🚨 Required Referrals Detected</h4>
            <ul style="margin:0; padding-left:20px; font-size:0.95rem; color:var(--text-main); line-height:1.6;">
                ${referrals.map(r => `<li><b>${r}</b></li>`).join('')}
            </ul>
            <button class="action" onclick="appendSensoryReferral()" style="background:var(--danger); color:white; padding:10px; font-size:0.95rem; margin-top:10px; box-shadow:var(--shadow-sm);">📋 Append Referrals to Rx Advice</button>
        </div>
    `;
    
    window.latestSensoryAdvice = "Referrals Required:\n" + referrals.map(r => "- " + r).join("\n");
    refArea.innerHTML = refHtml;
};

window.appendSensoryReferral = function() {
    const rxAdvice = document.getElementById('rxAdvice');
    if (rxAdvice && window.latestSensoryAdvice) {
        let current = rxAdvice.value.trim();
        rxAdvice.value = current ? current + "\n\n" + window.latestSensoryAdvice : window.latestSensoryAdvice;
        if(typeof showSystemToast === 'function') showSystemToast("✅ Referrals sent to Prescription Pad");
        if(typeof renderRxCartList === 'function') renderRxCartList();
    } else {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Prescription pad not found or no referrals generated.");
    }
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

window.calcBurns = function() {
    const wt = parseFloat(document.getElementById('fluidWeight').value);
    const bsa = parseFloat(document.getElementById('burnBsa').value);
    const out = document.getElementById('burnResultArea');
    if(!wt || !bsa) { out.innerHTML = "Awaiting weight and % burn."; out.className="tool-result neutral"; return; }
    
    const pRes = ClinicalMath.calcParkland(wt, bsa);
    out.innerHTML = `
        <b>Total 24h Burn Fluid (LR/NS):</b> ${pRes.total.toFixed(0)} mL<br>
        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(239,68,68,0.3);">
            <b>1st 8 Hours:</b> ${pRes.first8h.toFixed(0)} mL <span style="color:var(--danger);">(${(pRes.first8h/8).toFixed(1)} mL/hr)</span><br>
            <b>Next 16 Hours:</b> ${pRes.next16h.toFixed(0)} mL <span style="color:var(--danger);">(${(pRes.next16h/16).toFixed(1)} mL/hr)</span>
        </div>
        <div style="margin-top:8px; font-size:0.8rem; color:var(--text-muted);">*Add to standard maintenance fluids.</div>
    `;
    out.className = "tool-result danger";
};

window.calcUmbilicalLines = function() {
    const bw = parseFloat(document.getElementById('umbilicalWt').value);
    const out = document.getElementById('umbilicalResultArea');
    if(!bw) { out.innerHTML = "Awaiting birth weight."; out.className="tool-result neutral"; return; }
    
    const lines = ClinicalMath.calcUmbilicalLines(bw);
    out.innerHTML = `
        <div style="display:grid; gap:8px;">
            <div style="background:var(--bg-surface); padding:8px; border-radius:6px; border:1px solid var(--border-soft);">
                <b>UAC (High):</b> <span style="color:var(--primary); font-size:1.1rem;">${lines.uacHigh.toFixed(1)} cm</span> <span style="font-size:0.8rem; color:var(--text-muted);">(T6-T9)</span>
            </div>
            <div style="background:var(--bg-surface); padding:8px; border-radius:6px; border:1px solid var(--border-soft);">
                <b>UAC (Low):</b> <span style="color:var(--primary); font-size:1.1rem;">${lines.uacLow.toFixed(1)} cm</span> <span style="font-size:0.8rem; color:var(--text-muted);">(L3-L5)</span>
            </div>
            <div style="background:var(--bg-surface); padding:8px; border-radius:6px; border:1px solid var(--border-soft);">
                <b>UVC:</b> <span style="color:var(--success); font-size:1.1rem;">${lines.uvc.toFixed(1)} cm</span> <span style="font-size:0.8rem; color:var(--text-muted);">(Above diaphragm)</span>
            </div>
        </div>
    `;
    out.className = "tool-result";
};

// --- 4. NICU METRICS ---
window.calcGIR = function() {
    const wt = parseFloat(document.getElementById('girWt').value);
    const rate = parseFloat(document.getElementById('girRate').value);
    const dex = parseFloat(document.getElementById('girDex').value);
    const out = document.getElementById('girOutput');
    if(!out) return;

    if(!wt || !rate || !dex || isNaN(wt)) { 
        out.innerHTML = "Enter weight, fluid rate, and dextrose percentage to compute GIR."; 
        out.className="tool-result neutral"; 
        return; 
    }

    const gir = (rate * dex) / (wt * 6);
    
    let d50Vol = 0;
    let d5wVol = 100;
    if (dex > 5 && dex <= 50) {
        d50Vol = (100 * (dex - 5)) / 45;
        d5wVol = 100 - d50Vol;
    }

    out.innerHTML = `
        <div style="text-align:center; width:100%;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Calculated Delivery</div>
            <h2 style="font-size:2.4rem; color:var(--success); margin:10px 0; font-weight:900;">${gir.toFixed(2)} <span style="font-size:1.1rem; color:var(--text-main);">mg/kg/min</span></h2>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">Normal Range: 4.0 - 8.0 mg/kg/min</div>
            
            <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-soft); font-size:0.85rem; text-align:left; line-height:1.5;">
                <b style="color:var(--primary-dark); display:block; margin-bottom:4px;">🍼 Compounding Guide (Per 100 mL Bag):</b>
                • <b>Dextrose 50% Water (D50W):</b> ${d50Vol.toFixed(1)} mL<br>
                • <b>Dextrose 5% Water (D5W):</b> ${d5wVol.toFixed(1)} mL
            </div>
        </div>
    `;
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
    const hrs = parseFloat(document.getElementById('jaunHours').value);
    const tsb = parseFloat(document.getElementById('jaunTSB').value);
    const risk = document.getElementById('jaunRisk').value;
    const out = document.getElementById('jaunResultArea');
    if(!out) return;

    if(!hrs || !tsb || isNaN(hrs)) { 
        out.innerHTML = "Awaiting data entry to map clinical risk limits."; 
        out.className="tool-result neutral"; 
        return; 
    }

    const curves = {
        low:  [12.0, 15.0, 18.0, 20.0],
        med:  [10.0, 13.0, 15.0, 18.0],
        high: [8.0,  11.0, 13.0, 15.0]
    };

    let targetCurve = curves[risk] || curves.med;
    let threshold = 0;

    if (hrs <= 24) {
        let fraction = hrs / 24;
        threshold = 4.0 + fraction * (targetCurve[0] - 4.0);
    } else if (hrs <= 48) {
        threshold = targetCurve[0] + ((hrs - 24) / 24) * (targetCurve[1] - targetCurve[0]);
    } else if (hrs <= 72) {
        threshold = targetCurve[1] + ((hrs - 48) / 24) * (targetCurve[2] - targetCurve[1]);
    } else if (hrs <= 96) {
        threshold = targetCurve[2] + ((hrs - 72) / 24) * (targetCurve[3] - targetCurve[2]);
    } else {
        threshold = targetCurve[3];
    }

    let isIndicated = tsb >= threshold;
    let colorClass = isIndicated ? "danger" : "success";
    let alertTitle = isIndicated ? "🚨 Phototherapy Indicated" : "✅ Below Intervention Level";

    let exchangeThreshold = threshold + 5.0;
    if (tsb >= exchangeThreshold) {
        alertTitle = "🚨 CRITICAL: Exchange Transfusion Range";
        colorClass = "danger";
    }

    out.innerHTML = `
        <div style="text-align:left; width:100%; line-height:1.5;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Risk Stratification Output</div>
            <h3 style="margin:5px 0; color:${isIndicated ? 'var(--danger)' : 'var(--success)'}; font-size:1.25rem;">${alertTitle}</h3>
            <div style="margin-top:8px; border-top:1px dashed var(--border-soft); padding-top:8px; font-size:0.9rem;">
                • <b>Patient TSB Level:</b> ${tsb.toFixed(1)} mg/dL<br>
                • <b>Phototherapy Cutoff:</b> ${threshold.toFixed(1)} mg/dL<br>
                • <b>Exchange Transfusion Limit:</b> ${exchangeThreshold.toFixed(1)} mg/dL
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px; font-style:italic;">
                *Based on AAP 2004 Clinical Guidelines for hyperbilirubinemia in neonates infants &ge; 35 weeks.
            </div>
        </div>
    `;
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
    if(typeof calcUmbilicalLines === 'function') calcUmbilicalLines();
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

// --- BP & ADVANCED MATH ---
window.calcBP = function() {
    const sys = parseFloat(document.getElementById('bpSys').value);
    const dia = parseFloat(document.getElementById('bpDia').value);
    const out = document.getElementById('bpOutputArea');
    
    if(!activePatientId || !sys || !dia) {
        out.innerHTML = "Enter parameters to map percentiles.";
        out.className = "tool-result neutral";
        return;
    }
    
    const p = AppStore.getPatient(activePatientId);
    const result = ClinicalMath.evaluateBP(sys, dia, p.ageYrs || 1, p.gender || 'male');
    
    out.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Percentile Status</div>
            <h2 style="color:${result.color}; margin:10px 0;">${result.status}</h2>
            <div style="font-size:0.9rem;">Evaluated for ${p.ageYrs}Y ${p.gender.toUpperCase()}</div>
        </div>
    `;
    out.style.borderColor = result.color;
    out.style.background = `rgba(${result.color === 'var(--danger)' ? '239,68,68' : (result.color === 'var(--warning)' ? '245,158,11' : '16,185,129')}, 0.1)`;
};

window.calcMathTools = function() {
    if(!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    
    // 1. BSA (Mosteller)
    let bsa = ClinicalMath.calcBSA(p.htCm, p.weight);
    if(bsa) document.getElementById('bsaOutput').innerText = `${bsa.toFixed(2)} m²`;
    
    // 2. eGFR (Schwartz)
    const cr = parseFloat(document.getElementById('mathCr').value);
    if(cr) {
        let egfr = ClinicalMath.calcEGFR(p.htCm, cr, p.ageYrs, p.gender);
        if(egfr) document.getElementById('egfrOutput').innerText = `${egfr.toFixed(0)} ml/min/1.73m²`;
    }

    // 3. Electrolytes & Free Water
    const currentNa = parseFloat(document.getElementById('mathCurrentNa').value);
    const targetNa = parseFloat(document.getElementById('mathTargetNa').value) || 135;
    const lytesOut = document.getElementById('lytesOutput');
    
    if (currentNa && p.weight) {
        let correction = ClinicalMath.calcSodiumCorrection(p.weight, currentNa, targetNa);
        if(correction) {
            if(currentNa < targetNa) {
                // Hyponatremia: Needs Sodium
                lytesOut.innerHTML = `
                    <div style="color:var(--danger); font-weight:bold; font-size:1.4rem;">${correction.naDeficit.toFixed(1)} mEq</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);"><b>Total Sodium Deficit</b><br>⚠️ Max correction rate: 0.5 mEq/L/hr to prevent Central Pontine Myelinolysis.</div>`;
            } else if (currentNa > targetNa) {
                // Hypernatremia: Needs Free Water
                lytesOut.innerHTML = `
                    <div style="color:var(--info); font-weight:bold; font-size:1.4rem;">${correction.freeWaterDeficit.toFixed(0)} mL</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);"><b>Free Water Deficit</b><br>⚠️ Replace deficit slowly over 48h to prevent cerebral edema.</div>`;
            } else {
                lytesOut.innerHTML = `<div style="color:var(--success); font-weight:bold; font-size:1.1rem;">Patient is Isnatremic</div>`;
            }
        }
    } else {
        lytesOut.innerHTML = `<span style="font-size:0.85rem; color:var(--text-muted);">Enter Current Na⁺ to evaluate deficits.</span>`;
    }
};