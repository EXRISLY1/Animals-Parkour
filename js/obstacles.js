const Obstacles = (() => {
  let entries = [];
  let spinners = [];
  let globalTime = 0;

  const movingMat    = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  const trapMat      = new THREE.MeshLambertMaterial({ color: 0xff2244 });
  const disappearMat = new THREE.MeshLambertMaterial({ color: 0xaa22ff, transparent: true, opacity: 1 });
  const fallMat      = new THREE.MeshLambertMaterial({ color: 0x553322 });
  const bounceMat    = new THREE.MeshLambertMaterial({ color: 0x22ff55 });
  const fireMat      = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.9 });
  const windMat      = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const gravMat      = new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

  // ─── Moving Platform ───────────────────────────────────────────────────────
  function addMovingPlatform(scene, x, y, z, pw, pd) {
    const w = Math.max(pw * 0.8, 1.2);
    const d = Math.max(pd * 0.8, 1.2);
    const geo  = new THREE.BoxGeometry(w, 0.4, d);
    const mesh = new THREE.Mesh(geo, movingMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);

    const size = new THREE.Vector3(w, 0.4, d);
    Physics.register(mesh, size);

    const originX = x, originZ = z;
    const amp   = Utils.randRange(1.5, 3.5);
    const speed = Utils.randRange(1.0, 2.2);
    const axis  = Math.random() < 0.5 ? 'x' : 'z';
    const phase = Math.random() * Math.PI * 2;

    entries.push({
      mesh, physSize: size,
      update(dt) {
        if (axis === 'x') mesh.position.x = originX + Math.sin(globalTime * speed + phase) * amp;
        else               mesh.position.z = originZ + Math.sin(globalTime * speed + phase) * amp;
      }
    });
  }

  // ─── Spinning Trap Bar ────────────────────────────────────────────────────
  function addSpinTrap(scene, x, y, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    scene.add(pivot);

    const barGeo = new THREE.BoxGeometry(4.0, 0.25, 0.28);
    const bar    = new THREE.Mesh(barGeo, trapMat);
    bar.castShadow = true;
    pivot.add(bar);

    const speed = Utils.randRange(1.8, 3.8) * (Math.random() < 0.5 ? 1 : -1);

    entries.push({
      mesh: pivot, physSize: null, isSpinner: true, speed,
      update(dt) {
        pivot.rotation.y += speed * dt;

        const pPos = Player.getPosition().clone();
        pivot.worldToLocal(pPos);
        const halfL = 2.0 + 0.25;
        const halfH = 0.125 + 0.4;
        const halfW = 0.14 + 0.25;

        if (Math.abs(pPos.x) < halfL && Math.abs(pPos.y) < halfH && Math.abs(pPos.z) < halfW) {
          Player.respawn();
          Audio.play('fall');
        }
      }
    });
  }

  // ─── Disappearing Platform ────────────────────────────────────────────────
  function addDisappearingPlatform(scene, x, y, z, w, d) {
    const geo  = new THREE.BoxGeometry(w, 0.4, d);
    const mat  = disappearMat.clone();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const size = new THREE.Vector3(w, 0.4, d);
    Physics.register(mesh, size, 'platform');

    let state = 'solid';
    let timer = Utils.randRange(0, 2);
    const ACTIVE  = 2.5, FADE = 0.8, HIDE = 2.0;

    entries.push({
      mesh, physSize: size,
      update(dt) {
        timer += dt;
        if (state === 'solid' && timer > ACTIVE) {
          state = 'fading'; timer = 0;
        } else if (state === 'fading') {
          mat.opacity = 1.0 - (timer / FADE);
          if (timer > FADE) { state = 'hidden'; mat.opacity = 0; timer = 0; Physics.unregister(mesh); }
        } else if (state === 'hidden' && timer > HIDE) {
          state = 'appearing'; timer = 0; Physics.register(mesh, size, 'platform');
        } else if (state === 'appearing') {
          mat.opacity = timer / FADE;
          if (timer > FADE) { state = 'solid'; mat.opacity = 1; timer = 0; }
        }
      }
    });
  }

  // ─── Falling Platform ────────────────────────────────────────────────────
  function addFallingPlatform(scene, x, y, z, w, d) {
    const geo  = new THREE.BoxGeometry(w, 0.4, d);
    const mesh = new THREE.Mesh(geo, fallMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const size = new THREE.Vector3(w, 0.4, d);
    Physics.register(mesh, size, 'platform');

    let state = 'idle', timer = 0;
    const originY = y, RESPAWN = 5.0;

    entries.push({
      mesh, physSize: size,
      update(dt) {
        if (state === 'idle') {
          const pPos = Player.getPosition();
          if (Math.abs(pPos.x - x) < w/2 + 0.4 && Math.abs(pPos.z - z) < d/2 + 0.4 && pPos.y - y > 0 && pPos.y - y < 1.0) {
            state = 'trembling'; timer = 0;
          }
        } else if (state === 'trembling') {
          timer += dt;
          mesh.position.x = x + Math.sin(timer * 50) * 0.07;
          mesh.position.z = z + Math.cos(timer * 40) * 0.07;
          if (timer > 0.6) { state = 'falling'; timer = 0; mesh.position.x = x; mesh.position.z = z; Physics.unregister(mesh); }
        } else if (state === 'falling') {
          timer += dt;
          mesh.position.y -= dt * 18;
          if (timer > 2.0) { state = 'respawning'; timer = 0; mesh.visible = false; }
        } else if (state === 'respawning') {
          timer += dt;
          if (timer > RESPAWN) {
            state = 'idle'; timer = 0;
            mesh.position.set(x, originY, z); mesh.visible = true; mesh.scale.set(0.01, 0.01, 0.01);
            Physics.register(mesh, size, 'platform');
          }
        }
        if (state === 'idle' && mesh.scale.x < 1.0) {
          const s = Math.min(1.0, mesh.scale.x + dt * 4);
          mesh.scale.set(s, s, s);
        }
      }
    });
  }

  // ─── Bounce Platform ──────────────────────────────────────────────────────
  function addBouncePlatform(scene, x, y, z, w, d) {
    const geo  = new THREE.BoxGeometry(w, 0.6, d);
    const mesh = new THREE.Mesh(geo, bounceMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    const size = new THREE.Vector3(w, 0.6, d);
    Physics.register(mesh, size, 'bounce');

    let t = Math.random() * 5;
    entries.push({
      mesh, physSize: size,
      update(dt) {
        t += dt;
        mesh.scale.y = 1.0 + Math.sin(t * 5) * 0.12;
      }
    });
  }

  // ─── Fire Jet (Hell) ──────────────────────────────────────────────────────
  function addFireJet(scene, x, y, z, width) {
    const baseGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.4, 7);
    const base = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    base.position.set(x, y, z);
    scene.add(base);

    const jetGeo = new THREE.ConeGeometry(0.3, 2.5, 7);
    const jet    = new THREE.Mesh(jetGeo, fireMat.clone());
    jet.position.set(x, y + 1.5, z);
    scene.add(jet);

    let t = Math.random() * Math.PI * 2;
    const period = Utils.randRange(2.5, 4.5);
    const activeTime = period * 0.45;

    entries.push({
      mesh: jet, physSize: null,
      update(dt) {
        t += dt;
        const phase = (t % period) / period;
        const isActive = phase < (activeTime / period);
        jet.visible = isActive;

        if (isActive) {
          // Wobble
          jet.scale.x = 0.8 + Math.sin(t * 12) * 0.3;
          jet.scale.z = 0.8 + Math.cos(t * 10) * 0.3;
          jet.scale.y = 1.0 + Math.sin(t * 8)  * 0.15;

          // Kill check
          const pPos = Player.getPosition();
          if (Math.abs(pPos.x - x) < 1.2 && Math.abs(pPos.z - z) < 1.2 && pPos.y - y < 3.0 && pPos.y > y - 0.5) {
            Player.respawn();
            Audio.play('fall');
          }
        }
      }
    });
  }

  // ─── Wind Zone (Winter) ───────────────────────────────────────────────────
  function addWindZone(scene, x, y, z, w, d) {
    const geo  = new THREE.BoxGeometry(w * 0.9, 3, d * 0.9);
    const mesh = new THREE.Mesh(geo, windMat);
    mesh.position.set(x, y + 1.5, z);
    scene.add(mesh);

    const PUSH_STRENGTH = 6.5;
    let t = 0;

    entries.push({
      mesh, physSize: null,
      update(dt) {
        t += dt;
        mesh.material.opacity = 0.15 + Math.sin(t * 3) * 0.15;

        const pPos = Player.getPosition();
        if (Math.abs(pPos.x - x) < w/2 && Math.abs(pPos.z - z) < d/2 && pPos.y - y < 3.5 && pPos.y > y - 0.5) {
          // Push player sideways
          const vel = Player.getVelocity ? Player.getVelocity() : null;
          if (vel) {
            vel.x += Math.cos(t * 0.5) * PUSH_STRENGTH * dt;
            vel.z += Math.sin(t * 0.5) * PUSH_STRENGTH * dt;
          }
        }
      }
    });
  }

  // ─── Gravity Zone (Heaven) ────────────────────────────────────────────────
  function addGravityZone(scene, x, y, z, w, d) {
    const geo  = new THREE.BoxGeometry(w * 0.9, 4, d * 0.9);
    const mesh = new THREE.Mesh(geo, gravMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    let t = 0;
    const LIFT = 4.0;

    entries.push({
      mesh, physSize: null,
      update(dt) {
        t += dt;
        mesh.rotation.y += dt * 0.4;
        mesh.material.opacity = 0.2 + Math.sin(t * 2) * 0.15;

        const pPos = Player.getPosition();
        if (Math.abs(pPos.x - x) < w/2 && Math.abs(pPos.z - z) < d/2 && pPos.y > y - 2 && pPos.y < y + 4) {
          // Reduce gravity & lift player slightly
          Physics.setGravityScale(0.15);
          const vel = Player.getVelocity ? Player.getVelocity() : null;
          if (vel && vel.y < 1.0) vel.y += LIFT * dt;
        }
      }
    });
  }

  function update(dt) {
    globalTime += dt;
    for (const e of entries) e.update(dt);
  }

  function clear(scene) {
    for (const e of entries) {
      if (e.mesh) scene.remove(e.mesh);
      if (e.physSize) Physics.unregister(e.mesh);
    }
    entries = [];
    spinners = [];
    globalTime = 0;
  }

  return {
    addMovingPlatform, addSpinTrap,
    addDisappearingPlatform, addFallingPlatform, addBouncePlatform,
    addFireJet, addWindZone, addGravityZone,
    update, clear
  };
})();
