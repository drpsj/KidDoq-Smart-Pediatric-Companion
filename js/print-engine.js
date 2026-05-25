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
        if (!activePatientId && mode !== 'prescription' && mode !== 'certificate') { 
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
        
        if (mode === 'prescription' || mode === 'comprehensive') {
            html += getPrintHeaderHTML("PRESCRIPTION", p);
            let sigHtml = appSettings.signature ? `<img src="${appSettings.signature}" style="max-height:60px; margin-bottom:5px;"><br>` : `<br><br><br>`;
            let extraNotes = "";
            if (p.tests) extraNotes += `<div style="margin-top:20px; font-size:14px; font-family:sans-serif;"><b>Investigations / Scans:</b><br>${p.tests.replace(/\n/g, '<br>')}</div>`;
            if (p.advice) extraNotes += `<div style="margin-top:15px; font-size:14px; font-family:sans-serif;"><b>Advice & Care Plan:</b><br>${p.advice.replace(/\n/g, '<br>')}</div>`;
            if (p.review) extraNotes += `<div style="margin-top:15px; font-size:14px; font-weight:bold; color:#1e3a8a; font-family:sans-serif;">Next Review Date: ${new Date(p.review).toLocaleDateString('en-IN')}</div>`;

            if (p.rxList && p.rxList.length > 0) {
                html += `<div style="font-family:sans-serif;"><div style="font-size:32px; font-weight:bold; font-style:italic; margin-bottom:20px;">Rx</div>`;
                p.rxList.forEach((rx, index) => { 
                    html += `<div style="margin-bottom: 25px;"><div style="font-size:18px; font-weight:bold;">${index + 1}. ${rx.name}</div><div style="font-size:16px;">Take ${rx.vol} ${rx.unit || 'mL'} &mdash; ${rx.freq}</div><div style="color:#555; font-size:12px; margin-top:5px;">Target: ${rx.details}</div></div>`; 
                });
                html += `${extraNotes}<div style="margin-top: 50px; border-top: 1px solid #000; width: 250px; padding-top: 5px; text-align: center; float:right;">${sigHtml}<b>${appSettings.docName || 'Doctor'}</b><br>Authorized Signature</div><div style="clear:both;"></div></div>`;
            } else if (typeof pendingPrescriptionDrug !== 'undefined' && pendingPrescriptionDrug) {
                html += `<div style="font-family:sans-serif;"><div style="font-size:32px; font-weight:bold; font-style:italic; margin-bottom:20px;">Rx</div><div style="margin-bottom: 25px;"><div style="font-size:18px; font-weight:bold;">1. ${pendingPrescriptionDrug.name}</div><div style="font-size:16px;">Take ${pendingPrescriptionDrug.vol} ${pendingPrescriptionDrug.unit || 'mL'} &mdash; ${pendingPrescriptionDrug.freq}</div><div style="color:#555; font-size:12px; margin-top:5px;">Target: ${pendingPrescriptionDrug.details}</div></div>${extraNotes}<div style="margin-top: 50px; border-top: 1px solid #000; width: 250px; padding-top: 5px; text-align: center; float:right;">${sigHtml}<b>${appSettings.docName || 'Doctor'}</b><br>Authorized Signature</div><div style="clear:both;"></div></div>`;
            } else { 
                html += `<p style="font-family:sans-serif;">No active medications prescribed.</p>${extraNotes}<div style="margin-top: 50px; border-top: 1px solid #000; width: 250px; padding-top: 5px; text-align: center; float:right;">${sigHtml}<b>${appSettings.docName || 'Doctor'}</b><br>Authorized Signature</div><div style="clear:both;"></div>`; 
            }
            if (mode === 'comprehensive') html += `<div class="page-break"></div>`;
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
            html += getPrintHeaderHTML("CLINICAL TRIAGE & ANTHROPOMETRY REPORT", p);
            let maln = extractToolResult('malnGridOutput'); if(maln) html += `<h3 style="font-family:sans-serif;">Malnutrition & Anthropometry Triage</h3>${maln}`;
            let fluids = extractToolResult('fluidResultArea'); if(fluids) html += `<h3 style="font-family:sans-serif;">IV Fluid Resuscitation Protocol</h3>${fluids}`;
            let asthma = extractToolResult('pramResultArea'); if(asthma) html += `<h3 style="font-family:sans-serif;">Asthma PRAM Triage Score</h3>${asthma}`;
            let jaun = extractToolResult('jaunResultArea'); if(jaun) html += `<h3 style="font-family:sans-serif;">Neonatal Jaundice Triage Risk</h3>${jaun}`;
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
        
        // THE FIX: Temporarily disable Dark Mode for the printer
        const wasDarkMode = document.body.classList.contains('dark-mode');
        if (wasDarkMode) document.body.classList.remove('dark-mode');

        setTimeout(() => {
            window.print();
            
            // Restore Dark Mode the millisecond the print dialog closes
            if (wasDarkMode) document.body.classList.add('dark-mode');
        }, 500);
    }

    function sendWACompReport() {
        if(!activePatientId) { 
            if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!"); 
            return; 
        }
        const p = globalPatientsStore[activePatientId];
        let txt = `*Pediatric Clinical Report*\\nName: ${p.name}\\nAge: ${p.ageYrs}Y ${p.ageMos}M\\nWeight: ${p.weight} kg\\n\\n`;
        if(p.diagnosis) txt += `*Diagnosis:* ${p.diagnosis}\\n\\n`;
        if(p.rxList && p.rxList.length > 0) {
            txt += `*Active Prescriptions:*\\n`;
            p.rxList.forEach((rx, i) => { txt += `${i+1}. ${rx.name} - ${rx.vol} ${rx.unit || 'mL'} (${rx.freq})\\n`; });
            txt += `\\n`;
        }
        if(p.upcomingVaccinesForWhatsapp && p.upcomingVaccinesForWhatsapp.length > 0) {
            txt += `*Upcoming Vaccines:*\\n${p.upcomingVaccinesForWhatsapp.join(", ")}\\n\\n`;
        }
        if(p.advice) txt += `*Advice:*\\n${p.advice}\\n\\n`;
        if(p.tests) txt += `*Investigations:*\\n${p.tests}\\n\\n`;
        if(p.review) txt += `*Next Review:* ${new Date(p.review).toLocaleDateString('en-IN')}\\n\\n`;
        txt += `Please visit the clinic for your detailed follow-up.`;
        const targetPhone = p.phone ? p.phone.replace(/[^0-9]/g, "") : "";
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(txt)}`, '_blank');
    }