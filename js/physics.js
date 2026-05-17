const Physics = (() => {
  const BASE_GRAVITY     = -28;   // ground level gravity
  const BASE_TERM_VEL    = -50;
  const FALL_DROP_OFFSET = -12;
  let   _deathY          = -20;
  let   _lastGroundY     = 0;
  let   _gravityScale    = 1.0;   // 1.0 = full, 0.0 = zero gravity

  let solids = [];

  function register(mesh, size, type = 'platform') {
    solids.push({ mesh, size: size.clone(), type });
  }

  function unregister(mesh) {
    solids = solids.filter(s => s.mesh !== mesh);
  }

  function clear() { 
    solids = []; 
    _lastGroundY = 0;
  }

  // Called every frame by World with the player's current altitude
  function setGravityScale(scale) {
    _gravityScale = Math.max(0.08, Math.min(1.0, scale));
  }

  // ─── Single-step resolve ───────────────────────────────────────────────────
  function resolveStep(pPos, pSize, vel, dt, flyMode = false) {
    // Apply gravity (scaled by altitude)
    if (!flyMode) {
      const g = BASE_GRAVITY * _gravityScale;
      const termVel = BASE_TERM_VEL * _gravityScale;
      vel.y += g * dt;
      if (vel.y < termVel) vel.y = termVel;
    }

    // Move
    pPos.x += vel.x * dt;
    pPos.y += vel.y * dt;
    pPos.z += vel.z * dt;

    let grounded = false;
    let onKill   = false;
    let groundMat = null;

    for (const solid of solids) {
      const sPos  = new THREE.Vector3();
      solid.mesh.getWorldPosition(sPos);
      const sSize = solid.size;

      // AABB overlap
      const ox = (pSize.x + sSize.x) / 2 - Math.abs(pPos.x - sPos.x);
      if (ox <= 0) continue;
      const oy = (pSize.y + sSize.y) / 2 - Math.abs(pPos.y - sPos.y);
      if (oy <= 0) continue;
      const oz = (pSize.z + sSize.z) / 2 - Math.abs(pPos.z - sPos.z);
      if (oz <= 0) continue;

      if (solid.type === 'kill') { onKill = true; continue; }

      // Push out on smallest overlap axis
      if (oy <= ox && oy <= oz) {
        if (pPos.y > sPos.y) {
          pPos.y += oy;
          if (vel.y < 0) vel.y = 0;
          grounded = true;
          groundMat = solid.type;
          _lastGroundY = pPos.y;
        } else {
          pPos.y -= oy;
          if (vel.y > 0) vel.y = 0;
        }
      } else if (ox <= oz) {
        pPos.x += (pPos.x > sPos.x ? ox : -ox);
        vel.x = 0;
      } else {
        pPos.z += (pPos.z > sPos.z ? oz : -oz);
        vel.z = 0;
      }
    }

    if (pPos.y < _lastGroundY - 10 || pPos.y < _deathY) onKill = true;
    return { grounded, onKill, groundMat };
  }

  // ─── Public resolve: 3 sub-steps to prevent tunneling ─────────────────────
  function resolve(player, dt) {
    const SUB = 3;
    const subDt = dt / SUB;
    const pPos  = player.mesh.position;
    const vel   = player.velocity;
    const pSize = player.size;

    let grounded = false;
    let onKill   = false;
    let groundMat = null;

    for (let i = 0; i < SUB; i++) {
      const result = resolveStep(pPos, pSize, vel, subDt, player.flyMode);
      if (result.grounded) {
        grounded = true;
        if (result.groundMat) groundMat = result.groundMat;
      }
      if (result.onKill) onKill = true;
    }

    return { grounded, onKill, groundMat };
  }

  function setDeathY(y) { _deathY = y + FALL_DROP_OFFSET; }
  function setLastGroundY(y) { _lastGroundY = y; }
  function getGravityScale() { return _gravityScale; }

  return { register, unregister, clear, resolve, setDeathY, setLastGroundY, setGravityScale, getGravityScale };
})();
