#!/usr/bin/env python3
"""Rebuild every distributed font file in this repository from its canonical master.

Canonical masters
-----------------
Lenos, Aveno  the OTF (CFF) files. Their TrueType and web files are generated from
              them here, so all four formats share a single lineage. This matters:
              Aveno previously shipped a .woff built from the untouched FontForge
              original and a .woff2 built from a differently ordered TTF, so the
              two web formats were not the same font.
K24           the OTF and TTF files. Both came from the same FontForge source and
              differ only in outline flavour, so both are kept. Web files are
              generated from the TTF.

Vertical metrics come from tools/metrics_probe.py, which measures real ink:
win* covers every glyph so nothing clips, typo* follows the glyphs Kurdish text
actually renders so default line height stays sane.

Usage:  python3 tools/build_fonts.py   (from the repository root)
"""

import os
import sys
from pathlib import Path

from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"

VENDOR = "DABN"
PACKAGER = "Daban"
PACKAGE_YEAR = "2026"
REPO = "https://github.com/daban6/kurdish-font-library"
LICENSE_URL = REPO + "/blob/main/LICENSING.md"

# usWeightClass and the PANOSE weight byte for each style we ship.
STYLES = {
    "Thin": (100, 2),
    "ExtraLight": (200, 3),
    "Light": (300, 4),
    "Regular": (400, 5),
    "Medium": (500, 6),
    "SemiBold": (600, 7),
    "Bold": (700, 8),
    "ExtraBold": (800, 9),
    "Black": (900, 10),
}

# Styles that a RIBBI-style font menu can reach inside one family name.
RIBBI = {"Regular", "Bold", "Italic", "Bold Italic"}

FAMILIES = {
    "Lenos": {
        "version": "1.002",
        "designer": "Sirwan Yassin",
        "designer_url": "https://xoshnus.com",
        "original_copyright": "Copyright © 2021 Sirwan Yassin.",
        "typo": (1117, -597, 0),
        "win": (1171, 600),
        "ttf_from": "otf",
    },
    "Aveno": {
        "version": "1.001",
        "designer": "Rabar",
        "designer_url": "",
        "original_copyright": "Copyright © Rabar.",
        "typo": (1699, -787, 0),
        "win": (2334, 1054),
        "ttf_from": "otf",
    },
    "K24": {
        "version": "1.001",
        "designer": "RTLtype",
        "designer_url": "",
        "original_copyright": "Copyright © 2015 RTLtype. All rights reserved.",
        "typo": (921, -493, 0),
        "win": (1004, 550),
        "ttf_from": "ttf",
    },
}
# win* carries a few units of headroom over measured ink, because converting the
# cubic masters to quadratics can move a bound by up to one unit.

LICENSE_NOTE = (
    "Original font by {designer}. Upstream license terms are not known to the "
    "packager and no additional rights are granted by this build, which changes "
    "only metadata and packaging. See LICENSING.md in the distribution."
)

log_lines = []


def log(msg):
    print(msg)
    log_lines.append(msg)


# ---------------------------------------------------------------- name table

def name_records(family, style, cfg):
    """Build the full set of Windows name records for one face."""
    version = cfg["version"]
    ps_name = "%s-%s" % (family, style)
    full = family if style == "Regular" else "%s %s" % (family, style)

    # A font menu can only reach four styles under one family name, so anything
    # outside RIBBI gets its own family and becomes the Regular of that family.
    if style in RIBBI:
        family_name, subfamily = family, style
    else:
        family_name, subfamily = "%s %s" % (family, style), "Regular"

    records = {
        0: "%s Repackaged with metadata corrections by %s, %s."
           % (cfg["original_copyright"], PACKAGER, PACKAGE_YEAR),
        1: family_name,
        2: subfamily,
        3: "%s;%s;%s" % (version, VENDOR, ps_name),
        4: full,
        5: "Version %s" % version,
        6: ps_name,
        8: cfg["designer"],
        9: cfg["designer"],
        10: "%s font by %s. Metadata and packaging corrections by %s, %s."
            % (family, cfg["designer"], PACKAGER, PACKAGE_YEAR),
        11: REPO,
        13: LICENSE_NOTE.format(designer=cfg["designer"]),
        14: LICENSE_URL,
        16: family,
        17: style,
    }
    if cfg["designer_url"]:
        records[12] = cfg["designer_url"]
    return records


