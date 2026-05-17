const Game = (() => {
  // ─── State ────────────────────────────────────────────────────────────────
  const STATE = { MENU: 0, PLAYING: 1, DEAD: 2, WIN: 3, PAUSED: 4 };
  let state = STATE.MENU;
  let scene, renderer;
  let lastTime = 0;
  let score = 0;
  let timer = 0;
  let checkpointCount = 0;
  let currentLevel = 0;
  let levelComplete = false;
  let menuCameraAngle = 0.5;
  
  // ─── Showcase vars ────────────────────────────────────────────────────────
  let showcaseScene, showcaseCamera, showcaseRenderer, showcaseMesh;
  let showcaseActive = false; // true when char selection screen is open

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const $mainMenu = document.getElementById('main-menu');
  const $hud = document.getElementById('hud');
  const $death = document.getElementById('death-screen');
  const $win = document.getElementById('win-screen');
  const $pause = document.getElementById('pause-screen');
  const $score = document.getElementById('score-val');
  const $timer = document.getElementById('timer-val');
  const $winStats = document.getElementById('win-stats');
  const $canvas = document.getElementById('game-canvas');

  // ─── Score storage ────────────────────────────────────────────────────────
  const STORAGE_KEY = 'animalsParkour_scores';
  const playerName = 'PLAYER';

  function loadScores() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveScore(name, altitude, time) {
    const scores = loadScores();
    scores.push({ name: name.toUpperCase(), altitude, time });
    scores.sort((a, b) => b.altitude - a.altitude || a.time - b.time);
    const top = scores.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    return top;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    renderer = new THREE.WebGLRenderer({ canvas: $canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    scene = new THREE.Scene();
    CameraSystem.init(scene);
    Controls.disable();

    World.buildMenuScene(scene);

    // ── Dedicated Showcase Canvas ──
    const $showcaseCanvas = document.getElementById('char-showcase-canvas');
    if ($showcaseCanvas) {
      showcaseRenderer = new THREE.WebGLRenderer({ canvas: $showcaseCanvas, alpha: true, antialias: true });
      showcaseRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      showcaseRenderer.shadowMap.enabled = true;
      showcaseRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

      showcaseScene = new THREE.Scene();

      // Rich lighting setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      showcaseScene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(3, 6, 5);
      keyLight.castShadow = true;
      showcaseScene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xfff5e0, 0.5);
      fillLight.position.set(-4, 3, -2);
      showcaseScene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x00ccff, 0.4);
      rimLight.position.set(0, 2, -6);
      showcaseScene.add(rimLight);

      showcaseRenderer.setClearColor(0x070b14, 1);

      showcaseCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      showcaseCamera.position.set(0, 0.6, 2.4);
      showcaseCamera.lookAt(0, 0.45, 0);

      function resizeShowcase() {
        const vp = document.getElementById('cs-viewport');
        if (!vp || !showcaseRenderer) return;
        const w = vp.clientWidth;
        const h = vp.clientHeight;
        if (w > 0 && h > 0) {
          showcaseRenderer.setSize(w, h);
          showcaseCamera.aspect = w / h;
          showcaseCamera.updateProjectionMatrix();
        }
      }

      window.addEventListener('resize', resizeShowcase);
      // Delay initial resize until layout is ready
      setTimeout(resizeShowcase, 100);
    }

    // ── Character particle canvas ──
    (function initCharParticles() {
      const pc = document.getElementById('char-particles-canvas');
      if (!pc) return;
      const ctx = pc.getContext('2d');
      const particles = [];
      function resize() { pc.width = window.innerWidth; pc.height = window.innerHeight; }
      window.addEventListener('resize', resize);
      resize();
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.5 + 0.4,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(Math.random() * 0.4 + 0.1),
          a: Math.random()
        });
      }
      function animParticles() {
        if (document.getElementById('menu-nav-chars').classList.contains('hidden')) {
          requestAnimationFrame(animParticles); return;
        }
        ctx.clearRect(0, 0, pc.width, pc.height);
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.a -= 0.003;
          if (p.a <= 0 || p.y < -10) {
            p.x = Math.random() * pc.width;
            p.y = pc.height + 5;
            p.a = Math.random() * 0.6 + 0.2;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,240,255,${p.a})`;
          ctx.fill();
        }
        requestAnimationFrame(animParticles);
      }
      animParticles();
    })();

    // ── Menu button wiring ────────────────────────────────────────────────
    const navMain = document.getElementById('menu-nav-main');
    const navChars = document.getElementById('menu-nav-chars');
    const navSettings = document.getElementById('menu-nav-settings');
    const navInfo = document.getElementById('menu-nav-info');
    const navMap = document.getElementById('menu-nav-map');
    const allNavs = [navMain, navChars, navSettings, navInfo, navMap];

    let currentMenuNav = 'main';
    let showcaseIndex = 0;
    let actualSelectedId = localStorage.getItem('ap_char') || 'cow';
    if (typeof Characters !== 'undefined') Characters.select(actualSelectedId);

    function showNav(el) {
      allNavs.forEach(n => { if (n) n.classList.add('hidden'); });
      if (el) {
        el.classList.remove('hidden');
        currentMenuNav = el.id;
        
        if (currentMenuNav === 'menu-nav-main') {
          document.getElementById('main-menu-logo').classList.remove('hidden');
        } else {
          document.getElementById('main-menu-logo').classList.add('hidden');
        }

        if (currentMenuNav === 'menu-nav-chars') {
          // Enter showcase mode
          actualSelectedId = Characters.getSelected().id;
          const chars = Characters.getAll();
          showcaseIndex = chars.findIndex(c => c.id === actualSelectedId);
          if (showcaseIndex < 0) showcaseIndex = 0;

          // Resize AFTER the element is painted in DOM, then update UI
          setTimeout(() => {
            const vp = document.getElementById('cs-viewport');
            if (vp && showcaseRenderer) {
              const w = vp.clientWidth || 400;
              const h = vp.clientHeight || 450;
              showcaseRenderer.setSize(w, h);
              if (showcaseCamera) { showcaseCamera.aspect = w / h; showcaseCamera.updateProjectionMatrix(); }
            }
            updateCharShowcaseUI();
          }, 50);

          showcaseActive = true;
          // Keep game canvas dark+blurred as atmospheric background
          const canvas = document.getElementById('game-canvas');
          if (canvas) { canvas.classList.add('menu-blurred'); canvas.style.display = 'none'; }
        } else {
          showcaseActive = false;
          const canvas = document.getElementById('game-canvas');
          if (canvas) { canvas.classList.add('menu-blurred'); canvas.style.display = ''; }
        }
      }
    }

    // Apply i18n immediately on load, then set dropdown to saved language
    I18n.apply();
    const $langSel = document.getElementById('setting-lang');
    if ($langSel) {
      $langSel.value = I18n.getLang();
      $langSel.addEventListener('change', () => {
        I18n.setLang($langSel.value);
        if ($pLangSel) $pLangSel.value = $langSel.value;
        if (!navChars.classList.contains('hidden')) updateCharShowcaseUI();
      });
    }

    // ── Settings sync ────────────────────────────────────────────────────────
    const $musicCheck = document.getElementById('setting-music');
    const $musicVol = document.getElementById('setting-vol');
    const $sfxCheck = document.getElementById('setting-sfx');
    const $sensSlider = document.getElementById('setting-sens');
    const $pMusicCheck = document.getElementById('pause-setting-music');
    const $pMusicVol = document.getElementById('pause-setting-vol');
    const $pSfxCheck = document.getElementById('pause-setting-sfx');
    const $safeCheck = document.getElementById('setting-safe');
    const $pSafeCheck = document.getElementById('pause-setting-safe');
    const $pSensSlider = document.getElementById('pause-setting-sens');
    const $pLangSel = document.getElementById('pause-setting-lang');

    function syncMusicSettings() {
      const isEnabled = $musicCheck.checked;
      const vol = parseInt($musicVol.value) / 100;
      if ($pMusicCheck) $pMusicCheck.checked = isEnabled;
      if ($pMusicVol) $pMusicVol.value = $musicVol.value;
      
      localStorage.setItem('ap_music', isEnabled);
      localStorage.setItem('ap_music_vol', $musicVol.value);
      
      if (typeof Audio !== 'undefined' && Audio.setMusicEnabled) {
        Audio.setMusicEnabled(isEnabled);
        Audio.setMusicVolume(vol);
      }
    }

    function syncSfxSettings() {
      const isEnabled = $sfxCheck.checked;
      if ($pSfxCheck) $pSfxCheck.checked = isEnabled;
      localStorage.setItem('ap_sfx', isEnabled);
      if (typeof Audio !== 'undefined' && Audio.setSfxEnabled) {
        Audio.setSfxEnabled(isEnabled);
      }
    }

    function syncSafeSettings() {
      const isEnabled = $safeCheck.checked;
      if ($pSafeCheck) $pSafeCheck.checked = isEnabled;
      localStorage.setItem('ap_safe', isEnabled);
      if (typeof Player !== 'undefined' && Player.setSafeMode) {
        Player.setSafeMode(isEnabled);
      }
    }

    if ($sensSlider) {
      const savedSens = localStorage.getItem('ap_sens') || '100';
      $sensSlider.value = savedSens;
      if ($pSensSlider) $pSensSlider.value = savedSens;
      syncSensSettings();
    }

    if ($musicVol) {
      const savedMusic = localStorage.getItem('ap_music');
      if (savedMusic !== null) {
        $musicCheck.checked = savedMusic === 'true';
        if ($pMusicCheck) $pMusicCheck.checked = $musicCheck.checked;
      }
      const savedVol = localStorage.getItem('ap_music_vol');
      if (savedVol !== null) {
        $musicVol.value = savedVol;
        if ($pMusicVol) $pMusicVol.value = savedVol;
      }
      syncMusicSettings(); // Initial audio setup
    }

    if ($sfxCheck) {
      const savedSfx = localStorage.getItem('ap_sfx');
      if (savedSfx !== null) {
        $sfxCheck.checked = savedSfx === 'true';
        if ($pSfxCheck) $pSfxCheck.checked = $sfxCheck.checked;
      }
      syncSfxSettings();
      
      $sfxCheck.onchange = () => { if ($pSfxCheck) $pSfxCheck.checked = $sfxCheck.checked; syncSfxSettings(); };
      if ($pSfxCheck) $pSfxCheck.onchange = () => { if ($sfxCheck) $sfxCheck.checked = $pSfxCheck.checked; syncSfxSettings(); };
    }

    if ($safeCheck) {
      const savedSafe = localStorage.getItem('ap_safe') === 'true';
      $safeCheck.checked = savedSafe;
      syncSafeSettings();
      $safeCheck.onchange = syncSafeSettings;
      if ($pSafeCheck) $pSafeCheck.onchange = () => { $safeCheck.checked = $pSafeCheck.checked; syncSafeSettings(); };
    }

    function syncSensSettings() {
      const val = parseInt($sensSlider.value);
      if ($pSensSlider) $pSensSlider.value = val;
      localStorage.setItem('ap_sens', val);
      if (typeof Controls !== 'undefined' && Controls.setSensitivity) {
        Controls.setSensitivity(val / 100);
      }
    }

    if ($musicCheck) $musicCheck.onchange = () => { if ($pMusicCheck) $pMusicCheck.checked = $musicCheck.checked; syncMusicSettings(); };
    if ($pMusicCheck) $pMusicCheck.onchange = () => { if ($musicCheck) $musicCheck.checked = $pMusicCheck.checked; syncMusicSettings(); };
    if ($musicVol) $musicVol.oninput = () => { if ($pMusicVol) $pMusicVol.value = $musicVol.value; syncMusicSettings(); };
    if ($pMusicVol) $pMusicVol.oninput = () => { if ($musicVol) $musicVol.value = $pMusicVol.value; syncMusicSettings(); };
    if ($sensSlider) $sensSlider.oninput = () => { if ($pSensSlider) $pSensSlider.value = $sensSlider.value; syncSensSettings(); };
    if ($pSensSlider) $pSensSlider.oninput = () => { if ($sensSlider) $sensSlider.value = $pSensSlider.value; syncSensSettings(); };

    if ($pLangSel) {
      $pLangSel.value = I18n.getLang();
      $pLangSel.addEventListener('change', () => {
        if ($langSel) $langSel.value = $pLangSel.value;
        I18n.setLang($pLangSel.value);
      });
    }


    document.getElementById('menu-play-btn').onclick = () => showNav(navMap);
    document.getElementById('menu-map-back').onclick = () => showNav(navMain);

    const selectAndStartMap = (mapName) => {
      window.GameMap = mapName;
      if (typeof Player !== 'undefined' && Player.unlockAudio) Player.unlockAudio();
      startGame(Math.floor(Math.random() * 100000));
    };

    document.getElementById('btn-map-classic').onclick = () => selectAndStartMap('classic');
    document.getElementById('btn-map-winter').onclick  = () => selectAndStartMap('winter');
    document.getElementById('btn-map-hell').onclick    = () => selectAndStartMap('hell');
    document.getElementById('btn-map-moon').onclick    = () => selectAndStartMap('moon');
    document.getElementById('menu-chars-btn').onclick = () => showNav(navChars);
    document.getElementById('menu-settings-btn').onclick = () => showNav(navSettings);
    document.getElementById('menu-info-btn').onclick = () => showNav(navInfo);

    document.getElementById('menu-chars-back').onclick = () => {
      showNav(navMain);
    };
    document.getElementById('menu-settings-back').onclick = () => showNav(navMain);
    document.getElementById('menu-info-back').onclick = () => showNav(navMain);

    // ── 3D Character Showcase ──────────────────────────────────────────────
    function buildThumbStrip() {
      const strip = document.getElementById('cs-thumb-strip');
      if (!strip) return;
      const chars = Characters.getAll();
      strip.innerHTML = '';
      chars.forEach((ch, i) => {
        const btn = document.createElement('button');
        btn.className = 'cs-thumb' + (i === showcaseIndex ? ' active' : '');
        btn.title = ch.name;
        btn.textContent = ch.emoji;
        btn.addEventListener('click', () => {
          showcaseIndex = i;
          updateCharShowcaseUI();
        });
        strip.appendChild(btn);
      });
    }

    function updateCharShowcaseUI() {
      const chars = Characters.getAll();
      const ch = chars[showcaseIndex];
      const isSelected = actualSelectedId === ch.id;

      // Resize showcase to viewport before rendering
      const vp = document.getElementById('cs-viewport');
      if (vp && showcaseRenderer) {
        const w = vp.clientWidth || 400;
        const h = vp.clientHeight || 450;
        showcaseRenderer.setSize(w, h);
        if (showcaseCamera) { showcaseCamera.aspect = w / h; showcaseCamera.updateProjectionMatrix(); }
      }

      // Update 3D mesh
      if (showcaseScene && typeof Characters !== 'undefined') {
        if (showcaseMesh) showcaseScene.remove(showcaseMesh);
        const built = Characters.buildCharacter(ch.id);
        showcaseMesh = built.root;

        // Auto-scale model so it fits the camera viewport perfectly
        const box = new THREE.Box3().setFromObject(showcaseMesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        // Normalize size: a standard character fits well at size 1.3
        const scale = 1.3 / maxDim;
        showcaseMesh.scale.set(scale, scale, scale);

        // Center model properly: shift down so character stands at world origin
        const scaledBox = new THREE.Box3().setFromObject(showcaseMesh);
        showcaseMesh.position.set(0, -scaledBox.min.y, 0);
        showcaseScene.add(showcaseMesh);

        // Dynamically adjust camera lookAt to the center of the character's new bounding box
        const newBox = new THREE.Box3().setFromObject(showcaseMesh);
        const centerY = (newBox.min.y + newBox.max.y) / 2;
        if (showcaseCamera) {
           showcaseCamera.position.y = centerY + 0.15;
           showcaseCamera.lookAt(0, centerY, 0);
        }
      }

      // Animate name re-entry
      const nameEl = document.getElementById('char-showcase-name');
      if (nameEl) {
        nameEl.style.animation = 'none';
        void nameEl.offsetWidth;
        nameEl.style.animation = '';
        nameEl.textContent = ch.emoji + ' ' + (I18n.t(ch.id + '_name') || ch.name);
      }

      // Description
      const descEl = document.getElementById('char-showcase-desc');
      if (descEl) descEl.textContent = ch.desc;

      // Stat bars (cs-* style)
      const statsEl = document.getElementById('char-showcase-stats');
      if (statsEl) {
        const labels = [
          { key: 'stat_speed', val: ch.stats.speed },
          { key: 'stat_jump',  val: ch.stats.jump  },
          { key: 'stat_weight', val: ch.stats.weight }
        ];
        statsEl.innerHTML = labels.map(s => `
          <div class="cs-stat-block">
            <div class="cs-stat-label">${I18n.t(s.key) || s.key}</div>
            <div class="cs-stat-pips">${[1,2,3,4,5].map(i =>
              `<div class="cs-pip${i <= s.val ? ' on' : ''}"></div>`).join('')}</div>
          </div>
        `).join('');
      }

      // Select button
      const selBtn = document.getElementById('char-select-btn');
      if (selBtn) {
        if (isSelected) {
          selBtn.textContent = '✔ ' + (I18n.t('selected') || 'SEÇİLİ');
          selBtn.classList.add('selected');
          selBtn.disabled = false;
        } else {
          selBtn.textContent = I18n.t('select') || 'SEÇ';
          selBtn.classList.remove('selected');
          selBtn.disabled = false;
        }
      }

      // Thumbnail strip active state
      buildThumbStrip();
    }

    document.getElementById('char-prev').onclick = () => {
      const chars = Characters.getAll();
      showcaseIndex = (showcaseIndex - 1 + chars.length) % chars.length;
      updateCharShowcaseUI();
    };

    document.getElementById('char-next').onclick = () => {
      const chars = Characters.getAll();
      showcaseIndex = (showcaseIndex + 1) % chars.length;
      updateCharShowcaseUI();
    };

    document.getElementById('char-select-btn').onclick = () => {
      const chars = Characters.getAll();
      const ch = chars[showcaseIndex];
      // Finalize selection
      actualSelectedId = ch.id;
      Characters.select(ch.id);
      localStorage.setItem('ap_char', ch.id);
      
      // Re-trigger UI to show "SELECTED"
      updateCharShowcaseUI();
    };

    function statBar(val) {
      let bars = '';
      for (let i = 1; i <= 5; i++)
        bars += `<span class="stat-pip${i <= val ? ' pip-on' : ''}"></span>`;
      return `<div class="stat-pips">${bars}</div>`;
    }

    // ── Game button wiring ────────────────────────────────────────────────────
    document.getElementById('next-btn').onclick = nextLevel;
    document.getElementById('home-btn').onclick = goMenu;
    document.getElementById('resume-btn').onclick = resumeGame;
    document.getElementById('menu-btn').onclick = goMenu;

    // Pause menu settings navigation
    const $pauseMain = document.getElementById('pause-main');
    const $pauseSettings = document.getElementById('pause-settings');
    if (document.getElementById('pause-settings-btn')) {
      document.getElementById('pause-settings-btn').onclick = () => {
        $pauseMain.classList.add('hidden');
        $pauseSettings.classList.remove('hidden');
        $pauseSettings.style.display = 'flex';
      };
    }
    if (document.getElementById('pause-settings-back')) {
      document.getElementById('pause-settings-back').onclick = () => {
        $pauseSettings.classList.add('hidden');
        $pauseSettings.style.display = 'none';
        $pauseMain.classList.remove('hidden');
      };
    }

    // ── Pointer Lock ───────────────────────────────────────────────
    document.addEventListener('pointerlockchange', () => {
      // If pointer lock was lost unexpectedly while playing, pause the game
      if (!document.pointerLockElement && state === STATE.PLAYING) {
        setState(STATE.PAUSED);
      }
    });

    requestAnimationFrame(loop);
  }

  // ─── Game flow ────────────────────────────────────────────────────────────
  function startGame(mapSeed) {
    if (typeof Player !== 'undefined' && Player.unlockAudio) {
      Player.unlockAudio();
    }
    if (typeof Audio !== 'undefined' && Audio.startMusic) {
      Audio.startMusic();
    }
    // mapSeed bir sayi degilse (ornek: PLAY butonuna manuel tiklama eventi) rastgele tohum uret
    const finalSeed = (typeof mapSeed === 'number') ? mapSeed : Math.floor(Math.random() * 100000);
    currentLevel = finalSeed;
    fadeState(STATE.PLAYING);
    setTimeout(() => {
      loadLevel(currentLevel);
      const canvas = document.getElementById('game-canvas');
      if (canvas) canvas.classList.remove('menu-blurred');
    }, 250);
  }

  function loadLevel(idx) {
    World.clear();
    Physics.clear();
    Obstacles.clear(scene);

    score = 0; timer = 0; checkpointCount = 0; levelComplete = false;

    // Set spawn BEFORE init so the cow starts at the right spot
    Player.setCheckpoint(new THREE.Vector3(0, 4, 0));
    Player.init(scene);
    World.loadLevel(scene, idx);

    // Multiplayer sistemi henuz eklenmedi

    // Death threshold well below the starting island surface (~1.8)
    Physics.setDeathY(-5);

    updateHUD();
  }

  function nextLevel() {
    // Show "Coming Soon" overlay — next level not yet available
    const overlay = document.createElement('div');
    overlay.id = 'coming-soon-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:radial-gradient(ellipse at center, #0d1b2a 0%, #000 100%)',
      'animation:csIn 0.4s cubic-bezier(.22,1,.36,1)',
      'cursor:pointer'
    ].join(';');

    overlay.innerHTML = `
      <style>
        @keyframes csIn  { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-18px) } }
        @keyframes glow  { 0%,100% { text-shadow:0 0 40px #4fc3f7,0 0 80px #0288d1 }
                           50%     { text-shadow:0 0 60px #81d4fa,0 0 120px #29b6f6 } }
      </style>
      <div style="font-size:clamp(60px,12vw,110px);animation:float 2.5s ease-in-out infinite">🚀</div>
      <h1 style="
        font-family:'Black Han Sans',sans-serif;
        font-size:clamp(36px,8vw,80px);
        color:#fff;
        letter-spacing:6px;
        margin:16px 0 8px;
        animation:glow 2s ease-in-out infinite
      ">COMING SOON</h1>
      <p style="
        color:rgba(180,220,255,0.75);
        font-size:clamp(13px,2vw,20px);
        font-family:'Outfit',sans-serif;
        letter-spacing:2px;
        margin-bottom:36px
      ">The next level is being built... 🏗️</p>
      <button onclick="document.getElementById('coming-soon-overlay').remove()" style="
        background:rgba(255,255,255,0.1);
        border:2px solid rgba(255,255,255,0.25);
        border-radius:50px;
        color:#fff;
        font-family:'Outfit',sans-serif;
        font-size:16px;
        font-weight:700;
        letter-spacing:2px;
        padding:12px 36px;
        cursor:pointer;
        transition:all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.2)'"
         onmouseout="this.style.background='rgba(255,255,255,0.1)'">← BACK TO MENU</button>
    `;

    // Click anywhere on overlay to close (except the button)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    // Auto-dismiss after 8 seconds
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 8000);
  }


  function restartLevel() {
    fadeState(STATE.PLAYING);
    setTimeout(() => {
      loadLevel(currentLevel);
    }, 250);
  }

  function goMenu() {
    if (typeof Audio !== 'undefined' && Audio.stopMusic) {
      Audio.stopMusic();
    }
    fadeState(STATE.MENU);
    setTimeout(() => {
      World.buildMenuScene(scene);
      const canvas = document.getElementById('game-canvas');
      if (canvas) canvas.classList.add('menu-blurred');
    }, 250);
  }

  function resumeGame() {
    // Ensure pause main is visible and settings is hidden on resume
    const $pauseMain = document.getElementById('pause-main');
    const $pauseSettings = document.getElementById('pause-settings');
    if ($pauseMain && $pauseSettings) {
      $pauseSettings.classList.add('hidden');
      $pauseSettings.style.display = 'none';
      $pauseMain.classList.remove('hidden');
    }
    setState(STATE.PLAYING);
  }

  function togglePause() {
    if (state === STATE.PLAYING) setState(STATE.PAUSED);
    else if (state === STATE.PAUSED) setState(STATE.PLAYING);
  }

  // ─── Callbacks ────────────────────────────────────────────────────────────
  function onCheckpoint() {
    checkpointCount++;
    Audio.play('checkpoint');
    flashScreen('checkpoint');
  }

  function onLevelComplete() {
    if (levelComplete) return;
    levelComplete = true;
    const altitude = Math.max(0, Math.round(Player.getPosition().y));
    score = altitude;
    Audio.play('win');

    const updated = saveScore(playerName, altitude, timer);
    const rank = updated.findIndex(
      s => s.name === playerName.toUpperCase() && Math.abs(s.altitude - altitude) < 2
    ) + 1;
    $winStats.innerHTML =
      `${altitude}m &bull; ${timer.toFixed(1)}s &bull; ` +
      (rank === 1 ? '&#x1F947; NEW RECORD!' : 'Rank #' + rank);

    setState(STATE.WIN);
  }

  function fadeState(newState, delay = 250) {
    const $trans = document.getElementById('screen-transition');
    if (!$trans) return setState(newState);

    $trans.style.opacity = '1';
    setTimeout(() => {
      setState(newState);
      $trans.style.opacity = '0';
    }, delay);
  }

  // ─── State machine ────────────────────────────────────────────────────────
  function setState(newState) {
    state = newState;
    [$mainMenu, $hud, $death, $win, $pause].forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Blur/unblur canvas based on state
    if ($canvas) {
      if (newState === STATE.MENU) {
        $canvas.classList.add('menu-blurred');
      } else {
        $canvas.classList.remove('menu-blurred');
      }
    }

    // Reset menu nav when returning to menu
    if (newState === STATE.MENU) {
      const navMain = document.getElementById('menu-nav-main');
      const navSettings = document.getElementById('menu-nav-settings');
      const navInfo = document.getElementById('menu-nav-info');
      const navMap = document.getElementById('menu-nav-map');
      const navChars = document.getElementById('menu-nav-chars');
      if (navMain) navMain.classList.remove('hidden');
      if (navSettings) navSettings.classList.add('hidden');
      if (navInfo) navInfo.classList.add('hidden');
      if (navMap) navMap.classList.add('hidden');
      if (navChars) navChars.classList.add('hidden');
      
      showcaseActive = false;
      if ($canvas) { $canvas.style.display = ''; $canvas.classList.add('menu-blurred'); }

      const logo = document.getElementById('main-menu-logo');
      if (logo) logo.classList.remove('hidden');
    }

    const $mobileControls = document.getElementById('mobile-controls');
    if ($mobileControls) {
      if (newState === STATE.PLAYING) $mobileControls.classList.add('active');
      else $mobileControls.classList.remove('active');
    }
    const $globalBranding = document.getElementById('global-branding');
    if ($globalBranding) {
      if (newState === STATE.PLAYING) $globalBranding.classList.add('hidden');
      else $globalBranding.classList.remove('hidden');
    }

    switch (state) {
      case STATE.MENU:
        $mainMenu.classList.remove('hidden');
        Controls.disable();
        menuCameraAngle = 0.5;
        // Release pointer lock when going to menu
        if (document.pointerLockElement) document.exitPointerLock();
        break;
      case STATE.PLAYING:
        $hud.classList.remove('hidden');
        Controls.enable();
        // Lock pointer when entering play state
        if ($canvas && document.pointerLockElement !== $canvas && !document.body.classList.contains('is-touch')) {
          $canvas.requestPointerLock();
        }
        break;
      case STATE.DEAD:
        $death.classList.remove('hidden');
        flashScreen('death');
        setTimeout(() => {
          if (state === STATE.DEAD) setState(STATE.PLAYING);
        }, 1800);
        break;
      case STATE.WIN:
        $win.classList.remove('hidden');
        Controls.disable();
        // Fareyi serbest bırak ki menüdeki butonlara basılabilsin
        if (document.pointerLockElement) document.exitPointerLock();
        break;
      case STATE.PAUSED:
        $pause.classList.remove('hidden');
        // Release pointer lock when paused
        if (document.pointerLockElement) document.exitPointerLock();
        break;
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function updateHUD() {
    // BUG FIX: always append 'm' suffix
    $score.textContent = score + 'm';
    $timer.textContent = timer.toFixed(1) + 's';
  }

  function flashScreen(type) {
    const div = document.createElement('div');
    div.className = 'death-flash';
    div.style.background = type === 'checkpoint' ? '#00ff88' : '#ff2244';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
  }

  // ─── Main loop ────────────────────────────────────────────────────────────
  function loop(timestamp) {
    requestAnimationFrame(loop);

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    const cam = CameraSystem.getCamera();

    if (state === STATE.MENU) {
      // Orbit the world slowly
      menuCameraAngle += dt * 0.15;
      
      if (showcaseActive) {
        // Render isolated 3D character showcase UI
        if (showcaseMesh) showcaseMesh.rotation.y += dt * 1.2;
        if (showcaseRenderer && showcaseScene && showcaseCamera) {
           showcaseRenderer.render(showcaseScene, showcaseCamera);
        }
        // Still render the blurred background menu slowly rotating
        if (cam) {
          cam.position.set(Math.cos(menuCameraAngle) * 28, 16, Math.sin(menuCameraAngle) * 28);
          cam.lookAt(0, 4, 0);
          renderer.render(scene, cam);
        }
      } else {
        // Standard Menu Mode: Wide orbit around the island
        if (cam) {
          cam.position.set(Math.cos(menuCameraAngle) * 28, 16, Math.sin(menuCameraAngle) * 28);
          cam.lookAt(0, 4, 0);
          renderer.render(scene, cam);
        }
      }
    }

    if (state === STATE.PLAYING) {
      timer += dt;

      const cameraYaw = CameraSystem.getYaw();
      Player.update(dt, cameraYaw);
      Obstacles.update(dt);
      World.update(dt, Player.getPosition());
      CameraSystem.update(Player.getPosition(), dt);

      // BUG FIX: update score and HUD consistently
      const altitude = Math.max(0, Math.round(Player.getPosition().y));
      score = altitude;
      $score.textContent = altitude + 'm';
      $timer.textContent = timer.toFixed(1) + 's';

    }

    if (cam && state !== STATE.MENU) {
      renderer.render(scene, cam);
    }
  }

  return {
    init,
    togglePause,
    onCheckpoint,
    onLevelComplete,
    currentLevel: () => currentLevel,
    getState: () => state,
    getScene: () => scene,
    startGame
  };
})();

// ─── Bootstrap ────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  Game.init();

  // Apply blur immediately (menu state on load)
  const canvas = document.getElementById('game-canvas');
  if (canvas) canvas.classList.add('menu-blurred');
});
