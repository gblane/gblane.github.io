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

- [x] **W-1 — State the optical properties, absorption included.** **Done 2026-09-02.** The About card now states that
      the medium is non-absorbing (μ<sub>a</sub> = 0) and that scattering is isotropic (g = 0), so μ<sub>s</sub> equals
      μ′<sub>s</sub>. Confirmed in the code first: `runMC()` carries no photon weight, no absorption term and no
      termination test — it takes exactly the requested number of steps — and directions come from
      `acos(1-2U)`/`2πU`, i.e. isotropic. The matching sentence for the theory section was drafted and **declined by
      Giles as unnecessary**; do not re-open it.
- [x] **W-2 — Fix or drop "unit scattering coefficient".** **Done 2026-09-02.** The About card no longer names the
      convention; it says the step lengths are measured in scattering mean free paths (1/μ<sub>s</sub> = 1). The second
      occurrence in the theory section was left in place **by Giles's decision**: the free-path PDF
      \(p(\ell)=\mu_s e^{-\mu_s\ell}\) and \(\ell=-\ln(\mathcal{U})\) appear immediately below it, so the phrase is
      defined where it stands. Do not re-open it.
- [x] **W-3 — Put units on the axes.** **Done 2026-09-02.** The three scene axes are now labeled "x (mfp)", "y (mfp)"
      and "z (mfp)", and the About card defines the abbreviation where it introduces the convention — "scattering mean
      free paths (mfp, 1/μ<sub>s</sub> = 1)". The empty-plot state hides its axes, so it needed no matching change.
      **The labels were invisible at first** — `cssVar()` pushed the `--font-sans` token through a canvas colour parser,
      which returned `#000000`, and Plotly's 3D renderer draws no axis titles with that as a font family. Fixed with a
      `cssVarRaw()` helper plus a 20 px margin (the titles sit outside the scene box). Slight corner clipping on
      elongated walks is accepted — Giles's call 2026-09-02.
- [x] **W-4 — Say the medium is infinite, and center the axes on the start.** **Done 2026-09-02, in part.** The About
      card now says the medium is infinite and homogeneous, which is the half Sergio asked about directly. The
      centred-axes half was **declined by Giles**: the axes keep their data-driven autoscale. `aspectmode: 'data'` was
      checked and already draws the three axes at a true 1:1:1 scale — one mean free path is the same on-screen length
      on x, y and z — so there is no skew to correct. Do not re-open either half.

## Diffuse reflectance — `tools/diffuse-reflectance/index.html`

Sergio: *"I still question the units of mm^-2 for the reflectance. The fact that when changing the optical properties it
is the axes that change makes it impossible to visualize the impact of an increase in absorption or scattering on the
shape of the lines (how do the slope and curvature change?). It may be better to set the axes and let the curves move on
the set system of coordinates. It is also unclear why the change in frequency only changes the phase of R_FD an not its
amplitude (is it just the CW reflectance? You should definitely report the amplitude and phase, at least, or all DC, AC,
and phase)."*

- [x] **W-5 — Define the reflectance, do not just name its units.** **Done 2026-09-02.** The theory section now defines
      R once, up front: the fraction of the source power (source energy for TD) that escapes the surface per unit area
      at the detector, with the relation to a measurement stated explicitly
      (\(P_{det} = P_{src}|R_{CW,FD}|A_{det}\), \(P_{det}(t) = E_{src}R_{TD}A_{det}\)). No need to settle it with
      Sergio after all: the convention is fixed by the original MATLAB in `github/DOIT-Public/SensitivityCompendium`,
      whose Monte Carlo branch computes `R = TPSF/(E*A*tstep)` — detected weight over source energy, detector area and
      time bin. The three per-section unit parentheticals were deliberately left in place so each section stays
      self-contained.
- [x] **W-6 — Fix the y-axis ranges.** **Declined 2026-09-02 (Giles): the autoscaling stays.** The proposal was to
      pin the y-axes over the whole slider domain, but that domain is far too wide for one frame: μ<sub>a</sub> ∈
      [0, 0.05], μ′<sub>s</sub> ∈ [0.5, 5] mm⁻¹ and f ∈ [50, 500] MHz span **20 decades** of R<sub>CW</sub> and
      |R̃<sub>FD</sub>| and **77 decades** of R<sub>TD</sub> (computed 2026-09-02), so any fixed range flattens every
      ordinary curve. This leaves the middle of Sergio's SF-3 comment — "it is the axes that change" — knowingly
      unanswered for the CW and TD panels. W-7 answers the part he actually asked about (the frequency dependence of
      the amplitude) without touching the axes.
- [x] **W-7 — Make the FD amplitude's frequency dependence visible.** **Done 2026-09-02.** Since W-6 was declined, the
      panel now plots the dimensionless ratio **AC/DC = |R̃<sub>FD</sub>|/R<sub>CW</sub>** instead of |R̃<sub>FD</sub>|
      alone, which isolates the frequency dependence and is immune to what the autoscaled axis does. At the default
      optical properties the ratio sweeps 0.750–0.981 at 50 MHz and 0.018–0.647 at 500 MHz. The panel titles adopt
      Sergio's nomenclature: DC (= R<sub>CW</sub>), AC/DC, and phase.
- [x] **Unwrap the FD phase** *(not from the review)*. **Done 2026-09-02.** `fdPh` used `Math.atan2`, so the phase
      wrapped into (−π, π] and drew two false discontinuities at 500 MHz with the default optical properties. The array
      is now unwrapped before plotting: the curve is monotone in ρ with no step above 0.015 rad at any slider setting
      checked (50, 100, 200 and 500 MHz, plus both μ/f corners).

## Cross-repo

- [ ] **W-8 — Re-sync the bio if the research statement's framing changes.** Jana Kainerstorfer's review of the same
      package says the opening "sells tools rather than what they can achieve" and questions the identity line the site
      bio now carries (added in the 2026-07-23 external-consistency pass, commit `77b5ea2`). If that line or the program
      framing changes in the masters, the bio on `index.html` moves with it. Blocked until Giles decides item 1 in
      `FacultyApps/2026/notes/feedback_2026-08-31.md`.
