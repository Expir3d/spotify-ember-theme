/**
 * Ember Theme for Spicetify — v2.2.0
 * Custom animated dragon seekbar and top-bar controls
 * Tested on: Spotify 1.3.8 + Spicetify 2.46.4 (Windows desktop)
 */

(function emberInit() {

  var tries = 0;
  var MAX = 60; // 30s: Spotify 1.3.x + Spicetify 2.45+ can be slow to expose Spicetify.Player
  var seekbarInitialized = false;
  var seekbarRetryTimer = null;
  var activeCanvas = null;

  function waitForSpicetify() {
    tries++;
    if (!window.Spicetify || !Spicetify.Player || !Spicetify.Player.getProgress || !Spicetify.Player.getDuration) {
      if (tries < MAX) setTimeout(waitForSpicetify, 500);
      return;
    }
    onReady();
  }

  // === Safe wrappers ===
  function getProgress() {
    try {
      var p = Spicetify.Player.getProgress();
      if (typeof p !== "number" || p < 0 || p > 86400000) return 0; // cap at 24h
      return p;
    } catch (e) { return 0; }
  }

  function getDuration() {
    try {
      var d = Spicetify.Player.getDuration();
      if (typeof d !== "number" || d <= 0 || d > 86400000) return 1; // cap at 24h
      return d;
    } catch (e) { return 1; }
  }

  function seekTo(ratio) {
    try {
      var d = getDuration();
      if (d > 1) Spicetify.Player.seek(Math.max(0, Math.min(1, ratio)) * d);
    } catch (e) {}
  }

  // ============================================================
  //  STABLE ANCHORS — Spotify 1.3.3–1.3.8
  //  Find the player bar via stable data-testid attributes and
  //  tag it with .ember-top-player / .ember-center so CSS never
  //  depends on hashed Spotify class names alone.
  // ============================================================

  function findPlayerBar() {
    return document.querySelector('[data-testid="now-playing-bar"]')
      || document.querySelector('.Root__now-playing-bar')
      || (document.querySelector('footer [data-testid="now-playing-widget"]')
          ? document.querySelector('footer [data-testid="now-playing-widget"]').closest('footer')
          : null)
      || document.querySelector('footer');
  }

  function findCenterContainer(bar) {
    if (!bar) return null;
    var pb = bar.querySelector('[data-testid="playback-progressbar"]');
    if (pb) {
      var el = pb;
      for (var i = 0; i < 5 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        if (el.querySelector('[data-testid="control-button-playpause"]')) return el;
      }
      if (pb.parentElement) return pb.parentElement;
    }
    var controls = bar.querySelector('[data-testid="player-controls"]');
    if (controls && controls.parentElement) return controls.parentElement;
    return bar.querySelector('.main-nowPlayingBar-center, [class*="nowPlayingBar-center"]')
      || bar.children[1] || bar;
  }

  function markTopPlayer() {
    var bar = findPlayerBar();
    if (!bar) return null;
    bar.classList.add("ember-top-player");
    var cc = findCenterContainer(bar);
    if (cc) cc.classList.add("ember-center");
    var playBtn = bar.querySelector('[data-testid="control-button-playpause"]');
    if (playBtn) playBtn.classList.add("ember-playpause");
    return bar;
  }

  function observePlayerBar() {
    if (!window.MutationObserver || observePlayerBar._on) return;
    observePlayerBar._on = true;
    var mo = new MutationObserver(function() {
      var bar = markTopPlayer();
      if (bar && (!seekbarInitialized || !activeCanvas || !activeCanvas.isConnected)) {
        if (activeCanvas && !activeCanvas.isConnected) {
          seekbarInitialized = false;
        }
        initDragonSeekbar();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================================
  //  MAIN INIT
  // ============================================================

  function onReady() {
    console.log("Ember theme initialized");
    document.body.classList.add("ember-loaded");
    markTopPlayer();
    observePlayerBar();

    // Hide native seekbar
    hideNativeSeekbar();

    // Wire up control buttons
    wireControlButtons();

    // Init dragon seekbar (guarded so it only initializes once)
    setTimeout(function() {
      hideNativeSeekbar();
      initDragonSeekbar();
    }, 800);

    // Re-wire controls and re-hide timestamps after song changes
    if (Spicetify.Player.addEventListener) {
      Spicetify.Player.addEventListener("songchange", function() {
        setTimeout(function() {
          markTopPlayer();
          wireControlButtons();
          hideNativeSeekbar();
        }, 300);
      });
    }

    // Periodically re-hide native timestamps (Spotify re-renders them during playback)
    setInterval(hideNativeSeekbar, 2000);
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================

  function wireControlButtons() {
    var buttons = {
      "control-button-playpause":    function() { Spicetify.Player.togglePlay(); },
      "control-button-forward":      function() { Spicetify.Player.next(); },
      "control-button-skip-forward": function() { Spicetify.Player.next(); },
      "control-button-back":         function() { Spicetify.Player.back(); },
      "control-button-skip-back":    function() { Spicetify.Player.back(); },
      "control-button-shuffle":      function() { Spicetify.Player.toggleShuffle(); },
      "control-button-repeat":       function() { Spicetify.Player.toggleRepeat(); }
    };

    Object.keys(buttons).forEach(function(testId) {
      var btn = document.querySelector('[data-testid="' + testId + '"]');
      if (!btn) return;
      if (testId === "control-button-playpause") {
        btn.classList.add("ember-playpause");
      }

      if (btn.dataset.emberWired) return;
      btn.dataset.emberWired = "1";

      var handler = buttons[testId];

      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        handler();
      }, true);

      btn.addEventListener("mouseup", function(e) {
        if (e.button === 0) {
          handler();
        }
      }, true);
    });

    var volBtn = document.querySelector('[data-testid="volume-bar-toggle-mute-button"]');
    if (volBtn && !volBtn.dataset.emberWired) {
      volBtn.dataset.emberWired = "1";
      volBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        try { Spicetify.Player.toggleMute(); } catch (err) {}
      }, true);
    }
  }

  // ============================================================
  //  HIDE NATIVE SEEKBAR
  // ============================================================

  function hideNativeSeekbar() {
    var pbs = document.querySelectorAll(
      '[data-testid="playback-progressbar"],' +
      '.main-playbackBar-playbackBar,' +
      '[class*="playbackBar-playbackBar"]'
    );
    for (var i = 0; i < pbs.length; i++) {
      pbs[i].style.setProperty("display", "none", "important");
      pbs[i].style.setProperty("height", "0", "important");
    }

    var timeSelectors = [
      '[data-testid="playback-position"]',
      '[data-testid="playback-duration"]',
      '.main-playbackBar-progressTime',
      '.main-playbackBar-totalTime',
      '[class*="progressTime"]',
      '[class*="totalTime"]',
      '[class*="progress-time"]',
      '[class*="duration-time"]',
      '[class*="playback-bar__progress-time"]'
    ];
    var times = document.querySelectorAll(timeSelectors.join(","));
    for (var j = 0; j < times.length; j++) {
      times[j].style.setProperty("display", "none", "important");
      times[j].style.setProperty("visibility", "hidden", "important");
      times[j].style.setProperty("width", "0", "important");
      times[j].style.setProperty("overflow", "hidden", "important");
    }

    var barContainers = document.querySelectorAll('[class*="playbackBar"], [class*="PlaybackBar"], [class*="playback-bar"]');
    for (var k = 0; k < barContainers.length; k++) {
      var spans = barContainers[k].querySelectorAll("span");
      for (var m = 0; m < spans.length; m++) {
        var text = spans[m].textContent.trim();
        if (/^\d{1,3}:\d{2}$/.test(text)) {
          spans[m].style.setProperty("display", "none", "important");
          spans[m].style.setProperty("visibility", "hidden", "important");
        }
      }
    }
  }

  // ============================================================
  //  DRAGON SEEKBAR
  // ============================================================

  var particles = [];
  var MAX_P = 35;
  var frameCount = 0;

  function initDragonSeekbar() {
    // Single-init guard: never create a second canvas or render loop if already active
    if (seekbarInitialized && activeCanvas && activeCanvas.isConnected) {
      return;
    }

    var bar = findPlayerBar();
    var cc = findCenterContainer(bar);
    if (!cc || !bar) {
      if (!seekbarRetryTimer) {
        seekbarRetryTimer = setTimeout(function() {
          seekbarRetryTimer = null;
          initDragonSeekbar();
        }, 600);
      }
      return;
    }

    if (seekbarRetryTimer) {
      clearTimeout(seekbarRetryTimer);
      seekbarRetryTimer = null;
    }

    seekbarInitialized = true;
    cc.classList.add("ember-center");

    // Cleanup any stale elements before mounting
    var old1 = document.getElementById("ember-waveform");
    if (old1) old1.remove();
    var old2 = document.getElementById("ember-seek-overlay");
    if (old2) old2.remove();

    var H = 32;

    // Dragon head image (v2.6.0): a designed picture, not code paths.
    // Embedded as a data URI so the theme has no separate file to lose.
    var headImg = new Image();
    headImg.src = "data:image/png;base64,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";

    // Canvas (visual only)
    var canvas = document.createElement("canvas");
    canvas.id = "ember-waveform";
    canvas.style.cssText = "position:absolute;left:0;bottom:-4px;width:100%;height:" + H + "px;z-index:1;pointer-events:none;display:block;background:transparent";
    activeCanvas = canvas;

    // Seek overlay (handles clicks)
    var ov = document.createElement("div");
    ov.id = "ember-seek-overlay";
    ov.style.cssText = "position:absolute;left:0;bottom:-4px;width:100%;height:" + H + "px;z-index:2;pointer-events:auto;cursor:pointer;background:transparent";

    cc.appendChild(canvas);
    cc.appendChild(ov);

    var dpr = window.devicePixelRatio || 1;
    var ctx = canvas.getContext("2d");
    var W = 400, startX = 60, endX = W - 60, bodyEnd = endX - 35, cY = H / 2 + 2, headLeft = bodyEnd - 26;
    // v2.6.1: the body line + playhead stop at headLeft, 2px before the picture head (bodyEnd-24), so the seekbar never overlaps the head.

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.round(r.width) || 400;
      var tw = Math.round(w * dpr), th = Math.round(H * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw; canvas.height = th;
        W = w; endX = W - 60; bodyEnd = endX - 35; headLeft = bodyEnd - 26;
        ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
      }
    }

    function ratio(cx) {
      var r = ov.getBoundingClientRect();
      var x = cx - r.left - startX;
      return Math.min(1, Math.max(0, x / (headLeft - startX)));
    }

    var drag = false;
    var seekOverrideRatio = -1;
    var seekOverrideTime = 0;
    var SEEK_OVERRIDE_MS = 200;
    var lastSeekTime = 0;

    function seekWithOverride(r) {
      var now = Date.now();
      seekOverrideRatio = r;
      seekOverrideTime = now;
      if (now - lastSeekTime > 100) {
        lastSeekTime = now;
        seekTo(r);
      }
    }

    ov.addEventListener("mousedown", function(e) { drag = true; seekWithOverride(ratio(e.clientX)); });
    window.addEventListener("mousemove", function(e) { if (drag) seekWithOverride(ratio(e.clientX)); });
    window.addEventListener("mouseup", function() { drag = false; });

    function dragonY(x, t) {
      if (x < startX || x > bodyEnd) return cY;
      var r = (x - startX) / (bodyEnd - startX);
      var y = -Math.sin(r * Math.PI) * 1 - Math.sin(r * Math.PI * 2) * 3.5 + Math.cos(r * Math.PI * 1.5) * 1;
      var prog = getProgress() / getDuration();
      var lim = startX + (headLeft - startX) * prog;
      if (x <= lim) y += Math.sin(x * 0.08 - t * 8) * 0.8 * Math.sin(r * Math.PI);
      return cY + y;
    }

    function spawnP(mx) {
      var safeStart = startX + 6;
      var safeMax = Math.max(safeStart, mx - 4);
      var x = safeStart + Math.random() * (safeMax - safeStart);
      var isSpark = Math.random() < 0.7;
      if (isSpark) {
        return {
          type: "spark", x: x, y: dragonY(x, Date.now() / 1000),
          vx: (Math.random() - 0.5) * 3.0, vy: -(Math.random() * 1.5 + 1.5),
          life: 20 + Math.random() * 15, maxLife: 35,
          angle: Math.random() * Math.PI * 2, len: 3 + Math.random() * 5
        };
      } else {
        return {
          type: "wisp", x: x, y: dragonY(x, Date.now() / 1000),
          vx: (Math.random() - 0.5) * 0.6, vy: -(Math.random() * 0.6 + 0.4),
          life: 50 + Math.random() * 40, maxLife: 90,
          seed: Math.random() * Math.PI * 2, h: 6 + Math.random() * 3
        };
      }
    }

    function fmt(ms) {
      if (!ms || ms < 0 || ms > 36000000) return "0:00";
      var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s = s % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    var dead = false;
    function render() {
      if (dead || canvas !== activeCanvas || !canvas.isConnected) {
        dead = true;
        return;
      }
      requestAnimationFrame(render);
      resize();
      ctx.clearRect(0, 0, W, H);

      var dur = getDuration(), cur = getProgress();
      var prog = Math.min(1, Math.max(0, cur / dur));

      // Use visual override during seek transition
      if (seekOverrideRatio >= 0 && (Date.now() - seekOverrideTime) < SEEK_OVERRIDE_MS) {
        prog = seekOverrideRatio;
      } else {
        seekOverrideRatio = -1;
      }

      var t = Date.now() / 1000;
      var cx = startX + (headLeft - startX) * prog;
      var cy = dragonY(cx, t);

      frameCount++;

      // Unplayed body — subtle pulse
      if (cx < headLeft) {
        var pulseA = Math.sin(t * 1.5) * 0.06 + 0.16;
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy);
        for (var x = Math.ceil(cx); x <= headLeft; x += 2) ctx.lineTo(x, dragonY(x, t));
        ctx.strokeStyle = "rgba(255,61,0," + pulseA.toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4; ctx.shadowColor = "rgba(255,61,0,0.3)";
        ctx.stroke(); ctx.restore();
      }

      // Played body — 4-layer glow
      if (cx > startX) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(startX, dragonY(startX, t));
        for (var x2 = startX + 2; x2 <= cx; x2 += 2) ctx.lineTo(x2, dragonY(x2, t));
        // Layer 1: wide heat haze
        ctx.strokeStyle = "rgba(255,30,0,0.06)"; ctx.lineWidth = 8;
        ctx.shadowBlur = 0; ctx.stroke();
        // Layer 2: deep glow
        ctx.strokeStyle = "rgba(139,0,0,0.5)"; ctx.lineWidth = 5.5;
        ctx.shadowBlur = 6; ctx.shadowColor = "#8B0000"; ctx.stroke();
        // Layer 3: bright core
        ctx.strokeStyle = "#FF3D00"; ctx.lineWidth = 3;
        ctx.shadowBlur = 8; ctx.shadowColor = "#FF3D00"; ctx.stroke();
        // Layer 4: hot white center
        ctx.strokeStyle = "#FFF0AA"; ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0; ctx.stroke();
        ctx.restore();
      }

      // Dragon head v2.6.1 — IMAGE head, not code paths. v2.6.1 fix: body + playhead stop before the head (no overlap), flatter wave + lower line so the seekbar clears the control buttons.
      // The designed dragon picture (48x26 on screen, 192x104 source for HiDPI),
      // drawn centred on (bodyEnd, cY) — the same spot and size as the mockup.
      // Until the picture decodes, draw nothing (the body + playhead still show).
      // At the end of the track the glow just gets a little stronger.
      if (headImg.complete && headImg.naturalWidth > 0) {
        ctx.save();
        ctx.shadowBlur = prog > 0.95 ? 12 : 7;
        ctx.shadowColor = "rgba(255,61,0,0.55)";
        ctx.drawImage(headImg, bodyEnd - 24, cY - 13, 48, 26);
        ctx.restore();
      }

      // Particles — sparks and wisps (clamped away from timestamp zones)
      particles = particles.filter(function(p) {
        return p.life > 0 && p.x >= startX + 2 && p.x <= headLeft;
      });
      if (prog > 0.02 && prog < 0.99 && particles.length < MAX_P) particles.push(spawnP(cx));
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.life--;
        var a = Math.max(0, p.life / p.maxLife);

        if (p.type === "spark") {
          p.vx *= 0.94; p.vy *= 0.94;
          p.x += p.vx; p.y += p.vy;
          var r1 = 255; var g1 = Math.floor(220 - (1 - a) * 160); var b1 = Math.floor(80 * a);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(p.angle) * p.len * a, p.y + Math.sin(p.angle) * p.len * a);
          ctx.strokeStyle = "rgba(" + r1 + "," + g1 + "," + b1 + "," + (a * 0.85).toFixed(3) + ")";
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        } else {
          p.x += p.vx + Math.sin(frameCount * 0.15 + p.seed) * 0.3;
          p.y += p.vy;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
          var rg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.h * a * 0.6);
          rg.addColorStop(0, "rgba(255,100,0," + (0.8 * a).toFixed(3) + ")");
          rg.addColorStop(0.5, "rgba(255,61,0," + (0.3 * a).toFixed(3) + ")");
          rg.addColorStop(1, "rgba(255,61,0,0)");
          ctx.beginPath();
          ctx.moveTo(0, -p.h * a * 0.5);
          ctx.bezierCurveTo(2 * a, -p.h * a * 0.2, 2 * a, p.h * a * 0.2, 0, p.h * a * 0.5);
          ctx.bezierCurveTo(-2 * a, p.h * a * 0.2, -2 * a, -p.h * a * 0.2, 0, -p.h * a * 0.5);
          ctx.fillStyle = rg;
          ctx.fill();
          ctx.restore();
        }
      }

      // Playhead
      if (prog > 0 && prog < 0.99) {
        ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = "#FF3D00";
        var px = Math.min(cx, headLeft - 5), py = dragonY(px, t);
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fillStyle = "#FF5500"; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill();
        ctx.restore();
      }

      // Timestamps
      ctx.save();
      ctx.font = "bold 11px -apple-system,system-ui,sans-serif"; ctx.textBaseline = "middle";
      ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,200,150,0.85)";
      ctx.fillText(fmt(cur), startX - 12, cY);
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,200,150,0.55)";
      ctx.fillText(fmt(dur), endX + 12, cY);
      ctx.restore();
    }

    console.log("Dragon seekbar initialized");
    render();
  }

  waitForSpicetify();
})();