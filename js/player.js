const Player = (() => {
  // ─── Easter Egg State ─────────────────────────────────────────────────────
  let isMustafa = false;      // rainbow cow (activated via RGB cheat code)
  let bodyMesh  = null;       // ref for rainbow color cycling
  let rainbowT  = 0;

  // Konami Code: ↑↑↓↓←→←→
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight'];
  let konamiPos = 0;

  // RGB Toggle Code: R, G, B
  const RGB_CODE = ['KeyR', 'KeyG', 'KeyB'];
  let rgbPos = 0;

  // BIG Image Code: B, I, G
  const BIG_CODE = ['KeyB', 'KeyI', 'KeyG'];
  let bigPos = 0;

  // GOD Mode Code: G, O, D
  const GOD_CODE = ['KeyG', 'KeyO', 'KeyD'];
  let godPos = 0;

  // END Mode Code: E, N, D
  const END_CODE = ['KeyE', 'KeyN', 'KeyD'];
  let endPos = 0;

  // Animal Cheat Codes
  const ANIMAL_CHEATS = [
    { code: ['KeyI', 'KeyS', 'KeyO'], id: 'pig', name: '🐷 PIG', color: '#ffaaaa' },
    { code: ['KeyC', 'KeyO', 'KeyW'], id: 'cow', name: '🐄 COW', color: '#f5d742' },
    { code: ['KeyD', 'KeyO', 'KeyG'], id: 'dog', name: '🐶 DOG', color: '#e08030' },
    { code: ['KeyS', 'KeyH', 'KeyP'], id: 'sheep', name: '🐑 SHEEP', color: '#eeeeee' },
    { code: ['KeyR', 'KeyA', 'KeyB'], id: 'rabbit', name: '🐰 RABBIT', color: '#f0e8d8' },
    { code: ['KeyG', 'KeyR', 'KeyF'], id: 'giraffe', name: '🦒 GIRAFFE', color: '#d4a04a' }
  ];
  const animalCheatPos = new Array(ANIMAL_CHEATS.length).fill(0);

  // Double Jump State
  let jumpsLeft = 2;
  let flyMode = false;
  let godMode = false;

  document.addEventListener('keydown', e => {
    // Only process cheats if game is active (STATE.PLAYING = 1)
    if (typeof Game === 'undefined' || Game.getState() !== 1) return;

    // Check Konami
    if (e.code === KONAMI[konamiPos]) {
      konamiPos++;
      if (konamiPos === KONAMI.length) { konamiPos = 0; activateKonami(); }
    } else { konamiPos = 0; }

    // Check RGB Code
    if (e.code === RGB_CODE[rgbPos]) {
      rgbPos++;
      if (rgbPos === RGB_CODE.length) { rgbPos = 0; activateRGB(); }
    } else { rgbPos = 0; }

    // Check BIG Code
    if (e.code === BIG_CODE[bigPos]) {
      bigPos++;
      if (bigPos === BIG_CODE.length) { 
        bigPos = 0; 
        if (typeof World !== 'undefined' && World.toggleBigCow) {
          const isOn = World.toggleBigCow();
          showNotification(isOn ? '🐄 BIG SPOTS ON!' : '🐄 BIG SPOTS OFF', '#ffdd57');
        }
      }
    } else { bigPos = 0; }

    // Check GOD Code
    if (e.code === GOD_CODE[godPos]) {
      godPos++;
      if (godPos === GOD_CODE.length) { 
        godPos = 0; 
        if (!godMode) {
          godMode = true;
          showNotification('😇 GOD MODE ON!', '#ffdd57');
        }
      }
    } else { godPos = 0; }

    // Check END Code
    if (e.code === END_CODE[endPos]) {
      endPos++;
      if (endPos === END_CODE.length) {
        endPos = 0;
        if (typeof World !== 'undefined' && World.getFinishPos) {
          const fp = World.getFinishPos();
          if (mesh && fp) {
            // Teleport near the finish pad (a bit higher and slightly offset)
            mesh.position.set(fp.x, fp.y + 8, fp.z + 10);
            velocity.set(0, 0, 0);
          }
          showNotification('🚀 TO THE END!', '#ffffff');
        }
      }
    } else { endPos = 0; }

    // Check Animal Codes
    ANIMAL_CHEATS.forEach((cheat, index) => {
      if (e.code === cheat.code[animalCheatPos[index]]) {
        animalCheatPos[index]++;
        if (animalCheatPos[index] === cheat.code.length) {
          animalCheatPos[index] = 0;
          if (typeof Characters !== 'undefined') {
            Characters.select(cheat.id);
            if (_playerScene) {
              const oldPos = mesh ? mesh.position.clone() : new THREE.Vector3();
              const oldFacing = facing;
              init(_playerScene);
              if (mesh) {
                mesh.position.copy(oldPos);
                facing = oldFacing;
              }
            }
            showNotification(cheat.name + ' MODE!', cheat.color);
          }
        }
      } else {
        animalCheatPos[index] = 0;
      }
    });


    // Check " key (Quote)
    if (e.key === '"' || e.key === 'é' || e.code === 'Backquote' || e.code === 'Quote') {
      if (godMode) {
        if (!flyMode) {
          flyMode = true;
          showNotification('🚀 FLY MODE ON!', '#00ffff');
        } else {
          // Turn everything off
          godMode = false;
          flyMode = false;
          showNotification('😇 GOD & FLY OFF', '#ff6b6b');
        }
      }
    }
    // M key — animal sound
    if (e.code === 'KeyM') {
      playAnimalSound();
      return;
    }
  });

  // ─── Animal sounds — real audio files from /sounds/ ─────────────────────
  const SOUND_FILES = {
    cow:     'sounds/cow.mp3',
    sheep:   'sounds/sheep.mp3',
    rabbit:  'sounds/rabbit.mp3',
    pig:     'sounds/pig.mp3',
    dog:     'sounds/dog.mp3',
    giraffe: 'sounds/giraffe.mp3',
    death:   'sounds/death.mp3',
  };
  const SOUND_COLORS = {
    cow: '#f5d742', sheep: '#eeeeee', rabbit: '#f0e8d8',
    pig: '#ffaaaa', dog: '#e08030', giraffe: '#d4a04a',
  };

  // ─── Death sound ─────────────────────────────────────────────────────────
  function playDeathSound() {
    let audio = _audioCache['death'];
    if (!audio) {
      audio = new window.Audio('sounds/death.mp3');
      audio.volume = 0.9;
      _audioCache['death'] = audio;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Fallback: dramatic descending synth
      _tone(400, 80, 0.8, 'sawtooth', 0.4);
    });
  }

  // ─── Walking footstep sound (procedural) ────────────────────────────────
  let _stepTimer    = 0;
  let _stepInterval = 0.35;  // seconds between steps (normal walk)
  function _playFootstep(sprint) {
    const ctx = _getCtx();
    // Short dull thump — low sine + tiny noise burst
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(sprint ? 0.18 : 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.10);
    osc.start(); osc.stop(ctx.currentTime + 0.10);
  }

  // Cache + lock: prevent re-triggering while sound is still playing
  const _audioCache = {};
  let _soundPlaying = false;

  /**
   * unlockAudio() — MUST be called during a user gesture (button click).
   * Pre-loads all Audio elements and plays+pauses them instantly.
   * This tells Chrome "user approved audio" so future play() calls work.
   */
  function unlockAudio() {
    Object.keys(SOUND_FILES).forEach(id => {
      if (!_audioCache[id]) {
        const a = new window.Audio(SOUND_FILES[id]);
        a.volume = 0;
        _audioCache[id] = a;
      }
      // play then immediately pause — unlocks the element in Chrome
      _audioCache[id].play()
        .then(() => { _audioCache[id].pause(); _audioCache[id].currentTime = 0; _audioCache[id].volume = 0.85; })
        .catch(() => { _audioCache[id].volume = 0.85; });
    });
  }

  function playAnimalSound() {
    if (_soundPlaying) return;   // blocked until current sound ends

    const id = (typeof Characters !== 'undefined') ? Characters.getSelected().id : 'cow';
    const color = SOUND_COLORS[id] || '#ffffff';

    // Show i18n notification
    const notifKey = 'snd_' + id;
    const notifText = (typeof I18n !== 'undefined') ? I18n.t(notifKey) : id;
    showNotification(notifText, color);

    // Create & cache Audio element (only once per character)
    if (!_audioCache[id]) {
      const a = new window.Audio(SOUND_FILES[id]);
      a.volume = 0.85;
      _audioCache[id] = a;
    }
    const audio = _audioCache[id];
    audio.currentTime = 0;

    // Lock — released when sound finishes or errors
    _soundPlaying = true;
    audio.onended = () => { _soundPlaying = false; };
    audio.onerror = () => { _soundPlaying = false; };

    audio.play().catch(() => {
      _soundPlaying = false;
      _playProceduralFallback(id);  // fallback synth if file fails
    });
  }

  // Fallback synth (kept in case audio files can't be loaded)
  let _audioCtx = null;
  function _getCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }
  function _tone(freq, endFreq, dur, wave, vol) {
    const ctx = _getCtx();
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = wave || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }
  function _playProceduralFallback(id) {
    switch (id) {
      case 'cow':     _tone(180,140,0.9,'sawtooth',0.35); break;
      case 'sheep':   _tone(400,350,0.6,'sine',0.3);      break;
      case 'rabbit':  [0,80,160].forEach(d=>setTimeout(()=>_tone(900,1100,0.12,'sine',0.2),d)); break;
      case 'pig':     _tone(300,200,0.25,'sawtooth',0.4); break;
      case 'dog':     _tone(350,200,0.15,'sawtooth',0.5); break;
      case 'giraffe': _tone(55,50,1.5,'sine',0.25);       break;
    }
  }

  function showNotification(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);font-size:36px;font-weight:900;color:${color};text-shadow:0 0 30px ${color};z-index:1000;pointer-events:none;font-family:"Black Han Sans",sans-serif;letter-spacing:3px;`;
    msg.innerHTML = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

  function setGodMode(val) {
    godMode = val;
  }

  let bigImageOverlay = null;
  function toggleBigImage() {
    if (bigImageOverlay) {
      bigImageOverlay.remove();
      bigImageOverlay = null;
    } else {
      bigImageOverlay = document.createElement('div');
      bigImageOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(5px);';
      bigImageOverlay.innerHTML = `
        <div style="color: #FFD700; font-family: 'Black Han Sans', sans-serif; font-size: 80px; text-shadow: 0 0 20px #ff8800, 3px 3px 0px #3d1a00, -3px -3px 0px #3d1a00, 3px -3px 0px #3d1a00, -3px 3px 0px #3d1a00; margin-bottom: 20px; text-align: center; line-height: 1;">BIG MAC MUSTO</div>
        <img src="inek.png" style="max-height: 70vh; max-width: 90vw; filter: drop-shadow(0px 20px 40px rgba(0,0,0,0.9));" />
        <div style="color: white; font-family: sans-serif; margin-top: 20px; opacity: 0.7;">(Kapatmak icin ekrana tikla veya tekrar B-I-G yaz)</div>
      `;
      bigImageOverlay.onclick = () => { bigImageOverlay.remove(); bigImageOverlay = null; };
      document.body.appendChild(bigImageOverlay);
    }
  }

  function activateKonami() {
    isGiant = !isGiant;
    if (mesh) { const s = isGiant ? 3.5 : 1.0; mesh.scale.set(s, s, s); }
    // Flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,220,0,0.45);z-index:999;pointer-events:none;animation:deathFlash 0.6s forwards';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);
    // Notification
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:46px;font-weight:900;color:#FFD700;text-shadow:0 0 24px #ff8800;z-index:1000;pointer-events:none;animation:deathFlash 2s forwards;font-family:"Black Han Sans",sans-serif;letter-spacing:4px;';
    msg.textContent = isGiant ? '✨ GIANT MODE!' : '✨ NORMAL MODE!';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

  function activateRGB() {
    isMustafa = !isMustafa;
    if (!isMustafa && bodyMesh) {
      bodyMesh.material.color.setHex(0xf5f5f5);
    }
    // Notification
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);font-size:36px;font-weight:900;color:#FF44FF;text-shadow:0 0 30px #ff00ff,0 0 60px #ff00ff;z-index:1000;pointer-events:none;font-family:"Black Han Sans",sans-serif;letter-spacing:3px;';
    msg.innerHTML = isMustafa ? '\u2728 RAINBOW MODE ON! \u2728' : '\u2728 RAINBOW MODE OFF \u2728';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
  }

  // ─── Materials ─────────────────────────────────────────────────────────────
  const MAT_WHITE = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
  const MAT_BLACK = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const MAT_PINK  = new THREE.MeshLambertMaterial({ color: 0xffaabb });
  const MAT_HOOF  = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const MAT_GOLD  = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

  // ─── Build procedural cow ──────────────────────────────────────────────────
  function buildCow() {
    const root = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.5, 1.1);
    const body    = new THREE.Mesh(bodyGeo, MAT_WHITE);
    body.position.y = 0.28;  // 0.68 - 0.4 (center mesh at visual midpoint)
    body.castShadow = true;
    root.add(body);

    // Black spots
    function addSpot(x, y, z, rx, ry, rz, sx, sy, sz) {
      const g = new THREE.BoxGeometry(sx, sy, sz);
      const m = new THREE.Mesh(g, MAT_BLACK);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      body.add(m);
    }
    addSpot(-0.28, 0.1,  0.1,  0,0,0.3, 0.22, 0.18, 0.05);
    addSpot( 0.28, 0.05,-0.15, 0,0,0,   0.18, 0.22, 0.05);
    addSpot( 0.0,  0.15,-0.3,  0,0,0,   0.3,  0.14, 0.05);

    // Udder (Meme)
    const udderGroup = new THREE.Group();
    udderGroup.position.set(0, -0.22, -0.15);
    body.add(udderGroup);
    
    const udderGeo = new THREE.BoxGeometry(0.3, 0.1, 0.4);
    const udder = new THREE.Mesh(udderGeo, MAT_PINK);
    udderGroup.add(udder);

    // Teats
    for (let i = 0; i < 4; i++) {
      const tx = (i % 2 === 0) ? -0.08 : 0.08;
      const tz = (i < 2) ? 0.1 : -0.1;
      const teatGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 4);
      const teat = new THREE.Mesh(teatGeo, MAT_PINK);
      teat.position.set(tx, -0.05, tz);
      udderGroup.add(teat);
    }

    // Head group (for bobbing animation)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.33, 0.65);  // 0.73 - 0.4
    root.add(headGroup);

    const headGeo = new THREE.BoxGeometry(0.45, 0.38, 0.42);
    const head    = new THREE.Mesh(headGeo, MAT_WHITE);
    head.castShadow = true;
    headGroup.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.3, 0.22, 0.15);
    const snout    = new THREE.Mesh(snoutGeo, MAT_PINK);
    snout.position.set(0, -0.05, 0.24);
    headGroup.add(snout);

    // Nostrils
    function nostril(x) {
      const g = new THREE.BoxGeometry(0.05, 0.03, 0.03);
      const m = new THREE.Mesh(g, MAT_BLACK);
      m.position.set(x, -0.05, 0.31);
      headGroup.add(m);
    }
    nostril(-0.07); nostril(0.07);

    // Eyes
    function eye(x) {
      // Sclera (White part)
      const gWhite = new THREE.BoxGeometry(0.08, 0.08, 0.04);
      const mWhite = new THREE.Mesh(gWhite, MAT_WHITE);
      mWhite.position.set(x, 0.1, 0.21);
      
      // Pupil
      const gPupil = new THREE.BoxGeometry(0.04, 0.04, 0.02);
      const mPupil = new THREE.Mesh(gPupil, MAT_BLACK);
      mPupil.position.set(x > 0 ? -0.01 : 0.01, 0, 0.02); // Derp eyes slightly inward
      mWhite.add(mPupil);
      
      headGroup.add(mWhite);
    }
    eye(-0.17); eye(0.17);

    // Cow Bell
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, -0.18, 0.15);
    headGroup.add(bellGroup);

    const collarGeo = new THREE.BoxGeometry(0.36, 0.05, 0.2);
    const collar = new THREE.Mesh(collarGeo, MAT_BLACK);
    bellGroup.add(collar);

    const bellGeo = new THREE.BoxGeometry(0.12, 0.15, 0.12);
    const bell = new THREE.Mesh(bellGeo, MAT_GOLD);
    bell.position.y = -0.1;
    bellGroup.add(bell);

    // Ears
    function ear(x) {
      const g = new THREE.BoxGeometry(0.1, 0.14, 0.05);
      const m = new THREE.Mesh(g, MAT_PINK);
      m.position.set(x, 0.19, 0.0);
      m.rotation.z = x < 0 ? 0.3 : -0.3;
      headGroup.add(m);
    }
    ear(-0.25); ear(0.25);

    // Horns
    function horn(x) {
      const g = new THREE.ConeGeometry(0.035, 0.15, 4);
      const m = new THREE.Mesh(g, MAT_HOOF);
      m.position.set(x, 0.26, 0.0);
      m.rotation.z = x < 0 ? -0.25 : 0.25;
      headGroup.add(m);
    }
    horn(-0.2); horn(0.2);

    // Legs — stored for animation
    const legMeshes = [];
    const legPositions = [
      [-0.22, 0.0,  0.3 ], [ 0.22, 0.0,  0.3 ],
      [-0.22, 0.0, -0.3 ], [ 0.22, 0.0, -0.3 ]
    ];
    legPositions.forEach(([x, y, z]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, y + 0.28, z);  // 0.68-0.4
      root.add(legGroup);

      const legGeo = new THREE.BoxGeometry(0.14, 0.42, 0.14);
      const leg    = new THREE.Mesh(legGeo, MAT_WHITE);
      leg.position.y = -0.21;
      leg.castShadow = true;
      legGroup.add(leg);

      // Hoof
      const hoofGeo = new THREE.BoxGeometry(0.15, 0.1, 0.16);
      const hoof    = new THREE.Mesh(hoofGeo, MAT_HOOF);
      hoof.position.y = -0.42;
      legGroup.add(hoof);

      legMeshes.push(legGroup);
    });

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.28, 5);
    const tail    = new THREE.Mesh(tailGeo, MAT_WHITE);
    tail.position.set(0, 0.23, -0.55);   // 0.63-0.4
    tail.rotation.x = -0.7;
    root.add(tail);

    const tailTuftGeo = new THREE.SphereGeometry(0.07, 5, 5);
    const tailTuft    = new THREE.Mesh(tailTuftGeo, MAT_BLACK);
    tailTuft.position.set(0, 0.06, -0.7);  // 0.46-0.4
    root.add(tailTuft);

    root.traverse(m => { if (m.isMesh) m.castShadow = true; });

    return { root, headGroup, legMeshes, tail, body };
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  let mesh, headGroup, legMeshes, tailMesh;
  let headBaseY  = 0.33;
  let velocity   = new THREE.Vector3();
  let size = new THREE.Vector3(0.7, 0.38, 1.0);
  let grounded   = false;
  let currentGroundMat = null;
  let jumpCooldown = 0;
  let animTime   = 0;
  let facing     = 0;          // Y rotation the cow faces
  let lastCheckpoint = new THREE.Vector3(0, 2, 0);
  let lastSafePos    = new THREE.Vector3(0, 2, 0);
  let isGiant        = false;      // konami giant
  let safeMode       = false;      // safe mode (return to fall point)

  const SPEED        = 10;
  const SPRINT_MULT  = 1.65;
  const JUMP_FORCE   = 14;
  const DASH_FORCE   = 22;
  const FRICTION     = 0.82;

  // Character stat multipliers (set on init from Characters registry)
  let _charSpeedMult = 1.0;
  let _charJumpMult  = 1.0;

  let canDash      = true;
  let dashCooldown = 0;
  let isDashing    = false;
  let dashTimer    = 0;

  let _playerScene = null;  // scene ref stored on init

  function init(sc) {
    // ─── Remove old mesh from scene before building new character ───────────
    if (mesh && _playerScene) {
      _playerScene.remove(mesh);
      mesh.traverse(m => { if (m.geometry) m.geometry.dispose(); });
      mesh = null;
    }
    _playerScene = sc;

    // Use selected character from Characters registry
    const parts = (typeof Characters !== 'undefined')
      ? Characters.buildSelected()
      : buildCow();  // fallback

    mesh      = parts.root;
    headGroup = parts.headGroup;
    legMeshes = parts.legMeshes;
    tailMesh  = parts.tail;
    bodyMesh  = parts.bodyMesh || parts.body;

    if (headGroup) {
      headBaseY = headGroup.position.y;
    } else {
      headBaseY = 0.33;
    }

    // Apply character stats (speed / jump scale)
    if (typeof Characters !== 'undefined') {
      const ch = Characters.getSelected();
      const speedMult = 0.7 + (ch.stats.speed / 5) * 0.6;
      const jumpMult  = 0.7 + (ch.stats.jump  / 5) * 0.6;
      _charSpeedMult = speedMult;
      _charJumpMult  = jumpMult;
    }

    if (isGiant) mesh.scale.setScalar(3.5);

    mesh.position.copy(lastCheckpoint);
    lastSafePos.copy(lastCheckpoint);
    sc.add(mesh);

    flyMode = false;
    setGodMode(false);
  }

  function respawn() {
    if (safeMode && lastSafePos.y > -4) {
      // Return to last solid ground position
      mesh.position.copy(lastSafePos);
      // Move up slightly to avoid getting stuck in collision
      mesh.position.y += 0.5;
    } else {
      mesh.position.copy(lastCheckpoint);
      lastSafePos.copy(lastCheckpoint);
    }
    velocity.set(0, 0, 0);
    if (typeof Physics !== 'undefined' && Physics.setLastGroundY) {
      Physics.setLastGroundY(mesh.position.y);
    }
  }

  function setCheckpoint(pos) {
    lastCheckpoint.copy(pos);
    lastSafePos.copy(pos);
  }

  function setSafeMode(enabled) {
    safeMode = enabled;
  }

  function update(dt, cameraYaw) {
    jumpCooldown = Math.max(0, jumpCooldown - dt);
    animTime += dt;

    // ── Input direction ──────────────────────────────────────
    const moveDir = new THREE.Vector3();
    // Kamera arkada (playerZ-7'de), ileri = +Z yönü
    if (Controls.isDown('KeyW') || Controls.isDown('ArrowUp'))    moveDir.z += 1;
    if (Controls.isDown('KeyS') || Controls.isDown('ArrowDown'))  moveDir.z -= 1;
    if (Controls.isDown('KeyA') || Controls.isDown('ArrowLeft'))  moveDir.x += 1;
    if (Controls.isDown('KeyD') || Controls.isDown('ArrowRight')) moveDir.x -= 1;

    // ── Dash cooldown tick ────────────────────────────────────
    dashCooldown = Math.max(0, dashCooldown - dt);
    if (isDashing) {
      dashTimer -= dt;
      if (dashTimer <= 0) isDashing = false;
    }

    // ── Speed ───────────────────────────────────────
    const spd    = SPEED;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      // Rotate by camera yaw
      moveDir.applyEuler(new THREE.Euler(0, cameraYaw, 0));

      // Smooth acceleration (lerp toward target speed — no instant direction change)
      let accel = grounded ? 0.22 : 0.10; // less control in air
      if (grounded && currentGroundMat === 'ice') accel = 0.02; // Very slippery acceleration

      velocity.x = Utils.lerp(velocity.x, moveDir.x * spd, accel);
      velocity.z = Utils.lerp(velocity.z, moveDir.z * spd, accel);

      // Face movement direction (smooth, dt-based)
      const targetFacing = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetFacing - facing;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      facing += diff * Math.min(dt * 8, 1); // smooth, frame-rate independent
    } else {
      // Friction — smooth deceleration
      const frictionBase = (grounded && currentGroundMat === 'ice') ? 0.98 : FRICTION;
      velocity.x *= Math.pow(frictionBase, dt * 60);
      velocity.z *= Math.pow(frictionBase, dt * 60);
    }

    // ── Jump (With Double Jump) ──────────────────────────────
    if (Controls.isDown('Space') && jumpCooldown <= 0) {
      if (flyMode) {
        velocity.y = 12; // slow fly up
      } else if (grounded) {
        velocity.y   = JUMP_FORCE;
        grounded     = false;
        jumpCooldown = 0.25;
        jumpsLeft    = 1; // Used the first jump
        Audio.play('jump');
      } else if (jumpsLeft > 0) {
        velocity.y   = JUMP_FORCE;
        jumpsLeft--;
        jumpCooldown = 0.25;
        Audio.play('jump');
      }
    }

    // ── Fly Down (Shift in Fly Mode) ──────────────────────────
    if (flyMode && (Controls.isDown('ShiftLeft') || Controls.isDown('ShiftRight'))) {
      velocity.y = -12;
    } else if (flyMode && !Controls.isDown('Space')) {
      // dampen vertical velocity in fly mode
      velocity.y *= 0.9;
    }

    // ── Dash (Shift) ───────────────────────────────────
    const shiftPressed = Controls.isDown('ShiftLeft') || Controls.isDown('ShiftRight');
    if (shiftPressed && canDash && dashCooldown <= 0) {
      canDash      = false;
      dashCooldown = 0.8;
      isDashing    = true;
      dashTimer    = 0.18;

      // Dash in the direction the cow is currently facing (or forward if idle)
      const dashDir = new THREE.Vector3(
        Math.sin(facing),
        0,
        Math.cos(facing)
      ).normalize();

      velocity.x = dashDir.x * DASH_FORCE;
      velocity.z = dashDir.z * DASH_FORCE;
      // Small upward boost so it feels like a leap
      if (velocity.y <= 0 || grounded) {
        velocity.y = 5;
        grounded = false;
      }

      Audio.play('dash');
    }

    // ── Multiplayer Player Collision (Pushing) ────────────────────────
    if (typeof Multiplayer !== 'undefined' && Multiplayer.getOtherPlayers) {
      const others = Multiplayer.getOtherPlayers();
      for (const p of others) {
        if (!p.mesh) continue;
        const pPos = p.mesh.position;
        const dx = mesh.position.x - pPos.x;
        const dz = mesh.position.z - pPos.z;
        const distSq = dx * dx + dz * dz;
        const minDist = 0.85; // Size threshold for touching
        
        if (distSq < minDist * minDist && Math.abs(mesh.position.y - pPos.y) < 1.2) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          // Push the player away from the other player
          velocity.x += (dx / dist) * overlap * 25;
          velocity.z += (dz / dist) * overlap * 25;
        }
      }
    }

    // ── Physics resolve ───────────────────────────────────────
    const result = Physics.resolve({ mesh, velocity, size, flyMode }, dt);
    const wasGrounded = grounded;
    grounded = result.grounded;
    currentGroundMat = result.groundMat;

    // Track safe position while on ground
    // Only update if we are on a stable, non-moving biome platform, plank, house, or finish
    const safeMats = ['nature', 'stone', 'metal', 'ice', 'cloud', 'plank', 'house', 'finish'];
    if (grounded && !isDashing && safeMats.includes(currentGroundMat)) {
      lastSafePos.copy(mesh.position);
    }

    // Reset jump/dash when landing
    if (!wasGrounded && grounded) {
      canDash   = true;
      jumpsLeft = 2; // reset double jump
      isDashing = false;
      
      // Bounce pad logic
      if (currentGroundMat === 'bounce') {
        velocity.y = 28;
        grounded = false;
        canDash = true; // extra dash
        Audio.play('jump'); // Maybe need a bounce sound, jump is fine for now
      }
    }

    // Die if touching kill plane OR falling 10m below last safe position (redundant fallback)
    const isFallingTooFar = mesh.position.y < (lastSafePos.y - 15);
    if ((result.onKill || isFallingTooFar) && !godMode) {
      playDeathSound();
      Audio.play('fall');
      canDash = true;
      isDashing = false;
      respawn();
    }

    // ── Mesh rotation (smooth, no snap) ─────────────────────────────────────
    mesh.rotation.y = facing; // already smoothed above

    // ── Walking footstep sound ───────────────────────────────────────────────
    const isMoving = moveDir.lengthSq() > 0;
    if (grounded && isMoving) {
      _stepInterval = 0.35;
      _stepTimer -= dt;
      if (_stepTimer <= 0) {
        _playFootstep(false);
        _stepTimer = _stepInterval;
      }
    } else {
      _stepTimer = 0;  // reset so next step fires immediately when movement starts
    }

    // ── Animations ────────────────────────────────────────────
    animate(moveDir, dt);
  }

  function animate(moveDir, dt) {
    const moving = moveDir.lengthSq() > 0.01;

    // Leg swing
    const legSpeed = moving ? 9 : 0;
    legMeshes.forEach((leg, i) => {
      const phase = (i % 2 === 0) ? 0 : Math.PI;
      leg.rotation.x = Math.sin(animTime * legSpeed + phase) * 0.5;
    });

    // Head bob (walk)
    const bobAmt = moving ? 0.03 : 0.01;
    if (headGroup) {
      headGroup.position.y = headBaseY + Math.sin(animTime * (moving ? 10 : 2)) * bobAmt;
    }

    // Jump squash/stretch / dash stretch
    const baseScale = isGiant ? 3.5 : 1.0;
    if (isDashing) {
      // Stretch forward during dash
      mesh.scale.z = baseScale * 1.5;
      mesh.scale.x = baseScale * 0.7;
      mesh.scale.y = baseScale * 0.7;
    } else if (!grounded) {
      mesh.scale.y = baseScale * 1.15;
      mesh.scale.x = baseScale * 0.88;
      mesh.scale.z = baseScale * 0.88;
    } else {
      mesh.scale.y = Utils.lerp(mesh.scale.y, baseScale, 0.2);
      mesh.scale.x = Utils.lerp(mesh.scale.x, baseScale, 0.2);
      mesh.scale.z = Utils.lerp(mesh.scale.z, baseScale, 0.2);
    }

    // Rainbow body color cycle (RGB cheat code)
    if (isMustafa) {
      rainbowT += dt * 2;
      const r = Math.sin(rainbowT) * 0.5 + 0.5;
      const g = Math.sin(rainbowT + 2.09) * 0.5 + 0.5;
      const b = Math.sin(rainbowT + 4.18) * 0.5 + 0.5;
      if (bodyMesh) bodyMesh.material.color.setRGB(r, g, b);
    }

    // Tail wag
    if (tailMesh) tailMesh.rotation.z = Math.sin(animTime * 3) * 0.25;
  }


  function getPosition() { return mesh ? mesh.position : new THREE.Vector3(); }

  // Build a standalone display cow (used in menu scene)
  function createDisplayCow() {
    return buildCow().root;
  }

  function getVelocity() { return velocity; }

  return {
    init, update, respawn, setCheckpoint, getPosition, setGodMode,
    setSafeMode, getVelocity,
    unlockAudio,
    playAnimalSound,
    createDisplayCow,
    get velocity() { return velocity; },
    get facing()    { return facing; },
    get grounded()  { return grounded; },
    get mesh()      { return mesh; },
    get isGiant()   { return isGiant; },
    get isMustafa() { return isMustafa; },
    get flyMode()   { return flyMode; },
    get godMode()   { return godMode; }
  };
})();
