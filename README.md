# gblane.github.io

Personal academic website for Giles Blaney, PhD, hosted at [gbphd.com](https://gbphd.com).

## Overview

A static site built with HTML, CSS (Bootstrap 5), and vanilla JavaScript. No build step or framework required — everything runs directly in the browser.

## Structure

```
index.html              # Main page (bio, publications, tools)
site.css                # Global styles and theme variables
tools/
  tinymc/               # Monte Carlo 3D random walk simulator
  diffuse-reflectance/  # Interactive diffuse reflectance calculator (CW diffusion theory)
```

## Features

- **Bio** — position, education, and links (email, GitHub, LinkedIn, Google Scholar, CV)
- **Publications** — fetched live from the Semantic Scholar API, sorted by citation count and filtered to the h-index selection; results are cached in `localStorage` for 24 hours
- **Tools** — browser-based interactive tools built on physical and numerical models:
  - *tinyMC*: 3D random walk Monte Carlo simulator
  - *Diffuse Reflectance*: WIP

---

Built by Giles Blaney, PhD with assistance from Claude Code and Gemini CLI
