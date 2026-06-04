// js/module-cardio.js
/**
 * KidDoq Module: Cardiology
 * Harriet Lane ECG Normal Ranges & Endocarditis Prophylaxis.
 */

const ecgDb = {
    0: { age: "0 - 7 Days", hr: "95 - 160", axis: "+30 to +180", pr: "0.08 - 0.12", qrs: "0.05 - 0.07" },
    1: { age: "1 - 3 Weeks", hr: "105 - 180", axis: "+30 to +180", pr: "0.08 - 0.12", qrs: "0.05 - 0.07" },
    2: { age: "1 - 6 Months", hr: "110 - 180", axis: "+10 to +125", pr: "0.08 - 0.13", qrs: "0.05 - 0.07" },
    3: { age: "6 - 12 Months", hr: "110 - 170", axis: "+10 to +125", pr: "0.10 - 0.14", qrs: "0.05 - 0.07" },
    4: { age: "1 - 3 Years", hr: "90 - 150", axis: "+10 to +125", pr: "0.10 - 0.14", qrs: "0.06 - 0.07" },
    5: { age: "4 - 5 Years", hr: "65 - 135", axis: "0 to +110", pr: "0.11 - 0.15", qrs: "0.07 - 0.08" },
    6: { age: "6 - 8 Years", hr: "60 - 130", axis: "-15 to +110", pr: "0.12 - 0.16", qrs: "0.07 - 0.08" },
    7: { age: "9 - 11 Years", hr: "60 - 110", axis: "-15 to +110", pr: "0.12 - 0.17", qrs: "0.07 - 0.09" },
    8: { age: "12 - 16 Years", hr: "60 - 110", axis: "-15 to +110", pr: "0.12 - 0.17", qrs: "0.07 - 0.10" }
};

window.calcECG = function() {
    const val = document.getElementById('ecgAgeSelect').value;
    const out = document.getElementById('ecgOutputArea');
    const data = ecgDb[val];
    
    out.innerHTML = `
        <div style="text-align:left; width:100%;">
            <h4 style="margin:0 0 10px 0; color:var(--primary); border-bottom:1px solid var(--border-soft); padding-bottom:5px;">ECG Normals: ${data.age}</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.95rem;">
                <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-soft);"><b>Heart Rate:</b><br><span style="color:var(--primary-dark); font-size:1.1rem; font-weight:bold;">${data.hr} bpm</span></div>
                <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-soft);"><b>QRS Axis:</b><br><span style="color:var(--info); font-size:1.1rem; font-weight:bold;">${data.axis}&deg;</span></div>
                <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-soft);"><b>PR Interval:</b><br><span style="color:var(--success); font-size:1.1rem; font-weight:bold;">${data.pr} sec</span></div>
                <div style="background:var(--bg-surface); padding:10px; border-radius:6px; border:1px solid var(--border-soft);"><b>QRS Duration:</b><br><span style="color:var(--warning); font-size:1.1rem; font-weight:bold;">${data.qrs} sec</span></div>
            </div>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--text-muted);">*QTc should be &le;0.45 sec in infants &lt;6mo, and &le;0.44 sec in children.</div>
        </div>
    `;
    out.className = "tool-result";
};

window.calcSBE = function() {
    const wt = parseFloat(document.getElementById('sbeWeight').value);
    const penAllergy = document.getElementById('sbePenAllergy').checked;
    const out = document.getElementById('sbeOutputArea');
    
    if(!wt) { out.innerHTML = "Awaiting weight to calculate prophylaxis dosing."; out.className="tool-result neutral"; return; }
    
    let drug, dose, maxDose;
    if(penAllergy) {
        drug = "Clindamycin";
        dose = wt * 20; // 20 mg/kg
        maxDose = 600;
    } else {
        drug = "Amoxicillin";
        dose = wt * 50; // 50 mg/kg
        maxDose = 2000;
    }
    
    let finalDose = Math.min(dose, maxDose);
    let capWarning = dose > maxDose ? `<br><span style="color:var(--danger); font-size:0.8rem;">⚠️ Adult Max Cap Enforced (${maxDose}mg)</span>` : "";

    out.innerHTML = `
        <div style="text-align:left;">
            <h4 style="margin:0 0 10px 0; color:var(--danger);">SBE Prophylaxis (Give 1hr before procedure)</h4>
            <div style="background: rgba(239, 68, 68, 0.05); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.15);">
                <b>${drug}:</b> <span style="font-size:1.2rem; color:var(--primary); font-weight:bold;">${finalDose.toFixed(0)} mg</span> PO${capWarning}
            </div>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--text-muted);">
                <b>High Risk:</b> Prosthetic valves, previous endocarditis, complex cyanotic CHD, surgical systemic pulmonary shunts.<br>
                <b>Target Procedures:</b> Dental extractions, periodontal surgery, tonsillectomy/adenoidectomy.
            </div>
        </div>
    `;
    out.className = "tool-result";
};

// Vault Sync
window.syncCardioWeight = function() {
    if(typeof activePatientId !== 'undefined' && activePatientId && typeof AppStore !== 'undefined') {
        let p = AppStore.getPatient(activePatientId);
        if(p && p.weight) {
            let el = document.getElementById('sbeWeight');
            if(el && el.value !== p.weight) {
                el.value = p.weight;
                calcSBE();
            }
        }
    }
};