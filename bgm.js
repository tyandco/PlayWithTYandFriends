// Background music autoplay with graceful fallback for browser policies
(function setupBackgroundMusic() {
  function tryPlay() {
    var audio = document.getElementById('bg-music');
    if (!audio) return;

    // Ensure volume is reasonable; adjust if needed
    if (typeof audio.volume === 'number') {
      audio.volume = 0.6; // tweak as desired
    }

    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.catch(function () {
        // Autoplay blocked; start on first interaction
        var resume = function () {
          audio.play().catch(function () { /* ignore */ });
          cleanup();
        };
        var cleanup = function () {
          window.removeEventListener('pointerdown', resume, true);
          window.removeEventListener('keydown', resume, true);
          window.removeEventListener('touchstart', resume, true);
        };
        window.addEventListener('pointerdown', resume, { once: true, capture: true });
        window.addEventListener('keydown', resume, { once: true, capture: true });
        window.addEventListener('touchstart', resume, { once: true, capture: true });
      });
    }
  }

  if (document.readyState === 'complete') {
    tryPlay();
  } else {
    window.addEventListener('load', tryPlay);
  }
})();

// UI: mute toggle + open GitHub
(function initSiteActions() {
  function byId(id) { return document.getElementById(id); }
  var audio = document.getElementById('bg-music');
  var muteBtn = byId('mute-toggle');
  var ghLink = byId('open-github');

  if (ghLink) {
    var url = (document.body && document.body.dataset && document.body.dataset.githubUrl) || ghLink.getAttribute('href') || 'https://github.com/';
    ghLink.setAttribute('href', url);
  }

  function updateMuteLabel() {
    if (!muteBtn) return;
    var isMuted = audio ? audio.muted : true;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    muteBtn.setAttribute('aria-pressed', String(!isMuted));
    muteBtn.title = isMuted ? 'Unmute background music' : 'Mute background music';
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      if (!audio) audio = document.getElementById('bg-music');
      if (!audio) return;
      audio.muted = !audio.muted;
      if (!audio.paused && audio.muted === false) {
        // Ensure it keeps playing after unmute (in case of policy)
        audio.play().catch(function () {});
      }
      updateMuteLabel();
    });
  }

  // Keep label in sync when audio becomes ready
  if (audio) {
    audio.addEventListener('volumechange', updateMuteLabel);
    audio.addEventListener('play', updateMuteLabel);
    audio.addEventListener('pause', updateMuteLabel);
  }

  if (document.readyState === 'complete') {
    updateMuteLabel();
  } else {
    window.addEventListener('load', updateMuteLabel, { once: true });
  }
})();
