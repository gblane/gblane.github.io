#!/usr/bin/env python3
"""
Convert dissertation LaTeX chapters to HTML for gblane.github.io.
Run from the site root: python3 convert_dissertation.py
"""

import re, subprocess, shutil
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

DISS = Path('/home/giles/TuftsBox_local/Dissertation')
SITE = Path('/home/giles/GitHub/gblane.github.io')
OUT  = SITE / 'dissertation'
FIGS = OUT / 'figures'

# ---------------------------------------------------------------------------
# Chapters: (source .tex relative to DISS, output filename, display title, part label)
# ---------------------------------------------------------------------------
CHAPTERS = [
    # Preface
    ('frontmatter/GilesBlaney_disser_organization.tex',
     'organization.html',
     'Organization of this Work',
     'Preface'),
    ('frontmatter/GilesBlaney_disser_FDNIRSintro.tex',
     'intro.html',
     'A Brief Introduction to Frequency-Domain Near-Infrared Spectroscopy',
     'Preface'),
    # Part I
    ('part1_deepMeas/GilesBlaney_disser_deepMeasMotiv.tex',
     'ch1.html',
     'Motivation for Seeking Deep Measurements',
     'Part I · Preferentially Deep Measurements'),
    ('part1_deepMeas/GilesBlaney_disser_shortLong.tex',
     'ch2.html',
     'Short versus Long Source-Detector Distances',
     'Part I · Preferentially Deep Measurements'),
    ('part1_deepMeas/GilesBlaney_disser_dualSlope.tex',
     'ch3.html',
     'Introduction to Dual-Slope',
     'Part I · Preferentially Deep Measurements'),
    ('part1_deepMeas/GilesBlaney_disser_dualSlopePoint.tex',
     'ch4.html',
     'Point Measurements with Dual-Slope',
     'Part I · Preferentially Deep Measurements'),
    ('part1_deepMeas/GilesBlaney_disser_dualSlopeImaging.tex',
     'ch5.html',
     'Dual-Slope Imaging',
     'Part I · Preferentially Deep Measurements'),
    # Part II
    ('part2_cerebHemo/GilesBlaney_disser_introWavCHS.tex',
     'ch6.html',
     'Introduction to Wavelet Coherent Hemodynamics Spectroscopy',
     'Part II · Cerebral Hemodynamics'),
    ('part2_cerebHemo/GilesBlaney_disser_signCoh.tex',
     'ch7.html',
     'Test for Significant Coherence',
     'Part II · Cerebral Hemodynamics'),
    ('part2_cerebHemo/GilesBlaney_disser_invivoHemo.tex',
     'ch8.html',
     'In-Vivo Cerebral Hemodynamics',
     'Part II · Cerebral Hemodynamics'),
    # Part III
    ('part3_DSspect/GilesBlaney_disser_DSbDRS.tex',
     'ch9.html',
     'Dual-Slope Based Absolute Broadband-Spectroscopy',
     'Part III · Calibration-Free Spectroscopy'),
    ('part3_DSspect/GilesBlaney_disser_absTissueSpect.tex',
     'ch10.html',
     'Absolute Absorption Spectroscopy of Tissue',
     'Part III · Calibration-Free Spectroscopy'),
    # Appendices
    ('appendix/GilesBlaney_disser_forwardModels.tex',
     'app1.html',
     'Forward Models',
     'Appendices'),
    ('appendix/GilesBlaney_disser_absOptPropMeas.tex',
     'app2.html',
     'Measurement of Absolute Optical Properties',
     'Appendices'),
    ('appendix/GilesBlaney_disser_dmuaMeas.tex',
     'app3.html',
     'Measuring Changes in the Absorption Coefficient',
     'Appendices'),
    ('appendix/GilesBlaney_disser_recChrom.tex',
     'app4.html',
     'Recovery of Chromophore Concentrations',
     'Appendices'),
    ('appendix/GilesBlaney_disser_senMaps.tex',
     'app5.html',
     'Generation of Sensitivity Maps',
     'Appendices'),
    ('appendix/GilesBlaney_disser_simSigs.tex',
     'app6.html',
     'Simulation of Apparent Measurements',
     'Appendices'),
    ('appendix/GilesBlaney_disser_phasors.tex',
     'app7.html',
     'Phasor Analysis',
     'Appendices'),
    ('appendix/GilesBlaney_disser_detCoh.tex',
     'app8.html',
     'Determination of Coherence',
     'Appendices'),
    # Postface
    ('backmatter/GilesBlaney_disser_currentFuture.tex',
     'postface.html',
     'Current and Future Work',
     'Postface'),
    ('backmatter/GilesBlaney_disser_ack.tex',
     'ack.html',
     'Acknowledgments',
     'Postface'),
]

