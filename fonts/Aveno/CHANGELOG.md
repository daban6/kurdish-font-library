# Changelog

## Version 1.001 — 2026-08-01

All files are now generated from the OTF masters by `tools/build_fonts.py`.

### Format

- **The four formats are now the same font.** In 1.000 they were not: the `.woff`
  was built from the untouched FontForge original (1219 glyphs, glyph names
  intact, plus `.null`, `nonmarkingreturn` and a `gasp` table), while the `.ttf`
  and `.woff2` came from a separately reordered build with glyph names stripped
  (`post` format 3.0). 804 of the 805 shared codepoints resolved to different
  glyph IDs between the two.
- The OTF is now the single master, and it is also the richer of the two builds —
  its GSUB carries longer contextual chains than the old TTF had (`usMaxContext`
  20 against 6).
- The TTF is regenerated from the OTF with glyph names preserved. Maximum
  bounding-box drift from the outline conversion is 0 units.
- WOFF and WOFF2 are regenerated from that TTF.

### Naming

- **Removed the leftover upstream identifiers.** Unique ID, Manufacturer,
  Designer and the Macintosh-compatible full name all still read `Rabar_021` /
  `Rabar_022` in 1.000. The Mac full name is user-visible, so the font could
  present itself as `Rabar_021`. Designer is now recorded as `Rabar`.
- Unique IDs are now distinct per face.
- Added the licence description and URL that were absent.
- Regular/Bold style linking was already correct and is unchanged.

### Metrics

- Typographic and window metrics disagreed sharply — typo 1368/−680 against win
  2263/−1016 — with 382 glyphs having ink outside the typographic box, and
  `USE_TYPO_METRICS` unset, so applications disagreed about line height.
  Typographic metrics are now 1699/−787, measured from the glyphs Kurdish text
  actually renders, and are identical across both weights.
- Set `USE_TYPO_METRICS` and raised OS/2 to version 4, the first version in which
  that bit is defined.
- `usWinAscent`/`usWinDescent` now cover every glyph, so nothing clips.

### Style bits

- Set the `REGULAR` bit on Regular and made `macStyle` agree with `fsSelection`.

### Glyph metrics

- U+0610–U+0613 (Arabic honorific marks) had real advance widths. A combining
  mark must not advance the pen; these pushed the text along instead of sitting
  over the previous letter. Their advances are now zero, in both the `hmtx` table
  and the CFF charstrings.

### Coverage

- Added U+061C (Arabic letter mark).

### Cleanup

- Removed the `DSIG` table, invalid since the metadata was edited.
- Removed the FontForge `FFTM` timestamp table.
- Rebuilt `cmap` as Windows BMP plus Unicode BMP.
- Version string and `head.fontRevision` now agree; 1.000 declared
  `Version 1.000` alongside revision 1.1.

### Known remaining issues

- **U+015F / U+015E (ş / Ş) are absent.** These are core letters of the Kurmanji
  (Hawar) Latin alphabet, so Kurmanji Kurdish cannot be set in Aveno. The font
  does contain `cedilla` and `Ccedilla`, so the pair is composable, but drawing
  them is design work and was left alone. Aveno's Sorani coverage is complete,
  which is what this family is for.

## Version 1.000 — 2026

- Cleaned font metadata
- Renamed family to Aveno
- Fixed OpenType naming
- Fixed style linking
- Fixed weight metadata
- Updated vendor identifier to DABN
- Added modification credits
- Packaged as a font family archive
