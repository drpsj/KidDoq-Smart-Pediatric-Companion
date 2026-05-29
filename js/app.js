// js/app.js
/**
 * KidDoq: Main Application Bootstrapper
 * Initializes global context and boots the application sequence.
 */

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

document.addEventListener("DOMContentLoaded", function() {
    if (typeof applySettingsToUI === 'function') applySettingsToUI();
    if (typeof populateDrugs === 'function') populateDrugs();
    if (typeof buildMilestoneReference === 'function') buildMilestoneReference();
    if (typeof renderFoodDB === 'function' && typeof window.foodsDb !== 'undefined') renderFoodDB(window.foodsDb);
    
    setTimeout(() => { if(typeof updateGreeting === 'function') updateGreeting(); }, 500); 
    document.querySelectorAll('input[type="number"]').forEach(input => { input.setAttribute('inputmode', 'decimal'); });

    if(typeof activeDoctorId !== 'undefined' && activeDoctorId && typeof doctorProfiles !== 'undefined' && doctorProfiles.length > 0) {
        if(typeof loginAsDoctor === 'function') loginAsDoctor(activeDoctorId);
        if (typeof ViewController !== 'undefined') ViewController.switchNavTab('homeDashboardView');
    } else {
        if(typeof showAuthScreen === 'function') showAuthScreen();
    }

    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) splash.classList.add('hidden');
    }, 2000);
});