# ---------------------------------------------------------------------------
# Acronyms: key -> (short_html, long_text, math_repr_or_None)
# short_html  : what shows in text for \acrshort
# long_text   : what shows for \acrlong
# math_repr   : LaTeX to substitute inside math spans (None -> use \text{short})
# ---------------------------------------------------------------------------
ACR = {
    # Regular acronyms (no math repr)
    'DOIT':  ('DOIT',  'Diffuse Optical Imaging of Tissue',                    None),
    'NIRS':  ('NIRS',  'Near-InfraRed Spectroscopy',                           None),
    'fNIRS': ('fNIRS', 'functional Near-InfraRed Spectroscopy',                None),
    'bDRS':  ('bDRS',  'broadband Diffuse Reflectance Spectroscopy',           None),
    'DOI':   ('DOI',   'Diffuse Optical Imaging',                              None),
    'CHS':   ('CHS',   'Coherent Hemodynamics Spectroscopy',                   None),
    'TFA':   ('TFA',   'Transfer-Function Analysis',                           None),
    'CWT':   ('CWT',   'Continuous Wavelet Transform',                         None),
    'SVD':   ('SVD',   'Singular Value Decomposition',                         None),
    'ICA':   ('ICA',   'Independent Component Analysis',                       None),
    'FWHM':  ('FWHM',  'Full-Width Half-Max',                                  None),
    'GRN':   ('GRN',   'Gaussian Random Number',                               None),
    'IQR':   ('IQR',   'Inter-Quartile Range',                                 None),
    'SEM':   ('SEM',   'Standard-Error of the Mean',                           None),
    'fMRI':  ('fMRI',  'functional Magnetic Resonance Imaging',                None),
    'VO':    ('VO',    'Venous Occlusion',                                     None),
    'BF':    ('BF',    'Blood-Flow',                                           None),
    'BV':    ('BV',    'Blood-Volume',                                         None),
    'AR':    ('AR',    'Auto-Regulation',                                      None),
    'IRB':   ('IRB',   'Institutional Review Board',                           None),
    'NIH':   ('NIH',   'National Institutes of Health',                        None),
    'CPU':   ('CPU',   'Central Processing Unit',                              None),
    'CNC':   ('CNC',   'Computer Numerical Control',                           None),
    'RAM':   ('RAM',   'Random Access Memory',                                 None),
    'TTL':   ('TTL',   'Transistor-Transistor Logic',                          None),
    'USB':   ('USB',   'Universal Serial Bus',                                 None),
    'PMT':   ('PMT',   'PhotoMultiplier Tube',                                 None),
    'APD':   ('APD',   'Avalanche Photo-Diode',                                None),
    'FFF':   ('FFF',   'Fused Filament Fabrication',                           None),
    'PDMS':  ('PDMS',  'PolyDiMethylSiloxane',                                 None),
    'UHMW':  ('UHMW',  'Ultra High Molecular Weight polyethylene',             None),
    'PLA':   ('PLA',   'PolyLactic Acid',                                      None),
    'SMA':   ('SMA',   'SubMiniature version A',                               None),
    'OD':    ('OD',    'Outer Diameter',                                       None),
    '2D':    ('2D',    '2-dimensional',                                        None),
    '3D':    ('3D',    '3-dimensional',                                        None),
    '6D':    ('6D',    '6-dimensional',                                        None),
    'MPi':   ('MP',    'Moore-Penrose inverse',                                None),
    'CW':    ('CW',    'Continuous-Wave',                                      None),
    'FD':    ('FD',    'Frequency-Domain',                                     None),
    'TD':    ('TD',    'Time-Domain',                                          None),
    'SD':    ('SD',    'Single-Distance',                                      None),
    'MD':    ('MD',    'Multi-Distance',                                       None),
    'SS':    ('SS',    'Single-Slope',                                         None),
    'DS':    ('DS',    'Dual-Slope',                                           None),
    'SC':    ('SC',    'Self-Calibrating',                                     None),
    'SNR':   ('SNR',   'Signal-to-Noise Ratio',                                None),
    'CNR':   ('CNR',   'Contrast-to-Noise Ratio',                              None),
    'DPF':   ('DPF',   'Differential Path-length Factor',                      None),
    'DSF':   ('DSF',   'Differential Slope Factor',                            None),
    'O':     ('O',     'Oxy-hemoglobin',                                       None),
    'D':     ('D',     'Deoxy-hemoglobin',                                     None),
    'T':     ('T',     'Total-hemoglobin',                                     None),
    'S':     ('S',     'tissue oxygen Saturation',                             None),
    'W':     ('W',     'Water',                                                None),
    'L':     ('L',     'Lipid',                                                None),
    'CCO':   ('CCO',   'Cytochrome-C-Oxidase',                                 None),
    'ABP':   ('ABP',   'Arterial Blood Pressure',                              None),
    'MATLAB':('MATLAB','MathWorks MATrix LABoratory',                          None),
    'ISSv2': ('Imagent','ISS Imagent V2',                                      None),
    'HAL':   ('HAL',   'Avantes AvaLight-HAL-S-Mini',                          None),
    'HERO':  ('HERO',  'Avantes AvaSpec-HERO',                                 None),
    'PhD':   ('Ph.D.', 'Doctor of Philosophy',                                 None),
    'Prof':  ('Prof.', 'Professor',                                            None),
    # Symbols: (html_short, description, math_repr)
    'r':        ('r⃗',                   'position vector',                           r'\vec{r}'),
    'R2':       ('R²',                   'coefficient of determination',              r'R^2'),
    'Rbar2':    ('R̄²',                  'adjusted coefficient of determination',     r'\bar{R}^2'),
    'I':        ('<em>I</em>',           'Intensity',                                 r'I'),
    'R':        ('<em>R</em>',           'Reflectance',                               r'R'),
    'RCom':     ('R̃',                   'complex Reflectance',                       r'\widetilde{R}'),
    'PHI':      ('Φ',                    'fluence rate',                              r'\Phi'),
    'PHIcom':   ('Φ̃',                   'complex fluence rate',                      r'\widetilde{\Phi}'),
    'Y':        ('𝒴',                   'optical data',                              r'\mathcal{Y}'),
    'A':        ('𝒜',                   'additive optical artifact',                 r'\mathcal{A}'),
    'lnr2I':    ('ln(ρ²<em>I</em>)',    'linearized Intensity',                      r'\ln\!\left(\rho^2 I\right)'),
    'phi':      ('φ',                    'phase',                                     r'\phi'),
    'mTOF':     ('⟨<em>t</em>⟩',        'mean time-of-flight',                       r'\langle t \rangle'),
    'rho':      ('ρ',                    'source-detector distance',                  r'\rho'),
    'lam':      ('λ',                    'optical wavelength',                        r'\lambda'),
    'fmod':     ('<em>f</em><sub>mod</sub>', 'modulation frequency',                 r'f_{\mathrm{mod}}'),
    'omega':    ('ω',                    'angular modulation frequency',              r'\omega'),
    'mua':      ('μ<sub>a</sub>',        'absorption coefficient',                    r'\mu_a'),
    'muaVec':   ('μ⃗<sub>a</sub>',       'vector of absorption coefficients',         r'\vec{\mu}_a'),
    'mus':      ('μ<sub>s</sub>',        'scattering coefficient',                    r'\mu_s'),
    'musp':     ('μ′<sub>s</sub>',       'reduced scattering coefficient',            r"\mu_s'"),
    'mut':      ('μ<sub>t</sub>',        'total attenuation coefficient',             r'\mu_t'),
    'mutp':     ('μ′<sub>t</sub>',       'total reduced attenuation coefficient',     r"\mu_t'"),
    'mueff':    ('μ<sub>eff</sub>',      'effective attenuation coefficient',         r'\mu_\mathrm{eff}'),
    'mueffCom': ('μ̃<sub>eff</sub>',     'complex effective attenuation coefficient', r'\widetilde{\mu}_\mathrm{eff}'),
    'ext':      ('ε',                    'extinction coefficient',                    r'\varepsilon'),
    'EXT':      ('<strong>E</strong>',   'matrix of extinction coefficients',         r'\mathbf{E}'),
    'a':        ('<em>a</em>',           'single scattering albedo',                  r'a'),
    'b':        ('<em>b</em>',           'reduced scattering power coefficient',      r'b'),
    'c':        ('<em>c</em>',           'speed of light in vacuum',                  r'c'),
    'n':        ('<em>n</em>',           'index of refraction',                       r'n'),
    'Lpath':    ('⟨<em>L</em>⟩',        'total optical path-length',                 r'\langle L \rangle'),
    'LpathCom': ('⟨L̃⟩',               'complex total optical path-length',         r'\langle \widetilde{L} \rangle'),
    'lpath':    ('⟨ℓ⟩',                 'partial optical path-length',               r'\langle \ell \rangle'),
    'lpathCom': ('⟨ℓ̃⟩',               'complex partial optical path-length',       r'\langle \widetilde{\ell} \rangle'),
    'sen':      ('𝒮',                   'sensitivity to absorption change',          r'\mathcal{S}'),
    'senMat':   ('<strong>𝒮</strong>',  'matrix of sensitivity',                     r'\mathbf{S}'),
    'SpSMat':   ('<strong>𝒮⁺𝒮</strong>','inverse sensitivity matrix product',       r'\mathbf{S}^+\mathbf{S}'),
    'Recon':    ('ℛ⃗',                   'reconstruction vector',                     r'\vec{\mathcal{R}}'),
    'Cross':    ('𝒞⃗',                   'cross-talk vector',                         r'\vec{\mathcal{C}}'),
    'Res':      ('<strong>Γ</strong>',   'resolution matrix',                         r'\mathbf{\Gamma}'),
    'Loc':      ('<strong>Δ</strong>',   'localization matrix',                       r'\mathbf{\Delta}'),
    'kappa':    ('κ',                    'condition number',                           r'\kappa'),
    'dmua':     ('Δμ<sub>a</sub>',       'absorption coefficient change',             r'\Delta\mu_a'),
    'dmuaVec':  ('Δμ⃗<sub>a</sub>',      'vector of absorption coefficient changes',  r'\Delta\vec{\mu}_a'),
    'dO':       ('ΔO',                   'Oxy-hemoglobin concentration change',        r'\Delta O'),
    'dD':       ('ΔD',                   'Deoxy-hemoglobin concentration change',      r'\Delta D'),
    'dT':       ('ΔT',                   'Total-hemoglobin concentration change',      r'\Delta T'),
    'dEth':     ('Δ(O−D)',               'Oxy minus Deoxy change',                     r'\Delta(\mathit{O}-\mathit{D})'),
    'dABP':     ('ΔA',                   'Arterial blood pressure change',             r'\Delta A'),
    'Oph':      ('Õ',                    'Oxy-hemoglobin phasor',                      r'\widetilde{O}'),
    'Dph':      ('D̃',                   'Deoxy-hemoglobin phasor',                    r'\widetilde{D}'),
    'Tph':      ('T̃',                   'Total-hemoglobin phasor',                    r'\widetilde{T}'),
    'ABPph':    ('Ã',                    'Arterial blood pressure phasor',             r'\widetilde{A}'),
    'DOvec':    ('D̃/Õ',               'phasor ratio D/O',                           r'\widetilde{D}/\widetilde{O}'),
    'OAvec':    ('Õ/Ã',               'phasor ratio O/A',                           r'\widetilde{O}/\widetilde{A}'),
    'DAvec':    ('D̃/Ã',               'phasor ratio D/A',                           r'\widetilde{D}/\widetilde{A}'),
    'TAvec':    ('T̃/Ã',               'phasor ratio T/A',                           r'\widetilde{T}/\widetilde{A}'),
    'coh':      ('𝔠',                   'Coherence',                                  r'\mathfrak{C}'),
    'DOcoh':    ('𝔠(D̃,Õ)',            'Coherence D,O',                              r'\mathfrak{C}(\widetilde{D},\widetilde{O})'),
    'OAcoh':    ('𝔠(Õ,Ã)',            'Coherence O,A',                              r'\mathfrak{C}(\widetilde{O},\widetilde{A})'),
    'DAcoh':    ('𝔠(D̃,Ã)',            'Coherence D,A',                              r'\mathfrak{C}(\widetilde{D},\widetilde{A})'),
    'TAcoh':    ('𝔠(T̃,Ã)',            'Coherence T,A',                              r'\mathfrak{C}(\widetilde{T},\widetilde{A})'),
    'BVuph':    ('V̆',                   'blood Volume unit phasor',                   r'\breve{V}'),
    'BFuph':    ('F̆',                   'blood Flow unit phasor',                     r'\breve{F}'),
}

