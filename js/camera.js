const CameraSystem = (() => {
  let camera;
  let targetPos = new THREE.Vector3();
  let currentPos = new THREE.Vector3();
  const DIST   = 7;
  const HEIGHT = 3;

  // The sun DirectionalLight reference — updated each level by World
  let _sun = null;

  function init(scene) {
    // Increased far plane: 2000 eliminates the 183m "curtain" caused by
    // the old 600-unit clip distance + fixed shadow frustum
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }

  // Called by World after building lights
  function setSun(sunLight) { _sun = sunLight; }

  function update(playerPos, dt) {
    const yaw   = Controls.yaw;
    const pitch = Controls.pitch;

    const lookAt = new THREE.Vector3(playerPos.x, playerPos.y + 0.8, playerPos.z);

    targetPos.set(
      playerPos.x - Math.sin(yaw) * DIST * Math.cos(pitch),
      playerPos.y + HEIGHT + DIST * Math.sin(pitch),
      playerPos.z - Math.cos(yaw) * DIST * Math.cos(pitch)
    );

    currentPos.lerp(targetPos, Utils.clamp(dt * 8, 0, 1));
    camera.position.copy(currentPos);
    camera.lookAt(lookAt);

    // ── Dynamic shadow frustum: follows the player so there's no cutoff ──
    if (_sun && _sun.shadow) {
      const sc = _sun.shadow.camera;
      const R  = 120; // half-size of shadow area around player
      sc.left   = playerPos.x - R;
      sc.right  = playerPos.x + R;
      sc.bottom = playerPos.y - R;
      sc.top    = playerPos.y + R;
      // Sun position also follows player vertically so shadow angle stays consistent
      _sun.position.set(playerPos.x + 60, playerPos.y + 120, playerPos.z + 40);
      _sun.target.position.set(playerPos.x, playerPos.y, playerPos.z);
      _sun.target.updateMatrixWorld();
      sc.updateProjectionMatrix();
    }
  }

  function getYaw()    { return Controls.yaw; }
  function getCamera() { return camera; }

  return { init, update, getYaw, getCamera, setSun };
})();
