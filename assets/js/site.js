/* daban's kurdish fonts - specimen rendering
 *
 * Reads window.FONT_DATA (generated from the font binaries) and renders either
 * the home gallery or a single family page, depending on data-page on <body>.
 */
(function () {
  "use strict";

  var DATA = window.FONT_DATA || { families: [], alphabets: {} };
  var byslug = {};
  DATA.families.forEach(function (f) { byslug[f.slug] = f; });

  /* ---------------------------------------------------------- sample text */

  var SAMPLES = {
    sorani: { dir: "rtl", text: "زمانی کوردی زمانێکی دەوڵەمەند و جوانە" },
    words: { dir: "rtl", text: "کوردستان · ھەولێر · سلێمانی · دهۆک · ڕۆژهەڵات" },
    kurmanji: { dir: "ltr", text: "Zimanê kurdî zimanek dewlemend û xweş e" },
    latin: { dir: "ltr", text: "The quick brown fox jumps over the lazy dog" },
    numbers: { dir: "ltr", text: "٠١٢٣٤٥٦٧٨٩  ۰۱۲۳۴۵۶۷۸۹  0123456789" }
  };
  var TAB_LABELS = {
    sorani: "Sorani", words: "Words", kurmanji: "Kurmanji",
    latin: "Latin", numbers: "Numbers"
  };

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
      btn.setAttribute("aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme");
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
   *
   * The CDN stays as the fallback here, and remains the address used by the
   * copy-paste snippet on each family page, which is what other sites embed.
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

  function whenReady(fam, face, node) {
    if (!document.fonts || !document.fonts.load) return;
    node.classList.add("is-loading");
    document.fonts.load(face.weight + ' 40px "' + fam.name + '"')
      .catch(function () {})
      .then(function () { node.classList.remove("is-loading"); });
  }

  /* -------------------------------------------------------------- helpers */

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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function missing(fam, key) {
    var expected = DATA.alphabets[key] || "";
    var have = (fam.coverage[key] && fam.coverage[key].have) || [];
    var set = {};
    have.forEach(function (c) { set[c] = 1; });
    return expected.split("").filter(function (c) { return !set[c]; });
  }

  function makeSpecimen(fam, face, sample, size, lineHeight) {
    var node = el("div", "specimen " + sample.dir);
    node.textContent = sample.text;
    node.dir = sample.dir;
    node.setAttribute("contenteditable", EDITABLE);
    if (EDITABLE === "true") {
      // Keep pasted rich text out of the specimen.
      node.addEventListener("paste", function (ev) {
        ev.preventDefault();
        var text = (ev.clipboardData || window.clipboardData).getData("text");
        document.execCommand("insertText", false, text);
      });
    }
    node.setAttribute("spellcheck", "false");
    node.setAttribute("role", "textbox");
    node.setAttribute("aria-label", fam.name + " " + face.style + " preview");
    node.style.fontFamily = '"' + fam.name + '", sans-serif';
    node.style.fontWeight = face.weight;
    node.style.fontSize = size + "px";
    node.style.lineHeight = lineHeight || fam.lineHeight;
    declareFace(fam, face);
    whenReady(fam, face, node);
    return node;
  }

  function downloadUrl(fam) { return fam.cdn + "/" + fam.zip; }

  function metaBits(fam) {
    var wrap = el("div", "family-meta");
    function add(text) { wrap.appendChild(el("span", null, text)); }
    function sep() { wrap.appendChild(el("span", "sep", "·")); }
    add(fam.faces.length + (fam.faces.length === 1 ? " weight" : " weights"));
    sep(); add(fam.glyphs.toLocaleString() + " glyphs");
    sep(); add("by " + fam.designer);
    var miss = missing(fam, "kurmanji");
    if (miss.length) {
      wrap.appendChild(el("span", "badge badge-warn",
        "Sorani only — no " + miss.join(" ")));
    }
    if (fam.kerning === "none") {
      wrap.appendChild(el("span", "badge badge-warn", "No kerning"));
    }
    if (fam.reserved) {
      wrap.appendChild(el("span", "badge badge-warn", "All rights reserved"));
    }
    return wrap;
  }

  /* ------------------------------------------------------- shared controls */

  function buildControls(host, opts) {
    var state = {
      sample: "sorani",
      size: opts.size,
      text: null,
      lineHeight: null
    };

    var bar = el("div", "controls");
    var wrap = el("div", "wrap");
    bar.appendChild(wrap);

    var tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    Object.keys(SAMPLES).forEach(function (key) {
      var t = el("button", "tab", TAB_LABELS[key]);
      t.type = "button";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", key === state.sample ? "true" : "false");
      t.addEventListener("click", function () {
        state.sample = key;
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
    var lab = el("label", null, "Your text");
    lab.setAttribute("for", "custom-text");
    var input = el("input");
    input.id = "custom-text";
    input.type = "text";
    input.placeholder = "type to preview…";
    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", function () {
      state.text = input.value.length ? input.value : null;
      opts.onchange(state);
    });
    field.appendChild(lab);
    field.appendChild(input);
    wrap.appendChild(field);

    wrap.appendChild(rangeControl("Size", state.size, 12, 160, 1, "px",
      function (v) { state.size = v; opts.onchange(state); }));

    if (opts.lineHeight) {
      state.lineHeight = opts.lineHeight;
      wrap.appendChild(rangeControl("Leading", state.lineHeight, 0.9, 2.6, 0.01,
        "", function (v) { state.lineHeight = v; opts.onchange(state); }));
    }

    host.appendChild(bar);
    return state;
  }

  function rangeControl(label, value, min, max, step, unit, oninput) {
    var box = el("div", "slider");
    var id = "r-" + label.toLowerCase();
    var l = el("label", null, label);
    l.setAttribute("for", id);
    var r = el("input");
    r.type = "range";
    r.id = id;
    r.min = min; r.max = max; r.step = step; r.value = value;
    var out = el("output", null, value + unit);
    r.addEventListener("input", function () {
      var v = parseFloat(r.value);
      out.textContent = (step < 1 ? v.toFixed(2) : v) + unit;
      oninput(v);
    });
    box.appendChild(l); box.appendChild(r); box.appendChild(out);
    return box;
  }

  function sampleFor(state, fam) {
    var base = SAMPLES[state.sample];
    if (state.text == null) return base;
    // Custom text keeps the direction of the tab it was typed under.
    return { dir: base.dir, text: state.text };
  }

  /* ------------------------------------------------------------ home page */

  function renderHome() {
    var host = document.querySelector("[data-controls]");
    var list = document.querySelector("[data-families]");
    if (!list) return;
    var nodes = [];

    var state = buildControls(host, {
      size: 46,
      onchange: function (s) {
        nodes.forEach(function (n) {
          var sample = sampleFor(s, n.fam);
          n.node.textContent = sample.text;
          n.node.dir = sample.dir;
          n.node.className = "specimen " + sample.dir;
          n.node.style.fontSize = s.size + "px";
        });
      }
    });

    DATA.families.forEach(function (fam) {
      var sec = el("section", "family");

      var head = el("div", "family-head");
      var link = el("a", "family-name", fam.name);
      link.href = "/" + fam.slug + "/";
      head.appendChild(link);
      head.appendChild(metaBits(fam));

      var actions = el("div", "family-actions");
      var view = el("a", "btn", "Specimen");
      view.href = "/" + fam.slug + "/";
      var dl = el("a", "btn btn-solid", "Download");
      dl.href = downloadUrl(fam);
      dl.setAttribute("download", "");
      actions.appendChild(view);
      actions.appendChild(dl);
      head.appendChild(actions);
      sec.appendChild(head);

      var face = fam.faces.filter(function (f) {
        return f.style === fam.defaultStyle;
      })[0] || fam.faces[0];
      var sample = sampleFor(state, fam);
      var node = makeSpecimen(fam, face, sample, state.size);
      sec.appendChild(node);
      nodes.push({ node: node, fam: fam });

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
      size: 40,
      lineHeight: fam.lineHeight,
      onchange: function (s) {
        nodes.forEach(function (n) {
          var sample = sampleFor(s, fam);
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
      label.appendChild(el("span", "num", face.weight));
      if (face.kern === false) {
        label.appendChild(el("span", "miss", "no kerning"));
      }
      row.appendChild(label);
      var node = makeSpecimen(fam, face, sampleFor(state, fam),
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
    var groups = [
      ["Sorani", "sorani"],
      ["Kurmanji", "kurmanji"],
      ["Arabic-Indic digits", "arabicDigits"],
      ["Extended Arabic-Indic digits", "persianDigits"],
      ["Latin digits", "latinDigits"]
    ];
    declareFace(fam, fam.faces.filter(function (f) {
      return f.style === fam.defaultStyle;
    })[0] || fam.faces[0]);

    groups.forEach(function (g) {
      var expected = DATA.alphabets[g[1]] || "";
      if (!expected) return;
      var have = {};
      ((fam.coverage[g[1]] && fam.coverage[g[1]].have) ||
        fam.coverage[g[1]] || []).forEach(function (c) { have[c] = 1; });

      var miss = expected.split("").filter(function (c) { return !have[c]; });
      var h = el("h3", null, g[0]);
      h.style.font = "500 13px/1.4 var(--ui)";
      h.style.margin = "22px 0 9px";
      if (miss.length) {
        var b = el("span", "badge badge-warn", "missing " + miss.join(" "));
        b.style.marginInlineStart = "9px";
        h.appendChild(b);
      }
      host.appendChild(h);

      var grid = el("div", "glyphs");
      expected.split("").forEach(function (ch) {
        var cell = el("div", "glyph" + (have[ch] ? "" : " absent"));
        cell.style.fontFamily = '"' + fam.name + '", sans-serif';
        var cp = ch.codePointAt(0).toString(16).toUpperCase();
        cell.title = "U+" + ("0000" + cp).slice(-4) +
          (have[ch] ? "" : " — not in this font");
        cell.appendChild(el("span", null, ch));
        cell.appendChild(el("span", "glyph-cp", "U+" + ("0000" + cp).slice(-4)));
        grid.appendChild(cell);
      });
      host.appendChild(grid);
    });
  }

  function renderFacts(fam) {
    var host = document.querySelector("[data-facts]");
    if (!host) return;
    var feats = fam.features.join(" ");
    var facts = [
      ["Designer", fam.designer],
      ["Version", fam.version],
      ["Weights", fam.faces.length],
      ["Glyphs", fam.glyphs.toLocaleString()],
      ["Units per em", fam.upm],
      ["Kerning", fam.kerning],
      ["Suggested line height", fam.lineHeight],
      ["OpenType features", feats || "—"]
    ];
    facts.forEach(function (f) {
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
      lines.push("  src: url(\"" + fam.cdn + "/" + face.file +
        "\") format(\"woff2\");");
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
    pre.appendChild(el("code", null, css));
    host.appendChild(pre);

    var btn = el("button", "btn copy", "Copy");
    btn.type = "button";
    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1400);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(css).then(done, function () {});
      }
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