def set_names(font, records):
    """Replace the name table with Windows/Unicode/en-US records only."""
    table = newTable("name")
    table.names = []
    for name_id, value in sorted(records.items()):
        table.setName(value, name_id, 3, 1, 0x409)
    font["name"] = table


# ------------------------------------------------------------- OS/2 and head

def set_style_bits(font, style, cfg):
    os2 = font["OS/2"]
    head = font["head"]
    weight, panose_weight = STYLES[style]

    os2.usWeightClass = weight
    os2.usWidthClass = 5
    os2.achVendID = VENDOR

    # USE_TYPO_METRICS (bit 7) is only defined from OS/2 version 4 onwards, and
    # version 4 adds no fields over version 3, so this is a free upgrade.
    if os2.version < 4:
        os2.version = 4

    # Only the face literally named Bold may claim the bold bit. Previously
    # Bold, ExtraBold and Black all claimed it and collided in the font menu.
    is_bold = style == "Bold"
    fs = 0
    if is_bold:
        fs |= 1 << 5                      # BOLD
    else:
        fs |= 1 << 6                      # REGULAR
    fs |= 1 << 7                          # USE_TYPO_METRICS
    os2.fsSelection = fs
    head.macStyle = 1 if is_bold else 0   # clears the stray reserved bit 6

    # Thin and Black both declared PANOSE weight 10 before this.
    os2.panose.bWeight = panose_weight

    # Version string, head revision and (for CFF) the charstring version all
    # have to agree; they disagreed in every family before this.
    head.fontRevision = float(cfg["version"])


def set_vertical_metrics(font, cfg):
    """One set of vertical metrics for the whole family.

    Line height used to change when you switched weight, because usWinDescent
    ran from 412 on Thin to 597 on Black.
    """
    typo_asc, typo_desc, typo_gap = cfg["typo"]
    win_asc, win_desc = cfg["win"]
    os2, hhea = font["OS/2"], font["hhea"]

    os2.sTypoAscender = typo_asc
    os2.sTypoDescender = typo_desc
    os2.sTypoLineGap = typo_gap
    os2.usWinAscent = win_asc
    os2.usWinDescent = win_desc

    # hhea mirrors the typographic values so macOS and Windows agree.
    hhea.ascender = typo_asc
    hhea.descender = typo_desc
    hhea.lineGap = typo_gap


# ------------------------------------------------------------ table clean-up

def drop_tables(font, tags):
    for tag in tags:
        if tag in font:
            del font[tag]


def drop_dead_scripts(font, keep_missing_tag, family):
    """Remove script records whose script has no coverage in the font.

    K24 declared 'hebr' in GSUB and GPOS with zero Hebrew glyphs in cmap.
    """
    for tag in ("GSUB", "GPOS"):
        if tag not in font:
            continue
        table = font[tag].table
        if not table.ScriptList:
            continue
        before = len(table.ScriptList.ScriptRecord)
        table.ScriptList.ScriptRecord = [
            r for r in table.ScriptList.ScriptRecord
            if r.ScriptTag.strip() != keep_missing_tag
        ]
        table.ScriptList.ScriptCount = len(table.ScriptList.ScriptRecord)
        if len(table.ScriptList.ScriptRecord) != before:
            log("      %s: dropped dead '%s' script record from %s"
                % (family, keep_missing_tag, tag))


def rebuild_cmap(font, mapping):
    """Write a clean cmap: Windows BMP plus Unicode BMP, nothing legacy.

    Lenos was carrying a Macintosh format 0 subtable, which can address only
    256 codepoints and is meaningless in a 681-glyph Arabic font.
    """
    over_bmp = [cp for cp in mapping if cp > 0xFFFF]
    if over_bmp:
        raise SystemExit("non-BMP codepoints present, cmap builder needs format 12")

    subtables = []
    for platform_id, enc_id in ((3, 1), (0, 3)):
        sub = CmapSubtable.newSubtable(4)
        sub.platformID = platform_id
        sub.platEncID = enc_id
        sub.language = 0
        sub.cmap = dict(mapping)
        subtables.append(sub)

    table = newTable("cmap")
    table.tableVersion = 0
    table.tables = subtables
    font["cmap"] = table

    os2 = font["OS/2"]
    os2.usFirstCharIndex = min(mapping)
    os2.usLastCharIndex = min(max(mapping), 0xFFFF)
    if os2.version >= 2:
        os2.usDefaultChar = 0
        os2.usBreakChar = 0x20


