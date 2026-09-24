/* ==========================================================================
   Thương hiệu Quốc gia Việt Nam 2026 — hiệu ứng cuộn
   1. Hero parallax + chữ hiện từng dòng
   2. Các khối phía dưới hiện dần khi cuộn tới, số nhảy (count-up)
   3. "Dấu ấn Thương hiệu Quốc gia": scene pin toàn màn hình, các năm lần lượt vào giữa
   4. Các phần còn lại: bay nhẹ lên khi cuộn tới
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduceMotion;

  /* ------------------------------------------------------------------------
     Dữ liệu các kỳ xét chọn.
     TODO: chỉ năm 2016 (83 doanh nghiệp) lấy từ bản thiết kế. Các năm còn lại là
     số liệu/mô tả GIỮ CHỖ — thay bằng dữ liệu chính thức trước khi phát hành.
     ------------------------------------------------------------------------ */
  const generic = (year) =>
    `Kỳ xét chọn Thương hiệu quốc gia Việt Nam năm ${year} ghi nhận thêm các doanh nghiệp có sản phẩm đạt tiêu chuẩn Chất lượng, Đổi mới sáng tạo và Năng lực tiên phong.`;
  const MILESTONES = [
    { year: 2008, count: 30, desc: generic(2008) },
    { year: 2010, count: 43, desc: generic(2010) },
    { year: 2012, count: 55, desc: generic(2012) },
    { year: 2014, count: 63, desc: generic(2014) },
    {
      year: 2016, count: 83,
      desc: 'Quyết định 10670/QĐ-BCT ngày 24/11/2014 của Bộ trưởng Công thương công nhận các thương hiệu sản phẩm của 63 doanh nghiệp. Lĩnh vực điện - điện tử - công nghệ thông tin - viễn thông dẫn đầu với 8 doanh nghiệp có thương hiệu sản phẩm được vinh danh.',
    },
    { year: 2018, count: 96, desc: generic(2018) },
    { year: 2020, count: 124, desc: generic(2020) },
    { year: 2022, count: 158, desc: generic(2022) },
    { year: 2024, count: 190, desc: generic(2024) },
    // 2026: số liệu theo yêu cầu (227 doanh nghiệp); mô tả tạm dùng lại nguyên văn của năm 2024.
    { year: 2026, count: 227, desc: generic(2024) },
  ];

  const header = $('.site-header');
  const headerH = () => header.offsetHeight;

  /* ------------------------------------------------------------------------
     UI cơ bản: menu, tab, cuộn tới anchor
     ------------------------------------------------------------------------ */
  function initUI() {
    const burger = $('.burger');
    const nav = $('#nav');

    // Nút ngôn ngữ dùng chung (.btn-lang): đổi nhãn EN ⇄ VI, giống các tab doanh nghiệp.
    const langBtn = $('#btnLang');
    if (langBtn) langBtn.addEventListener('click', () => {
      const label = $('.lang-label', langBtn);
      if (label) label.textContent = label.textContent.trim() === 'EN' ? 'VI' : 'EN';
    });

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

    $$('.tabs').forEach((tabs) => {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tabs__btn');
        if (!btn) return;
        $$('.tabs__btn', tabs).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
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

  /* ------------------------------------------------------------------------
     Tách đoạn văn thành từng dòng (đo theo bố cục thực tế)
     ------------------------------------------------------------------------ */
  function splitLines(el) {
    const text = (el.dataset.text || el.textContent).replace(/\s+/g, ' ').trim();
    el.dataset.text = text;
    el.textContent = '';
    const words = text.split(' ').map((w) => {
      const s = document.createElement('span');
      s.textContent = w;
      el.append(s, ' ');
      return s;
    });
    const lines = [];
    words.forEach((w) => {
      const top = w.offsetTop;
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - top) < 4) last.words.push(w.textContent);
      else lines.push({ top, words: [w.textContent] });
    });
    el.textContent = '';
    lines.forEach((l) => {
      const line = document.createElement('span');
      line.className = 'line';
      line.style.visibility = 'visible';
      const inner = document.createElement('span');
      inner.textContent = l.words.join(' ');
      line.append(inner);
      el.append(line);
    });
    el.classList.add('is-split');
    return $$('.line > span', el);
  }

  // Đặt vị trí đầu (ẩn dưới mặt nạ) bằng GSAP để không bị tính lẫn transform từ CSS
  function hideLines(spans) {
    gsap.set(spans, { yPercent: 115 });
    spans.forEach((s) => { s.parentElement.style.visibility = 'visible'; });
  }

  /* ------------------------------------------------------------------------
     DẤU ẤN THƯƠNG HIỆU — vòng cung các năm + ruler
     Hoạt động độc lập với cuộn: render(p) với p = chỉ số năm (số thực 0..N-1).
     ------------------------------------------------------------------------ */
  function createMilestones() {
    const scene = $('.milestones__scene');
    const card = $('.ms-card');
    const orbit = $('#msOrbit');
    const numEl = $('#msNum');
    const descEl = $('#msDesc');
    const pill = $('#rulerPill');
    const track = $('#rulerTrack');
    const ticks = $('#rulerTicks');
    const prev = $('#msPrev');
    const next = $('#msNext');

    const N = MILESTONES.length;
    const STEP = 13;                 // độ lệch góc giữa 2 kỳ liền kề
    const R = 980.5;                 // bán kính vòng cung (theo thiết kế)
    const CY = 311 + R;              // tâm vòng cung (toạ độ trong card)

    const items = MILESTONES.map((m) => {
      const el = document.createElement('div');
      el.className = 'ms-year';
      el.innerHTML =
        '<span class="ms-year__dot"></span>' +
        '<img class="ms-year__mark" src="assets/svg/year-dot.svg" alt="">' +
        `<span class="ms-year__label">${m.year}</span>`;
      orbit.append(el);
      return {
        el,
        dot: el.firstElementChild,
        mark: el.children[1],
        label: el.children[2],
      };
    });

    // 8 nhóm × 8 vạch (dài, 6 ngắn, dài) = 9 mốc năm
    for (let g = 0; g < N - 1; g++) {
      const group = document.createElement('div');
      group.className = 'ruler__group';
      for (let t = 0; t < 8; t++) {
        const tick = document.createElement('i');
        tick.className = 'tick' + (t === 0 || t === 7 ? ' tick--long' : '');
        group.append(tick);
      }
      ticks.append(group);
    }

    let current = -1;
    const counter = { v: 0 };
    let goTo = () => {};

    function setYear(idx, immediate) {
      current = idx;
      const m = MILESTONES[idx];
      descEl.textContent = m.desc;
      pill.textContent = m.year;
      if (hasGsap && !immediate) {
        gsap.to(counter, {
          v: m.count, duration: 1, ease: 'power2.out', overwrite: true,
          onUpdate: () => { numEl.textContent = Math.round(counter.v); },
        });
        gsap.fromTo(descEl, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', overwrite: true });
      } else {
        counter.v = m.count;
        numEl.textContent = m.count;
      }
    }

    function render(p) {
      const cx = card.clientWidth / 2 - .5;
      items.forEach((it, i) => {
        const d = i - p;
        const a = d * STEP;
        const rad = (a * Math.PI) / 180;
        const x = cx + R * Math.sin(rad);
        const y = CY - R * Math.cos(rad);
        const w = Math.max(0, 1 - Math.abs(d));           // 1 khi ở giữa, 0 khi lệch ≥ 1 kỳ
        it.el.style.visibility = Math.abs(d) > 3.4 ? 'hidden' : 'visible';
        it.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${a.toFixed(3)}deg)`;
        it.dot.style.opacity = (1 - w).toFixed(3);
        it.mark.style.opacity = w.toFixed(3);
        it.mark.style.transform = `scale(${(.6 + .4 * w).toFixed(3)})`;
        it.label.style.transform = `translate(-50%, ${(22 + 5 * w).toFixed(2)}px) scale(${(.75 + .25 * w).toFixed(3)})`;
        it.label.style.color = `rgba(0,0,0,${(.3 + .7 * w).toFixed(3)})`;
      });
      card.style.setProperty('--rays', `${(-p * STEP).toFixed(3)}deg`);

      const half = pill.offsetWidth / 2;
      const left = half + (p / (N - 1)) * (track.clientWidth - half * 2);
      pill.style.left = `${left.toFixed(2)}px`;

      const idx = clamp(Math.round(p), 0, N - 1);
      if (idx !== current) setYear(idx);
      prev.disabled = idx === 0;
      next.disabled = idx === N - 1;
    }

    // Vừa vừa khung hình theo chiều cao màn hình
    function fit() {
      scene.style.setProperty('--fit', 1);
      const avail = window.innerHeight - headerH() - 40;
      const f = clamp(avail / scene.offsetHeight, .5, 1);
      scene.style.setProperty('--fit', f.toFixed(3));
    }

    // Kéo / bấm trên ruler
    let dragging = false;
    const fractionFromEvent = (e) => {
      const r = track.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1);
    };
    let onDrag = () => {};
    track.addEventListener('pointerdown', (e) => {
      dragging = true;
      track.setPointerCapture(e.pointerId);
      onDrag(fractionFromEvent(e), false);
    });
    track.addEventListener('pointermove', (e) => { if (dragging) onDrag(fractionFromEvent(e), true); });
    ['pointerup', 'pointercancel'].forEach((ev) => track.addEventListener(ev, () => { dragging = false; }));
    prev.addEventListener('click', () => goTo(clamp(current - 1, 0, N - 1)));
    next.addEventListener('click', () => goTo(clamp(current + 1, 0, N - 1)));

    return {
      N, render, fit, setYear,
      bind(fn, drag) { goTo = fn; onDrag = drag; },
      get current() { return current; },
    };
  }

  /* ------------------------------------------------------------------------
     Chế độ tĩnh (giảm chuyển động / không có GSAP): không pin, điều khiển bằng nút
     ------------------------------------------------------------------------ */
  function initStatic(ms) {
    let p = 4;
    ms.setYear(4, true);
    ms.render(p);
    ms.bind(
      (i) => { p = i; ms.render(p); ms.setYear(i, true); },
      (f) => { p = Math.round(f * (ms.N - 1)); ms.render(p); ms.setYear(p, true); }
    );
  }

  /* ------------------------------------------------------------------------
     Chế độ animation đầy đủ
     ------------------------------------------------------------------------ */
  function initAnimated(ms) {
    gsap.registerPlugin(ScrollTrigger);
    const hero = $('.hero');

    /* ---- 1. HERO: chữ hiện từng dòng + parallax ---- */
    const lede = $('.hero__lede');
    const ledeLines = splitLines(lede);
    let ledeWidth = lede.clientWidth;
    const titleLines = $$('.hero__title .line > span');
    hideLines(titleLines);
    hideLines(ledeLines);
    $$('[data-lines]').forEach((el) => hideLines($$('.line > span', el)));

    const intro = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => hero.classList.add('is-ready'),
    });
    intro
      .fromTo('.hero__img', { scale: 1.18 }, { scale: 1, duration: 2.8, ease: 'power3.out' }, 0)
      .fromTo(header, { yPercent: -100 }, { yPercent: 0, duration: 1.2, ease: 'power3.out', clearProps: 'transform' }, 0)
      .fromTo(titleLines, { yPercent: 115 }, { yPercent: 0, duration: 1.6, stagger: .2 }, .3)
      .fromTo('.hero__arrow', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.4 }, 1.1)
      .fromTo(ledeLines, { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: .12 }, 1.25)
      .fromTo('.hero__cta', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 2.1);

    // parallax nhiều tầng: nền chậm nhất → chữ → khối nội dung
    const heroTrigger = { trigger: hero, start: () => `top top+=${headerH()}`, end: () => `bottom top+=${headerH()}`, scrub: .5, invalidateOnRefresh: true };
    const hh = () => hero.offsetHeight;
    gsap.to('[data-parallax="bg"]', { y: () => hh() * .2, scale: 1.05, ease: 'none', scrollTrigger: heroTrigger });
    gsap.to('[data-parallax="glow-a"]', { y: () => hh() * .34, x: () => -hh() * .06, opacity: .5, ease: 'none', scrollTrigger: heroTrigger });
    gsap.to('[data-parallax="glow-b"]', { y: () => hh() * .14, x: () => hh() * .05, ease: 'none', scrollTrigger: heroTrigger });
    gsap.to('[data-parallax="title"]', { y: () => hh() * .12, opacity: .1, ease: 'none', scrollTrigger: heroTrigger });
    gsap.to('[data-parallax="aside"]', { y: () => hh() * .05, opacity: .2, ease: 'none', scrollTrigger: heroTrigger });

    // Tách lại dòng khi đổi chiều rộng (sau khi intro xong)
    window.addEventListener('resize', () => {
      if (Math.abs(lede.clientWidth - ledeWidth) < 2) return;
      ledeWidth = lede.clientWidth;
      if (hero.classList.contains('is-ready')) splitLines(lede);
    });

    /* ---- 2 + 4. Các khối bên dưới: hiện dần, chậm và mượt ---- */
    ScrollTrigger.batch($$('[data-reveal]'), {
      start: 'top 90%',
      once: true,
      interval: .12,
      batchMax: 4,
      onEnter: (batch) => {
        gsap.fromTo(batch, { opacity: 0, y: 56 }, {
          opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', stagger: .14, clearProps: 'transform',
        });
      },
    });

    // Tiêu đề: từng dòng trượt lên
    $$('[data-lines]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.fromTo($$('.line > span', el), { yPercent: 115 }, { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: .15 }),
      });
    });

    // Con số nhảy
    $$('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(o, {
          v: target, duration: 2.4, ease: 'power2.out', delay: .15,
          onUpdate: () => { el.textContent = Math.round(o.v); },
        }),
      });
    });

    // Roadmap: chấm đang diễn ra bật lên (đường nối luôn hiển thị sẵn, tránh vẽ dở dang bị gãy đoạn)
    const rails = $$('.tl-rail [data-pop]');
    if (rails.length) {
      const tl = gsap.timeline({ paused: true });
      rails.forEach((node) => {
        tl.fromTo(node, { opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(2.2)' }, '>-0.1');
      });
      ScrollTrigger.create({ trigger: '.timeline__track', start: 'top 85%', once: true, onEnter: () => tl.play() });
    }

    // CTA: nền chuyển động nhẹ trong khung + mở ra từ tỉ lệ lớn
    const ctaImg = $('.cta__bg img');
    const ctaCard = $('.cta__card');
    if (ctaImg && ctaCard) {
      gsap.fromTo(ctaImg, { yPercent: -5, scale: 1.12 }, {
        yPercent: 5, scale: 1, ease: 'none',
        scrollTrigger: { trigger: ctaCard, start: 'top bottom', end: 'bottom top', scrub: .8 },
      });
    }

    /* ---- 3. DẤU ẤN THƯƠNG HIỆU: scene pin, các năm lần lượt đi vào giữa ---- */
    const N = ms.N;
    const state = { p: 0 };
    const stepPx = () => clamp(window.innerHeight * .6, 420, 640);

    ms.fit();
    ms.render(0);
    ms.setYear(0, true);

    const msTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'milestones',
        trigger: '.milestones__pin',
        start: () => `top top+=${headerH()}`,
        end: () => `+=${(N - 1) * stepPx()}`,
        pin: true,
        scrub: .7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    msTl.to(state, { p: N - 1, duration: 1, onUpdate: () => ms.render(state.p) });

    const st = msTl.scrollTrigger;
    const yForFraction = (f) => st.start + f * (st.end - st.start);

    // Snap tự viết: khi dừng cuộn trong vùng pin thì căn năm gần nhất vào giữa.
    // (Không dùng snap có sẵn vì nó kéo trang về điểm bắt đầu cả khi đang cuộn ở ngoài vùng pin.)
    let snapTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(snapTimer);
      if (!st.isActive) return;
      snapTimer = setTimeout(() => {
        if (!st.isActive) return;
        const p = st.progress * (N - 1);
        const target = Math.round(p);
        if (Math.abs(p - target) < .01) return;
        window.scrollTo({ top: yForFraction(target / (N - 1)), behavior: 'smooth' });
      }, 180);
    }, { passive: true });

    ms.bind(
      (i) => window.scrollTo({ top: yForFraction(i / (N - 1)), behavior: 'smooth' }),
      (f, instant) => window.scrollTo({ top: yForFraction(f), behavior: instant ? 'auto' : 'smooth' })
    );

    ScrollTrigger.addEventListener('refreshInit', () => ms.fit());
    ScrollTrigger.addEventListener('refresh', () => ms.render(state.p));
  }

  /* ------------------------------------------------------------------------
     Khởi động
     ------------------------------------------------------------------------ */
  function boot() {
    initUI();
    const ms = createMilestones();
    if (hasGsap) {
      initAnimated(ms);
    } else {
      initStatic(ms);
      ms.fit();
      window.addEventListener('resize', () => { ms.fit(); });
    }
    window.addEventListener('load', () => hasGsap && ScrollTrigger.refresh());

    // Vào trang từ liên kết ngoài kèm #hash (vd. từ trang hồ sơ doanh nghiệp):
    // pin-spacer làm dịch bố cục sau khi khởi tạo, nên căn lại đúng vị trí.
    if (location.hash.length > 1) {
      const target = $(location.hash);
      if (target) {
        const jump = () => window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - headerH());
        requestAnimationFrame(() => { hasGsap && ScrollTrigger.refresh(); jump(); });
        window.addEventListener('load', () => setTimeout(jump, 60), { once: true });
      }
    }
  }

  // Chờ font để đo dòng chính xác (tối đa 2.5s)
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(boot);
})();
