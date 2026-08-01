#!/usr/bin/env python3
"""Build the per-family release archives.

Each archive is self-contained: the four font formats plus that family's
documentation and the repository's LICENSING.md, so a downloaded zip never
separates the fonts from their licence position.

Archives are deterministic — fixed timestamps and sorted entries — so rebuilding
from the same commit produces byte-identical files and the checksums stay
meaningful.

Usage:  python3 tools/make_release.py [outdir]
"""

import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"
DEFAULT_OUT = ROOT / "dist"

# Fonts are versioned per family; keep this in step with tools/build_fonts.py.
VERSIONS = {"Lenos": "1.002", "Aveno": "1.001", "K24": "1.001"}

FONT_DIRS = ["OTF", "TTF", "WEB/WOFF", "WEB/WOFF2"]
FAMILY_DOCS = ["README.md", "LICENSE.md", "SOURCE.md", "CHANGELOG.md"]
REPO_DOCS = ["LICENSING.md"]

# Any fixed timestamp works; this one keeps archives reproducible.
FIXED_TIME = (2026, 8, 1, 0, 0, 0)


def add(archive, arcname, data):
    info = zipfile.ZipInfo(arcname, date_time=FIXED_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    archive.writestr(info, data)


def build(family, outdir):
    version = VERSIONS[family]
    stem = "%s-%s" % (family, version)
    zip_path = outdir / (stem + ".zip")
    members = []

    for subdir in FONT_DIRS:
        for path in sorted((FONTS / family / subdir).iterdir()):
            if path.is_file():
                members.append(("%s/%s/%s" % (stem, subdir, path.name), path))
    for name in FAMILY_DOCS:
        members.append(("%s/%s" % (stem, name), FONTS / family / name))
    for name in REPO_DOCS:
        members.append(("%s/%s" % (stem, name), ROOT / name))

    missing = [str(p) for _, p in members if not p.is_file()]
    if missing:
        raise SystemExit("missing files: %s" % ", ".join(missing))

    with zipfile.ZipFile(zip_path, "w") as archive:
        for arcname, path in members:
            add(archive, arcname, path.read_bytes())

    digest = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    (outdir / (stem + ".sha256")).write_text(
        "%s  %s\n" % (digest, zip_path.name))

    fonts = sum(1 for a, _ in members if not a.endswith(".md"))
    print("  %-20s %7.1f KB  %d fonts + %d docs"
          % (zip_path.name, zip_path.stat().st_size / 1024.0,
             fonts, len(members) - fonts))
    return zip_path, digest


def main():
    outdir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    outdir.mkdir(parents=True, exist_ok=True)
    print("Building release archives in %s" % outdir)
    for family in ("Lenos", "Aveno", "K24"):
        build(family, outdir)
    print("\nRun tools/verify_fonts.py first; these archives are only as good "
          "as the files they wrap.")


if __name__ == "__main__":
    main()
