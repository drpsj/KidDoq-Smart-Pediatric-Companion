// --- CORE CLINICAL MATH ENGINE ---
// This single function powers all calculators (Dashboard, Draft, Manual, Order Sets)
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

// --- FIX: Updated Main Dose Calculator ---
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
    
    const drug = drugsDb.find(d => d.id === drugId);
    if (!drug) return;
    
    // CONNECTED TO NEW MATH ENGINE
    let math = ClinicalMath.computeDose(drug, weight);
    let unit = ClinicalMath.getUnit(drug);
    
    let durVal = document.getElementById('calcDuration') ? document.getElementById('calcDuration').value : "";
    let durStr = durVal ? ` x ${durVal} Days` : "";
    let finalFreq = `${drug.defaultFreq}${durStr}`;
    let warnHTML = math.isMax ? `<br><span style="color:var(--danger); font-size:0.85rem;">⚠️ Adult Max Cap Enforced (${drug.maxMg}mg)</span>` : "";
    
    outputArea.innerHTML = `
        <div class="result-card">
            <p style="margin-top:0; color:var(--text-muted); font-weight:700; font-size:0.75rem; text-transform:uppercase;">Administer Volume</p>
            <h2 style="font-size:3rem; margin:10px 0; color:var(--success); letter-spacing:-1px;">${math.reqVol.toFixed(1)} ${unit}</h2>
            <p style="color:var(--primary); font-weight:bold; font-size:1.1rem; margin-bottom:0;">Frequency: ${finalFreq}</p>
            <div style="font-size:0.85rem; color:#64748b; margin-top:1.5rem; border-top:1px dashed var(--border-soft); padding-top:1rem;">
                Target: ${math.reqMg.toFixed(0)} mg/dose ${warnHTML}
            </div>
        </div>`;
    
    pendingPrescriptionDrug = { name: drug.name, vol: math.reqVol.toFixed(1), freq: finalFreq, details: math.isMax ? "Max dose cap" : "", unit: unit };
    
    if(activePatientId) {
        btnArea.innerHTML = `<button class="action" onclick="addToRxCart()" style="width:100%; font-size:1.1rem; padding:1rem; margin-top:1rem; background:var(--primary); color:white; border-radius:var(--radius-md); box-shadow:var(--shadow-md);">➕ Add to Active Draft</button>`;
    } else {
        btnArea.innerHTML = `<div style="text-align:center; color:var(--warning); font-size:0.85rem; padding-top:10px;">Independent Calculation Active.</div>`;
    }
}

