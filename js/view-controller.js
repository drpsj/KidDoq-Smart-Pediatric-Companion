// js/view-controller.js
/**
 * KidDoq View Controller
 * Centralizes all DOM manipulation for navigation, tabs, and modals.
 */

// --- 1. GLOBAL SYSTEM TOAST (Dynamic Island Spatial UI) ---
window.showSystemToast = function(msg) {
    const container = document.getElementById('systemToastContainer');
    if (!container) { 
        alert(msg); 
        return; 
    }
    
    // Force the container to act like a Top-Center Dynamic Island
    container.style.cssText = `
        position: fixed;
        top: 25px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10000;
        pointer-events: none;
    `;

    const toast = document.createElement('div');
    toast.className = 'system-toast';
    
    // Inject the frosted spatial pill styling directly
    toast.style.cssText = `
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 1px solid rgba(0, 229, 255, 0.3);
        box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 0 15px rgba(0, 229, 255, 0.15);
        color: #ffffff;
        padding: 14px 28px;
        border-radius: 50px;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
        transform: translateY(-40px) scale(0.85);
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Fluid Spring Physics */
    `;
    
    toast.innerHTML = msg;
    container.appendChild(toast);
    
    // Trigger the fluid drop animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0) scale(1)';
        toast.style.opacity = '1';
    });
    
    // Trigger the retraction animation
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px) scale(0.9)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

