/**
 * main.js
 * Interactive behavior for Navigation, Buttons, Toast & User Feedback
 */

(function () {
  'use strict';

  // Set by initLenisSmoothScroll() once Lenis has booted. Referenced by
  // any code elsewhere in this file that programmatically scrolls the
  // page (e.g. Section 02's "scroll to card" jumps) so those go through
  // Lenis instead of the native scrollTo — see smoothScrollTo() below.
  let lenisInstance = null;

  document.addEventListener('DOMContentLoaded', () => {
    initLenisSmoothScroll();
    initHeaderScroll();
    initMobileNav();
    initActionButtons();
    initLanguageSwitcher();
    initS02Scroller();
    initS03Awards();
    initS03ScrollAnimations();
    initS04QuoteScroll();
    initS05HorizontalScroll();
    initS06Timeline();
    initS07Stack();
    initS07Downloads();
    initS08Cards();
    initS08Accordions();
    initS09Stack();
    initFooterEditorAlign();
  });

  // Momentum/inertial smooth scrolling, site-wide, via the Lenis library
  // (loaded from CDN in index.html, must load before this file).
  //
  // Lenis eases the page's REAL/native scroll position (it does not swap
  // in a transformed virtual-scroll wrapper by default), so every
  // existing scroll-jacked section in this file (S02-S05, all of which
  // read native window.scrollY / getBoundingClientRect() each frame)
  // keeps working completely unchanged — they just see that native
  // position arrive more gradually. A hand-rolled version of this same
  // idea (manual wheel-event hijack + lerp) was tried earlier and caused
  // a site-wide "scroll delay" bug; Lenis is the maintained, battle-tested
  // replacement for that, but the underlying trade-off is the same by
  // design — momentum scrolling means the page keeps gliding briefly
  // after input stops. If it ever reads as laggy rather than smooth,
  // lower `duration` below first.
  function initLenisSmoothScroll() {
    if (typeof Lenis === 'undefined') return; // CDN failed to load — page still works, just without inertia

    lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1 - Math.pow(2, -10 * t)), // easeOutExpo, Lenis's own recommended default
      smoothWheel: true,
      // Touchscreens already have native momentum scrolling built in —
      // smoothing it again on top reads as sluggish/double-damped, so
      // this is intentionally left off, same reasoning as the earlier
      // (reverted) hand-rolled attempt only ever touching wheel input.
      smoothTouch: false,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Used anywhere in this file that needs to programmatically scroll the
  // page smoothly — routes through Lenis when it's active so its internal
  // scroll-position state stays in sync (mixing native scrollTo calls
  // with an active Lenis instance causes them to fight each other), and
  // falls back to native smooth-scroll if Lenis didn't load.
  function smoothScrollTo(top) {
    if (lenisInstance) {
      lenisInstance.scrollTo(top, { duration: 1.2 });
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Header shadow on scroll
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Mobile navigation drawer toggle
  function initMobileNav() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileDrawer');

    if (!menuBtn || !drawer) return;

    menuBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile drawer when clicking a link
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Action Buttons: Tải xuống báo cáo & Chia sẻ
  function initActionButtons() {
    const downloadBtn = document.getElementById('btnDownloadReport');
    const shareBtn = document.getElementById('btnShare');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Báo cáo hồ sơ TH True Milk đang được tải xuống...', 'download');

        // Create a simulated download trigger
        const fakeBlob = new Blob([
          'BÁO CÁO HỒ SƠ DOANH NGHIỆP THƯƠNG HIỆU QUỐC GIA\n\n' +
          'Doanh nghiệp: CÔNG TY CỔ PHẦN THỰC PHẨM SỮA TH TRUE MILK\n' +
          'Thời gian đạt Thương hiệu Quốc gia: 12 năm liên tiếp\n' +
          'Chuyên trang Báo Nhân Dân - Thương hiệu Quốc gia Việt Nam.'
        ], { type: 'text/plain;charset=utf-8' });

        const downloadUrl = URL.createObjectURL(fakeBlob);
        const tempLink = document.createElement('a');
        tempLink.href = downloadUrl;
        tempLink.download = 'Bao-cao-TH-True-Milk-Thuong-hieu-quoc-gia.txt';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const shareData = {
          title: 'TH True Milk - Doanh nghiệp đạt Thương hiệu Quốc gia',
          text: 'Công ty Cổ phần Thực phẩm sữa TH True Milk - Tiên phong nông nghiệp công nghệ cao.',
          url: window.location.href
        };

        if (navigator.share && window.isSecureContext) {
          try {
            await navigator.share(shareData);
            showToast('Chia sẻ thành công!', 'success');
            return;
          } catch (err) {
            // User cancelled or fallback to clipboard
          }
        }

        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Đã sao chép liên kết hồ sơ vào bộ nhớ tạm!', 'success');
        } catch (err) {
          showToast('Đã chuẩn bị liên kết để chia sẻ!', 'info');
        }
      });
    }

    // Submit button
    const submitBtn = document.getElementById('btnSubmit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        showToast('Chức năng nộp hồ sơ trực tuyến đang mở...', 'info');
      });
    }

    // Section 10: Liên hệ cập nhật hồ sơ doanh nghiệp
    const s10ContactBtn = document.getElementById('btnS10Contact');
    if (s10ContactBtn) {
      s10ContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Đang kết nối tới bộ phận tiếp nhận thông tin hồ sơ doanh nghiệp...', 'info');
      });
    }
  }

  // Language switcher
  function initLanguageSwitcher() {
    const langBtn = document.getElementById('btnLang');
    if (!langBtn) return;

    let currentLang = 'EN';
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'EN' ? 'VI' : 'EN';
      const label = langBtn.querySelector('.lang-label');
      if (label) {
        label.textContent = currentLang;
      }
      showToast(`Đã chuyển ngôn ngữ sang: ${currentLang === 'EN' ? 'English' : 'Tiếng Việt'}`, 'info');
    });
  }

  // Toast Notification System
  let toastTimer = null;
  function showToast(message, type = 'info') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span class="toast-message"></span>
      `;
      document.body.appendChild(toast);
    }

    const msgSpan = toast.querySelector('.toast-message');
    if (msgSpan) msgSpan.textContent = message;

    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Section 02: Scroll-jacking / Scrubbing Engine with GSAP Spring Physics & 3D Parallax
  function initS02Scroller() {
    const track = document.getElementById('s02');
    if (!track) return;

    // Extends the shared window.S02_CONFIG object (curved-plane.js creates
    // the `bend` section and loads first) with the 3D-tilt and transition
    // knobs this file drives. Everything below reads these live off the
    // config object rather than closing over fixed constants, so the tuning
    // panel (js/s02-debug-panel.js) can adjust them while scrolling and see
    // the effect on the very next state change / mousemove — no reload.
    // Defaults below were tuned live via the debug panel (js/s02-debug-panel.js)
    // and baked in as the new resting configuration.
    window.S02_CONFIG = window.S02_CONFIG || {};
    window.S02_CONFIG.tilt = Object.assign({
      mouseTiltActive: 4,    // deg of rotateX/Y tilt on the active card per unit mouse offset
      mouseTiltSide: 13,     // same, for the prev/next background cards
      baseTiltXDesktop: 0,   // deg resting rotateX for prev/next cards (desktop)
      baseTiltXMobile: 0,    // deg resting rotateX for prev/next cards (mobile)
      baseTiltY: 8.5,         // deg resting rotateY for prev/next cards (desktop only)
      parallaxActive: 42,    // px translate per unit mouse offset, foreground card
      parallaxPrev: 60,      // px translate per unit mouse offset, background (prev), opposite direction
      parallaxNext: 42       // px translate per unit mouse offset, background (next), opposite direction
    }, window.S02_CONFIG.tilt || {});

    window.S02_CONFIG.transition = Object.assign({
      activeDuration: 0.5,     // seconds for the active card's spring snap-in
      activeOvershoot: 0.45,   // back.out(X) overshoot amount — higher = springier
      imageDuration: 0.6,      // seconds for the active image's own resize tween
      imageOvershoot: 3,
      inactiveDuration: 0.75,  // seconds for prev/next cards settling into place
      hiddenDuration: 1.85,    // seconds for passed/future cards animating off-stage
      zActive: 40,             // 3D depth (px) of the active/foreground card
      zInactive: -70,          // 3D depth of the prev/next background cards
      zHidden: -160,           // 3D depth of the passed/future off-stage cards
      scaleInactive: 1,        // scale of prev/next cards
      scaleHidden: 0.3,        // scale of passed/future cards
      blurInactive: 14,        // px blur on prev/next cards
      blurHidden: 40           // px blur on passed/future cards
    }, window.S02_CONFIG.transition || {});

    const cards = Array.from(track.querySelectorAll('.s02-card'));
    const categoryButtons = Array.from(track.querySelectorAll('.s02-category-item'));
    const counterCurrent = document.getElementById('s02CounterCurrent');
    const scrollPrompt = document.getElementById('s02ScrollPrompt');

    if (!cards.length) return;

    let activeIndex = 0;
    let isTicking = false;

    function getTrackMetrics() {
      const rect = track.getBoundingClientRect();
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const trackTop = window.scrollY + rect.top;
      const trackHeight = track.offsetHeight;
      const viewportHeight = window.innerHeight;
      const stickyHeight = viewportHeight - headerHeight;
      const maxScroll = Math.max(1, trackHeight - stickyHeight);
      // Phase 1: Card scrubbing (cards 1 to 12).
      // Phase 2: Transition hold (exactly 1 viewport = stickyHeight).
      // During Phase 2, Section 2 stays pinned on the final card (motionless)
      // while Section 3 slides up from below and smoothly covers Section 2.
      const cardsScrollDistance = Math.max(1, maxScroll - stickyHeight);
      return { rect, headerHeight, trackTop, trackHeight, viewportHeight, stickyHeight, maxScroll, cardsScrollDistance };
    }

    // Clamp a value between [min, max] — mirrors CSS clamp(min, val, max).
    function clampNum(min, val, max) {
      return Math.max(min, Math.min(max, val));
    }

    // Shared layout metrics used both by the scroll-driven state renderer
    // and by the mouse parallax handler, so parallax offsets always land
    // on top of the correct base position for the current breakpoint.
    function getCardLayout() {
      const winW = window.innerWidth;
      const isDesktop = winW > 992;
      const isLargeDesktop = winW > 1200;
      const { viewportHeight } = getTrackMetrics();

      // Card image dimensions. At/below the 1440px reference frame these are
      // flat 350x236 (unchanged from the original design). Beyond that, the
      // active image keeps growing with viewport width (24vw) up to a 520px
      // cap, so it doesn't stay visually tiny on 2K/wide screens; inactive
      // size and the horizontal offset scale in the same proportion. These
      // numbers mirror the clamp() values in css/s02.css so the CSS
      // max-width/height caps never fight the GSAP-driven inline size.
      const activeW = isLargeDesktop ? clampNum(350, winW * 0.24, 520) : (isDesktop ? 300 : 250);
      const activeH = isLargeDesktop ? clampNum(236, winW * 0.162, 351) : (isDesktop ? 202 : 168);
      const inactiveW = isLargeDesktop ? clampNum(310, winW * 0.213, 461) : (isDesktop ? 270 : 220);
      const inactiveH = isLargeDesktop ? clampNum(176, winW * 0.121, 262) : (isDesktop ? 154 : 148);
      const inactiveX = isLargeDesktop ? clampNum(175, winW * 0.12, 260) : (isDesktop ? 150 : 0);

      // Inactive top/bottom offsets: card partially cut off by ~30px at edges
      const topY = isDesktop ? (-(viewportHeight / 2) + 58) : -150;
      const bottomY = isDesktop ? ((viewportHeight / 2) - 58) : 150;

      return { winW, isDesktop, isLargeDesktop, viewportHeight, activeW, activeH, inactiveW, inactiveH, inactiveX, topY, bottomY };
    }

    function renderCardsGSAP(targetIndex, prevIndex, instant = false, isDown = true) {
      if (typeof gsap === 'undefined') return;

      const { isDesktop, activeW, activeH, inactiveW, inactiveH, inactiveX, topY, bottomY } = getCardLayout();
      const t = window.S02_CONFIG.transition;
      const tilt = window.S02_CONFIG.tilt;
      const baseTiltX = isDesktop ? tilt.baseTiltXDesktop : tilt.baseTiltXMobile;
      const baseTiltY = isDesktop ? tilt.baseTiltY : 0;
      const activeEase = `back.out(${t.activeOvershoot})`;
      const imageEase = `back.out(${t.imageOvershoot})`;

      cards.forEach((card, idx) => {
        const imageWrap = card.querySelector('.s02-card-image-wrap');
        const info = card.querySelector('.s02-card-info');

        card.classList.remove('is-active', 'is-prev', 'is-next', 'is-passed', 'is-future');

        if (idx === targetIndex) {
          // 1. ACTIVE CARD: Spring Physics, Overshoot & Damping, Foreground
          card.classList.add('is-active');

          if (instant) {
            gsap.set(card, {
              x: 0,
              yPercent: -50,
              y: 0,
              z: t.zActive,
              scale: 1,
              rotateX: 0,
              rotateY: 0,
              filter: 'blur(0px)',
              opacity: 1,
              autoAlpha: 1,
              zIndex: 10,
              pointerEvents: 'auto'
            });
            if (imageWrap) gsap.set(imageWrap, { width: activeW, height: activeH });
            if (info) gsap.set(info, { opacity: 1, x: 0, autoAlpha: 1 });
          } else {
            // Spring Overshoot & Damping
            gsap.to(card, {
              x: 0,
              yPercent: -50,
              y: 0,
              z: t.zActive,
              scale: 1,
              rotateX: 0,
              rotateY: 0,
              filter: 'blur(0px)',
              opacity: 1,
              autoAlpha: 1,
              zIndex: 10,
              pointerEvents: 'auto',
              duration: t.activeDuration,
              ease: activeEase,
              overwrite: 'auto'
            });

            if (imageWrap) {
              gsap.to(imageWrap, {
                width: activeW,
                height: activeH,
                duration: t.imageDuration,
                ease: imageEase,
                overwrite: 'auto'
              });
            }

            // Inertia stagger lag on text details
            if (info) {
              gsap.killTweensOf(info);
              gsap.fromTo(info,
                {
                  opacity: 0,
                  x: isDown ? 32 : -32,
                  autoAlpha: 0
                },
                {
                  opacity: 1,
                  x: 0,
                  autoAlpha: 1,
                  duration: 0.55,
                  delay: 0.09,
                  ease: 'power3.out',
                  overwrite: 'auto'
                }
              );
            }
          }
        } else if (idx === targetIndex - 1) {
          // 2. PREVIOUS CARD (Top Inactive: recedes back, tilts up)
          card.classList.add('is-prev');

          if (instant) {
            gsap.set(card, {
              x: inactiveX,
              yPercent: -50,
              y: topY,
              z: t.zInactive,
              scale: t.scaleInactive,
              rotateX: -baseTiltX,
              rotateY: baseTiltY,
              filter: `blur(${t.blurInactive}px)`,
              opacity: 1,
              autoAlpha: 1,
              zIndex: 3,
              pointerEvents: 'auto'
            });
            if (imageWrap) gsap.set(imageWrap, { width: inactiveW, height: inactiveH });
            if (info) gsap.set(info, { opacity: 0, x: 20, autoAlpha: 0 });
          } else {
            // Fluid physical deceleration inertia
            gsap.to(card, {
              x: inactiveX,
              yPercent: -50,
              y: topY,
              z: t.zInactive,
              scale: t.scaleInactive,
              rotateX: -baseTiltX,
              rotateY: baseTiltY,
              filter: `blur(${t.blurInactive}px)`,
              opacity: 1,
              autoAlpha: 1,
              zIndex: 3,
              pointerEvents: 'auto',
              duration: t.inactiveDuration,
              ease: 'power3.out',
              overwrite: 'auto'
            });

            if (imageWrap) {
              gsap.to(imageWrap, {
                width: inactiveW,
                height: inactiveH,
                duration: t.inactiveDuration,
                ease: 'power3.out',
                overwrite: 'auto'
              });
            }

            if (info) {
              gsap.to(info, {
                opacity: 0,
                x: 20,
                autoAlpha: 0,
                duration: 0.25,
                ease: 'power2.in',
                overwrite: 'auto'
              });
            }
          }
        } else if (idx === targetIndex + 1) {
          // 3. NEXT CARD (Bottom Inactive: recedes back, tilts down)
          card.classList.add('is-next');

          if (instant) {
            gsap.set(card, {
              x: inactiveX,
              yPercent: -50,
              y: bottomY,
              z: t.zInactive,
              scale: t.scaleInactive,
              rotateX: baseTiltX,
              rotateY: baseTiltY,
              filter: `blur(${t.blurInactive}px)`,
              opacity: 1,
              autoAlpha: 1,
              zIndex: 3,
              pointerEvents: 'auto'
            });
            if (imageWrap) gsap.set(imageWrap, { width: inactiveW, height: inactiveH });
            if (info) gsap.set(info, { opacity: 0, x: 20, autoAlpha: 0 });
          } else {
            gsap.to(card, {
              x: inactiveX,
              yPercent: -50,
              y: bottomY,
              z: t.zInactive,
              scale: t.scaleInactive,
              rotateX: baseTiltX,
              rotateY: baseTiltY,
              filter: `blur(${t.blurInactive}px)`,
              opacity: 1,
              autoAlpha: 1,
              zIndex: 3,
              pointerEvents: 'auto',
              duration: t.inactiveDuration,
              ease: 'power3.out',
              overwrite: 'auto'
            });

            if (imageWrap) {
              gsap.to(imageWrap, {
                width: inactiveW,
                height: inactiveH,
                duration: t.inactiveDuration,
                ease: 'power3.out',
                overwrite: 'auto'
              });
            }

            if (info) {
              gsap.to(info, {
                opacity: 0,
                x: 20,
                autoAlpha: 0,
                duration: 0.25,
                ease: 'power2.in',
                overwrite: 'auto'
              });
            }
          }
        } else if (idx < targetIndex - 1) {
          // 4. PASSED CARDS (Hidden offscreen above)
          card.classList.add('is-passed');

          if (instant) {
            gsap.set(card, {
              x: inactiveX,
              yPercent: -50,
              y: topY - 180,
              z: t.zHidden,
              scale: t.scaleHidden,
              rotateX: -baseTiltX * 2,
              rotateY: baseTiltY * 1.5,
              filter: `blur(${t.blurHidden}px)`,
              opacity: 0,
              autoAlpha: 0,
              zIndex: 1,
              pointerEvents: 'none'
            });
            if (info) gsap.set(info, { opacity: 0, autoAlpha: 0 });
          } else {
            gsap.to(card, {
              x: inactiveX,
              yPercent: -50,
              y: topY - 180,
              z: t.zHidden,
              scale: t.scaleHidden,
              rotateX: -baseTiltX * 2,
              rotateY: baseTiltY * 1.5,
              filter: `blur(${t.blurHidden}px)`,
              opacity: 0,
              autoAlpha: 0,
              zIndex: 1,
              pointerEvents: 'none',
              duration: t.hiddenDuration,
              ease: 'power3.out',
              overwrite: 'auto'
            });
            if (info) gsap.set(info, { opacity: 0, autoAlpha: 0 });
          }
        } else {
          // 5. FUTURE CARDS (Hidden offscreen below)
          card.classList.add('is-future');

          if (instant) {
            gsap.set(card, {
              x: inactiveX,
              yPercent: -50,
              y: bottomY + 180,
              z: t.zHidden,
              scale: t.scaleHidden,
              rotateX: baseTiltX * 2,
              rotateY: baseTiltY * 1.5,
              filter: `blur(${t.blurHidden}px)`,
              opacity: 0,
              autoAlpha: 0,
              zIndex: 1,
              pointerEvents: 'none'
            });
            if (info) gsap.set(info, { opacity: 0, autoAlpha: 0 });
          } else {
            gsap.to(card, {
              x: inactiveX,
              yPercent: -50,
              y: bottomY + 180,
              z: t.zHidden,
              scale: t.scaleHidden,
              rotateX: baseTiltX * 2,
              rotateY: baseTiltY * 1.5,
              filter: `blur(${t.blurHidden}px)`,
              opacity: 0,
              autoAlpha: 0,
              zIndex: 1,
              pointerEvents: 'none',
              duration: t.hiddenDuration,
              ease: 'power3.out',
              overwrite: 'auto'
            });
            if (info) gsap.set(info, { opacity: 0, autoAlpha: 0 });
          }
        }
      });
    }

    function updateStates(index, instant = false) {
      if (index === activeIndex && !instant) return;
      const prevIndex = activeIndex;
      const isDown = index >= prevIndex;
      activeIndex = index;

      // Update counter with flip / momentum animation
      if (counterCurrent) {
        if (typeof gsap !== 'undefined' && !instant) {
          gsap.fromTo(counterCurrent,
            { y: isDown ? -8 : 8, opacity: 0.2 },
            { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
          );
          counterCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
        } else {
          counterCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
        }
      }

      // Update category highlight (3 cards per category)
      const activeCat = Math.floor(activeIndex / 3);
      categoryButtons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === activeCat);
      });

      // Render 3D GSAP Physics on card stack
      renderCardsGSAP(activeIndex, prevIndex, instant, isDown);
    }

    function onScroll() {
      const { rect, headerHeight, cardsScrollDistance } = getTrackMetrics();

      if (rect.top > headerHeight) {
        // Above section
        updateStates(0);
      } else {
        // Inside sticky track
        const scrolled = headerHeight - rect.top;
        if (scrolled >= cardsScrollDistance) {
          // Cards 01-12 complete: Section 2 stays pinned on card 12, motionless, while Section 3 slides over
          updateStates(cards.length - 1);
        } else {
          // Scrubbing through the 12 cards
          const progress = Math.min(1, Math.max(0, scrolled / cardsScrollDistance));
          const target = Math.min(cards.length - 1, Math.floor(progress * cards.length));
          updateStates(target);
        }
      }
      isTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        window.requestAnimationFrame(onScroll);
        isTicking = true;
      }
    }, { passive: true });

    function scrollToCard(index) {
      const { headerHeight, trackTop, cardsScrollDistance } = getTrackMetrics();
      const clampedIndex = Math.max(0, Math.min(cards.length - 1, index));
      const targetScroll = trackTop - headerHeight + (clampedIndex / (cards.length - 1)) * cardsScrollDistance + 2;
      smoothScrollTo(targetScroll);
    }

    // Category click handlers: jump smoothly to start of category
    categoryButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const startCard = parseInt(btn.getAttribute('data-card-start') || '0', 10);
        scrollToCard(startCard);
      });
    });

    // Clicking inactive cards focuses that card
    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx !== activeIndex) {
          scrollToCard(idx);
        }
      });
    });

    // Scroll prompt click handler
    if (scrollPrompt) {
      scrollPrompt.addEventListener('click', () => {
        if (activeIndex < cards.length - 1) {
          scrollToCard(activeIndex + 1);
        } else {
          const { trackTop, trackHeight, stickyHeight } = getTrackMetrics();
          smoothScrollTo(trackTop + trackHeight - stickyHeight);
        }
      });

      scrollPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          scrollPrompt.click();
        }
      });
    }

    // Keyboard arrow keys when inside track
    window.addEventListener('keydown', (e) => {
      const { rect } = getTrackMetrics();
      const isInside = rect.top <= 50 && rect.bottom >= window.innerHeight - 50;
      if (!isInside) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (activeIndex < cards.length - 1) {
          e.preventDefault();
          scrollToCard(activeIndex + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (activeIndex > 0) {
          e.preventDefault();
          scrollToCard(activeIndex - 1);
        }
      }
    });

    // 3D Perspective Parallax on Mouse Move
    // Depth-based parallax: the foreground (active) card drifts WITH the
    // cursor; the two background layers (prev/next) drift in the OPPOSITE
    // direction and at different speeds from each other, so the stack reads
    // as layered depth rather than everything moving in lockstep. All the
    // tunable numbers live on window.S02_CONFIG.tilt (see top of this
    // function) — read live on every mousemove so the debug panel's
    // sliders take effect immediately.
    track.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 992 || typeof gsap === 'undefined') return;
      const rect = track.getBoundingClientRect();
      if (rect.top > 80 || rect.bottom < 0) return;

      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
      const { inactiveX, topY, bottomY } = getCardLayout();
      const tilt = window.S02_CONFIG.tilt;

      const activeCard = cards[activeIndex];
      if (activeCard) {
        gsap.to(activeCard, {
          x: normX * tilt.parallaxActive,
          y: normY * (tilt.parallaxActive * 0.6),
          rotateY: normX * tilt.mouseTiltActive,
          rotateX: -normY * tilt.mouseTiltActive,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }

      const prevCard = cards[activeIndex - 1];
      if (prevCard) {
        gsap.to(prevCard, {
          x: inactiveX - normX * tilt.parallaxPrev,
          y: topY - normY * tilt.parallaxPrev,
          rotateY: -tilt.baseTiltY + normX * tilt.mouseTiltSide,
          rotateX: -tilt.baseTiltXDesktop - normY * tilt.mouseTiltSide,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }

      const nextCard = cards[activeIndex + 1];
      if (nextCard) {
        gsap.to(nextCard, {
          x: inactiveX - normX * tilt.parallaxNext,
          y: bottomY - normY * tilt.parallaxNext,
          rotateY: -tilt.baseTiltY + normX * tilt.mouseTiltSide,
          rotateX: tilt.baseTiltXDesktop - normY * tilt.mouseTiltSide,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    });

    track.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 992 || typeof gsap === 'undefined') return;
      const { inactiveX, topY, bottomY } = getCardLayout();
      const tilt = window.S02_CONFIG.tilt;

      const activeCard = cards[activeIndex];
      if (activeCard) {
        gsap.to(activeCard, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      }
      const prevCard = cards[activeIndex - 1];
      if (prevCard) {
        gsap.to(prevCard, { x: inactiveX, y: topY, rotateX: -tilt.baseTiltXDesktop, rotateY: -tilt.baseTiltY, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      }
      const nextCard = cards[activeIndex + 1];
      if (nextCard) {
        gsap.to(nextCard, { x: inactiveX, y: bottomY, rotateX: tilt.baseTiltXDesktop, rotateY: -tilt.baseTiltY, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      }
    });

    // Handle viewport resize recalibration
    window.addEventListener('resize', () => {
      renderCardsGSAP(activeIndex, activeIndex, true, false);
    }, { passive: true });

    // Initial instant placement (no animation on first frame)
    renderCardsGSAP(0, 0, true, false);
    onScroll();

    // Exposed for the debug panel (js/s02-debug-panel.js): lets it re-trigger
    // the active/prev/next transition on demand, so a tuning change (e.g. a
    // new ease or overshoot) can be previewed instantly instead of needing
    // to scroll away and back.
    window.S02_replayTransition = () => renderCardsGSAP(activeIndex, activeIndex, false, true);
  }

  // Section 03: Giải thưởng & Danh hiệu — floating medal/trophy reveal on
  // hover. Each row's black-highlight state is pure CSS (:hover on
  // .s03-item), but the floating image needs live cursor coordinates, so
  // that part is JS: on entering a row the image appears (scale 0 -> 1)
  // anchored to the cursor's entry point, follows the cursor while
  // hovering, then shrinks back to 0 anchored at wherever the cursor left
  // from. Each row carries its own image in data-medal-src, swapped onto
  // the one shared floating <img> on mouseenter. The 8 "Danh hiệu cấp
  // quốc gia" rows use their real matching certificate/medal photo from
  // assets/s3/giải 0X.jpg; the 7 "Giải thưởng cấp quốc tế" rows reuse
  // that same 8-photo set (giai-01.jpg–07.jpg) since no dedicated image
  // exists per international award yet.
  function initS03Awards() {
    const section = document.getElementById('s03');
    if (!section) return;

    const medal = section.querySelector('.s03-medal');
    const items = section.querySelectorAll('.s03-item');
    if (!medal || !items.length) return;

    function positionMedalAt(e) {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      medal.style.left = `${x}px`;
      medal.style.top = `${y}px`;
    }

    items.forEach((item) => {
      item.addEventListener('mouseenter', (e) => {
        if (item.dataset.medalSrc) {
          medal.src = item.dataset.medalSrc;
        }
        positionMedalAt(e);
        medal.classList.add('is-visible');
      });
      item.addEventListener('mousemove', positionMedalAt);
      item.addEventListener('mouseleave', (e) => {
        positionMedalAt(e);
        medal.classList.remove('is-visible');
      });
    });
  }

  // Section 03: Scroll Entrance Animations for Data Items & Dividing Lines
  // - Dividing lines fade in and draw smoothly from left to right (scaleX: 0 -> 1)
  // - Content fades in and translates upward (translateY: 16px -> 0, opacity: 0 -> 1)
  // - Elements appearing in the viewport first animate first, in sequential top-to-bottom order
  function initS03ScrollAnimations() {
    const section = document.getElementById('s03');
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(section.querySelectorAll('.s03-divider, .s03-group-label, .s03-item'));

    if (prefersReducedMotion) {
      targets.forEach(el => el.classList.add('is-animated'));
      return;
    }

    let queue = [];
    let timer = null;

    function processQueue() {
      // Sort in strict top-to-bottom DOM order
      queue.sort((a, b) => targets.indexOf(a) - targets.indexOf(b));

      queue.forEach((el, idx) => {
        const delay = idx * 60; // 60ms stagger between sequential rows
        el.style.transitionDelay = `${delay}ms`;

        const contentMain = el.querySelector('.s03-item-main');
        const contentIndex = el.querySelector('.s03-item-index');
        if (contentMain) contentMain.style.transitionDelay = `${delay + 30}ms`;
        if (contentIndex) contentIndex.style.transitionDelay = `${delay + 45}ms`;

        requestAnimationFrame(() => {
          el.classList.add('is-animated');
        });
      });

      queue = [];
      timer = null;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          obs.unobserve(el);
          queue.push(el);
          if (!timer) {
            timer = setTimeout(processQueue, 35);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -30px 0px',
      threshold: 0.05
    });

    targets.forEach(el => observer.observe(el));

    // Also check on scroll to ensure fast-scroll catches every item.
    // rAF-batched like every other section's scroll handler — this one
    // used to run unthrottled on every native scroll event (each call
    // doing a getBoundingClientRect() read per not-yet-animated row),
    // which is real, avoidable jank distinct from the earlier wheel/scroll
    // "delay" bug: this doesn't touch input timing at all, it just caps
    // how often the (already-correct) check runs to once per frame.
    function checkVisibility() {
      const winH = window.innerHeight;
      let hasNew = false;
      targets.forEach((el) => {
        if (!el.classList.contains('is-animated')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < winH - 20 && rect.bottom > 0) {
            observer.unobserve(el);
            queue.push(el);
            hasNew = true;
          }
        }
      });
      if (hasNew && !timer) {
        timer = setTimeout(processQueue, 35);
      }
      isCheckTicking = false;
    }

    let isCheckTicking = false;
    window.addEventListener('scroll', () => {
      if (!isCheckTicking) {
        window.requestAnimationFrame(checkVisibility);
        isCheckTicking = true;
      }
    }, { passive: true });
    checkVisibility();
  }

  // Section 04: Scroll-scrubbed quote text reveal
  // Smoothly transitions words from 20% gray (Figma default) to solid black.
  //
  // Desktop (>768px, matching css/s04.css's breakpoint for .s04-track):
  // driven by scroll progress through .s04-track's tall spacer while .s04
  // itself is position:sticky (pinned) inside it — the section only starts
  // revealing text once its top has reached the header ("sticky lại mới
  // bắt đầu load chữ"), and the reveal is compressed into the first 80% of
  // the track's scroll distance, leaving the last 20% as a hold with the
  // quote fully black before the section releases ("load hết thì mới bắt
  // đầu chuyển sang section tiếp theo").
  //
  // Mobile/tablet (<=768px): .s04-track has no extra height and .s04 isn't
  // sticky there (see css/s04.css), since the portrait image + button
  // stacked below the quote can be taller than the viewport — pinning
  // would trap them off-screen with no way to scroll to them. Falls back
  // to a simple reveal driven by the quote's own position on the page.
  function initS04QuoteScroll() {
    const track = document.getElementById('s04Track');
    const quoteEl = document.getElementById('s04Quote');
    if (!quoteEl) return;

    const rawText = quoteEl.textContent.trim();
    const words = rawText.split(/(\s+)/);
    quoteEl.innerHTML = '';

    const wordSpans = [];
    words.forEach((chunk) => {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) {
        quoteEl.appendChild(document.createTextNode(chunk));
      } else {
        const span = document.createElement('span');
        span.className = 's04-quote-word';
        span.textContent = chunk;
        quoteEl.appendChild(span);
        wordSpans.push(span);
      }
    });

    const totalWords = wordSpans.length;
    if (!totalWords) return;

    const PIN_BREAKPOINT = 768;
    const REVEAL_FRACTION = 0.8; // reveal completes at 80% of the pinned scroll distance; the rest is a hold

    function paintWords(progress) {
      wordSpans.forEach((span, i) => {
        const wordStart = i / totalWords;
        const wordEnd = Math.min(1, (i + 1.2) / totalWords);
        const wordProgress = Math.max(0, Math.min(1, (progress - wordStart) / (wordEnd - wordStart)));
        const alpha = 0.20 + 0.80 * wordProgress;
        span.style.color = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
      });
    }

    function pinnedProgress() {
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const rect = track.getBoundingClientRect();
      const trackHeight = track.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, trackHeight - (viewportHeight - headerHeight));
      const scrolled = headerHeight - rect.top;
      const rawProgress = Math.max(0, Math.min(1, scrolled / maxScroll));
      return Math.min(1, rawProgress / REVEAL_FRACTION);
    }

    function simpleProgress() {
      const rect = quoteEl.getBoundingClientRect();
      const winH = window.innerHeight;
      // Transition starts when quote is at 82% of viewport height (comfortably entered)
      // Reaches 100% black when quote top reaches 30% of viewport height
      const startY = winH * 0.82;
      const endY = winH * 0.30;
      return Math.max(0, Math.min(1, (startY - rect.top) / (startY - endY)));
    }

    function updateQuoteColor() {
      const usePin = track && window.innerWidth > PIN_BREAKPOINT;
      const progress = usePin ? pinnedProgress() : simpleProgress();
      paintWords(progress);
      isTicking = false;
    }

    let isTicking = false;
    window.addEventListener('scroll', () => {
      if (!isTicking) {
        requestAnimationFrame(updateQuoteColor);
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateQuoteColor, { passive: true });
    updateQuoteColor();

    // Hook Section 4 view all button
    const btnViewAll = document.getElementById('btnS04ViewAll');
    if (btnViewAll) {
      btnViewAll.addEventListener('click', () => {
        if (typeof showToast === 'function') {
          showToast('Đang tải thêm thông tin lãnh đạo doanh nghiệp...');
        }
      });
    }
  }

  // Section 05: Horizontal scroll-jack ("Lĩnh vực nông nghiệp công nghệ cao...")
  // Vertical scroll drives horizontal motion of a "rail" of frames, same
  // pinning technique as Section 02 (tall track + sticky viewport) but
  // translating sideways instead of swapping card states.
  //
  // The opening "parallax scene" (#s05ParallaxScene, css/s05.css
  // .s05-frame--parallax) is the entire Section 05 rail — there's nothing
  // after it. It stacks the background image, the intro text and ALL 5
  // text cards (grouped as ONE layer that moves together, not 5
  // independent frames) as three absolutely-positioned layers sharing
  // the same screen region, each with its OWN motion on top of the
  // rail's shared 1:1 translateX:
  //   - image: lags behind (moves SLOWER than the rail); ratio-locked
  //     (css/s05.css .s05-layer--image) so it's never cropped/distorted.
  //     Its resting `left` is set by measure() below so it sits CENTERED
  //     in the gap between the text panel's right edge and the cards
  //     group's left edge — that gap itself is set to 70% of the image's
  //     own width, so the image overlaps 15% of its own width under each
  //     neighbor, symmetrically (GAP_TO_IMAGE_WIDTH_RATIO).
  //   - text: exits FASTER than the rail alone would carry it off-screen.
  //   - cards group: rests right after that same gap (measure() sets its
  //     `left` to textRight + gap) and starts with an extra rightward
  //     push that decays to 0, so the whole group of 5 cards visibly
  //     rushes in together, at one shared speed, ahead of the rail's own
  //     baseline pace.
  // Because the two opaque foreground layers (text, cards group) sit
  // above the image in z-index, their extra speed reads as sliding
  // over/through the image as they pass through its screen region — the
  // classic multi-layer horizontal parallax look. All three motions are
  // driven by "local scroll" — how far scroll has moved past this
  // frame's own start (frame is first in the rail, so that's just the
  // raw scrolled px), clamped so each stops changing once its own
  // transition is done, exactly like the image's lag already worked
  // before.
  function initS05HorizontalScroll() {
    const track = document.getElementById('s05Track');
    const rail = document.getElementById('s05Rail');
    const scene = document.getElementById('s05ParallaxScene');
    const parallaxImg = document.getElementById('s05ParallaxImage');
    const textLayer = document.getElementById('s05LayerText');
    const imageLayer = document.getElementById('s05LayerImage');
    const cardsGroup = document.getElementById('s05LayerCards');
    if (!track || !rail) return;

    const IMAGE_LAG_RATE = 0.15; // fraction of scrolled px the photo counter-shifts inside its overscan container for subtle parallax depth
    const IMAGE_LAG_MAX_PX = 160; // cap within the overscan budget (.s05-frame-img left: -160px; width: calc(100% + 320px))

    let maxTranslate = 0;
    const MOBILE_BREAKPOINT = 768; // matches css/s05.css's @media (max-width: 768px)

    function measure() {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (!isMobile && textLayer && imageLayer && cardsGroup) {
        const textRight = textLayer.offsetWidth;
        const stickyEl = scene.closest('.s05-sticky') || scene.parentElement;
        const availableHeight = (stickyEl && stickyEl.clientHeight) ? stickyEl.clientHeight : imageLayer.offsetHeight;

        // Native photo ratio (assets/s5/image 1.jpg is 2462x1800)
        const imageRatio = 2462 / 1800;
        // Auto-calculate exact rendered image width from viewport height
        const imageW = Math.round(availableHeight * imageRatio) || imageLayer.offsetWidth;

        // Distance between Image 1 and Frame 3 is exactly 0:
        // Image 1 spans [textRight, textRight + imageW], Frame 3 starts at textRight + imageW.
        // 1px overlap on each side prevents subpixel rendering seams.
        imageLayer.style.left = `${textRight - 1}px`;
        imageLayer.style.width = `${imageW + 2}px`;

        const cardsLeft = textRight + imageW;
        cardsGroup.style.left = `${cardsLeft}px`;

        textLayer.style.transform = '';

        const cardsWidth = Math.max(cardsGroup.offsetWidth, cardsGroup.scrollWidth);
        const totalContentWidth = cardsLeft + cardsWidth;

        if (scene) {
          scene.style.width = `${totalContentWidth}px`;
          scene.style.flexBasis = `${totalContentWidth}px`;
        }

        // When Frame 3 scrolls 20% faster than Image 1 (speed 1.2x vs 1.0x),
        // the last card reaches the viewport right edge when:
        // totalContentWidth - 1.2 * maxTranslate = window.innerWidth
        // => maxTranslate = (totalContentWidth - window.innerWidth) / 1.2
        maxTranslate = Math.max(0, (totalContentWidth - window.innerWidth) / 1.2);
      } else if (isMobile && scene) {
        // Reset inline styling on mobile so stacked column CSS takes over
        scene.style.width = '';
        scene.style.flexBasis = '';
        if (imageLayer) {
          imageLayer.style.left = '';
          imageLayer.style.width = '';
        }
        if (cardsGroup) {
          cardsGroup.style.left = '';
          cardsGroup.style.transform = '';
        }
        if (textLayer) {
          textLayer.style.transform = '';
        }
        maxTranslate = Math.max(0, rail.scrollWidth - window.innerWidth);
      } else {
        maxTranslate = Math.max(0, rail.scrollWidth - window.innerWidth);
      }

      track.style.height = `${maxTranslate + window.innerHeight}px`;
    }

    let isTicking = false;

    function onScroll() {
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const rect = track.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const trackHeight = track.offsetHeight;
      const maxScroll = Math.max(1, trackHeight - viewportHeight);
      const scrolled = Math.min(maxScroll, Math.max(0, headerHeight - rect.top));
      const progress = scrolled / maxScroll; // 0 (frame 1) -> 1 (last frame)

      rail.style.transform = `translateX(${-progress * maxTranslate}px)`;

      if (scene) {
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

        if (!isMobile && cardsGroup) {
          // Frame 3 scrolls 20% faster than Image 1 (rail speed 1.0 + extra 0.2 = 1.2x net speed)
          const extraShift = scrolled * 0.2;
          cardsGroup.style.transform = `translateX(${-extraShift}px)`;
        }

        if (parallaxImg) {
          // Photo counter-shifts inside its overscan wrapper for depth, never exposing container edges
          const lagOffset = Math.min(scrolled * IMAGE_LAG_RATE, IMAGE_LAG_MAX_PX);
          parallaxImg.style.transform = `translateX(${lagOffset}px)`;
        }
      }

      isTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        window.requestAnimationFrame(onScroll);
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      measure();
      onScroll();
    }, { passive: true });

    if (parallaxImg && !parallaxImg.complete) {
      parallaxImg.addEventListener('load', () => {
        measure();
        onScroll();
      });
    }

    window.addEventListener('load', () => {
      measure();
      onScroll();
    });

    measure();
    onScroll();
  }

  // ==========================================================================
  // Section 06: Lịch sử hình thành (Interactive Timeline)
  // Figma Node: 732:1950
  // ==========================================================================
  function initS06Timeline() {
    const track = document.getElementById('s06TimelineTrack');
    const contentInner = document.getElementById('s06ContentInner');
    const milestoneTitle = document.getElementById('s06MilestoneTitle');
    const milestoneDesc = document.getElementById('s06MilestoneDesc');
    const milestoneImg = document.getElementById('s06MilestoneImg');
    const btnPrev = document.getElementById('btnS06Prev');
    const btnNext = document.getElementById('btnS06Next');
    const counterCurrent = document.getElementById('s06CounterCurrent');
    const counterTotal = document.getElementById('s06CounterTotal');

    if (!track || !contentInner) return;

    const milestones = [
      {
        year: '2009',
        title: 'Khởi dựng chuỗi sữa công nghệ cao',
        desc: 'Triển khai dự án 1,2 tỷ USD tại Nghệ An',
        image: 'assets/s6/milestone-2009.jpg'
      },
      {
        year: '2010',
        title: 'TH True Milk ra mắt thị trường',
        desc: 'Đặt nền tảng thương hiệu sữa tươi của TH.',
        image: 'assets/s6/milestone-2010.jpg'
      },
      {
        year: '2013',
        title: 'Mở rộng năng lực chế biến quy mô lớn',
        desc: 'Khánh thành nhà máy sữa tươi sạch tại Nghệ An.',
        image: 'assets/s6/milestone-2013.jpg'
      },
      {
        year: '2018',
        title: 'Bắt đầu đầu tư sản xuất tại Liên bang Nga',
        desc: 'Mở rộng mô hình nông nghiệp công nghệ cao ra thị trường quốc tế.',
        image: 'assets/s6/milestone-2018.jpg'
      },
      {
        year: '2019',
        title: 'Thiết lập dấu mốc xuất khẩu sữa chính ngạch sang Trung Quốc',
        desc: 'TH True Milk trở thành doanh nghiệp Việt Nam đầu tiên được cấp mã xuất khẩu sản phẩm sữa.',
        image: 'assets/s6/milestone-2019.jpg'
      },
      {
        year: '2025',
        title: 'Hoàn thiện năng lực chuỗi sản xuất tại Nga',
        desc: 'Khánh thành nhà máy chế biến sữa Kaluga',
        image: 'assets/s6/milestone-2025.jpg'
      }
    ];

    let currentIndex = 0;

    // Helper to generate minor ticks per 350px segment (Ref 2: tall line is at index 0, minor ticks start from 1)
    function generateTicksSvg() {
      const count = 16;
      let lines = '';
      for (let i = 1; i < count; i++) {
        const x = (i * (350 / (count - 1))).toFixed(2);
        lines += `<line x1="${x}" y1="0" x2="${x}" y2="40" stroke="#D9D9D9" stroke-width="1.2"/>`;
      }
      return `<svg class="s06-ticks-svg" viewBox="0 0 350 40" fill="none" preserveAspectRatio="none">${lines}</svg>`;
    }

    // Render timeline segments with tall marker line at left: 0 (Ref 2)
    track.innerHTML = milestones.map((item, idx) => `
      <div class="s06-year-segment ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <div class="s06-year-marker-line" aria-hidden="true"></div>
        <div class="s06-year-header">
          <button type="button" class="s06-year-btn" data-index="${idx}" aria-label="Xem năm ${item.year}">
            ${item.year}
          </button>
        </div>
        <div class="s06-ruler-ticks" aria-hidden="true">
          ${generateTicksSvg()}
        </div>
      </div>
    `).join('');

    const segments = track.querySelectorAll('.s06-year-segment');

    if (counterTotal) {
      counterTotal.textContent = `/${String(milestones.length).padStart(2, '0')}`;
    }

    function updateIndicatorHeight() {
      const wrap = document.querySelector('.s06-interactive-wrap');
      const indicator = document.querySelector('.s06-fixed-indicator');
      const mediaWrap = document.querySelector('.s06-media-wrap');
      if (wrap && indicator && mediaWrap) {
        const wrapRect = wrap.getBoundingClientRect();
        const mediaRect = mediaWrap.getBoundingClientRect();
        const h = mediaRect.bottom - wrapRect.top;
        if (h > 0) {
          indicator.style.height = `${h}px`;
        }
      }
    }

    function goToMilestone(index, animate = true) {
      if (index < 0 || index >= milestones.length) return;
      currentIndex = index;

      // 1. Calculate horizontal translation so active year aligns with fixed vertical black line
      const stepWidth = segments[0] ? segments[0].offsetWidth : 350;
      track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      track.style.transform = `translateX(${-currentIndex * stepWidth}px)`;

      // 2. Update active classes on year segments
      segments.forEach((seg, idx) => {
        if (idx === currentIndex) {
          seg.classList.add('active');
          seg.querySelector('.s06-year-btn')?.setAttribute('aria-current', 'true');
        } else {
          seg.classList.remove('active');
          seg.querySelector('.s06-year-btn')?.removeAttribute('aria-current');
        }
      });

      // 3. Update content panel with smooth fade & slide
      const m = milestones[currentIndex];
      contentInner.classList.add('is-changing');

      setTimeout(() => {
        if (milestoneTitle) milestoneTitle.textContent = m.title;
        if (milestoneDesc) milestoneDesc.textContent = m.desc;
        if (milestoneImg) {
          milestoneImg.src = m.image;
          milestoneImg.alt = m.title;
        }
        if (counterCurrent) {
          counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
        }
        contentInner.classList.remove('is-changing');
        updateIndicatorHeight();
      }, 180);

      // 4. Update navigation button disabled states
      if (btnPrev) btnPrev.disabled = (currentIndex === 0);
      if (btnNext) btnNext.disabled = (currentIndex === milestones.length - 1);
    }

    // Event listeners for prev/next buttons
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) goToMilestone(currentIndex - 1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentIndex < milestones.length - 1) goToMilestone(currentIndex + 1);
      });
    }

    // Click directly on any year segment
    segments.forEach(seg => {
      seg.addEventListener('click', (e) => {
        const btn = e.target.closest('.s06-year-btn');
        if (btn) {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (!isNaN(idx) && idx !== currentIndex) {
            goToMilestone(idx);
          }
        }
      });
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const viewport = document.querySelector('.s06-timeline-viewport');
    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0 && currentIndex < milestones.length - 1) {
            goToMilestone(currentIndex + 1);
          } else if (diff < 0 && currentIndex > 0) {
            goToMilestone(currentIndex - 1);
          }
        }
      }, { passive: true });
    }

    // Re-align on window resize
    window.addEventListener('resize', () => {
      goToMilestone(currentIndex, false);
    }, { passive: true });

    // Initialize first state
    goToMilestone(0, false);
    if (milestoneImg) milestoneImg.addEventListener('load', updateIndicatorHeight);
  }

  // Section 07: 3-phase pinned scroll sequence — background pins via pure
  // CSS sticky (css/s07.css's .s07-viewport), then this drives
  // .s07-content's translateY from 100% (parked just below the viewport)
  // up to 0 (centered) over the first RISE_FRACTION of .s07-pin's
  // sticky scroll slack, holding at 0 for the rest — same
  // pinned-progress + hold-fraction math as initS04QuoteScroll's
  // REVEAL_FRACTION, just driving a transform instead of a word color.
  //
  // Below S07_PIN_BREAKPOINT (matches css/s07.css's own fallback
  // media query) the section collapses to a plain static stack, so the
  // pin math is skipped entirely and any transform is cleared — same
  // "don't trap taller-than-viewport content" reasoning as Section 04's
  // own mobile fallback.
  function initS07Stack() {
    const pin = document.getElementById('s07Pin');
    const contentEl = document.getElementById('s07Content');
    if (!pin || !contentEl) return;

    const S07_PIN_BREAKPOINT = 900;
    const RISE_FRACTION = 1.0; // Card finishes rising through 100% of slack, transitioning into Section 08 immediately

    function pinnedProgress() {
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const rect = pin.getBoundingClientRect();
      const pinHeight = pin.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, pinHeight - (viewportHeight - headerHeight));
      const scrolled = headerHeight - rect.top;
      const rawProgress = Math.max(0, Math.min(1, scrolled / maxScroll));
      return Math.min(1, rawProgress / RISE_FRACTION);
    }

    function update() {
      if (window.innerWidth <= S07_PIN_BREAKPOINT) {
        contentEl.style.transform = '';
      } else {
        const progress = pinnedProgress();
        contentEl.style.transform = `translateY(${(100 * (1 - progress)).toFixed(2)}%)`;
      }
      isTicking = false;
    }

    let isTicking = false;
    window.addEventListener('scroll', () => {
      if (!isTicking) {
        requestAnimationFrame(update);
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // Section 07: "Tải xuống tài liệu" links — same simulated-download
  // pattern as the header's report download button (no real files behind
  // these placeholder documents), just a toast confirmation per document.
  function initS07Downloads() {
    document.querySelectorAll('[data-s07-download]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const docName = link.getAttribute('data-s07-download') || 'tài liệu';
        showToast(`Đang tải xuống "${docName}"...`, 'download');
      });
    });
  }

  // Section 08: Interactive cards and sticky image synchronization
  // - The entire viewport is pinned while scrolling through s08-pin
  // - Left column title (3 lines) and description stay stationary
  // - Right zone (inset 32px top, bottom, right) has content track scrolling
  // - The 4 right-side images are split evenly across the pin's total
  //   scroll progress (not each card's own height), so scrolling through
  //   all the left content and cycling through all 4 images finish at
  //   the same time regardless of how tall any individual card is.
  function initS08Cards() {
    const pin = document.getElementById('s08Pin');
    const contentViewport = document.getElementById('s08ContentViewport');
    const contentTrack = document.getElementById('s08ContentTrack');
    const slides = Array.from(document.querySelectorAll('.s08-img-slide'));
    const counter = document.getElementById('s08VisualCounter');
    const pills = Array.from(document.querySelectorAll('.s08-visual-pill'));
    if (!pin || !contentTrack || !slides.length) return;

    let activeIdx = -1;
    let topZ = 1; // bumped on every activation so the newest slide always stacks above every earlier one

    // Direction-aware wipe: scrolling down reveals the incoming slide
    // bottom-up (anchored to the bottom edge, growing upward); scrolling
    // up reveals it top-down instead (anchored to the top edge, growing
    // downward) — the mirror image. See the .s08-img-slide comment in
    // css/s08.css for the clip-path geometry this relies on. Only the
    // incoming slide is ever animated; a slide that's already been
    // revealed just stays fully visible (clip-path: inset(0)) forever
    // after, buried under whichever slide activates next via z-index —
    // see that CSS comment for why animating the outgoing slide's own
    // clip-path back closed at the same time caused a visible gap.
    function setActiveSlide(idx) {
      if (idx === activeIdx || idx < 0 || idx >= slides.length) return;
      const goingForward = activeIdx === -1 || idx > activeIdx;
      activeIdx = idx;

      const incoming = slides[idx];
      const incomingRevealClass = goingForward ? 'reveal-from-bottom' : 'reveal-from-top';

      topZ += 1;
      incoming.style.zIndex = String(topZ);

      // Snap the incoming slide to the correct hidden state instantly
      // (transition suspended via .no-anim) before animating it open, so
      // the reveal always starts from the edge matching this scroll
      // direction rather than wherever its clip-path last happened to be.
      incoming.classList.add('no-anim');
      incoming.classList.remove('reveal-from-top', 'reveal-from-bottom', 'is-active');
      incoming.classList.add(incomingRevealClass);
      void incoming.offsetWidth; // force reflow so the snap registers before we animate away from it
      incoming.classList.remove('no-anim');

      requestAnimationFrame(() => {
        incoming.classList.add('is-active');
      });

      if (counter) {
        counter.textContent = `0${idx + 1} / 0${slides.length}`;
      }

      pills.forEach((pill, i) => {
        if (i === idx) {
          pill.classList.add('is-active');
        } else {
          pill.classList.remove('is-active');
        }
      });
    }

    function update() {
      if (window.innerWidth <= 900) {
        contentTrack.style.transform = '';
        setActiveSlide(0);
        return;
      }

      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const rect = pin.getBoundingClientRect();
      const pinHeight = pin.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, pinHeight - (viewportHeight - headerHeight));
      const scrolled = headerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / maxScroll));

      const trackHeight = contentTrack.offsetHeight;
      const viewHeight = contentViewport ? contentViewport.offsetHeight : 600;
      const maxTrackScroll = Math.max(0, trackHeight - viewHeight);

      const currentTrackY = progress * maxTrackScroll;
      contentTrack.style.transform = `translateY(-${currentTrackY.toFixed(2)}px)`;

      // Slide index is an even split of the SAME progress (0 -> 1) that
      // drives the left content's scroll, not each card's own height —
      // so the 4 right-side images finish their run in exactly the same
      // scroll distance it takes to scroll through all the left content,
      // regardless of how tall any individual card is.
      const currentIdx = Math.min(slides.length - 1, Math.floor(progress * slides.length));

      setActiveSlide(currentIdx);
    }

    let isTicking = false;
    window.addEventListener('scroll', () => {
      if (!isTicking) {
        requestAnimationFrame(() => {
          update();
          isTicking = false;
        });
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();

    window._updateS08Scroll = update;
  }

  // Section 08: Accordion items in Card 01 & simulated document downloads
  function initS08Accordions() {
    const items = document.querySelectorAll('.s08-accordion-item');
    items.forEach((item) => {
      const trigger = item.querySelector('.s08-accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        if (isOpen) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          items.forEach((other) => {
            if (other !== item && other.classList.contains('is-open')) {
              other.classList.remove('is-open');
              const otherTrigger = other.querySelector('.s08-accordion-trigger');
              if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
            }
          });
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }

        // Re-align scroll track on accordion state change
        setTimeout(() => {
          if (window._updateS08Scroll) window._updateS08Scroll();
        }, 320);
      });
    });

    document.querySelectorAll('[data-s08-download]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const docName = link.getAttribute('data-s08-download') || 'tài liệu';
        showToast(`Đang tải xuống "${docName}"...`, 'download');
      });
    });
  }

  // Section 09: Phát triển & Tác động ESG
  // Background (BG ESG.png) pins sticky once reaching the header for the
  // section's entire scroll slack. The title+cards stack scrolls THROUGH
  // it rather than rising once and holding: translateY sweeps a full
  // 100% -> -100% (not 100% -> 0%) over that same slack, so the stack
  // enters from below, passes through the centered reading position at
  // the midpoint (progress 0.5), and keeps going until it's fully
  // exited off the top — never resting in place before Section 10 takes
  // over.
  function initS09Stack() {
    const pin = document.getElementById('s09Pin');
    const contentEl = document.getElementById('s09Content');
    if (!pin || !contentEl) return;

    const S09_BREAKPOINT = 768;

    function pinnedProgress() {
      const headerEl = document.querySelector('.site-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 77;
      const rect = pin.getBoundingClientRect();
      const pinHeight = pin.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(1, pinHeight - (viewportHeight - headerHeight));
      const scrolled = headerHeight - rect.top;
      return Math.max(0, Math.min(1, scrolled / maxScroll));
    }

    let isTicking = false;
    function update() {
      if (window.innerWidth <= S09_BREAKPOINT) {
        contentEl.style.transform = '';
      } else {
        const progress = pinnedProgress();
        contentEl.style.transform = `translateY(${(100 - 200 * progress).toFixed(2)}%)`;
      }
      isTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        requestAnimationFrame(update);
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // Footer: "Tổng Biên tập" block's left edge must match Section 10's
  // CTA button's left edge exactly — the two sit in unrelated flex
  // layouts (the footer row vs. Section 10's right-anchored column), so
  // no pure-CSS rule can line them up at every viewport width. Measures
  // the button's real position each time and applies it as `left` on
  // the (position: absolute, see css/footer.css) editor block. Only
  // `left` (not `top`) needs to track anything, since both elements'
  // horizontal position is independent of vertical scroll.
  function initFooterEditorAlign() {
    const btn = document.getElementById('btnS10Contact');
    const editor = document.querySelector('.footer-editor');
    const footerContainer = document.querySelector('.footer-container');
    if (!btn || !editor || !footerContainer) return;

    function align() {
      if (window.innerWidth <= 900) return; // both sections drop to a stacked mobile layout below this
      const btnRect = btn.getBoundingClientRect();
      const containerRect = footerContainer.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      editor.style.left = `${Math.max(0, left)}px`;
    }

    window.addEventListener('resize', align, { passive: true });
    align();
  }

  window.showToast = showToast;
})();
