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

  /* ---------------------------------------------------------------- icons
   *
   * Tabler icons, filled set, inlined as path data. There is no build step
   * here, and a strict same-origin policy on the fonts, so pulling an icon
   * font or an external sprite is not on the table - and inlining keeps the
   * icons on the same paint as the text, with no second request and no flash
   * of unstyled buttons. They inherit currentColor, so both themes are free.
   */
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ICONS = {
    download: ["M20 16a1 1 0 0 1 1 1v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2a1 1 0 0 1 2 0v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-2a1 1 0 0 1 1 -1m-8 -13a1 1 0 0 1 1 1v9.585l3.293 -3.292a1 1 0 0 1 1.414 1.414l-5 5a1 1 0 0 1 -.09 .08l.09 -.08a1 1 0 0 1 -.674 .292l-.033 .001h-.032l-.054 -.004l.086 .004a1 1 0 0 1 -.617 -.213a1 1 0 0 1 -.09 -.08l-5 -5a1 1 0 0 1 1.414 -1.414l3.293 3.292v-9.585a1 1 0 0 1 1 -1"],
    copy: ["M20.926 7.074a3.67 3.67 0 0 1 1.074 2.593v8.666a3.667 3.667 0 0 1 -3.667 3.667h-8.666a3.667 3.667 0 0 1 -3.667 -3.667v-8.666q 0 -.053 .005 -.102a3.66 3.66 0 0 1 3.662 -3.565h8.666c.973 0 1.905 .386 2.593 1.074",
           "M17.374 3.514a1 1 0 1 1 -1.748 .972c-.221 -.398 -.342 -.486 -.626 -.486h-10c-.548 0 -1 .452 -1 1v9.998c0 .36 .194 .692 .507 .87a1 1 0 1 1 -.99 1.738a3 3 0 0 1 -1.517 -2.606v-10c0 -1.652 1.348 -3 3 -3h10c1.094 0 1.828 .533 2.374 1.514"],
    check: ["M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"],
    eye: ["M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6"],
    moon: ["M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z"],
    sun: ["M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z",
          "M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z",
          "M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z",
          "M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z",
          "M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z",
          "M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z",
          "M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z",
          "M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z",
          "M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"]
  };

  /* Icons are decoration: the button always carries a real text label or an
   * aria-label, so the icon is hidden from assistive tech. */
  function icon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    (ICONS[name] || []).forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }

  /* Swap a button's icon and label together, keeping the node identity so
   * focus is never lost mid-interaction. */
  function setButton(btn, iconName, text) {
    var old = btn.querySelector(".icon");
    var next = icon(iconName);
    if (old) btn.replaceChild(next, old);
    else btn.insertBefore(next, btn.firstChild);
    var label = btn.querySelector(".btn-label");
    if (label) label.textContent = text;
  }

  function makeButton(tag, cls, iconName, text) {
    var b = el(tag, cls);
    b.appendChild(icon(iconName));
    b.appendChild(el("span", "btn-label", text));
    return b;
  }

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
    copyFailed: "کۆپی نەکرا",
    copyLabel: "کۆپیکردنی کۆدی CSS",
    started: "دەستی پێکرد",
    downloadOf: "داگرتنی",
    zipOf: "پەڕگەی ZIP",
    lightMode: "ڕووناک",
    darkMode: "تاریک",
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
      btn.textContent = "";
      btn.appendChild(icon(dark ? "sun" : "moon"));
      /* The control is a switch, so say which state it is in as well as what
       * pressing it does. */
      btn.setAttribute("aria-label", dark ? T.lightMode : T.darkMode);
      btn.setAttribute("title", dark ? T.lightMode : T.darkMode);
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }
    label();

    /* Cross-fade the palette instead of snapping to it. The transition lives
     * on a class rather than in the stylesheet permanently, so it cannot fire
     * on first paint or bleed into hover states. */
    var FADE_MS = 220;
    var fadeTimer;
    function fade() {
      root.classList.add("theme-fading");
      /* The class and the palette change would otherwise land in the same
       * frame, and a transition only starts when the property changes between
       * two styles that *already* carry it - so everything snapped. Reading a
       * layout property flushes the new style first, giving the transition a
       * "before" to interpolate from. */
      void root.offsetWidth;
      clearTimeout(fadeTimer);
      /* Generous margin. Removing the class while a transition is still
       * running cancels it and snaps the property to its end value, which is
       * exactly what made the fade look like it was not working - style
       * recalc across the whole tree can push the start well past the click. */
      fadeTimer = setTimeout(function () {
        root.classList.remove("theme-fading");
      }, FADE_MS + 300);
    }

    var swapTimer;
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      fade();
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}

      /* The moon and sun are different elements, so the new one would appear
       * at its final colour while the rest of the page is still fading. Fade
       * the old one out, swap at the midpoint, fade the new one in. */
      btn.classList.add("icon-swapping");
      clearTimeout(swapTimer);
      swapTimer = setTimeout(function () {
        label();
        btn.classList.remove("icon-swapping");
      }, 110);
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

  /* Kurdish reads Arabic-Indic digits, and a size is only useful rounded. */
  function fileSize(bytes) {
    if (!bytes) return null;
    var mb = bytes / 1048576;
    if (mb >= 1) return mb.toFixed(1) + " مێگابایت";
    return Math.round(bytes / 1024) + " کیلۆبایت";
  }

  /* A download is a navigation, so it stays an <a>: middle-click, ctrl-click,
   * "save link as" and the keyboard all keep working, which a <button> with a
   * click handler would quietly break. Everything else is affordance -
   *
   *   - it says what you get: family, format and weight of the file, both in
   *     the visible text and in the accessible name
   *   - it confirms the click, because a cross-origin download gives the page
   *     no completion event and an unacknowledged click reads as a dead button
   *   - the confirmation is announced, not just coloured
   */
  function decorateDownload(a, fam, opts) {
    opts = opts || {};
    var size = fileSize(fam.zipBytes);
    var label = opts.long ? T.download + "ی " + fam.name : T.download;
    var detail = [fam.name, T.zipOf].concat(size ? [size] : []).join(" · ");

    a.textContent = "";
    a.className = (opts.className || "btn btn-solid") + " btn-download";
    a.href = downloadUrl(fam);
    a.setAttribute("download", "");
    a.setAttribute("aria-label", T.downloadOf + " " + detail);
    a.title = detail;
    a.appendChild(icon("download"));
    a.appendChild(el("span", "btn-label", label));
    if (size && opts.long) {
      a.appendChild(el("span", "btn-meta", size));
    }

    var status = el("span", "sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    a.parentNode ? a.parentNode.appendChild(status) : a.appendChild(status);

    var timer;
    a.addEventListener("click", function () {
      clearTimeout(timer);
      a.classList.add("is-done");
      setButton(a, "check", T.started);
      status.textContent = T.downloadOf + " " + fam.name + " " + T.started;
      timer = setTimeout(function () {
        a.classList.remove("is-done");
        setButton(a, "download", label);
        status.textContent = "";
      }, 2500);
    });
    return a;
  }

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
      function (v) { return String(v); }));

    if (opts.lineHeight) {
      wrap.appendChild(rangeControl(T.leading, state.lineHeight, 0.9, 2.8, 0.01,
        function (v) { state.lineHeight = v; opts.onchange(state); },
        function (v) { return v.toFixed(2); }));
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
      var view = makeButton("a", "btn", "eye", T.specimen);
      view.href = "/" + fam.slug + "/";
      view.setAttribute("aria-label", T.specimen + "ی " + fam.name);
      var dl = el("a");
      actions.appendChild(view);
      actions.appendChild(dl);
      decorateDownload(dl, fam);
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
      decorateDownload(a, fam, { long: true });
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
     [T.version, fam.version],
     [T.weights, String(fam.faces.length)],
     [T.glyphs, String(fam.glyphs)],
     [T.supports, supportLabel(fam)],
     [T.suggestedLeading, fam.lineHeight.toFixed(2)]
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

    var btn = makeButton("button", "btn copy", "copy", T.copy);
    btn.type = "button";
    btn.setAttribute("aria-label", T.copyLabel);

    /* The result has to be announced, not just shown: the icon swap is
     * invisible to a screen reader and to anyone not looking at the button. */
    var status = el("span", "sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    var timer;
    function settle(ok) {
      clearTimeout(timer);
      btn.classList.toggle("is-done", ok);
      btn.classList.toggle("is-failed", !ok);
      setButton(btn, ok ? "check" : "copy", ok ? T.copied : T.copyFailed);
      status.textContent = ok ? T.copied : T.copyFailed;
      timer = setTimeout(function () {
        btn.classList.remove("is-done", "is-failed");
        setButton(btn, "copy", T.copy);
        status.textContent = "";
      }, 2000);
    }

    btn.addEventListener("click", function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(css).then(function () { settle(true); },
                                                function () { settle(legacyCopy(css)); });
        return;
      }
      /* No clipboard API off a secure origin - which is every plain-http
       * preview - so fall back rather than appear broken. */
      settle(legacyCopy(css));
    });

    host.appendChild(btn);
    host.appendChild(status);
  }

  /* execCommand is deprecated but it is the only thing that works without a
   * secure context, and it is the difference between a button that copies and
   * a button that does nothing. */
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      ok = document.execCommand("copy");
    } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
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
