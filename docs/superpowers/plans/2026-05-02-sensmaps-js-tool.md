# Sensitivity Maps JavaScript Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/sensmaps/` on `gblane.github.io` — a browser CW sensitivity map tool porting the physics from the `sensmaps` Python package.

**Architecture:** `sensmaps.js` holds pure physics/compute (no DOM); `index.html` holds Bootstrap/Plotly UI. `makeSvox()` dispatches SD/SS/DS combinators and returns `{Svox, x, z, Nx, Nz}`.

**Tech Stack:** Vanilla JS, Bootstrap 5.3.3, Plotly 2.35.2, MathJax 3, no build step.

---

## File Map

| Action | Path |
|--------|------|
| Create | `tools/sensmaps/sensmaps.js` |
| Create | `tools/sensmaps/test.html` |
| Create | `tools/sensmaps/index.html` |
| Modify | `index.html` — add tool card in `#tools` section |

---

## Reference values (from Python sensmaps, op={nIn:1.333,nOut:1.0,musp:1.1,mua:0.011})

| Quantity | Value |
|----------|-------|
| `n2A(1.333)` | `2.5331875050` |
| `n2A(0.75)` | `1.1138793828` |
| `continuousReflectance([0,0,0.9091],[30,0,0],op)` | `3.0124085072e-7` |
| `continuousTotPathLen([0,0,0.9091],[30,0,0],op).L` | `222.9338028092` |
| `_continuousFluence([0,0,0.9091],[15,0,15],op)` | `1.4476584787e-4` |
| `continuousPartPathLen([0,0,0.9091],[[15,0,15]],[30,0,0],1,op)[0]` | `0.0086509744` |
| `makeSvox CW_SD_I {sx:0,dx:30}` S at ix=25,iz=15 (x=15,z=15) | `3.88051e-5` |
| `makeSvox CW_SD_I {sx:0,dx:30}` S at ix=10,iz=5  (x=0,z=5)   | `2.48527e-4` |
| `makeSvox CW_SS_I {sx:0,d1x:25,d2x:35}` S at ix=25,iz=15     | `6.30944e-5` |
| `makeSvox CW_DS_I {s1x:-30,s2x:30,d1x:-5,d2x:5}` S at ix=40,iz=15 (x=0,z=15) | `6.62126e-5` |

Grid note: Svox is row-major `[ix * Nz + iz]`. For SD: Nx=51 (x: −10…40), Nz=31 (z: 0…30). For SS: Nx=56 (x: −10…45), Nz=36 (z: 0…35). For DS: Nx=81 (x: −40…40), Nz=36 (z: 0…35).

---

### Task 1: Test harness + n2A

**Files:**
- Create: `tools/sensmaps/test.html`
- Create: `tools/sensmaps/sensmaps.js`

- [ ] **Step 1: Create `tools/sensmaps/test.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>sensmaps.js tests</title>
    <style>
        body { font-family: monospace; padding: 1rem; background: #fafafa; }
        .pass { color: #1a7a1a; margin: 2px 0; }
        .fail { color: #c0392b; font-weight: bold; margin: 2px 0; }
        #summary { margin-top: 1rem; font-weight: bold; }
    </style>
</head>
<body>
<h2>sensmaps.js — unit tests</h2>
<div id="results"></div>
<div id="summary"></div>
<script src="sensmaps.js"></script>
<script>
const _out = document.getElementById('results');
let _p = 0, _f = 0;
function check(name, actual, expected, rtol = 1e-6) {
    const err = Math.abs(actual - expected) / (Math.abs(expected) + 1e-300);
    const ok  = err <= rtol;
    const el  = document.createElement('p');
    el.className = ok ? 'pass' : 'fail';
    el.textContent = (ok ? '✓ ' : '✗ ') + name +
        (ok ? '' : `  got=${actual.toExponential(6)} exp=${expected.toExponential(6)} rtol=${err.toExponential(1)}`);
    _out.appendChild(el);
    ok ? _p++ : _f++;
}

// ── n2A ──────────────────────────────────────────────────────────────────
check('n2A(1.333) branch n>1', n2A(1.333), 2.5331875050, 1e-8);
check('n2A(1.0)   = 1',        n2A(1.0),   1.0,          1e-12);
check('n2A(0.75)  branch n<1', n2A(0.75),  1.1138793828, 1e-8);

document.getElementById('summary').textContent = `${_p} passed, ${_f} failed`;
</script>
</body>
</html>
```

- [ ] **Step 2: Create `tools/sensmaps/sensmaps.js` with n2A**

```javascript
// sensmaps.js — CW sensitivity physics for diffuse optical spectroscopy.
// Port of sensmaps Python package (physics.py, compute.py), CW functions only.
// Variable names mirror the Python/MATLAB source.

function n2A(n) {
    if (n > 1) {
        return 504.332889  - 2641.00214  * n
             + 5923.699064 * n**2
             - 7376.355814 * n**3
             + 5507.53041  * n**4
             - 2463.357945 * n**5
             + 610.956547  * n**6
             - 64.8047      * n**7;
    }
    if (n < 1) {
        return 3.084635 - 6.531194 * n
             + 8.357854 * n**2
             - 5.082751 * n**3
             + 1.171382 * n**4;
    }
    return 1.0;
}
```

- [ ] **Step 3: Serve and open test.html — verify 3 n2A tests pass**

```bash
cd /home/giles/GitHub/gblane.github.io && python3 -m http.server 8080
```

