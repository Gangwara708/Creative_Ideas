/* ============================================================
 * Highway Rush 3D — core game controller
 * Endless curving highway: steer through bends and traffic,
 * hit ramps to jump, back out of blockers with reverse gear,
 * collect coins, earn near-miss bonuses, manage damage and
 * nitro, chase a high score.
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
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700);

    const built = window.RushScene.build();
    Object.assign(this, built);
    this.fx = new window.FX(this.scene);
    this.track = new window.Track(this.scene);

    this.clock = new THREE.Clock();
    this.state = 'menu';   // menu | driving | over
    this.keys = {};
    this.traffic = [];
    this.coins = [];
    this.obstacles = [];
    this._scrollOffset = 0; // world distance the player has covered (can dip in reverse)

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
    // recolor player body paint
    this.player.userData.bodyMat.color.setHex(carColor);

    // clear leftovers
    this.traffic.forEach((t) => this.scene.remove(t.mesh));
    this.coins.forEach((c) => this.scene.remove(c.mesh));
    this.obstacles.forEach((o) => this.scene.remove(o.mesh));
    this.traffic = [];
    this.coins = [];
    this.obstacles = [];

    this.run = {
      speed: C.IDLE_SPEED,
      x: 0,                  // road-relative lateral position
      y: 0, vy: 0,           // jump state
      distance: 0,
      score: 0,
      coins: 0,
      jumps: 0,
      health: C.MAX_HEALTH,
      nitro: C.NITRO_MAX,
      boosting: false,
      reversing: false,
      time: 0,
      spawnTimer: 0,
      obstacleTimer: 2,
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
      // idle menu drift so the menu has life behind it
      this._scrollWorld(10 * dt);
    }

    this.fx.update(dt);
    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  Game.prototype._step = function (dt) {
    const r = this.run, k = this.keys;
    r.time += dt;
    if (r.invuln > 0) r.invuln -= dt;

    // --- throttle / brake / reverse / nitro ---
    const throttle = k['ArrowUp'] || k['KeyW'];
    const brake = k['ArrowDown'] || k['KeyS'];
    const wantBoost = (k['Space'] || k['ShiftLeft']) && r.nitro > 1 && r.speed > 0;
    r.boosting = wantBoost;
    const topSpeed = wantBoost ? C.NITRO_SPEED : C.MAX_SPEED;

    if (wantBoost) {
      r.speed += C.ACCEL * 2 * dt;
    } else if (throttle) {
      r.speed += C.ACCEL * dt;
    } else if (brake) {
      // brake to a stop, then engage reverse gear
      r.speed -= (r.speed > 0 ? C.BRAKE : C.ACCEL * 0.9) * dt;
    } else {
      // coast: settle toward idle cruise (or roll out of reverse)
      if (r.speed > C.IDLE_SPEED) r.speed -= C.DRAG * dt;
      else if (r.speed < 0) r.speed = Math.min(0, r.speed + C.BRAKE * 0.5 * dt);
      else r.speed = Math.min(C.IDLE_SPEED, r.speed + C.ACCEL * 0.6 * dt);
    }
    r.speed = THREE.MathUtils.clamp(r.speed, -C.REVERSE_MAX, topSpeed);
    r.reversing = r.speed < -0.5;

    // reversing lights
    const revLights = this.player.userData.revLights || [];
    revLights.forEach((rl) => rl.material.color.setHex(r.reversing ? 0xfff2cc : 0x222222));

    if (wantBoost) r.nitro = Math.max(0, r.nitro - C.NITRO_BURN * dt);
    else r.nitro = Math.min(C.NITRO_MAX, r.nitro + C.NITRO_REGEN * dt);

    // --- steering + curve pull ---
    let steer = 0;
    if (k['ArrowLeft'] || k['KeyA'] || k._touchLeft) steer -= 1;
    if (k['ArrowRight'] || k['KeyD'] || k._touchRight) steer += 1;
    if (r.reversing) steer = -steer; // steering flips when backing up
    const halfRoad = window.RushScene.roadWidth() / 2 - C.CAR_HALF_W - 0.2;
    const speedFrac = Math.abs(r.speed) / C.MAX_SPEED;
    r.x += steer * C.STEER_SPEED * dt * (0.5 + 0.5 * Math.min(1, speedFrac));
    // curves drag the car toward the outside — steer into them to hold your line
    const pull = this.track.dxAt(this._scrollOffset) / C.SEG_LEN * r.speed * C.CURVE_PULL;
    r.x -= pull * dt;
    r.x = THREE.MathUtils.clamp(r.x, -halfRoad, halfRoad);
    this.player.position.x += (r.x - this.player.position.x) * Math.min(1, dt * 12);
    this.player.rotation.z = -steer * 0.06;
    this.player.rotation.y = -steer * 0.08;

    // --- jump physics ---
    if (r.y > 0 || r.vy > 0) {
      r.vy -= C.JUMP_GRAVITY * dt;
      r.y += r.vy * dt;
      if (r.y <= 0) {
        r.y = 0; r.vy = 0;
        this._shake = Math.max(this._shake || 0, 0.3);
      }
      // nose pitches with the arc
      this.player.rotation.x = THREE.MathUtils.clamp(r.vy * 0.035, -0.4, 0.45);
    } else {
      this.player.rotation.x = 0;
    }
    this.player.position.y = r.y;

    // wheel spin
    this.player.userData.wheels.forEach((wm) => { wm.rotation.x -= r.speed * dt * 1.4; });

    // --- world scroll (player stays at z≈0, world moves) ---
    let ds = r.speed * dt;
    // don't reverse past the road we still have behind us
    if (ds < 0 && this._scrollOffset + ds < this.track.minS() + C.REAR_M * 0.9) {
      ds = 0;
      r.speed = 0;
    }
    if (ds > 0) {
      r.distance += ds;
      r.score += ds * C.SCORE_PER_M;
    }
    this._scrollWorld(ds);

    // --- spawn traffic, coins & obstacles (only while moving forward) ---
    if (r.speed > 5) {
      r.spawnTimer -= dt;
      if (r.spawnTimer <= 0) {
        this._spawnTraffic();
        if (Math.random() < C.COIN_SPAWN_CHANCE) this._spawnCoinRow();
        const t = Math.min(1, r.time / C.DIFFICULTY_RAMP);
        r.spawnTimer = C.SPAWN_INTERVAL_START + (C.SPAWN_INTERVAL_MIN - C.SPAWN_INTERVAL_START) * t;
      }
      r.obstacleTimer -= dt;
      if (r.obstacleTimer <= 0) {
        this._spawnObstacle();
        r.obstacleTimer = C.OBSTACLE_INTERVAL * (0.6 + Math.random() * 0.8);
      }
    }

    // --- nitro flames from the exhaust tips ---
    if (r.boosting && r.nitro > 0) {
      const px2 = this.player.position.x;
      [-0.45, 0.45].forEach((x) => {
        this.fx.spawn({
          pos: new THREE.Vector3(px2 + x, 0.4 + r.y, 2.4),
          vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.2, 9 + Math.random() * 5),
          color: Math.random() < 0.6 ? 0x46b8ff : 0x9fdcff,
          size: 0.45 + Math.random() * 0.3,
          life: 0.22 + Math.random() * 0.15,
          drag: 0.9,
        });
      });
    }

    // --- move world entities, collisions, near misses ---
    this._stepTraffic(dt, ds);
    this._stepObstacles(ds);
    this._stepCoins(ds, dt);

    this.ui.updateHUD(r);
  };

  Game.prototype._scrollWorld = function (ds) {
    this._scrollOffset += ds;
    this.track.update(this._scrollOffset);
    this.scrollTextures.forEach((st) => {
      st.tex.offset.y = (this._scrollOffset / st.unit) % 1;
    });
  };

  // ---------------------------------------------------------
  // Traffic
  // ---------------------------------------------------------
  Game.prototype._laneX = function (lane) {
    return -window.RushScene.roadWidth() / 2 + (lane + 0.5) * C.LANE_WIDTH;
  };

  Game.prototype._spawnTraffic = function () {
    const lane = Math.floor(Math.random() * C.LANES);
    const laneX = this._laneX(lane);

    // don't spawn on top of another car or an obstacle
    for (const t of this.traffic) {
      if (Math.abs(t.laneX - laneX) < 1 && t.mesh.position.z < -C.SPAWN_AHEAD + 30) return;
    }
    for (const o of this.obstacles) {
      if (Math.abs(o.laneX - laneX) < 2 && o.mesh.position.z < -C.SPAWN_AHEAD + 40) return;
    }

    const colors = window.RushScene.TRAFFIC_COLORS;
    const mesh = window.RushScene.makeCar(colors[Math.floor(Math.random() * colors.length)], false);
    mesh.position.set(laneX, 0, -C.SPAWN_AHEAD);
    this.scene.add(mesh);
    this.traffic.push({
      mesh: mesh,
      laneX: laneX,
      speed: C.TRAFFIC_BASE_SPEED + Math.random() * C.TRAFFIC_SPEED_VAR,
      id: Math.random().toString(36).slice(2),
    });
  };

  Game.prototype._stepTraffic = function (dt, ds) {
    const r = this.run;
    const pd = this._scrollOffset;
    const airborne = r.y > 1.0;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      // relative motion: world scrolls by ds, traffic drives forward at its own speed
      t.mesh.position.z += ds - t.speed * dt;
      // follow the road's curve
      t.mesh.position.x = t.laneX + this.track.relX(t.mesh.position.z, pd);
      t.mesh.userData.wheels.forEach((wm) => { wm.rotation.x -= t.speed * dt * 1.4; });

      const dz = t.mesh.position.z; // player at z 0
      const dx = t.laneX - r.x;     // road-relative lateral gap

      // collision check (skipped while flying over a ramp jump)
      if (!airborne && Math.abs(dz) < C.CAR_HALF_L * 2 && Math.abs(dx) < C.CAR_HALF_W * 2) {
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

      // despawn far behind or (when reversing) far ahead
      if (t.mesh.position.z > C.DESPAWN_BEHIND || t.mesh.position.z < -C.SPAWN_AHEAD - 60) {
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
    r.speed = Math.max(0, r.speed * C.CRASH_SLOWDOWN);

    // shove the traffic car away so we don't re-collide instantly
    t.mesh.position.z -= 6;
    t.laneX += Math.sign(t.laneX - r.x || 1) * 1.2;

    // sparks at the impact point
    const impact = this.player.position.clone().lerp(t.mesh.position, 0.5);
    impact.y = 0.7;
    this.fx.burst(impact, 0xffb24d, glancing ? 12 : 24, glancing ? 7 : 11, 0.4);
    this.fx.burst(impact, 0xfff1c9, 6, 5, 0.3);

    this.ui.pop(glancing ? 'SCRAPE!' : 'CRASH!', 'crash');
    this._shake = 0.5;

    if (r.health <= 0) {
      r.health = 0;
      this._gameOver();
    }
    this.ui.updateHUD(r);
  };

  // ---------------------------------------------------------
  // Obstacles: ramps (jump!) and blockers (reverse around them)
  // ---------------------------------------------------------
  Game.prototype._spawnObstacle = function () {
    const isRamp = Math.random() < C.RAMP_SHARE;
    const lane = Math.floor(Math.random() * C.LANES);
    const laneX = this._laneX(lane);

    // keep clear of recently spawned traffic in the same lane
    for (const t of this.traffic) {
      if (Math.abs(t.laneX - laneX) < 2 && t.mesh.position.z < -C.SPAWN_AHEAD + 50) return;
    }

    const mesh = isRamp ? window.RushScene.makeRamp() : window.RushScene.makeBlocker();
    mesh.position.set(laneX, 0, -C.SPAWN_AHEAD - 10);
    this.scene.add(mesh);
    this.obstacles.push({ type: isRamp ? 'ramp' : 'blocker', mesh: mesh, laneX: laneX, used: false });
  };

  Game.prototype._stepObstacles = function (ds) {
    const r = this.run;
    const pd = this._scrollOffset;
    const airborne = r.y > 1.0;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.mesh.position.z += ds; // static on the road: moves only with the world
      o.mesh.position.x = o.laneX + this.track.relX(o.mesh.position.z, pd);

      const dz = o.mesh.position.z;
      const dx = o.laneX - r.x;

      if (o.type === 'ramp') {
        // ride up the ramp → launch
        if (!o.used && r.y < 0.5 && dz > -1.5 && dz < 1.5 && Math.abs(dx) < 1.7) {
          if (r.speed > 8) {
            o.used = true;
            r.vy = C.JUMP_VY * (0.6 + 0.55 * Math.min(1, r.speed / C.MAX_SPEED));
            r.y = 0.1;
            r.jumps += 1;
            r.score += C.JUMP_BONUS;
            this.ui.pop('JUMP! +' + C.JUMP_BONUS, 'near');
          }
        }
      } else {
        // blocker: solid wall — stops you, take the hit, reverse out
        if (!airborne && Math.abs(dz) < C.CAR_HALF_L + 0.6 && Math.abs(dx) < 1.6 + C.CAR_HALF_W) {
          if (r.speed > 0.5 && r.invuln <= 0) {
            r.invuln = C.INVULN_TIME;
            r.health -= C.BLOCKER_DAMAGE;
            const impact = this.player.position.clone();
            impact.y = 0.8; impact.z = -2;
            this.fx.burst(impact, 0xffb24d, 18, 9, 0.4);
            this.ui.pop('BLOCKED! REVERSE!', 'crash');
            this._shake = 0.5;
            if (r.health <= 0) { r.health = 0; this._gameOver(); }
          }
          // can't push through — only reverse gear gets you out
          if (r.speed > 0) r.speed = 0;
        }
      }

      if (dz > 30 || dz < -C.SPAWN_AHEAD - 80) {
        this.scene.remove(o.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  };

  // ---------------------------------------------------------
  // Coins
  // ---------------------------------------------------------
  Game.prototype._spawnCoinRow = function () {
    const lane = Math.floor(Math.random() * C.LANES);
    const laneX = this._laneX(lane);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const mesh = window.RushScene.makeCoin();
      mesh.position.set(laneX, 1.1, -C.SPAWN_AHEAD - i * 3.2);
      this.scene.add(mesh);
      this.coins.push({ mesh: mesh, laneX: laneX });
    }
  };

  Game.prototype._stepCoins = function (ds, dt) {
    const r = this.run;
    const pd = this._scrollOffset;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.position.z += ds;
      c.mesh.position.x = c.laneX + this.track.relX(c.mesh.position.z, pd);
      c.mesh.rotation.z += dt * 4;

      const dz = c.mesh.position.z;
      const dx = c.laneX - r.x;
      if (r.y < 1.0 && Math.abs(dz) < C.CAR_HALF_L && Math.abs(dx) < C.CAR_HALF_W + 0.6) {
        r.coins += 1;
        r.score += C.COIN_VALUE;
        this.fx.burst(c.mesh.position.clone(), 0xffd166, 8, 4, 0.35);
        this.ui.pop('+' + C.COIN_VALUE, 'coin');
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      } else if (dz > C.DESPAWN_BEHIND || dz < -C.SPAWN_AHEAD - 60) {
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
    const py = this.run ? this.run.y : 0;
    const speedFrac = this.run ? Math.abs(this.run.speed) / C.NITRO_SPEED : 0.2;
    // chase cam: pulls back and rises with speed, lifts with jumps
    const target = new THREE.Vector3(px * 0.6, 4.4 + speedFrac + py * 0.55, 9.5 + speedFrac * 3);
    this.camera.position.lerp(target, 1 - Math.pow(0.0005, dt));

    // look into the upcoming curve
    let lookX = px * 0.4 + this.track.relX(-18, this._scrollOffset) * 0.45;
    let lookY = 1.5 + py * 0.5;
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
