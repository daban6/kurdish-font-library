# Changelog

## Version 1.002 — 2026-08-01

Corrects several problems in the 1.001 packaging. All files are now generated
from the OTF masters by `tools/build_fonts.py`, so the four formats are one
lineage instead of several.

### Format

- **The `TTF/` files are now actually TrueType.** In 1.001 all nine were CFF
  (`OTTO`) fonts renamed to `.ttf`; they were not TrueType fonts at all. They are
  now converted to quadratic outlines, with glyph names preserved (`post` format
  2.0). Maximum bounding-box drift from the conversion is 1 unit at 1000
  units/em.
- WOFF and WOFF2 are regenerated from the new TTF, so all four formats agree.
- Recomputed TrueType left sidebearings. A renderer shifts a glyph by
  `lsb - xMin`, and 36 glyphs would otherwise have drawn up to 8 units off.

### Naming

- **Completed the rename.** 1.001 changed the `name` table but left the CFF top
  dict reading `UniSIRWAN Lenos`, which is what Adobe applications and PDF output
  actually use — so the fonts still identified as UniSIRWAN Lenos in InDesign.
  CFF `FontName`, `FullName`, `FamilyName`, `Weight` and `version` are now
  correct.
- **Fixed style linking.** All nine weights previously shared the family name
  `Lenos` with non-RIBBI subfamily names, so a Windows font menu could not reach
  Thin, ExtraLight, Light, Medium, SemiBold, ExtraBold or Black. Each weight
  outside Regular/Bold now forms its own family with `Regular` as its subfamily,
  with typographic family/subfamily (name IDs 16/17) tying the nine together.
- Unique IDs (name ID 3) are now distinct per face; every weight previously
  shared the string `Lenos:Version 1.001`.
- Added the typographic subfamily record that was missing from Regular only.
- Rebuilt the name table with Windows/en-US records, and added the licence
  description and URL that were absent.

### Metrics

- **Vertical metrics are now identical across all nine weights.** `usWinDescent`
  previously ran from 412 on Thin to 597 on Black, so line height changed when
  you changed weight.
- `sTypoDescender` was −195 while 108 glyphs had ink below it, which let Arabic
  descenders collide with the line below. Typographic metrics are now 1117/−597,
  measured from the glyphs Kurdish text actually renders.
- Set `USE_TYPO_METRICS` so applications agree on which metrics to use, and
  raised OS/2 to version 4, the first version in which that bit is defined.
- `usWinAscent`/`usWinDescent` now cover every glyph, so nothing clips.

### Style bits

- Only Bold claims the bold bit. ExtraBold and Black claimed it too, so three
  faces competed to be the bold member of the family.
- Cleared a reserved `macStyle` bit that was set on the ExtraBold and ExtraLight
  OTFs, and made `macStyle` agree with `fsSelection` across formats.
- PANOSE weight for Thin was 10, the same value as Black; it is now 2.

### Coverage

- Added U+00A0 (no-break space), U+2010 (hyphen), U+200C (ZWNJ), U+200D (ZWJ) and
  U+061C (Arabic letter mark). The first two reuse the existing space and hyphen
  glyphs; the rest map to a zero-width blank.

### Cleanup

- Removed the `DSIG` table, invalid since the 1.001 metadata edits.
- Removed the FontForge `FFTM` timestamp table.
- Rebuilt `cmap` as Windows BMP plus Unicode BMP, dropping a legacy Macintosh
  format 0 subtable that can only address 256 codepoints.
- Version string, `head.fontRevision` and the CFF version now agree; 1.001 had
  `Version 1.001`, revision 1.0 and CFF version 1.000 in the same file.

### Known remaining issues

- U+066A (٪ Arabic percent sign) is absent. It needs drawing.
- Lenos Thin has no kerning, while the other eight weights do. Kerning cannot be
  invented, so this is left as found.

## Version 1.001 — 2026

- Cleaned font metadata
- Renamed family to Lenos
- Fixed OpenType naming
- Fixed style linking
- Fixed weight metadata
- Updated vendor identifier to DABN
- Added modification credits
- Packaged as a font family archive
