# Diffuse Reflectance Tool Migration and Polish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Diffuse Reflectance tool from the `dev` branch, perform a physics validation of the analytical model, and polish its UI.

**Architecture:** Static HTML/JS tool using Plotly for visualization and Bootstrap for layout.

**Tech Stack:** HTML, CSS (Bootstrap 5.3.3), JavaScript (Plotly 2.35.2).

---

### Task 1: Migration

**Files:**
- Create: `tools/diffuse-reflectance/index.html` (copy from dev)

- [ ] **Step 1: Checkout file from dev branch**

Run: `git checkout dev -- tools/diffuse-reflectance/index.html`

- [ ] **Step 2: Commit initial migration**

Run: `git add tools/diffuse-reflectance/index.html && git commit -m "feat: initial migration of diffuse reflectance tool"`

### Task 2: Physics Validation and Implementation

**Files:**
- Modify: `tools/diffuse-reflectance/index.html`

- [ ] **Step 1: Update Physics Model in `computeR` and `update` functions**

Refactor the JS logic to match the exact requirements:
- `mutr = mua + musp`
- `D = 1 / (3 * mutr)`
- `mueff = sqrt(mua / D)`
- `z0 = 1 / mutr` (or `1 / musp` if following standard P3 approximation, but req implies `1/mutr` via `D` link)
- `A` factor calculation for extrapolated boundary (keep existing `n2A` if accurate, or use standard approximation).
- `zb = 2 * A * D`
- `r1 = sqrt(rho^2 + z0^2)`
- `r2 = sqrt(rho^2 + (z0 + 2*zb)^2)`
- `Reflectance R(rho) = (1/(4*PI)) * ( (z0*(mueff + 1/r1)*exp(-mueff*r1)/r1^2) + ((z0 + 2*zb)*(mueff + 1/r2)*exp(-mueff*r2)/r2^2) )`

- [ ] **Step 2: Verify derived values display**

Ensure `mueff` and `ltr` (which should be `1/mutr`) are correctly calculated and displayed.

### Task 3: UI Polish and Consistency

**Files:**
- Modify: `tools/diffuse-reflectance/index.html`

- [ ] **Step 1: Update Navbar links**

Ensure all navbar links point to `../../index.html` (except Dissertation which is `../../dissertation/index.html`).

- [ ] **Step 2: Use CSS Variables**

Replace hardcoded colors (like `#1a5276`) with `var(--accent)` where appropriate.

- [ ] **Step 3: Update Descriptions**

Verify that the "Adjust mu_a and mu_s in real time" description matches the control behavior.

- [ ] **Step 4: Final CSS adjustments**

Ensure spacing and typography match `site.css` and `GEMINI.md` conventions.

### Task 4: Final Validation and Commit

- [ ] **Step 1: Self-Review**

Open the tool (using `live-server` or `python -m http.server`) and verify the plot updates correctly and the values make sense.

- [ ] **Step 2: Final Commit**

Use EXACT commit message: `feat: migrate and polish diffuse reflectance tool`
