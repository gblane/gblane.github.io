# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tinyMC** — a Monte Carlo simulation visualizer running entirely in the browser via [PyScript](https://pyscript.net/). No build step, no npm, no framework. Python code runs client-side using WebAssembly.

## Local Development

```bash
python -m http.server 8000
# visit http://localhost:8000
```

No build, lint, or test commands exist.

## Architecture

- `index.html` — single page; loads PyScript from CDN, defines `#input`, `#output`, `#plot` divs, and embeds `main.py` via `<script type="py">`
- `main.py` — all application logic; uses PyScript's `@when` decorator to bind the button click event, then runs the simulation and renders via `display(fig, target="plot")`
- `pyscript.json` — declares Python package dependencies (`numpy`, `matplotlib`) fetched at runtime

## Key Patterns

- **Event binding**: `@when("click", selector="#calculate-button")` links DOM events to Python functions
- **DOM access**: `document.getElementById()` imported from `pyscript`
- **Plot output**: `display(fig, target="plot")` renders matplotlib figures into the `#plot` div
- **Terminal**: The `terminal` attribute on the `<script type="py">` tag exposes a Python console in the page; `print()` goes there — the page instructs users to wait for "ready" before clicking Calculate

## Notes

- 3D plot code is commented out in `main.py` (was using `projection='3d'`); the simulation computes x/y/z but currently only plots x/y
- PyScript version is pinned to `2025.2.1` in both the CDN URLs and implicitly in `pyscript.json`
