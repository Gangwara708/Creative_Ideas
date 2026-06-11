/* ============================================================
 * UI layer — HUD, bonus pops, overlays. Pure DOM.
 * ============================================================ */
window.RushUI = (function () {
  function UI() {
    this.el = {
      score: document.getElementById('score'),
      hiScore: document.getElementById('hi-score'),
      coinsLine: document.getElementById('coins-line'),
      speedVal: document.getElementById('speed-val'),
      nitroFill: document.getElementById('nitro-fill'),
      damageFill: document.getElementById('damage-fill'),
      pop: document.getElementById('bonus-pop'),
      overlay: document.getElementById('overlay'),
      hud: document.getElementById('hud'),
    };
    this.best = parseInt(localStorage.getItem('hr3d_best') || '0', 10);
    this.el.hiScore.textContent = 'Best: ' + this.best.toLocaleString();
  }

  UI.prototype.updateHUD = function (r) {
    this.el.score.textContent = Math.floor(r.score).toLocaleString();
    this.el.coinsLine.innerHTML = 'Coins: <b>' + r.coins + '</b> · ' + (r.distance / 1000).toFixed(2) + ' km';
    // arcade speedo: scale m/s to a fun km/h-style number; R = reverse gear
    const kmh = Math.round(Math.abs(r.speed) * 3.6);
    this.el.speedVal.textContent = r.reversing ? 'R ' + kmh : String(kmh);
    this.el.speedVal.style.color = r.reversing ? '#ff9f8a' : '';
    this.el.nitroFill.style.width = (r.nitro / window.CFG.NITRO_MAX * 100) + '%';

    const hp = r.health / window.CFG.MAX_HEALTH;
    this.el.damageFill.style.width = (hp * 100) + '%';
    this.el.damageFill.style.background = hp > 0.5
      ? 'linear-gradient(90deg, #2ec4b6, #9be15d)'
      : hp > 0.25
        ? 'linear-gradient(90deg, #ffb340, #ffd166)'
        : 'linear-gradient(90deg, #e71d36, #ff5d73)';
  };

  UI.prototype.pop = function (text, kind) {
    const p = this.el.pop;
    p.textContent = text;
    p.className = kind || '';
    void p.offsetWidth;
    p.classList.add('show');
    clearTimeout(this._popTimer);
    this._popTimer = setTimeout(() => p.classList.remove('show'), 850);
  };

  UI.prototype.hideOverlay = function () {
    this.el.overlay.classList.add('hidden');
  };

  UI.prototype.showGameOver = function (r, best) {
    const o = this.el.overlay;
    const isRecord = Math.floor(r.score) >= best && best > 0;
    o.innerHTML = `
      <h1>${isRecord ? 'New Record! 🏁' : 'Wrecked!'}</h1>
      <h2>Score: ${Math.floor(r.score).toLocaleString()}</h2>
      <div class="stat-grid">
        <div><div class="num">${(r.distance / 1000).toFixed(2)}</div><div class="cap">km driven</div></div>
        <div><div class="num">${r.coins}</div><div class="cap">coins</div></div>
        <div><div class="num">${r.jumps || 0}</div><div class="cap">jumps</div></div>
        <div><div class="num">${best.toLocaleString()}</div><div class="cap">best score</div></div>
      </div>
      <button class="btn" id="overlay-btn">Drive Again</button>
    `;
    o.classList.remove('hidden');
    this.best = best;
    this.el.hiScore.textContent = 'Best: ' + best.toLocaleString();
    document.getElementById('overlay-btn').addEventListener('click', () => location.reload());
  };

  return UI;
})();
