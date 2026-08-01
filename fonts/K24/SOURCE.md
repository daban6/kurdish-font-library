# K24 — provenance

| | |
| --- | --- |
| Original name | K24 Kurdish |
| Original designer | RTLtype |
| Source | unknown — no download location was recorded |
| Archived | 2026-08-01 |
| Upstream licence | **all rights reserved** — see `LICENSE.md` |
| Current package version | 1.001 |

The original files were generated with FontForge; the build string
`FontForge 2.0 : K24 Bold : 1-8-2026` was still present in the unique ID of the
1.000 package.

The missing source URL matters more here than elsewhere, because the font carries
an explicit "All rights reserved" notice and there is no recorded channel through
which it was obtained. If you know where these files came from, please open an
issue.

## Master files

The `OTF/` and `TTF/` files are both masters. They came from the same FontForge
source and differ only in outline flavour, so neither is generated from the other
and outlines are untouched. Everything under `WEB/` is generated from the TTF by
`tools/build_fonts.py`; do not edit generated files by hand.

## Modifications

Metadata, naming, vertical metrics and packaging, plus one added glyph: the Arabic
question mark (U+061F), which was missing from Bold. See `LICENSE.md` and
`CHANGELOG.md`.
