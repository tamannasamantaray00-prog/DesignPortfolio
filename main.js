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

  /* ---------- Cursor label over work cards and game tiles ---------- */
  var cursor = document.querySelector(".cursor");
  if (cursor && canHover) {
    document.documentElement.classList.add("has-cursor");
    var label = cursor.querySelector(".cursor-label");
    var target = { x: -100, y: -100 }, pos = { x: -100, y: -100 }, running = false;

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

    window.addEventListener("pointermove", function (e) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!running) { running = true; requestAnimationFrame(frame); }
    });

    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      el.addEventListener("pointerenter", function () {
        label.textContent = el.getAttribute("data-cursor");
        cursor.classList.toggle("on-inverse", !!el.closest(".section-inverse"));
        cursor.classList.add("is-active");
      });
      el.addEventListener("pointerleave", function () {
        cursor.classList.remove("is-active");
      });
    });
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
})();
