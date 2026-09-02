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
