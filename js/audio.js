const GameAudio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, type, duration, vol, startFreq) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq || freq, c.currentTime);
      if (startFreq) osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + duration);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (e) { }
  }

  const sounds = {
    jump() {
      tone(300, 'sine', 0.12, 0.18, 200);
      tone(500, 'sine', 0.08, 0.08, 400);
    },
    dash() {
      tone(600, 'sawtooth', 0.06, 0.12, 900);
      tone(300, 'sine', 0.10, 0.08, 500);
    },
    fall() {
      tone(500, 'sine', 0.55, 0.14, 800);
      setTimeout(() => tone(180, 'sawtooth', 0.3, 0.08, 280), 120);
    },
    checkpoint() {
      [523, 659].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.22, 0.14), i * 85));
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => tone(f, 'sine', 0.25, 0.2), i * 90);
      });
    }
  };


  let sfxEnabled = true;

  function play(name) {
    if (!sfxEnabled) return;
    if (sounds[name]) sounds[name]();
  }

  function setSfxEnabled(enabled) {
    sfxEnabled = enabled;
  }

  // ─── Background Music System ──────────────────────────────────────────────
  const musicFiles = [
    'musics/sound1.mp3',
    'musics/sound2.mp3',
    'musics/sound3.mp3',
    'musics/sound4.mp3',
    'musics/sound5.mp3'
  ];
  let currentTrackIndex = 0;
  let bgMusic = null;
  let musicEnabled = true;
  let musicVolume = 0.5;

  function initMusic() {
    if (bgMusic) return;
    
    // Shuffle music files
    for (let i = musicFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [musicFiles[i], musicFiles[j]] = [musicFiles[j], musicFiles[i]];
    }

    bgMusic = new window.Audio(musicFiles[currentTrackIndex]);
    bgMusic.volume = musicVolume;
    
    bgMusic.addEventListener('ended', () => {
      currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
      bgMusic.src = musicFiles[currentTrackIndex];
      bgMusic.play().catch(e => console.log('Music play error:', e));
    });
  }

  function startMusic() {
    if (!musicEnabled) return;
    initMusic();
    bgMusic.play().catch(e => console.log('Music play error:', e));
  }

  function stopMusic() {
    if (bgMusic) {
      bgMusic.pause();
    }
  }

  function setMusicEnabled(enabled) {
    musicEnabled = enabled;
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }

  function setMusicVolume(vol) {
    musicVolume = Math.max(0, Math.min(1, vol));
    if (bgMusic) {
      bgMusic.volume = musicVolume;
    }
  }

  return { play, startMusic, stopMusic, setMusicEnabled, setMusicVolume, setSfxEnabled };
})();

// Alias so existing code using Audio.play() still works
const Audio = GameAudio;

