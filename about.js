(function () {
  "use strict";

  var scroller = document.getElementById("hscroll");
  if (!scroller) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chapters = Array.prototype.slice.call(scroller.querySelectorAll(".chapter"));
  var items = Array.prototype.slice.call(document.querySelectorAll(".scrub-item"));
  var indicator = document.querySelector(".scrub-indicator");
  var bar = document.querySelector(".scrub-bar");
  var line = document.querySelector(".scrub-line");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var hint = document.getElementById("hint");

  function maxScroll() { return scroller.scrollWidth - scroller.clientWidth; }

  /* ---------- Wheel and trackpad: turn up/down scrolling into sideways scrolling, smoothly ---------- */
  var target = scroller.scrollLeft, raf = null;

  function glide() {
    var distance = target - scroller.scrollLeft;
    if (reduceMotion || Math.abs(distance) < 0.5) {
      scroller.scrollLeft = target;
      raf = null;
      return;
    }
    scroller.scrollLeft += distance * 0.14;
    raf = requestAnimationFrame(glide);
  }

  scroller.addEventListener("wheel", function (e) {
    if (e.ctrlKey) return;                                   // pinch zoom
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;     // already a sideways gesture, let the browser handle it
    var chapter = e.target.closest ? e.target.closest(".chapter") : null;
    if (chapter && chapter.scrollHeight > chapter.clientHeight + 2) return;   // a tall chapter on a short screen scrolls up and down
    e.preventDefault();
    var delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
    target = Math.max(0, Math.min(maxScroll(), target + delta));
    if (!raf) raf = requestAnimationFrame(glide);
  }, { passive: false });

  /* ---------- Jump to a chapter ---------- */
  function goTo(left) {
    left = Math.max(0, Math.min(maxScroll(), left));
    target = left;
    scroller.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function currentIndex() {
    var probe = scroller.scrollLeft + scroller.clientWidth * 0.4;
    var index = 0;
    chapters.forEach(function (c, i) { if (c.offsetLeft <= probe) index = i; });
    if (scroller.scrollLeft >= maxScroll() - 4) index = chapters.length - 1;
    return index;
  }

  items.forEach(function (item) {
    item.addEventListener("click", function () {
      var el = document.getElementById(item.getAttribute("data-goto"));
      if (el) goTo(el.offsetLeft - 0);
    });
  });

  prevBtn.addEventListener("click", function () {
    var i = currentIndex();
    // if the current chapter is mostly off to the left, step to its start first
    var here = chapters[i].offsetLeft;
    goTo(scroller.scrollLeft - here > 24 ? here : (chapters[Math.max(i - 1, 0)].offsetLeft));
  });
  nextBtn.addEventListener("click", function () {
    var i = currentIndex();
    goTo(chapters[Math.min(i + 1, chapters.length - 1)].offsetLeft);
  });

  /* ---------- Keyboard: left and right arrows move a good distance ---------- */
  scroller.addEventListener("keydown", function (e) {
    if (e.target !== scroller) return;
    var step = scroller.clientWidth * 0.5;
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(target + step); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(target - step); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(maxScroll()); }
  });

  /* ---------- Bottom bar: highlight the part you are in, show progress ---------- */
  function moveIndicator(item) {
    if (!indicator || !item) return;
    indicator.style.width = item.offsetWidth + "px";
    indicator.style.transform = "translateX(" + item.offsetLeft + "px)";
    if (bar && bar.scrollWidth > bar.clientWidth) {
      bar.scrollTo({ left: Math.max(item.offsetLeft - 24, 0), behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  var lastGroup = null;
  function update() {
    var i = currentIndex();
    var group = chapters[i].getAttribute("data-group");
    if (group !== lastGroup) {
      lastGroup = group;
      var active = null;
      items.forEach(function (item) {
        var on = item.getAttribute("data-group") === group;
        if (on) { item.setAttribute("aria-current", "true"); active = item; }
        else item.removeAttribute("aria-current");
      });
      moveIndicator(active);
    }
    var max = maxScroll();
    if (line) line.style.setProperty("--p", max > 0 ? Math.min(scroller.scrollLeft / max, 1).toFixed(4) : 0);
    prevBtn.disabled = scroller.scrollLeft <= 4;
    nextBtn.disabled = scroller.scrollLeft >= max - 4;
    if (hint && scroller.scrollLeft > 60) hint.classList.add("is-gone");
  }

  scroller.addEventListener("scroll", function () {
    if (!raf) target = scroller.scrollLeft;   // keep the glide target in step when scrolled by touch or keyboard
    update();
  }, { passive: true });

  function layout() {
    var current = items.filter(function (i) { return i.getAttribute("aria-current") === "true"; })[0];
    if (indicator) { indicator.style.transition = "none"; }
    moveIndicator(current);
    if (indicator) { void indicator.offsetWidth; indicator.style.transition = ""; }
    update();
  }

  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
