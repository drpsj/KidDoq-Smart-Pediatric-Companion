// ==========================================
// KINETIC CORTEX: DIRECT SCRUB TELEMETRY
// ==========================================

// 🚀 THE FIX: Unified & Bulletproof Drawer Physics
window.toggleCortexDrawer = function() {
    const drawer = document.getElementById('cortexDrawer');
    const chevron = document.querySelector('.anchor-chevron');
    if (!drawer) return;
    
    if (drawer.classList.contains('cortex-collapsed')) {
        // Open Drawer (Overrides inline hidden styles)
        drawer.style.maxHeight = '200px';
        drawer.style.opacity = '1';
        drawer.style.padding = '0 20px 20px 20px';
        drawer.classList.remove('cortex-collapsed');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        // Close Drawer
        drawer.style.maxHeight = '0px';
        drawer.style.opacity = '0';
        drawer.style.padding = '0 20px';
        drawer.classList.add('cortex-collapsed');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
};

// 🚀 CNS AUTO-APPROXIMATION ENGINE (Upgraded)
function autoApproximateVitals(totalMonths) {
    const yrs = Math.floor(totalMonths / 12);
    
    // 1. Approximate Weight (Weech's Formula)
    let wt = 3.0;
    if (totalMonths > 0 && totalMonths < 12) wt = (totalMonths + 9) / 2;
    else if (yrs >= 1 && yrs <= 6) wt = (yrs * 2) + 8;
    else if (yrs > 6 && yrs <= 12) wt = ((yrs * 7) - 5) / 2;
    else if (yrs > 12) wt = (yrs * 3); 

    // 2. Approximate Height
    let ht = 50;
    if (totalMonths > 0 && totalMonths < 12) ht = 50 + (totalMonths * 2); 
    else if (yrs >= 1 && yrs <= 12) ht = (yrs * 6) + 77;
    else if (yrs > 12) ht = 150; 

    // 3. Approximate Head Circumference (Weaver/CDC rough curve)
    let hc = 35;
    if(totalMonths <= 3) hc = 35 + (totalMonths * 1.66);
    else if(totalMonths <= 6) hc = 40 + ((totalMonths - 3) * 1.0);
    else if(totalMonths <= 12) hc = 43 + ((totalMonths - 6) * 0.5);
    else if(totalMonths <= 24) hc = 46 + ((totalMonths - 12) * 0.16);
    else if(totalMonths <= 36) hc = 48 + ((totalMonths - 24) * 0.16);
    else hc = 50 + ((totalMonths - 36) * 0.05);

    // 4. Approximate MAC
    let mac = (totalMonths >= 6 && totalMonths <= 59) ? 15.5 : 0;

    // Push securely to the DOM (including our new Drawer inputs!)
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val > 0) el.value = val.toFixed(1); };
    
    setVal('hudWeight', wt);
    const dispWt = document.getElementById('anchorWtDisplay');
    if (dispWt) dispWt.innerText = wt.toFixed(1);

    setVal('hudHt', ht);
    setVal('triageHt', ht);
    setVal('htCmOnTheGo', ht);

    setVal('hudHc', hc);
    
    setVal('hudMac', mac);
    setVal('triageMac', mac);

    return wt.toFixed(1);
}

// --- UPDATED DOSE LAYER TOGGLE ---
function toggleDoseLayer2() {
    const layer2 = document.getElementById('layer2FullCalc');
    const hint = document.querySelector('.expand-hint');
    const instantCards = document.getElementById('hudSmartDoseCards'); // The target to hide

    if (layer2.classList.contains('cortex-collapsed')) {
        // Opening Formulary
        layer2.classList.remove('cortex-collapsed');
        if (hint) hint.innerText = "Close Formulary ⌃";
        // Smoothly hide Instant Doses
        if (instantCards) instantCards.style.display = 'none';
    } else {
        // Closing Formulary
        layer2.classList.add('cortex-collapsed');
        if (hint) hint.innerText = "Full Formulary ⌄";
        // Restore Instant Doses
        if (instantCards) instantCards.style.display = 'flex';
    }
}

// 1. GENDER TOGGLE
function toggleAnchorGender() {
    const sel = document.getElementById('hudGender');
    const icon = document.getElementById('anchorGenderIcon');
    const disp = document.getElementById('anchorGenderDisplay');
    
    if (sel.value === 'male') {
        sel.value = 'female';
        icon.innerText = '♀️';
        disp.innerText = 'Female';
        icon.style.color = 'var(--brand-pink)';
    } else {
        sel.value = 'male';
        icon.innerText = '♂️';
        disp.innerText = 'Male';
        icon.style.color = 'var(--brand-blue)';
    }
    if(typeof broadcastGlobalParameters === 'function') broadcastGlobalParameters();
}

/// ==========================================
// 🚀 MASTER TELEMETRY ENGINE (Resilient Scoping)
// ==========================================
window.syncAllDashboards = function() {
    const yrs = parseInt(document.getElementById('hudAgeYrs')?.value) || 0;
    const mos = parseInt(document.getElementById('hudAgeMos')?.value) || 0;
    const tm = (yrs * 12) + mos;
    const wt = parseFloat(document.getElementById('hudWeight')?.value) || 0;

    // Fire ALL Dashboard Engines Safely
    try { if(typeof renderInstantDoses === 'function') renderInstantDoses(wt); } catch(e) {}
    try { if(typeof renderGrowthSnapshot === 'function') renderGrowthSnapshot(tm, wt); } catch(e) {}
    try { if(typeof renderAnthropometry === 'function') renderAnthropometry(); } catch(e) {}
    try { if(typeof renderMilestonesAndRedFlags === 'function') renderMilestonesAndRedFlags(tm); } catch(e) {}
    try { if(typeof renderVaccinesDue === 'function') renderVaccinesDue(tm); } catch(e) {}
    try { if(typeof runCortexTelemetry === 'function') runCortexTelemetry(tm); } catch(e) {}
    
    // 🚀 SURGICAL PATCH: Trigger the Vitals & Fluids Engine
    try { if(typeof renderVitalsAndFluids === 'function') renderVitalsAndFluids(tm, wt); } catch(e) {}

    // 🚀 RECONNECT ORIGINAL VITALS ENGINE
    try { if(typeof autoApproximateVitals === 'function') autoApproximateVitals(tm); } catch(e) {}
    try { if(typeof window.autoApproximateVitals === 'function') window.autoApproximateVitals(tm); } catch(e) {}
};

window.manualEditAge = function() {
    let currentY = parseInt(document.getElementById('hudAgeYrs').value) || 0;
    let currentM = parseInt(document.getElementById('hudAgeMos').value) || 0;
    let currentTotal = (currentY * 12) + currentM;
    
    let input = prompt("Enter Patient Age in TOTAL MONTHS (e.g., 18 for 1.5 yrs):", currentTotal);
    if (input !== null && input !== "" && !isNaN(input)) {
        let newTotal = parseInt(input);
        if (newTotal < 0) newTotal = 0;
        
        const newYrs = Math.floor(newTotal / 12);
        const newMos = newTotal % 12;
        document.getElementById('hudAgeYrs').value = newYrs;
        document.getElementById('hudAgeMos').value = newMos;
        
        let ageStr = '';
        if (newYrs > 0) ageStr += newYrs + 'Y ';
        if (newMos > 0 || newYrs === 0) ageStr += newMos + 'M';
        document.getElementById('anchorAgeDisplay').innerText = ageStr;
        
        if(typeof autoApproximateVitals === 'function') autoApproximateVitals(newTotal);
        window.syncAllDashboards(); // Broadcast update!
    }
};

window.manualEditWeight = function() {
    let currentWt = parseFloat(document.getElementById('hudWeight').value) || 0;
    let input = prompt("Enter Patient Weight (kg):", currentWt);
    if (input !== null && input !== "" && !isNaN(input)) {
        let newWt = parseFloat(input);
        if (newWt < 0) newWt = 0;
        
        document.getElementById('hudWeight').value = newWt.toFixed(1);
        const dispWt = document.getElementById('anchorWtDisplay');
        if (dispWt) dispWt.innerText = newWt.toFixed(1);
        
        window.syncAllDashboards(); // Broadcast update!
    }
};

// 2. DIRECT SCRUB ENGINE (Wired to Master Telemetry)
window.attachDirectScrub = function(zoneId, type) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    let startX = 0;
    let startVal = 0; 
    let startTotalMonths = 0;

    zone.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        if (type === 'weight') {
            startVal = parseFloat(document.getElementById('hudWeight').value) || 0;
        } else if (type === 'age') {
            const y = parseInt(document.getElementById('hudAgeYrs').value) || 0;
            const m = parseInt(document.getElementById('hudAgeMos').value) || 0;
            startTotalMonths = (y * 12) + m;
        }
        zone.style.background = 'rgba(0, 212, 255, 0.15)'; 
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 5) {
            e.preventDefault(); 
            
            if (type === 'weight') {
                let steps = Math.floor(deltaX / 8); 
                let newWt = startVal + (steps * 0.5); 
                if (newWt < 0) newWt = 0;
                
                document.getElementById('hudWeight').value = newWt.toFixed(1);
                document.getElementById('anchorWtDisplay').innerText = newWt.toFixed(1);
                
            } else if (type === 'age') {
                let steps = Math.floor(deltaX / 10);
                let newTotal = startTotalMonths + steps; 
                if (newTotal < 0) newTotal = 0;
                
                const newYrs = Math.floor(newTotal / 12);
                const newMos = newTotal % 12;
                document.getElementById('hudAgeYrs').value = newYrs;
                document.getElementById('hudAgeMos').value = newMos;
                
                let ageStr = '';
                if (newYrs > 0) ageStr += newYrs + 'Y ';
                if (newMos > 0 || newYrs === 0) ageStr += newMos + 'M';
                document.getElementById('anchorAgeDisplay').innerText = ageStr;
                
                if(typeof autoApproximateVitals === 'function') autoApproximateVitals(newTotal);
            }
            
            // 🚀 FIRE ALL DASHBOARD CARDS INSTANTLY
            window.syncAllDashboards();
        }
    }, { passive: false });

    zone.addEventListener('touchend', () => {
        zone.style.background = 'transparent';
    });
};

// 3. INTELLIGENT TELEMETRY (Living Interface Depth)
function runCortexTelemetry(totalMonths) {
    // Instantly calculate vaccines based on age
    if(typeof renderVaccinesDue === 'function') renderVaccinesDue(totalMonths);
    
    // 🚀 SURGICAL PATCH: Corrected the ID to match your HTML
    const growth = document.getElementById('growthSnapshotCard');
    const nutrition = document.getElementById('bentoNutrition');
    const vitals = document.getElementById('bentoVitals');
    const vaccines = document.getElementById('bentoVaccines');
    
    if(!vitals || !growth || !nutrition || !vaccines) return;

    // Helper: Pushes cards forward (Focus) or backward (Recede)
    const setSpatialDepth = (card, isFocus) => {
        if(isFocus) {
            card.style.transform = 'scale(1)';
            card.style.opacity = '1';
        } else {
            card.style.transform = 'scale(0.95)';
            card.style.opacity = '0.5';
        }
    };

    // ... (rest of your sorting logic remains unchanged)

    if (totalMonths <= 1) { 
        // Neonate: Focus on Vitals & Growth
        vitals.style.order = 1; setSpatialDepth(vitals, true);
        growth.style.order = 2; setSpatialDepth(growth, true);
        nutrition.style.order = 3; setSpatialDepth(nutrition, false);
        vaccines.style.order = 4; setSpatialDepth(vaccines, false);
    } else if (totalMonths > 1 && totalMonths <= 60) { 
        // Infant/Toddler: Focus on Vaccines, Growth, Nutrition
        vaccines.style.order = 1; setSpatialDepth(vaccines, true);
        growth.style.order = 2; setSpatialDepth(growth, true);
        nutrition.style.order = 3; setSpatialDepth(nutrition, true);
        vitals.style.order = 4; setSpatialDepth(vitals, false);
    } else { 
        // Adolescent: Focus on Vitals (Asthma/BP) & Growth
        vitals.style.order = 1; setSpatialDepth(vitals, true);
        growth.style.order = 2; setSpatialDepth(growth, true);
        nutrition.style.order = 3; setSpatialDepth(nutrition, false);
        vaccines.style.order = 4; setSpatialDepth(vaccines, false);
    }
}

