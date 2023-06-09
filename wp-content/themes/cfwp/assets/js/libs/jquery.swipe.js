!(function (e) {
  "function" == typeof define && define.amd && define.amd.jQuery
    ? define(["jquery"], e)
    : "undefined" != typeof module && module.exports
    ? e(require("jquery"))
    : e(jQuery);
})(function (e) {
  "use strict";
  var t = "left",
    n = "right",
    r = "up",
    i = "down",
    l = "in",
    o = "out",
    a = "none",
    u = "auto",
    s = "swipe",
    c = "pinch",
    p = "tap",
    f = "doubletap",
    h = "longtap",
    g = "horizontal",
    d = "vertical",
    w = "all",
    v = 10,
    T = "start",
    y = "move",
    E = "end",
    m = "cancel",
    x = "ontouchstart" in window,
    b = window.navigator.msPointerEnabled && !window.PointerEvent && !x,
    S = (window.PointerEvent || window.navigator.msPointerEnabled) && !x,
    O = "TouchSwipe";
  function M(M, P) {
    P = e.extend({}, P);
    var D = x || S || !P.fallbackToMouseEvents,
      L = D
        ? S
          ? b
            ? "MSPointerDown"
            : "pointerdown"
          : "touchstart"
        : "mousedown",
      R = D
        ? S
          ? b
            ? "MSPointerMove"
            : "pointermove"
          : "touchmove"
        : "mousemove",
      k = D ? (S ? (b ? "MSPointerUp" : "pointerup") : "touchend") : "mouseup",
      A = D ? (S ? "mouseleave" : null) : "mouseleave",
      I = S ? (b ? "MSPointerCancel" : "pointercancel") : "touchcancel",
      U = 0,
      j = null,
      N = null,
      H = 0,
      _ = 0,
      q = 0,
      Q = 1,
      C = 0,
      F = 0,
      X = null,
      Y = e(M),
      V = "start",
      W = 0,
      z = {},
      G = 0,
      Z = 0,
      B = 0,
      J = 0,
      K = 0,
      $ = null,
      ee = null;
    try {
      Y.on(L, te), Y.on(I, ie);
    } catch (t) {
      e.error("events not supported " + L + "," + I + " on jQuery.swipe");
    }
    function te(l) {
      if (
        !0 !== Y.data(O + "_intouch") &&
        !(e(l.target).closest(P.excludedElements, Y).length > 0)
      ) {
        var o = l.originalEvent ? l.originalEvent : l;
        if (
          !o.pointerType ||
          "mouse" != o.pointerType ||
          0 != P.fallbackToMouseEvents
        ) {
          var a,
            u,
            s = o.touches,
            c = s ? s[0] : o;
          return (
            (V = T),
            s
              ? (W = s.length)
              : !1 !== P.preventDefaultEvents && l.preventDefault(),
            (U = 0),
            (j = null),
            (N = null),
            (F = null),
            (H = 0),
            (_ = 0),
            (q = 0),
            (Q = 1),
            (C = 0),
            ((u = {})[t] = De(t)),
            (u[n] = De(n)),
            (u[r] = De(r)),
            (u[i] = De(i)),
            (X = u),
            xe(),
            Oe(0, c),
            !s || W === P.fingers || P.fingers === w || ge()
              ? ((G = Ae()),
                2 == W && (Oe(1, s[1]), (_ = q = Re(z[0].start, z[1].start))),
                (P.swipeStatus || P.pinchStatus) && (a = ue(o, V)))
              : (a = !1),
            !1 === a
              ? (ue(o, (V = m)), a)
              : (P.hold &&
                  (ee = setTimeout(
                    e.proxy(function () {
                      Y.trigger("hold", [o.target]),
                        P.hold && (a = P.hold.call(Y, o, o.target));
                    }, this),
                    P.longTapThreshold
                  )),
                Se(!0),
                null)
          );
        }
      }
    }
    function ne(s) {
      var c = s.originalEvent ? s.originalEvent : s;
      if (V !== E && V !== m && !be()) {
        var p,
          f,
          h,
          v,
          T,
          x = c.touches,
          b = Me(x ? x[0] : c);
        if (
          ((Z = Ae()),
          x && (W = x.length),
          P.hold && clearTimeout(ee),
          (V = y),
          2 == W &&
            (0 == _
              ? (Oe(1, x[1]), (_ = q = Re(z[0].start, z[1].start)))
              : (Me(x[1]),
                (q = Re(z[0].end, z[1].end)),
                z[0].end,
                z[1].end,
                (F = Q < 1 ? o : l)),
            (Q = ((q / _) * 1).toFixed(2)),
            (C = Math.abs(_ - q))),
          W === P.fingers || P.fingers === w || !x || ge())
        ) {
          if (
            ((j = ke(b.start, b.end)),
            (function (e, l) {
              if (!1 === P.preventDefaultEvents) return;
              if (P.allowPageScroll === a) e.preventDefault();
              else {
                var o = P.allowPageScroll === u;
                switch (l) {
                  case t:
                    ((P.swipeLeft && o) || (!o && P.allowPageScroll != g)) &&
                      e.preventDefault();
                    break;
                  case n:
                    ((P.swipeRight && o) || (!o && P.allowPageScroll != g)) &&
                      e.preventDefault();
                    break;
                  case r:
                    ((P.swipeUp && o) || (!o && P.allowPageScroll != d)) &&
                      e.preventDefault();
                    break;
                  case i:
                    ((P.swipeDown && o) || (!o && P.allowPageScroll != d)) &&
                      e.preventDefault();
                }
              }
            })(s, (N = ke(b.last, b.end))),
            (v = b.start),
            (T = b.end),
            (U = Math.round(
              Math.sqrt(Math.pow(T.x - v.x, 2) + Math.pow(T.y - v.y, 2))
            )),
            (H = Le()),
            (function (e, t) {
              if (e == a) return;
              (t = Math.max(t, Pe(e))), (X[e].distance = t);
            })(j, U),
            (p = ue(c, V)),
            !P.triggerOnTouchEnd || P.triggerOnTouchLeave)
          ) {
            var S = !0;
            if (P.triggerOnTouchLeave) {
              var O = {
                left: (h = (f = e((f = this))).offset()).left,
                right: h.left + f.outerWidth(),
                top: h.top,
                bottom: h.top + f.outerHeight(),
              };
              S = (function (e, t) {
                return (
                  e.x > t.left && e.x < t.right && e.y > t.top && e.y < t.bottom
                );
              })(b.end, O);
            }
            !P.triggerOnTouchEnd && S
              ? (V = ae(y))
              : P.triggerOnTouchLeave && !S && (V = ae(E)),
              (V != m && V != E) || ue(c, V);
          }
        } else ue(c, (V = m));
        !1 === p && ue(c, (V = m));
      }
    }
    function re(e) {
      var t = e.originalEvent ? e.originalEvent : e,
        n = t.touches;
      if (n) {
        if (n.length && !be())
          return (
            (function (e) {
              (B = Ae()), (J = e.touches.length + 1);
            })(t),
            !0
          );
        if (n.length && be()) return !0;
      }
      return (
        be() && (W = J),
        (Z = Ae()),
        (H = Le()),
        pe() || !ce()
          ? ue(t, (V = m))
          : P.triggerOnTouchEnd || (!1 === P.triggerOnTouchEnd && V === y)
          ? (!1 !== P.preventDefaultEvents &&
              !1 !== e.cancelable &&
              e.preventDefault(),
            ue(t, (V = E)))
          : !P.triggerOnTouchEnd && ye()
          ? se(t, (V = E), p)
          : V === y && ue(t, (V = m)),
        Se(!1),
        null
      );
    }
    function ie() {
      (W = 0), (Z = 0), (G = 0), (_ = 0), (q = 0), (Q = 1), xe(), Se(!1);
    }
    function le(e) {
      var t = e.originalEvent ? e.originalEvent : e;
      P.triggerOnTouchLeave && ue(t, (V = ae(E)));
    }
    function oe() {
      Y.off(L, te),
        Y.off(I, ie),
        Y.off(R, ne),
        Y.off(k, re),
        A && Y.off(A, le),
        Se(!1);
    }
    function ae(e) {
      var t = e,
        n = fe(),
        r = ce(),
        i = pe();
      return (
        !n || i
          ? (t = m)
          : !r || e != y || (P.triggerOnTouchEnd && !P.triggerOnTouchLeave)
          ? !r && e == E && P.triggerOnTouchLeave && (t = m)
          : (t = E),
        t
      );
    }
    function ue(e, t) {
      var n,
        r = e.touches;
      return (
        ((de() && we()) || we()) && (n = se(e, t, s)),
        ((he() && ge()) || ge()) && !1 !== n && (n = se(e, t, c)),
        me() && Ee() && !1 !== n
          ? (n = se(e, t, f))
          : H > P.longTapThreshold && U < v && P.longTap && !1 !== n
          ? (n = se(e, t, h))
          : (1 !== W && x) ||
            !(isNaN(U) || U < P.threshold) ||
            !ye() ||
            !1 === n ||
            (n = se(e, t, p)),
        t === m && ie(),
        t === E && ((r && r.length) || ie()),
        n
      );
    }
    function se(a, u, g) {
      var d;
      if (g == s) {
        if (
          (Y.trigger("swipeStatus", [u, j || null, U || 0, H || 0, W, z, N]),
          P.swipeStatus &&
            !1 ===
              (d = P.swipeStatus.call(
                Y,
                a,
                u,
                j || null,
                U || 0,
                H || 0,
                W,
                z,
                N
              )))
        )
          return !1;
        if (u == E && de()) {
          if (
            (clearTimeout($),
            clearTimeout(ee),
            Y.trigger("swipe", [j, U, H, W, z, N]),
            P.swipe && !1 === (d = P.swipe.call(Y, a, j, U, H, W, z, N)))
          )
            return !1;
          switch (j) {
            case t:
              Y.trigger("swipeLeft", [j, U, H, W, z, N]),
                P.swipeLeft && (d = P.swipeLeft.call(Y, a, j, U, H, W, z, N));
              break;
            case n:
              Y.trigger("swipeRight", [j, U, H, W, z, N]),
                P.swipeRight && (d = P.swipeRight.call(Y, a, j, U, H, W, z, N));
              break;
            case r:
              Y.trigger("swipeUp", [j, U, H, W, z, N]),
                P.swipeUp && (d = P.swipeUp.call(Y, a, j, U, H, W, z, N));
              break;
            case i:
              Y.trigger("swipeDown", [j, U, H, W, z, N]),
                P.swipeDown && (d = P.swipeDown.call(Y, a, j, U, H, W, z, N));
          }
        }
      }
      if (g == c) {
        if (
          (Y.trigger("pinchStatus", [u, F || null, C || 0, H || 0, W, Q, z]),
          P.pinchStatus &&
            !1 ===
              (d = P.pinchStatus.call(
                Y,
                a,
                u,
                F || null,
                C || 0,
                H || 0,
                W,
                Q,
                z
              )))
        )
          return !1;
        if (u == E && he())
          switch (F) {
            case l:
              Y.trigger("pinchIn", [F || null, C || 0, H || 0, W, Q, z]),
                P.pinchIn &&
                  (d = P.pinchIn.call(
                    Y,
                    a,
                    F || null,
                    C || 0,
                    H || 0,
                    W,
                    Q,
                    z
                  ));
              break;
            case o:
              Y.trigger("pinchOut", [F || null, C || 0, H || 0, W, Q, z]),
                P.pinchOut &&
                  (d = P.pinchOut.call(
                    Y,
                    a,
                    F || null,
                    C || 0,
                    H || 0,
                    W,
                    Q,
                    z
                  ));
          }
      }
      return (
        g == p
          ? (u !== m && u !== E) ||
            (clearTimeout($),
            clearTimeout(ee),
            Ee() && !me()
              ? ((K = Ae()),
                ($ = setTimeout(
                  e.proxy(function () {
                    (K = null),
                      Y.trigger("tap", [a.target]),
                      P.tap && (d = P.tap.call(Y, a, a.target));
                  }, this),
                  P.doubleTapThreshold
                )))
              : ((K = null),
                Y.trigger("tap", [a.target]),
                P.tap && (d = P.tap.call(Y, a, a.target))))
          : g == f
          ? (u !== m && u !== E) ||
            (clearTimeout($),
            clearTimeout(ee),
            (K = null),
            Y.trigger("doubletap", [a.target]),
            P.doubleTap && (d = P.doubleTap.call(Y, a, a.target)))
          : g == h &&
            ((u !== m && u !== E) ||
              (clearTimeout($),
              (K = null),
              Y.trigger("longtap", [a.target]),
              P.longTap && (d = P.longTap.call(Y, a, a.target)))),
        d
      );
    }
    function ce() {
      var e = !0;
      return null !== P.threshold && (e = U >= P.threshold), e;
    }
    function pe() {
      var e = !1;
      return (
        null !== P.cancelThreshold &&
          null !== j &&
          (e = Pe(j) - U >= P.cancelThreshold),
        e
      );
    }
    function fe() {
      return !P.maxTimeThreshold || !(H >= P.maxTimeThreshold);
    }
    function he() {
      var e = ve(),
        t = Te(),
        n = null === P.pinchThreshold || C >= P.pinchThreshold;
      return e && t && n;
    }
    function ge() {
      return !!(P.pinchStatus || P.pinchIn || P.pinchOut);
    }
    function de() {
      var e = fe(),
        t = ce(),
        n = ve(),
        r = Te();
      return !pe() && r && n && t && e;
    }
    function we() {
      return !!(
        P.swipe ||
        P.swipeStatus ||
        P.swipeLeft ||
        P.swipeRight ||
        P.swipeUp ||
        P.swipeDown
      );
    }
    function ve() {
      return W === P.fingers || P.fingers === w || !x;
    }
    function Te() {
      return 0 !== z[0].end.x;
    }
    function ye() {
      return !!P.tap;
    }
    function Ee() {
      return !!P.doubleTap;
    }
    function me() {
      if (null == K) return !1;
      var e = Ae();
      return Ee() && e - K <= P.doubleTapThreshold;
    }
    function xe() {
      (B = 0), (J = 0);
    }
    function be() {
      var e = !1;
      B && Ae() - B <= P.fingerReleaseThreshold && (e = !0);
      return e;
    }
    function Se(e) {
      Y &&
        (!0 === e
          ? (Y.on(R, ne), Y.on(k, re), A && Y.on(A, le))
          : (Y.off(R, ne, !1), Y.off(k, re, !1), A && Y.off(A, le, !1)),
        Y.data(O + "_intouch", !0 === e));
    }
    function Oe(e, t) {
      var n = {
        start: { x: 0, y: 0 },
        last: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
      };
      return (
        (n.start.x = n.last.x = n.end.x = t.pageX || t.clientX),
        (n.start.y = n.last.y = n.end.y = t.pageY || t.clientY),
        (z[e] = n),
        n
      );
    }
    function Me(e) {
      var t = void 0 !== e.identifier ? e.identifier : 0,
        n = (function (e) {
          return z[e] || null;
        })(t);
      return (
        null === n && (n = Oe(t, e)),
        (n.last.x = n.end.x),
        (n.last.y = n.end.y),
        (n.end.x = e.pageX || e.clientX),
        (n.end.y = e.pageY || e.clientY),
        n
      );
    }
    function Pe(e) {
      if (X[e]) return X[e].distance;
    }
    function De(e) {
      return { direction: e, distance: 0 };
    }
    function Le() {
      return Z - G;
    }
    function Re(e, t) {
      var n = Math.abs(e.x - t.x),
        r = Math.abs(e.y - t.y);
      return Math.round(Math.sqrt(n * n + r * r));
    }
    function ke(e, l) {
      if (((u = l), (o = e).x == u.x && o.y == u.y)) return a;
      var o,
        u,
        s = (function (e, t) {
          var n = e.x - t.x,
            r = t.y - e.y,
            i = Math.atan2(r, n),
            l = Math.round((180 * i) / Math.PI);
          return l < 0 && (l = 360 - Math.abs(l)), l;
        })(e, l);
      return s <= 45 && s >= 0
        ? t
        : s <= 360 && s >= 315
        ? t
        : s >= 135 && s <= 225
        ? n
        : s > 45 && s < 135
        ? i
        : r;
    }
    function Ae() {
      return new Date().getTime();
    }
    (this.enable = function () {
      return this.disable(), Y.on(L, te), Y.on(I, ie), Y;
    }),
      (this.disable = function () {
        return oe(), Y;
      }),
      (this.destroy = function () {
        oe(), Y.data(O, null), (Y = null);
      }),
      (this.option = function (t, n) {
        if ("object" == typeof t) P = e.extend(P, t);
        else if (void 0 !== P[t]) {
          if (void 0 === n) return P[t];
          P[t] = n;
        } else {
          if (!t) return P;
          e.error("Option " + t + " does not exist on jQuery.swipe.options");
        }
        return null;
      });
  }
  (e.fn.swipe = function (t) {
    var n = e(this),
      r = n.data(O);
    if (r && "string" == typeof t) {
      if (r[t]) return r[t].apply(r, Array.prototype.slice.call(arguments, 1));
      e.error("Method " + t + " does not exist on jQuery.swipe");
    } else if (r && "object" == typeof t) r.option.apply(r, arguments);
    else if (!(r || ("object" != typeof t && t)))
      return function (t) {
        !t ||
          void 0 !== t.allowPageScroll ||
          (void 0 === t.swipe && void 0 === t.swipeStatus) ||
          (t.allowPageScroll = a);
        void 0 !== t.click && void 0 === t.tap && (t.tap = t.click);
        t || (t = {});
        return (
          (t = e.extend({}, e.fn.swipe.defaults, t)),
          this.each(function () {
            var n = e(this),
              r = n.data(O);
            r || ((r = new M(this, t)), n.data(O, r));
          })
        );
      }.apply(this, arguments);
    return n;
  }),
    (e.fn.swipe.version = "1.6.18"),
    (e.fn.swipe.defaults = {
      fingers: 1,
      threshold: 75,
      cancelThreshold: null,
      pinchThreshold: 20,
      maxTimeThreshold: null,
      fingerReleaseThreshold: 250,
      longTapThreshold: 500,
      doubleTapThreshold: 200,
      swipe: null,
      swipeLeft: null,
      swipeRight: null,
      swipeUp: null,
      swipeDown: null,
      swipeStatus: null,
      pinchIn: null,
      pinchOut: null,
      pinchStatus: null,
      click: null,
      tap: null,
      doubleTap: null,
      longTap: null,
      hold: null,
      triggerOnTouchEnd: !0,
      triggerOnTouchLeave: !1,
      allowPageScroll: "auto",
      fallbackToMouseEvents: !0,
      excludedElements: ".noSwipe",
      preventDefaultEvents: !1,
    }),
    (e.fn.swipe.phases = {
      PHASE_START: T,
      PHASE_MOVE: y,
      PHASE_END: E,
      PHASE_CANCEL: m,
    }),
    (e.fn.swipe.directions = {
      LEFT: t,
      RIGHT: n,
      UP: r,
      DOWN: i,
      IN: l,
      OUT: o,
    }),
    (e.fn.swipe.pageScroll = { NONE: a, HORIZONTAL: g, VERTICAL: d, AUTO: u }),
    (e.fn.swipe.fingers = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
      ALL: w,
    });
});
