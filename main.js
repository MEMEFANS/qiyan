(function () {
  // --- AOS (Animate on Scroll) Implementation ---
  const initAOS = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.hasAttribute('data-aos')) {
            entry.target.classList.add('aos-animate');
          } else {
            entry.target.classList.add('visible');
          }
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-aos], .fade-in, .slide-in-left, .slide-in-right').forEach(el => observer.observe(el));
  };

  // --- Hero Carousel Implementation ---
  const initHeroCarousel = () => {
    const slides = document.querySelectorAll('.carousel-slide');
    const images = document.querySelectorAll('.carousel-image img');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!slides.length) return;

    let current = 0;
    let timer = null;

    const showSlide = (index) => {
      slides.forEach((s, i) => s.classList.toggle('hidden', i !== index));
      images.forEach((img, i) => {
        img.classList.toggle('opacity-100', i === index);
        img.classList.toggle('opacity-0', i !== index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-brand-600', i === index);
        dot.classList.toggle('w-6', i === index);
        dot.classList.toggle('bg-slate-300', i !== index);
        dot.classList.toggle('w-2', i !== index);
      });
      current = index;
    };

    const nextSlide = () => showSlide((current + 1) % slides.length);

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showSlide(i);
        resetTimer();
      });
    });

    const resetTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(nextSlide, 5000);
    };

    resetTimer();
  };

  // --- Stats Counter Animation ---
  const initStatsCounter = () => {
    const stats = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          const target = parseInt(entry.target.dataset.count);
          let current = 0;
          const duration = 2000;
          const step = target / (duration / 16);
          
          const update = () => {
            current += step;
            if (current < target) {
              entry.target.textContent = Math.floor(current).toLocaleString();
              requestAnimationFrame(update);
            } else {
              entry.target.textContent = target.toLocaleString();
            }
          };
          
          entry.target.dataset.animated = "true";
          update();
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(s => observer.observe(s));
  };

  // Initialize all
  const start = () => {
    initAOS();
    initHeroCarousel();
    initStatsCounter();
    
    // Refresh Lucide icons after layout changes
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Export for layout.js if needed
  window.siteInit = { initAOS, initHeroCarousel, initStatsCounter, start };
})();