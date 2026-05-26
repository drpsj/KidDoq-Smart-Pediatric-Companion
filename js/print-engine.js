function getPrintHeaderHTML(title, patientObj) {
        const p = patientObj || globalPatientsStore[activePatientId]; 
        if(!p) return "";
        let logoHtml = appSettings.logo ? `<img src="${appSettings.logo}" style="max-height:80px;">` : `<div style="font-size:40px;">🏥</div>`;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #000; padding-bottom:15px; margin-bottom:20px;">
                ${logoHtml}
                <div style="text-align:right; font-family:sans-serif;">
                    <div style="font-size:24px; font-weight:bold; color:#1e3a8a;">${appSettings.clinicName || 'Pediatric Clinical Hub'}</div>
                    <div style="font-size:18px; font-weight:bold;">${appSettings.docName || 'Doctor Name'}</div>
                    ${appSettings.qual ? `<div style="font-size:14px;">${appSettings.qual}</div>` : ''}
                    ${appSettings.regNo ? `<div style="font-size:14px;"><b>Reg No:</b> ${appSettings.regNo}</div>` : ''}
                    ${appSettings.tagline ? `<div style="font-size:14px; margin-top:5px; font-style:italic;">${appSettings.tagline}</div>` : ''}
                    ${appSettings.phone ? `<div style="font-size:12px; margin-top:5px;">📞 ${appSettings.phone}</div>` : ''}
                    ${appSettings.address ? `<div style="font-size:12px;">📍 ${appSettings.address}</div>` : ''}
                </div>
            </div>
            <div style="margin-bottom: 20px; font-family:sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 10px;">
                    <h1 style="margin: 0; font-size:22px; text-transform:uppercase; letter-spacing:1px; color:#1e3a8a;">${title}</h1>
                    <div style="font-size:14px;"><b>Date:</b> ${new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div style="font-size: 14px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 10px; display:flex; justify-content:space-between;">
                    <span><b>Patient:</b> ${p.name || "________________"}</span>
                    <span><b>Age:</b> ${p.ageYrs || "_"}Y ${p.ageMos || "_"}M</span>
                    <span><b>Weight:</b> ${p.weight || '___'} kg</span>
                    <span><b>Gender:</b> ${p.gender ? p.gender.toUpperCase() : "___"}</span>
                </div>
                ${p.diagnosis ? `<div style="font-size: 14px; margin-bottom:20px;"><b>Diagnosis / C.C:</b> ${p.diagnosis}</div>` : '<div style="margin-bottom:20px;"></div>'}
            </div>
        `;
    }

    function extractToolResult(elId) {
        let el = document.getElementById(elId); if(!el) return ""; let txt = el.innerHTML;
        if(txt.includes("Execute calculation") || txt.includes("Provide") || txt.includes("Enter") || txt.includes("Awaiting data")) return "";
        return `<div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-bottom:15px; font-family:sans-serif; line-height:1.6;">${txt}</div>`;
    }

    function generateCertTemplate() {
        let pId = activePatientId;
        let pName = pId ? globalPatientsStore[pId].name : (document.getElementById('pName').value || "________________");
        let pAgeY = pId ? globalPatientsStore[pId].ageYrs : (document.getElementById('ageYrs').value || "_");
        let pAgeM = pId ? globalPatientsStore[pId].ageMos : (document.getElementById('ageMos').value || "_");
        let pDiag = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "________________";
        let cDates = document.getElementById('certDates').value || "________________";
        let cat = document.getElementById('certCategory').value;
        let titleInput = document.getElementById('certTitle');
        let body = document.getElementById('certBody');
        
        if(!pDiag) pDiag = "________________";
        let text = "";
        
        if (cat === "leave") {
            titleInput.value = "MEDICAL LEAVE / REST CERTIFICATE";
            text = `This is to certify that ${pName}, aged ${pAgeY}Y ${pAgeM}M, has been examined by me and is diagnosed to be suffering from ${pDiag}.\n\nI consider that a period of rest and absence from school/duty for ${cDates} is absolutely necessary for the restoration of their health.`;
        } else if (cat === "fitness") {
            titleInput.value = "MEDICAL FITNESS CERTIFICATE";
            text = `This is to certify that I have carefully examined ${pName}, aged ${pAgeY}Y ${pAgeM}M. \n\nBased on the examination, they have recovered from ${pDiag} and are now medically fit to resume normal school/sports/duty activities with effect from ${cDates}.`;
        } else if (cat === "attendance") {
            titleInput.value = "ATTENDANCE / CLINIC VISIT CERTIFICATE";
            text = `This is to certify that ${pName}, aged ${pAgeY}Y ${pAgeM}M, attended this clinic on ${new Date().toLocaleDateString('en-IN')} for clinical consultation and evaluation regarding ${pDiag}.`;
        } else if (cat === "referral") {
            titleInput.value = "CLINICAL REFERRAL NOTE";
            text = `To the Consulting Specialist,\n\nKindly examine ${pName}, aged ${pAgeY}Y ${pAgeM}M, who has been diagnosed with / is being evaluated for ${pDiag}.\n\nPatient is being referred for further specialist evaluation and management.\n\nClinical Notes / Investigations:\n[Enter specific clinical findings or test results here]`;
        } else if (cat === "advice") {
            titleInput.value = "CLINICAL ADVICE / CARE PLAN";
            text = `Patient: ${pName} (${pAgeY}Y ${pAgeM}M)\nDiagnosis: ${pDiag}\n\nThe following care instructions and medical advice must be strictly followed:\n\n1. \n2. \n3. `;
        } else if (cat === "exemption") {
            titleInput.value = "MEDICAL EXEMPTION / AUTHORIZATION";
            text = `This is to certify that ${pName}, aged ${pAgeY}Y ${pAgeM}M, is currently under medical care for ${pDiag}.\n\nDue to this condition, the following is authorized / recommended:\n[State specific exemption e.g., exempt from physical activity, authorized to carry asthma inhaler, special toilet breaks]`;
        }
        
        if (cat !== "none") body.value = text;
    }

    function executePrint(mode) {
        // FIX 1: Allow both 'prescription' and 'rx' to pass the gatekeeper
        if (!activePatientId && mode !== 'prescription' && mode !== 'rx' && mode !== 'certificate') { 
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select or add a patient first!"); 
            return; 
        }
        const engine = document.getElementById('printEngine'); 
        
        let p = globalPatientsStore[activePatientId];
        if (!p) {
            p = {
                name: document.getElementById('pName').value || "____________________",
                ageYrs: document.getElementById('ageYrs').value || "_",
                ageMos: document.getElementById('ageMos').value || "_",
                weight: document.getElementById('pWeight').value || "___",
                gender: document.getElementById('gender').value || "___",
                diagnosis: document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "",
                tests: document.getElementById('rxTests') ? document.getElementById('rxTests').value : "",
                advice: document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "",
                review: document.getElementById('rxReview') ? document.getElementById('rxReview').value : "",
                rxList: []
            };
        }
        
        let html = "";

        if (mode === 'tracker' || mode === 'comprehensive') { 
            html += getPrintHeaderHTML("IMMUNIZATION SCHEDULE REPORT", p) + document.getElementById('timelineOutput').innerHTML; 
            if (mode === 'comprehensive') html += `<div class="page-break"></div>`; 
        }
        
        // FIX 2: Listen for BOTH 'prescription' and 'rx' triggers
        if (mode === 'prescription' || mode === 'rx') {
            html += getPrintHeaderHTML("PRESCRIPTION", p);
            
            // --- SMART PRINT LOGIC ---
            let printRxList = [];
            let printDx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
            let printAdvice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
            let printTests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
            
            if (p.rxList && p.rxList.length > 0) {
                // Draft is active
                printRxList = p.rxList;
            } else if (p.visits && p.visits.length > 0) {
                // Draft is empty, use latest ledger visit
                let latestVisit = p.visits[p.visits.length - 1];
                printRxList = latestVisit.rxList || [];
                if (!printDx) printDx = latestVisit.diagnosis || "";
                if (!printAdvice) printAdvice = latestVisit.advice || "";
                if (!printTests) printTests = latestVisit.tests || "";
            }
            
            // --- BUILD THE Rx UI ---
            html += `<div style="margin-bottom: 20px; font-family: sans-serif; color: #333;">
                        <b style="color: #1e3a8a;">Diagnosis:</b> ${printDx || "____________________"}
                     </div>`;
            
            html += `<h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-top: 20px; font-family: sans-serif; color: #1e3a8a;">Rx</h3>`;
            
            if (printRxList.length === 0) {
                html += `<p style="color:#64748b; font-family: sans-serif;">No medications prescribed.</p>`;
            } else {
                html += `<ul style="list-style-type: none; padding-left: 0; line-height: 1.8; font-family: sans-serif; color: #333;">`;
                printRxList.forEach(rx => {
                    html += `<li style="margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                                <strong style="font-size: 1.15rem; color: #0f172a;">${rx.name}</strong><br>
                                <span style="font-size: 1rem;">Give <b style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${rx.vol} ${rx.unit}</b> — <i>${rx.freq}</i></span>
                                ${rx.details ? `<div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">${rx.details}</div>` : ''}
                             </li>`;
                });
                html += `</ul>`;
            }
            
            if (printTests) html += `<div style="margin-top: 25px; font-family: sans-serif; color: #333;"><b style="color: #1e3a8a;">Required Investigations:</b><br>${printTests.replace(/\n/g, '<br>')}</div>`;
            if (printAdvice) html += `<div style="margin-top: 20px; font-family: sans-serif; color: #333;"><b style="color: #1e3a8a;">General Advice:</b><br>${printAdvice.replace(/\n/g, '<br>')}</div>`;
        }
        
        if (mode === 'certificate') {
            let cTitle = document.getElementById('certTitle') ? document.getElementById('certTitle').value : "MEDICAL CERTIFICATE";
            html += getPrintHeaderHTML(cTitle, p);
            let cBodyText = document.getElementById('certBody') ? document.getElementById('certBody').value : "No content provided.";
            cBodyText = cBodyText.replace(/\n/g, '<br>');
            let sigHtml = appSettings.signature ? `<img src="${appSettings.signature}" style="max-height:60px; margin-bottom:5px;"><br>` : `<br><br><br>`;
            
            html += `<div style="line-height:2; font-size:16px; margin-top:20px; text-align:justify; font-family:sans-serif;">${cBodyText}</div>`;
            html += `<div style="margin-top: 80px; width: 250px; text-align: center; float:right; font-family:sans-serif;">${sigHtml}<b>${appSettings.docName || 'Doctor'}</b><br>Authorized Signature</div><div style="clear:both;"></div>`;
        }

        if (mode === 'comprehensive') {
            html += getPrintHeaderHTML("COMPREHENSIVE CLINICAL SUMMARY", p);
            
            let maln = extractToolResult('malnGridOutput'); 
            if(maln) html += `<h3 style="font-family:sans-serif; color:#1e3a8a; border-bottom:1px solid #ccc; padding-bottom:5px;">Current Triage & Anthropometry</h3>${maln}`;
            
            html += `<h3 style="font-family:sans-serif; color:#1e3a8a; border-bottom:1px solid #ccc; padding-bottom:5px; margin-top:30px;">Longitudinal Medical History</h3>`;
            
            if (p.visits && p.visits.length > 0) {
                [...p.visits].reverse().forEach((visit) => {
                    const dateStr = new Date(visit.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
                    html += `
                    <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; font-family:sans-serif;">
                        <div style="font-weight:bold; font-size:16px; margin-bottom:10px; color:#334155;">Encounter Date: ${dateStr}</div>
                        ${visit.diagnosis ? `<div style="font-size:14px; margin-bottom:8px;"><b>Diagnosis:</b> ${visit.diagnosis}</div>` : ''}
                        ${visit.rxList && visit.rxList.length > 0 ? `<div style="font-size:14px; margin-bottom:8px;"><b>Medications Prescribed:</b><ul style="margin:5px 0; padding-left:20px;">${visit.rxList.map(rx => `<li>${rx.name} - ${rx.freq} (${rx.vol} ${rx.unit})</li>`).join('')}</ul></div>` : ''}
                        ${visit.tests ? `<div style="font-size:14px; margin-bottom:8px;"><b>Investigations:</b> ${visit.tests}</div>` : ''}
                        ${visit.advice ? `<div style="font-size:14px; margin-bottom:8px;"><b>Advice/Care Plan:</b> ${visit.advice}</div>` : ''}
                    </div>`;
                });
            } else {
                html += `<p style="font-family:sans-serif; color:#64748b;">No historical encounters recorded.</p>`;
            }
            
            html += `<div class="page-break"></div>`;
            html += getPrintHeaderHTML("IMMUNIZATION STATUS", p);
            html += document.getElementById('timelineOutput').innerHTML; 
        }

        html += `
            <div style="margin-top:50px; border-top:1px solid #ccc; padding-top:15px; text-align:center; font-family:sans-serif;">
                <div style="font-size:10px; color:#555; font-weight:bold; margin-bottom:5px;">
                    Reference: IAP Guidelines 2024 · WHO MGRS · ICMR-NIN · Harriet Lane 22nd Ed.
                </div>
                <div style="font-size:9px; color:#777; margin-bottom:8px;">
                    ⚠️ Clinical reference only. Verify doses against standard institutional protocols before administration.
                </div>
            </div>
        `;
        
        engine.innerHTML = ""; 
        engine.innerHTML = html; 
        
        const wasDarkMode = document.body.classList.contains('dark-mode');
        if (wasDarkMode) document.body.classList.remove('dark-mode');

        setTimeout(() => {
            window.print();
            if (wasDarkMode) document.body.classList.add('dark-mode');
        }, 500);
    }

    // --- WHATSAPP AUTOMATION ENGINE ---
    window.sendWACompReport = function() {
        // 1. Secure Read from Vault
        const activeId = AppStore.getActivePatientId();
        if(!activeId) { 
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!"); 
            return; 
        }
        
        const p = AppStore.getPatient(activeId);
        const settings = AppStore.getSettings(); // Pull doctor info from settings vault
        if (!p) return;

        // 2. Build the Message (Using WhatsApp Markdown: *bold*, _italic_)
        let msg = `🏥 *${settings.clinicName || 'Pediatric Clinical Hub'}*\n`;
        msg += `👨‍⚕️ *${settings.docName || 'Doctor'}*\n`;
        msg += `-----------------------------------\n\n`;
        
        msg += `👤 *Patient:* ${p.name}\n`;
        msg += `📅 *Age/Wt:* ${p.ageYrs || 0}Y ${p.ageMos || 0}M | ${p.weight} kg\n\n`;

        if (p.diagnosis) {
            msg += `🩺 *Diagnosis:* ${p.diagnosis}\n\n`;
        }

        if (p.rxList && p.rxList.length > 0) {
            msg += `💊 *Active Prescriptions:*\n`;
            p.rxList.forEach((rx, i) => { 
                msg += `${i+1}. *${rx.name}*\n   ↳ ${rx.vol} ${rx.unit || 'mL'} (${rx.freq})\n`;
                if (rx.details) msg += `   ℹ️ _${rx.details}_\n`;
            });
            msg += `\n`;
        }

        if (p.advice) {
            msg += `💡 *Care & Advice:*\n${p.advice}\n\n`;
        }

        if (p.tests) {
            msg += `🩸 *Investigations:* ${p.tests}\n\n`;
        }

        // Connects perfectly to the Vaccine Engine we built earlier!
        if (p.upcomingVaccinesForWhatsapp && p.upcomingVaccinesForWhatsapp.length > 0) {
            msg += `💉 *Upcoming Vaccines:*\n- ${p.upcomingVaccinesForWhatsapp.join('\n- ')}\n\n`;
        }

        if (p.review) {
            const reviewDate = new Date(p.review).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            msg += `🔄 *Next Review:* ${reviewDate}\n\n`;
        }

        msg += `_Note: This is an auto-generated clinical summary._`;

        // 3. Format the Phone Number safely
        let phone = p.phone ? p.phone.replace(/\D/g, '') : ""; // Strip non-numeric characters
        // If it's exactly 10 digits, assume India (+91)
        if (phone && phone.length === 10) {
            phone = "91" + phone;
        }

        // 4. Encode and Dispatch to WhatsApp API
        const encodedMsg = encodeURIComponent(msg);
        const waLink = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;

        // Launch in a new tab (Will trigger WhatsApp Web on PC, or WhatsApp App on Mobile)
        window.open(waLink, '_blank');
        if(typeof showSystemToast === 'function') showSystemToast("📱 Opening WhatsApp...");
    };