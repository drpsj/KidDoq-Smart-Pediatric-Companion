// js/view-controller.js
/**
 * KidDoq View Controller
 * Centralizes all DOM manipulation for navigation, tabs, and modals.
 */

// --- 1. GLOBAL SYSTEM TOAST (Fixes the silent failure!) ---
window.showSystemToast = function(msg) {
    const container = document.getElementById('systemToastContainer');
    if (!container) { 
        alert(msg); // Fallback if container is missing
        return; 
    }
    const toast = document.createElement('div');
    toast.className = 'system-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    
    // Auto-remove the toast after 3 seconds
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
            v.style.display = 'none';
            v.classList.remove('active-view');
        });
    }

    function _resetNavButtons() {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    }

    return {
        switchNavTab: function(tabId) {
            _hideAllViews();
            _resetNavButtons();

            const target = document.getElementById(tabId);
            const workspace = document.getElementById('activeWorkspace');

            // Workspace Gatekeeper
            if (tabId === 'homeDashboardView' || tabId === 'databaseFeatureView' || tabId === 'aboutFeatureView' || tabId === 'toolsTab') {
                if (workspace) workspace.style.display = 'none';
            } else if (workspace && AppStore.getActivePatientId()) {
                workspace.style.display = 'block';
            }

            if (target) {
                target.style.display = 'block';
                setTimeout(() => target.classList.add('active-view'), 10);
            }

            const navBtn = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
            if (navBtn) navBtn.classList.add('active');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;

            currentView = tabId;

            if (tabId === 'homeDashboardView' && typeof updateGreeting === 'function') updateGreeting();
            if (tabId === 'databaseFeatureView' && typeof renderFullDatabase === 'function') renderFullDatabase();
        },

        openClinicalTool: function(toolId) {
            if (!AppStore.getActivePatientId()) {
                showSystemToast("⚠️ Please open a patient file first!");
                this.switchNavTab('databaseFeatureView');
                return;
            }
            this.switchNavTab(toolId);
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
            });

            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
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

// --- LEGACY BRIDGE ---
window.switchNavTab = ViewController.switchNavTab;
window.switchMainFeature = ViewController.switchNavTab; 
window.switchSubTab = ViewController.switchSubTab;

// --- SURGICAL PATCH: FORCE TOOL VISIBILITY ---
window.openClinicalTool = function(toolId) {
    if (!AppStore.getActivePatientId()) {
        showSystemToast("⚠️ Please open a patient file first!");
        ViewController.switchNavTab('databaseFeatureView');
        return;
    }

    document.getElementById('activeWorkspace').style.display = 'block';
    document.querySelectorAll('.view-content').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active-view');
    });

    const target = document.getElementById(toolId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active-view');
        
        let firstTabBtn = target.querySelector('.sub-tab-btn');
        let firstTabContent = target.querySelector('.sub-tab-content');
        
        if (firstTabBtn && firstTabContent) {
            target.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            target.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none'; 
            });
            firstTabBtn.classList.add('active');
            firstTabContent.classList.add('active');
            firstTabContent.style.display = 'block'; 
        }
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
        window.openClinicalTool('prescriptionFeatureView');
        setTimeout(() => {
            let ledgerTabBtn = document.querySelector('[onclick*="rxNotesTab"]');
            if(ledgerTabBtn) window.switchSubTab('rxNotesTab', ledgerTabBtn);
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
        
        // ✨ NEW: Auto-calculate advanced math (BSA, etc.) on load ✨
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