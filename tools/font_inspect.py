#!/usr/bin/env python3

from pathlib import Path
from fontTools.ttLib import TTFont
import sys


WANTED_NAME_IDS = {
    0: "Copyright",
    1: "Family",
    2: "Subfamily",
    3: "Unique ID",
    4: "Full Name",
    5: "Version",
    6: "PostScript",
    8: "Manufacturer",
    9: "Designer",
    10: "Description",
    11: "Vendor URL",
    13: "License",
    14: "License URL",
    16: "Typographic Family",
    17: "Typographic Subfamily",
}


def first_name(font, name_id):
    for record in font["name"].names:
        if record.nameID == name_id:
            try:
                return record.toUnicode().strip()
            except Exception:
                pass
    return ""


def inspect_font(path):
    font = TTFont(path)

    print("=" * 72)
    print(path.name)
    print("=" * 72)

    os2 = font["OS/2"]

    print(f"Family        : {first_name(font, 1)}")
    print(f"Style         : {first_name(font, 2)}")
    print(f"Full Name     : {first_name(font, 4)}")
    print(f"PostScript    : {first_name(font, 6)}")
    print(f"Version       : {first_name(font, 5)}")
    print(f"Vendor ID     : {os2.achVendID}")

    print(f"\nWeight Class  : {os2.usWeightClass}")
    print(f"Glyphs        : {len(font.getGlyphOrder())}")
    print(f"Unicode       : {len(font.getBestCmap())}")

    print("\nOpenType Tables")
    print("----------------")

    for tag in sorted(font.keys()):
        print(tag)

    print()


def main():
    if len(sys.argv) < 2:
        print("Usage: inspect.py font.ttf [...]")
        raise SystemExit(1)

    for arg in sys.argv[1:]:
        inspect_font(Path(arg))


if __name__ == "__main__":
    main()
