// DOM-free assertions shared by test.html (browser) and run-tests.cjs (node).
// Depends on globals from colorimetry.js and spectra.js.
function registerTests(check, checkTrue) {

    const ones = () => new Array(CIE_N).fill(1);

    // --- 1. Clear slab, adapted, under every illuminant -> exact white ----------
    // The invariant the entire two-swatch design rests on.
    for (const [name, S] of illuminantCases()) {
        const c = slabColour(S, null, true);
        check(`clear slab adapted / ${name} / L*`, c.L, 100, 1e-9);
        check(`clear slab adapted / ${name} / a*`, c.a, 0, 1e-6, /*absolute*/ true);
        check(`clear slab adapted / ${name} / b*`, c.b, 0, 1e-6, true);
        checkTrue(`clear slab adapted / ${name} / hex is white`, c.hex === '#ffffff', c.hex);
    }

    // --- 2. Source = D65 -> adapted and as-lit agree ---------------------------
    {
        const T = CIE.xbar.map((_, i) => Math.exp(-0.002 * i));   // arbitrary slab
        const a = slabColour(CIE.D65, T, true), b = slabColour(CIE.D65, T, false);
        check('D65: adapted L* == as-lit L*', a.L, b.L, 1e-9);
        check('D65: adapted a* == as-lit a*', a.a, b.a, 1e-9);
        check('D65: adapted b* == as-lit b*', a.b, b.b, 1e-9);
    }

    // --- 3. Equal-energy illuminant -> chromaticity 1/3, 1/3 -------------------
    {
        const w = whiteXYZ(ones()), s = w.X + w.Y + w.Z;
        check('illuminant E chromaticity x', w.X / s, 1 / 3, 2e-3);
        check('illuminant E chromaticity y', w.Y / s, 1 / 3, 2e-3);
    }

    // --- 4. D65 -> sRGB white --------------------------------------------------
    checkTrue('D65 white renders #ffffff', xyzToSrgb(D65_WHITE).hex === '#ffffff',
              xyzToSrgb(D65_WHITE).hex);

    // --- 5. Unit conversion: the 2.303 trap -----------------------------------
    // Non-unit arguments against a hard literal: unit args cannot distinguish
    // multiplying by concentration from dividing by it, and comparing against
    // Math.LN10/10 would just restate the implementation's own constant.
    check('eps 2 M^-1cm^-1 at 3 M -> mua mm^-1', epsToMua(2, 3), 1.3815510557964276, 1e-12);

    // --- 6. Gamut flag ---------------------------------------------------------
    // The clear slab is the reference swatch; it must NOT report out of gamut.
    checkTrue('clear slab is in gamut', !slabColour(CIE.D65, null, true).clipped, 'clipped');
    {
        // A monochromatic 520 nm slab is genuinely outside sRGB and must say so.
        const T = new Array(CIE_N).fill(0); T[520 - CIE_LAM_MIN] = 1;
        checkTrue('a spectral colour reports out of gamut',
                  slabColour(CIE.D65, T, true).clipped, 'not clipped');
    }

    // --- 7. Bradford with a non-degenerate adaptation --------------------------
    // Every other test collapses to src === dst, exercising only the identity
    // path. This one drives a real D50 -> D65 transform.
    {
        const d50 = whiteXYZ(CIE.D50);
        const got = bradford(d50, d50, D65_WHITE);
        check('D50 white adapts onto D65 white / X', got.X, D65_WHITE.X, 1e-9);
        check('D50 white adapts onto D65 white / Y', got.Y, D65_WHITE.Y, 1e-9);
        check('D50 white adapts onto D65 white / Z', got.Z, D65_WHITE.Z, 1e-9);
    }
}

// TEMPORARY shim — replaced by the real illuminant registry in Task 6.
// Task 6 deletes these three lines.
function illuminantCases() {
    return [['D65', CIE.D65], ['D50', CIE.D50]];
}
