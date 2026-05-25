// --- 7. IMMUNIZATION TRACKER ---
    function calculateAndRenderTimeline(pId) {
        const patient = globalPatientsStore[pId]; const baseDate = new Date(patient.dob || new Date()); const today = new Date();
        document.getElementById('timelineOutput').innerHTML = ""; document.getElementById('auditOutput').innerHTML = "";
        let computedTimeline = {};
        
        baseVaccineSchema.forEach(v => {
            if(v.condition === "je" && !patient.je) return;
            if(v.condition === "female" && patient.gender !== "female") return;
            let targetDate = new Date(baseDate); targetDate.setDate(targetDate.getDate() + (v.baseOffsetWeeks * 7));
            let finalDue = new Date(targetDate); let altered = false;
            if(v.dependsOn && computedTimeline[v.dependsOn]) {
                const parentDate = new Date(patient.givenDates[v.dependsOn] || computedTimeline[v.dependsOn].projected);
                const minInterval = new Date(parentDate); minInterval.setDate(minInterval.getDate() + (v.minIntervalWeeks * 7));
                if(finalDue < minInterval) { finalDue = minInterval; altered = true; }
            }
            let status = patient.givenDates[v.id] ? "done" : (finalDue < today ? "overdue" : "upcoming");
            computedTimeline[v.id] = { ...v, projected: finalDue.toISOString().split('T')[0], actual: patient.givenDates[v.id] || "", isDelayed: altered, status: status };
        });

        let groups = {}; Object.values(computedTimeline).forEach(item => { if(!groups[item.group]) groups[item.group] = []; groups[item.group].push(item); });
        for (const [gName, vaxList] of Object.entries(groups)) {
            const card = document.createElement('div'); card.className = "timeline-section"; card.innerHTML = `<h3 class="section-title">${gName}</h3>`;
            vaxList.forEach(v => {
                const prettyDue = new Date(v.projected).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
                const isDone = v.actual !== "";
                card.innerHTML += `<div style="border-bottom: 1px solid var(--border-soft); padding: 10px 0; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong style="color:var(--text-main); font-size:1.05rem;">${v.name}</strong><div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">Window: ${v.window}</div></div>
                    <div style="text-align:right;">
                        <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleVaccineAdministered('${pId}', '${v.id}', this.checked)" style="width:20px; height:20px; cursor:pointer;">
                        <div style="font-size:0.8rem; margin-top:5px; color:${isDone ? 'var(--success)' : 'var(--danger)'}">${isDone ? 'Given: ' + new Date(v.actual).toLocaleDateString('en-IN') : 'Due: ' + prettyDue}</div>
                    </div>
                </div>`;
            });
            document.getElementById('timelineOutput').appendChild(card);
        }

        const odBox = document.createElement('div'); odBox.innerHTML = "<h4 style='color:var(--danger); margin-bottom:1rem;'>⚠️ Overdue</h4>";
        const dnBox = document.createElement('div'); dnBox.innerHTML = "<h4 style='color:var(--success); margin-bottom:1rem;'>✅ Completed</h4>";
        const upBox = document.createElement('div'); upBox.innerHTML = "<h4 style='color:var(--primary); margin-bottom:1rem;'>📅 Future</h4>";
        patient.upcomingVaccinesForWhatsapp = [];
        
        Object.values(computedTimeline).forEach(v => {
            const prettyProj = new Date(v.projected).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
            const card = document.createElement('div'); card.style.cssText = "padding:10px; border:1px solid var(--border-soft); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;";
            if(v.status === 'overdue') { card.innerHTML = `<div><b>${v.name}</b><br><small style="color:var(--text-muted);">Target was: ${prettyProj}</small></div> <span style="background:var(--danger); color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">Missed</span>`; odBox.appendChild(card); patient.upcomingVaccinesForWhatsapp.push(v.name); }
            else if(v.status === 'done') { card.innerHTML = `<div><b>${v.name}</b><br><small style="color:var(--text-muted);">Given on: ${new Date(v.actual).toLocaleDateString('en-IN')}</small></div> <span style="background:var(--success); color:white; padding:4px 8px; border-radius:12px; font-size:0.75rem;">Given</span>`; dnBox.appendChild(card); }
            else { card.innerHTML = `<div><b>${v.name}</b><br><small style="color:var(--text-muted);">Due: ${prettyProj}</small></div> <span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 8px; border-radius:12px; font-size:0.75rem;">Upcoming</span>`; upBox.appendChild(card); if(patient.upcomingVaccinesForWhatsapp.length < 4) patient.upcomingVaccinesForWhatsapp.push(v.name); }
        });
        document.getElementById('auditOutput').appendChild(odBox); document.getElementById('auditOutput').appendChild(dnBox); document.getElementById('auditOutput').appendChild(upBox);
    }

    function toggleVaccineAdministered(pId, vId, c) { globalPatientsStore[pId].givenDates[vId]=c?new Date().toISOString().split('T')[0]:""; localStorage.setItem('nis_patients',JSON.stringify(globalPatientsStore)); calculateAndRenderTimeline(pId); }

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
        const wt = parseFloat(document.getElementById('pWeight').value || document.getElementById('calcWeight').value || 10);
        let htObj = document.getElementById('htCm'); let htOnTheGoObj = document.getElementById('triageHt');
        const ht = parseFloat( (htObj && htObj.value) ? htObj.value : (htOnTheGoObj ? htOnTheGoObj.value : 0) );
        let totalM = activePatientId ? globalPatientsStore[activePatientId].totalMonths : (parseInt(document.getElementById('calcQuickAge') ? document.getElementById('calcQuickAge').value : 0) || 0);
        let pGender = document.getElementById('gender') ? document.getElementById('gender').value : 'male';
        if(!ht || isNaN(ht)) return; drawGrowthCharts(totalM, wt, ht, pGender);
    }

    function syncGrowthFieldsAndCalc() { let v = document.getElementById('htCmOnTheGo').value; document.getElementById('htCm').value = v; if(activePatientId) saveAndRegisterPatient(true); else calcGrowth(); }
