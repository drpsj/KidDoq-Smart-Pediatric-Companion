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