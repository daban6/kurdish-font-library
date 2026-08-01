# Aveno — provenance

| | |
| --- | --- |
| Original name | not recorded; the files identified themselves as `Rabar_021` / `Rabar_022` |
| Original designer | Rabar |
| Source | unknown — no download location was recorded |
| Archived | 2026-08-01 |
| Upstream licence | not established — see `LICENSE.md` |
| Current package version | 1.001 |

The missing source URL is a real gap: without it there is no way to check these
files against upstream, or to find a licence statement that may exist somewhere
other than the font binary. If you know where these files came from, please open
an issue.

## Master files

The two `OTF/` files are the masters. Everything under `TTF/` and `WEB/` is
generated from them by `tools/build_fonts.py`; do not edit generated files by
hand, as the next build overwrites them.

The OTF was chosen as master over the 1.000 TTF because the two were different
builds, and the OTF is the more complete of the pair — it retains glyph names and
its GSUB carries longer contextual chains. `CHANGELOG.md` has the detail.

## Modifications

Metadata, naming, vertical metrics, combining-mark advance widths, outline format
conversion and packaging. No outline was redrawn. `CHANGELOG.md` lists every
change with its reason.
