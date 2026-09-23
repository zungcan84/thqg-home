/**
 * s02-debug-panel.js
 *
 * Live tuning tool for Section 02's interactive card carousel.
 * Every slider here is wired straight to window.S02_CONFIG (created by
 * curved-plane.js's `bend` section and main.js's `tilt`/`transition`
 * sections) — dragging a slider updates the config object immediately,
 * and since curved-plane.js/main.js read that object fresh on every
 * frame/event instead of caching values into constants, the effect is
 * visible right away: no reload, no re-init.
 *
 * Open it with the "⚙" button fixed at the bottom-right of the screen,
 * or press Ctrl+Shift+D. Settings persist to localStorage between reloads
 * (best-effort — wrapped in try/catch for file:// contexts where storage
 * can be flaky), and can be reset per-section or all at once.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 's02DebugConfig';

  // ---- Field definitions: how each config value maps to a slider -------
  // group: which S02_CONFIG section the field lives in
  // key:   property name within that section
  // Sliders read min/max/step; 'select' fields render a <select> instead.
  var FIELDS = [
    {
      section: 'Độ cong (Bend / WebGL)',
      group: 'bend',
      items: [
        { key: 'bendStrength',   label: 'Biên độ cong', min: 0, max: 1, step: 0.01 },
        { key: 'cornerSoftness', label: 'Độ mềm góc cạnh', min: 0.3, max: 4, step: 0.05, hint: 'Cao hơn = góc mềm hơn' },
        { key: 'pillowStrength', label: 'Độ cong cạnh trái/phải', min: 0, max: 0.3, step: 0.005 },
        { key: 'maxBend',        label: 'Cong tối đa', min: 0.05, max: 1.5, step: 0.01 },
        { key: 'velFactor',      label: 'Độ nhạy tốc độ cuộn', min: 0.0005, max: 0.02, step: 0.0005 },
        { key: 'decay',          label: 'Tốc độ tắt dần (decay)', min: 0.5, max: 0.98, step: 0.005 },
        { key: 'springK',        label: 'Độ cứng lò xo (spring K)', min: 0.01, max: 0.4, step: 0.005 },
        { key: 'springDamp',     label: 'Giảm chấn lò xo (damping)', min: 0.3, max: 0.98, step: 0.01 },
        { key: 'wheelMultiplier', label: 'Hệ số cuộn chuột (wheel)', min: 0.1, max: 2, step: 0.05 },
        { key: 'touchMultiplier', label: 'Hệ số vuốt chạm (touch)', min: 0.2, max: 3, step: 0.05 }
      ]
    },
    {
      section: 'Xoay 3D & Parallax (Mouse)',
      group: 'tilt',
      items: [
        { key: 'mouseTiltActive',  label: 'Góc xoay ảnh chính (deg)', min: 0, max: 20, step: 0.5 },
        { key: 'mouseTiltSide',    label: 'Góc xoay ảnh phụ (deg)', min: 0, max: 15, step: 0.5 },
        { key: 'baseTiltXDesktop', label: 'Góc nghiêng nghỉ - Desktop (deg)', min: 0, max: 25, step: 0.5 },
        { key: 'baseTiltXMobile',  label: 'Góc nghiêng nghỉ - Mobile (deg)', min: 0, max: 25, step: 0.5 },
        { key: 'baseTiltY',        label: 'Góc xoay Y nghỉ (deg)', min: 0, max: 15, step: 0.5 },
        { key: 'parallaxActive',   label: 'Parallax ảnh chính (px)', min: 0, max: 60, step: 1 },
        { key: 'parallaxPrev',     label: 'Parallax ảnh trước (px)', min: 0, max: 60, step: 1 },
        { key: 'parallaxNext',     label: 'Parallax ảnh sau (px)', min: 0, max: 60, step: 1 }
      ]
    },
    {
      section: 'Vật lý chuyển trạng thái (Transition)',
      group: 'transition',
      items: [
        { key: 'activeDuration',  label: 'Thời gian vào vị trí chính (s)', min: 0.1, max: 2, step: 0.05 },
        { key: 'activeOvershoot', label: 'Độ nảy lò xo (overshoot)', min: 0, max: 3, step: 0.05, hint: 'back.out(X) — cao hơn = nảy mạnh hơn' },
        { key: 'imageDuration',   label: 'Thời gian resize ảnh (s)', min: 0.1, max: 2, step: 0.05 },
        { key: 'imageOvershoot',  label: 'Độ nảy resize ảnh', min: 0, max: 3, step: 0.05 },
        { key: 'inactiveDuration', label: 'Thời gian ảnh phụ ổn định (s)', min: 0.1, max: 2, step: 0.05 },
        { key: 'hiddenDuration',  label: 'Thời gian ảnh ẩn ra/vào (s)', min: 0.1, max: 2, step: 0.05 },
        { key: 'zActive',   label: 'Độ sâu Z - ảnh chính (px)', min: 0, max: 150, step: 5 },
        { key: 'zInactive', label: 'Độ sâu Z - ảnh phụ (px)', min: -250, max: 0, step: 5 },
        { key: 'zHidden',   label: 'Độ sâu Z - ảnh ẩn (px)', min: -400, max: 0, step: 5 },
        { key: 'scaleInactive', label: 'Tỉ lệ thu nhỏ ảnh phụ', min: 0.5, max: 1, step: 0.005 },
        { key: 'scaleHidden',   label: 'Tỉ lệ thu nhỏ ảnh ẩn', min: 0.3, max: 1, step: 0.005 },
        { key: 'blurInactive', label: 'Độ mờ ảnh phụ (px)', min: 0, max: 40, step: 1 },
        { key: 'blurHidden',   label: 'Độ mờ ảnh ẩn (px)', min: 0, max: 40, step: 1 }
      ]
    }
  ];

  var DEFAULTS = null; // captured once S02_CONFIG exists, before any user edits/restores

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function ensureConfigReady(cb) {
    if (window.S02_CONFIG && window.S02_CONFIG.bend && window.S02_CONFIG.tilt && window.S02_CONFIG.transition) {
      cb();
      return;
    }
    setTimeout(function () { ensureConfigReady(cb); }, 50);
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function savePersisted() {
    try {
      var snapshot = {
        bend: window.S02_CONFIG.bend,
        tilt: window.S02_CONFIG.tilt,
        transition: window.S02_CONFIG.transition
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // localStorage unavailable (private mode, file:// restrictions, etc.) — fine, just no persistence
    }
  }

  function applyPersisted() {
    var saved = loadPersisted();
    if (!saved) return;
    ['bend', 'tilt', 'transition'].forEach(function (group) {
      if (saved[group]) {
        Object.assign(window.S02_CONFIG[group], saved[group]);
      }
    });
  }

  function buildStyles() {
    var css = [
      '#s02DebugToggle{position:fixed;right:18px;bottom:18px;width:46px;height:46px;border-radius:50%;',
      'background:#111826;color:#fff;border:1px solid rgba(255,255,255,0.15);font-size:20px;cursor:pointer;',
      'z-index:99998;box-shadow:0 6px 20px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;',
      'transition:transform 0.2s ease;}',
      '#s02DebugToggle:hover{transform:scale(1.08);}',
      '#s02DebugPanel{position:fixed;right:18px;bottom:76px;width:340px;max-height:78vh;overflow-y:auto;',
      'background:rgba(17,24,38,0.96);color:#e8ecf4;border:1px solid rgba(255,255,255,0.12);border-radius:12px;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Manrope,sans-serif;font-size:12px;',
      'box-shadow:0 12px 40px rgba(0,0,0,0.45);z-index:99997;padding:14px;display:none;}',
      '#s02DebugPanel.open{display:block;}',
      '#s02DebugPanel h3{margin:0 0 10px;font-size:14px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:space-between;}',
      '#s02DebugPanel .s02dp-section{margin-bottom:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;}',
      '#s02DebugPanel .s02dp-section:first-of-type{border-top:none;padding-top:0;}',
      '#s02DebugPanel .s02dp-section-title{font-weight:700;color:#8fb3ff;margin-bottom:8px;font-size:12px;display:flex;justify-content:space-between;align-items:center;}',
      '#s02DebugPanel .s02dp-reset-mini{background:none;border:1px solid rgba(255,255,255,0.2);color:#aab4c8;',
      'border-radius:5px;font-size:10px;padding:2px 6px;cursor:pointer;}',
      '#s02DebugPanel .s02dp-reset-mini:hover{color:#fff;border-color:#8fb3ff;}',
      '#s02DebugPanel .s02dp-row{margin-bottom:9px;}',
      '#s02DebugPanel .s02dp-row label{display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;color:#c6cede;}',
      '#s02DebugPanel .s02dp-row label span.s02dp-val{color:#8fb3ff;font-variant-numeric:tabular-nums;}',
      '#s02DebugPanel .s02dp-hint{color:#7a8399;font-size:10px;margin-top:2px;}',
      '#s02DebugPanel input[type=range]{width:100%;accent-color:#8fb3ff;}',
      '#s02DebugPanel .s02dp-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}',
      '#s02DebugPanel .s02dp-btn{flex:1 1 calc(50% - 4px);min-width:0;background:#1d2a44;color:#fff;',
      'border:1px solid rgba(255,255,255,0.15);border-radius:7px;padding:7px 6px;font-size:11px;cursor:pointer;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#s02DebugPanel .s02dp-btn:hover{background:#28395c;}',
      '#s02DebugPanel .s02dp-btn.primary{background:#3a63ff;border-color:#3a63ff;}',
      '#s02DebugPanel .s02dp-btn.primary:hover{background:#5a7dff;}',
      '#s02DebugPanel .s02dp-close{background:none;border:none;color:#aab4c8;font-size:16px;cursor:pointer;line-height:1;}',
      '#s02DebugPanel .s02dp-close:hover{color:#fff;}',
      '#s02DebugPanel::-webkit-scrollbar{width:8px;}',
      '#s02DebugPanel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px;}'
    ].join('');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function fmt(val, step) {
    var decimals = (String(step).split('.')[1] || '').length;
    return Number(val).toFixed(Math.min(decimals, 4));
  }

  function replayIfPossible() {
    if (typeof window.S02_replayTransition === 'function') {
      window.S02_replayTransition();
    }
  }

  function buildPanel() {
    var toggle = document.createElement('button');
    toggle.id = 's02DebugToggle';
    toggle.type = 'button';
    toggle.title = 'Section 2 tuning tool (Ctrl+Shift+D)';
    toggle.textContent = '⚙';
    document.body.appendChild(toggle);

    var panel = document.createElement('div');
    panel.id = 's02DebugPanel';

    var header = document.createElement('h3');
    header.innerHTML = '<span>Section 2 · Tuning</span>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 's02dp-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });
    header.appendChild(closeBtn);
    panel.appendChild(header);

    FIELDS.forEach(function (sectionDef) {
      var section = document.createElement('div');
      section.className = 's02dp-section';

      var titleRow = document.createElement('div');
      titleRow.className = 's02dp-section-title';
      var titleSpan = document.createElement('span');
      titleSpan.textContent = sectionDef.section;
      titleRow.appendChild(titleSpan);

      var resetMini = document.createElement('button');
      resetMini.type = 'button';
      resetMini.className = 's02dp-reset-mini';
      resetMini.textContent = 'Reset';
      resetMini.addEventListener('click', function () {
        if (!DEFAULTS) return;
        Object.assign(window.S02_CONFIG[sectionDef.group], DEFAULTS[sectionDef.group]);
        savePersisted();
        renderValues();
        replayIfPossible();
      });
      titleRow.appendChild(resetMini);
      section.appendChild(titleRow);

      sectionDef.items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 's02dp-row';

        var label = document.createElement('label');
        var labelText = document.createElement('span');
        labelText.textContent = item.label;
        var valueText = document.createElement('span');
        valueText.className = 's02dp-val';
        valueText.dataset.group = sectionDef.group;
        valueText.dataset.key = item.key;
        label.appendChild(labelText);
        label.appendChild(valueText);
        row.appendChild(label);

        var input = document.createElement('input');
        input.type = 'range';
        input.min = item.min;
        input.max = item.max;
        input.step = item.step;
        input.dataset.group = sectionDef.group;
        input.dataset.key = item.key;
        input.dataset.step = item.step;
        input.addEventListener('input', function () {
          var val = parseFloat(input.value);
          window.S02_CONFIG[sectionDef.group][item.key] = val;
          valueText.textContent = fmt(val, item.step);
          savePersisted();
        });
        input.addEventListener('change', replayIfPossible);
        row.appendChild(input);

        if (item.hint) {
          var hint = document.createElement('div');
          hint.className = 's02dp-hint';
          hint.textContent = item.hint;
          row.appendChild(hint);
        }

        section.appendChild(row);
      });

      panel.appendChild(section);
    });

    var actions = document.createElement('div');
    actions.className = 's02dp-actions';

    var replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 's02dp-btn primary';
    replayBtn.textContent = '▶ Xem lại chuyển động';
    replayBtn.addEventListener('click', replayIfPossible);
    actions.appendChild(replayBtn);

    var resetAllBtn = document.createElement('button');
    resetAllBtn.type = 'button';
    resetAllBtn.className = 's02dp-btn';
    resetAllBtn.textContent = 'Reset tất cả';
    resetAllBtn.addEventListener('click', function () {
      if (!DEFAULTS) return;
      Object.assign(window.S02_CONFIG.bend, DEFAULTS.bend);
      Object.assign(window.S02_CONFIG.tilt, DEFAULTS.tilt);
      Object.assign(window.S02_CONFIG.transition, DEFAULTS.transition);
      savePersisted();
      renderValues();
      replayIfPossible();
    });
    actions.appendChild(resetAllBtn);

    var exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 's02dp-btn';
    exportBtn.textContent = 'Xuất JSON ra console';
    exportBtn.addEventListener('click', function () {
      var snapshot = {
        bend: window.S02_CONFIG.bend,
        tilt: window.S02_CONFIG.tilt,
        transition: window.S02_CONFIG.transition
      };
      console.log('[S02 Debug Panel] Current config:\n' + JSON.stringify(snapshot, null, 2));
      exportBtn.textContent = 'Đã in ra console ✓';
      setTimeout(function () { exportBtn.textContent = 'Xuất JSON ra console'; }, 1500);
    });
    actions.appendChild(exportBtn);

    // Downloads the current config as a .json file — the easiest way to hand
    // a tuned setup back to whoever maintains the code: no DevTools needed,
    // just click, then send the downloaded file over.
    var downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 's02dp-btn primary';
    downloadBtn.textContent = '⬇ Tải file cấu hình';
    downloadBtn.addEventListener('click', function () {
      var snapshot = {
        bend: window.S02_CONFIG.bend,
        tilt: window.S02_CONFIG.tilt,
        transition: window.S02_CONFIG.transition
      };
      var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      var stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = 's02-config-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      downloadBtn.textContent = 'Đã tải ✓';
      setTimeout(function () { downloadBtn.textContent = '⬇ Tải file cấu hình'; }, 1500);
    });
    actions.appendChild(downloadBtn);

    panel.appendChild(actions);
    document.body.appendChild(panel);

    function renderValues() {
      panel.querySelectorAll('input[type=range]').forEach(function (input) {
        var group = input.dataset.group;
        var key = input.dataset.key;
        var val = window.S02_CONFIG[group][key];
        input.value = val;
        var valueText = panel.querySelector('.s02dp-val[data-group="' + group + '"][data-key="' + key + '"]');
        if (valueText) valueText.textContent = fmt(val, input.dataset.step);
      });
    }

    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });

    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        panel.classList.toggle('open');
      }
    });

    renderValues();
  }

  function init() {
    ensureConfigReady(function () {
      DEFAULTS = deepClone({
        bend: window.S02_CONFIG.bend,
        tilt: window.S02_CONFIG.tilt,
        transition: window.S02_CONFIG.transition
      });
      applyPersisted();
      buildStyles();
      buildPanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