# ------------------------------------------------------------- glyph surgery

def is_cff(font):
    return "CFF " in font


def cff_top(font):
    return font["CFF "].cff.topDictIndex[0]


def cff_private(top, sample_glyph=None):
    """The Private dict a new charstring must be encoded against."""
    if hasattr(top, "Private"):
        return top.Private
    if sample_glyph is not None:
        return top.CharStrings[sample_glyph].private
    return None


def cff_replace_charstring(top, name, charstring):
    """Overwrite an existing charstring, honouring an indexed CharStrings."""
    charstrings = top.CharStrings
    if charstrings.charStringsAreIndexed:
        charstrings.charStringsIndex[charstrings.charStrings[name]] = charstring
    else:
        charstrings.charStrings[name] = charstring


def cff_append_charstring(top, name, charstring):
    """Add a new charstring and register it in the charset."""
    charstrings = top.CharStrings
    if charstrings.charStringsAreIndexed:
        charstrings.charStringsIndex.append(charstring)
        charstrings.charStrings[name] = len(charstrings.charStringsIndex) - 1
    else:
        charstrings.charStrings[name] = charstring
    top.charset.append(name)


def register_glyph(font, order, name):
    """Extend the glyph order by one name and keep the caches honest."""
    font.setGlyphOrder(order + [name])
    font.glyphOrder = order + [name]
    if hasattr(font, "_reverseGlyphOrderDict"):
        del font._reverseGlyphOrderDict
    font["maxp"].numGlyphs = len(order) + 1


def add_blank_glyph(font, name=".null"):
    """Append a zero-width, empty glyph, used as the target for ZWNJ/ZWJ/ALM."""
    order = list(font.getGlyphOrder())
    if name in order:
        return name

    if is_cff(font):
        top = cff_top(font)
        private = cff_private(top, order[0])
        charstring = T2CharStringPen(0, None).getCharString(private=private)
        cff_append_charstring(top, name, charstring)
    else:
        font["glyf"].glyphs[name] = TTGlyphPen(None).glyph()
        font["glyf"].glyphOrder = order + [name]

    font["hmtx"].metrics[name] = (0, 0)
    register_glyph(font, order, name)
    return name


def add_mirrored_glyph(font, source, target):
    """Add `target` as a horizontal mirror of `source`, keeping its advance.

    Used to give K24 Bold the Arabic question mark it was missing; the Arabic
    form is the Latin one reflected, so this stays on-weight.
    """
    order = list(font.getGlyphOrder())
    if target in order:
        return False

    advance, _ = font["hmtx"].metrics[source]
    glyph_set = font.getGlyphSet()
    recorder = DecomposingRecordingPen(glyph_set)
    glyph_set[source].draw(recorder)
    bounds_pen = BoundsPen(glyph_set)
    glyph_set[source].draw(bounds_pen)
    # x' = advance - x reflects about the middle of the advance width, so the
    # mirrored left sidebearing is whatever the source had on its right.
    transform = (-1, 0, 0, 1, advance, 0)
    lsb = int(round(advance - bounds_pen.bounds[2])) if bounds_pen.bounds else 0

    if is_cff(font):
        top = cff_top(font)
        pen = T2CharStringPen(advance, None)
        recorder.replay(TransformPen(pen, transform))
        cff_append_charstring(
            top, target, pen.getCharString(private=cff_private(top, source)))
    else:
        pen = TTGlyphPen(None)
        recorder.replay(TransformPen(pen, transform))
        font["glyf"].glyphs[target] = pen.glyph()
        font["glyf"].glyphOrder = order + [target]

    font["hmtx"].metrics[target] = (advance, lsb)
    register_glyph(font, order, target)
    return True


