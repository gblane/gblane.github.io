# gblane.github.io

Personal academic website for Giles Blaney, PhD, hosted at [gbphd.com](https://gbphd.com).

## Overview

A static site built with HTML, CSS (Bootstrap 5), and vanilla JavaScript. No build step or framework required — everything runs directly in the browser.

## Structure

```
index.html              # Main page (bio, research cards, tool cards)
site.css                # Global styles and theme variables
research/
  fdnirs-intro/         # A Brief Introduction to FD-NIRS (text + figures)
  publications/         # Publication list fetched from Semantic Scholar
img/
  research/             # Figures used in the FD-NIRS introduction
tools/
  tinymc/               # Monte Carlo 3D random walk simulator
  diffuse-reflectance/  # Interactive diffuse reflectance calculator (CW diffusion theory)
```

## Features

- **Bio** — position, education, and links (email, GitHub, LinkedIn, Google Scholar, CV)
- **Research** — two subpages:
  - *FD-NIRS Introduction*: accessible primer on optically diffuse media, optical properties (μa, μ′s), and frequency-domain near-infrared spectroscopy; adapted from the author's dissertation (ProQuest 29162198)
  - *Publications*: fetched live from the Semantic Scholar API; two columns — sorted by citation count (h-index selection) and by date (past 5 years); results cached in `localStorage` for 24 hours
- **Tools** — browser-based interactive tools built on physical and numerical models:
  - *tinyMC*: 3D random walk Monte Carlo simulator
  - *Diffuse Reflectance*: real-time R(ρ) for a semi-infinite homogeneous medium, adjustable μa and μ′s (CW diffusion theory, extrapolated boundary condition)

---

Built by Giles Blaney, PhD with assistance from Claude Code and Gemini CLI
