/**
 * i18n.js — Lightweight internationalization
 * Usage:
 *   I18n.t('start')           → "Play" or "Başla"
 *   I18n.setLang('tr')        → switch to Turkish, re-apply DOM
 *   I18n.apply()              → scan DOM and replace [data-i18n] elements
 */
const I18n = (() => {

  const STRINGS = {
    en: {
      // ── Main menu
      start:          '▶ PLAY',
      characters:     '🐾 CHARACTERS',
      settings:       '⚙ SETTINGS',
      info:           'ℹ INFO',
      back:           '← BACK',

      // ── Characters panel
      chars_title:    '🐾 CHARACTERS',
      select:         'SELECT',
      selected:       'SELECTED',

      // ── Character descriptions
      cow_name:       'Cow',
      cow_desc:       'The classic parkourist. Balanced stats.',
      sheep_name:     'Sheep',
      sheep_desc:     'Soft but heavy. Low jump.',
      rabbit_name:    'Rabbit',
      rabbit_desc:    'Super jumper! Light and fast.',
      pig_name:       'Pig',
      pig_desc:       'Chubby but strong. Slow and sturdy.',
      dog_name:       'Dog',
      dog_desc:       'Agile and fast. Well rounded.',
      giraffe_name:   'Giraffe',
      giraffe_desc:   'Huge! Long legs, great jump.',

      // ── Stat labels
      stat_speed:     'Speed',
      stat_jump:      'Jump',
      stat_weight:    'Weight',

      // ── Map & Difficulty
      map_title:      'SELECT MAP',
      map_classic:    'CLASSIC',
      map_winter:     'WINTER',
      map_hell:       'HELL',
      map_moon:      'MOON',
      map_classic_desc: 'Green islands & nature',
      map_winter_desc:  'Icy & slippery platforms',
      map_hell_desc:    'Fire & stone chaos',
      map_moon_desc:    'Craters & low gravity',

      // ── Settings panel
      settings_title: '⚙ SETTINGS',
      sfx_label:      'Sound Effects',
      music_label:    'Music',
      vol_label:      'Music Volume',
      lang_label:     'Language',
      sens_label:     'Sensitivity',
      safe_mode_label:'Safe Mode',
      multiplayer:    'Multiplayer',

      // ── Info panel
      info_title:     'ℹ INFO & CODES',
      key_move:       'Move',
      key_jump:       'Jump (double)',
      key_sprint:     'Sprint / Dash',
      key_camera:     'Camera',
      key_pause:      'Pause',
      key_sound:      'Animal sound',
      codes_title:    '✦ SECRET CODES ✦',
      code_god:       'Invincibility',
      code_rgb:       'Rainbow Mode',
      code_big_spots: 'Show Big Spots',
      code_giant:     'Become Giant',
      code_end:       'Skip to End',
      code_iso:       'Pig Mode',
      code_cow:       'Cow Mode',
      code_dog:       'Dog Mode',
      code_shp:       'Sheep Mode',
      code_rab:       'Rabbit Mode',
      code_grf:       'Giraffe Mode',

      // ── HUD / screens
      fell:           'YOU FELL!',
      respawning:     'Respawning...',
      level_clear:    'LEVEL CLEAR!',
      paused:         'PAUSED',
      resume:         'RESUME',
      main_menu:      'MAIN MENU',
      next_level:     'NEXT LEVEL',
      restart:        'RESTART',
      home:           'HOME',

      // ── Animal sound notifications
      snd_cow:        '🐄 Moooo!',
      snd_sheep:      '🐑 Baaaa!',
      snd_rabbit:     '🐰 Squeak!',
      snd_pig:        '🐷 Oink!',
      snd_dog:        '🐶 Woof!',
      snd_giraffe:    '🦒 Hmmmm...',
    },

    tr: {
      // ── Main menu
      start:          '▶ BAŞLA',
      characters:     '🐾 KARAKTERler',
      settings:       '⚙ AYARLAR',
      info:           'ℹ BİLGİ',
      back:           '← GERİ',

      // ── Characters panel
      chars_title:    '🐾 KARAKTERler',
      select:         'SEÇ',
      selected:       'SEÇİLİ',

      // ── Character descriptions
      cow_name:       'İnek',
      cow_desc:       'Klasik parkurcumuz. Dengeli stats.',
      sheep_name:     'Koyun',
      sheep_desc:     'Yumuşak ve ağır. Düşük zıplama.',
      rabbit_name:    'Tavşan',
      rabbit_desc:    'Süper zıplama! Hafif ve hızlı.',
      pig_name:       'Domuz',
      pig_desc:       'Şişman ama güçlü. Yavaş ama kaya gibi.',
      dog_name:       'Köpek',
      dog_desc:       'Çevik ve hızlı. İyi dengeli.',
      giraffe_name:   'Zurafa',
      giraffe_desc:   'Devasa boylu! Uzun bacaklar, yüksek atlama.',

      // ── Stat labels
      stat_speed:     'Hız',
      stat_jump:      'Zıplama',
      stat_weight:    'Ağırlık',

      // ── Harita
      map_title:      'HARİTA SEÇ',
      map_classic:    'KLASİK',
      map_winter:     'KIŞ',
      map_hell:       'CEHENNEM',
      map_moon:      'AY',
      map_classic_desc: 'Yeşil adalar & doğa',
      map_winter_desc:  'Buzlu & kaygan platformlar',
      map_hell_desc:    'Ateş & taş kaosu',
      map_moon_desc:    'Kraterler & düşük yerçekimi',

      // ── Settings panel
      settings_title: '⚙ AYARLAR',
      sfx_label:      'Ses Efektleri',
      music_label:    'Müzik',
      vol_label:      'Müzik Sesi',
      lang_label:     'Dil',
      sens_label:     'Hassasiyet',
      safe_mode_label:'Safe Mod',
      multiplayer:    'Online Odalar',

      // ── Info panel
      info_title:     'ℹ BİLGİ & KODLAR',
      key_move:       'Hareket',
      key_jump:       'Zıpla (2x)',
      key_sprint:     'Koş / Dash',
      key_camera:     'Kamera',
      key_pause:      'Duraklat',
      key_sound:      'Hayvan sesi',
      codes_title:    '✦ GİZLİ KODLAR ✦',
      code_god:       'Ölümsüzlük',
      code_rgb:       'Rainbow Mod',
      code_big_spots: 'Dev İnek Göster',
      code_giant:     'Dev İnek Ol',
      code_end:       'Sona Işınlan',
      code_iso:       'Domuz Ol',
      code_cow:       'İnek Ol',
      code_dog:       'Köpek Ol',
      code_shp:       'Koyun Ol',
      code_rab:       'Tavşan Ol',
      code_grf:       'Zürafa Ol',

      // ── HUD / screens
      fell:           'DÜŞTÜN!',
      respawning:     'Yeniden başlıyor...',
      level_clear:    'SEVİYE TAMAM!',
      paused:         'DURAKLATILDI',
      resume:         'DEVAM',
      main_menu:      'ANA MENÜ',
      next_level:     'SONRAKİ SEVİYE',
      restart:        'YENİDEN BAŞLA',
      home:           'ANA MENÜ',

      // ── Animal sound notifications
      snd_cow:        '🐄 Möö!',
      snd_sheep:      '🐑 Meee!',
      snd_rabbit:     '🐰 Cıvıl!',
      snd_pig:        '🐷 Oink!',
      snd_dog:        '🐶 Hav!',
      snd_giraffe:    '🦒 Hmmm...',
    }
  };

  // Persist language in localStorage
  let _lang = localStorage.getItem('ap_lang') || 'en';

  function t(key) {
    const dict = STRINGS[_lang] || STRINGS['en'];
    return dict[key] || STRINGS['en'][key] || key;
  }

  function setLang(lang) {
    if (!STRINGS[lang]) return;
    _lang = lang;
    localStorage.setItem('ap_lang', lang);
    apply();
  }

  function getLang() { return _lang; }

  /** Scan DOM for data-i18n attributes and update text content */
  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    // Also update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });
  }

  return { t, setLang, getLang, apply, STRINGS };
})();
