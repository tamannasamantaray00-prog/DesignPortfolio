(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     SHARED HEADER COMPONENT
     This is the one place to edit the site's header (logo, nav links,
     the Resume link) so a single change here ripples across every page.
     Each page just needs this single line where the header should sit:

       <script src="header.js"></script>

     Nothing else is needed — no wrapper div, no extra markup. This script
     inserts the header immediately before itself, in that exact spot.
  -------------------------------------------------------------------- */

  var RESUME_URL = "https://drive.google.com/file/d/1wCxUl_Twqok2p1hCdZW0YP9UVefxMB8P/view?usp=sharing";

  // Which page is this? Used only to mark the matching nav link as the current page.
  var path = window.location.pathname.split("/").pop() || "index.html";
  var isAbout = path === "about.html";

  var html =
    '<header class="site-header">' +
      '<a class="logo" href="index.html" aria-label="Tamanna Samantaray, home">TS</a>' +
      '<nav class="nav" aria-label="Main">' +
        '<a class="nav-link" href="index.html#work" data-link="work">Work</a>' +
        '<a class="nav-link" href="about.html"' + (isAbout ? ' aria-current="page"' : '') + '>About me</a>' +
        '<a class="nav-link" href="index.html#contact" data-link="contact">Contact me</a>' +
        '<a class="nav-link" href="' + RESUME_URL + '" target="_blank" rel="noopener">Resume</a>' +
      '</nav>' +
    '</header>';

  document.currentScript.insertAdjacentHTML("beforebegin", html);
})();