// 4. HERO DOSE ENGINE (Spatial Glass & Kinetic UI)
function renderInstantDoses(weight) {
    // Trigger the ignition check immediately every time weight is scrubbed
    if (typeof checkLightningIgnition === 'function') checkLightningIgnition(weight);
    const container = document.getElementById('hudSmartDoseCards');
    const wt = parseFloat(weight);

    if (!wt || wt <= 0) {
        container.innerHTML = `<div class="hud-empty-state" style="width: 100%; border: 1px dashed rgba(0, 229, 255, 0.3) !important; background: rgba(0,0,0,0.2) !important; border-radius: 12px !important; text-align: left; padding: 15px !important; color: rgba(255,255,255,0.6) !important;">Enter Weight to unlock Instant Doses...</div>`;
        return;
    }

    let activeDB = [];
    if (typeof window.getUnifiedDB === 'function') activeDB = window.getUnifiedDB();
    else if (window.drugsDb) activeDB = window.drugsDb;

    if (!activeDB || activeDB.length === 0) return;

    // 🚀 DYNAMIC GENERATION: Map data and identify ALL Categories
    let mappedPool = activeDB.map(drug => {
        let computed = { reqMg: 0, reqVol: 0 };
        let unit = 'mL';
        
        if (typeof ClinicalMath !== 'undefined') {
            computed = ClinicalMath.computeDose(drug, wt) || computed;
            unit = ClinicalMath.getUnit(drug);
        }

        let color = "var(--text-main)";
        let catName = "💊 Other";
        let catId = drug.category || "other";

        if (catId === 'antipyretics') { color = "var(--brand-cyan)"; catName = "🔥 Fever & Pain"; }
        else if (catId === 'respiratory') { color = "#f97316"; catName = "🫁 Respiratory & Allergy"; }
        else if (catId === 'antibiotics') { color = "var(--success)"; catName = "🦠 Antibiotics"; }
        else if (catId === 'git') { color = "#a855f7"; catName = "🍎 GI & Antiemetics"; }
        else if (catId === 'antihistamines') { color = "var(--brand-blue)"; catName = "🤧 Antihistamines"; }
        else if (catId === 'emergency') { color = "var(--danger)"; catName = "🚨 Emergency"; }
        else if (catId === 'neurology') { color = "#8b5cf6"; catName = "🧠 Neurology"; }
        else if (catId === 'vitamins') { color = "#eab308"; catName = "💊 Vitamins & Minerals"; }
        else if (catId === 'topical') { color = "#14b8a6"; catName = "🧴 Topical & Drops"; }
        else if (catId === 'musclerelaxants') { color = "#64748b"; catName = "💉 Muscle Relaxants"; }

        let doseStr = `${drug.doseMg} ${drug.doseType === 'perDay' ? 'mg/kg/day' : (drug.doseType === 'fixed' ? 'mg stat' : 'mg/kg')}`;
        let formStr = drug.conc ? `${drug.conc}mg/${drug.vol}${unit.replace('s','')}` : `${drug.doseMg}mg`;

        return {
            name: drug.name, dose: doseStr, form: formStr, calc: computed.reqVol, targetMg: computed.reqMg.toFixed(1),
            unit: unit, freq: drug.defaultFreq || "OD", color: color, catId: catId, catName: catName,
            isCustom: drug.isCustom || false 
        };
    });

    const opdKeywords = ['paracetamol', 'ibuprofen', 'amox', 'azithromycin', 'ondansetron', 'domperidone', 'cetirizine', 'cefixime', 'salbutamol', 'mefenamic'];
    let highYieldPool = mappedPool.filter(d => opdKeywords.some(k => d.name.toLowerCase().includes(k)));
    
    highYieldPool = highYieldPool.sort(() => 0.5 - Math.random());
    const quickDoseNames = new Set(highYieldPool.slice(0, 10).map(d => d.name));

    if (!container.classList.contains('formulary-expanded')) container.classList.add('formulary-collapsed');
    container.innerHTML = '<div class="cortex-scan-line"></div>'; 
    
    setTimeout(() => {
        let html = '';
        
        const categoryOrder = ['antipyretics', 'respiratory', 'antibiotics', 'git', 'antihistamines', 'neurology', 'vitamins', 'topical', 'emergency', 'musclerelaxants', 'other'];
        
        categoryOrder.forEach(catId => {
            let catDrugs = mappedPool.filter(d => d.catId === catId);
            if (catDrugs.length > 0) {
                catDrugs.sort((a,b) => a.name.localeCompare(b.name));
                
                let firstDrug = catDrugs[0];
                html += `<div class="formulary-category-divider" data-cat="${catId}" onclick="toggleCategoryAccordion('${catId}')" style="border-bottom: 1px dashed ${firstDrug.color}; color: ${firstDrug.color}; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                    <span>${firstDrug.catName}</span>
                    <span class="cat-chevron" id="chevron-${catId}" style="font-size: 1.2rem; font-weight: 900; transition: transform 0.3s ease;">+</span>
                </div>`;
                
                catDrugs.forEach((d, index) => {
                    const staggerClass = `cortex-stagger-${(index % 4) + 1}`;
                    const displayFreq = typeof window.translateFreqToLocal === 'function' ? window.translateFreqToLocal(d.freq) : d.freq;
                    let badgeHtml = d.isCustom ? `<div style="position: absolute; top: -10px; right: -10px; background: #e11d48; color: white; font-size: 0.55rem; font-weight: 900; padding: 4px 8px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.4); z-index: 10; border: 1px solid rgba(255,255,255,0.2);">LOCAL</div>` : '';

                    let isQuick = quickDoseNames.has(d.name);
                    let quickClass = isQuick ? 'is-quick-dose' : 'not-quick-dose';
                    let scrambleOrder = isQuick ? Math.floor(Math.random() * 10) : 0;

                    html += `
                    <div class="${staggerClass} instant-dose-card cat-card-${catId} hidden-by-accordion ${quickClass}" data-searchname="${d.name.toLowerCase()}" style="order: ${scrambleOrder}; --card-color: ${d.color}; position: relative; min-width: 155px; max-width: 175px; background: rgba(0, 0, 0, 0.5) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-top: 1px solid rgba(255,255,255,0.2) !important; border-radius: 14px !important; padding: 14px !important; border-left: 4px solid ${d.color} !important; flex-shrink: 0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3) !important;">
                        
                        ${badgeHtml}
                        <div class="plasma-sweep-line" style="background: linear-gradient(90deg, transparent, ${d.color}, transparent); animation-delay: ${(index * 0.05) + 0.3}s;"></div>

                        <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff !important; text-shadow: 0 0 8px rgba(255,255,255,0.2); letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.name}">${d.name}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6) !important; font-weight: 600; margin-bottom: 12px;">${d.dose} • ${d.form}</div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <span class="breathing-digit" style="font-family: 'SF Mono', 'Roboto Mono', ui-monospace, monospace; font-size: 2.1rem; font-weight: 700; color: #f8fafc !important; line-height: 1; letter-spacing: -1.5px; text-shadow: none;">${d.calc}</span>
                                <span style="font-size: 0.85rem; color: ${d.color} !important; font-weight: 800; margin-left: 4px;">${d.unit}</span>
                            </div>
                            <div style="font-size: 0.7rem; font-weight: 800; color: ${d.color} !important; background: rgba(0,0,0,0.5) !important; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05) !important;">${displayFreq}</div>
                        </div>

                        <div class="math-hud-layer">
                            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
                                <span>Target Mass</span><span>Formula</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #fff; font-weight: 800;">
                                <span style="color: ${d.color};">${d.targetMg} mg</span><span>${wt} kg × ${parseFloat(d.dose)}</span>
                            </div>
                        </div>

                        <!-- NEW ADD TO RX BUTTON -->
                        <button onclick="addToRxQueue('${d.name}', '${d.form}', '${d.calc} ${d.unit}', '${d.freq}')" 
                            style="width: 100%; margin-top: 10px; padding: 8px 0; border-radius: 6px; border: 1px solid rgba(0, 229, 255, 0.3); background: rgba(0, 229, 255, 0.1); color: var(--brand-cyan); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s ease;"
                            onmouseover="this.style.background='rgba(0, 229, 255, 0.2)'"
                            onmouseout="this.style.background='rgba(0, 229, 255, 0.1)'">
                            + ADD TO RX
                        </button>

                    </div>`;
                });
            }
        });
        container.innerHTML = html;
    }, 400); 
}

// 🚀 NEW ACCORDION TOGGLE ENGINE
window.toggleCategoryAccordion = function(catId) {
    const container = document.getElementById('hudSmartDoseCards');
    if(container.classList.contains('formulary-collapsed')) return;

    const cards = document.querySelectorAll(`.cat-card-${catId}`);
    const chevron = document.getElementById(`chevron-${catId}`);
    let isOpening = false;

    cards.forEach(card => {
        if(card.classList.contains('hidden-by-accordion')) {
            card.classList.remove('hidden-by-accordion');
            isOpening = true;
        } else {
            card.classList.add('hidden-by-accordion');
        }
    });

    if(chevron) {
        chevron.innerText = isOpening ? '−' : '+';
    }
};

// 🚀 UPGRADED SPOTLIGHT SEARCH (Auto-opens accordions)
window.filterFormulary = function(query) {
    let q = query.toLowerCase();
    let cards = document.querySelectorAll('.instant-dose-card');
    
    cards.forEach(card => {
        if (card.getAttribute('data-searchname').includes(q)) {
            card.classList.remove('hidden-by-search');
            // Auto-open accordion if user is actively searching
            if(q !== '') card.classList.remove('hidden-by-accordion');
        } else {
            card.classList.add('hidden-by-search');
        }
    });

    // Update chevrons to minus if searching, reset to plus if cleared
    if(q !== '') {
        document.querySelectorAll('.cat-chevron').forEach(chev => chev.innerText = '−');
    } else {
        document.querySelectorAll('.instant-dose-card').forEach(card => card.classList.add('hidden-by-accordion'));
        document.querySelectorAll('.cat-chevron').forEach(chev => chev.innerText = '+');
    }

    // Hide Category Dividers if all their cards are filtered out
    let dividers = document.querySelectorAll('.formulary-category-divider');
    dividers.forEach(div => {
        let catId = div.getAttribute('data-cat');
        let visibleCards = document.querySelectorAll(`.cat-card-${catId}:not(.hidden-by-search)`);
        if(visibleCards.length > 0) div.classList.remove('hidden-by-search');
        else div.classList.add('hidden-by-search');
    });
};

// 🚀 UPGRADED TOGGLE ENGINE (Now reveals the Search bar)
window.toggleFormularyGrid = function() {
    const container = document.getElementById('hudSmartDoseCards');
    const btn = document.getElementById('formularyToggleBtn');
    const searchInput = document.getElementById('formularySearch');
    if(!container || !btn) return;
    
    if(container.classList.contains('formulary-collapsed')) {
        container.classList.remove('formulary-collapsed');
        container.classList.add('formulary-expanded');
        btn.innerHTML = 'COLLAPSE GRID ✖';
        btn.style.background = 'rgba(255, 51, 102, 0.15)'; 
        btn.style.borderColor = 'rgba(255, 51, 102, 0.4)';
        btn.style.color = '#ff3366';
        
        // Show Search Bar
        if(searchInput) {
            searchInput.style.display = 'block';
            setTimeout(() => searchInput.focus(), 300);
        }
    } else {
        container.classList.remove('formulary-expanded');
        container.classList.add('formulary-collapsed');
        btn.innerHTML = 'EXPAND GRID ⛶';
        btn.style.background = 'rgba(0, 229, 255, 0.15)'; 
        btn.style.borderColor = 'rgba(0, 229, 255, 0.4)';
        btn.style.color = 'var(--brand-cyan)';
        
        // Hide & Reset Search Bar
        if(searchInput) {
            searchInput.style.display = 'none';
            searchInput.value = '';
            filterFormulary(''); 
        }
    }
};

// ==========================================
// 5. HIGH-FIDELITY VACCINE ENGINE (Self-Contained)
// ==========================================

// 🚀 The Local Slider Engine (Syncs with the global app)
window.vaxSliderScrub = function(val) {
    const newTotal = parseInt(val) || 0;
    const newYrs = Math.floor(newTotal / 12);
    const newMos = newTotal % 12;

    // 1. Update the Global Anchor Pill
    const yrInput = document.getElementById('hudAgeYrs');
    const moInput = document.getElementById('hudAgeMos');
    if (yrInput) yrInput.value = newYrs;
    if (moInput) moInput.value = newMos;

    let ageStr = '';
    if (newYrs > 0) ageStr += newYrs + 'Y ';
    if (newMos > 0 || newYrs === 0) ageStr += newMos + 'M';
    const disp = document.getElementById('anchorAgeDisplay');
    if (disp) disp.innerText = ageStr;

    // 2. Fire Global Telemetry so the whole app reacts to the slider!
    if(typeof autoApproximateVitals === 'function') {
        const autoWt = autoApproximateVitals(newTotal);
        if(typeof renderInstantDoses === 'function') renderInstantDoses(autoWt);
        if(typeof renderGrowthSnapshot === 'function') renderGrowthSnapshot(newTotal, autoWt);
        if(typeof renderVitalsAndFluids === 'function') renderVitalsAndFluids(newTotal, autoWt);
    }
    if(typeof renderAnthropometry === 'function') renderAnthropometry();
    if(typeof renderMilestonesAndRedFlags === 'function') renderMilestonesAndRedFlags(newTotal);
    
    // 3. Re-render this card
    renderVaccinesDue(newTotal);
};

