/* ============================================================
   script.js — Birthday Website for Vishesh 🌹
   ✅ Song starts from index.html (with tap-to-start fallback)
   ✅ Continues from exact same position across pages
   ✅ Works on mobile & desktop
   ✅ Pauses automatically on page3.html for the Voice Note
   ✅ Resumes automatically on page4.html and page5.html
   ============================================================ */

(function () {
  const SONG_SRC         = 'song.mp3';
  const STORAGE_TIME     = 'bday_song_time';
  const STORAGE_MUTED    = 'bday_song_muted';
  const STORAGE_UNLOCKED = 'bday_unlocked';

  // Detect if we are currently on page 3
  const isPage3 = window.location.pathname.includes('page3') || window.location.href.includes('page3');

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

  /* ── Save timestamp periodically and before leaving page ── */
  function saveTime() {
    if (!bgAudio.paused && !isPage3) {
      localStorage.setItem(STORAGE_TIME, bgAudio.currentTime);
    }
  }
  setInterval(saveTime, 300);
  window.addEventListener('pagehide', saveTime);
  window.addEventListener('beforeunload', saveTime);

  /* ── Fade in volume ── */
  function fadeIn() {
    if (isMuted || isPage3) return; // Never fade in on Page 3 or if muted
    bgAudio.volume = 0;
    let vol = 0;
    const iv = setInterval(() => {
      vol = Math.min(vol + 0.025, 0.5); // Max volume 0.5
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
    if (isPage3) return; // Strictly block background music on Page 3
    restoreAndPlay();
    bgAudio.play().then(() => {
      if (!isMuted) fadeIn();
      localStorage.setItem(STORAGE_UNLOCKED, 'true');
      isUnlocked = true;
      removeOverlay();
    }).catch(() => {
      console.log("Autoplay blocked, waiting for interaction.");
    });
  }

  /* ── Tap-to-start overlay (for mobile autoplay policies) ── */
  function createOverlay() {
    if (isUnlocked || document.getElementById('musicUnlockOverlay') || isPage3) return;
    
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
    
    // Single click to unlock audio and hide overlay
    ov.addEventListener('click', () => {
      startPlaying();
    }, { once: true });
  }

  function removeOverlay() {
    const ov = document.getElementById('musicUnlockOverlay');
    if (ov) {
      ov.style.opacity = '0';
      ov.style.pointerEvents = 'none';
      setTimeout(() => ov.remove(), 600);
    }
  }

  /* ── Mute / Unmute Toggle ── */
  function toggleMute() {
    if (isPage3) return; // Don't let user toggle BG music on page 3
    
    isMuted = !isMuted;
    localStorage.setItem(STORAGE_MUTED, isMuted);
    
    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');
    
    if (isMuted) {
      bgAudio.volume = 0;
      bgAudio.pause();
      if (icon) icon.textContent = '🔇';
      if (btn)  btn.classList.add('muted');
    } else {
      startPlaying();
      if (icon) icon.textContent = '🎵';
      if (btn)  btn.classList.remove('muted');
    }
  }

  /* ── Initialize on DOM Load ── */
  window.addEventListener('DOMContentLoaded', () => {
    const btn  = document.getElementById('musicToggleBtn');
    const icon = document.getElementById('musicIcon');

    // Logic for Page 3 (Voice Note Page)
    if (isPage3) {
      if (icon) icon.textContent = '🔇';
      if (btn) btn.classList.add('muted');
      bgAudio.pause(); // Force stop background music
    } 
    // Logic for all other pages
    else {
      if (btn) {
        if (icon) icon.textContent = isMuted ? '🔇' : '🎵';
        if (isMuted) btn.classList.add('muted');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleMute();
        });
      }

      if (isUnlocked) {
        // Returning visitor — restore position and resume
        restoreAndPlay();
        bgAudio.play().then(() => {
          if (!isMuted) fadeIn();
        }).catch(() => {
          // If browser blocked it despite being unlocked, attach interaction listeners
          const resume = () => startPlaying();
          document.addEventListener('click', resume, { once: true });
          document.addEventListener('touchstart', resume, { once: true });
        });
      } else {
        // First visit — try autoplay, fallback to overlay
        bgAudio.play().then(() => {
          if (!isMuted) fadeIn();
          localStorage.setItem(STORAGE_UNLOCKED, 'true');
          isUnlocked = true;
        }).catch(() => {
          createOverlay();
        });
      }
    }
  });

})();