Open `http://localhost:8080/tools/sensmaps/test.html`.
Expected: `3 passed, 0 failed`.

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: sensmaps.js test harness + n2A"
```

---

### Task 2: continuousReflectance

**Files:**
- Modify: `tools/sensmaps/sensmaps.js`
- Modify: `tools/sensmaps/test.html`

- [ ] **Step 1: Add failing test to test.html** (before the summary line)

```javascript
// ── continuousReflectance ────────────────────────────────────────────────
const _op  = { nIn: 1.333, nOut: 1.0, musp: 1.1, mua: 0.011 };
const _z0  = 1.0 / _op.musp;   // 0.90909...
check('continuousReflectance rho=30',
    continuousReflectance([0, 0, _z0], [30, 0, 0], _op),
    3.0124085072e-7, 1e-7);
```

Refresh — expect a red FAIL or ReferenceError.

- [ ] **Step 2: Implement continuousReflectance in sensmaps.js**

Append to sensmaps.js:

```javascript
// Port of continuous_reflectance() — complex_reflectance at omega=0.
// rs=[x,y,z] source (after z-offset applied), rd=[x,y,z] detector.
// op={nIn,nOut,musp,mua}. Returns R (mm⁻²).
function continuousReflectance(rs, rd, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;        // image source z-coordinate

    const dx = rd[0] - rs[0];
    const dy = rd[1] - rs[1];
    const r1 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rs[2])**2);
    const r2 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rspZ)**2);

    return (
          z0         * (1.0/r1 + mueff) * Math.exp(-mueff * r1) / (r1*r1)
        + (z0 - 2.0*zb) * (1.0/r2 + mueff) * Math.exp(-mueff * r2) / (r2*r2)
    ) / (4.0 * Math.PI);
}
```

- [ ] **Step 3: Refresh test.html — verify passes (4 passed, 0 failed)**

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: continuousReflectance"
```

---

### Task 3: _continuousFluence (internal helper)

**Files:**
- Modify: `tools/sensmaps/sensmaps.js`
- Modify: `tools/sensmaps/test.html`

- [ ] **Step 1: Add failing test** (before summary line)

```javascript
// ── _continuousFluence ───────────────────────────────────────────────────
check('_continuousFluence at [15,0,15]',
    _continuousFluence([0, 0, _z0], [15, 0, 15], _op),
    1.4476584787e-4, 1e-7);
```

- [ ] **Step 2: Implement _continuousFluence in sensmaps.js**

```javascript
// Internal: CW fluence at voxel r from source rs. Port of complex_fluence at omega=0.
// rs=[x,y,z], r=[x,y,z] (single voxel). Returns phi (mm⁻²).
function _continuousFluence(rs, r, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;

    const r1 = Math.sqrt((r[0]-rs[0])**2 + (r[1]-rs[1])**2 + (r[2]-rs[2])**2);
    const r2 = Math.sqrt((r[0]-rs[0])**2 + (r[1]-rs[1])**2 + (r[2]-rspZ)**2);

    return (Math.exp(-mueff * r1) / r1 - Math.exp(-mueff * r2) / r2)
         / (4.0 * Math.PI * D);
}
```

- [ ] **Step 3: Refresh — verify 5 passed, 0 failed**

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: _continuousFluence"
```

---

### Task 4: continuousTotPathLen

**Files:**
- Modify: `tools/sensmaps/sensmaps.js`
- Modify: `tools/sensmaps/test.html`

- [ ] **Step 1: Add failing test**

```javascript
// ── continuousTotPathLen ─────────────────────────────────────────────────
const _tpl = continuousTotPathLen([0, 0, _z0], [30, 0, 0], _op);
check('continuousTotPathLen L rho=30', _tpl.L, 222.9338028092, 1e-7);
check('continuousTotPathLen R rho=30', _tpl.R, 3.0124085072e-7, 1e-7);
```

- [ ] **Step 2: Implement continuousTotPathLen in sensmaps.js**

```javascript
// Port of continuous_tot_path_len() — complex_tot_path_len at omega=0.
// Returns {L (mm), R (mm⁻²)}.
function continuousTotPathLen(rs, rd, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;

    const dx = rd[0] - rs[0];
    const dy = rd[1] - rs[1];
    const r1 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rs[2])**2);
    const r2 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rspZ)**2);

    const R = continuousReflectance(rs, rd, op);
    const L = (
          (z0 / r1)         * Math.exp(-mueff * r1)
        + ((z0 - 2.0*zb) / r2) * Math.exp(-mueff * r2)
    ) / (8.0 * Math.PI * D * R);

    return { L, R };
}
```

- [ ] **Step 3: Refresh — verify 7 passed, 0 failed**

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: continuousTotPathLen"
```

---

### Task 5: continuousPartPathLen

**Files:**
- Modify: `tools/sensmaps/sensmaps.js`
- Modify: `tools/sensmaps/test.html`

- [ ] **Step 1: Add failing test**

```javascript
// ── continuousPartPathLen ────────────────────────────────────────────────
const _ll = continuousPartPathLen([0,0,_z0], [[15,0,15]], [30,0,0], 1.0, _op);
check('continuousPartPathLen at [15,0,15]', _ll[0], 0.0086509744, 1e-6);
```

- [ ] **Step 2: Implement continuousPartPathLen in sensmaps.js**

