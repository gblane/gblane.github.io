// sensmaps.js — CW sensitivity physics for diffuse optical spectroscopy.
// Port of sensmaps Python package (physics.py, compute.py), CW functions only.
// Variable names mirror the Python/MATLAB source.

function n2A(n) {
    if (n > 1) {
        return 504.332889  - 2641.00214  * n
             + 5923.699064 * n**2
             - 7376.355814 * n**3
             + 5507.53041  * n**4
             - 2463.357945 * n**5
             + 610.956547  * n**6
             - 64.8047      * n**7;
    }
    if (n < 1) {
        return 3.084635 - 6.531194 * n
             + 8.357854 * n**2
             - 5.082751 * n**3
             + 1.171382 * n**4;
    }
    return 1.0;
}

// Port of continuous_reflectance() — complex_reflectance at omega=0.
// rs=[x,y,z] source (after z-offset applied), rd=[x,y,z] detector.
// op={nIn,nOut,musp,mua}. Returns R (mm⁻²).
function continuousReflectance(rs, rd, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;        // image source z-coordinate

    const dx = rd[0] - rs[0];
    const dy = rd[1] - rs[1];
    const r1 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rs[2])**2);
    const r2 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rspZ)**2);

    return (
          z0         * (1.0/r1 + mueff) * Math.exp(-mueff * r1) / (r1*r1)
        + (z0 - 2.0*zb) * (1.0/r2 + mueff) * Math.exp(-mueff * r2) / (r2*r2)
    ) / (4.0 * Math.PI);
}

// Internal: CW fluence at voxel r from source rs. Port of complex_fluence at omega=0.
// rs=[x,y,z], r=[x,y,z] (single voxel). Returns phi (mm⁻²).
function _continuousFluence(rs, r, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;          // zb < 0: extrapolated boundary below surface
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;

    const r1 = Math.sqrt((r[0]-rs[0])**2 + (r[1]-rs[1])**2 + (r[2]-rs[2])**2);
    const r2 = Math.sqrt((r[0]-rs[0])**2 + (r[1]-rs[1])**2 + (r[2]-rspZ)**2);

    return (Math.exp(-mueff * r1) / r1 - Math.exp(-mueff * r2) / r2)
         / (4.0 * Math.PI * D);
}

// Port of continuous_tot_path_len() — complex_tot_path_len at omega=0.
// Returns {L (mm), R (mm⁻²)}.
function continuousTotPathLen(rs, rd, op) {
    const A     = n2A(op.nIn / op.nOut);
    const D     = 1.0 / (3.0 * op.musp);
    const zb    = -2.0 * A * D;
    const mueff = Math.sqrt(op.mua / D);
    const z0    = rs[2];
    const rspZ  = -z0 + 2.0 * zb;        // zb < 0: extrapolated boundary below surface

    const dx = rd[0] - rs[0];
    const dy = rd[1] - rs[1];
    const r1 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rs[2])**2);
    const r2 = Math.sqrt(dx*dx + dy*dy + (rd[2] - rspZ)**2);

    const R = continuousReflectance(rs, rd, op);
    const L = (
          (z0 / r1)         * Math.exp(-mueff * r1)
        + ((z0 - 2.0*zb) / r2) * Math.exp(-mueff * r2)
    ) / (8.0 * Math.PI * D * R);

    return { L, R };
}

// Port of continuous_part_path_len() — complex_part_path_len at omega=0.
// rs=[x,y,z], r_all=[[x,y,z],...] N voxel centers, rd=[x,y,z], V voxel volume.
// Returns Float64Array length N of partial path lengths (mm).
function continuousPartPathLen(rs, r_all, rd, V, op) {
    const N      = r_all.length;
    const ℓ     = new Float64Array(N);
    const R_rs_rd = continuousReflectance(rs, rd, op);
    for (let i = 0; i < N; i++) {
        const phi   = _continuousFluence(rs, r_all[i], op);
        const R_r_rd = continuousReflectance(r_all[i], rd, op);
        ℓ[i] = (phi * R_r_rd * V) / R_rs_rd;
    }
    return ℓ;
}

