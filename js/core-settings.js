// js/core-settings.js
/**
 * KidDoq Module: Settings & Doctor Authentication
 * Handles profile creation, logins, dark mode, and UI configurations.
 */

function renderHomeQuickTools() {
    const grid = document.getElementById('homeQuickToolsGrid');
    if(!grid) return;
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

function updateGreeting() {
    const hour = new Date().getHours();
    let timeGreet = "Good morning";
    if(hour >= 12 && hour < 17) timeGreet = "Good afternoon";
    if(hour >= 17) timeGreet = "Good evening";
    let docName = appSettings.docName || "Doctor";
    let greetingEl = document.getElementById('homeGreetingText');
    if(greetingEl) greetingEl.innerHTML = `${timeGreet}, ${docName} <span style="font-size:1.4rem;">👋</span>`;
}

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

function loginAsDoctor(docId) {
    const doc = doctorProfiles.find(d => d.id === docId);
    if(!doc) return;
    activeDoctorId = docId;
    localStorage.setItem('kiddoq_active_doctor', docId);
    appSettings.docName = doc.name;
    appSettings.qual = doc.qual;
    localStorage.setItem('clinic_settings', JSON.stringify(appSettings));
    
    document.getElementById('authScreen').style.opacity = '0';
    setTimeout(() => { document.getElementById('authScreen').style.display = 'none'; }, 400);
    
    const headerAvatar = document.getElementById('headerAvatar');
    if(headerAvatar) {
        headerAvatar.style.display = 'flex';
        headerAvatar.innerText = doc.name.toLowerCase().startsWith("dr. ") ? doc.name.charAt(4).toUpperCase() : doc.name.charAt(0).toUpperCase();
    }
    if(typeof showSystemToast === 'function') showSystemToast(`Logged in as ${doc.name}`);
    if(typeof updateGreeting === 'function') updateGreeting();
}