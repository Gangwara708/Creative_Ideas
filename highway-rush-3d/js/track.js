/* ============================================================
 * Track — segment-based curving highway.
 * The road is a ring of short segments that recycle from behind
 * the player to the front, each with a procedurally generated
 * lateral offset (the centerline). Rendering is done in
 * road-relative space: everything is drawn offset by
 * cx(s) - cx(playerDistance), which makes curves sweep toward
 * the camera while the player's x stays road-relative.
 * Segments carry their own decorations (dashes, edge lines,
 * guard rails, lamps, light pools, buildings) so scenery
 * follows every bend.
 * ============================================================ */
window.Track = (function () {
  const C = window.CFG;
  const T = window.Textures;

  function Track(scene) {
    const SEG = C.SEG_LEN, N = C.SEG_COUNT;
    this.scene = scene;
    this.segs = [];
    this._cxPd = 0;

    // --- curve generator state ---
    this._dx = 0;            // lateral drift per segment
    this._targetDx = 0;
    this._sectionLeft = 24;  // segments left in the current section
    this._frontS = -C.REAR_M - SEG; // distance of the last generated segment
    this._frontCx = 0;

    // --- shared materials ---
    const w = window.RushScene.roadWidth();
    this._w = w;
    this._roadTexBase = T.asphalt();
    this._dashMat = new THREE.MeshBasicMaterial({ color: 0xc9cdd4 });
    this._edgeMat = new THREE.MeshBasicMaterial({ color: 0xd9a83f });
    this._railMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.8, roughness: 0.35 });
    this._poleMat = new THREE.MeshStandardMaterial({ color: 0x52575e, metalness: 0.6, roughness: 0.5 });
    this._lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9b8 });
    this._glowTex = T.glow('rgba(255,240,200,1)', 'rgba(255,220,150,0.4)');
    this._poolTex = T.lightPool();
    this._facadeMats = [0, 1, 2].map((i) => {
      const tex = T.facade(i);
      return new THREE.MeshStandardMaterial({
        map: tex, emissiveMap: tex, emissive: 0xffffff,
        emissiveIntensity: 0.55, roughness: 1,
      });
    });

    for (let i = 0; i < N; i++) {
      const g = this._gen();
      this.segs.push(this._makeSegment(g.s, g.cx, g.dx));
    }
    this.update(0);
  }

  // advance the curve generator by one segment
  Track.prototype._gen = function () {
    if (--this._sectionLeft <= 0) {
      this._sectionLeft = 20 + Math.floor(Math.random() * 40); // 100–300 m sections
      const r = Math.random();
      this._targetDx = r < 0.35
        ? 0
        : (0.08 + Math.random() * 0.36) * (Math.random() < 0.5 ? -1 : 1);
    }
    // ease toward the target curvature so bends arc in and out
    this._dx += THREE.MathUtils.clamp(this._targetDx - this._dx, -0.022, 0.022);
    this._frontCx += this._dx;
    this._frontS += C.SEG_LEN;
    return { s: this._frontS, cx: this._frontCx, dx: this._dx };
  };

  Track.prototype._makeSegment = function (s, cx, dx) {
    const SEG = C.SEG_LEN, w = this._w;
    const group = new THREE.Group();
    const idx = Math.round(s / SEG);

    // road surface (own texture clone so the tile offset matches s)
    const tex = this._roadTexBase.clone();
    tex.needsUpdate = true;
    tex.repeat.set(2, SEG / 10);
    tex.offset.y = ((s / 10) % 1 + 1) % 1;
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(w + C.SHOULDER * 2, SEG + 0.35),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.05 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -SEG / 2);
    road.receiveShadow = true;
    group.add(road);
    group.userData.roadTex = tex;

    // lane dashes (every other segment → dashed lines)
    const dashes = new THREE.Group();
    for (let lane = 1; lane < C.LANES; lane++) {
      const x = -w / 2 + lane * C.LANE_WIDTH;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, SEG * 0.62), this._dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.012, -SEG / 2);
      dashes.add(dash);
    }
    dashes.visible = idx % 2 === 0;
    group.add(dashes);
    group.userData.dashes = dashes;

    // solid edge lines + guard rails
    [-1, 1].forEach((side) => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, SEG + 0.35), this._edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * w / 2, 0.012, -SEG / 2);
      group.add(edge);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, SEG + 0.2), this._railMat);
      rail.position.set(side * (w / 2 + C.SHOULDER), 0.55, -SEG / 2);
      group.add(rail);
    });

    // every 6th segment (30 m): street lamps + light pools
    if (idx % 6 === 0) {
      [-1, 1].forEach((side) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.4, 8), this._poleMat);
        pole.position.set(side * (w / 2 + 1.6), 3.7, 0);
        group.add(pole);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6), this._poleMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(side * (w / 2 + 0.75), 7.3, 0);
        group.add(arm);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.32), this._lampMat);
        head.position.set(side * (w / 2 + 0.1), 7.22, 0);
        group.add(head);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this._glowTex, color: 0xffe2a8, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        glow.scale.setScalar(3.4);
        glow.position.set(side * (w / 2 + 0.1), 7.2, 0);
        group.add(glow);
        const pool = new THREE.Mesh(
          new THREE.PlaneGeometry(9, 9),
          new THREE.MeshBasicMaterial({
            map: this._poolTex, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false,
          })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(side * (w / 2 - 1.2), 0.015, 0);
        group.add(pool);
      });
    }

    // every 12th segment (60 m): buildings flanking the road
    if (idx % 12 === 0) {
      [-1, 1].forEach((side) => {
        const h = 10 + Math.random() * 22;
        const bw = 9 + Math.random() * 7;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(bw, h, 13),
          this._facadeMats[Math.abs(idx / 12) % this._facadeMats.length | 0]
        );
        bldg.position.set(side * (w / 2 + 18 + Math.random() * 12), h / 2, -4);
        group.add(bldg);
      });
    }

    this.scene.add(group);
    return { s: s, cx: cx, dx: dx, group: group };
  };

  /** Recycle segments that fell behind and re-place everything for the current distance. */
  Track.prototype.update = function (pd) {
    const SEG = C.SEG_LEN;
    // recycle from the back of the ring to the front
    while (this.segs[0].s + SEG < pd - C.REAR_M) {
      const seg = this.segs.shift();
      const g = this._gen();
      seg.s = g.s; seg.cx = g.cx; seg.dx = g.dx;
      seg.group.userData.roadTex.offset.y = ((g.s / 10) % 1 + 1) % 1;
      seg.group.userData.dashes.visible = Math.round(g.s / SEG) % 2 === 0;
      this.segs.push(seg);
    }

    this._cxPd = this.cxAt(pd);
    for (let i = 0; i < this.segs.length; i++) {
      const seg = this.segs[i];
      seg.group.position.set(seg.cx - this._cxPd, 0, pd - seg.s);
      seg.group.rotation.y = -Math.atan2(seg.dx, SEG);
    }
  };

  /** Centerline x at track distance s (linear interpolation between segments). */
  Track.prototype.cxAt = function (s) {
    const SEG = C.SEG_LEN;
    const base = this.segs[0].s;
    let i = Math.floor((s - base) / SEG);
    if (i < 0) i = 0;
    if (i >= this.segs.length - 1) return this.segs[this.segs.length - 1].cx;
    const a = this.segs[i], b = this.segs[i + 1];
    const f = THREE.MathUtils.clamp((s - a.s) / SEG, 0, 1);
    return a.cx + (b.cx - a.cx) * f;
  };

  /** Curvature (lateral drift per segment) under track distance s. */
  Track.prototype.dxAt = function (s) {
    const base = this.segs[0].s;
    let i = Math.floor((s - base) / C.SEG_LEN);
    i = THREE.MathUtils.clamp(i, 0, this.segs.length - 1);
    return this.segs[i].dx;
  };

  /** Road-relative → world lateral offset for an entity at world z (player at pd). */
  Track.prototype.relX = function (z, pd) {
    return this.cxAt(pd - z) - this._cxPd;
  };

  /** Smallest track distance still covered (limits how far you can reverse). */
  Track.prototype.minS = function () {
    return this.segs[0].s;
  };

  return Track;
})();