// Top-level dispatcher. Port of makeS.m / compute.py make_s_full (CW only).
// typeStr: 'CW_SD_I' | 'CW_SS_I' | 'CW_DS_I'
// optodes: {sx,dx} | {sx,d1x,d2x} | {s1x,s2x,d1x,d2x}
// op: {nIn,nOut,musp,mua}
// Returns {Svox:Float64Array, x:Float64Array, z:Float64Array, Nx, Nz}
function makeSvox(typeStr, optodes, op) {
    const arr   = typeStr.split('_')[1];   // 'SD' | 'SS' | 'DS'
    const V     = 1.0;                     // 1 mm³ voxel, hardcoded
    const z_off = 1.0 / op.musp;          // source z-offset = 1/musp

    // Build per-measurement source/detector pairs and list of all optode x coords.
    let sources = [], detectors = [], allX = [];

    if (arr === 'SD') {
        sources   = [[optodes.sx,  0, z_off]];
        detectors = [[optodes.dx,  0, 0]];
        allX = [optodes.sx, optodes.dx];

    } else if (arr === 'SS') {
        // 1 source, 2 detectors → 2 measurements
        sources   = [[optodes.sx, 0, z_off], [optodes.sx, 0, z_off]];
        detectors = [[optodes.d1x, 0, 0],    [optodes.d2x, 0, 0]];
        allX = [optodes.sx, optodes.d1x, optodes.d2x];

    } else if (arr === 'DS') {
        // Mirrors Python _expand_optodes: rSrcs=[S1,S1,S2,S2], rDets=[D1,D2,D2,D1]
        sources = [
            [optodes.s1x, 0, z_off], [optodes.s1x, 0, z_off],
            [optodes.s2x, 0, z_off], [optodes.s2x, 0, z_off],
        ];
        detectors = [
            [optodes.d1x, 0, 0], [optodes.d2x, 0, 0],
            [optodes.d2x, 0, 0], [optodes.d1x, 0, 0],
        ];
        allX = [optodes.s1x, optodes.s2x, optodes.d1x, optodes.d2x];
    }

    // Grid extents
    const xMin = Math.min(...allX) - 10;
    const xMax = Math.max(...allX) + 10;

    // maxRho: max horizontal source-detector distance across all measurement pairs
    let maxRho = 0;
    for (let m = 0; m < sources.length; m++) {
        maxRho = Math.max(maxRho, Math.abs(sources[m][0] - detectors[m][0]));
    }
    const zMax = Math.round(maxRho);

    // Axis arrays (step 1 mm)
    const xArr = [], zArr = [];
    for (let x = xMin; x <= xMax + 0.5; x++) xArr.push(x);
    for (let z = 0;    z <= zMax  + 0.5; z++) zArr.push(z);
    const Nx = xArr.length, Nz = zArr.length;

    // Voxel center list, row-major ix-outer iz-inner
    const r_all = [];
    for (let ix = 0; ix < Nx; ix++)
        for (let iz = 0; iz < Nz; iz++)
            r_all.push([xArr[ix], 0, zArr[iz]]);

    // Per-measurement L and ℓ vectors
    const nMeas = sources.length;
    const Ls  = new Float64Array(nMeas);
    const ℓs = [];
    for (let m = 0; m < nMeas; m++) {
        Ls[m] = continuousTotPathLen(sources[m], detectors[m], op).L;
        ℓs.push(continuousPartPathLen(sources[m], r_all, detectors[m], V, op));
    }

    // Arrangement combinator (Y=1 for all I-type measurements)
    const Svox = new Float64Array(Nx * Nz);

    if (arr === 'SD') {
        const L = Ls[0], ℓ = ℓs[0];
        for (let i = 0; i < Nx * Nz; i++) Svox[i] = ℓ[i] / L;

    } else if (arr === 'SS') {
        const dL = Ls[1] - Ls[0];
        for (let i = 0; i < Nx * Nz; i++)
            Svox[i] = (ℓs[1][i] - ℓs[0][i]) / dL;

    } else if (arr === 'DS') {
        // den = (L[1]-L[0]) + (L[3]-L[2]), num = (ℓ[1]-ℓ[0]) + (ℓ[3]-ℓ[2])
        const den = (Ls[1] - Ls[0]) + (Ls[3] - Ls[2]);
        for (let i = 0; i < Nx * Nz; i++) {
            const num = (ℓs[1][i] - ℓs[0][i]) + (ℓs[3][i] - ℓs[2][i]);
            Svox[i] = num / den;
        }
    }

    // Replace NaN/Inf (e.g. voxels coinciding with a source point)
    for (let i = 0; i < Svox.length; i++)
        if (!isFinite(Svox[i])) Svox[i] = 0.0;

    return { Svox, x: new Float64Array(xArr), z: new Float64Array(zArr), Nx, Nz };
}