// --- FIX: Updated Home Quick Calculator ---
function runHomeDoseCalc() {
    const wt = parseFloat(document.getElementById('homeWeight').value);
    const drugId = document.getElementById('homeFormulation').value;
    const res = document.getElementById('homeDoseResult');

    if(!wt || !drugId) { res.innerHTML = ''; return; }
    const drug = drugsDb.find(d => d.id === drugId);
    if(!drug) return;

    // CONNECTED TO NEW MATH ENGINE
    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
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
    
    // 1. Read a safe copy from the Vault
    let p = AppStore.getPatient(activePatientId);
    if(!p.rxList) p.rxList = [];
    
    // 2. Modify the copy
    p.rxList.push(pendingPrescriptionDrug); 
    
    // 3. Securely hand it back to the Vault to save
    AppStore.savePatient(p); 
    
    // 4. Update UI
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
    
    const filtered = drugsDb.filter(d => d.category === cat);
    filtered.forEach(d => { formSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`; });
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
        tag.className = 'symptom-tag';
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
        let wt = parseFloat(wtBox ? wtBox.value : AppStore.getPatient(activePatientId).weight);
        if(isNaN(wt)) wt = 10;
        
        const drug = drugsDb.find(d => d.id === drugId);
        if(!drug) return;
        
        // Use the Pure Math Engine
        let math = ClinicalMath.computeDose(drug, wt);
        let unit = ClinicalMath.getUnit(drug);
        let warnHTML = math.isMax ? ` <span style="color:var(--danger); font-size:0.8rem;">(⚠️ Adult Max Cap)</span>` : "";
        
        res.innerHTML = `Calculated: <span style="font-size:1.1rem; color:var(--primary);">${math.reqVol.toFixed(1)} ${unit}</span> (${math.reqMg.toFixed(0)} mg)${warnHTML}`;
        
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
        
        const drug = drugsDb.find(d => d.id === drugId);
        if (!drug) return null;

        // Use the Pure Math Engine
        let math = ClinicalMath.computeDose(drug, wt);
        
        let finalDetails = detailsStr;
        if (math.isMax) finalDetails += (finalDetails ? " | " : "") + `⚠️ Max Dose Cap Enforced (${drug.maxMg}mg)`;

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
        
        // 1. Secure Read: Get a safe copy of the patient
        let p = AppStore.getPatient(activePatientId);
        if (!p) return;
        if (!p.rxList) p.rxList = []; 

        let dx = ""; let advice = ""; let newRx = [];

        function injectSymp(name, val, unit) {
            if(typeof activeDraftSymptoms !== 'undefined') activeDraftSymptoms.push(name.toLowerCase());
            document.getElementById('symptomTagsArea').innerHTML += `<span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:5px;">${name} x ${val} ${unit} <b style="cursor:pointer; color:var(--danger);" onclick="this.parentElement.remove(); evaluateDDx();">✖</b></span>`;
        }

        if (setId === 'os_aom') {
            dx = "Acute Otitis Media (AOM)"; advice = "Keep ear dry. Do not insert cotton buds.";
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
        
        // CONCATENATION ENGINE: Prevents wiping out predictive DDx terms
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
        
        // 2. Secure Write: Hand the modified copy back to the vault
        AppStore.savePatient(p); 
        
        if(typeof renderRxCartList === 'function') renderRxCartList();
        document.getElementById('orderSetSelect').value = "";
    }

    // --- 3. LIVE RX PREVIEW (FIXED) ---
    window.renderRxCartList = function() { 
        const container = document.getElementById('rxCartList'); 
        if(!activePatientId) return; 
        
        // FIX: Pull directly from the Vault, NOT the global memory store
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
                html += `
                <div style="display:flex; justify-content:space-between; align-items:start; padding-bottom:8px; border-bottom:1px dashed #eee;">
                    <div>
                        <strong style="font-size:0.95rem; color:#333;">${i+1}. ${r.name}</strong><br>
                        <span style="font-size:0.85rem; color:#555;">Give <b style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${r.vol} ${r.unit}</b> — <i>${r.freq}</i></span>
                        ${r.details ? `<div style="font-size:0.75rem; color:#888; margin-top:2px;">${r.details}</div>` : ''}
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
            // FIX: Write strictly to the Vault
            const p = AppStore.getPatient(activePatientId);
            if(!p.rxList) p.rxList = [];
            p.rxList.push(rxObj);
            
            AppStore.savePatient(p); // Actually save it!
            globalPatientsStore[activePatientId] = p; // Keep legacy variable in sync just in case
            
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
        
        const drug = drugsDb.find(d => d.id === drugId);
        if(!drug) return;
        
        // Use the Pure Math Engine
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

    // Safely redirect any old "Preview" buttons to our new Summary Tab
    window.previewDraft = function() {
        if(typeof openActiveSummary === 'function') {
            // Find the summary nav button to highlight it
            let summaryBtn = document.querySelectorAll('.nav-item')[3]; 
            openActiveSummary(summaryBtn);
        }
    };

    window.editDraft = function() {
        if(typeof ViewController !== 'undefined') {
            // Jump back to tools, then specifically to the Rx pad
            ViewController.switchNavTab('toolsTab');
            ViewController.openClinicalTool('prescriptionFeatureView');
            // Ensure the first sub-tab (Clinical Pad) is open
            let rxNotesTabBtn = document.querySelector('[onclick*="rxNotesTab"]');
            if(rxNotesTabBtn) ViewController.switchSubTab('rxNotesTab', rxNotesTabBtn);
        }
    };

    window.lockVisit = async function() {
        if(!AppStore.getActivePatientId()) return;
        let p = AppStore.getPatient(AppStore.getActivePatientId());
        if (!p.visits) p.visits = [];
        
        // Scan for Vaccines given specifically today
        let todayStr = new Date().toISOString().split('T')[0];
        let todaysVax = [];
        if(p.givenDates) {
            for (const [vaxId, date] of Object.entries(p.givenDates)) {
                if (date === todayStr) todaysVax.push(vaxId);
            }
        }
        
        // Create the immutable historical snapshot
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
            
            // NEW: Lock the exams into the ledger
            examRS: p.examRS || "",
            examCVS: p.examCVS || "",
            examPA: p.examPA || "",
            examCNS: p.examCNS || "",
            
            rxList: [...(p.rxList || [])], 
            dietLogs: [...(p.dietLogs || [])], 
            vaccinesGiven: todaysVax 
        };
        
        p.visits.push(newVisit); 
        
        // Clear out the active staging buffers for the NEXT visit
        p.rxList = []; 
        p.dietLogs = []; 
        p.diagnosis = ""; p.tests = ""; p.advice = ""; p.review = ""; 
        p.examRS = ""; p.examCVS = ""; p.examPA = ""; p.examCNS = "";
        
        // Clear the UI fields safely
        ['rxDiagnosis', 'rxTests', 'rxAdvice', 'rxReview', 'examRS', 'examCVS', 'examPA', 'examCNS'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = "";
        });
        
        // Save and Sync
        AppStore.savePatient(p); 
        if(typeof DB !== 'undefined') await DB.savePatient(p); 
        if(typeof showSystemToast === 'function') showSystemToast("✅ Visit securely locked to historical ledger.");
        
        // Bounce the user over to the Historical Ledger tab to see the saved entry
        let ledgerBtn = document.querySelectorAll('.nav-item')[2]; 
        if(typeof openHistoricalEncounters === 'function') openHistoricalEncounters(ledgerBtn);
    };

    window.cancelNewVisit = function() {
        if(confirm("Discard this draft? Unsaved changes will be lost.")) {
            renderVisitLedger();
        }
    };

    // --- SYSTEMIC EXAM AUTOFILL ---
    window.fillNormalExams = function() {
        document.getElementById('examRS').value = 'B/L NVBS heard, no added sounds.';
        document.getElementById('examCVS').value = 'S1, S2 heard. No murmurs.';
        document.getElementById('examPA').value = 'Soft, non-tender. Bowel sounds present.';
        document.getElementById('examCNS').value = 'Conscious, active. No focal neurological deficits.';
        if(typeof showSystemToast === 'function') showSystemToast("✅ Normal systemic findings injected.");
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

    // --- MALNUTRITION & ANTHROPOMETRY CONTROLLER ---
    window.evalMAC = function(macVal) {
        const out = document.getElementById('macOutput');
        if (!out) return;
        
        // 1. Delegate math to the Pure Math Engine
        const result = ClinicalMath.evaluateMAC(parseFloat(macVal));
        
        // 2. Update UI
        if (!result) { 
            out.innerHTML = ""; 
            return; 
        }
        out.innerHTML = `MAC Status: <span style="color:${result.color};">${result.status}</span>`;
    };

    window.calcMalnutrition = function() {
        if (!activePatientId) return;
        
        // 1. Secure Read from Vault
        const p = AppStore.getPatient(activePatientId);
        if (!p) return;

        const out = document.getElementById('malnGridOutput');
        if (!out) return;

        const ageYrs = parseInt(p.ageYrs) || 0;
        const ageMos = parseInt(p.ageMos) || 0;
        const actualWt = parseFloat(p.weight) || 0;
        const hasOedema = document.getElementById('malnOedemaToggle') ? document.getElementById('malnOedemaToggle').checked : false;

        // 2. Ask the Math Engine for Expected Weight
        const expectedWt = ClinicalMath.calculateExpectedWeight(ageYrs, ageMos);
        
        if (!expectedWt || actualWt === 0) {
            out.innerHTML = "Awaiting complete age and weight parameters...";
            return;
        }

        // Calculate Percentages
        const wfaPercent = (actualWt / expectedWt) * 100;
        
        // 3. Ask the Math Engine for Classifications
        const wellcomeClass = ClinicalMath.classifyWellcomeTrust(wfaPercent, hasOedema);

        // 4. Render UI safely
        out.innerHTML = `
            <div style="margin-bottom:10px;">Expected Weight (Weech): <b>${expectedWt.toFixed(1)} kg</b></div>
            <div style="margin-bottom:10px;">Actual Weight for Age: <b>${wfaPercent.toFixed(1)}%</b></div>
            <div style="padding:10px; border-radius:6px; background:rgba(91,97,246,0.1); border:1px solid var(--primary);">
                Wellcome Trust Classification:<br>
                <b style="font-size:1.1rem; color:var(--primary-dark);">${wellcomeClass}</b>
            </div>
        `;
    };

    // --- SENSORY SCREENING CONTROLLER ---
    window.renderSensory = function() {
        const out = document.getElementById('sensoryOutputArea');
        if (!out) return;

        const items = [
            { cat: "Vision", text: "Fixes and follows moving objects" },
            { cat: "Vision", text: "Recognizes familiar faces" },
            { cat: "Hearing", text: "Startles to loud noises" },
            { cat: "Hearing", text: "Turns head towards sound" },
            { cat: "Speech/Social", text: "Responds to name" },
            { cat: "Speech/Social", text: "Engages in reciprocal play" }
        ];
        
        let html = `<div style="display:grid; gap:10px;">`;
        items.forEach((item, i) => {
            html += `
            <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--border-soft); display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
                <div>
                    <small style="color:var(--primary); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">${item.cat}</small>
                    <div style="font-size:1.05rem; margin-top:4px; font-weight:500;">${item.text}</div>
                </div>
                <select style="width:auto; padding:8px 12px; border:2px solid var(--border-soft); border-radius:6px; font-weight:bold;">
                    <option value="pending">-- Assess --</option>
                    <option value="pass">✅ Pass</option>
                    <option value="concern">🚨 Concern</option>
                </select>
            </div>`;
        });
        html += `</div>`;
        out.innerHTML = html;
    };

    // ==========================================
    // 🍎 NUTRITION & DIET CONTROLLER
    // ==========================================

    // 1. Tab 1: Calculate ICMR Targets based on Patient Weight
    window.calcNutrition = function() {
        const pId = AppStore.getActivePatientId();
        if (!pId) return;
        
        const p = AppStore.getPatient(pId);
        const out = document.getElementById('nutriTargetArea');
        if (!out) return;

        const wt = parseFloat(p.weight) || 0;
        if (wt === 0) {
            out.innerHTML = "<div style='padding:20px; text-align:center; color:var(--text-muted);'>⚠️ Please enter patient weight in the registry to calculate targets.</div>";
            return;
        }

        // Basic ICMR Math (Simplified Pediatric Estimation)
        const energyTarget = wt * 90; // ~90-100 kcal/kg
        const proteinTarget = wt * 1.5; // ~1.2-1.5 g/kg
        const fluidTarget = wt <= 10 ? wt * 100 : (wt <= 20 ? 1000 + (wt-10)*50 : 1500 + (wt-20)*20);

        out.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-top:10px;">
                <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                    <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">⚡ Energy</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:var(--primary);">${energyTarget.toFixed(0)} <span style="font-size:0.9rem; color:var(--text-muted);">kcal/day</span></div>
                </div>
                <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                    <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">🥩 Protein</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:var(--success);">${proteinTarget.toFixed(1)} <span style="font-size:0.9rem; color:var(--text-muted);">g/day</span></div>
                </div>
                <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                    <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">💧 Fluids</div>
                    <div style="font-size:1.8rem; font-weight:bold; color:var(--info);">${fluidTarget.toFixed(0)} <span style="font-size:0.9rem; color:var(--text-muted);">ml/day</span></div>
                </div>
            </div>
        `;
    };

   // 2. Tab 2: Add item to 24h Recall Log
    window.addDietRecall = function() {
        const pId = AppStore.getActivePatientId();
        if (!pId) {
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Select a patient first.");
            return;
        }
        
        const meal = document.getElementById('recallMeal').value;
        const food = document.getElementById('recallFood').value;
        const qty = parseFloat(document.getElementById('recallQty').value);

        if (!food || !qty) {
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please enter a valid quantity.");
            return;
        }

        // UNIFIED FORMAT: Look up food in foodsDb using the short keys (k, p, c, f)
        const foodItem = (typeof window.foodsDb !== 'undefined' ? window.foodsDb.find(f => f.name === food) : null) || { k: 100, p: 2 };
        
        const cals = (foodItem.k / 100) * qty;
        const pro = (foodItem.p / 100) * qty;

        const p = AppStore.getPatient(pId);
        if (!p.dietLogs) p.dietLogs = [];
        
        // Save to secure vault
        p.dietLogs.push({
            id: 'log_' + Date.now().toString(),
            mealType: meal,
            foodName: food,
            qty: qty + "g/ml",
            calories: cals,
            protein: pro
        });

        AppStore.savePatient(p);
        
        document.getElementById('recallQty').value = ""; // Clear input for next item
        if(typeof showSystemToast === 'function') showSystemToast("✅ Food Logged!");
        renderRecallLog(); // Re-render the board
    };

    window.updateLivePreview = function() {
        const food = document.getElementById('recallFood').value;
        const qty = parseFloat(document.getElementById('recallQty').value);
        const out = document.getElementById('recallSummaryArea');
        
        if (!food || !qty || isNaN(qty)) {
            out.innerHTML = "Awaiting quantity to calculate macros...";
            out.className = "tool-result neutral";
            return;
        }

        const foodItem = (typeof window.foodsDb !== 'undefined' ? window.foodsDb.find(f => f.name === food) : null) || { k: 100, p: 2 };
        const cals = (foodItem.k / 100) * qty;
        const pro = (foodItem.p / 100) * qty;

        out.innerHTML = `
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Live Estimation</div>
            <h3 style="margin:5px 0; color:var(--primary);">${cals.toFixed(0)} kcal</h3>
            <div style="color:var(--success); font-weight:bold;">${pro.toFixed(1)}g Protein</div>
        `;
        out.className = "tool-result";
    };

    // 3. Tab 2: Render the 24h Recall Board
    window.renderRecallLog = function() {
        const pId = AppStore.getActivePatientId();
        if (!pId) return;
        
        const p = AppStore.getPatient(pId);
        const out = document.getElementById('recallListArea');
        if (!out) return;

        const logs = p.dietLogs || [];
        
        if (logs.length === 0) {
            out.innerHTML = "<div style='color:var(--text-muted); text-align:center; padding:30px; background:var(--bg-surface); border-radius:8px; border:1px dashed var(--border-soft);'>🍽️ No foods logged yet for the 24h recall. Add items above.</div>";
            return;
        }

        let html = `<table class="theory-table" style="width:100%; font-size:0.95rem; text-align:left;">
            <thead>
                <tr style="background:var(--bg-body);">
                    <th style="padding:10px;">Meal</th><th style="padding:10px;">Item</th><th style="padding:10px;">Cals</th><th style="padding:10px;">Protein</th><th style="padding:10px; text-align:center;">Del</th>
                </tr>
            </thead>
            <tbody>`;
        
        let tCals = 0, tPro = 0;
        
        logs.forEach(log => {
            // SAFE PARSING: Protects against corrupted data saving as null
            let cals = parseFloat(log.calories) || 0;
            let pro = parseFloat(log.protein) || 0;
            
            tCals += cals; 
            tPro += pro;
            
            html += `<tr>
                <td style="padding:10px; border-bottom:1px solid var(--border-soft);">${log.mealType || 'Meal'}</td>
                <td style="padding:10px; border-bottom:1px solid var(--border-soft);"><b>${log.foodName || 'Unknown'}</b> <span style="color:var(--text-muted); font-size:0.85rem;">(${log.qty || ''})</span></td>
                <td style="padding:10px; border-bottom:1px solid var(--border-soft); color:var(--primary);">${cals.toFixed(0)}</td>
                <td style="padding:10px; border-bottom:1px solid var(--border-soft); color:var(--success);">${pro.toFixed(1)}g</td>
                <td style="padding:10px; border-bottom:1px solid var(--border-soft); text-align:center;">
                    <button onclick="removeDietRecall('${log.id}')" style="background:rgba(239, 68, 68, 0.1); border:none; color:var(--danger); cursor:pointer; padding:5px 8px; border-radius:4px;">❌</button>
                </td>
            </tr>`;
        });
        
        html += `<tr style="font-weight:bold; background:rgba(91, 97, 246, 0.05);">
            <td colspan="2" style="text-align:right; padding:12px;">24H TOTAL INTAKE:</td>
            <td style="color:var(--primary-dark); padding:12px; font-size:1.1rem;">${tCals.toFixed(0)} kcal</td>
            <td style="color:var(--success); padding:12px; font-size:1.1rem;">${tPro.toFixed(1)} g</td>
            <td></td>
        </tr></tbody></table>`;
        
        out.innerHTML = html;
    };

    window.removeDietRecall = function(logId) {
        const pId = AppStore.getActivePatientId();
        if (!pId) return;
        const p = AppStore.getPatient(pId);
        
        // Filter out the deleted item
        p.dietLogs = p.dietLogs.filter(l => l.id !== logId);
        AppStore.savePatient(p);
        renderRecallLog();
    };

    // 4. Tab 3: Render Reference Matrix & Populate Dropdowns
    window.renderFoodDB = function(db) {
        if (!db || db.length === 0) return;
        
        // 1. Populate the Reference Matrix Table Body (Safely targets the tbody!)
        const tbody = document.getElementById('foodTableBody');
        if (tbody) {
            let html = "";
            db.forEach(f => {
                html += `<tr>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft);"><b>${f.name}</b></td>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.cat || '-'}</td>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft); color:var(--success);">${f.p} g</td>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.c || 0} g</td>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.f || 0} g</td>
                    <td style="padding:8px; border-bottom:1px solid var(--border-soft); color:var(--primary);">${f.k} kcal</td>
                </tr>`;
            });
            tbody.innerHTML = html;
        }

        // 2. Populate the Dropdown for the 24h Recall Tracker
        const select = document.getElementById('recallFood');
        if (select && select.options.length <= 1) {
            select.innerHTML = ""; // Clear existing
            db.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.name;
                opt.textContent = f.name;
                select.appendChild(opt);
            });
        }
    };

    // ==========================================
