// js/module-vax.js
/**
 * KidDoq Module: Vaccination Tracker
 * Handles the NIS Schedule, editable timeline, and Catch-Up calculations.
 */

window.updateVaccineDate = function(pId, vaxId, dateVal) {
    let p = AppStore.getPatient(pId);
    if(!p) return;
    if(!p.givenDates) p.givenDates = {};
    
    // If doctor picks a date, save it. If they clear it, delete it.
    if (dateVal) p.givenDates[vaxId] = dateVal;
    else delete p.givenDates[vaxId];
    
    AppStore.savePatient(p);
    calculateAndRenderTimeline(pId); // Recalculate everything
};

window.calculateAndRenderTimeline = function(pId) {
    const patient = AppStore.getPatient(pId);
    if (!patient) return;
    
    const computedTimeline = ClinicalMath.calculateVaccineTimeline(patient, baseVaccineSchema);
    
    const leftCol = document.getElementById('vaxLeftCol');
    const midCol = document.getElementById('vaxMidCol');
    const rightCol = document.getElementById('vaxRightCol');
    if (!leftCol || !midCol || !rightCol) return;

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

    let upcomingWAPush = [];
    let dueNowCount = 0; let futureCount = 0;

    Object.values(computedTimeline).forEach(v => {
        if (v.actual !== "") return; 

        const projDate = new Date(v.projected);
        const prettyProj = projDate.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
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

    patient.upcomingVaccinesForWhatsapp = upcomingWAPush;
    AppStore.savePatient(patient);

    const nisArea = document.getElementById('nisReferenceArea');
    if (nisArea) {
        nisArea.innerHTML = `
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
};