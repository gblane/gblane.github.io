# Tissue Absorption Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained browser tool at `tools/tissue-absorption/index.html` that plots bulk tissue μₐ(λ) with individual chromophore contributions as interactive dashed traces.

**Architecture:** Single HTML file following the diffuse-reflectance tool pattern (Bootstrap 5.3 + Plotly 2.35). Chromophore extinction coefficient spectra are extracted from the DOIT-Toolbox MATLAB `.mat` files via a one-shot Python script, then embedded directly as JS constant arrays — no external data fetches at runtime. Five sliders and two wavelength number inputs drive a live Plotly multi-trace chart.

**Tech Stack:** HTML5, Bootstrap 5.3, Plotly 2.35, MathJax 3, Python + numpy + scipy (data extraction step only)

---

## File Map

| File | Change |
|------|--------|
| `tools/tissue-absorption/index.html` | Create — full self-contained tool |
| `index.html` | Modify — add tool card to `#tools` section |

---

### Task 1: Create feature branch

**Files:** none

- [ ] **Step 1: Create and switch to the feature branch**

```bash
git checkout -b feat/tissue-absorption
```

Expected: `Switched to a new branch 'feat/tissue-absorption'`

---

### Task 2: Extract chromophore data as JavaScript arrays

**Files:**
- Create (temporary): `tools/tissue-absorption/extract_spectra.py`

The DOIT-Toolbox `.mat` files at `/home/giles/GitHub/DOIT-Toolbox/Spectra/Biological/` contain the chromophore extinction coefficients. This task runs a Python script to interpolate them onto a 1 nm grid (400–1000 nm, 601 points) and print JavaScript constant declarations ready to paste into the HTML.

- [ ] **Step 1: Create the extraction script**

Write this file as `tools/tissue-absorption/extract_spectra.py`:

```python
import numpy as np
from scipy.io import loadmat

LAM = np.arange(400, 1001, 1)  # 601 points

blood = loadmat('/home/giles/GitHub/DOIT-Toolbox/Spectra/Biological/Bext.mat')
Oext = np.interp(LAM, blood['Blambda'].flatten(), blood['Oext'].flatten())
Dext = np.interp(LAM, blood['Blambda'].flatten(), blood['Dext'].flatten())
Oext = np.maximum(Oext, 0)
Dext = np.maximum(Dext, 0)

water = loadmat('/home/giles/GitHub/DOIT-Toolbox/Spectra/Biological/Wext.mat')
Wmua = np.interp(LAM, water['Wlambda'].flatten(), water['Wmua'].flatten())
Wmua = np.maximum(Wmua, 0)

lipid = loadmat('/home/giles/GitHub/DOIT-Toolbox/Spectra/Biological/Lext.mat')
Lmua = np.interp(LAM, lipid['Llambda'].flatten(), lipid['Lmua'].flatten())
Lmua = np.maximum(Lmua, 0)

def fmt(arr, name):
    vals = ', '.join(f'{v:.6g}' for v in arr)
    print(f'const {name} = [{vals}];')

fmt(Oext, 'E_HbO2')
fmt(Dext, 'E_HHb')
fmt(Wmua, 'E_water')
fmt(Lmua, 'E_lipid')
```

- [ ] **Step 2: Run the script and capture output**

```bash
python3 tools/tissue-absorption/extract_spectra.py > tools/tissue-absorption/spectra.js.txt
```

Expected: file `spectra.js.txt` is created, ~4 lines, each starting with `const E_HbO2`, `const E_HHb`, `const E_water`, `const E_lipid`.

Verify:
```bash
head -c 80 tools/tissue-absorption/spectra.js.txt
```
Expected output starts with: `const E_HbO2 = [0,`

- [ ] **Step 3: Sanity-check a known value**

HbO₂ at 760 nm should be near 0.000285 mm⁻¹/μM (the well-known hemoglobin isosbestic region). Index 360 in the array = 760 nm.

