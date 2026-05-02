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
