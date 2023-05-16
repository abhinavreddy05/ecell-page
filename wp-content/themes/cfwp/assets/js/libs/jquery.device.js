(window.Modernizr = (function (e, t, n) {
  function r(e) {
    g.cssText = e;
  }
  function o(e, t) {
    return typeof e === t;
  }
  function i(e, t) {
    return !!~("" + e).indexOf(t);
  }
  function a(e, t) {
    for (var r in e) {
      var o = e[r];
      if (!i(o, "-") && g[o] !== n) return "pfx" != t || o;
    }
    return !1;
  }
  function s(e, t, r) {
    for (var i in e) {
      var a = t[e[i]];
      if (a !== n)
        return !1 === r ? e[i] : o(a, "function") ? a.bind(r || t) : a;
    }
    return !1;
  }
  function c(e, t, n) {
    var r = e.charAt(0).toUpperCase() + e.slice(1),
      i = (e + " " + x.join(r + " ") + r).split(" ");
    return o(t, "string") || o(t, "undefined")
      ? a(i, t)
      : s((i = (e + " " + k.join(r + " ") + r).split(" ")), t, n);
  }
  var l,
    d,
    u = {},
    p = t.documentElement,
    m = "modernizr",
    f = t.createElement(m),
    g = f.style,
    h = t.createElement("input"),
    v = ":)",
    y = {}.toString,
    b = " -webkit- -moz- -o- -ms- ".split(" "),
    w = "Webkit Moz O ms",
    x = w.split(" "),
    k = w.toLowerCase().split(" "),
    E = "http://www.w3.org/2000/svg",
    S = {},
    C = {},
    j = {},
    T = [],
    A = T.slice,
    $ = function (e, n, r, o) {
      var i,
        a,
        s,
        c,
        l = t.createElement("div"),
        d = t.body,
        u = d || t.createElement("body");
      if (parseInt(r, 10))
        for (; r--; )
          ((s = t.createElement("div")).id = o ? o[r] : m + (r + 1)),
            l.appendChild(s);
      return (
        (i = ["&#173;", '<style id="s', m, '">', e, "</style>"].join("")),
        (l.id = m),
        ((d ? l : u).innerHTML += i),
        u.appendChild(l),
        d ||
          ((u.style.background = ""),
          (u.style.overflow = "hidden"),
          (c = p.style.overflow),
          (p.style.overflow = "hidden"),
          p.appendChild(u)),
        (a = n(l, e)),
        d
          ? l.parentNode.removeChild(l)
          : (u.parentNode.removeChild(u), (p.style.overflow = c)),
        !!a
      );
    },
    P = (function () {
      var e = {
        select: "input",
        change: "input",
        submit: "form",
        reset: "form",
        error: "img",
        load: "img",
        abort: "img",
      };
      return function (r, i) {
        i = i || t.createElement(e[r] || "div");
        var a = (r = "on" + r) in i;
        return (
          a ||
            (i.setAttribute || (i = t.createElement("div")),
            i.setAttribute &&
              i.removeAttribute &&
              (i.setAttribute(r, ""),
              (a = o(i[r], "function")),
              o(i[r], "undefined") || (i[r] = n),
              i.removeAttribute(r))),
          (i = null),
          a
        );
      };
    })(),
    z = {}.hasOwnProperty;
  for (var N in ((d =
    o(z, "undefined") || o(z.call, "undefined")
      ? function (e, t) {
          return t in e && o(e.constructor.prototype[t], "undefined");
        }
      : function (e, t) {
          return z.call(e, t);
        }),
  Function.prototype.bind ||
    (Function.prototype.bind = function (e) {
      var t = this;
      if ("function" != typeof t) throw new TypeError();
      var n = A.call(arguments, 1),
        r = function () {
          if (this instanceof r) {
            var o = function () {};
            o.prototype = t.prototype;
            var i = new o(),
              a = t.apply(i, n.concat(A.call(arguments)));
            return Object(a) === a ? a : i;
          }
          return t.apply(e, n.concat(A.call(arguments)));
        };
      return r;
    }),
  (S.flexbox = function () {
    return c("flexWrap");
  }),
  (S.flexboxlegacy = function () {
    return c("boxDirection");
  }),
  (S.canvas = function () {
    var e = t.createElement("canvas");
    return !!e.getContext && !!e.getContext("2d");
  }),
  (S.canvastext = function () {
    return (
      !!u.canvas &&
      !!o(t.createElement("canvas").getContext("2d").fillText, "function")
    );
  }),
  (S.webgl = function () {
    return !!e.WebGLRenderingContext;
  }),
  (S.touch = function () {
    var n;
    return (
      "ontouchstart" in e || (e.DocumentTouch && t instanceof DocumentTouch)
        ? (n = !0)
        : $(
            [
              "@media (",
              b.join("touch-enabled),("),
              m,
              ")",
              "{#modernizr{top:9px;position:absolute}}",
            ].join(""),
            function (e) {
              n = 9 === e.offsetTop;
            }
          ),
      n
    );
  }),
  (S.geolocation = function () {
    return "geolocation" in navigator;
  }),
  (S.postmessage = function () {
    return !!e.postMessage;
  }),
  (S.websqldatabase = function () {
    return !!e.openDatabase;
  }),
  (S.indexedDB = function () {
    return !!c("indexedDB", e);
  }),
  (S.hashchange = function () {
    return P("hashchange", e) && (t.documentMode === n || t.documentMode > 7);
  }),
  (S.history = function () {
    return !!e.history && !!history.pushState;
  }),
  (S.draganddrop = function () {
    var e = t.createElement("div");
    return "draggable" in e || ("ondragstart" in e && "ondrop" in e);
  }),
  (S.websockets = function () {
    return "WebSocket" in e || "MozWebSocket" in e;
  }),
  (S.rgba = function () {
    return (
      r("background-color:rgba(150,255,150,.5)"), i(g.backgroundColor, "rgba")
    );
  }),
  (S.hsla = function () {
    return (
      r("background-color:hsla(120,40%,100%,.5)"),
      i(g.backgroundColor, "rgba") || i(g.backgroundColor, "hsla")
    );
  }),
  (S.multiplebgs = function () {
    return (
      r("background:url(https://),url(https://),red url(https://)"),
      /(url\s*\(.*?){3}/.test(g.background)
    );
  }),
  (S.backgroundsize = function () {
    return c("backgroundSize");
  }),
  (S.borderimage = function () {
    return c("borderImage");
  }),
  (S.borderradius = function () {
    return c("borderRadius");
  }),
  (S.boxshadow = function () {
    return c("boxShadow");
  }),
  (S.textshadow = function () {
    return "" === t.createElement("div").style.textShadow;
  }),
  (S.opacity = function () {
    return (
      (e = "opacity:.55"),
      r(b.join(e + ";") + (t || "")),
      /^0.55$/.test(g.opacity)
    );
    var e, t;
  }),
  (S.cssanimations = function () {
    return c("animationName");
  }),
  (S.csscolumns = function () {
    return c("columnCount");
  }),
  (S.cssgradients = function () {
    var e = "background-image:";
    return (
      r(
        (
          e +
          "-webkit- "
            .split(" ")
            .join(
              "gradient(linear,left top,right bottom,from(#9f9),to(white));" + e
            ) +
          b.join("linear-gradient(left top,#9f9, white);" + e)
        ).slice(0, -e.length)
      ),
      i(g.backgroundImage, "gradient")
    );
  }),
  (S.cssreflections = function () {
    return c("boxReflect");
  }),
  (S.csstransforms = function () {
    return !!c("transform");
  }),
  (S.csstransforms3d = function () {
    var e = !!c("perspective");
    return (
      e &&
        "webkitPerspective" in p.style &&
        $(
          "@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",
          function (t, n) {
            e = 9 === t.offsetLeft && 3 === t.offsetHeight;
          }
        ),
      e
    );
  }),
  (S.csstransitions = function () {
    return c("transition");
  }),
  (S.fontface = function () {
    var e;
    return (
      $('@font-face {font-family:"font";src:url("https://")}', function (n, r) {
        var o = t.getElementById("smodernizr"),
          i = o.sheet || o.styleSheet,
          a = i
            ? i.cssRules && i.cssRules[0]
              ? i.cssRules[0].cssText
              : i.cssText || ""
            : "";
        e = /src/i.test(a) && 0 === a.indexOf(r.split(" ")[0]);
      }),
      e
    );
  }),
  (S.generatedcontent = function () {
    var e;
    return (
      $(
        [
          "#",
          m,
          "{font:0/0 a}#",
          m,
          ':after{content:"',
          v,
          '";visibility:hidden;font:3px/1 a}',
        ].join(""),
        function (t) {
          e = t.offsetHeight >= 3;
        }
      ),
      e
    );
  }),
  (S.video = function () {
    var e = t.createElement("video"),
      n = !1;
    try {
      (n = !!e.canPlayType) &&
        (((n = new Boolean(n)).ogg = e
          .canPlayType('video/ogg; codecs="theora"')
          .replace(/^no$/, "")),
        (n.h264 = e
          .canPlayType('video/mp4; codecs="avc1.42E01E"')
          .replace(/^no$/, "")),
        (n.webm = e
          .canPlayType('video/webm; codecs="vp8, vorbis"')
          .replace(/^no$/, "")));
    } catch (e) {}
    return n;
  }),
  (S.audio = function () {
    var e = t.createElement("audio"),
      n = !1;
    try {
      (n = !!e.canPlayType) &&
        (((n = new Boolean(n)).ogg = e
          .canPlayType('audio/ogg; codecs="vorbis"')
          .replace(/^no$/, "")),
        (n.mp3 = e.canPlayType("audio/mpeg;").replace(/^no$/, "")),
        (n.wav = e.canPlayType('audio/wav; codecs="1"').replace(/^no$/, "")),
        (n.m4a = (
          e.canPlayType("audio/x-m4a;") || e.canPlayType("audio/aac;")
        ).replace(/^no$/, "")));
    } catch (e) {}
    return n;
  }),
  (S.localstorage = function () {
    try {
      return localStorage.setItem(m, m), localStorage.removeItem(m), !0;
    } catch (e) {
      return !1;
    }
  }),
  (S.sessionstorage = function () {
    try {
      return sessionStorage.setItem(m, m), sessionStorage.removeItem(m), !0;
    } catch (e) {
      return !1;
    }
  }),
  (S.webworkers = function () {
    return !!e.Worker;
  }),
  (S.applicationcache = function () {
    return !!e.applicationCache;
  }),
  (S.svg = function () {
    return !!t.createElementNS && !!t.createElementNS(E, "svg").createSVGRect;
  }),
  (S.inlinesvg = function () {
    var e = t.createElement("div");
    return (
      (e.innerHTML = "<svg/>"), (e.firstChild && e.firstChild.namespaceURI) == E
    );
  }),
  (S.smil = function () {
    return (
      !!t.createElementNS &&
      /SVGAnimate/.test(y.call(t.createElementNS(E, "animate")))
    );
  }),
  (S.svgclippaths = function () {
    return (
      !!t.createElementNS &&
      /SVGClipPath/.test(y.call(t.createElementNS(E, "clipPath")))
    );
  }),
  S))
    d(S, N) &&
      ((l = N.toLowerCase()), (u[l] = S[N]()), T.push((u[l] ? "" : "no-") + l));
  return (
    u.input ||
      ((u.input = (function (n) {
        for (var r = 0, o = n.length; r < o; r++) j[n[r]] = n[r] in h;
        return (
          j.list &&
            (j.list = !!t.createElement("datalist") && !!e.HTMLDataListElement),
          j
        );
      })(
        "autocomplete autofocus list placeholder max min multiple pattern required step".split(
          " "
        )
      )),
      (u.inputtypes = (function (e) {
        for (var r, o, i, a = 0, s = e.length; a < s; a++)
          h.setAttribute("type", (o = e[a])),
            (r = "text" !== h.type) &&
              ((h.value = v),
              (h.style.cssText = "position:absolute;visibility:hidden;"),
              /^range$/.test(o) && h.style.WebkitAppearance !== n
                ? (p.appendChild(h),
                  (r =
                    (i = t.defaultView).getComputedStyle &&
                    "textfield" !==
                      i.getComputedStyle(h, null).WebkitAppearance &&
                    0 !== h.offsetHeight),
                  p.removeChild(h))
                : /^(search|tel)$/.test(o) ||
                  (r = /^(url|email)$/.test(o)
                    ? h.checkValidity && !1 === h.checkValidity()
                    : h.value != v)),
            (C[e[a]] = !!r);
        return C;
      })(
        "search tel url email datetime date month week time datetime-local number range color".split(
          " "
        )
      ))),
    (u.addTest = function (e, t) {
      if ("object" == typeof e) for (var r in e) d(e, r) && u.addTest(r, e[r]);
      else {
        if (((e = e.toLowerCase()), u[e] !== n)) return u;
        (t = "function" == typeof t ? t() : t),
          (p.className += " " + (t ? "" : "no-") + e),
          (u[e] = t);
      }
      return u;
    }),
    r(""),
    (f = h = null),
    (function (e, t) {
      function n() {
        var e = f.elements;
        return "string" == typeof e ? e.split(" ") : e;
      }
      function r(e) {
        var t = m[e[u]];
        return t || ((t = {}), p++, (e[u] = p), (m[p] = t)), t;
      }
      function o(e, n, o) {
        return (
          n || (n = t),
          s
            ? n.createElement(e)
            : (o || (o = r(n)),
              !(i = o.cache[e]
                ? o.cache[e].cloneNode()
                : d.test(e)
                ? (o.cache[e] = o.createElem(e)).cloneNode()
                : o.createElem(e)).canHaveChildren ||
              l.test(e) ||
              i.tagUrn
                ? i
                : o.frag.appendChild(i))
        );
        var i;
      }
      function i(e) {
        e || (e = t);
        var i = r(e);
        return (
          f.shivCSS &&
            !a &&
            !i.hasCSS &&
            (i.hasCSS = !!(function (e, t) {
              var n = e.createElement("p"),
                r = e.getElementsByTagName("head")[0] || e.documentElement;
              return (
                (n.innerHTML = "x<style>" + t + "</style>"),
                r.insertBefore(n.lastChild, r.firstChild)
              );
            })(
              e,
              "article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}"
            )),
          s ||
            (function (e, t) {
              t.cache ||
                ((t.cache = {}),
                (t.createElem = e.createElement),
                (t.createFrag = e.createDocumentFragment),
                (t.frag = t.createFrag())),
                (e.createElement = function (n) {
                  return f.shivMethods ? o(n, e, t) : t.createElem(n);
                }),
                (e.createDocumentFragment = Function(
                  "h,f",
                  "return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(" +
                    n()
                      .join()
                      .replace(/[\w\-]+/g, function (e) {
                        return (
                          t.createElem(e),
                          t.frag.createElement(e),
                          'c("' + e + '")'
                        );
                      }) +
                    ");return n}"
                )(f, t.frag));
            })(e, i),
          e
        );
      }
      var a,
        s,
        c = e.html5 || {},
        l =
          /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
        d =
          /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
        u = "_html5shiv",
        p = 0,
        m = {};
      !(function () {
        try {
          var e = t.createElement("a");
          (e.innerHTML = "<xyz></xyz>"),
            (a = "hidden" in e),
            (s =
              1 == e.childNodes.length ||
              (function () {
                t.createElement("a");
                var e = t.createDocumentFragment();
                return (
                  void 0 === e.cloneNode ||
                  void 0 === e.createDocumentFragment ||
                  void 0 === e.createElement
                );
              })());
        } catch (e) {
          (a = !0), (s = !0);
        }
      })();
      var f = {
        elements:
          c.elements ||
          "abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",
        version: "3.7.0",
        shivCSS: !1 !== c.shivCSS,
        supportsUnknownElements: s,
        shivMethods: !1 !== c.shivMethods,
        type: "default",
        shivDocument: i,
        createElement: o,
        createDocumentFragment: function (e, o) {
          if ((e || (e = t), s)) return e.createDocumentFragment();
          for (
            var i = (o = o || r(e)).frag.cloneNode(),
              a = 0,
              c = n(),
              l = c.length;
            a < l;
            a++
          )
            i.createElement(c[a]);
          return i;
        },
      };
      (e.html5 = f), i(t);
    })(this, t),
    (u._version = "2.7.1"),
    (u._prefixes = b),
    (u._domPrefixes = k),
    (u._cssomPrefixes = x),
    (u.hasEvent = P),
    (u.testProp = function (e) {
      return a([e]);
    }),
    (u.testAllProps = c),
    (u.testStyles = $),
    (p.className =
      p.className.replace(/(^|\s)no-js(\s|$)/, "$1$2") + " js " + T.join(" ")),
    u
  );
})(this, this.document)),
  (function (e, t, n) {
    function r(e) {
      return "[object Function]" == h.call(e);
    }
    function o(e) {
      return "string" == typeof e;
    }
    function i() {}
    function a(e) {
      return !e || "loaded" == e || "complete" == e || "uninitialized" == e;
    }
    function s() {
      var e = v.shift();
      (y = 1),
        e
          ? e.t
            ? f(function () {
                ("c" == e.t
                  ? p.injectCss
                  : p.injectJs)(e.s, 0, e.a, e.x, e.e, 1);
              }, 0)
            : (e(), s())
          : (y = 0);
    }
    function c(e, n, r, o, i, c, l) {
      function d(t) {
        if (
          !m &&
          a(u.readyState) &&
          ((b.r = m = 1),
          !y && s(),
          (u.onload = u.onreadystatechange = null),
          t)
        )
          for (var r in ("img" != e &&
            f(function () {
              x.removeChild(u);
            }, 50),
          j[n]))
            j[n].hasOwnProperty(r) && j[n][r].onload();
      }
      l = l || p.errorTimeout;
      var u = t.createElement(e),
        m = 0,
        h = 0,
        b = { t: r, s: n, e: i, a: c, x: l };
      1 === j[n] && ((h = 1), (j[n] = [])),
        "object" == e ? (u.data = n) : ((u.src = n), (u.type = e)),
        (u.width = u.height = "0"),
        (u.onerror =
          u.onload =
          u.onreadystatechange =
            function () {
              d.call(this, h);
            }),
        v.splice(o, 0, b),
        "img" != e &&
          (h || 2 === j[n]
            ? (x.insertBefore(u, w ? null : g), f(d, l))
            : j[n].push(u));
    }
    function l(e, t, n, r, i) {
      return (
        (y = 0),
        (t = t || "j"),
        o(e)
          ? c("c" == t ? E : k, e, t, this.i++, n, r, i)
          : (v.splice(this.i++, 0, e), 1 == v.length && s()),
        this
      );
    }
    function d() {
      var e = p;
      return (e.loader = { load: l, i: 0 }), e;
    }
    var u,
      p,
      m = t.documentElement,
      f = e.setTimeout,
      g = t.getElementsByTagName("script")[0],
      h = {}.toString,
      v = [],
      y = 0,
      b = "MozAppearance" in m.style,
      w = b && !!t.createRange().compareNode,
      x = w ? m : g.parentNode,
      k =
        ((m = e.opera && "[object Opera]" == h.call(e.opera)),
        (m = !!t.attachEvent && !m),
        b ? "object" : m ? "script" : "img"),
      E = m ? "script" : k,
      S =
        Array.isArray ||
        function (e) {
          return "[object Array]" == h.call(e);
        },
      C = [],
      j = {},
      T = {
        timeout: function (e, t) {
          return t.length && (e.timeout = t[0]), e;
        },
      };
    ((p = function (e) {
      function t(e, t, o, i, a) {
        var s = (function (e) {
            e = e.split("!");
            var t,
              n,
              r,
              o = C.length,
              i = e.pop(),
              a = e.length;
            for (i = { url: i, origUrl: i, prefixes: e }, n = 0; n < a; n++)
              (r = e[n].split("=")), (t = T[r.shift()]) && (i = t(i, r));
            for (n = 0; n < o; n++) i = C[n](i);
            return i;
          })(e),
          c = s.autoCallback;
        s.url.split(".").pop().split("?").shift(),
          s.bypass ||
            (t &&
              (t = r(t)
                ? t
                : t[e] || t[i] || t[e.split("/").pop().split("?")[0]]),
            s.instead
              ? s.instead(e, t, o, i, a)
              : (j[s.url] ? (s.noexec = !0) : (j[s.url] = 1),
                o.load(
                  s.url,
                  s.forceCSS ||
                    (!s.forceJS &&
                      "css" == s.url.split(".").pop().split("?").shift())
                    ? "c"
                    : n,
                  s.noexec,
                  s.attrs,
                  s.timeout
                ),
                (r(t) || r(c)) &&
                  o.load(function () {
                    d(),
                      t && t(s.origUrl, a, i),
                      c && c(s.origUrl, a, i),
                      (j[s.url] = 2);
                  })));
      }
      function a(e, n) {
        function a(e, i) {
          if (e) {
            if (o(e))
              i ||
                (u = function () {
                  var e = [].slice.call(arguments);
                  p.apply(this, e), m();
                }),
                t(e, u, n, 0, l);
            else if (Object(e) === e)
              for (c in ((s = (function () {
                var t,
                  n = 0;
                for (t in e) e.hasOwnProperty(t) && n++;
                return n;
              })()),
              e))
                e.hasOwnProperty(c) &&
                  (!i &&
                    !--s &&
                    (r(u)
                      ? (u = function () {
                          var e = [].slice.call(arguments);
                          p.apply(this, e), m();
                        })
                      : (u[c] = (function (e) {
                          return function () {
                            var t = [].slice.call(arguments);
                            e && e.apply(this, t), m();
                          };
                        })(p[c]))),
                  t(e[c], u, n, c, l));
          } else !i && m();
        }
        var s,
          c,
          l = !!e.test,
          d = e.load || e.both,
          u = e.callback || i,
          p = u,
          m = e.complete || i;
        a(l ? e.yep : e.nope, !!d), d && a(d);
      }
      var s,
        c,
        l = this.yepnope.loader;
      if (o(e)) t(e, 0, l, 0);
      else if (S(e))
        for (s = 0; s < e.length; s++)
          o((c = e[s]))
            ? t(c, 0, l, 0)
            : S(c)
            ? p(c)
            : Object(c) === c && a(c, l);
      else Object(e) === e && a(e, l);
    }).addPrefix = function (e, t) {
      T[e] = t;
    }),
      (p.addFilter = function (e) {
        C.push(e);
      }),
      (p.errorTimeout = 1e4),
      null == t.readyState &&
        t.addEventListener &&
        ((t.readyState = "loading"),
        t.addEventListener(
          "DOMContentLoaded",
          (u = function () {
            t.removeEventListener("DOMContentLoaded", u, 0),
              (t.readyState = "complete");
          }),
          0
        )),
      (e.yepnope = d()),
      (e.yepnope.executeStack = s),
      (e.yepnope.injectJs = function (e, n, r, o, c, l) {
        var d,
          u,
          m = t.createElement("script");
        o = o || p.errorTimeout;
        for (u in ((m.src = e), r)) m.setAttribute(u, r[u]);
        (n = l ? s : n || i),
          (m.onreadystatechange = m.onload =
            function () {
              !d &&
                a(m.readyState) &&
                ((d = 1), n(), (m.onload = m.onreadystatechange = null));
            }),
          f(function () {
            d || ((d = 1), n(1));
          }, o),
          c ? m.onload() : g.parentNode.insertBefore(m, g);
      }),
      (e.yepnope.injectCss = function (e, n, r, o, a, c) {
        var l;
        (o = t.createElement("link")), (n = c ? s : n || i);
        for (l in ((o.href = e),
        (o.rel = "stylesheet"),
        (o.type = "text/css"),
        r))
          o.setAttribute(l, r[l]);
        a || (g.parentNode.insertBefore(o, g), f(n, 0));
      });
  })(this, document),
  (Modernizr.load = function () {
    yepnope.apply(window, [].slice.call(arguments, 0));
  }),
  (window.Detectizr = (function (e, t, n, r) {
    var o,
      i,
      a = {},
      s = e.Modernizr,
      c = ["tv", "tablet", "mobile", "desktop"],
      l = {
        addAllFeaturesAsClass: !1,
        detectDevice: !0,
        detectDeviceModel: !0,
        detectScreen: !0,
        detectOS: !0,
        detectBrowser: !0,
        detectPlugins: !0,
      },
      d = [
        {
          name: "adobereader",
          substrs: ["Adobe", "Acrobat"],
          progIds: ["AcroPDF.PDF", "PDF.PDFCtrl.5"],
        },
        {
          name: "flash",
          substrs: ["Shockwave Flash"],
          progIds: ["ShockwaveFlash.ShockwaveFlash.1"],
        },
        {
          name: "wmplayer",
          substrs: ["Windows Media"],
          progIds: ["wmplayer.ocx"],
        },
        {
          name: "silverlight",
          substrs: ["Silverlight"],
          progIds: ["AgControl.AgControl"],
        },
        {
          name: "quicktime",
          substrs: ["QuickTime"],
          progIds: ["QuickTime.QuickTime"],
        },
      ],
      u = /[\t\r\n]/g,
      p = n.documentElement;
    function m(e) {
      return a.browser.userAgent.indexOf(e) > -1;
    }
    function f(e) {
      return e.test(a.browser.userAgent);
    }
    function g(e) {
      return e.exec(a.browser.userAgent);
    }
    function h(e) {
      return null === e || e === r
        ? ""
        : String(e).replace(/((\s|\-|\.)+[a-z0-9])/g, function (e) {
            return e.toUpperCase().replace(/(\s|\-|\.)/g, "");
          });
    }
    function v(e, t, n) {
      e &&
        ((e = h(e)), t && (y(e + (t = h(t)), !0), n && y(e + t + "_" + n, !0)));
    }
    function y(e, t) {
      e &&
        s &&
        (l.addAllFeaturesAsClass
          ? s.addTest(e, t)
          : (t = "function" == typeof t ? t() : t)
          ? s.addTest(e, !0)
          : (delete s[e],
            (function (e, t) {
              var n = t || "",
                r =
                  1 === e.nodeType &&
                  (e.className
                    ? (" " + e.className + " ").replace(u, " ")
                    : "");
              if (r) {
                for (; r.indexOf(" " + n + " ") >= 0; )
                  r = r.replace(" " + n + " ", " ");
                e.className = t
                  ? (function (e) {
                      return e.replace(/^\s+|\s+$/g, "");
                    })(r)
                  : "";
              }
            })(p, e)));
    }
    function b(e, t) {
      e.version = t;
      var n = t.split(".");
      n.length > 0
        ? ((n = n.reverse()),
          (e.major = n.pop()),
          n.length > 0
            ? ((e.minor = n.pop()),
              n.length > 0
                ? ((n = n.reverse()), (e.patch = n.join(".")))
                : (e.patch = "0"))
            : (e.minor = "0"))
        : (e.major = "0");
    }
    function w() {
      e.clearTimeout(o),
        (o = e.setTimeout(function () {
          (i = a.device.orientation),
            e.innerHeight > e.innerWidth
              ? (a.device.orientation = "portrait")
              : (a.device.orientation = "landscape"),
            y(a.device.orientation, !0),
            i !== a.device.orientation && y(i, !1);
        }, 10));
    }
    function x(e) {
      var n,
        r,
        o,
        i,
        a,
        s = t.plugins;
      for (i = s.length - 1; i >= 0; i--) {
        for (
          r = (n = s[i]).name + n.description, o = 0, a = e.length;
          a >= 0;
          a--
        )
          -1 !== r.indexOf(e[a]) && (o += 1);
        if (o === e.length) return !0;
      }
      return !1;
    }
    function k(e) {
      var t;
      for (t = e.length - 1; t >= 0; t--)
        try {
          new ActiveXObject(e[t]);
        } catch (e) {}
      return !1;
    }
    function E(r) {
      var o, i, u, p, E, S, C;
      if (
        (l = (function e(t, n) {
          var r, o, i;
          if (arguments.length > 2)
            for (r = 1, o = arguments.length; r < o; r += 1) e(t, arguments[r]);
          else for (i in n) n.hasOwnProperty(i) && (t[i] = n[i]);
          return t;
        })({}, l, r || {})).detectDevice
      ) {
        for (
          a.device = { type: "", model: "", orientation: "" },
            u = a.device,
            f(
              /googletv|smarttv|smart-tv|internet.tv|netcast|nettv|appletv|boxee|kylo|roku|dlnadoc|roku|pov_tv|hbbtv|ce\-html/
            )
              ? ((u.type = c[0]), (u.model = "smartTv"))
              : f(/xbox|playstation.3|wii/)
              ? ((u.type = c[0]), (u.model = "gameConsole"))
              : f(/ip(a|ro)d/)
              ? ((u.type = c[1]), (u.model = "ipad"))
              : (f(/tablet/) && !f(/rx-34/) && !f(/shield/)) || f(/folio/)
              ? ((u.type = c[1]), (u.model = String(g(/playbook/) || "")))
              : f(/linux/) &&
                f(/android/) &&
                !f(/fennec|mobi|htc.magic|htcX06ht|nexus.one|sc-02b|fone.945/)
              ? ((u.type = c[1]), (u.model = "android"))
              : f(/kindle/) || (f(/mac.os/) && f(/silk/))
              ? ((u.type = c[1]), (u.model = "kindle"))
              : f(
                  /gt-p10|sc-01c|shw-m180s|sgh-t849|sch-i800|shw-m180l|sph-p100|sgh-i987|zt180|htc(.flyer|\_flyer)|sprint.atp51|viewpad7|pandigital(sprnova|nova)|ideos.s7|dell.streak.7|advent.vega|a101it|a70bht|mid7015|next2|nook/
                ) ||
                (f(/mb511/) && f(/rutem/))
              ? ((u.type = c[1]), (u.model = "android"))
              : f(/bb10/)
              ? ((u.type = c[2]), (u.model = "blackberry"))
              : ((u.model = g(
                  /iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec|j2me/
                )),
                null !== u.model
                  ? ((u.type = c[2]), (u.model = String(u.model)))
                  : ((u.model = ""),
                    f(
                      /bolt|fennec|iris|maemo|minimo|mobi|mowser|netfront|novarra|prism|rx-34|skyfire|tear|xv6875|xv6975|google.wireless.transcoder/
                    )
                      ? (u.type = c[2])
                      : f(/opera/) &&
                        f(/windows.nt.5/) &&
                        f(
                          /htc|xda|mini|vario|samsung\-gt\-i8000|samsung\-sgh\-i9/
                        )
                      ? (u.type = c[2])
                      : "MacIntel" === t.platform && t.maxTouchPoints > 1
                      ? (u.type = c[1])
                      : (f(/windows.(nt|xp|me|9)/) && !f(/phone/)) ||
                        f(/win(9|.9|nt)/) ||
                        f(/\(windows 8\)/)
                      ? (u.type = c[3])
                      : f(/macintosh|powerpc/) && !f(/silk/)
                      ? ((u.type = c[3]), (u.model = "mac"))
                      : f(/linux/) && f(/x11/)
                      ? (u.type = c[3])
                      : f(/solaris|sunos|bsd/)
                      ? (u.type = c[3])
                      : f(/cros/)
                      ? (u.type = c[3])
                      : f(
                          /bot|crawler|spider|yahoo|ia_archiver|covario-ids|findlinks|dataparksearch|larbin|mediapartners-google|ng-search|snappy|teoma|jeeves|tineye/
                        ) && !f(/mobile/)
                      ? ((u.type = c[3]), (u.model = "crawler"))
                      : (u.type = c[2]))),
            o = 0,
            i = c.length;
          o < i;
          o += 1
        )
          y(c[o], u.type === c[o]);
        l.detectDeviceModel && y(h(u.model), !0);
      }
      if (
        (l.detectScreen &&
          ((u.screen = {}),
          s &&
            s.mq &&
            (s.mq("only screen and (max-width: 240px)")
              ? ((u.screen.size = "veryVerySmall"),
                y("veryVerySmallScreen", !0))
              : s.mq("only screen and (max-width: 320px)")
              ? ((u.screen.size = "verySmall"), y("verySmallScreen", !0))
              : s.mq("only screen and (max-width: 480px)") &&
                ((u.screen.size = "small"), y("smallScreen", !0)),
            (u.type !== c[1] && u.type !== c[2]) ||
              (s.mq(
                "only screen and (-moz-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)"
              ) &&
                ((u.screen.resolution = "high"), y("highresolution", !0)))),
          (e.onresize = function (e) {
            w();
          }),
          w()),
        l.detectOS &&
          ((a.os = {}),
          (p = a.os),
          "" !== u.model &&
            ("ipad" === u.model || "iphone" === u.model || "ipod" === u.model
              ? ((p.name = "ios"),
                b(p, (f(/os\s([\d_]+)/) ? RegExp.$1 : "").replace(/_/g, ".")))
              : "android" === u.model
              ? ((p.name = "android"),
                b(p, f(/android\s([\d\.]+)/) ? RegExp.$1 : ""))
              : "blackberry" === u.model
              ? ((p.name = "blackberry"),
                b(p, f(/version\/([^\s]+)/) ? RegExp.$1 : ""))
              : "playbook" === u.model &&
                ((p.name = "blackberry"),
                b(p, f(/os ([^\s]+)/) ? RegExp.$1.replace(";", "") : ""))),
          p.name ||
            (m("win") || m("16bit")
              ? ((p.name = "windows"),
                m("windows nt 10")
                  ? b(p, "10")
                  : m("windows nt 6.3")
                  ? b(p, "8.1")
                  : m("windows nt 6.2") || f(/\(windows 8\)/)
                  ? b(p, "8")
                  : m("windows nt 6.1")
                  ? b(p, "7")
                  : m("windows nt 6.0")
                  ? b(p, "vista")
                  : m("windows nt 5.2") ||
                    m("windows nt 5.1") ||
                    m("windows xp")
                  ? b(p, "xp")
                  : m("windows nt 5.0") || m("windows 2000")
                  ? b(p, "2k")
                  : m("winnt") || m("windows nt")
                  ? b(p, "nt")
                  : m("win98") || m("windows 98")
                  ? b(p, "98")
                  : (m("win95") || m("windows 95")) && b(p, "95"))
              : m("mac") || m("darwin")
              ? ((p.name = "mac os"),
                m("68k") || m("68000")
                  ? b(p, "68k")
                  : m("ppc") || m("powerpc")
                  ? b(p, "ppc")
                  : m("os x") &&
                    b(
                      p,
                      (f(/os\sx\s([\d_]+)/) ? RegExp.$1 : "os x").replace(
                        /_/g,
                        "."
                      )
                    ))
              : m("webtv")
              ? (p.name = "webtv")
              : m("x11") || m("inux")
              ? (p.name = "linux")
              : m("sunos")
              ? (p.name = "sun")
              : m("irix")
              ? (p.name = "irix")
              : m("freebsd")
              ? (p.name = "freebsd")
              : m("bsd") && (p.name = "bsd")),
          p.name &&
            (y(p.name, !0),
            p.major &&
              (v(p.name, p.major), p.minor && v(p.name, p.major, p.minor))),
          f(/\sx64|\sx86|\swin64|\swow64|\samd64/)
            ? (p.addressRegisterSize = "64bit")
            : (p.addressRegisterSize = "32bit"),
          y(p.addressRegisterSize, !0)),
        l.detectBrowser &&
          ((E = a.browser),
          f(/opera|webtv/) || (!f(/msie\s([\d\w\.]+)/) && !m("trident"))
            ? m("firefox")
              ? ((E.engine = "gecko"),
                (E.name = "firefox"),
                b(E, f(/firefox\/([\d\w\.]+)/) ? RegExp.$1 : ""))
              : m("gecko/")
              ? (E.engine = "gecko")
              : m("opera")
              ? ((E.name = "opera"),
                (E.engine = "presto"),
                b(
                  E,
                  f(/version\/([\d\.]+)/)
                    ? RegExp.$1
                    : f(/opera(\s|\/)([\d\.]+)/)
                    ? RegExp.$2
                    : ""
                ))
              : m("konqueror")
              ? (E.name = "konqueror")
              : m("edge")
              ? ((E.engine = "webkit"),
                (E.name = "edge"),
                b(E, f(/edge\/([\d\.]+)/) ? RegExp.$1 : ""))
              : m("chrome")
              ? ((E.engine = "webkit"),
                (E.name = "chrome"),
                b(E, f(/chrome\/([\d\.]+)/) ? RegExp.$1 : ""))
              : m("iron")
              ? ((E.engine = "webkit"), (E.name = "iron"))
              : m("crios")
              ? ((E.name = "chrome"),
                (E.engine = "webkit"),
                b(E, f(/crios\/([\d\.]+)/) ? RegExp.$1 : ""))
              : m("applewebkit/")
              ? ((E.name = "safari"),
                (E.engine = "webkit"),
                b(E, f(/version\/([\d\.]+)/) ? RegExp.$1 : ""))
              : m("mozilla/") && (E.engine = "gecko")
            : ((E.engine = "trident"),
              (E.name = "ie"),
              !e.addEventListener && n.documentMode && 7 === n.documentMode
                ? b(E, "8.compat")
                : f(/trident.*rv[ :](\d+)\./)
                ? b(E, RegExp.$1)
                : b(E, f(/trident\/4\.0/) ? "8" : RegExp.$1)),
          E.name &&
            (y(E.name, !0),
            E.major &&
              (v(E.name, E.major), E.minor && v(E.name, E.major, E.minor))),
          y(E.engine, !0),
          (E.language = t.userLanguage || t.language),
          y(E.language, !0)),
        l.detectPlugins)
      ) {
        for (E.plugins = [], o = d.length - 1; o >= 0; o--)
          (S = d[o]),
            (C = !1),
            e.ActiveXObject
              ? (C = k(S.progIds))
              : t.plugins && (C = x(S.substrs)),
            C && (E.plugins.push(S.name), y(S.name, !0));
        "function" == typeof t.javaEnabled &&
          t.javaEnabled() &&
          (E.plugins.push("java"), y("java", !0));
      }
    }
    return (
      (a.detect = function (e) {
        return E(e);
      }),
      (a.init = function () {
        a !== r &&
          ((a.browser = {
            userAgent: (t.userAgent || t.vendor || e.opera || "").toLowerCase(),
          }),
          a.detect());
      }),
      a.init(),
      a
    );
  })(this, this.navigator, this.document));
