/**
 * Ember Theme for Spicetify
 * Custom animated seekbar and controls
 */

(function emberInit() {

  var tries = 0;
  var MAX = 30;

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
    } catch(e) { return 0; }
  }

  function getDuration() {
    try {
      var d = Spicetify.Player.getDuration();
      if (typeof d !== "number" || d <= 0 || d > 86400000) return 1; // cap at 24h
      return d;
    } catch(e) { return 1; }
  }

  function seekTo(ratio) {
    try {
      var d = getDuration();
      if (d > 1) Spicetify.Player.seek(Math.max(0, Math.min(1, ratio)) * d);
    } catch(e) {}
  }

  // ============================================================
  //  MAIN INIT
  // ============================================================

  function onReady() {
    console.log("Ember theme initialized");
    document.body.classList.add("ember-loaded");

    // Hide native seekbar
    hideNativeSeekbar();

    // Wire up control buttons
    wireControlButtons();

    // Init dragon seekbar
    setTimeout(function() {
      hideNativeSeekbar();
      initDragonSeekbar();
    }, 800);

    // Re-wire controls and re-hide timestamps after song changes
    if (Spicetify.Player.addEventListener) {
      Spicetify.Player.addEventListener("songchange", function() {
        setTimeout(function() {
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
    // Map of button test-ids to Spicetify API calls
    var buttons = {
      "control-button-playpause": function() { Spicetify.Player.togglePlay(); },
      "control-button-forward":   function() { Spicetify.Player.next(); },
      "control-button-skip-forward": function() { Spicetify.Player.next(); },
      "control-button-back":      function() { Spicetify.Player.back(); },
      "control-button-skip-back": function() { Spicetify.Player.back(); },
      "control-button-shuffle":   function() { Spicetify.Player.toggleShuffle(); },
      "control-button-repeat":    function() { Spicetify.Player.toggleRepeat(); }
    };

    Object.keys(buttons).forEach(function(testId) {
      var btn = document.querySelector('[data-testid="' + testId + '"]');
      if (!btn) return;

      // Skip if already wired
      if (btn.dataset.emberWired) return;
      btn.dataset.emberWired = "1";

      var handler = buttons[testId];

      // Add click handler on capture phase
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        handler();
      }, true);

      // Also handle mousedown -> mouseup as a click (backup)
      btn.addEventListener("mouseup", function(e) {
        if (e.button === 0) {
          handler();
        }
      }, true);

    });

    // Wire volume button (mute toggle)
    var volBtn = document.querySelector('[data-testid="volume-bar-toggle-mute-button"]');
    if (volBtn && !volBtn.dataset.emberWired) {
      volBtn.dataset.emberWired = "1";
      volBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        try { Spicetify.Player.toggleMute(); } catch(err) {}
      }, true);
    }
  }

  // ============================================================
  //  HIDE NATIVE SEEKBAR
  // ============================================================

  function hideNativeSeekbar() {
    // Hide progress bar
    var pbs = document.querySelectorAll(
      '[data-testid="playback-progressbar"],' +
      '.main-playbackBar-playbackBar,' +
      '[class*="playbackBar-playbackBar"]'
    );
    for (var i = 0; i < pbs.length; i++) {
      pbs[i].style.setProperty("display", "none", "important");
      pbs[i].style.setProperty("height", "0", "important");
    }

    // Hide ALL timestamp elements — very broad selectors
    var timeSelectors = [
      '.main-playbackBar-progressTime',
      '.main-playbackBar-totalTime',
      '[class*="progressTime"]',
      '[class*="totalTime"]',
      '[class*="progress-time"]',
      '[class*="duration-time"]',
      '[class*="playback-bar__progress-time"]'
    ];
    var times = document.querySelectorAll(timeSelectors.join(","));
    for (var i = 0; i < times.length; i++) {
      times[i].style.setProperty("display", "none", "important");
      times[i].style.setProperty("visibility", "hidden", "important");
      times[i].style.setProperty("width", "0", "important");
      times[i].style.setProperty("overflow", "hidden", "important");
    }

    // Also find any span inside playbackBar containers that looks like a timestamp
    var barContainers = document.querySelectorAll('[class*="playbackBar"], [class*="PlaybackBar"], [class*="playback-bar"]');
    for (var i = 0; i < barContainers.length; i++) {
      var spans = barContainers[i].querySelectorAll("span");
      for (var j = 0; j < spans.length; j++) {
        var text = spans[j].textContent.trim();
        // If it looks like a timestamp (e.g. "0:45", "3:03", "12:34")
        if (/^\d{1,3}:\d{2}$/.test(text)) {
          spans[j].style.setProperty("display", "none", "important");
          spans[j].style.setProperty("visibility", "hidden", "important");
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
    var cc = document.querySelector('.main-nowPlayingBar-center, [class*="nowPlayingBar-center"]');
    if (!cc) { setTimeout(initDragonSeekbar, 600); return; }

    // Cleanup
    var old1 = document.getElementById("ember-waveform");
    if (old1) old1.remove();
    var old2 = document.getElementById("ember-seek-overlay");
    if (old2) old2.remove();

    var H = 32;

    // Canvas (visual only)
    var canvas = document.createElement("canvas");
    canvas.id = "ember-waveform";
    canvas.style.cssText = "position:absolute;left:0;bottom:-4px;width:100%;height:" + H + "px;z-index:1;pointer-events:none;display:block;background:transparent";

    // Seek overlay (handles clicks)
    var ov = document.createElement("div");
    ov.id = "ember-seek-overlay";
    ov.style.cssText = "position:absolute;left:0;bottom:-4px;width:100%;height:" + H + "px;z-index:2;pointer-events:auto;cursor:pointer;background:transparent";

    cc.appendChild(canvas);
    cc.appendChild(ov);

    var dpr = window.devicePixelRatio || 1;
    var ctx = canvas.getContext("2d");
    var W = 400, startX = 60, endX = W - 60, bodyEnd = endX - 35, cY = H / 2;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.round(r.width) || 400;
      var tw = Math.round(w * dpr), th = Math.round(H * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw; canvas.height = th;
        W = w; endX = W - 60; bodyEnd = endX - 35;
        ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
      }
    }

    function ratio(cx) {
      var r = ov.getBoundingClientRect();
      var x = cx - r.left - startX;
      return Math.min(1, Math.max(0, x / (bodyEnd - startX)));
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
      var y = -Math.sin(r * Math.PI) * 1.5 - Math.sin(r * Math.PI * 2) * 6.5 + Math.cos(r * Math.PI * 1.5) * 1.8;
      var prog = getProgress() / getDuration();
      var lim = startX + (bodyEnd - startX) * prog;
      if (x <= lim) y += Math.sin(x * 0.08 - t * 8) * 0.8 * Math.sin(r * Math.PI);
      return cY + y;
    }

    function spawnP(mx) {
      var x = startX + Math.random() * (mx - startX);
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
      if (dead) return;
      requestAnimationFrame(render);
      if (!document.getElementById("ember-waveform")) { dead = true; return; }
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
      var cx = startX + (bodyEnd - startX) * prog;
      var cy = dragonY(cx, t);

      frameCount++;

      // Unplayed body — subtle pulse
      if (cx < bodyEnd) {
        var pulseA = Math.sin(t * 1.5) * 0.06 + 0.16;
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy);
        for (var x = Math.ceil(cx); x <= bodyEnd; x += 2) ctx.lineTo(x, dragonY(x, t));
        ctx.strokeStyle = "rgba(255,61,0," + pulseA.toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 4; ctx.shadowColor = "rgba(255,61,0,0.3)";
        ctx.stroke(); ctx.restore();
      }

      // Played body — 4-layer glow
      if (cx > startX) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(startX, dragonY(startX, t));
        for (var x = startX + 2; x <= cx; x += 2) ctx.lineTo(x, dragonY(x, t));
        // Layer 1: wide heat haze
        ctx.strokeStyle = "rgba(255,30,0,0.06)"; ctx.lineWidth = 12;
        ctx.shadowBlur = 0; ctx.stroke();
        // Layer 2: deep glow
        ctx.strokeStyle = "rgba(139,0,0,0.5)"; ctx.lineWidth = 5.5;
        ctx.shadowBlur = 10; ctx.shadowColor = "#8B0000"; ctx.stroke();
        // Layer 3: bright core
        ctx.strokeStyle = "#FF3D00"; ctx.lineWidth = 3;
        ctx.shadowBlur = 14; ctx.shadowColor = "#FF3D00"; ctx.stroke();
        // Layer 4: hot white center
        ctx.strokeStyle = "#FFF0AA"; ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0; ctx.stroke();
        ctx.restore();
      }

      // Dragon head — organic bezier serpent
      (function(hx, hy, g) {
        ctx.save();
        var sc = g ? 1.3 : 1.0;
        ctx.translate(hx, hy);
        ctx.scale(sc, sc);

        if (g) { ctx.shadowBlur = 20; ctx.shadowColor = "#FF3D00"; }

        // Head shape with bezier curves
        ctx.beginPath();
        ctx.moveTo(-5, 3);                                          // neck bottom
        ctx.bezierCurveTo(-3, 5, 2, 5, 6, 3);                     // lower jaw curve
        ctx.bezierCurveTo(9, 2.2, 13, 1.5, 16, 0.8);              // lower jaw tip
        ctx.lineTo(16, -0.8);                                      // mouth gap
        ctx.bezierCurveTo(13, -1.5, 9, -2, 6, -3);                // upper jaw inner
        ctx.bezierCurveTo(3, -4, 1, -5, -1, -5.5);                // upper skull
        // Horn
        ctx.bezierCurveTo(-1, -8, 1, -10, 3, -11);                // horn tip
        ctx.bezierCurveTo(1, -9, -1, -7, -2, -5.5);               // horn return
        ctx.bezierCurveTo(-4, -4.5, -5, -3, -5, -1);              // back of head
        ctx.closePath();

        var headGrad = ctx.createLinearGradient(-5, 0, 16, 0);
        headGrad.addColorStop(0, g ? "rgba(255,61,0,0.7)" : "rgba(255,61,0,0.25)");
        headGrad.addColorStop(1, g ? "rgba(255,140,0,0.9)" : "rgba(255,61,0,0.45)");
        ctx.fillStyle = headGrad;
        ctx.fill();
        ctx.strokeStyle = g ? "#FFAA00" : "rgba(255,120,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(4, -2.5, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#FFAA00"; ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -2.5, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF"; ctx.fill();

        // Flame breath from mouth
        var angles = [-0.26, 0, 0.17, 0.35];
        var lengths = [18, 22, 16, 12];
        var widths = [2.0, 2.5, 1.5, 1.2];
        for (var fi = 0; fi < angles.length; fi++) {
          var flicker = Math.sin(t * 12 + fi * 2.5) * 3;
          var fLen = lengths[fi] + flicker;
          var fAngle = angles[fi] + Math.sin(t * 8 + fi) * 0.05;
          var fx = 16, fy = 0;
          var tipX = fx + Math.cos(fAngle) * fLen;
          var tipY = fy + Math.sin(fAngle) * fLen;
          var cpX = fx + Math.cos(fAngle) * fLen * 0.5;
          var cpY = fy + Math.sin(fAngle) * fLen * 0.5 + (Math.sin(t * 10 + fi) * 1.5);

          var flameGrad = ctx.createLinearGradient(fx, fy, tipX, tipY);
          flameGrad.addColorStop(0, g ? "rgba(255,200,50,0.95)" : "rgba(255,61,0,0.9)");
          flameGrad.addColorStop(0.6, "rgba(255,120,0,0.4)");
          flameGrad.addColorStop(1, "rgba(255,200,0,0)");

          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.strokeStyle = flameGrad;
          ctx.lineWidth = widths[fi];
          ctx.lineCap = "round";
          ctx.stroke();
        }

        ctx.restore();
      })(bodyEnd, cY, prog > 0.95);

      // Particles — sparks and wisps
      particles = particles.filter(function(p) { return p.life > 0; });
      if (prog > 0.01 && prog < 0.99 && particles.length < MAX_P) particles.push(spawnP(cx));
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.life--;
        var a = Math.max(0, p.life / p.maxLife);

        if (p.type === "spark") {
          // Decelerate
          p.vx *= 0.94; p.vy *= 0.94;
          p.x += p.vx; p.y += p.vy;
          // Draw as a short line segment
          var r1 = Math.floor(255); var g1 = Math.floor(220 - (1 - a) * 160); var b1 = Math.floor(80 * a);
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
          // Wisp — wobble and drift
          p.x += p.vx + Math.sin(frameCount * 0.15 + p.seed) * 0.3;
          p.y += p.vy;
          // Draw as a teardrop with radial gradient
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
          var rg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.h * a * 0.6);
          rg.addColorStop(0, "rgba(255,100,0," + (0.8 * a).toFixed(3) + ")");
          rg.addColorStop(0.5, "rgba(255,61,0," + (0.3 * a).toFixed(3) + ")");
          rg.addColorStop(1, "rgba(255,61,0,0)");
          ctx.beginPath();
          // Teardrop: two bezier arcs
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
        ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fillStyle = "#FF5500"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill();
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