# ---------------------------------------------------------------------------
# Math-context expansion: replace \acrshort{key} etc. inside math spans
# ---------------------------------------------------------------------------
ACR_CMD_PAT = re.compile(
    r'\\(?:acrshort|acrfull|acrfullpl|acrshortpl|gls|Gls|glspl|Glspl)\{([^}]+)\}'
)

def expand_in_math(m_content):
    def repl(m):
        key = m.group(1)
        if key not in ACR:
            return m.group(0)
        short, long, math = ACR[key]
        if math is not None:
            return math
        # text acronym inside math: wrap in \text{}
        return r'\text{' + short + r'}'
    return ACR_CMD_PAT.sub(repl, m_content)

def process_math_spans(html):
    """Expand acronym commands inside math inline/display spans."""
    def repl_inline(m):
        return '<span class="math inline">\\(' + expand_in_math(m.group(1)) + '\\)</span>'
    def repl_display(m):
        return '<span class="math display">\\[' + expand_in_math(m.group(1)) + '\\]</span>'
    html = re.sub(r'<span class="math inline">\\\((.+?)\\\)</span>',
                  repl_inline, html, flags=re.DOTALL)
    html = re.sub(r'<span class="math display">\\\[(.+?)\\\]</span>',
                  repl_display, html, flags=re.DOTALL)
    return html

