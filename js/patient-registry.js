// js/patient-registry.js
/**
 * KidDoq Module: Patient Registry & Database
 * Handles adding patients, calculating age/weight, and managing the master database.
 */

function getExpectedWeight(totalM) {
    if (!totalM) return 0;
    let y = Math.floor(totalM / 12);
    if (totalM < 12) return (totalM + 9) / 2;
    if (y >= 1 && y <= 6) return (y * 2) + 8;
    if (y >= 7 && y <= 12) return ((y * 7) - 5) / 2;
    return (y * 2) + 8; 
}

function prepNewPatient() {
    AppStore.clearActivePatient();
    activePatientId = null;
    document.getElementById('pName').value = ""; document.getElementById('pPhone').value = "";
    document.getElementById('dob').value = ""; document.getElementById('ageYrs').value = ""; document.getElementById('ageMos').value = "";
    document.getElementById('pWeight').value = ""; document.getElementById('htCm').value = ""; document.getElementById('hcCm').value = "";
    if(document.getElementById('jeEndemic')) document.getElementById('jeEndemic').checked = false; 
    if(document.getElementById('calcWeight')) document.getElementById('calcWeight').value = ""; 
    if(document.getElementById('fluidWeight')) document.getElementById('fluidWeight').value = ""; 
    if(document.getElementById('crashWeight')) document.getElementById('crashWeight').value = "";
    
    if(typeof ViewController !== 'undefined') ViewController.switchNavTab('homeDashboardView');
    
    if(document.getElementById('activeWorkspace')) document.getElementById('activeWorkspace').style.display = "none";
    if(document.getElementById('headerPatientText')) document.getElementById('headerPatientText').innerText = "👤 Patient";
}

function calculateAgeFromDob() {
    const dobVal = document.getElementById('dob').value; if(!dobVal) return;
    const dob = new Date(dobVal); const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12; months -= dob.getMonth(); months += today.getMonth();
    let years = Math.floor(months / 12); let remMonths = months % 12;
    document.getElementById('ageYrs').value = years < 0 ? 0 : years;
    document.getElementById('ageMos').value = remMonths < 0 ? 0 : remMonths;
    estimateWeightFromAge();
}

function estimateWeightFromAge() {
    let y = parseInt(document.getElementById('ageYrs').value) || 0;
    let m = parseInt(document.getElementById('ageMos').value) || 0;
    currentPatientAgeInMonths = (y * 12) + m; if(currentPatientAgeInMonths === 0) return;
    let estKg = getExpectedWeight(currentPatientAgeInMonths);
    document.getElementById('pWeight').value = estKg.toFixed(1);
    document.getElementById('calcWeight').value = estKg.toFixed(1);
    if(document.getElementById('fluidWeight')) document.getElementById('fluidWeight').value = estKg.toFixed(1);
    if(document.getElementById('crashWeight')) document.getElementById('crashWeight').value = estKg.toFixed(1);
    if(document.getElementById('calcQuickAge')) document.getElementById('calcQuickAge').value = currentPatientAgeInMonths;
    if(document.getElementById('crashAge')) document.getElementById('crashAge').value = y;
    saveAndRegisterPatient(true);
}

