/* ==========================================================================
   YOUR GAMES: edit this one list and both the About page and the Play arena update.
   For each game set:
     title   the name
     desc    one line: what it is and how you play it
     url     the link people open (a new tab). While it is "#", the tile shows as "coming soon" and does nothing.
     tag     optional small label on the tile, for example "Made with Figma Make". Leave "" for none.
     cursor  optional word on the cursor when hovering, for example "Play" or "Watch". Leave "" for "Play".
   The Play arena on the landing page and the About page both show all five games, in this order.
   ========================================================================== */
(function () {
  "use strict";

  var GAMES = [
    { title: "Figma Snake",
      desc: "Snake with a Figma theme, built on Figma Make. Faster, with a leaderboard, so the team can compete when they’re bored.",
      url: "https://cow-jeep-83925303.figma.site/", tag: "Made with Figma Make", cursor: "Play" },

    { title: "Coffee Catcher",
      desc: "Catch the falling coffee cups to fill the heart meter: a Monday morning fuel-up to sharpen your instincts and reactions, and build rapport with the team.",
      url: "https://align-claim-64288058.figma.site/", tag: "Made with Figma Make", cursor: "Play" },

    // Runs on a MacBook Air, so the link is a video of it working (paste the video link as the url).
    { title: "Kitchen Remote",
      desc: "Runs in my MacBook Air’s terminal to control YouTube and YouTube Music while I cook or eat, so my keyboard stays clean.",
      url: "#", tag: "Demo video", cursor: "Watch" },

    { title: "What in the DesOps",
      desc: "A quick card game to refresh your design fundamentals.",
      url: "#", tag: "Coming soon", cursor: "Play" },

    { title: "Meme Court",
      desc: "The meme card game as a virtual game night: start a room, share the code, and play with 3 to 8 friends on their own phones or laptops.",
      url: "https://meme-court-xk7l.vercel.app/", tag: "Built with Claude", cursor: "Play" }
  ];

  // Nothing below needs editing.
  document.querySelectorAll("[data-game]").forEach(function (el) {
    var game = GAMES[parseInt(el.getAttribute("data-game"), 10)];
    if (!game) {
      // no game for this slot: hide it
      var item = el.closest("li") || el;
      item.hidden = true;
      return;
    }

    var title = el.querySelector("[data-game-title]");
    var desc = el.querySelector("[data-game-desc]");
    var tag = el.querySelector("[data-game-tag]");
    if (title) title.textContent = game.title;
    if (desc) desc.textContent = game.desc;
    if (tag) {
      tag.textContent = game.tag || "";
      tag.hidden = !game.tag;
    }

    if (game.url && game.url !== "#") {
      el.setAttribute("href", game.url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
      if (el.hasAttribute("data-cursor")) el.setAttribute("data-cursor", game.cursor || "Play");
    } else {
      // placeholder: stays put when clicked and says so on the cursor
      el.setAttribute("href", "#");
      el.addEventListener("click", function (e) { e.preventDefault(); });
      if (el.hasAttribute("data-cursor")) el.setAttribute("data-cursor", "Coming soon");
    }
  });
})();
