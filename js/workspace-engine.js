
        window.workspaceRxList = window.workspaceRxList || [];

        window.addToRxQueue = function(drugName, formulation, dose, frequency) {
    
    window.workspaceRxList.push({
        name: drugName,
        formulation: formulation || '',
        dose: dose || '',
        frequency: frequency || 'SOS',
        duration: '' // Leaves duration blank so the Staging Card glows amber to remind you
    });
    
    // Instantly update the premium Rx Staging Queue card
    if (typeof renderWorkspaceRx === 'function') renderWorkspaceRx();
    
    // Visual feedback
    if (typeof showSystemToast === 'function') {
        showSystemToast(`✅ Added to Rx Queue`);
    }
};

        // --- 3D SPATIAL TOGGLE LOGIC (Upgraded with Auto-Fetch) ---
window.toggleWorkspace = async function(show) {
    const container = document.getElementById('workspaceContainer');

    // 1. LAZY LOADING ENGINE: Fetch the HTML only if we are opening it AND it's empty
    if (show && container && container.innerHTML.trim() === '') {
        try {
            // Updated path to look inside the views folder and bypass the cache!
                        // HARDCODED PATH: Force the browser to look inside the views folder, ignoring HTML overrides
            const response = await fetch('views/workspace-view.html?v=' + new Date().getTime());
            if (!response.ok) throw new Error("Network response was not ok");
            const html = await response.text();
            container.innerHTML = html;
            
            // Re-bind the close button background click if needed
            const newBackdrop = document.getElementById('workspaceBackdrop');
            if (newBackdrop) newBackdrop.onclick = () => toggleWorkspace(false);
            
        } catch (err) {
            console.error("Failed to load Workspace module:", err);
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Error loading Rx Clipboard.");
            return; // Abort the opening sequence if the fetch fails
        }
    }

    // 2. GRAB ELEMENTS (They are guaranteed to exist in the DOM now)
    const sheet = document.getElementById('rxSmartClipboard');
    const backdrop = document.getElementById('workspaceBackdrop');
    const bentoGrid = document.querySelector('.cortex-bento-grid'); 

    // 3. EXECUTE ANIMATIONS
    if(show) {
        if(sheet) {
            sheet.style.transform = 'translate(-50%, -50%) scale(1)';
            sheet.style.opacity = '1';
            sheet.style.pointerEvents = 'auto';
        }
        if(backdrop) { backdrop.style.opacity = '1'; backdrop.style.pointerEvents = 'auto'; }
        
        if(bentoGrid) {
            bentoGrid.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            bentoGrid.style.transform = 'translateZ(-150px) scale(0.9)';
            bentoGrid.style.opacity = '0.4'; 
            bentoGrid.style.pointerEvents = 'none';
            bentoGrid.style.filter = 'blur(5px)';
        }
    } else {
        if(sheet) {
            sheet.style.transform = 'translate(-50%, 50%) scale(0.9)';
            sheet.style.opacity = '0';
            sheet.style.pointerEvents = 'none';
        }
        if(backdrop) { backdrop.style.opacity = '0'; backdrop.style.pointerEvents = 'none'; }
        
        if(bentoGrid) {
            bentoGrid.style.transform = 'translateZ(0) scale(1)';
            bentoGrid.style.opacity = '1'; 
            bentoGrid.style.pointerEvents = 'auto';
            bentoGrid.style.filter = 'blur(0)';
        }
    }
};
        // --- SMART PROTOCOL ENGINE ---
        window.applySmartProtocol = function(type) {
            let wt = window.globalPatientWeight || parseFloat(document.getElementById('hudWeight')?.value) || 10; 
            const advField = document.getElementById('wsAdvice');
            
            const btn = document.getElementById('btnProto-' + type);
            if(btn) {
                btn.style.background = 'rgba(0, 229, 255, 0.15)';
                btn.style.borderColor = 'var(--brand-cyan)';
                btn.style.color = 'var(--brand-cyan)';
            }

            const adviceDictionary = {
                fever: "• Maintain adequate hydration\n• Tepid sponging for temp > 101°F\n• Return if persistent fever > 3 days\n• RED FLAGS: Lethargy, poor oral intake, zero urine output for 6 hours.",
                uri: "• Steam inhalation twice daily\n• Avoid cold food/drinks\n• Saline drops before feeds if nasal block\n• Return if breathing gets fast or labored.",
                ge: "• STRICT ORS. No plain water.\n• Soft, freshly cooked diet. Avoid dairy if purging worsens.\n• RED FLAGS: Lethargy, sunken eyes, zero urine for 6 hours."
            };

            let newAdvice = adviceDictionary[type];
            if (newAdvice && advField && !advField.value.includes(newAdvice)) {
                advField.value += (advField.value ? '\n\n' : '') + newAdvice;
            }

            if (type === 'fever') {
                let doseMg = Math.round(wt * 15);
                let volMl = (doseMg / 250) * 5;
                let cleanVol = (Math.round(volMl * 2) / 2).toFixed(1);
                pushToWorkspaceRx({ name: "Paracetamol", formulation: "Syrup (250mg/5mL)", dose: `${cleanVol} mL`, frequency: "Q6H (SOS)", duration: "" });
            } else if (type === 'uri') {
                let cetMg = wt * 0.25;
                let cetVol = (cetMg / 5) * 5;
                let cleanCet = (Math.round(cetVol * 2) / 2).toFixed(1);
                pushToWorkspaceRx({ name: "Cetirizine", formulation: "Syrup (5mg/5mL)", dose: `${cleanCet} mL`, frequency: "OD (HS)", duration: "" });
                pushToWorkspaceRx({ name: "Saline Nasal Drops", formulation: "0.65% w/v", dose: "2 Drops Both Nostrils", frequency: "TDS (SOS)", duration: "" });
            } else if (type === 'ge') {
                pushToWorkspaceRx({ name: "ORS Sachet", formulation: "WHO Standard", dose: "1 Sachet in 1L Water", frequency: "Sip post loose stool", duration: "" });
                pushToWorkspaceRx({ name: "Zinc", formulation: "Syrup (20mg/5mL)", dose: "5.0 mL", frequency: "OD", duration: "" });
            }
        };

        // --- GLOBAL BRIDGE ---
        window.pushToDashboardCart = function(medObject) {
            pushToWorkspaceRx(medObject);
        };

        function pushToWorkspaceRx(medObject) {
            window.workspaceRxList.push(medObject);
            renderWorkspaceRx();
        }

        // Helper: Parses standard freq into UI Day-Parts (Bulletproofed)
        function parseFrequencyUI(freqStr) {
            if (!freqStr) freqStr = "SOS"; // Fallback if undefined
            let m = '0', a = '0', n = '0';
            let str = String(freqStr).toUpperCase();
            
            if(str.includes('1-0-1') || str === 'BD') { m='1'; n='1'; }
            else if(str.includes('1-1-1') || str === 'TDS') { m='1'; a='1'; n='1'; }
            else if(str.includes('1-0-0') || str === 'OD') { m='1'; }
            else if(str.includes('0-0-1') || str === 'HS') { n='1'; }
            else if(str.includes('SOS') || str.includes('PRN') || str.includes('Q')) { m='PRN'; a='PRN'; n='PRN'; }
            
            const node = (val, icon, label) => {
                let active = val !== '0' && val !== '-';
                return `
                <div style="display: flex; flex-direction: column; align-items: center; opacity: ${active ? '1' : '0.3'}; transition: opacity 0.3s;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid ${active ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.2)'}; box-shadow: ${active ? '0 0 15px rgba(0,229,255,0.3), inset 0 0 10px rgba(0,229,255,0.1)' : 'none'}; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: ${active ? 'var(--brand-cyan)' : '#fff'}; background: ${active ? 'rgba(0,229,255,0.05)' : 'transparent'};">
                        <i class="${icon}"></i>
                    </div>
                    <div style="font-size: 0.55rem; margin-top: 6px; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">${label}</div>
                    <div style="font-size: 0.85rem; font-weight: 900; color: #fff; margin-top: 2px;">${val}</div>
                </div>`;
            };

            return `<div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 8px;">
                ${node(m, 'ph-duotone ph-sun', 'MORNING')}
                ${node(a, 'ph-duotone ph-cloud-sun', 'AFTERNOON')}
                ${node(n, 'ph-duotone ph-moon', 'NIGHT')}
            </div>`;
        }

        // --- UPGRADED RENDERER: Holographic Mission Cards (Bulletproofed) ---
        function renderWorkspaceRx() {
            const list = document.getElementById('clipboardRxList');
            if (!list) return; 
            
            if (window.workspaceRxList.length === 0) {
                list.innerHTML = '<div class="hud-empty-state" style="border: 1px dashed rgba(0,229,255,0.2); padding: 40px 0; font-size: 0.85rem; margin: 0; background: rgba(0,229,255,0.02); border-radius: 16px; color: rgba(255,255,255,0.4);">Payload Empty. Calculate a dose to begin.</div>';
            } else {
                list.innerHTML = '';
                workspaceRxList.forEach((item, index) => {
                    
                    let displayDuration = item.duration || '';
                    let durationColor = "var(--text-main)";
                    let durationBg = "rgba(255,255,255,0.05)";
                    let durationBorder = "rgba(255,255,255,0.1)";
                    
                    if (!displayDuration || displayDuration.trim() === '') {
                        displayDuration = '✎ Tap to set duration';
                        durationColor = "var(--warning)";
                        durationBg = "rgba(255, 176, 32, 0.1)";
                        durationBorder = "rgba(255, 176, 32, 0.3)";
                    }

                    // SAFETY CATCHES: Prevents undefined crashes
                    let dayPartsUI = parseFrequencyUI(item.frequency || "SOS");
                    let safeDose = item.dose ? String(item.dose) : "0 mL";
                    let doseVal = safeDose.split(' ')[0] || "0";
                    let doseUnit = safeDose.split(' ')[1] || "mL";
                    let safeName = item.name || "Unknown Drug";
                    let safeForm = item.formulation || "Custom";

                    list.innerHTML += `
                        <div class="bento-card" style="margin-bottom: 0px; background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 20px !important; box-shadow: inset 0 2px 20px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.5) !important; position: relative; overflow: hidden;">
                            
                            <div class="energy-rail"></div>

                            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; z-index: 2;">
                                <div style="display: flex; gap: 15px; align-items: center;">
                                    <div style="width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle at center, rgba(0,229,255,0.1), transparent 70%); display: flex; align-items: center; justify-content: center; position: relative;">
                                        <div style="position: absolute; bottom: 5px; width: 40px; height: 10px; border-radius: 50%; border: 1px solid var(--brand-cyan); box-shadow: 0 0 10px var(--brand-cyan);"></div>
                                        <div style="font-size: 2.5rem; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5)); transform: rotate(15deg) translateY(-5px);">💊</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.6rem; color: var(--brand-cyan); border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.1); padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">PRIMARY MEDICATION</div>
                                        <div style="font-weight: 900; color: #fff; font-size: 1.3rem; letter-spacing: 0.5px; text-transform: uppercase;">${safeName}</div>
                                        <div style="font-size: 0.85rem; color: var(--brand-cyan); margin-top: 2px; font-weight: 700;">${safeForm}</div>
                                    </div>
                                </div>
                                <button class="secondary" style="margin: 0; padding: 10px 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 12px; color: var(--danger); font-size: 1.2rem; transition: all 0.2s;" onclick="removeWorkspaceItem(${index})"><i class="ph-bold ph-x"></i></button>
                            </div>
                            
                            <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 20px; position: relative; z-index: 2;">
                                <div style="border-right: 1px solid rgba(255,255,255,0.05); padding-right: 20px;">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-bottom: 12px;">DOSE</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="ph-duotone ph-drop" style="font-size: 1.5rem; color: var(--brand-cyan);"></i>
                                        <div>
                                            <div style="font-size: 1.6rem; color: var(--brand-cyan); font-weight: 900; line-height: 1;">${doseVal} <span style="font-size: 1rem;">${doseUnit}</span></div>
                                            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">Per Dose</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="border-right: 1px solid rgba(255,255,255,0.05); padding-right: 20px;">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">FREQUENCY</div>
                                    ${dayPartsUI}
                                </div>
                                
                                <div>
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-bottom: 12px;">DURATION</div>
                                    <div style="background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.3); padding: 10px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;" onclick="editDuration(${index})">
                                        <div style="display: flex; align-items: center; gap: 6px; color: var(--brand-cyan); font-weight: 800; font-size: 0.95rem;">
                                            <i class="ph-duotone ph-calendar-blank"></i> ${displayDuration}
                                        </div>
                                        <i class="ph-bold ph-caret-down" style="color: var(--brand-cyan); font-size: 0.8rem;"></i>
                                    </div>
                                    <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 8px; text-align: center;">Tap to change</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            // Sync with 3D Deck Preview Card
            // --- NEW: Sync with Smart Rx Command Queue Card ---
            const previewContainer = document.getElementById('compactRxPreviewContainer');
            const cardHeaderSubtitle = document.getElementById('rxStagingSubtitle');
            const cardItself = document.getElementById('bentoRxCompact');
            const statusBadge = document.getElementById('rxStagingStatus');

            if (previewContainer && cardHeaderSubtitle && cardItself) {
                if (window.workspaceRxList.length === 0) {
                    // EMPY STATE
                    cardHeaderSubtitle.innerText = "AWAITING PAYLOAD";
                    cardHeaderSubtitle.style.color = "var(--text-muted)";
                    cardItself.style.setProperty('--current-glow', 'rgba(255,255,255,0.05)');
                    cardItself.style.borderColor = 'rgba(255,255,255,0.08)';

                    previewContainer.innerHTML = `
                        <div style="height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.4;">
                            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Queue Empty</div>
                        </div>`;

                    if(statusBadge) statusBadge.style.display = 'none';

                } else {
                    // ACTIVE QUEUE STATE
                    cardHeaderSubtitle.innerText = `${window.workspaceRxList.length} ITEM${window.workspaceRxList.length > 1 ? 'S' : ''} QUEUED`;
                    cardHeaderSubtitle.style.color = "var(--brand-cyan)";

                    // Evaluate Staging Completeness
                    let isReady = true;
                    workspaceRxList.forEach(item => {
                        if (!item.duration || item.duration.trim() === '') isReady = false;
                    });

                    // Apply Dynamic Glows & Badges
                    if (isReady) {
                        cardItself.style.setProperty('--current-glow', 'rgba(0, 229, 255, 0.6)');
                        cardItself.style.setProperty('--current-glow-solid', 'var(--brand-cyan)');
                        cardItself.style.borderColor = 'rgba(0, 229, 255, 0.3)';
                        if(statusBadge) {
                            statusBadge.style.display = 'inline-block';
                            statusBadge.innerText = 'READY FOR DEPLOYMENT';
                            statusBadge.style.background = 'rgba(0, 229, 255, 0.1)';
                            statusBadge.style.color = 'var(--brand-cyan)';
                            statusBadge.style.borderColor = 'rgba(0, 229, 255, 0.3)';
                        }
                    } else {
                        cardItself.style.setProperty('--current-glow', 'rgba(245, 158, 11, 0.6)');
                        cardItself.style.setProperty('--current-glow-solid', 'var(--warning)');
                        cardItself.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                        if(statusBadge) {
                            statusBadge.style.display = 'inline-block';
                            statusBadge.innerText = 'DURATION REQUIRED';
                            statusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
                            statusBadge.style.color = 'var(--warning)';
                            statusBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                        }
                    }

                    // Render the Chips
                    let html = `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">`;
                    const limit = Math.min(3, window.workspaceRxList.length);
                    
                    for(let i = 0; i < limit; i++) {
                        let safeName = workspaceRxList[i].name || "Drug";
                        let safeDose = workspaceRxList[i].dose || "0 mL";
                        let safeFreq = workspaceRxList[i].frequency || "SOS";
                        
                        html += `
                            <div class="rx-staging-chip" style="animation-delay: ${i * 0.08}s;">
                                <div style="font-size: 0.9rem; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55%;">${safeName}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: 'SF Mono', ui-monospace, monospace; font-weight: 700;">${safeDose} • <span style="color: #fff;">${safeFreq}</span></div>
                            </div>
                        `;
                    }
                    
                    if (window.workspaceRxList.length > 3) {
                        html += `
                            <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; padding: 6px; text-align: center; margin-top: 4px;">
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">RX QUEUE: ${window.workspaceRxList.length} TOTAL ITEMS</div>
                            </div>
                        `;
                    }

                    html += `</div>`;
                    previewContainer.innerHTML = html;
                }
            }
        }

        window.editDuration = function(index) {
            let currentVal = workspaceRxList[index].duration || "";
            let newVal = prompt("Enter duration (e.g., 5 Days, 1 Week, SOS):", currentVal);
            if (newVal !== null) {
                workspaceRxList[index].duration = newVal.trim();
                renderWorkspaceRx(); 
            }
        };

        window.removeWorkspaceItem = function(index) {
            workspaceRxList.splice(index, 1);
            renderWorkspaceRx();
        };

        window.clearWorkspace = function() {
            workspaceRxList = [];
            const symp = document.getElementById('wsSymptoms');
            const adv = document.getElementById('wsAdvice');
            if(symp) symp.value = '';
            if(adv) adv.value = '';
            
            ['fever', 'uri', 'ge'].forEach(id => {
                const btn = document.getElementById('btnProto-' + id);
                if(btn) {
                    btn.style.background = 'rgba(0,0,0,0.4)';
                    btn.style.borderColor = 'rgba(255,255,255,0.1)';
                    btn.style.color = 'var(--text-muted)';
                }
            });
            renderWorkspaceRx();
        };

        // --- THE CINEMATIC DEPLOYMENT ENGINE ---
        window.executeDeploySequence = function() {
    const sympEl = document.getElementById('wsSymptoms');
    const advEl = document.getElementById('wsAdvice');
    const symp = sympEl ? sympEl.value : '';
    const adv = advEl ? advEl.value : '';
    
    if (window.workspaceRxList.length === 0 && !symp && !adv) return alert("Payload is empty. Aborting.");

    const btn = document.getElementById('deployRxBtn');
    if(!btn) return;
    
    const originalHTML = btn.innerHTML;
    document.body.classList.add('deploying-state');
    btn.innerHTML = `<span style="display: flex; align-items: center; gap: 8px;"><i class="ph-duotone ph-spinner ph-spin"></i> GENERATING PRESCRIPTION...</span>`;
    
    setTimeout(() => {
        document.body.classList.remove('deploying-state');
        btn.innerHTML = originalHTML;
        toggleWorkspace(false);
        
        // 1. Safe DOM Injection
        const safeSet = (id, val) => {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('textarea');
                el.id = id;
                el.style.display = 'none';
                document.body.appendChild(el);
            }
            el.value = val;
        };
        safeSet('rxCc', symp);
        safeSet('rxAdvice', adv);
        
        // 2. Data Sync & GHOST MODE PROXY
        try {
            let activeId = typeof AppStore !== 'undefined' ? AppStore.getActivePatientId() : null;
            
            // Map the modern array to the legacy Print Engine format
            const mappedRxList = workspaceRxList.map(item => {
                const doseStr = String(item.dose || "0 mL"); 
                const doseParts = doseStr.split(' ');
                return {
                    name: item.name || "Drug",
                    vol: doseParts[0] || "0",
                    unit: doseParts[1] || "mL",
                    freq: item.frequency || "SOS",
                    dur: item.duration || "",
                    details: item.formulation || ""
                };
            });

            if (activeId) {
                // NORMAL MODE: Save to actual patient database
                const p = AppStore.getPatient(activeId);
                if (p) {
                    p.rxList = mappedRxList;
                    AppStore.savePatient(p);
                }
            } else {
                // GHOST MODE: Bypass the "Open patient first" alert
                window.activePatientId = "GHOST_RX"; 
                
                // Temporarily intercept the AppStore to feed the Print Engine from memory
                if (typeof AppStore !== 'undefined' && !AppStore._isGhostProxied) {
                    const originalGetPatient = AppStore.getPatient;
                    AppStore.getPatient = function(id) {
                        if (id === "GHOST_RX" || id === window.activePatientId) {
                            return {
                                id: "GHOST_RX",
                                name: "Outpatient Visit", // Default title for Quick Rx
                                weight: document.getElementById('hudWeight') ? document.getElementById('hudWeight').value : '',
                                rxList: mappedRxList,
                                phone: "",
                                growthExplanation: ""
                            };
                        }
                        return originalGetPatient.call(AppStore, id);
                    };
                    
                    const originalGetActive = AppStore.getActivePatientId;
                    AppStore.getActivePatientId = function() {
                        return window.activePatientId || originalGetActive.call(AppStore);
                    };
                    
                    AppStore._isGhostProxied = true;
                }
            }
        } catch (err) {
            console.error("Failed to sync Rx", err);
        }

        // 3. UI OVERRIDE: Force the parent workspace to become visible
        const workspace = document.getElementById('activeWorkspace');
        if (workspace) workspace.style.display = 'block';

        // 4. Bulletproof Navigation & Rendering
        if (typeof window.generateRxPreview === 'function') window.generateRxPreview();
        if (typeof window.switchNavTab === 'function') window.switchNavTab('encounterSummaryGlobalView');
        
    }, 450); 
};
        
        window.printWorkspaceRx = executeDeploySequence;

        // ==========================================
