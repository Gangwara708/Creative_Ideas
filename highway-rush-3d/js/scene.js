/* ============================================================
 * Scene builder — dusk highway with textured asphalt, lit
 * buildings, street lamps, sky dome, and properly shaped cars
 * (extruded body profile, glass canopy, alloy wheels, lights).
 * Everything is generated procedurally (no external assets).
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

  function build() {
    ENV = T.envMap();
    GLOW_WARM = T.glow('rgba(255,240,200,1)', 'rgba(255,220,150,0.4)');
    GLOW_RED = T.glow('rgba(255,90,80,1)', 'rgba(255,60,50,0.4)');

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

    const w = roadWidth();

    // ---- Road surface (textured, scrolling) ----
    const roadTex = T.asphalt();
    roadTex.repeat.set(2, 40); // one repeat = 10 world metres along z
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(w + C.SHOULDER * 2, C.ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92, metalness: 0.05 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -C.ROAD_LENGTH / 2 + 40;
    road.receiveShadow = true;
    scene.add(road);

    // ---- Ground either side (textured, scrolling) ----
    const grassTex = T.grass();
    grassTex.repeat.set(14, 40);
    const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
    [-1, 1].forEach((side) => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(120, C.ROAD_LENGTH), groundMat);
      g.rotation.x = -Math.PI / 2;
      g.position.set(side * (w / 2 + C.SHOULDER + 60), -0.02, road.position.z);
      g.receiveShadow = true;
      scene.add(g);
    });

    // textures that must scroll with the world (tex + metres per repeat)
    const scrollTextures = [
      { tex: roadTex, unit: C.ROAD_LENGTH / 40 },
      { tex: grassTex, unit: C.ROAD_LENGTH / 40 },
    ];

    // ---- Lane markings (scrolling group) ----
    const markings = new THREE.Group();
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xc9cdd4 });
    const dashLen = 3, gap = 5, count = Math.ceil(C.ROAD_LENGTH / (dashLen + gap));
    for (let lane = 1; lane < C.LANES; lane++) {
      const x = -w / 2 + lane * C.LANE_WIDTH;
      for (let i = 0; i < count; i++) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, dashLen), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.012, 40 - i * (dashLen + gap));
        markings.add(dash);
      }
    }
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xd9a83f });
    [-1, 1].forEach((side) => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, C.ROAD_LENGTH), edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * w / 2, 0.012, road.position.z);
      scene.add(edge);
    });
    scene.add(markings);

    // ---- Scenery: lamps, light pools, guard rails, buildings ----
    const scenery = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x52575e, metalness: 0.6, roughness: 0.5 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9b8 });
    const poolTex = T.lightPool();
    const facades = [0, 1, 2].map((i) => {
      const tex = T.facade(i);
      return new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.55,
        roughness: 1,
      });
    });

    for (let i = 0; i < 14; i++) {
      const z = 40 - i * 30;
      [-1, 1].forEach((side) => {
        // street lamp: pole + curved arm + head + glow + pool of light
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.4, 8), poleMat);
        pole.position.set(side * (w / 2 + 1.6), 3.7, z);
        scenery.add(pole);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6), poleMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(side * (w / 2 + 0.75), 7.3, z);
        scenery.add(arm);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.32), lampMat);
        head.position.set(side * (w / 2 + 0.1), 7.22, z);
        scenery.add(head);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: GLOW_WARM, color: 0xffe2a8, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        glow.scale.setScalar(3.4);
        glow.position.set(side * (w / 2 + 0.1), 7.2, z);
        scenery.add(glow);
        const pool = new THREE.Mesh(
          new THREE.PlaneGeometry(9, 9),
          new THREE.MeshBasicMaterial({
            map: poolTex, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false,
          })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(side * (w / 2 - 1.2), 0.015, z);
        scenery.add(pool);

        // guard rail segment
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.35, 26),
          new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.8, roughness: 0.35 })
        );
        rail.position.set(side * (w / 2 + C.SHOULDER), 0.55, z - 13);
        scenery.add(rail);

        // buildings
        if (i % 2 === 0) {
          const h = 10 + Math.random() * 22;
          const bw = 9 + Math.random() * 7;
          const bldg = new THREE.Mesh(
            new THREE.BoxGeometry(bw, h, 13),
            facades[i % facades.length]
          );
          bldg.position.set(side * (w / 2 + 18 + Math.random() * 12), h / 2, z - 8);
          scenery.add(bldg);
        }
      });
    }
    scene.add(scenery);

    // ---- Player car ----
    const player = makeCar(0xff5e2c, true);
    player.position.set(0, 0, 0);
    scene.add(player);

    return { scene, road, markings, scenery, player, sun, scrollTextures };
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
    }
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

  return { build, makeCar, makeCoin, TRAFFIC_COLORS, roadWidth };
})();
