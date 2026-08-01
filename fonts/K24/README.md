# K24

A two-weight Kurdish typeface by **RTLtype**, originally released as K24 Kurdish.
Package version **1.001**.

> **Licence status: the original font is marked "All rights reserved."** Of the
> three families here, this is the one with an explicit restriction. Read
> `LICENSE.md` before using or redistributing it.

## Weights

Light · Bold

There is no Regular. Light is named as its own family so that both weights remain
reachable in a font menu.

## Formats

| Directory | Format | Use |
| --- | --- | --- |
| `OTF/` | OpenType, CFF outlines | print and publishing |
| `TTF/` | TrueType, quadratic outlines | desktop installation, general compatibility |
| `WEB/WOFF2/` | WOFF2 | web, preferred |
| `WEB/WOFF/` | WOFF | web, older browsers |

`OTF/` and `TTF/` are both masters, from the same source; the web files are
generated from the TTF. Outlines are identical across all four.

## Script coverage

Complete Central Kurdish (Sorani) alphabet, including ڕ ڵ ۆ ێ ڤ ھ ە, with
initial, medial and final forms for every joining letter. Complete Kurmanji
(Hawar) Latin alphabet. Arabic-Indic and Extended Arabic-Indic digits.

Not present: U+066B (٫ decimal separator) and U+066C (٬ thousands separator).

## Notes for use

- **K24 has no kerning** in either weight. Lenos and Aveno do. Expect to adjust
  tracking by hand in display settings.
- Light and Bold have different glyph sets: Bold carries 28 Latin codepoints that
  Light lacks. Sorani and Kurmanji coverage is complete in both.
- Bold's Arabic question mark was added by this package; the original had none.
  See `CHANGELOG.md`.

`CHANGELOG.md` records what was changed in this package and why. `SOURCE.md`
records what is known about where the font came from.
