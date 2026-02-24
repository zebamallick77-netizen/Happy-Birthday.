/* ============================================================
   script.js — Birthday Website for Vishesh 🌹
   ✅ Song starts from index.html
   ✅ Continues from exact same position across all pages
   ✅ Works on mobile & desktop
   ✅ Voice note on page3 handled without conflict
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
  bgAudio.volume  = 0;
  bgAudio.preload = 'auto';
  document.body.appendChild(bgAudio);

  /* ── State ── */
  let isMuted    = localStorage.getItem(STORAGE_MUTED) === 'true';
  let isUnlocked = localStorage.getItem(STORAGE_UNLOCKED) === 'true';

  /* ── Save timestamp every 300ms AND right before page leaves ── */
  setInterval(() => {
    if (!bgAudio.paused) {
      localStorage.setItem(STORAGE_TIME, bgAudio.currentTime);
    }
  }, 300);

  function saveTime() {
    if (!bgAudio.paused) {
      localStorage.setItem(STORAGE_TIME, bgAudio.currentTime);
    }
  }
  window.addEventListener('pagehide',     saveTime);
  window.addEventListener('beforeunload', saveTime);

  /* ── Fade in volume ── */
  function fadeIn() {
    if (isMuted) return;
    bgAudio.volume = 0;
    let vol = 0;
    const iv = setInterval(() => {
      vol = Math.min(vol + 0.025, 0.5);
      bgAudio.volume = vol;
      if (vol >= 0.5) clearInterval(iv);
    }, 40);
  }

  /* ── Restore saved timestamp ── */
  function restoreAndPlay() {
    const savedTime = parseFloat(localStorage.getItem(STORAGE_TIME)) || 0;
    if (savedTime > 0) {
      if (bgAudio.readyState >= 1) {
        try { bgAudio.currentTime = savedTime; } catch(e) {}
      } else {
        bgAudio.addEventListener('loadedmetadata', () => {
          try { bgAudio.currentTime = savedTime; } catch(e) {}
        }, { once: true });
      }
    }
  }

  /* ── Start playing (after user gesture) ── */
  function startPlaying() {
    restoreAndPlay();
    bgAudio.play().then(() => {
      if (!isMuted) fadeIn();
      localStorage.setItem(STORAGE_UNLOCKED, 'true');
      isUnlocked = true;
      removeOverlay();
    }).catch(() => {});
  }

  /* ── Tap-to-start overlay ── */
  function createOverlay() {
    if (isUnlocked || document.getElementById('musicUnlockOverlay')) return;
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
    ov.addEventListener('click', startPlaying, { once: true });
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
      if (icon) icon.textContent = '🔇';
      if (btn)  btn.classList.add('muted');
    } else {
      if (!bgAudio.paused) fadeIn();
      else startPlaying();
      if (icon) icon.textContent = '🎵';
      if (btn)  btn.classList.remove('muted');
    }
  }

  /* ── Init on DOM ready ── */
  window.addEventListener('DOMContentLoaded', () => {

    /* Wire up music button */
    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');
    if (btn) {
      if (icon) icon.textContent = isMuted ? '🔇' : '🎵';
      if (isMuted) btn.classList.add('muted');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
      });
    }

    if (isUnlocked) {
      /* Returning visitor — restore position and resume */
      restoreAndPlay();
      bgAudio.play().then(() => {
        if (!isMuted) fadeIn();
      }).catch(() => {
        const resume = () => startPlaying();
        document.addEventListener('click',      resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
      });
    } else {
      /* First visit — autoplay for desktop, overlay for mobile */
      bgAudio.play().then(() => {
        if (!isMuted) fadeIn();
        localStorage.setItem(STORAGE_UNLOCKED, 'true');
        isUnlocked = true;
      }).catch(() => {
        createOverlay();
      });
    }

    /* ── Page 3: pause bg when voice note plays, resume after ── */
    const voiceEl = document.getElementById('voiceAudio');
    if (voiceEl) {
      voiceEl.addEventListener('play', () => {
        bgAudio.volume = 0;
        bgAudio.pause();
      });
      voiceEl.addEventListener('pause', () => {
        if (!isMuted && voiceEl.currentTime !== voiceEl.duration) {
          restoreAndPlay();
          bgAudio.play().then(() => fadeIn()).catch(() => {});
        }
      });
      voiceEl.addEventListener('ended', () => {
        if (!isMuted) {
          restoreAndPlay();
          bgAudio.play().then(() => fadeIn()).catch(() => {});
        }
      });
    }

  });

})();