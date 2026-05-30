// js/module-tox.js
/**
 * KidDoq Module: Toxicology & Poisonings
 * Harriet Lane Antidotes & Management Protocols.
 */

const toxDb = {
    acetaminophen: {
        antidote: "N-Acetylcysteine (NAC)",
        management: "Draw level at 4hr post-ingestion and plot on Rumack-Matthew nomogram.<br><br><b>Oral Regimen:</b> Give 140 mg/kg loading dose, then 70 mg/kg Q4H for 17 doses.<br><br><b>IV Regimen:</b> Give 140 mg/kg loading dose over 1hr, then 70 mg/kg Q4H for 12 doses."
    },
    anticholinergics: {
        antidote: "Physostigmine",
        management: "Use only for pure anticholinergic poisoning unresponsive to standard supportive therapy (e.g., severe hallucinations, dysrhythmias, seizures).<br><br><b>Dose:</b> 0.02 mg/kg IV every 5 min (max total dose 2 mg). Give over 5 mins."
    },
    betablockers: {
        antidote: "Glucagon",
        management: "Useful for reversing severe bradycardia and hypotension in beta-blocker overdoses.<br><br><b>Pediatric Dose:</b> 0.05 - 0.1 mg/kg IV bolus, followed by 0.1 mg/kg/hr infusion."
    },
    ccb: {
        antidote: "Calcium & Glucagon",
        management: "Use for hypotension and bradydysrhythmias.<br><br><b>Calcium Chloride (10%):</b> 20 mg/kg IV.<br><b>Calcium Gluconate (10%):</b> 100 mg/kg IV.<br><br>Consider Glucagon (0.05-0.1 mg/kg) if unresponsive to fluid and calcium."
    },
    iron: {
        antidote: "Deferoxamine",
        management: "Indicated for serum iron > 500 mcg/dL or significant clinical symptoms.<br><br><b>Dose:</b> 15 mg/kg/hr via continuous IV infusion. Continue until all signs of toxicity resolve and 24 hours after 'vinrose' urine color disappears."
    },
    lead: {
        antidote: "Succimer (DMSA) / CaNa2 EDTA / BAL",
        management: "<b>Blood Lead 45-69 mcg/dL:</b> Oral Succimer (DMSA) 30 mg/kg/day divided Q8H for 5 days, then 20 mg/kg/day divided Q12H for 14 days.<br><br><b>Blood Lead >70 mcg/dL (Emergency):</b> Use parenteral BAL + CaNa2 EDTA."
    },
    opiates: {
        antidote: "Naloxone (Narcan)",
        management: "<b>Dose:</b> 0.1 mg/kg/dose IV/IM/SC/ETT (Max dose: 2 mg).<br><br>Repeat every 2 minutes as needed to improve respiratory status. Continuous infusion may be required for long-acting opioids (e.g., methadone)."
    },
    organophosphates: {
        antidote: "Atropine & Pralidoxime",
        management: "<b>Atropine:</b> 0.05 - 0.1 mg/kg IV (titrate to dry secretions and reduce bronchorrhea).<br><br><b>Pralidoxime:</b> 20 - 50 mg/kg IV/IM/SQ (shortens duration of muscle weakness)."
    }
};

window.calcTox = function() {
    const val = document.getElementById('toxinSelect').value;
    const out = document.getElementById('toxOutputArea');
    
    if(!val) {
        out.innerHTML = "Select a toxin to view Harriet Lane antidote and management protocols.";
        out.className = "tool-result neutral";
        return;
    }
    
    const data = toxDb[val];
    
    out.innerHTML = `
        <div style="text-align:left; width:100%;">
            <h3 style="margin:0 0 10px 0; color:var(--danger);">Antidote: ${data.antidote}</h3>
            <div style="background:var(--bg-surface); padding:15px; border-radius:8px; border-left:4px solid var(--danger); box-shadow:var(--shadow-sm); font-size:0.95rem; line-height:1.6; color:var(--text-main);">
                ${data.management}
            </div>
            <div style="margin-top:15px; font-size:0.8rem; color:var(--text-muted);">
                <b>⚠️ General Decontamination:</b> Secure ABCs. Activated charcoal (1 g/kg) is preferred for GI decontamination if the substance adsorbs and airway is secure.
            </div>
        </div>
    `;
    out.className = "tool-result";
    out.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
    out.style.borderColor = "var(--danger)";
};