/* ============================================================
 * Highway Rush 3D — core game controller
 * Endless highway driving: steer through traffic, collect coins,
 * earn near-miss bonuses, manage damage, use nitro, chase a
 * high score. Crash three times and it's game over.
 * ============================================================ */
window.RushGame = (function () {
  const C = window.CFG;

  function Game(opts) {
    this.canvas = opts.canvas;
    this.ui = opts.ui;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);

    const built = window.RushScene.build();
    Object.assign(this, built);

    this.clock = new THREE.Clock();
    this.state = 'menu';   // menu | driving | over
    this.keys = {};
    this.traffic = [];
    this.coins = [];
    this._scrollOffset = 0;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
    this._bindInput();
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  // ---------------------------------------------------------
  // Run setup
  // ---------------------------------------------------------
  Game.prototype.startRun = function (carColor) {
    // recolor player body
    const body = this.player.children[0];
    body.material.color.setHex(carColor);

    // clear leftovers
    this.traffic.forEach((t) => this.scene.remove(t.mesh));
    this.coins.forEach((c) => this.scene.remove(c.mesh));
    this.traffic = [];
    this.coins = [];

    this.run = {
      speed: C.MIN_SPEED,
      x: 0,
      distance: 0,
      score: 0,
      coins: 0,
      health: C.MAX_HEALTH,
      nitro: C.NITRO_MAX,
      boosting: false,
      time: 0,
      spawnTimer: 0,
      invuln: 0,
      nearMissed: new Set(),
    };
    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    this.state = 'driving';
    this.ui.hideOverlay();
    this.ui.updateHUD(this.run);
  };

  // ---------------------------------------------------------
  // Input
  // ---------------------------------------------------------
  Game.prototype._bindInput = function () {
    const self = this;
    window.addEventListener('keydown', function (e) {
      self.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { self.keys[e.code] = false; });

    // touch steering: left/right half of screen
    this.canvas.addEventListener('pointerdown', function (e) {
      if (self.state !== 'driving') return;
      if (e.clientX < window.innerWidth / 2) self.keys._touchLeft = true;
      else self.keys._touchRight = true;
    });
    window.addEventListener('pointerup', function () {
      self.keys._touchLeft = false;
      self.keys._touchRight = false;
    });
  };

  // ---------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------
  Game.prototype._animate = function () {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'driving') {
      this._step(dt);
    } else {
      // idle menu spin: slow scroll so the menu has life behind it
      this._scrollWorld(10 * dt);
    }

    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  Game.prototype._step = function (dt) {
    const r = this.run, k = this.keys;
    r.time += dt;
    if (r.invuln > 0) r.invuln -= dt;

    // --- throttle / brake / nitro ---
    const wantBoost = (k['Space'] || k['ShiftLeft']) && r.nitro > 1;
    r.boosting = wantBoost;
    const topSpeed = wantBoost ? C.NITRO_SPEED : C.MAX_SPEED;

    if (k['ArrowUp'] || k['KeyW'] || wantBoost) {
      r.speed += (wantBoost ? C.ACCEL * 2 : C.ACCEL) * dt;
    } else if (k['ArrowDown'] || k['KeyS']) {
      r.speed -= C.BRAKE * dt;
    } else {
      r.speed -= C.DRAG * dt;
    }
    r.speed = THREE.MathUtils.clamp(r.speed, C.MIN_SPEED, topSpeed);

    if (wantBoost) r.nitro = Math.max(0, r.nitro - C.NITRO_BURN * dt);
    else r.nitro = Math.min(C.NITRO_MAX, r.nitro + C.NITRO_REGEN * dt);

    // --- steering ---
    let steer = 0;
    if (k['ArrowLeft'] || k['KeyA'] || k._touchLeft) steer -= 1;
    if (k['ArrowRight'] || k['KeyD'] || k._touchRight) steer += 1;
    const halfRoad = window.RushScene.roadWidth() / 2 - C.CAR_HALF_W - 0.2;
    r.x += steer * C.STEER_SPEED * dt * (0.5 + 0.5 * r.speed / C.MAX_SPEED);
    r.x = THREE.MathUtils.clamp(r.x, -halfRoad, halfRoad);
    this.player.position.x += (r.x - this.player.position.x) * Math.min(1, dt * 12);
    this.player.rotation.z = -steer * 0.06;
    this.player.rotation.y = -steer * 0.08;

    // wheel spin
    this.player.userData.wheels.forEach((wm) => { wm.rotation.x -= r.speed * dt * 1.4; });

    // --- world scroll (player stays at z≈0, world moves +z) ---
    const ds = r.speed * dt;
    r.distance += ds;
    r.score += ds * C.SCORE_PER_M;
    this._scrollWorld(ds);

    // --- spawn traffic & coins ---
    r.spawnTimer -= dt;
    if (r.spawnTimer <= 0) {
      this._spawnTraffic();
      if (Math.random() < C.COIN_SPAWN_CHANCE) this._spawnCoinRow();
      const t = Math.min(1, r.time / C.DIFFICULTY_RAMP);
      r.spawnTimer = C.SPAWN_INTERVAL_START + (C.SPAWN_INTERVAL_MIN - C.SPAWN_INTERVAL_START) * t;
    }

    // --- move traffic, collisions, near misses ---
    this._stepTraffic(dt, ds);
    this._stepCoins(ds, dt);

    this.ui.updateHUD(r);
  };

  Game.prototype._scrollWorld = function (ds) {
    // markings & scenery loop every 8 / 30 metres respectively
    this._scrollOffset += ds;
    this.markings.position.z = this._scrollOffset % 8;
    this.scenery.position.z = this._scrollOffset % 30;
  };

  // ---------------------------------------------------------
  // Traffic
  // ---------------------------------------------------------
  Game.prototype._spawnTraffic = function () {
    const lanes = C.LANES;
    const lane = Math.floor(Math.random() * lanes);
    const x = -window.RushScene.roadWidth() / 2 + (lane + 0.5) * C.LANE_WIDTH;

    // don't spawn on top of another car
    for (const t of this.traffic) {
      if (Math.abs(t.mesh.position.x - x) < 1 && t.mesh.position.z < -C.SPAWN_AHEAD + 30) return;
    }

    const colors = window.RushScene.TRAFFIC_COLORS;
    const mesh = window.RushScene.makeCar(colors[Math.floor(Math.random() * colors.length)], false);
    mesh.position.set(x, 0, -C.SPAWN_AHEAD);
    this.scene.add(mesh);
    this.traffic.push({
      mesh: mesh,
      speed: C.TRAFFIC_BASE_SPEED + Math.random() * C.TRAFFIC_SPEED_VAR,
      id: Math.random().toString(36).slice(2),
    });
  };

  Game.prototype._stepTraffic = function (dt, ds) {
    const r = this.run;
    const px = this.player.position.x;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      // relative motion: world scrolls toward player by ds, traffic drives forward at its own speed
      t.mesh.position.z += ds - t.speed * dt;
      t.mesh.userData.wheels.forEach((wm) => { wm.rotation.x -= t.speed * dt * 1.4; });

      const dz = t.mesh.position.z; // player at z 0
      const dx = t.mesh.position.x - px;

      // collision check (AABB overlap)
      if (Math.abs(dz) < C.CAR_HALF_L * 2 && Math.abs(dx) < C.CAR_HALF_W * 2) {
        this._handleCrash(t, dx);
      } else if (
        // near miss: passed alongside closely at speed
        dz > 0 && dz < 2 && Math.abs(dx) < C.NEAR_MISS_DIST + C.CAR_HALF_W * 2 &&
        !r.nearMissed.has(t.id) && r.speed > C.MAX_SPEED * 0.5
      ) {
        r.nearMissed.add(t.id);
        r.score += C.NEAR_MISS_BONUS;
        r.nitro = Math.min(C.NITRO_MAX, r.nitro + C.NITRO_NEAR_MISS);
        this.ui.pop('NEAR MISS +' + C.NEAR_MISS_BONUS, 'near');
      }

      // despawn behind
      if (t.mesh.position.z > C.DESPAWN_BEHIND) {
        this.scene.remove(t.mesh);
        this.traffic.splice(i, 1);
      }
    }
  };

  Game.prototype._handleCrash = function (t, dx) {
    const r = this.run;
    if (r.invuln > 0) return;
    r.invuln = C.INVULN_TIME;

    const glancing = Math.abs(dx) > C.CAR_HALF_W * 1.4;
    const dmg = glancing ? C.SCRAPE_DAMAGE : C.CRASH_DAMAGE;
    r.health -= dmg;
    r.speed = Math.max(C.MIN_SPEED, r.speed * C.CRASH_SLOWDOWN);

    // shove the traffic car away so we don't re-collide instantly
    t.mesh.position.z -= 6;
    t.mesh.position.x += Math.sign(t.mesh.position.x - this.player.position.x || 1) * 1.2;

    this.ui.pop(glancing ? 'SCRAPE!' : 'CRASH!', 'crash');
    this._shake = 0.5;

    if (r.health <= 0) {
      r.health = 0;
      this._gameOver();
    }
    this.ui.updateHUD(r);
  };

  // ---------------------------------------------------------
  // Coins
  // ---------------------------------------------------------
  Game.prototype._spawnCoinRow = function () {
    const lane = Math.floor(Math.random() * C.LANES);
    const x = -window.RushScene.roadWidth() / 2 + (lane + 0.5) * C.LANE_WIDTH;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const mesh = window.RushScene.makeCoin();
      mesh.position.set(x, 1.1, -C.SPAWN_AHEAD - i * 3.2);
      this.scene.add(mesh);
      this.coins.push({ mesh: mesh });
    }
  };

  Game.prototype._stepCoins = function (ds, dt) {
    const r = this.run;
    const px = this.player.position.x;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.position.z += ds;
      c.mesh.rotation.z += dt * 4;

      const dz = c.mesh.position.z;
      const dx = c.mesh.position.x - px;
      if (Math.abs(dz) < C.CAR_HALF_L && Math.abs(dx) < C.CAR_HALF_W + 0.6) {
        r.coins += 1;
        r.score += C.COIN_VALUE;
        this.ui.pop('+' + C.COIN_VALUE, 'coin');
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      } else if (dz > C.DESPAWN_BEHIND) {
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      }
    }
  };

  // ---------------------------------------------------------
  // Game over
  // ---------------------------------------------------------
  Game.prototype._gameOver = function () {
    const r = this.run;
    this.state = 'over';
    const best = Math.max(r.score | 0, this._loadBest());
    localStorage.setItem('hr3d_best', String(best));
    this.ui.showGameOver(r, best);
  };

  Game.prototype._loadBest = function () {
    return parseInt(localStorage.getItem('hr3d_best') || '0', 10);
  };

  // ---------------------------------------------------------
  // Camera & resize
  // ---------------------------------------------------------
  Game.prototype._updateCamera = function (dt) {
    const px = this.player.position.x;
    const speedFrac = this.run ? this.run.speed / C.NITRO_SPEED : 0.2;
    // chase cam: pulls back and widens FOV slightly with speed
    const target = new THREE.Vector3(px * 0.6, 4.4 + speedFrac, 9.5 + speedFrac * 3);
    this.camera.position.lerp(target, 1 - Math.pow(0.0005, dt));

    let lookX = px * 0.4, lookY = 1.5;
    if (this._shake && this._shake > 0) {
      this._shake -= dt;
      lookX += (Math.random() - 0.5) * this._shake * 1.6;
      lookY += (Math.random() - 0.5) * this._shake * 1.2;
    }
    this.camera.lookAt(lookX, lookY, -14);

    const wantFov = 62 + (this.run && this.run.boosting ? 10 : 0) + speedFrac * 4;
    this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, dt * 5);
    this.camera.updateProjectionMatrix();
  };

  Game.prototype._resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  return Game;
})();
