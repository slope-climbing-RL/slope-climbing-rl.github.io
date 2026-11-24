// Project page behaviour: play-when-visible clips, slope tabs, BibTeX copy.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function playIfAllowed(video) {
    if (reduceMotion) return;
    var p = video.play();
    if (p && typeof p.catch === "function") p.catch(function () { video.setAttribute("controls", ""); });
  }

  // Clips carry a real src, preload="none" and native controls, so the page works without JavaScript.
  // With JavaScript the clips play while visible and pause otherwise, and the controls are hidden.
  var clips = Array.prototype.slice.call(document.querySelectorAll("video[data-autoplay]"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    clips.forEach(function (v) { v.removeAttribute("controls"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.35) {
          playIfAllowed(v);
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: [0, 0.35, 0.75] });
    clips.forEach(function (v) { io.observe(v); });
  }

  // Slope tabs (WAI-ARIA tabs pattern with arrow-key navigation).
  Array.prototype.forEach.call(document.querySelectorAll("[data-tabs]"), function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) {
          panels[k].hidden = !on;
          if (!on) {
            Array.prototype.forEach.call(panels[k].querySelectorAll("video"), function (v) {
              if (!v.paused) v.pause();
            });
          }
        }
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (ev) {
        var n = tabs.length, j = null;
        if (ev.key === "ArrowRight") j = (i + 1) % n;
        else if (ev.key === "ArrowLeft") j = (i - 1 + n) % n;
        else if (ev.key === "Home") j = 0;
        else if (ev.key === "End") j = n - 1;
        if (j !== null) { ev.preventDefault(); select(j, true); }
      });
    });

    // Open the tab named in the URL hash (for example #slope-25), else the default one.
    var start = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
    var hash = window.location.hash.replace("#", "");
    var fromHash = tabs.findIndex(function (t) { return t.getAttribute("data-key") === hash; });
    select(fromHash >= 0 ? fromHash : Math.max(start, 0), false);
  });

  // Copy BibTeX.
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy"));
      if (!target) return;
      var text = target.textContent;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var r = document.createRange();
        r.selectNodeContents(target);
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
        try { document.execCommand("copy"); done(); } catch (e) {}
        s.removeAllRanges();
      }
    });
  });
})();
