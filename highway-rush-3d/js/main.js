/* ============================================================
 * Bootstrap — wire the start menu (car picker) to the game.
 * ============================================================ */
(function () {
  function boot() {
    const canvas = document.getElementById('game-canvas');
    const ui = new window.RushUI();
    const game = new window.RushGame({ canvas: canvas, ui: ui });
    window._game = game; // handy for debugging

    let chosenColor = 0xff5e2c;

    document.querySelectorAll('.car-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.car-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        chosenColor = parseInt(card.dataset.color, 16);
      });
    });
    const def = document.querySelector('.car-card');
    if (def) def.classList.add('selected');

    document.getElementById('start-btn').addEventListener('click', () => {
      game.startRun(chosenColor);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