```javascript
// Port of continuous_part_path_len() — complex_part_path_len at omega=0.
// rs=[x,y,z], r_all=[[x,y,z],...] N voxel centers, rd=[x,y,z], V voxel volume.
// Returns Float64Array length N of partial path lengths (mm).
function continuousPartPathLen(rs, r_all, rd, V, op) {
    const N      = r_all.length;
    const ll     = new Float64Array(N);
    const R_rs_rd = continuousReflectance(rs, rd, op);
    for (let i = 0; i < N; i++) {
        const phi   = _continuousFluence(rs, r_all[i], op);
        const R_r_rd = continuousReflectance(r_all[i], rd, op);
        ll[i] = (phi * R_r_rd * V) / R_rs_rd;
    }
    return ll;
}
```

- [ ] **Step 3: Refresh — verify 8 passed, 0 failed**

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: continuousPartPathLen"
```

---

### Task 6: makeSvox — grid building + SD combinator

**Files:**
- Modify: `tools/sensmaps/sensmaps.js`
- Modify: `tools/sensmaps/test.html`

- [ ] **Step 1: Add failing tests for CW_SD_I**

```javascript
// ── makeSvox CW_SD_I ──────────────────────────────────────────────────────
// Grid: x −10…40 (Nx=51), z 0…30 (Nz=31). Svox[ix*Nz+iz].
const _sd = makeSvox('CW_SD_I', { sx: 0, dx: 30 }, _op);
check('CW_SD_I Nx', _sd.Nx, 51);
check('CW_SD_I Nz', _sd.Nz, 31);
check('CW_SD_I S[x=15,z=15] ix=25,iz=15', _sd.Svox[25*31+15], 3.88051e-5, 1e-4);
check('CW_SD_I S[x=0,z=5]   ix=10,iz=5',  _sd.Svox[10*31+5],  2.48527e-4, 1e-4);
```

- [ ] **Step 2: Implement makeSvox with SD in sensmaps.js**

```javascript
// Top-level dispatcher. Port of makeS.m / compute.py make_s_full (CW only).
// typeStr: 'CW_SD_I' | 'CW_SS_I' | 'CW_DS_I'
// optodes: {sx,dx} | {sx,d1x,d2x} | {s1x,s2x,d1x,d2x}
// op: {nIn,nOut,musp,mua}
// Returns {Svox:Float64Array, x:Float64Array, z:Float64Array, Nx, Nz}
function makeSvox(typeStr, optodes, op) {
    const arr   = typeStr.split('_')[1];   // 'SD' | 'SS' | 'DS'
    const V     = 1.0;                     // 1 mm³ voxel, hardcoded
    const z_off = 1.0 / op.musp;          // source z-offset = 1/musp

    // Build per-measurement source/detector pairs and list of all optode x coords.
    let sources = [], detectors = [], allX = [];

    if (arr === 'SD') {
        sources   = [[optodes.sx,  0, z_off]];
        detectors = [[optodes.dx,  0, 0]];
        allX = [optodes.sx, optodes.dx];

    } else if (arr === 'SS') {
        // 1 source, 2 detectors → 2 measurements
        sources   = [[optodes.sx, 0, z_off], [optodes.sx, 0, z_off]];
        detectors = [[optodes.d1x, 0, 0],    [optodes.d2x, 0, 0]];
        allX = [optodes.sx, optodes.d1x, optodes.d2x];

    } else if (arr === 'DS') {
        // Mirrors Python _expand_optodes: rSrcs=[S1,S1,S2,S2], rDets=[D1,D2,D2,D1]
        sources = [
            [optodes.s1x, 0, z_off], [optodes.s1x, 0, z_off],
            [optodes.s2x, 0, z_off], [optodes.s2x, 0, z_off],
        ];
        detectors = [
            [optodes.d1x, 0, 0], [optodes.d2x, 0, 0],
            [optodes.d2x, 0, 0], [optodes.d1x, 0, 0],
        ];
        allX = [optodes.s1x, optodes.s2x, optodes.d1x, optodes.d2x];
    }

    // Grid extents
    const xMin = Math.min(...allX) - 10;
    const xMax = Math.max(...allX) + 10;

    // maxRho: max horizontal source-detector distance across all measurement pairs
    let maxRho = 0;
    for (let m = 0; m < sources.length; m++) {
        maxRho = Math.max(maxRho, Math.abs(sources[m][0] - detectors[m][0]));
    }
    const zMax = Math.round(maxRho);

    // Axis arrays (step 1 mm)
    const xArr = [], zArr = [];
    for (let x = xMin; x <= xMax + 0.5; x++) xArr.push(x);
    for (let z = 0;    z <= zMax  + 0.5; z++) zArr.push(z);
    const Nx = xArr.length, Nz = zArr.length;

    // Voxel center list, row-major ix-outer iz-inner
    const r_all = [];
    for (let ix = 0; ix < Nx; ix++)
        for (let iz = 0; iz < Nz; iz++)
            r_all.push([xArr[ix], 0, zArr[iz]]);

    // Per-measurement L and ll vectors
    const nMeas = sources.length;
    const Ls  = new Float64Array(nMeas);
    const lls = [];
    for (let m = 0; m < nMeas; m++) {
        Ls[m] = continuousTotPathLen(sources[m], detectors[m], op).L;
        lls.push(continuousPartPathLen(sources[m], r_all, detectors[m], V, op));
    }

    // Arrangement combinator (Y=1 for all I-type measurements)
    const Svox = new Float64Array(Nx * Nz);

    if (arr === 'SD') {
        const L = Ls[0], ll = lls[0];
        for (let i = 0; i < Nx * Nz; i++) Svox[i] = ll[i] / L;

    } else if (arr === 'SS') {
        const dL = Ls[1] - Ls[0];
        for (let i = 0; i < Nx * Nz; i++)
            Svox[i] = (lls[1][i] - lls[0][i]) / dL;

    } else if (arr === 'DS') {
        // den = (L[1]-L[0]) + (L[3]-L[2]), num = (ll[1]-ll[0]) + (ll[3]-ll[2])
        const den = (Ls[1] - Ls[0]) + (Ls[3] - Ls[2]);
        for (let i = 0; i < Nx * Nz; i++) {
            const num = (lls[1][i] - lls[0][i]) + (lls[3][i] - lls[2][i]);
            Svox[i] = num / den;
        }
    }

    // Replace NaN/Inf (e.g. voxels coinciding with a source point)
    for (let i = 0; i < Svox.length; i++)
        if (!isFinite(Svox[i])) Svox[i] = 0.0;

    return { Svox, x: new Float64Array(xArr), z: new Float64Array(zArr), Nx, Nz };
}
```

- [ ] **Step 3: Refresh — verify SD tests pass (12 passed, 0 failed)**

- [ ] **Step 4: Commit**

```bash
git add tools/sensmaps/sensmaps.js tools/sensmaps/test.html
git commit -m "feat: makeSvox SD combinator"
```

---

### Task 7: makeSvox — SS and DS tests

**Files:**
- Modify: `tools/sensmaps/test.html`

(No sensmaps.js changes — SS and DS are already implemented in Task 6.)

- [ ] **Step 1: Add SS and DS tests to test.html** (before summary)

```javascript
// ── makeSvox CW_SS_I ──────────────────────────────────────────────────────
// Grid: x −10…45 (Nx=56), z 0…35 (Nz=36). x=15 → ix=25, z=15 → iz=15.
const _ss = makeSvox('CW_SS_I', { sx: 0, d1x: 25, d2x: 35 }, _op);
check('CW_SS_I Nx', _ss.Nx, 56);
check('CW_SS_I Nz', _ss.Nz, 36);
check('CW_SS_I S[x=15,z=15]', _ss.Svox[25*36+15], 6.30944e-5, 1e-4);

