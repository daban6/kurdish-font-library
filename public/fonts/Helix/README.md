# Helix

A four-weight Kurdish display family. 246 glyphs, kerned in every weight.
Version 1.000.

**Helix is Peshang Des 5 by Sirwan Yassin, renamed.** The Regular is his drawing,
untouched.

## Weights

Regular · Medium · SemiBold · Bold

**Only the Regular is the designer's.** Medium, SemiBold and Bold are emboldened
from it by machine — 12, 23 and 35 units of a 2048 em added to the stems, taking
the alef from 9.2% of the em to 9.8%, 10.3% and 10.8%. Nothing else in this
repository carries outlines the designer did not draw; this family does, and the
site says so on its page.

## Formats

| | |
| --- | --- |
| `TTF/` | desktop installation |
| `WEB/WOFF2/` | web |
| `WEB/WOFF/` | web, older browsers |

No OTF: the typeface is TrueType, and nothing here converts outlines from one
flavour to another.

## Coverage

**Kurdish and Arabic only.** Every Latin letter and every digit was removed,
including the Arabic-Indic and Persian digits, which this font draws as Western
figures. Set numbers in something else.

Complete Central Kurdish (Sorani) alphabet, including ڕ ڵ ۆ ێ ڤ ھ ە. Punctuation
and the font's own shaping glyphs are as the designer left them.

**ھ (U+06BE) has no initial or medial form**, which is the source font's own gap,
not something introduced here: the font gives those forms to ه (U+0647) and uses
the ھ shape as heh's initial. Text typed with ھ therefore breaks its joins
mid-word. The repository's verifier reports this on all twelve files, and it is
left alone deliberately.

**Sorani only.** No Latin at all, so Kurmanji cannot be set in Helix — use Lenos
or K24 for that.

## Licence

All rights remain with Sirwan Yassin, and his notice reserves them explicitly.
See [LICENSE.md](LICENSE.md).
