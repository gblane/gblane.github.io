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
    check('eps 1 M^-1cm^-1 at 1 M -> mua mm^-1', epsToMua(1, 1), Math.LN10 / 10, 1e-12);

    // --- 6. Beer-Lambert algebra ----------------------------------------------
    {
        const mua = [0.1, 0.5, 2.0];
        const t1 = mua.map(m => Math.exp(-m * 1)), t2 = mua.map(m => Math.exp(-m * 2));
        for (let i = 0; i < mua.length; i++)
            check(`doubling L squares T (mua=${mua[i]})`, t2[i], t1[i] * t1[i], 1e-12);
    }
}

// TEMPORARY shim — replaced by the real illuminant registry in Task 6.
// Task 6 deletes these three lines.
function illuminantCases() {
    return [['D65', CIE.D65], ['D50', CIE.D50]];
}
