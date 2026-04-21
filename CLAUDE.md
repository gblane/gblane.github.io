# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal academic website (gblane.github.io) with embedded browser-based interactive tools. No build step, no npm, no framework — static HTML/CSS/JS served directly.

## Local Development

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Site Structure

- `index.html` — main personal site (Bio, Research, Teaching, Tools sections); Bootstrap 5.3.3; links to tools via `tools/<name>/index.html`
- `tools/tinymc/index.html` — tinyMC tool; vanilla JS + Plotly 2.35.2; all logic inline

## tinyMC Architecture (`tools/tinymc/`)

All simulation and rendering logic lives inline in `tools/tinymc/index.html`:

- `runMC(n)` — pure JS function; samples step directions uniformly on the unit sphere using `arccos(1 - 2r)` / `2πr`, accumulates X/Y path
- `plot(x, y)` — calls `Plotly.react("plot", ...)` to render into `#plot` div
- Button click handler reads `#number-input`, calls `runMC`, then `plot`; uses `setTimeout(..., 0)` to allow the status text to paint before the synchronous simulation runs

## Adding New Tools

Follow the tinyMC pattern: create `tools/<name>/index.html` with a Bootstrap navbar linking back to `../../index.html`, then add a card in the `#tools` section of `index.html`.
