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

    // 6. Harriet Lane Blood Pressure Percentiles (Median Height Estimator)
    function evaluateBP(sys, dia, ageYrs, gender) {
        if (!sys || !dia) return null;
        let age = Math.max(1, Math.min(17, ageYrs)); // Bound between 1 and 17
        
        // 90th & 95th Percentile Thresholds (Systolic/Diastolic) from Harriet Lane Tables 6-1, 6-2 (50th Ht)
        const bpLimits = {
            female: {
                1: { s90: 100, d90: 54, s95: 104, d95: 58 }, 2: { s90: 102, d90: 58, s95: 105, d95: 62 },
                3: { s90: 103, d90: 62, s95: 107, d95: 66 }, 4: { s90: 104, d90: 65, s95: 108, d95: 69 },
                5: { s90: 106, d90: 67, s95: 110, d95: 71 }, 6: { s90: 107, d90: 69, s95: 111, d95: 73 },
                7: { s90: 109, d90: 70, s95: 113, d95: 74 }, 8: { s90: 111, d90: 71, s95: 115, d95: 75 },
                9: { s90: 113, d90: 73, s95: 117, d95: 77 }, 10: { s90: 115, d90: 74, s95: 119, d95: 78 },
                11: { s90: 117, d90: 75, s95: 121, d95: 79 }, 12: { s90: 119, d90: 76, s95: 123, d95: 80 },
                13: { s90: 121, d90: 78, s95: 125, d95: 82 }, 14: { s90: 122, d90: 79, s95: 126, d95: 83 },
                15: { s90: 124, d90: 79, s95: 128, d95: 83 }, 16: { s90: 125, d90: 80, s95: 128, d95: 84 },
                17: { s90: 125, d90: 80, s95: 129, d95: 84 }
            },
            male: {
                1: { s90: 98, d90: 53, s95: 102, d95: 57 }, 2: { s90: 102, d90: 57, s95: 106, d95: 61 },
                3: { s90: 105, d90: 61, s95: 109, d95: 65 }, 4: { s90: 107, d90: 64, s95: 111, d95: 68 },
                5: { s90: 108, d90: 67, s95: 112, d95: 71 }, 6: { s90: 110, d90: 70, s95: 114, d95: 74 },
                7: { s90: 111, d90: 72, s95: 115, d95: 76 }, 8: { s90: 112, d90: 73, s95: 116, d95: 77 },
                9: { s90: 113, d90: 74, s95: 117, d95: 79 }, 10: { s90: 115, d90: 75, s95: 119, d95: 80 },
                11: { s90: 117, d90: 76, s95: 121, d95: 80 }, 12: { s90: 119, d90: 77, s95: 123, d95: 81 },
                13: { s90: 122, d90: 77, s95: 126, d95: 82 }, 14: { s90: 125, d90: 78, s95: 128, d95: 82 },
                15: { s90: 127, d90: 79, s95: 131, d95: 83 }, 16: { s90: 130, d90: 81, s95: 134, d95: 85 },
                17: { s90: 133, d90: 83, s95: 136, d95: 87 }
            }
        };

        let ref = bpLimits[gender === 'female' ? 'female' : 'male'][age];
        
        if (sys >= ref.s95 || dia >= ref.d95) return { status: "Hypertension (≥95th %ile)", color: "var(--danger)" };
        if (sys >= ref.s90 || dia >= ref.d90) return { status: "Prehypertension (90th-95th %ile)", color: "var(--warning)" };
        return { status: "Normotensive", color: "var(--success)" };
    }

    // 7. Advanced Clinical Math
    function calcBSA(htCm, wtKg) {
        if (!htCm || !wtKg) return null;
        return Math.sqrt((htCm * wtKg) / 3600);
    }

    function calcEGFR(htCm, cr, ageYrs, gender) {
        if (!htCm || !cr) return null;
        let k = 0.55; // Child baseline
        if (ageYrs < 1) k = 0.45;
        if (ageYrs >= 13 && gender === 'male') k = 0.70;
        return (k * htCm) / cr;
    }

    // 8. Electrolyte & Free Water Corrections
    function calcSodiumCorrection(wtKg, currentNa, targetNa = 135) {
        if (!wtKg || !currentNa) return null;
        
        let tbw = wtKg * 0.6; // Total Body Water estimate (0.6L/kg)
        let naDeficit = (targetNa - currentNa) * tbw;
        let freeWaterDeficit = tbw * ((currentNa / targetNa) - 1);
        
        return {
            naDeficit: naDeficit > 0 ? naDeficit : 0, // Hyponatremia
            freeWaterDeficit: freeWaterDeficit > 0 ? freeWaterDeficit * 1000 : 0 // Hypernatremia (converted to mL)
        };
    }

    // 9. Harriet Lane Burn Resuscitation (Parkland Formula)
    function calcParkland(wtKg, burnPercent) {
        if (!wtKg || !burnPercent) return null;
        let totalFluid = 4 * wtKg * burnPercent;
        return {
            total: totalFluid,
            first8h: totalFluid / 2,
            next16h: totalFluid / 2
        };
    }

    // 10. Harriet Lane Umbilical Line Depth (Regression Formulas)
    function calcUmbilicalLines(bwKg) {
        if (!bwKg) return null;
        let uacLow = bwKg + 7;
        let uacHigh = (3 * bwKg) + 9;
        let uvc = (0.5 * uacHigh) + 1;
        return { uacLow, uacHigh, uvc };
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
        evaluateBP,
        calcBSA,
        calcEGFR,
        calcParkland,
        calcUmbilicalLines
        calcSodiumCorrection
    };
})();