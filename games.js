/* ==========================================================================
   YOUR GAMES: edit this one list and both the About page and the Play arena update.
   For each game set a title, a one-line description, and the link (url).
   While a url is "#", the game shows as a plain, non-clickable placeholder.
   The Play arena on the landing page shows the first three games, the About page shows all five.
   ========================================================================== */
(function () {
  "use strict";

  var GAMES = [
    { title: "Game 1", desc: "One line about what the game is and how you play it.", url: "#" },
    { title: "Game 2", desc: "One line about what the game is and how you play it.", url: "#" },
    { title: "Game 3", desc: "One line about what the game is and how you play it.", url: "#" },
    { title: "Game 4", desc: "One line about what the game is and how you play it.", url: "#" },
    { title: "Game 5", desc: "One line about what the game is and how you play it.", url: "#" }
  ];

  // Nothing below needs editing.
  document.querySelectorAll("[data-game]").forEach(function (el) {
    var game = GAMES[parseInt(el.getAttribute("data-game"), 10)];
    if (!game) return;

    var title = el.querySelector("[data-game-title]");
    var desc = el.querySelector("[data-game-desc]");
    if (title) title.textContent = game.title;
    if (desc) desc.textContent = game.desc;

    if (game.url && game.url !== "#") {
      el.setAttribute("href", game.url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    } else {
      // placeholder: don't jump to the top of the page when clicked
      el.setAttribute("href", "#");
      el.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });
})();
