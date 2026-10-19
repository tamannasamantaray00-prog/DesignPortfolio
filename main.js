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
})();

/* ---------- Recommendations: sideways scroller and reader ----------
   The cards sit in one row that scrolls sideways (swipe, trackpad, drag, or the arrow buttons).
   Click anywhere on a card: on desktop and tablet it grows from its own spot over the other cards,
   on phones it slides up as a drawer (swipe down to close). Esc, the close button or a click outside close it. */
(function () {
  "use strict";

  var scroller = document.getElementById("recs");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".rec"));
  if (!scroller || !cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = window.matchMedia("(max-width: 40rem)");

  /* ----- the sideways scroller: arrows, edge fades, and drag with the mouse ----- */
  var prevBtn = document.getElementById("recs-prev");
  var nextBtn = document.getElementById("recs-next");

  function cardStep() {
    var gap = parseFloat(getComputedStyle(scroller).columnGap) || 20;
    return cards[0].getBoundingClientRect().width + gap;
  }
  function updateScroller() {
    var max = scroller.scrollWidth - scroller.clientWidth;
    scroller.classList.toggle("has-left", scroller.scrollLeft > 4);
    scroller.classList.toggle("at-end", scroller.scrollLeft >= max - 4);
    if (prevBtn) prevBtn.disabled = scroller.scrollLeft <= 4;
    if (nextBtn) nextBtn.disabled = scroller.scrollLeft >= max - 4;
  }
  if (prevBtn) prevBtn.addEventListener("click", function () { scroller.scrollBy({ left: -cardStep(), behavior: reduce ? "auto" : "smooth" }); });
  if (nextBtn) nextBtn.addEventListener("click", function () { scroller.scrollBy({ left: cardStep(), behavior: reduce ? "auto" : "smooth" }); });
  scroller.addEventListener("scroll", updateScroller, { passive: true });
  window.addEventListener("resize", updateScroller);
  window.addEventListener("load", updateScroller);
  updateScroller();

  // Drag with a mouse. A drag scrolls the row, a plain click opens the card.
  var down = null, dragged = false;
  scroller.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    down = { x: e.clientX, left: scroller.scrollLeft };
    dragged = false;
  });
  window.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - down.x;
    if (!dragged && Math.abs(dx) > 6) { dragged = true; scroller.classList.add("is-dragging"); }
    if (dragged) scroller.scrollLeft = down.left - dx;
  });
  window.addEventListener("pointerup", function () {
    if (!down) return;
    down = null;
    if (dragged) {
      scroller.classList.remove("is-dragging");
      setTimeout(function () { dragged = false; }, 0);   // lets the click that follows a drag be ignored
    }
  });

  /* ----- the reader ----- */
  var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var scrim = document.createElement("div");
  scrim.className = "rec-scrim";
  scrim.hidden = true;
  scrim.setAttribute("aria-hidden", "true");

  var pop = document.createElement("div");
  pop.className = "rec-pop";
  pop.hidden = true;
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-modal", "true");
  pop.setAttribute("aria-labelledby", "rec-pop-name");
  pop.innerHTML =
    '<div class="rec-pop-grab" aria-hidden="true"></div>' +
    '<div class="rec-pop-head">' +
      '<span class="rec-avatar" aria-hidden="true"></span>' +
      '<div class="rec-text"></div>' +
      '<button class="rec-pop-close" type="button" aria-label="Close recommendation">' + closeIcon + '</button>' +
    '</div>' +
    '<div class="rec-pop-body" tabindex="0"></div>';

  document.body.appendChild(scrim);
  document.body.appendChild(pop);

  var avatar = pop.querySelector(".rec-avatar");
  var who = pop.querySelector(".rec-text");
  var body = pop.querySelector(".rec-pop-body");
  var closeBtn = pop.querySelector(".rec-pop-close");

  var active = null, isOpen = false, closing = false, isDrawer = false, lastFocus = null, inertEls = [], timer = null;

  function setInert(on) {
    if (on) {
      inertEls = Array.prototype.filter.call(document.body.children, function (el) {
        return el !== scrim && el !== pop && el.tagName !== "SCRIPT";
      });
      inertEls.forEach(function (el) { el.setAttribute("inert", ""); });
    } else {
      inertEls.forEach(function (el) { el.removeAttribute("inert"); });
      inertEls = [];
    }
  }

  function fill(card) {
    avatar.textContent = card.querySelector(".rec-avatar").textContent;
    who.innerHTML = card.querySelector(".rec-text").innerHTML;
    who.querySelector(".rec-name").id = "rec-pop-name";
    body.innerHTML = card.querySelector(".rec-full").innerHTML;
    body.scrollTop = 0;
  }

  // If the card is partly hidden at the edge of the row, bring it fully into view first.
  function ensureVisible(card) {
    var s = scroller.getBoundingClientRect();
    var r = card.getBoundingClientRect();
    var pad = 16;
    if (r.right > s.right - pad) scroller.scrollLeft += r.right - s.right + pad;
    else if (r.left < s.left + pad) scroller.scrollLeft -= s.left + pad - r.left;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Works out where the grown card sits: it keeps to the side of the card you clicked and always stays on screen.
  function place(card) {
    var r = card.getBoundingClientRect();
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var vw = window.innerWidth, vh = window.innerHeight, m = 16;
    var tw = Math.min(40 * rem, vw - 2 * m);

    // measure how tall the full text wants to be at this width
    pop.style.cssText = "transition:none;visibility:hidden;left:0;top:0;width:" + tw + "px;height:auto;";
    var natural = pop.offsetHeight;
    var th = Math.min(natural, vh - 2 * m, vh * 0.84);

    var left = r.left;
    if (left + tw > vw - m) left = r.right - tw;
    left = clamp(left, m, Math.max(m, vw - tw - m));
    var top = r.top;
    if (top + th > vh - m) top = r.bottom - th;
    top = clamp(top, m, Math.max(m, vh - th - m));

    // start exactly on top of the card
    pop.style.cssText = "transition:none;visibility:visible;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;";
    void pop.offsetWidth;
    scrim.classList.add("is-in");

    if (reduce) {
      pop.style.cssText = "transition:none;left:" + left + "px;top:" + top + "px;width:" + tw + "px;height:" + th + "px;";
      pop.classList.add("is-open");
      return;
    }
    pop.style.transition = "";
    requestAnimationFrame(function () {
      pop.style.left = left + "px";
      pop.style.top = top + "px";
      pop.style.width = tw + "px";
      pop.style.height = th + "px";
      pop.classList.add("is-open");
    });
  }

  function open(card) {
    if (isOpen || closing) return;
    isOpen = true;
    active = card;
    lastFocus = document.activeElement;
    isDrawer = phone.matches;
    if (!isDrawer) ensureVisible(card);
    fill(card);
    pop.style.setProperty("--glow", card.style.getPropertyValue("--glow") || "#A259FF");
    document.documentElement.classList.add("modal-open");
    setInert(true);
    var cursorLabel = document.querySelector(".cursor");
    if (cursorLabel) cursorLabel.classList.remove("is-active");   // hide the "Read" label while the reader is open
    scrim.hidden = false;
    pop.hidden = false;
    pop.classList.toggle("is-drawer", isDrawer);

    if (isDrawer) {
      pop.style.cssText = "";
      void pop.offsetWidth;
      requestAnimationFrame(function () {
        scrim.classList.add("is-in");
        pop.classList.add("is-in", "is-open");
      });
    } else {
      place(card);
    }
    closeBtn.focus({ preventScroll: true });
  }

  function finish() {
    clearTimeout(timer);
    pop.hidden = true;
    scrim.hidden = true;
    scrim.classList.remove("is-in");
    pop.className = "rec-pop";
    pop.style.cssText = "";
    document.documentElement.classList.remove("modal-open");
    setInert(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    closing = false;
    active = null;
  }

  function close(instant) {
    if (!isOpen || closing) return;
    isOpen = false;
    closing = true;
    if (instant === true || reduce) { finish(); return; }

    scrim.classList.remove("is-in");
    pop.classList.remove("is-open");
    if (isDrawer) {
      pop.style.transform = "";
      pop.classList.remove("is-in");
      timer = setTimeout(finish, 480);
    } else {
      var r = active.getBoundingClientRect();
      pop.style.left = r.left + "px";
      pop.style.top = r.top + "px";
      pop.style.width = r.width + "px";
      pop.style.height = r.height + "px";
      timer = setTimeout(finish, 540);
    }
  }

  // The whole card opens the reader. The "Read in full" button gives keyboard and screen reader users the same thing.
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      if (dragged) return;
      open(card);
    });
  });

  closeBtn.addEventListener("click", function () { close(); });
  scrim.addEventListener("click", function () { close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) { e.preventDefault(); close(); }
  });
  window.addEventListener("resize", function () { if (isOpen) close(true); });

  // Phones: drag the top of the drawer down to close it.
  var drag = null;
  pop.addEventListener("pointerdown", function (e) {
    if (!isDrawer || !e.target.closest(".rec-pop-grab, .rec-pop-head") || e.target.closest(".rec-pop-close")) return;
    drag = { y: e.clientY };
    try { pop.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
    pop.style.transition = "none";
  });
  pop.addEventListener("pointermove", function (e) {
    if (!drag) return;
    pop.style.transform = "translateY(" + Math.max(0, e.clientY - drag.y) + "px)";
  });
  function endDrag(e) {
    if (!drag) return;
    var dy = Math.max(0, e.clientY - drag.y);
    drag = null;
    pop.style.transition = "";
    if (dy > 100) close();
    else pop.style.transform = "";
  }
  pop.addEventListener("pointerup", endDrag);
  pop.addEventListener("pointercancel", endDrag);
})();
