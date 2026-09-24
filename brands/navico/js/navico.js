/* ==========================================================================
   Hồ sơ Doanh nghiệp (miễn phí) — NAVICO
   - Header menu: same behaviour as the home page (js/main.js initUI)
   - Reveal-on-scroll + count-up for the stats row
   - "Tải xuống báo cáo" / "Chia sẻ" actions (same as the other tabs)
   - Chất lượng: pinned card track from the Doanh nghiệp cơ bản tab
     (initS08Cards), here with a single static image on the right
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = $('.site-header');
  const headerH = () => (header ? header.offsetHeight : 76);

  /* ---------- header (copied from home js/main.js) ---------- */
  function initUI() {
    const burger = $('.burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });

    $$('.nav-item', nav).forEach((item) => {
      const toggle = $('.nav-item__toggle', item);
      const closeItem = () => {
        item.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !item.classList.contains('is-open');
        $$('.nav-item', nav).forEach((other) => { if (other !== item) other.classList.remove('is-open'); });
        item.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      item.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeItem(); });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item')) $$('.nav-item.is-open', nav).forEach((item) => {
        item.classList.remove('is-open');
        $('.nav-item__toggle', item).setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      const y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - headerH();
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(msg) {
    const el = $('#npToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2600);
  }

  /* ---------- hero actions ---------- */
  function initLang() {
    const btn = $('#btnLang');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const label = $('.lang-label', btn);
      if (!label) return;
      const next = label.textContent.trim() === 'EN' ? 'VI' : 'EN';
      label.textContent = next;
      showToast(`Đã chuyển ngôn ngữ sang: ${next === 'EN' ? 'English' : 'Tiếng Việt'}`);
    });
  }

  function initActions() {
    const dl = $('#btnDownloadReport');
    const share = $('#btnShare');
    if (dl) dl.addEventListener('click', () => {
      showToast('Báo cáo hồ sơ NAVICO đang được tải xuống...');
      const blob = new Blob([
        'BÁO CÁO HỒ SƠ DOANH NGHIỆP THƯƠNG HIỆU QUỐC GIA\n\n' +
        'Doanh nghiệp: CÔNG TY CỔ PHẦN NAM VIỆT - NAVICO\n' +
        'Doanh nghiệp có sản phẩm đạt Thương hiệu Quốc gia Việt Nam 2026\n' +
        'Chuyên trang Báo Nhân Dân - Thương hiệu Quốc gia Việt Nam.'
      ], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bao-cao-NAVICO-Thuong-hieu-quoc-gia.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    if (share) share.addEventListener('click', async () => {
      const data = {
        title: 'NAVICO - Doanh nghiệp có sản phẩm đạt Thương hiệu Quốc gia',
        text: 'Công ty Cổ phần Nam Việt - NAVICO',
        url: location.href,
      };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(location.href);
        showToast('Đã sao chép liên kết trang.');
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        showToast('Không thể chia sẻ, vui lòng sao chép địa chỉ trang.');
      }
    });
    const cta = $('#btnS10Contact');
    if (cta) cta.addEventListener('click', () => showToast('Đang mở email liên hệ Ban biên tập...'));
  }

  /* ---------- reveal + count-up ---------- */
  function formatNum(n) { return n.toLocaleString('vi-VN'); }

  function countUp(el) {
    const to = parseInt(el.dataset.count, 10);
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    if (reduceMotion || !to) return;
    const dur = 1300;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + formatNum(Math.round(to * eased)) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = pre + '0' + suf;
    requestAnimationFrame(step);
  }

  function initReveal() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    // stagger siblings that enter together
    const io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        el.style.transitionDelay = `${Math.min(i++, 4) * 90}ms`;
        el.classList.add('is-in');
        const num = $('.np-stat__num', el);
        if (num) countUp(num);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Chất lượng: pinned card track (from initS08Cards) ---------- */
  function initS08Cards() {
    const pin = $('#s08Pin');
    const viewport = $('#s08ContentViewport');
    const track = $('#s08ContentTrack');
    if (!pin || !track) return;

    function update() {
      if (window.innerWidth <= 900) { track.style.transform = ''; return; }
      const rect = pin.getBoundingClientRect();
      const maxScroll = Math.max(1, pin.offsetHeight - (window.innerHeight - headerH()));
      const progress = Math.max(0, Math.min(1, (headerH() - rect.top) / maxScroll));
      const maxTrack = Math.max(0, track.offsetHeight - (viewport ? viewport.offsetHeight : 600));
      track.style.transform = `translateY(-${(progress * maxTrack).toFixed(2)}px)`;
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initActions();
    initLang();
    initReveal();
    initS08Cards();
  });
})();
