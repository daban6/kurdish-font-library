# Licensing

This repository holds two different kinds of material, under two very different
licensing situations. Please read both sections before using anything here.

## 1. The font binaries — third party, terms not established

Every file under `fonts/*/OTF`, `fonts/*/TTF` and `fonts/*/WEB` is a modified
build of a typeface designed by someone else. The packager (Daban) has **not**
obtained permission from any of the original designers, and has not been able to
establish the licence under which the originals were released.

| Family | Original designer | Licence statement found in the original font |
| ------ | ----------------- | -------------------------------------------- |
| Lenos  | Sirwan Yassin     | none; upstream terms unknown |
| Aveno  | Rabar             | none; upstream terms unknown |
| K24    | RTLtype           | `Copyright (c) 2015 by RTLtype. All rights reserved.` |

What that means, stated plainly:

- **This repository grants you no licence to these fonts**, because the packager
  holds no rights to grant.
- **K24 carries an explicit "All rights reserved" notice.** Redistributing it —
  here or anywhere else — is not authorised by anything the packager holds.
- Lenos and Aveno carry no licence statement at all. Absence of a statement is
  not permission.
- If you want to use any of these typefaces, contact the designer.
- If you are one of the designers and want a family removed, or want its real
  licence recorded here, please open an issue and it will be acted on.

Earlier versions of this repository shipped a copy of the SIL Open Font License
1.1 at the top level. That was wrong on two counts: none of these fonts is known
to be OFL-licensed, and the packager cannot place another person's work under the
OFL. The file has been removed rather than left to imply rights that do not
exist.

The modifications made here are limited to metadata, naming, vertical metrics,
outline format conversion and packaging. No glyph was redrawn, with one
documented exception noted in `fonts/K24/CHANGELOG.md`.

## 2. The packaging work — MIT

The material the packager actually wrote — the scripts in `tools/`, this file,
and the Markdown documentation — is offered under the MIT licence below. This
grant covers **those files only**. It does not extend to any font binary.

```
MIT License

Copyright (c) 2026 Daban

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
