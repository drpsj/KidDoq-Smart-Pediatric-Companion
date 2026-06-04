// js/module-vax.js
/**
 * KidDoq Module: Vaccination Tracker
 * Handles the NIS Schedule, editable timeline, and Catch-Up calculations.
 */

// --- DYNAMIC VACCINATION TRACKER ---
window.updateVaccineDate = function(pId, vaxId, isChecked, dateVal) {
    let p = AppStore.getPatient(pId);
    if(!p) return;
    if(!p.givenDates) p.givenDates = {};

    // If checked, save the chosen date. If unchecked, remove it.
    if (isChecked) {
        p.givenDates[vaxId] = dateVal || new Date().toISOString().split('T')[0];
    } else {
        delete p.givenDates[vaxId];
    }

    AppStore.savePatient(p);
    calculateAndRenderTimeline(pId); // Re-render to hide completed items
};

window.calculateAndRenderTimeline = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) return;

    const leftCol = document.getElementById('vaxLeftCol');
    if (!leftCol) return;

    let dob = p.dob ? new Date(p.dob) : null;
    let given = p.givenDates || {};

    // Standardized NIS Schema with Age in Days
    const schema = [
        { id: 'v_bcg', name: 'BCG', ageDays: 0, group: 'Birth' },
        { id: 'v_opv0', name: 'OPV-0', ageDays: 0, group: 'Birth' },
        { id: 'v_hepb0', name: 'Hep B-0', ageDays: 0, group: 'Birth' },
        { id: 'v_penta1', name: 'Pentavalent-1', ageDays: 42, group: '6 Weeks' },
        { id: 'v_opv1', name: 'OPV-1', ageDays: 42, group: '6 Weeks' },
        { id: 'v_rvv1', name: 'RVV-1', ageDays: 42, group: '6 Weeks' },
        { id: 'v_fipv1', name: 'fIPV-1', ageDays: 42, group: '6 Weeks' },
        { id: 'v_penta2', name: 'Pentavalent-2', ageDays: 70, group: '10 Weeks' },
        { id: 'v_opv2', name: 'OPV-2', ageDays: 70, group: '10 Weeks' },
        { id: 'v_rvv2', name: 'RVV-2', ageDays: 70, group: '10 Weeks' },
        { id: 'v_penta3', name: 'Pentavalent-3', ageDays: 98, group: '14 Weeks' },
        { id: 'v_opv3', name: 'OPV-3', ageDays: 98, group: '14 Weeks' },
        { id: 'v_rvv3', name: 'RVV-3', ageDays: 98, group: '14 Weeks' },
        { id: 'v_fipv2', name: 'fIPV-2', ageDays: 98, group: '14 Weeks' },
        { id: 'v_mr1', name: 'MR-1', ageDays: 270, group: '9 Months' },
        { id: 'v_pcvb', name: 'PCV Booster', ageDays: 270, group: '9 Months' },
        { id: 'v_je1', name: 'JE-1 (If Endemic)', ageDays: 270, group: '9 Months' },
        { id: 'v_mr2', name: 'MR-2', ageDays: 480, group: '16-24 Months' },
        { id: 'v_dptb1', name: 'DPT Booster-1', ageDays: 480, group: '16-24 Months' },
        { id: 'v_opvb', name: 'OPV Booster', ageDays: 480, group: '16-24 Months' },
        { id: 'v_je2', name: 'JE-2 (If Endemic)', ageDays: 480, group: '16-24 Months' },
        { id: 'v_dptb2', name: 'DPT Booster-2', ageDays: 1825, group: '5 Years' },
        { id: 'v_td', name: 'Td', ageDays: 3650, group: '10 Years' }
    ];

    let pendingHTML = "<h3 style='margin-top:0; color:var(--primary); font-size:1.1rem; border-bottom:2px solid var(--border-soft); padding-bottom:8px;'>📅 Pending / Due Vaccines</h3><div style='display:flex; flex-direction:column; gap:12px;'>";
    let pendingCount = 0;
    let todayStr = new Date().toISOString().split('T')[0];

    schema.forEach(vax => {
        // ONLY render if the vaccine has NOT been given
        if (!given[vax.id]) {
            pendingCount++;
            
            // Calculate Exact Calendar Due Date
            let dueDateStr = "Set DOB in Registry";
            let isOverdue = false;
            if (dob) {
                let targetDate = new Date(dob);
                targetDate.setDate(targetDate.getDate() + vax.ageDays);
                dueDateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                // If today is past the target date, flag as overdue
                if (new Date() > targetDate) isOverdue = true;
            }

            pendingHTML += `
            <div style="background:var(--bg-surface); border:1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-soft)'}; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
                <div>
                    <div style="font-weight:800; color:var(--text-main); font-size:1.05rem;">${vax.name}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">Window: ${vax.group}</div>
                    <div style="font-size:0.85rem; padding:4px 8px; border-radius:4px; display:inline-block; background:${isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(91, 97, 246, 0.1)'}; color:${isOverdue ? 'var(--danger)' : 'var(--primary)'}; font-weight:700;">
                        Target: ${dueDateStr} ${isOverdue ? '⚠️ OVERDUE' : ''}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    <label style="font-size:0.75rem; color:var(--text-muted); font-weight:bold; text-transform:uppercase;">Date Administered</label>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="date" id="date_${vax.id}" style="padding:8px; border-radius:6px; border:1px solid var(--border-soft); font-size:0.9rem;" value="${todayStr}">
                        <button onclick="updateVaccineDate('${pId}', '${vax.id}', true, document.getElementById('date_${vax.id}').value)" style="background:var(--success); color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; box-shadow:var(--shadow-sm); transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">✅ Mark Given</button>
                    </div>
                </div>
            </div>`;
        }
    });

    pendingHTML += "</div>";

    if (pendingCount === 0) {
        pendingHTML += `
        <div style="padding:40px; text-align:center; background:rgba(16, 185, 129, 0.05); border:2px dashed var(--success); border-radius:12px;">
            <span style="font-size:3rem;">🎉</span>
            <h3 style="color:var(--success); margin:10px 0 0 0;">All Caught Up!</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin:5px 0 0 0;">There are no pending vaccines for this patient.</p>
        </div>`;
    }

    leftCol.innerHTML = pendingHTML;
    
    // Hide the secondary columns to give the main tracker full screen width
    const midCol = document.getElementById('vaxMidCol');
    if (midCol) midCol.style.display = 'none';
    const rightCol = document.getElementById('vaxRightCol');
    if (rightCol) rightCol.style.display = 'none';
    
    const grid = leftCol.parentElement;
    if(grid) grid.style.gridTemplateColumns = "1fr";

    // Rebuild the NIS reference table
    const nisArea = document.getElementById('nisReferenceArea');
    if (nisArea) {
        nisArea.innerHTML = `
            <table class="theory-table" style="font-size:0.85rem; width:100%; text-align:left;">
                <thead><tr style="background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px); color: var(--brand-pink); border-bottom: 2px solid rgba(255, 51, 102, 0.3);"><th style="padding:12px;">Age Group</th><th style="padding:12px;">NIS India Guidelines</th></tr></thead>
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