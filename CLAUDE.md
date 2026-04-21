# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal academic website (gblane.github.io) with embedded browser-based interactive tools. No build step, no npm, no framework — static HTML/CSS/JS served directly.

## Local Development

```bash
npx live-server          # auto-reloads on file save (preferred)
python -m http.server 8000  # fallback if npx unavailable
# visit http://localhost:8080 (live-server) or http://localhost:8000
```

## Site Structure

- `index.html` — main page (Bio, Research, Teaching, Tools sections); Bootstrap 5.3.3
- `tools/tinymc/index.html` — 3D random walk Monte Carlo simulator; vanilla JS + Plotly 2.35.2
- `tools/diffuse-reflectance/index.html` — CW diffuse reflectance R(ρ) interactive plot; vanilla JS + Plotly 2.35.2
- `dissertation/` — generated HTML dissertation pages (do not hand-edit; regenerate via `convert_dissertation.py`)
- `convert_dissertation.py` — converts LaTeX source at `/home/giles/TuftsBox_local/Dissertation/` to `dissertation/`

## Navbar Pattern

Every page uses the same Bootstrap fixed-top dark navbar with collapse/hamburger. All pages link back to `../../index.html` (for tools) or `../index.html` (for dissertation). The active link is `#tools` for tool pages and `Dissertation` for dissertation pages. Copy the navbar block from any existing tool page when creating a new one.

## Adding New Tools

1. Create `tools/<name>/index.html` following the tinyMC/diffuse-reflectance pattern: Bootstrap navbar, parameter card on the left (`col-md-4`), Plotly chart on the right (`col-md-8`), all JS inline.
2. Add a card in the `#tools` section of `index.html`.

## Publications (index.html)

Fetches from Semantic Scholar Graph API (author ID `51904482`), sorts client-side by citation count, computes h-index, and shows that many papers. Results are cached in `localStorage` under key `pubs_v1` with a 24h TTL to avoid rate-limiting during development. To force a refresh, run `localStorage.removeItem('pubs_v1')` in the browser console.

## Diffuse Reflectance Tool

Ports `R_FD_forward.m` (omega=0 CW case) and `n2A.m` from `/home/giles/GitHub/DOIT-Toolbox/`. Uses the extrapolated zero-boundary condition (Bigio & Fantini eq. 12.34). Key constants hoisted to module level: `A = n2A(1.4)` (refractive index mismatch, fixed n=1.4) and `INV_4PI`. Inside `computeR()`, `x0sq` and `xImgSq` are hoisted above the per-rho `map()` loop. `mueff` is computed once in `update()` and passed in.

## Dissertation Conversion

`convert_dissertation.py` runs pandoc on each LaTeX chapter in parallel (`ProcessPoolExecutor`), then applies Python post-processing for custom glossary macros (`\gls{}`, `\acrshort{}`, etc.) that pandoc leaves as data attributes. Run from the site root:

```bash
python3 convert_dissertation.py
```

The script reads from `/home/giles/TuftsBox_local/Dissertation/` and writes to `dissertation/`. EPS figures are converted to PNG via Ghostscript (`gs`). The `ACR` dict maps every glossary key to `(short_html, long_text, math_repr)`.

### Dissertation architecture

`CHAPTERS` is the single source of truth for all 22 pages (2 preface, 10 main chapters, 8 appendices, 2 postface). The dissertation sidebar (`sidebar_html()`) and index listing (`make_index()`) are both **derived from `CHAPTERS`** — do not maintain a separate list. To add a chapter, add one entry to `CHAPTERS` and re-run the script. `NAV_LINKS` (module-level constant) is used by both `wrap_template()` and `make_index()` for the main-site navbar links — edit it in one place only.

Post-processing pipeline per chapter: `process_math_spans` → `expand_acr_spans` → `fix_figures` → `fix_citations` → `fix_references`. `fix_figures` rewrites both `<embed src="...eps">` (EPS, multiline-safe) and `<img src="path/to/file.png">` (raster) from LaTeX-relative paths to `figures/{stem}.ext`.
