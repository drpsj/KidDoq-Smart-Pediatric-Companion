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
// CORTEX POP SHEET CONTROLLER
// =========================================================

// Opens the Bottom Sheet and injects the requested heavy module
window.openPopSheet = function(targetElementId, titleText) {
    const targetElement = document.getElementById(targetElementId);
    const sheetContent = document.getElementById('popSheetContent');
    const overlay = document.getElementById('cortexPopSheetOverlay');
    const sheet = document.getElementById('cortexPopSheet');
    const title = document.getElementById('popSheetTitle');

    if (!targetElement) return;

    // Set the custom title for the sheet
    title.innerText = titleText || "Clinical Tool";

    // Physically move the heavy module DOM node into the Pop Sheet
    sheetContent.appendChild(targetElement);
    targetElement.style.display = 'block';

    // Ignite the slide-up physics
    overlay.classList.remove('cortex-hidden');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    sheet.classList.add('active');
};

// Closes the Bottom Sheet gracefully
window.closePopSheet = function() {
    const overlay = document.getElementById('cortexPopSheetOverlay');
    const sheet = document.getElementById('cortexPopSheet');

    // Slide it down
    sheet.classList.remove('active');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';

    // Wait for the slide animation to finish before fully hiding the overlay
    setTimeout(() => {
        overlay.classList.add('cortex-hidden');
    }, 500);
};

// =========================================================
// THE SPATIAL COMMAND DECK ENGINE
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('.cortex-spatial-stage');
    if (!stage) return;

    const cards = Array.from(stage.querySelectorAll('.bento-card'));
    let currentIndex = 0; 
    
    // Optional: If you have navigation dots
    const dotsContainer = document.querySelector('.deck-nav-dots');
    let dots = [];
    if (dotsContainer) {
        cards.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
            dots.push(dot);
        });
    }

    // 1. THE DEALER: Assigns classes based on index offset
    function update3DDeck() {
        const total = cards.length;
        cards.forEach((card, index) => {
            // SURGICAL FIX: Strip ONLY the 3D positioning classes!
            // This preserves all your custom colors, layouts, and states.
            card.classList.remove('slot-active', 'slot-prev', 'slot-next', 'slot-far-prev', 'slot-far-next', 'slot-hidden');
            
            // INFINITE LOOP MATH: Calculates the shortest circular distance
            let offset = (index - currentIndex) % total;
            if (offset > Math.floor(total / 2)) offset -= total;
            else if (offset < -Math.floor(total / 2)) offset += total;

            if (offset === 0) card.classList.add('slot-active');
            else if (offset === -1) card.classList.add('slot-prev');
            else if (offset === 1) card.classList.add('slot-next');
            else if (offset === -2) card.classList.add('slot-far-prev');
            else if (offset === 2) card.classList.add('slot-far-next');
            else card.classList.add('slot-hidden');
        });

        // BUILD AND UPDATE THE SPATIAL NAVIGATOR TRACK (Replaces Dots)
        let navigator = document.querySelector('.deck-navigator');
        if (!navigator) {
            // Build the track automatically the first time the deck loads
            navigator = document.createElement('div');
            navigator.className = 'deck-navigator';
            navigator.innerHTML = `
                <div class="deck-arrow" id="deck-prev">‹</div>
                <div class="deck-nav-track" id="deck-track"></div>
                <div class="deck-arrow" id="deck-next">›</div>
            `;
            stage.parentNode.insertBefore(navigator, stage.nextSibling);

            // Hook up the side arrows
            document.getElementById('deck-prev').addEventListener('click', () => {
                if (currentIndex > 0) { currentIndex--; update3DDeck(); }
            });
            document.getElementById('deck-next').addEventListener('click', () => {
                if (currentIndex < cards.length - 1) { currentIndex++; update3DDeck(); }
            });

            // Hide the old dots completely
            if (typeof dots !== 'undefined' && dots.length > 0 && dots[0].parentNode) {
                dots[0].parentNode.style.display = 'none';
            }

            // Populate the track based on the actual cards in the deck
            const track = document.getElementById('deck-track');
            cards.forEach((card, index) => {
                // Find a title or heading from the card to use as a label
                const titleEl = card.querySelector('h1, h2, h3, .card-title, .bento-header span') || card.querySelector('header');
                let title = titleEl ? titleEl.textContent.trim() : `Data ${index + 1}`;
                
                const item = document.createElement('div');
                item.className = 'deck-nav-item';
                item.innerHTML = `
                    <div class="deck-nav-icon">◈</div>
                    <div class="deck-nav-label">${title.substring(0, 10)}</div>
                `;
                item.addEventListener('click', () => {
                    currentIndex = index;
                    update3DDeck();
                });
                track.appendChild(item);
            });
        }

        // Update active states on the track as you swipe
        const navTrackItems = document.querySelectorAll('.deck-nav-item');
        if (navTrackItems.length) {
            navTrackItems.forEach(item => item.classList.remove('active'));
            if(navTrackItems[currentIndex]) {
                navTrackItems[currentIndex].classList.add('active');
                // Auto-scroll the track so the active item stays centered
                navTrackItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }

    // 2. THE SWIPE ENGINE: Pure touch delta, zero scroll
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; 

    stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // 🚀 SURGICAL FIX: Hardware-locked animation state to prevent glitchy double-swipes
    let isDeckAnimating = false; 

    function handleSwipe() {
        if (isDeckAnimating) return; // Ignore touches while engine is shifting
        
        const swipeDistance = touchEndX - touchStartX;
        const total = cards.length;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            isDeckAnimating = true; // Lock engine
            
            // Sync strictly with the device's screen refresh rate
            requestAnimationFrame(() => {
                if (swipeDistance < -swipeThreshold) {
                    // Swiped Left -> Move forward
                    currentIndex = (currentIndex + 1) % total;
                } else if (swipeDistance > swipeThreshold) {
                    // Swiped Right -> Move backward
                    currentIndex = (currentIndex - 1 + total) % total;
                }
                
                update3DDeck();
                
                // 🚀 SURGICAL FIX: Locks engine strictly to match 600ms Apple spatial curve.
                // We unlock at 500ms to allow smooth queuing of the next swipe.
                setTimeout(() => { 
                    isDeckAnimating = false; 
                }, 500); 
            });
        }
    }

    // Initialize the physical space
    update3DDeck();
});