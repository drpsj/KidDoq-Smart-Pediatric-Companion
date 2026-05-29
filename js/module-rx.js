// js/module-rx.js

// --- NEW: UNIFIED FORMULARY MERGER ---
window.getUnifiedDB = function() {
    let combined = [...drugsDb];
    if (typeof customDrugsStore !== 'undefined') {
        Object.values(customDrugsStore).forEach(arr => {
            if (arr && arr.length) combined = combined.concat(arr);
        });
    }
    return combined;
};

// --- CORE CLINICAL MATH ENGINE ---

// --- 1. UNIFIED DOSAGE ENGINE (For the 🧮 Dose Calc Tab) ---
function populateDrugs() {
    const catElem = document.getElementById('drugCategory');
    if (!catElem) return; 
    
    const cat = catElem.value;
    const formSelect = document.getElementById('drugFormulation');
    if (!formSelect) return;
    
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => {
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`;
    });
}

function calculateDose() {
    const wtElem = document.getElementById('calcWeight');
    const formElem = document.getElementById('drugFormulation');
    const outputArea = document.getElementById('calcOutputArea');
    const btnArea = document.getElementById('rxAddButtonArea');
    
    if (!wtElem || !formElem || !outputArea || !btnArea) return; 
    
    const weight = parseFloat(wtElem.value);
    const drugId = formElem.value;
    
    if(!weight || drugId === "") {
        outputArea.innerHTML = "<div class='tool-result neutral'>Awaiting parameters. Ensure weight is entered.</div>";
        btnArea.innerHTML = ""; pendingPrescriptionDrug = null; return;
    }
    
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if (!drug) return;
    
    let math = ClinicalMath.computeDose(drug, weight);
    let unit = ClinicalMath.getUnit(drug);
    
    let durVal = document.getElementById('calcDuration') ? document.getElementById('calcDuration').value : "";
    let durStr = durVal ? ` x ${durVal} Days` : "";
    let finalFreq = `${drug.defaultFreq}${durStr}`;
    
    // --- NEW: VISUAL INDICATIONS & WARNINGS ---
    let warnHTML = math.isMax ? `<div style="color:var(--danger); font-size:0.85rem; margin-top:5px;">⚠️ Adult Max Cap Enforced (${drug.maxMg}mg)</div>` : "";
    if (drug.warnings && drug.warnings.length > 0) {
        warnHTML += `<div style="color:var(--warning); font-size:0.85rem; margin-top:5px; font-weight:600;">${drug.warnings.join("<br>")}</div>`;
    }
    let indHTML = "";
    if (drug.indications && drug.indications.length > 0) {
        indHTML = `<div style="margin-top:10px;">` + drug.indications.map(i => `<span style="background:rgba(0,212,255,0.1); color:var(--brand-cyan); border:1px solid rgba(0,212,255,0.2); padding:2px 8px; border-radius:12px; font-size:0.75rem; margin-right:6px; display:inline-block; font-weight:bold;">${i}</span>`).join("") + `</div>`;
    }

    outputArea.innerHTML = `
        <div class="result-card">
            <p style="margin-top:0; color:var(--text-muted); font-weight:700; font-size:0.75rem; text-transform:uppercase;">Administer Volume</p>
            <h2 style="font-size:3rem; margin:10px 0; color:var(--success); letter-spacing:-1px;">${math.reqVol.toFixed(1)} ${unit}</h2>
            <p style="color:var(--primary); font-weight:bold; font-size:1.1rem; margin-bottom:0;">Frequency: ${finalFreq}</p>
            ${indHTML}
            <div style="font-size:0.85rem; color:#64748b; margin-top:1.5rem; border-top:1px dashed var(--border-soft); padding-top:1rem;">
                Target: ${math.reqMg.toFixed(0)} mg/dose ${warnHTML}
            </div>
        </div>`;
    
    // Pass warnings into the details string so it hits the prescription pad
    let detailsText = math.isMax ? "Max dose cap enforced. " : "";
    if (drug.warnings && drug.warnings.length > 0) detailsText += drug.warnings.join(" ");

    pendingPrescriptionDrug = { name: drug.name, vol: math.reqVol.toFixed(1), freq: finalFreq, details: detailsText, unit: unit };
    
    if(activePatientId) {
        btnArea.innerHTML = `<button class="action" onclick="addToRxCart()" style="width:100%; font-size:1.1rem; padding:1rem; margin-top:1rem; background:var(--primary); color:white; border-radius:var(--radius-md); box-shadow:var(--shadow-md);">➕ Add to Active Draft</button>`;
    } else {
        btnArea.innerHTML = `<div style="text-align:center; color:var(--warning); font-size:0.85rem; padding-top:10px;">Independent Calculation Active.</div>`;
    }
}

function runHomeDoseCalc() {
    const wt = parseFloat(document.getElementById('homeWeight').value);
    const drugId = document.getElementById('homeFormulation').value;
    const res = document.getElementById('homeDoseResult');

    if(!wt || !drugId) { res.innerHTML = ''; return; }
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if(!drug) return;

    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    
    // --- NEW: VISUAL INDICATIONS & WARNINGS ---
    let warnHTML = math.isMax ? `<div style="color:var(--danger); font-size:0.85rem; font-weight:bold; margin-top:8px;">⚠️ Adult Max Cap Enforced</div>` : "";
    if (drug.warnings && drug.warnings.length > 0) {
        warnHTML += `<div style="color:var(--warning); font-size:0.8rem; margin-top:8px; text-align:left; line-height:1.4;">${drug.warnings.join("<br>")}</div>`;
    }
    let indHTML = "";
    if (drug.indications && drug.indications.length > 0) {
        indHTML = `<div style="margin-top:10px; margin-bottom:5px;">` + drug.indications.map(i => `<span style="background:rgba(91,97,246,0.1); color:var(--primary); padding:2px 8px; border-radius:12px; font-size:0.7rem; margin-right:4px; display:inline-block; font-weight:bold;">${i}</span>`).join("") + `</div>`;
    }

    res.innerHTML = `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--primary); text-align:center; box-shadow:var(--shadow-md);">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Calculated Quantity</div>
            <div style="font-size:2.8rem; color:var(--primary); font-weight:800; margin:5px 0;">${math.reqVol.toFixed(1)} <span style="font-size:1.2rem;">${unit}</span></div>
            <div style="font-size:1rem; color:var(--text-main); font-weight:700; background:rgba(91,97,246,0.1); padding:5px 10px; border-radius:4px; display:inline-block;">${drug.defaultFreq}</div>
            ${indHTML}
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:10px; padding-top:10px; border-top:1px solid var(--border-soft);">Target: ${math.reqMg.toFixed(0)} mg/dose</div>
            ${warnHTML}
        </div>
    `;
}

// --- 2. REVERSE AUDIT ENGINE ---
function populateRevDrugs() {
    const cat = document.getElementById('revCategory').value; 
    const formSelect = document.getElementById('revFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
}

function calcReverse() {
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const drugId = document.getElementById('revFormulation').value;
    const volGiven = parseFloat(document.getElementById('revVol').value); 
    const out = document.getElementById('revOutputArea');
    const addButtonArea = document.getElementById('revAddButtonArea');
    
    if(!weight || !drugId || !volGiven || isNaN(volGiven)) { out.innerHTML = "Awaiting volume parameters."; out.className = "tool-result neutral"; return; }
    
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if(!drug) return;
    if (drug.doseType === 'fixed') { out.innerHTML = "Fixed dose formulation. Standard is " + drug.vol + " unit(s)."; out.className="tool-result"; return; }
    
    let mgGiven = (volGiven * drug.conc) / drug.vol;
    let targetDosePerDose = drug.doseType === 'perDay' ? (drug.doseMg / (drug.div || 1)) : drug.doseMg;
    let mgPerKgGiven = mgGiven / weight;
    let percent = (mgPerKgGiven / targetDosePerDose) * 100;
    let status = percent > 120 ? "<span style='color:var(--danger)'>⚠️ Overdose</span>" : (percent < 80 ? "<span style='color:var(--warning)'>⚠️ Underdose</span>" : "<span style='color:var(--success)'>✅ Optimal Range</span>");
    
    out.innerHTML = `<div style="text-align:left;"><div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Administered Load Profile</div><h2 style="margin:5px 0;">${mgGiven.toFixed(1)} mg total</h2><div style="font-size:1.1rem; font-weight:bold; margin-bottom:10px;">= ${mgPerKgGiven.toFixed(2)} mg/kg/dose</div><div style="padding-top:10px; border-top:1px dashed var(--border-soft);"><b>Target Protocol:</b> ${targetDosePerDose.toFixed(1)} mg/kg/dose<br><b>Audit Status:</b> ${status} (${percent.toFixed(0)}%)</div></div>`;
    out.className = percent > 120 ? "tool-result danger" : (percent < 80 ? "tool-result warning" : "tool-result");
    
    let unitStr = ClinicalMath.getUnit(drug);
    pendingPrescriptionDrug = { name: drug.name, vol: volGiven.toFixed(1), freq: drug.defaultFreq, details: "Reverse Audited", unit: unitStr };
    
    if(activePatientId) {
        addButtonArea.innerHTML = `<button onclick='addPendingToRxCart()' class='action' style='background:var(--success);'>➕ Confirm & Add to Prescription Pad</button>`;
    }
}

// --- 3. CART MANAGEMENT ---
let pendingPrescriptionDrug = null;

function addPendingToRxCart() { 
    if(!activePatientId || !pendingPrescriptionDrug) return; 
    let p = AppStore.getPatient(activePatientId);
    if(!p.rxList) p.rxList = [];
    p.rxList.push(pendingPrescriptionDrug); 
    AppStore.savePatient(p); 
    
    if(document.getElementById('drugFormulation')) document.getElementById('drugFormulation').value = ""; 
    if(document.getElementById('calcOutputArea')) document.getElementById('calcOutputArea').innerHTML = "<div class='tool-result neutral'>Awaiting parameters.</div>"; 
    if(document.getElementById('rxAddButtonArea')) document.getElementById('rxAddButtonArea').innerHTML = ''; 
    if(document.getElementById('revAddButtonArea')) document.getElementById('revAddButtonArea').innerHTML = '';
    
    if(typeof showSystemToast === 'function') showSystemToast(`✅ Added ${pendingPrescriptionDrug.name}`);
    pendingPrescriptionDrug = null; 
    if(typeof renderRxCartList === 'function') renderRxCartList(); 
}

function addToRxCart() { addPendingToRxCart(); }

function removeDrugFromCart(idx) { 
    if(!activePatientId) return;
    let p = AppStore.getPatient(activePatientId);
    p.rxList.splice(idx,1); 
    AppStore.savePatient(p); 
    if(typeof renderRxCartList === 'function') renderRxCartList(); 
}

// --- 4. INDEPENDENT DASHBOARD CALCULATOR ---
function populateHomeDrugs() {
    const cat = document.getElementById('homeCategory').value;
    const formSelect = document.getElementById('homeFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
}

// --- EHR STATE MACHINE LOGIC ---
function renderVisitLedger() {
    if(!activePatientId) return;
    const p = globalPatientsStore[activePatientId];
    const ledgerList = document.getElementById('rxLedgerList');
    
    document.getElementById('rxLedgerView').style.display = 'block';
    document.getElementById('rxDraftView').style.display = 'none';
    
    if (!p.visits) p.visits = [];
    if (p.rxList && p.rxList.length > 0 && p.visits.length === 0) {
        p.visits.push({
            date: new Date().toISOString(),
            diagnosis: p.diagnosis || "Legacy Record",
            tests: p.tests || "",
            advice: p.advice || "",
            review: p.review || "",
            rxList: [...p.rxList]
        });
        p.rxList = []; 
        if(typeof DB !== 'undefined') DB.savePatient(p); 
    }

    if (p.visits.length === 0) {
        ledgerList.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); background:var(--bg-body); border-radius:var(--radius-lg); border:1px dashed var(--border-soft);">No historical encounters. Click 'Start New Visit' to begin a chart.</div>`;
        return;
    }

    let html = "";
    [...p.visits].reverse().forEach((visit) => {
        const dateStr = new Date(visit.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        let rxHtml = visit.rxList.map(rx => `• <b>${rx.name}</b> (${rx.vol} ${rx.unit}) - <i>${rx.freq}</i>`).join("<br>");
        
        html += `
        <div style="border:1px solid var(--border-soft); border-radius:var(--radius-md); padding:1.2rem; background:var(--bg-body); transition: transform 0.2s; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed var(--border-soft); padding-bottom:8px;">
                <b style="color:var(--primary-dark); font-size:1.05rem;">${dateStr}</b>
                <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Clinical Encounter</span>
            </div>
            ${visit.diagnosis ? `<div style="font-size:0.95rem; margin-bottom:10px; color:var(--text-main);"><b>Dx:</b> ${visit.diagnosis}</div>` : ''}
            <div style="font-size:0.9rem; color:var(--text-main); margin-bottom:10px; line-height:1.5;">${rxHtml || '<span style="color:var(--text-muted);">No medications prescribed.</span>'}</div>
            ${visit.tests ? `<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;"><b>Tests:</b> ${visit.tests}</div>` : ''}
            ${visit.advice ? `<div style="font-size:0.85rem; color:var(--text-muted);"><b>Advice:</b> ${visit.advice}</div>` : ''}
        </div>`;
    });
    ledgerList.innerHTML = html;
}

// --- PHASE 6: STRUCTURED SYMPTOMS & PREDICTIVE DDx ---
let activeDraftSymptoms = []; 

function addSymptomTag() {
    const name = document.getElementById('sympInput').value.trim();
    const val = document.getElementById('sympDurVal').value;
    const unit = document.getElementById('sympDurUnit').value;

    if (!name || !val) {
        if(typeof showSystemToast === 'function') showSystemToast("Please enter a symptom and duration.");
        return;
    }

    const tagString = `${name} x ${val} ${unit}`;
    activeDraftSymptoms.push(name.toLowerCase()); 
    
    const tagArea = document.getElementById('symptomTagsArea');
    document.getElementById('emptySympMsg').style.display = 'none';
    
    const tag = document.createElement('span');
    tag.className = 'symptom-tag';
    tag.innerHTML = `${tagString} <b style="cursor:pointer; color:var(--danger);" onclick="this.parentElement.remove(); evaluateDDx();">✖</b>`;
    
    tagArea.appendChild(tag);
    document.getElementById('sympInput').value = "";
    document.getElementById('sympDurVal').value = "";
    evaluateDDx(); 
}

function evaluateDDx() {
    const ddxArea = document.getElementById('ddxSuggestions');
    let suggestions = [];

    if (activeDraftSymptoms.includes('fever') && activeDraftSymptoms.includes('ear pain')) {
        suggestions.push('Acute Otitis Media (AOM)');
    }
    if (activeDraftSymptoms.includes('loose stools') && activeDraftSymptoms.includes('vomiting')) {
        suggestions.push('Acute Gastroenteritis (AGE)');
    }
    if (activeDraftSymptoms.includes('fever') && activeDraftSymptoms.includes('cough')) {
        suggestions.push('Viral URI');
        suggestions.push('Lower Respiratory Tract Infection');
    }
    if (activeDraftSymptoms.includes('wheezing')) {
        suggestions.push('Reactive Airway Disease / Asthma');
        suggestions.push('Acute Bronchiolitis');
    }

    if (suggestions.length > 0) {
        ddxArea.style.display = 'flex';
        ddxArea.innerHTML = `<span style="font-size:0.85rem; color:var(--primary); font-weight:bold; width:100%;">✨ AI Predicted Differentials:</span>` + 
            suggestions.map(dx => `<button type="button" class="secondary" onclick="document.getElementById('rxDiagnosis').value = '${dx}'; this.parentElement.style.display='none';" style="margin:0; padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--brand-cyan); color:var(--primary-dark); background:white;">${dx}</button>`).join("");
    } else {
        ddxArea.style.display = 'none';
    }
}

// --- PHASE 7: INVESTIGATION COMPILER ---
window.updateTestsTextarea = function() {
    let tests = [];
    document.querySelectorAll('.investigation-chips input:checked').forEach(cb => { tests.push(cb.value); });
    let custom = document.getElementById('rxTestsCustom');
    if (custom && custom.value.trim() !== "") tests.push(custom.value.trim());
    
    const hiddenInput = document.getElementById('rxTests');
    if (hiddenInput) hiddenInput.value = tests.join(", ");
    if(typeof renderRxCartList === 'function') renderRxCartList();
};

// --- 1. THE INLINE DRAFT CALCULATOR (Phase 8) ---
function populateInlineDrugs() {
    const cat = document.getElementById('inlineDrugCat').value;
    const sel = document.getElementById('inlineDrugSelect');
    sel.innerHTML = '<option value="">-- Select Drug --</option>';
    document.getElementById('inlineDoseResult').innerText = '';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        sel.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
}

function calcInlineDose() {
    const drugId = document.getElementById('inlineDrugSelect').value;
    const res = document.getElementById('inlineDoseResult');
    const freqInput = document.getElementById('inlineFreq');
    res.innerText = '';
    if(!drugId) { freqInput.value = ''; return; }
    
    const wtBox = document.getElementById('inlineCalcWeight');
    let wt = parseFloat(wtBox ? wtBox.value : AppStore.getPatient(activePatientId).weight);
    if(isNaN(wt)) wt = 10;
    
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if(!drug) return;
    
    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    
    // --- NEW: INLINE WARNINGS ---
    let warnHTML = math.isMax ? ` <span style="color:var(--danger); font-size:0.8rem;">(⚠️ Adult Max Cap)</span>` : "";
    let alertText = drug.warnings && drug.warnings.length > 0 ? `<br><span style="color:var(--warning); font-size:0.8rem; display:block; margin-top:2px;">${drug.warnings.join(" | ")}</span>` : "";
    
    res.innerHTML = `Calculated: <span style="font-size:1.1rem; color:var(--primary);">${math.reqVol.toFixed(1)} ${unit}</span> (${math.reqMg.toFixed(0)} mg)${warnHTML}${alertText}`;
    
    const durVal = document.getElementById('inlineDurVal').value;
    const durUnit = document.getElementById('inlineDurUnit').value;
    let durStr = durVal ? ` x ${durVal} ${durUnit}` : "";
    freqInput.value = `${drug.defaultFreq}${durStr}`;
}

// --- 2. THE SMART PROTOCOL ENGINE (Order Sets) ---
function autoCalcFromDB(drugId, freqStr = null, detailsStr = "") {
    if(!activePatientId) return null;
    const p = AppStore.getPatient(activePatientId);
    if(!p) return null;
    
    const wtBox = document.getElementById('inlineCalcWeight');
    let wt = parseFloat(wtBox ? wtBox.value : p.weight);
    if(isNaN(wt)) wt = parseFloat(p.weight) || 10; 
    
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if (!drug) return null;

    let math = ClinicalMath.computeDose(drug, wt);
    
    // Pass warnings directly into the order set prescriptions
    let finalDetails = detailsStr;
    if (math.isMax) finalDetails += (finalDetails ? " | " : "") + `⚠️ Max Dose Cap Enforced (${drug.maxMg}mg)`;
    if (drug.warnings && drug.warnings.length > 0) {
        finalDetails += (finalDetails ? " | " : "") + drug.warnings.join(" | ");
    }

    return {
        name: drug.name,
        vol: math.reqVol.toFixed(1),
        unit: ClinicalMath.getUnit(drug),
        freq: freqStr || drug.defaultFreq,
        details: finalDetails
    };
}

function applyOrderSet(setId) {
    if(!activePatientId || !setId) return;
    let p = AppStore.getPatient(activePatientId);
    if (!p) return;
    if (!p.rxList) p.rxList = []; 

    let dx = ""; let advice = ""; let newRx = [];

    function injectSymp(name, val, unit) {
        if(typeof activeDraftSymptoms !== 'undefined') activeDraftSymptoms.push(name.toLowerCase());
        document.getElementById('symptomTagsArea').innerHTML += `<span class="symptom-tag">${name} x ${val} ${unit} <b style="cursor:pointer; color:var(--danger);" onclick="this.parentElement.remove(); evaluateDDx();">✖</b></span>`;
    }

    if (setId === 'os_aom') {
        dx = "Acute Otitis Media (AOM)"; advice = "Keep ear dry. Do not insert cotton buds.";
        injectSymp("Ear Pain", "2", "Days"); injectSymp("Fever", "2", "Days");
        newRx.push(autoCalcFromDB("ab_05", "BID x 5 Days")); 
        newRx.push(autoCalcFromDB("ap_04", "SOS for Ear Pain / Fever")); 
    } 
    else if (setId === 'os_uri') {
        dx = "Viral Upper Respiratory Infection (URI)"; advice = "Maintain hydration. Steam inhalation twice daily.";
        injectSymp("Cough", "3", "Days"); injectSymp("Cold", "3", "Days");
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H for Fever"));
        newRx.push({ name: "Saline Nasal Drops (0.65%)", vol: "2", unit: "drops", freq: "TID in both nostrils", details: "" });
    } 
    else if (setId === 'os_age') {
        dx = "Acute Gastroenteritis (AGE)"; advice = "Strict ORS after every loose stool. Avoid sugary juices.";
        injectSymp("Loose Stools", "2", "Days"); injectSymp("Vomiting", "1", "Days");
        newRx.push({ name: "ORS Sachet", vol: "1", unit: "packet", freq: "Mix in 1L water, sip 50-100ml after loose stool", details: "" });
        newRx.push(autoCalcFromDB("gi_10", "OD x 14 Days")); 
        newRx.push(autoCalcFromDB("gi_03", "STAT for vomiting")); 
    } 
    else if (setId === 'os_fever') {
        dx = "Acute Febrile Illness"; advice = "Tepid sponging for high fever. Ensure adequate fluid intake.";
        injectSymp("Fever", "3", "Days");
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H for Fever"));
        newRx.push(autoCalcFromDB("ap_11", "SOS Q8H for High Grade Fever")); 
    }

    newRx = newRx.filter(rx => rx !== null);
    
    const dxInput = document.getElementById('rxDiagnosis');
    if (dxInput) {
        if (dxInput.value && !dxInput.value.includes(dx)) { dxInput.value = dxInput.value + " | " + dx; } 
        else if (!dxInput.value) { dxInput.value = dx; }
    }
    
    const adviceInput = document.getElementById('rxAdvice');
    if (adviceInput) {
        if (adviceInput.value && !adviceInput.value.includes(advice)) { adviceInput.value = adviceInput.value + "\n" + advice; } 
        else if (!adviceInput.value) { adviceInput.value = advice; }
    }

    p.rxList = p.rxList.concat(newRx);
    AppStore.savePatient(p); 
    
    if(typeof renderRxCartList === 'function') renderRxCartList();
    document.getElementById('orderSetSelect').value = "";
}

// --- 3. LIVE RX PREVIEW (FIXED) ---
window.renderRxCartList = function() { 
    const container = document.getElementById('rxCartList'); 
    if(!activePatientId) return; 
    
    const p = AppStore.getPatient(activePatientId);
    let list = p.rxList || []; 
    
    let html = `
        <div style="border-bottom:2px solid #1e3a8a; padding-bottom:10px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <strong style="color:#1e3a8a; font-size:1.1rem;">${appSettings.clinicName || 'Clinic'}</strong><br>
                <span style="font-size:0.8rem; color:#555;">${appSettings.docName || 'Doctor'}</span>
            </div>
            <div style="text-align:right; font-size:0.75rem; color:#555; line-height:1.4;">
                <b>${p.name}</b><br>${p.weight} kg
            </div>
        </div>
        <div style="font-size:1.4rem; color:#1e3a8a; font-family:serif; margin-bottom:10px; font-weight:bold;">Rx</div>
    `;

    if(list.length === 0) {
        html += "<div style='color:#999; font-style:italic; font-size:0.9rem;'>Prescription pad empty. Add drugs via calculators.</div>";
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
        list.forEach((r,i) => {
            // Highlight warnings in red if they exist on the Rx Pad
            let detailsDisplay = "";
            if (r.details) {
                let color = r.details.includes("⚠️") ? "var(--danger)" : "#888";
                detailsDisplay = `<div style="font-size:0.75rem; color:${color}; font-weight:600; margin-top:4px;">${r.details}</div>`;
            }

            html += `
            <div style="display:flex; justify-content:space-between; align-items:start; padding-bottom:8px; border-bottom:1px dashed #eee;">
                <div>
                    <strong style="font-size:0.95rem; color:#333;">${i+1}. ${r.name}</strong><br>
                    <span style="font-size:0.85rem; color:#555;">Give <b style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${r.vol} ${r.unit}</b> — <i>${r.freq}</i></span>
                    ${detailsDisplay}
                </div>
                <button onclick="removeDrugFromCart(${i})" style="background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; font-weight:bold;">✖</button>
            </div>`;
        });
        html += `</div>`;
    }

    const dx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
    if (dx) html += `<div style="margin-top:15px; font-size:0.85rem; border-top:1px dashed #eee; padding-top:10px;"><b>Dx:</b> ${dx}</div>`;
    
    const tests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
    if (tests) html += `<div style="margin-top:10px; font-size:0.85rem;"><b>Investigations:</b> ${tests}</div>`;
    
    const adv = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
    if (adv) html += `<div style="margin-top:10px; font-size:0.85rem;"><b>Advice:</b> ${adv.replace(/\n/g, '<br>')}</div>`;

    container.innerHTML = html;
};

function addInlineDrugToCart() {
    const drugId = document.getElementById('inlineDrugSelect').value;
    const freq = document.getElementById('inlineFreq').value;
    if(!drugId || !freq) { if(typeof showSystemToast === 'function') showSystemToast("⚠️ Select a drug & frequency."); return; }
    
    const rxObj = autoCalcFromDB(drugId, freq);
    if(rxObj) {
        const p = AppStore.getPatient(activePatientId);
        if(!p.rxList) p.rxList = [];
        p.rxList.push(rxObj);
        
        AppStore.savePatient(p); 
        globalPatientsStore[activePatientId] = p; 
        
        if(typeof renderRxCartList === 'function') renderRxCartList();
        
        document.getElementById('inlineDrugSelect').value = '';
        document.getElementById('inlineFreq').value = '';
        document.getElementById('inlineDoseResult').innerHTML = '';
    }
}

// --- 4. INTEGRATED MEDS AUDIT & HOPI ---
let lastAuditResult = "";

window.calcReverse = function() {
    const wtBox = document.getElementById('inlineCalcWeight');
    const wt = parseFloat(wtBox ? wtBox.value : AppStore.getPatient(activePatientId).weight);
    const drugId = document.getElementById('revFormulation').value;
    const volGiven = parseFloat(document.getElementById('revVol').value); 
    const out = document.getElementById('revOutputArea');
    
    if(!wt || !drugId || !volGiven || isNaN(volGiven)) { out.innerHTML = ""; lastAuditResult = ""; return; }
    
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if(!drug) return;
    
    const audit = ClinicalMath.evaluateReverseAudit(drug, wt, volGiven);
    if (!audit) return;

    if (audit.isFixed) { 
        out.innerHTML = `<span style="color:var(--primary)">Fixed dose baseline standard format.</span>`;
        lastAuditResult = `${drug.name}: ${volGiven} unit(s) reported (Fixed Dose configuration model).`;
        return; 
    }
    
    out.innerHTML = `Received: <b>${audit.mgPerKgGiven.toFixed(1)}</b> mg/kg. Target: <b>${audit.targetDosePerDose.toFixed(1)}</b>. <span style="color:${audit.statusColor}; font-weight:bold;">[${audit.statusText}]</span>`;
    lastAuditResult = `Prior Meds: ${drug.name} (${volGiven}mL) evaluated at ${audit.mgPerKgGiven.toFixed(1)} mg/kg/dose (Target standard: ${audit.targetDosePerDose.toFixed(1)}). Clinical Status: ${audit.statusText}.`;
};

window.appendAuditToHopi = function() {
    if(!lastAuditResult) { if(typeof showSystemToast === 'function') showSystemToast("⚠️ Enter audit details first."); return; }
    const hopi = document.getElementById('rxHopi');
    if(!hopi) return;
    let val = hopi.value.trim();
    hopi.value = val ? val + "\n" + lastAuditResult : lastAuditResult;
    
    document.getElementById('revVol').value = "";
    document.getElementById('revOutputArea').innerHTML = "";
    lastAuditResult = "";
    if(typeof showSystemToast === 'function') showSystemToast("✅ Appended to HOPI");
};

window.previewDraft = function() {
    if(typeof openActiveSummary === 'function') {
        let summaryBtn = document.querySelectorAll('.nav-item')[3]; 
        openActiveSummary(summaryBtn);
    }
};

window.editDraft = function() {
    if(typeof ViewController !== 'undefined') {
        ViewController.switchNavTab('toolsTab');
        ViewController.openClinicalTool('prescriptionFeatureView');
        let rxNotesTabBtn = document.querySelector('[onclick*="rxNotesTab"]');
        if(rxNotesTabBtn) ViewController.switchSubTab('rxNotesTab', rxNotesTabBtn);
    }
};

window.lockVisit = async function() {
    if(!AppStore.getActivePatientId()) return;
    let p = AppStore.getPatient(AppStore.getActivePatientId());
    if (!p.visits) p.visits = [];
    
    let todayStr = new Date().toISOString().split('T')[0];
    let todaysVax = [];
    if(p.givenDates) {
        for (const [vaxId, date] of Object.entries(p.givenDates)) {
            if (date === todayStr) todaysVax.push(vaxId);
        }
    }
    
    const newVisit = {
        id: 'v_' + Date.now(),
        date: new Date().toISOString(),
        weight: p.weight || "",
        htCm: p.htCm || "",
        hopi: document.getElementById('rxHopi') ? document.getElementById('rxHopi').value : "",
        diagnosis: p.diagnosis || "",
        tests: p.tests || "",
        advice: p.advice || "",
        review: p.review || "",
        
        examRS: p.examRS || "",
        examCVS: p.examCVS || "",
        examPA: p.examPA || "",
        examCNS: p.examCNS || "",
        
        rxList: [...(p.rxList || [])], 
        dietLogs: [...(p.dietLogs || [])], 
        vaccinesGiven: todaysVax 
    };
    
    p.visits.push(newVisit); 
    
    p.rxList = []; 
    p.dietLogs = []; 
    p.diagnosis = ""; p.tests = ""; p.advice = ""; p.review = ""; 
    p.examRS = ""; p.examCVS = ""; p.examPA = ""; p.examCNS = "";
    
    ['rxDiagnosis', 'rxTests', 'rxAdvice', 'rxReview', 'examRS', 'examCVS', 'examPA', 'examCNS'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = "";
    });
    
    AppStore.savePatient(p); 
    if(typeof DB !== 'undefined') await DB.savePatient(p); 
    if(typeof showSystemToast === 'function') showSystemToast("✅ Visit securely locked to historical ledger.");
    
    let ledgerBtn = document.querySelectorAll('.nav-item')[2]; 
    if(typeof openHistoricalEncounters === 'function') openHistoricalEncounters(ledgerBtn);
};

window.cancelNewVisit = function() {
    if(confirm("Discard this draft? Unsaved changes will be lost.")) {
        renderVisitLedger();
    }
};

window.fillNormalExams = function() {
    document.getElementById('examRS').value = 'B/L NVBS heard, no added sounds.';
    document.getElementById('examCVS').value = 'S1, S2 heard. No murmurs.';
    document.getElementById('examPA').value = 'Soft, non-tender. Bowel sounds present.';
    document.getElementById('examCNS').value = 'Conscious, active. No focal neurological deficits.';
    if(typeof showSystemToast === 'function') showSystemToast("✅ Normal systemic findings injected.");
};

window.startNewVisit = function() {
    document.getElementById('rxLedgerView').style.display = 'none';
    document.getElementById('rxDraftView').style.display = 'block';
    document.getElementById('draftDateText').innerText = new Date().toLocaleDateString('en-IN');
    
    const fields = ['rxDiagnosis', 'rxTests', 'rxAdvice', 'rxReview', 'rxHopi', 'rxTestsCustom'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    document.querySelectorAll('.investigation-chips input[type="checkbox"]').forEach(cb => cb.checked = false);
    const sympArea = document.getElementById('symptomTagsArea');
    if (sympArea) {
        sympArea.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;" id="emptySympMsg">No symptoms added yet.</span>';
    }
    
    if(activePatientId && globalPatientsStore[activePatientId]) {
        const wtInput = document.getElementById('inlineCalcWeight');
        if(wtInput) {
            wtInput.value = globalPatientsStore[activePatientId].weight || "";
        }
    }

    if(typeof renderRxCartList === 'function') renderRxCartList();
};