// js/app.js

var appSettings = AppStore.getSettings();
var globalPatientsStore = AppStore.getAllPatients(); 
var activePatientId = AppStore.getActivePatientId(); 

let customDrugsStore;
try { customDrugsStore = JSON.parse(localStorage.getItem('custom_drugs')) || { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; } catch(e) { customDrugsStore = { "antibiotics": [], "antipyretics": [], "antihistamines": [], "git": [], "respiratory": [] }; }

let currentPatientAgeInMonths = 0; 
let wtChartInstance = null; 
let htChartInstance = null;

const masterToolRegistry = [
    { id: 'prescriptionFeatureView', name: 'Rx & Dosing', icon: 'icon-rx.png' },
    { id: 'certificateFeatureView', name: 'Certificates', icon: 'icon-cert.png' },
    { id: 'growthFeatureView', name: 'Growth Curves', icon: 'icon-growth.png' },
    { id: 'trackerFeatureView', name: 'Vaccination', icon: 'icon-vax.png' },
    { id: 'erFeatureView', name: 'ER & Resus', icon: 'icon-er.png' },
    { id: 'milestoneFeatureView', name: 'Milestones', icon: 'icon-miles.png' },
    { id: 'malnutritionFeatureView', name: 'Triage & MAC', icon: 'icon-triage.png' },
    { id: 'nutritionFeatureView', name: 'Diet Recall', icon: 'icon-diet.png' },
    { id: 'jaundiceFeatureView', name: 'Jaundice', icon: 'icon-jaundice.png' },
    { id: 'asthmaFeatureView', name: 'PRAM Score', icon: 'icon-asthma.png' }
];

function showSystemToast(msg) {
    const container = document.getElementById('systemToastContainer');
    const toast = document.createElement('div');
    toast.className = 'system-toast';
    toast.innerHTML = `<span>✅</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        toast.style.transform = 'translateY(20px)'; 
        toast.style.transition = 'all 0.3s ease'; 
        setTimeout(()=>toast.remove(), 300); 
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
    if (typeof applySettingsToUI === 'function') applySettingsToUI();
    if (typeof populateDrugs === 'function') populateDrugs();
    if (typeof buildMilestoneReference === 'function') buildMilestoneReference();
    if (typeof renderFoodDB === 'function' && typeof window.foodsDb !== 'undefined') renderFoodDB(window.foodsDb);
    
    setTimeout(updateGreeting, 500); 
    document.querySelectorAll('input[type="number"]').forEach(input => { input.setAttribute('inputmode', 'decimal'); });

    if(activeDoctorId && doctorProfiles.length > 0) {
        loginAsDoctor(activeDoctorId);
        if (typeof ViewController !== 'undefined') ViewController.switchNavTab('homeDashboardView');
    } else {
        showAuthScreen();
    }

    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) splash.classList.add('hidden');
    }, 2000);
});

if (typeof renderFoodDB === 'function' && typeof window.foodsDb !== 'undefined') {
    renderFoodDB(window.foodsDb);
}

window.loadPatientFromDB = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Patient data not found in vault!");
        return;
    }

    AppStore.setActivePatient(pId);
    activePatientId = pId; 

    const headerEl = document.getElementById('headerPatientText');
    if (headerEl) headerEl.innerText = `👤 ${p.name} | ${p.ageYrs || 0}Y ${p.ageMos || 0}M | ${p.weight} kg`;
    if (typeof updateStickyBanner === 'function') updateStickyBanner(pId);

    if (typeof ViewController !== 'undefined') {
        ViewController.openClinicalTool('prescriptionFeatureView');
        setTimeout(() => {
            let ledgerTabBtn = document.querySelector('[onclick*="rxNotesTab"]');
            if(ledgerTabBtn) ViewController.switchSubTab('rxNotesTab', ledgerTabBtn);
        }, 50);
    }

    setTimeout(() => {
        if (typeof renderVisitLedger === 'function') renderVisitLedger(); 
        if (typeof calcMalnutrition === 'function') calcMalnutrition();
        if (typeof renderSensory === 'function') renderSensory();
        if (typeof calcNutrition === 'function') calcNutrition();
        if (typeof renderRecallLog === 'function') renderRecallLog();
        if (typeof calculateAndRenderTimeline === 'function') calculateAndRenderTimeline(pId);
        if (typeof renderMilestoneDashboard === 'function') renderMilestoneDashboard();
        if (typeof updateCopilot === 'function') updateCopilot(pId);
        
        if(document.getElementById('calcWeight')) document.getElementById('calcWeight').value = p.weight || "";
        document.getElementById('pName').value = p.name || "";
        document.getElementById('pPhone').value = p.phone || "";
        document.getElementById('dob').value = p.dob || "";
        document.getElementById('ageYrs').value = p.ageYrs || 0;
        document.getElementById('ageMos').value = p.ageMos || 0;
        document.getElementById('gender').value = p.gender || 'male';
        document.getElementById('pWeight').value = p.weight || "";
        document.getElementById('htCm').value = p.htCm || "";
    }, 100);

    if(typeof showSystemToast === 'function') showSystemToast(`✅ Opened ${p.name}'s File`);
};

window.triggerActiveWorkspaceBuild = window.loadPatientFromDB;