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
- `site.css` — shared stylesheet: CSS variables, fonts (Playfair Display + DM Sans), navbar, `.site-card`, `.section-eyebrow`, `.section-rule`, tool-page base styles
- `tools/tinymc/index.html` — 3D random walk Monte Carlo simulator; vanilla JS + Plotly 2.35.2
- `tools/diffuse-reflectance/index.html` — CW diffuse reflectance R(ρ) interactive plot; vanilla JS + Plotly 2.35.2
- `teaching/bme0010/index.html` — BME-0010 course page; lecture/demo rows with PDF links
- `teaching/honors295/index.html` — HONORS-295 course page; lecture listing and KCI materials
- `dissertation/` — static HTML dissertation pages (do not hand-edit)

## Design System

CSS variables live in `site.css`: `--bg`, `--text`, `--muted`, `--accent` (`#1a5276`), `--border`, `--card-bg`, `--section-alt`. All pages load `site.css` plus Google Fonts (`Playfair Display` for headings, `DM Sans` for body).

## Navbar Pattern

Every page uses a Bootstrap fixed-top **white** navbar (not dark) with collapse/hamburger. Depth-relative links back to `index.html`:
- Tools and teaching pages: `../../index.html`
- Dissertation pages: `../index.html`

Active link per page type: `#teaching` for course pages, `#tools` for tool pages, `Dissertation` for dissertation pages. Copy the navbar block from any existing page — use plain `.navbar` class (no `navbar-dark bg-dark`).

## Adding New Teaching Pages

1. Create `teaching/<name>/index.html` linking `../../site.css`. Use the `.course-hero` / `.material-section` / `.mat-row` pattern from an existing course page.
2. Material rows use `.mat-date` (date or identifier), `.mat-label` (topic), `.mat-links` with `.mat-link` buttons for PDF links.
3. Add a clickable card in the `#teaching` section of `index.html` wrapped in `<a class="tool-link">` so the `.site-card` hover style applies.
4. Commit PDFs under `teaching/<name>/pdfs/`. GitHub hard limit is 100 MB per file; warn at 50 MB. Large lecture slides may need external hosting.

## Adding New Tools

1. Create `tools/<name>/index.html` linking `../../site.css`. Use `.tool-header`, `.tool-title`, `.tool-subtitle`, `.param-card`, `.about-card` from `site.css` for consistent layout. Parameter controls on the left (`col-md-4`), Plotly chart on the right (`col-md-8`), all JS inline.
2. Add a card in the `#tools` section of `index.html`.

## Publications (index.html)

Fetches from Semantic Scholar Graph API (author ID `51904482`), sorts client-side by citation count, computes h-index, and shows that many papers. Results are cached in `localStorage` under key `pubs_v1` with a 24h TTL to avoid rate-limiting during development. To force a refresh, run `localStorage.removeItem('pubs_v1')` in the browser console.

## Diffuse Reflectance Tool

Ports `R_FD_forward.m` (omega=0 CW case) and `n2A.m` from `/home/giles/GitHub/DOIT-Toolbox/`. Uses the extrapolated zero-boundary condition (Bigio & Fantini eq. 12.34). Key constants hoisted to module level: `A = n2A(1.4)` (refractive index mismatch, fixed n=1.4) and `INV_4PI`. Inside `computeR()`, `x0sq` and `xImgSq` are hoisted above the per-rho `map()` loop. `mueff` is computed once in `update()` and passed in.

## Branch Strategy

- `testing` — full site: Bio, Research, Teaching, Tools, Dissertation
- `main` — stripped for deployment: Bio, Research, Teaching only (no Tools, no Dissertation nav link)

When syncing design changes to `main`, use `git checkout main -- site.css` to pull shared files across branches.

## Dissertation

22 static HTML pages (2 preface, 10 main chapters, 8 appendices, 2 postface) plus `index.html` and `figures/`. Edit pages directly; they are no longer generated from LaTeX source.
