// js/clinical-math.js
/**
 * KidDoq Clinical Math Engine (Pure Functions)
 * This file handles ONLY raw medical calculations.
 * It has NO knowledge of the DOM (HTML) or the AppStore.
 */

const ClinicalMath = (function() {
    
    // 1. Core Dose Calculator
    function computeDose(drug, wt) {
        if (!drug || !wt) return null;
        if (drug.doseType === 'fixed') {
            return { reqMg: drug.doseMg || 0, reqVol: drug.vol, isMax: false };
        }
        
        let targetMg = drug.doseType === 'perDay' ? (wt * drug.doseMg) / (drug.div || 1) : (wt * drug.doseMg);
        let isMax = false;
        
        if (drug.maxMg && targetMg > drug.maxMg) {
            targetMg = drug.maxMg;
            isMax = true;
        }
        
        let reqVol = drug.conc > 0 ? (targetMg * drug.vol) / drug.conc : drug.vol;
        
        return { reqMg: targetMg, reqVol: reqVol, isMax: isMax };
    }

    // 2. Unit Resolver
    function getUnit(drug) {
        if (!drug || !drug.name) return 'mL';
        let n = drug.name.toLowerCase();
        if (n.includes('tablet') || n.includes('suppository')) return 'Tab/Supp';
        if (n.includes('drop')) return 'Drops';
        return 'mL';
    }

    // 3. Reverse Audit Engine (Takes mLs given -> Returns Clinical Status)
    function evaluateReverseAudit(drug, wt, volGiven) {
        if (!drug || !wt || !volGiven) return null;

        if (drug.doseType === 'fixed') {
            return { mgPerKgGiven: 0, targetDosePerDose: 0, percent: 100, statusText: "Fixed Dose", isFixed: true };
        }

        let mgGiven = (volGiven * drug.conc) / drug.vol;
        let targetDosePerDose = drug.doseType === 'perDay' ? (drug.doseMg / (drug.div || 1)) : drug.doseMg;
        let mgPerKgGiven = mgGiven / wt;
        let percent = (mgPerKgGiven / targetDosePerDose) * 100;
        
        let statusText = percent > 120 ? "Overdose" : (percent < 80 ? "Underdose" : "Optimal");
        let statusColor = percent > 120 ? "var(--danger)" : (percent < 80 ? "var(--warning)" : "var(--success)");
        
        return { mgPerKgGiven, targetDosePerDose, percent, statusText, statusColor, isFixed: false };
    }

    // 4. Vaccine Timeline Engine
    function calculateVaccineTimeline(patient, schema, todayDate = new Date()) {
        if (!patient || !schema) return {};
        
        const baseDate = new Date(patient.dob || todayDate);
        let computed = {};
        
        schema.forEach(v => {
            // Filter conditions
            if (v.condition === "je" && !patient.je) return;
            if (v.condition === "female" && patient.gender !== "female") return;
            
            // Calculate base target date
            let targetDate = new Date(baseDate);
            targetDate.setDate(targetDate.getDate() + (v.baseOffsetWeeks * 7));
            let finalDue = new Date(targetDate);
            let altered = false;
            
            // Handle minimum intervals based on previous doses
            if (v.dependsOn && computed[v.dependsOn]) {
                const givenDateStr = patient.givenDates && patient.givenDates[v.dependsOn];
                const parentDate = new Date(givenDateStr || computed[v.dependsOn].projected);
                const minInterval = new Date(parentDate);
                
                minInterval.setDate(minInterval.getDate() + (v.minIntervalWeeks * 7));
                
                if (finalDue < minInterval) { 
                    finalDue = minInterval; 
                    altered = true; 
                }
            }
            
            // Determine status
            let given = patient.givenDates && patient.givenDates[v.id];
            let status = given ? "done" : (finalDue < todayDate ? "overdue" : "upcoming");
            
            // Build the final object
            computed[v.id] = { 
                ...v, 
                projected: finalDue.toISOString().split('T')[0], 
                actual: given || "", 
                isDelayed: altered, 
                status: status 
            };
        });
        
        return computed;
    }

    // 5. Anthropometry & Malnutrition Engine
    function calculateExpectedWeight(ageYrs, ageMos) {
        if (ageYrs === 0 && ageMos === 0) return null;
        if (ageYrs < 1) return (ageMos + 9) / 2;
        if (ageYrs >= 1 && ageYrs <= 6) return (ageYrs * 2) + 8;
        if (ageYrs >= 7 && ageYrs <= 12) return ((ageYrs * 7) - 5) / 2;
        return null;
    }

    function evaluateMAC(macCm) {
        if (!macCm || macCm <= 0) return null;
        if (macCm < 11.5) return { status: "Severe Acute Malnutrition (SAM)", color: "var(--danger)" };
        if (macCm >= 11.5 && macCm <= 12.5) return { status: "Moderate Acute Malnutrition (MAM)", color: "var(--warning)" };
        return { status: "Normal Nutritional Status", color: "var(--success)" };
    }

    function classifyWellcomeTrust(wfaPercent, hasOedema) {
        if (wfaPercent > 80) return "Normal / Well Nourished";
        if (wfaPercent >= 60 && wfaPercent <= 80) return hasOedema ? "Kwashiorkor" : "Underweight";
        return hasOedema ? "Marasmic-Kwashiorkor" : "Marasmus";
    }

    // Expose the pure functions
    return {
        computeDose,
        getUnit,
        evaluateReverseAudit,
        calculateVaccineTimeline,
        calculateExpectedWeight, // <-- NEW
        evaluateMAC,             // <-- NEW
        classifyWellcomeTrust    // <-- NEW
    };
})();