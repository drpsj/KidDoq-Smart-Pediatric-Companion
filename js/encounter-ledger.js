// js/encounter-ledger.js
/**
 * KidDoq Module: Encounter Ledger & Active Visit Summary
 * Handles historical records, live Rx previews, and locking drafts.
 */

window.openHistoricalEncounters = function(btnElem) {
    if (!AppStore.getActivePatientId()) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!");
        return;
    }
    if(typeof ViewController !== 'undefined') ViewController.switchNavTab('historicalEncountersView');
    if (btnElem) {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }
    renderHistoricalLedger();
};

window.renderHistoricalLedger = function() {
    const pId = AppStore.getActivePatientId();
    if(!pId) return;
    const p = AppStore.getPatient(pId);
    const container = document.getElementById('historicalLedgerContainer');

    if (!p.visits || p.visits.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px dashed var(--border-soft);">No historical encounters recorded. Lock an active visit to start the ledger.</div>`;
        return;
    }

    let html = "";

    [...p.visits].reverse().forEach((visit) => {
        const dateStr = new Date(visit.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        let rxHtml = visit.rxList && visit.rxList.length > 0 ? visit.rxList.map(rx => `• <b>${rx.name}</b> (${rx.vol} ${rx.unit})`).join("<br>") : "";
        let dietHtml = visit.dietLogs && visit.dietLogs.length > 0 ? `<div style="font-size:0.85rem; color:#10b981; margin-top:5px;"><b>Diet Logged:</b> ${visit.dietLogs.length} items</div>` : "";
        let vaxHtml = visit.vaccinesGiven && visit.vaccinesGiven.length > 0 ? `<div style="font-size:0.85rem; color:#5b61f6; margin-top:5px;"><b>Vaccines Given:</b> ${visit.vaccinesGiven.join(', ')}</div>` : "";

        html += `
        <div style="border:1px solid var(--border-soft); border-radius:var(--radius-md); padding:1.2rem; margin-bottom:15px; background:var(--bg-surface); box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px dashed var(--border-soft); padding-bottom:8px;">
                <b style="color:var(--primary-dark); font-size:1.05rem;">${dateStr}</b>
                <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Wt: ${visit.weight || '--'} kg</span>
            </div>
            ${visit.diagnosis ? `<div style="font-size:0.95rem; margin-bottom:10px; color:var(--text-main);"><b>Dx:</b> ${visit.diagnosis}</div>` : ''}
            
            ${(visit.examRS || visit.examCVS || visit.examPA || visit.examCNS) ? 
                `<div style="font-size:0.85rem; color:var(--text-main); margin-bottom:10px; background:#f1f5f9; padding:8px; border-radius:4px;"><b>O/E:</b> 
                    ${visit.examRS ? `RS: ${visit.examRS} | ` : ''}
                    ${visit.examCVS ? `CVS: ${visit.examCVS} | ` : ''}
                    ${visit.examPA ? `P/A: ${visit.examPA} | ` : ''}
                    ${visit.examCNS ? `CNS: ${visit.examCNS}` : ''}
                </div>`.replace(/ \|\s*<\//, '</') : ''}

            <div style="font-size:0.9rem; color:var(--text-main); margin-bottom:10px; line-height:1.5;">${rxHtml || '<span style="color:var(--text-muted);">No medications.</span>'}</div>
            ${visit.tests ? `<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;"><b>Tests:</b> ${visit.tests}</div>` : ''}
            ${visit.advice ? `<div style="font-size:0.85rem; color:var(--text-main); background: #fef3c7; padding:8px; border-radius:4px; border-left:3px solid #f59e0b;"><b>Advice / Next Steps:</b><br>${visit.advice}</div>` : ''}
            ${dietHtml} ${vaxHtml}
        </div>`;
    });
    
    // Inject the history into BOTH the Global Ledger AND the Case Sheet Ledger
    if (container) container.innerHTML = html;
    
    const caseSheetLedger = document.getElementById('rxLedgerList');
    if (caseSheetLedger) caseSheetLedger.innerHTML = html;
};

window.openActiveSummary = function(btnElem) {
    if (!AppStore.getActivePatientId()) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!");
        return;
    }
    
    let p = AppStore.getPatient(AppStore.getActivePatientId());
    const finalWt = document.getElementById('inlineCalcWeight') ? document.getElementById('inlineCalcWeight').value : null;
    if(finalWt && !isNaN(parseFloat(finalWt))) p.weight = parseFloat(finalWt).toFixed(1);

    p.diagnosis = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : p.diagnosis;
    p.tests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : p.tests;
    p.advice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : p.advice;
    p.review = document.getElementById('rxReview') ? document.getElementById('rxReview').value : p.review;
    
    p.examRS = document.getElementById('examRS') ? document.getElementById('examRS').value : p.examRS;
    p.examCVS = document.getElementById('examCVS') ? document.getElementById('examCVS').value : p.examCVS;
    p.examPA = document.getElementById('examPA') ? document.getElementById('examPA').value : p.examPA;
    p.examCNS = document.getElementById('examCNS') ? document.getElementById('examCNS').value : p.examCNS;

    AppStore.savePatient(p); 

    if(typeof ViewController !== 'undefined') ViewController.switchNavTab('encounterSummaryGlobalView');
    if (btnElem) {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }
    renderLiveComprehensiveSummary();
};

window.renderLiveComprehensiveSummary = function() {
    const pId = AppStore.getActivePatientId();
    const p = AppStore.getPatient(pId);
    const container = document.getElementById('liveSummaryPreview');
    let html = `<div style="font-family:sans-serif; color:#333;">`;
    
    html += `<h3 style="color:#1e3a8a; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px;">Current Draft (Unsaved)</h3>`;
    
    if (p.diagnosis) html += `<div style="margin-bottom:10px;"><b>Diagnosis:</b> ${p.diagnosis}</div>`;
    
    if (p.examRS || p.examCVS || p.examPA || p.examCNS) {
        html += `<div style="margin-bottom:15px; background:var(--bg-body); padding:10px; border-radius:6px; font-size:0.9rem;">
                    <b style="color:var(--primary-dark);">Systemic Examination:</b>
                    <ul style="margin:5px 0 0 0; padding-left:20px; line-height:1.4;">
                        ${p.examRS ? `<li><b>RS:</b> ${p.examRS}</li>` : ''}
                        ${p.examCVS ? `<li><b>CVS:</b> ${p.examCVS}</li>` : ''}
                        ${p.examPA ? `<li><b>P/A:</b> ${p.examPA}</li>` : ''}
                        ${p.examCNS ? `<li><b>CNS:</b> ${p.examCNS}</li>` : ''}
                    </ul>
                 </div>`;
    }

    if (p.rxList && p.rxList.length > 0) {
        html += `<div style="margin-bottom:10px;"><b>Medications:</b><ul style="margin:5px 0; padding-left:20px;">`;
        p.rxList.forEach(rx => { html += `<li style="margin-bottom:5px;"><b>${rx.name}</b> - ${rx.vol} ${rx.unit} (<i>${rx.freq}</i>)</li>`; });
        html += `</ul></div>`;
    }
    if (p.tests) html += `<div style="margin-bottom:10px;"><b>Investigations:</b> ${p.tests.replace(/\n/g, '<br>')}</div>`;
    
    if (p.advice) html += `<div style="margin-bottom:15px; background: #fef3c7; padding:10px; border-radius:4px; border-left:4px solid #f59e0b;"><b>Advice / Next Steps:</b><br>${p.advice.replace(/\n/g, '<br>')}</div>`;
    
    let maln = typeof extractToolResult === 'function' ? extractToolResult('malnGridOutput') : ""; 
    if(maln) html += `<h3 style="color:#1e3a8a; font-size:1rem; border-bottom:1px solid #ccc; margin-top:20px;">Triage</h3>${maln}`;

    if (p.dietLogs && p.dietLogs.length > 0 && typeof generateNutritionReport === 'function') {
        html += `<div style="margin-top:20px;">${generateNutritionReport(pId)}</div>`;
    }
    
    let todayStr = new Date().toISOString().split('T')[0];
    let todaysVax = [];
    if(p.givenDates) {
        for (const [vaxId, date] of Object.entries(p.givenDates)) {
            if (date === todayStr) todaysVax.push(vaxId);
        }
    }
    if (todaysVax.length > 0) {
        html += `<h3 style="color:#1e3a8a; font-size:1rem; border-bottom:1px solid #ccc; margin-top:20px;">Vaccines Administered Today</h3>
                 <ul style="padding-left:20px;">${todaysVax.map(v => `<li><b>${v.toUpperCase()}</b></li>`).join('')}</ul>`;
    }

    html += `</div>`;
    container.innerHTML = html;
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
    
    // ROUTE BACK TO CASE SHEET & SHOW LEDGER
    window.openClinicalTool('prescriptionFeatureView');
    document.getElementById('rxDraftView').style.display = 'none';
    document.getElementById('rxLedgerView').style.display = 'block';
    
    if(typeof renderHistoricalLedger === 'function') renderHistoricalLedger();
    if(typeof updateCopilot === 'function') updateCopilot(AppStore.getActivePatientId());
};

window.cancelNewVisit = function() {
    if(confirm("Discard this draft? Unsaved changes will be lost.")) {
        document.getElementById('rxDraftView').style.display = 'none';
        document.getElementById('rxLedgerView').style.display = 'block';
    }
};

window.editDraft = function() {
    // Jump back to the draft from the Summary Review screen
    window.openClinicalTool('prescriptionFeatureView');
    document.getElementById('rxLedgerView').style.display = 'none';
    document.getElementById('rxDraftView').style.display = 'block';
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