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
    const zb    = -2.0 * A * D;
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
    const rspZ  = -z0 + 2.0 * zb;

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
