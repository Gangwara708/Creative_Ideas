/* ============================================================
 * Procedural textures — asphalt, grass, building facades,
 * dusk sky, glow sprites and an environment cubemap.
 * Everything is drawn on <canvas>; zero external assets.
 * ============================================================ */
window.Textures = (function () {
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function noise(ctx, w, h, base, spread, alpha) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * spread;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---- Asphalt with tire-wear tracks ----
  function asphalt() {
    const c = canvas(512, 512), ctx = c.getContext('2d');
    ctx.fillStyle = '#34383f';
    ctx.fillRect(0, 0, 512, 512);
    noise(ctx, 512, 512, 0, 46);
    // darker wheel tracks down the tile
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0.18, 'rgba(0,0,0,0)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.22)');
    grad.addColorStop(0.42, 'rgba(0,0,0,0)');
    grad.addColorStop(0.58, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.22)');
    grad.addColorStop(0.82, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    // cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = Math.random() * 512, y = Math.random() * 512;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 60; y += Math.random() * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    return tex;
  }

  // ---- Grass / roadside dirt ----
  function grass() {
    const c = canvas(256, 256), ctx = c.getContext('2d');
    ctx.fillStyle = '#2c3b2a';
    ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0, 40);
    // patchy tufts
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(58,82,48,0.5)' : 'rgba(34,46,32,0.5)';
      const x = Math.random() * 256, y = Math.random() * 256;
      ctx.fillRect(x, y, 2 + Math.random() * 5, 2 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  // ---- Building facade with lit windows (dusk) ----
  function facade(seed) {
    const c = canvas(256, 256), ctx = c.getContext('2d');
    const bases = ['#1d2433', '#232c40', '#191f2c'];
    ctx.fillStyle = bases[seed % bases.length];
    ctx.fillRect(0, 0, 256, 256);
    const cols = 7, rows = 10, wm = 10;
    const cw = (256 - wm * 2) / cols, rh = (256 - wm * 2) / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const lit = Math.random() < 0.38;
        ctx.fillStyle = lit
          ? (Math.random() < 0.7 ? '#ffd98a' : '#aacdf0')
          : '#0c1118';
        ctx.fillRect(wm + i * cw + 3, wm + j * rh + 3, cw - 6, rh - 6);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // ---- Dusk sky gradient (for a dome) ----
  function sky() {
    const c = canvas(64, 512), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, '#10162b');   // zenith
    g.addColorStop(0.45, '#33305e');
    g.addColorStop(0.68, '#7a4a6c');
    g.addColorStop(0.82, '#d4774e');  // horizon glow
    g.addColorStop(0.9, '#f0a45e');
    g.addColorStop(1.0, '#241a1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // ---- Soft radial glow (sprites: lights, particles) ----
  function glow(inner, outer) {
    const c = canvas(128, 128), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, inner || 'rgba(255,255,255,1)');
    g.addColorStop(0.35, outer || 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // ---- Light pool cast on the road under street lamps ----
  function lightPool() {
    return glow('rgba(255,220,150,0.5)', 'rgba(255,200,120,0.18)');
  }

  // ---- Simple gradient cubemap so car paint/glass has reflections ----
  function envMap() {
    const faces = [];
    for (let i = 0; i < 6; i++) {
      const c = canvas(64, 64), ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 64);
      if (i === 2) {           // +Y (up): sky
        g.addColorStop(0, '#43406e'); g.addColorStop(1, '#43406e');
      } else if (i === 3) {    // -Y (down): ground
        g.addColorStop(0, '#191c20'); g.addColorStop(1, '#191c20');
      } else {                 // sides: dusk gradient
        g.addColorStop(0, '#3a3766');
        g.addColorStop(0.65, '#8a5560');
        g.addColorStop(0.8, '#e09457');
        g.addColorStop(1, '#23191c');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      faces.push(c);
    }
    const tex = new THREE.CubeTexture(faces);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  return { asphalt, grass, facade, sky, glow, lightPool, envMap };
})();
