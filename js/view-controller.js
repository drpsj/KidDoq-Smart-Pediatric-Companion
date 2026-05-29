// js/view-controller.js
/**
 * KidDoq View Controller (The "Traffic Cop")
 * Centralizes all DOM manipulation for navigation, tabs, and modals.
 */

const ViewController = (function() {
    let currentView = 'homeDashboardView';

    // --- INTERNAL HELPERS ---
    function _hideAllViews() {
        document.querySelectorAll('.view-content').forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active-view');
        });
    }

    function _resetNavButtons() {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    }

    // --- PUBLIC API ---
    return {
        // 1. Global Navigation Switcher
        switchNavTab: function(tabId) {
            _hideAllViews();
            _resetNavButtons();

            const target = document.getElementById(tabId);
            const workspace = document.getElementById('activeWorkspace');

            // Workspace Gatekeeper: Only show workspace if opening a tool WITH an active patient
            if (tabId === 'homeDashboardView' || tabId === 'databaseFeatureView' || tabId === 'aboutFeatureView' || tabId === 'toolsTab') {
                if (workspace) workspace.style.display = 'none';
            } else if (workspace && AppStore.getActivePatientId()) {
                workspace.style.display = 'block';
            }

            // Reveal Target
            if (target) {
                target.style.display = 'block';
                setTimeout(() => target.classList.add('active-view'), 10);
            }

            // Highlight Bottom Nav
            const navBtn = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
            if (navBtn) navBtn.classList.add('active');

            // Scroll to top
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;

            currentView = tabId;

            // Trigger associated lifecycle events (Decoupled from UI logic)
            if (tabId === 'homeDashboardView' && typeof updateGreeting === 'function') updateGreeting();
            if (tabId === 'databaseFeatureView' && typeof renderFullDatabase === 'function') renderFullDatabase();
        },

        // 2. Clinical Tool Gatekeeper
        openClinicalTool: function(toolId) {
            if (!AppStore.getActivePatientId()) {
                if (typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!");
                this.switchNavTab('databaseFeatureView');
                return;
            }
            this.switchNavTab(toolId);
        },

        // 3. Sub-Tab Switcher (For ER, Nutrition, Prescription tabs)
        switchSubTab: function(tabId, btnElement) {
            const navContainer = btnElement.closest('.sub-tabs-nav');
            if (!navContainer) return;

            // Swap active button styles
            navContainer.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');

            // Find parent view and swap content visibility
            const parentView = navContainer.closest('.view-content');
            if (!parentView) return;

            parentView.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
        },

        // 4. Modal Management
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
// This connects your HTML onclick="" events directly to the new Controller
window.switchNavTab = ViewController.switchNavTab;
window.switchMainFeature = ViewController.switchNavTab; 
window.openClinicalTool = ViewController.openClinicalTool;
window.switchSubTab = ViewController.switchSubTab;

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
        suggestions.push(`<button class="action" onclick="ViewController.openClinicalTool('prescriptionFeatureView'); startNewVisit();" style="width:auto; margin:0; padding:8px 16px; background:var(--primary); box-shadow:var(--shadow-sm);">➕ Start Initial Visit</button>`);
    }
    if (!p.weight || p.weight === "") {
        suggestions.push(`<button class="secondary" onclick="ViewController.openClinicalTool('malnutritionFeatureView')" style="width:auto; border-color:var(--warning); color:var(--warning); background:white;">⚖️ Record Weight</button>`);
    }
    if (p.totalMonths <= 24) {
        suggestions.push(`<button class="secondary" onclick="ViewController.openClinicalTool('trackerFeatureView')" style="width:auto; border-color:var(--success); color:var(--success); background:white;">💉 Check Due Vaccines</button>`);
        suggestions.push(`<button class="secondary" onclick="ViewController.openClinicalTool('milestoneFeatureView')" style="width:auto; border-color:var(--brand-pink); color:var(--brand-pink); background:white;">👶 Assess Milestones</button>`);
    }
    suggestions.push(`<button class="secondary" onclick="ViewController.openClinicalTool('prescriptionFeatureView')" style="width:auto; border-color:var(--primary); color:var(--primary); background:white;">🧮 Rx & Dosing</button>`);
    container.innerHTML = suggestions.join("");
};

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
        
        // Safe UI mapping
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

    if(typeof showSystemToast === 'function') showSystemToast(`✅ Opened ${p.name}'s File`);
};

window.triggerActiveWorkspaceBuild = window.loadPatientFromDB;