// ── makeSvox CW_DS_I ──────────────────────────────────────────────────────
// Grid: x −40…40 (Nx=81), z 0…35 (Nz=36). x=0 → ix=40, z=15 → iz=15.
const _ds = makeSvox('CW_DS_I', { s1x: -30, s2x: 30, d1x: -5, d2x: 5 }, _op);
check('CW_DS_I Nx', _ds.Nx, 81);
check('CW_DS_I Nz', _ds.Nz, 36);
check('CW_DS_I S[x=0,z=15]', _ds.Svox[40*36+15], 6.62126e-5, 1e-4);
```

- [ ] **Step 2: Refresh — verify all pass (18 passed, 0 failed)**

Note: DS test involves a 81×36 grid × 4 measurements — may take 2–5 seconds in the browser.

- [ ] **Step 3: Commit**

```bash
git add tools/sensmaps/test.html
git commit -m "test: SS and DS makeSvox tests pass"
```

---

### Task 8: index.html — HTML scaffold

**Files:**
- Create: `tools/sensmaps/index.html`

- [ ] **Step 1: Create `tools/sensmaps/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sensitivity Maps · Giles Blaney</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="../../site.css" rel="stylesheet">
    <link rel="icon" href="data:,">
    <style>
        .param-label { font-size: 0.85rem; font-weight: 500; color: var(--text); }
        .param-value { font-size: 0.8rem; color: var(--muted); font-variant-numeric: tabular-nums; }
        .derived-box {
            background: var(--section-alt);
            border: 1px solid var(--border);
            border-radius: 5px;
            padding: 0.75rem 1rem;
            margin-top: 1rem;
        }
        .derived-item { font-size: 0.82rem; color: var(--muted); margin-bottom: 0.15rem; }
        .derived-item:last-child { margin-bottom: 0; }
        .derived-val { color: var(--text); font-weight: 500; }
        .form-control {
            border-color: var(--border); border-radius: 4px;
            font-size: 0.88rem; background: var(--bg); color: var(--text);
        }
        .form-control:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(26,82,118,0.12);
            background: #fff;
        }
        .form-select {
            border-color: var(--border); border-radius: 4px;
            font-size: 0.88rem; background: var(--bg); color: var(--text);
        }
        .btn-run {
            background: var(--accent); border: none; border-radius: 4px;
            color: #fff; font-size: 0.83rem; font-weight: 500;
            letter-spacing: 0.04em; padding: 0.5rem 1rem;
            width: 100%; transition: background 0.15s; cursor: pointer;
        }
        .btn-run:hover { background: #144060; }
        #plot { border: 1px solid var(--border); border-radius: 6px; background: #fff; }
        .code-wrap { position: relative; }
        pre {
            background: var(--section-alt); border: 1px solid var(--border);
            border-radius: 6px; padding: 1rem 1.2rem;
            font-size: 0.78rem; line-height: 1.6; overflow-x: auto; margin: 0;
        }
        pre code { font-family: 'Courier New', monospace; color: var(--text); }
        .copy-btn {
            position: absolute; top: 0.5rem; right: 0.5rem;
            font-size: 0.7rem; font-weight: 500; background: var(--bg);
            border: 1px solid var(--border); border-radius: 3px;
            padding: 2px 8px; cursor: pointer; color: var(--muted);
            transition: background 0.12s, color 0.12s;
        }
        .copy-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
    </style>
    <script>MathJax = { tex: { inlineMath: [['\\(','\\)']], displayMath: [['$$','$$']] } };</script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
</head>
<body>

<nav class="navbar navbar-expand-lg fixed-top">
    <div class="container">
        <a class="navbar-brand" href="../../index.html">Giles Blaney, PhD</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarNav" aria-label="Toggle navigation">
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
        <div class="section-eyebrow">Diffusion Theory</div>
        <h1 class="tool-title">Sensitivity Maps</h1>
        <p class="tool-subtitle">CW sensitivity to absorption change — semi-infinite homogeneous medium</p>
    </div>

    <div class="row g-3 mb-5">

        <!-- Controls -->
        <div class="col-md-4">
            <div class="param-card">

                <!-- Optical properties -->
                <div class="mb-2">
                    <label class="param-label" for="mua">μ<sub>a</sub> (mm<sup>−1</sup>)</label>
                    <input type="number" class="form-control" id="mua" value="0.011" step="0.001" min="0">
                </div>
                <div class="mb-2">
                    <label class="param-label" for="musp">μ′<sub>s</sub> (mm<sup>−1</sup>)</label>
                    <input type="number" class="form-control" id="musp" value="1.1" step="0.1" min="0">
                </div>
                <div class="mb-3">
                    <label class="param-label" for="nIn">n</label>
                    <input type="number" class="form-control" id="nIn" value="1.333" step="0.01" min="1">
                </div>

                <!-- Arrangement -->
                <div class="mb-3">
                    <label class="param-label" for="arrangement">Measurement type</label>
                    <select class="form-select" id="arrangement">
                        <option value="CW_SD_I">CW_SD_I — Single Distance</option>
                        <option value="CW_SS_I">CW_SS_I — Single Slope</option>
                        <option value="CW_DS_I">CW_DS_I — Dual Slope</option>
                    </select>
                </div>

                <!-- SD optodes -->
                <div id="optodes-sd">
                    <div class="mb-2">
                        <label class="param-label" for="sx-sd">Source x (mm)</label>
                        <input type="number" class="form-control" id="sx-sd" value="0" step="1">
                    </div>
                    <div class="mb-3">
                        <label class="param-label" for="dx-sd">Detector x (mm)</label>
                        <input type="number" class="form-control" id="dx-sd" value="30" step="1">
                    </div>
                </div>

                <!-- SS optodes -->
                <div id="optodes-ss" style="display:none">
                    <div class="mb-2">
                        <label class="param-label" for="sx-ss">Source x (mm)</label>
                        <input type="number" class="form-control" id="sx-ss" value="0" step="1">
                    </div>
                    <div class="mb-2">
                        <label class="param-label" for="d1x-ss">Detector 1 x (mm)</label>
                        <input type="number" class="form-control" id="d1x-ss" value="25" step="1">
                    </div>
                    <div class="mb-3">
                        <label class="param-label" for="d2x-ss">Detector 2 x (mm)</label>
                        <input type="number" class="form-control" id="d2x-ss" value="35" step="1">
                    </div>
                </div>

                <!-- DS optodes -->
                <div id="optodes-ds" style="display:none">
                    <div class="mb-2">
                        <label class="param-label" for="s1x-ds">Source 1 x (mm)</label>
                        <input type="number" class="form-control" id="s1x-ds" value="-30" step="1">
                    </div>
                    <div class="mb-2">
                        <label class="param-label" for="s2x-ds">Source 2 x (mm)</label>
                        <input type="number" class="form-control" id="s2x-ds" value="30" step="1">
                    </div>
                    <div class="mb-2">
                        <label class="param-label" for="d1x-ds">Detector 1 x (mm)</label>
                        <input type="number" class="form-control" id="d1x-ds" value="-5" step="1">
                    </div>
                    <div class="mb-3">
                        <label class="param-label" for="d2x-ds">Detector 2 x (mm)</label>
                        <input type="number" class="form-control" id="d2x-ds" value="5" step="1">
                    </div>
                </div>

                <button class="btn-run" id="compute-btn">Compute</button>

                <div class="derived-box">
                    <div class="derived-item">z<sub>0</sub> = <span id="z0-val" class="derived-val"></span> mm</div>
                    <div class="derived-item">D = <span id="D-val" class="derived-val"></span> mm</div>
                    <div class="derived-item">μ<sub>eff</sub> = <span id="mueff-val" class="derived-val"></span> mm<sup>−1</sup></div>
                    <div class="derived-item">max ρ = <span id="rho-val" class="derived-val"></span> mm</div>
                </div>
            </div>

            <div class="about-card">
                <div class="about-title">About</div>
                <p class="about-text">Sensitivity maps S<sub>Y</sub>(<b>r</b>) for CW intensity measurements in a semi-infinite homogeneous medium under diffusion theory. Source–detector optodes are on the surface (z = 0); the map shows the x–z plane (y = 0).</p>
            </div>
        </div>

        <!-- Plot -->
        <div class="col-md-8">
            <div id="plot" style="height:500px;"></div>
        </div>
    </div>

    <!-- Background section — placeholder text, filled in Task 11 -->
    <div class="info-section" id="background-section">
        <div class="section-eyebrow">Background</div>
        <h2>Sensitivity to absorption change</h2>
        <hr class="section-rule">
        <div class="info-card">
            <p><em>Theory content added in Task 11.</em></p>
        </div>
    </div>

    <!-- Code section — placeholder, filled in Task 11 -->
    <div class="info-section" id="code-section">
        <div class="section-eyebrow">Code</div>
        <h2>Implementation</h2>
        <hr class="section-rule">
        <div class="info-card">
            <p><em>Code block added in Task 11.</em></p>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script src="sensmaps.js"></script>
<script>
// UI logic added in Tasks 9–10
</script>
</body>
</html>
```

- [ ] **Step 2: Open in browser — verify page loads with navbar, controls, empty plot area**

```bash
# server already running from Task 1; if not:
python3 -m http.server 8080
```

Open `http://localhost:8080/tools/sensmaps/index.html`. Expect: page renders with navbar, control panel, empty plot div. No JS errors.

- [ ] **Step 3: Commit**

```bash
git add tools/sensmaps/index.html
git commit -m "feat: sensitivity maps page scaffold"
```

---

### Task 9: Dynamic form + derived values + compute wiring

**Files:**
- Modify: `tools/sensmaps/index.html` — replace the empty `<script>` block at the bottom

- [ ] **Step 1: Replace the `// UI logic added in Tasks 9–10` script block with the following**

```javascript
function updateArrangement() {
    const arr = document.getElementById('arrangement').value;
    document.getElementById('optodes-sd').style.display = arr === 'CW_SD_I' ? '' : 'none';
    document.getElementById('optodes-ss').style.display = arr === 'CW_SS_I' ? '' : 'none';
    document.getElementById('optodes-ds').style.display = arr === 'CW_DS_I' ? '' : 'none';
    updateDerived();
}

function updateDerived() {
    const mua  = +document.getElementById('mua').value  || 0.011;
    const musp = +document.getElementById('musp').value || 1.1;
    const D    = 1.0 / (3.0 * musp);
    const z0   = 1.0 / musp;
    const mueff = Math.sqrt(mua / D);

    document.getElementById('z0-val').textContent   = z0.toFixed(3);
    document.getElementById('D-val').textContent    = D.toFixed(4);
    document.getElementById('mueff-val').textContent = mueff.toFixed(4);

    const arr = document.getElementById('arrangement').value;
    let maxRho = 0;
    if (arr === 'CW_SD_I') {
        maxRho = Math.abs(+document.getElementById('sx-sd').value
                        - +document.getElementById('dx-sd').value);
    } else if (arr === 'CW_SS_I') {
        const sx  = +document.getElementById('sx-ss').value;
        const d1x = +document.getElementById('d1x-ss').value;
        const d2x = +document.getElementById('d2x-ss').value;
        maxRho = Math.max(Math.abs(sx - d1x), Math.abs(sx - d2x));
    } else if (arr === 'CW_DS_I') {
        const s1x = +document.getElementById('s1x-ds').value;
        const s2x = +document.getElementById('s2x-ds').value;
        const d1x = +document.getElementById('d1x-ds').value;
        const d2x = +document.getElementById('d2x-ds').value;
        maxRho = Math.max(Math.abs(s1x-d1x), Math.abs(s1x-d2x),
                          Math.abs(s2x-d1x), Math.abs(s2x-d2x));
    }
    document.getElementById('rho-val').textContent = maxRho.toFixed(0);
}

function getOptodes() {
    const arr = document.getElementById('arrangement').value;
    if (arr === 'CW_SD_I') return {
        sx:  +document.getElementById('sx-sd').value,
        dx:  +document.getElementById('dx-sd').value,
    };
    if (arr === 'CW_SS_I') return {
        sx:  +document.getElementById('sx-ss').value,
        d1x: +document.getElementById('d1x-ss').value,
        d2x: +document.getElementById('d2x-ss').value,
    };
    return {
        s1x: +document.getElementById('s1x-ds').value,
        s2x: +document.getElementById('s2x-ds').value,
        d1x: +document.getElementById('d1x-ds').value,
        d2x: +document.getElementById('d2x-ds').value,
    };
}

function renderPlot(result, typeStr, optodes) {
    const { Svox, x, z, Nx, Nz } = result;

    // Build Plotly 2-D array: zData[iz][ix] (depth outer, x inner)
    const zData = [];
    for (let iz = 0; iz < Nz; iz++) {
        const row = [];
        for (let ix = 0; ix < Nx; ix++) row.push(Svox[ix * Nz + iz]);
        zData.push(row);
    }

    let maxAbsS = 0;
    for (let i = 0; i < Svox.length; i++) {
        const v = Math.abs(Svox[i]);
        if (v > maxAbsS) maxAbsS = v;
    }

    const heatmap = {
        type: 'heatmap',
        x: Array.from(x),
        y: Array.from(z),
        z: zData,
        colorscale: [[0,'rgb(0,0,255)'],[0.5,'rgb(255,255,255)'],[1,'rgb(255,0,0)']],
        zmin: -maxAbsS,
        zmax:  maxAbsS,
        showscale: true,
        colorbar: { title: { text: 'S', side: 'right' }, thickness: 12, len: 0.8 },
    };

    // Optode markers
    const arrangement = typeStr.split('_')[1];
    let srcXs = [], detXs = [];
    if (arrangement === 'SD') {
        srcXs = [optodes.sx]; detXs = [optodes.dx];
    } else if (arrangement === 'SS') {
        srcXs = [optodes.sx]; detXs = [optodes.d1x, optodes.d2x];
    } else {
        srcXs = [optodes.s1x, optodes.s2x]; detXs = [optodes.d1x, optodes.d2x];
    }

    const srcTrace = {
        type: 'scatter', mode: 'markers',
        x: srcXs, y: srcXs.map(() => 0),
        marker: { color: '#e74c3c', size: 10, symbol: 'circle',
                  line: { color: '#fff', width: 1.5 } },
        name: 'Source(s)',
    };
    const detTrace = {
        type: 'scatter', mode: 'markers',
        x: detXs, y: detXs.map(() => 0),
        marker: { color: '#2980b9', size: 10, symbol: 'circle',
                  line: { color: '#fff', width: 1.5 } },
        name: 'Detector(s)',
    };

    Plotly.react('plot', [heatmap, srcTrace, detTrace], {
        xaxis: { title: 'x (mm)', gridcolor: '#e0dcd6', zerolinecolor: '#c8c2bc' },
        yaxis: { title: 'Depth (mm)', autorange: 'reversed',
                 gridcolor: '#e0dcd6', zerolinecolor: '#c8c2bc' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor:  'rgba(0,0,0,0)',
        font: { family: 'DM Sans, sans-serif', size: 12, color: '#6b6b6b' },
        margin: { t: 20, r: 20, b: 50, l: 60 },
        legend: { x: 1.08, y: 1, xanchor: 'left' },
    }, { responsive: true });
}

function runCompute() {
    const mua  = +document.getElementById('mua').value  || 0.011;
    const musp = +document.getElementById('musp').value || 1.1;
    const nIn  = +document.getElementById('nIn').value  || 1.333;
    const op   = { nIn, nOut: 1.0, musp, mua };
    const arr  = document.getElementById('arrangement').value;
    const optodes = getOptodes();

    const result = makeSvox(arr, optodes, op);
    renderPlot(result, arr, optodes);
    updateDerived();
}

document.getElementById('arrangement').addEventListener('change', updateArrangement);
document.getElementById('compute-btn').addEventListener('click', runCompute);
updateArrangement();   // initialise derived values on load
```

- [ ] **Step 2: Test in browser**

Open `http://localhost:8080/tools/sensmaps/index.html`.

- Switch dropdown CW_SD_I → CW_SS_I → CW_DS_I. Verify correct optode fields appear/disappear.
- Verify derived values box updates on arrangement change.
- Click Compute with CW_SD_I defaults. Expect: blue-white-red heatmap appears, depth axis inverted (0 at top), red source marker at x=0, blue detector marker at x=30.
- Switch to CW_DS_I, click Compute. Expect: map shows suppressed near-surface sensitivity.

- [ ] **Step 3: Commit**

```bash
git add tools/sensmaps/index.html
git commit -m "feat: compute wiring, dynamic form, Plotly rendering"
```

---

### Task 10: Background and Code sections

**Files:**
- Modify: `tools/sensmaps/index.html` — replace the two placeholder `info-section` divs

- [ ] **Step 1: Replace the `#background-section` div with**

```html
    <div class="info-section">
        <div class="section-eyebrow">Background</div>
        <h2>Sensitivity to absorption change</h2>
        <hr class="section-rule">
        <div class="info-card">

            <h5>Definition</h5>
            <p>
                Sensitivity \(S_Y(\mathbf{r})\) is defined as the ratio of the local Jacobian
                to the global Jacobian:
            </p>
            $$S_Y(\mathbf{r}) = \frac{\partial Y / \partial \mu_{a,\text{pert}}(\mathbf{r})}
                                      {\partial Y / \partial \mu_{a,\text{pert,homo}}}$$
            <p>
                It is dimensionless and quantifies how a localised absorption perturbation
                \(\Delta\mu_{a,\text{pert}}(\mathbf{r})\) at position \(\mathbf{r}\) affects
                the measurement \(Y\) relative to a homogeneous perturbation throughout the medium.
                Equivalently,
            </p>
            $$S_Y(\mathbf{r}) = \frac{\Delta\mu_{a,Y}}{\Delta\mu_{a,\text{pert}}(\mathbf{r})}$$
            <p>
                where \(\Delta\mu_{a,Y}\) is the recovered effective homogeneous \(\Delta\mu_a\)
                and \(\Delta\mu_{a,\text{pert}}(\mathbf{r})\) is the true local perturbation.
            </p>

            <h5 class="mt-4">Diffusion theory — semi-infinite medium</h5>
            <p>
                The medium is modelled as semi-infinite and homogeneous with the extrapolated
                boundary condition (same geometry as the
                <a href="../diffuse-reflectance/index.html">Diffuse Reflectance</a> tool).
                Optodes sit on the surface at \(z=0\); the map shows the \(xz\)-plane at \(y=0\).
            </p>

            <h5 class="mt-4">CW intensity data type</h5>
            <p>
                For CW, the data type \(Y = \ln I\) is dimensionless since it always appears
                in differences. The generalized total path length is
                \(L = -\partial Y/\partial\mu_{a,\text{homo}}\) (mm) and the generalized partial
                path length is \(\ell(\mathbf{r}) = -\partial Y/\partial\mu_{a,\text{pert}}(\mathbf{r})\) (mm).
                For the single-distance arrangement:
            </p>
            $$S(\mathbf{r}) = \frac{\ell(\mathbf{r})}{L}$$

            <h5 class="mt-4">Arrangements</h5>
            <p>
                <strong>SD (Single Distance)</strong> uses one source and one detector.
                \(S(\mathbf{r}) = \ell(\mathbf{r})/L\).
            </p>
            <p>
                <strong>SS (Single Slope)</strong> uses one source and two detectors at different
                separations \(\rho_0 &lt; \rho_1\):
                \(S(\mathbf{r}) = (\ell_1 - \ell_0)/(L_1 - L_0)\).
            </p>
            <p>
                <strong>DS (Dual Slope)</strong> uses two sources and two detectors, combining
                slopes measured in both directions. DS provides suppressed sensitivity to
                superficial layers.
            </p>

            <h5 class="mt-4">Citation</h5>
            <p class="mb-0">
                Giles Blaney, Angelo Sassaroli, and Sergio Fantini,
                <em>Spatial sensitivity to absorption changes for various near-infrared spectroscopy
                methods: A compendium review</em>,
                Journal of Innovative Optical Health Sciences, Vol.&nbsp;17, No.&nbsp;04,
                2430001 (2024).
                <a href="https://doi.org/10.1142/S1793545824300015" target="_blank" rel="noopener">
                    https://doi.org/10.1142/S1793545824300015
                </a>
            </p>
        </div>
    </div>
```

- [ ] **Step 2: Replace the `#code-section` div with**

```html
    <div class="info-section">
        <div class="section-eyebrow">Code</div>
        <h2>Implementation</h2>
        <hr class="section-rule">
        <div class="info-card">
            <p>The key physics functions from <code>sensmaps.js</code>:</p>
            <div class="code-wrap">
                <button class="copy-btn" id="copy-btn">Copy</button>
                <pre><code id="code-block">// CW reflectance R (mm⁻²) at source rs=[x,y,z], detector rd=[x,y,z]
function continuousReflectance(rs, rd, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;
    const dx = rd[0]-rs[0], dy = rd[1]-rs[1];
    const r1 = Math.sqrt(dx*dx + dy*dy + (rd[2]-rs[2])**2);
    const r2 = Math.sqrt(dx*dx + dy*dy + (rd[2]-rspZ)**2);
    return (
          z0          * (1/r1 + mueff) * Math.exp(-mueff*r1) / (r1*r1)
        + (z0-2.0*zb) * (1/r2 + mueff) * Math.exp(-mueff*r2) / (r2*r2)
    ) / (4.0 * Math.PI);
}

// SD sensitivity S(r) = ℓ(r) / L  (dimensionless)
// where L = continuousTotPathLen().L  and
//       ℓ = continuousPartPathLen() per voxel</code></pre>
            </div>
        </div>
    </div>
```

- [ ] **Step 3: Wire the copy button** — add inside the existing `<script>` block (after `updateArrangement()` call)

```javascript
document.getElementById('copy-btn').addEventListener('click', () => {
    const raw = document.getElementById('code-block').textContent;
    navigator.clipboard.writeText(raw).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
});
```

- [ ] **Step 4: Open in browser — verify MathJax renders equations, copy button works**

Open `http://localhost:8080/tools/sensmaps/index.html`, scroll to Background section.
Expected: LaTeX equations rendered, citation present, code block visible with Copy button.

- [ ] **Step 5: Commit**

```bash
git add tools/sensmaps/index.html
git commit -m "feat: background theory and code sections"
```

---

### Task 11: Tool card in main index.html

**Files:**
- Modify: `index.html` (root)

- [ ] **Step 1: Add tool card** — in `index.html`, find the closing `</div>` of the tools `row g-3` div (after the diffuse-reflectance card, around line 249) and add before it:

```html
                <div class="col-md-4">
                    <a href="tools/sensmaps/index.html" class="tool-link">
                        <div class="tool-card">
                            <div class="tool-name">Sensitivity Maps</div>
                            <div class="tool-tags">CW · Diffusion Theory · Plotly</div>
                            <p class="tool-desc">Interactive 2D sensitivity maps S<sub>Y</sub>(<b>r</b>) for CW NIRS — SD, SS, and DS arrangements in a semi-infinite medium.</p>
                            <div class="tool-cta">Open tool →</div>
                        </div>
                    </a>
                </div>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8080/index.html`, scroll to Tools section.
Expected: three tool cards — tinyMC, Diffuse Reflectance, Sensitivity Maps. Click the new card — navigates to the tool.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add sensitivity maps tool card to homepage"
```

---

## Self-review

**Spec coverage:**
- ✓ CW_SD_I, CW_SS_I, CW_DS_I implemented (Tasks 6–7)
- ✓ x-only optode inputs, y=0 z=0 implied (Task 8)
- ✓ Dynamic form show/hide per arrangement (Task 9)
- ✓ Blue-white-red symmetric colormap, inverted depth axis (Task 9)
- ✓ Optode markers on plot (Task 9)
- ✓ Hardcoded dr=1mm, no perturbation convolution (Task 6)
- ✓ Auto grid from optode extents (Task 6)
- ✓ Background section with correct sensitivity definition and citation (Task 10)
- ✓ Tool card on homepage (Task 11)
- ✓ Y=1 for I-type (combinators use simplified forms, Task 6)
- ✓ DS optode expansion mirrors Python _expand_optodes (Task 6)

**No placeholders or TBDs found.**

**Type consistency:** `makeSvox` returns `{Svox, x, z, Nx, Nz}` — all consumers (test.html Task 7, renderPlot Task 9) use these exact field names. ✓
