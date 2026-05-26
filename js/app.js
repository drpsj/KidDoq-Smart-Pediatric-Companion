// --- 2. GLOBAL STATE (Secured via AppStore) ---
    // LEGACY BRIDGE: We keep these variable names so older files don't crash,
    // but they now pull their initial state directly from the secure Vault.
    let appSettings = AppStore.getSettings();
    let globalPatientsStore = AppStore.getAllPatients(); 
    let activePatientId = AppStore.getActivePatientId(); 

    let customDrugsStore;
    try { customDrugsStore = JSON.parse(localStorage.getItem('custom_drugs')) || { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; } catch(e) { customDrugsStore = { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; }

    let currentPatientAgeInMonths = 0; 
    let wtChartInstance = null; 
    let htChartInstance = null;

    // --- 2.5 QUICK ACCESS ENGINE ---
    const masterToolRegistry = [
        { id: 'prescriptionFeatureView', name: 'Rx & Dosing', icon: 'icon-rx.png' },
        { id: 'certificateFeatureView', name: 'Certificates', icon: 'icon-cert.png' },
        { id: 'growthFeatureView', name: 'Growth Curves', icon: 'icon-growth.png' },
        { id: 'trackerFeatureView', name: 'Vaccination', icon: 'icon-vax.png' },
        { id: 'erFeatureView', name: 'ER & Resus', icon: 'icon-er.png' },
        { id: 'milestoneFeatureView', name: 'Milestones', icon: 'icon-miles.jpg' },
        { id: 'malnutritionFeatureView', name: 'Triage & MAC', icon: 'icon-triage.png' },
        { id: 'nutritionFeatureView', name: 'Diet Recall', icon: 'icon-diet.png' },
        { id: 'jaundiceFeatureView', name: 'Jaundice', icon: 'icon-jaundice.png' },
        { id: 'asthmaFeatureView', name: 'PRAM Score', icon: 'icon-asthma.png' }
    ];

    function renderHomeQuickTools() {
        const grid = document.getElementById('homeQuickToolsGrid');
        if(!grid) return;
        // FAILSFE: If the saved list is empty, default to these 4 tools
        let toolsToRender = (appSettings.quickTools && appSettings.quickTools.length > 0) ? appSettings.quickTools : ['erFeatureView', 'prescriptionFeatureView', 'growthFeatureView', 'trackerFeatureView'];
        
        let html = '';
        toolsToRender.forEach(toolId => {
            let tool = masterToolRegistry.find(t => t.id === toolId);
            if(tool) {
                html += `
                <div class="tool-btn" onclick="openClinicalTool('${tool.id}')">
                    <div class="tool-icon-wrapper"><img src="${tool.icon}" alt="${tool.name}"></div>
                    <span>${tool.name}</span>
                </div>`;
            }
        });
        grid.innerHTML = html;
    }

    function renderSettingsChecklist() {
        const container = document.getElementById('settingsQuickToolsList');
        if(!container) return;
        let selectedTools = (appSettings.quickTools && appSettings.quickTools.length > 0) ? appSettings.quickTools : ['erFeatureView', 'prescriptionFeatureView', 'growthFeatureView', 'trackerFeatureView'];
        
        let html = '';
        masterToolRegistry.forEach(tool => {
            let isChecked = selectedTools.includes(tool.id) ? 'checked' : '';
            html += `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; color:var(--text-main); font-weight:500; text-transform:none;">
                <input type="checkbox" class="quick-tool-checkbox" value="${tool.id}" ${isChecked} style="width:16px; height:16px; margin:0;">
                ${tool.name}
            </label>`;
        });
        container.innerHTML = html;
    }

    function showSystemToast(msg) {
        const container = document.getElementById('systemToastContainer');
        const toast = document.createElement('div');
        toast.style.cssText = 'background:var(--success); color:white; padding:12px 24px; border-radius:var(--radius-pill); box-shadow:var(--shadow-float); font-weight:bold; font-size:0.9rem; animation: springSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); pointer-events:auto; display:flex; align-items:center; gap:8px;';
        toast.innerHTML = `<span>✅</span> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            toast.style.transform = 'translateY(20px)'; 
            toast.style.transition = 'all 0.3s ease'; 
            setTimeout(()=>toast.remove(), 300); 
        }, 3000);
    }

    // --- 5. PATIENT REGISTRY ---
    function getExpectedWeight(totalM) {
        if (!totalM) return 0;
        let y = Math.floor(totalM / 12);
        if (totalM < 12) return (totalM + 9) / 2;
        if (y >= 1 && y <= 6) return (y * 2) + 8;
        if (y >= 7 && y <= 12) return ((y * 7) - 5) / 2;
        return (y * 2) + 8; 
    }

    function prepNewPatient() {
        activePatientId = null;
        document.getElementById('pName').value = ""; document.getElementById('pPhone').value = "";
        document.getElementById('dob').value = ""; document.getElementById('ageYrs').value = ""; document.getElementById('ageMos').value = "";
        document.getElementById('pWeight').value = ""; document.getElementById('htCm').value = ""; document.getElementById('hcCm').value = "";
        if(document.getElementById('jeEndemic')) document.getElementById('jeEndemic').checked = false; 
        if(document.getElementById('calcWeight')) document.getElementById('calcWeight').value = ""; document.getElementById('fluidWeight').value = ""; document.getElementById('crashWeight').value = "";
        
        switchMainFeature('homeDashboardView'); 
        
        if(document.getElementById('masterActionsBar')) document.getElementById('masterActionsBar').style.display = "none";
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

    // --- PATIENT REGISTRY CONTROLLER ---
    window.saveAndRegisterPatient = async function(isBackgroundUpdate = false) {
        // 1. Secure Read: Use AppStore for IDs
        const activeId = AppStore.getActivePatientId();
        let nameStr = document.getElementById('pName').value.trim() || "Anonymous";
        const id = activeId || 'p_' + nameStr.replace(/\s+/g, '').toLowerCase() + '_' + Date.now();
        
        let y = parseInt(document.getElementById('ageYrs').value) || 0;
        let m = parseInt(document.getElementById('ageMos').value) || 0;
        let currentPatientAgeInMonths = (y * 12) + m;
        
        // 2. Fetch safely from LOCAL Vault (Instant, no network lag)
        let existingData = AppStore.getPatient(id) || {
            givenDates: {}, achievedMilestones: {}, rxList: [], dietLogs: [], visits: []
        };
        
        // 3. Build the updated object
        const patientObj = {
            ...existingData,
            id: id, 
            name: nameStr, 
            dob: document.getElementById('dob').value,
            phone: document.getElementById('pPhone').value.trim(),
            gender: document.getElementById('gender').value,
            weight: document.getElementById('pWeight').value,
            htCm: document.getElementById('htCm').value,
            hcCm: document.getElementById('hcCm') ? document.getElementById('hcCm').value : "",
            je: document.getElementById('jeEndemic') ? document.getElementById('jeEndemic').checked : false,
            ageYrs: y, 
            ageMos: m, 
            totalMonths: currentPatientAgeInMonths
        };
        
        // 4. INSTANT LOCAL SAVE: Tell the Vault to lock it in and set as active
        AppStore.savePatient(patientObj);
        AppStore.setActivePatient(id);
        
        if(document.getElementById('headerPatientText')) {
            document.getElementById('headerPatientText').innerText = `👤 ${nameStr}`;
        }
        
        // 5. ASYNC CLOUD SYNC: Fire this off to Firebase in the background
        if (typeof DB !== 'undefined') {
            if(!isBackgroundUpdate && typeof showSystemToast === 'function') {
                showSystemToast("☁️ Syncing to Cloud...");
            }
            // We await here to ensure cloud persistence, but local UI can proceed
            await DB.savePatient(patientObj); 
        }
        
        // 6. UI Updates (Delegated safely)
        if(!isBackgroundUpdate) {
            // Use our ViewController Traffic Cop if it exists
            if (typeof ViewController !== 'undefined') {
                ViewController.hideModal('registryModal');
            } else {
                let modal = document.getElementById('registryModal');
                if(modal) modal.classList.remove('active');
            }
            
            // Re-render the database and load the active file
            if (typeof loadPatientFromDB === 'function') loadPatientFromDB(id);
            if (typeof renderFullDatabase === 'function') renderFullDatabase();
            
        } else {
            // Background update triggers for active workspace tools
            if(document.getElementById('activeWorkspace') && document.getElementById('activeWorkspace').style.display === 'block') {
                if(typeof calcInlineDose === 'function') calcInlineDose(); 
                if(typeof calcGrowth === 'function') calcGrowth(); 
                if(typeof calcMalnutrition === 'function') calcMalnutrition(); 
                if(typeof calcNutrition === 'function') calcNutrition();
            }
        }
    };

    function updateStickyBanner(pId) {
        const p = globalPatientsStore[pId];
        if(!p) return;
        
        document.getElementById('bannerPName').innerText = p.name;
        document.getElementById('bannerPAge').innerText = `${p.ageYrs}Y ${p.ageMos}M`;
        document.getElementById('bannerPWeight').innerText = `${p.weight} kg`;
        
        let genderStr = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "--";
        document.getElementById('bannerPGender').innerText = genderStr;
    }

    function triggerActiveWorkspaceBuild(pId) {
        activePatientId = pId;
        
        // 2. Un-hide the clinical workspace
        const workspace = document.getElementById('activeWorkspace');
        if(workspace) workspace.style.display = "block";

        // 3. Update the Phase 2 Sticky Banner
        updateStickyBanner(pId);
        
        // WAKE UP THE COPILOT
        updateCopilot(pId);
        
        // 4. WAKE UP ALL MODULES WITH CORRECT FUNCTION NAMES
        if(typeof calculateAndRenderTimeline === 'function') calculateAndRenderTimeline(pId);
        // ... (rest of the function remains the same)
        if(typeof buildMilestoneReference === 'function') buildMilestoneReference();
        if(typeof renderMilestoneDashboard === 'function') renderMilestoneDashboard();
        if(typeof renderDietRecall === 'function') renderDietRecall();
        if(typeof calculateDose === 'function') calculateDose(); 
        if(typeof calcGrowth === 'function') calcGrowth();
        if(typeof calcMalnutrition === 'function') calcMalnutrition();
        if(typeof renderSensory === 'function') renderSensory();
        if(typeof calcNutrition === 'function') calcNutrition();
        if(typeof renderVisitLedger === 'function') renderVisitLedger();
    }

    

    // --- 14. SYSTEM SETTINGS & DATABASE MANAGER ENGINE ---
    function toggleDarkMode(isDark) {
        if(isDark) { document.body.classList.add('dark-mode'); }
        else { document.body.classList.remove('dark-mode'); }
        appSettings.isDark = isDark;
        localStorage.setItem('clinic_settings', JSON.stringify(appSettings));
    }

    function applySettingsToUI() {
        if(appSettings.isDark) {
            document.body.classList.add('dark-mode');
            const dmToggle = document.getElementById('darkModeToggle');
            if(dmToggle) dmToggle.checked = true;
        }
        if(document.getElementById('setDocName')) document.getElementById('setDocName').value = appSettings.docName || "";
        if(document.getElementById('setQual')) document.getElementById('setQual').value = appSettings.qual || "";
        if(document.getElementById('setRegNo')) document.getElementById('setRegNo').value = appSettings.regNo || "";
        if(document.getElementById('setClinic')) document.getElementById('setClinic').value = appSettings.clinicName || "";
        if(document.getElementById('setTagline')) document.getElementById('setTagline').value = appSettings.tagline || "";
        if(document.getElementById('setPhone')) document.getElementById('setPhone').value = appSettings.phone || "";
        if(document.getElementById('setAddress')) document.getElementById('setAddress').value = appSettings.address || "";
        if(appSettings.signature && document.getElementById('sigPreview')) {
            document.getElementById('sigPreview').innerHTML = `<img src="${appSettings.signature}" style="max-height:60px; border-radius:8px;">`;
        }
        
        if (typeof renderSettingsChecklist === 'function') renderSettingsChecklist();
        if (typeof renderHomeQuickTools === 'function') renderHomeQuickTools();
    }

    function saveSettings() {
        appSettings.docName = document.getElementById('setDocName').value;
        appSettings.qual = document.getElementById('setQual').value;
        appSettings.regNo = document.getElementById('setRegNo').value;
        appSettings.clinicName = document.getElementById('setClinic').value;
        appSettings.tagline = document.getElementById('setTagline').value;
        appSettings.phone = document.getElementById('setPhone').value;
        appSettings.address = document.getElementById('setAddress').value;
        
        let selectedBoxes = document.querySelectorAll('.quick-tool-checkbox:checked');
        appSettings.quickTools = Array.from(selectedBoxes).map(box => box.value);
        
        localStorage.setItem('clinic_settings', JSON.stringify(appSettings));
        
        if (typeof renderHomeQuickTools === 'function') renderHomeQuickTools();
        if (typeof showSystemToast === 'function') showSystemToast("Settings & Profile Saved!");
    }

    function handleSignatureUpload(input) {
        if (input.files && input.files[0]) {
            let reader = new FileReader();
            reader.onload = function(e) {
                appSettings.signature = e.target.result;
                document.getElementById('sigPreview').innerHTML = `<img src="${e.target.result}" style="max-height:60px; border-radius:8px;">`;
                localStorage.setItem('clinic_settings', JSON.stringify(appSettings));
                if(typeof showSystemToast === 'function') showSystemToast("Signature Uploaded!");
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function renderFullDatabase() {
        const container = document.getElementById('fullDatabaseList');
        if(!container) return;
        
        const query = document.getElementById('dbSearchInput').value.toLowerCase();
        const patientKeys = Object.keys(globalPatientsStore).reverse(); 
        
        if(patientKeys.length === 0) {
            container.innerHTML = `
            <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-soft);">
                <div style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7;">📂</div>
                <h3 style="color: var(--primary-dark); margin: 0 0 0.5rem 0; font-size: 1.3rem;">No Patients Yet</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">Your patient database is empty. Add your first patient to start generating prescriptions and tracking clinical data.</p>
                <button onclick="document.getElementById('registryModal').classList.add('active');" style="background: linear-gradient(135deg, var(--brand-blue), var(--brand-cyan)); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3); transition: transform 0.2s;">
                    + Add First Patient
                </button>
            </div>`;
            return;
        }
        
        let html = "";
        patientKeys.forEach(id => {
            let p = globalPatientsStore[id];
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
        AppStore.clearActivePatient(); // Tell the Vault
        activePatientId = null; // Update the legacy bridge
        
        // Hide the sticky banner and tools
        document.getElementById('activeWorkspace').style.display = 'none';
        
        // Reset the header
        const headerText = document.getElementById('headerPatientText');
        if(headerText) headerText.innerText = '';
        
        // Route back to the home dashboard
        if (typeof switchNavTab === 'function') switchNavTab('homeDashboardView');
        if (typeof showSystemToast === 'function') showSystemToast("Patient file closed.");
    }

    async function loadPatientFromDB(id) {
        AppStore.setActivePatient(id); // Tell the Vault
        activePatientId = id; // Update the legacy bridge
        
        // Fetch securely from the vault (No more fake network delays!)
        let p = AppStore.getPatient(id);
        if (!p) {
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Error loading patient data.");
            return;
        }
        
        // Sync the legacy bridge for older scripts
        if(typeof globalPatientsStore !== 'undefined') globalPatientsStore[id] = p;
        
        document.getElementById('pName').value = p.name || "";
        document.getElementById('dob').value = p.dob || "";
        document.getElementById('pPhone').value = p.phone || "";
        document.getElementById('ageYrs').value = p.ageYrs || 0;
        document.getElementById('ageMos').value = p.ageMos || 0;
        document.getElementById('gender').value = p.gender || 'male';
        document.getElementById('pWeight').value = p.weight || "";
        document.getElementById('htCm').value = p.htCm || "";
        if(document.getElementById('hcCm')) document.getElementById('hcCm').value = p.hcCm || "";
        if(document.getElementById('jeEndemic')) document.getElementById('jeEndemic').checked = p.je || false;
        if(document.getElementById('rxDiagnosis')) document.getElementById('rxDiagnosis').value = p.diagnosis || "";
        
        currentPatientAgeInMonths = p.totalMonths || 0;
        if(document.getElementById('calcWeight')) document.getElementById('calcWeight').value = p.weight || "";
        if(document.getElementById('headerPatientText')) document.getElementById('headerPatientText').innerText = `👤 ${p.name}`;
        
        if (typeof triggerActiveWorkspaceBuild === 'function') triggerActiveWorkspaceBuild(id);
        
        if(typeof buildTimeline === 'function') buildTimeline();
        if(typeof buildMilestoneReference === 'function') buildMilestoneReference();
        if(typeof renderDietLogs === 'function') renderDietLogs();
        if(typeof calculateDose === 'function') calculateDose(); 
        if(typeof calcGrowth === 'function') calcGrowth();
        if(typeof calcMalnutrition === 'function') calcMalnutrition();
        if(typeof calcNutrition === 'function') calcNutrition();
        if(typeof renderRecallLog === 'function') renderRecallLog();
        if(typeof renderFoodDB === 'function' && typeof foodsDb !== 'undefined') renderFoodDB(foodsDb);
        
        if(typeof openClinicalTool === 'function') {
            openClinicalTool('prescriptionFeatureView');
            let ledgerTabBtn = document.querySelector('[onclick*="rxNotesTab"]');
            if(ledgerTabBtn) switchSubTab('rxNotesTab', ledgerTabBtn);
        }

        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        const toolsTabBtn = document.querySelector('.nav-item[onclick*="toolsTab"]');
        if(toolsTabBtn) toolsTabBtn.classList.add('active');
        
        if(typeof showSystemToast === 'function') showSystemToast(`Opened file: ${p.name}`);
    }

    function exportDatabase() {
        if(Object.keys(globalPatientsStore).length === 0) {
            if(typeof showSystemToast === "function") showSystemToast("⚠️ Database is empty!");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(globalPatientsStore));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `Pediatric_Hub_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        dlAnchorElem.remove();
        if(typeof showSystemToast === "function") showSystemToast("📥 Database backup downloaded successfully!");
    }

    // --- 15. HOME DASHBOARD LOGIC ---
    function updateGreeting() {
        const hour = new Date().getHours();
        let timeGreet = "Good morning";
        if(hour >= 12 && hour < 17) timeGreet = "Good afternoon";
        if(hour >= 17) timeGreet = "Good evening";
        
        let docName = appSettings.docName || "Doctor";
        
        let greetingEl = document.getElementById('homeGreetingText');
        if(greetingEl) greetingEl.innerHTML = `${timeGreet}, ${docName} <span style="font-size:1.4rem;">👋</span>`;
    }

    // --- PHASE 4: DOCTOR AUTHENTICATION ENGINE ---
    let doctorProfiles = JSON.parse(localStorage.getItem('kiddoq_profiles')) || [];
    let activeDoctorId = localStorage.getItem('kiddoq_active_doctor') || null;

    function showAuthScreen() {
        document.getElementById('authScreen').style.display = 'flex';
        setTimeout(() => { document.getElementById('authScreen').style.opacity = '1'; }, 10);
        
        const list = document.getElementById('doctorProfileList');
        if (doctorProfiles.length === 0) {
            list.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No profiles found. Create one below.</p>`;
        } else {
            let html = "";
            doctorProfiles.forEach(doc => {
                let initial = doc.name.toLowerCase().startsWith("dr. ") ? doc.name.charAt(4).toUpperCase() : doc.name.charAt(0).toUpperCase();
                html += `
                <div class="profile-btn" onclick="loginAsDoctor('${doc.id}')">
                    <div class="avatar-circle">${initial}</div>
                    <div>
                        <strong style="display:block; color:var(--text-main); font-size:1.05rem;">${doc.name}</strong>
                        <span style="font-size:0.85rem; color:var(--text-muted);">${doc.qual}</span>
                    </div>
                </div>`;
            });
            list.innerHTML = html;
        }
    }

    function createNewDoctorProfile() {
        const name = document.getElementById('newDocName').value.trim();
        const qual = document.getElementById('newDocQual').value.trim();
        if (!name) return alert("Please enter a doctor's name.");
        
        const newDoc = { id: 'doc_' + Date.now(), name: name, qual: qual };
        doctorProfiles.push(newDoc);
        localStorage.setItem('kiddoq_profiles', JSON.stringify(doctorProfiles));
        
        loginAsDoctor(newDoc.id);
    }

    function updateCopilot(pId) {
        const p = globalPatientsStore[pId];
        const container = document.getElementById('aiCopilotSuggestions');
        if(!p || !container) return;

        document.getElementById('aiCopilotBanner').style.display = 'block';
        let suggestions = [];

        if (!p.visits || p.visits.length === 0) {
            suggestions.push(`<button class="action" onclick="openClinicalTool('prescriptionFeatureView'); startNewVisit();" style="width:auto; margin:0; padding:8px 16px; background:var(--primary); box-shadow:var(--shadow-sm);">➕ Start Initial Visit</button>`);
        }

        if (!p.weight || p.weight === "") {
            suggestions.push(`<button class="secondary" onclick="openClinicalTool('malnutritionFeatureView')" style="width:auto; border-color:var(--warning); color:var(--warning); background:white;">⚖️ Record Weight</button>`);
        }

        if (p.totalMonths <= 24) {
            suggestions.push(`<button class="secondary" onclick="openClinicalTool('trackerFeatureView')" style="width:auto; border-color:var(--success); color:var(--success); background:white;">💉 Check Due Vaccines</button>`);
            suggestions.push(`<button class="secondary" onclick="openClinicalTool('milestoneFeatureView')" style="width:auto; border-color:var(--brand-pink); color:var(--brand-pink); background:white;">👶 Assess Milestones</button>`);
        }

        // FIX: Simplified the onclick string to prevent escaping errors
        suggestions.push(`<button class="secondary" onclick="openClinicalTool('prescriptionFeatureView')" style="width:auto; border-color:var(--primary); color:var(--primary); background:white;">🧮 Rx & Dosing</button>`);

        container.innerHTML = suggestions.join("");
    }

    function loginAsDoctor(docId) {
        const doc = doctorProfiles.find(d => d.id === docId);
        if(!doc) return;
        
        activeDoctorId = docId;
        localStorage.setItem('kiddoq_active_doctor', docId);
        
        // Sync active profile to app settings for printing
        appSettings.docName = doc.name;
        appSettings.qual = doc.qual;
        localStorage.setItem('clinic_settings', JSON.stringify(appSettings));
        
        // Hide Auth Screen
        document.getElementById('authScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('authScreen').style.display = 'none'; }, 400);
        
        // Render Header Avatar
        const headerAvatar = document.getElementById('headerAvatar');
        if(headerAvatar) {
            headerAvatar.style.display = 'flex';
            headerAvatar.innerText = doc.name.toLowerCase().startsWith("dr. ") ? doc.name.charAt(4).toUpperCase() : doc.name.charAt(0).toUpperCase();
        }
        
        if(typeof showSystemToast === 'function') showSystemToast(`Logged in as ${doc.name}`);
        if(typeof updateGreeting === 'function') updateGreeting();
    }

    // --- MASTER INITIALIZATION ENGINE ---
    document.addEventListener("DOMContentLoaded", function() {
        // 1. Load User Settings & Dark Mode
        if (typeof applySettingsToUI === 'function') applySettingsToUI();
        
        // 2. Initialize Clinical Databases
        if (typeof populateDrugs === 'function') populateDrugs();
        if (typeof buildMilestoneReference === 'function') buildMilestoneReference();
        if (typeof renderFoodDB === 'function' && typeof foodsDb !== 'undefined') renderFoodDB(foodsDb);
        if (typeof populateFoodSelect === 'function') populateFoodSelect();
        
        // 3. UI/UX Enhancements
        setTimeout(updateGreeting, 500); 
        
        // Force mobile number pads on all number inputs globally
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.setAttribute('inputmode', 'decimal');
        });

        // 4. INSTANT Gatekeeper: Check Authentication
        if(activeDoctorId && doctorProfiles.length > 0) {
            loginAsDoctor(activeDoctorId);
            if (typeof switchNavTab === 'function') switchNavTab('homeDashboardView');
        } else {
            showAuthScreen();
        }

        // 5. Handle Mobile Splash Screen Fade
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if(splash) splash.classList.add('hidden');
        }, 2000);

        // 5. Route to Home Dashboard on load
        if (typeof switchNavTab === 'function') switchNavTab('homeDashboardView');
    });