// js/module-growth.js
/**
 * KidDoq Module: Growth & Milestones
 * Handles Chart.js WHO curves and Developmental check-ins.
 */

// --- DYNAMIC MILESTONE TRACKER ---
window.renderMilestoneDashboard = function() {
    const pId = AppStore.getActivePatientId();
    if(!pId) return;

    const patient = AppStore.getPatient(pId);
    const achieved = patient.achievedMilestones || {};
    let dob = patient.dob ? new Date(patient.dob) : null;

    const evalContainer = document.getElementById('milestoneTimelineContainer');
    if (!evalContainer) return;

    if (typeof milestonesDb === 'undefined') {
        evalContainer.innerHTML = "<p>Milestone Database loading...</p>";
        return;
    }

    let pendingHTML = "<div style='display:flex; flex-direction:column; gap:12px;'>";
    let pendingCount = 0;

    Object.keys(milestonesDb).sort((a,b)=>a-b).forEach(month => {
        let msArray = milestonesDb[month];
        
        let targetDateStr = "Set DOB in Registry";
        let isOverdue = false;
        if (dob) {
            let tDate = new Date(dob);
            tDate.setMonth(tDate.getMonth() + parseInt(month));
            targetDateStr = tDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (new Date() > tDate) isOverdue = true;
        }

        msArray.forEach(ms => {
            let isAchieved = achieved[ms.id];
            
            // ONLY render if NOT achieved
            if (!isAchieved) {
                pendingCount++;
                pendingHTML += `
                <label style="background:var(--bg-surface); padding:16px; border-radius:8px; border:1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-soft)'}; display:flex; align-items:center; gap:15px; cursor:pointer; box-shadow:var(--shadow-sm); transition:all 0.2s;">
                    <input type="checkbox" value="${ms.id}" onchange="toggleMilestone('${ms.id}', this.checked)" style="width:26px; height:26px; accent-color:var(--brand-pink); cursor:pointer;">
                    <div style="flex-grow:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="font-weight:800; color:var(--text-main); font-size:1.05rem;">
                                ${ms.text} 
                            </div>
                            <span style="font-size:0.75rem; background:var(--primary-light); color:var(--primary-dark); padding:4px 8px; border-radius:4px; font-weight:bold; text-transform:uppercase;">${ms.domain}</span>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:8px;">
                            <span style="font-size:0.85rem; padding:4px 8px; border-radius:4px; background:${isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-body)'}; color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'}; font-weight:600;">
                                Target: ${month} Months (${targetDateStr})
                            </span>
                        </div>
                    </div>
                </label>`;
            }
        });
    });
    
    pendingHTML += "</div>";

    if (pendingCount === 0) {
        pendingHTML = `
        <div style="padding:40px; text-align:center; background:rgba(255, 92, 171, 0.05); border:2px dashed var(--brand-pink); border-radius:12px;">
            <span style="font-size:3rem;">🧠✨</span>
            <h3 style="color:var(--brand-pink); margin:10px 0 0 0;">Development on Track!</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin:5px 0 0 0;">All required milestones have been achieved and hidden from view.</p>
        </div>`;
    }

    evalContainer.innerHTML = pendingHTML;
};

window.toggleMilestone = function(msId, isAchieved) {
    let pId = AppStore.getActivePatientId();
    if (!pId) return;
    const p = AppStore.getPatient(pId);
    if (!p.achievedMilestones) p.achievedMilestones = {};
    
    if (isAchieved) {
        p.achievedMilestones[msId] = new Date().toISOString().split('T')[0];
    } else {
        delete p.achievedMilestones[msId];
    }
    
    AppStore.savePatient(p);
    
    if (typeof renderMilestoneDashboard === 'function') renderMilestoneDashboard();
    if (typeof updateCopilot === 'function') updateCopilot(pId);
};