const ViewController = (function() {
    let currentView = 'homeDashboardView';

    function _hideAllViews() {
        document.querySelectorAll('.view-content').forEach(v => {
            v.style.display = ''; // CLEARED INLINE STYLES
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
            
            try {
                if (skipHistory !== true) {
                    history.pushState({ type: 'nav', id: tabId }, "", "#" + tabId);
                }
            } catch (e) {
                console.warn("History push blocked (Local testing mode)");
            }

            const target = document.getElementById(tabId);
            const workspace = document.getElementById('activeWorkspace');

            if (tabId === 'homeDashboardView' || tabId === 'databaseFeatureView' || tabId === 'aboutFeatureView' || tabId === 'toolsTab' || tabId === 'personaliseFeatureView' || tabId === 'customFormularyView') {
                if (workspace) workspace.style.display = 'none';
            } else if (workspace && AppStore.getActivePatientId()) {
                workspace.style.display = 'block';
            }

            if (target) {
                target.style.display = ''; // CLEARED INLINE STYLES
                target.classList.add('active-view'); 
            }

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

window.switchNavTab = ViewController.switchNavTab;
window.switchMainFeature = ViewController.switchNavTab; 
window.switchSubTab = ViewController.switchSubTab;

window.updateGlobalVital = function(vitalType, val) {
    if (!activePatientId) return;
    const p = AppStore.getPatient(activePatientId);
    if (!p) return;

    let numVal = parseFloat(val);
    if (isNaN(numVal)) numVal = "";

    if (vitalType === 'weight') p.weight = numVal;
    if (vitalType === 'height') p.htCm = numVal;
    if (typeof AppStore !== 'undefined') AppStore.savePatient(p);

    const weightInputs = ['inlineCalcWeight', 'fluidWeight', 'crashWeight', 'seizureWeight', 'girWt', 'umbilicalWt', 'sbeWeight', 'triageWt', 'growthWtOnTheGo', 'pWeight'];
    const heightInputs = ['triageHt', 'htCmOnTheGo', 'htCm'];

    if (vitalType === 'weight') {
        weightInputs.forEach(id => {
            let el = document.getElementById(id);
            if (el && el.value != numVal && document.activeElement !== el) el.value = numVal;
        });
        let bannerWt = document.getElementById('bannerPWeight');
        if (bannerWt) bannerWt.innerText = numVal ? `${numVal} kg` : "-- kg";
    }

    if (vitalType === 'height') {
        heightInputs.forEach(id => {
            let el = document.getElementById(id);
            if (el && el.value != numVal && document.activeElement !== el) el.value = numVal;
        });
    }

    if (typeof calcInlineDose === 'function') calcInlineDose();
    if (typeof calcGrowth === 'function') calcGrowth();
    if (typeof calcMalnutrition === 'function') calcMalnutrition();
    if (typeof updateCopilot === 'function') updateCopilot(activePatientId);
};

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
    
    if (!skipHistory) {
        history.pushState({ type: 'tool', id: viewId }, "", "#" + viewId);
    }

    document.getElementById('activeWorkspace').style.display = 'block';
        
        let isCaseTool = false;
        const subNavTabs = document.querySelectorAll('.case-tab');
        if (subNavTabs.length > 0) {
            subNavTabs.forEach(tab => {
                if (tab.getAttribute('data-target') === viewId) {
                    tab.classList.add('active');
                    isCaseTool = true;
                    tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    tab.classList.remove('active');
                }
            });
        }
        
        // Cleanly hide Case File tabs and AI Banner when opening external tools
        const caseSubNav = document.getElementById('caseFileSubNav');
        const aiBanner = document.getElementById('aiCopilotBanner');
        
        if (caseSubNav) caseSubNav.style.display = isCaseTool ? 'flex' : 'none';
        if (!isCaseTool && aiBanner) aiBanner.style.display = 'none';
        if (isCaseTool && typeof updateCopilot === 'function') updateCopilot(AppStore.getActivePatientId());
    
    document.querySelectorAll('.view-content').forEach(v => {
        v.style.display = ''; // CLEARED INLINE STYLES
        v.classList.remove('active-view');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = ''; // CLEARED INLINE STYLES
        target.classList.add('active-view');
        
        let firstTabBtn = target.querySelector('.sub-tab-btn');
        let firstTabContent = target.querySelector('.sub-tab-content');
        
        if (firstTabBtn && firstTabContent) {
            target.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
            target.querySelectorAll('.sub-tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = ''; 
            });
            firstTabBtn.classList.add('active');
            firstTabContent.classList.add('active');
        }
    }

    syncVitalsToTools();

    if (viewId === 'milestoneFeatureView' && typeof renderMilestoneTimeline === 'function') {
        renderMilestoneTimeline();
    }
};

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

    // --- SPATIAL HUD UPGRADE ---
    const headerEl = document.getElementById('headerPatientText');
    if (headerEl) {
        headerEl.innerHTML = `
        <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 8px 20px; border-radius: 50px; border: 1px solid rgba(0, 229, 255, 0.2); box-shadow: inset 0 0 15px rgba(0,229,255,0.05), 0 4px 20px rgba(0,0,0,0.4); transition: all 0.3s ease; cursor: default;" onmouseover="this.style.borderColor='rgba(0,229,255,0.5)'; this.style.boxShadow='inset 0 0 20px rgba(0,229,255,0.15), 0 6px 25px rgba(0,0,0,0.5)';" onmouseout="this.style.borderColor='rgba(0, 229, 255, 0.2)'; this.style.boxShadow='inset 0 0 15px rgba(0,229,255,0.05), 0 4px 20px rgba(0,0,0,0.4)';">
            <span style="font-size: 1.3rem; filter: drop-shadow(0 0 8px rgba(0,229,255,0.6));">👤</span>
            <span style="color: var(--brand-cyan); font-weight: 800; font-size: 1.1rem; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(0,229,255,0.4);">${p.name}</span>
            <span style="color: rgba(255,255,255,0.2);">|</span>
            <span style="color: var(--text-main); font-weight: 600; font-size: 1rem; opacity: 0.9;">${p.ageYrs || 0}Y ${p.ageMos || 0}M</span>
            <span style="color: rgba(255,255,255,0.2);">|</span>
            <span style="color: var(--brand-pink); font-weight: 800; font-size: 1rem; text-shadow: 0 0 10px rgba(255,51,102,0.4); background: rgba(255,51,102,0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,51,102,0.2);">Wt: ${p.weight} kg</span>
        </div>`;
    }

    if (typeof updateStickyBanner === 'function') updateStickyBanner(pId);

    if (typeof window.openClinicalTool === 'function') {
        window.openClinicalTool('patientProfileView');
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

window.addEventListener('popstate', function(event) {
    let activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
        activeModal.classList.remove('active');
        history.pushState(event.state, "", document.location.hash);
        return;
    }

    if (event.state) {
        if (event.state.type === 'nav') {
            ViewController.switchNavTab(event.state.id, true);
        } else if (event.state.type === 'tool') {
            window.openClinicalTool(event.state.id, true);
        }
    } else {
        ViewController.switchNavTab('homeDashboardView', true);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    history.replaceState({ type: 'nav', id: 'homeDashboardView' }, "", "#homeDashboardView");
});

window.closePatientFile = function() {
    AppStore.clearActivePatient();
    activePatientId = null;
    document.getElementById('activeWorkspace').style.display = 'none';
    ViewController.switchNavTab('databaseFeatureView');
    showSystemToast("Patient file closed.");
};

// =========================================================
// THE HYBRID SPATIAL ENGINE (Native Scroll Sensor)
// =========================================================
window.initSpatialCommandCenter = function() {
    if (window.innerWidth > 1023) return; 

    const deck = document.querySelector('.cortex-bento-grid');
    if (!deck) return;

    const cards = Array.from(deck.querySelectorAll('.bento-card'));
    if (cards.length === 0) return;

    // Prevent double initialization
    if (deck.dataset.spatialEngineActive === "true") return;
    deck.dataset.spatialEngineActive = "true";

    let currentIndex = -1; 
    let isScrolling = false;

    // Only updates CSS visually, NEVER translates the container
    function updateSlots(activeIndex) {
        if (currentIndex === activeIndex) return; // Prevent redundant repaints
        currentIndex = activeIndex;

        cards.forEach((card, i) => {
            card.classList.remove('slot-active', 'slot-prev', 'slot-next', 'slot-far-prev', 'slot-far-next', 'holo-active');
            let diff = i - currentIndex;
            
            if (diff === 0) card.classList.add('slot-active');
            else if (diff === -1) card.classList.add('slot-prev');
            else if (diff === 1) card.classList.add('slot-next');
            else if (diff < -1) card.classList.add('slot-far-prev');
            else if (diff > 1) card.classList.add('slot-far-next');
        });
    }

    // The Sensor: Calculates which card is physically closest to the center of the viewport
    function processScrollPhysics() {
        const deckCenter = deck.scrollLeft + (deck.clientWidth / 2);
        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
            // Using offsetLeft natively tracks the card's position inside the scroll container
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            const distance = Math.abs(deckCenter - cardCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        updateSlots(closestIndex);
        isScrolling = false;
    }

    // Passive listener allows the browser native scroll to run at maximum priority
    deck.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                processScrollPhysics();
            });
            isScrolling = true;
        }
    }, { passive: true });

    // Tap-to-Focus natively scrolls the chosen card into the center snap point
    cards.forEach(card => {
        card.addEventListener('click', () => {
            card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    // Arrow Hints Integration
    const leftArrow = document.querySelector('.holo-swipe-hint .arrow-left');
    const rightArrow = document.querySelector('.holo-swipe-hint .arrow-right');
    
    if(leftArrow) leftArrow.addEventListener('click', () => { 
        if(currentIndex > 0) cards[currentIndex - 1].scrollIntoView({ behavior: 'smooth', inline: 'center' }); 
    });
    if(rightArrow) rightArrow.addEventListener('click', () => { 
        if(currentIndex < cards.length - 1) cards[currentIndex + 1].scrollIntoView({ behavior: 'smooth', inline: 'center' }); 
    });

    // Boot execution
    requestAnimationFrame(() => {
        processScrollPhysics(); // Establish the initial active card
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSpatialCommandCenter);
} else {
    window.initSpatialCommandCenter();
}