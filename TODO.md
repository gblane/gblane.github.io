# TODO

Open work on the site. Items W-1 … W-7 come from Sergio Fantini's review of 2026-08 (full email:
`FacultyApps/2026/feedback/Sergio.txt`; the merged review log with the research-statement items is
`FacultyApps/2026/notes/feedback_2026-08-31.md`). W-8 tracks a dependency on that review. Items marked
*(not from the review)* were found while checking the code against Sergio's comments on 2026-08-31.

He opened with "I really like your website", and called the sensitivity maps and the absorption spectra
"great" — no work is outstanding on `tools/sensmaps/` or `tools/tissue-absorption/`.

---

## tinyMC — `tools/tinymc/index.html`

Sergio: *"you should specify the absorption and reduced scattering coefficients (absorption is not mentioned, and it is
unclear what you mean with a 'unit scattering coefficient'. The axis units are not provided (if all units are
normalized/dimensionless, this should be specified). You should also mention that this is for an infinite medium. It
would be clearer to set the position of the start (the green dot) within a fixed system of coordinates with the start
position at the center, so that it will be evident how the direction of multiple random walks eventually becomes
isotropic."*

- [ ] **W-1 — State the optical properties, absorption included.** The simulation has no absorption at all: `runMC()`
      (`index.html:194`) propagates one walker with no weight and no termination, so the medium is implicitly
      non-absorbing. Say so — μ<sub>a</sub> = 0 — in the About card (`index.html:64`) and in the theory section
      (`index.html:117`). Also state that the walk is isotropic scattering (g = 0), so μ<sub>s</sub> is already the
      reduced coefficient here.
- [ ] **W-2 — Fix or drop "unit scattering coefficient".** The phrase appears at `index.html:64` and again as
      \(\mu_s = 1\) at `index.html:118`. It means step lengths are drawn from \(p(\ell)=\mu_s e^{-\mu_s\ell}\) with
      \(\mu_s=1\), i.e. lengths are measured in scattering mean free paths. Say that instead of naming the convention.
- [ ] **W-3 — Put units on the axes.** `index.html:252-254` labels them "X", "Y", "Z" with nothing else. With
      μ<sub>s</sub> = 1 the coordinates are in mean free paths, so either label them
      "x (mean free paths, 1/μ<sub>s</sub>)" or declare the whole plot dimensionless in the About card.
- [ ] **W-4 — Say the medium is infinite, and center the axes on the start.** No boundary exists anywhere in the code,
      which makes it an infinite homogeneous medium — state that. Then replace the data-driven autoscale
      (`aspectmode: 'data'`, `index.html:255`) with axis ranges symmetric about the origin — for example
      ±max|r| over the walk, applied to all three axes — so the green start marker sits at the center of a fixed frame
      and successive runs visibly spread isotropically around it.

## Diffuse reflectance — `tools/diffuse-reflectance/index.html`

Sergio: *"I still question the units of mm^-2 for the reflectance. The fact that when changing the optical properties it
is the axes that change makes it impossible to visualize the impact of an increase in absorption or scattering on the
shape of the lines (how do the slope and curvature change?). It may be better to set the axes and let the curves move on
the set system of coordinates. It is also unclear why the change in frequency only changes the phase of R_FD an not its
amplitude (is it just the CW reflectance? You should definitely report the amplitude and phase, at least, or all DC, AC,
and phase)."*

- [ ] **W-5 — Define the reflectance, do not just name its units.** The page asserts mm⁻² at `index.html:131` (CW),
      `:143` (FD) and (ps·mm²)⁻¹ at `:158` (TD), each with a parenthetical about source normalization. The units are
      dimensionally consistent with the Green's functions as written, so the gap is the definition, not the algebra:
      state that R is the reflectance per unit area per unit incident power (or per unit source energy for TD), and how
      it relates to the quantity a reader would measure. Worth settling directly with Sergio — the code is translated
      from the MATLAB published with Blaney, Sassaroli & Fantini (2024), and his convention should win.
- [ ] **W-6 — Fix the y-axis ranges.** Confirmed: only the x-axes are pinned (`index.html:394`, `:399`, `:405`, `:411`).
      The CW and |R̃<sub>FD</sub>| y-axes (`:396`, `:402`) are log axes with no `range`, so Plotly rescales them on every
      slider move, and the TD range is recomputed from the data each update (`:360-362`, `:415`). The curves therefore
      look nearly static while the axis labels change — exactly what Sergio describes. Compute a fixed range spanning
      the whole slider domain (μ<sub>a</sub> ∈ [0, 0.05], μ′<sub>s</sub> ∈ [0.5, 5] mm⁻¹, f ∈ [50, 500] MHz), set it
      once, and let the curves move inside it.
- [ ] **W-7 — Make the FD amplitude's frequency dependence visible.** The amplitude panel is already there
      (`index.html:368-370`, `|R_FD|`) and it is *not* the CW reflectance — it is computed from the complex
      \(\tilde\mu_{eff}\) (`:227-246`) and does vary with frequency. Checked numerically on 2026-08-31 at ρ = 30 mm,
      μ<sub>a</sub> = 0.0011 mm⁻¹, μ′<sub>s</sub> = 1.1 mm⁻¹: |R̃<sub>FD</sub>| falls by ×0.14 from 50 to 500 MHz
      (×0.02 at ρ = 50 mm). The autoranged log axis (W-6) is what hides it, so fixing W-6 should answer this comment
      too — verify at 50 vs 500 MHz afterward. While there, adopt his nomenclature in the panel titles: DC (= CW), AC
      (= |R̃<sub>FD</sub>|), and phase.
- [ ] **Unwrap the FD phase** *(not from the review)*. `fdPh` uses `Math.atan2` (`index.html:343`), so the phase wraps
      into (−π, π]. At 500 MHz with the default optical properties it wraps twice across ρ = 10–50 mm (computed
      2026-08-31: 62° → 222° → 391°), drawing two false discontinuities. Unwrap the array before plotting.

## Cross-repo

- [ ] **W-8 — Re-sync the bio if the research statement's framing changes.** Jana Kainerstorfer's review of the same
      package says the opening "sells tools rather than what they can achieve" and questions the identity line the site
      bio now carries (added in the 2026-07-23 external-consistency pass, commit `77b5ea2`). If that line or the program
      framing changes in the masters, the bio on `index.html` moves with it. Blocked until Giles decides item 1 in
      `FacultyApps/2026/notes/feedback_2026-08-31.md`.
