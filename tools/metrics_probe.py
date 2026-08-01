#!/usr/bin/env python3
"""Probe ink extents per family, to derive harmonized vertical metrics.

Two different numbers are needed, and they answer different questions:

  win*   must cover *all* ink, or glyphs get clipped.
  typo*  sets default line height, so it should follow the design's core
         glyph set and ignore rare stacked-mark composites.

"Core" here means glyphs reachable from cmap that are not combining marks,
which naturally excludes the tall .ccmp composites.
"""
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from pathlib import Path
import unicodedata

ROOT = Path(__file__).resolve().parent.parent / "fonts"


def ink(path):
    font = TTFont(path)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    mapped = set(cmap.values())
    marks = {g for cp, g in cmap.items()
             if unicodedata.category(chr(cp)) in ("Mn", "Me")}

    all_lo = all_hi = core_lo = core_hi = 0
    worst_hi = worst_lo = (None, 0)
    for name in font.getGlyphOrder():
        pen = BoundsPen(glyphs)
        try:
            glyphs[name].draw(pen)
        except Exception:
            continue
        if not pen.bounds:
            continue
        lo, hi = pen.bounds[1], pen.bounds[3]
        if hi > all_hi:
            all_hi, worst_hi = hi, (name, hi)
        if lo < all_lo:
            all_lo, worst_lo = lo, (name, lo)
        if name in mapped and name not in marks:
            core_hi = max(core_hi, hi)
            core_lo = min(core_lo, lo)
    return dict(upm=font["head"].unitsPerEm, all_hi=all_hi, all_lo=all_lo,
                core_hi=core_hi, core_lo=core_lo,
                worst_hi=worst_hi, worst_lo=worst_lo)


for fam in ("Lenos", "Aveno", "K24"):
    faces = sorted((ROOT / fam / "OTF").glob("*.otf"))
    print("=" * 70)
    print(fam)
    agg = {"all_hi": 0, "all_lo": 0, "core_hi": 0, "core_lo": 0}
    upm = None
    for fp in faces:
        d = ink(fp)
        upm = d["upm"]
        for k in agg:
            agg[k] = max(agg[k], d[k]) if "hi" in k else min(agg[k], d[k])
        print(f"  {fp.name:28} all {d['all_lo']:6.0f}..{d['all_hi']:6.0f}   "
              f"core {d['core_lo']:6.0f}..{d['core_hi']:6.0f}   "
              f"tallest={d['worst_hi'][0]} deepest={d['worst_lo'][0]}")
    print(f"\n  FAMILY upm={upm}")
    print(f"    all  ink: {agg['all_lo']:.0f} .. {agg['all_hi']:.0f}   "
          f"-> winDescent={-agg['all_lo']:.0f} winAscent={agg['all_hi']:.0f}")
    print(f"    core ink: {agg['core_lo']:.0f} .. {agg['core_hi']:.0f}")
    span = agg["core_hi"] - agg["core_lo"]
    print(f"    core span = {span:.0f} = {span/upm:.3f} em   "
          f"(typo line height before any gap)")
