/**
 * Ember Theme for Spicetify — v2.2
 * Dragon seekbar:
 *   • Dragon HEAD locked at the RIGHT END (bodyEnd), seamlessly connected to wave
 *   • Head bobs with the wave endpoint so neck always feels integrated
 *   • 3-layer glow stacking: dark-red outer → orange mid → yellow-white hot core
 *   • Playhead = small glowing orb that moves with progress
 *   • Embers drift upward from the played trail
 */

(function emberInit() {

  var tries = 0;
  var MAX   = 30;

  function waitForSpicetify() {
    tries++;
    if (!window.Spicetify || !Spicetify.Player ||
        !Spicetify.Player.getProgress || !Spicetify.Player.getDuration) {
      if (tries < MAX) setTimeout(waitForSpicetify, 500);
      return;
    }
    onReady();
  }

  // ── Safe API wrappers ──────────────────────────────────────────────────────
  function getProgress() {
    try {
      var p = Spicetify.Player.getProgress();
      return (typeof p === 'number' && p >= 0 && p <= 86400000) ? p : 0;
    } catch(e) { return 0; }
  }

  function getDuration() {
    try {
      var d = Spicetify.Player.getDuration();
      return (typeof d === 'number' && d > 0 && d <= 86400000) ? d : 1;
    } catch(e) { return 1; }
  }

  function seekTo(ratio) {
    try {
      var d = getDuration();
      if (d > 1) Spicetify.Player.seek(Math.max(0, Math.min(1, ratio)) * d);
    } catch(e) {}
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  function onReady() {
    console.log('Ember theme v2.2 initialized');
    document.body.classList.add('ember-loaded');
    hideNativeSeekbar();
    wireControlButtons();
    setTimeout(function() { hideNativeSeekbar(); initDragonSeekbar(); }, 800);
    if (Spicetify.Player.addEventListener) {
      Spicetify.Player.addEventListener('songchange', function() {
        setTimeout(function() { wireControlButtons(); hideNativeSeekbar(); }, 300);
      });
    }
    setInterval(hideNativeSeekbar, 2000);
  }

  // ── Control buttons ────────────────────────────────────────────────────────
  function wireControlButtons() {
    var map = {
      'control-button-playpause':    function() { Spicetify.Player.togglePlay(); },
      'control-button-forward':      function() { Spicetify.Player.next(); },
      'control-button-skip-forward': function() { Spicetify.Player.next(); },
      'control-button-back':         function() { Spicetify.Player.back(); },
      'control-button-skip-back':    function() { Spicetify.Player.back(); },
      'control-button-shuffle':      function() { Spicetify.Player.toggleShuffle(); },
      'control-button-repeat':       function() { Spicetify.Player.toggleRepeat(); }
    };
    Object.keys(map).forEach(function(id) {
      var btn = document.querySelector('[data-testid="' + id + '"]');
      if (!btn || btn.dataset.emberWired) return;
      btn.dataset.emberWired = '1';
      var fn = map[id];
      btn.addEventListener('click',   function(e){ e.stopPropagation(); e.preventDefault(); fn(); }, true);
      btn.addEventListener('mouseup', function(e){ if (e.button === 0) fn(); }, true);
    });
    var vol = document.querySelector('[data-testid="volume-bar-toggle-mute-button"]');
    if (vol && !vol.dataset.emberWired) {
      vol.dataset.emberWired = '1';
      vol.addEventListener('click', function(e){
        e.stopPropagation(); e.preventDefault();
        try { Spicetify.Player.toggleMute(); } catch(err) {}
      }, true);
    }
  }

  // ── Hide native seekbar ────────────────────────────────────────────────────
  function hideNativeSeekbar() {
    var pbs = document.querySelectorAll(
      '[data-testid="playback-progressbar"],' +
      '.main-playbackBar-playbackBar,' +
      '[class*="playbackBar-playbackBar"]'
    );
    for (var i = 0; i < pbs.length; i++) {
      pbs[i].style.setProperty('display', 'none', 'important');
      pbs[i].style.setProperty('height',  '0',    'important');
    }
    var ts = document.querySelectorAll([
      '.main-playbackBar-progressTime', '.main-playbackBar-totalTime',
      '[class*="progressTime"]', '[class*="totalTime"]',
      '[class*="progress-time"]', '[class*="duration-time"]',
      '[class*="playback-bar__progress-time"]'
    ].join(','));
    for (var i = 0; i < ts.length; i++) {
      ts[i].style.setProperty('display',    'none',   'important');
      ts[i].style.setProperty('visibility', 'hidden', 'important');
      ts[i].style.setProperty('width',      '0',      'important');
      ts[i].style.setProperty('overflow',   'hidden', 'important');
    }
    var bars = document.querySelectorAll('[class*="playbackBar"],[class*="PlaybackBar"],[class*="playback-bar"]');
    for (var i = 0; i < bars.length; i++) {
      var spans = bars[i].querySelectorAll('span');
      for (var j = 0; j < spans.length; j++) {
        if (/^\d{1,3}:\d{2}$/.test(spans[j].textContent.trim())) {
          spans[j].style.setProperty('display',    'none',   'important');
          spans[j].style.setProperty('visibility', 'hidden', 'important');
        }
      }
    }
  }

  // ============================================================
  // DRAGON SEEKBAR v2.2
  // ============================================================

  var particles = [];
  var MAX_P     = 70;
  var frameN    = 0;

  function initDragonSeekbar() {
    var cc = document.querySelector('.main-nowPlayingBar-center,[class*="nowPlayingBar-center"]');
    if (!cc) { setTimeout(initDragonSeekbar, 600); return; }

    ['ember-waveform', 'ember-seek-overlay'].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.remove();
    });

    var H = 50;

    var canvas = document.createElement('canvas');
    canvas.id = 'ember-waveform';
    canvas.style.cssText =
      'position:absolute;left:0;bottom:-9px;width:100%;height:' + H + 'px;' +
      'z-index:1;pointer-events:none;display:block;background:transparent;';

    var ov = document.createElement('div');
    ov.id = 'ember-seek-overlay';
    ov.style.cssText =
      'position:absolute;left:0;bottom:-9px;width:100%;height:' + H + 'px;' +
      'z-index:2;pointer-events:auto;cursor:pointer;background:transparent;';

    cc.appendChild(canvas);
    cc.appendChild(ov);

    var dpr  = window.devicePixelRatio || 1;
    var ctx  = canvas.getContext('2d');

    // Layout — recalculated on resize
    var W = 400, startX = 72, endX = 328, bodyEnd = 300, cY = H * 0.52;

    function updateLayout() {
      var r  = canvas.getBoundingClientRect();
      var w  = Math.round(r.width) || 400;
      var tw = Math.round(w * dpr), th = Math.round(H * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width  = tw;
        canvas.height = th;
        ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
      }
      W       = w;
      endX    = W - 72;
      bodyEnd = W - 98;     // head's left neck starts ~16px before this
      cY      = H * 0.52;
    }

    // Seek ratio from click
    function clickRatio(clientX) {
      var r = ov.getBoundingClientRect();
      return Math.min(1, Math.max(0, (clientX - r.left - startX) / (bodyEnd - startX)));
    }
    var drag = false;
    ov.addEventListener('mousedown', function(e) { drag = true; seekTo(clickRatio(e.clientX)); });
    window.addEventListener('mousemove', function(e) { if (drag) seekTo(clickRatio(e.clientX)); });
    window.addEventListener('mouseup', function() { drag = false; });
    ov.addEventListener('click', function(e) { seekTo(clickRatio(e.clientX)); });

    // ── Living multi-sine waveform ─────────────────────────────────────────
    //    Amplitude envelope stays non-zero at bodyEnd so the head bobs
    function bodyY(x, t) {
      var r   = Math.min(1, Math.max(0, (x - startX) / (bodyEnd - startX)));
      // Envelope: rises from 4 at edges to 13 in the middle
      var env = 4 + Math.pow(Math.sin(r * Math.PI), 0.55) * 9;
      var y   = (Math.sin(x * 0.038 - t * 5.2) * 0.53
               + Math.sin(x * 0.076 + t * 3.4) * 0.30
               + Math.sin(x * 0.016 - t * 2.1) * 0.17) * env;
      return cY + y;
    }

    // ── Particle factories ────────────────────────────────────────────────
    function mkEmber(x, y) {
      return {
        type: 'ember',
        x: x + (Math.random() - 0.5) * 12,
        y: y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.18 + Math.random() * 0.45),
        life: 60 + Math.random() * 70,
        maxLife: 130,
        size: 0.7 + Math.random() * 1.5,
        g: Math.floor(50 + Math.random() * 140)
      };
    }

    function mkSpark(x, y) {
      var a = (Math.random() - 0.5) * Math.PI * 1.4;
      var s = 0.5 + Math.random() * 1.6;
      return {
        type: 'spark',
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 10 + Math.random() * 16,
        maxLife: 26,
        size: 0.5 + Math.random() * 1.1,
        g: Math.floor(80 + Math.random() * 140)
      };
    }

    // ── Particle renderer ─────────────────────────────────────────────────
    function drawParticle(p) {
      var a = Math.max(0, p.life / p.maxLife);
      ctx.save();
      if (p.type === 'ember') {
        var rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        rg.addColorStop(0,   'rgba(255,230,100,' + a + ')');
        rg.addColorStop(0.4, 'rgba(255,' + p.g + ',0,' + (a * 0.7) + ')');
        rg.addColorStop(1,   'rgba(200,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = rg;
        ctx.fill();
      } else {
        // spark streak
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
        ctx.strokeStyle = 'rgba(255,' + p.g + ',0,' + (a * 0.9) + ')';
        ctx.lineWidth   = p.size * a;
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 4;
        ctx.shadowColor = 'rgba(255,100,0,0.8)';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,240,120,' + (a * 0.7) + ')';
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Draw dragon head ─────────────────────────────────────────────────
    //    hx = bodyEnd, hy = bodyY(bodyEnd, t)
    //    Head faces RIGHT. Neck seamlessly connects to waveform body.
    //    Two backward-swept horns, open jaws, glowing slit eye, energy whiskers.
    function drawDragonHead(hx, hy, t) {
      ctx.save();

      // 1. Pulsing outer aura
      var pulse = 0.28 + Math.abs(Math.sin(t * 2.8)) * 0.14;
      var aura  = ctx.createRadialGradient(hx + 5, hy, 0, hx + 5, hy, 36);
      aura.addColorStop(0,   'rgba(255,110,0,' + pulse + ')');
      aura.addColorStop(0.5, 'rgba(255,40,0,'  + (pulse * 0.3) + ')');
      aura.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(hx + 5, hy, 36, 0, Math.PI * 2);
      ctx.fillStyle = aura;
      ctx.fill();

      // 2. Fire breath (3 wisps from open mouth shooting rightward)
      var blen = 18 + Math.abs(Math.sin(t * 6.5)) * 9;
      [0, -2.2, 2.2].forEach(function(oy, bi) {
        var bg = ctx.createLinearGradient(hx + 24, 0, hx + 24 + blen, 0);
        bg.addColorStop(0,    'rgba(255,220,60,0.72)');
        bg.addColorStop(0.45, 'rgba(255,90,0,0.42)');
        bg.addColorStop(1,    'rgba(255,20,0,0)');
        ctx.beginPath();
        ctx.moveTo(hx + 24, hy + oy * 0.35);
        ctx.quadraticCurveTo(
          hx + 24 + blen * 0.45,
          hy + oy + Math.sin(t * 11 + bi * 1.2) * 2.4,
          hx + 24 + blen,
          hy + oy * 0.2
        );
        ctx.strokeStyle = bg;
        ctx.lineWidth   = 3.0 - bi * 0.65;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = 'rgba(255,160,0,0.5)';
        ctx.stroke();
      });

      // 3. Lower jaw
      ctx.shadowBlur  = 12;
      ctx.shadowColor = '#991100';
      ctx.beginPath();
      ctx.moveTo(hx - 17, hy + 4);
      ctx.lineTo(hx - 7,  hy + 6.5);
      ctx.lineTo(hx + 3,  hy + 7);
      ctx.lineTo(hx + 12, hy + 6);
      ctx.lineTo(hx + 19, hy + 4.8);
      ctx.lineTo(hx + 24, hy + 3.5);   // lower snout tip
      // inner return
      ctx.lineTo(hx + 22, hy + 1.5);
      ctx.lineTo(hx + 14, hy + 2.5);
      ctx.lineTo(hx + 3,  hy + 3.2);
      ctx.lineTo(hx - 7,  hy + 3.5);
      ctx.lineTo(hx - 17, hy + 3);
      ctx.closePath();
      ctx.fillStyle   = 'rgba(95,7,0,0.93)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,75,15,0.45)';
      ctx.lineWidth   = 0.85;
      ctx.stroke();

      // 4. Upper jaw + full head (with two backward-swept horns)
      ctx.shadowBlur  = 20;
      ctx.shadowColor = '#FF3D00';
      ctx.beginPath();
      ctx.moveTo(hx - 17, hy - 3.5);   // neck top
      ctx.lineTo(hx - 10, hy - 7);     // back of skull
      ctx.lineTo(hx - 6,  hy - 11);    // horn 1 root
      ctx.lineTo(hx -  1, hy - 20);    // horn 1 tip  (tall, swept back)
      ctx.lineTo(hx +  3, hy - 13);    // saddle between horns
      ctx.lineTo(hx +  2, hy - 18);    // horn 2 tip  (slightly shorter)
      ctx.lineTo(hx +  6, hy - 11);    // horn 2 base
      ctx.lineTo(hx + 12, hy - 7.5);   // forehead slope
      ctx.lineTo(hx + 18, hy - 4);     // snout bridge
      ctx.lineTo(hx + 23, hy - 1);     // upper lip
      ctx.lineTo(hx + 25, hy + 0.5);   // upper snout tip  — open mouth gap starts
      // inner jaw return
      ctx.lineTo(hx + 23, hy + 1.5);
      ctx.lineTo(hx + 16, hy + 1);
      ctx.lineTo(hx +  5, hy + 0.5);
      ctx.lineTo(hx -  7, hy + 1);
      ctx.lineTo(hx - 17, hy - 1.5);
      ctx.closePath();

      // Gradient: dark neck → bright snout
      var hg = ctx.createLinearGradient(hx - 17, 0, hx + 25, 0);
      hg.addColorStop(0,    'rgba(75,3,0,0.93)');
      hg.addColorStop(0.25, 'rgba(165,25,0,0.96)');
      hg.addColorStop(0.65, 'rgba(255,62,0,0.98)');
      hg.addColorStop(1,    'rgba(255,155,18,0.97)');
      ctx.fillStyle   = hg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,168,40,0.68)';
      ctx.lineWidth   = 0.95;
      ctx.stroke();

      // 5. Mouth interior glow (the open gap between jaws)
      var mg = ctx.createRadialGradient(hx + 22, hy + 1.5, 0, hx + 22, hy + 1.5, 9);
      mg.addColorStop(0,   'rgba(255,245,110,0.95)');
      mg.addColorStop(0.4, 'rgba(255,150,0,0.75)');
      mg.addColorStop(1,   'rgba(255,40,0,0)');
      ctx.beginPath();
      ctx.moveTo(hx + 21, hy + 1.5);
      ctx.lineTo(hx + 26, hy + 0.5);
      ctx.lineTo(hx + 26, hy + 3.5);
      ctx.lineTo(hx + 22, hy + 3.8);
      ctx.closePath();
      ctx.fillStyle   = mg;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = '#FFDD00';
      ctx.fill();

      // 6. Small fang peeking from upper jaw
      ctx.fillStyle   = 'rgba(255,235,160,0.82)';
      ctx.shadowBlur  = 5;
      ctx.shadowColor = '#FFCC00';
      ctx.beginPath();
      ctx.moveTo(hx + 20, hy + 0.5);
      ctx.lineTo(hx + 22, hy + 0.5);
      ctx.lineTo(hx + 21, hy + 3);
      ctx.closePath();
      ctx.fill();

      // 7. Slit eye
      var ex = hx + 9, ey = hy - 3.8;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = '#FFB800';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE200';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 0.82, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#050000';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 0.9, ey - 1, 0.75, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,215,0.9)';
      ctx.fill();

      // 8. Energy whiskers trailing from the neck (blend into body)
      [
        [hx - 11, hy - 7.5, hx - 30, hy - 18],
        [hx - 15, hy - 1,   hx - 35, hy - 2 ],
        [hx - 12, hy + 4.5, hx - 30, hy + 12]
      ].forEach(function(c, i) {
        var wg = ctx.createLinearGradient(c[0], 0, c[2], 0);
        wg.addColorStop(0, 'rgba(255,120,30,' + (0.52 + Math.sin(t * 6 + i) * 0.1) + ')');
        wg.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.beginPath();
        ctx.moveTo(c[0], c[1]);
        ctx.lineTo(c[2], c[3]);
        ctx.strokeStyle = wg;
        ctx.lineWidth   = 0.9;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = 'rgba(255,80,0,0.3)';
        ctx.stroke();
      });

      ctx.restore();
    }

    // ── Time formatter ────────────────────────────────────────────────────
    function fmt(ms) {
      if (!ms || ms < 0 || ms > 36000000) return '0:00';
      var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
      s %= 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ── Render loop ───────────────────────────────────────────────────────
    var dead = false;

    function render() {
      if (dead) return;
      requestAnimationFrame(render);
      if (!document.getElementById('ember-waveform')) { dead = true; return; }
      updateLayout();
      ctx.clearRect(0, 0, W, H);

      var dur   = getDuration(), cur = getProgress();
      var prog  = Math.min(1, Math.max(0, cur / dur));
      var t     = Date.now() / 1000;
      var cx    = startX + (bodyEnd - startX) * prog;
      var cy    = bodyY(cx, t);
      var headY = bodyY(bodyEnd, t);

      frameN++;

      // ── 1. Ghost path (entire wave, dim) ───────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, bodyY(startX, t));
      for (var x = startX + 2; x <= bodyEnd; x += 2) ctx.lineTo(x, bodyY(x, t));
      ctx.strokeStyle = 'rgba(255,55,0,0.11)';
      ctx.lineWidth   = 2.5;
      ctx.stroke();
      ctx.restore();

      // ── 2. Played body — 3-layer glow stacking ────────────────────────
      if (cx > startX + 4) {
        // Build point list once to reuse across layers
        var pts = [];
        for (var x = startX; x <= cx; x += 2) pts.push([x, bodyY(x, t)]);

        function tracePts() {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        }

        // Layer A — dark red outer glow (widest, dimmest)
        ctx.save();
        tracePts();
        ctx.strokeStyle = 'rgba(140,0,0,0.48)';
        ctx.lineWidth   = 13;
        ctx.shadowBlur  = 24;
        ctx.shadowColor = '#4A0000';
        ctx.stroke();
        ctx.restore();

        // Layer B — orange mid glow with progress gradient
        var mg = ctx.createLinearGradient(startX, 0, cx, 0);
        mg.addColorStop(0,    'rgba(95,4,0,0.82)');
        mg.addColorStop(0.35, 'rgba(215,42,0,0.92)');
        mg.addColorStop(0.78, 'rgba(255,78,0,0.97)');
        mg.addColorStop(1,    'rgba(255,172,14,1)');
        ctx.save();
        tracePts();
        ctx.strokeStyle = mg;
        ctx.lineWidth   = 5.5;
        ctx.shadowBlur  = 16;
        ctx.shadowColor = '#FF3D00';
        ctx.stroke();
        ctx.restore();

        // Layer C — yellow-white hot core (narrowest, brightest)
        ctx.save();
        tracePts();
        ctx.strokeStyle = 'rgba(255,228,95,0.58)';
        ctx.lineWidth   = 1.9;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = '#FFE000';
        ctx.stroke();
        ctx.restore();
      }

      // ── 3. Particles ───────────────────────────────────────────────────
      if (prog > 0.02 && prog < 0.99 && particles.length < MAX_P) {
        // Embers rising from played trail
        if (frameN % 4 === 0) {
          var ex = startX + Math.random() * Math.max(0, cx - startX);
          if (ex > startX) particles.push(mkEmber(ex, bodyY(ex, t)));
        }
        // Sparks from playhead
        if (frameN % 3 === 0) particles.push(mkSpark(cx, cy));
      }

      particles = particles.filter(function(p) { return p.life > 0; });
      particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.type === 'ember') p.vx += (Math.random() - 0.5) * 0.03;
        drawParticle(p);
      });

      // ── 4. Playhead orb ────────────────────────────────────────────────
      if (prog > 0.006 && prog < 0.994) {
        ctx.save();
        // Soft aura
        var og = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
        og.addColorStop(0,   'rgba(255,130,0,0.6)');
        og.addColorStop(0.5, 'rgba(255,61,0,0.22)');
        og.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = og; ctx.fill();
        // Orange body
        ctx.beginPath(); ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
        ctx.fillStyle   = '#FF5500';
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#FF3D00';
        ctx.fill();
        // White-hot center
        ctx.beginPath(); ctx.arc(cx, cy, 2.1, 0, Math.PI * 2);
        ctx.fillStyle   = '#FFFFFF';
        ctx.shadowBlur  = 5;
        ctx.shadowColor = '#FFF';
        ctx.fill();
        ctx.restore();
      }

      // ── 5. Dragon head at right end ────────────────────────────────────
      drawDragonHead(bodyEnd, headY, t);

      // ── 6. Timestamps ──────────────────────────────────────────────────
      ctx.save();
      ctx.font         = 'bold 10px -apple-system,system-ui,sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign    = 'right';
      ctx.fillStyle    = 'rgba(255,200,150,0.82)';
      ctx.fillText(fmt(cur), startX - 9, cY);
      ctx.textAlign    = 'left';
      ctx.fillStyle    = 'rgba(255,200,150,0.5)';
      ctx.fillText(fmt(dur), endX + 9, cY);
      ctx.restore();
    }

    console.log('Ember dragon seekbar v2.2 initialized');
    render();
  }

  waitForSpicetify();
})();
