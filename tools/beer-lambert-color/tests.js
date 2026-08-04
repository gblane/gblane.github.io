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

    // --- Illuminants ----------------------------------------------------------
    {
        // Wien displacement: a 5000 K blackbody peaks near 2.898e6/5000 = 580 nm.
        const s = blackbodySPD(5000);
        let iMax = 0;
        for (let i = 1; i < CIE_N; i++) if (s[i] > s[iMax]) iMax = i;
        const peak = iMax + CIE_LAM_MIN;
        checkTrue('5000 K blackbody peaks near 580 nm', Math.abs(peak - 580) < 12, peak);

        // CIE A is a 2856 K Planckian; its chromaticity is published.
        const A = ILLUMINANTS.find(i => i.key === 'A').spd({});
        const xyA = xyzToXy(whiteXYZ(A));
        check('illuminant A chromaticity x', xyA[0], 0.44758, 3e-3);
        check('illuminant A chromaticity y', xyA[1], 0.40745, 3e-3);

        // The white LED must actually be white: within ANSI C78.377's +/-0.006
        // duv of the Planckian locus. The original symmetric-phosphor fit sat at
        // +0.021 and read visibly green, so this is a real regression guard.
        {
            const uv = xyz => { const [x, y] = xyzToXy(xyz); const d = -2 * x + 12 * y + 3;
                                return [4 * x / d, 6 * y / d]; };
            const led = uv(whiteXYZ(ILLUMINANTS.find(i => i.key === 'LED').spd({})));
            let duv = Infinity;
            for (let T = 2000; T <= 10000; T += 10) {
                const p = uv(whiteXYZ(blackbodySPD(T)));
                duv = Math.min(duv, Math.hypot(p[0] - led[0], p[1] - led[1]));
            }
            checkTrue('white LED is within ANSI C78.377 duv of the Planckian locus',
                      duv < 0.006, `duv = ${duv.toFixed(4)}`);
        }

        // Scale invariance: the k normalisation must make absolute scale irrelevant.
        const E1 = new Array(CIE_N).fill(1), E1000 = new Array(CIE_N).fill(1000);
        const T = CIE.xbar.map((_, i) => Math.exp(-0.003 * i));
        const c1 = slabColour(E1, T, false), c2 = slabColour(E1000, T, false);
        check('source scale invariance L*', c2.L, c1.L, 1e-9);
        check('source scale invariance a*', c2.a, c1.a, 1e-9);
        check('source scale invariance b*', c2.b, c1.b, 1e-9);
    }

    // --- Beer-Lambert algebra (moved here from Task 4) -------------------------
    // Task 4 asserted this with Math.exp on both sides, which tested Math.exp
    // rather than any project code. transmittance() exists now, so point at it.
    {
        const mua = muaMixture([{ key: 'methyleneBlue', params: { c: 40 } }]);
        const t1 = transmittance(mua, 1), t2 = transmittance(mua, 2);
        for (const i of [40, 200, 320])
            check(`doubling L squares T at ${i + CIE_LAM_MIN} nm`, t2[i], t1[i] * t1[i], 1e-12);
        const zero = transmittance(mua, 0);
        checkTrue('L = 0 gives T = 1 everywhere', zero.every(v => v === 1), 'not all 1');
    }

    // --- Absorber library -----------------------------------------------------
    {
        // Mixture linearity: doubling concentration doubles mua.
        const one = muaMixture([{ key: 'methyleneBlue', params: { c: 10 } }]);
        const two = muaMixture([{ key: 'methyleneBlue', params: { c: 20 } }]);
        check('doubling concentration doubles mua', two[300], 2 * one[300], 1e-12);

        // Additivity: a two-component mixture equals the sum of its parts.
        const a = muaMixture([{ key: 'chlA', params: { c: 5 } }]);
        const b = muaMixture([{ key: 'bCar', params: { c: 5 } }]);
        const ab = muaMixture([{ key: 'chlA', params: { c: 5 } },
                               { key: 'bCar', params: { c: 5 } }]);
        check('mixture is additive', ab[120], a[120] + b[120], 1e-12);

        // Hemoglobin: StO2 must actually move the spectrum in the red.
        const oxy = muaMixture([{ key: 'hb', params: { HbT: 2300, S: 1 } }]);
        const deo = muaMixture([{ key: 'hb', params: { HbT: 2300, S: 0 } }]);
        const i660 = 660 - CIE_LAM_MIN;
        checkTrue('deoxy absorbs more than oxy at 660 nm',
                  deo[i660] > oxy[i660], `${deo[i660]} vs ${oxy[i660]}`);

        // Known-appearance sanity: hue angle must match the substance.
        const hue = key => {
            const mua = muaMixture([{ key, params: { c: 20 } }]);
            const c = slabColour(CIE.D65, transmittance(mua, 1), true);
            let h = Math.atan2(c.b, c.a) * 180 / Math.PI;
            return h < 0 ? h + 360 : h;
        };
        const hCar = hue('bCar'), hChl = hue('chlA'), hMb = hue('methyleneBlue');
        checkTrue('β-carotene reads orange/yellow', hCar > 40 && hCar < 110, hCar);
        checkTrue('chlorophyll a reads green', hChl > 100 && hChl < 190, hChl);
        checkTrue('methylene blue reads blue/cyan', hMb > 190 && hMb < 290, hMb);

        // Thin oxygenated blood must read red.
        const blood = muaMixture([{ key: 'hb', params: { HbT: 2300, S: 0.98 } }]);
        const cb = slabColour(CIE.D65, transmittance(blood, 0.05), true);
        let hb = Math.atan2(cb.b, cb.a) * 180 / Math.PI; if (hb < 0) hb += 360;
        checkTrue('thin oxygenated blood reads red', hb < 60 || hb > 330, hb);
    }

    // --- Shared chromophore module still matches what shipped before ----------
    // Spot values lifted from the arrays that were inline in tissue-absorption
    // before Task 1. The extraction script checked all 601 overlapping points,
    // but that script is deleted — these literals are the surviving regression net.
    {
        const at = nm => nm - GB_CHROM.lamMin;
        check('E_HbO2 at 400 nm',  GB_CHROM.E_HbO2[at(400)],  0.0613022, 1e-5);
        check('E_Hb at 400 nm',    GB_CHROM.E_Hb[at(400)],    0.0514158, 1e-5);
        check('E_water at 400 nm', GB_CHROM.E_water[at(400)], 3.6e-05,   1e-5);
        check('E_lipid at 429 nm', GB_CHROM.E_lipid[at(429)], 0.00828092, 1e-4);
        check('E_lipid at 400 nm is zero', GB_CHROM.E_lipid[at(400)], 0, 1e-12, true);
        checkTrue('chromophore grid spans 380-1000 nm',
                  GB_CHROM.lamMin === 380 && GB_CHROM.E_HbO2.length === 621,
                  `${GB_CHROM.lamMin}, ${GB_CHROM.E_HbO2.length}`);
    }

    // --- Parser ---------------------------------------------------------------
    {
        const ok = t => parseSpectrum(t, 'mua');
        checkTrue('parses comma-separated', ok('400,1\n500,2\n600,3').ok, 'rejected');
        checkTrue('parses tab-separated', ok('400\t1\n500\t2\n600\t3').ok, 'rejected');
        checkTrue('parses whitespace-separated', ok('400 1\n500 2\n600 3').ok, 'rejected');
        checkTrue('skips a header row', ok('lambda,mua\n400,1\n500,2').ok, 'rejected');
        checkTrue('tolerates CRLF and blanks', ok('400,1\r\n\r\n500,2\r\n').ok, 'rejected');
        {
            const r = ok('600,3\n400,1\n500,2');
            checkTrue('sorts non-monotonic input', r.ok, 'rejected');
            // Guards the sort itself, not just that parsing succeeded: without
            // pts.sort() this reads 3 (the first row) instead of 1 (400 nm).
            check('non-monotonic input is actually reordered', r.data[400 - CIE_LAM_MIN], 1, 1e-12);
        }
        checkTrue('rejects a single row', !ok('400,1').ok, 'accepted');
        checkTrue('rejects pure prose', !ok('hello there').ok, 'accepted');
        checkTrue('rejects zero overlap with 380-780',
                  !ok('1000,1\n1200,2').ok, 'accepted');

        // mua holds at the nearest endpoint; a source zero-extends.
        const m = parseSpectrum('500,2\n600,2', 'mua').data;
        check('mua held at endpoint below range', m[0], 2, 1e-12);
        const s = parseSpectrum('500,2\n600,2', 'source').data;
        check('source zero-extended below range', s[0], 0, 1e-12, true);

        // A source must not divide by zero in k.
        checkTrue('rejects an all-zero source', !parseSpectrum('400,0\n700,0', 'source').ok,
                  'accepted');
        checkTrue('rejects a negative source', !parseSpectrum('400,1\n700,-1', 'source').ok,
                  'accepted');

        // Non-zero in the raw rows but zero everywhere on the 380-780 grid. A
        // check against the raw rows would pass this and still divide by zero in k.
        checkTrue('rejects a source that is zero across 380-780',
                  !parseSpectrum('780,0\n795,3', 'source').ok, 'accepted');
        checkTrue('rejects negative mua', !parseSpectrum('500,-1\n600,2', 'mua').ok, 'accepted');
    }
}
