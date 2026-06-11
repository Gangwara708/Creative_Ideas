/* ============================================================
 * Scene builder — stadium, pitch, stumps, players, fielders.
 * Everything is generated procedurally (no external assets).
 * ============================================================ */
window.CricketScene = (function () {
  const C = window.CFG;

  function build(renderer) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6ec6ff);
    scene.fog = new THREE.Fog(0x6ec6ff, 120, 260);

    // ---- Lights ----
    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x2e5d34, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 90;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
    scene.add(sun);

    // ---- Outfield (striped grass) ----
    const field = new THREE.Group();
    const stripes = 24;
    for (let i = 0; i < stripes; i++) {
      const a0 = (i / stripes) * Math.PI * 2;
      const a1 = ((i + 1) / stripes) * Math.PI * 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, C.FIELD_RADIUS, a0, a1, false);
      shape.lineTo(0, 0);
      const geo = new THREE.ShapeGeometry(shape, 12);
      const col = i % 2 === 0 ? 0x3f9b46 : 0x368a3d;
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 1 });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.receiveShadow = true;
      field.add(m);
    }
    scene.add(field);

    // ---- Boundary rope ----
    const rope = new THREE.Mesh(
      new THREE.TorusGeometry(C.BOUNDARY_RADIUS, 0.28, 10, 120),
      new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.6 })
    );
    rope.rotation.x = -Math.PI / 2;
    rope.position.y = 0.25;
    scene.add(rope);

    // ---- 30-yard inner ring (painted) ----
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(31, 31.5, 96),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // ---- Pitch strip ----
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(C.PITCH_WIDTH, C.PITCH_LENGTH + 4),
      new THREE.MeshStandardMaterial({ color: 0xc2a679, roughness: 1 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.03;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // crease lines
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [C.STRIKER_Z, C.BOWLER_Z].forEach((z) => {
      const popping = new THREE.Mesh(new THREE.PlaneGeometry(C.PITCH_WIDTH, 0.12), creaseMat);
      popping.rotation.x = -Math.PI / 2;
      popping.position.set(0, 0.04, z - Math.sign(z) * 1.8);
      scene.add(popping);
    });

    // ---- Stumps at both ends ----
    const strikerStumps = makeStumps();
    strikerStumps.position.set(0, 0, C.STRIKER_Z);
    scene.add(strikerStumps);
    const bowlerStumps = makeStumps();
    bowlerStumps.position.set(0, 0, C.BOWLER_Z);
    scene.add(bowlerStumps);

    // ---- Players ----
    const batsman = makeFigure(0x1d3557, 0xffe0bd);   // navy kit
    batsman.position.set(-0.9, 0, C.STRIKER_Z - 0.4);
    batsman.rotation.y = Math.PI; // face the bowler (down -z)
    scene.add(batsman);

    const bat = makeBat();
    // attach bat to a pivot at the batsman's hands
    const batPivot = new THREE.Group();
    batPivot.position.set(0.55, 1.55, 0);
    batPivot.add(bat);
    batsman.add(batPivot);

    const bowler = makeFigure(0x8d0801, 0xffe0bd);     // red kit
    bowler.position.set(0.6, 0, C.BOWLER_Z - 1.5);
    scene.add(bowler);

    const keeper = makeFigure(0x1d3557, 0xffe0bd);
    keeper.position.set(0, 0, C.STRIKER_Z + 3.2);
    keeper.scale.setScalar(0.95);
    scene.add(keeper);

    // ---- Fielders (markers we can move) ----
    const fielders = [];
    const fieldPositions = [
      [-22, 4], [22, 6], [-38, -10], [40, -8], [-14, -34],
      [16, -36], [-30, 26], [33, 24], [0, 44],
    ];
    fieldPositions.forEach((p) => {
      const f = makeFigure(0x8d0801, 0xffe0bd);
      f.scale.setScalar(0.92);
      f.position.set(p[0], 0, p[1]);
      f.userData.home = new THREE.Vector3(p[0], 0, p[1]);
      scene.add(f);
      fielders.push(f);
    });

    // ---- Ball ----
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(C.BALL_RADIUS, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.45 })
    );
    ball.castShadow = true;
    ball.visible = false;
    scene.add(ball);

    // simple stadium stands ring
    scene.add(makeStands());

    return {
      scene, field, ball, batsman, bowler, keeper, bat, batPivot,
      strikerStumps, bowlerStumps, fielders, sun,
    };
  }

  function makeStumps() {
    const g = new THREE.Group();
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.7 });
    for (let i = -1; i <= 1; i++) {
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8), stumpMat);
      stump.position.set(i * 0.22, 0.7, 0);
      stump.castShadow = true;
      g.add(stump);
    }
    const bailMat = new THREE.MeshStandardMaterial({ color: 0xff5500 });
    for (let i = -1; i <= 0; i++) {
      const bail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 6), bailMat);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(i * 0.22 + 0.11, 1.42, 0);
      g.add(bail);
    }
    g.userData.bails = g.children.slice(3);
    return g;
  }

  function makeFigure(kitColor, skinColor) {
    const g = new THREE.Group();
    const kit = new THREE.MeshStandardMaterial({ color: kitColor, roughness: 0.8 });
    const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 1.0, 8), kit);
    legs.position.y = 0.5; legs.castShadow = true; g.add(legs);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.95, 8), kit);
    torso.position.y = 1.45; torso.castShadow = true; g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skin);
    head.position.y = 2.12; head.castShadow = true; g.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), kit);
    helmet.position.y = 2.16; g.add(helmet);

    return g;
  }

  function makeBat() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0xe8c98a, roughness: 0.6 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 }));
    handle.position.y = 0.35; g.add(handle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 0.12), wood);
    blade.position.y = -0.4; blade.castShadow = true; g.add(blade);
    g.rotation.z = 0.2;
    return g;
  }

  function makeStands() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x21304f, roughness: 1 });
    const standGeo = new THREE.CylinderGeometry(C.FIELD_RADIUS + 14, C.FIELD_RADIUS + 6, 14, 64, 1, true);
    const stand = new THREE.Mesh(standGeo, mat);
    stand.position.y = 7;
    g.add(stand);
    // speckled crowd ring
    const crowdMat = new THREE.MeshStandardMaterial({ color: 0x4a6fa5, roughness: 1, side: THREE.DoubleSide });
    const crowd = new THREE.Mesh(
      new THREE.CylinderGeometry(C.FIELD_RADIUS + 8, C.FIELD_RADIUS + 8, 10, 64, 1, true),
      crowdMat
    );
    crowd.position.y = 6;
    g.add(crowd);
    return g;
  }

  return { build };
})();
