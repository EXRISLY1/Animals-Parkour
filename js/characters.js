/**
 * characters.js - Minecraft tarzı voxel/blocky karakterler
 * Daha iyi pivot noktaları, orantılar ve sevimli tasarımlar.
 */
const Characters = (() => {

  // ─── Material yardımcıları ──────────────────────────────────────────────
  function mat(color) { return new THREE.MeshLambertMaterial({ color }); }

  // ─── Küçük küp ekleme fonksiyonu ────────────────────────────────────────
  function addBox(parent, w, h, d, x, y, z, colorMat) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colorMat);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    parent.add(box);
    return box;
  }

  // ─── Standart 4 bacak oluştur ───────────────────────────────────────────
  // Pivot noktası kalçada (üst) olmalı, böylece bacak yürüme animasyonunda doğru sallanır
  function buildLegs(root, legColor, hoofColor, legW, legH, legD, positions) {
    const legMeshes = [];
    const matLeg = mat(legColor);
    const matHoof = hoofColor ? mat(hoofColor) : null;

    positions.forEach(([x, y, z]) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z); // Kalça noktası (yüksek)
      root.add(pivot);

      // Ana bacak küpü (pivot noktasından aşağı uzanır)
      const leg = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legD), matLeg);
      leg.position.set(0, -legH / 2, 0);
      leg.castShadow = true;
      pivot.add(leg);

      // Topuk küpü (bacağın ucunda)
      if (matHoof) {
        const hoofH = 0.1;
        const hoof = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.02, hoofH, legD + 0.02), matHoof);
        hoof.position.set(0, -legH + (hoofH / 2), 0);
        hoof.castShadow = true;
        pivot.add(hoof);
      }

      legMeshes.push(pivot);
    });
    return legMeshes;
  }

  // ─── Kuyruk oluştur ─────────────────────────────────────────────────────
  // Kuyruğun da doğru sallanması için pivot noktası tabanında olmalı
  function buildTail(parent, color, x, y, z, w, h, d, rx, ry, rz) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    pivot.rotation.set(rx, ry, rz);
    parent.add(pivot);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    // Pivot tabanda olduğu için kuyruk ondan dışa/aşağı uzanmalı (tasarıma göre h/2)
    tail.position.set(0, -h / 2, 0);
    tail.castShadow = true;
    pivot.add(tail);
    return pivot;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // 🐄 İNEK
  // ════════════════════════════════════════════════════════════════════════════
  function buildCow() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19; // Havada uçmayı önler
    wrapper.add(root);

    const WHITE = 0xf5f5f5, BLACK = 0x222222, PINK = 0xffb6c1, GOLD = 0xffd700, HOOF = 0x111111;
    const matWhite = mat(WHITE), matBlack = mat(BLACK), matPink = mat(PINK), matGold = mat(GOLD);

    // Bacaklar (Beyaz bacak, siyah toynak)
    const legMeshes = buildLegs(root, WHITE, HOOF, 0.16, 0.35, 0.16, [
      [-0.22, 0.35, 0.35], [0.22, 0.35, 0.35], [-0.22, 0.35, -0.35], [0.22, 0.35, -0.35]
    ]);

    // Gövde
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 1.0), matWhite);
    body.position.y = 0.6; 
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Düz Benekler (Gövdeyle hizalı)
    addBox(body, 0.02, 0.25, 0.25, 0.326, 0.1, 0.2, matBlack); // Sağ yan
    addBox(body, 0.02, 0.2, 0.2, 0.326, -0.1, -0.2, matBlack);
    addBox(body, 0.02, 0.25, 0.3, -0.326, 0.05, 0.1, matBlack); // Sol yan
    addBox(body, 0.02, 0.25, 0.2, -0.326, 0.15, -0.3, matBlack);
    addBox(body, 0.3, 0.02, 0.3, 0.1, 0.276, 0.1, matBlack); // Üst

    // Meme (Udder)
    const udder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.24), matPink);
    udder.position.set(0, -0.28, -0.1);
    udder.castShadow = true;
    body.add(udder);
    addBox(udder, 0.05, 0.06, 0.05, -0.06, -0.06, -0.06, matPink);
    addBox(udder, 0.05, 0.06, 0.05, 0.06, -0.06, -0.06, matPink);
    addBox(udder, 0.05, 0.06, 0.05, -0.06, -0.06, 0.06, matPink);
    addBox(udder, 0.05, 0.06, 0.05, 0.06, -0.06, 0.06, matPink);

    // Kafa Pivot
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.75, 0.55);
    root.add(headGroup);

    // Kafa
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matWhite);
    head.castShadow = true;
    headGroup.add(head);

    // Gözler (3D Çıkıntılı Bloklar)
    addBox(headGroup, 0.06, 0.06, 0.06, -0.12, 0.08, 0.18, matBlack);
    addBox(headGroup, 0.06, 0.06, 0.06, 0.12, 0.08, 0.18, matBlack);

    // Burun (Geniş Pembe Blok)
    addBox(headGroup, 0.32, 0.16, 0.12, 0, -0.12, 0.22, matPink);
    // Burun delikleri
    addBox(headGroup, 0.04, 0.04, 0.02, -0.08, -0.1, 0.28, matBlack);
    addBox(headGroup, 0.04, 0.04, 0.02, 0.08, -0.1, 0.28, matBlack);

    // Boynuzlar (Çıkıntılı ve açılı)
    const hornL = addBox(headGroup, 0.06, 0.12, 0.06, -0.15, 0.22, -0.05, matBlack);
    hornL.rotation.z = 0.2;
    const hornR = addBox(headGroup, 0.06, 0.12, 0.06, 0.15, 0.22, -0.05, matBlack);
    hornR.rotation.z = -0.2;

    // Kulaklar (Yanlara çıkan beyaz bloklar)
    addBox(headGroup, 0.15, 0.08, 0.04, -0.25, 0.05, 0, matWhite);
    addBox(headGroup, 0.15, 0.08, 0.04, 0.25, 0.05, 0, matWhite);

    // Altın Çan
    addBox(headGroup, 0.14, 0.14, 0.14, 0, -0.25, -0.05, matGold);

    // Kuyruk
    const tail = buildTail(root, WHITE, 0, 0.6, -0.5, 0.06, 0.4, 0.06, -0.3, 0, 0);

    return { root: wrapper, headGroup, legMeshes, tail, body, bodyMesh: body };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🐰 TAVŞAN
  // ════════════════════════════════════════════════════════════════════════════
  function buildRabbit() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19;
    wrapper.add(root);

    const WHITE = 0xffffff, PINK = 0xffaacc, BLACK = 0x222222;
    const matWhite = mat(WHITE), matPink = mat(PINK), matBlack = mat(BLACK);

    // Bacaklar
    const legMeshes = buildLegs(root, WHITE, null, 0.12, 0.2, 0.12, [
      [-0.15, 0.2, 0.15], [0.15, 0.2, 0.15], [-0.15, 0.2, -0.15], [0.15, 0.2, -0.15]
    ]);

    // Gövde
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), matWhite);
    body.position.y = 0.4;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Kafa Pivot
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.6, 0.35);
    root.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matWhite);
    head.castShadow = true;
    headGroup.add(head);

    // Gözler (Düz)
    addBox(headGroup, 0.05, 0.05, 0.02, -0.12, 0.02, 0.185, matBlack);
    addBox(headGroup, 0.05, 0.05, 0.02, 0.12, 0.02, 0.185, matBlack);

    // Burun
    addBox(headGroup, 0.06, 0.04, 0.02, 0, -0.05, 0.185, matPink);

    // Kulaklar
    const earL = addBox(headGroup, 0.08, 0.4, 0.06, -0.1, 0.35, -0.05, matWhite);
    addBox(earL, 0.04, 0.3, 0.02, 0, 0, 0.03, matPink);
    const earR = addBox(headGroup, 0.08, 0.4, 0.06, 0.1, 0.35, -0.05, matWhite);
    addBox(earR, 0.04, 0.3, 0.02, 0, 0, 0.03, matPink);

    // Kuyruk
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), matWhite);
    tail.position.set(0, 0.4, -0.35);
    tail.castShadow = true;
    root.add(tail);

    return { root: wrapper, headGroup, legMeshes, tail, body, bodyMesh: body };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🐑 KOYUN
  // ════════════════════════════════════════════════════════════════════════════
  function buildSheep() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19;
    wrapper.add(root);

    const WHITE = 0xfcfcfc, PINK = 0xffd9e6, DARK = 0x333333, NOSE = 0xff88a0;
    const matWhite = mat(WHITE), matPink = mat(PINK), matDark = mat(DARK), matNose = mat(NOSE);

    // Bacaklar: Fotoğraftaki gibi beyaz, ucu siyah
    const legMeshes = buildLegs(root, WHITE, DARK, 0.14, 0.3, 0.14, [
      [-0.18, 0.3, 0.35], [0.18, 0.3, 0.35], [-0.18, 0.3, -0.35], [0.18, 0.3, -0.35]
    ]);

    // Gövde Merkezi (Kabarık bloklar bunun etrafında olacak)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.8), matWhite);
    body.position.y = 0.55;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Fotoğraftaki gibi dev, dağınık, her yeri kaplayan kabarık beyaz küpler
    const positions = [
      [0, 0.2, 0], [0.15, 0.2, 0.2], [-0.15, 0.2, -0.2], [0.15, 0.15, -0.3], [-0.15, 0.15, 0.3],
      [0.2, 0, 0.2], [0.2, 0, -0.2], [-0.2, 0, 0.2], [-0.2, 0, -0.2],
      [0.25, -0.1, 0], [-0.25, -0.1, 0],
      [0, 0.1, 0.4], [0, 0.1, -0.4], [0, -0.1, 0.35], [0, -0.1, -0.35]
    ];
    for (const pos of positions) {
      const s = 0.3 + Math.random() * 0.1;
      addBox(body, s, s, s, pos[0], pos[1], pos[2], matWhite);
    }
    // Ekstra pofudukluk
    for (let i = 0; i < 15; i++) {
      const s = 0.2 + Math.random() * 0.15;
      const x = (Math.random() - 0.5) * 0.6;
      const y = (Math.random() - 0.5) * 0.5;
      const z = (Math.random() - 0.5) * 0.9;
      addBox(body, s, s, s, x, y, z, matWhite);
    }

    // Kafa Pivot
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0.5);
    root.add(headGroup);

    // Kafa (Fotoğraftaki gibi sadece pembe blok, yün şapka yok)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matPink);
    head.castShadow = true;
    headGroup.add(head);

    // Gözler (Fotoğraftaki gibi dışarı fırlayan 3D siyah bloklar)
    addBox(headGroup, 0.05, 0.05, 0.05, -0.1, 0.05, 0.16, matDark);
    addBox(headGroup, 0.05, 0.05, 0.05, 0.1, 0.05, 0.16, matDark);

    // Burun / Ağız (T-Şeklinde Koyu Pembe)
    addBox(headGroup, 0.08, 0.02, 0.02, 0, -0.05, 0.176, matNose); // Yatay
    addBox(headGroup, 0.02, 0.06, 0.02, 0, -0.08, 0.176, matNose); // Dikey

    // Kulaklar (Yanlara çıkan pembe bloklar)
    addBox(headGroup, 0.12, 0.08, 0.04, -0.22, 0.02, 0, matPink);
    addBox(headGroup, 0.12, 0.08, 0.04, 0.22, 0.02, 0, matPink);

    // Kuyruk (Gövde yünleriyle kaybolan beyaz küp)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), matWhite);
    tail.position.set(0, 0.55, -0.45);
    tail.castShadow = true;
    root.add(tail);

    return { root: wrapper, headGroup, legMeshes, tail, body, bodyMesh: body };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🐶 KÖPEK
  // ════════════════════════════════════════════════════════════════════════════
  function buildDog() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19;
    wrapper.add(root);

    const TAN = 0xe8c99a, BROWN = 0xb87c4f, BLACK = 0x2a2a2a;
    const matTan = mat(TAN), matBrown = mat(BROWN), matBlack = mat(BLACK);

    // Bacaklar
    const legMeshes = buildLegs(root, TAN, null, 0.12, 0.3, 0.12, [
      [-0.15, 0.3, 0.3], [0.15, 0.3, 0.3], [-0.15, 0.3, -0.3], [0.15, 0.3, -0.3]
    ]);

    // Gövde
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.8), matTan);
    body.position.y = 0.5;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Sırt deseni
    addBox(body, 0.42, 0.1, 0.4, 0, 0.16, -0.1, matBrown);

    // Kafa
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.7, 0.45);
    root.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matTan);
    head.castShadow = true;
    headGroup.add(head);

    // Burun (Muzzle)
    addBox(headGroup, 0.15, 0.15, 0.15, 0, -0.05, 0.25, matTan);
    addBox(headGroup, 0.06, 0.04, 0.02, 0, 0.02, 0.335, matBlack); // Siyah uç

    // Gözler (Düz)
    addBox(headGroup, 0.05, 0.05, 0.02, -0.1, 0.05, 0.185, matBlack);
    addBox(headGroup, 0.05, 0.05, 0.02, 0.1, 0.05, 0.185, matBlack);

    // Sarkık Kulaklar
    const earL = addBox(headGroup, 0.08, 0.25, 0.15, -0.2, -0.05, 0, matBrown);
    earL.rotation.z = 0.1;
    const earR = addBox(headGroup, 0.08, 0.25, 0.15, 0.2, -0.05, 0, matBrown);
    earR.rotation.z = -0.1;

    // Kuyruk
    const tail = buildTail(root, TAN, 0, 0.6, -0.4, 0.08, 0.3, 0.08, 0.5, 0, 0);

    return { root: wrapper, headGroup, legMeshes, tail, body, bodyMesh: body };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🦒 ZÜRAFA
  // ════════════════════════════════════════════════════════════════════════════
  function buildGiraffe() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19;
    wrapper.add(root);

    const YELLOW = 0xf5c842, BROWN = 0x9c6b2e, HOOF = 0x332211, PINK = 0xffbbaa;
    const matYellow = mat(YELLOW), matBrown = mat(BROWN), matHoof = mat(HOOF), matPink = mat(PINK);

    // Bacaklar
    const legMeshes = buildLegs(root, YELLOW, HOOF, 0.14, 0.8, 0.14, [
      [-0.2, 0.8, 0.3], [0.2, 0.8, 0.3], [-0.2, 0.8, -0.3], [0.2, 0.8, -0.3]
    ]);

    // Gövde
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.8), matYellow);
    body.position.y = 1.025;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Gövde Benekleri (Düz)
    addBox(body, 0.02, 0.15, 0.15, 0.251, 0.1, 0.2, matBrown);
    addBox(body, 0.02, 0.12, 0.18, -0.251, 0, 0.1, matBrown);
    addBox(body, 0.02, 0.18, 0.12, 0.251, -0.05, -0.2, matBrown);
    addBox(body, 0.02, 0.15, 0.15, -0.251, 0.1, -0.25, matBrown);

    // Boyun
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), matYellow);
    neck.position.set(0, 1.65, 0.3);
    neck.castShadow = true;
    root.add(neck);

    // Boyun benekleri
    addBox(neck, 0.26, 0.15, 0.15, 0, 0.2, 0.06, matBrown);
    addBox(neck, 0.26, 0.12, 0.12, 0, -0.15, -0.07, matBrown);

    // Kafa Pivot
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.05, 0.4);
    root.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), matYellow);
    head.castShadow = true;
    headGroup.add(head);

    // Burun
    addBox(headGroup, 0.2, 0.15, 0.15, 0, -0.07, 0.275, matPink);

    // Gözler (Yanlarda, düz)
    addBox(headGroup, 0.02, 0.05, 0.05, -0.16, 0.05, 0.1, matHoof);
    addBox(headGroup, 0.02, 0.05, 0.05, 0.16, 0.05, 0.1, matHoof);

    // Boynuzcuklar (Ossicones)
    addBox(headGroup, 0.04, 0.15, 0.04, -0.08, 0.22, -0.1, matYellow);
    addBox(headGroup, 0.06, 0.05, 0.06, -0.08, 0.3, -0.1, matBrown);
    addBox(headGroup, 0.04, 0.15, 0.04, 0.08, 0.22, -0.1, matYellow);
    addBox(headGroup, 0.06, 0.05, 0.06, 0.08, 0.3, -0.1, matBrown);

    // Kulaklar
    addBox(headGroup, 0.15, 0.06, 0.04, -0.2, 0.1, -0.1, matYellow);
    addBox(headGroup, 0.15, 0.06, 0.04, 0.2, 0.1, -0.1, matYellow);

    // Kuyruk
    const tail = buildTail(root, YELLOW, 0, 1.0, -0.4, 0.05, 0.4, 0.05, -0.2, 0, 0);
    addBox(tail.children[0], 0.08, 0.1, 0.08, 0, -0.2, 0, matBrown);

    return { root: wrapper, headGroup, legMeshes, tail, body, bodyMesh: body };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🐷 DOMUZ
  // ════════════════════════════════════════════════════════════════════════════
  function buildPig() {
    const wrapper = new THREE.Group();
    const root = new THREE.Group();
    root.position.y = -0.19;
    wrapper.add(root);

    const PINK = 0xffb8d1, DARK_PINK = 0xff8cb0, BLACK = 0x2d2d2d;
    const matPink = mat(PINK), matDarkPink = mat(DARK_PINK), matBlack = mat(BLACK);

    // Bacaklar
    const legMeshes = buildLegs(root, PINK, DARK_PINK, 0.15, 0.25, 0.15, [
      [-0.2, 0.25, 0.3], [0.2, 0.25, 0.3], [-0.2, 0.25, -0.3], [0.2, 0.25, -0.3]
    ]);

    // Gövde
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), matPink);
    body.position.y = 0.5;
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    // Kafa Pivot
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.55, 0.48);
    root.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.4), matPink);
    head.castShadow = true;
    headGroup.add(head);

    // Burun (Geniş)
    addBox(headGroup, 0.2, 0.12, 0.08, 0, -0.05, 0.24, matDarkPink);
    // Burun delikleri (Düz)
    addBox(headGroup, 0.04, 0.06, 0.02, -0.06, -0.05, 0.29, matBlack);
    addBox(headGroup, 0.04, 0.06, 0.02, 0.06, -0.05, 0.29, matBlack);

    // Gözler (Düz)
    addBox(headGroup, 0.05, 0.05, 0.02, -0.12, 0.05, 0.21, matBlack);
    addBox(headGroup, 0.05, 0.05, 0.02, 0.12, 0.05, 0.21, matBlack);

    // Kulaklar
    const earL = addBox(headGroup, 0.1, 0.15, 0.05, -0.25, 0.15, 0, matDarkPink);
    earL.rotation.z = 0.3;
    const earR = addBox(headGroup, 0.1, 0.15, 0.05, 0.25, 0.15, 0, matDarkPink);
    earR.rotation.z = -0.3;

    // Kıvrık Kuyruk
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.6, -0.45);
    root.add(tailGroup);

    const t1 = addBox(tailGroup, 0.06, 0.06, 0.15, 0, 0, -0.07, matPink);
    t1.rotation.y = 0.5;
    const t2 = addBox(tailGroup, 0.06, 0.06, 0.15, 0.06, 0, -0.18, matDarkPink);
    t2.rotation.y = -0.5;

    return { root: wrapper, headGroup, legMeshes, tail: tailGroup, body, bodyMesh: body };
  }

  // ─── Karakter Kaydı ────────────────────────────────────────────────────────────────
  const CHARACTERS = [
    {
      id: 'cow', name: 'İnek', emoji: '🐄',
      desc: 'Beyaz gövde, siyah benekler, pembe meme, altın çan',
      color: '#f5f5f5', build: buildCow,
      stats: { speed: 3, jump: 3, weight: 3 }
    },
    {
      id: 'rabbit', name: 'Tavşan', emoji: '🐰',
      desc: 'Çok uzun kulaklar, pembe burun, kısa bacaklar',
      color: '#ffffff', build: buildRabbit,
      stats: { speed: 4, jump: 5, weight: 1 }
    },
    {
      id: 'sheep', name: 'Koyun', emoji: '🐑',
      desc: 'Çok yün dokusu, pembe yüz, koyu bacaklar',
      color: '#fafaf0', build: buildSheep,
      stats: { speed: 2, jump: 2, weight: 4 }
    },
    {
      id: 'dog', name: 'Köpek', emoji: '🐶',
      desc: 'Sarkık kulaklar, düz bacaklar, yukari kuyruk',
      color: '#e8c99a', build: buildDog,
      stats: { speed: 5, jump: 4, weight: 2 }
    },
    {
      id: 'giraffe', name: 'Zürafa', emoji: '🦒',
      desc: 'Çok uzun boyun, benekler, uzun bacaklar',
      color: '#f5c842', build: buildGiraffe,
      stats: { speed: 3, jump: 5, weight: 3 }
    },
    {
      id: 'pig', name: 'Domuz', emoji: '🐷',
      desc: 'Şişman, geniş burun, kıvrık kuyruk',
      color: '#ffb8d1', build: buildPig,
      stats: { speed: 2, jump: 2, weight: 5 }
    }
  ];

  let _selected = 'cow';

  function getAll() { return CHARACTERS; }
  function getSelected() { return CHARACTERS.find(c => c.id === _selected) || CHARACTERS[0]; }
  function select(id) { if (CHARACTERS.find(c => c.id === id)) _selected = id; }
  function buildSelected() { return getSelected().build(); }
  function buildCharacter(id) { return (CHARACTERS.find(c => c.id === id) || CHARACTERS[0]).build(); }
  function getSelectedId() { return _selected; }

  return { getAll, getSelected, select, buildSelected, buildCharacter, getSelectedId };
})();