// INTEGRATED RX FOOTER TELEMETRY
// ==========================================
window.updateIntegratedRxFooter = function() {
    const footer = document.getElementById('integratedRxFooter');
    const countBadge = document.getElementById('rxFooterCount');
    const statusText = document.getElementById('rxFooterStatus');
    const previewArea = document.getElementById('rxFooterPreview');
    
    if (!footer || !countBadge) return;
    
    // Safely grab the queue from the workspace engine
    const queue = typeof workspaceRxList !== 'undefined' ? workspaceRxList : [];
    const count = queue.length;
    
    countBadge.innerText = count;
    
    // State 1: Empty Queue
    if (count === 0) {
        statusText.innerText = "Empty";
        statusText.style.color = "var(--text-muted)";
        countBadge.style.background = "var(--bg-surface)";
        countBadge.style.color = "var(--text-muted)";
        countBadge.style.borderColor = "rgba(255,255,255,0.2)";
        footer.style.borderTop = "1px solid rgba(255,255,255,0.05)";
        footer.style.background = "rgba(0,0,0,0.3)";
        previewArea.style.display = "none";
        return;
    }
    
    // Detect missing durations
    let needsDuration = queue.some(d => !d.duration || d.duration.trim() === '');
    
    // State 2 & 3: Pending Details vs Ready
    if (needsDuration) {
        statusText.innerText = "Duration Required";
        statusText.style.color = "var(--warning)"; 
        countBadge.style.color = "var(--warning)";
        countBadge.style.borderColor = "var(--warning)";
        footer.style.borderTop = "1px solid rgba(255, 214, 0, 0.4)";
        footer.style.background = "linear-gradient(to bottom, rgba(255, 214, 0, 0.05), rgba(0,0,0,0.4))";
    } else {
        statusText.innerText = "Ready for Deployment";
        statusText.style.color = "var(--success)"; 
        countBadge.style.color = "var(--brand-cyan)";
        countBadge.style.borderColor = "var(--brand-cyan)";
        footer.style.borderTop = "1px solid rgba(0, 229, 255, 0.4)";
        footer.style.background = "linear-gradient(to bottom, rgba(0, 229, 255, 0.05), rgba(0,0,0,0.4))";
    }
    
    // Generate the 2-3 Med Preview
    let previewHtml = queue.slice(0, 2).map(d => 
        `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;">
            <span style="color:var(--brand-cyan);">•</span> ${d.name} ${d.dose ? `<span style="opacity:0.6;">(${d.dose})</span>` : ''}
        </div>`
    ).join('');
    
    if (count > 2) {
        previewHtml += `<div style="font-style: italic; opacity: 0.5; margin-top: 4px; padding-left: 8px;">+ ${count - 2} more pending...</div>`;
    }
    
    previewArea.innerHTML = previewHtml;
    previewArea.style.display = "block";
};