// ==========================================
// 5. HIGH-FIDELITY VACCINE ENGINE (Premium Library)
// ==========================================
window.renderVaccinesDue = function(totalMonths) {
    const vaxContainer = document.getElementById('hudVaxOutput');
    if (!vaxContainer) return;

    // 1. Telemetry Sync
    let tm = parseFloat(totalMonths);
    if (isNaN(tm) || tm === 0) {
        const ageDisplay = document.getElementById('anchorAgeDisplay');
        if (ageDisplay) {
            let ageText = ageDisplay.textContent || "0Y 0M";
            tm = ((parseInt((ageText.match(/(\d+)Y/) || [])[1]) || 0) * 12) + (parseInt((ageText.match(/(\d+)M/) || [])[1]) || 0);
        }
    }
    if (isNaN(tm)) {
        tm = ((parseInt(document.getElementById('hudAgeYrs')?.value) || 0) * 12) + (parseInt(document.getElementById('hudAgeMos')?.value) || 0);
    }

    let stage = 0; 
    let upcTitle = "", upcDesc = "", upcDate = "Next Visit", list = [];

    if (tm >= 16) {
        stage = 3; upcTitle = "DPT Booster 2"; upcDesc = "At 5 Years"; upcDate = "Check Registry";
        list = [{n: "DPT Booster 1", d: "First Booster", s: "due"}, {n: "OPV Booster", d: "Oral Polio", s: "due"}, {n: "MR 2", d: "Measles/Rubella", s: "due"}];
    } else if (tm >= 9) {
        stage = 2; upcTitle = "DPT & MR Boosters"; upcDesc = "At 16 Months"; upcDate = "Check Registry";
        list = [{n: "MR 1", d: "Measles/Rubella", s: "due"}, {n: "JE 1", d: "If Endemic", s: "due"}, {n: "PCV Booster", d: "Pneumococcal", s: "due"}];
    } else if (tm >= 1.5) {
        stage = 1; upcTitle = "Measles/Rubella 1"; upcDesc = "At 9 Months"; upcDate = "Check Registry";
        list = [{n: "Pentavalent 1-3", d: "DPT+Hib+HepB", s: "due"}, {n: "Rotavirus 1-3", d: "Oral Vaccine", s: "due"}, {n: "OPV 1-3", d: "Oral Polio", s: "due"}];
    } else {
        stage = 0; upcTitle = "Pentavalent 1"; upcDesc = "At 6 Weeks"; upcDate = "Check Registry";
        list = [{n: "BCG", d: "Birth Dose", s: "due"}, {n: "OPV 0", d: "Birth Dose", s: "due"}, {n: "Hepatitis B", d: "Birth Dose", s: "due"}];
    }

    const stages = ["BIRTH", "PRIMARY", "9 MOS", "BOOSTERS"];

    // PREMIUM ICONS: Library Import + Custom Physics
    const iconSyringe = `
        <div class="syringe-physics-wrapper plunger-anim" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <i class="ph-duotone ph-syringe" style="font-size: 28px; transform: rotate(45deg); color: var(--brand-cyan); filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.6)); background: transparent !important; -webkit-background-clip: initial !important; -webkit-text-fill-color: initial !important;"></i>
            <div class="purge-drop-fluid drop-anim" style="top: 0px; right: 2px;"></div>
            <div class="purge-drop-fluid drop-anim-delay" style="top: 0px; right: 2px;"></div>
        </div>`;

    // PREMIUM ICONS: Milestone Stages (Duotone)
    const milestoneIcons = [
        `<i class="ph-duotone ph-baby" style="font-size: inherit;"></i>`,        // Birth
        `<i class="ph-duotone ph-smiley" style="font-size: inherit;"></i>`,      // Primary
        `<i class="ph-duotone ph-teddy-bear" style="font-size: inherit;"></i>`,  // 9 Mos
        `<i class="ph-duotone ph-sneaker" style="font-size: inherit;"></i>`      // Boosters
    ];

    const iconCalendar = `<i class="ph-duotone ph-calendar-blank" style="font-size: 16px; color: var(--text-muted);"></i>`;

    let html = `
    <div class="vax-flip-container">
        <div class="vax-flip-card" id="vaxFlipCard">
            
            <div class="vax-face-front">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; margin-top: -5px;">
                    <div style="display: flex; align-items: center; gap: 4px; font-weight: 800; color: #fff; font-size: 0.95rem; letter-spacing: 0.5px;">
                        ${iconSyringe} IMMUNIZATION
                    </div>
                </div>

                <div style="position: relative; margin: 10px 0 30px 0; padding: 0 5px;">
                    <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 10px; z-index: 1;"></div>
                    <div class="vax-slider-track" style="position: absolute; top: 18px; left: 10%; width: ${stage * 26.6}%; height: 6px; background: linear-gradient(90deg, var(--brand-pink), var(--brand-cyan)); border-radius: 10px; z-index: 1; transition: width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
                    
                    <div style="display: flex; justify-content: space-between; position: relative; z-index: 2;">
                        ${stages.map((lbl, i) => `
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                <div style="width: ${i === stage ? '40px' : '28px'}; height: ${i === stage ? '40px' : '28px'}; font-size: ${i === stage ? '22px' : '16px'}; border-radius: 50%; background: ${i === stage ? 'var(--bg-surface)' : 'rgba(0,0,0,0.5)'}; border: ${i === stage ? '2px solid var(--brand-cyan)' : '1px solid rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: center; color: ${i < stage ? 'var(--text-muted)' : i === stage ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.2)'}; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); ${i === stage ? 'box-shadow: 0 0 20px rgba(0,229,255,0.3), inset 0 0 10px rgba(0,229,255,0.2); transform: translateY(-3px);' : ''}">
                                    ${milestoneIcons[i]}
                                </div>
                                <div style="font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: ${i === stage ? '#fff' : 'rgba(255,255,255,0.4)'}; letter-spacing: 0.5px; transition: color 0.4s;">${lbl}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                    ${list.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px 15px; border-radius: 12px;">
                            <div>
                                <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${item.n}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${item.d}</div>
                            </div>
                            <span class="badge-glow" style="color: var(--brand-pink); border: 1px solid rgba(255, 51, 102, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; background: rgba(255, 51, 102, 0.1);">[DUE NOW]</span>
                        </div>
                    `).join('')}
                </div>

                <div onclick="document.getElementById('vaxFlipCard').classList.add('is-flipped')" style="cursor: pointer; background: rgba(0,0,0,0.4); border: 1px solid rgba(0, 229, 255, 0.2); padding: 14px 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(0, 229, 255, 0.08)'" onmouseout="this.style.background='rgba(0,0,0,0.4)'">
                    <div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: var(--brand-cyan); text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">Upcoming</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${upcTitle} <span style="font-weight:400; color:var(--text-muted); font-size:0.8rem;">(${upcDesc})</span></div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">
                        ${iconCalendar} ${upcDate}
                    </div>
                </div>
            </div>

            <div class="vax-face-back">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-soft); padding-bottom: 12px; margin-bottom: 15px;">
                    <div style="font-weight: 800; color: #fff; font-size: 0.95rem;"><i class="ph-duotone ph-table"></i> NIS Reference</div>
                    <button onclick="document.getElementById('vaxFlipCard').classList.remove('is-flipped')" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕ Close</button>
                </div>
                <table style="width: 100%; font-size: 0.85rem; text-align: left; border-collapse: collapse;">
                    <thead><tr style="color: var(--brand-pink); border-bottom: 1px solid rgba(255, 51, 102, 0.3);"><th style="padding: 10px 4px;">Age</th><th style="padding: 10px 4px;">Vaccines</th></tr></thead>
                    <tbody>
                        <tr><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:var(--brand-cyan); font-weight:bold;">Birth</td><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:#fff;">BCG, OPV-0, Hep B-0</td></tr>
                        <tr><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:var(--brand-cyan); font-weight:bold;">6, 10, 14 Wks</td><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:#fff;">OPV 1-3, Pentavalent 1-3, RVV 1-3, fIPV 1-2</td></tr>
                        <tr><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:var(--brand-cyan); font-weight:bold;">9-12 Mos</td><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:#fff;">Measles/MR 1, JE 1, PCV Booster</td></tr>
                        <tr><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:var(--brand-cyan); font-weight:bold;">16-24 Mos</td><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:#fff;">MR 2, JE 2, DPT B1, OPV B</td></tr>
                        <tr><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:var(--brand-cyan); font-weight:bold;">5-6 Yrs</td><td style="padding: 10px 4px; border-bottom: 1px solid var(--border-soft); color:#fff;">DPT Booster 2</td></tr>
                        <tr><td style="padding: 10px 4px; color:var(--brand-cyan); font-weight:bold;">10 & 16 Yrs</td><td style="padding: 10px 4px; color:#fff;">Td (Tetanus, Diphtheria)</td></tr>
                    </tbody>
                </table>
            </div>

        </div>
    </div>`;
    
    vaxContainer.innerHTML = html;
};

// ==========================================
// 6. GROWTH SNAPSHOT TELEMETRY & TRIAGE MATH
// ==========================================
window.renderGrowthSnapshot = function(totalMonths, weightInKg) {
    const wt = parseFloat(weightInKg) || 0;
    
    // 1. Empty state
    if (wt <= 0) {
        if (typeof window.updateGrowthSnapshot === 'function') window.updateGrowthSnapshot(0, 0);
        const badge = document.getElementById('liveSeverityText');
        const icon = document.getElementById('liveSeverityIcon');
        if(badge) badge.innerText = "AWAITING WEIGHT";
        if(icon) icon.innerText = "⏳";
        
        const card = document.getElementById('growthSnapshotCard');
        if(card) {
            card.className = 'bento-card'; 
            card.style.borderColor = 'rgba(255,255,255,0.1)';
        }
        return;
    }

    // 2. WHO Z-SCORE MATH 
    const estimated50th = (totalMonths < 12) ? (totalMonths * 0.5 + 3.3) : (totalMonths * 0.2 + 8);
    let simulatedZScore = ((wt - estimated50th) / (estimated50th * 0.1)); 
    
    if (simulatedZScore > 3.0) simulatedZScore = 3.0;
    if (simulatedZScore < -6.0) simulatedZScore = -6.0;

    // 3. Fire the UI Engine and pass the Weight!
    if (typeof window.updateGrowthSnapshot === 'function') {
        window.updateGrowthSnapshot(simulatedZScore, wt);
    }
};

window.updateGrowthSnapshot = function(zScore, wt) {
    const card = document.getElementById('growthSnapshotCard');
    const zText = document.getElementById('liveZScore');
    const badgeText = document.getElementById('liveSeverityText');
    const badgeIcon = document.getElementById('liveSeverityIcon');
    const marker = document.getElementById('liveScaleMarker');

    if (!card || !zText) return;

    const formattedZ = (zScore > 0 ? '+' : '') + parseFloat(zScore).toFixed(2);
    zText.innerText = formattedZ;

    card.classList.remove('growth-state-severe', 'growth-state-moderate', 'growth-state-mild', 'growth-state-normal', 'growth-state-high');

    let cssVarColor = "";
    if (zScore <= -3.0) {
        card.classList.add('growth-state-severe');
        badgeIcon.innerText = '🚨'; badgeText.innerText = 'Severe (SAM)';
        cssVarColor = "var(--sev-severe)";
    } else if (zScore <= -2.0) {
        card.classList.add('growth-state-moderate');
        badgeIcon.innerText = '⚠️'; badgeText.innerText = 'Moderate (MAM)';
        cssVarColor = "var(--sev-moderate)";
    } else if (zScore <= -1.0) {
        card.classList.add('growth-state-mild');
        badgeIcon.innerText = '🔔'; badgeText.innerText = 'Mild Risk';
        cssVarColor = "var(--sev-mild)";
    } else if (zScore <= 2.0) {
        card.classList.add('growth-state-normal');
        badgeIcon.innerText = '✅'; badgeText.innerText = 'Normal';
        cssVarColor = "var(--sev-normal)";
    } else {
        card.classList.add('growth-state-high');
        badgeIcon.innerText = '📈'; badgeText.innerText = 'High (> +2 SD)';
        cssVarColor = "var(--sev-high)";
    }

    let clampedZ = Math.max(-6, Math.min(zScore, 3)); 
    let percentage = ((clampedZ - (-6)) / 9) * 100;
    
    marker.style.left = `${percentage}%`;
    marker.style.background = cssVarColor;
    marker.style.boxShadow = `0 0 10px ${cssVarColor}`;

    // ==========================================
    // 🚀 WHO TRIAGE PROTOCOL & F-75 CALCULATOR
    // ==========================================
    let tray = document.getElementById('whoTriageTray');
    if (!tray) {
        tray = document.createElement('div');
        tray.id = 'whoTriageTray';
        tray.className = 'triage-tray-hidden';
        card.appendChild(tray);
    }

    if (zScore <= -3.0) {
        // F-75 WHO Target Math (130 mL/kg/day Phase 1)
        const f75Daily = (wt * 130).toFixed(0);
        const f75TwoHour = (wt * 11).toFixed(0);
        const f75ThreeHour = (wt * 16).toFixed(0);

        tray.className = 'triage-tray-active triage-sam';
        tray.innerHTML = `
            <div class="triage-header">🚨 SAM WHO Protocol Activated</div>
            <label class="triage-item"><input type="checkbox"> Check for bilateral pitting edema</label>
            <label class="triage-item"><input type="checkbox"> Assess Appetite (RUTF Test)</label>
            <label class="triage-item"><input type="checkbox"> Medical Complications? (Lethargy, Fever)</label>
            
            <div class="triage-action-btn" onclick="document.getElementById('samMathData').style.display='block'; this.style.display='none';">Calculate F-75 Formula Drip ➔</div>
            
            <div id="samMathData" style="display:none; margin-top: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255, 51, 102, 0.4); padding: 12px; border-radius: 8px; animation: slideUpFade 0.3s ease forwards;">
                <div style="font-size: 0.7rem; color: var(--brand-pink); font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Phase 1: F-75 Target (${wt} kg)</div>
                <div style="display:flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
                    <span style="font-size: 0.8rem; color: #fff; font-weight: 600;">Total 24h Volume</span>
                    <span style="font-size: 1rem; color: var(--brand-pink); font-weight: 800;">${f75Daily} <span style="font-size: 0.7rem;">mL/day</span></span>
                </div>
                <div style="display:flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 600;">2-Hourly (12 Feeds)</span>
                    <span style="font-size: 0.95rem; color: #fff; font-weight: 800;">${f75TwoHour} <span style="font-size: 0.7rem;">mL/feed</span></span>
                </div>
                <div style="display:flex; justify-content: space-between;">
                    <span style="font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 600;">3-Hourly (8 Feeds)</span>
                    <span style="font-size: 0.95rem; color: #fff; font-weight: 800;">${f75ThreeHour} <span style="font-size: 0.7rem;">mL/feed</span></span>
                </div>
            </div>
        `;
    } else if (zScore <= -2.0) {
        // MAM Target Math (Plumpy'Sup standard logic)
        const rusfDose = wt < 8 ? "1 Sachet/Day" : "2 Sachets/Day";
        
        tray.className = 'triage-tray-active triage-mam';
        tray.innerHTML = `
            <div class="triage-header">⚠️ MAM Protocol Activated</div>
            <label class="triage-item"><input type="checkbox"> Assess for underlying infections</label>
            <label class="triage-item"><input type="checkbox"> Schedule 14-Day Weight Follow-up</label>
            
            <div class="triage-action-btn" style="border-color: rgba(255, 171, 0, 0.4); color: #FFAB00;" onclick="document.getElementById('mamMathData').style.display='block'; this.style.display='none';">Calculate RUSF Target ➔</div>

            <div id="mamMathData" style="display:none; margin-top: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255, 171, 0, 0.4); padding: 12px; border-radius: 8px; animation: slideUpFade 0.3s ease forwards;">
                <div style="font-size: 0.7rem; color: #FFAB00; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Target Formulation (${wt} kg)</div>
                <div style="font-size: 1rem; color: #fff; font-weight: 800;">${rusfDose} <span style="font-size:0.75rem; color: rgba(255,255,255,0.5);">(500-1000 kcal)</span></div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 4px;">Ready-to-Use Supplementary Food (Plumpy'Sup)</div>
            </div>
        `;
    } else {
        tray.className = 'triage-tray-hidden';
        tray.innerHTML = ''; 
    }
};

// 7. VITALS & FLUIDS TELEMETRY (Patient Mode Engine)
window.renderVitalsAndFluids = function(totalMonths, weightInKg) {
    const vitalsContainer = document.getElementById('hudVitalsOutput');
    const fluidsContainer = document.getElementById('hudFluidsOutput');
    const ageCtx = document.getElementById('vitalsAgeContext');
    
    if (!vitalsContainer || !fluidsContainer) return;

    const wt = parseFloat(weightInKg) || 0;

    // --- 1. AGE CONTEXT & PALS RANGES ---
    let ageLabel = "0-1 Mos";
    let hrMin = 100, hrMax = 205, rrMin = 30, rrMax = 60, bpMin = 60, bpMax = 90;
    
    if (totalMonths > 144) { ageLabel = "> 12 Yrs"; hrMin=60; hrMax=100; rrMin=12; rrMax=20; bpMin=110; bpMax=130; }
    else if (totalMonths > 60) { ageLabel = "6-12 Yrs"; hrMin=75; hrMax=118; rrMin=18; rrMax=25; bpMin=97; bpMax=120; }
    else if (totalMonths > 36) { ageLabel = "3-5 Yrs"; hrMin=80; hrMax=120; rrMin=20; rrMax=28; bpMin=89; bpMax=112; }
    else if (totalMonths > 12) { ageLabel = "1-3 Yrs"; hrMin=98; hrMax=140; rrMin=22; rrMax=37; bpMin=85; bpMax=105; }
    else if (totalMonths >= 1) { ageLabel = "1-12 Mos"; hrMin=100; hrMax=190; rrMin=30; rrMax=53; bpMin=70; bpMax=105; }
    
    if(ageCtx) ageCtx.innerText = `NORMALS: ${ageLabel.toUpperCase()}`;

    // --- 2. FLUIDS LOGIC (4-2-1 Rule Breakdown) ---
    if (wt <= 0) {
        fluidsContainer.innerHTML = `<div class="hud-empty-state" style="border:none; padding: 0;">Enter Weight for Maintenance Fluids.</div>`;
    } else {
        let mlPerHour = 0;
        let ruleBreakdown = "";
        
        if (wt <= 10) {
            mlPerHour = wt * 4;
            ruleBreakdown = `${wt.toFixed(1)}kg × 4`;
        } else if (wt <= 20) {
            mlPerHour = 40 + ((wt - 10) * 2);
            ruleBreakdown = `40 + (${(wt-10).toFixed(1)}kg × 2)`;
        } else {
            mlPerHour = 60 + ((wt - 20) * 1);
            ruleBreakdown = `60 + (${(wt-20).toFixed(1)}kg × 1)`;
        }
        
        let mlPerDay = mlPerHour * 24;

        fluidsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                <div style="text-align: left;">
                    <div style="font-size: 0.7rem; color: var(--brand-cyan); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Hourly Infusion</div>
                    <div style="font-size: 2.2rem; font-weight: 900; color: #fff; line-height: 1; margin-top: 4px; text-shadow: 0 0 15px rgba(0, 229, 255, 0.4);"><span id="animFluidHour" data-decimals="1">${mlPerHour.toFixed(1)}</span> <span style="font-size: 0.9rem; color: rgba(255,255,255,0.5);">mL/hr</span></div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">24h Target</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #a78bfa;"><span id="animFluidDay" data-decimals="0">${mlPerDay.toFixed(0)}</span> <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">mL/day</span></div>
                </div>
            </div>
            <div style="font-size: 0.65rem; color: rgba(255,255,255,0.6); text-align: left; background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2); padding: 4px 8px; border-radius: 6px; display: inline-block;">
                ⚙️ <b>4-2-1 Math:</b> ${ruleBreakdown} = ${mlPerHour.toFixed(1)} mL/hr
            </div>
        `;
    }

    // --- 3. PATIENT MODE VITALS INPUTS ---
    // Only redraw the inputs if the child's age bracket actually changes. 
    // This prevents wiping the doctor's inputs if they are just scrubbing the weight slider!
    if (vitalsContainer.dataset.ageBracket !== ageLabel) {
        vitalsContainer.dataset.ageBracket = ageLabel;
        vitalsContainer.innerHTML = `
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Clinical Assessment</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                
                <!-- HR Input -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center; transition: all 0.3s ease;">
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 800;">HR <span style="font-weight:600">(${hrMin}-${hrMax})</span></div>
                    <input type="number" placeholder="--" data-min="${hrMin}" data-max="${hrMax}" data-type="hr" oninput="window.evaluateVital(this)" style="width: 100%; text-align: center; background: transparent; border: none; font-size: 1.4rem; font-weight: 800; color: #fff; outline: none; margin-top: 4px; padding: 0; transition: color 0.3s;">
                    <div class="vital-status" style="font-size: 0.65rem; font-weight: 800; margin-top: 6px; min-height: 12px; transition: color 0.3s;"></div>
                </div>

                <!-- RR Input -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center; transition: all 0.3s ease;">
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 800;">RR <span style="font-weight:600">(${rrMin}-${rrMax})</span></div>
                    <input type="number" placeholder="--" data-min="${rrMin}" data-max="${rrMax}" data-type="rr" oninput="window.evaluateVital(this)" style="width: 100%; text-align: center; background: transparent; border: none; font-size: 1.4rem; font-weight: 800; color: #fff; outline: none; margin-top: 4px; padding: 0; transition: color 0.3s;">
                    <div class="vital-status" style="font-size: 0.65rem; font-weight: 800; margin-top: 6px; min-height: 12px; transition: color 0.3s;"></div>
                </div>

                <!-- Sys BP Input -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center; transition: all 0.3s ease;">
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 800;">Sys BP <span style="font-weight:600">(${bpMin}-${bpMax})</span></div>
                    <input type="number" placeholder="--" data-min="${bpMin}" data-max="${bpMax}" data-type="bp" oninput="window.evaluateVital(this)" style="width: 100%; text-align: center; background: transparent; border: none; font-size: 1.4rem; font-weight: 800; color: #fff; outline: none; margin-top: 4px; padding: 0; transition: color 0.3s;">
                    <div class="vital-status" style="font-size: 0.65rem; font-weight: 800; margin-top: 6px; min-height: 12px; transition: color 0.3s;"></div>
                </div>

            </div>
        `;
    }
};

// 🚀 NEW: CLINICAL VITAL EVALUATOR
window.evaluateVital = function(inputEl) {
    const val = parseFloat(inputEl.value);
    const min = parseFloat(inputEl.dataset.min);
    const max = parseFloat(inputEl.dataset.max);
    const type = inputEl.dataset.type;
    const statusDiv = inputEl.nextElementSibling;
    const parentDiv = inputEl.parentElement;

    // Reset if cleared
    if (isNaN(val)) {
        statusDiv.innerText = '';
        inputEl.style.color = '#fff';
        parentDiv.style.borderColor = 'rgba(255,255,255,0.05)';
        parentDiv.style.background = 'rgba(0,0,0,0.3)';
        parentDiv.style.boxShadow = 'none';
        return;
    }

    let status = "✓ Normal";
    let color = "var(--success)";
    let bg = "rgba(16, 185, 129, 0.1)";

    // Clinical Logic
    if (val < min) {
        color = "#3b82f6"; // Blue for Low
        bg = "rgba(59, 130, 246, 0.15)";
        if (type === 'hr') status = "↓ Bradycardia";
        else if (type === 'rr') status = "↓ Bradypnea";
        else if (type === 'bp') status = "↓ Hypotension";
    } else if (val > max) {
        color = "var(--danger)"; // Red for High
        bg = "rgba(239, 68, 68, 0.15)";
        if (type === 'hr') status = "↑ Tachycardia";
        else if (type === 'rr') status = "↑ Tachypnea";
        else if (type === 'bp') status = "↑ Hypertension";
    }

    // Apply UI States
    statusDiv.innerText = status;
    statusDiv.style.color = color;
    inputEl.style.color = color;
    parentDiv.style.borderColor = `rgba(${color === 'var(--success)' ? '16,185,129' : color === 'var(--danger)' ? '239,68,68' : '59,130,246'}, 0.4)`;
    parentDiv.style.background = bg;
    parentDiv.style.boxShadow = `inset 0 0 15px ${bg}`;
};


// 8. ANTHROPOMETRY & NUTRITION TELEMETRY (Digital MUAC Tape)
window.renderAnthropometry = function() {
    const container = document.getElementById('hudAnthroOutput');
    const card = document.getElementById('bentoNutrition');
    const icon = document.getElementById('nutriCardIcon');
    if (!container || !card || !icon) return;

    // Safely pull values from the DOM
    const ageYrsEl = document.getElementById('hudAgeYrs');
    const ageMosEl = document.getElementById('hudAgeMos');
    const totalMonths = (parseInt(ageYrsEl ? ageYrsEl.value : 0) || 0) * 12 + (parseInt(ageMosEl ? ageMosEl.value : 0) || 0);
    
    const hcEl = document.getElementById('hudHc');
    const macEl = document.getElementById('hudMac');
    const hc = hcEl ? parseFloat(hcEl.value) || 0 : 0;
    const mac = macEl ? parseFloat(macEl.value) || 0 : 0;

    // Empty State Reset
    if (hc <= 0 && mac <= 0) {
        container.innerHTML = `<div class="hud-empty-state" style="border:none;">Open top drawer (⌄) to enter HC & MAC.</div>`;
        card.style.borderColor = 'rgba(255,255,255,0.08)';
        card.style.boxShadow = 'inset 0 2px 15px rgba(0,0,0,0.2), 0 8px 25px rgba(0,0,0,0.4)';
        icon.style.background = 'rgba(255,255,255,0.1)';
        icon.style.color = 'var(--text-muted)';
        icon.innerText = '🛡️';
        return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 15px;">`;

    // --- 1. DIGITAL MUAC TAPE (ACUTE TRIAGE) ---
    if (mac > 0) {
        let status = "NORMAL NUTRITION";
        let colorHex = "#10b981"; // Emerald Green
        let bgTint = "rgba(16, 185, 129, 0.15)";
        let badgeTxt = "Well nourished";
        
        if (mac < 11.5) {
            status = "SEVERE ACUTE MALNUTRITION";
            colorHex = "#ef4444"; // Red
            bgTint = "rgba(239, 68, 68, 0.15)";
            badgeTxt = "SAM ALERT";
            icon.innerText = '🚨';
        } else if (mac >= 11.5 && mac < 12.5) {
            status = "MODERATE MALNUTRITION";
            colorHex = "#f97316"; // Orange
            bgTint = "rgba(249, 115, 22, 0.15)";
            badgeTxt = "MAM ALERT";
            icon.innerText = '⚠️';
        } else if (mac >= 12.5 && mac < 13.5) {
            status = "NUTRITIONALLY AT RISK";
            colorHex = "#eab308"; // Yellow
            bgTint = "rgba(234, 179, 8, 0.15)";
            badgeTxt = "MONITOR";
            icon.innerText = '🛡️';
        } else {
            icon.innerText = '✅';
        }

        // Apply Clinical Aura to the Card
        card.style.borderColor = `rgba(${colorHex.match(/\w\w/g).map(x=>parseInt(x,16)).join(',')}, 0.4)`;
        card.style.boxShadow = `inset 0 0 20px ${bgTint}, 0 8px 25px rgba(0,0,0,0.4)`;
        icon.style.background = bgTint;
        icon.style.color = colorHex;

        // Calculate Scale Marker (Bounds: 9.0cm to 16.0cm)
        let clampedMac = Math.max(9.0, Math.min(mac, 16.0));
        let percentage = ((clampedMac - 9.0) / (16.0 - 9.0)) * 100;

        const isStandardAge = (totalMonths >= 6 && totalMonths <= 59);
        const ageWarning = !isStandardAge ? `<div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 5px;">(Age outside 6-59mo WHO standard)</div>` : '';

        html += `
        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Diagnostic Triage</div>
                    <div style="font-size: 1.1rem; font-weight: 900; color: ${colorHex}; letter-spacing: -0.5px; margin-top: 2px;">${status}</div>
                </div>
                <div style="background: ${bgTint}; border: 1px solid ${colorHex}; color: ${colorHex}; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">
                    ${badgeTxt}
                </div>
            </div>

            <div style="position: relative; width: 100%; margin-top: 10px; margin-bottom: 5px;">
                <div style="display: flex; width: 100%; height: 8px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.1);">
                    <div style="width: 35.7%; background: var(--sev-severe);"></div>   <div style="width: 14.3%; background: var(--sev-moderate);"></div> <div style="width: 14.3%; background: var(--sev-mild);"></div>     <div style="width: 35.7%; background: var(--sev-normal);"></div>   </div>
                <div style="position: absolute; top: -4px; left: ${percentage}%; width: 16px; height: 16px; background: #fff; border: 3px solid ${colorHex}; border-radius: 50%; transform: translateX(-50%); box-shadow: 0 0 10px ${colorHex}; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700; margin-top: 8px;">
                <span><span style="color: ${colorHex}; font-size: 0.9rem;">${mac}</span> cm</span>
                <span>WHO Scale</span>
            </div>
            ${ageWarning}
        </div>`;
    }

    // --- 2. HEAD CIRCUMFERENCE (NEUROLOGY) ---
    if (hc > 0) {
        // (Placeholder Logic: Replace with real clinical curves later)
        let hcStatus = "Appropriate for Age";
        let hcColor = "var(--brand-cyan)";
        let hcBg = "rgba(0, 229, 255, 0.1)";
        let hcIcon = "✓";
        
        // Demo logic: If HC is unusually small for older infant, or large for newborn
        if (hc < 42 && totalMonths > 6) { hcStatus = "⚠ Microcephaly Risk"; hcColor = "var(--sev-severe)"; hcBg = "rgba(239, 68, 68, 0.15)"; hcIcon = "⚠"; }
        if (hc > 50 && totalMonths < 6) { hcStatus = "⚠ Macrocephaly Risk"; hcColor = "var(--sev-moderate)"; hcBg = "rgba(249, 115, 22, 0.15)"; hcIcon = "⚠"; }

        html += `
        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Head Circumference</div>
                <div style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 2px;">${hc} <span style="font-size: 0.8rem; color: var(--text-muted);">cm</span></div>
            </div>
            <div style="text-align: right;">
                <div style="background: ${hcBg}; border: 1px solid ${hcColor}; color: ${hcColor}; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                    ${hcIcon} ${hcStatus}
                </div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 6px;">Neurological Tracker</div>
            </div>
        </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
};

// ==========================================
// 6. HIGH-FIDELITY MILESTONES DATA ENGINE (Timeline Architecture)
// ==========================================
window.renderMilestonesAndRedFlags = function(totalMonths) {
    // 1. Telemetry Sync Engine
    let tm = parseFloat(totalMonths);
    if (isNaN(tm) || tm === 0) {
        const ageDisplay = document.getElementById('anchorAgeDisplay');
        if (ageDisplay) {
            let ageText = ageDisplay.textContent || "0Y 0M";
            tm = ((parseInt((ageText.match(/(\d+)Y/) || [])[1]) || 0) * 12) + (parseInt((ageText.match(/(\d+)M/) || [])[1]) || 0);
        }
    }
    if (isNaN(tm)) {
        tm = ((parseInt(document.getElementById('hudAgeYrs')?.value) || 0) * 12) + (parseInt(document.getElementById('hudAgeMos')?.value) || 0);
    }

    // 2. Local Independent Reference Database
    const msDb = window.milestonesDb || {
        2: [ { id: "m2_1", domain: "Social", text: "Social smile.", sig: "Social engagement delay" }, { id: "m2_2", domain: "Motor", text: "Holds head up briefly.", sig: "Gross motor delay / Hypotonia" } ],
        4: [ { id: "m4_1", domain: "Motor", text: "Rolls front to back.", sig: "Gross motor delay" }, { id: "m4_2", domain: "Lang", text: "Babbles/Coos.", sig: "Speech / Hearing loss" } ],
        6: [ { id: "m6_1", domain: "Motor", text: "Sits with support.", sig: "Gross motor delay" }, { id: "m6_2", domain: "Lang", text: "Responds to sounds.", sig: "Hearing / Neuro evaluation" } ],
        9: [ { id: "m9_1", domain: "Motor", text: "Pincer grasp.", sig: "Fine motor delay" }, { id: "m9_2", domain: "Motor", text: "Pulls to stand.", sig: "Gross motor delay" }, { id: "m9_3", domain: "Lang", text: "Responds to name.", sig: "Hearing / ASD risk" } ],
        12: [ { id: "m12_1", domain: "Lang", text: "1-2 words.", sig: "Speech delay / Hearing loss" }, { id: "m12_2", domain: "Motor", text: "Cruises/Walks.", sig: "Gross motor delay" }, { id: "m12_3", domain: "Social", text: "Points to objects.", sig: "ASD risk" } ],
        18: [ { id: "m18_1", domain: "Motor", text: "Walks alone.", sig: "Neuro evaluation required" }, { id: "m18_2", domain: "Lang", text: "10-15 words.", sig: "Speech delay" } ],
        24: [ { id: "m24_1", domain: "Lang", text: "2-word sentences.", sig: "Speech / Cognitive delay" }, { id: "m24_2", domain: "Motor", text: "Runs well.", sig: "Gross motor delay" } ]
    };

    const availableMonths = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60];
    
    // Calculate Current and Next Milestones
    let targetMonth = 0;   // Used for the Front Face
    let nextMonth = null;  // Used for the Back Face upcoming milestone
    
    for (let i = 0; i < availableMonths.length; i++) {
        if (availableMonths[i] <= tm) {
            targetMonth = availableMonths[i];
        } else {
            nextMonth = availableMonths[i];
            break;
        }
    }

    // ==========================================
    // 3. FRONT FACE DATA BINDING (Intelligence Core)
    // ==========================================
    const badge = document.getElementById('msAgeBadge');
    const countBadge = document.getElementById('msRadarCount');
    const langEl = document.getElementById('msLangText');
    const cogEl = document.getElementById('msCogText');
    const socEl = document.getElementById('msSocText');

    if (badge) badge.innerText = (targetMonth > 0 ? targetMonth + 'M CHECKPOINT' : 'INITIALIZING');
    let targets = Array.isArray(msDb[targetMonth]) ? msDb[targetMonth] : [];
    if (countBadge) countBadge.innerText = targets.length || 0;

    if (targets && targets.length > 0) {
        const langItem = targets.find(m => m.domain === 'Lang' || m.domain === 'Language');
        const socItem = targets.find(m => m.domain === 'Social');
        const cogItem = targets.find(m => m.domain === 'Cognitive') || targets.find(m => m.domain === 'Motor'); 

        if (langEl) langEl.innerText = langItem ? langItem.text : "Monitoring...";
        if (cogEl) cogEl.innerText = cogItem ? cogItem.text : "Monitoring...";
        if (socEl) socEl.innerText = socItem ? socItem.text : "Monitoring...";
    } else {
        if (langEl) langEl.innerText = "Awaiting parameters...";
        if (cogEl) cogEl.innerText = "Awaiting parameters...";
        if (socEl) socEl.innerText = "Awaiting parameters...";
    }

    // ==========================================
    // 4. BACK FACE DATA BINDING (Timeline Scanner)
    // ==========================================
    const scannerContent = document.getElementById('milestonesScannerContent');
    if (!scannerContent) return;

    if (tm === 0) {
        scannerContent.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 20px; font-size:0.85rem;">Scrub active age matrix to compile timeline.</div>`;
        return;
    }

    // A. Top Summary Dashboard
    let backFaceHTML = `
        <div style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; gap: 12px; align-items: center;">
                <div style="width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--brand-cyan); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--brand-cyan); background: rgba(0,229,255,0.05); box-shadow: inset 0 0 10px rgba(0,229,255,0.2);">👶</div>
                <div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Current Age</div>
                    <div style="font-size: 1.3rem; color: #fff; font-weight: 900; line-height: 1;">${tm} MONTHS</div>
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 2px;">Adjusted Age Map</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-bottom: 5px;">Domains</div>
                <div style="display: flex; gap: 4px; justify-content: flex-end;">
                    <span style="font-size: 0.6rem; color: var(--brand-cyan); padding: 2px 6px; border-radius: 4px; font-weight: 800; background: rgba(0,229,255,0.1);">Motor</span>
                    <span style="font-size: 0.6rem; color: #a855f7; padding: 2px 6px; border-radius: 4px; font-weight: 800; background: rgba(168, 85, 247, 0.1);">Lang</span>
                    <span style="font-size: 0.6rem; color: var(--brand-pink); padding: 2px 6px; border-radius: 4px; font-weight: 800; background: rgba(255, 51, 102, 0.1);">Social</span>
                </div>
            </div>
        </div>
        
        <div style="position: relative; padding-left: 28px; padding-bottom: 20px;">
            <div style="position: absolute; top: 15px; bottom: 0; left: 8px; width: 2px; background: linear-gradient(to bottom, rgba(0,229,255,0.3) 0%, rgba(255,255,255,0.05) 100%); z-index: 1;"></div>
    `;

    let listsRendered = 0;

    // B. Build the Timeline Nodes
    availableMonths.forEach(month => {
        // Only render past/current milestones, PLUS the immediate next upcoming milestone
        if (month <= tm || month === nextMonth) {
            if (!Array.isArray(msDb[month]) || msDb[month].length === 0) return;
            listsRendered++;

            const isFuture = month > tm;
            const isCurrent = month === targetMonth;
            
            // Timeline Node Styling
            const nodeColor = isFuture ? 'rgba(255,255,255,0.2)' : 'var(--brand-cyan)';
            const nodeBg = isCurrent ? 'var(--brand-cyan)' : (isFuture ? '#0A0F1C' : 'rgba(0,229,255,0.2)');
            const nodeBorder = isCurrent ? '3px solid rgba(0,229,255,0.4)' : (isFuture ? '2px solid rgba(255,255,255,0.2)' : '2px solid var(--brand-cyan)');
            const nodeGlow = isCurrent ? 'box-shadow: 0 0 15px var(--brand-cyan);' : '';
            const textColor = isFuture ? 'rgba(255,255,255,0.4)' : (isCurrent ? '#fff' : 'rgba(255,255,255,0.8)');

            backFaceHTML += `
                <div style="position: relative; z-index: 2; margin-top: ${isCurrent ? '25px' : '15px'}; margin-bottom: 15px;">
                    <div style="position: absolute; left: -25px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: ${nodeBg}; border: ${nodeBorder}; ${nodeGlow}"></div>
                    <div style="font-size: 0.8rem; font-weight: 900; color: ${nodeColor}; letter-spacing: 1px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                        ${month} MONTHS 
                        ${isCurrent ? '<span style="color:var(--brand-cyan); background:rgba(0,229,255,0.1); padding:2px 8px; border-radius:10px; border:1px solid rgba(0,229,255,0.2); font-size:0.6rem;">CURRENT TARGET</span>' : ''}
                        ${isFuture ? '<span style="color:rgba(255,255,255,0.4); font-size:0.6rem;">UPCOMING</span>' : ''}
                    </div>
                </div>
            `;

            // C. Build the Milestone Cards for this month
            msDb[month].forEach(ms => {
                // Color Mapping per Domain
                let domColor = 'var(--brand-cyan)';
                let domBg = 'rgba(0,229,255,0.08)';
                let domIcon = '🏃';
                
                if (ms.domain === 'Language' || ms.domain === 'Lang') {
                    domColor = '#a855f7'; domBg = 'rgba(168, 85, 247, 0.08)'; domIcon = '🗣';
                } else if (ms.domain === 'Social') {
                    domColor = 'var(--brand-pink)'; domBg = 'rgba(255, 51, 102, 0.08)'; domIcon = '👫';
                }

                // Card Architecture
                backFaceHTML += `
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; gap: 12px; transition: all 0.2s; ${isFuture ? 'opacity: 0.5;' : ''} ${isCurrent ? 'border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);' : ''}">
                        
                        <div style="width: 38px; height: 38px; border-radius: 10px; background: ${domBg}; color: ${domColor}; display: flex; justify-content: center; align-items: center; font-size: 1.1rem; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.02);">
                            ${domIcon}
                        </div>

                        <div style="flex-grow: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                                <div style="font-size: 0.95rem; font-weight: 800; color: ${textColor}; line-height: 1.2;">${ms.text}</div>
                                <div style="font-size: 0.55rem; font-weight: 900; color: ${domColor}; border: 1px solid ${domColor}; border-radius: 4px; padding: 2px 6px; text-transform: uppercase; letter-spacing: 0.5px;">${ms.domain}</div>
                            </div>
                            
                            <div style="font-size: 0.75rem; color: #f59e0b; background: rgba(245, 158, 11, 0.05); border-left: 2px solid #f59e0b; padding: 5px 8px; border-radius: 0 6px 6px 0; display: inline-block;">
                                <span style="font-weight: 600; color: rgba(255,255,255,0.5);">Risk if absent:</span> <span style="font-weight: 700;">${ms.sig}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    });

    if (listsRendered === 0) {
        backFaceHTML += `<div style="color:var(--text-muted); text-align:center; padding: 20px; font-size:0.85rem;">No milestones mapped for this age bracket yet.</div>`;
    }

    backFaceHTML += `</div>`; // Close timeline wrapper

    scannerContent.innerHTML = backFaceHTML;
};

// 10. LAYER 2: FULL FORMULARY ENGINE
(() => {
const pediatricDrugDB = {
    antibiotics: [
        { id: "amox_200", name: "Amoxicillin", form: "200mg/5mL", doseCalc: (wt) => `${((40 * wt * 5 / 200) / 2).toFixed(1)} mL`, freq: "BD", notes: "Standard 40mg/kg/day" },
        { id: "amox_clav_228", name: "Amox-Clav", form: "228.5mg/5mL", doseCalc: (wt) => `${((40 * wt * 5 / 200) / 2).toFixed(1)} mL`, freq: "BD", notes: "Dosed on Amox component" },
        { id: "azithro_200", name: "Azithromycin", form: "200mg/5mL", doseCalc: (wt) => `${((10 * wt * 5) / 200).toFixed(1)} mL`, freq: "OD", notes: "10mg/kg/day for 3 days" },
        { id: "cefpodo_50", name: "Cefpodoxime", form: "50mg/5mL", doseCalc: (wt) => `${((10 * wt * 5 / 50) / 2).toFixed(1)} mL`, freq: "BD", notes: "10mg/kg/day divided BD" }
    ],
    antipyretics: [
        { id: "pcm_250", name: "Paracetamol", form: "250mg/5mL", doseCalc: (wt) => `${((15 * wt * 5) / 250).toFixed(1)} mL`, freq: "Q6H PRN", notes: "15mg/kg/dose" },
        { id: "ibu_100", name: "Ibuprofen", form: "100mg/5mL", doseCalc: (wt) => `${((10 * wt * 5) / 100).toFixed(1)} mL`, freq: "Q8H PRN", notes: "10mg/kg/dose. Avoid if <6mo" },
        { id: "mefenamic_50", name: "Mefenamic Acid", form: "50mg/5mL", doseCalc: (wt) => `${((8 * wt * 5) / 50).toFixed(1)} mL`, freq: "Q8H PRN", notes: "8mg/kg/dose" }
    ],
    antihistamines: [
        { id: "cetirizine_5", name: "Cetirizine", form: "5mg/5mL", doseCalc: (wt) => `${((0.25 * wt * 5) / 5).toFixed(1)} mL`, freq: "OD HS", notes: "0.25mg/kg/day" },
        { id: "levocetirizine_2.5", name: "Levocetirizine", form: "2.5mg/5mL", doseCalc: (wt) => `${((0.125 * wt * 5) / 2.5).toFixed(1)} mL`, freq: "OD HS", notes: "0.125mg/kg/day" }
    ],
    respiratory: [
        { id: "salbutamol_2", name: "Salbutamol Syrup", form: "2mg/5mL", doseCalc: (wt) => `${((0.15 * wt * 5) / 2).toFixed(1)} mL`, freq: "TDS", notes: "0.15mg/kg/dose" },
        { id: "levo_salbutamol_1", name: "Levosalbutamol", form: "1mg/5mL", doseCalc: (wt) => `${((0.05 * wt * 5) / 1).toFixed(1)} mL`, freq: "TDS", notes: "0.05mg/kg/dose" }
    ],
    git: [
        { id: "ondansetron_2", name: "Ondansetron", form: "2mg/5mL", doseCalc: (wt) => `${((0.15 * wt * 5) / 2).toFixed(1)} mL`, freq: "SOS", notes: "0.15mg/kg/dose" },
        { id: "domperidone_1", name: "Domperidone", form: "1mg/1mL Drop", doseCalc: (wt) => `${(0.2 * wt).toFixed(1)} mL`, freq: "TDS", notes: "0.2mg/kg/dose" },
        { id: "zinc_20", name: "Zinc Syrup", form: "20mg/5mL", doseCalc: (wt) => (wt < 10 ? "2.5 mL" : "5.0 mL"), freq: "OD x 14 Days", notes: "10mg if <6mo, 20mg if >6mo" }
    ],
    emergency: [
        { id: "adren_1_1000", name: "Adrenaline IM", form: "1:1000", doseCalc: (wt) => `${(0.01 * wt).toFixed(2)} mL`, freq: "STAT IM", notes: "Max 0.3 mL (Anaphylaxis)" },
        { id: "loraz_2", name: "Lorazepam IV", form: "2mg/mL", doseCalc: (wt) => `${((0.1 * wt) / 2).toFixed(2)} mL`, freq: "STAT IV", notes: "0.1mg/kg (Status Epilepticus)" }
    ]
};
})();

// 🚀 THE FIX: Force-refresh the database and map all categories dynamically
window.populateHudDrugs = function() {
    const catSelect = document.getElementById('hudQuickCat');
    const formSelect = document.getElementById('hudQuickForm');
    const resDiv = document.getElementById('hudQuickDoseRes');
    
    // 1. Get full database
    let db = (typeof window.getUnifiedDB === 'function') ? window.getUnifiedDB() : window.drugsDb;
    
    // 2. Build Category List Dynamically
    if (catSelect.options.length <= 1) { // Only build if empty
        const categories = [...new Set(db.map(d => d.category))]; // Get unique categories
        catSelect.innerHTML = '<option value="">-- Select Category --</option>';
        categories.sort().forEach(cat => {
            catSelect.innerHTML += `<option value="${cat}">${cat.toUpperCase()}</option>`;
        });
    }

    // 3. Filter Drugs based on selection
    const selectedCat = catSelect.value;
    formSelect.innerHTML = '<option value="">-- Select Drug --</option>';
    if (resDiv) resDiv.innerHTML = '';
    
    if (selectedCat) {
        db.filter(d => d.category === selectedCat)
          .sort((a,b) => a.name.localeCompare(b.name))
          .forEach(drug => {
              let opt = document.createElement('option');
              opt.value = drug.id;
              opt.innerText = drug.name;
              formSelect.appendChild(opt);
          });
    }
};

// ==========================================
// 🚀 STEP 4: PROGRESSIVE DISCLOSURE ENGINE
// ==========================================

// 1. THE EXPLORER TOGGLE (Cross-fades Zone A and Zone B)
window.toggleFormularyExplorer = function() {
    const zoneA = document.getElementById('zoneAQuickMode');
    const zoneB = document.getElementById('zoneBExplorerMode');
    const card = document.getElementById('layer1InstantDoses');
    
    if (!zoneA || !zoneB || !card) return;

    if (zoneB.style.display === 'none') {
        // Morph to Explorer Mode (Show Zone B)
        zoneA.style.opacity = '0';
        setTimeout(() => {
            zoneA.style.display = 'none';
            zoneB.style.display = 'block';
            card.classList.add('explorer-active'); // Add purple glow
            setTimeout(() => zoneB.style.opacity = '1', 50); 
        }, 300); // 300ms wait for fade out
    } else {
        // Morph back to Quick Mode (Show Zone A)
        zoneB.style.opacity = '0';
        setTimeout(() => {
            zoneB.style.display = 'none';
            zoneA.style.display = 'block';
            card.classList.remove('explorer-active'); // Remove purple glow
            setTimeout(() => zoneA.style.opacity = '1', 50);
        }, 300);
    }
};

// 🚀 THE FIX: Bulletproof Ignition Logic
window.checkLightningIgnition = function(forcedWeight = null) {
    const wtInput = document.getElementById('hudWeight');
    const btn = document.getElementById('lightningToggleBtn');
    const sub = document.getElementById('instantDoseSubtitle');
    
    if (!btn || !sub) return;
    
    // Check passed weight first, fallback to input, fallback to 0
    const wt = parseFloat(forcedWeight) || parseFloat(wtInput?.value) || 0;
    
    if (wt > 0) {
        btn.classList.add('is-ignited');
        // Matches the glowing yellow theme
        sub.innerHTML = `<span style="color: #facc15; font-weight: 800; text-shadow: 0 0 8px rgba(250,204,21,0.3);">✓ Weight: ${wt} kg</span>`;
    } else {
        btn.classList.remove('is-ignited');
        sub.innerHTML = 'Awaiting Weight...';
    }
};

// 🚀 GLOBAL SPOTLIGHT SEARCH ENGINE (Live Card Generator)
window.runGlobalSearch = function(query) {
    const q = query.toLowerCase();
    const container = document.getElementById('hudSmartDoseCards');
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;

    // 1. Safety Check: Need weight to generate cards
    if (wt <= 0) {
        container.innerHTML = `<div class="hud-empty-state" style="width: 100%; border: 1px dashed rgba(0, 229, 255, 0.3) !important; background: rgba(0,0,0,0.2) !important; border-radius: 12px !important; text-align: left; padding: 15px !important; color: rgba(255,255,255,0.6) !important;">⚠️ Scrub Weight at the top to unlock searches...</div>`;
        return;
    }

    // 2. If search is cleared, restore the default "Quick 10" scroll
    if (!q || q.length < 2) {
        if (typeof renderInstantDoses === 'function') {
            renderInstantDoses(wt);
        }
        return;
    }

    // 3. Fetch DB and find matches
    let db = (typeof window.getUnifiedDB === 'function') ? window.getUnifiedDB() : window.drugsDb;
    const matches = db.filter(d => d.name.toLowerCase().includes(q));

    if (matches.length === 0) {
        container.innerHTML = `<div class="hud-empty-state" style="width: 100%; border: 1px dashed var(--danger); text-align: left; padding: 15px; color: var(--danger); border-radius: 12px; background: rgba(255,0,0,0.1);">No drugs found matching "${query}"</div>`;
        return;
    }

    // 4. Inject scan line for visual feedback
    container.innerHTML = '<div class="cortex-scan-line"></div>';

    // 5. Generate fully calculated 3D Cards for the search results
    setTimeout(() => {
        let html = '';
        matches.sort((a,b) => a.name.localeCompare(b.name)).forEach((drug, index) => {
            let math = ClinicalMath.computeDose(drug, wt) || { reqMg: 0, reqVol: 0 };
            let unit = ClinicalMath.getUnit(drug);
            
            // Map Neon UI Colors based on category
            let color = "var(--brand-cyan)";
            if (drug.category === 'antibiotics') color = "var(--success)";
            else if (drug.category === 'respiratory') color = "#f97316";
            else if (drug.category === 'git') color = "#a855f7";
            else if (drug.category === 'antihistamines') color = "var(--brand-blue)";
            else if (drug.category === 'emergency') color = "var(--danger)";
            else if (drug.category === 'neurology') color = "#8b5cf6";
            else if (drug.category === 'vitamins') color = "#eab308";
            else if (drug.category === 'topical') color = "#14b8a6";

            const displayFreq = typeof window.translateFreqToLocal === 'function' ? window.translateFreqToLocal(drug.defaultFreq) : drug.defaultFreq;
            let doseStr = `${drug.doseMg} ${drug.doseType === 'perDay' ? 'mg/kg/day' : (drug.doseType === 'fixed' ? 'mg stat' : 'mg/kg')}`;
            let formStr = drug.conc ? `${drug.conc}mg/${drug.vol}${unit.replace('s','')}` : `${drug.doseMg}mg`;
            let badgeHtml = drug.isCustom ? `<div style="position: absolute; top: -10px; right: -10px; background: #e11d48; color: white; font-size: 0.55rem; font-weight: 900; padding: 4px 8px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.4); z-index: 10; border: 1px solid rgba(255,255,255,0.2);">LOCAL</div>` : '';

            html += `
            <div class="cortex-stagger-${(index % 4) + 1} instant-dose-card" style="--card-color: ${color}; position: relative; min-width: 155px; max-width: 175px; background: rgba(0, 0, 0, 0.5) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-top: 1px solid rgba(255,255,255,0.2) !important; border-radius: 14px !important; padding: 14px !important; border-left: 4px solid ${color} !important; flex-shrink: 0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3) !important;">
                ${badgeHtml}
                <div class="plasma-sweep-line" style="background: linear-gradient(90deg, transparent, ${color}, transparent); animation-delay: ${(index * 0.05) + 0.3}s;"></div>

                <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff !important; text-shadow: 0 0 8px rgba(255,255,255,0.2); letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${drug.name}">${drug.name}</div>
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6) !important; font-weight: 600; margin-bottom: 12px;">${doseStr} • ${formStr}</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <span class="breathing-digit" style="font-family: 'SF Mono', 'Roboto Mono', ui-monospace, monospace; font-size: 2.1rem; font-weight: 700; color: #f8fafc !important; line-height: 1; letter-spacing: -1.5px; text-shadow: none;">${math.reqVol.toFixed(1)}</span>
                        <span style="font-size: 0.85rem; color: ${color} !important; font-weight: 800; margin-left: 4px;">${unit}</span>
                    </div>
                    <div style="font-size: 0.7rem; font-weight: 800; color: ${color} !important; background: rgba(0,0,0,0.5) !important; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05) !important;">${displayFreq}</div>
                </div>

                <!-- NEW ADD TO RX BUTTON -->
                <button onclick="addToRxQueue('${drug.name}', '${formStr}', '${math.reqVol.toFixed(1)} ${unit}', '${drug.defaultFreq}')" 
                    style="width: 100%; margin-top: 10px; padding: 8px 0; border-radius: 6px; border: 1px solid rgba(0, 229, 255, 0.3); background: rgba(0, 229, 255, 0.1); color: var(--brand-cyan); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s ease;"
                    onmouseover="this.style.background='rgba(0, 229, 255, 0.2)'"
                    onmouseout="this.style.background='rgba(0, 229, 255, 0.1)'">
                    + ADD TO RX
                </button>

            </div>`;
        });
        
        container.innerHTML = html;
    }, 150); // Lightning fast 150ms render
};

// 🚀 UPDATED CALCULATOR (Button Removed)
window.runHudQuickDose = function() {
    const drugId = document.getElementById('hudQuickForm').value;
    const resDiv = document.getElementById('hudQuickDoseRes');
    const wt = parseFloat(document.getElementById('hudWeight').value) || 0;

    if (!drugId) { resDiv.innerHTML = ''; return; }
    if (wt <= 0) {
        resDiv.innerHTML = `<div style="padding: 15px; background: rgba(255, 176, 32, 0.1); color: var(--warning); border-radius: 12px; font-size: 0.85rem; font-weight: bold; margin-top: 15px; border: 1px dashed var(--warning);">⚠️ Please scrub the Weight at the top first.</div>`;
        return;
    }

    let db = (typeof window.getUnifiedDB === 'function') ? window.getUnifiedDB() : window.drugsDb;
    const drug = db.find(d => d.id === drugId);
    if (!drug) return;

    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    const displayFreq = typeof window.translateFreqToLocal === 'function' ? window.translateFreqToLocal(drug.defaultFreq) : drug.defaultFreq;

    resDiv.innerHTML = `
        <div class="calc-result-box">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Give Patient</div>
            <div class="calc-digit-display">
                ${math.reqVol.toFixed(1)} <span class="calc-unit-label">${unit}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Target: ${math.reqMg.toFixed(0)} mg/dose</div>
            <div style="font-size: 0.9rem; font-weight: 800; color: var(--brand-cyan); background: rgba(0, 229, 255, 0.15); padding: 5px 15px; border-radius: 20px; display: inline-block; border: 1px solid rgba(0, 229, 255, 0.2);">${displayFreq}</div>
            ${drug.warnings && drug.warnings.length > 0 ? `<div style="font-size: 0.75rem; color: var(--danger); font-weight: 600; border-top: 1px dashed var(--border-soft); padding-top: 8px; margin-top: 12px;">${drug.warnings.join('<br>')}</div>` : ''}
        </div>
    `;
};

// --- DYNAMIC DASHBOARD WIDGET ENGINE ---
(() => {
    const availableWidgets = [
        { id: 'bentoRxCompact', icon: '📝', name: 'Rx Staging Queue' },
        { id: 'growthSnapshotCard', icon: '📈', name: 'Growth Z-Scores' },
        { id: 'bentoNutrition', icon: '🛡️', name: 'Nutrition & Anthro' },
        { id: 'bentoVitals', icon: '💓', name: 'Vitals & Fluids' },
        { id: 'bentoVaccines', icon: '💉', name: 'Vaccines Due' },
        { id: 'bentoMilestones', icon: '🧠', name: 'Milestones' }
    ];

    // Load saved preferences or default to showing everything
    let savedWidgets = JSON.parse(localStorage.getItem('kiddoq_active_widgets')) || [
        'bentoRxCompact', 'growthSnapshotCard', 'bentoNutrition', 'bentoVitals', 'bentoVaccines', 'bentoMilestones'
    ];

    // 1. Show/Hide cards on the Dashboard
    window.renderDashboardWidgets = function() {
        availableWidgets.forEach(widget => {
            const el = document.getElementById(widget.id);
            if (el) {
                if (savedWidgets.includes(widget.id)) {
                    el.style.display = ''; // Reverts to default CSS layout
                } else {
                    el.style.display = 'none'; // Hides it completely
                }
            }
        });
        
        // Re-run the 3D HoloDeck swipe logic so it recalculates visible cards!
        if (typeof window.initHoloDeck === 'function') window.initHoloDeck();
    };

    // 2. Build the toggles inside the Settings Tab
    window.renderSettingsWidgetList = function() {
        const list = document.getElementById('settingsQuickToolsList');
        if (!list) return;
        
        let html = '';
        availableWidgets.forEach(widget => {
            const isChecked = savedWidgets.includes(widget.id) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:center; gap:10px; font-size:0.9rem; color:var(--text-main); font-weight:600; padding:10px 12px; background:rgba(0,0,0,0.2); border-radius:12px; border:1px solid var(--border-soft); cursor:pointer; transition:all 0.2s;">
                    <input type="checkbox" value="${widget.id}" class="widget-checkbox" ${isChecked} onchange="saveWidgetSettings()" style="width:18px; height:18px; accent-color:var(--brand-cyan);">
                    <span style="font-size:1.2rem;">${widget.icon}</span> ${widget.name}
                </label>
            `;
        });
        list.innerHTML = html;
    };

    // 3. Save when a toggle is clicked
    window.saveWidgetSettings = function() {
        const checkboxes = document.querySelectorAll('.widget-checkbox:checked');
        savedWidgets = Array.from(checkboxes).map(cb => cb.value);
        localStorage.setItem('kiddoq_active_widgets', JSON.stringify(savedWidgets));
        
        renderDashboardWidgets();
        if(typeof showSystemToast === 'function') showSystemToast("✅ Dashboard updated!");
    };
})();

// 12. DYNAMIC CONTEXT ENGINE (Time, Name, Encounters)
function updateDashboardContext() {
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    let icon = "🌙";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning";
        icon = "☀️";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
        icon = "🌤️";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
        icon = "🌅";
    }

    // 🚀 THE FIX: Matched to the correct HTML IDs and added null safety
    const timeEl = document.getElementById('liveGreetingTime');
    const iconEl = document.getElementById('liveGreetingEmoji');
    if (timeEl) timeEl.innerText = greeting;
    if (iconEl) iconEl.innerText = icon;

    // Pull the doctor's name from localStorage (defaults to 'Peter' if not set)
    const docName = localStorage.getItem('kiddoq_doctor_name') || "Peter";
    const nameEl = document.getElementById('liveDoctorName');
    if (nameEl) nameEl.innerText = docName;

    // Encounter Counter logic
    let encounters = parseInt(localStorage.getItem('kiddoq_encounter_count')) || 0;
    const countEl = document.getElementById('encounterCount');
    if (countEl) countEl.innerText = encounters;
}

// Function to increment encounters when vitals are scrubbed
function incrementEncounter() {
    let encounters = parseInt(localStorage.getItem('kiddoq_encounter_count')) || 0;
    encounters += 1;
    localStorage.setItem('kiddoq_encounter_count', encounters);
    document.getElementById('encounterCount').innerText = encounters;
}

// 13. ER FLUIDS CALCULATOR
function calculateERFluids() {
    const wt = parseFloat(document.getElementById('erWt').value) || 0;
    const dehyd = parseFloat(document.getElementById('erDehyd').value) || 0;
    const output = document.getElementById('erFluidsOutput');

    if (wt <= 0) {
        output.innerHTML = `<div class="hud-empty-state" style="border: 1px dashed rgba(0, 229, 255, 0.2); color: rgba(255,255,255,0.5);">Enter Weight to calculate fluids...</div>`;
        return;
    }

    // 1. Bolus (20 mL/kg)
    const bolus = (wt * 20).toFixed(0);

    // 2. Deficit (Dehydration % * Weight * 10)
    const deficit = (dehyd * wt * 10).toFixed(0);

    // 3. Maintenance (Holliday-Segar)
    let maint = 0;
    if (wt <= 10) maint = wt * 100;
    else if (wt <= 20) maint = 1000 + ((wt - 10) * 50);
    else maint = 1500 + ((wt - 20) * 20);
    
    const maintPerHour = (maint / 24).toFixed(1);

    output.innerHTML = `
        <!-- Resuscitation Bolus -->
        <div style="background: rgba(255, 59, 59, 0.1); border-left: 4px solid var(--danger); padding: 15px; border-radius: 12px; box-shadow: inset 0 0 15px rgba(255, 59, 59, 0.05);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">1. STAT Bolus (20 mL/kg)</div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 5px;">
                <span style="font-size: 2.2rem; font-weight: 900; color: var(--danger);">${bolus}</span>
                <span style="font-size: 1rem; color: #FFF; font-weight: 600;">mL (NS or RL)</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--warning); margin-top: 4px;">Push over 20-30 mins. Repeat if shock persists.</div>
        </div>

        <!-- Deficit -->
        <div style="background: rgba(255, 176, 32, 0.1); border-left: 4px solid var(--warning); padding: 15px; border-radius: 12px;">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">2. Fluid Deficit</div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 5px;">
                <span style="font-size: 1.8rem; font-weight: 900; color: var(--warning);">${deficit}</span>
                <span style="font-size: 1rem; color: #FFF; font-weight: 600;">mL</span>
            </div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">Replace 1/2 over first 8 hrs, 1/2 over next 16 hrs.</div>
        </div>

        <!-- Daily Maintenance -->
        <div style="background: rgba(0, 229, 255, 0.1); border-left: 4px solid var(--brand-cyan); padding: 15px; border-radius: 12px;">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">3. Maintenance</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: var(--brand-cyan);">${maint.toFixed(0)} <span style="font-size: 0.85rem; color: #FFF;">mL/24h</span></div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 900; color: var(--brand-blue);">${maintPerHour} <span style="font-size: 0.85rem; color: #FFF;">mL/hr</span></div>
                </div>
            </div>
        </div>
    `;
}

// 14. ASTHMA PRAM SCORE ENGINE
function calculatePRAM() {
    const o2 = parseInt(document.getElementById('pramO2').value);
    const retr = parseInt(document.getElementById('pramRetractions').value);
    const scale = parseInt(document.getElementById('pramScalene').value);
    const air = parseInt(document.getElementById('pramAirEntry').value);
    const wheeze = parseInt(document.getElementById('pramWheeze').value);
    
    const score = o2 + retr + scale + air + wheeze;
    const output = document.getElementById('pramOutput');

    let severity = "Mild";
    let color = "var(--success)";
    let bg = "rgba(0, 250, 154, 0.1)";
    let plan = "Salbutamol MDI/Neb. Discharge if stable.";

    if (score >= 4 && score <= 7) {
        severity = "Moderate";
        color = "var(--warning)";
        bg = "rgba(255, 176, 32, 0.1)";
        plan = "Salbutamol + Ipratropium. Systemic Steroids. Observe 1-2 hrs.";
    } else if (score >= 8) {
        severity = "Severe / Impending Failure";
        color = "var(--danger)";
        bg = "rgba(255, 59, 59, 0.1)";
        plan = "Continuous Salbutamol. IV MgSO4/Steroids. Consider ICU admission.";
    }

    // Only show output if score > 0 (prevents it showing Mild instantly on blank screen)
    if (score === 0) {
        output.innerHTML = `
        <div style="background: ${bg}; border-left: 4px solid ${color}; padding: 15px; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">PRAM Score</div>
                <div style="font-size: 2.2rem; font-weight: 900; color: ${color};">${score}</div>
            </div>
            <div style="font-size: 1.1rem; font-weight: 800; color: ${color}; margin-top: -10px;">${severity}</div>
        </div>`;
    } else {
        output.innerHTML = `
        <div style="background: ${bg}; border-left: 4px solid ${color}; padding: 15px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">PRAM Score</div>
                <div style="font-size: 2.5rem; font-weight: 900; color: ${color};">${score}/12</div>
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${color}; margin-top: -10px;">${severity} Asthma</div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); font-size: 0.85rem; color: #FFF; font-weight: 600;">
                ⚡ Action: ${plan}
            </div>
        </div>`;
    }
}

// 15. MALNUTRITION TRIAGE ENGINE
function calculateTriage() {
    const muac = parseFloat(document.getElementById('triageMuac').value) || 0;
    const edema = document.getElementById('triageEdema').value;
    const output = document.getElementById('triageOutput');

    if (muac <= 0 && edema === 'no') {
        output.innerHTML = `<div class="hud-empty-state" style="border: 1px dashed rgba(255, 176, 32, 0.2); color: rgba(255,255,255,0.5);">Enter MUAC or Edema to triage...</div>`;
        return;
    }

    let status = "Normal / No Acute Malnutrition";
    let color = "var(--success)";
    let bg = "rgba(0, 250, 154, 0.1)";
    let plan = "Routine growth monitoring & counseling.";

    if (edema === 'yes' || (muac > 0 && muac < 11.5)) {
        status = "Severe Acute Malnutrition (SAM)";
        color = "var(--danger)";
        bg = "rgba(255, 59, 59, 0.1)";
        plan = "Perform appetite test. If fail or medical complications -> Admit to NRC. If pass -> CTC with RUTF.";
    } else if (muac >= 11.5 && muac < 12.5) {
        status = "Moderate Acute Malnutrition (MAM)";
        color = "var(--warning)";
        bg = "rgba(255, 176, 32, 0.1)";
        plan = "Enroll in SFP. Provide supplementary rations and monitor every 2 weeks.";
    }

    output.innerHTML = `
        <div style="background: ${bg}; border-left: 4px solid ${color}; padding: 15px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Diagnostic Triage</div>
            <div style="font-size: 1.3rem; font-weight: 900; color: ${color}; margin-top: 5px;">${status}</div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); font-size: 0.85rem; color: #FFF; font-weight: 600;">
                ⚡ Plan: ${plan}
            </div>
        </div>`;
}

// 16. CASE FILE & PRESCRIPTION ENGINE
function pullVitalsToRx() {
    // Pull telemetry from the dashboard's hidden input states
    const wt = document.getElementById('hudWeight').value || '--';
    const y = document.getElementById('hudAgeYrs').value || '0';
    const m = document.getElementById('hudAgeMos').value || '0';
    
    let ageStr = '';
    if (y > 0) ageStr += y + 'Y ';
    if (m > 0 || y == 0) ageStr += m + 'M';
    
    // Inject them into the prescription container's dataset
    const container = document.getElementById('rxOutputContainer');
    container.dataset.wt = wt;
    container.dataset.age = ageStr;
    
    // Animate the button to show success
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span>✅</span> Vitals Synced!`;
    btn.style.background = 'rgba(0, 250, 154, 0.2)';
    btn.style.borderColor = 'var(--success)';
    btn.style.color = 'var(--success)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = 'rgba(106, 112, 255, 0.15)';
        btn.style.borderColor = 'rgba(106, 112, 255, 0.4)';
        btn.style.color = 'var(--brand-cyan)';
    }, 1500);

    generateRxPreview();
}

// --- UPGRADED RENDERER: Routes to Summary Tab ---
window.generateRxPreview = function() {
    const container = document.getElementById('liveSummaryPreview') || document.getElementById('rxOutputContainer');
    if(!container) return; 

    // 1. Pull directly from Spatial Staging memory first
    let cc = document.getElementById('wsSymptoms') ? document.getElementById('wsSymptoms').value : '';
    let advice = document.getElementById('wsAdvice') ? document.getElementById('wsAdvice').value : '';
    let dx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : '';
    
    // Fallback to legacy DOM nodes if Spatial is empty
    if (!cc) cc = document.getElementById('rxCc') ? document.getElementById('rxCc').value : '';
    if (!advice) advice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : '';

    // Unify Rx List directly from the live array
    let medsText = "";
    if (typeof workspaceRxList !== 'undefined' && workspaceRxList.length > 0) {
        medsText = workspaceRxList.map(item => `${item.name || "Drug"} (${item.formulation || ""})\n-> ${item.dose || "0 mL"} • ${item.frequency || "SOS"} • ${item.duration || ""}`).join("\n\n");
    } else {
        medsText = document.getElementById('rxMeds') ? document.getElementById('rxMeds').value : '';
    }

    const wt = document.getElementById('hudWeight') ? document.getElementById('hudWeight').value : '--';
    const y = document.getElementById('hudAgeYrs') ? document.getElementById('hudAgeYrs').value : '0';
    const m = document.getElementById('hudAgeMos') ? document.getElementById('hudAgeMos').value : '0';
    
    let ageStr = '';
    if (y > 0) ageStr += y + 'Y ';
    if (m > 0 || y == 0) ageStr += m + 'M';
    if (ageStr === '') ageStr = '--';
    
    const docName = localStorage.getItem('kiddoq_doctor_name') || "Peter";
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (!cc && !dx && !medsText && !advice && wt === '--') {
        container.innerHTML = `<div class="hud-empty-state" style="border: 1px dashed rgba(106, 112, 255, 0.3); color: rgba(255,255,255,0.5); padding: 20px; text-align: center;">Payload is empty. Add symptoms or medications to generate Rx.</div>`;
        return;
    }

    container.innerHTML = `
        <div style="background: #FFFFFF; color: #1A202C; padding: 20px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.8); position: relative; overflow: hidden; border: 4px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #2B6CB0; padding-bottom: 12px; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0; color: #2B6CB0; font-size: 1.3rem; font-weight: 900; font-family: sans-serif;">Dr. ${docName}</h3>
                    <div style="font-size: 0.8rem; color: #4A5568; font-weight: 700;">Pediatrician</div>
                </div>
                <div style="text-align: right; font-size: 0.85rem; color: #4A5568; font-weight: 700; line-height: 1.4;">
                    <div>${dateStr}</div>
                    <div style="background: #EDF2F7; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">Wt: ${wt} kg | Age: ${ageStr}</div>
                </div>
            </div>
            
            ${cc ? `<div style="margin-bottom: 8px;"><strong style="color: #2B6CB0; font-size: 0.9rem;">C/O:</strong> <span style="font-weight: 600; font-size: 0.95rem;">${cc}</span></div>` : ''}
            ${dx ? `<div style="margin-bottom: 15px;"><strong style="color: #2B6CB0; font-size: 0.9rem;">Dx:</strong> <span style="font-weight: 600; font-size: 0.95rem;">${dx}</span></div>` : ''}
            
            ${medsText ? `
            <div style="margin-bottom: 15px; margin-top: 15px;">
                <div style="font-size: 1.8rem; color: #2B6CB0; font-weight: bold; font-family: serif; line-height: 1;">℞</div>
                <div style="white-space: pre-wrap; font-weight: 700; font-size: 0.95rem; margin-top: 8px; padding-left: 10px; color: #2D3748; line-height: 1.5;">${medsText}</div>
            </div>
            ` : ''}
            
            ${advice ? `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #CBD5E0;">
                <strong style="color: #38A169; font-size: 0.9rem;">Advice:</strong> <span style="font-weight: 700; color: #2D3748;">${advice}</span>
            </div>
            ` : ''}
        </div>
    `;
};

document.addEventListener('DOMContentLoaded', () => {
    
    function updateDashboardGreeting() {
        const hour = new Date().getHours();
        const timeEl = document.getElementById('liveGreetingTime');
        const emojiEl = document.getElementById('liveGreetingEmoji');
        const nameEl = document.getElementById('liveDoctorName');
        const loggedInDoctor = localStorage.getItem('kiddoq_doctor_name') || "Peter"; 
        if (nameEl) nameEl.textContent = loggedInDoctor;

        let greeting = "Good Evening", emoji = "🌙";
        if (hour >= 5 && hour < 12) { greeting = "Good Morning"; emoji = "☀️"; } 
        else if (hour >= 12 && hour < 17) { greeting = "Good Afternoon"; emoji = "🌤️"; } 
        else if (hour >= 17 && hour < 21) { greeting = "Good Evening"; emoji = "🌅"; } 

        if (timeEl) timeEl.textContent = greeting;
        if (emojiEl) emojiEl.textContent = emoji;
    }
    updateDashboardGreeting();
    setInterval(updateDashboardGreeting, 60000); 

    if(typeof attachDirectScrub === 'function') {
        attachDirectScrub('scrubAgeZone', 'age');
        attachDirectScrub('scrubWtZone', 'weight');
    }
    
    const hudHcEl = document.getElementById('hudHc');
    const hudMacEl = document.getElementById('hudMac');
    if (hudHcEl) hudHcEl.addEventListener('input', renderAnthropometry);
    if (hudMacEl) hudMacEl.addEventListener('input', renderAnthropometry);
    
    const weightInput = document.getElementById('hudWeight');
    if (weightInput && typeof renderInstantDoses === 'function') {
        renderInstantDoses(weightInput.value);
    }
    
    // Boot widgets and telemetry
    if(typeof renderDashboardWidgets === 'function') renderDashboardWidgets();
    if(typeof renderSettingsWidgetList === 'function') renderSettingsWidgetList();
    if(typeof renderVaccinesDue === 'function') renderVaccinesDue(0);
    if(typeof renderVitalsAndFluids === 'function') renderVitalsAndFluids(0, 0);
    if(typeof renderMilestonesAndRedFlags === 'function') renderMilestonesAndRedFlags(0);
    if(typeof updateDashboardContext === 'function') updateDashboardContext();

    setTimeout(() => {
        const catSelect = document.getElementById('hudQuickCat');
        if (catSelect && typeof window.getUnifiedDB === 'function') {
            let db = window.getUnifiedDB();
            if (db && db.length > 0) {
                const categories = [...new Set(db.map(d => d.category))].filter(Boolean);
                catSelect.innerHTML = '<option value="">-- Select Category --</option>';
                categories.sort().forEach(cat => {
                    catSelect.innerHTML += `<option value="${cat}">${cat.toUpperCase()}</option>`;
                });
            }
        }
    }, 600);

    window.isVelocityMode = localStorage.getItem('kiddoq_velocity') === 'true';
    const velocityToggle = document.getElementById('velocityModeToggle');
    if(velocityToggle) velocityToggle.checked = window.isVelocityMode;

    window.toggleVelocityMode = function(isActive) {
        window.isVelocityMode = isActive;
        localStorage.setItem('kiddoq_velocity', isActive);
        if(isActive) {
            document.documentElement.style.setProperty('--kinetic-duration', '0.01ms');
            document.documentElement.style.setProperty('--kinetic-delay', '0ms');
        } else {
            document.documentElement.style.setProperty('--kinetic-duration', '0.4s');
            document.documentElement.style.setProperty('--kinetic-delay', '0.4s');
        }
    };
    window.toggleVelocityMode(window.isVelocityMode);

    const sleepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) entry.target.classList.add('cortex-sleep'); 
            else entry.target.classList.remove('cortex-sleep'); 
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.bento-card, .hero-icon, .card-icon').forEach(el => {
        sleepObserver.observe(el);
    });

    // 3D Cinematic Swipe Engine (Infinite Loop Patch)
window.initHoloDeck = function() {
    if (window.innerWidth > 1023) return;
    const grid = document.querySelector('.cortex-spatial-stage');
    const navigator = document.getElementById('globalDeckNavigator');
    if(!grid) return;

    const cards = Array.from(grid.querySelectorAll('.bento-card')).filter(c => c.style.display !== 'none');
    if(cards.length === 0) return;

    let currentIndex = 0;
    const total = cards.length; // Store total for circular wrap math

    // Function to assign 3D classes based on circular distance
    function update3DDeck() {
        cards.forEach((card, index) => {
            // Strip old slots
            card.className = card.className.replace(/slot-[a-z-]+/g, '').trim(); 
            
            // INFINITE LOOP MATH: Calculates shortest circular distance between cards
            let offset = (index - currentIndex) % total;
            if (offset > Math.floor(total / 2)) offset -= total;
            else if (offset < -Math.floor(total / 2)) offset += total;

            // Deal slots based on infinite offset
            // 🚀 SURGICAL FIX: Removed all inline 'card.style.opacity' thrashing!
            if (offset === 0) {
                card.classList.add('slot-active');
            } else if (offset === -1) {
                card.classList.add('slot-prev');
            } else if (offset === 1) {
                card.classList.add('slot-next');
            } else if (offset === -2) {
                card.classList.add('slot-far-prev');
            } else if (offset === 2) {
                card.classList.add('slot-far-next');
            } else {
                card.classList.add('slot-hidden'); 
            }
        });

        // Update navigator dots
        if (navigator) {
            const items = navigator.querySelectorAll('.deck-nav-item');
            items.forEach(d => d.classList.remove('active'));
            if(items[currentIndex]) {
                items[currentIndex].classList.add('active');
                // Scroll the track to keep active item in view
                items[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }

    // Build Navigator Icons based on image spec
    if (navigator) {
        let navHtml = '<div class="deck-arrow" id="deckArrowLeft">⟨</div><div class="deck-nav-track">';
        cards.forEach((card, i) => {
            const titleEl = card.querySelector('h3');
            const title = titleEl ? titleEl.innerText : 'Module';
            
            const iconMatch = card.innerHTML.match(/(?:>)([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/);
            const icon = iconMatch ? iconMatch[1] : '⚕️';
            
            navHtml += `<div class="deck-nav-item ${i === 0 ? 'active' : ''}" data-index="${i}">
                            <div class="deck-nav-icon">${icon}</div>
                            <div class="deck-nav-label">${title}</div>
                        </div>`;
        });
        navHtml += '</div><div class="deck-arrow" id="deckArrowRight">⟩</div>';
        navigator.innerHTML = navHtml;
        
        // Bind arrow clicks (Unclamped Infinite Wrap)
        document.getElementById('deckArrowLeft').addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + total) % total; 
            update3DDeck();
        });
        document.getElementById('deckArrowRight').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % total;
            update3DDeck();
        });
        
        // Bind direct clicks on the icons themselves
        navigator.querySelectorAll('.deck-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                currentIndex = parseInt(e.currentTarget.getAttribute('data-index'));
                update3DDeck();
            });
        });
    }

    // Touch Swipe Logic (Unclamped Infinite Wrap)
    let startX = 0;
    grid.addEventListener('touchstart', (e) => { 
        startX = e.touches[0].clientX; 
    }, { passive: true });
    
    grid.addEventListener('touchend', (e) => {
        let endX = e.changedTouches[0].clientX;
        let diff = startX - endX;

        if (diff > 40) {
            // Swipe Left -> Next Card (Wraps back to 0)
            currentIndex = (currentIndex + 1) % total; 
            update3DDeck();
        } else if (diff < -40) {
            // Swipe Right -> Prev Card (Wraps back to end)
            currentIndex = (currentIndex - 1 + total) % total; 
            update3DDeck();
        }
    });

    // Initialize first view
    update3DDeck();
}

    // Initialize the engine
    window.initHoloDeck(); 

    // 🚀 SURGICAL FIX: Snap cards instantly, then unlock physics after 50ms
    setTimeout(() => {
        const stage = document.querySelector('.cortex-spatial-stage');
        if (stage) stage.classList.remove('cortex-booting');
    }, 150); 

    // Desktop 3D Hover Engine
    window.init3DPhysics = function() {
        if (window.innerWidth < 1024) return;
        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.bento-card, .vax-flip-card');
            if (window.innerWidth > 1023 && window._active3DCard && window._active3DCard !== card) {
                window._active3DCard.style.setProperty('transition', 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 'important');
                window._active3DCard.style.setProperty('transform', `perspective(1200px) translateY(0px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`, 'important');
                window._active3DCard = null;
            }
            if (card && window.innerWidth > 1023) {
                window._active3DCard = card;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top; 
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -8; 
                const rotateY = ((x - centerX) / centerX) * 8;
                card.style.setProperty('transition', 'transform 0.1s linear, box-shadow 0.4s ease, border-color 0.4s ease', 'important');
                card.style.setProperty('transform', `perspective(1200px) translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`, 'important');
            }
        });
    }
    window.init3DPhysics();
    window.addEventListener('load', init3DPhysics);
});