window.buildMilestoneReference = function() {
    let tableHTML = `<table class="theory-table"><thead><tr><th>Age Bracket</th><th>Domain</th><th>Milestone Marker</th></tr></thead><tbody>`;
    Object.keys(milestonesDb).forEach(age => {
        milestonesDb[age].forEach((m, idx) => {
            if(idx === 0) { tableHTML += `<tr><td rowspan="${milestonesDb[age].length}"><b>${age} Months</b></td><td><span style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${m.domain}</span></td><td>${m.text}</td></tr>`; } 
            else { tableHTML += `<tr><td><span style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${m.domain}</span></td><td>${m.text}</td></tr>`; }
        });
    });
    const refContainer = document.getElementById('msReferenceContainer');
    if(refContainer) refContainer.innerHTML = tableHTML + `</tbody></table>`;
}

// --- GROWTH CHARTS ---
function getInterpolatedVal(ageM, xArr, yArr) {
    if (ageM <= 0) return yArr[0];
    if (ageM >= 36) return yArr[6];
    for(let i=0; i<xArr.length-1; i++) {
        if (ageM >= xArr[i] && ageM <= xArr[i+1]) {
            let range = xArr[i+1] - xArr[i];
            let fraction = (ageM - xArr[i]) / range;
            return yArr[i] + fraction * (yArr[i+1] - yArr[i]);
        }
    }
    return yArr[0];
}

window.drawGrowthCharts = function(patientAgeMonths, currentWeight, currentHeight, patientGender) {
    if(wtChartInstance) wtChartInstance.destroy(); if(htChartInstance) htChartInstance.destroy();
    const standardXLabels = [0, 6, 12, 18, 24, 30, 36];
    const weight50th = patientGender === 'male' ? [3.3, 7.9, 9.6, 10.9, 12.2, 13.3, 14.3] : [3.2, 7.3, 8.9, 10.2, 11.5, 12.7, 13.9];
    const weight3rd  = patientGender === 'male' ? [2.4, 6.4, 7.8, 8.8, 9.7, 10.5, 11.3] : [2.4, 5.8, 7.0, 7.9, 8.7, 9.4, 10.2];
    const weight97th = patientGender === 'male' ? [4.3, 9.8, 12.0, 13.7, 15.3, 16.9, 18.3] : [4.2, 9.3, 11.5, 13.2, 15.0, 16.7, 18.1];
    const height50th = patientGender === 'male' ? [50, 67, 76, 82, 87, 92, 96] : [49, 65, 74, 80, 85, 90, 95];
    const height3rd  = patientGender === 'male' ? [46, 63, 71, 76, 81, 85, 89] : [45, 61, 69, 74, 79, 83, 87];
    const height97th = patientGender === 'male' ? [54, 71, 81, 88, 93, 99, 103] : [53, 69, 79, 86, 91, 97, 101];

    let exact3rd = getInterpolatedVal(patientAgeMonths, standardXLabels, weight3rd);
    let exact50th = getInterpolatedVal(patientAgeMonths, standardXLabels, weight50th);
    
    let statusText = "";
    let explanationText = "";
    let titleColor = "";

    if (currentWeight < exact3rd) {
        statusText = "🚨 Below 3rd Percentile";
        titleColor = "var(--danger)";
        explanationText = `At ${currentWeight} kg, the patient is plotting below the 3rd percentile for their age (${patientAgeMonths} mos). This indicates they weigh less than 97% of healthy children their age.<br><br><b>Significance for Parents:</b> Your child needs a bit of extra help catching up. We will review their diet and monitor them closely to ensure they are getting the energy they need to grow.`;
    } else if (currentWeight < exact50th) {
        statusText = "⚖️ Expected Growth (Lower Curve)";
        titleColor = "var(--warning)";
        explanationText = `At ${currentWeight} kg, the patient is plotting between the 3rd and 50th percentile. This is a normal, healthy growth pattern.<br><br><b>Significance for Parents:</b> Your child is growing exactly as expected on their personal curve! Continue routine feeding and we will make sure they maintain this steady path.`;
    } else {
        statusText = "⭐ Optimal Growth (Upper Curve)";
        titleColor = "var(--success)";
        explanationText = `At ${currentWeight} kg, the patient is plotting at or above the 50th percentile average.<br><br><b>Significance for Parents:</b> Excellent growth and nutritional status! Your child is tracking perfectly along the upper median WHO curve.`;
    }

    const area = document.getElementById('growthResultArea');
    if (area) {
        area.style.display = 'block';
        area.style.borderLeft = `4px solid ${titleColor}`;
        document.getElementById('growthStatusTitle').innerText = statusText;
        document.getElementById('growthStatusTitle').style.color = titleColor;
        document.getElementById('growthExplanationText').innerHTML = explanationText;
    }

    if (typeof activePatientId !== 'undefined' && activePatientId) {
        let p = AppStore.getPatient(activePatientId);
        if (p) {
            p.growthExplanation = `<b>Status:</b> ${statusText}<br>${explanationText.replace('<br><br>', ' ')}`;
            AppStore.savePatient(p);
        }
    }

    const ctxW = document.getElementById('weightChartCanvas');
    if(ctxW) {
        wtChartInstance = new Chart(ctxW.getContext('2d'), { type: 'line', data: { labels: standardXLabels, datasets: [ { label: 'Patient', data: [{x: patientAgeMonths, y: currentWeight}], backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', pointRadius: 8, showLine: false }, { label: '97th %', data: weight97th, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0, tension: 0.4 }, { label: '50th %', data: weight50th, borderColor: 'rgba(16, 185, 129, 0.8)', fill: false, pointRadius: 0, tension: 0.4 }, { label: '3rd %', data: weight3rd, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0, tension: 0.4 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Age (Mos)' }, min:0, max:36 } } } });
    }
    const ctxH = document.getElementById('heightChartCanvas');
    if(ctxH) {
        htChartInstance = new Chart(ctxH.getContext('2d'), { type: 'line', data: { labels: standardXLabels, datasets: [ { label: 'Patient', data: [{x: patientAgeMonths, y: currentHeight}], backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', pointRadius: 8, showLine: false }, { label: '97th %', data: height97th, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0, tension: 0.4 }, { label: '50th %', data: height50th, borderColor: 'rgba(16, 185, 129, 0.8)', fill: false, pointRadius: 0, tension: 0.4 }, { label: '3rd %', data: height3rd, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0, tension: 0.4 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Age (Mos)' }, min:0, max:36 } } } });
    }
};