def zero_mark_advances(font, family, face):
    """Combining marks must not advance the pen.

    Aveno gave U+0610-U+0613 real widths, so those honorifics pushed the text
    along instead of sitting over the previous letter.
    """
    import unicodedata

    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    fixed = []
    for codepoint, glyph in sorted(cmap.items()):
        if unicodedata.category(chr(codepoint)) not in ("Mn", "Me"):
            continue
        advance, lsb = font["hmtx"].metrics[glyph]
        if advance == 0:
            continue
        font["hmtx"].metrics[glyph] = (0, lsb)
        if is_cff(font):
            # The CFF charstring carries its own width, so re-encode it too or
            # the two disagree.
            top = cff_top(font)
            pen = T2CharStringPen(0, None)
            glyph_set[glyph].draw(pen)
            cff_replace_charstring(
                top, glyph, pen.getCharString(private=cff_private(top, glyph)))
        fixed.append("U+%04X" % codepoint)
    if fixed:
        log("      %s %s: zeroed advance on %d combining marks (%s)"
            % (family, face, len(fixed), " ".join(fixed)))


def patch_cmap_gaps(font, family, face):
    """Fill codepoint gaps that can be closed by reusing existing glyphs.

    Only safe equivalences are made here. Genuinely missing designs
    (U+066A/066B/066C) are reported by tools/verify_fonts.py instead of faked.
    """
    mapping = dict(font.getBestCmap())
    added = []

    space = mapping.get(0x20)
    if space and 0xA0 not in mapping:
        mapping[0xA0] = space                      # NBSP behaves as a space
        added.append("U+00A0")

    hyphen = mapping.get(0x2D)
    if hyphen and 0x2010 not in mapping:
        mapping[0x2010] = hyphen                   # U+2010 is the plain hyphen
        added.append("U+2010")

    blank = add_blank_glyph(font)
    for codepoint in (0x200C, 0x200D, 0x061C):     # ZWNJ, ZWJ, ALM
        if codepoint not in mapping:
            mapping[codepoint] = blank
            added.append("U+%04X" % codepoint)

    rebuild_cmap(font, mapping)
    if added:
        log("      %s %s: mapped %s" % (family, face, " ".join(added)))
    return mapping


# ------------------------------------------------------------------ CFF names

def rename_cff(font, family, style, cfg):
    """Fix the CFF names as well as the name table.

    Adobe applications and PDF output read these, which is why Lenos still
    identified itself as UniSIRWAN Lenos in InDesign after the rename.
    """
    if not is_cff(font):
        return
    cff = font["CFF "].cff
    ps_name = "%s-%s" % (family, style)
    full = family if style == "Regular" else "%s %s" % (family, style)
    family_name = family if style in RIBBI else "%s %s" % (family, style)

    old = cff.fontNames[0]
    if old != ps_name:
        cff.fontNames[0] = ps_name
    top = cff.topDictIndex[0]
    top.FullName = full
    top.FamilyName = family_name
    top.Weight = style
    top.version = cfg["version"]
    top.Notice = "%s Repackaged with metadata corrections by %s, %s." % (
        cfg["original_copyright"], PACKAGER, PACKAGE_YEAR)
    if old != ps_name:
        log("      CFF name: %s -> %s" % (old, ps_name))


# ---------------------------------------------------------- OTF -> TTF

def otf_to_ttf(font):
    """Convert CFF outlines to quadratic TrueType outlines.

    Lenos previously shipped nine OTTO/CFF files renamed to .ttf, which are not
    TrueType fonts at all.
    """
    upm = font["head"].unitsPerEm
    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()

    glyf = newTable("glyf")
    glyf.glyphOrder = order
    glyf.glyphs = {}
    for name in order:
        pen = TTGlyphPen(None)
        # CFF contours wind the opposite way from TrueType.
        glyph_set[name].draw(Cu2QuPen(pen, upm / 1000.0, reverse_direction=True))
        glyf.glyphs[name] = pen.glyph()

    # A TrueType renderer positions a glyph using hmtx lsb, shifting the outline
    # by (lsb - xMin). The CFF masters' stored sidebearings do not always match
    # the quadratic bounds we just produced, so recompute them or 36 Lenos
    # glyphs render up to 8 units off.
    metrics = font["hmtx"].metrics
    for name in order:
        glyph = glyf.glyphs[name]
        glyph.recalcBounds(glyf)
        advance = metrics[name][0]
        metrics[name] = (advance, glyph.xMin if glyph.numberOfContours else 0)

    del font["CFF "]
    drop_tables(font, ["FFTM", "VORG"])
    font.sfntVersion = "\x00\x01\x00\x00"
    font["glyf"] = glyf
    font["loca"] = newTable("loca")
    font["head"].glyphDataFormat = 0

    maxp = newTable("maxp")
    maxp.tableVersion = 0x00010000
    # Unhinted, so every instruction-related maximum is zero.
    maxp.maxZones = 2
    maxp.maxTwilightPoints = 0
    maxp.maxStorage = 0
    maxp.maxFunctionDefs = 0
    maxp.maxInstructionDefs = 0
    maxp.maxStackElements = 0
    maxp.maxSizeOfInstructions = 0
    font["maxp"] = maxp

    post = font["post"]
    post.formatType = 2.0
    post.extraNames = []
    post.mapping = {}
    post.glyphOrder = order

    gasp = newTable("gasp")
    gasp.version = 1
    gasp.gaspRange = {0xFFFF: 0x000F}     # grey + symmetric smoothing at all sizes
    font["gasp"] = gasp
    return font


