#!/usr/bin/env python3
"""Check every distributed font file against the things this library promises.

Exits non-zero if any FAIL is reported, so it can gate a release.

Usage:  python3 tools/verify_fonts.py   (from the repository root)
"""

import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"

RIBBI = {"Regular", "Bold", "Italic", "Bold Italic"}
WEIGHTS = {"Thin": 100, "ExtraLight": 200, "Light": 300, "Regular": 400,
           "Medium": 500, "SemiBold": 600, "Bold": 700, "ExtraBold": 800,
           "Black": 900}

# Central Kurdish (Sorani) alphabet plus the hamza carriers it needs.
SORANI = [0x0627, 0x0628, 0x067E, 0x062A, 0x062C, 0x0686, 0x062D, 0x062E,
          0x062F, 0x0631, 0x0695, 0x0632, 0x0698, 0x0633, 0x0634, 0x0639,
          0x063A, 0x0641, 0x06A4, 0x0642, 0x06A9, 0x06AF, 0x0644, 0x06B5,
          0x0645, 0x0646, 0x0648, 0x06C6, 0x06BE, 0x0647, 0x06D5, 0x06CC,
          0x06CE, 0x0626, 0x0624, 0x0621]
# Letters that join on both sides, so they need all three joining forms.
DUAL = [0x0628, 0x067E, 0x062A, 0x062C, 0x0686, 0x062D, 0x062E, 0x0633,
        0x0634, 0x0639, 0x063A, 0x0641, 0x06A4, 0x0642, 0x06A9, 0x06AF,
        0x0644, 0x06B5, 0x0645, 0x0646, 0x0647, 0x06BE, 0x06CC, 0x06CE,
        0x0626]
REQUIRED = {0x00A0: "NBSP", 0x200C: "ZWNJ", 0x200D: "ZWJ", 0x061C: "ALM",
            0x2010: "hyphen", 0x061F: "Arabic question mark",
            0x060C: "Arabic comma", 0x061B: "Arabic semicolon"}

failures = []
warnings = []


def fail(msg):
    failures.append(msg)
    print("  FAIL  " + msg)


def warn(msg):
    warnings.append(msg)
    print("  warn  " + msg)


def name_of(font, name_id):
    for rec in font["name"].names:
        if rec.nameID == name_id and rec.platformID == 3:
            return rec.toUnicode()
    return None


def joining_inputs(font, tags):
    """Glyphs reachable as input to the given GSUB features."""
    found = {t: set() for t in tags}
    if "GSUB" not in font:
        return found
    gsub = font["GSUB"].table
    if not gsub.FeatureList or not gsub.LookupList:
        return found
    lookups = gsub.LookupList.Lookup
    for record in gsub.FeatureList.FeatureRecord:
        if record.FeatureTag not in tags:
            continue
        for index in record.Feature.LookupListIndex:
            lookup = lookups[index]
            for sub in lookup.SubTable:
                if lookup.LookupType in (1, 2):
                    found[record.FeatureTag].update(sub.mapping.keys())
                elif lookup.LookupType == 3:
                    found[record.FeatureTag].update(sub.alternates.keys())
                elif lookup.LookupType == 4:
                    found[record.FeatureTag].update(sub.ligatures.keys())
    return found


