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
    var colors = hero && hero.getAttribute("data-cursor-colors") ? hero.getAttribute("data-cursor-colors").split("|") : [];
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

    function show(text, inverse, color) {
      var wasActive = cursor.classList.contains("is-active");
      // Colored label (hero phrases) uses dark text for contrast; everything else stays black or white.
      if (color) {
        cursor.style.setProperty("--label-bg", color);
        cursor.style.setProperty("--label-ink", "#0a0a0a");
      } else {
        cursor.style.removeProperty("--label-bg");
        cursor.style.removeProperty("--label-ink");
      }
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
        show(phrases[phraseIndex], false, colors[phraseIndex]);
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

  // Left rail: mark the section currently being read.
  // The active section is the last one whose top has passed 30% of the way down the screen.
  // Near the very bottom of the page, where short last sections can never reach that line,
  // the final section counts as active.
  var railLinks = document.querySelectorAll(".rail-link");
  if (railLinks.length) {
    var railSections = Array.prototype.map.call(railLinks, function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);
    var railTicking = false;

    var updateRail = function () {
      railTicking = false;
      var line = window.innerHeight * 0.3;
      var current = null;
      railSections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      var lastSection = railSections[railSections.length - 1];
      var lastIsVisible = lastSection && lastSection.getBoundingClientRect().top < window.innerHeight * 0.75;
      if (atBottom && lastIsVisible) current = lastSection;
      railLinks.forEach(function (link) {
        if (current && link.getAttribute("href") === "#" + current.id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    window.addEventListener("scroll", function () {
      if (!railTicking) { railTicking = true; requestAnimationFrame(updateRail); }
    }, { passive: true });
    window.addEventListener("resize", updateRail);
    updateRail();
  }

  // Before and after sliders
  document.querySelectorAll(".compare").forEach(function (box) {
    var range = box.querySelector(".compare-range");
    if (!range) return;
    range.addEventListener("input", function () {
      box.style.setProperty("--pos", range.value + "%");
    });
  });

  /* ---------- Copy email button ---------- */
  var copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    var pill = copyBtn.closest(".contact-btn");
    var tip = document.getElementById("copy-tip");
    var copyTimer;

    var done = function (message) {
      pill.classList.add("is-copied");
      if (tip) tip.textContent = message;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () {
        pill.classList.remove("is-copied");
        if (tip) tip.textContent = "";
      }, 2000);
    };

    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done("Email copied"); }, function () { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
    });

    // Older browsers: select a temporary field and copy it.
    var fallbackCopy = function (text) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(field);
      done(ok ? "Email copied" : "Copy failed, use the address below");
    };
  }

  /* ---------- Tabs (Selected work) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute("aria-controls")); });
    var indicator = root.querySelector(".tab-indicator");
    var bar = tabs.length ? tabs[0].parentElement : null;
    var current = 0;

    function moveIndicator() {
      if (!indicator || !tabs[current]) return;
      indicator.style.width = tabs[current].offsetWidth + "px";
      indicator.style.transform = "translateX(" + tabs[current].offsetLeft + "px)";
    }

    function select(index, focus) {
      current = index;
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      moveIndicator();
      // keep the active tab visible when the row scrolls sideways on small screens
      if (bar && bar.scrollWidth > bar.clientWidth) {
        bar.scrollTo({ left: Math.max(tabs[index].offsetLeft - 16, 0), behavior: reduceMotion ? "auto" : "smooth" });
      }
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    // Place the indicator without animating on first paint, and again once fonts have loaded.
    if (indicator) {
      indicator.style.transition = "none";
      moveIndicator();
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
    window.addEventListener("resize", moveIndicator);
    window.addEventListener("load", moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  });
})();
