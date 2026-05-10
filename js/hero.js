/* ============================================================
   hero.js — Hero Banner Carousel
   Auto-plays, manual prev/next, keyboard navigation.
   ============================================================ */

var HeroCarousel;
HeroCarousel = (() => {
  let current   = 0;
  let total     = 0;
  let timer     = null;
  const DELAY   = 5000;

  /* ── Build DOM ──────────────────────────────────────────── */
  function buildCarousel() {
    const section = document.getElementById('hero-carousel');
    if (!section || !window.HERO_SLIDES) return;

    total = HERO_SLIDES.length;

    section.innerHTML = `
      <div class="hero-slides" id="hero-slides-track">
        ${HERO_SLIDES.map((slide, i) => `
          <div class="hero-slide" role="group" aria-label="Slide ${i + 1} of ${total}">
            <div class="hero-slide-bg"
                 style="background-image:url('${slide.bg}')"
                 loading="lazy"></div>
            <div class="hero-slide-content">
              <span class="hero-tag">${escHtml(slide.tag)}</span>
              <h1 class="hero-title">${escHtml(slide.title)}</h1>
              <p class="hero-subtitle">${escHtml(slide.subtitle)}</p>
              <a href="${slide.ctaHref}" class="hero-cta">${escHtml(slide.cta)} →</a>
            </div>
          </div>
        `).join('')}
      </div>

      <button class="hero-prev" aria-label="Previous slide" id="hero-prev">‹</button>
      <button class="hero-next" aria-label="Next slide"     id="hero-next">›</button>

      <div class="hero-dots" role="tablist" id="hero-dots">
        ${HERO_SLIDES.map((_, i) => `
          <button class="hero-dot ${i === 0 ? 'active' : ''}"
                  role="tab"
                  aria-selected="${i === 0}"
                  aria-label="Go to slide ${i + 1}"
                  data-index="${i}"></button>
        `).join('')}
      </div>

      <div class="hero-fade-bottom"></div>
    `;
  }

  /* ── Navigate ───────────────────────────────────────────── */
  function goTo(index) {
    current = (index + total) % total;

    const track = document.getElementById('hero-slides-track');
    if (track) {
      track.style.transform = `translateX(-${current * 100}%)`;
    }

    // Update dots
    document.querySelectorAll('.hero-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });

    resetTimer();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* ── Auto-play ──────────────────────────────────────────── */
  function startTimer() {
    timer = setInterval(next, DELAY);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  /* ── Pause on hover ─────────────────────────────────────── */
  function setupPauseOnHover(section) {
    section.addEventListener('mouseenter', () => clearInterval(timer));
    section.addEventListener('mouseleave', () => startTimer());
  }

  /* ── Touch swipe ────────────────────────────────────────── */
  function setupSwipe(section) {
    let touchStartX = 0;
    let touchEndX   = 0;

    section.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    section.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? next() : prev();
      }
    }, { passive: true });
  }

  /* ── Utility ─────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    buildCarousel();

    const section = document.getElementById('hero-carousel');
    if (!section) return;

    // Button listeners
    document.getElementById('hero-prev')?.addEventListener('click', prev);
    document.getElementById('hero-next')?.addEventListener('click', next);

    // Dot listeners
    document.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    });

    setupPauseOnHover(section);
    setupSwipe(section);
    startTimer();
  }

  return { init, goTo, next, prev };
})();

document.addEventListener('DOMContentLoaded', () => HeroCarousel.init());
