/* ============================================================
 * Super Over Cricket 3D — core game controller
 * Handles state machine, ball physics, batting input, scoring,
 * two innings (you bat, then bowl vs AI chase) and the result.
 * ============================================================ */
window.CricketGame = (function () {
  const C = window.CFG;

  function Game(opts) {
    this.canvas = opts.canvas;
    this.ui = opts.ui;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

    const built = window.CricketScene.build(this.renderer);
    Object.assign(this, built);

    this.clock = new THREE.Clock();
    this.state = 'idle';        // idle | ready | bowling | hit | settle | break | over
    this.input = { swing: false, swingAt: -1, aim: 0, aimDir: 1, loft: false };
    this.ball.userData.vel = new THREE.Vector3();

    // match state
    this.match = null;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
    this._bindInput();
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  // ---------------------------------------------------------
  // Match setup
  // ---------------------------------------------------------
  Game.prototype.startMatch = function (cfg) {
    this.match = {
      overs: cfg.overs,
      maxWickets: cfg.wickets,
      innings: 1,
      battingSide: 'YOU',      // innings 1: human bats
      runs: 0, wickets: 0, balls: 0,
      target: null,
      thisOver: [],
      first: null,             // saved innings-1 summary
      result: null,
    };
    this.state = 'ready';
    this._placeBall('ready');
    this.ui.hideOverlay();
    this.ui.setBowlButton(false);
    this._updateHUD();
    this.ui.flashControls(this.match.innings, this.match.battingSide);
  };

  // ---------------------------------------------------------
  // Input
  // ---------------------------------------------------------
  Game.prototype._bindInput = function () {
    const self = this;
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (self.state === 'ready' && self._humanBatting()) self.bowl();
          else if (self.state === 'bowling' && self._humanBatting()) self._triggerSwing();
          else if (self.state === 'ready' && !self._humanBatting()) self.bowl();
          break;
        case 'ArrowUp':    self.input.loft = true; break;
        case 'ArrowDown':  self.input.loft = false; break;
        case 'ArrowLeft':  self.input.aimDir = -1; self.input._aiming = true; break;
        case 'ArrowRight': self.input.aimDir = 1;  self.input._aiming = true; break;
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') self.input._aiming = false;
    });
    // touch / click = swing (or bowl when ready)
    this.canvas.addEventListener('pointerdown', function () {
      if (self.state === 'ready') self.bowl();
      else if (self.state === 'bowling' && self._humanBatting()) self._triggerSwing();
    });
  };

  Game.prototype._humanBatting = function () {
    return this.match && this.match.battingSide === 'YOU';
  };

  Game.prototype._triggerSwing = function () {
    this.input.swing = true;
    this.input.swingAt = performance.now();
    this._animateBatSwing();
  };

  // ---------------------------------------------------------
  // Bowling a delivery
  // ---------------------------------------------------------
  Game.prototype.bowl = function () {
    if (this.state !== 'ready') return;
    this.state = 'bowling';
    this.ui.setBowlButton(false);
    this.input.swing = false;
    this.input.swingAt = -1;
    this._contactDone = false;

    const speed = C.BOWL_SPEED_MIN + Math.random() * (C.BOWL_SPEED_MAX - C.BOWL_SPEED_MIN);
    const line = (Math.random() - 0.5) * 1.0;          // horizontal start offset
    const swing = (Math.random() - 0.5) * 2.2;         // lateral drift (vx)

    this.ball.visible = true;
    this.ball.position.set(line, C.RELEASE_HEIGHT, C.BOWLER_Z + 0.5);
    this.ball.userData.vel.set(swing, C.RELEASE_VY, speed);
    this.ball.userData.bounced = false;
    this._bowlerAnim = 0;
  };

  Game.prototype._placeBall = function () {
    this.ball.visible = false;
    this.ball.position.set(0, C.RELEASE_HEIGHT, C.BOWLER_Z + 0.5);
    this.ball.userData.vel.set(0, 0, 0);
  };

  // ---------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------
  Game.prototype._animate = function () {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._updateAim(dt);
    this._updateCamera(dt);

    if (this.state === 'bowling') this._stepBowling(dt);
    else if (this.state === 'hit' || this.state === 'settle') this._stepHitBall(dt);

    this._spinFielders(dt);
    this.renderer.render(this.scene, this.camera);
  };

  Game.prototype._updateAim = function (dt) {
    if (this.state === 'bowling' && this._humanBatting()) {
      this.input.aim += this.input.aimDir * C.AIM_SPEED * dt;
      if (this.input.aim > C.AIM_MAX) { this.input.aim = C.AIM_MAX; this.input.aimDir = -1; }
      if (this.input.aim < -C.AIM_MAX) { this.input.aim = -C.AIM_MAX; this.input.aimDir = 1; }
      this.ui.setAim(this.input.aim / C.AIM_MAX);
    }
  };

  Game.prototype._updateCamera = function (dt) {
    // Broadcast view from behind the striker looking down the pitch.
    let target;
    if (this.state === 'hit' || this.state === 'settle') {
      // follow the ball a little
      target = new THREE.Vector3(
        this.ball.position.x * 0.25, 9, 26
      );
    } else {
      target = new THREE.Vector3(0, 8.5, 27);
    }
    this.camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(0, 2, -2);
  };

  // ---------------------------------------------------------
  // Ball in flight toward batsman
  // ---------------------------------------------------------
  Game.prototype._stepBowling = function (dt) {
    const b = this.ball, v = b.userData.vel;
    v.y -= C.GRAVITY * dt;
    b.position.x += v.x * dt;
    b.position.y += v.y * dt;
    b.position.z += v.z * dt;

    // bounce on pitch
    if (b.position.y <= C.BALL_RADIUS && v.y < 0) {
      b.position.y = C.BALL_RADIUS;
      v.y = -v.y * C.BOUNCE_RESTITUTION;
      v.z *= 0.99;
      b.userData.bounced = true;
    }

    // AI batting decision
    if (!this._humanBatting() && !this._contactDone && b.position.z >= C.BAT_CONTACT_Z - 3.2) {
      this._aiDecide();
    }

    // contact zone
    if (!this._contactDone && b.position.z >= C.BAT_CONTACT_Z) {
      this._contactDone = true;
      this._resolveContact();
      return;
    }

    // passed the stumps without contact
    if (b.position.z > C.STRIKER_Z + 0.3) {
      this._afterMiss();
    }
  };

  Game.prototype._aiDecide = function () {
    if (this._aiPlanned) return;
    this._aiPlanned = true;
    const skill = C.AI_SKILL;
    const r = Math.random();
    // decide timing error & shot
    let err;
    if (r < skill) err = Math.random() * C.PERFECT_MS;           // middled
    else if (r < skill + 0.22) err = C.PERFECT_MS + Math.random() * (C.GOOD_MS - C.PERFECT_MS);
    else if (r < skill + 0.34) err = C.GOOD_MS + Math.random() * 120; // mistimed
    else err = 9999;                                             // play/miss
    this._aiSwing = {
      err: err,
      aim: (Math.random() - 0.5) * 1.8,
      loft: Math.random() < 0.4,
      swung: err < 9999,
    };
  };

  // ---------------------------------------------------------
  // Resolve bat/ball contact
  // ---------------------------------------------------------
  Game.prototype._resolveContact = function () {
    let swung, timingErr, aim, loft;

    if (this._humanBatting()) {
      const now = performance.now();
      swung = this.input.swing && (now - this.input.swingAt) < C.SWING_WINDOW_MS + 60;
      timingErr = swung ? Math.abs(now - this.input.swingAt - 60) : 9999;
      // The ideal press is ~60ms before the ball reaches the bat plane.
      aim = this.input.aim;
      loft = this.input.loft;
    } else {
      const s = this._aiSwing || { err: 9999, aim: 0, loft: false, swung: false };
      swung = s.swung;
      timingErr = s.err;
      aim = s.aim;
      loft = s.loft;
    }
    this._aiPlanned = false;
    this._aiSwing = null;

    if (!swung || timingErr > 220) {
      this._afterMiss();
      return;
    }

    // contact quality
    let quality, edge = false;
    if (timingErr <= C.PERFECT_MS) quality = 1.0;
    else if (timingErr <= C.GOOD_MS) quality = 0.78;
    else { quality = 0.45; edge = true; }

    // launch the ball
    const dir = THREE.MathUtils.clamp(aim, -1.3, 1.3);
    const power = (loft ? C.HIT_POWER_LOFT : C.HIT_POWER_GROUND) * (0.55 + 0.45 * quality);
    const vy = (loft ? C.LOFT_VY : C.FLAT_VY) * (0.6 + 0.5 * quality);

    const b = this.ball, v = b.userData.vel;
    // hit direction: into the off/leg side, away from camera (down the ground = -z toward field)
    const angle = dir; // radians, 0 = straight down ground
    const horiz = power;
    let vx = Math.sin(angle) * horiz;
    let vz = -Math.cos(angle) * horiz;   // negative z = toward the field/bowler end
    if (edge) {
      // edges squirt fine / behind
      vx *= 0.5; vz *= 0.35; v.set(vx + (Math.random() - 0.5) * 6, Math.max(vy * 0.6, 3), Math.abs(vz) * (Math.random() < 0.5 ? 1 : -1));
    } else {
      v.set(vx, vy, vz);
    }
    b.position.y = Math.max(b.position.y, 0.8);

    this._hitAerial = loft || edge ? true : (vy > 6);
    this._crossedBoundary = false;
    this._everAirborneOverRope = false;
    this.state = 'hit';
    this._hitTimer = 0;
    this._animateBatSwing();
    this.ui.callout(edge ? '...edge!' : 'shot!', edge ? 'run' : 'run');
  };

  // ---------------------------------------------------------
  // Ball travelling after a hit — detect boundary / catch / runs
  // ---------------------------------------------------------
  Game.prototype._stepHitBall = function (dt) {
    const b = this.ball, v = b.userData.vel;
    this._hitTimer += dt;
    v.y -= C.GRAVITY * dt;
    b.position.x += v.x * dt;
    b.position.y += v.y * dt;
    b.position.z += v.z * dt;

    const distFromCenter = Math.hypot(b.position.x, b.position.z);

    // bounce / roll on ground
    if (b.position.y <= C.BALL_RADIUS) {
      b.position.y = C.BALL_RADIUS;
      if (v.y < 0) v.y = -v.y * 0.45;
      // ground friction
      const f = Math.pow(C.ROLL_FRICTION, dt);
      v.x *= f; v.z *= f;
      if (v.y < 1.5) v.y = 0;
    } else if (b.position.y > 1.2) {
      this._everAirborneOverRope = distFromCenter > C.BOUNDARY_RADIUS - 4;
    }

    // boundary?
    if (distFromCenter >= C.BOUNDARY_RADIUS && !this._crossedBoundary) {
      this._crossedBoundary = true;
      const six = b.position.y > 0.9; // still in the air as it crosses
      this._finishBall(six ? 6 : 4, false);
      return;
    }

    // catch attempt (aerial, inside the rope)
    if (this._hitAerial && !this._catchChecked && v.y < 0 && b.position.y < 4 && distFromCenter < C.BOUNDARY_RADIUS) {
      this._catchChecked = true;
      const land = b.position.clone();
      let nearest = null, nd = 1e9;
      this.fielders.forEach((f) => {
        const d = Math.hypot(f.position.x - land.x, f.position.z - land.z);
        if (d < nd) { nd = d; nearest = f; }
      });
      if (nearest && nd < C.CATCH_RADIUS) {
        const p = C.CATCH_SKILL * (1 - nd / C.CATCH_RADIUS) + 0.15;
        if (Math.random() < p) {
          // dash the fielder to the ball for the grab
          this._dashFielder = nearest;
          this._finishBall(0, true);
          return;
        }
      }
    }

    // ball has effectively stopped → count the run
    const speed = Math.hypot(v.x, v.z);
    if ((b.position.y <= C.BALL_RADIUS && speed < 2.5) || this._hitTimer > 5) {
      let runs;
      if (distFromCenter > 52) runs = 3;
      else if (distFromCenter > 34) runs = 2;
      else if (distFromCenter > 16) runs = 1;
      else runs = Math.random() < 0.4 ? 1 : 0;
      this._finishBall(runs, false);
    }
  };

  Game.prototype._afterMiss = function () {
    if (this.state !== 'bowling') return;
    // bowled? check stumps line at the striker end
    const b = this.ball;
    const hitStumps = Math.abs(b.position.x) < 0.45 && b.position.y < 1.4 && b.position.y > 0;
    if (hitStumps) {
      this._knockBails();
      this._finishBall(0, true, 'BOWLED!');
    } else {
      // keeper takes it — dot ball
      this.state = 'settle';
      this._hitTimer = 0;
      this._everAirborneOverRope = false;
      // let it carry to the keeper then finish
      const self = this;
      setTimeout(function () {
        if (self.state === 'settle') self._finishBall(0, false, 'dot ball');
      }, 350);
    }
  };

  // ---------------------------------------------------------
  // Conclude a delivery and update the match
  // ---------------------------------------------------------
  Game.prototype._finishBall = function (runs, isWicket, label) {
    if (this._ballClosed) return;
    this._ballClosed = true;
    const m = this.match;
    m.balls += 1;

    let tag;
    if (isWicket) {
      m.wickets += 1;
      tag = 'W';
      this.ui.callout(label || 'OUT!', 'wkt');
    } else {
      m.runs += runs;
      if (runs === 6) { tag = '6'; this.ui.callout('SIX!', 'six'); }
      else if (runs === 4) { tag = '4'; this.ui.callout('FOUR!', 'four'); }
      else if (runs === 0) { tag = '•'; this.ui.callout(label || 'dot', 'dot'); }
      else { tag = String(runs); this.ui.callout(runs + ' run' + (runs > 1 ? 's' : ''), 'run'); }
    }
    m.thisOver.push({ tag: tag, runs: runs, wkt: isWicket });
    this._updateHUD();

    const self = this;
    setTimeout(function () { self._nextDelivery(); }, isWicket ? 1500 : 1200);
  };

  Game.prototype._nextDelivery = function () {
    this._ballClosed = false;
    this._catchChecked = false;
    this._dashFielder = null;
    this._hitAerial = false;
    this._resetFielders();
    this._resetBails();
    this.input.swing = false;
    this.input.aim = 0;

    const m = this.match;
    const inningsOver =
      m.wickets >= m.maxWickets ||
      m.balls >= m.overs * 6 ||
      (m.target && m.runs >= m.target);

    if (inningsOver) { this._endInnings(); return; }

    // new over?
    if (m.balls % 6 === 0) m.thisOver = [];

    this.state = 'ready';
    this._placeBall();
    this._updateHUD();

    // In innings the human is *fielding/bowling*, auto-bowl after a moment.
    if (!this._humanBatting()) {
      this.ui.setBowlButton(true);
    }
  };

  Game.prototype._endInnings = function () {
    const m = this.match;
    if (m.innings === 1) {
      m.first = { side: m.battingSide, runs: m.runs, wickets: m.wickets, balls: m.balls };
      m.innings = 2;
      m.battingSide = m.battingSide === 'YOU' ? 'RIVALS' : 'YOU';
      m.target = m.first.runs + 1;
      m.runs = 0; m.wickets = 0; m.balls = 0; m.thisOver = [];
      this.state = 'break';
      this.ui.showInningsBreak(m, () => {
        this.state = 'ready';
        this._placeBall();
        this._updateHUD();
        this.ui.flashControls(2, m.battingSide);
        if (!this._humanBatting()) this.ui.setBowlButton(true);
      });
    } else {
      this._endMatch();
    }
  };

  Game.prototype._endMatch = function () {
    const m = this.match;
    const chasing = m;
    const firstRuns = m.first.runs;
    const secondRuns = m.runs;
    let result;
    const youBattedFirst = m.first.side === 'YOU';
    const yourScore = youBattedFirst ? firstRuns : secondRuns;
    const rivalScore = youBattedFirst ? secondRuns : firstRuns;

    if (yourScore > rivalScore) result = { win: 'YOU', by: `${yourScore - rivalScore} runs` };
    else if (rivalScore > yourScore) {
      const w = (youBattedFirst ? m.maxWickets - m.wickets : m.first.wickets);
      result = { win: 'RIVALS', by: youBattedFirst ? `${m.maxWickets - m.wickets} wickets` : `${rivalScore - yourScore} runs` };
    } else result = { win: 'TIE', by: 'scores level' };

    m.result = result;
    this.state = 'over';
    this.ui.showResult(m, result, yourScore, rivalScore);
  };

  // ---------------------------------------------------------
  // Cosmetic animation helpers
  // ---------------------------------------------------------
  Game.prototype._animateBatSwing = function () {
    const pivot = this.batPivot;
    pivot.rotation.x = -1.4;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 260;
      if (t >= 1) { pivot.rotation.x = 0; return; }
      pivot.rotation.x = -1.4 + 1.4 * t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  Game.prototype._knockBails = function () {
    const stumps = this.strikerStumps;
    (stumps.userData.bails || []).forEach((bail) => {
      bail.position.y += 0.4;
      bail.position.x += (Math.random() - 0.5);
      bail.rotation.z += Math.random();
    });
  };
  Game.prototype._resetBails = function () {
    const stumps = this.strikerStumps;
    (stumps.userData.bails || []).forEach((bail, i) => {
      bail.rotation.set(0, 0, Math.PI / 2);
      bail.position.set((i - 1) * 0.22 + 0.11, 1.42, 0);
    });
  };

  Game.prototype._spinFielders = function (dt) {
    if (this._dashFielder) {
      const f = this._dashFielder;
      f.position.lerp(new THREE.Vector3(this.ball.position.x, 0, this.ball.position.z), 1 - Math.pow(0.0001, dt));
    }
  };
  Game.prototype._resetFielders = function () {
    this.fielders.forEach((f) => f.position.copy(f.userData.home));
  };

  // ---------------------------------------------------------
  // HUD + resize
  // ---------------------------------------------------------
  Game.prototype._updateHUD = function () {
    this.ui.updateScore(this.match);
  };

  Game.prototype._resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  return Game;
})();
