// js/module-growth.js
/**
 * KidDoq Module: Growth & Milestones
 * Handles Chart.js WHO curves and Developmental check-ins.
 */

// --- MILESTONES ---
window.renderMilestoneDashboard = function() {
    const pId = AppStore.getActivePatientId();
    if(!pId) return;

    const patient = AppStore.getPatient(pId);
    const achieved = patient.achievedMilestones || {};
    const ageInMonths = patient.totalMonths || 0; 

    const availableAges = Object.keys(milestonesDb).map(Number).sort((a,b)=>a-b);
    let currentBracket = 0; let upcomingBracket = 0;
    
    for(let i=0; i<availableAges.length; i++){ 
        if(ageInMonths >= availableAges[i]) currentBracket = availableAges[i]; 
        else break; 
    }
    upcomingBracket = availableAges.find(age => age > ageInMonths) || null;
    
    const evalContainer = document.getElementById('msEvalContainer');
    if (currentBracket === 0) { 
        evalContainer.innerHTML = "<p>Patient under milestone tracker bracket parameters.</p>"; 
    } else {
        let evalHTML = "";
        availableAges.forEach(age => {
            if (age <= currentBracket) {
                let isCurrent = (age === currentBracket);
                let borderStyle = isCurrent ? "border: 2px solid var(--primary);" : "border: 1px solid var(--border-soft);";
                let bgStyle = isCurrent ? "background: var(--primary-light);" : "background: var(--bg-surface);";
                evalHTML += `<div style="${borderStyle} ${bgStyle} padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1rem; box-shadow: var(--shadow-sm);"><h4 style="margin-top:0; color:var(--primary); margin-bottom:1rem; font-size:1.1rem; border-bottom:1px solid var(--border-soft); padding-bottom:10px;">${isCurrent ? `Current Age Milestone Bracket (${age} Mos)` : `Historical Check Target (${age} Mos)`}</h4>`;
                milestonesDb[age].forEach(m => { evalHTML += `<div style="display:flex; align-items:start; margin-bottom:8px;"><input type="checkbox" id="${m.id}" ${achieved[m.id] ? 'checked' : ''} onchange="toggleMilestone('${m.id}', this.checked)" style="margin-right:10px; margin-top:4px;"><div><span style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${m.domain}</span><div style="font-size:0.95rem;"><label for="${m.id}" style="cursor:pointer; font-weight:normal; margin:0; text-transform:none;">${m.text}</label></div></div></div>`; });
                evalHTML += `</div>`;
            }
        });
        evalContainer.innerHTML = evalHTML;
    }

    let completedHTML = ""; let missedHTML = "";
    availableAges.forEach(age => {
        let aHTML = ""; milestonesDb[age].forEach(m => { if(achieved[m.id]) aHTML += `<div>✅ <b>${m.domain}</b>: ${m.text}</div>`; });
        if(aHTML) completedHTML += `<h5 style="margin:1rem 0 0.25rem 0; color:var(--success); font-size:0.95rem; border-bottom:1px solid #bbf7d0; padding-bottom:5px;">Achieved via ${age}m vectors:</h5>${aHTML}`;
        if(age <= currentBracket) { milestonesDb[age].forEach(m => { if(!achieved[m.id]) missedHTML += `<div style="padding:10px; border:1px solid #fecaca; background:rgba(239, 68, 68, 0.05); border-radius:8px; margin-bottom:10px;"><h4 style="margin:0 0 5px 0; color:#991b1b;">🚨 Flagged: ${m.text} (Expected by ${age} Mos)</h4><span style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${m.domain}</span><div style="font-size:0.85rem; margin-top:5px; color:#7f1d1d;"><b>Significance:</b> ${m.sig}</div></div>`; }); }
    });
    document.getElementById('msCompletedContainer').innerHTML = completedHTML || "<p>No milestones recorded.</p>";
    document.getElementById('msMissedContainer').innerHTML = missedHTML || "<div style='padding:1.5rem; background:rgba(16, 185, 129, 0.1); border:1px solid #16a34a; border-radius:var(--radius-lg); color:#166534; font-weight:bold;'>✅ All verification targets achieved.</div>";
    document.getElementById('msUpcomingContainer').innerHTML = upcomingBracket ? `<h4 style="margin:1rem 0 0.5rem 0; color:var(--primary); font-size:1.1rem; border-bottom:1px solid var(--border-soft); padding-bottom:5px;">Targeting: ${upcomingBracket} Months</h4>` + milestonesDb[upcomingBracket].map(m => `<div style="padding:1rem; border:1px solid var(--border-soft); border-radius:var(--radius-md); margin-bottom:0.75rem; background:var(--bg-surface); font-size:0.95rem; box-shadow:var(--shadow-sm);"><span style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${m.domain}</span><div style="font-weight:600; margin-top:5px; color:var(--text-main);">${m.text}</div></div>`).join("") : "<p>Advanced baseline clearance parameters.</p>";
};

window.toggleMilestone = function(mId, isChecked) {
    const pId = AppStore.getActivePatientId();
    if(!pId) return;
    
    let p = AppStore.getPatient(pId);
    if(!p.achievedMilestones) p.achievedMilestones = {};
    p.achievedMilestones[mId] = isChecked;
    
    AppStore.savePatient(p);
    renderMilestoneDashboard();
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
// Helper to estimate the exact WHO curve value for a specific month
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

    // Evaluate significance
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

    // Update UI
    const area = document.getElementById('growthResultArea');
    if (area) {
        area.style.display = 'block';
        area.style.borderLeft = `4px solid ${titleColor}`;
        document.getElementById('growthStatusTitle').innerText = statusText;
        document.getElementById('growthStatusTitle').style.color = titleColor;
        document.getElementById('growthExplanationText').innerHTML = explanationText;
    }

    // Save to patient profile for the print summary
    if (typeof activePatientId !== 'undefined' && activePatientId) {
        let p = AppStore.getPatient(activePatientId);
        if (p) {
            p.growthExplanation = `<b>Status:</b> ${statusText}<br>${explanationText.replace('<br><br>', ' ')}`;
            AppStore.savePatient(p);
        }
    }

    // TENSION 0.4 adds beautiful bezier curves to the chart lines!
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
    const pWtElem = document.getElementById('pWeight');
    const inlineWtElem = document.getElementById('inlineCalcWeight'); // Ensure we pull the most recent weight
    const wt = parseFloat((inlineWtElem ? inlineWtElem.value : 0) || (pWtElem ? pWtElem.value : 0) || 10);
    
    let htObj = document.getElementById('htCm'); 
    let htOnTheGoObj = document.getElementById('htCmOnTheGo');
    const ht = parseFloat( (htOnTheGoObj && htOnTheGoObj.value) ? htOnTheGoObj.value : (htObj ? htObj.value : 0) );
    
    let totalM = typeof activePatientId !== 'undefined' && activePatientId ? globalPatientsStore[activePatientId].totalMonths : 0;
    let pGender = document.getElementById('gender') ? document.getElementById('gender').value : 'male';
    
    if(!ht || isNaN(ht) || !wt || isNaN(wt)) return; 
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