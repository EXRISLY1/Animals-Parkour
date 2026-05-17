// ─── Graphics Module ──────────────────────────────────────────────────────────
// World preset configs & real-time atmosphere transitions per map type.
const Graphics = (() => {

  const PRESETS = {
    classic: {
      ambientColor: 0xd4e8f5, ambientIntensity: 0.72,
      sunColor: 0xfff0d0,     sunIntensity: 0.95,
      background: 0x5b9fcc,
      fogType: 'linear', fogColor: 0xb8d8ee, fogNear: 95, fogFar: 500,
      skyTop: 0x1a5f9a, skyBottom: 0x7ab2cc,
      // Altitude color zones (trop → strat → meso)
      skyTopColors:    [[0x1a,0x5f,0x9a], [0x0d,0x18,0x55], [0x02,0x02,0x05]],
      skyBottomColors: [[0x7a,0xb2,0xcc], [0x44,0x55,0x88], [0x08,0x04,0x0a]],
      fogColors:       [[0xb8,0xd8,0xee], [0x18,0x08,0x20], [0x00,0x00,0x00]],
    },
    winter: {
      ambientColor: 0xddeeff, ambientIntensity: 0.78,
      sunColor: 0xffffff,     sunIntensity: 0.72,
      background: 0x8ab4cc,
      fogType: 'linear', fogColor: 0xc8dde8, fogNear: 60, fogFar: 420,
      skyTop: 0x6699bb, skyBottom: 0xaaccdd,
      skyTopColors:    [[0x66,0x99,0xbb], [0x33,0x55,0x88], [0x08,0x08,0x10]],
      skyBottomColors: [[0xaa,0xcc,0xdd], [0x88,0x99,0xaa], [0x10,0x10,0x18]],
      fogColors:       [[0xdd,0xe8,0xff], [0xaa,0xbb,0xcc], [0x00,0x00,0x00]],
    },
    hell: {
      ambientColor: 0x441100, ambientIntensity: 0.55,
      sunColor: 0xff6600,     sunIntensity: 1.1,
      background: 0x1a0500,
      fogType: 'linear', fogColor: 0x220800, fogNear: 40, fogFar: 320,
      skyTop: 0x1a0300, skyBottom: 0x661100,
      skyTopColors:    [[0xaa,0x11,0x00], [0x33,0x00,0x00], [0x05,0x00,0x00]],
      skyBottomColors: [[0xff,0x55,0x00], [0xaa,0x11,0x00], [0x08,0x00,0x00]],
      fogColors:       [[0xff,0x55,0x00], [0x55,0x11,0x00], [0x00,0x00,0x00]],
    },
    heaven: {
      ambientColor: 0x8866cc, ambientIntensity: 0.65,
      sunColor: 0xaa88ff,     sunIntensity: 0.9,
      background: 0x0a0020,
      fogType: 'linear', fogColor: 0x110033, fogNear: 80, fogFar: 500,
      skyTop: 0x050015, skyBottom: 0x330055,
      skyTopColors:    [[0x00,0x88,0xff], [0x44,0xaa,0xff], [0x05,0x00,0x15]],
      skyBottomColors: [[0xff,0xff,0xff], [0xee,0xff,0xff], [0x33,0x00,0x55]],
      fogColors:       [[0xff,0xff,0xff], [0xff,0xff,0xff], [0x00,0x00,0x00]],
    },
    moon: {
      ambientColor: 0x554488, ambientIntensity: 0.7,
      sunColor: 0xffaadd,     sunIntensity: 1.1,
      background: 0x110522,
      fogType: 'linear', fogColor: 0x221144, fogNear: 70, fogFar: 400,
      skyTop: 0x050015, skyBottom: 0x220544,
      skyTopColors:    [[0x05,0x00,0x15], [0x05,0x00,0x10], [0x00,0x00,0x05]],
      skyBottomColors: [[0x33,0x05,0x55], [0x1a,0x02,0x2a], [0x05,0x00,0x0a]],
      fogColors:       [[0x33,0x11,0x55], [0x15,0x05,0x22], [0x00,0x00,0x00]],
    },
  };

  let _current = PRESETS.classic;
  let _currentMap = 'classic';

  // Altitude zone boundaries (metres)
  const TROP_END  = 60;
  const STRAT_END = 140;
  const MESO_END  = 220;

  function setWorldPreset(map) {
    _current    = PRESETS[map] || PRESETS.classic;
    _currentMap = map;
  }

  function getWorldPreset() { return _current; }

  // Lerp between two hex byte triplets by t
  function _lerpHex(tripA, tripB, t) {
    return [
      Utils.lerp(tripA[0], tripB[0], t) / 255,
      Utils.lerp(tripA[1], tripB[1], t) / 255,
      Utils.lerp(tripA[2], tripB[2], t) / 255,
    ];
  }

  // ─── Altitude-based atmosphere transitions ─────────────────────────────────
  function updateAtmosphere(altitude) {
    const trop  = Utils.clamp((altitude - 0)         / TROP_END,              0, 1);
    const strat = Utils.clamp((altitude - TROP_END)  / (STRAT_END - TROP_END), 0, 1);
    const meso  = Utils.clamp((altitude - STRAT_END) / (MESO_END  - STRAT_END), 0, 1);

    _current._trop  = trop;
    _current._strat = strat;
    _current._meso  = meso;
    _current._gravScale = 1.0 - meso * 0.35 - strat * 0.15;

    // Apply gravity scale
    if (Physics && Physics.setGravityScale) {
      Physics.setGravityScale(_current._gravScale);
    }
  }

  // ─── Update sky uniforms ───────────────────────────────────────────────────
  function updateSkyUniforms(skyUniforms, starMesh) {
    if (!_current) return;
    const strat = _current._strat || 0;
    const meso  = _current._meso  || 0;
    const trop  = _current._trop  || 0;

    const p = _current;
    if (!p.skyTopColors) return;

    // Sky top: trop zone → strat zone → meso zone
    const topA = _lerpHex(p.skyTopColors[0], p.skyTopColors[1], strat);
    const topB = _lerpHex(p.skyTopColors[1], p.skyTopColors[2], meso);
    const topFinal = [
      Utils.lerp(topA[0], topB[0], meso),
      Utils.lerp(topA[1], topB[1], meso),
      Utils.lerp(topA[2], topB[2], meso),
    ];

    const botA = _lerpHex(p.skyBottomColors[0], p.skyBottomColors[1], trop);
    const botB = _lerpHex(p.skyBottomColors[1], p.skyBottomColors[2], strat + meso * 0.5);
    const botFinal = [
      Utils.lerp(botA[0], botB[0], strat),
      Utils.lerp(botA[1], botB[1], strat),
      Utils.lerp(botA[2], botB[2], strat),
    ];

    if (skyUniforms) {
      skyUniforms.topColor.value.setRGB(...topFinal);
      skyUniforms.bottomColor.value.setRGB(
        Utils.clamp(botFinal[0], 0, 1),
        Utils.clamp(botFinal[1], 0, 1),
        Utils.clamp(botFinal[2], 0, 1)
      );
    }

    // Stars appear above troposphere, full in space
    if (starMesh) {
      const baseOpacity = _currentMap === 'moon'   ? 1.0
                        : _currentMap === 'heaven' ? 0.8 : 0;
      starMesh.material.opacity = Math.max(
        baseOpacity,
        Utils.clamp(((_current._trop || 0) * 60 - 60 + 60) / (MESO_END - TROP_END), 0, 1)
      );
      // Simpler: fade in from trop end
      starMesh.material.opacity = Math.max(
        baseOpacity,
        Utils.clamp(strat * 0.5 + meso * 0.5, 0, 1)
      );
    }
  }

  // ─── Update fog & scene background ────────────────────────────────────────
  function updateScene(scene) {
    if (!scene || !_current || !_current.skyTopColors) return;
    const strat = _current._strat || 0;
    const meso  = _current._meso  || 0;
    const trop  = _current._trop  || 0;
    const p = _current;

    // Fog color transition
    if (scene.fog) {
      const alt = ((_current._trop || 0) * TROP_END) +
                  ((_current._strat || 0) * (STRAT_END - TROP_END)) +
                  ((_current._meso  || 0) * (MESO_END - STRAT_END));

      const fogA = _lerpHex(p.fogColors[0], p.fogColors[1], strat);
      const fogB = _lerpHex(p.fogColors[1], p.fogColors[2], meso);
      const fogFinal = [
        Utils.lerp(fogA[0], fogB[0], meso),
        Utils.lerp(fogA[1], fogB[1], meso),
        Utils.lerp(fogA[2], fogB[2], meso),
      ];
      scene.fog.color.setRGB(
        Utils.clamp(fogFinal[0], 0, 1),
        Utils.clamp(fogFinal[1], 0, 1),
        Utils.clamp(fogFinal[2], 0, 1)
      );
      if (scene.fog.near !== undefined) {
        scene.fog.near = Utils.lerp(p.fogNear || 95,  220, strat);
        scene.fog.far  = Utils.lerp(p.fogFar  || 500, 950, strat) * (1 - meso * 0.85);
        if (meso > 0.9) { scene.fog.near = 9999; scene.fog.far = 10000; }
      }
    }

    // Background color
    if (scene.background) {
      const bgT = strat * 0.6 + meso * 0.4;
      const bg0 = _lerpHex(p.skyBottomColors[0], p.skyBottomColors[1], bgT);
      scene.background.setRGB(
        Utils.clamp(bg0[0] * 0.7, 0, 1),
        Utils.clamp(bg0[1] * 0.7, 0, 1),
        Utils.clamp(bg0[2] * 0.7, 0, 1)
      );
    }
  }

  // ─── Update ambient light altitude tint ───────────────────────────────────
  function updateLights(ambient, sun) {
    if (!ambient || !_current) return;
    const strat = _current._strat || 0;
    const meso  = _current._meso  || 0;
    const aIntensity = Utils.lerp(Utils.lerp(_current.ambientIntensity, _current.ambientIntensity * 0.6, strat), 0.1, meso);
    ambient.intensity = aIntensity;
  }

  return {
    setWorldPreset,
    getWorldPreset,
    updateAtmosphere,
    updateSkyUniforms,
    updateScene,
    updateLights,
  };
})();
