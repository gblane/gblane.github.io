# Sensitivity Maps JavaScript Tool — Design Spec

**Date:** 2026-05-02  
**Branch:** `feature/sensmaps-tool`  
**Target:** `tools/sensmaps/` in `gblane.github.io`  
**Related:** `sensmaps` Python package, Blaney et al. JIOHS 2024

---

## Overview

Add a browser-based CW sensitivity map tool to gblane.github.io. The tool ports the CW physics and compute layers from the `sensmaps` Python package into JavaScript, allowing users to interactively generate and visualize 2D sensitivity maps without any installation. Only CW data-types are implemented (CW_SD_I, CW_SS_I, CW_DS_I). The map is always the x–z plane at y = 0.

---

## Files

### New files

| Path | Purpose |
|------|---------|
| `tools/sensmaps/sensmaps.js` | Physics + compute layer (no DOM, no Plotly) |
| `tools/sensmaps/index.html` | Bootstrap/Plotly UI page |

### Modified files

| Path | Change |
|------|--------|
| `index.html` | Add one tool card in the `#tools` section linking to `tools/sensmaps/index.html` |

---

## Architecture

**Two-layer separation** (mirrors the Python package):

```
sensmaps.js          index.html
(physics + compute)  (UI + plot)
     ↑ imported by       ↓ calls makeSvox()
```

`sensmaps.js` is loaded as a plain `<script src="...">` tag — no ES modules, no bundler. All exports are plain globals.

---

## `sensmaps.js` — Physics and compute layer

### Optical properties object

```js
{ nIn: 1.333, nOut: 1.0, musp: 1.1, mua: 0.011 }
```

### Functions

**`n2A(n)`** — index-of-refraction mismatch parameter A. Direct port of `n2a()` in `physics.py` (7th-order polynomial for n > 1, 4th-order for n < 1).

**`continuousReflectance(rs, rd, op)`** — CW reflectance at omega = 0. `rs` and `rd` are `[x, y, z]` arrays. Returns scalar R (mm⁻²). Port of `continuous_reflectance()`.

**`continuousTotPathLen(rs, rd, op)`** — Returns `{ L, R }` scalars. L in mm. Port of `continuous_tot_path_len()`.

**`continuousPartPathLen(rs, r_all, rd, V, op)`** — `r_all` is an array of N voxel-center `[x, y, z]` arrays. Returns `Float64Array` of length N, each entry the partial path length ℓ (mm) for that voxel. Port of `continuous_part_path_len()`.

**`makeSvox(typeStr, optodes, op)`** — top-level dispatcher. Returns `{ Svox, x, z }`.

- `typeStr`: one of `"CW_SD_I"`, `"CW_SS_I"`, `"CW_DS_I"`
- `optodes`: object with x-coordinates only; y = 0, z = 0 implied for all optodes (surface placement). Fields vary by arrangement (see UI section).
- `op`: optical properties object