# ---------------------------------------------------------------------------
# Text-context acronym span expansion
# ---------------------------------------------------------------------------
ACR_SPAN_PAT = re.compile(
    r'<span\s+data-acronym-label="([^"]+)"\s+data-acronym-form="([^"]+)"[^>]*>.*?</span>',
    re.DOTALL
)

def expand_acr_spans(html):
    def repl(m):
        key  = m.group(1)
        form = m.group(2)
        if key not in ACR:
            return m.group(0)
        short, long, _ = ACR[key]
        plural = 'plural' in form
        full   = 'full'   in form
        if full:
            s = f'{long} ({short})'
            if plural:
                s = f'{long}s ({short}s)'
        else:
            s = short + ('s' if plural else '')
        return s
    return ACR_SPAN_PAT.sub(repl, html)

# ---------------------------------------------------------------------------
# Figure handling
# ---------------------------------------------------------------------------
# Matches <embed src="..."/> (EPS) and <img src="..." style="..."> (raster)
# when the src is a LaTeX-relative path (contains a directory separator).
EMBED_PAT = re.compile(r'<embed\s[^>]*?src="([^"]+)"[^>]*/>', re.DOTALL)
IMG_PAT   = re.compile(r'<img\s([^>]*?)src="([^"]+/[^"]+\.(png|jpg|jpeg))"([^>]*)>', re.DOTALL | re.IGNORECASE)

