/**
 * Curved Plane WebGL Mesh Deformation Engine  v2
 *
 * Hieu ung be cong anh theo scroll:
 *   - Cuon nhanh -> anh be cong manh hon (ti le thuan voi van toc)
 *   - Dung cuon  -> anh dan hoi tu ve phang (spring physics)
 *   - Cuon xuong / len -> be cong theo hai chieu nguoc nhau
 *
 * Ky thuat: WebGL subdivided-mesh, vertex displacement theo ham sin/parabola
 */
(function () {
  'use strict';

  // --------------------------------------------------------------------
  // Shared live-tunable config. Read fresh on every frame/event instead of
  // cached into local constants, so a debug tool (see js/s02-debug-panel.js)
  // can adjust any of these at runtime and see the effect immediately —
  // no reload, no shader recompile needed. main.js extends this same
  // object with its own `tilt`/`transition` sections for the 3D card
  // stack, since curved-plane.js loads first.
  // --------------------------------------------------------------------
  // Defaults below were tuned live via the debug panel (js/s02-debug-panel.js)
  // and baked in as the new resting configuration.
  window.S02_CONFIG = window.S02_CONFIG || {};
  window.S02_CONFIG.bend = Object.assign({
    springK: 0.10,        // spring stiffness pulling curBend toward tgtBend
    springDamp: 0.82,     // per-frame velocity damping (0-1, higher = less bouncy)
    maxBend: 0.55,         // clamp on how far the curve can bend either way
    velFactor: 0.02,      // how much each px of scroll delta adds to the bend target
    decay: 0.5,             // per-frame decay of the bend target toward 0 when idle
    bendStrength: 0.05,   // overall vertical sag amount at full bend
    cornerSoftness: 4,    // power applied to the arch curve; higher = softer corners
    pillowStrength: 0.27, // secondary cross-axis "pillow" give on left/right edges
    wheelMultiplier: 0.65,
    touchMultiplier: 0.2
  }, window.S02_CONFIG.bend || {});

  var VERT = [
    'precision highp float;',
    'attribute vec2 aPosition;',
    'attribute vec2 aUv;',
    'uniform float uBend;',
    'uniform float uPadY;',
    'uniform float uAspect;',
    'uniform float uBendStrength;',
    'uniform float uCornerSoftness;',
    'uniform float uPillowStrength;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aUv;',
    '  float x = aPosition.x;',
    '  float y = aPosition.y;',
    '  float py = uPadY + y * (1.0 - 2.0 * uPadY);',
    '  float px = x;',
    // Soft corner easing: sin(x*PI) raised to a gentle power broadens the
    // flat zone near the left/right edges, so the bend ramps in gradually
    // instead of launching straight into full curvature at a fixed rate —
    // softer corners instead of one evenly-ramped, mechanical arch.
    '  float archX = pow(sin(x * 3.14159265359), max(uCornerSoftness, 0.001));',
    '  float sag = archX * uBend * uBendStrength;',
    '  py += sag;',
    // Small secondary cross-axis "pillow" term: the vertical sag above is
    // the dominant curve axis, but this adds a gentle give to the left and
    // right edges too (strongest at vertical mid-height, easing to zero at
    // the very top/bottom and at dead-center), so the whole card softens
    // on all sides like cloth instead of only bending along one fixed axis.
    '  float archY = sin(y * 3.14159265359);',
    '  px += archY * (x - 0.5) * uBend * uPillowStrength;',
    '  vec2 clip = vec2(px * 2.0 - 1.0, (1.0 - py) * 2.0 - 1.0);',
    '  gl_Position = vec4(clip, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform float uAlpha;',
    'void main() {',
    '  if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;',
    '  vec4 color = texture2D(uTexture, vUv);',
    '  gl_FragColor = vec4(color.rgb, color.a * uAlpha);',
    '}'
  ].join('\n');

  function compileShader(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[CurvedPlane] Shader error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function buildProgram(gl, vSrc, fSrc) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vSrc);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[CurvedPlane] Link error:', gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  // Subdivided grid geometry
  var COLS = 48;
  var ROWS = 24;
  var positions = [];
  var uvCoords  = [];
  var indices   = [];

  for (var r = 0; r <= ROWS; r++) {
    var gy = r / ROWS;
    for (var c = 0; c <= COLS; c++) {
      var gx = c / COLS;
      positions.push(gx, gy);
      uvCoords.push(gx, gy);
    }
  }
  for (var gr = 0; gr < ROWS; gr++) {
    for (var gc = 0; gc < COLS; gc++) {
      var a = gr * (COLS + 1) + gc;
      var b = a + 1;
      var d = (gr + 1) * (COLS + 1) + gc;
      var e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }

  var POS_ARR = new Float32Array(positions);
  var UV_ARR  = new Float32Array(uvCoords);
  var IDX_ARR = new Uint16Array(indices);

  // Per-card WebGL renderer
  function CardPlaneRenderer(imageWrap, imgEl) {
    this.wrap    = imageWrap;
    this.img     = imgEl;
    this.isReady = false;
    this.ctxLost = false;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 's02-card-gl-canvas';
    this.wrap.appendChild(this.canvas);

    var gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      console.warn('[CurvedPlane] WebGL not available');
      return;
    }
    this.gl = gl;

    var self = this;
    this.canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      self.ctxLost = true;
    });
    this.canvas.addEventListener('webglcontextrestored', function () {
      self.ctxLost = false;
      self._setupGL();
    });

    this._setupGL();
    this._loadTexture();
  }

  CardPlaneRenderer.prototype._setupGL = function () {
    var gl = this.gl;
    if (!gl) return;

    this.prog = buildProgram(gl, VERT, FRAG);
    if (!this.prog) return;

    this.uBend           = gl.getUniformLocation(this.prog, 'uBend');
    this.uPadY           = gl.getUniformLocation(this.prog, 'uPadY');
    this.uAspect         = gl.getUniformLocation(this.prog, 'uAspect');
    this.uAlpha          = gl.getUniformLocation(this.prog, 'uAlpha');
    this.uTexture        = gl.getUniformLocation(this.prog, 'uTexture');
    this.uBendStrength   = gl.getUniformLocation(this.prog, 'uBendStrength');
    this.uCornerSoftness = gl.getUniformLocation(this.prog, 'uCornerSoftness');
    this.uPillowStrength = gl.getUniformLocation(this.prog, 'uPillowStrength');
    this.aPos     = gl.getAttribLocation(this.prog, 'aPosition');
    this.aUv      = gl.getAttribLocation(this.prog, 'aUv');

    this.posVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
    gl.bufferData(gl.ARRAY_BUFFER, POS_ARR, gl.STATIC_DRAW);

    this.uvVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
    gl.bufferData(gl.ARRAY_BUFFER, UV_ARR, gl.STATIC_DRAW);

    this.ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, IDX_ARR, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  };

  CardPlaneRenderer.prototype._loadTexture = function () {
    var gl   = this.gl;
    var self = this;
    if (!gl) return;

    this.texture = gl.createTexture();

    function doUpload(source) {
      if (self.ctxLost) return;
      gl.bindTexture(gl.TEXTURE_2D, self.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        self.isReady = true;
        self.img.style.opacity = '0';
        self.img.style.visibility = 'hidden';
        self.render(0);
      } catch (e) {
        // If tainted (file:// CORS), draw onto a canvas first
        try {
          var tmpCanvas = document.createElement('canvas');
          tmpCanvas.width  = self.img.naturalWidth  || 350;
          tmpCanvas.height = self.img.naturalHeight || 236;
          var ctx2d = tmpCanvas.getContext('2d');
          ctx2d.drawImage(self.img, 0, 0);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tmpCanvas);
          self.isReady = true;
          self.img.style.opacity = '0';
          self.img.style.visibility = 'hidden';
          self.render(0);
        } catch (e2) {
          console.warn('[CurvedPlane] Could not upload texture:', e2);
        }
      }
    }

    function upload() {
      doUpload(self.img);
    }

    if (this.img.complete && this.img.naturalWidth > 0) {
      upload();
    } else {
      this.img.addEventListener('load', upload, { once: true });
    }
  };

  CardPlaneRenderer.prototype._resize = function () {
    if (!this.gl || this.ctxLost) return;
    var rect = this.wrap.getBoundingClientRect();
    var dpr  = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * 1.32 * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width  = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  };

  CardPlaneRenderer.prototype.render = function (bendValue) {
    if (!this.isReady || !this.gl || this.ctxLost || !this.prog) return;
    var gl = this.gl;

    this._resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);

    var bendCfg = window.S02_CONFIG.bend;
    var aspect = this.canvas.width / Math.max(1, this.canvas.height);
    gl.uniform1f(this.uBend,           bendValue);
    gl.uniform1f(this.uPadY,           0.115);
    gl.uniform1f(this.uAspect,         aspect);
    gl.uniform1f(this.uAlpha,          1.0);
    gl.uniform1f(this.uBendStrength,   bendCfg.bendStrength);
    gl.uniform1f(this.uCornerSoftness, bendCfg.cornerSoftness);
    gl.uniform1f(this.uPillowStrength, bendCfg.pillowStrength);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
    gl.enableVertexAttribArray(this.aUv);
    gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.drawElements(gl.TRIANGLES, IDX_ARR.length, gl.UNSIGNED_SHORT, 0);
  };

  // Global spring physics. Values are read live from window.S02_CONFIG.bend
  // on every call/frame (not cached into local constants) so the debug
  // panel can retune them while scrolling and see the effect immediately.
  var curBend  = 0;
  var tgtBend  = 0;
  var velBend  = 0;
  var lastY    = window.scrollY;
  var rafId    = null;
  var renderers = [];

  function addScrollDelta(dy) {
    var cfg = window.S02_CONFIG.bend;
    var added = dy * cfg.velFactor;
    tgtBend = Math.max(-cfg.maxBend, Math.min(cfg.maxBend, tgtBend + added));
  }

  window.addEventListener('scroll', function () {
    var y  = window.scrollY;
    var dy = y - lastY;
    lastY = y;
    addScrollDelta(dy);
  }, { passive: true });

  window.addEventListener('wheel', function (e) {
    addScrollDelta(e.deltaY * window.S02_CONFIG.bend.wheelMultiplier);
  }, { passive: true });

  var touchY0 = 0;
  window.addEventListener('touchstart', function (e) {
    if (e.touches.length) touchY0 = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length) {
      var dy = touchY0 - e.touches[0].clientY;
      touchY0 = e.touches[0].clientY;
      addScrollDelta(dy * window.S02_CONFIG.bend.touchMultiplier);
    }
  }, { passive: true });

  function tick() {
    var cfg = window.S02_CONFIG.bend;

    // Decay targetBend toward 0 (simulates scroll stopping)
    tgtBend *= cfg.decay;
    if (Math.abs(tgtBend) < 0.0006) tgtBend = 0;

    // Hooke's Law spring
    var force = (tgtBend - curBend) * cfg.springK;
    velBend = (velBend + force) * cfg.springDamp;
    curBend += velBend;

    // Snap to rest
    var atRest = Math.abs(curBend) < 0.0004 &&
                 Math.abs(velBend) < 0.0004 &&
                 tgtBend === 0;
    if (atRest) {
      curBend = 0;
      velBend = 0;
    }

    // Render visible cards
    for (var i = 0; i < renderers.length; i++) {
      var rdr  = renderers[i];
      var card = rdr.wrap.closest('.s02-card');
      if (!card) {
        rdr.render(curBend);
        continue;
      }
      var visible = card.classList.contains('is-active') ||
                    card.classList.contains('is-prev')   ||
                    card.classList.contains('is-next');
      if (visible) {
        rdr.render(curBend);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function initCurvedPlanes() {
    var track   = document.getElementById('s02');
    var wraps   = track
      ? track.querySelectorAll('.s02-card-image-wrap')
      : document.querySelectorAll('.s02-card-image-wrap');

    Array.prototype.forEach.call(wraps, function (wrap) {
      var img = wrap.querySelector('.s02-card-img');
      if (!img) return;
      var rdr = new CardPlaneRenderer(wrap, img);
      renderers.push(rdr);
    });

    if (renderers.length > 0 && !rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  window.initCurvedPlanes = initCurvedPlanes;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurvedPlanes);
  } else {
    initCurvedPlanes();
  }
})();
