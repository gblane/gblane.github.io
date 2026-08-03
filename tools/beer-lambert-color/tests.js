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

    // --- 10. Chromaticity geometry -------------------------------------------
    {
        const loc = spectralLocus();
        checkTrue('locus has one point per nm', loc.x.length === CIE_N, loc.x.length);
        checkTrue('every locus point satisfies x + y <= 1',
                  loc.x.every((v, i) => v + loc.y[i] <= 1 + 1e-9), 'a point escaped the triangle');
        checkTrue('every locus point is non-negative',
                  loc.x.every((v, i) => v >= -1e-12 && loc.y[i] >= -1e-12), 'negative chromaticity');
        // 520 nm sits near the top-left of the horseshoe.
        const i520 = 520 - CIE_LAM_MIN;
        checkTrue('locus at 520 nm is in the green corner',
                  loc.x[i520] < 0.15 && loc.y[i520] > 0.75, `${loc.x[i520]},${loc.y[i520]}`);
        // Cross-check the primaries against the sRGB matrix the pipeline
        // actually uses. Asserting SRGB_PRIMARIES.r[0] === 0.64 would be
        // self-referential — that constant IS the literal 0.64. Inverting
        // _XYZ2RGB and reading each primary's chromaticity back out tests
        // that the two independently-written things agree; a typo in either
        // fails it. Verified to agree to 7.2e-9, so 1e-7 is tight but safe.
        const _RGB2XYZ = _inv3(_XYZ2RGB);
        for (const [nm, rgb, want] of [['red', [1, 0, 0], SRGB_PRIMARIES.r],
                                       ['green', [0, 1, 0], SRGB_PRIMARIES.g],
                                       ['blue', [0, 0, 1], SRGB_PRIMARIES.b]]) {
            const v = _mul3(_RGB2XYZ, rgb), xy = xyzToXy({ X: v[0], Y: v[1], Z: v[2] });
            check(`sRGB ${nm} primary x from the matrix`, xy[0], want[0], 1e-7);
            check(`sRGB ${nm} primary y from the matrix`, xy[1], want[1], 1e-7);
        }
        check('D65 white chromaticity x', xyzToXy(D65_WHITE)[0], 0.31272, 1e-3);
        check('D65 white chromaticity y', xyzToXy(D65_WHITE)[1], 0.32903, 1e-3);
    }
}

// TEMPORARY shim — replaced by the real illuminant registry in Task 6.
// Task 6 deletes these three lines.
function illuminantCases() {
    return [['D65', CIE.D65], ['D50', CIE.D50]];
}