def _fig_tag(stem, extra_attrs=''):
    for ext in ('.png', '.jpg', '.jpeg'):
        if (FIGS / (stem + ext)).exists():
            return f'<img src="figures/{stem}{ext}" class="img-fluid" alt="{stem}"{extra_attrs}>'
    return f'<img src="figures/{stem}.png" class="img-fluid" alt="{stem}"{extra_attrs}>'

def fix_figures(html):
    def repl_embed(m):
        return _fig_tag(Path(m.group(1)).stem)

    def repl_img(m):
        src = m.group(2)
        # leave already-correct paths alone
        if src.startswith('figures/'):
            return m.group(0)
        stem = Path(src).stem
        # preserve any inline style (e.g. width) from pandoc
        style_m = re.search(r'style="([^"]*)"', m.group(1) + m.group(4))
        extra = f' style="{style_m.group(1)}"' if style_m else ''
        return _fig_tag(stem, extra)

    html = EMBED_PAT.sub(repl_embed, html)
    html = IMG_PAT.sub(repl_img, html)
    return html

# ---------------------------------------------------------------------------
# Citation handling: show cite keys in brackets
# ---------------------------------------------------------------------------
CITE_PAT = re.compile(
    r'<span class="citation" data-cites="([^"]+)"[^>]*>.*?</span>', re.DOTALL
)

def fix_citations(html):
    def repl(m):
        keys = m.group(1).split()
        return f'<span class="citation-keys text-muted small">[{", ".join(keys)}]</span>'
    return CITE_PAT.sub(repl, html)