// Intercept the original render function so the footer updates instantly every time you add/remove a drug
if (typeof window.renderWorkspaceRx === 'function') {
    const originalRenderWorkspaceRx = window.renderWorkspaceRx;
    window.renderWorkspaceRx = function() {
        originalRenderWorkspaceRx();
        window.updateIntegratedRxFooter();
    };
}

// Fire once on load to establish the empty state
setTimeout(() => {
    if(typeof updateIntegratedRxFooter === 'function') updateIntegratedRxFooter();
}, 500);

// ==========================================
// NUCLEAR RX QUEUE BRIDGE (Bypasses all old logic)
// ==========================================

// 1. Bulletproof Observer (Checks for the button even after dynamic loading)
let doseObserverAttached = false;
setInterval(() => {
    if (doseObserverAttached) return;
    const targetNode = document.getElementById('hudQuickDoseRes');
    const bridgeBtn = document.getElementById('doseBridgeContainer');
    
    if (targetNode && bridgeBtn) {
        new MutationObserver(function() {
            if (targetNode.innerText.trim().length > 5) bridgeBtn.style.display = 'block';
            else bridgeBtn.style.display = 'none';
        }).observe(targetNode, { childList: true, subtree: true, characterData: true });
        doseObserverAttached = true;
    }
}, 1000);