# ------------------------------------------------------------------ pipeline

def process(font, family, style, cfg, face_label):
    set_names(font, name_records(family, style, cfg))
    set_style_bits(font, style, cfg)
    set_vertical_metrics(font, cfg)
    rename_cff(font, family, style, cfg)
    # DSIG was invalidated the moment the metadata changed; FFTM is a FontForge
    # timestamp with no place in a shipped font.
    drop_tables(font, ["DSIG", "FFTM"])
    drop_dead_scripts(font, "hebr", family)
    zero_mark_advances(font, family, face_label)
    patch_cmap_gaps(font, family, face_label)
    return font


def save(font, path, flavor=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = flavor
    font.save(str(path))


def build_family(family):
    cfg = FAMILIES[family]
    log("\n%s\n%s" % (family, "=" * len(family)))

    otf_dir = FONTS / family / "OTF"
    ttf_dir = FONTS / family / "TTF"
    faces = []
    for otf_path in sorted(otf_dir.glob("*.otf")):
        style = otf_path.stem.split("-", 1)[1]
        faces.append((style, otf_path))

    for style, otf_path in faces:
        log("   %s %s" % (family, style))

        # --- OTF, from itself
        font = TTFont(str(otf_path))
        process(font, family, style, cfg, "OTF")
        if family == "K24" and style == "Bold":
            if add_mirrored_glyph(font, "question", "uni061F"):
                mapping = dict(font.getBestCmap())
                mapping[0x061F] = "uni061F"
                rebuild_cmap(font, mapping)
                log("      K24 OTF: synthesised uni061F (mirrored 'question')")
        save(font, otf_path)

        # --- TTF
        if cfg["ttf_from"] == "otf":
            source = TTFont(str(otf_path))
            otf_to_ttf(source)
            process(source, family, style, cfg, "TTF")
            save(source, ttf_dir / ("%s-%s.ttf" % (family, style)))
        else:
            ttf_path = ttf_dir / ("%s-%s.ttf" % (family, style))
            source = TTFont(str(ttf_path))
            process(source, family, style, cfg, "TTF")
            if family == "K24" and style == "Bold":
                if add_mirrored_glyph(source, "question", "uni061F"):
                    mapping = dict(source.getBestCmap())
                    mapping[0x061F] = "uni061F"
                    rebuild_cmap(source, mapping)
                    log("      K24 TTF: synthesised uni061F (mirrored 'question')")
            save(source, ttf_path)

        # --- web, always from the TTF just written
        ttf_path = ttf_dir / ("%s-%s.ttf" % (family, style))
        for flavor, subdir, ext in (("woff", "WOFF", ".woff"),
                                    ("woff2", "WOFF2", ".woff2")):
            web = TTFont(str(ttf_path))
            save(web, FONTS / family / "WEB" / subdir /
                 ("%s-%s%s" % (family, style, ext)), flavor=flavor)


def main():
    if not FONTS.is_dir():
        raise SystemExit("run this from the repository root")
    for family in ("Lenos", "Aveno", "K24"):
        build_family(family)
    log("\nDone. Run tools/verify_fonts.py to check the result.")


if __name__ == "__main__":
    main()
