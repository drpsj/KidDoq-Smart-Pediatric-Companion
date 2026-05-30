// js/module-derm.js
/**
 * KidDoq Module: Dermatology
 * Harriet Lane Hemangioma & Wart Therapy Protocols.
 */

const hemangiomaDb = {
    beard: {
        risk: "Airway Involvement",
        details: "Infants with lesions in a beard distribution (chin, lips, mandibular region, and neck) are at greatest risk for airway involvement, often in the subglottic region, which may cause hoarseness and stridor.",
        management: "Careful observation. Consider systemic corticosteroids (2-3 mg/kg/day) or laser ablation if symptomatic."
    },
    periorbital: {
        risk: "Visual Axis Obstruction",
        details: "May cause amblyopia from obstruction of the visual axis or astigmatism from insidious compression of the globe or extension into the retrobulbar space.",
        management: "Requires careful observation and urgent evaluation by an ophthalmologist."
    },
    lumbosacral: {
        risk: "Spinal Malformations",
        details: "Lumbosacral hemangiomas that span the midline are associated with spinal malformations and anomalies of the anorectal and urogenital regions.",
        management: "Consider spinal ultrasound or MRI to rule out occult dysraphism."
    },
    multiple: {
        risk: "Visceral Hemangiomas",
        details: "Associated with visceral hemangiomas (e.g., liver) which often have high-flow patterns and may result in high-output cardiac failure and anemia. Large facial lesions are also associated with posterior fossa vascular malformations.",
        management: "May warrant abdominal ultrasound to look for organ involvement or neuroimaging for facial lesions."
    },
    kasabach: {
        risk: "Kasabach-Merritt Phenomenon",
        details: "Characterized by profound thrombocytopenia, anemia, and coagulopathy. Differentiated from benign hemangiomas by their deep red-blue appearance, marked firmness, and different histology.",
        management: "Requires aggressive medical management. This is a life-threatening complication."
    },
    uncomplicated: {
        risk: "Ulceration (Most Common)",
        details: "Ulceration from necrosis of the superficial component may result in severe pain, infection, hemorrhage, or scarring. The majority of hemangiomas otherwise require no intervention.",
        management: "Photo documentation to follow the rapid growth phase (2-4 months) and regression phase (6-12 months). Treat superinfections aggressively."
    }
};

const wartDb = [
    { type: "Keratolytics", agents: "Salicylic acid, Lactic acid, Tretinoin", pros: "Home therapy, low cost, low risk, little pain.", cons: "Slow response, requires compliance, local irritation." },
    { type: "Destructive: Cryotherapy", agents: "Liquid Nitrogen", pros: "Quick office procedure, relatively low cost.", cons: "Painful, risk of scarring, warts may recur." },
    { type: "Destructive: Caustics", agents: "Topical acids, Podophyllin", pros: "Home or office therapy.", cons: "Systemic toxicity risk (podophyllin), irritation." },
    { type: "Destructive: Vesicants", agents: "Cantharidin", pros: "Occasionally effective via intraepidermal blisters.", cons: "High risk of recurrence, prominent pigmentary changes." },
    { type: "Immunotherapy", agents: "Cimetidine (30-40 mg/kg/day)", pros: "Oral systemic treatment; avoids painful destruction.", cons: "May be no better than placebo; requires 2-month course." }
];

window.calcHemangioma = function() {
    const val = document.getElementById('hemangiomaSelect').value;
    const out = document.getElementById('hemangiomaOutputArea');
    
    if(!val) {
        out.innerHTML = "Select a location to view Harriet Lane complication risks and management.";
        out.className = "tool-result neutral";
        return;
    }
    
    const data = hemangiomaDb[val];
    
    out.innerHTML = `
        <div style="text-align:left; width:100%;">
            <h3 style="margin:0 0 10px 0; color:var(--danger);">Primary Risk: ${data.risk}</h3>
            <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border-left:4px solid var(--danger); box-shadow:var(--shadow-sm); font-size:0.95rem; line-height:1.6; color:var(--text-main);">
                <b>Clinical Features:</b> ${data.details}<br><br>
                <b>Management:</b> ${data.management}
            </div>
        </div>
    `;
    out.className = "tool-result";
    out.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
    out.style.borderColor = "var(--danger)";
};

window.renderWartTherapy = function() {
    const out = document.getElementById('wartTherapyArea');
    if (!out) return;
    
    let html = "";
    wartDb.forEach(w => {
        html += `
        <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border:1px solid var(--border-soft); box-shadow:var(--shadow-sm);">
            <h4 style="margin:0 0 8px 0; color:var(--primary);">${w.type}</h4>
            <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:8px;">Agents: ${w.agents}</div>
            <div style="font-size:0.85rem; color:var(--success); margin-bottom:5px;"><b>Pros:</b> ${w.pros}</div>
            <div style="font-size:0.85rem; color:var(--danger);"><b>Cons:</b> ${w.cons}</div>
        </div>`;
    });
    
    out.innerHTML = html;
};