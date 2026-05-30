// js/module-rx.js

// --- UNIFIED FORMULARY MERGER ---
window.getUnifiedDB = function() {
    let combined = [...drugsDb];
    if (typeof customDrugsStore !== 'undefined') {
        Object.values(customDrugsStore).forEach(arr => {
            if (arr && arr.length) combined = combined.concat(arr);
        });
    }
    return combined;
};

// --- NEONATAL MODE ENGINE ---
let isNeonateMode = false;

window.toggleNeonateMode = function(enabled) {
    isNeonateMode = enabled;
    if(enabled) {
        if(typeof showSystemToast === 'function') showSystemToast("🍼 Neonatal Mode: Intervals adjusted for PMA.");
    } else {
        if(typeof showSystemToast === 'function') showSystemToast("Pediatric Mode Active.");
    }
    if(typeof calcInlineDose === 'function') calcInlineDose();
};

function getNeonateInterval(drugName, baseFreq) {
    if (!isNeonateMode) return baseFreq;
    const highRiskDrugs = ['amikacin', 'gentamicin', 'tobramycin', 'vancomycin', 'caffeine'];
    if (highRiskDrugs.some(d => drugName.toLowerCase().includes(d))) {
        return "Q36H"; 
    }
    return baseFreq;
}

// --- FREQUENCY TRANSLATOR (TID -> 1-1-1) ---
window.translateFreqToLocal = function(freqStr) {
    if (!freqStr) return "";
    let str = freqStr.toUpperCase();
    str = str.replace(/\b(TID|TDS)\b/g, "(1-1-1)");
    str = str.replace(/\b(BID|BD)\b/g, "(1-0-1)");
    str = str.replace(/\b(QID)\b/g, "(1-1-1-1)");
    str = str.replace(/\b(OD|QD)\b/g, "(1-0-0)");
    str = str.replace(/\b(HS)\b/g, "(0-0-1)");
    return str;
};

// --- 1. UNIFIED DOSAGE ENGINE (For the 🧮 Dose Calc Tab) ---
window.populateDrugs = function() {
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
};

window.calculateDose = function() {
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
    
    pendingPrescriptionDrug = { name: drug.name, vol: math.reqVol.toFixed(1), freq: finalFreq, details: "", unit: unit };
    
    if(activePatientId) {
        btnArea.innerHTML = `<button class="action" onclick="addToRxCart()" style="width:100%; font-size:1.1rem; padding:1rem; margin-top:1rem; background:var(--primary); color:white; border-radius:var(--radius-md); box-shadow:var(--shadow-md);">➕ Add to Active Draft</button>`;
    } else {
        btnArea.innerHTML = `<div style="text-align:center; color:var(--warning); font-size:0.85rem; padding-top:10px;">Independent Calculation Active.</div>`;
    }
};

window.runHomeDoseCalc = function() {
    const wt = parseFloat(document.getElementById('homeWeight').value);
    const drugId = document.getElementById('homeFormulation').value;
    const res = document.getElementById('homeDoseResult');

    if(!wt || !drugId) { res.innerHTML = ''; return; }
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if(!drug) return;

    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    
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
};

