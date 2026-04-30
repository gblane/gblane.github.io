# Design Spec: Phased Website Deployment and Polishing

**Topic:** Deploying and polishing remaining website sections from `dev` branch to `main`.
**Status:** Approved (Brainstorming Complete)
**Date:** 2024-04-29

## 1. Goal
Successfully migrate the remaining sections of the `gblane.github.io` website from the `dev` branch to production (`main`). The deployment will be phased to allow for surgical editing, polishing, and verification of each section.

## 2. Phased Rollout Strategy

### Phase 1: Interactive Tools (Low-Hanging Fruit)
*   **Sections:** `tinyMC`, `Diffuse Reflectance`
*   **Tasks:**
    *   Migrate `tools/` directory content.
    *   **Physics Validation:** Perform independent verification of the underlying physical models (Monte Carlo and Diffusion Theory) to ensure accuracy (e.g., verifying boundary conditions, step size distribution, and reflectance calculation).
    *   Verify Plotly integration and interactive performance.
    *   Polish UI spacing and ensure consistency with `site.css`.
    *   Update `index.html` navigation to include "Tools" link.
    *   **Success Criteria:** Tools are fully functional, responsive, and physically accurate on production.

### Phase 2: Dissertation Foundations
*   **Sections:** `dissertation/intro.html`, `dissertation/app1.html` (Forward Models), `dissertation/app5.html` (Sensitivity Maps).
*   **Architecture:**
    *   **Grouped Dropdown:** Implement a two-level hierarchy in the `Dissertation` navbar link:
        *   **Foundational Concepts:** Intro to FD-NIRS, Forward Models, Sensitivity Maps.
        *   **Research & Results:** Link to full table/landing page.
    *   **Landing Page Redesign:** Group the `dissertation/index.html` into "Foundational Concepts" vs "Research Chapters".
*   **Tasks:**
    *   **Equation Verification:** Support user's manual verification of all LaTeX/MathJax equations.
    *   Update navigation across all site pages (including those in `tools/` and `teaching/`).
    *   Apply grouped layout to dissertation landing page.
    *   Polish typography and MathJax rendering in the foundation chapters.

### Phase 3: Teaching Materials
*   **Sections:** `teaching/bme0010`, `teaching/honors295`
*   **Tasks:**
    *   Migrate teaching directories.
    *   **Critical:** Verify all links to the 50+ PDFs (slides, notes, syllabi).
    *   Ensure consistent "Course Card" styling on the main page.
*   **Success Criteria:** All PDF assets are accessible and the course listing is clean.

### Phase 4: Full Dissertation Migration
*   **Sections:** Remaining 9 chapters and 6 appendices.
*   **Tasks:**
    *   Bulk migration and internal link verification.
    *   Final cross-browser testing for the multi-page structure.

## 3. Technical Standards
*   **Styling:** Maintain Vanilla CSS (site.css) and Bootstrap 5.
*   **Navigation:** Consolidated navbar across all sub-directories.
*   **Responsiveness:** Mobile-first checks for all new interactive elements.
*   **Math:** MathJax for dissertation formulas.

## 4. Implementation Notes
*   Work will be performed sequentially, creating a verification test for each phase before moving to the next.
*   **Scientific Integrity:** Every tool will undergo a "Physics Audit" (comparing outputs against known analytical solutions or literature values where applicable).
*   The `dev` branch serves as the source of truth, but each file will be "polished" (spacing, semantic HTML, link paths) during the move to `main`.