def check_face(path, family, style, family_state):
    font = TTFont(str(path))
    label = "%s/%s" % (path.parent.name, path.name)
    flavor = path.suffix.lower()
    cmap = font.getBestCmap()
    os2, head = font["OS/2"], font["head"]

    # --- outline flavour must match the file extension
    if flavor == ".ttf" and ("glyf" not in font or font.sfntVersion != "\x00\x01\x00\x00"):
        fail("%s is not a TrueType font (sfnt=%r)" % (label, font.sfntVersion))
    if flavor == ".otf" and "CFF " not in font:
        fail("%s has no CFF table" % label)

    # --- naming and style linking
    expected_family = family if style in RIBBI else "%s %s" % (family, style)
    expected_sub = style if style in RIBBI else "Regular"
    if name_of(font, 1) != expected_family:
        fail("%s name1 is %r, expected %r" % (label, name_of(font, 1), expected_family))
    if name_of(font, 2) != expected_sub:
        fail("%s name2 is %r, expected %r" % (label, name_of(font, 2), expected_sub))
    if name_of(font, 16) != family or name_of(font, 17) != style:
        fail("%s typographic names are %r/%r" % (label, name_of(font, 16), name_of(font, 17)))
    for name_id in (0, 3, 5, 6, 8, 9, 13, 14):
        if not name_of(font, name_id):
            fail("%s missing name ID %d" % (label, name_id))
    for stale in ("UniSIRWAN", "Rabar_0", "FontForge", "K24 Kurdish"):
        for rec in font["name"].names:
            if stale in rec.toUnicode():
                fail("%s name ID %d still contains %r" % (label, rec.nameID, stale))
    family_state["uid"].setdefault(name_of(font, 3), []).append(label)

    # --- version agreement
    version = name_of(font, 5).replace("Version ", "")
    if abs(head.fontRevision - float(version)) > 0.0005:
        fail("%s name5 %s vs head.fontRevision %s" % (label, version, head.fontRevision))
    if "CFF " in font:
        cff_version = font["CFF "].cff.topDictIndex[0].version
        if cff_version != version:
            fail("%s CFF version %s vs name5 %s" % (label, cff_version, version))
        cff_ps = font["CFF "].cff.fontNames[0]
        if cff_ps != name_of(font, 6):
            fail("%s CFF name %s vs PostScript name %s" % (label, cff_ps, name_of(font, 6)))

    # --- weight and style bits
    if os2.usWeightClass != WEIGHTS[style]:
        fail("%s usWeightClass %d, expected %d" % (label, os2.usWeightClass, WEIGHTS[style]))
    bold_bit = bool(os2.fsSelection & (1 << 5))
    regular_bit = bool(os2.fsSelection & (1 << 6))
    if (style == "Bold") != bold_bit:
        fail("%s bold bit is %s for style %s" % (label, bold_bit, style))
    if (style != "Bold") != regular_bit:
        fail("%s regular bit is %s for style %s" % (label, regular_bit, style))
    if not os2.fsSelection & (1 << 7):
        fail("%s USE_TYPO_METRICS not set" % label)
    elif os2.version < 4:
        fail("%s sets USE_TYPO_METRICS but OS/2 is version %d (needs 4+)"
             % (label, os2.version))
    expected_mac = 1 if style == "Bold" else 0
    if head.macStyle != expected_mac:
        fail("%s macStyle %d, expected %d" % (label, head.macStyle, expected_mac))

    # --- vertical metrics identical across the family, and no clipping
    metrics = (os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap,
               os2.usWinAscent, os2.usWinDescent,
               font["hhea"].ascender, font["hhea"].descender, font["hhea"].lineGap)
    family_state["metrics"].setdefault(metrics, []).append(label)
    glyph_set = font.getGlyphSet()
    worst_high = worst_low = None
    for glyph in font.getGlyphOrder():
        pen = BoundsPen(glyph_set)
        try:
            glyph_set[glyph].draw(pen)
        except Exception:
            continue
        if not pen.bounds:
            continue
        if pen.bounds[3] > os2.usWinAscent:
            worst_high = (glyph, pen.bounds[3])
        if -pen.bounds[1] > os2.usWinDescent:
            worst_low = (glyph, pen.bounds[1])
    if worst_high:
        fail("%s ink above usWinAscent %d: %s at %.0f"
             % (label, os2.usWinAscent, worst_high[0], worst_high[1]))
    if worst_low:
        fail("%s ink below usWinDescent -%d: %s at %.0f"
             % (label, os2.usWinDescent, worst_low[0], worst_low[1]))

    # --- TrueType sidebearings: a renderer shifts the outline by (lsb - xMin),
    #     so a stale lsb silently moves the glyph.
    if "glyf" in font:
        glyf = font["glyf"]
        off = []
        for glyph_name in font.getGlyphOrder():
            glyph = glyf[glyph_name]
            glyph.recalcBounds(glyf)
            if not glyph.numberOfContours:
                continue
            delta = glyph.xMin - font["hmtx"].metrics[glyph_name][1]
            if delta:
                off.append((glyph_name, delta))
        if off:
            fail("%s has %d glyphs whose hmtx lsb != xMin (worst %s)"
                 % (label, len(off), max(off, key=lambda x: abs(x[1]))))

    # --- table hygiene
    for junk in ("DSIG", "FFTM"):
        if junk in font:
            fail("%s still has a %s table" % (label, junk))
    for sub in font["cmap"].tables:
        if (sub.platformID, sub.platEncID) == (1, 0):
            fail("%s still has a legacy (1,0) cmap subtable" % label)
        if sub.format == 0:
            fail("%s has a format 0 cmap subtable" % label)

    # --- coverage
    missing = [n for cp, n in REQUIRED.items() if cp not in cmap]
    if missing:
        fail("%s missing %s" % (label, ", ".join(missing)))
    absent = ["U+%04X" % cp for cp in SORANI if cp not in cmap]
    if absent:
        fail("%s missing Sorani letters %s" % (label, " ".join(absent)))

    # --- combining marks must not advance
    for cp, glyph in cmap.items():
        if unicodedata.category(chr(cp)) in ("Mn", "Me"):
            if font["hmtx"].metrics[glyph][0] != 0:
                fail("%s U+%04X advances %d" % (label, cp, font["hmtx"].metrics[glyph][0]))

    # --- shaping: every dual-joining Kurdish letter needs all three forms
    feats = joining_inputs(font, {"init", "medi", "fina"})
    for cp in DUAL:
        if cp not in cmap:
            continue
        glyph = cmap[cp]
        gaps = [t for t in ("init", "medi", "fina") if glyph not in feats[t]]
        if gaps:
            fail("%s U+%04X not covered by %s" % (label, cp, ",".join(gaps)))

    family_state["glyphs"].setdefault(len(font.getGlyphOrder()), []).append(label)
    return font


