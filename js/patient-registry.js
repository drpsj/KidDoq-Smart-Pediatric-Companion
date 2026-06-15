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
    
    const nameEl = document.getElementById('workspacePName');
    const symbolEl = document.getElementById('workspacePGender');
    const pillEl = document.getElementById('workspacePatientPill');
    
    if (nameEl && symbolEl && pillEl) {
        pillEl.style.display = 'flex';
        
        let firstName = p.name ? p.name.split(' ')[0] : "Unknown";
        nameEl.innerText = firstName;
        
        let genderSym = p.gender === 'male' ? '♂️' : (p.gender === 'female' ? '♀️' : '⚧️');
        let color = p.gender === 'female' ? 'var(--brand-pink)' : 'var(--brand-cyan)';
        
        symbolEl.innerText = genderSym;
        symbolEl.style.color = color;
        pillEl.style.borderLeft = `3px solid ${color}`;
    }
}

function renderFullDatabase() {
    const container = document.getElementById('fullDatabaseList');
    if(!container) return;
    const query = document.getElementById('dbSearchInput').value.toLowerCase();
    const patientKeys = Object.keys(AppStore.getAllPatients()).reverse(); 
    
    // --- 1. SPATIAL EMPTY STATE ---
    if(patientKeys.length === 0) {
        container.innerHTML = `
        <div style="text-align:center; padding: 4rem 2rem; color: var(--brand-cyan); background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: var(--radius-xl); border: 1px dashed rgba(0, 229, 255, 0.3); box-shadow: inset 0 0 20px rgba(0,229,255,0.05);">
            <div style="font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 15px rgba(0,229,255,0.3));">📂</div>
            <h3 style="color: var(--brand-cyan); margin: 0 0 1rem 0; font-size: 1.5rem; text-shadow: 0 0 10px rgba(0,229,255,0.3);">No Patients Yet</h3>
            <p style="font-size: 1rem; margin-bottom: 2rem; line-height: 1.6; color: var(--text-main); opacity: 0.8;">Your patient database is empty. Add your first patient to start generating prescriptions and tracking clinical data.</p>
            <button onclick="document.getElementById('registryModal').classList.add('active');" style="background: rgba(0, 229, 255, 0.1); color: var(--brand-cyan); border: 1px solid rgba(0, 229, 255, 0.4); padding: 14px 28px; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: inset 0 0 15px rgba(0,229,255,0.2), 0 0 20px rgba(0, 229, 255, 0.2); transition: all 0.3s ease; letter-spacing: 1px; text-transform: uppercase;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='inset 0 0 20px rgba(0,229,255,0.4), 0 0 30px rgba(0,229,255,0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='inset 0 0 15px rgba(0,229,255,0.2), 0 0 20px rgba(0, 229, 255, 0.2)';">+ Add First Patient</button>
        </div>`;
        return;
    }
    
    // --- 2. SPATIAL PATIENT CARDS ---
    let html = "";
    patientKeys.forEach(id => {
        let p = AppStore.getPatient(id);
        
        // SAFE FALLBACKS
        let safeName = p.name ? p.name : "Unknown Patient";
        let safeGender = p.gender ? p.gender.toUpperCase() : "N/A";
        
        if (safeName.toLowerCase().includes(query) || (p.phone && p.phone.includes(query))) {
            html += `
            <div style="background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.08); border-top: 1px solid rgba(255, 255, 255, 0.2); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: inset 0 4px 15px rgba(0,0,0,0.2), 0 8px 25px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); margin-bottom: 20px;" onmouseover="this.style.transform='scale(1.02) translateY(-3px)'; this.style.borderColor='rgba(0, 229, 255, 0.3)';" onmouseout="this.style.transform='none'; this.style.borderColor='rgba(255, 255, 255, 0.08)';">
                
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                    <div>
                        <h3 style="margin:0; color:var(--brand-cyan); font-size:1.3rem; text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);">${safeName}</h3>
                        <div style="font-size:0.9rem; color:var(--text-main); margin-top:8px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;">
                            ${p.ageYrs || 0}Y ${p.ageMos || 0}M <span style="color:var(--brand-pink); margin: 0 4px;">|</span> ${safeGender}
                        </div>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--brand-cyan); background: rgba(0, 229, 255, 0.1); padding:8px 14px; border-radius:12px; border: 1px solid rgba(0, 229, 255, 0.3); box-shadow: inset 0 0 10px rgba(0,229,255,0.1);">${p.weight} kg</div>
                </div>
                
                ${p.phone ? `<div style="font-size:0.95rem; margin-bottom:15px; color: var(--text-main);">📞 <span style="opacity: 0.9;">${p.phone}</span></div>` : '<div style="margin-bottom:15px;"></div>'}
                
                <button onclick="loadPatientFromDB('${id}')" style="width: 100%; margin:0; background: rgba(255, 51, 102, 0.1); color: var(--brand-pink); border: 1px solid rgba(255, 51, 102, 0.3); box-shadow: inset 0 0 10px rgba(255, 51, 102, 0.1); padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(255, 51, 102, 0.2)'; this.style.boxShadow='inset 0 0 15px rgba(255, 51, 102, 0.3), 0 0 20px rgba(255, 51, 102, 0.3)';" onmouseout="this.style.background='rgba(255, 51, 102, 0.1)'; this.style.boxShadow='inset 0 0 10px rgba(255, 51, 102, 0.1)';">
                    📂 Open Patient Profile
                </button>
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
}

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
                            <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--brand-pink); background:rgba(255, 51, 102, 0.1); padding:3px 8px; border-radius:6px; margin-left:6px; border:1px solid rgba(255, 51, 102, 0.3); box-shadow: inset 0 0 8px rgba(255, 51, 102, 0.1);">${ms.domain}</span>
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