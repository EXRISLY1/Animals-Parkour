const World = (() => {
  let scene;
  let platformMeshes = [];
  let checkpointMeshes = [];
  let finishMesh = null;
  let cloudMeshes = [];
  let checkpointData = [];
  let finishPos = new THREE.Vector3();
  let levelIndex = 0;
  let currentWorldType = 'classic';

  // Menu display cow
  let _menuCow = null;

  // Easter Egg State
  let _bigCowSpots = [];
  let _showBigCow = false;
  let _time = 0;

  // Decorative animated objects
  let _bees = [];

  // Lights
  let _ambientLight = null;
  let _sunLight = null;
  let _fillLight = null;
  let _skyUniforms = null;
  let _starMesh = null;
  let _skyMesh = null;

  // World-specific effects
  let _volumetricLight = null;
  let _lightRays = [];

  // ─── WORLD MATERIALS ────────────────────────────────────────────────────────

  // Base Materials
  const MAT_GRASS = new THREE.MeshLambertMaterial({ color: 0x4e9c2e });
  const MAT_DIRT = new THREE.MeshLambertMaterial({ color: 0x7a5030 });
  const MAT_WOOD = new THREE.MeshLambertMaterial({ color: 0x8c6640 });
  const MAT_ROOF = new THREE.MeshLambertMaterial({ color: 0x7a2218 });
  const MAT_WALL = new THREE.MeshLambertMaterial({ color: 0xddc898 });
  const MAT_STONE = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
  const MAT_CLOUD = new THREE.MeshLambertMaterial({ color: 0xe8f2fa, transparent: true, opacity: 0.88 });
  const MAT_CHECK = new THREE.MeshLambertMaterial({ color: 0x3a85cc, transparent: true, opacity: 0.80 });
  const MAT_CHECK_ON = new THREE.MeshLambertMaterial({ color: 0x22bb66, transparent: true, opacity: 0.85 });

  // Biome Materials
  const MAT_GLASS = new THREE.MeshPhongMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.4, shininess: 80 });
  const MAT_METAL = new THREE.MeshStandardMaterial({ color: 0x7788aa, roughness: 0.4, metalness: 0.75 });
  const MAT_ICE = new THREE.MeshPhongMaterial({ color: 0xaaddee, transparent: true, opacity: 0.75, shininess: 60 });
  const MAT_CLOUD_PLAT = new THREE.MeshLambertMaterial({ color: 0xd8eaf5 });

  // Terrain Materials
  const MAT_LAVA = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.9 });
  const MAT_LAVA_ROCK = new THREE.MeshLambertMaterial({ color: 0x1a0808 });
  const MAT_LAVA_GLOW = new THREE.MeshLambertMaterial({ color: 0x882200, emissive: 0x441100, emissiveIntensity: 0.6 });
  const MAT_VOLCANO = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const MAT_VOLCANO_MID = new THREE.MeshLambertMaterial({ color: 0x331111 });
  const MAT_MOUNTAIN = new THREE.MeshLambertMaterial({ color: 0x7a6650 });
  const MAT_MOUNTAIN2 = new THREE.MeshLambertMaterial({ color: 0x556633 });
  const MAT_SNOW_CAP = new THREE.MeshLambertMaterial({ color: 0xeef8ff });
  const MAT_CRYSTAL = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5, shininess: 80 });
  const MAT_DEAD_TREE = new THREE.MeshLambertMaterial({ color: 0x221100 });

  // World-Specific Materials
  const MAT_HELL_ROCK = new THREE.MeshLambertMaterial({ color: 0x2a1500 });
  const MAT_HELL_GROUND = new THREE.MeshLambertMaterial({ color: 0x1a0500 });
  const MAT_HELL_CRYSTAL = new THREE.MeshPhongMaterial({ color: 0xff3300, emissive: 0xff1100, emissiveIntensity: 0.8, shininess: 90 });
  const MAT_HELL_CHAIN = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const MAT_HELL_BONE = new THREE.MeshLambertMaterial({ color: 0xddd8c8 });

  const MAT_ICE_PLATFORM = new THREE.MeshPhongMaterial({ color: 0x88ccee, transparent: true, opacity: 0.8, shininess: 100 });
  const MAT_ICE_SPIKE = new THREE.MeshPhongMaterial({ color: 0x66bbee, transparent: true, opacity: 0.7, shininess: 120 });
  const MAT_FROZEN_GROUND = new THREE.MeshLambertMaterial({ color: 0xc8d8e8 });
  const MAT_ICE_CRYSTAL = new THREE.MeshPhongMaterial({ color: 0xaaddff, transparent: true, opacity: 0.75, shininess: 110 });

  const MAT_HEAVEN_CRYSTAL = new THREE.MeshPhongMaterial({ color: 0xaa44ff, emissive: 0x8822cc, emissiveIntensity: 0.7, shininess: 90 });
  const MAT_HEAVEN_STONE = new THREE.MeshLambertMaterial({ color: 0x332244 });
  const MAT_HEAVEN_PLATFORM = new THREE.MeshPhongMaterial({ color: 0x554488, transparent: true, opacity: 0.9, shininess: 70 });
  const MAT_ENERGY_FIELD = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4 });
  const MAT_HEAVEN_SKY = new THREE.MeshBasicMaterial({ color: 0x0a0020, side: THREE.BackSide });

  // Moon Materials (Sci-Fi Synthwave Theme)
  const MAT_MOON_ROCK = new THREE.MeshPhongMaterial({ color: 0x4a3a6a, shininess: 25 });
  const MAT_MOON_DUST = new THREE.MeshLambertMaterial({ color: 0x2a1a4a });
  const MAT_MOON_DARK = new THREE.MeshLambertMaterial({ color: 0x1a0a2a });
  const MAT_MOON_GLOW = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00aaff, emissiveIntensity: 1.2, shininess: 100 });

  // ─── LIGHTING ─────────────────────────────────────────────────────────────
  function buildLights() {
    if (_ambientLight && scene) scene.remove(_ambientLight);
    if (_sunLight && scene) scene.remove(_sunLight);
    if (_fillLight && scene) scene.remove(_fillLight);

    const preset = Graphics.getWorldPreset();

    _ambientLight = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
    scene.add(_ambientLight);

    _sunLight = new THREE.DirectionalLight(preset.sunColor, preset.sunIntensity);
    _sunLight.position.set(60, 120, 40);
    _sunLight.castShadow = true;
    _sunLight.shadow.mapSize.set(2048, 2048);
    _sunLight.shadow.camera.near = 0.5;
    _sunLight.shadow.camera.far = 800;
    _sunLight.shadow.camera.left = -120;
    _sunLight.shadow.camera.right = 120;
    _sunLight.shadow.camera.bottom = -120;
    _sunLight.shadow.camera.top = 120;
    _sunLight.target = new THREE.Object3D();
    scene.add(_sunLight.target);
    scene.add(_sunLight);

    // Fill light - opposite side
    const fillColor = currentWorldType === 'hell' ? 0x331100 : currentWorldType === 'heaven' ? 0x221133 : 0x8ab4d8;
    _fillLight = new THREE.DirectionalLight(fillColor, 0.28);
    _fillLight.position.set(-30, -10, -20);
    scene.add(_fillLight);

    CameraSystem.setSun(_sunLight);
  }

  // ─── SKY DOME ──────────────────────────────────────────────────────────────
  function buildSky() {
    if (_skyMesh && scene) scene.remove(_skyMesh);
    if (_starMesh && scene) scene.remove(_starMesh);
    _skyMesh = null; _starMesh = null;

    const preset = Graphics.getWorldPreset();

    if (scene.background instanceof THREE.Color) {
      scene.background.setHex(preset.background);
    } else {
      scene.background = new THREE.Color(preset.background);
    }

    // Fog
    if (preset.fogType === 'exponential') {
      scene.fog = new THREE.FogExp2(preset.fogColor, 0.012);
    } else {
      scene.fog = new THREE.Fog(preset.fogColor, preset.fogNear, preset.fogFar);
    }

    // Sky sphere
    const skyGeo = new THREE.SphereGeometry(900, 24, 12);
    _skyUniforms = {
      topColor: { value: new THREE.Color(preset.skyTop) },
      bottomColor: { value: new THREE.Color(preset.skyBottom) },
      offset: { value: 0.3 },
      exponent: { value: 0.6 }
    };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: _skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y + offset;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    _skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(_skyMesh);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const positions = [];
    const starColors = [];
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 700 + Math.random() * 180;
      positions.push(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
      // Vary star colors
      const hue = Math.random() > 0.7 ? Math.random() * 0.3 + 0.55 : 0.6;
      const c = new THREE.Color().setHSL(hue, 0.5, 0.9);
      starColors.push(c.r, c.g, c.b);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ vertexColors: true, size: 2.8, sizeAttenuation: false, transparent: true, opacity: currentWorldType === 'heaven' ? 1 : 0.6 });
    _starMesh = new THREE.Points(starGeo, starMat);
    scene.add(_starMesh);
  }

  // ─── CLOUDS ────────────────────────────────────────────────────────────────
  function buildClouds(maxHeight) {
    const cloudColor = currentWorldType === 'hell' ? 0x553322 :
                       currentWorldType === 'winter' ? 0xddeeff :
                       currentWorldType === 'heaven' ? 0x554488 : 0xe8f2fa;
    const cloudMat = new THREE.MeshLambertMaterial({ color: cloudColor, transparent: true, opacity: 0.85 });

    for (let i = 0; i < 60; i++) {
      const g = new THREE.Group();
      const cx = Utils.randRange(-200, 200);
      const cy = Utils.randRange(5, maxHeight + 30);
      const cz = Utils.randRange(-200, 200);
      g.position.set(cx, cy, cz);

      const numPuffs = Utils.randInt(4, 8);
      for (let j = 0; j < numPuffs; j++) {
        const r = Utils.randRange(3, 8);
        const geo = new THREE.SphereGeometry(r, 6, 5);
        const m = new THREE.Mesh(geo, cloudMat);
        m.position.set(Utils.randRange(-6, 6), Utils.randRange(-1.5, 1.5), Utils.randRange(-3, 3));
        m.scale.y = 0.55;
        g.add(m);
      }
      scene.add(g);
      cloudMeshes.push(g);
    }
  }

  // ─── FLOATING ISLAND ───────────────────────────────────────────────────────
  function makeIsland(x, y, z, w, d, tall, biome = 'nature') {
    const h = tall || 2;

    let topMat, bodyMat, physType = 'platform';

    // World-specific platform materials
    switch (biome) {
      case 'nature':
        topMat = MAT_GRASS; bodyMat = MAT_DIRT;
        break;
      case 'stone':
        topMat = MAT_STONE; bodyMat = MAT_STONE;
        break;
      case 'metal':
        topMat = MAT_METAL; bodyMat = MAT_STONE;
        break;
      case 'ice':
        topMat = MAT_ICE; bodyMat = MAT_ICE; physType = 'ice';
        break;
      case 'cloud':
        topMat = MAT_CLOUD_PLAT; bodyMat = MAT_CLOUD;
        break;
      case 'glass':
        topMat = MAT_GLASS; bodyMat = MAT_GLASS;
        break;
      // World-specific biomes
      case 'hellstone':
        topMat = MAT_HELL_ROCK; bodyMat = MAT_HELL_ROCK; physType = 'hell';
        break;
      case 'lavaplat':
        topMat = MAT_LAVA_ROCK; bodyMat = MAT_LAVA_ROCK; physType = 'lava';
        break;
      case 'frozen':
        topMat = MAT_ICE_PLATFORM; bodyMat = MAT_FROZEN_GROUND; physType = 'ice';
        break;
      case 'celestial':
        topMat = MAT_HEAVEN_PLATFORM; bodyMat = MAT_HEAVEN_STONE; physType = 'heaven';
        break;
      case 'crystal':
        topMat = MAT_CRYSTAL; bodyMat = MAT_CRYSTAL; physType = 'heaven';
        break;
      case 'moon':
        topMat = MAT_MOON_DUST; bodyMat = MAT_MOON_ROCK;
        break;
      default:
        topMat = MAT_GRASS; bodyMat = MAT_DIRT;
    }

    // Top slab
    const topGeo = new THREE.BoxGeometry(w, 0.6, d);
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(x, y + h / 2, z);
    top.receiveShadow = top.castShadow = true;
    scene.add(top);
    platformMeshes.push(top);
    Physics.register(top, new THREE.Vector3(w, 0.6, d), physType);

    // Body
    const bodyH = h;
    const bodyGeo = new THREE.BoxGeometry(w * 0.85, bodyH, d * 0.85);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y + h / 2 - bodyH / 2, z);
    body.castShadow = true;
    scene.add(body);
    platformMeshes.push(body);

    // Tip (skip for special types)
    if (biome !== 'cloud' && biome !== 'glass' && biome !== 'moon' && !biome.includes('heaven')) {
      const tipGeo = new THREE.CylinderGeometry(0.3, 0.01, h * 0.5, 5);
      const tip = new THREE.Mesh(tipGeo, MAT_STONE);
      tip.position.set(x, y + h / 2 - bodyH - h * 0.25, z);
      scene.add(tip);
      platformMeshes.push(tip);
    }

    return top;
  }

  // ─── PINE TREE ─────────────────────────────────────────────────────────────
  function makeTree(x, y, z, scale) {
    const s = scale || 1;
    const MAT_TRUNK = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    const MAT_LEAVES1 = new THREE.MeshLambertMaterial({ color: 0x2d7a1e });
    const MAT_LEAVES2 = new THREE.MeshLambertMaterial({ color: 0x3a9626 });

    const trunkGeo = new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 0.9 * s, 6);
    const trunk = new THREE.Mesh(trunkGeo, MAT_TRUNK);
    trunk.position.set(x, y + 0.45 * s, z);
    trunk.castShadow = true;
    scene.add(trunk); platformMeshes.push(trunk);

    const layers = [
      { r: 0.65 * s, h: 0.7 * s, yOff: 0.7 * s },
      { r: 0.50 * s, h: 0.65 * s, yOff: 1.1 * s },
      { r: 0.32 * s, h: 0.55 * s, yOff: 1.45 * s },
    ];
    layers.forEach((l, i) => {
      const geo = new THREE.ConeGeometry(l.r, l.h, 7);
      const mat = i % 2 === 0 ? MAT_LEAVES1 : MAT_LEAVES2;
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y + l.yOff, z);
      m.castShadow = true;
      scene.add(m); platformMeshes.push(m);
    });
  }

  // ─── DEAD TREE (Hell) ──────────────────────────────────────────────────────
  function makeDeadTree(x, y, z, h) {
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, h, 5);
    const trunk = new THREE.Mesh(trunkGeo, MAT_DEAD_TREE);
    trunk.position.set(x, y + h/2, z);
    trunk.castShadow = true;
    scene.add(trunk); platformMeshes.push(trunk);

    // Bare branches
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const branchGeo = new THREE.CylinderGeometry(0.02, 0.05, h * 0.4, 4);
      const branch = new THREE.Mesh(branchGeo, MAT_DEAD_TREE);
      branch.position.set(x + Math.cos(angle) * 0.3, y + h * 0.6, z + Math.sin(angle) * 0.3);
      branch.rotation.z = Math.cos(angle) * 0.6;
      branch.rotation.x = Math.sin(angle) * 0.6;
      scene.add(branch); platformMeshes.push(branch);
    }
  }

  // ─── FLOWER ────────────────────────────────────────────────────────────────
  function makeFlower(x, y, z, petalColor) {
    const MAT_STEM = new THREE.MeshLambertMaterial({ color: 0x3a8a20 });
    const MAT_PET = new THREE.MeshLambertMaterial({ color: petalColor || 0xff6688 });
    const MAT_CENT = new THREE.MeshLambertMaterial({ color: 0xffdd44 });

    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 4);
    const stem = new THREE.Mesh(stemGeo, MAT_STEM);
    stem.position.set(x, y + 0.18, z);
    scene.add(stem); platformMeshes.push(stem);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const geo = new THREE.BoxGeometry(0.10, 0.03, 0.16);
      const pet = new THREE.Mesh(geo, MAT_PET);
      pet.position.set(x + Math.cos(angle) * 0.12, y + 0.37, z + Math.sin(angle) * 0.12);
      pet.rotation.y = angle;
      scene.add(pet); platformMeshes.push(pet);
    }

    const centGeo = new THREE.SphereGeometry(0.07, 5, 5);
    const cent = new THREE.Mesh(centGeo, MAT_CENT);
    cent.position.set(x, y + 0.38, z);
    scene.add(cent); platformMeshes.push(cent);
  }

  // ─── MUSHROOM ──────────────────────────────────────────────────────────────
  function makeMushroom(x, y, z) {
    const MAT_STALK = new THREE.MeshLambertMaterial({ color: 0xf0e0cc });
    const MAT_CAP = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const MAT_SPOT = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const stalkGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.3, 6);
    const stalk = new THREE.Mesh(stalkGeo, MAT_STALK);
    stalk.position.set(x, y + 0.15, z);
    scene.add(stalk); platformMeshes.push(stalk);

    const capGeo = new THREE.SphereGeometry(0.22, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const cap = new THREE.Mesh(capGeo, MAT_CAP);
    cap.position.set(x, y + 0.28, z);
    scene.add(cap); platformMeshes.push(cap);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const sg = new THREE.SphereGeometry(0.035, 4, 4);
      const sp = new THREE.Mesh(sg, MAT_SPOT);
      sp.position.set(x + Math.cos(a) * 0.10, y + 0.36, z + Math.sin(a) * 0.10);
      scene.add(sp); platformMeshes.push(sp);
    }
  }

  // ─── BEE ───────────────────────────────────────────────────────────────────
  function makeBee(ox, oy, oz, orbitR, speed, phase) {
    const MAT_BODY = new THREE.MeshLambertMaterial({ color: 0x2a2200 });
    const MAT_YELW = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    const MAT_WING = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.55 });

    const g = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), MAT_BODY);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.10), MAT_YELW);
    b2.position.z = 0.06;
    g.add(b1); g.add(b2);

    const wGeo = new THREE.BoxGeometry(0.28, 0.02, 0.14);
    const wL = new THREE.Mesh(wGeo, MAT_WING);
    const wR = new THREE.Mesh(wGeo, MAT_WING);
    wL.position.set(-0.18, 0.05, 0); wL.rotation.y = 0.3;
    wR.position.set(0.18, 0.05, 0); wR.rotation.y = -0.3;
    g.add(wL); g.add(wR);

    g.position.set(ox + orbitR, oy, oz);
    scene.add(g);
    platformMeshes.push(g);

    _bees.push({
      mesh: g, cx: ox, cy: oy, cz: oz,
      orbitRadius: orbitR, speed, phase,
      bobAmp: Utils.randRange(0.15, 0.35),
      bobSpeed: Utils.randRange(2.5, 4.0),
      wL, wR
    });
  }

  // ─── HELL DECORATIONS ──────────────────────────────────────────────────────
  function makeLavaPool(x, y, z, radius) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, 0.35, 14), MAT_LAVA);
    m.position.set(x, y, z);
    scene.add(m); platformMeshes.push(m);
  }

  function makeLavaColumn(x, y, z, h) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, h, 7), MAT_VOLCANO);
    col.position.set(x, y + h/2, z); col.castShadow = true;
    scene.add(col); platformMeshes.push(col);

    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.25, 7), MAT_LAVA);
    top.position.set(x, y + h + 0.12, z);
    scene.add(top); platformMeshes.push(top);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), MAT_LAVA_GLOW);
    glow.position.set(x, y + h + 0.3, z);
    scene.add(glow); platformMeshes.push(glow);

    _bees.push({
      mesh: glow, cx: x, cy: y + h + 0.3, cz: z,
      orbitRadius: 0, speed: 0, phase: Math.random() * Math.PI * 2,
      bobAmp: 0.08, bobSpeed: 3.5, wL: null, wR: null
    });
  }

  function makeSkeleton(x, y, z) {
    const g = new THREE.Group();

    // Skull
    const skullGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const skull = new THREE.Mesh(skullGeo, MAT_HELL_BONE);
    skull.scale.y = 0.8;
    skull.position.y = 1.2;
    g.add(skull);

    // Spine
    for (let i = 0; i < 5; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), MAT_HELL_BONE);
      v.position.y = 1.0 - i * 0.15;
      g.add(v);
    }

    // Ribs
    for (let i = 0; i < 4; i++) {
      [-0.12, 0.12].forEach(sx => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.04), MAT_HELL_BONE);
        rib.position.set(sx, 0.85 - i * 0.1, 0);
        rib.rotation.z = sx > 0 ? -0.3 : 0.3;
        g.add(rib);
      });
    }

    g.position.set(x, y, z);
    g.rotation.y = Math.random() * Math.PI;
    scene.add(g);
    platformMeshes.push(g);
  }

  function makeChainBridge(x1, y, z1, x2, z2) {
    const g = new THREE.Group();
    const segments = 10;
    const dx = (x2 - x1) / segments;
    const dz = (z2 - z1) / segments;

    for (let i = 0; i <= segments; i++) {
      const px = x1 + dx * i;
      const pz = z1 + dz * i;
      const linkGeo = new THREE.TorusGeometry(0.08, 0.02, 4, 8);
      const link = new THREE.Mesh(linkGeo, MAT_HELL_CHAIN);
      link.position.set(px, y, pz);
      link.rotation.x = Math.PI / 2;
      g.add(link);
    }

    scene.add(g);
    platformMeshes.push(g);
    return g;
  }

  // ─── ICE DECORATIONS ───────────────────────────────────────────────────────
  function makeIceSpire(x, y, z, h) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.11, h, 5), MAT_ICE_SPIKE);
    m.position.set(x, y + h/2, z);
    m.rotation.z = Utils.randRange(-0.18, 0.18);
    scene.add(m); platformMeshes.push(m);
  }

  function makeFrozenStatue(x, y, z) {
    const g = new THREE.Group();
    const mat = MAT_ICE_CRYSTAL;

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), mat);
    body.position.y = 0.6;
    g.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat);
    head.position.y = 1.4;
    g.add(head);

    // Arms reaching up
    [-0.4, 0.4].forEach(sx => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 4), mat);
      arm.position.set(sx, 1.0, 0);
      arm.rotation.z = sx > 0 ? -0.8 : 0.8;
      g.add(arm);
    });

    g.position.set(x, y, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    scene.add(g);
    platformMeshes.push(g);
  }

  // ─── HEAVEN DECORATIONS ────────────────────────────────────────────────────
  function makeEnergyCrystal(x, y, z, h) {
    const g = new THREE.Group();

    const crystal = new THREE.Mesh(new THREE.ConeGeometry(h * 0.12, h, 6), MAT_HEAVEN_CRYSTAL);
    crystal.position.y = h / 2;
    g.add(crystal);

    // Glow sphere
    const glow = new THREE.Mesh(new THREE.SphereGeometry(h * 0.15, 8, 8), MAT_ENERGY_FIELD);
    glow.position.y = h / 2;
    g.add(glow);

    g.position.set(x, y, z);
    g.rotation.y = Math.random() * Math.PI;
    scene.add(g);
    platformMeshes.push(g);

    _bees.push({
      mesh: glow, cx: x, cy: y + h / 2, cz: z,
      orbitRadius: 0.3, speed: 1.5, phase: Math.random() * Math.PI * 2,
      bobAmp: 0.15, bobSpeed: 2, wL: null, wR: null
    });
  }

  function makePortalRing(x, y, z) {
    const g = new THREE.Group();

    // Main ring
    const ringGeo = new THREE.TorusGeometry(2, 0.15, 8, 32);
    const ring = new THREE.Mesh(ringGeo, MAT_HEAVEN_CRYSTAL);
    g.add(ring);

    // Inner energy
    const innerGeo = new THREE.CircleGeometry(1.8, 32);
    const inner = new THREE.Mesh(innerGeo, MAT_ENERGY_FIELD);
    inner.position.z = 0.01;
    g.add(inner);

    g.position.set(x, y + 2, z);
    scene.add(g);
    platformMeshes.push(g);

    _bees.push({
      mesh: g, cx: x, cy: y + 2, cz: z,
      orbitRadius: 0, speed: 0.8, phase: 0,
      bobAmp: 0.3, bobSpeed: 1.5, wL: null, wR: null, isSpinner: true
    });
  }

  function makeFloatingRune(x, y, z) {
    const g = new THREE.Group();

    // Rune symbols (simplified)
    for (let i = 0; i < 3; i++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), MAT_HEAVEN_CRYSTAL);
      rune.rotation.z = (i / 3) * Math.PI;
      g.add(rune);
    }

    g.position.set(x, y, z);
    scene.add(g);
    platformMeshes.push(g);

    _bees.push({
      mesh: g, cx: x, cy: y, cz: z,
      orbitRadius: 0.8, speed: 0.5, phase: Math.random() * Math.PI * 2,
      bobAmp: 0.2, bobSpeed: 1, wL: null, wR: null, isSpinner: true
    });
  }

  // ─── TERRAIN GENERATION ────────────────────────────────────────────────────
  function buildBiomeTerrain(map, maxH) {
    const rings = [
      { count: 12, dMin: 100, dMax: 150, hMin: 18, hMax: 40 },
      { count: 16, dMin: 180, dMax: 250, hMin: 28, hMax: 55 }
    ];

    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + ri * 0.6 + Math.random() * 0.4;
        const d = ring.dMin + Math.random() * (ring.dMax - ring.dMin);
        const h = ring.hMin + Math.random() * (ring.hMax - ring.hMin);
        const mx = Math.cos(a) * d, mz = Math.sin(a) * d;

        switch (map) {
          case 'hell':
            makeVolcano(mx, -8, mz, h);
            // Add lava pools near volcanoes
            if (Math.random() > 0.6) {
              makeLavaPool(mx + Utils.randRange(-5, 5), -6, mz + Utils.randRange(-5, 5), Utils.randRange(3, 7));
            }
            // Add skeleton debris
            if (Math.random() > 0.7) {
              makeSkeleton(mx + Utils.randRange(-3, 3), -4, mz + Utils.randRange(-3, 3));
            }
            break;
          case 'winter':
            makeMountain(mx, -8, mz, h, 'snow');
            // Add ice spires around
            for (let s = 0; s < 3; s++) {
              const sa = Math.random() * Math.PI * 2;
              makeIceSpire(mx + Math.cos(sa) * 8, -6, mz + Math.sin(sa) * 8, Utils.randRange(4, 12));
            }
            break;
          case 'heaven':
            makeCrystalSpire(mx, Utils.randRange(5, maxH * 0.5), mz, h * 0.6);
            // Add floating runes
            if (Math.random() > 0.6) {
              makeFloatingRune(mx + Utils.randRange(-10, 10), Utils.randRange(10, maxH * 0.3), mz + Utils.randRange(-10, 10));
            }
            break;
          default: // classic
            makeMountain(mx, -8, mz, h, 'nature');
            if (d < 180) makeRollingHill(mx * 0.55, -6, mz * 0.55, Utils.randRange(8, 16));
            // Add dead trees occasionally
            if (Math.random() > 0.8) {
              makeDeadTree(mx, -6, mz, Utils.randRange(3, 7));
            }
        }
      }
    });

    // World-specific ground terrain
    if (map === 'hell') {
      for (let p = 0; p < 20; p++) {
        const pa = Math.random() * Math.PI * 2, pd = 40 + Math.random() * 100;
        makeLavaPool(Math.cos(pa) * pd, -6, Math.sin(pa) * pd, Utils.randRange(4, 10));
      }
      for (let r = 0; r < 40; r++) {
        const ra = Math.random() * Math.PI * 2, rd = 35 + Math.random() * 120;
        const size = Utils.randRange(0.8, 3);
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), MAT_LAVA_ROCK);
        rock.position.set(Math.cos(ra) * rd, -5 + size * 0.5, Math.sin(ra) * rd);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(rock); platformMeshes.push(rock);
      }
      // Add chain bridges between volcanic islands
      for (let b = 0; b < 8; b++) {
        const ba = Math.random() * Math.PI * 2;
        const bd = 50 + Math.random() * 80;
        const bx = Math.cos(ba) * bd;
        const bz = Math.sin(ba) * bd;
        makeChainBridge(bx, 5, bz, bx + Utils.randRange(-20, 20), bz + Utils.randRange(-20, 20));
      }
    }

    if (map === 'winter') {
      for (let s = 0; s < 25; s++) {
        const sa = Math.random() * Math.PI * 2, sd = 35 + Math.random() * 90;
        makeIceSpire(Math.cos(sa) * sd, -8, Math.sin(sa) * sd, Utils.randRange(5, 14));
      }
      // Frozen statues
      for (let f = 0; f < 6; f++) {
        const fa = Math.random() * Math.PI * 2, fd = 45 + Math.random() * 80;
        makeFrozenStatue(Math.cos(fa) * fd, -6, Math.sin(fa) * fd);
      }
    }

    if (map === 'heaven') {
      // Portal rings
      for (let p = 0; p < 8; p++) {
        const pa = Math.random() * Math.PI * 2, pd = 50 + Math.random() * 100;
        makePortalRing(Math.cos(pa) * pd, Utils.randRange(20, maxH * 0.4), Math.sin(pa) * pd);
      }
      // Energy crystals
      for (let c = 0; c < 15; c++) {
        const ca = Math.random() * Math.PI * 2, cd = 40 + Math.random() * 90;
        makeEnergyCrystal(Math.cos(ca) * cd, -6, Math.sin(ca) * cd, Utils.randRange(4, 12));
      }
    }
  }

  // Terrain helpers
  function makeMountain(x, y, z, h, style) {
    const mat = (style === 'snow') ? MAT_MOUNTAIN : MAT_MOUNTAIN2;
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.55, h, 7), mat);
    m.position.set(x, y + h/2, z); m.castShadow = true;
    scene.add(m); platformMeshes.push(m);

    const m2 = new THREE.Mesh(new THREE.ConeGeometry(h * 0.3, h * 0.65, 6), mat);
    m2.position.set(x + h * 0.25, y + h * 0.32, z + h * 0.15);
    scene.add(m2); platformMeshes.push(m2);

    if (style === 'snow' || h > 16) {
      const capH = h * (style === 'snow' ? 0.42 : 0.22);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(h * 0.2, capH, 7), MAT_SNOW_CAP);
      cap.position.set(x, y + h * 0.8, z);
      scene.add(cap); platformMeshes.push(cap);
    }
  }

  function makeVolcano(x, y, z, h) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.18, h * 0.65, h, 8), MAT_VOLCANO);
    body.position.set(x, y + h/2, z); body.castShadow = true;
    scene.add(body); platformMeshes.push(body);

    const mid = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.3, h * 0.5, h * 0.35, 8), MAT_VOLCANO_MID);
    mid.position.set(x, y + h * 0.28, z);
    scene.add(mid); platformMeshes.push(mid);

    const lava = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.14, h * 0.14, 1.5, 12), MAT_LAVA);
    lava.position.set(x, y + h + 0.5, z);
    scene.add(lava); platformMeshes.push(lava);

    const glow = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.67, h * 0.67, 0.5, 12), MAT_LAVA_GLOW);
    glow.position.set(x, y + 0.25, z);
    scene.add(glow); platformMeshes.push(glow);

    // Add lava columns around volcano
    for (let c = 0; c < 4; c++) {
      const ca = (c / 4) * Math.PI * 2;
      const cr = h * 0.5;
      makeLavaColumn(x + Math.cos(ca) * cr, y + h * 0.3, z + Math.sin(ca) * cr, Utils.randRange(3, 8));
    }
  }

  function makeCrystalSpire(x, y, z, h) {
    const mat = currentWorldType === 'heaven' ? MAT_HEAVEN_CRYSTAL : MAT_CRYSTAL;
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.14, h, 6), mat);
    m.position.set(x, y + h/2, z);
    scene.add(m); platformMeshes.push(m);

    // Smaller satellite crystals
    for (let s = 0; s < 3; s++) {
      const sa = (s / 3) * Math.PI * 2;
      const sr = h * 0.3;
      const sh = h * 0.4;
      const satellite = new THREE.Mesh(new THREE.ConeGeometry(sh * 0.12, sh, 5), mat);
      satellite.position.set(x + Math.cos(sa) * sr, y + h * 0.5 + sh / 2, z + Math.sin(sa) * sr);
      satellite.rotation.z = Utils.randRange(-0.2, 0.2);
      scene.add(satellite); platformMeshes.push(satellite);
    }
  }

  function makeRollingHill(x, y, z, scale) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(scale, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), MAT_MOUNTAIN2);
    m.position.set(x, y, z);
    scene.add(m); platformMeshes.push(m);
  }

  // ─── FINISH PLATFORM ───────────────────────────────────────────────────────
  function placeFinish(x, y, z) {
    const finishMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const geo = new THREE.BoxGeometry(10, 0.6, 10);
    finishMesh = new THREE.Mesh(geo, finishMat);
    finishMesh.position.set(x, y, z);
    finishMesh.receiveShadow = true;
    scene.add(finishMesh);
    finishPos.set(x, y, z);
    Physics.register(finishMesh, new THREE.Vector3(10, 0.6, 10), 'finish');
    platformMeshes.push(finishMesh);

    // Golden arch/ring
    const ringGeo = new THREE.TorusGeometry(4, 0.3, 10, 32);
    const ringMat = currentWorldType === 'heaven' ? MAT_HEAVEN_CRYSTAL : new THREE.MeshLambertMaterial({ color: 0xff8800 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, y + 4.5, z);
    scene.add(ring);
    checkpointMeshes.push(ring);

    // Victory beam
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, y + 15, z);
    scene.add(beam);
    platformMeshes.push(beam);
  }

  // ─── DECORATIONS BY WORLD ──────────────────────────────────────────────────
  function decorateClassic(px, py, pz, pw, pd, rng) {
    const topY = py + 0.5;
    const hw = pw * 0.35, hd = pd * 0.35;
    const roll = rng();

    if (roll < 0.3) {
      makeTree(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd), Utils.randRange(0.6, 1.0));
    } else if (roll < 0.5) {
      const colors = [0xff6688, 0xff88cc, 0xffaa33, 0xcc55ff, 0x44ccff, 0xffee55];
      for (let f = 0; f < 3; f++) {
        makeFlower(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd), colors[Math.floor(rng() * colors.length)]);
      }
    } else if (roll < 0.65) {
      makeMushroom(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd));
    } else if (roll < 0.78) {
      makeBee(px, topY + 1.5, pz, Utils.randRange(1, 2), Utils.randRange(0.8, 1.5), rng() * Math.PI * 2);
    } else {
      // Rock pile
      const MAT_ROCK = new THREE.MeshLambertMaterial({ color: 0x7a7055 });
      for (let r = 0; r < 4; r++) {
        const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(Utils.randRange(0.12, 0.25), 0), MAT_ROCK);
        rk.position.set(px + Utils.randRange(-hw, hw), topY + 0.1, pz + Utils.randRange(-hd, hd));
        rk.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        scene.add(rk); platformMeshes.push(rk);
      }
    }
  }

  function decorateHell(px, py, pz, pw, pd, rng) {
    const topY = py + 0.5;
    const hw = pw * 0.35, hd = pd * 0.35;
    const roll = rng();

    if (roll < 0.25) {
      makeLavaColumn(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd), Utils.randRange(1.5, 3));
    } else if (roll < 0.45) {
      // Glowing crack
      const crack = new THREE.Mesh(new THREE.BoxGeometry(Utils.randRange(1, 2.5), 0.04, 0.15), MAT_LAVA_GLOW);
      crack.position.set(px + Utils.randRange(-hw * 0.5, hw * 0.5), topY + 0.02, pz + Utils.randRange(-hd * 0.5, hd * 0.5));
      crack.rotation.y = rng() * Math.PI;
      scene.add(crack); platformMeshes.push(crack);
    } else if (roll < 0.6) {
      makeSkeleton(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd));
    } else if (roll < 0.75) {
      makeDeadTree(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd), Utils.randRange(2, 5));
    } else {
      // Scattered hell rocks
      for (let r = 0; r < 5; r++) {
        const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(Utils.randRange(0.15, 0.4), 0), MAT_LAVA_ROCK);
        rk.position.set(px + Utils.randRange(-hw, hw), topY + 0.1, pz + Utils.randRange(-hd, hd));
        rk.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        scene.add(rk); platformMeshes.push(rk);
      }
    }
  }

  function decorateWinter(px, py, pz, pw, pd, rng) {
    const topY = py + 0.5;
    const hw = pw * 0.35, hd = pd * 0.35;
    const roll = rng();

    if (roll < 0.35) {
      // Ice crystal cluster
      for (let c = 0; c < 3 + Math.floor(rng() * 3); c++) {
        const h = Utils.randRange(0.3, 0.8);
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(Utils.randRange(0.06, 0.14), h, 5), MAT_ICE_SPIKE);
        crystal.position.set(px + Utils.randRange(-hw, hw), topY + h / 2, pz + Utils.randRange(-hd, hd));
        crystal.rotation.set(Utils.randRange(-0.2, 0.2), rng() * Math.PI, Utils.randRange(-0.15, 0.15));
        scene.add(crystal); platformMeshes.push(crystal);
      }
    } else if (roll < 0.6) {
      // Snow pile
      const MAT_SNOW = new THREE.MeshLambertMaterial({ color: 0xeef8ff });
      [{ r: 0.3, y: 0.25 }, { r: 0.22, y: 0.55 }, { r: 0.14, y: 0.75 }].forEach(s => {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(s.r, 7, 6), MAT_SNOW);
        ball.position.set(px + Utils.randRange(-hw * 0.5, hw * 0.5), topY + s.y, pz + Utils.randRange(-hd * 0.5, hd * 0.5));
        scene.add(ball); platformMeshes.push(ball);
      });
    } else if (roll < 0.78) {
      makeFrozenStatue(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd));
    } else {
      // Scattered ice shards
      for (let s = 0; s < 4; s++) {
        const shard = new THREE.Mesh(new THREE.BoxGeometry(0.15, Utils.randRange(0.3, 0.6), 0.05), MAT_ICE_CRYSTAL);
        shard.position.set(px + Utils.randRange(-hw, hw), topY + 0.3, pz + Utils.randRange(-hd, hd));
        shard.rotation.y = rng() * Math.PI;
        scene.add(shard); platformMeshes.push(shard);
      }
    }
  }

  function decorateHeaven(px, py, pz, pw, pd, rng) {
    const topY = py + 0.5;
    const hw = pw * 0.35, hd = pd * 0.35;
    const roll = rng();

    if (roll < 0.3) {
      makeEnergyCrystal(px + Utils.randRange(-hw, hw), topY, pz + Utils.randRange(-hd, hd), Utils.randRange(1.5, 3.5));
    } else if (roll < 0.55) {
      makeFloatingRune(px + Utils.randRange(-hw, hw), topY + Utils.randRange(1, 3), pz + Utils.randRange(-hd, hd));
    } else if (roll < 0.72) {
      // Glowing star decoration
      const MAT_GLOW = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.8 });
      for (let arm = 0; arm < 4; arm++) {
        const aGeo = new THREE.BoxGeometry(0.6, 0.12, 0.12);
        const aM = new THREE.Mesh(aGeo, MAT_HEAVEN_CRYSTAL);
        aM.position.set(px + Utils.randRange(-hw, hw), topY + 0.5 + arm * 0.02, pz + Utils.randRange(-hd, hd));
        aM.rotation.y = (arm / 4) * Math.PI;
        scene.add(aM); platformMeshes.push(aM);
      }
      _bees.push({
        mesh: null, cx: px + Utils.randRange(-hw, hw), cy: topY + 0.5, cz: pz + Utils.randRange(-hd, hd),
        orbitRadius: 0.5, speed: 0.8, phase: rng() * Math.PI * 2,
        bobAmp: 0.1, bobSpeed: 1.5, wL: null, wR: null
      });
    } else {
      // Nebula wisps
      const MAT_NEBULA = new THREE.MeshBasicMaterial({ color: 0x8844AA, transparent: true, opacity: 0.4 });
      for (let w = 0; w < 3; w++) {
        const wisp = new THREE.Mesh(new THREE.SphereGeometry(Utils.randRange(0.3, 0.6), 6, 6), MAT_NEBULA);
        wisp.position.set(px + Utils.randRange(-hw, hw), topY + 0.4 + w * 0.2, pz + Utils.randRange(-hd, hd));
        scene.add(wisp); platformMeshes.push(wisp);
      }
    }
  }

  // ─── PLANK ─────────────────────────────────────────────────────────────────
  function makePlank(x, y, z, w, d) {
    const geo = new THREE.BoxGeometry(w, 0.3, d);
    const mat = currentWorldType === 'hell' ? MAT_HELL_ROCK :
                currentWorldType === 'winter' ? MAT_ICE_PLATFORM :
                currentWorldType === 'heaven' ? MAT_HEAVEN_STONE : MAT_WOOD;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = mesh.castShadow = true;
    scene.add(mesh);
    platformMeshes.push(mesh);
    Physics.register(mesh, new THREE.Vector3(w, 0.3, d), 'plank');
    return mesh;
  }

  // ─── HOUSE ─────────────────────────────────────────────────────────────────
  function makeHouse(x, y, z, scale) {
    const s = scale || 1;
    const wallGeo = new THREE.BoxGeometry(2 * s, 1.8 * s, 2 * s);
    const wall = new THREE.Mesh(wallGeo, MAT_WALL);
    wall.position.set(x, y + 0.9 * s, z);
    wall.castShadow = true;
    scene.add(wall);
    platformMeshes.push(wall);
    Physics.register(wall, new THREE.Vector3(2 * s, 1.8 * s, 2 * s), 'house');

    const roofGeo = new THREE.ConeGeometry(1.6 * s, 1.2 * s, 4);
    const roof = new THREE.Mesh(roofGeo, MAT_ROOF);
    roof.position.set(x, y + 1.8 * s + 0.6 * s, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);
    platformMeshes.push(roof);

    const chimGeo = new THREE.BoxGeometry(0.25 * s, 0.6 * s, 0.25 * s);
    const chim = new THREE.Mesh(chimGeo, MAT_STONE);
    chim.position.set(x + 0.5 * s, y + 2.8 * s, z + 0.3 * s);
    scene.add(chim);
    platformMeshes.push(chim);
  }

  // ─── MOON DECORATIONS ──────────────────────────────────────────────────────
  function makeCrater(x, y, z, r) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r*0.15, 6, 18), MAT_MOON_ROCK);
    rim.rotation.x = Math.PI/2; rim.position.set(x, y+0.1, z);
    scene.add(rim); platformMeshes.push(rim);
    const floor2 = new THREE.Mesh(new THREE.CylinderGeometry(r*0.85, r*0.85, 0.12, 14), MAT_MOON_DARK);
    floor2.position.set(x, y-0.05, z);
    scene.add(floor2); platformMeshes.push(floor2);
    if (r > 3) {
      const core = new THREE.Mesh(new THREE.CylinderGeometry(r*0.25, r*0.25, 0.15, 10), MAT_MOON_GLOW);
      core.position.set(x, y, z);
      scene.add(core); platformMeshes.push(core);
      _bees.push({ mesh: core, cx: x, cy: y, cz: z, orbitRadius: 0, speed: 0, phase: Math.random()*Math.PI*2, bobAmp: 0.04, bobSpeed: 1.5, wL: null, wR: null });
    }
  }

  function makeMoonRock(x, y, z, size) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), MAT_MOON_ROCK);
    m.position.set(x, y+size*0.5, z);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    m.castShadow = true;
    scene.add(m); platformMeshes.push(m);
  }

  function decorateMoon(px, py, pz, pw, pd, rng) {
    const topY = py + 0.5;
    const hw = pw*0.35, hd = pd*0.35;
    const roll = rng();
    if (roll < 0.4) {
      makeCrater(px+Utils.randRange(-hw*0.4,hw*0.4), topY, pz+Utils.randRange(-hd*0.4,hd*0.4), Utils.randRange(0.6, Math.min(pw*0.4,1.8)));
    } else if (roll < 0.65) {
      for (let r = 0; r < 4; r++)
        makeMoonRock(px+Utils.randRange(-hw,hw), topY, pz+Utils.randRange(-hd,hd), Utils.randRange(0.15,0.45));
    } else if (roll < 0.82) {
      const ch = Utils.randRange(0.5, 1.2);
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.1, ch, 5), MAT_MOON_GLOW);
      crystal.position.set(px+Utils.randRange(-hw,hw), topY+ch/2, pz+Utils.randRange(-hd,hd));
      scene.add(crystal); platformMeshes.push(crystal);
    } else {
      const dust = new THREE.Mesh(new THREE.TorusGeometry(Utils.randRange(0.5,1.2), 0.08, 4, 16), MAT_MOON_DUST);
      dust.rotation.x = Math.PI/2;
      dust.position.set(px+Utils.randRange(-hw,hw), topY+0.05, pz+Utils.randRange(-hd,hd));
      scene.add(dust); platformMeshes.push(dust);
    }
  }

  // ─── WORLD-SPECIFIC STARTING ISLAND ───────────────────────────────────────
  function buildStartingIsland(map) {
    const baseY = 0;
    const size = 36;


    switch (map) {
      case 'hell': {
        // Volcanic starting island
        const islandGeo = new THREE.CylinderGeometry(18, 20, 4, 16);
        const island = new THREE.Mesh(islandGeo, MAT_HELL_ROCK);
        island.position.set(0, baseY, 0);
        island.receiveShadow = island.castShadow = true;
        scene.add(island);
        platformMeshes.push(island);
        Physics.register(island, new THREE.Vector3(36, 4, 36), 'hell');

        // Lava cracks
        for (let c = 0; c < 8; c++) {
          const a = (c / 8) * Math.PI * 2;
          const crack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 6), MAT_LAVA_GLOW);
          crack.position.set(Math.cos(a) * 8, baseY + 2.1, Math.sin(a) * 8);
          crack.rotation.y = a;
          scene.add(crack); platformMeshes.push(crack);
        }

        // Hellish structures
        makeLavaColumn(8, 2, 8, 5);
        makeLavaColumn(-10, 2, -8, 7);
        makeSkeleton(5, 2, -10);
        makeSkeleton(-7, 2, 6);
        makeDeadTree(-12, 2, -4, 6);

        // Fence posts
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), MAT_HELL_CHAIN);
          post.position.set(Math.cos(a) * 16, 3, Math.sin(a) * 16);
          scene.add(post); platformMeshes.push(post);
        }
        break;
      }
      case 'winter': {
        // Frozen starting island
        const islandGeo = new THREE.CylinderGeometry(18, 20, 4, 16);
        const island = new THREE.Mesh(islandGeo, MAT_FROZEN_GROUND);
        island.position.set(0, baseY, 0);
        island.receiveShadow = island.castShadow = true;
        scene.add(island);
        platformMeshes.push(island);
        Physics.register(island, new THREE.Vector3(36, 4, 36), 'ice');

        // Ice crystals around edge
        for (let c = 0; c < 12; c++) {
          const a = (c / 12) * Math.PI * 2;
          makeIceSpire(Math.cos(a) * 14, 2, Math.sin(a) * 14, Utils.randRange(3, 8));
        }

        // Snow mounds
        const MAT_SNOW = new THREE.MeshLambertMaterial({ color: 0xeef8ff });
        [[-10, 10], [10, -10], [-8, -8], [12, 5]].forEach(([mx, mz]) => {
          [{ r: 0.5, y: 0.4 }, { r: 0.35, y: 0.85 }, { r: 0.22, y: 1.15 }].forEach(s => {
            const ball = new THREE.Mesh(new THREE.SphereGeometry(s.r, 7, 6), MAT_SNOW);
            ball.position.set(mx, 2 + s.y, mz);
            scene.add(ball); platformMeshes.push(ball);
          });
        });

        // Frozen statues
        makeFrozenStatue(-8, 2, 8);
        makeFrozenStatue(10, 2, -6);
        break;
      }
      case 'heaven': {
        // Celestial starting island
        const islandGeo = new THREE.CylinderGeometry(18, 20, 3, 16);
        const island = new THREE.Mesh(islandGeo, MAT_HEAVEN_STONE);
        island.position.set(0, baseY, 0);
        island.receiveShadow = island.castShadow = true;
        scene.add(island);
        platformMeshes.push(island);
        Physics.register(island, new THREE.Vector3(36, 3, 36), 'heaven');

        // Portal rings
        makePortalRing(-10, 1.5, -10);
        makePortalRing(10, 1.5, 10);

        // Energy crystals
        makeEnergyCrystal(-12, 1.5, 6, 4);
        makeEnergyCrystal(12, 1.5, -6, 5);

        // Floating runes
        makeFloatingRune(0, 5, -12);
        makeFloatingRune(-6, 6, 12);

        // Glowing paths
        const MAT_PATH = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.6 });
        for (let p = 0; p < 8; p++) {
          const pa = (p / 8) * Math.PI * 2;
          const path = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 3), MAT_PATH);
          path.position.set(Math.cos(pa) * 12, 1.6, Math.sin(pa) * 12);
          path.rotation.y = pa;
          scene.add(path); platformMeshes.push(path);
        }
        break;
      }
      case 'moon': {
        const islandGeo = new THREE.CylinderGeometry(17, 19, 3, 20);
        const island = new THREE.Mesh(islandGeo, MAT_MOON_ROCK);
        island.position.set(0, baseY, 0);
        island.receiveShadow = island.castShadow = true;
        scene.add(island); platformMeshes.push(island);
        Physics.register(island, new THREE.Vector3(34, 3, 34), 'platform');
        const dustMesh = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 0.18, 20), MAT_MOON_DUST);
        dustMesh.position.set(0, 1.6, 0);
        scene.add(dustMesh); platformMeshes.push(dustMesh);
        [[8,8],[-10,5],[4,-11],[-6,-7],[11,-4]].forEach(([cx2,cz2]) => makeCrater(cx2, 1.6, cz2, Utils.randRange(1.5, 4)));
        for (let r = 0; r < 20; r++) {
          const a = Math.random()*Math.PI*2, d2 = Utils.randRange(4,15);
          makeMoonRock(Math.cos(a)*d2, 1.6, Math.sin(a)*d2, Utils.randRange(0.2, 0.7));
        }
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,3,5), MAT_MOON_DUST);
        pole.position.set(0, 3, -4); scene.add(pole); platformMeshes.push(pole);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.55,0.04), new THREE.MeshLambertMaterial({color:0x4488ff}));
        flag.position.set(0.5, 4.1, -4); scene.add(flag); platformMeshes.push(flag);
        for (let i = 0; i < 16; i++) {
          const a = (i/16)*Math.PI*2;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.9,0.18), MAT_MOON_ROCK);
          post.position.set(Math.cos(a)*15, 2.2, Math.sin(a)*15);
          scene.add(post); platformMeshes.push(post);
        }
        break;
      }
      default: { // classic
        // Large nature island
        makeIsland(0, baseY, 0, size, size, 3, 'nature');

        // Houses
        makeHouse(-12, 1.8, -12, 1.4);
        makeHouse(10, 1.8, -12, 1.2);
        makeHouse(-13, 1.8, 10, 1.1);

        // Fence posts
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const geo = new THREE.BoxGeometry(0.22, 1.1, 0.22);
          const m = new THREE.Mesh(geo, MAT_WOOD);
          m.position.set(Math.cos(a) * 15.5, 2.5, Math.sin(a) * 15.5);
          scene.add(m); platformMeshes.push(m);
        }

        // Trees
        [[-10, 4], [11, 5], [-9, -3], [12, -4], [0, -13], [7, -11], [-7, 11], [4, 13], [-13, 3]].forEach(([tx, tz]) =>
          makeTree(tx, 1.8, tz, Utils.randRange(1.3, 1.8))
        );

        // Flowers
        const flowerColors = [0xff6688, 0xffaa44, 0xcc55ff, 0x44ccff, 0xffdd33, 0xff88cc];
        for (let f = 0; f < 50; f++) {
          const fa = Math.random() * Math.PI * 2;
          const fr = Utils.randRange(4, 14);
          makeFlower(Math.cos(fa) * fr, 1.8, Math.sin(fa) * fr, flowerColors[Math.floor(Math.random() * flowerColors.length)]);
        }

        // Bees
        for (let b = 0; b < 8; b++) {
          const ba = (b / 8) * Math.PI * 2 + Math.random();
          makeBee(Math.cos(ba) * 6, 5.5, Math.sin(ba) * 6, Utils.randRange(1.5, 3.5), Utils.randRange(0.6, 1.4), Math.random() * Math.PI * 2);
        }

        // Mushrooms
        [[-6, -6], [9, 3], [-4, 10], [8, -9]].forEach(([mx, mz]) => makeMushroom(mx, 1.8, mz));
      }
    }

    // Easter egg position
    _bigCowSpots = [{ pos: new THREE.Vector3(14, 4, 14) }];
    if (_showBigCow) createBigCowSprites();
  }

  // ─── WORLD BIOME MAPPING ───────────────────────────────────────────────────
  function getWorldBiome(map, progress) {
    switch (map) {
      case 'hell':
        return progress < 0.33 ? 'hellstone' : progress < 0.66 ? 'lavaplat' : 'hellstone';
      case 'winter':
        return progress < 0.33 ? 'frozen' : progress < 0.66 ? 'ice' : 'frozen';
      case 'heaven':
        return progress < 0.33 ? 'celestial' : progress < 0.66 ? 'crystal' : 'celestial';
      case 'moon':
        return 'moon';
      default:
        return progress < 0.2 ? 'nature' : progress < 0.4 ? 'stone' : progress < 0.6 ? 'metal' : progress < 0.8 ? 'ice' : 'cloud';
    }
  }

  // ─── SEEDED RNG ────────────────────────────────────────────────────────────
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ─── MAIN LEVEL BUILD ──────────────────────────────────────────────────────
  function buildLevel(idx) {
    const rng = Math.random;
    const map = window.GameMap || 'classic';
    currentWorldType = map;

    // Apply world graphics preset
    Graphics.setWorldPreset(map);
    Particles.init(scene, map);

    // Build base scene
    buildSky();
    buildLights();
    buildStartingIsland(map);

    // Procedural generation
    let cx = 0, cy = 0, cz = 0;
    let totalPlatforms = 75;
    let angle = Math.PI * 0.5 + Utils.randRange(-Math.PI * 0.6, Math.PI * 0.6);

    let lastType1 = '';
    let lastType2 = '';

    for (let i = 0; i < totalPlatforms; i++) {
      const progress = i / totalPlatforms;
      const biome = getWorldBiome(map, progress);

      // Platform spacing - increases with progress
      let hMax = 14 + progress * 2;
      let vMin = 2.5 + progress * 1.8;
      let vMax = 4.5 + progress * 2.8;

      angle += Utils.randRange(-0.28, 0.28);
      const minDist = Math.max(7, 11 - progress * 2);
      const dist = Utils.randRange(minDist, hMax);

      cx += Math.cos(angle) * dist;
      cy += Utils.randRange(vMin, vMax);
      cz += Math.sin(angle) * dist;

      // Platform sizes - get smaller with progress
      let w = Utils.randRange(5 - progress * 2.5, 8 - progress * 3);
      let d = Utils.randRange(5 - progress * 2.5, 8 - progress * 3);
      w = Math.max(w, 2.5);
      d = Math.max(d, 2.5);

      // Platform type selection - world-specific
      let types = ['island', 'island', 'plank'];
      if (i > 5) types.push('moving');
      if (i > 12) types.push('spin');
      if (i > 22) types.push('falling');
      if (i > 32) types.push('disappear', 'bounce');

      // World-specific special obstacles
      if (map === 'hell' && i > 15) types.push('fire');
      if (map === 'winter' && i > 15) types.push('wind');
      if (map === 'heaven' && i > 15) types.push('gravity');

      let type = types[Math.floor(rng() * types.length)];

      // Anti-repetition
      if (type === lastType1 && type === lastType2) {
        type = type === 'island' ? 'plank' : 'island';
      }
      lastType2 = lastType1;
      lastType1 = type;

      // Build platform
      if (type === 'island') {
        makeIsland(cx, cy, cz, w, d, Utils.randRange(1, 3), biome);

        // Decorate based on world
        if (w >= 3) {
          switch (map) {
            case 'hell': decorateHell(cx, cy, cz, w, d, rng); break;
            case 'winter': decorateWinter(cx, cy, cz, w, d, rng); break;
            case 'heaven': decorateHeaven(cx, cy, cz, w, d, rng); break;
            case 'moon': decorateMoon(cx, cy, cz, w, d, rng); break;
            default: decorateClassic(cx, cy, cz, w, d, rng);
          }
        }
      } else if (type === 'plank') {
        makePlank(cx, cy, cz, w, Math.max(d * 0.5, 2));
      } else if (type === 'moving') {
        Obstacles.addMovingPlatform(scene, cx, cy, cz, w, d);
      } else if (type === 'falling') {
        Obstacles.addFallingPlatform(scene, cx, cy, cz, w, d);
      } else if (type === 'disappear') {
        Obstacles.addDisappearingPlatform(scene, cx, cy, cz, w, d);
      } else if (type === 'bounce') {
        Obstacles.addBouncePlatform(scene, cx, cy, cz, Math.max(w * 0.8, 2.5), Math.max(d * 0.8, 2.5));
      } else if (type === 'spin') {
        makeIsland(cx, cy, cz, Math.max(w, 4.5), Math.max(d, 4.5), 2, biome);
        Obstacles.addSpinTrap(scene, cx, cy + 1.5, cz);
      } else if (type === 'fire') {
        makeIsland(cx, cy, cz, w, d, 1.5, biome);
        Obstacles.addFireJet(scene, cx, cy + 0.5, cz, w * 0.8);
      } else if (type === 'wind') {
        makeIsland(cx, cy, cz, w, d, 1.5, biome);
        Obstacles.addWindZone(scene, cx, cy, cz, w, d);
      } else if (type === 'gravity') {
        makeIsland(cx, cy, cz, w, d, 1.5, biome);
        Obstacles.addGravityZone(scene, cx, cy + 2, cz, w, d);
      }

      // Big cow spots
      if (i === Math.floor(totalPlatforms * 0.33) || i === Math.floor(totalPlatforms * 0.66)) {
        _bigCowSpots.push({ pos: new THREE.Vector3(cx, cy + 3, cz) });
      }
    }

    // Finish
    cx += Utils.randRange(-5, 5);
    cy += 5;
    cz += Utils.randRange(5, 12);
    placeFinish(cx, cy, cz);
    _bigCowSpots.push({ pos: new THREE.Vector3(cx, cy + 4, cz) });

    if (_showBigCow) setBigCowVisible(true);

    // Ground layer
    const gColor = map === 'hell' ? 0x1a0500 : map === 'winter' ? 0xc8d8e8 : map === 'heaven' ? 0x0a0020 : 0x3a6b1e;
    const gGeo = new THREE.PlaneGeometry(600, 600, 1, 1);
    gGeo.rotateX(-Math.PI / 2);
    const gMesh = new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ color: gColor }));
    gMesh.position.set(0, -10, 0); gMesh.receiveShadow = true;
    scene.add(gMesh); platformMeshes.push(gMesh);

    buildBiomeTerrain(map, cy);
    buildClouds(cy + 30);
  }

  // ─── EASTER EGG ────────────────────────────────────────────────────────────
  function createBigCowSprites() {
    // Already handled in update
  }

  function toggleBigCow() {
    _showBigCow = !_showBigCow;
    if (!_showBigCow) {
      const el = document.getElementById('big-cow-container');
      if (el) el.style.display = 'none';
    }
    return _showBigCow;
  }

  function setBigCowVisible(visible) {
    _showBigCow = visible;
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  function update(dt, playerPos) {
    _time += dt;

    if (!playerPos) return;

    // Update atmosphere based on altitude
    Graphics.updateAtmosphere(playerPos.y);
    Graphics.updateLights(_ambientLight, _sunLight);
    Graphics.updateSkyUniforms(_skyUniforms, _starMesh);
    Graphics.updateScene(scene);

    // Update particles
    Particles.update(dt, playerPos);

    // Move sky/star sphere to follow player (prevents horizon clipping)
    if (_skyMesh)  _skyMesh.position.copy(playerPos);
    if (_starMesh) _starMesh.position.copy(playerPos);

    // Cloud animation
    cloudMeshes.forEach(c => {
      c.visible = playerPos.y < 280;
      if (c.visible) {
        c.position.x += dt * 2;
        c.position.y += Math.sin(_time * 0.5 + c.position.x * 0.1) * 0.008;
        if (c.position.x > 220) c.position.x = -220;
      }
    });

    // Animate bees
    _bees.forEach(bee => {
      if (!bee.mesh && bee.cx !== undefined) {
        // Lazy-create missing meshes
        return;
      }
      const t = _time * bee.speed + bee.phase;

      if (bee.isSpinner) {
        bee.mesh.rotation.y += dt * bee.speed;
        bee.mesh.position.y = bee.cy + Math.sin(_time * bee.bobSpeed + bee.phase) * bee.bobAmp;
        return;
      }
      if (bee.mesh) {
        bee.mesh.position.set(
          bee.cx + Math.cos(t) * bee.orbitRadius,
          bee.cy + Math.sin(_time * bee.bobSpeed + bee.phase) * bee.bobAmp,
          bee.cz + Math.sin(t) * bee.orbitRadius
        );
        if (bee.orbitRadius > 0.01) bee.mesh.rotation.y = t + Math.PI * 0.5;
        const wFlap = Math.sin(_time * 18 + bee.phase) * 0.3;
        if (bee.wL) { bee.wL.rotation.z = wFlap; bee.wR.rotation.z = -wFlap; }
      }
    });

    // Rotate finish ring
    checkpointMeshes.forEach(m => {
      if (m.geometry && m.geometry.type === 'TorusGeometry') {
        m.rotation.z += dt * 1.4;
      }
    });

    // Finish check
    if (finishMesh && playerPos.distanceTo(finishPos) < 6) {
      Game.onLevelComplete();
    }

    // Big cow proximity
    if (_showBigCow && _bigCowSpots.length > 0) {
      let nearest = null;
      let minDist = 55;
      for (const spot of _bigCowSpots) {
        const d = playerPos.distanceTo(spot.pos);
        if (d < minDist) { minDist = d; nearest = spot; }
      }
      const el = document.getElementById('big-cow-container');
      if (nearest && el) {
        const cam = CameraSystem.getCamera();
        if (cam) {
          const v = nearest.pos.clone();
          v.project(cam);
          if (v.z < 1.0 && v.z > -1.0) {
            el.style.display = 'block';
            const x = (v.x * 0.5 + 0.5) * window.innerWidth;
            const y = (v.y * -0.5 + 0.5) * window.innerHeight;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.transform = 'translate(-50%, -100%)';
          } else {
            el.style.display = 'none';
          }
        }
      } else if (el) {
        el.style.display = 'none';
      }
    }
  }

  // ─── CLEAR ─────────────────────────────────────────────────────────────────
  function clear() {
    if (_ambientLight && scene) scene.remove(_ambientLight);
    if (_sunLight && scene) scene.remove(_sunLight);
    if (_fillLight && scene) scene.remove(_fillLight);
    if (_skyMesh && scene) scene.remove(_skyMesh);
    if (_starMesh && scene) scene.remove(_starMesh);
    _skyUniforms = null;

    [...platformMeshes, ...checkpointMeshes, ...cloudMeshes].forEach(m => {
      if (scene) scene.remove(m);
      if (m.geometry) m.geometry.dispose();
    });
    if (finishMesh) { if (scene) scene.remove(finishMesh); finishMesh = null; }

    platformMeshes = [];
    checkpointMeshes = [];
    cloudMeshes = [];
    checkpointData = [];
    _bees = [];

    const el = document.getElementById('big-cow-container');
    if (el) el.style.display = 'none';
    _bigCowSpots = [];

    Particles.clear();
    Physics.clear();
    Obstacles.clear(scene);
  }

  // ─── LOAD LEVEL ────────────────────────────────────────────────────────────
  function loadLevel(sc, idx) {
    scene = sc;
    levelIndex = idx;

    const originalRandom = Math.random;
    Math.random = mulberry32(idx * 12345 + 999);

    buildLevel(idx);

    Math.random = originalRandom;

    Player.respawn();
    Controls.resetMouse();
  }

  // ─── MENU SCENE ────────────────────────────────────────────────────────────
  function buildMenuScene(sc) {
    scene = sc;
    [...platformMeshes, ...checkpointMeshes, ...cloudMeshes].forEach(m => {
      if (scene) scene.remove(m);
      if (m.geometry) m.geometry.dispose();
    });
    platformMeshes = []; checkpointMeshes = []; cloudMeshes = [];

    Graphics.setWorldPreset('classic');
    buildSky();
    buildLights();

    // Starting island preview
    makeIsland(0, 0, 0, 36, 36, 3, 'nature');
    makeHouse(0, 1.6, 0, 1.6);
    makeHouse(-6, 1.6, 5, 1.1);
    makeTree(-10, 1.8, 5, 1.7);
    makeTree(10, 1.8, 6, 1.5);
    makeTree(3, 1.8, -12, 1.8);

    for (let f = 0; f < 20; f++) {
      makeFlower(Math.random() * 16 - 8, 1.8, Math.random() * 16 - 8, 0xff6688);
    }
    for (let b = 0; b < 6; b++) {
      makeBee(Math.random() * 12 - 6, 5 + Math.random() * 2, Math.random() * 12 - 6, 2.5, 0.8, Math.random());
    }

    // Preview platforms
    makeIsland(20, 8, -12, 8, 7, 2.5, 'nature');
    makeIsland(35, 16, 6, 6, 6, 2.5, 'stone');
    makeIsland(28, 24, -20, 5, 5, 2.5, 'metal');
    makeIsland(42, 32, 12, 5, 5, 2.5, 'ice');

    buildClouds(80);
  }

  function getFinishPos() { return finishPos; }

  return {
    loadLevel, buildMenuScene, update, clear, getFinishPos,
    toggleBigCow, setBigCowVisible
  };
})();