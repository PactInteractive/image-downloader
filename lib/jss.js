var jss = (function () {
  function e(e) {
    for (
      var t = e.cssRules || e.rules || [], r = {}, n = 0;
      n < t.length;
      n++
    ) {
      var s = u(t[n].selectorText);
      r[s] || (r[s] = []), r[s].push({ sheet: e, index: n, style: t[n].style });
    }
    return r;
  }
  function t(e, t) {
    var r = e.cssRules || e.rules || [],
      n = [];
    t = t.toLowerCase();
    for (var s = 0; s < r.length; s++) {
      var u = r[s].selectorText;
      !u ||
        (u != t && u != f(t) && u != c(t)) ||
        n.push({ sheet: e, index: s, style: r[s].style });
    }
    return n;
  }
  function r(e, t) {
    var r = e.cssRules || e.rules || [],
      u = r.length,
      i = s(e, t, r, u);
    return i || n(e, t, u), { sheet: e, index: u, style: r[u].style };
  }
  function n(e, t, r) {
    e.insertRule ? e.insertRule(t + ' { }', r) : e.addRule(t, null, r);
  }
  function s(e, t, r, s) {
    var o, h;
    if (x.exec(t)) (o = t), (h = i(t));
    else {
      if (!S.exec(t)) return !1;
      (o = u(t)), (h = t);
    }
    return p || (n(e, o, s), r.length <= s && (p = !0)), p && n(e, h, s), !0;
  }
  function u(e) {
    return e.replace(S, function (e, t, r, n) {
      return t + '::' + n;
    });
  }
  function i(e) {
    return e.replace(x, function (e, t, r) {
      return ':' + r;
    });
  }
  function o(e) {
    var t = e.sheet;
    t.deleteRule
      ? t.deleteRule(e.index)
      : t.removeRule && t.removeRule(e.index);
  }
  function h(e, t) {
    for (var r in t) t.hasOwnProperty(r) && (e[r] = t[r]);
    return e;
  }
  function l(e) {
    for (var t = {}, r = 0; r < e.length; r++) h(t, a(e[r].style));
    return t;
  }
  function a(e) {
    for (var t = {}, r = 0; r < e.length; r++) t[e[r]] = e[v(e[r])];
    return t;
  }
  function f(e) {
    for (var t = '', r = 0; null != (match = y.exec(e)) && '' !== match[0]; )
      (t += e.substring(r, match.index)),
        (t += e.substr(match.index + match[1].length, match[2].length)),
        (t += e.substr(match.index, match[1].length)),
        (r = match.index + match[0].length);
    return (t += e.substr(r));
  }
  function c(e) {
    return x.exec(e) ? i(e) : e;
  }
  function d(e, t) {
    for (var r in t) {
      var n = t[r],
        s = n.indexOf(' !important');
      e.style.removeProperty(r),
        s > 0
          ? e.style.setProperty(r, n.substr(0, s), 'important')
          : e.style.setProperty(r, n);
    }
  }
  function v(e) {
    return e.replace(/-([a-z])/g, function (e, t) {
      return t.toUpperCase();
    });
  }
  function m(e) {
    var t = {};
    for (var r in e) t[g(r)] = e[r];
    return t;
  }
  function g(e) {
    return e.replace(/([A-Z])/g, function (e, t) {
      return '-' + t.toLowerCase();
    });
  }
  var p,
    y = /((?:\.|#)[^\.\s#]+)((?:\.|#)[^\.\s#]+)/g,
    x = /(::)(before|after|first-line|first-letter|selection)/,
    S = /([^:])(:)(before|after|first-line|first-letter|selection)/,
    R = function (e) {
      (this.doc = e),
        (this.head = this.doc.head || this.doc.getElementsByTagName('head')[0]),
        (this.sheets = this.doc.styleSheets || []);
    };
  R.prototype = {
    get: function (r) {
      if (!this.defaultSheet) return {};
      if (r) return l(t(this.defaultSheet, r));
      var n = e(this.defaultSheet);
      for (r in n) n[r] = l(n[r]);
      return n;
    },
    getAll: function (e) {
      for (var r = {}, n = 0; n < this.sheets.length; n++)
        h(r, l(t(this.sheets[n], e)));
      return r;
    },
    set: function (e, n) {
      this.defaultSheet || (this.defaultSheet = this._createSheet()),
        (n = m(n));
      var s = t(this.defaultSheet, e);
      s.length || (s = [r(this.defaultSheet, e)]);
      for (var u = 0; u < s.length; u++) d(s[u], n);
    },
    remove: function (e) {
      if (this.defaultSheet) {
        if (!e)
          return (
            this._removeSheet(this.defaultSheet), void delete this.defaultSheet
          );
        for (var r = t(this.defaultSheet, e), n = 0; n < r.length; n++) o(r[n]);
        return r.length;
      }
    },
    _createSheet: function () {
      var e = this.doc.createElement('style');
      return (
        (e.type = 'text/css'),
        (e.rel = 'stylesheet'),
        this.head.appendChild(e),
        e.sheet
      );
    },
    _removeSheet: function (e) {
      var t = e.ownerNode;
      t.parentNode.removeChild(t);
    },
  };
  var b = new R(document);
  return (
    (b.forDocument = function (e) {
      return new R(e);
    }),
    b
  );
})();
'undefined' != typeof module && module.exports && (module.exports = jss);