// RESTORED CLINICAL TOOLS (ER, PRAM, JAUNDICE)
// ==========================================

window.calcCrash = function() {
    const wt = parseFloat(document.getElementById('crashWeight').value);
    const out = document.getElementById('crashOutputArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Input physical vectors to map lines."; out.className="tool-result neutral"; return; }
    
    let defib1 = wt * 2; let defib2 = wt * 4;
    let ns = wt * 20; let adr = wt * 0.1;
    
    out.innerHTML = `
        <div style="display:grid; gap:10px; text-align:left;">
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--danger);">
                <b>⚡ Defibrillation:</b> ${defib1.toFixed(0)} Joules &rarr; ${defib2.toFixed(0)} Joules
            </div>
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--info);">
                <b>💧 Fluid Bolus (NS/RL):</b> ${ns.toFixed(0)} mL (over 10-20 mins)
            </div>
            <div style="background:var(--bg-body); padding:10px; border-radius:6px; border-left:4px solid var(--warning);">
                <b>💉 Adrenaline (1:10,000):</b> ${adr.toFixed(2)} mL (IV/IO)
            </div>
        </div>
    `;
    out.className = "tool-result danger";
};

window.calcFluids = function() {
    const wt = parseFloat(document.getElementById('fluidWeight').value);
    const dehyd = parseFloat(document.getElementById('fluidDehydration').value);
    const out = document.getElementById('fluidResultArea');
    if(!wt || isNaN(wt)) { out.innerHTML = "Compile inputs parameter block."; out.className="tool-result neutral"; return; }

    let maint = 0;
    if (wt <= 10) maint = wt * 100;
    else if (wt <= 20) maint = 1000 + ((wt - 10) * 50);
    else maint = 1500 + ((wt - 20) * 20);

    let deficit = wt * (dehyd * 10); // Wt * % * 10 = mL
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
    const wt = parseFloat(document.getElementById('girWt').value);
    const rate = parseFloat(document.getElementById('girRate').value);
    const dex = parseFloat(document.getElementById('girDex').value);
    const out = document.getElementById('girOutput');
    
    if(!wt || !rate || !dex || isNaN(wt)) { out.innerHTML = ""; out.className="tool-result neutral"; return; }
    
    let gir = (rate * dex) / (wt * 6);
    out.innerHTML = `GIR: <b>${gir.toFixed(2)}</b> mg/kg/min`;
    out.className = "tool-result success";
};

window.calcAPGAR = function() {
    const hr = parseInt(document.getElementById('apgarHR').value);
    const resp = parseInt(document.getElementById('apgarResp').value);
    const tone = parseInt(document.getElementById('apgarTone').value);
    const ref = parseInt(document.getElementById('apgarReflex').value);
    const col = parseInt(document.getElementById('apgarColor').value);
    const out = document.getElementById('apgarOutput');
    
    let total = hr + resp + tone + ref + col;
    let color = total >= 7 ? "var(--success)" : (total >= 4 ? "var(--warning)" : "var(--danger)");
    
    out.innerHTML = `Total Score: <span style="font-size:1.4rem; color:${color}; font-weight:bold;">${total}/10</span>`;
};

window.calcPRAM = function() {
    const o2 = parseInt(document.getElementById('pramO2').value);
    const sup = parseInt(document.getElementById('pramSupra').value);
    const sca = parseInt(document.getElementById('pramScalene').value);
    const air = parseInt(document.getElementById('pramAir').value);
    const whz = parseInt(document.getElementById('pramWheeze').value);
    const out = document.getElementById('pramResultArea');
    
    let total = o2 + sup + sca + air + whz;
    let sev = "Mild"; let color = "var(--success)";
    if (total >= 4 && total <= 7) { sev = "Moderate"; color = "var(--warning)"; }
    if (total >= 8) { sev = "Severe"; color = "var(--danger)"; }
    
    out.innerHTML = `
        <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">PRAM Score</div>
        <h2 style="margin:5px 0;">${total} / 12</h2>
        <div style="font-size:1.1rem; font-weight:bold; color:${color};">${sev} Exacerbation</div>
    `;
    out.className = "tool-result";
};

window.calcJaundice = function() {
    const hrs = parseFloat(document.getElementById('jaunHours').value);
    const tsb = parseFloat(document.getElementById('jaunTSB').value);
    const risk = document.getElementById('jaunRisk').value;
    const out = document.getElementById('jaunResultArea');
    
    if(!hrs || !tsb || isNaN(hrs)) { out.innerHTML = "Awaiting data entry to map standard Bhutani bands."; out.className="tool-result neutral"; return; }
    
    // Simplified heuristic estimation based on AAP/Bhutani bands
    let threshold = 15; 
    if (risk === 'high') threshold = (hrs/24) * 2.5 + 5.5; 
    else if (risk === 'med') threshold = (hrs/24) * 3 + 7;
    else threshold = (hrs/24) * 3 + 9;
    
    let msg = tsb >= threshold ? "⚠️ Phototherapy Indicated" : "✅ Below Phototherapy Threshold";
    let colorClass = tsb >= threshold ? "danger" : "success";
    
    out.innerHTML = `
        <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Risk Analysis Assessment</div>
        <h2 style="margin:5px 0;">${msg}</h2>
        <div style="font-size:0.9rem;">Estimated Threshold for this age/risk: ~${threshold.toFixed(1)} mg/dL</div>
    `;
    out.className = "tool-result " + colorClass;
};

    