# gblane.github.io

Personal academic website for Giles Blaney, PhD, hosted at [gbphd.com](https://gbphd.com).

## Overview

A static site built with HTML, CSS (Bootstrap 5), and vanilla JavaScript. No build step or framework required — everything runs directly in the browser.

## Structure

```
index.html              # Main page (bio, research, teaching, tools)
site.css                # Global styles and theme variables
404.html                # Not-found page
_partials/              # Shared HTML/JS includes (single source of truth)
  navbar.html           #   Navbar markup
  footer.html           #   Footer markup
  include.js            #   Loader: replaces <div data-include="..."> on each page,
                        #   sets active nav link, and stamps "Last updated" from the
                        #   GitHub API (cached 1 h in localStorage)
research/
  fdnirs-intro/         # A Brief Introduction to FD-NIRS (text + figures)
  publications/         # Publication list fetched from Semantic Scholar
img/
  research/             # Figures used in the FD-NIRS introduction
tools/
  tinymc/               # 3D random walk Monte Carlo simulator
  diffuse-reflectance/  # Interactive diffuse reflectance R(ρ) (CW diffusion theory)
  sensmaps/             # Interactive 2D sensitivity maps for CW NIRS (SD, SS, DS)
  tissue-absorption/    # Bulk μₐ(λ) from chromophore concentrations
```

## Features

- **Bio** — position, education, links (Email, ORCID, GitHub, Google Scholar, CV)
- **Research** — three cards:
  - *FD-NIRS Introduction*: accessible primer on optically diffuse media, optical properties (μₐ, μ′ₛ), and frequency-domain near-infrared spectroscopy; adapted from the author's dissertation (ProQuest 29162198)
  - *Publications*: fetched live from the Semantic Scholar API; two columns — sorted by citation count (h-index selection) and by date (past 5 years); 24 h `localStorage` cache with a Refresh button
  - *Dissertation*: link to PDF on Google Drive
- **Teaching** — courses designed and taught as instructor of record, with syllabi linked on Google Drive
  - *BME-0010* (Tufts University): Electrical Circuits and Biomedical Applications
  - *HONORS-295* (UMass Boston Honors College): Radiation: Technology, Nature, and Society
- **Tools** — browser-based interactive tools built on physical and numerical models:
  - *tinyMC*: 3D random walk Monte Carlo simulator
  - *Diffuse Reflectance*: real-time R(ρ) for a semi-infinite homogeneous medium, adjustable μₐ and μ′ₛ (CW diffusion theory, extrapolated boundary condition)
  - *Sensitivity Maps*: 2D sensitivity maps S<sub>Y</sub>(**r**) for CW NIRS — single-distance, single-slope, and dual-slope arrangements
  - *Tissue Absorption*: bulk μₐ(λ) computed from hemoglobin (HbO₂, Hb), water, lipid, and melanin concentrations
- **Single-source nav/footer** — every page references `_partials/{navbar,footer}.html` via a tiny loader; updates propagate automatically
- **Last-updated stamp** — fetched from the GitHub API and cached in `localStorage`
- **OG / Twitter Cards + JSON-LD** — link previews and structured data for SERP

## Adding a new tool

A typical tool page consists of:
1. Standard `<head>` block: title, description, OG/Twitter meta, font preconnect/load, Bootstrap, `/site.css`.
2. `<div data-include="navbar"></div>` placeholder.
3. `<div class="tool-header">…</div>` with `section-eyebrow`, `tool-title`, `tool-subtitle`.
4. A two-column row: `param-card` (controls) on the left, `#plot` on the right with an optional `about-card`.
5. Optional `info-section` blocks for theory + implementation, using `info-card`, MathJax, and `code-wrap` + `copy-btn` for code samples.
6. `<div data-include="footer"></div>` and the include script.

All shared classes (`.param-card`, `.btn-run`, `.derived-box`, `.info-card`, `.copy-btn`, etc.) live in `site.css`.

## Local development

```bash
# From the repo root, serve the site so absolute paths (/site.css, /_partials/...) resolve:
python3 -m http.server 8080
# Then open http://localhost:8080/
```

Opening `index.html` directly via `file://` will not work because of absolute paths and the `_partials/` fetch.

---

Built by Giles Blaney, PhD with assistance from Claude Code and Gemini CLI
