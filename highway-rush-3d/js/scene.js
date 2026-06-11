/* ============================================================
 * Scene builder — sky, lighting, ground, and the vehicles /
 * pickups / obstacles. The curving road itself is built by
 * Track (js/track.js). Everything is generated procedurally.
 * ============================================================ */
window.RushScene = (function () {
  const C = window.CFG;
  const T = window.Textures;

  function roadWidth() {
    return C.LANES * C.LANE_WIDTH;
  }

  // shared resources (created once on build)
  let ENV = null;
  let GLOW_WARM = null, GLOW_RED = null;
  let HAZARD = null;

  function build() {
    ENV = T.envMap();
    GLOW_WARM = T.glow('rgba(255,240,200,1)', 'rgba(255,220,150,0.4)');
    GLOW_RED = T.glow('rgba(255,90,80,1)', 'rgba(255,60,50,0.4)');
    HAZARD = T.hazard();

    const scene = new THREE.Scene();
    scene.environment = ENV;
    scene.fog = new THREE.Fog(0x4a3a55, 70, 230);

    // ---- Sky dome ----
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(320, 24, 16),
      new THREE.MeshBasicMaterial({ map: T.sky(), side: THREE.BackSide, fog: false })
    );
    scene.add(sky);

    // low sun glow on the horizon ahead
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: T.glow('rgba(255,190,120,1)', 'rgba(255,150,80,0.5)'),
      color: 0xffc080,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }));
    sunGlow.scale.setScalar(160);
    sunGlow.position.set(-40, 18, -300);
    scene.add(sunGlow);

    // ---- Lights (dusk) ----
    const hemi = new THREE.HemisphereLight(0x8a7bb8, 0x1c1a22, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffb070, 0.95);
    sun.position.set(-35, 28, -60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 60;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
    sun.shadow.bias = -0.0008;
    scene.add(sun);

    // ---- Ground plane under everything (textured, scrolling) ----
    const grassTex = T.grass();
    grassTex.repeat.set(40, 40);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(360, C.ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.04, -C.ROAD_LENGTH / 2 + 40);
    ground.receiveShadow = true;
    scene.add(ground);

    // textures that must scroll with the world (tex + metres per repeat)
    const scrollTextures = [
      { tex: grassTex, unit: C.ROAD_LENGTH / 40 },
    ];

    // ---- Player car ----
    const player = makeCar(0xff5e2c, true);
    player.position.set(0, 0, 0);
    scene.add(player);

    return { scene, player, sun, scrollTextures };
  }

  /** Realistic-silhouette car: extruded side profile + glass canopy. Nose toward -z. */
  function makeCar(color, isPlayer) {
    const g = new THREE.Group();
    const W = 1.86;

    // body: side profile up to the beltline (x = along length, +x = front)
    const body = new THREE.Shape();
    body.moveTo(-2.25, 0.3);
    body.lineTo(-2.32, 0.72);
    body.lineTo(-2.05, 0.92);   // trunk lip
    body.lineTo(1.45, 0.92);    // beltline
    body.lineTo(2.18, 0.78);    // hood slope
    body.lineTo(2.32, 0.52);    // nose
    body.lineTo(2.26, 0.3);
    body.closePath();
    const bodyGeo = new THREE.ExtrudeGeometry(body, {
      depth: W, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.09, bevelSegments: 3,
    });
    bodyGeo.translate(0, 0, -W / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color, metalness: 0.85, roughness: 0.25, envMap: ENV, envMapIntensity: 1.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.y = Math.PI / 2; // profile +x → world -z (nose forward)
    bodyMesh.castShadow = true;
    g.add(bodyMesh);

    // glass canopy above the beltline
    const cab = new THREE.Shape();
    cab.moveTo(-1.75, 0.92);
    cab.lineTo(-1.05, 1.38);    // rear screen
    cab.lineTo(0.45, 1.4);      // roof
    cab.lineTo(1.2, 0.92);      // windshield
    cab.closePath();
    const cabGeo = new THREE.ExtrudeGeometry(cab, {
      depth: W - 0.34, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2,
    });
    cabGeo.translate(0, 0, -(W - 0.34) / 2);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0d161f, metalness: 0.95, roughness: 0.08, envMap: ENV, envMapIntensity: 1.4,
    });
    const cabMesh = new THREE.Mesh(cabGeo, glassMat);
    cabMesh.rotation.y = Math.PI / 2;
    cabMesh.castShadow = true;
    g.add(cabMesh);

    // wheels: tire + alloy rim
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 18);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.95 });
    const rimGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.34, 12);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xb8bec6, metalness: 0.95, roughness: 0.2, envMap: ENV,
    });
    const wheels = [];
    [[-0.93, -1.42], [0.93, -1.42], [-0.93, 1.42], [0.93, 1.42]].forEach((p) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(p[0], 0.42, p[1]);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      tire.add(rim);
      g.add(tire);
      wheels.push(tire);
    });
    g.userData.wheels = wheels;
    g.userData.bodyMat = bodyMat;

    // headlights + taillights (emissive blocks + glow sprites)
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff4d0 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2e24 });
    [-0.62, 0.62].forEach((x) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), headMat);
      hl.position.set(x, 0.62, -2.33);
      g.add(hl);
      const hg = new THREE.Sprite(new THREE.SpriteMaterial({
        map: GLOW_WARM, color: 0xfff0c0, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      hg.scale.setScalar(0.9);
      hg.position.set(x, 0.62, -2.42);
      g.add(hg);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.13, 0.06), tailMat);
      tl.position.set(x, 0.78, 2.34);
      g.add(tl);
      const tg = new THREE.Sprite(new THREE.SpriteMaterial({
        map: GLOW_RED, color: 0xff4438, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      tg.scale.setScalar(0.7);
      tg.position.set(x, 0.78, 2.42);
      g.add(tg);
    });

    if (isPlayer) {
      // rear spoiler
      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.07, 0.45),
        bodyMat
      );
      spoiler.position.set(0, 1.12, 2.05);
      spoiler.castShadow = true;
      g.add(spoiler);
      [-0.75, 0.75].forEach((x) => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), glassMat);
        strut.position.set(x, 1.0, 2.05);
        g.add(strut);
      });

      // real headlight beam lighting the road ahead
      const beam = new THREE.SpotLight(0xfff0cc, 1.4, 55, 0.42, 0.5, 1.2);
      beam.position.set(0, 0.9, -1.8);
      beam.target.position.set(0, 0, -40);
      g.add(beam);
      g.add(beam.target);

      // exhaust tips (nitro particles emit from here)
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x6c7077, metalness: 0.9, roughness: 0.25 });
      [-0.45, 0.45].forEach((x) => {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 10), tipMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.set(x, 0.38, 2.32);
        g.add(tip);
      });

      // reversing lights (lit only in reverse gear)
      const revMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const revLights = [];
      [-0.32, 0.32].forEach((x) => {
        const rl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.05), revMat.clone());
        rl.position.set(x, 0.62, 2.34);
        g.add(rl);
        revLights.push(rl);
      });
      g.userData.revLights = revLights;
    }
    return g;
  }

  /** Jump ramp: hazard-striped wedge rising away from the player. */
  function makeRamp() {
    const g = new THREE.Group();
    const L = C.RAMP_LENGTH, H = C.RAMP_HEIGHT, W = 3.0;
    const profile = new THREE.Shape();
    profile.moveTo(0, 0);        // low approach edge (player side)
    profile.lineTo(L, H);        // top lip
    profile.lineTo(L, 0);
    profile.closePath();
    const geo = new THREE.ExtrudeGeometry(profile, { depth: W, bevelEnabled: false });
    geo.translate(0, 0, -W / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8d6a35, metalness: 0.3, roughness: 0.7 });
    const wedge = new THREE.Mesh(geo, mat);
    wedge.rotation.y = Math.PI / 2; // profile +x → world -z (rises away from player)
    wedge.castShadow = true;
    g.add(wedge);

    // hazard-striped back face so it reads clearly at speed
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(W, Math.hypot(L, H)),
      new THREE.MeshStandardMaterial({ map: HAZARD, roughness: 0.8 })
    );
    face.position.set(0, H / 2 + 0.01, -L / 2);
    face.rotation.x = -Math.atan2(L, H);
    g.add(face);

    // edge marker glows
    [-1, 1].forEach((side) => {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: GLOW_WARM, color: 0xffcf6a, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      m.scale.setScalar(0.8);
      m.position.set(side * (W / 2 - 0.1), H + 0.2, -L);
      g.add(m);
    });
    return g;
  }

  /** Concrete lane blocker with hazard stripes — stops you dead. */
  function makeBlocker() {
    const g = new THREE.Group();
    const W = 3.2;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(W, 1.05, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x9b9b95, roughness: 0.9 })
    );
    base.position.y = 0.55;
    base.castShadow = true;
    g.add(base);

    const stripeTex = HAZARD.clone();
    stripeTex.needsUpdate = true;
    stripeTex.repeat.set(2, 1);
    const stripes = new THREE.Mesh(
      new THREE.PlaneGeometry(W, 0.5),
      new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8 })
    );
    stripes.position.set(0, 0.75, -0.44);
    stripes.rotation.y = Math.PI;
    g.add(stripes);

    // warning beacon
    const beacon = new THREE.Sprite(new THREE.SpriteMaterial({
      map: GLOW_RED, color: 0xff5040, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    beacon.scale.setScalar(1.1);
    beacon.position.set(0, 1.35, 0);
    g.add(beacon);
    return g;
  }

  function makeCoin() {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 18),
      new THREE.MeshStandardMaterial({
        color: 0xffd166, metalness: 0.9, roughness: 0.18, envMap: ENV,
        emissive: 0x8a6a14, emissiveIntensity: 0.5,
      })
    );
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 1.1;
    return coin;
  }

  const TRAFFIC_COLORS = [0x3f7fc4, 0x8e44ad, 0x239b56, 0xa93226, 0xd4ac0d, 0x839192, 0x2e4053, 0xdde0e3];

  return { build, makeCar, makeCoin, makeRamp, makeBlocker, TRAFFIC_COLORS, roadWidth };
})();