window.saveAndRegisterPatient = async function(isBackgroundUpdate = false) {
    const activeId = AppStore.getActivePatientId();
    let nameStr = document.getElementById('pName').value.trim() || "Anonymous";
    const id = activeId || 'p_' + nameStr.replace(/\s+/g, '').toLowerCase() + '_' + Date.now();
    
    let y = parseInt(document.getElementById('ageYrs').value) || 0;
    let m = parseInt(document.getElementById('ageMos').value) || 0;
    let currentPatientAgeInMonths = (y * 12) + m;
    
    let existingData = AppStore.getPatient(id) || { givenDates: {}, achievedMilestones: {}, rxList: [], dietLogs: [], visits: [] };
    
    const patientObj = {
        ...existingData, id: id, name: nameStr, dob: document.getElementById('dob').value,
        phone: document.getElementById('pPhone').value.trim(), gender: document.getElementById('gender').value,
        weight: document.getElementById('pWeight').value, htCm: document.getElementById('htCm').value,
        hcCm: document.getElementById('hcCm') ? document.getElementById('hcCm').value : "",
        je: document.getElementById('jeEndemic') ? document.getElementById('jeEndemic').checked : false,
        ageYrs: y, ageMos: m, totalMonths: currentPatientAgeInMonths
    };
    
    AppStore.savePatient(patientObj);
    AppStore.setActivePatient(id);
    
    if(document.getElementById('headerPatientText')) document.getElementById('headerPatientText').innerText = `👤 ${nameStr}`;
    
    if (typeof DB !== 'undefined') {
        if(!isBackgroundUpdate && typeof showSystemToast === 'function') showSystemToast("☁️ Syncing to Cloud...");
        await DB.savePatient(patientObj); 
    }
    
    if(!isBackgroundUpdate) {
        if (typeof ViewController !== 'undefined') { ViewController.hideModal('registryModal'); } 
        else { let modal = document.getElementById('registryModal'); if(modal) modal.classList.remove('active'); }
        if (typeof loadPatientFromDB === 'function') loadPatientFromDB(id);
        if (typeof renderFullDatabase === 'function') renderFullDatabase();
        if (typeof populatePatientProfile === 'function') populatePatientProfile(id); // Refresh profile if open
    } else {
        if(document.getElementById('activeWorkspace') && document.getElementById('activeWorkspace').style.display === 'block') {
            if(typeof calcInlineDose === 'function') calcInlineDose(); 
            if(typeof calcGrowth === 'function') calcGrowth(); 
            if(typeof calcMalnutrition === 'function') calcMalnutrition(); 
            if(typeof calcNutrition === 'function') calcNutrition();
        }
    }
};

function updateStickyBanner(pId) {
    const p = AppStore.getPatient(pId) || AppStore.getAllPatients()[pId];
    if(!p) return;
    document.getElementById('bannerPName').innerText = p.name;
    document.getElementById('bannerPAge').innerText = `${p.ageYrs}Y ${p.ageMos}M`;
    document.getElementById('bannerPWeight').innerText = `${p.weight} kg`;
    let genderStr = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "--";
    document.getElementById('bannerPGender').innerText = genderStr;
}

function renderFullDatabase() {
    const container = document.getElementById('fullDatabaseList');
    if(!container) return;
    const query = document.getElementById('dbSearchInput').value.toLowerCase();
    const patientKeys = Object.keys(AppStore.getAllPatients()).reverse(); 
    
    if(patientKeys.length === 0) {
        container.innerHTML = `
        <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-soft);">
            <div style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7;">📂</div>
            <h3 style="color: var(--primary-dark); margin: 0 0 0.5rem 0; font-size: 1.3rem;">No Patients Yet</h3>
            <p style="font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">Your patient database is empty. Add your first patient to start generating prescriptions and tracking clinical data.</p>
            <button onclick="document.getElementById('registryModal').classList.add('active');" style="background: linear-gradient(135deg, var(--brand-blue), var(--brand-cyan)); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);">+ Add First Patient</button>
        </div>`;
        return;
    }
    
    let html = "";
    patientKeys.forEach(id => {
        let p = AppStore.getPatient(id);
        if (p.name.toLowerCase().includes(query) || (p.phone && p.phone.includes(query))) {
            html += `
            <div style="background:var(--bg-surface); border:1px solid var(--border-soft); border-radius:var(--radius-lg); padding:1.5rem; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <div>
                        <h3 style="margin:0; color:var(--primary-dark); font-size:1.2rem;">${p.name}</h3>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${p.ageYrs}Y ${p.ageMos}M | ${p.gender.toUpperCase()}</div>
                    </div>
                    <div style="font-size:1.1rem; font-weight:bold; color:var(--primary); background:var(--primary-light); padding:4px 10px; border-radius:12px;">${p.weight} kg</div>
                </div>
                ${p.phone ? `<div style="font-size:0.85rem; margin-bottom:15px;">📞 ${p.phone}</div>` : '<div style="margin-bottom:15px;"></div>'}
                <button onclick="loadPatientFromDB('${id}')" class="action" style="margin:0; background:var(--primary-light); color:var(--primary-dark); box-shadow:none; border:1px solid var(--primary);">📂 Open Patient Profile</button>
            </div>`;
        }
    });
    container.innerHTML = html;
}

