/* ============================================================
 * Bootstrap — wire the start menu to the game.
 * ============================================================ */
(function () {
  function boot() {
    const canvas = document.getElementById('game-canvas');
    const ui = new window.CricketUI();
    const game = new window.CricketGame({ canvas: canvas, ui: ui });
    window._game = game; // handy for debugging

    let chosen = { overs: window.CFG.OVERS, wickets: window.CFG.WICKETS };

    // mode cards
    document.querySelectorAll('.mode-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        chosen = {
          overs: parseInt(card.dataset.overs, 10),
          wickets: parseInt(card.dataset.wickets, 10),
        };
      });
    });
    // default selection
    const def = document.querySelector('.mode-card[data-overs="2"]');
    if (def) def.classList.add('selected');

    document.getElementById('start-btn').addEventListener('click', () => {
      game.startMatch(chosen);
    });

    document.getElementById('bowl-btn').addEventListener('click', () => {
      game.bowl();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
