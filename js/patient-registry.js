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
                ${p.phone ? `<div style="font-size:0.85rem; margin-bottom:5px;">📞 ${p.phone}</div>` : ''}
                ${p.diagnosis ? `<div style="font-size:0.85rem; margin-bottom:15px; color:var(--warning);"><b>Dx:</b> ${p.diagnosis}</div>` : '<div style="margin-bottom:15px;"></div>'}
                <button onclick="loadPatientFromDB('${id}')" class="action" style="margin:0; background:var(--primary-light); color:var(--primary-dark); box-shadow:none; border:1px solid var(--primary);">📂 Open Patient File</button>
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