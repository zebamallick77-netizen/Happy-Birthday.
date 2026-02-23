/* ============================================================
   script.js — Birthday Website for Vishesh 🌹
   ✅ Works on mobile (iOS + Android)
   ✅ Persists across all pages
   ✅ Doesn't conflict with voice note on page3
   ✅ Shows tap-to-start overlay on first visit
   ============================================================ */

(function () {

  const SONG_SRC         = 'song.mp3';
  const STORAGE_TIME     = 'bday_song_time';
  const STORAGE_MUTED    = 'bday_song_muted';
  const STORAGE_UNLOCKED = 'bday_unlocked';

  /* ── Create background audio ── */
  const bgAudio   = document.createElement('audio');
  bgAudio.src     = SONG_SRC;
  bgAudio.loop    = true;
  bgAudio.volume  = 0.5;
  bgAudio.preload = 'auto';
  bgAudio.muted   = true; /* iOS requires muted to allow programmatic play */
  document.body.appendChild(bgAudio);

  /* ── State ── */
  let isMuted    = localStorage.getItem(STORAGE_MUTED) === 'true';
  let isUnlocked = localStorage.getItem(STORAGE_UNLOCKED) === 'true';

  /* ── Restore timestamp ── */
  const savedTime = parseFloat(localStorage.getItem(STORAGE_TIME)) || 0;

  /* ── Save timestamp every second ── */
  setInterval(() => {
    if (!bgAudio.paused) {
      localStorage.setItem(STORAGE_TIME, bgAudio.currentTime);
    }
  }, 1000);

  /* ── Fade in volume ── */
  function fadeIn() {
    if (isMuted) return;
    bgAudio.muted  = false;
    bgAudio.volume = 0;
    let vol = 0;
    const iv = setInterval(() => {
      vol = Math.min(vol + 0.03, 0.5);
      bgAudio.volume = vol;
      if (vol >= 0.5) clearInterval(iv);
    }, 40);
  }

  /* ── Actually start playing ── */
  function startPlaying() {
    try { bgAudio.currentTime = savedTime; } catch(e) {}
    bgAudio.play().then(() => {
      fadeIn();
      localStorage.setItem(STORAGE_UNLOCKED, 'true');
      isUnlocked = true;
      removeOverlay();
    }).catch(() => {});
  }

  /* ── Unlock on ANY user gesture ── */
  function unlockAndPlay() {
    if (isUnlocked) return;
    startPlaying();
  }

  /* ── Tap-to-start overlay (solves mobile autoplay block) ── */
  function createOverlay() {
    if (isUnlocked) return;
    const ov = document.createElement('div');
    ov.id = 'musicUnlockOverlay';
    ov.innerHTML = `
      <div id="musicUnlockBox">
        <div id="musicUnlockNote">🎵</div>
        <p id="musicUnlockTitle">Tap to begin</p>
        <p id="musicUnlockSub">Let the music play for Vishesh 🌹</p>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', () => { startPlaying(); }, { once: true });
  }

  function removeOverlay() {
    const ov = document.getElementById('musicUnlockOverlay');
    if (ov) {
      ov.style.opacity = '0';
      ov.style.pointerEvents = 'none';
      setTimeout(() => ov.remove(), 600);
    }
  }

  /* ── Mute / Unmute ── */
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(STORAGE_MUTED, isMuted);
    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');
    if (isMuted) {
      bgAudio.volume = 0;
      bgAudio.muted  = true;
      if (icon) icon.textContent = '🔇';
      if (btn)  btn.classList.add('muted');
    } else {
      bgAudio.muted = false;
      fadeIn();
      if (icon) icon.textContent = '🎵';
      if (btn)  btn.classList.remove('muted');
    }
  }

  /* ── Init on DOM ready ── */
  window.addEventListener('DOMContentLoaded', () => {

    /* Wire up toggle button */
    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');
    if (btn) {
      if (icon) icon.textContent = isMuted ? '🔇' : '🎵';
      if (isMuted) btn.classList.add('muted');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUnlocked) startPlaying();
        toggleMute();
      });
    }

    /* If already unlocked (navigated from another page) — just play */
    if (isUnlocked) {
      bgAudio.play().then(() => {
        if (!isMuted) fadeIn();
        else bgAudio.muted = true;
      }).catch(() => {
        document.addEventListener('click',      unlockAndPlay, { once: true });
        document.addEventListener('touchstart', unlockAndPlay, { once: true });
      });
    } else {
      /* First visit — try silent autoplay for desktop */
      bgAudio.play().then(() => {
        if (!isMuted) fadeIn();
        localStorage.setItem(STORAGE_UNLOCKED, 'true');
        isUnlocked = true;
      }).catch(() => {
        /* Mobile blocked — show pretty tap overlay */
        createOverlay();
        document.addEventListener('click',      unlockAndPlay, { once: true });
        document.addEventListener('touchstart', unlockAndPlay, { once: true });
      });
    }

    /* ── Page 3: duck bg music when voice note plays, restore after ── */
    const voiceAudio = document.getElementById('voiceAudio');
    if (voiceAudio) {
      voiceAudio.addEventListener('play', () => {
        bgAudio.volume = 0.08;
      });
      voiceAudio.addEventListener('pause', () => {
        if (!isMuted) fadeIn();
      });
      voiceAudio.addEventListener('ended', () => {
        if (!isMuted) fadeIn();
      });
    }

  });

})();
