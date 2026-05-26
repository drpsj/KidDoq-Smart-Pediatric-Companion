// --- CORE CLINICAL MATH ENGINE ---
// This single function powers all calculators (Dashboard, Draft, Manual, Order Sets)
function computeClinicalMath(drug, wt) {
    if (drug.doseType === 'fixed') {
        return { reqMg: drug.doseMg || 0, reqVol: drug.vol, isMax: false };
    }
    
    // Calculate based on protocol (perDay divided, or perDose)
    let targetMg = drug.doseType === 'perDay' ? (wt * drug.doseMg) / (drug.div || 1) : (wt * drug.doseMg);
    let isMax = false;
    
    // Apply Safety Ceiling
    if (drug.maxMg && targetMg > drug.maxMg) {
        targetMg = drug.maxMg;
        isMax = true;
    }
    
    // Calculate final MLs
    let reqVol = drug.conc > 0 ? (targetMg * drug.vol) / drug.conc : drug.vol;
    
    return { reqMg: targetMg, reqVol: reqVol, isMax: isMax };
}

function getDrugUnit(drug) {
    let n = drug.name.toLowerCase();
    if (n.includes('tablet') || n.includes('suppository')) return 'Tab/Supp';
    if (n.includes('drop')) return 'Drops';
    return 'mL';
}