function closePatientFile() {
    AppStore.clearActivePatient(); 
    activePatientId = null; 
    document.getElementById('activeWorkspace').style.display = 'none';
    const headerText = document.getElementById('headerPatientText');
    if(headerText) headerText.innerText = '';
    if (typeof ViewController !== 'undefined') ViewController.switchNavTab('homeDashboardView');
    if (typeof showSystemToast === 'function') showSystemToast("Patient file closed.");
}

function exportDatabase() {
    if(Object.keys(AppStore.getAllPatients()).length === 0) {
        if(typeof showSystemToast === "function") showSystemToast("⚠️ Database is empty!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppStore.getAllPatients()));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Pediatric_Hub_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    if(typeof showSystemToast === "function") showSystemToast("📥 Database backup downloaded successfully!");
}

window.restoreDatabase = function(input) {
    if (!input.files || !input.files[0]) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            localStorage.setItem('nis_patients', JSON.stringify(imported));
            
            for (let id in imported) {
                AppStore.savePatient(imported[id]);
            }
            if (typeof renderFullDatabase === 'function') renderFullDatabase();
            if (typeof showSystemToast === 'function') showSystemToast("✅ Database Restored Successfully!");
        } catch(err) { 
            if (typeof showSystemToast === 'function') showSystemToast("⚠️ Invalid backup file."); 
        }
    };
    reader.readAsText(input.files[0]);
    input.value = ""; 
};

// --- PATIENT PROFILE & MANAGEMENT ---
window.populatePatientProfile = function(pId) {
    const p = AppStore.getPatient(pId);
    if(!p) return;
    
    document.getElementById('profileName').innerText = p.name;
    document.getElementById('profileAge').innerText = `${p.ageYrs || 0}Y ${p.ageMos || 0}M`;
    document.getElementById('profileWeight').innerText = `${p.weight || '--'} kg`;
    document.getElementById('profileGender').innerText = p.gender ? p.gender.toUpperCase() : '--';
    document.getElementById('profilePhone').innerText = p.phone || '--';
    document.getElementById('profileHt').innerText = p.htCm ? `${p.htCm} cm` : '--';
    
    // Vax Summary
    const vaxOut = document.getElementById('profileVaxSummary');
    let vaxHtml = "";
    if(p.vaccineHistory && Object.keys(p.vaccineHistory).length > 0) {
        Object.keys(p.vaccineHistory).forEach(v => {
            vaxHtml += `<div style="padding:6px 0; border-bottom:1px dashed var(--border-soft);">✔️ <b>${v}</b>: ${new Date(p.vaccineHistory[v]).toLocaleDateString('en-IN')}</div>`;
        });
    } else { vaxHtml = "No vaccines logged yet."; }
    if(vaxOut) vaxOut.innerHTML = vaxHtml;
    
    // Milestones Summary (Fixed text resolver)
    const mileOut = document.getElementById('profileMilesSummary');
    let mileHtml = "";
    if(p.achievedMilestones && Object.keys(p.achievedMilestones).length > 0) {
        Object.keys(p.achievedMilestones).forEach(mId => {
            if(p.achievedMilestones[mId]) {
                // Find the actual text from the database instead of ID
                let month = mId.split('_')[0].replace('m', '');
                let text = "Milestone achieved";
                if(typeof window.milestonesDb !== 'undefined' && window.milestonesDb[month]) {
                    let ms = window.milestonesDb[month].find(x => x.id === mId);
                    if(ms) text = ms.text;
                }
                mileHtml += `<div style="padding:6px 0; border-bottom:1px dashed var(--border-soft);">⭐ <b>${month} Months:</b> ${text}</div>`;
            }
        });
    } else { 
        mileHtml = "No milestones logged yet."; 
    }
    if(mileOut) mileOut.innerHTML = mileHtml;
}; // <--- THIS WAS THE FATAL MISSING BRACKET

