// js/view-controller.js
/**
 * KidDoq View Controller
 * Centralizes all DOM manipulation for navigation, tabs, and modals.
 */

// --- 1. GLOBAL SYSTEM TOAST ---
window.showSystemToast = function(msg) {
    const container = document.getElementById('systemToastContainer');
    if (!container) { 
        alert(msg); 
        return; 
    }
    const toast = document.createElement('div');
    toast.className = 'system-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const ViewController = (function() {
    let currentView = 'homeDashboardView';

    function _hideAllViews() {
        document.querySelectorAll('.view-content').forEach(v => {
            v.style.display = '';
            v.classList.remove('active-view');
        });
    }

    function _resetNavButtons() {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    }

    return {
        switchNavTab: function(tabId, skipHistory = false) {
            _hideAllViews();
            _resetNavButtons();
            
            // Prevent fatal SecurityError crashes when testing locally
            try {
                if (skipHistory !== true) {
                    history.pushState({ type: 'nav', id: tabId }, "", "#" + tabId);
                }
            } catch (e) {
                console.warn("History push blocked (Local testing mode)");
            }

            const target = document.getElementById(tabId);
            const workspace = document.getElementById('activeWorkspace');

            // Workspace Gatekeeper
            if (tabId === 'homeDashboardView' || tabId === 'databaseFeatureView' || tabId === 'aboutFeatureView' || tabId === 'toolsTab' || tabId === 'personaliseFeatureView' || tabId === 'customFormularyView') {
                if (workspace) workspace.style.display = 'none';
            } else if (workspace && AppStore.getActivePatientId()) {
                workspace.style.display = 'block';
            }

            if (target) {
                target.style.display = '';
                setTimeout(() => target.classList.add('active-view'), 10);
            }

            // Handle the active blue highlight reliably
            if (typeof skipHistory === 'object' && skipHistory !== null) {
                skipHistory.classList.add('active');
            } else {
                const navBtn = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
                if (navBtn) navBtn.classList.add('active');
            }

            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;

            currentView = tabId;

            if (tabId === 'homeDashboardView' && typeof updateGreeting === 'function') updateGreeting();
            if (tabId === 'databaseFeatureView' && typeof renderFullDatabase === 'function') renderFullDatabase();
        },

        switchSubTab: function(tabId, btnElement) {
            const navContainer = btnElement.closest('.sub-tabs-nav');
            if (!navContainer) return;

            navContainer.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');

            const parentView = navContainer.closest('.view-content');
            if (!parentView) return;

            parentView.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.remove('active');
                // Erase any lingering inline styles blocking the CSS
                content.style.display = ''; 
            });

            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        },

        showModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('active');
        },

        hideModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        }
    };
})();

// --- LEGACY BRIDGES ---
window.switchNavTab = ViewController.switchNavTab;
window.switchMainFeature = ViewController.switchNavTab; 
window.switchSubTab = ViewController.switchSubTab;

