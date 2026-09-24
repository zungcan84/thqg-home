/**
 * animations.js
 * Implements Section 8: Text Animation (Staggered Animation) from README.md
 * - Splits text into individual words
 * - Sequentially animates translateY(20px) -> translateY(0), opacity 0 -> 1
 * - Timing: duration 600ms, stagger 40ms, cubic-bezier(0.22, 1, 0.36, 1)
 * - Triggers once when entering viewport via IntersectionObserver
 * - Honors prefers-reduced-motion
 */

(function () {
  'use strict';

  const DURATION_MS = 600;
  const STAGGER_MS = 40;
  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function initStaggeredAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animatedElements = document.querySelectorAll('[data-stagger-text]');

    if (prefersReducedMotion) {
      // If user prefers reduced motion, leave text displayed directly
      animatedElements.forEach((el) => el.classList.add('is-animated'));
      return;
    }

    animatedElements.forEach((el) => {
      prepareElement(el);
    });

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05,
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.classList.add('is-animated');
          obs.unobserve(target); // Only trigger once per README
        }
      });
    }, observerOptions);

    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    // Immediate check for elements already in viewport on load with paint-ready tick
    setTimeout(() => {
      requestAnimationFrame(() => {
        animatedElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-animated');
            observer.unobserve(el);
          }
        });
      });
    }, 80);
  }

  function prepareElement(element) {
    if (element.dataset.staggerPrepared) return;
    element.dataset.staggerPrepared = 'true';

    let wordIndex = 0;

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const chunks = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        chunks.forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) {
            fragment.appendChild(document.createTextNode(chunk));
          } else {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'stagger-word';
            wordSpan.textContent = chunk;
            wordSpan.style.transitionDuration = `${DURATION_MS}ms`;
            wordSpan.style.transitionTimingFunction = EASING;
            wordSpan.style.transitionDelay = `${wordIndex * STAGGER_MS}ms`;
            fragment.appendChild(wordSpan);
            wordIndex++;
          }
        });
        return fragment;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'br') {
          return document.createElement('br');
        }
        // Clone element container and process its children
        const cloned = node.cloneNode(false);
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach((child) => {
          const processedChild = processNode(child);
          if (processedChild) cloned.appendChild(processedChild);
        });
        return cloned;
      }
      return null;
    }

    const childNodes = Array.from(element.childNodes);
    element.innerHTML = '';
    childNodes.forEach((child) => {
      const processed = processNode(child);
      if (processed) element.appendChild(processed);
    });

    element.classList.add('stagger-text');
  }

  window.initStaggeredAnimations = initStaggeredAnimations;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaggeredAnimations);
  } else {
    initStaggeredAnimations();
  }
})();
