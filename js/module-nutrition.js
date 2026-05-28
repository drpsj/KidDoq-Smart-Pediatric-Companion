// js/module-nutrition.js
/**
 * KidDoq Module: Nutrition & Diet
 * Handles ICMR target metrics, 24h diet recall, and the food database matrix.
 */

// ==========================================
// 🍎 NUTRITION & DIET CONTROLLER
// ==========================================

// 1. Tab 1: Calculate ICMR Targets based on Patient Weight
window.calcNutrition = function() {
    const pId = AppStore.getActivePatientId();
    if (!pId) return;
    
    const p = AppStore.getPatient(pId);
    const out = document.getElementById('nutriTargetArea');
    if (!out) return;

    const wt = parseFloat(p.weight) || 0;
    if (wt === 0) {
        out.innerHTML = "<div style='padding:20px; text-align:center; color:var(--text-muted);'>⚠️ Please enter patient weight in the registry to calculate targets.</div>";
        return;
    }

    // Basic ICMR Math (Simplified Pediatric Estimation)
    const energyTarget = wt * 90; // ~90-100 kcal/kg
    const proteinTarget = wt * 1.5; // ~1.2-1.5 g/kg
    const fluidTarget = wt <= 10 ? wt * 100 : (wt <= 20 ? 1000 + (wt-10)*50 : 1500 + (wt-20)*20);

    out.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-top:10px;">
            <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">⚡ Energy</div>
                <div style="font-size:1.8rem; font-weight:bold; color:var(--primary);">${energyTarget.toFixed(0)} <span style="font-size:0.9rem; color:var(--text-muted);">kcal/day</span></div>
            </div>
            <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">🥩 Protein</div>
                <div style="font-size:1.8rem; font-weight:bold; color:var(--success);">${proteinTarget.toFixed(1)} <span style="font-size:0.9rem; color:var(--text-muted);">g/day</span></div>
            </div>
            <div style="background:var(--bg-surface); padding:20px; border-radius:8px; border:1px solid var(--border-soft); text-align:center; box-shadow:var(--shadow-sm);">
                <div style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold; margin-bottom:5px;">💧 Fluids</div>
                <div style="font-size:1.8rem; font-weight:bold; color:var(--info);">${fluidTarget.toFixed(0)} <span style="font-size:0.9rem; color:var(--text-muted);">ml/day</span></div>
            </div>
        </div>
    `;
};

// 2. Tab 2: Add item to 24h Recall Log
window.addDietRecall = function() {
    const pId = AppStore.getActivePatientId();
    if (!pId) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Select a patient first.");
        return;
    }
    
    const meal = document.getElementById('recallMeal').value;
    const food = document.getElementById('recallFood').value;
    const qty = parseFloat(document.getElementById('recallQty').value);

    if (!food || !qty) {
        if(typeof showSystemToast === 'function') showSystemToast("⚠️ Please enter a valid quantity.");
        return;
    }

    // UNIFIED FORMAT: Look up food in foodsDb using the short keys (k, p, c, f)
    const foodItem = (typeof window.foodsDb !== 'undefined' ? window.foodsDb.find(f => f.name === food) : null) || { k: 100, p: 2 };
    
    const cals = (foodItem.k / 100) * qty;
    const pro = (foodItem.p / 100) * qty;

    const p = AppStore.getPatient(pId);
    if (!p.dietLogs) p.dietLogs = [];
    
    // Save to secure vault
    p.dietLogs.push({
        id: 'log_' + Date.now().toString(),
        mealType: meal,
        foodName: food,
        qty: qty + "g/ml",
        calories: cals,
        protein: pro
    });

    AppStore.savePatient(p);
    
    document.getElementById('recallQty').value = ""; // Clear input for next item
    if(typeof showSystemToast === 'function') showSystemToast("✅ Food Logged!");
    renderRecallLog(); // Re-render the board
};

window.updateLivePreview = function() {
    const food = document.getElementById('recallFood').value;
    const qty = parseFloat(document.getElementById('recallQty').value);
    const out = document.getElementById('recallSummaryArea');
    
    if (!food || !qty || isNaN(qty)) {
        out.innerHTML = "Awaiting quantity to calculate macros...";
        out.className = "tool-result neutral";
        return;
    }

    const foodItem = (typeof window.foodsDb !== 'undefined' ? window.foodsDb.find(f => f.name === food) : null) || { k: 100, p: 2 };
    const cals = (foodItem.k / 100) * qty;
    const pro = (foodItem.p / 100) * qty;

    out.innerHTML = `
        <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Live Estimation</div>
        <h3 style="margin:5px 0; color:var(--primary);">${cals.toFixed(0)} kcal</h3>
        <div style="color:var(--success); font-weight:bold;">${pro.toFixed(1)}g Protein</div>
    `;
    out.className = "tool-result";
};

// 3. Tab 2: Render the 24h Recall Board
window.renderRecallLog = function() {
    const pId = AppStore.getActivePatientId();
    if (!pId) return;
    
    const p = AppStore.getPatient(pId);
    const out = document.getElementById('recallListArea');
    if (!out) return;

    const logs = p.dietLogs || [];
    
    if (logs.length === 0) {
        out.innerHTML = "<div style='color:var(--text-muted); text-align:center; padding:30px; background:var(--bg-surface); border-radius:8px; border:1px dashed var(--border-soft);'>🍽️ No foods logged yet for the 24h recall. Add items above.</div>";
        return;
    }

    let html = `<table class="theory-table" style="width:100%; font-size:0.95rem; text-align:left;">
        <thead>
            <tr style="background:var(--bg-body);">
                <th style="padding:10px;">Meal</th><th style="padding:10px;">Item</th><th style="padding:10px;">Cals</th><th style="padding:10px;">Protein</th><th style="padding:10px; text-align:center;">Del</th>
            </tr>
        </thead>
        <tbody>`;
    
    let tCals = 0, tPro = 0;
    
    logs.forEach(log => {
        // SAFE PARSING: Protects against corrupted data saving as null
        let cals = parseFloat(log.calories) || 0;
        let pro = parseFloat(log.protein) || 0;
        
        tCals += cals; 
        tPro += pro;
        
        html += `<tr>
            <td style="padding:10px; border-bottom:1px solid var(--border-soft);">${log.mealType || 'Meal'}</td>
            <td style="padding:10px; border-bottom:1px solid var(--border-soft);"><b>${log.foodName || 'Unknown'}</b> <span style="color:var(--text-muted); font-size:0.85rem;">(${log.qty || ''})</span></td>
            <td style="padding:10px; border-bottom:1px solid var(--border-soft); color:var(--primary);">${cals.toFixed(0)}</td>
            <td style="padding:10px; border-bottom:1px solid var(--border-soft); color:var(--success);">${pro.toFixed(1)}g</td>
            <td style="padding:10px; border-bottom:1px solid var(--border-soft); text-align:center;">
                <button onclick="removeDietRecall('${log.id}')" style="background:rgba(239, 68, 68, 0.1); border:none; color:var(--danger); cursor:pointer; padding:5px 8px; border-radius:4px;">❌</button>
            </td>
        </tr>`;
    });
    
    html += `<tr style="font-weight:bold; background:rgba(91, 97, 246, 0.05);">
        <td colspan="2" style="text-align:right; padding:12px;">24H TOTAL INTAKE:</td>
        <td style="color:var(--primary-dark); padding:12px; font-size:1.1rem;">${tCals.toFixed(0)} kcal</td>
        <td style="color:var(--success); padding:12px; font-size:1.1rem;">${tPro.toFixed(1)} g</td>
        <td></td>
    </tr></tbody></table>`;
    
    out.innerHTML = html;
};

window.removeDietRecall = function(logId) {
    const pId = AppStore.getActivePatientId();
    if (!pId) return;
    const p = AppStore.getPatient(pId);
    
    p.dietLogs = p.dietLogs.filter(l => l.id !== logId);
    AppStore.savePatient(p);
    renderRecallLog();
};

// 4. Tab 3: Render Reference Matrix & Populate Dropdowns
window.renderFoodDB = function(db) {
    if (!db || db.length === 0) return;
    
    const tbody = document.getElementById('foodTableBody');
    if (tbody) {
        let html = "";
        db.forEach(f => {
            html += `<tr>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft);"><b>${f.name}</b></td>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.cat || '-'}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft); color:var(--success);">${f.p} g</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.c || 0} g</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft);">${f.f || 0} g</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-soft); color:var(--primary);">${f.k} kcal</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

    const select = document.getElementById('recallFood');
    if (select && select.options.length <= 1) {
        select.innerHTML = ""; // Clear existing
        db.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.name;
            opt.textContent = f.name;
            select.appendChild(opt);
        });
    }
};