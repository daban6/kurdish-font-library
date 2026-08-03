/* فۆنتی کوردی — specimen rendering
 *
 * Reads window.FONT_DATA (generated from the font binaries) and renders either
 * the home gallery or a single family page, per data-page on <body>.
 */
(function () {
  "use strict";

  var DATA = window.FONT_DATA || { families: [], alphabets: {} };
  var byslug = {};
  DATA.families.forEach(function (f) { byslug[f.slug] = f; });

  /* -------------------------------------------------------------- strings */

  var T = {
    weights: "ئەستووری",
    glyphs: "پیت",
    specimen: "نموونە",
    download: "داگرتن",
    yourText: "نووسینی خۆت",
    typeHere: "لێرە بنووسە…",
    size: "قەبارە",
    leading: "دووری دێر",
    copy: "کۆپی",
    copied: "کۆپی کرا",
    designer: "دیزاینەر",
    version: "وەشان",
    supports: "پشتگیری",
    suggestedLeading: "دووری دێری پێشنیارکراو",
    sorani: "سۆرانی",
    kurmanji: "کورمانجی",
    soraniOnly: "سۆرانی",
    both: "سۆرانی و کورمانجی",
    groupSorani: "پیتەکانی سۆرانی",
    groupKurmanji: "پیتەکانی کورمانجی",
    groupArabicDigits: "ژمارەی عەرەبی",
    groupKurdishDigits: "ژمارەی کوردی",
    groupLatinDigits: "ژمارەی لاتینی"
  };

  var TABS = [
    { key: "words", label: "وشە", dir: "rtl",
      text: "کوردستان · هەولێر · سلێمانی · دهۆک · ڕۆژهەڵات" },
    { key: "latin", label: "لاتینی", dir: "ltr",
      text: "The quick brown fox jumps over the lazy dog" },
    { key: "numbers", label: "ژمارە", dir: "ltr",
      text: "٠١٢٣٤٥٦٧٨٩  ۰۱۲۳۴۵۶۷۸۹  0123456789" }
  ];

  /* Arabic-Indic digits read more naturally on a Kurdish page. */
  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function num(n) {
    return String(n).replace(/[0-9]/g, function (d) {
      return AR_DIGITS.charAt(+d);
    });
  }

  /* --------------------------------------------------------------- theme */

  var root = document.documentElement;
  function applyTheme(t) {
    if (t) root.setAttribute("data-theme", t);
    else root.removeAttribute("data-theme");
  }
  try { applyTheme(localStorage.getItem("theme")); } catch (e) {}

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }

  function initTheme() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    function label() {
      var dark = currentTheme() === "dark";
      btn.textContent = dark ? "☀" : "☾";
      btn.setAttribute("aria-label", dark ? "ڕووناک" : "تاریک");
    }
    label();
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  }

  /* ----------------------------------------------------------- font loading
   *
   * Same-origin first, CDN second. The site and the CDN bucket sit on the same
   * edge network, so serving the site's own specimens from its own origin skips
   * a DNS lookup and a TLS handshake and reuses the open connection - and it
   * needs no CORS, which a cross-origin @font-face does.
   */

  var declared = {};
  function declareFace(fam, face) {
    var key = fam.slug + "-" + face.style;
    if (declared[key]) return;
    declared[key] = true;
    var local = fam.local + "/WEB/WOFF2/" + face.file;
    var css = '@font-face{font-family:"' + fam.name + '";' +
      "src:url('" + local + "') format('woff2')," +
      "url('" + fam.cdn + "/" + face.file + "') format('woff2');" +
      "font-weight:" + face.weight + ";font-style:normal;font-display:swap;}";
    var el = document.createElement("style");
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
  }

  /* -------------------------------------------------------------- helpers */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Minimal CSS token colouring for the "use in web" snippet. We generate the
   * snippet ourselves, so a small tokeniser is enough - no highlighter library,
   * which keeps the page self-contained. */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function highlightCss(src) {
    var re = /("(?:[^"\\]|\\.)*")|(@[\w-]+)|([A-Za-z-]+)(?=\s*:)|(\b\d+\.?\d*\b)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      var cls = m[1] ? "str" : m[2] ? "at" : m[3] ? "prop" : "num";
      out += '<span class="t-' + cls + '">' + esc(m[0]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  /* Firefox only gained plaintext-only in 136; an unsupported value would
   * leave the specimen not editable at all, so fall back to plain true. */
  var EDITABLE = (function () {
    try {
      var probe = document.createElement("div");
      probe.setAttribute("contenteditable", "plaintext-only");
      return probe.contentEditable === "plaintext-only"
        ? "plaintext-only" : "true";
    } catch (e) { return "true"; }
  })();

  function have(fam, key) {
    var c = fam.coverage[key];
    if (!c) return [];
    return c.have || c;
  }

  function supportLabel(fam) {
    var expected = (DATA.alphabets.kurmanji || "").split("");
    var set = {};
    have(fam, "kurmanji").forEach(function (c) { set[c] = 1; });
    var complete = expected.every(function (c) { return set[c]; });
    return complete ? T.both : T.soraniOnly;
  }

  function makeSpecimen(fam, face, sample, size, lineHeight) {
    var node = el("div", "specimen " + sample.dir);
    node.textContent = sample.text;
    node.dir = sample.dir;
    node.setAttribute("contenteditable", EDITABLE);
    node.setAttribute("spellcheck", "false");
    node.setAttribute("role", "textbox");
    node.setAttribute("aria-label", fam.name + " " + face.style);
    node.style.fontFamily = '"' + fam.name + '", sans-serif';
    node.style.fontWeight = face.weight;
    node.style.fontSize = size + "px";
    node.style.lineHeight = lineHeight || fam.lineHeight;
    if (EDITABLE === "true") {
      node.addEventListener("paste", function (ev) {
        ev.preventDefault();
        var text = (ev.clipboardData || window.clipboardData).getData("text");
        document.execCommand("insertText", false, text);
      });
    }
    declareFace(fam, face);
    return node;
  }

  function downloadUrl(fam) { return fam.cdn + "/" + fam.zip; }

  function primaryFace(fam) {
    return fam.faces.filter(function (f) {
      return f.style === fam.defaultStyle;
    })[0] || fam.faces[0];
  }

  /* ------------------------------------------------------- shared controls */

  function buildControls(host, opts) {
    var state = { tab: TABS[0], size: opts.size, text: null,
                  lineHeight: opts.lineHeight || null };

    var bar = el("div", "controls");
    var wrap = el("div", "wrap");
    bar.appendChild(wrap);

    var tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    TABS.forEach(function (tab) {
      var t = el("button", "tab", tab.label);
      t.type = "button";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", tab === state.tab ? "true" : "false");
      t.addEventListener("click", function () {
        state.tab = tab;
        state.text = null;
        input.value = "";
        tabs.querySelectorAll(".tab").forEach(function (o) {
          o.setAttribute("aria-selected", o === t ? "true" : "false");
        });
        opts.onchange(state);
      });
      tabs.appendChild(t);
    });
    wrap.appendChild(tabs);

    var field = el("div", "field");
    var lab = el("label", null, T.yourText);
    lab.setAttribute("for", "custom-text");
    var input = el("input");
    input.id = "custom-text";
    input.type = "text";
    input.placeholder = T.typeHere;
    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", function () {
      state.text = input.value.length ? input.value : null;
      opts.onchange(state);
    });
    field.appendChild(lab);
    field.appendChild(input);
    wrap.appendChild(field);

    wrap.appendChild(rangeControl(T.size, state.size, 14, 180, 1,
      function (v) { state.size = v; opts.onchange(state); },
      function (v) { return num(v); }));

    if (opts.lineHeight) {
      wrap.appendChild(rangeControl(T.leading, state.lineHeight, 0.9, 2.8, 0.01,
        function (v) { state.lineHeight = v; opts.onchange(state); },
        function (v) { return num(v.toFixed(2)); }));
    }

    host.appendChild(bar);
    return state;
  }

  function rangeControl(label, value, min, max, step, oninput, format) {
    var box = el("div", "slider");
    var id = "r-" + Math.random().toString(36).slice(2, 7);
    var l = el("label", null, label);
    l.setAttribute("for", id);
    var r = el("input");
    r.type = "range";
    r.id = id;
    r.min = min; r.max = max; r.step = step; r.value = value;
    var out = el("output", null, format(value));
    r.addEventListener("input", function () {
      var v = parseFloat(r.value);
      out.textContent = format(v);
      oninput(v);
    });
    box.appendChild(l); box.appendChild(r); box.appendChild(out);
    return box;
  }

  function sampleFor(state) {
    if (state.text == null) return state.tab;
    return { dir: state.tab.dir, text: state.text };
  }

  /* ------------------------------------------------------------ home page */

  function renderHome() {
    var host = document.querySelector("[data-controls]");
    var list = document.querySelector("[data-families]");
    if (!list) return;
    var nodes = [];

    var state = buildControls(host, {
      size: 58,
      onchange: function (s) {
        var sample = sampleFor(s);
        nodes.forEach(function (n) {
          n.textContent = sample.text;
          n.dir = sample.dir;
          n.className = "specimen " + sample.dir;
          n.style.fontSize = s.size + "px";
        });
      }
    });

    DATA.families.forEach(function (fam) {
      var sec = el("section", "family");

      var head = el("div", "family-head");
      var link = el("a", "family-name", fam.name);
      link.href = "/" + fam.slug + "/";
      head.appendChild(link);

      var actions = el("div", "family-actions");
      var view = el("a", "btn", T.specimen);
      view.href = "/" + fam.slug + "/";
      var dl = el("a", "btn btn-solid", T.download);
      dl.href = downloadUrl(fam);
      dl.setAttribute("download", "");
      actions.appendChild(view);
      actions.appendChild(dl);
      head.appendChild(actions);
      sec.appendChild(head);

      var node = makeSpecimen(fam, primaryFace(fam), sampleFor(state),
        state.size);
      sec.appendChild(node);
      nodes.push(node);

      list.appendChild(sec);
    });
  }

  /* ---------------------------------------------------------- family page */

  function renderFamily(slug) {
    var fam = byslug[slug];
    if (!fam) return;
    var host = document.querySelector("[data-controls]");
    var rows = document.querySelector("[data-weights]");
    var nodes = [];

    var state = buildControls(host, {
      size: 50,
      lineHeight: fam.lineHeight,
      onchange: function (s) {
        var sample = sampleFor(s);
        nodes.forEach(function (n) {
          n.textContent = sample.text;
          n.dir = sample.dir;
          n.className = "specimen " + sample.dir;
          n.style.fontSize = s.size + "px";
          n.style.lineHeight = s.lineHeight;
        });
      }
    });

    fam.faces.forEach(function (face) {
      var row = el("div", "weight-row");
      var label = el("div", "weight-label");
      label.appendChild(el("span", null, face.style));
      row.appendChild(label);
      var node = makeSpecimen(fam, face, sampleFor(state),
        state.size, state.lineHeight);
      row.appendChild(node);
      nodes.push(node);
      rows.appendChild(row);
    });

    renderGlyphs(fam);
    renderFacts(fam);
    renderSnippet(fam);
    document.querySelectorAll("[data-download]").forEach(function (a) {
      a.href = downloadUrl(fam);
      a.setAttribute("download", "");
    });
  }

  function renderGlyphs(fam) {
    var host = document.querySelector("[data-glyphs]");
    if (!host) return;
    declareFace(fam, primaryFace(fam));

    [["sorani", T.groupSorani],
     ["kurmanji", T.groupKurmanji],
     ["arabicDigits", T.groupArabicDigits],
     ["persianDigits", T.groupKurdishDigits],
     ["latinDigits", T.groupLatinDigits]].forEach(function (g) {
      var chars = have(fam, g[0]);
      if (!chars.length) return;

      var group = el("div", "glyph-group");
      group.appendChild(el("h3", null, g[1]));
      var grid = el("div", "glyphs");
      chars.forEach(function (ch) {
        var cell = el("div", "glyph");
        cell.style.fontFamily = '"' + fam.name + '", sans-serif';
        var cp = ch.codePointAt(0).toString(16).toUpperCase();
        cell.title = "U+" + ("0000" + cp).slice(-4);
        cell.textContent = ch;
        grid.appendChild(cell);
      });
      group.appendChild(grid);
      host.appendChild(group);
    });
  }

  function renderFacts(fam) {
    var host = document.querySelector("[data-facts]");
    if (!host) return;
    [[T.designer, fam.designerKu],
     [T.version, num(fam.version)],
     [T.weights, num(fam.faces.length)],
     [T.glyphs, num(fam.glyphs)],
     [T.supports, supportLabel(fam)],
     [T.suggestedLeading, num(fam.lineHeight.toFixed(2))]
    ].forEach(function (f) {
      var d = el("div", "fact");
      d.appendChild(el("dt", null, f[0]));
      d.appendChild(el("dd", null, String(f[1])));
      host.appendChild(d);
    });
  }

  function renderSnippet(fam) {
    var host = document.querySelector("[data-snippet]");
    if (!host) return;
    var lines = [];
    fam.faces.forEach(function (face) {
      lines.push("@font-face {");
      lines.push('  font-family: "' + fam.name + '";');
      lines.push('  src: url("' + fam.cdn + "/" + face.file +
        '") format("woff2");');
      lines.push("  font-weight: " + face.weight + ";");
      lines.push("  font-display: swap;");
      lines.push("}");
    });
    lines.push("");
    lines.push("body {");
    lines.push('  font-family: "' + fam.name + '", sans-serif;');
    lines.push("  line-height: " + fam.lineHeight + ";");
    lines.push("}");
    var css = lines.join("\n");

    var pre = el("pre");
    var code = el("code");
    code.innerHTML = highlightCss(css);
    pre.appendChild(code);
    host.appendChild(pre);

    var btn = el("button", "btn copy", T.copy);
    btn.type = "button";
    btn.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(css).then(function () {
        btn.textContent = T.copied;
        setTimeout(function () { btn.textContent = T.copy; }, 1500);
      }, function () {});
    });
    host.appendChild(btn);
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    initTheme();
    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHome();
    else if (page === "family") {
      renderFamily(document.body.getAttribute("data-family"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else boot();
})();
