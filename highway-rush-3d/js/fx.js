/* ============================================================
 * FX — lightweight pooled particle system using additive
 * sprites. Used for nitro flames, crash sparks, coin bursts.
 * ============================================================ */
window.FX = (function () {
  function FX(scene) {
    this.scene = scene;
    this.tex = window.Textures.glow();
    this.pool = [];
    this.active = [];
  }

  FX.prototype._get = function () {
    let s = this.pool.pop();
    if (!s) {
      const mat = new THREE.SpriteMaterial({
        map: this.tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      s = new THREE.Sprite(mat);
    }
    this.scene.add(s);
    return s;
  };

  /** opts: pos(Vector3), vel(Vector3), color, size, life, drag, gravity */
  FX.prototype.spawn = function (opts) {
    const s = this._get();
    s.position.copy(opts.pos);
    s.material.color.setHex(opts.color);
    s.material.opacity = 1;
    s.scale.setScalar(opts.size);
    this.active.push({
      sprite: s,
      vel: opts.vel.clone(),
      life: opts.life,
      maxLife: opts.life,
      size: opts.size,
      drag: opts.drag !== undefined ? opts.drag : 0.9,
      gravity: opts.gravity || 0,
    });
  };

  /** Radial burst (sparks). */
  FX.prototype.burst = function (pos, color, count, speed, size) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 0.9 + 0.2;
      this.spawn({
        pos: pos,
        vel: new THREE.Vector3(Math.cos(a) * speed * Math.random(), up * speed * 0.6, Math.sin(a) * speed * Math.random()),
        color: color,
        size: (size || 0.5) * (0.6 + Math.random() * 0.8),
        life: 0.35 + Math.random() * 0.4,
        drag: 0.82,
        gravity: 14,
      });
    }
  };

  FX.prototype.update = function (dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        this.pool.push(p.sprite);
        this.active.splice(i, 1);
        continue;
      }
      const f = Math.pow(p.drag, dt * 60);
      p.vel.multiplyScalar(f);
      p.vel.y -= p.gravity * dt;
      p.sprite.position.addScaledVector(p.vel, dt);
      const t = p.life / p.maxLife;
      p.sprite.material.opacity = t;
      p.sprite.scale.setScalar(p.size * (0.5 + 0.5 * t));
    }
  };

  return FX;
})();
