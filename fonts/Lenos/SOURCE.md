# Lenos — provenance

| | |
| --- | --- |
| Original name | UniSIRWAN Lenos |
| Original designer | Sirwan Yassin |
| Source | https://xoshnus.com |
| Archived | 2026-08-01 |
| Upstream licence | not established — see `LICENSE.md` |
| Current package version | 1.002 |

## Master files

The nine `OTF/` files are the masters. Everything under `TTF/` and `WEB/` is
generated from them by `tools/build_fonts.py`; do not edit generated files by
hand, as the next build overwrites them.

The 1.001 package shipped nine CFF fonts renamed to `.ttf`, so there was no
TrueType master to preserve. The current TrueType files are converted from the
OTF masters.

## Modifications

Metadata, naming, vertical metrics, outline format conversion and packaging. No
outline was redrawn. `CHANGELOG.md` lists every change with its reason.
