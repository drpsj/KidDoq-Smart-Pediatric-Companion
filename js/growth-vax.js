// --- 7. SCHEDULE TRACKER & CATCH-UP ENGINE ---
    window.updateVaccineDate = function(pId, vaxId, dateVal) {
        let p = AppStore.getPatient(pId);
        if(!p) return;
        if(!p.givenDates) p.givenDates = {};
        
        // If doctor picks a date, save it. If they clear it, delete it.
        if (dateVal) p.givenDates[vaxId] = dateVal;
        else delete p.givenDates[vaxId];
        
        AppStore.savePatient(p);
        calculateAndRenderTimeline(pId); // The Catch-Up Engine recalculates everything!
    };

    function calculateAndRenderTimeline(pId) {
        const patient = AppStore.getPatient(pId);
        if (!patient) return;
        
        // 1. Ask the Math Brain to run the Catch-Up Algorithm
        const computedTimeline = ClinicalMath.calculateVaccineTimeline(patient, baseVaccineSchema);
        
        const leftCol = document.getElementById('vaxLeftCol');
        const midCol = document.getElementById('vaxMidCol');
        const rightCol = document.getElementById('vaxRightCol');

        leftCol.innerHTML = "<h3 style='margin-top:0; color:var(--text-main); font-size:1.1rem; border-bottom:2px solid var(--border-soft); padding-bottom:8px;'>📜 Master Log (Editable)</h3>";
        midCol.innerHTML = "<h3 style='margin-top:0; color:var(--danger); font-size:1.1rem; border-bottom:2px solid rgba(239, 68, 68, 0.2); padding-bottom:8px;'>🚨 Due Now / Catch-Up</h3>";
        rightCol.innerHTML = "<h3 style='margin-top:0; color:var(--primary); font-size:1.1rem; border-bottom:2px solid rgba(91, 97, 246, 0.2); padding-bottom:8px;'>📅 Future Schedule</h3>";

        let today = new Date();
        let thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(today.getDate() + 30);
        let groups = {};
        
        Object.values(computedTimeline).forEach(v => {
            if(!groups[v.group]) groups[v.group] = [];
            groups[v.group].push(v);
        });

        // 2. Build Column 1: Editable Master Log
        for (const [gName, vaxList] of Object.entries(groups)) {
            let html = `<div style="margin-bottom:15px;">
                <h4 style="margin:0 0 5px 0; color:var(--primary-dark); font-size:0.85rem; text-transform:uppercase;">${gName}</h4>`;
            vaxList.forEach(v => {
                const isDone = v.actual !== "";
                html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.85rem; font-weight:600; color:${isDone ? 'var(--text-muted)' : 'var(--text-main)'}; text-decoration:${isDone ? 'line-through' : 'none'};">${v.name}</span>
                    <input type="date" value="${v.actual}" onchange="updateVaccineDate('${pId}', '${v.id}', this.value)" style="padding:4px; border:1px solid var(--border-soft); border-radius:4px; font-size:0.8rem; width:130px; background:${isDone ? 'rgba(16,185,129,0.1)' : '#fff'}; cursor:pointer;">
                </div>`;
            });
            html += `</div>`;
            leftCol.innerHTML += html;
        }

        // 3. Build Columns 2 & 3: The Smart Sorting Engine
        let upcomingWAPush = [];
        let dueNowCount = 0; let futureCount = 0;

        Object.values(computedTimeline).forEach(v => {
            if (v.actual !== "") return; // Hide completed vaccines from active columns

            const projDate = new Date(v.projected);
            const prettyProj = projDate.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
            
            // Highlight vaccines shifted by the Catch-Up algorithm
            const delayedBadge = v.isDelayed ? `<span style="background:var(--warning); color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px;">Catch-up Adjusted</span>` : "";

            let cardHtml = `<div style="background:var(--bg-surface); border-left:4px solid ${v.status === 'overdue' ? 'var(--danger)' : 'var(--primary)'}; padding:10px; margin-bottom:10px; border-radius:6px; box-shadow:var(--shadow-sm);">
                <div style="font-weight:bold; font-size:0.9rem; color:var(--text-main);">${v.name} ${delayedBadge}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:3px;">
                    <b>Target Date:</b> ${prettyProj}
                </div>
            </div>`;

            if (projDate <= thirtyDaysFromNow) {
                midCol.innerHTML += cardHtml;
                upcomingWAPush.push(v.name);
                dueNowCount++;
            } else {
                rightCol.innerHTML += cardHtml;
                futureCount++;
            }
        });

        if (dueNowCount === 0) midCol.innerHTML += `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; margin-top:20px;">No vaccines currently due.</div>`;
        if (futureCount === 0) rightCol.innerHTML += `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; margin-top:20px;">Schedule complete!</div>`;

        // Save active array for WhatsApp engine securely
        patient.upcomingVaccinesForWhatsapp = upcomingWAPush;
        AppStore.savePatient(patient);

        // 4. Render NIS Guidelines Tab
        document.getElementById('nisReferenceArea').innerHTML = `
            <table class="theory-table" style="font-size:0.85rem; width:100%; text-align:left;">
                <thead><tr style="background:var(--bg-body);"><th style="padding:8px;">Age Group</th><th style="padding:8px;">NIS India Guidelines</th></tr></thead>
                <tbody>
                    <tr><td style="padding:8px; border-bottom:1px solid var(--border-soft);">Birth</td><td style="padding:8px; border-bottom:1px solid var(--border-soft);">BCG, OPV-0, Hep B-0</td></tr>
                    <tr><td style="padding:8px; border-bottom:1px solid var(--border-soft);">6, 10, 14 Wks</td><td style="padding:8px; border-bottom:1px solid var(--border-soft);">OPV 1-3, Pentavalent 1-3, RVV 1-3, fIPV 1-2 (6/14)</td></tr>
                    <tr><td style="padding:8px; border-bottom:1px solid var(--border-soft);">9 - 12 Mos</td><td style="padding:8px; border-bottom:1px solid var(--border-soft);">Measles/MR 1, JE 1, PCV Booster</td></tr>
                    <tr><td style="padding:8px; border-bottom:1px solid var(--border-soft);">16 - 24 Mos</td><td style="padding:8px; border-bottom:1px solid var(--border-soft);">MR 2, JE 2, DPT Booster 1, OPV Booster</td></tr>
                    <tr><td style="padding:8px; border-bottom:1px solid var(--border-soft);">5 - 6 Yrs</td><td style="padding:8px; border-bottom:1px solid var(--border-soft);">DPT Booster 2</td></tr>
                    <tr><td style="padding:8px;">10 & 16 Yrs</td><td style="padding:8px;">Td (Tetanus & adult Diphtheria)</td></tr>
                </tbody>
            </table>
        `;
    }

    // --- 11. MILESTONES ---
    function renderMilestoneDashboard() {
        if(!activePatientId) return;
        const patient = globalPatientsStore[activePatientId]; const achieved = patient.achievedMilestones || {};
        const availableAges = Object.keys(milestonesDb).map(Number).sort((a,b)=>a-b);
        let currentBracket = 0; let upcomingBracket = 0;
        for(let i=0; i<availableAges.length; i++){ if(currentPatientAgeInMonths >= availableAges[i]) currentBracket = availableAges[i]; else break; }
        upcomingBracket = availableAges.find(age => age > currentPatientAgeInMonths) || null;
        
        const evalContainer = document.getElementById('msEvalContainer');
        if (currentBracket === 0) { evalContainer.innerHTML = "<p>Patient under milestone tracker bracket parameters.</p>"; } else {
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
    }

    function toggleMilestone(mId, isChecked) { globalPatientsStore[activePatientId].achievedMilestones[mId] = isChecked; localStorage.setItem('nis_patients', JSON.stringify(globalPatientsStore)); renderMilestoneDashboard(); }
    
    function buildMilestoneReference() {
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

    // --- 12. GROWTH CHARTS ---
    function drawGrowthCharts(patientAgeMonths, currentWeight, currentHeight, patientGender) {
        if(wtChartInstance) wtChartInstance.destroy(); if(htChartInstance) htChartInstance.destroy();
        const standardXLabels = [0, 6, 12, 18, 24, 30, 36];
        const weight50th = patientGender === 'male' ? [3.3, 7.9, 9.6, 10.9, 12.2, 13.3, 14.3] : [3.2, 7.3, 8.9, 10.2, 11.5, 12.7, 13.9];
        const weight3rd  = patientGender === 'male' ? [2.4, 6.4, 7.8, 8.8, 9.7, 10.5, 11.3] : [2.4, 5.8, 7.0, 7.9, 8.7, 9.4, 10.2];
        const weight97th = patientGender === 'male' ? [4.3, 9.8, 12.0, 13.7, 15.3, 16.9, 18.3] : [4.2, 9.3, 11.5, 13.2, 15.0, 16.7, 18.1];
        const height50th = patientGender === 'male' ? [50, 67, 76, 82, 87, 92, 96] : [49, 65, 74, 80, 85, 90, 95];
        const height3rd  = patientGender === 'male' ? [46, 63, 71, 76, 81, 85, 89] : [45, 61, 69, 74, 79, 83, 87];
        const height97th = patientGender === 'male' ? [54, 71, 81, 88, 93, 99, 103] : [53, 69, 79, 86, 91, 97, 101];

        const ctxW = document.getElementById('weightChartCanvas');
        if(ctxW) {
            wtChartInstance = new Chart(ctxW.getContext('2d'), { type: 'line', data: { labels: standardXLabels, datasets: [ { label: 'Patient Value', data: [{x: patientAgeMonths, y: currentWeight}], backgroundColor: 'red', borderColor: 'red', pointRadius: 7, showLine: false }, { label: 'WHO 97th %', data: weight97th, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0 }, { label: 'WHO 50th %', data: weight50th, borderColor: 'rgba(16, 185, 129, 0.8)', fill: false, pointRadius: 0 }, { label: 'WHO 3rd %', data: weight3rd, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Age (Mos)' }, min:0, max:36 } } } });
        }
        const ctxH = document.getElementById('heightChartCanvas');
        if(ctxH) {
            htChartInstance = new Chart(ctxH.getContext('2d'), { type: 'line', data: { labels: standardXLabels, datasets: [ { label: 'Patient Value', data: [{x: patientAgeMonths, y: currentHeight}], backgroundColor: 'red', borderColor: 'red', pointRadius: 7, showLine: false }, { label: 'WHO 97th %', data: height97th, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0 }, { label: 'WHO 50th %', data: height50th, borderColor: 'rgba(16, 185, 129, 0.8)', fill: false, pointRadius: 0 }, { label: 'WHO 3rd %', data: height3rd, borderColor: 'rgba(220, 38, 38, 0.4)', borderDash: [5,5], fill: false, pointRadius: 0 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Age (Mos)' }, min:0, max:36 } } } });
        }
    }

    function calcGrowth() {
        // Safe check for the weight boxes
        const pWtElem = document.getElementById('pWeight');
        const cWtElem = document.getElementById('calcWeight');
        const wt = parseFloat((pWtElem ? pWtElem.value : 0) || (cWtElem ? cWtElem.value : 0) || 10);
        
        let htObj = document.getElementById('htCm'); 
        let htOnTheGoObj = document.getElementById('triageHt');
        const ht = parseFloat( (htObj && htObj.value) ? htObj.value : (htOnTheGoObj ? htOnTheGoObj.value : 0) );
        
        let totalM = activePatientId ? globalPatientsStore[activePatientId].totalMonths : (parseInt(document.getElementById('calcQuickAge') ? document.getElementById('calcQuickAge').value : 0) || 0);
        let pGender = document.getElementById('gender') ? document.getElementById('gender').value : 'male';
        
        if(!ht || isNaN(ht)) return; 
        drawGrowthCharts(totalM, wt, ht, pGender);
    }

    function syncGrowthFieldsAndCalc() { let v = document.getElementById('htCmOnTheGo').value; document.getElementById('htCm').value = v; if(activePatientId) saveAndRegisterPatient(true); else calcGrowth(); }
