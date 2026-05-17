const Controls = (() => {
  const keys = {};
  let mouseX = 0, mouseY = 0.3;
  let enabled = false;
  let rightDragging = false;
  let lastClientX = 0, lastClientY = 0;
  let sensitivity = 1.0;

  // ── Keyboard ───────────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    keys[e.code] = true;
    if (e.code === 'Escape' && enabled) {
      // ESC: toggle pause. pointerlockchange handler will release lock if needed.
      Game && Game.togglePause();
    }
  });
  document.addEventListener('keyup', e => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    keys[e.code] = false;
  });

  // ── Pointer Lock mouse look ────────────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement) {
      // Pointer lock mode: use movementX/Y (precise, no cursor drift)
      const dx = e.movementX || 0;
      const dy = e.movementY || 0;
      mouseX -= dx * 0.003 * sensitivity;
      mouseY += dy * 0.003 * sensitivity;
      mouseY = Utils.clamp(mouseY, -0.4, 0.75);
    } else if (rightDragging && enabled) {
      // Fallback: right-drag mode
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      mouseX -= dx * 0.005 * sensitivity;
      mouseY += dy * 0.005 * sensitivity;
      mouseY = Utils.clamp(mouseY, -0.4, 0.75);
    }
  });

  // ── Right-click drag for camera (fallback when not pointer-locked) ─────────
  const canvas = document.getElementById('game-canvas');

  canvas.addEventListener('mousedown', e => {
    if (e.button === 2) {
      e.preventDefault();
      if (enabled) {
        rightDragging = true;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
      }
    }
    // Left click on canvas while playing: request pointer lock
    if (e.button === 0 && enabled && !document.pointerLockElement) {
      canvas.requestPointerLock();
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button === 2) rightDragging = false;
  });

  // Sağ tık menüsünü engelle
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // ── Touch / Mobile Controls ────────────────────────────────────────────────
  let touchCameraId = null;
  let lastTouchX = 0, lastTouchY = 0;

  // Detect touch device
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('is-touch');
  }

  document.addEventListener('touchstart', e => {
    if (!enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.target.tagName !== 'BUTTON' && !t.target.closest('#mobile-joystick-zone') && !t.target.closest('.dpad-btn') && !t.target.closest('.action-btn')) {
        if (touchCameraId === null) {
          touchCameraId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchCameraId) {
        e.preventDefault();
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
        mouseX -= dx * 0.005 * sensitivity;
        mouseY += dy * 0.005 * sensitivity;
        mouseY = Utils.clamp(mouseY, -0.4, 0.75);
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchCameraId) touchCameraId = null;
    }
  });
  document.addEventListener('touchcancel', e => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchCameraId) touchCameraId = null;
    }
  });

  // Wiring mobile buttons to simulate keyboard
  document.addEventListener('DOMContentLoaded', () => {
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      const code = btn.getAttribute('data-key');
      if (!code) return;
      btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        keys[code] = true; 
        if (code === 'KeyM' && typeof Player !== 'undefined' && Player.playAnimalSound) {
          Player.playAnimalSound();
        }
      });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[code] = false; });
      btn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[code] = false; });
    });

    // Virtual Joystick logic
    const zone = document.getElementById('mobile-joystick-zone');
    const stick = document.getElementById('mobile-joystick-stick');
    let joyId = null;
    let centerX = 0, centerY = 0;
    const MAX_DIST = 40;

    if (zone && stick) {
      zone.addEventListener('touchstart', (e) => {
        if (!enabled) return;
        e.preventDefault();
        if (joyId !== null) return;
        const t = e.changedTouches[0];
        joyId = t.identifier;
        const rect = zone.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        updateJoystick(t.clientX, t.clientY);
      });

      zone.addEventListener('touchmove', (e) => {
        if (!enabled) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === joyId) {
            e.preventDefault();
            updateJoystick(t.clientX, t.clientY);
          }
        }
      });

      const endJoy = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joyId) {
            joyId = null;
            stick.style.transform = `translate(0px, 0px)`;
            keys['KeyW'] = keys['KeyS'] = keys['KeyA'] = keys['KeyD'] = false;
          }
        }
      };
      zone.addEventListener('touchend', endJoy);
      zone.addEventListener('touchcancel', endJoy);

      function updateJoystick(tx, ty) {
        let dx = tx - centerX;
        let dy = ty - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > MAX_DIST) {
          dx = (dx / dist) * MAX_DIST;
          dy = (dy / dist) * MAX_DIST;
        }
        stick.style.transform = `translate(${dx}px, ${dy}px)`;

        // Deadzone of 10px
        const active = dist > 10;
        keys['KeyW'] = active && dy < -10;
        keys['KeyS'] = active && dy > 10;
        keys['KeyA'] = active && dx < -10;
        keys['KeyD'] = active && dx > 10;
      }
    }

    const pauseBtn = document.getElementById('btn-mobile-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (enabled && typeof Game !== 'undefined') Game.togglePause();
      });
    }
  });

  return {
    enable()  { enabled = true; },
    disable() { enabled = false; rightDragging = false; },

    isDown(code) { return !!keys[code]; },

    get yaw()   { return mouseX; },
    get pitch() { return mouseY; },

    resetMouse() { mouseX = 0; mouseY = 0.3; },

    isLocked() { return !!document.pointerLockElement; },

    setSensitivity(val) { sensitivity = val; }
  };
})();
