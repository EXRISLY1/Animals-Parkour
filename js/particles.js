// ─── Particles Module ─────────────────────────────────────────────────────────
// Lightweight particle system stub — can be extended per map.
const Particles = (() => {
  let _scene = null;
  let _map = 'classic';
  let _particles = [];

  function init(sc, map) {
    _scene = sc;
    _map = map;
    clear();
  }

  function update(dt, playerPos) {
    // Placeholder for future particle effects (embers, snow, dust, etc.)
  }

  function clear() {
    _particles.forEach(p => {
      if (_scene && p) _scene.remove(p);
      if (p && p.geometry) p.geometry.dispose();
    });
    _particles = [];
  }

  return { init, update, clear };
})();