```bash
python3 -c "
from scipy.io import loadmat
import numpy as np
blood = loadmat('/home/giles/GitHub/DOIT-Toolbox/Spectra/Biological/Bext.mat')
lam = np.arange(400, 1001, 1)
Oext = np.interp(lam, blood['Blambda'].flatten(), blood['Oext'].flatten())
print(f'E_HbO2[760nm] = {Oext[360]:.6g} mm^-1/uM')
"
```

Expected: value between 0.0001 and 0.001. (Exact value depends on the Prahl/Gratzer tabulation; any non-zero value in this range is correct.)

---

### Task 3: Create `tools/tissue-absorption/index.html`

**Files:**
- Create: `tools/tissue-absorption/index.html`

Write the complete file below. In **Step 2**, replace the four `PASTE_FROM_spectra.js.txt` placeholders with the corresponding lines from `tools/tissue-absorption/spectra.js.txt`.

- [ ] **Step 1: Create the tool directory**

```bash
mkdir -p tools/tissue-absorption
```

- [ ] **Step 2: Write `tools/tissue-absorption/index.html`**

Write the following as the complete file content. After writing, replace the four lines marked `// PASTE_FROM_spectra.js.txt: E_HbO2` etc. with the actual `const E_HbO2 = [...];` lines from `spectra.js.txt`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tissue Absorption · Giles Blaney</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="../../site.css" rel="stylesheet">
    <link rel="icon" href="data:,">
    <style>
        .param-label { font-size: 0.85rem; font-weight: 500; color: var(--text); }
        .param-value { font-size: 0.8rem; color: var(--muted); font-variant-numeric: tabular-nums; }

        .form-range::-webkit-slider-thumb { background: var(--accent); }
        .form-range::-moz-range-thumb     { background: var(--accent); border: none; }
        .form-range:focus::-webkit-slider-thumb { box-shadow: 0 0 0 3px rgba(23,86,118,0.18); }

        .param-unit { font-weight: 400; color: var(--muted); }

        #plot { border: 1px solid var(--border); border-radius: 6px; background: #fff; }
    </style>
    <script>
        MathJax = {
            tex: {
                inlineMath: [['\\(', '\\)']],
                displayMath: [['$$', '$$']]
            }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
</head>
<body>

    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="../../index.html">Giles Blaney, PhD</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="../../index.html#bio">Bio</a></li>
                    <li class="nav-item"><a class="nav-link" href="../../index.html#research">Research</a></li>
                    <li class="nav-item"><a class="nav-link active" href="../../index.html#tools">Tools</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="tool-header">
            <div class="section-eyebrow">Tissue Optics</div>
            <h1 class="tool-title">Tissue Absorption</h1>
            <p class="tool-subtitle">Bulk \(\mu_a(\lambda)\) from chromophore concentrations — volumetric averages</p>
        </div>

        <div class="row g-3 mb-5">
            <div class="col-md-4">
                <div class="param-card">

                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="param-label">Melanin fraction <span class="param-unit">(whole-vol. avg)</span></span>
                        <span id="mfrac-val" class="param-value"></span>
                    </div>
                    <input type="range" class="form-range mb-3" id="mfrac-slider"
                           min="0" max="0.05" step="0.0001" value="0.001">

                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="param-label">Total hemoglobin <span class="param-unit">(μM)</span></span>
                        <span id="tum-val" class="param-value"></span>
                    </div>
                    <input type="range" class="form-range mb-3" id="tum-slider"
                           min="0" max="100" step="1" value="65">

                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="param-label">O₂ saturation</span>
                        <span id="s-val" class="param-value"></span>
                    </div>
                    <input type="range" class="form-range mb-3" id="s-slider"
                           min="0" max="1" step="0.01" value="0.65">

                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="param-label">Water fraction</span>
                        <span id="wfrac-val" class="param-value"></span>
                    </div>
                    <input type="range" class="form-range mb-3" id="wfrac-slider"
                           min="0" max="1" step="0.01" value="0.55">

                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="param-label">Lipid fraction</span>
                        <span id="lfrac-val" class="param-value"></span>
                    </div>
                    <input type="range" class="form-range mb-3" id="lfrac-slider"
                           min="0" max="0.5" step="0.01" value="0.15">

                    <div class="d-flex gap-3">
                        <div class="flex-fill">
                            <label class="param-label mb-1" for="lam-min">λ min (nm)</label>
                            <input type="number" class="form-control form-control-sm" id="lam-min"
                                   min="400" max="999" value="700">
                        </div>
                        <div class="flex-fill">
                            <label class="param-label mb-1" for="lam-max">λ max (nm)</label>
                            <input type="number" class="form-control form-control-sm" id="lam-max"
                                   min="401" max="1000" value="1000">
                        </div>
                    </div>

                </div>

                <div class="about-card">
                    <div class="about-title">About</div>
                    <p class="about-text">All concentrations are volumetric averages over the full probed tissue volume, not surface or epidermal values. This is why the melanin fraction here is far smaller than the epidermal melanin fraction — the epidermis is a thin layer within the total interrogated volume.</p>
                </div>
            </div>

            <div class="col-md-8">
                <div id="plot" style="height: 500px;"></div>
            </div>
        </div>

        <!-- Theory -->
        <div class="info-section">
            <div class="section-eyebrow">Background</div>
            <h2>Beer's law chromophore model</h2>
            <hr class="section-rule">
            <div class="info-card">
                <p>
                    The bulk absorption coefficient is the sum of contributions from each chromophore,
                    each following Beer's law:
                </p>
                <p>
                    $$\mu_{a,\text{HbO}_2}(\lambda) = \varepsilon_{\text{HbO}_2}(\lambda)\,[\text{HbT}]\,S_O$$
                </p>
                <p>
                    $$\mu_{a,\text{HHb}}(\lambda) = \varepsilon_{\text{HHb}}(\lambda)\,[\text{HbT}]\,(1 - S_O)$$
                </p>
                <p>
                    $$\mu_{a,\text{water}}(\lambda) = \varepsilon_{\text{water}}(\lambda)\,W$$
                </p>
                <p>
                    $$\mu_{a,\text{lipid}}(\lambda) = \varepsilon_{\text{lipid}}(\lambda)\,L$$
                </p>
                <p>
                    where \([\text{HbT}]\) is total hemoglobin concentration (μM), \(S_O\) is oxygen saturation,
                    \(W\) is water volume fraction, and \(L\) is lipid volume fraction.
                    \(\varepsilon_{\text{HbO}_2}\) and \(\varepsilon_{\text{HHb}}\) have units mm⁻¹ μM⁻¹;
                    \(\varepsilon_{\text{water}}\) and \(\varepsilon_{\text{lipid}}\) have units mm⁻¹ (fraction-based).
                </p>
                <p>Melanin absorption follows the power-law fit from Jacques (2013), Eq. 8:</p>
                <p>
                    $$\mu_{a,\text{mel}}(\lambda) = M_f \times 51.9 \left(\frac{\lambda}{500\,\text{nm}}\right)^{-3.5} \quad \text{(mm}^{-1}\text{)}$$
                </p>
                <p>where \(M_f\) is the melanin volume fraction averaged over the full probed tissue volume.</p>
                <p>The total bulk absorption coefficient is:</p>
                <p>
                    $$\mu_a(\lambda) = \mu_{a,\text{HbO}_2} + \mu_{a,\text{HHb}} + \mu_{a,\text{water}} + \mu_{a,\text{lipid}} + \mu_{a,\text{mel}}$$
                </p>
            </div>
        </div>

        <!-- References -->
        <div class="info-section">
            <div class="section-eyebrow">Sources</div>
            <h2>References</h2>
            <hr class="section-rule">
            <div class="info-card">
                <ol style="font-size: 0.85rem; line-height: 1.7; color: var(--text);">
                    <li>
                        Prahl, S. "Tabulated Molar Extinction Coefficient for Hemoglobin in Water." omlc.org/spectra/hemoglobin/summary.html.
                        Data from W.B. Gratzer (MRC Labs, London) and N. Kollias (Wellman Labs, Harvard).
                        Units converted from cm⁻¹/M to mm⁻¹/μM via \(\ln(10) \times 10^{-7}\).
                    </li>
                    <li>
                        Pope, R.M. "Optical absorption of pure water and sea water using the integrating cavity absorption meter," Texas A&amp;M University (1993) [382–700 nm];
                        Kou, L., Labrie, D., and Chylek, P. "Refractive indices of water and ice in the 0.65–2.5 μm spectral range," <em>Appl. Opt.</em> 32, 3531–3540 (1993) [700–2500 nm].
                        Units converted from cm⁻¹ to mm⁻¹.
                    </li>
                    <li>
                        van Veen, R.L.P., Sterenborg, H.J.C.M., Pifferi, A., Torricelli, A., and Cubeddu, R.
                        "Determination of VIS-NIR absorption coefficients of mammalian fat, with time- and spatially resolved diffuse reflectance and transmission spectroscopy."
                        OSA Annual BIOMED Topical Meeting (2004). Units converted from m⁻¹ to mm⁻¹.
                    </li>
                    <li>
                        Jacques, S.L. "Optical properties of biological tissues: a review."
                        <em>Phys. Med. Biol.</em> 58, R37–R61 (2013).
                        doi:<a href="https://doi.org/10.1088/0031-9155/58/11/r37" target="_blank" rel="noopener noreferrer">10.1088/0031-9155/58/11/r37</a>
                    </li>
                </ol>
            </div>
        </div>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
    <script>
        // --- Chromophore data: 1 nm steps, index 0 = 400 nm, index 600 = 1000 nm ---
        // PASTE_FROM_spectra.js.txt: E_HbO2
        // PASTE_FROM_spectra.js.txt: E_HHb
        // PASTE_FROM_spectra.js.txt: E_water
        // PASTE_FROM_spectra.js.txt: E_lipid

        function buildLam(lamMin, lamMax) {
            const lam = [];
            for (let l = Math.ceil(lamMin); l <= Math.floor(lamMax); l++) lam.push(l);
            return lam;
        }

        function computeMua(lam, Mfrac, TuM, S, Wfrac, Lfrac) {
            const mua_HbO2  = lam.map(l => E_HbO2[l - 400]  * TuM * S);
            const mua_HHb   = lam.map(l => E_HHb[l - 400]   * TuM * (1 - S));
            const mua_water = lam.map(l => E_water[l - 400]  * Wfrac);
            const mua_lipid = lam.map(l => E_lipid[l - 400]  * Lfrac);
            const mua_mel   = lam.map(l => Mfrac * 51.9 * Math.pow(l / 500, -3.5));
            const mua_total = lam.map((_, i) =>
                mua_HbO2[i] + mua_HHb[i] + mua_water[i] + mua_lipid[i] + mua_mel[i]);
            return { lam, mua_HbO2, mua_HHb, mua_water, mua_lipid, mua_mel, mua_total };
        }

        function getParams() {
            let lamMin = +document.getElementById('lam-min').value;
            let lamMax = +document.getElementById('lam-max').value;
            lamMin = Math.max(400, Math.min(999, lamMin));
            lamMax = Math.max(401, Math.min(1000, lamMax));
            if (lamMin >= lamMax) lamMax = Math.min(lamMin + 1, 1000);
            return {
                Mfrac:  +document.getElementById('mfrac-slider').value,
                TuM:    +document.getElementById('tum-slider').value,
                S:      +document.getElementById('s-slider').value,
                Wfrac:  +document.getElementById('wfrac-slider').value,
                Lfrac:  +document.getElementById('lfrac-slider').value,
                lamMin, lamMax
            };
        }

        function update() {
            const p = getParams();
            const r = computeMua(buildLam(p.lamMin, p.lamMax),
                                  p.Mfrac, p.TuM, p.S, p.Wfrac, p.Lfrac);

            document.getElementById('mfrac-val').textContent = p.Mfrac.toFixed(4);
            document.getElementById('tum-val').textContent   = `${p.TuM.toFixed(0)} μM`;
            document.getElementById('s-val').textContent     = p.S.toFixed(2);
            document.getElementById('wfrac-val').textContent = p.Wfrac.toFixed(2);
            document.getElementById('lfrac-val').textContent = p.Lfrac.toFixed(2);

            Plotly.react('plot', [
                { x: r.lam, y: r.mua_total,  name: 'Total μₐ',
                  mode: 'lines', line: { color: '#000000', width: 2.5, dash: 'solid' } },
                { x: r.lam, y: r.mua_HbO2,   name: 'HbO₂',
                  mode: 'lines', line: { color: '#e00000', width: 1.5, dash: 'dash' } },
                { x: r.lam, y: r.mua_HHb,    name: 'HHb',
                  mode: 'lines', line: { color: '#8b0000', width: 1.5, dash: 'dash' } },
                { x: r.lam, y: r.mua_water,  name: 'Water',
                  mode: 'lines', line: { color: '#0055cc', width: 1.5, dash: 'dash' } },
                { x: r.lam, y: r.mua_lipid,  name: 'Lipid',
                  mode: 'lines', line: { color: '#e07b00', width: 1.5, dash: 'dash' } },
                { x: r.lam, y: r.mua_mel,    name: 'Melanin',
                  mode: 'lines', line: { color: '#795548', width: 1.5, dash: 'dash' } }
            ], {
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor:  'rgba(0,0,0,0)',
                font: { family: 'DM Sans, sans-serif', size: 12, color: '#6b6b6b' },
                xaxis: { title: 'Wavelength (nm)', gridcolor: '#e0dcd6', zerolinecolor: '#c8c2bc' },
                yaxis: { title: 'μₐ (mm⁻¹)', gridcolor: '#e0dcd6', zerolinecolor: '#c8c2bc' },
                legend: { x: 1, xanchor: 'right', y: 1 },
                margin: { t: 20, r: 20, b: 50, l: 80 }
            }, { responsive: true });
        }

        ['mfrac-slider','tum-slider','s-slider','wfrac-slider','lfrac-slider',
         'lam-min','lam-max'].forEach(id =>
            document.getElementById(id).addEventListener('input', update)
        );
        update();
    </script>

    <footer>
        <div class="container">
            <p class="mb-0">&copy; 2026 Giles Blaney, PhD &nbsp;·&nbsp; <a href="mailto:Giles.Blaney@tufts.edu">Giles.Blaney@tufts.edu</a></p>
        </div>
    </footer>
</body>
</html>
```

- [ ] **Step 3: Embed the chromophore data**

Replace the four comment lines in the `<script>` block of `tools/tissue-absorption/index.html`:

```
// PASTE_FROM_spectra.js.txt: E_HbO2
// PASTE_FROM_spectra.js.txt: E_HHb
// PASTE_FROM_spectra.js.txt: E_water
// PASTE_FROM_spectra.js.txt: E_lipid
```

with the corresponding `const E_HbO2 = [...];` lines from `tools/tissue-absorption/spectra.js.txt`.

After replacement, the section should look like:

```javascript
// --- Chromophore data: 1 nm steps, index 0 = 400 nm, index 600 = 1000 nm ---
const E_HbO2  = [0.00123, ...];   // 601 values
const E_HHb   = [0.00456, ...];   // 601 values
const E_water = [0.00234, ...];   // 601 values
const E_lipid = [0.00567, ...];   // 601 values
```

- [ ] **Step 4: Commit**

```bash
git add tools/tissue-absorption/index.html
git commit -m "feat: add tissue absorption tool (HTML scaffold + chromophore data)"
```

---

### Task 4: Verify the tool in a browser

**Files:** none modified

- [ ] **Step 1: Start a local server**

```bash
python3 -m http.server 8080 --directory /home/giles/GitHub/gblane.github.io
```

- [ ] **Step 2: Open the tool**

Visit `http://localhost:8080/tools/tissue-absorption/index.html`

Check:
- Page loads without console errors
- All five slider values are displayed next to the labels
- The Plotly chart shows 6 traces (Total μₐ solid black, HbO₂ dashed red, HHb dashed dark red, Water dashed blue, Lipid dashed orange, Melanin dashed brown)
- Default wavelength range is 700–1000 nm
- Moving any slider updates the chart in real time
- Plotly legend items are clickable to toggle traces

- [ ] **Step 3: Spot-check a computed value**

With defaults (Mfrac=0.001, TuM=65, S=0.65, Wfrac=0.55, Lfrac=0.15, range 700–1000 nm), open the browser console and run:

```javascript
const lam = buildLam(700, 1000);
const r = computeMua(lam, 0.001, 65, 0.65, 0.55, 0.15);
console.log('mua_total[0] at 700nm:', r.mua_total[0].toFixed(5));
console.log('mua_water[0] at 700nm:', r.mua_water[0].toFixed(5));
```

Expected: `mua_water[0]` near `0.00280` mm⁻¹ (water absorption at 700 nm ≈ 0.00509 cm⁻¹ = 0.000509 mm⁻¹ × 0.55 ≈ 0.00028). Any non-zero positive value confirms data is loading correctly.

- [ ] **Step 4: Test wavelength input validation**

Set λ min = 800 and λ max = 750. Verify the chart does not crash and either clamps or corrects the values.

- [ ] **Step 5: Check MathJax rendering**

Scroll to the Theory section. Verify equations render as formatted math (not raw LaTeX strings).

---

### Task 5: Add tool card to main `index.html`

**Files:**
- Modify: `index.html`

The tools section at line ~273 currently has three `col-md-4` cards. Add a fourth card for Tissue Absorption.

- [ ] **Step 1: Locate the tools grid closing tag**

Find this line in `index.html` (around line 304):

```html
                </div>
            </div>
        </div>
    </section>

    <footer>
```

The `</div>` at the top closes the `row g-3` div.

- [ ] **Step 2: Insert the new card before the closing `</div>` of `row g-3`**

Add a new `col-md-4` block immediately before that `</div>`:

```html
                <div class="col-md-4">
                    <a href="tools/tissue-absorption/index.html" class="tool-link">
                        <div class="tool-card">
                            <div class="tool-name">Tissue Absorption</div>
                            <div class="tool-tags">Tissue Optics · Beer's Law · Plotly</div>
                            <p class="tool-desc">Interactive μ<sub>a</sub>(λ) spectrum from chromophore concentrations — hemoglobin, water, lipid, and melanin.</p>
                            <div class="tool-cta">Open tool →</div>
                        </div>
                    </a>
                </div>
```

- [ ] **Step 3: Verify the main page**

Visit `http://localhost:8080/index.html`, scroll to Tools. The new card should appear. Clicking it should open the tissue absorption tool.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Tissue Absorption tool card to main tools section"
```

---

### Task 6: Clean up and open PR

**Files:** none new

- [ ] **Step 1: Remove the temporary extraction files**

These files were never committed to git (only `index.html` was), so just delete them:

```bash
rm tools/tissue-absorption/extract_spectra.py tools/tissue-absorption/spectra.js.txt
```

Verify they are gone and `git status` shows no untracked files in `tools/tissue-absorption/`:

```bash
git status tools/tissue-absorption/
```

Expected: nothing listed (only `index.html` which is already committed).

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/tissue-absorption
gh pr create \
  --title "feat: add tissue absorption tool" \
  --body "Adds tools/tissue-absorption/index.html — interactive μₐ(λ) plot with Beer's law chromophore model (HbO₂, HHb, water, lipid, melanin). Self-contained Bootstrap + Plotly tool following the diffuse-reflectance pattern. Also adds tool card to main index.html."
```