Steps inside `makeSvox`:
1. Parse `typeStr` → arrangement (`SD`, `SS`, `DS`)
2. Apply z-offset to sources: source z → `1 / op.musp`; detectors remain at z = 0
3. Build grid:
   - x: `[min(all optode x) − 10, max(all optode x) + 10]`, step 1 mm
   - z: `[0, maxRho]`, step 1 mm, where `maxRho = max source–detector distance across all pairs
   - y: fixed at `[0]`
4. For each measurement pair (rs_i, rd_i): call `continuousTotPathLen(rs_i, rd_i, op)` once to get L_i, then call `continuousPartPathLen(rs_i, r_all, rd_i, V, op)` once with the full voxel grid (all Nx×Nz centers batched) to get the ℓ_i vector — mirroring the Python batched call
5. Apply arrangement combinator (Y = 1 for all I-type measurements):
   - SD: `Svox(r) = ℓ(r) / L`
   - SS (1 source, 2 detectors): `Svox(r) = (ℓ₁(r) − ℓ₀(r)) / (L₁ − L₀)`
   - DS (2 sources, 2 detectors, 4 measurements): `Svox(r) = ((ℓ₁−ℓ₀) + (ℓ₃−ℓ₂)) / ((L₁−L₀) + (L₃−L₂))`
6. Return `{ Svox: Float64Array (Nx × Nz, row-major), x: Float64Array, z: Float64Array }`

No perturbation convolution. No voxel-size input — hardcoded at 1 mm (V = 1 mm³, dr = 1 mm).

### Arrangement combinator note

For the `I` data type, Y = 1 because the data-type is ln(I), which is dimensionless (it always appears in differences). The combinators therefore simplify to the forms above — no reflectance values appear in the numerator or denominator.

### DS optode expansion

Mirrors MATLAB `makeS.m` and Python `_expand_optodes`: 4 measurements from (S1→D1), (S1→D2), (S2→D1), (S2→D2) — indices 0–3.

---

## `index.html` — UI page

### Page structure

Follows the exact pattern of `tools/diffuse-reflectance/index.html`:

1. Fixed navbar (site brand + Bio / Research / Tools links)
2. Tool header: eyebrow "Diffusion Theory", title "Sensitivity Maps", subtitle "CW sensitivity to absorption change — semi-infinite homogeneous medium"
3. Two-column row (`col-md-4` controls / `col-md-8` plot)
4. "Background" info-section
5. "Code" info-section (key JS formulas)

### Controls (left column)

**Optical properties** (always visible):
| Label | Input | Default |
|-------|-------|---------|
| μₐ (mm⁻¹) | text | 0.011 |
| μ′ₛ (mm⁻¹) | text | 1.1 |
| n | text | 1.333 |

**Measurement type** dropdown: `CW_SD_I` / `CW_SS_I` / `CW_DS_I`

**Optode x-coordinates** (dynamically shown/hidden by arrangement):

*SD:*
- Source x (mm), default 0
- Detector x (mm), default 30

*SS (1 source, 2 detectors):*
- Source x (mm), default 0
- Detector 1 x (mm), default 25
- Detector 2 x (mm), default 35

*DS (2 sources, 2 detectors):*
- Source 1 x (mm), default −30
- Source 2 x (mm), default 30
- Detector 1 x (mm), default −5
- Detector 2 x (mm), default 5

**"Compute" button** — triggers `makeSvox()` and re-renders the plot. No live update on input change (intentional; matches Python GUI's Recalculate button pattern).

**Derived values box** (below button): z₀ = 1/μ′ₛ (mm), D = 1/(3μ′ₛ) (mm), μ_eff (mm⁻¹), max ρ (mm).

### Plot (right column)

Plotly `heatmap` trace:
- x-axis: lateral position x (mm)
- y-axis: depth z (mm), **inverted** (0 at top, increasing downward — standard NIRS depth convention)
- Colorscale: blue (most negative) → white (zero) → red (most positive), custom three-stop: `[[0,'rgb(0,0,255)'],[0.5,'rgb(255,255,255)'],[1,'rgb(255,0,0)']]`
- Color limits: symmetric, `zmin = −max|S|`, `zmax = +max|S|`
- Optode positions overlaid as scatter markers at z = 0: sources (filled circle, one color), detectors (filled circle, different color), added as additional Plotly traces
- Redraws via `Plotly.react` on each Compute press

---

## Background section content

Sections (following paper structure):

1. **Definition of sensitivity** — S_Y(r) is the ratio of the local Jacobian ∂Y/∂μₐ,pert(r) to the global Jacobian ∂Y/∂μₐ,pert,homo. Dimensionless. Equivalently, S_Y(r) = Δμₐ,Y / Δμₐ,pert(r): the ratio of the recovered effective homogeneous Δμₐ to the true local Δμₐ at r.

2. **Diffusion theory** — semi-infinite homogeneous medium, extrapolated boundary condition (same geometry as the diffuse-reflectance tool on this site).

3. **CW intensity** — Y = ln(I), dimensionless since it always appears in differences. The generalized total path length is L = −∂Y/∂μₐ,homo (mm) and the generalized partial path length is ℓ(r) = −∂Y/∂μₐ,pert(r) (mm). For single-distance: S(r) = ℓ(r)/L.

4. **Arrangements** — SD uses a single source–detector pair. SS uses one source and two detectors at different separations. DS uses two sources and two detectors; by combining slopes in both directions it provides suppressed sensitivity to superficial layers.

5. **Citation** — Giles Blaney, Angelo Sassaroli, and Sergio Fantini, *Spatial sensitivity to absorption changes for various near-infrared spectroscopy methods: A compendium review*, Journal of Innovative Optical Health Sciences, Vol. 17, No. 04, 2430001 (2024). https://doi.org/10.1142/S1793545824300015

---

## Git workflow

- Working branch: `feature/sensmaps-tool` (off `main`)
- Merge to `main` via PR to deploy
- The `docs/superpowers/` directory lives only in the feature branch during development; it can be merged or kept as-is

---

## Out of scope

- FD and TD measurement types
- Perturbation convolution
- Configurable voxel size
- Third-angle (3D) view
- Monte Carlo backend
- Contour overlay
- Live update on input change