window.calcGrowth = function() {
    // 1. Try HUD First (Zero-Click Cockpit)
    let hudWt = document.getElementById('hudWeight') ? parseFloat(document.getElementById('hudWeight').value) : 0;
    let hudHt = document.getElementById('hudHeight') ? parseFloat(document.getElementById('hudHeight').value) : 0;
    let hudMos = document.getElementById('hudAge') ? parseInt(document.getElementById('hudAge').value) : 0;
    let hudGen = document.getElementById('hudGender') ? document.getElementById('hudGender').value : 'male';

    // 2. Fallback to Registry/Inline if HUD is empty
    const pWtElem = document.getElementById('pWeight');
    const inlineWtElem = document.getElementById('inlineCalcWeight'); 
    const wt = hudWt || parseFloat((inlineWtElem ? inlineWtElem.value : 0) || (pWtElem ? pWtElem.value : 0) || 0);
    
    let htObj = document.getElementById('htCm'); 
    let htOnTheGoObj = document.getElementById('htCmOnTheGo');
    const ht = hudHt || parseFloat( (htOnTheGoObj && htOnTheGoObj.value) ? htOnTheGoObj.value : (htObj ? htObj.value : 0) );
    
    // SAFE FALLBACK: Check if globalPatientsStore[activePatientId] actually exists before reading totalMonths
    let totalM = hudMos || (typeof activePatientId !== 'undefined' && activePatientId && globalPatientsStore[activePatientId] ? globalPatientsStore[activePatientId].totalMonths : 0);
    let pGender = hudGen || (document.getElementById('gender') ? document.getElementById('gender').value : 'male');
    
    if(!ht || isNaN(ht) || !wt || isNaN(wt)) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Enter Weight and Height in Cockpit to plot charts.");
        return; 
    }
    drawGrowthCharts(totalM, wt, ht, pGender);
};

window.syncGrowthFieldsAndCalc = function() { 
    let v = document.getElementById('htCmOnTheGo').value; 
    document.getElementById('htCm').value = v; 
    if(typeof activePatientId !== 'undefined' && activePatientId) {
        if(typeof saveAndRegisterPatient === 'function') saveAndRegisterPatient(true); 
    } else {
        calcGrowth(); 
    }
};