---
title: Tissue Absorption Tool — Design Spec
date: 2026-05-04
---

## Overview

A browser-based interactive tool that plots the bulk tissue absorption coefficient μₐ(λ) as a function of wavelength, with individual chromophore contributions shown as dashed lines. Follows the existing tool pattern on the site (Bootstrap + Plotly, sliders in a param card).

Lives at: `tools/tissue-absorption/index.html`

---

## Inputs

All values are **volumetric averages over the full probed tissue volume** — not surface or epidermal values. This is noted explicitly in the UI because it explains why Mfrac is much lower than the epidermal melanin fraction (the epidermis is only a thin layer within the total probed volume).

| Parameter | Label | Range | Default | Units |
|---|---|---|---|---|
| `Mfrac` | Melanin fraction (whole-volume avg) | 0–0.05 | 0.001 | — |
| `TuM` | Total hemoglobin | 0–100 | 65 | μM |
| `S` | O₂ saturation | 0–1 | 0.65 | — |
| `Wfrac` | Water fraction | 0–1 | 0.55 | — |
| `Lfrac` | Lipid fraction | 0–0.5 | 0.15 | — |
| `lamMin` | λ min | 400–1000 | 700 | nm |
| `lamMax` | λ max | 400–1000 | 1000 | nm |

λ min and λ max are number inputs (not sliders), validated so that lamMin < lamMax and both stay within 400–1000 nm.

---

## Layout

Matches the `diffuse-reflectance` tool exactly:

- **Left col (col-md-4)**: param card with sliders and wavelength inputs, followed by an "About" card explaining the volumetric-average convention
- **Right col (col-md-8)**: single Plotly chart, 500px tall

---

## Plot

Single Plotly chart:

| Trace | Style | Color |
|---|---|---|
| Total μₐ | solid | black |
| HbO₂ | dashed | red |
| HHb | dashed | dark red (#8b0000) |
| Water | dashed | blue |
| Lipid | dashed | orange (#e07b00) |
| Melanin | dashed | brown (#795548) |

- x-axis: Wavelength (nm), range = [lamMin, lamMax]
- y-axis: μₐ (mm⁻¹)
- Plotly legend is clickable to toggle individual traces

---

## Physics

### Chromophore contributions (Beer's law)

```
mua_HbO2(λ)  = E_HbO2(λ)  × TuM × S          [1/mm]
mua_HHb(λ)   = E_HHb(λ)   × TuM × (1 − S)    [1/mm]
mua_water(λ) = E_water(λ) × Wfrac              [1/mm]
mua_lipid(λ) = E_lipid(λ) × Lfrac              [1/mm]
```

Where E_HbO2 and E_HHb are in 1/(mm·μM), and E_water and E_lipid are in 1/mm (fraction-based).

### Melanin (Jacques 2013, Eq. 8)

```
mua_mel(λ) = Mfrac × 51.9 × (λ/500)^−3.5     [1/mm]
```

### Total

```
mua(λ) = mua_HbO2 + mua_HHb + mua_water + mua_lipid + mua_mel
```

---

## Data

Chromophore extinction coefficients come from the DOIT-Toolbox `.mat` files, pre-sampled at 1 nm intervals from 400–1000 nm and embedded as JavaScript arrays in the HTML file. Linear interpolation is used at runtime for the user-selected wavelength range. Values below zero are clamped to zero (matching the MATLAB source).

### Sources and citations

- **HbO₂ & HHb**: Prahl, S. "Tabulated Molar Extinction Coefficient for Hemoglobin in Water." omlc.org/spectra/hemoglobin/summary.html. Data compiled from W.B. Gratzer (MRC Labs, London) and N. Kollias (Wellman Laboratories, Harvard Medical School). Units converted from cm⁻¹/M to mm⁻¹/μM via `log(10) × 1e-7`.

- **Water**: Pope, R.M. "Optical absorption of pure water and sea water using the integrating cavity absorption meter," Texas A&M University (1993) [382–700 nm]; Kou, L., Labrie, D., and Chylek, P. "Refractive indices of water and ice in the 0.65–2.5 μm spectral range," *Appl. Opt.* 32, 3531–3540 (1993) [700–2500 nm]. Units converted from cm⁻¹ to mm⁻¹.

- **Lipid**: van Veen, R.L.P., Sterenborg, H.J.C.M., Pifferi, A., Torricelli, A., and Cubeddu, R. "Determination of VIS-NIR absorption coefficients of mammalian fat, with time- and spatially resolved diffuse reflectance and transmission spectroscopy." OSA Annual BIOMED Topical Meeting (2004). Units converted from m⁻¹ to mm⁻¹.

- **Melanin**: Jacques, S.L. "Optical properties of biological tissues: a review." *Phys. Med. Biol.* 58, R37–R61 (2013). doi:10.1088/0031-9155/58/11/r37

---

## Page Structure

1. Navbar (matches site)
2. Tool header: eyebrow "Tissue Optics", title "Tissue Absorption", subtitle "Bulk μₐ(λ) from chromophore concentrations — volumetric averages"
3. Two-column layout: param card + plot
4. Theory section: Beer's law model, melanin formula, equations rendered with MathJax
5. References section: four citations listed

---

## Files

```
tools/tissue-absorption/
  index.html       # single self-contained file; chromophore data embedded as JS arrays
```

No external data fetches. Fully self-contained.

---

## Out of scope

- Scattering (μ′ₛ) — absorption only
- Refractive index
- Multiple tissue layers
- Saving / exporting plot data
