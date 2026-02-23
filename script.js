/* ============================================================
   script.js — Birthday Website for Vishesh 🌹
   Persistent background music across all 5 pages
   ============================================================ */

(function () {

  const SONG_SRC        = 'song.mp3';
  const STORAGE_TIME    = 'bday_song_time';
  const STORAGE_MUTED   = 'bday_song_muted';
  const FADE_DURATION   = 1200; // ms for fade in

  /* ── Create the audio element ── */
  const audio = document.createElement('audio');
  audio.src   = SONG_SRC;
  audio.loop  = true;
  audio.volume = 0; // start at 0, fade in
  document.body.appendChild(audio);

  /* ── Restore mute preference ── */
  const wasMuted = localStorage.getItem(STORAGE_MUTED) === 'true';
  let   isMuted  = wasMuted;

  /* ── Restore playback position ── */
  const savedTime = parseFloat(localStorage.getItem(STORAGE_TIME)) || 0;
  audio.currentTime = savedTime;

  /* ── Save timestamp every second so it survives page changes ── */
  setInterval(() => {
    if (!audio.paused) {
      localStorage.setItem(STORAGE_TIME, audio.currentTime);
    }
  }, 1000);

  /* ── Fade in helper ── */
  function fadeIn(targetVolume) {
    let vol = 0;
    const step = targetVolume / (FADE_DURATION / 30);
    const interval = setInterval(() => {
      vol = Math.min(vol + step, targetVolume);
      audio.volume = vol;
      if (vol >= targetVolume) clearInterval(interval);
    }, 30);
  }

  /* ── Attempt autoplay ── */
  function startMusic() {
    if (isMuted) {
      audio.volume = 0;
      audio.play().catch(() => {});
      return;
    }
    audio.play().then(() => {
      fadeIn(0.55);
    }).catch(() => {
      /* Autoplay blocked — wait for first user interaction */
      const unlock = () => {
        audio.play().then(() => {
          if (!isMuted) fadeIn(0.55);
        }).catch(() => {});
        document.removeEventListener('click',     unlock);
        document.removeEventListener('touchstart', unlock);
      };
      document.addEventListener('click',      unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
    });
  }

  /* ── Mute / Unmute toggle ── */
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(STORAGE_MUTED, isMuted);

    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');

    if (isMuted) {
      audio.volume = 0;
      if (icon) icon.textContent = '🔇';
      if (btn)  btn.setAttribute('aria-label', 'Unmute music');
      if (btn)  btn.classList.add('muted');
    } else {
      fadeIn(0.55);
      if (icon) icon.textContent = '🎵';
      if (btn)  btn.setAttribute('aria-label', 'Mute music');
      if (btn)  btn.classList.remove('muted');
    }
  }

  /* ── Wire up the toggle button (injected by style.css html) ── */
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('musicToggleBtn');
    if (btn) {
      const icon = document.getElementById('musicIcon');
      /* Set correct initial icon */
      if (icon) icon.textContent = isMuted ? '🔇' : '🎵';
      if (isMuted) btn.classList.add('muted');
      btn.addEventListener('click', toggleMute);
    }
    startMusic();
  });

})();