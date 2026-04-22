# GEMINI.md

## Project Overview
This repository contains the personal academic website and digital dissertation of Giles Blaney, PhD. It is a static site designed for high performance and portability, featuring interactive biomedical optics simulators and a comprehensive LaTeX-to-HTML converted dissertation.

- **Primary Technologies:** HTML5, CSS3 (Bootstrap 5.3.3), JavaScript (Plotly 2.35.2), Python 3.
- **Architecture:** No-framework static site. Interactive tools are self-contained within their respective directories.

## Building and Running

### Local Development
To preview the site locally with live reloading:
```bash
npx live-server
```
Alternatively, use the built-in Python server:
```bash
python3 -m http.server 8000
```

### Recommended Tools (Fedora)
For HTML/Web development on Fedora, the following editors are recommended:
- **Bluefish:** Lightweight and feature-rich for HTML (`sudo dnf install bluefish`).
- **Brackets:** Visual editor with Live Preview (Available via Flatpak).
- **VSCodium:** Open-source VS Code binary without telemetry; excellent with the "Live Server" extension.
- **Geany:** Fast and simple IDE with good HTML support (`sudo dnf install geany`).

## Development Conventions

### Site Structure & Navigation
- **Root `index.html`:** Main landing page containing Bio, Research, Teaching, and Tools sections.
- **Navbar:** Every page uses a standard Bootstrap 5 fixed-top **white** navbar (plain `.navbar` class, not `navbar-dark`).
    - Tools pages link back via `../../index.html`.
    - Dissertation pages link back via `../index.html`.
    - Always copy the navbar block from an existing tool page when creating new content.
    - The active link should be `#tools` for tool pages and `Dissertation` for dissertation pages.
- **Favicon:** All HTML pages should include `<link rel="icon" href="data:,">` in the `<head>` to suppress 404 errors for `favicon.ico`.

### Interactive Tools (`tools/`)
- Located in `tools/<name>/index.html`.
- **Layout:** Use a Bootstrap container with a row split into `col-md-4` (Parameter controls/About) and `col-md-8` (Plotly chart).
- **Styling:** Use `.tool-header`, `.tool-title`, `.tool-subtitle`, `.param-card`, and `.about-card` from `site.css` for consistency.
- **Implementation:** Prefer vanilla JavaScript with inline scripts to keep tools self-contained and easy to debug.

### Dissertation Section (`dissertation/`)
- 22 static HTML pages plus `index.html` and `figures/`. 
- **Editing:** Edit these HTML files directly. They are no longer programmatically generated from LaTeX sources.

### Bio & Education
- **Links:** Use `.bio-link-inline` for award or lab links within the bio subtitle for a subtle, interactive look.
- **Education:** Use an unstyled list (`list-unstyled`) with `<strong>` for degree names and `small.text-muted` for minors. Spell out all degree names (e.g., "Biomedical Engineering").

### Publications
- Publication data is fetched dynamically from the Semantic Scholar Graph API (Author ID: `51904482`).
- Results are cached in `localStorage` (`pubs_v1`) for 24 hours. Clear the cache (`localStorage.removeItem('pubs_v1')`) in the browser console to force a refresh during development.
