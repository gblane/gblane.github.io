// Illuminants and the absorber library for the Beer-Lambert colour tool.
// Depends on colorimetry.js (CIE grid) and _data/chromophores.js (tissue spectra).

// ── Illuminants ──────────────────────────────────────────────────────────────

const _C2_NM_K = 1.4388e7;   // second radiation constant, nm*K

/** Planck's law, relative units (constants that cancel under normalisation dropped). */
function planck(lamNm, T) {
    return Math.pow(lamNm, -5) / (Math.exp(_C2_NM_K / (lamNm * T)) - 1);
}

function blackbodySPD(T) {
    const s = new Array(CIE_N);
    for (let i = 0; i < CIE_N; i++) s[i] = planck(i + CIE_LAM_MIN, T);
    return s;
}

/** CIE standard illuminant A, per the closed form in CIE 15. */
function illuminantA() {
    const s = new Array(CIE_N);
    const num = Math.exp(1.435e7 / (2848 * 560)) - 1;
    for (let i = 0; i < CIE_N; i++) {
        const lam = i + CIE_LAM_MIN;
        s[i] = 100 * Math.pow(560 / lam, 5) * (num / (Math.exp(1.435e7 / (2848 * lam)) - 1));
    }
    return s;
}

/**
 * Phosphor-converted white LED, modelled as a blue pump plus a phosphor hump.
 * This is a representative analytic fit, NOT a measured SPD, and is labelled as
 * such in the UI. A measured spectrum can replace it without touching the pipeline.
 */
function whiteLedSPD() {
    // The phosphor band is ASYMMETRIC — wider on the red side. Real YAG:Ce
    // phosphors have a long red tail, and a symmetric Gaussian centred near the
    // luminous-efficiency peak cannot represent it: it lands at duv +0.021,
    // 3.5x outside ANSI C78.377's +/-0.006 white tolerance, and reads visibly
    // green. These values give duv +0.000 at CCT ~5150 K.
    const g = (lam, mu, sLo, sHi) =>
        Math.exp(-0.5 * Math.pow((lam - mu) / (lam < mu ? sLo : sHi), 2));
    const s = new Array(CIE_N);
    for (let i = 0; i < CIE_N; i++) {
        const lam = i + CIE_LAM_MIN;
        s[i] = 1.00 * g(lam, 452, 14, 14) + 0.80 * g(lam, 555, 35, 70);
    }
    return s;
}

/** User-pasted SPD, installed by the custom-source control (Task 11). */
let CUSTOM_SPD = null;
function setCustomSPD(arr) { CUSTOM_SPD = arr; }

const ILLUMINANTS = [
    { key: 'D65', label: 'CIE D65 (daylight)', params: [], spd: () => CIE.D65 },
    { key: 'D50', label: 'CIE D50 (warm daylight)', params: [], spd: () => CIE.D50 },
    { key: 'A',   label: 'CIE A (tungsten, 2856 K)', params: [], spd: () => illuminantA() },
    { key: 'E',   label: 'CIE E (equal energy)', params: [],
      spd: () => new Array(CIE_N).fill(1) },
    { key: 'LED', label: 'White LED (phosphor, analytic fit)', params: [],
      spd: () => whiteLedSPD() },
    { key: 'BB',  label: 'Blackbody',
      params: [{ key: 'T', label: 'Temperature', unit: 'K', min: 1000, max: 9000,
                 step: 50, def: 3200 }],
      spd: p => blackbodySPD(p.T) },
    { key: 'CUSTOM', label: 'Custom (pasted)', params: [],
      spd: () => CUSTOM_SPD || new Array(CIE_N).fill(1) },
];

/** Test helper: every illuminant that needs no user input. */
function illuminantCases() {
    return ILLUMINANTS
        .filter(i => i.key !== 'CUSTOM')
        .map(i => [i.label, i.spd({ T: 3200 })]);
}