// --- TOOL ROUTING & VITAL SYNCING ---
// 🔄 PHASE 2: THE GLOBAL AUTO-FILL ENGINE
window.updateGlobalVital = function(vitalType, val) {
    if (!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    if (!p) return;

    let numVal = parseFloat(val);
    if (isNaN(numVal)) numVal = "";

    // 1. Save directly to the secure Vault (AppStore)
    if (vitalType === 'weight') p.weight = numVal;
    if (vitalType === 'height') p.htCm = numVal;
    if (typeof AppStore !== 'undefined') AppStore.savePatient(p);

    // 2. Broadcast the update to ALL tools simultaneously
    const weightInputs = ['inlineCalcWeight', 'fluidWeight', 'crashWeight', 'seizureWeight', 'girWt', 'umbilicalWt', 'sbeWeight', 'triageWt', 'growthWtOnTheGo', 'pWeight'];
    const heightInputs = ['triageHt', 'htCmOnTheGo', 'htCm'];

    if (vitalType === 'weight') {
        weightInputs.forEach(id => {
            let el = document.getElementById(id);
            // Change value without stealing focus from the box the doctor is typing in
            if (el && el.value != numVal && document.activeElement !== el) el.value = numVal;
        });
        // Update Sticky Banner instantly
        let bannerWt = document.getElementById('bannerPWeight');
        if (bannerWt) bannerWt.innerText = numVal ? `${numVal} kg` : "-- kg";
    }

    if (vitalType === 'height') {
        heightInputs.forEach(id => {
            let el = document.getElementById(id);
            if (el && el.value != numVal && document.activeElement !== el) el.value = numVal;
        });
    }

    // 3. Force calculators to instantly recalculate with the new data
    if (typeof calcInlineDose === 'function') calcInlineDose();
    if (typeof calcGrowth === 'function') calcGrowth();
    if (typeof calcMalnutrition === 'function') calcMalnutrition();
    if (typeof updateCopilot === 'function') updateCopilot(activePatientId);
};

// Fire this when opening a patient file to seed the initial data
window.syncVitalsToTools = function() {
    if(!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    if(!p) return;
    if(p.weight) window.updateGlobalVital('weight', p.weight);
    if(p.htCm) window.updateGlobalVital('height', p.htCm);
};

window.openClinicalTool = function(viewId, skipHistory = false) {
    if (!AppStore.getActivePatientId()) {
        showSystemToast("⚠️ Please open a patient file first!");
        ViewController.switchNavTab('databaseFeatureView');
        return;
    }
    
    // Log tool opening in the native mobile history
    if (!skipHistory) {
        history.pushState({ type: 'tool', id: viewId }, "", "#" + viewId);
    }

    document.getElementById('activeWorkspace').style.display = 'block';
    
    // 🧠 SYNC THE MEGA CASE FILE TABS
    const subNavTabs = document.querySelectorAll('.case-tab');
    if (subNavTabs.length > 0) {
        subNavTabs.forEach(tab => {
            if (tab.getAttribute('data-target') === viewId) {
                tab.classList.add('active');
                // Automatically scroll the selected tab into view on mobile
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    // Hide all currently open tools
    document.querySelectorAll('.view-content').forEach(v => {
        v.style.display = '';
        v.classList.remove('active-view');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = '';
        target.classList.add('active-view');
        
        // Let CSS handle the visibility, just assign the 'active' classes
        let firstTabBtn = target.querySelector('.sub-tab-btn');
        let firstTabContent = target.querySelector('.sub-tab-content');
        
        if (firstTabBtn && firstTabContent) {
            target.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            target.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = ''; // Clear the inline block!
            });
            firstTabBtn.classList.add('active');
            firstTabContent.classList.add('active');
        }
    }

    // Push patient details into the tools dynamically
    syncVitalsToTools();

    // Specific Tool Triggers
    if (viewId === 'milestoneFeatureView' && typeof renderMilestoneTimeline === 'function') {
        renderMilestoneTimeline();
    }
};

// ==========================================
// AI COPILOT & WORKSPACE LOADER
// ==========================================

window.updateCopilot = function(pId) {
    const p = AppStore.getPatient(pId);
    const container = document.getElementById('aiCopilotSuggestions');
    if(!p || !container) return;

    document.getElementById('aiCopilotBanner').style.display = 'block';
    let suggestions = [];

    if (!p.visits || p.visits.length === 0) {
        suggestions.push(`<button class="action" onclick="window.openClinicalTool('prescriptionFeatureView'); startNewVisit();" style="width:auto; margin:0; padding:8px 16px; background:var(--primary); box-shadow:var(--shadow-sm);">➕ Start Initial Visit</button>`);
    }
    if (!p.weight || p.weight === "") {
        suggestions.push(`<button class="secondary" onclick="window.openClinicalTool('malnutritionFeatureView')" style="width:auto; border-color:var(--warning); color:var(--warning); background:white;">⚖️ Record Weight</button>`);
    }
    if (p.totalMonths <= 24) {
        suggestions.push(`<button class="secondary" onclick="window.openClinicalTool('trackerFeatureView')" style="width:auto; border-color:var(--success); color:var(--success); background:white;">💉 Check Due Vaccines</button>`);
        suggestions.push(`<button class="secondary" onclick="window.openClinicalTool('milestoneFeatureView')" style="width:auto; border-color:var(--brand-pink); color:var(--brand-pink); background:white;">👶 Assess Milestones</button>`);
    }
    suggestions.push(`<button class="secondary" onclick="window.openClinicalTool('prescriptionFeatureView')" style="width:auto; border-color:var(--primary); color:var(--primary); background:white;">🧮 Rx & Dosing</button>`);
    container.innerHTML = suggestions.join("");
};

window.loadPatientFromDB = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) {
        showSystemToast("⚠️ Patient data not found in vault!");
        return;
    }

    AppStore.setActivePatient(pId);
    activePatientId = pId; 

    const headerEl = document.getElementById('headerPatientText');
    if (headerEl) headerEl.innerText = `👤 ${p.name} | ${p.ageYrs || 0}Y ${p.ageMos || 0}M | ${p.weight} kg`;
    if (typeof updateStickyBanner === 'function') updateStickyBanner(pId);

    if (typeof window.openClinicalTool === 'function') {
        // Direct routing into the Mega Case File Tab 1 (Rx/Notes)
        window.openClinicalTool('prescriptionFeatureView');
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
        if (typeof calcMathTools === 'function') calcMathTools();
        
        const inputs = {
            'calcWeight': p.weight, 'pName': p.name, 'pPhone': p.phone,
            'dob': p.dob, 'ageYrs': p.ageYrs, 'ageMos': p.ageMos,
            'gender': p.gender, 'pWeight': p.weight, 'htCm': p.htCm
        };
        for (const [id, val] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if (el) el.value = val !== undefined ? val : (id.includes('age') ? 0 : "");
        }
    }, 100);

    showSystemToast(`✅ Opened ${p.name}'s File`);
};

window.triggerActiveWorkspaceBuild = window.loadPatientFromDB;

// ==========================================
// NATIVE MOBILE BACK BUTTON / SWIPE SUPPORT
// ==========================================
window.addEventListener('popstate', function(event) {
    // 1. If a modal is open, the back button should close the modal FIRST.
    let activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
        activeModal.classList.remove('active');
        // Push the state back so we don't accidentally navigate away
        history.pushState(event.state, "", document.location.hash);
        return;
    }

    // 2. Otherwise, route backward normally
    if (event.state) {
        if (event.state.type === 'nav') {
            ViewController.switchNavTab(event.state.id, true);
        } else if (event.state.type === 'tool') {
            window.openClinicalTool(event.state.id, true);
        }
    } else {
        // Fallback to home if they swipe all the way back
        ViewController.switchNavTab('homeDashboardView', true);
    }
});

// Set the baseline anchor when the app boots
document.addEventListener("DOMContentLoaded", () => {
    history.replaceState({ type: 'nav', id: 'homeDashboardView' }, "", "#homeDashboardView");
});

// ==========================================
// WORKSPACE NAVIGATION CONTROLS
// ==========================================
window.closePatientFile = function() {
    AppStore.clearActivePatient();
    activePatientId = null;
    document.getElementById('activeWorkspace').style.display = 'none';
    ViewController.switchNavTab('databaseFeatureView');
    showSystemToast("Patient file closed.");
};