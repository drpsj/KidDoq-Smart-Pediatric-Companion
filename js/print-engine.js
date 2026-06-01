// js/print-engine.js

function getPrintHeaderHTML(title, patientObj) {
    const p = patientObj || AppStore.getPatient(activePatientId); 
    if(!p) return "";
    
    // Fix: Force logo to be small and professional, removed default emoji
    let logoHtml = appSettings.logo ? `<img src="${appSettings.logo}" style="max-height: 80px; max-width: 80px; object-fit: contain;">` : ``;
    
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
            </div>
    `;
}

function getPrintFooterHTML(p) {
    const sigSettings = typeof AppStore !== 'undefined' ? AppStore.getSettings() : {};
    let sigData = sigSettings.signature || localStorage.getItem('doctor_sig');
    let sigImg = sigData ? `<img src="${sigData}" style="max-height:60px; display:block; margin: 0 auto 5px auto;">` : `<div style="height:40px;"></div>`;
    
    let clinicPhone = sigSettings.phone || 'Clinic';
    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('Follow-up / Contact Clinic: ' + clinicPhone)}`;

    return `
        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 15px; display: flex; justify-content: space-between; align-items:flex-end; font-family:sans-serif;">
            <div style="font-size: 0.75rem; color: #777;">
                Reference: IAP Guidelines 2024 | WHO MGRS<br>
                <em>Clinical reference only. Verify doses against standard protocols.</em>
            </div>
            <div style="text-align: center; width: 220px; display: flex; gap: 15px; align-items: flex-end;">
                <div>
                    <img src="${qrUrl}" style="width: 50px; height: 50px; display: block; margin: 0 auto 5px auto;">
                    <div style="font-size: 8px; color: #777;">Scan for Follow-up</div>
                </div>
                <div style="flex:1;">
                    ${sigImg}
                    <div style="border-top: 1px dashed #333; padding-top: 5px; font-weight: bold; font-size: 0.9rem; color:#000;">
                        ${sigSettings.docName || localStorage.getItem('doc_name') || 'Doctor'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.extractToolResult = function(elId) {
    let el = document.getElementById(elId); if(!el) return ""; let txt = el.innerHTML;
    if(txt.includes("Execute calculation") || txt.includes("Provide") || txt.includes("Enter") || txt.includes("Awaiting data")) return "";
    return `<div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-bottom:15px; font-family:sans-serif; line-height:1.6;">${txt}</div>`;
};

window.generateCertTemplate = function() {
    let pId = activePatientId;
    let pName = pId ? AppStore.getPatient(pId).name : (document.getElementById('pName').value || "________________");
    let pAgeY = pId ? AppStore.getPatient(pId).ageYrs : (document.getElementById('ageYrs').value || "_");
    let pAgeM = pId ? AppStore.getPatient(pId).ageMos : (document.getElementById('ageMos').value || "_");
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
};