window.populateHomeDrugs = function() {
    const cat = document.getElementById('homeCategory').value;
    const formSelect = document.getElementById('homeFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
};

// --- 2. REVERSE AUDIT ENGINE ---
window.populateRevDrugs = function() {
    const cat = document.getElementById('revCategory').value; 
    const formSelect = document.getElementById('revFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = getUnifiedDB().filter(d => d.category === cat);
    filtered.forEach(d => { 
        const icon = d.isCustom ? "👤 " : "";
        formSelect.innerHTML += `<option value="${d.id}">${icon}${d.name}</option>`; 
    });
};

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

// --- 3. CART MANAGEMENT ---
let pendingPrescriptionDrug = null;

window.addPendingToRxCart = function() { 
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
};

window.addToRxCart = window.addPendingToRxCart;

window.removeDrugFromCart = function(idx) { 
    if(!activePatientId) return;
    let p = AppStore.getPatient(activePatientId);
    p.rxList.splice(idx,1); 
    AppStore.savePatient(p); 
    if(typeof renderRxCartList === 'function') renderRxCartList(); 
};

// --- SYMPTOM TRACKER & AI DDX ---
let activeDraftSymptoms = []; 

window.addSymptomTag = function() {
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
    if(document.getElementById('emptySympMsg')) document.getElementById('emptySympMsg').style.display = 'none';
    
    const tag = document.createElement('span');
    tag.className = 'symptom-tag';
    tag.style.cssText = "background:var(--primary-light); color:var(--primary-dark); padding:6px 12px; border-radius:20px; font-size:0.85rem; font-weight:600; display:inline-flex; align-items:center; border:1px solid var(--primary); margin:0 4px 4px 0;";
    tag.innerHTML = `${tagString} <b style="margin-left:8px; cursor:pointer; color:var(--danger); font-size:1.1rem; line-height:1;" onclick="this.parentElement.remove(); evaluateDDx(); renderRxCartList();">✖</b>`;
    
    tagArea.appendChild(tag);
    document.getElementById('sympInput').value = "";
    document.getElementById('sympDurVal').value = "";
    evaluateDDx(); 
    renderRxCartList();
};

window.evaluateDDx = function() {
    const ddxArea = document.getElementById('ddxSuggestions');
    if(!ddxArea) return;
    let suggestions = [];

    if (activeDraftSymptoms.includes('fever') && activeDraftSymptoms.includes('ear pain')) suggestions.push('Acute Otitis Media (AOM)');
    if (activeDraftSymptoms.includes('loose stools') && activeDraftSymptoms.includes('vomiting')) suggestions.push('Acute Gastroenteritis (AGE)');
    if (activeDraftSymptoms.includes('fever') && activeDraftSymptoms.includes('cough')) { suggestions.push('Viral URI'); suggestions.push('LRTI'); }
    if (activeDraftSymptoms.includes('wheezing')) { suggestions.push('Asthma Exacerbation'); suggestions.push('Acute Bronchiolitis'); }

    if (suggestions.length > 0) {
        ddxArea.style.display = 'flex';
        ddxArea.innerHTML = `<span style="font-size:0.85rem; color:var(--primary); font-weight:bold; width:100%;">✨ AI Predicted Differentials:</span>` + 
            suggestions.map(dx => `<button type="button" class="secondary" onclick="document.getElementById('rxDiagnosis').value = '${dx}'; this.parentElement.style.display='none'; renderRxCartList();" style="margin:0; padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--brand-cyan); color:var(--primary-dark); background:white;">${dx}</button>`).join("");
    } else {
        ddxArea.style.display = 'none';
    }
};

window.updateTestsTextarea = function() {
    let tests = [];
    document.querySelectorAll('.investigation-chips input:checked').forEach(cb => { tests.push(cb.value); });
    let custom = document.getElementById('rxTestsCustom');
    if (custom && custom.value.trim() !== "") tests.push(custom.value.trim());
    
    const hiddenInput = document.getElementById('rxTests');
    if (hiddenInput) hiddenInput.value = tests.join(", ");
    if(typeof renderRxCartList === 'function') renderRxCartList();
};

// --- THE SMART PROTOCOL ENGINE (Order Sets) ---
function autoCalcFromDB(drugId, freqStr = null, detailsStr = "") {
    if(!activePatientId) return null;
    const p = AppStore.getPatient(activePatientId);
    let wt = parseFloat(document.getElementById('inlineCalcWeight') ? document.getElementById('inlineCalcWeight').value : p.weight) || 10;
    const drug = getUnifiedDB().find(d => d.id === drugId);
    if (!drug) return null;

    let math = ClinicalMath.computeDose(drug, wt);
    return {
        id: drug.id, name: drug.name, vol: math.reqVol.toFixed(1),
        unit: ClinicalMath.getUnit(drug), freq: freqStr || drug.defaultFreq,
        details: detailsStr, type: drug.doseType
    };
}

window.applyOrderSet = function(setId) {
    if(!activePatientId || !setId) return;
    let p = AppStore.getPatient(activePatientId);
    if (!p) return;
    if (!p.rxList) p.rxList = [];

    const currentDx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
    if (currentDx !== "" && !confirm("⚠️ Applying a protocol will overwrite your current Diagnosis and Advice. Continue?")) {
        document.getElementById('orderSetSelect').value = "";
        return;
    }

    const protocols = {
        os_uri: { dx: "Viral Upper Respiratory Infection (URI)", symp: [["Cold","3","Days"],["Cough","3","Days"]], tests: [], advice: "Maintain hydration. Saline drops for blocked nose. Steam inhalation.\n⚠️ Return if fast breathing or poor feeding." },
        os_age: { dx: "Acute Gastroenteritis (Mild Dehydration)", symp: [["Loose Stools","2","Days"],["Vomiting","1","Days"]], tests: ["Serum Electrolytes"], advice: "Strict ORS (10-20 ml/kg) after every loose stool. Continue normal diet.\n⚠️ Return if blood in stool, persistent vomiting, or sunken eyes." },
        os_fever: { dx: "Acute Febrile Illness", symp: [["Fever","3","Days"]], tests: ["CBC", "CRP", "Urine Routine", "Dengue NS1/IgM"], advice: "Tepid sponging for fever > 101°F. Ensure plenty of oral fluids." },
        os_asthma: { dx: "Acute Exacerbation of Asthma", symp: [["Wheezing","1","Days"],["Cough","2","Days"]], tests: ["CXR (PA View)"], advice: "Use MDI with spacer and mask. Avoid triggers.\n⚠️ Return to ER if respiratory distress or unable to speak." },
        os_uti: { dx: "Urinary Tract Infection (UTI)", symp: [["Fever","2","Days"],["Vomiting","1","Days"]], tests: ["Urine Routine", "Urine Culture", "USG Abdomen & Pelvis"], advice: "Ensure plenty of oral fluids. Maintain hygiene. Follow up with Culture reports." },
        os_imnci_pneumonia: { dx: "Pneumonia (IMNCI)", symp: [["Cough","3","Days"],["Fast Breathing","1","Days"]], tests: ["CBC", "CXR (PA View)"], advice: "IMNCI: Keep child warm. Continue feeding.\n⚠️ Return IMMEDIATELY if unable to drink or chest indrawing. Follow up in 2 days." },
        os_imnci_dysentery: { dx: "Dysentery (IMNCI)", symp: [["Blood in Stool","2","Days"],["Fever","2","Days"]], tests: ["Stool Routine", "Stool Culture"], advice: "IMNCI: Continue feeding. Give ORS.\n⚠️ Return if lethargic. Follow up in 2 days." },
        os_imnci_ear: { dx: "Acute Ear Infection (IMNCI)", symp: [["Ear Pain","2","Days"],["Fever","2","Days"]], tests: [], advice: "IMNCI: Keep ear dry. Do NOT insert cotton buds.\nFollow up in 5 days, or sooner if high fever develops." },
        os_aom: { dx: "Acute Otitis Media (AOM)", symp: [["Ear Pain","2","Days"],["Fever","2","Days"]], tests: [], advice: "Keep ear dry. Follow up if fever persists." }
    };

    const pData = protocols[setId];
    if (!pData) return;

    if(document.getElementById('rxDiagnosis')) document.getElementById('rxDiagnosis').value = pData.dx;
    if(document.getElementById('rxAdvice')) document.getElementById('rxAdvice').value = pData.advice;

    // Reset and Add Symptoms
    const sympArea = document.getElementById('symptomTagsArea');
    if (sympArea) sympArea.innerHTML = '';
    activeDraftSymptoms = [];
    if(document.getElementById('emptySympMsg')) document.getElementById('emptySympMsg').style.display = 'none';
    
    pData.symp.forEach(s => {
        activeDraftSymptoms.push(s[0].toLowerCase());
        if (sympArea) sympArea.innerHTML += `<span class="symptom-tag" style="background:var(--primary-light); color:var(--primary-dark); padding:6px 12px; border-radius:20px; font-size:0.85rem; font-weight:600; display:inline-flex; align-items:center; border:1px solid var(--primary); margin:0 4px 4px 0;">${s[0]} x ${s[1]} ${s[2]} <b style="margin-left:8px; cursor:pointer; color:var(--danger); font-size:1.1rem; line-height:1;" onclick="this.parentElement.remove(); evaluateDDx(); renderRxCartList();">✖</b></span>`;
    });

    // Check Investigations
    document.querySelectorAll('.chip-checkbox input').forEach(chk => {
        chk.checked = pData.tests.includes(chk.value);
    });
    if (typeof updateTestsTextarea === 'function') updateTestsTextarea();

    // Specific Drug Additions (Prevents Avalanche)
    let newRx = [];
    if (setId === 'os_aom' || setId === 'os_imnci_ear') {
        newRx.push(autoCalcFromDB("ab_05", "BID", "For 5 Days")); 
        newRx.push(autoCalcFromDB("ap_04", "SOS", "For Ear Pain / Fever")); 
    } else if (setId === 'os_uri') {
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H", "For Fever"));
        newRx.push({ id:"custom_nasal", name: "Saline Nasal Drops (0.65%)", vol: "2", unit: "drops", freq: "TID", details: "In both nostrils", type: "fixed" });
    } else if (setId === 'os_age' || setId === 'os_imnci_dysentery') {
        newRx.push({ id:"custom_ors", name: "ORS Sachet", vol: "1", unit: "packet", freq: "SOS", details: "Mix in 1L water, sip 50-100ml after loose stool", type: "fixed" });
        newRx.push(autoCalcFromDB("gi_10", "OD", "For 14 Days")); 
        if(setId === 'os_age') newRx.push(autoCalcFromDB("gi_03", "STAT", "For vomiting")); 
        if(setId === 'os_imnci_dysentery') newRx.push(autoCalcFromDB("ab_09", "BID", "For 5 Days")); 
    } else if (setId === 'os_fever') {
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H", "For Fever"));
        newRx.push(autoCalcFromDB("ap_11", "SOS Q8H", "For High Grade Fever")); 
    } else if (setId === 'os_imnci_pneumonia') {
        newRx.push(autoCalcFromDB("ab_01", "TID", "For 5 Days")); 
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H", "For Fever"));
    } else if (setId === 'os_asthma') {
        newRx.push(autoCalcFromDB("rs_01", "TID", "Via MDI with Spacer"));
        newRx.push(autoCalcFromDB("rs_10", "OD", "For 5 Days"));
        newRx.push(autoCalcFromDB("em_07", "OD", "For 3 Days"));
    } else if (setId === 'os_uti') {
        newRx.push(autoCalcFromDB("ab_24", "BID", "For 7 Days"));
        newRx.push(autoCalcFromDB("ap_04", "SOS Q6H", "For Fever"));
    }

    newRx.forEach(rx => {
        if(rx && !p.rxList.find(r => r.id === rx.id)) p.rxList.push(rx);
    });

    AppStore.savePatient(p); 
    renderRxCartList();
    document.getElementById('orderSetSelect').value = "";
    if(typeof showSystemToast === 'function') showSystemToast("⚡ Protocol Applied: " + pData.dx);
};

// --- INLINE CALCULATOR ---
window.populateInlineDrugs = function() {
    const catSelect = document.getElementById('inlineDrugCat');
    const drugSelect = document.getElementById('inlineDrugSelect');
    if (!catSelect || !drugSelect) return;
    
    const selectedCat = catSelect.value;
    drugSelect.innerHTML = '<option value="">-- Select Drug --</option>';
    
    let db = typeof getUnifiedDB === 'function' && getUnifiedDB() ? getUnifiedDB() : window.drugsDb;
    const filteredDrugs = selectedCat === 'all' ? db : db.filter(d => d.category && d.category.toLowerCase() === selectedCat.toLowerCase());
        
    filteredDrugs.forEach(d => {
        let opt = document.createElement('option');
        opt.value = d.id; opt.innerText = d.name;
        drugSelect.appendChild(opt);
    });
    
    if (document.getElementById('inlineDoseResult')) document.getElementById('inlineDoseResult').innerText = '';
    if (document.getElementById('inlineFreq')) document.getElementById('inlineFreq').value = '';
};

window.calcInlineDose = function() {
    const drugId = document.getElementById('inlineDrugSelect').value;
    const res = document.getElementById('inlineDoseResult');
    const freqInput = document.getElementById('inlineFreq');
    res.innerText = '';
    if(!drugId) { freqInput.value = ''; return; }
    
    const wtBox = document.getElementById('inlineCalcWeight');
    let wt = parseFloat(wtBox ? wtBox.value : AppStore.getPatient(activePatientId).weight) || 10;
    
    let db = typeof getUnifiedDB === 'function' ? getUnifiedDB() : window.drugsDb;
    const drug = db.find(d => d.id === drugId);
    if(!drug) return;
    
    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    
    let warnHTML = math.isMax ? ` <span style="color:var(--danger); font-size:0.8rem;">(⚠️ Adult Max Cap)</span>` : "";
    let alertText = drug.warnings && drug.warnings.length > 0 ? `<br><span style="color:var(--warning); font-size:0.8rem; display:block; margin-top:2px;">${drug.warnings.join(" | ")}</span>` : "";
    
    res.dataset.vol = math.reqVol; res.dataset.mg = math.reqMg; res.dataset.unit = unit;
    res.innerHTML = `Calculated: <span style="font-size:1.1rem; color:var(--primary);">${math.reqVol.toFixed(1)} ${unit}</span> (${math.reqMg.toFixed(0)} mg)${warnHTML}${alertText}`;
    
    let adjustedFreq = getNeonateInterval(drug.name, drug.defaultFreq);
    if(!freqInput.value) freqInput.value = adjustedFreq;
};

window.addInlineDrugToCart = function() {
    if(!activePatientId) { showSystemToast("⚠️ Open a patient file first!"); return; }
    const drugId = document.getElementById('inlineDrugSelect').value;
    const res = document.getElementById('inlineDoseResult');
    const freqInput = document.getElementById('inlineFreq');
    const durVal = document.getElementById('inlineDurVal').value;
    const durUnit = document.getElementById('inlineDurUnit').value;
    
    if(!drugId || !res.dataset.vol) { showSystemToast("⚠️ Please select a drug and valid weight first."); return; }

    let db = typeof getUnifiedDB === 'function' ? getUnifiedDB() : window.drugsDb;
    const drug = db.find(d => d.id === drugId);
    const p = AppStore.getPatient(activePatientId);
    if(!p.rxList) p.rxList = [];
    
    p.rxList.push({
        id: drug.id, name: drug.name,
        vol: parseFloat(res.dataset.vol).toFixed(1), unit: res.dataset.unit,
        freq: freqInput.value || drug.defaultFreq,
        dur: durVal ? `${durVal} ${durUnit}` : "", type: drug.doseType
    });
    
    AppStore.savePatient(p);
    renderRxCartList();
    
    document.getElementById('inlineDrugSelect').value = ""; res.innerHTML = ""; freqInput.value = ""; document.getElementById('inlineDurVal').value = "";
    showSystemToast(`✅ ${drug.name} added to Case Sheet`);
};

// --- LIVE PREVIEW BUILDER ---
window.renderRxCartList = function() {
    const area = document.getElementById('rxCartList');
    if(!area || !activePatientId) return;
    const p = AppStore.getPatient(activePatientId);

    let ddx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
    let hopi = document.getElementById('rxHopi') ? document.getElementById('rxHopi').value.replace(/\n/g, '<br>') : "";
    let tests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
    let advice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value.replace(/\n/g, '<br>') : "";
    
    let examHTML = "";
    ['RS', 'CVS', 'PA', 'CNS'].forEach(sys => {
        let val = document.getElementById('exam' + sys) ? document.getElementById('exam' + sys).value.trim() : "";
        if(val) examHTML += `<div><b>${sys}:</b> ${val}</div>`;
    });

    let sympHtml = "";
    const tags = document.querySelectorAll('#symptomTagsArea .symptom-tag');
    if(tags.length > 0) {
        let sList = [];
        tags.forEach(t => sList.push(t.innerText.replace('✖', '').trim()));
        sympHtml = sList.join(", ");
    }

    let html = `<div style="border-bottom:2px solid var(--primary); padding-bottom:10px; margin-bottom:15px;">`;
    if(sympHtml) html += `<div style="margin-bottom:8px;"><b>Presenting Complaints:</b> ${sympHtml}</div>`;
    if(hopi) html += `<div style="margin-bottom:8px; font-size:0.95rem; color:#444;"><b>HOPI:</b><br>${hopi}</div>`;
    if(examHTML) html += `<div style="margin-bottom:8px; font-size:0.9rem; background:rgba(0,0,0,0.02); padding:10px; border-radius:6px; border:1px solid #eee;"><b>O/E:</b><br>${examHTML}</div>`;
    if(ddx) html += `<div style="font-size:1.1rem; color:var(--primary-dark);"><b>Diagnosis:</b> ${ddx}</div>`;
    html += `</div>`;

    if(!p.rxList || p.rxList.length === 0) {
        html += `<div style="color:var(--text-muted); font-style:italic; padding:20px; text-align:center;">No medications added yet.</div>`;
    } else {
        html += `<div style="font-size:1.3rem; font-weight:bold; color:var(--primary); margin-bottom:15px; font-family:serif;">Rx</div>`;
        p.rxList.forEach((rx, index) => {
            let translatedFreq = translateFreqToLocal(rx.freq);
            let durText = rx.dur ? ` x ${rx.dur}` : "";
            
            html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:12px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div>
                    <div style="font-weight:700; color:#1e293b; font-size:1.05rem; margin-bottom:4px;">${index+1}. ${rx.name}</div>
                    <div style="font-size:0.95rem; color:#475569;">
                        Give <span style="font-weight:bold; color:var(--primary);">${rx.vol} ${rx.unit}</span> 
                        <span style="font-weight:bold; color:var(--danger);">${translatedFreq}</span>${durText}
                    </div>
                </div>
                <button onclick="removeDrugFromCart(${index})" style="background:none; border:none; color:var(--danger); font-size:1.2rem; cursor:pointer; padding:5px;">🗑️</button>
            </div>`;
        });
    }

    if(tests) html += `<div style="margin-top:15px; padding-top:15px; border-top:1px dashed var(--border-soft);"><b>Investigations:</b> ${tests}</div>`;
    if(advice) html += `<div style="margin-top:10px;"><b>Advice:</b><br>${advice}</div>`;

    area.innerHTML = html;
};

window.fillNormalExams = function() {
    if(document.getElementById('examRS')) document.getElementById('examRS').value = 'B/L NVBS heard, no added sounds.';
    if(document.getElementById('examCVS')) document.getElementById('examCVS').value = 'S1, S2 heard. No murmurs.';
    if(document.getElementById('examPA')) document.getElementById('examPA').value = 'Soft, non-tender. Bowel sounds present.';
    if(document.getElementById('examCNS')) document.getElementById('examCNS').value = 'Conscious, active. No focal neurological deficits.';
    renderRxCartList();
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
        diagnosis: document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "",
        tests: document.getElementById('rxTests') ? document.getElementById('rxTests').value : "",
        advice: document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "",
        review: document.getElementById('rxReview') ? document.getElementById('rxReview').value : "",
        
        examRS: document.getElementById('examRS') ? document.getElementById('examRS').value : "",
        examCVS: document.getElementById('examCVS') ? document.getElementById('examCVS').value : "",
        examPA: document.getElementById('examPA') ? document.getElementById('examPA').value : "",
        examCNS: document.getElementById('examCNS') ? document.getElementById('examCNS').value : "",
        
        rxList: [...(p.rxList || [])], 
        dietLogs: [...(p.dietLogs || [])], 
        vaccinesGiven: todaysVax 
    };
    
    p.visits.push(newVisit); 
    
    p.rxList = []; p.dietLogs = []; 
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
        if(typeof renderVisitLedger === 'function') renderVisitLedger();
    }
};

window.startNewVisit = function() {
    document.getElementById('rxLedgerView').style.display = 'none';
    document.getElementById('rxDraftView').style.display = 'block';
    document.getElementById('draftDateText').innerText = new Date().toLocaleDateString('en-IN');
    
    const fields = ['rxDiagnosis', 'rxTests', 'rxAdvice', 'rxReview', 'rxHopi', 'rxTestsCustom', 'examRS', 'examCVS', 'examPA', 'examCNS'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    document.querySelectorAll('.investigation-chips input[type="checkbox"]').forEach(cb => cb.checked = false);
    const sympArea = document.getElementById('symptomTagsArea');
    if (sympArea) sympArea.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;" id="emptySympMsg">No symptoms added yet.</span>';
    activeDraftSymptoms = [];
    
    if(activePatientId) {
        const wtInput = document.getElementById('inlineCalcWeight');
        if(wtInput) wtInput.value = AppStore.getPatient(activePatientId).weight || "";
    }
    renderRxCartList();
};

window.renderVisitLedger = function() {
    if(!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    const ledgerList = document.getElementById('rxLedgerList');
    
    document.getElementById('rxLedgerView').style.display = 'block';
    document.getElementById('rxDraftView').style.display = 'none';
    
    if (!p.visits) p.visits = [];

    if (p.visits.length === 0) {
        ledgerList.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); background:var(--bg-body); border-radius:var(--radius-lg); border:1px dashed var(--border-soft);">No historical encounters. Click 'Start New Visit' to begin a chart.</div>`;
        return;
    }

    let html = "";
    [...p.visits].reverse().forEach((visit) => {
        const dateStr = new Date(visit.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        let rxHtml = visit.rxList ? visit.rxList.map(rx => `• <b>${rx.name}</b> (${rx.vol} ${rx.unit}) - <i>${translateFreqToLocal(rx.freq)}</i>`).join("<br>") : "";
        
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
};

// --- MILESTONE TIMELINE ENGINE ---
window.renderMilestoneTimeline = function() {
    const container = document.getElementById('milestoneTimelineContainer');
    if (!container) return;
    
    if (!activePatientId) {
        container.innerHTML = '<div style="color:var(--danger);">⚠️ Please open a patient file first.</div>';
        return;
    }
    
    const p = AppStore.getPatient(activePatientId);
    const msDb = typeof window.milestonesDb !== 'undefined' ? window.milestonesDb : null;
    if(!msDb) {
        container.innerHTML = 'Milestone database not found.';
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:15px;">';
    Object.keys(msDb).sort((a,b) => parseInt(a) - parseInt(b)).forEach(month => {
        html += `
        <div style="border:1px solid var(--border-soft); border-radius:8px; overflow:hidden;">
            <div style="background:var(--primary-light); padding:10px 15px; font-weight:bold; color:var(--primary-dark); font-size:1.1rem; border-bottom:1px solid var(--border-soft);">
                ${month} Months
            </div>
            <div style="padding:15px; background:var(--bg-body); display:flex; flex-direction:column; gap:12px;">
        `;
        
        msDb[month].forEach(ms => {
            let isChecked = (p.achievedMilestones && p.achievedMilestones[ms.id]) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer;">
                    <input type="checkbox" value="${ms.id}" ${isChecked} onchange="toggleMilestone('${ms.id}', this.checked)" style="margin-top:4px; width:20px; height:20px; accent-color:var(--brand-pink);">
                    <div>
                        <div style="font-weight:600; color:var(--text-main); font-size:0.95rem;">
                            ${ms.text} 
                            <span style="font-size:0.7rem; color:var(--text-muted); background:var(--bg-surface); padding:2px 6px; border-radius:4px; margin-left:5px; border:1px solid var(--border-soft);">${ms.domain}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--danger); margin-top:2px;">🚨 Red Flag if missed: ${ms.sig}</div>
                    </div>
                </label>
            `;
        });
        html += `</div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

window.toggleMilestone = function(msId, isAchieved) {
    if (!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    if (!p.achievedMilestones) p.achievedMilestones = {};
    p.achievedMilestones[msId] = isAchieved;
    AppStore.savePatient(p);
    if(typeof saveAndRegisterPatient === 'function') saveAndRegisterPatient(true);
};