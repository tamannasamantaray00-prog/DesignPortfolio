(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Header: hide on scroll down, show on scroll up ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);
      if (y > lastY && y > 200) header.classList.add("is-hidden");
      else header.classList.remove("is-hidden");
      lastY = y;
    }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  }

  /* ---------- Active nav link while its section is on screen ---------- */
  var links = document.querySelectorAll("[data-link]");
  if (links.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        links.forEach(function (link) {
          if (link.getAttribute("data-link") === id) {
            if (entry.isIntersecting) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["work", "contact"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Cursor label ----------
     - Over anything with data-cursor (work cards, game tiles, photo): shows that text.
     - Over the rest of the hero: cycles through the hero's data-cursor-cycle phrases
       as the pointer travels, so the cursor tells people what I do.
     - Over links and everywhere else: hidden. */
  var cursor = document.querySelector(".cursor");
  if (cursor && canHover) {
    document.documentElement.classList.add("has-cursor");
    var label = cursor.querySelector(".cursor-label");
    var hero = document.querySelector("[data-cursor-cycle]");
    var phrases = hero ? hero.getAttribute("data-cursor-cycle").split("|") : [];
    var phraseIndex = 0, travelled = 0, last = null, currentText = "";
    var target = { x: -100, y: -100 }, pos = { x: -100, y: -100 }, running = false;

    var STEP = 260; // pixels of pointer travel before the next phrase

    function frame() {
      var ease = reduceMotion ? 1 : 0.2;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      cursor.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)";
      if (Math.abs(target.x - pos.x) > 0.3 || Math.abs(target.y - pos.y) > 0.3) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function pop() {
      label.classList.remove("pop");
      void label.offsetWidth; // restart the animation
      label.classList.add("pop");
    }

    function show(text, inverse) {
      var wasActive = cursor.classList.contains("is-active");
      if (text !== currentText) {
        label.textContent = text;
        currentText = text;
        if (wasActive && !reduceMotion) pop();
      }
      cursor.classList.toggle("on-inverse", inverse);
      cursor.classList.add("is-active");
    }

    function hide() {
      cursor.classList.remove("is-active");
      currentText = "";
      last = null;
    }

    window.addEventListener("pointermove", function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!running) { running = true; requestAnimationFrame(frame); }

      var t = e.target;
      if (!t || !t.closest) { hide(); return; }

      var el = t.closest("[data-cursor]");
      if (el) {
        show(el.getAttribute("data-cursor"), !!el.closest(".section-inverse"));
        last = null;
        return;
      }

      if (hero && phrases.length && t.closest("[data-cursor-cycle]") && !t.closest("a")) {
        if (last) {
          travelled += Math.hypot(e.clientX - last.x, e.clientY - last.y);
          if (travelled > STEP) {
            travelled = 0;
            phraseIndex = (phraseIndex + 1) % phrases.length;
          }
        }
        last = { x: e.clientX, y: e.clientY };
        show(phrases[phraseIndex], false);
        return;
      }

      hide();
    });

    document.documentElement.addEventListener("mouseleave", hide);
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      var button = form.querySelector("button[type=submit]");
      var data = new FormData(form);

      // Until a Formspree ID is added, fall back to the visitor's email app.
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        var subject = encodeURIComponent(data.get("topic") + " from " + data.get("name"));
        var body = encodeURIComponent(data.get("message") + "\n\n" + data.get("name") + "\n" + data.get("email"));
        window.location.href = "mailto:tamannasamantaray00@gmail.com?subject=" + subject + "&body=" + body;
        status.textContent = "Opening your email app.";
        return;
      }

      button.disabled = true;
      status.textContent = "Sending…";
      fetch(action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent = "Thanks, your message is on its way. I’ll reply soon.";
          } else {
            status.textContent = "That didn’t send. Please email me directly at tamannasamantaray00@gmail.com.";
          }
        })
        .catch(function () {
          status.textContent = "That didn’t send. Please check your connection or email me directly.";
        })
        .then(function () { button.disabled = false; });
    });
  }

  /* ---------- Case study pages ---------- */

  // Reading progress bar along the top
  var progress = document.querySelector(".progress");
  if (progress) {
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  // Left rail: mark the section currently being read
  var railLinks = document.querySelectorAll(".rail-link");
  if (railLinks.length && "IntersectionObserver" in window) {
    var railObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        railLinks.forEach(function (link) {
          if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    document.querySelectorAll(".cs-section").forEach(function (s) { railObserver.observe(s); });
  }

  // Before and after sliders
  document.querySelectorAll(".compare").forEach(function (box) {
    var range = box.querySelector(".compare-range");
    if (!range) return;
    range.addEventListener("input", function () {
      box.style.setProperty("--pos", range.value + "%");
    });
  });
})();