# ---------------------------------------------------------------------------
# Reference links: clean up unresolved [label] anchors
# ---------------------------------------------------------------------------
REF_PAT = re.compile(
    r'<a href="(#[^"]*)" data-reference-type="[^"]*" data-reference="[^"]*">\[([^\]]*)\]</a>'
)

def fix_references(html):
    return REF_PAT.sub(r'<a href="\1">§</a>', html)

# ---------------------------------------------------------------------------
# HTML template
# ---------------------------------------------------------------------------
NAV_LINKS = '\n'.join(
    f'<li class="nav-item"><a class="nav-link" href="../index.html#{anchor}">{label}</a></li>'
    for anchor, label in [('bio','Bio'),('research','Research'),('teaching','Teaching'),('tools','Tools')]
)

def sidebar_html(current_file):
    entries = [('index.html', 'Overview')] + [(fname, title) for _, fname, title, _ in CHAPTERS]
    items = []
    for href, label in entries:
        active = ' active fw-bold' if href == current_file else ''
        items.append(f'<a href="{href}" class="list-group-item list-group-item-action{active} py-1 small">{label}</a>')
    return '\n'.join(items)

def wrap_template(body, title, part, current_file, prev_ch, next_ch):
    prev_btn = (f'<a href="{prev_ch[0]}" class="btn btn-sm btn-outline-secondary">← {prev_ch[1]}</a>'
                if prev_ch else '')
    next_btn = (f'<a href="{next_ch[0]}" class="btn btn-sm btn-outline-secondary">{next_ch[1]} →</a>'
                if next_ch else '')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} · Giles Blaney</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script>MathJax = {{ tex: {{ inlineMath: [['\\\\(','\\\\)']], displayMath: [['\\\\[','\\\\]']] }} }};</script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
    <style>
        body {{ padding-top: 70px; }}
        figure {{ margin: 2rem 0; text-align: center; }}
        figure img {{ max-width: 100%; }}
        figcaption {{ margin-top: .75rem; font-size: .875rem; color: #555; text-align: left; }}
        .citation-keys {{ font-size: .75rem; }}
        .math-display {{ overflow-x: auto; }}
        section.footnotes {{ font-size: .85rem; border-top: 1px solid #dee2e6; margin-top: 2rem; padding-top: 1rem; }}
        #chapter-content h1 {{ font-size: 1.75rem; margin-bottom: .25rem; }}
        #chapter-content h2 {{ font-size: 1.35rem; margin-top: 2rem; }}
        #chapter-content h3 {{ font-size: 1.15rem; margin-top: 1.5rem; }}
        #chapter-content h4 {{ font-size: 1rem; margin-top: 1.25rem; }}
        .part-label {{ font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: #6c757d; }}
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand fw-semibold" href="../index.html">Giles Blaney, PhD</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    {NAV_LINKS}
                    <li class="nav-item"><a class="nav-link active" href="index.html">Dissertation</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <nav class="col-lg-2 d-none d-lg-block bg-light border-end" style="min-height:calc(100vh - 70px); padding-top:1.5rem;">
                <p class="px-3 mb-1 text-muted small fw-bold">DISSERTATION</p>
                <div class="list-group list-group-flush">
{sidebar_html(current_file)}
                </div>
            </nav>

            <!-- Main content -->
            <main class="col-lg-10 py-4 px-md-5" id="chapter-content">
                <div class="part-label mb-1">{part}</div>
                <h1 class="fw-bold mb-3">{title}</h1>
                <hr class="mb-4">

                {body}

                <hr class="mt-5">
                <div class="d-flex justify-content-between mt-3 mb-5">
                    {prev_btn}
                    <a href="index.html" class="btn btn-sm btn-outline-primary">↑ Overview</a>
                    {next_btn}
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>"""

# ---------------------------------------------------------------------------
# Index / landing page
# ---------------------------------------------------------------------------
ABSTRACT = """One of the chief issues with typical near-infrared spectroscopy measurements on
the surface of a diffuse medium is the dominance of signal from superficial parts
of the medium. When applied to non-invasive measurements of the brain, this leads
to a confound from the scalp and skull tissue. The main thread of this work is to
minimize this issue by developing measurements that are more specific to deep
regions. The centerpiece of this work is the development of the dual-slope
technique which is preferentially sensitive to deep regions and is nearly
insensitive to various instrumental and motion artifacts."""

def make_index():
    ch_items = []
    for src_tex, fname, title, part in CHAPTERS:
        ch_items.append(f'<li><a href="{fname}">{title}</a> <span class="text-muted small">— {part}</span></li>')
    ch_list = '\n'.join(ch_items)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dissertation · Giles Blaney</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{ padding-top: 70px; }}
        .section-divider {{ width:60px; border-top:3px solid #0d6efd; margin:16px 0 24px; }}
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div class="container">
            <a class="navbar-brand fw-semibold" href="../index.html">Giles Blaney, PhD</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    {NAV_LINKS}
                    <li class="nav-item"><a class="nav-link active" href="index.html">Dissertation</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h1 class="fw-bold">Doctoral Dissertation</h1>
        <div class="section-divider"></div>
        <h2 class="h4 text-muted mb-1">Enabling Deep Region Specific Optical Measurements in a Diffusive Medium with Near-Infrared Spectroscopy</h2>
        <p class="text-muted mb-4">Giles Blaney · Tufts University · May 2022</p>

        <h3 class="h5 fw-bold">Abstract</h3>
        <p>{ABSTRACT}</p>
        <a href="https://www.proquest.com/dissertations-theses/enabling-deep-region-specific-optical-measurements/docview/2700025497/se-2"
           class="btn btn-outline-primary btn-sm mb-5" target="_blank">Full PDF (ProQuest)</a>

        <h3 class="h5 fw-bold mt-4">Chapters</h3>
        <ul class="mt-2">
{ch_list}
        </ul>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>"""
    (OUT / 'index.html').write_text(html)

# ---------------------------------------------------------------------------
# EPS → PNG conversion
# ---------------------------------------------------------------------------
def convert_figures():
    FIGS.mkdir(parents=True, exist_ok=True)
    for src in [*DISS.rglob('*.png'), *DISS.rglob('*.jpg'), *DISS.rglob('*.jpeg')]:
        if 'rev220310' in src.parts:
            continue
        dst = FIGS / src.name
        if not dst.exists():
            shutil.copy2(src, dst)
    for src in DISS.rglob('*.eps'):
        if 'rev220310' in src.parts:
            continue
        dst = FIGS / (src.stem + '.png')
        if not dst.exists():
            try:
                subprocess.run(
                    ['gs', '-dNOPAUSE', '-dBATCH', '-dSAFER',
                     '-sDEVICE=png16m', '-r150',
                     f'-sOutputFile={dst}', str(src)],
                    capture_output=True, check=True
                )
                print(f'  converted {src.name}')
            except subprocess.CalledProcessError:
                print(f'  WARN: gs failed on {src.name}')

# ---------------------------------------------------------------------------
# Per-chapter conversion
# ---------------------------------------------------------------------------
def convert_chapter(idx):
    src_rel, fname, title, part = CHAPTERS[idx]
    src = DISS / src_rel

    print(f'  [{idx+1}/{len(CHAPTERS)}] {fname} ...')

    result = subprocess.run(
        ['pandoc', '--mathjax', '--from=latex', '--to=html5', str(src)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f'    pandoc error: {result.stderr[:200]}')

    html = result.stdout

    body_m = re.search(r'<body[^>]*>(.*)</body>', html, re.DOTALL)
    body = body_m.group(1).strip() if body_m else html

    body = process_math_spans(body)
    body = expand_acr_spans(body)
    body = fix_figures(body)
    body = fix_citations(body)
    body = fix_references(body)

    prev_ch = (CHAPTERS[idx-1][1], CHAPTERS[idx-1][2]) if idx > 0 else None
    next_ch = (CHAPTERS[idx+1][1], CHAPTERS[idx+1][2]) if idx < len(CHAPTERS)-1 else None

    full = wrap_template(body, title, part, fname, prev_ch, next_ch)
    (OUT / fname).write_text(full)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    OUT.mkdir(parents=True, exist_ok=True)

    print('Step 1/3 · Converting figures (EPS→PNG, copying rasters)...')
    convert_figures()

    print('Step 2/3 · Converting chapters...')
    with ProcessPoolExecutor() as executor:
        executor.map(convert_chapter, range(len(CHAPTERS)))

    print('Step 3/3 · Building index...')
    make_index()

    print('Done. Output in dissertation/')

if __name__ == '__main__':
    main()
