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
- `dissertation/` — static HTML dissertation pages (do not hand-edit)

## Design System

CSS variables live in `site.css`: `--bg`, `--text`, `--muted`, `--accent` (`#1a5276`), `--border`, `--card-bg`, `--section-alt`. All pages load `site.css` plus Google Fonts (`Playfair Display` for headings, `DM Sans` for body).

## Navbar Pattern

Every page uses a Bootstrap fixed-top **white** navbar (not dark) with collapse/hamburger. All pages link back to `../../index.html` (for tools) or `../index.html` (for dissertation). The active link is `#tools` for tool pages and `Dissertation` for dissertation pages. Copy the navbar block from any existing tool page when creating a new one — it uses the plain `.navbar` class (no `navbar-dark bg-dark`).

## Adding New Tools

1. Create `tools/<name>/index.html` linking `../../site.css`. Use `.tool-header`, `.tool-title`, `.tool-subtitle`, `.param-card`, `.about-card` from `site.css` for consistent layout. Parameter controls on the left (`col-md-4`), Plotly chart on the right (`col-md-8`), all JS inline.
2. Add a card in the `#tools` section of `index.html`.

## Publications (index.html)

Fetches from Semantic Scholar Graph API (author ID `51904482`), sorts client-side by citation count, computes h-index, and shows that many papers. Results are cached in `localStorage` under key `pubs_v1` with a 24h TTL to avoid rate-limiting during development. To force a refresh, run `localStorage.removeItem('pubs_v1')` in the browser console.

## Diffuse Reflectance Tool

Ports `R_FD_forward.m` (omega=0 CW case) and `n2A.m` from `/home/giles/GitHub/DOIT-Toolbox/`. Uses the extrapolated zero-boundary condition (Bigio & Fantini eq. 12.34). Key constants hoisted to module level: `A = n2A(1.4)` (refractive index mismatch, fixed n=1.4) and `INV_4PI`. Inside `computeR()`, `x0sq` and `xImgSq` are hoisted above the per-rho `map()` loop. `mueff` is computed once in `update()` and passed in.

## Dissertation

22 static HTML pages (2 preface, 10 main chapters, 8 appendices, 2 postface) plus `index.html` and `figures/`. Edit pages directly; they are no longer generated from LaTeX source.
