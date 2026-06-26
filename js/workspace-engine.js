
        window.workspaceRxList = window.workspaceRxList || [];

        window.addToRxQueue = function(drugName, formulation, dose, frequency) {
    // 1. Guarantee the global array exists at the exact moment of click
    window.workspaceRxList = window.workspaceRxList || [];
    
    window.workspaceRxList.push({
        name: drugName,
        formulation: formulation || '',
        dose: dose || '',
        frequency: frequency || 'SOS',
        duration: '' // Leaves duration blank so the Staging Card glows amber
    });
    
    // 2. 🚀 THE FIX: Brute-force update ALL dashboard interfaces directly
    if (typeof window.renderWorkspaceRx === 'function') window.renderWorkspaceRx();
    if (typeof window.renderRxStaging === 'function') window.renderRxStaging();
    if (typeof window.updateIntegratedRxFooter === 'function') window.updateIntegratedRxFooter();
    
    // 3. Visual feedback
    if (typeof showSystemToast === 'function') {
        showSystemToast(`✅ ${drugName} Added to Rx Queue`);
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
            
            // 🚀 THE FIX: Force the drawer to draw the drugs immediately after downloading!
            if (typeof window.renderWorkspaceRx === 'function') window.renderWorkspaceRx();
            
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
            window.workspaceRxList = window.workspaceRxList || [];
            window.workspaceRxList.push(medObject);
            
            // 🚀 Force update ALL dashboard interfaces
            if (typeof window.renderWorkspaceRx === 'function') window.renderWorkspaceRx();
            if (typeof window.renderRxStaging === 'function') window.renderRxStaging();
            if (typeof window.updateIntegratedRxFooter === 'function') window.updateIntegratedRxFooter();
        }

        // Helper: Parses standard freq into UI Day-Parts (Bulletproofed)
        function parseFrequencyUI(freqStr) {
            if (!freqStr) freqStr = "SOS"; 
            let m = '0', a = '0', n = '0';
            let str = String(freqStr).toUpperCase();
            
            // Smarter Substring Matching
            if(str.includes('1-1-1') || str.includes('TDS') || str.includes('TID')) { m='1'; a='1'; n='1'; }
            else if(str.includes('1-0-1') || str.includes('BD') || str.includes('BID')) { m='1'; n='1'; }
            else {
                if(str.includes('1-0-0') || str.includes('OD') || str.includes('MORN')) m='1';
                if(str.includes('0-0-1') || str.includes('HS') || str.includes('NIGHT')) n='1';
            }
            
            // Catch-all for SOS / Q-hourly
            if(str.includes('SOS') || str.includes('PRN') || str.includes('Q')) { 
                if(m==='0') m='SOS'; 
                if(a==='0') a='SOS'; 
                if(n==='0') n='SOS'; 
            }

            const node = (val, icon, label) => {
                let active = val !== '0' && val !== '-';
                return `
                <div style="display: flex; flex-direction: column; align-items: center; opacity: ${active ? '1' : '0.3'}; transition: opacity 0.3s;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid ${active ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.2)'}; box-shadow: ${active ? '0 0 10px rgba(0,229,255,0.2), inset 0 0 8px rgba(0,229,255,0.1)' : 'none'}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: ${active ? 'var(--brand-cyan)' : '#fff'}; background: ${active ? 'rgba(0,229,255,0.05)' : 'transparent'};">
                        <i class="${icon}"></i>
                    </div>
                    <div style="font-size: 0.5rem; margin-top: 4px; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">${label}</div>
                    <div style="font-size: 0.75rem; font-weight: 900; color: #fff; margin-top: 2px;">${val}</div>
                </div>`;
            };

            return `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 8px;">
                ${node(m, 'ph-duotone ph-sun', 'MORN')}
                ${node(a, 'ph-duotone ph-cloud-sun', 'AFTN')}
                ${node(n, 'ph-duotone ph-moon', 'NIGHT')}
            </div>`;
        }

        // --- UPGRADED RENDERER: Holographic Mission Cards (Bulletproofed) ---
        window.renderWorkspaceRx = function() {
            const list = document.getElementById('clipboardRxList');
            if (!list) return; 
            
            if (window.workspaceRxList.length === 0) {
                list.innerHTML = '<div class="hud-empty-state" style="border: 1px dashed rgba(0,229,255,0.2); padding: 40px 0; font-size: 0.85rem; margin: 0; background: rgba(0,229,255,0.02); border-radius: 16px; color: rgba(255,255,255,0.4);">Payload Empty. Calculate a dose to begin.</div>';
            } else {
                list.innerHTML = '';
                window.workspaceRxList.forEach((item, index) => {
                    
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
                            
                            <div style="padding: 15px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; position: relative; z-index: 2;">
                                <div style="flex: 1 1 100px;">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-bottom: 8px;">DOSE</div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="ph-duotone ph-drop" style="font-size: 1.5rem; color: var(--brand-cyan);"></i>
                                        <div>
                                            <div style="font-size: 1.6rem; color: var(--brand-cyan); font-weight: 900; line-height: 1;">${doseVal} <span style="font-size: 1rem;">${doseUnit}</span></div>
                                            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">Per Dose</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="flex: 1 1 140px; cursor: pointer; padding-bottom: 5px;" onclick="editFrequency(${index})">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                                        FREQUENCY <i class="ph-bold ph-pencil-simple" style="color: var(--brand-cyan); font-size: 0.8rem;"></i>
                                    </div>
                                    ${dayPartsUI}
                                    <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 600; margin-top: 6px; text-align: center;">Tap to edit</div>
                                </div>
                                
                                <div style="flex: 1 1 120px;">
                                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-bottom: 8px;">DURATION</div>
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

                        // 🚀 THE FIX: Offload Dashboard syncing to the primary Engine
            if (typeof window.renderRxStaging === 'function') {
                window.renderRxStaging();
            }
        }; 

        // ==========================================
// RX QUEUE EDITORS
// ==========================================
window.editDuration = function(index) {
    if (!window.workspaceRxList[index]) return;
    let currentVal = window.workspaceRxList[index].duration || "";
    let newVal = prompt("Enter duration (e.g., 5 Days, 1 Week, SOS):", currentVal);
    if (newVal !== null) {
        window.workspaceRxList[index].duration = newVal.trim();
        if (typeof window.renderWorkspaceRx === 'function') window.renderWorkspaceRx(); 
    }
};

window.editFrequency = function(index) {
    if (!window.workspaceRxList[index]) return;
    let currentVal = window.workspaceRxList[index].frequency || "";
    let newVal = prompt("Enter Frequency (e.g., OD, BD, TDS, Q6H):", currentVal);
    if (newVal !== null) {
        window.workspaceRxList[index].frequency = newVal.trim();
        if (typeof window.renderWorkspaceRx === 'function') window.renderWorkspaceRx(); 
    }
};

        window.removeWorkspaceItem = function(index) {
            window.workspaceRxList.splice(index, 1);
            renderWorkspaceRx();
        };

        window.clearWorkspace = function() {
            window.workspaceRxList = [];
            const symp = document.getElementById('wsSymptoms');
            const adv = document.getElementById('wsAdvice');
            const temp = document.getElementById('wsTemp');
            if(symp) symp.value = '';
            if(adv) adv.value = '';
            if(temp) temp.value = '';
            
            ['fever', 'uri', 'ge'].forEach(id => {
                const btn = document.getElementById('btnProto-' + id);
                if(btn) {
                    btn.style.background = 'rgba(0,0,0,0.4)';
                    btn.style.borderColor = 'rgba(255,255,255,0.1)';
                    btn.style.color = 'var(--text-muted)';
                }
            });
            renderWorkspaceRx();

                        // Reset buttons and view
    const deployBtn = document.getElementById('deployRxBtn');
    if (deployBtn) {
        deployBtn.innerHTML = `<span style="display: flex; align-items: center; gap: 8px;"><i class="ph-fill ph-paper-plane-tilt"></i> DEPLOY RX</span>`;
        deployBtn.onclick = () => window.executeDeploySequence();
    }
    
    const previewArea = document.getElementById('inlineRxPreview');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = ''; // Wipe the old preview clean
        
        // Restore all the hidden input boxes precisely as they were
        Array.from(previewArea.parentElement.children).forEach(child => {
            if (child.id !== 'inlineRxPreview' && child.dataset.oldDisplay) {
                child.style.display = child.dataset.oldDisplay;
                delete child.dataset.oldDisplay; // Clean up memory
            }
        });
    }
};

      // --- THE CINEMATIC DEPLOYMENT ENGINE (Unified & Bulletproofed) ---
window.executeDeploySequence = function() {
    const sympEl = document.getElementById('wsSymptoms');
    const advEl = document.getElementById('wsAdvice');
    const tempEl = document.getElementById('wsTemp');
    const symp = sympEl ? sympEl.value : '';
    const adv = advEl ? advEl.value : '';
    const temp = tempEl ? tempEl.value : '';
    
    // 1. Data Validation
    if (window.workspaceRxList.length === 0 && !symp && !adv && !temp) return alert("Payload is empty. Aborting.");

    const btn = document.getElementById('deployRxBtn');
    if(!btn) return;
    
    // 2. Cinematic Loading State
    const originalHTML = btn.innerHTML;
    document.body.classList.add('deploying-state');
    btn.innerHTML = `<span style="display: flex; align-items: center; gap: 8px;"><i class="ph-duotone ph-spinner ph-spin"></i> GENERATING PRESCRIPTION...</span>`;
    
    setTimeout(() => {
        document.body.classList.remove('deploying-state');
        
        // 3. Safe DOM Injection for Legacy Data
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
        safeSet('rxTemp', temp);
        
        // 4. Data Sync & GHOST MODE PROXY
        try {
            let activeId = typeof AppStore !== 'undefined' ? AppStore.getActivePatientId() : null;
            
            // Map the modern array to the legacy Print Engine format
            const mappedRxList = window.workspaceRxList.map(item => {
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
                
                if (typeof AppStore !== 'undefined' && !AppStore._isGhostProxied) {
                    const originalGetPatient = AppStore.getPatient;
                    AppStore.getPatient = function(id) {
                        if (id === "GHOST_RX" || id === window.activePatientId) {
                            return {
                                id: "GHOST_RX",
                                name: "Outpatient Visit", 
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

        // 5. NATIVE FORMAL PREVIEW BUILDER 
        const previewArea = document.getElementById('inlineRxPreview');
        if (previewArea) {
            let settings = JSON.parse(localStorage.getItem('clinic_settings')) || {};
            let p = typeof AppStore !== 'undefined' ? AppStore.getPatient(window.activePatientId || AppStore.getActivePatientId()) : null;
            
            let logoHtml = settings.logo ? `<img src="${settings.logo}" style="max-height:80px; max-width:150px; object-fit:contain;">` : '';
            let clinicName = settings.clinicName || "Outpatient Clinic";
            let clinicAddress = settings.address || "";
            let clinicPhone = settings.phone ? `Ph: ${settings.phone}` : "";
            let docName = settings.docName || "Attending Physician";
            let docQual = settings.qual || "MBBS";
            let regNo = settings.regNo ? `Reg No: ${settings.regNo}` : "";
            let sigHtml = settings.signature ? `<img src="${settings.signature}" style="max-height:60px;">` : `<div style="height:60px;"></div>`;
            
            let pName = p && p.name && p.name !== "Outpatient Visit" ? p.name : "Outpatient";
            let pAge = p && p.ageYrs ? `${p.ageYrs}y` : (p && p.ageMos ? `${p.ageMos}m` : "-");
            let pGender = p && p.gender ? p.gender : "-";
            let pWt = document.getElementById('hudWeight') && document.getElementById('hudWeight').value ? document.getElementById('hudWeight').value + ' kg' : (p && p.weight ? `${p.weight} kg` : "-");
            let dateStr = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

            // Build Rx List (Added page-break avoidance)
            let rxListHtml = "";
            window.workspaceRxList.forEach((rx, idx) => {
                let dur = rx.duration ? ` for ${rx.duration}` : "";
                rxListHtml += `
                    <div style="margin-bottom:18px; page-break-inside: avoid;">
                        <div style="font-weight:bold; font-size:1.1rem; color:#0f172a;">${idx+1}. ${rx.name} ${rx.dose ? `<span style="font-size:0.9rem; font-weight:normal; color:#555;">(${rx.dose})</span>` : ''}</div>
                        <div style="font-size:0.95rem; color:#334155; margin-top:3px;">
                            <strong>Sig:</strong> <span style="font-weight:bold;">${rx.frequency}</span>${dur}
                        </div>
                    </div>
                `;
            });
                        // The Formal HTML Template (Dynamic Paper-Responsive Layout)
            let htmlContent = `
                <div id="rxPrintWrapper" style="font-family: Arial, sans-serif; background: #fff; padding: 25px; color: #000; line-height:1.4; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; min-height: 70vh;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1e293b; padding-bottom:15px; margin-bottom:15px;">
                        <div style="flex:0 0 auto; margin-right:20px;">
                            ${logoHtml}
                        </div>
                        <div style="flex:1; text-align:left;">
                            <h1 style="margin:0; font-size:1.8rem; color:#1e293b;">${clinicName}</h1>
                            <div style="font-size:0.9rem; color:#444;">${clinicAddress} ${clinicAddress && clinicPhone ? '|' : ''} ${clinicPhone}</div>
                        </div>
                        <div style="flex:1; text-align:right;">
                            <h2 style="margin:0; font-size:1.4rem; color:#000;">${docName}</h2>
                            <div style="font-size:0.95rem; font-weight:bold; color:#333;">${docQual}</div>
                            <div style="font-size:0.85rem; color:#555;">${regNo}</div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; background:#f8fafc; border:1px solid #cbd5e1; padding:8px 12px; margin-bottom:15px; font-size:0.85rem; border-radius:6px;">
                        <div><b>Name:</b> <span contenteditable="true" class="live-edit-field" style="border-bottom:1px dashed #94a3b8; padding:0 4px; outline:none; min-width:60px; display:inline-block;">${pName}</span></div>
                        <div><b>Age/Sex:</b> <span contenteditable="true" class="live-edit-field" style="border-bottom:1px dashed #94a3b8; padding:0 4px; outline:none; min-width:40px; display:inline-block;">${pAge} / ${pGender}</span></div>
                        <div><b>Wt:</b> <span contenteditable="true" class="live-edit-field" style="border-bottom:1px dashed #94a3b8; padding:0 4px; outline:none; min-width:40px; display:inline-block;">${pWt}</span></div>
                        <div><b>Date:</b> <span contenteditable="true" class="live-edit-field" style="border-bottom:1px dashed #94a3b8; padding:0 4px; outline:none; min-width:60px; display:inline-block;">${dateStr}</span></div>
                    </div>

                                        <div id="rxClinicalInfo" style="display:flex; gap:15px; flex-grow: 1;">
                        <div style="flex: 0 0 35%; border-right:1px solid #e2e8f0; padding-right:10px;">
                            ${temp ? `<div style="margin-bottom:10px;"><b>Temp:</b> <span style="color:#E53E3E; font-weight:bold;">${temp}</span></div>` : ''}
                            ${symp ? `<div style="margin-bottom:10px;"><b>C/O:</b><br><span style="font-size:0.85rem;">${symp.replace(/\n/g, '<br>')}</span></div>` : ''}
                            ${adv ? `<div style="margin-bottom:10px;"><b>Advice:</b><br><span style="font-size:0.85rem;">${adv.replace(/\n/g, '<br>')}</span></div>` : ''}
                        </div>

                        <div style="flex: 1; padding-left:10px;">
                            <div style="font-family:serif; font-size:2rem; font-weight:bold; color:#1e293b; margin-bottom:10px; line-height:1;">Rx</div>
                            ${rxListHtml}
                        </div>
                    </div>

                    <div id="rxFooter" style="margin-top:auto; border-top:1px solid #cbd5e1; padding-top:15px; display:flex; justify-content:space-between; align-items:flex-end; background: #fff;">
                        <div style="font-size: 0.75rem; color: #777;">
                            Reference: IAP Guidelines 2024 | WHO MGRS<br>
                            <em>Clinical reference only. Verify doses against standard protocols.</em>
                        </div>
                        <div style="display:flex; gap: 20px; align-items: flex-end;">
                            <div style="text-align: center;">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('Follow-up / Contact Clinic: ' + clinicPhone)}" style="width: 50px; height: 50px; display: block; margin: 0 auto 5px auto;">
                                <div style="font-size: 8px; color: #777;">Scan for Follow-up</div>
                            </div>
                            <div style="text-align:center; min-width: 150px;">
                                ${sigHtml}
                                <div style="border-top:1px dashed #333; padding-top:4px; font-weight:bold; font-size:0.9rem;">${docName}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            previewArea.innerHTML = htmlContent; 
            
            // Hide everything else in the drawer except the preview
            Array.from(previewArea.parentElement.children).forEach(child => {
                if (child.id !== 'inlineRxPreview' && child.style.display !== 'none' && child.tagName !== 'STYLE') {
                    child.dataset.oldDisplay = child.style.display || 'block';
                    child.style.display = 'none';
                }
            });
            
                        previewArea.style.display = 'block';
            previewArea.style.padding = '15px'; // Adds space around the floating paper 
        }

        // 6. CSS Print Injection (Non-Destructive)
        if (btn) {
            btn.innerHTML = `<span style="display: flex; align-items: center; gap: 8px;"><i class="ph-bold ph-printer"></i> PRINT RX</span>`;
            btn.onclick = () => {
                const style = document.createElement('style');
                style.innerHTML = `
                    @media print {
                        body * { visibility: hidden !important; }
                        #inlineRxPreview, #inlineRxPreview * { visibility: visible !important; color: black !important; box-shadow: none !important; }
                        #inlineRxPreview { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; border: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: white !important; }
                        
                        /* 1. Kill Flexbox for the printer so the text can flow infinitely across multiple pages */
                        #rxPrintWrapper { 
                            display: block !important;
                            min-height: auto !important; 
                            box-shadow: none !important; 
                            border: none !important; 
                            border-radius: 0 !important; 
                            margin: 0 !important; 
                        }
                        
                        /* 2. Anchor the Footer to the absolute bottom of EVERY printed page */
                        #rxFooter {
                            position: fixed !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            padding-top: 15px !important;
                            background: white !important;
                            page-break-inside: avoid;
                        }
                        
                        /* 3. Add padding to the bottom of the clinical text so it doesn't overlap the fixed footer */
                        #rxClinicalInfo {
                            padding-bottom: 130px !important; 
                        }
                        
                        .live-edit-field { border-bottom: none !important; }
                        @page { margin: 10mm; } 
                    }
                `;
                document.head.appendChild(style);
                
                window.print();
                
                setTimeout(() => { document.head.removeChild(style); window.location.reload(); }, 500);
            };
        }
        
    }, 450); 
};

// Ensure legacy print triggers map correctly to the new engine
window.printWorkspaceRx = window.executeDeploySequence;

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
    const queue = typeof window.workspaceRxList !== 'undefined' ? window.workspaceRxList : [];
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

// ==========================================
// VOICE DICTATION ENGINE (Web Speech API)
// ==========================================
window.speechRecognitionActive = false;
window.speechEngine = null;

window.toggleDictation = function() {
    const btn = document.getElementById('dictationBtn');
    const waves = document.getElementById('dictationWaves');
    const container = document.getElementById('dictationContainer');
    const textArea = document.getElementById('wsSymptoms');

    if (!btn || !textArea) return;

    if (!window.speechEngine) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice dictation is not supported in this browser. Please use your keyboard's microphone.");
            return;
        }
        
        window.speechEngine = new SpeechRecognition();
        window.speechEngine.continuous = false; 
        window.speechEngine.interimResults = true; 
        window.speechEngine.lang = 'en-US';

        window.speechEngine.onresult = function(event) {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript !== '') {
                // --- THE PSEUDO-AI CLINICAL SORTER ---
                let cleanText = finalTranscript.trim();
                
                // 1. Clinical Abbreviations
                cleanText = cleanText.replace(/\bhistory of\b/gi, 'H/O');
                cleanText = cleanText.replace(/\b(for|since)\b/gi, 'x');
                
                // 2. AUTO-BREAK: Instantly drop to a new line after time units
                cleanText = cleanText.replace(/\b(days|day|weeks|week|months|month|hours|hour|mins|minutes)\b/gi, '$1\n');
                
                // 3. CLINICAL TRIGGER WORDS: Detect headers and isolate them
                cleanText = cleanText.replace(/\b(chief complaints|presenting complaints|negative history|on examination|examination|vitals|investigations)\b/gi, '\n$1:\n');

                // 4. Convert spoken connectors into physical line breaks
                cleanText = cleanText.replace(/\b(next|and|comma|then|also)\b/gi, '\n');
                
                // 5. Clean up, capitalize, and intelligently format bullets vs headers
                cleanText = cleanText.split('\n').map(line => {
                    let t = line.trim();
                    if (!t) return ""; // Skip blank lines
                    
                    // If the engine detects a Trigger Word Header, capitalize it and skip the bullet
                    if (t.endsWith(':')) {
                        return "\n" + t.toUpperCase();
                    }
                    
                    // Otherwise, it's a standard symptom or finding. Add a bullet point!
                    return "• " + t.charAt(0).toUpperCase() + t.slice(1);
                }).join('\n');

                let currentVal = textArea.value.trim();
                // Append text safely with a double line break if there's already text there
                textArea.value = currentVal ? currentVal + "\n" + cleanText : cleanText;
                
                // 🚀 INSTANTLY TRIGGER AUTO-ADVICE GENERATOR AFTER DICTATING
                if(typeof window.autoGenerateAdvice === 'function') window.autoGenerateAdvice();
            }
        };

        window.speechEngine.onend = function() {
            window.speechRecognitionActive = false;
            btn.style.background = 'transparent';
            btn.style.color = 'var(--brand-pink)';
            waves.style.opacity = '0.3';
            container.style.boxShadow = 'none';
        };
        
        window.speechEngine.onerror = function(event) {
            console.error("Speech error:", event.error);
            window.speechEngine.stop();
        };
    }

    if (window.speechRecognitionActive) {
        window.speechEngine.stop();
    } else {
        try {
            window.speechEngine.start();
            window.speechRecognitionActive = true;
            btn.style.background = 'rgba(255, 51, 102, 0.2)';
            btn.style.color = '#fff';
            waves.style.opacity = '1';
            container.style.boxShadow = 'inset 0 0 15px rgba(255, 51, 102, 0.2)';
            textArea.focus();
        } catch(e) {
            console.error("Dictation start failed", e);
        }
    }
};

// ==========================================
// SMART ADVICE AUTO-GENERATOR
// ==========================================
window.autoGenerateAdvice = function() {
    const sympEl = document.getElementById('wsSymptoms');
    const advEl = document.getElementById('wsAdvice');
    const tempEl = document.getElementById('wsTemp');
    if (!sympEl || !advEl) return;

    let sympText = sympEl.value.toLowerCase();
    let tempText = tempEl ? tempEl.value.toLowerCase() : '';
    let combinedText = sympText + " " + tempText;
    
    let newAdvice = [];

    // Clinical mapping rules 
    if (combinedText.includes('fever') || combinedText.includes('temperature') || combinedText.includes('febrile') || combinedText.includes('100') || combinedText.includes('101') || combinedText.includes('102') || combinedText.includes('103')) {
        newAdvice.push("• Maintain adequate hydration\n• Tepid sponging for temp > 101°F\n• Return if persistent fever > 3 days\n• RED FLAGS: Lethargy, poor oral intake, zero urine output for 6 hours.");
    }
    if (combinedText.includes('cough') || combinedText.includes('cold') || combinedText.includes('runny') || combinedText.includes('coryza') || combinedText.includes('uri')) {
        newAdvice.push("• Steam inhalation twice daily\n• Avoid cold food/drinks\n• Saline drops before feeds if nasal block\n• Return if breathing gets fast or labored.");
    }
    if (combinedText.includes('vomit') || combinedText.includes('loose') || combinedText.includes('diarrhea') || combinedText.includes('watery') || combinedText.includes('ge')) {
        newAdvice.push("• STRICT ORS. No plain water.\n• Soft, freshly cooked diet. Avoid dairy if purging worsens.\n• RED FLAGS: Lethargy, sunken eyes, zero urine for 6 hours.");
    }

    let currentAdvice = advEl.value;
    let adviceAdded = false;

    newAdvice.forEach(adv => {
        // Only append the advice if it is not already sitting in the box
        if (!currentAdvice.includes(adv)) {
            currentAdvice += (currentAdvice ? '\n\n' : '') + adv;
            adviceAdded = true;
        }
    });

    if (adviceAdded) {
        advEl.value = currentAdvice;
        
        // Visual feedback: briefly glow the Care Directives box yellow to show it auto-filled
        advEl.style.transition = "all 0.3s";
        advEl.style.textShadow = "0 0 8px rgba(255, 176, 32, 0.5)";
        setTimeout(() => advEl.style.textShadow = "none", 800);
    }
};