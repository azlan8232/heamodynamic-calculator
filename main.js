// Utils & Formulas
const Formulas = {
    // Body Surface Area (DuBois)
    bsa: (height, weight) => {
        if (!height || !weight) return null;
        return 0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425);
    },

    // Mean Arterial Pressure
    map: (sbp, dbp) => {
        if (!sbp || !dbp) return null;
        return (sbp + (2 * dbp)) / 3;
    },

    // Modified Shock Index
    msi: (hr, map) => {
        if (hr === null || map === null || map === 0) return null;
        return hr / map;
    },
    // LVOT Area (cm^2)
    lvotArea: (lvotD) => {
        if (!lvotD) return null;
        const radius = lvotD / 2;
        return Math.PI * Math.pow(radius, 2);
    },

    // Stroke Volume (mL)
    sv: (lvotArea, lvotVti) => {
        if (!lvotArea || !lvotVti) return null;
        return lvotArea * lvotVti;
    },

    // Cardiac Output (L/min)
    co: (sv, hr) => {
        if (!sv || !hr) return null;
        return (sv * hr) / 1000; // Convert mL/min to L/min
    },

    // Cardiac Index (L/min/m^2)
    ci: (co, bsa) => {
        if (!co || !bsa) return null;
        return co / bsa;
    },

    // Systemic Vascular Resistance (dyn·s/cm^5)
    svr: (map, erap, co) => {
        if (map === null || erap === null || !co) return null;
        // Formula: 80 * (MAP - RAP) / CO
        return (80 * (map - erap)) / co;
    },

    // Systemic Vascular Resistance Index (dyn·s/cm^5·m^2)
    // USER REQUESTED FORMULA: SVR * BSA
    svri: (svr, bsa) => {
        if (!svr || !bsa) return null;
        return svr * bsa;
    },

    // Stroke Volume Index (mL/m^2)
    svi: (sv, bsa) => {
        if (!sv || !bsa) return null;
        return sv / bsa;
    },
};

function safeFloat(val) {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return null;
    return parsed;
}

function formatNum(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Main App Logic
document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        height: document.getElementById('height'),
        weight: document.getElementById('weight'),
        sbp: document.getElementById('sbp'),
        dbp: document.getElementById('dbp'),
        hr: document.getElementById('hr'),
        erap: document.getElementById('erap'),
        lvot_d: document.getElementById('lvot_d'),
        lvot_vti: document.getElementById('lvot_vti'),
    };

    const displays = {
        lvotArea: document.getElementById('res-lvot-area'),
        bsa: document.getElementById('res-bsa'),
        map: document.getElementById('res-map'),
        msi: document.getElementById('res-msi'),
        sv: document.getElementById('res-sv'),
        co: document.getElementById('res-co'),
        ci: document.getElementById('res-ci'),
        svi: document.getElementById('res-svi'),
        svr: document.getElementById('res-svr'),
        svri: document.getElementById('res-svri'),
    };

    function calculate() {
        // 1. Get Values
        const val = {};
        for (const [key, el] of Object.entries(inputs)) {
            val[key] = safeFloat(el ? el.value : '');
        }

        // 2. Base Calculations
        const bsa = Formulas.bsa(val.height, val.weight);
        const map = Formulas.map(val.sbp, val.dbp);
        const msi = Formulas.msi(val.hr, map);
        const lvotArea = Formulas.lvotArea(val.lvot_d);

        // 3. Dependent Calculations
        const sv = Formulas.sv(lvotArea, val.lvot_vti);
        const co = Formulas.co(sv, val.hr);

        // 4. Derived from CO/MAP/BSA
        const ci = Formulas.ci(co, bsa);
        const svi = Formulas.svi(sv, bsa);
        const svr = Formulas.svr(map, val.erap, co);
        const svri = Formulas.svri(svr, bsa);

        // 5. Update UI
        updateDisplay(displays.bsa, bsa, 2);
        updateDisplay(displays.map, map, 0);
        updateDisplay(displays.msi, msi, 2, 0.7, 1.3);
        updateDisplay(displays.lvotArea, lvotArea, 2);

        // Ranges:
        // SV: 60 - 100
        updateDisplay(displays.sv, sv, 1, 60, 100);
        // CO: 4 - 8
        updateDisplay(displays.co, co, 2, 4, 8);
        // CI: 2.5 - 4.0
        updateDisplay(displays.ci, ci, 2, 2.5, 4.0);

        // SVI: 33 - 47
        updateDisplay(displays.svi, svi, 1, 33, 47);
        // SVR: 800 - 1200
        updateDisplay(displays.svr, svr, 0, 800, 1200);
        // SVRI: 1900 - 2400
        updateDisplay(displays.svri, svri, 0, 1900, 2400);
    }

    function updateDisplay(element, value, decimals, min, max) {
        if (!element) return;

        // Reset classes
        element.classList.remove('text-low', 'text-normal', 'text-high');

        if (value === null) {
            element.textContent = '--';
            element.classList.remove('has-value');
        } else {
            element.textContent = formatNum(value, decimals);
            element.classList.add('has-value');

            // Apply Color Coding if ranges provided
            if (min !== undefined && max !== undefined) {
                if (value < min) {
                    element.classList.add('text-low');
                } else if (value > max) {
                    element.classList.add('text-high');
                } else {
                    element.classList.add('text-normal');
                }
            }
        }
    }

    // Event Listeners
    const calcBtn = document.getElementById('calculate-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', calculate);
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Object.values(inputs).forEach(input => {
                if (input) input.value = '';
            });

            // Clear results
            Object.values(displays).forEach(el => {
                if (el) {
                    el.textContent = '--';
                    el.classList.remove('has-value');
                }
            });
        });
    }

    // Enter key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') calculate();
    });
});