// --- 1. UNIFIED DOSAGE ENGINE (For the 🧮 Dose Calc Tab) ---
function populateDrugs() {
    const catElem = document.getElementById('drugCategory');
    
    // THE GATEKEEPER: Stop immediately if the dropdown doesn't exist
    if (!catElem) return; 
    
    const cat = catElem.value;
    const formSelect = document.getElementById('drugFormulation');
    if (!formSelect) return;
    
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    // Filter the massive drugsDb from database.js
    const filtered = drugsDb.filter(d => d.category === cat);
    filtered.forEach(d => {
        formSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
}

function calculateDose() {
    const wtElem = document.getElementById('calcWeight');
    const formElem = document.getElementById('drugFormulation');
    const outputArea = document.getElementById('calcOutputArea');
    const btnArea = document.getElementById('rxAddButtonArea');
    
    // THE ULTIMATE GATEKEEPER: Stop immediately if ANY part of the old Dose Calc tab is missing
    if (!wtElem || !formElem || !outputArea || !btnArea) return; 
    
    const weight = parseFloat(wtElem.value);
    const drugId = formElem.value;
    
    if(!weight || drugId === "") {
        outputArea.innerHTML = "<div class='tool-result neutral'>Awaiting parameters. Ensure weight is entered.</div>";
        btnArea.innerHTML = ""; pendingPrescriptionDrug = null; return;
    }
    
    const drug = drugsDb.find(d => d.id === drugId);
    if (!drug) return;
    
    // The Universal Math
    let math = computeClinicalMath(drug, weight);
    let unit = getDrugUnit(drug);
    
    let durVal = document.getElementById('calcDuration') ? document.getElementById('calcDuration').value : "";
    let durStr = durVal ? ` x ${durVal} Days` : "";
    let finalFreq = `${drug.defaultFreq}${durStr}`;
    let warnHTML = math.isMax ? `<br><span style="color:var(--danger); font-size:0.85rem;">⚠️ Adult Max Cap Enforced (${drug.maxMg}mg)</span>` : "";
    
    // Build the Display Card
    outputArea.innerHTML = `
        <div class="result-card">
            <p style="margin-top:0; color:var(--text-muted); font-weight:700; font-size:0.75rem; text-transform:uppercase;">Administer Volume</p>
            <h2 style="font-size:3rem; margin:10px 0; color:var(--success); letter-spacing:-1px;">${math.reqVol.toFixed(1)} ${unit}</h2>
            <p style="color:var(--primary); font-weight:bold; font-size:1.1rem; margin-bottom:0;">Frequency: ${finalFreq}</p>
            <div style="font-size:0.85rem; color:#64748b; margin-top:1.5rem; border-top:1px dashed var(--border-soft); padding-top:1rem;">
                Target: ${math.reqMg.toFixed(0)} mg/dose ${warnHTML}
            </div>
        </div>`;
    
    // Prepare it for the Cart
    pendingPrescriptionDrug = { name: drug.name, vol: math.reqVol.toFixed(1), freq: finalFreq, details: math.isMax ? "Max dose cap" : "", unit: unit };
    
    if(activePatientId) {
        btnArea.innerHTML = `<button class="action" onclick="addToRxCart()" style="width:100%; font-size:1.1rem; padding:1rem; margin-top:1rem; background:var(--primary); color:white; border-radius:var(--radius-md); box-shadow:var(--shadow-md);">➕ Add to Active Draft</button>`;
    } else {
        btnArea.innerHTML = `<div style="text-align:center; color:var(--warning); font-size:0.85rem; padding-top:10px;">Independent Calculation Active.</div>`;
    }
}

// --- 2. REVERSE AUDIT ENGINE ---
function populateRevDrugs() {
    const cat = document.getElementById('revCategory').value; 
    const formSelect = document.getElementById('revFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    const filtered = drugsDb.filter(d => d.category === cat);
    filtered.forEach(d => { formSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`; });
}

function calcReverse() {
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const drugId = document.getElementById('revFormulation').value;
    const volGiven = parseFloat(document.getElementById('revVol').value); 
    const out = document.getElementById('revOutputArea');
    const addButtonArea = document.getElementById('revAddButtonArea');
    
    if(!weight || !drugId || !volGiven || isNaN(volGiven)) { out.innerHTML = "Awaiting volume parameters."; out.className = "tool-result neutral"; return; }
    
    const drug = drugsDb.find(d => d.id === drugId);
    if(!drug) return;
    if (drug.doseType === 'fixed') { out.innerHTML = "Fixed dose formulation. Standard is " + drug.vol + " unit(s)."; out.className="tool-result"; return; }
    
    let mgGiven = (volGiven * drug.conc) / drug.vol;
    let targetDosePerDose = drug.doseType === 'perDay' ? (drug.doseMg / (drug.div || 1)) : drug.doseMg;
    let mgPerKgGiven = mgGiven / weight;
    let percent = (mgPerKgGiven / targetDosePerDose) * 100;
    let status = percent > 120 ? "<span style='color:var(--danger)'>⚠️ Overdose</span>" : (percent < 80 ? "<span style='color:var(--warning)'>⚠️ Underdose</span>" : "<span style='color:var(--success)'>✅ Optimal Range</span>");
    
    out.innerHTML = `<div style="text-align:left;"><div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Administered Load Profile</div><h2 style="margin:5px 0;">${mgGiven.toFixed(1)} mg total</h2><div style="font-size:1.1rem; font-weight:bold; margin-bottom:10px;">= ${mgPerKgGiven.toFixed(2)} mg/kg/dose</div><div style="padding-top:10px; border-top:1px dashed var(--border-soft);"><b>Target Protocol:</b> ${targetDosePerDose.toFixed(1)} mg/kg/dose<br><b>Audit Status:</b> ${status} (${percent.toFixed(0)}%)</div></div>`;
    out.className = percent > 120 ? "tool-result danger" : (percent < 80 ? "tool-result warning" : "tool-result");
    
    let unitStr = getDrugUnit(drug);
    pendingPrescriptionDrug = { name: drug.name, vol: volGiven.toFixed(1), freq: drug.defaultFreq, details: "Reverse Audited", unit: unitStr };
    
    if(activePatientId) {
        addButtonArea.innerHTML = `<button onclick='addPendingToRxCart()' class='action' style='background:var(--success);'>➕ Confirm & Add to Prescription Pad</button>`;
    }
}

// --- 3. CART MANAGEMENT ---
let pendingPrescriptionDrug = null;

function addPendingToRxCart() { 
    if(!activePatientId || !pendingPrescriptionDrug) return; 
    
    const p = globalPatientsStore[activePatientId];
    if(!p.rxList) p.rxList = [];
    p.rxList.push(pendingPrescriptionDrug); 
    localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); 
    
    if(document.getElementById('drugFormulation')) document.getElementById('drugFormulation').value = ""; 
    if(document.getElementById('calcOutputArea')) document.getElementById('calcOutputArea').innerHTML = "<div class='tool-result neutral'>Awaiting parameters.</div>"; 
    if(document.getElementById('rxAddButtonArea')) document.getElementById('rxAddButtonArea').innerHTML = ''; 
    if(document.getElementById('revAddButtonArea')) document.getElementById('revAddButtonArea').innerHTML = '';
    
    if(typeof showSystemToast === 'function') showSystemToast(`✅ Added ${pendingPrescriptionDrug.name}`);
    pendingPrescriptionDrug = null; 
    renderRxCartList(); 
}

function addToRxCart() { addPendingToRxCart(); }

function removeDrugFromCart(idx) { 
    if(!activePatientId) return;
    globalPatientsStore[activePatientId].rxList.splice(idx,1); 
    localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); 
    renderRxCartList(); 
}

// --- 4. INDEPENDENT DASHBOARD CALCULATOR ---
function populateHomeDrugs() {
    const cat = document.getElementById('homeCategory').value;
    const formSelect = document.getElementById('homeFormulation');
    formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
    if(!cat) return;
    
    const filtered = drugsDb.filter(d => d.category === cat);
    filtered.forEach(d => { formSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`; });
}

function runHomeDoseCalc() {
    const wt = parseFloat(document.getElementById('homeWeight').value);
    const drugId = document.getElementById('homeFormulation').value;
    const res = document.getElementById('homeDoseResult');

    if(!wt || !drugId) { res.innerHTML = ''; return; }
    const drug = drugsDb.find(d => d.id === drugId);
    if(!drug) return;

    let math = computeClinicalMath(drug, wt);
    let unit = getDrugUnit(drug);
    let warnHTML = math.isMax ? `<div style="color:var(--danger); font-size:0.85rem; font-weight:bold; margin-top:5px;">⚠️ Adult Max Cap Enforced</div>` : "";

    res.innerHTML = `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--primary); text-align:center; box-shadow:var(--shadow-md);">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Calculated Quantity</div>
            <div style="font-size:2.8rem; color:var(--primary); font-weight:800; margin:5px 0;">${math.reqVol.toFixed(1)} <span style="font-size:1.2rem;">${unit}</span></div>
            <div style="font-size:1rem; color:var(--text-main); font-weight:700; background:rgba(91,97,246,0.1); padding:5px 10px; border-radius:4px; display:inline-block;">${drug.defaultFreq}</div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:10px;">Target: ${math.reqMg.toFixed(0)} mg/dose</div>
            ${warnHTML}
        </div>
    `;
}

// --- EHR STATE MACHINE LOGIC ---

    function renderVisitLedger() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId];
        const ledgerList = document.getElementById('rxLedgerList');
        
        document.getElementById('rxLedgerView').style.display = 'block';
        document.getElementById('rxDraftView').style.display = 'none';
        
        // 1. Data Migration
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
            DB.savePatient(p); 
        }

        // 2. Render the Ledger
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
    
    let activeDraftSymptoms = []; // Temporary array for the active draft

    function addSymptomTag() {
        const name = document.getElementById('sympInput').value.trim();
        const val = document.getElementById('sympDurVal').value;
        const unit = document.getElementById('sympDurUnit').value;

        if (!name || !val) {
            if(typeof showSystemToast === 'function') showSystemToast("Please enter a symptom and duration.");
            return;
        }

        const tagString = `${name} x ${val} ${unit}`;
        activeDraftSymptoms.push(name.toLowerCase()); // Store for the AI engine
        
        // Build the visual tag
        const tagArea = document.getElementById('symptomTagsArea');
        document.getElementById('emptySympMsg').style.display = 'none';
        
        const tag = document.createElement('span');
        tag.style.cssText = "background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:5px;";
        tag.innerHTML = `${tagString} <b style="cursor:pointer; color:var(--danger);" onclick="this.parentElement.remove(); evaluateDDx();">✖</b>`;
        
        tagArea.appendChild(tag);

        // Clear inputs for the next symptom
        document.getElementById('sympInput').value = "";
        document.getElementById('sympDurVal').value = "";
        
        evaluateDDx(); // Trigger the AI brain
    }

    function evaluateDDx() {
        const ddxArea = document.getElementById('ddxSuggestions');
        let suggestions = [];

        // THE ALGORITHM: Read the tags and predict
        if (activeDraftSymptoms.includes('fever') && activeDraftSymptoms.includes('ear tugging')) {
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

        // Render Suggestions
        if (suggestions.length > 0) {
            ddxArea.style.display = 'flex';
            // Keep the "AI Label" and append buttons
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
        
        // Ensure Live Preview updates immediately when chips are clicked
        if(typeof renderRxCartList === 'function') renderRxCartList();
    };

    // --- 1. THE INLINE DRAFT CALCULATOR (Phase 8) ---
    function populateInlineDrugs() {
        const cat = document.getElementById('inlineDrugCat').value;
        const sel = document.getElementById('inlineDrugSelect');
        sel.innerHTML = '<option value="">-- Select Drug --</option>';
        document.getElementById('inlineDoseResult').innerText = '';
        if(!cat) return;
        const filtered = drugsDb.filter(d => d.category === cat);
        filtered.forEach(d => { sel.innerHTML += `<option value="${d.id}">${d.name}</option>`; });
    }

    function calcInlineDose() {
        const drugId = document.getElementById('inlineDrugSelect').value;
        const res = document.getElementById('inlineDoseResult');
        const freqInput = document.getElementById('inlineFreq');
        res.innerText = '';
        if(!drugId) { freqInput.value = ''; return; }
        
        const wtBox = document.getElementById('inlineCalcWeight');
        let wt = parseFloat(wtBox ? wtBox.value : globalPatientsStore[activePatientId].weight);
        if(isNaN(wt)) wt = 10;
        
        const drug = drugsDb.find(d => d.id === drugId);
        if(!drug) return;
        
        let math = computeClinicalMath(drug, wt);
        let unit = getDrugUnit(drug);
        let warnHTML = math.isMax ? ` <span style="color:var(--danger); font-size:0.8rem;">(⚠️ Adult Max Cap)</span>` : "";
        
        res.innerHTML = `Calculated: <span style="font-size:1.1rem; color:var(--primary);">${math.reqVol.toFixed(1)} ${unit}</span> (${math.reqMg.toFixed(0)} mg)${warnHTML}`;
        
        const durVal = document.getElementById('inlineDurVal').value;
        const durUnit = document.getElementById('inlineDurUnit').value;
        let durStr = durVal ? ` x ${durVal} ${durUnit}` : "";
        freqInput.value = `${drug.defaultFreq}${durStr}`;
    }

    function addInlineDrugToCart() {
        const drugId = document.getElementById('inlineDrugSelect').value;
        const freq = document.getElementById('inlineFreq').value;
        if(!drugId || !freq) { if(typeof showSystemToast === 'function') showSystemToast("⚠️ Select a drug & frequency."); return; }
        
        const rxObj = autoCalcFromDB(drugId, freq);
        if(rxObj) {
            const p = globalPatientsStore[activePatientId];
            if(!p.rxList) p.rxList = [];
            p.rxList.push(rxObj);
            if(typeof renderRxCartList === 'function') renderRxCartList();
            
            document.getElementById('inlineDrugSelect').value = '';
            document.getElementById('inlineFreq').value = '';
            document.getElementById('inlineDoseResult').innerHTML = '';
        }
    }

    // --- 2. THE SMART PROTOCOL ENGINE (Order Sets) ---
    function autoCalcFromDB(drugId, freqStr = null, detailsStr = "") {
        const p = globalPatientsStore[activePatientId];
        const wtBox = document.getElementById('inlineCalcWeight');
        let wt = parseFloat(wtBox ? wtBox.value : p.weight);
        if(isNaN(wt)) wt = parseFloat(p.weight) || 10; 
        
        const drug = drugsDb.find(d => d.id === drugId);
        if (!drug) return null;

        let math = computeClinicalMath(drug, wt);
        let finalDetails = detailsStr;
        if (math.isMax) finalDetails += (finalDetails ? " | " : "") + `⚠️ Max Dose Cap Enforced (${drug.maxMg}mg)`;

        return {
            name: drug.name,
            vol: math.reqVol.toFixed(1),
            unit: getDrugUnit(drug),
            freq: freqStr || drug.defaultFreq,
            details: finalDetails
        };
    }

    function applyOrderSet(setId) {
        if(!activePatientId || !setId) return;
        let p = globalPatientsStore[activePatientId];
        if (!p) return;
        if (!p.rxList) p.rxList = []; 

        let dx = ""; let advice = ""; let newRx = [];

        function injectSymp(name, val, unit) {
            activeDraftSymptoms.push(name.toLowerCase());
            document.getElementById('symptomTagsArea').innerHTML += `<span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:5px;">${name} x ${val} ${unit} <b style="cursor:pointer; color:var(--danger);" onclick="this.parentElement.remove(); evaluateDDx();">✖</b></span>`;
        }

        if (setId === 'os_aom') {
            dx = "Acute Otitis Media"; advice = "Keep ear dry. Follow up in 5 days.";
            injectSymp("Ear Pain", "2", "Days"); injectSymp("Fever", "2", "Days");
            newRx.push(autoCalcFromDB("ab_05", "BID x 5 Days")); 
            newRx.push(autoCalcFromDB("ap_04", "SOS for Ear Pain / Fever")); 
        } 
        else if (setId === 'os_uri') {
            dx = "Viral Upper Respiratory Infection (URI)"; advice = "Maintain hydration. Steam inhalation twice daily.";
            injectSymp("Cough", "3", "Days"); injectSymp("Runny Nose", "3", "Days");
            newRx.push(autoCalcFromDB("ap_04", "SOS Q6H for Fever"));
            newRx.push({ name: "Saline Nasal Drops (0.65%)", vol: "2", unit: "drops", freq: "TID in both nostrils", details: "" });
        } 
        else if (setId === 'os_age') {
            dx = "Acute Gastroenteritis"; advice = "Strict ORS after every loose stool. Avoid sugary juices.";
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
        
        // SYNERGY: Append instead of overwrite
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
        globalPatientsStore[activePatientId] = p; 
        
        if(typeof renderRxCartList === 'function') renderRxCartList();
        document.getElementById('orderSetSelect').value = "";
    }

    // --- 3. LIVE RX PREVIEW ---
    window.renderRxCartList = function() { 
        const container = document.getElementById('rxCartList'); 
        if(!activePatientId) return; 
        const p = globalPatientsStore[activePatientId];
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
                html += `
                <div style="display:flex; justify-content:space-between; align-items:start; padding-bottom:8px; border-bottom:1px dashed #eee;">
                    <div>
                        <strong style="font-size:0.95rem; color:#333;">${i+1}. ${r.name}</strong><br>
                        <span style="font-size:0.85rem; color:#555;">Give <b>${r.vol} ${r.unit}</b> &mdash; <i>${r.freq}</i></span>
                        ${r.details ? `<div style="font-size:0.75rem; color:#888; margin-top:2px;">${r.details}</div>` : ''}
                    </div>
                    <button onclick="removeDrugFromCart(${i})" style="background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; font-weight:bold;">✖</button>
                </div>`;
            });
            html += `</div>`;
        }

        const dx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
        if (dx) html += `<div style="margin-top:15px; font-size:0.85rem; border-top:1px dashed #eee; padding-top:10px;"><b>Dx:</b> ${dx}</div>`;
        
        // FIX: Display Investigations and Advice in Live Preview
        const tests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
        if (tests) html += `<div style="margin-top:10px; font-size:0.85rem;"><b>Investigations:</b> ${tests}</div>`;
        
        const adv = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
        if (adv) html += `<div style="margin-top:10px; font-size:0.85rem;"><b>Advice:</b> ${adv.replace(/\n/g, '<br>')}</div>`;

        container.innerHTML = html;
    };

    // --- 4. INTEGRATED MEDS AUDIT & HOPI ---
    let lastAuditResult = "";

    window.calcReverse = function() {
        const wtBox = document.getElementById('inlineCalcWeight');
        const wt = parseFloat(wtBox ? wtBox.value : globalPatientsStore[activePatientId].weight);
        const drugId = document.getElementById('revFormulation').value;
        const volGiven = parseFloat(document.getElementById('revVol').value); 
        const out = document.getElementById('revOutputArea');
        
        if(!wt || !drugId || !volGiven || isNaN(volGiven)) { out.innerHTML = ""; lastAuditResult = ""; return; }
        
        const drug = drugsDb.find(d => d.id === drugId);
        if(!drug) return;
        if (drug.doseType === 'fixed') { 
            out.innerHTML = `<span style="color:var(--primary)">Fixed dose: ${drug.vol} unit(s).</span>`;
            lastAuditResult = `${drug.name}: ${volGiven} given (Fixed standard dose).`;
            return; 
        }
        
        let mgGiven = (volGiven * drug.conc) / drug.vol;
        let targetDosePerDose = drug.doseType === 'perDay' ? (drug.doseMg / (drug.div || 1)) : drug.doseMg;
        let mgPerKgGiven = mgGiven / wt;
        let percent = (mgPerKgGiven / targetDosePerDose) * 100;
        
        let statusText = percent > 120 ? "Overdose" : (percent < 80 ? "Underdose" : "Optimal");
        let color = percent > 120 ? "var(--danger)" : (percent < 80 ? "var(--warning)" : "var(--success)");
        
        out.innerHTML = `Given: <b>${mgPerKgGiven.toFixed(1)}</b> mg/kg. Target: <b>${targetDosePerDose.toFixed(1)}</b>. <span style="color:${color}; font-weight:bold;">[${statusText}]</span>`;
        lastAuditResult = `Takes ${drug.name} (${volGiven}mL). Evaluated at ${mgPerKgGiven.toFixed(1)} mg/kg/dose (Target: ${targetDosePerDose.toFixed(1)}). Status: ${statusText}.`;
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

    // --- 5. WORKFLOW FINALIZATION ---
    window.previewDraft = async function() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId];
        
        const finalWt = document.getElementById('inlineCalcWeight').value;
        if(finalWt && !isNaN(parseFloat(finalWt))) p.weight = parseFloat(finalWt).toFixed(1);

        p.diagnosis = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
        p.tests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
        p.advice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
        p.review = document.getElementById('rxReview') ? document.getElementById('rxReview').value : "";
        
        await DB.savePatient(p); 

        document.getElementById('rxDraftView').style.display = 'none';
        document.getElementById('rxPostVisitView').style.display = 'block';
        window.scrollTo(0,0);
    };

    window.editDraft = function() {
        document.getElementById('rxPostVisitView').style.display = 'none';
        document.getElementById('rxDraftView').style.display = 'block';
        window.scrollTo(0,0);
    };

    window.lockVisit = async function() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId];
        if (!p.visits) p.visits = [];
        
        const newVisit = {
            date: new Date().toISOString(),
            hopi: document.getElementById('rxHopi') ? document.getElementById('rxHopi').value : "",
            diagnosis: p.diagnosis || "",
            tests: p.tests || "",
            advice: p.advice || "",
            review: p.review || "",
            rxList: [...(p.rxList || [])] 
        };
        
        p.visits.push(newVisit); 
        p.rxList = []; 
        p.diagnosis = ""; p.tests = ""; p.advice = ""; p.review = ""; 
        
        await DB.savePatient(p); 
        
        document.getElementById('rxPostVisitView').style.display = 'none';
        renderVisitLedger();
        if(typeof showSystemToast === 'function') showSystemToast("✅ Visit permanently locked to ledger.");
    };

    window.cancelNewVisit = function() {
        if(confirm("Discard this draft? Unsaved changes will be lost.")) {
            renderVisitLedger();
        }
    };

   function startNewVisit() {
        // 1. Switch View
        document.getElementById('rxLedgerView').style.display = 'none';
        document.getElementById('rxDraftView').style.display = 'block';
        document.getElementById('draftDateText').innerText = new Date().toLocaleDateString('en-IN');
        
        // 2. Clear Fields Safely
        const fields = ['rxDiagnosis', 'rxTests', 'rxAdvice', 'rxReview', 'rxHopi', 'rxTestsCustom'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        // 3. Clear Checkboxes and Symptoms Area
        document.querySelectorAll('.investigation-chips input[type="checkbox"]').forEach(cb => cb.checked = false);
        const sympArea = document.getElementById('symptomTagsArea');
        if (sympArea) {
            sympArea.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;" id="emptySympMsg">No symptoms added yet.</span>';
        }
        
        // 4. Reset Weight in the new editable calculator input
        if(activePatientId && globalPatientsStore[activePatientId]) {
            const wtInput = document.getElementById('inlineCalcWeight');
            if(wtInput) {
                wtInput.value = globalPatientsStore[activePatientId].weight || "";
            }
        }

        // 5. Refresh the Live Preview
        if(typeof renderRxCartList === 'function') renderRxCartList();
    }