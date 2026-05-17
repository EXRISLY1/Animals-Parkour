const Utils = {
  lerp(a, b, t) { return a + (b - a) * t; },

  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

  randRange(min, max) { return Math.random() * (max - min) + min; },

  randInt(min, max) { return Math.floor(Utils.randRange(min, max + 1)); },

  // Axis-aligned bounding box overlap check
  aabbOverlap(aPos, aSize, bPos, bSize) {
    return (
      Math.abs(aPos.x - bPos.x) < (aSize.x + bSize.x) / 2 &&
      Math.abs(aPos.y - bPos.y) < (aSize.y + bSize.y) / 2 &&
      Math.abs(aPos.z - bPos.z) < (aSize.z + bSize.z) / 2
    );
  },

  // Color helpers
  lerpColor(c1, c2, t) {
    const r = Utils.lerp(c1.r, c2.r, t);
    const g = Utils.lerp(c1.g, c2.g, t);
    const b = Utils.lerp(c1.b, c2.b, t);
    return new THREE.Color(r, g, b);
  }
};
