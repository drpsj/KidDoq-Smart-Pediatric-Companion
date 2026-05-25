// --- 6. DOSAGE ENGINE ---
    function populateDrugs() {
        const cat = document.getElementById('drugCategory').value;
        const formSelect = document.getElementById('drugFormulation');
        formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
        if(cat && drugDb[cat]) {
            let combined = [...drugDb[cat], ...(customDrugsStore[cat] || [])];
            combined.forEach((drug, idx) => {
                let opt = document.createElement('option');
                opt.value = idx; 
                opt.text = drug.name + (drug.brand ? ` [${drug.brand}]` : ""); 
                formSelect.add(opt);
            });
        }
    }

    function populateRevDrugs() {
        const cat = document.getElementById('revCategory').value; const formSelect = document.getElementById('revFormulation');
        formSelect.innerHTML = '<option value="">-- Choose Formulation --</option>';
        if(cat && drugDb[cat]) {
            let combined = [...drugDb[cat], ...(customDrugsStore[cat] || [])];
            combined.forEach((drug, idx) => { let opt = document.createElement('option'); opt.value = idx; opt.text = drug.name + (drug.brand ? ` [${drug.brand}]` : ""); formSelect.add(opt); });
        }
    }

    function saveCustomDrug() {
        let cat = document.getElementById('newDrugCat').value;
        let name = document.getElementById('newDrugName').value.trim();
        let dose = parseFloat(document.getElementById('newDrugDose').value) || 0;
        let type = document.getElementById('newDrugType').value;
        let div = parseFloat(document.getElementById('newDrugDiv').value) || 1;
        let freq = document.getElementById('newDrugFreq').value.trim();
        let conc = parseFloat(document.getElementById('newDrugConc').value) || 1;
        let vol = parseFloat(document.getElementById('newDrugVol').value) || 1;

        if(!name || !freq) { alert("Please fill parameters."); return; }
        if(!customDrugsStore[cat]) customDrugsStore[cat] = [];
        customDrugsStore[cat].push({ name: name, doseMg: dose, doseType: type, div: div, freq: freq, conc: conc, vol: vol });
        localStorage.setItem('custom_drugs', JSON.stringify(customDrugsStore));
        alert(name + " added successfully.");
        document.getElementById('newDrugName').value = ''; populateDrugs();
    }

    function calculateDose() {
        try {
            // UNIFIED WEIGHT LOGIC: Works instantly whether a patient is selected or not
            const weight = parseFloat(document.getElementById('calcWeight').value);
            const cat = document.getElementById('drugCategory').value;
            const drugIndex = document.getElementById('drugFormulation').value;
            const outputArea = document.getElementById('calcOutputArea');
            const btnArea = document.getElementById('rxAddButtonArea');
            
            if(!weight || !cat || drugIndex === "") {
                outputArea.innerHTML = "<div class='tool-result neutral'>Awaiting parameters. Ensure weight is entered.</div>";
                btnArea.innerHTML = ""; pendingPrescriptionDrug = null; return;
            }
            
            let combined = [...(drugDb[cat] || []), ...(customDrugsStore[cat] || [])];
            const drug = combined[drugIndex];
            if (!drug) return;
            
            let volMl = 0; let details = ""; let unitStr = drug.vol === 1 ? 'Unit/Tab' : 'mL';
            let durVal = document.getElementById('calcDuration') ? document.getElementById('calcDuration').value : "";
            let durStr = durVal ? ` for ${durVal} days` : "";
            
            if (drug.doseType === 'fixed') {
                volMl = drug.vol; details = "";
                outputArea.innerHTML = `<div class="result-card"><p style="margin-top:0; color:var(--text-muted); font-weight:700; font-size:0.75rem; text-transform:uppercase;">Administer Quantity</p><h2 style="font-size:3rem; margin:10px 0; color:var(--success); letter-spacing:-1px;">${volMl.toFixed(1)} ${unitStr}</h2><p style="color:var(--primary); font-weight:bold; font-size:1.1rem; margin-bottom:0;">Frequency: ${drug.freq}${durStr}</p></div>`;
            } else {
                let targetMg = drug.doseType === 'perDay' ? (weight * drug.doseMg) / (drug.div || 1) : (weight * drug.doseMg);
                
                if (drug.maxMg && targetMg > drug.maxMg) { 
                    targetMg = drug.maxMg; 
                    details = `⚠️ Adult Max Cap Enforced (${drug.maxMg} mg/dose)`; 
                } else { 
                    details = `${targetMg.toFixed(1)} mg/dose Target`; 
                }
                
                volMl = (targetMg * (drug.vol || 1)) / (drug.conc || 1); 
                
                outputArea.innerHTML = `<div class="result-card"><p style="margin-top:0; color:var(--text-muted); font-weight:700; font-size:0.75rem; text-transform:uppercase;">Administer Volume</p><h2 style="font-size:3rem; margin:10px 0; color:var(--success); letter-spacing:-1px;">${volMl.toFixed(1)} ${unitStr}</h2><p style="color:var(--primary); font-weight:bold; font-size:1.1rem; margin-bottom:0;">Frequency: ${drug.freq}${durStr}</p><div style="font-size:0.85rem; color:#64748b; margin-top:1.5rem; border-top:1px dashed var(--border-soft); padding-top:1rem;">${drug.maxMg && targetMg === drug.maxMg ? `<span style="color:var(--danger); font-weight:bold;">${details}</span>` : `[(${weight}kg &times; ${drug.doseMg}mg) &times; ${drug.vol}] &divide; ${drug.conc}mg`}</div></div>`;
            }
            
            let finalDrugName = drug.name + (drug.brand ? ` [${drug.brand}]` : "");
            pendingPrescriptionDrug = { name: finalDrugName, vol: volMl.toFixed(1), freq: drug.freq + durStr, details: details, unit: unitStr };
            
            if(activePatientId) {
                btnArea.innerHTML = `<button class="action" onclick="addToRxCart()" style="width:100%; font-size:1.1rem; padding:1rem; margin-top:1rem; background:var(--primary); color:white; border-radius:var(--radius-md); box-shadow:var(--shadow-md);">➕ Add to Prescription Pad</button>`;
            } else {
                btnArea.innerHTML = `<div style="text-align:center; color:var(--warning); font-size:0.85rem; padding-top:10px;">Calculation active. (Select a patient above to save this to a prescription pad).</div>`;
            }
        } catch (error) {
            console.error("Calculator Error:", error);
            document.getElementById('calcOutputArea').innerHTML = "<div class='tool-result danger'>⚠️ Calculation Error. Please check drug database.</div>";
        }
    }

    function calcReverse() {
        const weight = parseFloat(document.getElementById('calcWeight').value);
        const cat = document.getElementById('revCategory').value; const drugIndex = document.getElementById('revFormulation').value;
        const volGiven = parseFloat(document.getElementById('revVol').value); 
        const out = document.getElementById('revOutputArea');
        const addButtonArea = document.getElementById('revAddButtonArea');
        
        if(!weight || !cat || drugIndex === "" || !volGiven || isNaN(volGiven)) { out.innerHTML = "Awaiting volume parameters."; out.className = "tool-result neutral"; return; }
        
        let combined = [...(drugDb[cat]||[]), ...(customDrugsStore[cat]||[])]; const drug = combined[drugIndex];
        if (drug.doseType === 'fixed') { out.innerHTML = "Fixed dose formulation. Standard is " + drug.vol + " unit(s)."; out.className="tool-result"; return; }
        
        let mgGiven = (volGiven * drug.conc) / drug.vol;
        let targetDosePerDose = drug.doseType === 'perDay' ? (drug.doseMg / drug.div) : drug.doseMg;
        let mgPerKgGiven = mgGiven / weight;
        let percent = (mgPerKgGiven / targetDosePerDose) * 100;
        let status = percent > 120 ? "<span style='color:var(--danger)'>⚠️ Overdose</span>" : (percent < 80 ? "<span style='color:var(--warning)'>⚠️ Underdose</span>" : "<span style='color:var(--success)'>✅ Optimal Range</span>");
        
        out.innerHTML = `<div style="text-align:left;"><div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Administered Load Profile</div><h2 style="margin:5px 0;">${mgGiven.toFixed(1)} mg total</h2><div style="font-size:1.1rem; font-weight:bold; margin-bottom:10px;">= ${mgPerKgGiven.toFixed(2)} mg/kg/dose</div><div style="padding-top:10px; border-top:1px dashed var(--border-soft);"><b>Target Protocol:</b> ${targetDosePerDose.toFixed(1)} mg/kg/dose<br><b>Audit Status:</b> ${status} (${percent.toFixed(0)}%)</div></div>`;
        out.className = percent > 120 ? "tool-result danger" : (percent < 80 ? "tool-result warning" : "tool-result");
        
        // Setup pending drug for cart
        let finalDrugName = drug.name + (drug.brand ? ` [${drug.brand}]` : "");
        pendingPrescriptionDrug = { name: finalDrugName, vol: volGiven.toFixed(1), freq: drug.freq, details: "Reverse Audited", unit: drug.vol === 1 ? 'Unit/Tab' : 'mL' };
        
        if(activePatientId) {
            addButtonArea.innerHTML = `<button onclick='addPendingToRxCart()' class='action' style='background:var(--success);'>➕ Confirm & Add to Prescription Pad</button>`;
        }
    }

    function addPendingToRxCart() { 
        if(!activePatientId || !pendingPrescriptionDrug) return; 
        globalPatientsStore[activePatientId].rxList.push(pendingPrescriptionDrug); 
        localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); 
        
        document.getElementById('drugFormulation').value = ""; 
        document.getElementById('calcOutputArea').innerHTML = "<div class='tool-result neutral'>Awaiting parameters.</div>"; 
        document.getElementById('rxAddButtonArea').innerHTML = ''; 
        if(document.getElementById('revAddButtonArea')) document.getElementById('revAddButtonArea').innerHTML = '';
        
        showSystemToast(`<b>${pendingPrescriptionDrug.name}</b> added to pad.`);
        pendingPrescriptionDrug = null; 
        renderRxCartList(); 
    }
    
    function addToRxCart() { addPendingToRxCart(); }
    
    function removeDrugFromCart(idx) { 
        globalPatientsStore[activePatientId].rxList.splice(idx,1); 
        localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); 
        renderRxCartList(); 
    }
    
    // --- EHR STATE MACHINE LOGIC ---

    function renderVisitLedger() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId];
        const ledgerList = document.getElementById('rxLedgerList');
        
        document.getElementById('rxLedgerView').style.display = 'block';
        document.getElementById('rxDraftView').style.display = 'none';
        
        // 1. Data Migration: Convert old prototype Rx data into the new Ledger format
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
            p.rxList = []; // Clear the old format
            DB.savePatient(p); // Silently save the migration
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

    function startNewVisit() {
        document.getElementById('rxLedgerView').style.display = 'none';
        document.getElementById('rxDraftView').style.display = 'block';
        document.getElementById('draftDateText').innerText = new Date().toLocaleDateString('en-IN');
        
        // Wipe the draft slate clean
        document.getElementById('rxDiagnosis').value = "";
        document.getElementById('rxTests').value = "";
        document.getElementById('rxAdvice').value = "";
        document.getElementById('rxReview').value = "";
        
        // Wipe the draft Rx cart
        if(activePatientId) {
            globalPatientsStore[activePatientId].rxList = []; 
            renderRxCartList();
        }
    }

    function cancelNewVisit() {
        if(confirm("Discard this draft? Unsaved changes will be lost.")) {
            renderVisitLedger();
        }
    }

    async function finalizeVisit() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId];
        if (!p.visits) p.visits = [];
        
        const newVisit = {
            date: new Date().toISOString(),
            diagnosis: document.getElementById('rxDiagnosis').value,
            tests: document.getElementById('rxTests').value,
            advice: document.getElementById('rxAdvice').value,
            review: document.getElementById('rxReview').value,
            rxList: [...(p.rxList || [])] // Take whatever is in the active cart
        };

        // --- PHASE 5: ORDER SETS (RX TEMPLATES) ---
    function applyOrderSet(setId) {
        if(!activePatientId || !setId) return;
        const p = globalPatientsStore[activePatientId];
        
        // Failsafe: Default to 10kg if weight is missing to prevent NaN errors
        const wt = parseFloat(p.weight) || 10; 
        const ageMos = p.totalMonths || 12;

        let dx = "";
        let newRx = [];

        // PROTOCOL ROUTER & BACKGROUND CALCULATOR
        if (setId === 'os_aom') {
            dx = "Acute Otitis Media";
            // Amoxicillin: 80mg/kg/day div BID. Susp: 400mg/5ml. Math: (wt * 40 / 400) * 5 = wt * 0.5 ml
            newRx.push({ name: "Syp Amoxicillin (400mg/5ml)", vol: (wt * 0.5).toFixed(1), unit: "ml", freq: "BID x 5 Days" });
            // Paracetamol: 15mg/kg/dose. Susp: 250mg/5ml. Math: (wt * 15 / 250) * 5 = wt * 0.3 ml
            newRx.push({ name: "Syp Paracetamol (250mg/5ml)", vol: (wt * 0.3).toFixed(1), unit: "ml", freq: "SOS for Ear Pain / Fever" });
        } 
        else if (setId === 'os_uri') {
            dx = "Viral Upper Respiratory Infection (URI)";
            newRx.push({ name: "Syp Paracetamol (250mg/5ml)", vol: (wt * 0.3).toFixed(1), unit: "ml", freq: "SOS for Fever" });
            newRx.push({ name: "Saline Nasal Drops (0.65%)", vol: "2", unit: "drops", freq: "TID in both nostrils" });
            if(ageMos >= 12) newRx.push({ name: "Honey", vol: "2.5", unit: "ml", freq: "HS for Nocturnal Cough" });
        } 
        else if (setId === 'os_age') {
            dx = "Acute Gastroenteritis (Mild Dehydration)";
            newRx.push({ name: "ORS Sachet", vol: "1", unit: "packet", freq: "Mix in 1L water, sip 50-100ml after every loose stool" });
            // Zinc: 10mg (<6mo) or 20mg (>6mo). Susp: 20mg/5ml.
            newRx.push({ name: "Syp Zinc (20mg/5ml)", vol: ageMos < 6 ? "2.5" : "5.0", unit: "ml", freq: "OD x 14 Days" });
            // Ondansetron: 0.15mg/kg. Susp: 2mg/5ml. Math: (wt * 0.15 / 2) * 5 = wt * 0.375 ml
            newRx.push({ name: "Syp Ondansetron (2mg/5ml)", vol: (wt * 0.375).toFixed(1), unit: "ml", freq: "STAT for vomiting" });
        } 
        else if (setId === 'os_fever') {
            dx = "Acute Febrile Illness";
            newRx.push({ name: "Syp Paracetamol (250mg/5ml)", vol: (wt * 0.3).toFixed(1), unit: "ml", freq: "SOS Q6H for Fever" });
            // Ibuprofen: 10mg/kg/dose. Susp: 100mg/5ml. Math: (wt * 10 / 100) * 5 = wt * 0.5 ml
            newRx.push({ name: "Syp Ibuprofen (100mg/5ml)", vol: (wt * 0.5).toFixed(1), unit: "ml", freq: "SOS Q8H for High Grade Fever" });
        }

        // 1. Auto-fill the Diagnosis field if it is currently empty
        const dxInput = document.getElementById('rxDiagnosis');
        if(dxInput && dxInput.value.trim() === "") {
            dxInput.value = dx;
        }

        // 2. Append the calculated protocol drugs to the active cart
        if(!p.rxList) p.rxList = [];
        p.rxList = p.rxList.concat(newRx);

        // 3. Render the UI
        if(typeof renderRxCartList === 'function') renderRxCartList();
        if(typeof showSystemToast === 'function') showSystemToast(`⚡ ${dx} Protocol Applied`);
        
        // 4. Reset the dropdown to default
        document.getElementById('orderSetSelect').value = "";
    }
        
        p.visits.push(newVisit); // Push to ledger
        p.rxList = []; // Clear the draft cart
        
        await DB.savePatient(p); // Save to database
        
        if(typeof showSystemToast === 'function') showSystemToast("Visit Finalized & Stored in Ledger");
        renderVisitLedger(); // Return to ledger view
    }

    function renderRxCartList() { 
        const container = document.getElementById('rxCartList'); if(!activePatientId) return; 
        let list = globalPatientsStore[activePatientId].rxList || []; 
        container.innerHTML = list.length === 0 ? "<div style='color:var(--text-muted); padding:1rem;'>Prescription pad empty.</div>" : list.map((r,i)=>`
        <div style="background:var(--bg-body); padding:1rem; border-radius:var(--radius-md); border-left:4px solid var(--primary); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
            <div>
                <strong style="display:block; font-size:1.05rem; color:var(--primary-dark);">${r.name}</strong>
                <span style="font-size:0.9rem; color:var(--text-main); font-weight:600;">${r.vol} ${r.unit} — ${r.freq}</span>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${r.details}</div>
            </div>
            <button onclick="removeDrugFromCart(${i})" style="background:var(--danger); color:white; border:none; padding:8px 12px; border-radius:var(--radius-md); cursor:pointer; font-weight:bold;">X</button>
        </div>`).join(""); 
    }

    // --- 8. NUTRITION & 24H RECALL ---
    function calcNutrition() {
        let totalM = currentPatientAgeInMonths || parseInt(document.getElementById('calcQuickAge')?document.getElementById('calcQuickAge').value:0) || 0;
        let y = Math.floor(totalM / 12);
        const wt = parseFloat(document.getElementById('pWeight').value || document.getElementById('calcWeight').value);
        const gender = document.getElementById('gender').value || 'male';
        const out = document.getElementById('nutriTargetArea');
        if(totalM === 0 && (!wt || isNaN(wt))) { out.innerHTML = "<div class='tool-result neutral'>Enter Age and Weight to calculate ICMR nutritional targets.</div>"; return; }
        
        let kcal = 0; let protein = 0; let wtGain = "";
        if (totalM < 3) { kcal = wt * 116; protein = wt * 2.3; wtGain = "30 g/day"; }
        else if (totalM < 6) { kcal = wt * 99; protein = wt * 1.85; wtGain = "20 g/day"; }
        else if (totalM < 9) { kcal = wt * 95; protein = wt * 1.65; wtGain = "15 g/day"; }
        else if (totalM < 12) { kcal = wt * 101; protein = wt * 1.5; wtGain = "12 g/day"; }
        else if (y < 3) { kcal = 1220; protein = 22; wtGain = "8 g/day"; }
        else if (y < 6) { kcal = 1720; protein = 29; wtGain = "6 g/day"; }
        else if (y < 10) { kcal = 2050; protein = 36; wtGain = "Avg 3 kg/year"; }
        else { kcal = gender === 'male' ? 2420 : 2200; protein = 43; wtGain = "Pubertal spurt variance"; }
        
        out.innerHTML = `
            <div class="tool-grid">
                <div class="result-card">
                    <p style="margin-top:0; color:var(--text-muted); font-weight:600; text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em;">Daily Caloric Target</p>
                    <h2 style="font-size:2.5rem; margin:10px 0; color:var(--success);">${kcal.toFixed(0)} kcal</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">(ICMR Target based on cohort)</div>
                </div>
                <div class="result-card" style="border-color:var(--primary);">
                    <p style="margin-top:0; color:var(--primary); font-weight:600; text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em;">Daily Protein Target</p>
                    <h2 style="font-size:2.5rem; margin:10px 0; color:var(--primary);">${protein.toFixed(1)} g</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Expected wt gain: <b style="color:var(--text-main);">${wtGain}</b></div>
                </div>
            </div>
        `;
    }

    function populateFoodSelect() {
        let sel = document.getElementById('recallFood');
        sel.innerHTML = '<option value="">-- Select Food Item --</option>';
        foodsDb.forEach((f, i) => { sel.innerHTML += `<option value="${i}">${f.name} (${f.k} kcal/100g)</option>`; });
    }

    function addDietRecall() {
        if(!activePatientId) return alert("Select patient first to use the Diet Recall tool.");
        let m = document.getElementById('recallMeal').value;
        let fIdx = document.getElementById('recallFood').value;
        let q = parseFloat(document.getElementById('recallQty').value);
        if(fIdx === "" || isNaN(q)) return; let food = foodsDb[fIdx];
        if(!globalPatientsStore[activePatientId].dietLogs) globalPatientsStore[activePatientId].dietLogs = [];
        globalPatientsStore[activePatientId].dietLogs.push({ meal: m, name: food.name, qty: q, kcal: (food.k * q)/100, prot: (food.p * q)/100 });
        localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); renderDietRecall();
    }

    function removeDietRecall(idx) { 
        globalPatientsStore[activePatientId].dietLogs.splice(idx, 1); 
        localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); 
        renderDietRecall(); 
    }
    
    function renderDietRecall() {
        let listArea = document.getElementById('recallListArea'); let sumArea = document.getElementById('recallSummaryArea');
        if(!activePatientId) { listArea.innerHTML = ""; sumArea.innerHTML = "Select patient."; sumArea.className = "tool-result neutral"; return; }
        let logs = globalPatientsStore[activePatientId].dietLogs || [];
        if(logs.length === 0) { listArea.innerHTML = ""; sumArea.innerHTML = "Log a food item to initialize deficiency analyzer."; sumArea.className = "tool-result neutral"; return; }
        
        let totK = 0; let totP = 0;
        let h = `<div style="overflow-x:auto;"><table class="theory-table"><thead><tr><th>Meal</th><th>Food</th><th>Mass</th><th>Protein</th><th>Energy</th><th>Action</th></tr></thead><tbody>`;
        logs.forEach((l,i)=>{ totK+=l.kcal; totP+=l.prot; h+=`<tr><td>${l.meal}</td><td>${l.name}</td><td>${l.qty}g</td><td>${l.prot.toFixed(1)}g</td><td>${l.kcal.toFixed(0)} kcal</td><td><button class='secondary' onclick='removeDietRecall(${i})' style='background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; width:auto;'>X</button></td></tr>`; });
        listArea.innerHTML = h + `</tbody></table></div>`;
        
        let wt = parseFloat(globalPatientsStore[activePatientId].weight) || 10;
        let totalM = globalPatientsStore[activePatientId].totalMonths;
        let y = Math.floor(totalM/12);
        
        let tKcal = 0; let tProt = 0;
        if (totalM < 3) { tKcal = wt * 116; tProt = wt * 2.3; }
        else if (totalM < 6) { tKcal = wt * 99; tProt = wt * 1.85; }
        else if (totalM < 9) { tKcal = wt * 95; tProt = wt * 1.65; }
        else if (totalM < 12) { tKcal = wt * 101; tProt = wt * 1.5; }
        else if (y < 3) { tKcal = 1220; tProt = 22; }
        else if (y < 6) { tKcal = 1720; tProt = 29; }
        else if (y < 10) { tKcal = 2050; tProt = 36; }
        else { tKcal = 2200; tProt = 43; }
        
        let kDiff = totK - tKcal; let pDiff = totP - tProt;
        let kStat = kDiff < 0 ? `<span style="color:var(--danger)">Deficit of ${Math.abs(kDiff).toFixed(0)} kcal</span>` : `<span style="color:var(--success)">Surplus of ${kDiff.toFixed(0)} kcal</span>`;
        let pStat = pDiff < 0 ? `<span style="color:var(--danger)">Deficit of ${Math.abs(pDiff).toFixed(1)} g</span>` : `<span style="color:var(--success)">Surplus of ${pDiff.toFixed(1)} g</span>`;
        
        sumArea.innerHTML = `
            <div style="text-align:left;">
                <h4 style="margin:0 0 10px 0; color:var(--text-main); font-size:1.1rem;">Calories (kcal)</h4>
                <div style="color:var(--text-muted); font-size:0.9rem; margin-bottom:5px;">Target: ${tKcal.toFixed(0)} | Intake: ${totK.toFixed(0)}</div>
                <div style="font-weight:700; font-size:1.05rem; margin-bottom:15px;">${kStat}</div>
                <h4 style="margin:0 0 10px 0; color:var(--text-main); font-size:1.1rem;">Protein (g)</h4>
                <div style="color:var(--text-muted); font-size:0.9rem; margin-bottom:5px;">Target: ${tProt.toFixed(1)} | Intake: ${totP.toFixed(1)}</div>
                <div style="font-weight:700; font-size:1.05rem;">${pStat}</div>
            </div>
        `;
        sumArea.className = "tool-result";
    }

    function renderFoodDB(dataArray) {
        const tbody = document.getElementById('foodTableBody'); 
        if(!tbody) return;
        tbody.innerHTML = "";
        dataArray.forEach(f => { tbody.innerHTML += `<tr><td><b style="color:var(--primary);">${f.name}</b></td><td>${f.cat}</td><td>${f.p}</td><td>${f.c}</td><td>${f.f || 0}</td><td><b style="color:var(--success);">${f.k}</b></td></tr>`; });
    }

    function filterFoodDB() {
        let filter = document.getElementById('foodSearch').value.toUpperCase();
        let filtered = foodsDb.filter(f => f.name.toUpperCase().includes(filter) || f.cat.toUpperCase().includes(filter));
        renderFoodDB(filtered);
    }

    // --- 9. TRIAGE & ANTHROPOMETRY ---
    function calcMalnutrition() {
        if(!activePatientId) return; const p = globalPatientsStore[activePatientId];
        const wt = parseFloat(p.weight); const ht = parseFloat(document.getElementById('triageHt').value || p.htCm);
        const hc = parseFloat(p.hcCm); const mac = parseFloat(document.getElementById('triageMac').value);
        let out = document.getElementById('malnGridOutput'); if(!wt || isNaN(wt)) return;
        
        let expWt = getExpectedWeight(p.totalMonths); let percent = (wt / expWt) * 100;
        let oedema = document.getElementById('malnOedemaToggle').checked;
        let grade = percent <= 50 ? "Grade IV" : (percent <= 60 ? "Grade III" : (percent <= 70 ? "Grade II" : (percent <= 80 ? "Grade I" : "Normal")));
        
        let htmlStr = `<div class='tool-result neutral' style='text-align:left;'><b>IAP Grade (Wt for Age):</b> ${grade} (${percent.toFixed(1)}% of Weech standard)<br><br><b>Clinical State:</b> ${oedema ? (percent <= 60 ? 'Marasmic-Kwashiorkor' : 'Kwashiorkor') : (percent <= 60 ? 'Marasmus' : 'Undernourished')}`;
        
        if (ht && !isNaN(ht)) {
            let bsa = Math.sqrt((ht * wt) / 3600);
            let pi = (wt * 1000) / Math.pow(ht, 3);
            htmlStr += `<hr style="border:0; border-top:1px dashed var(--border-soft); margin:10px 0;">`;
            htmlStr += `<b>BSA (Mosteller):</b> ${bsa.toFixed(2)} m&sup2;<br>`;
            htmlStr += `<b>Ponderal Index:</b> ${pi.toFixed(2)} <span style="font-size:0.85em; color:var(--text-muted);">(≥2: Symmetric IUGR, <1.9: Asym)</span><br>`;
            
            let y = Math.floor(p.totalMonths / 12);
            if (y >= 2 && y <= 12) htmlStr += `<b>Expected Height:</b> ${(y * 6) + 77} cm<br>`;
            if (p.totalMonths <= 12) htmlStr += `<b>Dynes Expected HC:</b> ${((ht / 2) + 9.5).toFixed(1)} &plusmn; 2.5 cm<br>`;
        }
        
        if (mac && !isNaN(mac) && hc && !isNaN(hc)) {
            let kanawati = mac / hc;
            let kStat = kanawati < 0.249 ? "Severe" : (kanawati < 0.279 ? "Moderate" : (kanawati < 0.314 ? "Early Malnutrition" : "Normal"));
            htmlStr += `<b>Kanawati Index (MAC/HC):</b> ${kanawati.toFixed(3)} (${kStat})<br>`;
        }
        
        htmlStr += `</div>`;
        out.innerHTML = htmlStr;
    }

    window.evalMAC = function(val) {
        let v = parseFloat(val); let out = document.getElementById('macOutput');
        if(!v || isNaN(v)) { out.innerHTML = ""; return; }
        if(v < 11.5) out.innerHTML = "<span style='color:var(--danger); font-size:1.2rem;'>🚨 Severe Acute Malnutrition (SAM)</span>";
        else if(v <= 13.5) out.innerHTML = "<span style='color:var(--warning); font-size:1.2rem;'>⚠️ Moderate Acute Malnutrition (MAM)</span>";
        else out.innerHTML = "<span style='color:var(--success); font-size:1.2rem;'>✅ Normal MAC Profile</span>";
    }

    function renderSensory() {
        if(!activePatientId) return;
        const p = globalPatientsStore[activePatientId]; const out = document.getElementById('sensoryOutputArea'); let html = "";
        if(p.totalMonths < 2) { html += `<b>Vision:</b> Look for cataracts, wandering eye, nystagmus. Follows objects 45&deg;.<br><br><b>Hearing:</b> Assess Startle response and Rattle test.`; } 
        else if (p.totalMonths < 6) { html += `<b>Vision (12 wks):</b> Fixes and follows objects till 90&deg;.<br><br><b>Hearing:</b> Startle response/Rattle test.`; } 
        else if (p.totalMonths < 12) { html += `<b>Vision (6-8 mos):</b> Follows 180&deg;. Fixates on small objects near face.<br><br><b>Hearing (8-10 mos):</b> Distraction hearing test (Child must turn head to sound out of visual range).`; } 
        else if (p.totalMonths < 36) { html += `<b>Vision (2.5 yrs):</b> Test distant vision (3 meters) and fix/follow. Look for strabismus.<br><br><b>Hearing:</b> Refer for Pure-tone audiometry & speech discrimination if language delayed.`; } 
        else { html += `<b>Vision:</b> Test distant vision (picture/letter test) and near vision (Snellen's). Should match colors.<br><br><b>Hearing:</b> Routine audiometry screening.`; }
        out.innerHTML = `<div class="tool-result neutral" style="text-align:left; font-weight:normal; line-height:1.6; padding:1.5rem;">${html}</div>`;
    }

    function calcCrash() {
        let wt = parseFloat(document.getElementById('crashWeight').value) || parseFloat(document.getElementById('calcWeight').value);
        let ageY = parseInt(document.getElementById('crashAge').value) || parseInt(document.getElementById('ageYrs').value) || 0;
        let totalM = activePatientId ? globalPatientsStore[activePatientId].totalMonths : 0;
        if(!wt && totalM > 0) wt = getExpectedWeight(totalM);
        const out = document.getElementById('crashOutputArea');
        if(!wt || isNaN(wt)) { out.innerHTML = "Awaiting physical vectors weight parameter load."; return; }
        
        let defib1 = wt * 2; let defib2 = wt * 4;
        let adr = wt * 0.1; let amio = wt * 5; let fluid = wt * 20;
        let et = totalM < 12 ? 3.5 : (ageY / 4) + 4;
        let depth = totalM < 24 ? wt + 6 : (ageY / 2) + 12;

        out.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                <div style="background:var(--bg-surface); padding:8px; border-radius:6px; border:1px solid var(--danger);">
                    <small style="color:var(--danger); font-weight:bold;">DEFIB (JOULES)</small>
                    <div style="font-weight:bold; font-size:1.1rem; margin-top:3px;">1st Shock: ${defib1.toFixed(0)} J</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">2nd Shock: ${defib2.toFixed(0)} J</div>
                </div>
                <div style="background:var(--bg-surface); padding:8px; border-radius:6px; border:1px solid var(--danger);">
                    <small style="color:var(--danger); font-weight:bold;">AIRWAY (UNCUFFED)</small>
                    <div style="font-weight:bold; font-size:1.1rem; margin-top:3px;">ET Size: ${et.toFixed(1)}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Depth: ${depth.toFixed(1)} cm</div>
                </div>
            </div>
            <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--danger);">
                <div style="font-size:0.8rem; font-weight:bold; color:var(--danger); margin-bottom:5px;">CRITICAL DRUGS VOLUME OUT</div>
                <div>• Adrenaline (1:10k) IV/IO: <b>${adr.toFixed(2)} mL</b></div>
                <div>• Amiodarone Bolus: <b>${amio.toFixed(0)} mg</b></div>
                <div>• Crystalloid Bolus: <b>${fluid.toFixed(0)} mL</b></div>
            </div>
        `;
    }

    function calcGIR() {
        let wt = parseFloat(document.getElementById('girWt').value);
        let rate = parseFloat(document.getElementById('girRate').value);
        let dex = parseFloat(document.getElementById('girDex').value);
        let out = document.getElementById('girOutput');
        if(!wt || isNaN(wt) || !rate || isNaN(rate) || !dex || isNaN(dex)) { out.innerHTML = "GIR = [Rate × Dextrose%] / [Weight × 6]"; out.className = "tool-result neutral"; return; }
        let gir = (rate * dex) / (wt * 6);
        out.innerHTML = `GIR = <b style="color:var(--primary); font-size:1.2rem;">${gir.toFixed(2)}</b> mg/kg/min`;
        out.className = gir < 4 || gir > 8 ? "tool-result warning" : "tool-result success";
    }

    function calcAPGAR() {
        let score = parseInt(document.getElementById('apgarHR').value) + parseInt(document.getElementById('apgarResp').value) + parseInt(document.getElementById('apgarTone').value) + parseInt(document.getElementById('apgarReflex').value) + parseInt(document.getElementById('apgarColor').value);
        let out = document.getElementById('apgarOutput');
        let stat = score >= 7 ? "Normal Transition" : (score >= 4 ? "Mild/Mod Distress" : "Severe Depression Emergency");
        out.innerHTML = `Score Evaluation: <b style="font-size:1.2rem;">${score}/10</b> (${stat})`;
        out.className = score >= 7 ? "tool-result success" : "tool-result danger";
    }

    // --- 10. FLUIDS, PRAM & JAUNDICE ---
    function calcFluids() {
        let wt = parseFloat(document.getElementById('fluidWeight').value || document.getElementById('pWeight').value); 
        let deg = parseFloat(document.getElementById('fluidDehydration').value);
        let out = document.getElementById('fluidResultArea'); 
        if(!wt || isNaN(wt)) return;
        let m = wt <= 10 ? wt*100 : (wt<=20 ? 1000 + (wt-10)*50 : 1500 + (wt-20)*20);
        let deficit = deg * wt * 10; let total = m + deficit;
        out.innerHTML = `Total Load Rate: <b>${total.toFixed(0)} mL / 24h</b><br>Maintenance Speed: <b>${(total/24).toFixed(1)} mL/hr</b>`;
    }

    function calcPRAM() {
        let score = parseInt(document.getElementById('pramO2').value) + parseInt(document.getElementById('pramSupra').value) + parseInt(document.getElementById('pramScalene').value) + parseInt(document.getElementById('pramAir').value) + parseInt(document.getElementById('pramWheeze').value);
        const resArea = document.getElementById('pramResultArea');
        let sev = "Mild"; let cls = "tool-result"; let proto = "Salbutamol MDI/Nebulizer. Discharge with spacer instruction.";
        if(score >= 8) { sev = "Severe Crisis"; cls = "tool-result danger"; proto = "Continuous Salbutamol + Ipratropium. Systemic Corticosteroids (IV Dex/Hydrocort). Arrange PICU."; }
        else if (score >= 4) { sev = "Moderate Severity"; cls = "tool-result warning"; proto = "Salbutamol Nebulization Q20 mins × 3 rounds. Oral Prednisolone course."; }
        resArea.innerHTML = `PRAM Severity Score: <b>${score}/12</b> (${sev})<div style="margin-top:15px; font-size:0.95rem; text-align:left; font-weight:normal; line-height:1.5;"><b>Clinical Management Directive:</b><br>${proto}</div>`;
        resArea.className = cls;
    }

    function calcJaundice() {
        const hr = parseFloat(document.getElementById('jaunHours').value); const tsb = parseFloat(document.getElementById('jaunTSB').value);
        const risk = document.getElementById('jaunRisk').value; const resArea = document.getElementById('jaunResultArea');
        if(!hr || isNaN(hr) || !tsb || isNaN(tsb)) { resArea.innerHTML = "Provide parameters."; return; }
        if(hr < 24) { resArea.innerHTML = "<b>🚨 Critical Hyperbilirubinemia:</b> Visual jaundice &lt; 24 hours of life is strictly pathological. Intercept immediately."; resArea.className = "tool-result danger"; return; }
        
        let limit = 15;
        if (hr <= 24) limit = risk === 'high' ? 8 : (risk === 'med' ? 10 : 12);
        else if (hr <= 48) limit = risk === 'high' ? 11 : (risk === 'med' ? 13 : 15);
        else if (hr <= 72) limit = risk === 'high' ? 13 : (risk === 'med' ? 15 : 18);
        else limit = risk === 'high' ? 14 : (risk === 'med' ? 17 : 20);
        
        if(tsb >= limit) { resArea.innerHTML = `<b>🚨 Phototherapy Threshold Breached</b><br>TSB level of ${tsb} mg/dL is at or above safety threshold (${limit} mg/dL).`; resArea.className = "tool-result danger"; }
        else if (tsb >= limit - 2) { resArea.innerHTML = `<b>⚠️ High-Intermediate Risk Zone Warning</b><br>TSB profile (${tsb} mg/dL) is within 2 mg/dL of emergency line. Repeat in 12-24 hours.`; resArea.className = "tool-result warning"; }
        else { resArea.innerHTML = `<b>✅ Safe Baseline Zone Metrics</b><br>TSB profile stands within safe margin clearances.`; resArea.className = "tool-result"; }
    }