/* ============================================================
 * Scene builder — highway, scenery, player car, traffic cars.
 * Everything is generated procedurally (no external assets).
 * ============================================================ */
window.RushScene = (function () {
  const C = window.CFG;

  function roadWidth() {
    return C.LANES * C.LANE_WIDTH;
  }

  function build() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c2438);
    scene.fog = new THREE.Fog(0x1c2438, 90, 240);

    // ---- Lights ----
    const hemi = new THREE.HemisphereLight(0x9db8e8, 0x20262e, 0.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 0.85);
    sun.position.set(-30, 60, -40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 60;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
    scene.add(sun);

    const w = roadWidth();

    // ---- Road surface ----
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(w + C.SHOULDER * 2, C.ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 1 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -C.ROAD_LENGTH / 2 + 40;
    road.receiveShadow = true;
    scene.add(road);

    // ---- Ground either side ----
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x24322a, roughness: 1 });
    [-1, 1].forEach((side) => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(120, C.ROAD_LENGTH), groundMat);
      g.rotation.x = -Math.PI / 2;
      g.position.set(side * (w / 2 + C.SHOULDER + 60), -0.02, road.position.z);
      g.receiveShadow = true;
      scene.add(g);
    });

    // ---- Lane markings (scrolling group) ----
    const markings = new THREE.Group();
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d8 });
    const dashLen = 3, gap = 5, count = Math.ceil(C.ROAD_LENGTH / (dashLen + gap));
    for (let lane = 1; lane < C.LANES; lane++) {
      const x = -w / 2 + lane * C.LANE_WIDTH;
      for (let i = 0; i < count; i++) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, dashLen), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, 40 - i * (dashLen + gap));
        markings.add(dash);
      }
    }
    // solid edge lines
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffc94d });
    [-1, 1].forEach((side) => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, C.ROAD_LENGTH), edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * w / 2, 0.01, road.position.z);
      scene.add(edge);
    });
    scene.add(markings);

    // ---- Scenery: street lights + buildings (scrolling group) ----
    const scenery = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x6a7178 });
    const bldgMats = [0x32405e, 0x3c4a6b, 0x2a3550].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 })
    );
    for (let i = 0; i < 14; i++) {
      const z = 40 - i * 30;
      [-1, 1].forEach((side) => {
        // street light
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), poleMat);
        pole.position.set(side * (w / 2 + 1.4), 3.5, z);
        scenery.add(pole);
        const lampGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfff0b8 })
        );
        lampGlow.position.set(side * (w / 2 + 1.4), 6.9, z);
        scenery.add(lampGlow);
        // building
        if (i % 2 === 0) {
          const h = 8 + Math.random() * 18;
          const bldg = new THREE.Mesh(
            new THREE.BoxGeometry(8 + Math.random() * 6, h, 12),
            bldgMats[i % bldgMats.length]
          );
          bldg.position.set(side * (w / 2 + 16 + Math.random() * 10), h / 2, z - 8);
          scenery.add(bldg);
        }
      });
    }
    scene.add(scenery);

    // ---- Player car ----
    const player = makeCar(0xff5e2c, true);
    player.position.set(0, 0, 0);
    scene.add(player);

    return { scene, road, markings, scenery, player, sun };
  }

  /** Box-built car with cabin, wheels, lights. faceForward=true means nose toward -z. */
  function makeCar(color, isPlayer) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.7, 4.4),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.3 })
    );
    body.position.y = 0.65;
    body.castShadow = true;
    g.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.6, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.2, metalness: 0.5 })
    );
    cabin.position.set(0, 1.25, 0.2);
    cabin.castShadow = true;
    g.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
    const wheels = [];
    [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]].forEach((p) => {
      const wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(p[0], 0.42, p[1]);
      wm.castShadow = true;
      g.add(wm);
      wheels.push(wm);
    });
    g.userData.wheels = wheels;

    // headlights / taillights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6cc });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    [-0.6, 0.6].forEach((x) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), headMat);
      hl.position.set(x, 0.7, -2.21);
      g.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), tailMat);
      tl.position.set(x, 0.7, 2.21);
      g.add(tl);
    });

    if (isPlayer) {
      // subtle roof stripe so the player car stands out
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.02, 4.41),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      stripe.position.y = 1.01;
      g.add(stripe);
    }
    return g;
  }

  function makeCoin() {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 18),
      new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.7, roughness: 0.25 })
    );
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 1.1;
    return coin;
  }

  const TRAFFIC_COLORS = [0x4a90d9, 0x9b59b6, 0x27ae60, 0xc0392b, 0xf1c40f, 0x95a5a6, 0x2c3e50];

  return { build, makeCar, makeCoin, TRAFFIC_COLORS, roadWidth };
})();