window.editActivePatient = function() {
    const p = AppStore.getPatient(activePatientId);
    if(!p) return;
    document.getElementById('pName').value = p.name || "";
    document.getElementById('pPhone').value = p.phone || "";
    document.getElementById('dob').value = p.dob || "";
    document.getElementById('ageYrs').value = p.ageYrs || 0;
    document.getElementById('ageMos').value = p.ageMos || 0;
    document.getElementById('pWeight').value = p.weight || "";
    document.getElementById('htCm').value = p.htCm || "";
    if(document.getElementById('gender')) document.getElementById('gender').value = p.gender || "male";
    document.getElementById('registryModal').classList.add('active');
};

window.deleteActivePatient = function() {
    if(!activePatientId) return;
    if(confirm("🚨 Are you sure you want to PERMANENTLY delete this patient? This cannot be undone.")) {
        AppStore.deletePatient(activePatientId);
        closePatientFile();
        if(typeof renderFullDatabase === 'function') renderFullDatabase();
        if(typeof showSystemToast === 'function') showSystemToast("🗑️ Patient deleted successfully.");
    }
};

// --- MILESTONE TIMELINE ENGINE ---
window.renderMilestoneTimeline = function() {
    const container = document.getElementById('milestoneTimelineContainer');
    if (!container) return;
    
    if (!activePatientId) {
        container.innerHTML = '<div style="color:var(--danger);">⚠️ Please open a patient file first.</div>';
        return;
    }
    
    const p = AppStore.getPatient(activePatientId);
    const msDb = typeof window.milestonesDb !== 'undefined' ? window.milestonesDb : null;
    if(!msDb) {
        container.innerHTML = 'Milestone database not found.';
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:15px;">';
    
    // Sort months numerically and loop through them
    Object.keys(msDb).sort((a,b) => parseInt(a) - parseInt(b)).forEach(month => {
        html += `
        <div style="border:1px solid var(--border-soft); border-radius:8px; overflow:hidden;">
            <div style="background:var(--primary-light); padding:10px 15px; font-weight:bold; color:var(--primary-dark); font-size:1.1rem; border-bottom:1px solid var(--border-soft);">
                ${month} Months
            </div>
            <div style="padding:15px; background:var(--bg-body); display:flex; flex-direction:column; gap:12px;">
        `;
        
        msDb[month].forEach(ms => {
            let isChecked = (p.achievedMilestones && p.achievedMilestones[ms.id]) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer;">
                    <input type="checkbox" value="${ms.id}" ${isChecked} onchange="toggleMilestone('${ms.id}', this.checked)" style="margin-top:4px; width:20px; height:20px; accent-color:var(--brand-pink);">
                    <div>
                        <div style="font-weight:600; color:var(--text-main); font-size:0.95rem;">
                            ${ms.text} 
                            <span style="font-size:0.7rem; color:var(--text-muted); background:var(--bg-surface); padding:2px 6px; border-radius:4px; margin-left:5px; border:1px solid var(--border-soft);">${ms.domain}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--danger); margin-top:2px;">🚨 Red Flag if missed: ${ms.sig}</div>
                    </div>
                </label>
            `;
        });
        
        html += `</div></div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

window.toggleMilestone = function(msId, isAchieved) {
    if (!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    
    if (!p.achievedMilestones) p.achievedMilestones = {};
    p.achievedMilestones[msId] = isAchieved;
    
    AppStore.savePatient(p);
    if(typeof saveAndRegisterPatient === 'function') saveAndRegisterPatient(true);
};