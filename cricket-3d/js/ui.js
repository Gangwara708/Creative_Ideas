/* ============================================================
 * UI layer — scoreboard, call-outs, overlays, menus.
 * Pure DOM; the 3D game calls into these methods.
 * ============================================================ */
window.CricketUI = (function () {
  function UI() {
    this.el = {
      team: document.getElementById('sb-team'),
      score: document.getElementById('sb-score'),
      meta: document.getElementById('sb-meta'),
      target: document.getElementById('sb-target'),
      overBalls: document.getElementById('over-balls'),
      callout: document.getElementById('callout'),
      aimFill: document.getElementById('aim-fill'),
      aimMeter: document.getElementById('aim-meter'),
      controls: document.getElementById('controls-hint'),
      overlay: document.getElementById('overlay'),
      bowlBtn: document.getElementById('bowl-btn'),
    };
  }

  UI.prototype.updateScore = function (m) {
    const sideName = m.battingSide === 'YOU' ? 'YOUR INNINGS' : 'RIVALS BATTING';
    this.el.team.textContent = sideName;
    this.el.score.textContent = `${m.runs}/${m.wickets}`;
    const oversDone = Math.floor(m.balls / 6);
    const ballsThis = m.balls % 6;
    this.el.meta.textContent = `Overs ${oversDone}.${ballsThis} / ${m.overs}   •   ${m.maxWickets - m.wickets} wkts left`;

    if (m.target) {
      const need = m.target - m.runs;
      const ballsLeft = m.overs * 6 - m.balls;
      this.el.target.textContent = need > 0
        ? `Target ${m.target} — need ${need} off ${ballsLeft}`
        : `Target chased!`;
    } else {
      this.el.target.textContent = m.innings === 1 ? 'Set a big total!' : '';
    }

    // ball-by-ball dots for the current over
    this.el.overBalls.innerHTML = '';
    const over = m.thisOver.slice(-6);
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'ball-dot';
      const b = over[i];
      if (b) {
        d.textContent = b.tag;
        if (b.wkt) d.classList.add('wkt');
        else if (b.runs === 6) d.classList.add('six');
        else if (b.runs === 4) d.classList.add('four');
        else if (b.runs > 0) d.classList.add('run');
      } else {
        d.textContent = '·';
      }
      this.el.overBalls.appendChild(d);
    }
  };

  UI.prototype.callout = function (text, kind) {
    const c = this.el.callout;
    c.textContent = text;
    c.className = 'callout-' + (kind || 'run');
    // force reflow to restart transition
    void c.offsetWidth;
    c.classList.add('show');
    clearTimeout(this._coTimer);
    this._coTimer = setTimeout(() => c.classList.remove('show'), 1100);
  };

  UI.prototype.setAim = function (frac) {
    // frac in [-1, 1]; convert to left %
    const pct = 50 + frac * 48;
    this.el.aimFill.style.left = pct + '%';
  };

  UI.prototype.setBowlButton = function (show) {
    this.el.bowlBtn.style.display = show ? 'inline-block' : 'none';
  };

  UI.prototype.flashControls = function (innings, battingSide) {
    const c = this.el.controls;
    if (battingSide === 'YOU') {
      c.innerHTML = '<b>SPACE/Click</b> bowl &amp; then time your shot · <b>← →</b> aim · <b>↑</b> loft / <b>↓</b> ground';
      this.el.aimMeter.style.display = 'block';
    } else {
      c.innerHTML = 'You are bowling — press <b>Bowl</b> (or SPACE) and watch the rivals chase';
      this.el.aimMeter.style.display = 'none';
    }
  };

  UI.prototype.hideOverlay = function () {
    this.el.overlay.classList.add('hidden');
  };

  UI.prototype.showInningsBreak = function (m, onContinue) {
    const yourFirst = m.first.side === 'YOU';
    const title = 'Innings Break';
    const sub = `${m.first.side === 'YOU' ? 'You' : 'Rivals'} scored ${m.first.runs}/${m.first.wickets}`;
    const body = m.battingSide === 'YOU'
      ? `Now YOU chase. Target: <b>${m.target}</b> off ${m.overs} overs.`
      : `Now defend it! The RIVALS need <b>${m.target}</b> to win. You're bowling.`;
    this._overlay(title, sub, body, 'Continue', onContinue);
  };

  UI.prototype.showResult = function (m, result, yourScore, rivalScore) {
    let title, kind;
    if (result.win === 'YOU') { title = 'You Win! 🏆'; }
    else if (result.win === 'RIVALS') { title = 'Rivals Win'; }
    else { title = 'Tied Match!'; }
    const sub = `You ${yourScore} — ${rivalScore} Rivals`;
    const body = result.win === 'TIE' ? 'A thriller — scores level!' : `Won by ${result.by}.`;
    this._overlay(title, sub, body, 'Play Again', () => location.reload());
  };

  UI.prototype._overlay = function (title, sub, body, btnText, onClick) {
    const o = this.el.overlay;
    o.innerHTML = `
      <h1>${title}</h1>
      <h2>${sub}</h2>
      <p>${body}</p>
      <button class="btn" id="overlay-btn">${btnText}</button>
    `;
    o.classList.remove('hidden');
    document.getElementById('overlay-btn').addEventListener('click', () => {
      o.classList.add('hidden');
      onClick && onClick();
    });
  };

  return UI;
})();