def main():
    for family in ("Lenos", "Aveno", "K24"):
        print("\n%s" % family)
        print("=" * len(family))
        state = {"metrics": {}, "glyphs": {}, "uid": {}}
        paths = (sorted((FONTS / family / "OTF").glob("*.otf"))
                 + sorted((FONTS / family / "TTF").glob("*.ttf"))
                 + sorted((FONTS / family / "WEB" / "WOFF").glob("*.woff"))
                 + sorted((FONTS / family / "WEB" / "WOFF2").glob("*.woff2")))
        if not paths:
            fail("%s has no font files" % family)
            continue
        for path in paths:
            style = path.stem.split("-", 1)[1]
            check_face(path, family, style, state)

        if len(state["metrics"]) != 1:
            fail("%s has %d different vertical metric sets: %s"
                 % (family, len(state["metrics"]),
                    {k: len(v) for k, v in state["metrics"].items()}))
        else:
            metrics = list(state["metrics"])[0]
            print("  vertical metrics uniform across %d files: typo %d/%d/%d "
                  "win %d/%d hhea %d/%d/%d"
                  % (len(paths), metrics[0], metrics[1], metrics[2],
                     metrics[3], metrics[4], metrics[5], metrics[6], metrics[7]))
        dupes = {u: f for u, f in state["uid"].items() if len(f) > 4}
        if dupes:
            fail("%s reuses unique IDs across faces: %s" % (family, list(dupes)))
        print("  %d files checked, glyph counts %s"
              % (len(paths), sorted(state["glyphs"])))

    print("\n%s" % ("-" * 60))
    print("%d failures, %d warnings" % (len(failures), len(warnings)))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
