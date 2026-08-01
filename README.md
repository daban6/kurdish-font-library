# Kurdish Font Library

A collection of Kurdish typefaces, repackaged so that the files behave correctly
in real applications: consistent naming, reachable weights, stable line height,
and web files that are genuinely the same font as the desktop ones.

> ## Read this first
>
> **These fonts are other people's work, and no permission to redistribute them
> has been obtained.** Upstream licence terms are not established for Lenos or
> Aveno, and K24 is explicitly marked "All rights reserved" by its author. This
> repository grants you no rights to any font here.
>
> Full detail, including the separate MIT licence that covers the packaging
> scripts, is in **[LICENSING.md](LICENSING.md)**.
>
> If you are one of the designers and want a family removed, or want its real
> licence recorded, please open an issue.

## Fonts

| Family | Designer | Weights | Glyphs | Version | Sorani | Kurmanji | Kerning |
| ------ | -------- | ------- | ------ | ------- | ------ | -------- | ------- |
| [Lenos](fonts/Lenos) | Sirwan Yassin | 9 | 682 (681 in Black) | 1.002 | complete | complete | all but Thin |
| [Aveno](fonts/Aveno) | Rabar | 2 | 1218 | 1.001 | complete | **no ş / Ş** | yes |
| [K24](fonts/K24) | RTLtype | 2 | 680 / 844 | 1.001 | complete | complete | **none** |

Every family covers the full Central Kurdish (Sorani) alphabet — ڕ ڵ ۆ ێ ڤ ھ ە
included — with initial, medial and final forms for every joining letter.

Pick by need: **Lenos** if you want a weight range, **Aveno** for the largest
glyph set and richest OpenType features, **K24** for a display face — but note it
has no kerning, and its licence status is the most restricted of the three.

## Formats

Each family ships four formats, all generated from one master so they are the
same font:

- **`OTF/`** — OpenType with CFF outlines, for print and publishing
- **`TTF/`** — TrueType with quadratic outlines, for desktop installation
- **`WEB/WOFF2/`** — for the web
- **`WEB/WOFF/`** — for older browsers

## Structure

```text
kurdish-font-library/
├── fonts/
│   └── <Family>/
│       ├── OTF/           masters (also TTF/ for K24)
│       ├── TTF/
│       ├── WEB/{WOFF,WOFF2}/
│       ├── README.md      weights, formats, coverage, caveats
│       ├── LICENSE.md     licence status for this family
│       ├── SOURCE.md      provenance and which files are masters
│       └── CHANGELOG.md   what changed in each package version, and why
├── tools/
│   ├── build_fonts.py     regenerates every distributed file from the masters
│   ├── verify_fonts.py    checks the result; exits non-zero on failure
│   ├── font_inspect.py    prints a summary of any font file
│   └── metrics_probe.py   measures ink extents, used to derive vertical metrics
├── LICENSING.md
└── README.md
```

## Building

Files under `TTF/` and `WEB/` are generated. Edit a master, then regenerate:

```sh
python3 tools/build_fonts.py    # rebuild every distributed file
python3 tools/verify_fonts.py   # check naming, metrics, coverage, shaping
```

`build_fonts.py` needs `fonttools` and `brotli`. `verify_fonts.py` checks about
thirty properties per file across all 52 files, including that every
dual-joining Kurdish letter still reaches its initial, medial and final forms —
run it before tagging a release.

## What was fixed

The 1.000/1.001 packages had problems serious enough to change how the fonts
behaved. Briefly:

- Lenos's nine `TTF/` files were CFF fonts renamed to `.ttf` — not TrueType at
  all. They are now converted properly.
- Lenos's rename was incomplete: the CFF names still read `UniSIRWAN Lenos`,
  which is what Adobe applications and PDF output use.
- Aveno's `.woff` and `.woff2` were built from two different sources, with 804 of
  805 shared codepoints on different glyph IDs.
- Six of Lenos's nine weights were unreachable in a Windows font menu, and all
  nine shared one unique ID.
- Line height changed when you changed weight, and Arabic descenders could
  collide with the line below or be clipped outright.
- K24 Bold had no Arabic question mark, so a Kurdish question could not be set in
  bold.
- The repository shipped an SIL Open Font License at the top level for fonts that
  are not known to be OFL-licensed.

Each family's `CHANGELOG.md` lists every change with its reason, and the issues
that remain — mostly missing glyphs and missing kerning, which are design work
rather than packaging.

## Credits

Typefaces by Sirwan Yassin (Lenos), Rabar (Aveno) and RTLtype (K24). All rights
in the typefaces remain with them.

Packaging, metadata correction and build tooling by Daban, 2026.