// 2. The Nuclear Push Function
window.grabStructuredDose = function(btnElement) {
    const drugId = document.getElementById('hudQuickForm').value;
    const wtInput = document.getElementById('hudWeight');
    const wt = wtInput ? parseFloat(wtInput.value) : 0;

    if (!drugId || wt <= 0) {
        alert("Missing active drug or weight.");
        return;
    }

    // Get Drug Data
    let db = (typeof window.getUnifiedDB === 'function') ? window.getUnifiedDB() : window.drugsDb;
    if (!db) return;
    const drug = db.find(d => d.id === drugId);
    if (!drug) return;

    // Calculate Math
    let math = ClinicalMath.computeDose(drug, wt);
    let unit = ClinicalMath.getUnit(drug);
    const displayFreq = typeof window.translateFreqToLocal === 'function' ? window.translateFreqToLocal(drug.defaultFreq) : drug.defaultFreq;

    // Build the Object
    const medObject = {
        name: drug.name,
        formulation: drug.conc ? `${drug.conc}mg/${drug.vol}${unit.replace('s','')}` : `${drug.doseMg}mg`,
        dose: `${math.reqVol.toFixed(1)} ${unit}`,
        frequency: displayFreq || "SOS",
        duration: "" // Intentionally blank for UI warning
    };

        // 🔥 THE NUCLEAR PUSH: Directly inject into the global array
    window.workspaceRxList = window.workspaceRxList || [];
    window.workspaceRxList.push(medObject);

    // Visual Feedback
    if (btnElement) {
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = "✅ Rx Staged Successfully!";
        btnElement.style.background = "rgba(46, 213, 115, 0.2)";
        btnElement.style.borderColor = "#2ed573";
        btnElement.style.color = "#2ed573";
        
        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.style.background = "rgba(0, 229, 255, 0.1)";
            btnElement.style.borderColor = "var(--brand-cyan)";
            btnElement.style.color = "var(--brand-cyan)";
        }, 2000);
    }

    // 🔥 FORCE FOOTER UPDATE IMMEDIATELY
    if (typeof window.updateIntegratedRxFooter === 'function') {
        window.updateIntegratedRxFooter();
    }
    
    // Refresh sidebar list if it happens to be open
    if (typeof window.renderWorkspaceRx === 'function') {
        window.renderWorkspaceRx();
    }
};