window.generateCompactVaccineTable = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) return "";
    
    const timeline = ClinicalMath.calculateVaccineTimeline(p, baseVaccineSchema); 
    
    let html = `
    <style>
        .vax-print-tbl { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; margin-top: 10px; }
        .vax-print-tbl th, .vax-print-tbl td { border: 1px solid #ccc; padding: 5px; text-align: left; }
        .vax-print-tbl th { background-color: #f3f4f6; color: #1e3a8a; }
        .vax-overdue { color: #d93025; font-weight: bold; }
        .vax-done { color: #188038; font-weight: bold; }
    </style>
    <h4 style="margin-bottom: 5px; font-family:sans-serif; color:#1e3a8a; border-bottom:1px solid #ccc; padding-bottom:3px;">Immunization Record (Catch-Up Adjusted)</h4>
    <table class="vax-print-tbl">
        <thead>
            <tr><th style="width:40%;">Vaccine</th><th>Target Date</th><th>Date Given</th><th>Status</th></tr>
        </thead>
        <tbody>`;

    Object.values(timeline).forEach(v => {
        const proj = new Date(v.projected).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
        const given = v.actual ? new Date(v.actual).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : "";
        const statusTxt = v.actual ? `<span class="vax-done">✔ Given</span>` : (v.status === 'overdue' ? `<span class="vax-overdue">⚠ Overdue</span>` : `Due`);

        html += `<tr>
            <td><b>${v.name}</b> ${v.isDelayed ? '<i>(Adjusted)</i>' : ''}</td>
            <td>${proj}</td>
            <td>${given}</td>
            <td>${statusTxt}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    return html;
};

window.generateNutritionReport = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) return "<p>No patient data found.</p>";

    const logs = p.dietLogs || [];
    const advice = p.advice || "Follow a balanced, age-appropriate diet as discussed.";
    
    let html = `
    <style>
        .diet-print-wrapper { font-family: sans-serif; font-size: 12px; color: #333; }
        .diet-section-title { color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-top: 20px; font-size: 14px; text-transform: uppercase; }
        .diet-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        .diet-table th, .diet-table td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
        .diet-table th { background-color: #f3f4f6; color: #1e3a8a; font-weight: bold; }
        .diet-advice-box { background-color: #f8fafc; border: 1px dashed #94a3b8; padding: 12px; border-radius: 6px; margin-top: 15px; font-style: italic; }
    </style>
    
    <div class="diet-print-wrapper">
        <h3 class="diet-section-title">🍽️ 24-Hour Dietary Recall Log</h3>`;

    if (logs.length > 0) {
        html += `
        <table class="diet-table">
            <thead>
                <tr><th style="width:15%;">Meal</th><th style="width:35%;">Food Item</th><th>Est. Calories</th><th>Est. Protein (g)</th></tr>
            </thead>
            <tbody>`;
        
        let totalCals = 0;
        let totalPro = 0;
        
        logs.forEach(log => {
            const cals = parseFloat(log.calories) || 0;
            const pro = parseFloat(log.protein) || 0;
            totalCals += cals;
            totalPro += pro;
            
            html += `<tr>
                <td><b>${log.mealType || '-'}</b></td>
                <td>${log.foodName || '-'} <i>(${log.qty || ''})</i></td>
                <td>${cals.toFixed(0)} kcal</td>
                <td>${pro.toFixed(1)} g</td>
            </tr>`;
        });

        html += `
            <tr style="background-color:#eff6ff; font-weight:bold;">
                <td colspan="2" style="text-align:right;">24h Total Intake:</td>
                <td>${totalCals.toFixed(0)} kcal</td>
                <td>${totalPro.toFixed(1)} g</td>
            </tr>
            </tbody>
        </table>`;
    } else {
        html += `<p style="color:#6b7280; font-style:italic;">No dietary recall logged for this visit.</p>`;
    }

    html += `
        <h3 class="diet-section-title">💡 Doctor's Nutritional Advice</h3>
        <div class="diet-advice-box">
            ${advice.replace(/\n/g, '<br>')}
        </div>
        
        <div style="margin-top:20px; font-size:10px; color:#6b7280; text-align:center;">
            *Caloric and protein requirements are based on ICMR/NIN guidelines for Indian children. Please consult the doctor before making drastic dietary changes.
        </div>
    </div>`;

    return html;
};

window.generateMilestonesReport = function(pId) {
    const p = AppStore.getPatient(pId);
    if (!p) return "<p>No patient data found.</p>";
    const achieved = p.achievedMilestones || {};
    
    let achievedHtml = "";
    let missedHtml = "";

    if(window.milestonesDb) {
        let ageMos = (parseInt(p.ageYrs) || 0) * 12 + (parseInt(p.ageMos) || 0);
        if(ageMos === 0) ageMos = 999; // Fallback if age not set
        
        Object.keys(window.milestonesDb).sort((a,b) => parseInt(a)-parseInt(b)).forEach(age => {
            window.milestonesDb[age].forEach(m => {
                if(achieved[m.id]) {
                    achievedHtml += `<li style="margin-bottom:4px;"><b>[${age}m] ${m.domain}:</b> ${m.text}</li>`;
                } else if (parseInt(age) <= ageMos) {
                    missedHtml += `<li style="margin-bottom:4px; color:#d93025;"><b>[${age}m] ${m.domain}:</b> ${m.text} <i>(Red Flag: ${m.sig})</i></li>`;
                }
            });
        });
    }

    let html = `
    <h3 style="color:#1e3a8a; font-family:sans-serif; border-bottom:2px solid #e5e7eb; padding-bottom:5px;">Developmental Milestones Evaluation</h3>
    <div style="display:flex; gap:20px; font-family:sans-serif; font-size:12px;">
        <div style="flex:1; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0;">
            <h4 style="margin:0 0 10px 0; color:#166534;">✔ Achieved Milestones</h4>
            <ul style="margin:0; padding-left:15px; color:#14532d;">${achievedHtml || '<li style="color:#666;">No milestones recorded yet.</li>'}</ul>
        </div>
        <div style="flex:1; background:#fef2f2; padding:15px; border-radius:8px; border:1px solid #fecaca;">
            <h4 style="margin:0 0 10px 0; color:#b91c1c;">🚨 Missed / Pending (Red Flags)</h4>
            <ul style="margin:0; padding-left:15px; color:#7f1d1d;">${missedHtml || '<li style="color:#666;">No significant delays noted.</li>'}</ul>
        </div>
    </div>`;
    return html;
};

window.executePrint = function(mode) {
    const currentPId = typeof AppStore !== 'undefined' ? AppStore.getActivePatientId() : null;
    if (!currentPId && mode !== 'certificate') { 
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!"); 
        return; 
    }
    
    const engine = document.getElementById('printEngine'); 
    let p = AppStore.getPatient(currentPId) || { name: "", ageYrs: "", ageMos: "", weight: "", gender: "", rxList: [] };
    let html = "";

    if (mode === 'nutrition') {
        html += getPrintHeaderHTML("PEDIATRIC NUTRITION & DIET PLAN", p);
        html += generateNutritionReport(currentPId);
    }

    if (mode === 'milestones') {
        html += getPrintHeaderHTML("DEVELOPMENTAL MILESTONES REPORT", p);
        html += window.generateMilestonesReport(currentPId);
    }

    if (mode === 'tracker' || mode === 'comprehensive') { 
        html += getPrintHeaderHTML("IMMUNIZATION SCHEDULE REPORT", p) + generateCompactVaccineTable(currentPId); 
        if (mode === 'comprehensive') html += `<div class="page-break"></div>`; 
    }

    if (mode === 'prescription' || mode === 'rx') {
        html += getPrintHeaderHTML("PRESCRIPTION", p);
        
        let printRxList = p.rxList || [];
        let printDx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
        let printAdvice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
        let printTests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
        let hopi = document.getElementById('rxHopi') ? document.getElementById('rxHopi').value.replace(/\n/g, '<br>') : "";
        
        let examHTML = "";
        ['RS', 'CVS', 'PA', 'CNS'].forEach(sys => {
            let val = document.getElementById('exam' + sys) ? document.getElementById('exam' + sys).value.trim() : "";
            if(val) examHTML += `<li style="margin-bottom:4px;"><b>${sys}:</b> ${val}</li>`;
        });

        let sympHtml = "";
        const tags = document.querySelectorAll('#symptomTagsArea .symptom-tag');
        if(tags.length > 0) {
            let sList = [];
            tags.forEach(t => sList.push(t.innerText.replace('✖', '').trim()));
            sympHtml = sList.join(", ");
        }

        if(sympHtml) html += `<div style="margin-bottom:10px; font-size:1rem; font-family:sans-serif; color:#333;"><b>Presenting Complaints:</b> ${sympHtml}</div>`;
        if(hopi) html += `<div style="margin-bottom:10px; font-size:0.95rem; font-family:sans-serif; color:#333;"><b>HOPI:</b><br>${hopi}</div>`;
        if(examHTML) html += `<div style="margin-bottom:15px; font-size:0.95rem; font-family:sans-serif; color:#333;"><b>Systemic Examination:</b><ul style="margin:5px 0; padding-left:20px;">${examHTML}</ul></div>`;
        if(printDx) html += `<div style="margin-bottom:20px; font-size:1.1rem; color:#1e3a8a; font-family:sans-serif;"><b>Diagnosis:</b> ${printDx}</div>`;

        html += `<h3 style="border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-top: 20px; font-family: serif; font-size: 2rem; color: #1e3a8a;">Rx</h3>`;
        
        if (printRxList.length === 0) {
            html += `<p style="color:#64748b; font-family: sans-serif;">No medications prescribed.</p>`;
        } else {
            html += `<ul style="list-style-type: none; padding-left: 0; line-height: 1.8; font-family: sans-serif; color: #333;">`;
            printRxList.forEach((rx, index) => {
                let translatedFreq = (typeof translateFreqToLocal === 'function') ? translateFreqToLocal(rx.freq) : rx.freq;
                let durText = rx.dur ? ` <span style="display:inline-block; margin-left:8px; padding:3px 8px; background-color:#1e3a8a; color:white; border-radius:4px; font-weight:900; letter-spacing:0.5px;">For ${rx.dur}</span>` : "";
                
                html += `<li style="margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px; break-inside: avoid;">
                            <strong style="font-size: 1.15rem; color: #0f172a;">${index + 1}. ${rx.name}</strong><br>
                            <div style="font-size: 1.05rem; margin-top: 4px; display:flex; align-items:center;">
                                Give <b style="font-weight:bold; margin: 0 5px;">${rx.vol} ${rx.unit}</b> — <span style="margin:0 5px; font-weight:bold;">${translatedFreq}</span> ${durText}
                            </div>
                            ${rx.details ? `<div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">${rx.details}</div>` : ''}
                         </li>`;
            });
            html += `</ul>`;
        }
        
        if (printTests) html += `<div style="margin-top: 25px; font-family: sans-serif; color: #333;"><b style="color: #1e3a8a;">Required Investigations:</b><br>${printTests.replace(/\n/g, '<br>')}</div>`;
        if (printAdvice) html += `<div style="margin-top: 20px; font-family: sans-serif; color: #333;"><b style="color: #1e3a8a;">General Advice:</b><br>${printAdvice.replace(/\n/g, '<br>')}</div>`;
        
        html += getPrintFooterHTML(p);
    }
    
    if (mode === 'certificate') {
        let cTitle = document.getElementById('certTitle') ? document.getElementById('certTitle').value : "MEDICAL CERTIFICATE";
        html += getPrintHeaderHTML(cTitle, p);
        let cBodyText = document.getElementById('certBody') ? document.getElementById('certBody').value : "No content provided.";
        cBodyText = cBodyText.replace(/\n/g, '<br>');
        
        const sigSettings = typeof AppStore !== 'undefined' ? AppStore.getSettings() : {};
        let sigHtml = sigSettings.signature ? `<img src="${sigSettings.signature}" style="max-height:60px; margin-bottom:5px;"><br>` : `<br><br><br>`;
        
        html += `<div style="line-height:2; font-size:16px; margin-top:20px; text-align:justify; font-family:sans-serif;">${cBodyText}</div>`;
        html += `<div style="margin-top: 80px; width: 250px; text-align: center; float:right; font-family:sans-serif;">${sigHtml}<b>${sigSettings.docName || 'Doctor'}</b><br>Authorized Signature</div><div style="clear:both;"></div>`;
    }

    if (mode === 'comprehensive') {
        html += getPrintHeaderHTML("COMPREHENSIVE CLINICAL SUMMARY", p);
        
        html += `<h3 style="font-family:sans-serif; color:#1e3a8a; border-bottom:1px solid #ccc; padding-bottom:5px;">Current Triage & Growth Anthropometry</h3>`;
        
        // Inject the newly generated Growth Explanation
        if (p.growthExplanation) {
            html += `<div style="background:#f8fafc; border-left:4px solid #1e3a8a; padding:15px; border-radius:6px; margin-bottom:15px; font-family:sans-serif; font-size:14px; line-height:1.6;">
                        <h4 style="margin:0 0 5px 0; color:#1e3a8a;">WHO Growth Chart Interpretation</h4>
                        ${p.growthExplanation}
                     </div>`;
        }

        let maln = typeof extractToolResult === 'function' ? extractToolResult('malnGridOutput') : ""; 
        if(maln) html += `${maln}`;

        // 💉 Inject the Vaccine Timeline
        if (typeof generateCompactVaccineTable === 'function') {
            html += generateCompactVaccineTable(currentPId);
        }
        
        // 🧠 Inject the Milestones Progress
        if (typeof generateMilestonesReport === 'function') {
            html += generateMilestonesReport(currentPId);
        }
        
        html += `<h3 style="font-family:sans-serif; color:#1e3a8a; border-bottom:1px solid #ccc; padding-bottom:5px; margin-top:30px;">Active Encounter Summary</h3>`;
        
        let printDx = document.getElementById('rxDiagnosis') ? document.getElementById('rxDiagnosis').value : "";
        let printAdvice = document.getElementById('rxAdvice') ? document.getElementById('rxAdvice').value : "";
        let printTests = document.getElementById('rxTests') ? document.getElementById('rxTests').value : "";
        
        let examHTML = "";
        ['RS', 'CVS', 'PA', 'CNS'].forEach(sys => {
            let val = document.getElementById('exam' + sys) ? document.getElementById('exam' + sys).value.trim() : "";
            if(val) examHTML += `<b>${sys}:</b> ${val} | `;
        });

        html += `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #1e3a8a; background: #f8fafc; border-radius: 8px; font-family:sans-serif;">
            <div style="font-weight:bold; font-size:16px; margin-bottom:10px; color:#1e3a8a;">Current Visit: ${new Date().toLocaleDateString('en-IN')}</div>
            ${printDx ? `<div style="font-size:14px; margin-bottom:8px;"><b>Diagnosis:</b> ${printDx}</div>` : ''}
            ${examHTML ? `<div style="font-size:14px; margin-bottom:8px; color:#475569;"><b>O/E:</b> ${examHTML.replace(/ \|\s*$/, '')}</div>` : ''}
            ${p.rxList && p.rxList.length > 0 ? `<div style="font-size:14px; margin-bottom:8px;"><b>Medications Prescribed:</b><ul style="margin:5px 0; padding-left:20px;">${p.rxList.map(rx => `<li>${rx.name} - ${translateFreqToLocal(rx.freq)} (${rx.vol} ${rx.unit})</li>`).join('')}</ul></div>` : ''}
            ${printTests ? `<div style="font-size:14px; margin-bottom:8px;"><b>Investigations:</b> ${printTests}</div>` : ''}
            ${printAdvice ? `<div style="font-size:14px; margin-bottom:8px;"><b>Advice/Care Plan:</b> ${printAdvice.replace(/\n/g, '<br>')}</div>` : ''}
        </div>`;
        
        html += getPrintFooterHTML(p);
    }
    
    engine.innerHTML = html; 
    
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            /* Using display:none completely collapses the white space pushing the print to the bottom half */
            body > *:not(#printEngine) { display: none !important; }
            #printEngine { display: block !important; position: static !important; width: 100%; padding: 0; background: white; }
            .chip-checkbox { display: none !important; }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            engine.innerHTML = "";
            style.remove();
        }, 500);
    }, 250);
};

window.sendWACompReport = function() {
    const activeId = AppStore.getActivePatientId();
    if(!activeId) { 
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please select a patient first!"); 
        return; 
    }
    
    const p = AppStore.getPatient(activeId);
    const settings = AppStore.getSettings(); 
    if (!p) return;

    let msg = `🏥 *${settings.clinicName || 'Pediatric Clinical Hub'}*\n`;
    msg += `👨‍⚕️ *${settings.docName || 'Doctor'}*\n`;
    msg += `-----------------------------------\n\n`;
    
    msg += `👤 *Patient:* ${p.name}\n`;
    msg += `📅 *Age/Wt:* ${p.ageYrs || 0}Y ${p.ageMos || 0}M | ${p.weight} kg\n\n`;

    if (p.diagnosis) {
        msg += `🩺 *Diagnosis:* ${p.diagnosis}\n\n`;
    }

    if (p.examRS || p.examCVS || p.examPA || p.examCNS) {
        msg += `🔎 *Examination:*\n`;
        if (p.examRS) msg += `- RS: ${p.examRS}\n`;
        if (p.examCVS) msg += `- CVS: ${p.examCVS}\n`;
        if (p.examPA) msg += `- P/A: ${p.examPA}\n`;
        if (p.examCNS) msg += `- CNS: ${p.examCNS}\n`;
        msg += `\n`;
    }

    if (p.rxList && p.rxList.length > 0) {
        msg += `💊 *Active Prescriptions:*\n`;
        p.rxList.forEach((rx, i) => { 
            msg += `${i+1}. *${rx.name}*\n   ↳ ${rx.vol} ${rx.unit || 'mL'} (${translateFreqToLocal(rx.freq)})\n`;
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

    // 📈 Inject the Dynamic Growth Assessment
    if (p.growthExplanation) {
        // Strip out HTML tags (like <br> and <b>) so it formats cleanly in WhatsApp
        let cleanGrowth = p.growthExplanation.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '');
        msg += `📈 *Growth Update:*\n${cleanGrowth}\n\n`;
    }

    // 💉 Inject Smart Vaccine Reminders (Next 30 Days)
    if (typeof ClinicalMath !== 'undefined' && typeof baseVaccineSchema !== 'undefined') {
        const timeline = ClinicalMath.calculateVaccineTimeline(p, baseVaccineSchema);
        let dueVax = [];
        let thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
        
        Object.values(timeline).forEach(v => {
            if (!v.actual && new Date(v.projected) <= thirtyDays) {
                let dateStr = new Date(v.projected).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
                let alert = v.status === 'overdue' ? ' ⚠️ (OVERDUE)' : '';
                dueVax.push(`- ${v.name} (Due: ${dateStr})${alert}`);
            }
        });
        
        if (dueVax.length > 0) {
            msg += `💉 *Upcoming / Due Vaccines:*\n${dueVax.join('\n')}\n\n`;
        }
    }

    msg += `_Note: This is an auto-generated clinical summary._`;

    let phone = p.phone ? p.phone.replace(/\D/g, '') : ""; 
    if (phone && phone.length === 10) {
        phone = "91" + phone;
    }

    const encodedMsg = encodeURIComponent(msg);
    const waLink = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;

    window.open(waLink, '_blank');
};