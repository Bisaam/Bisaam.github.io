(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Flavor switcher (shares the home page's saved choice) ---------- */
  const flavors = ['mocha', 'macchiato', 'frappe', 'latte'];
  const flavorBtn = document.getElementById('flavor');
  const flavorName = flavorBtn.querySelector('.flavor__name');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const favicon = document.querySelector('link[rel="icon"]');

  const setFavicon = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${css('--base')}'/>`
      + `<path d='M8.5 11 14 16l-5.5 5M16.5 21h7' fill='none' stroke='${css('--mauve')}' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
    favicon.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  const applyFlavor = (f) => {
    root.dataset.flavor = f;
    flavorName.textContent = f === 'frappe' ? 'frappé' : f;
    themeMeta.setAttribute('content', css('--base'));
    setFavicon();
  };
  flavorBtn.addEventListener('click', () => {
    const next = flavors[(flavors.indexOf(root.dataset.flavor) + 1) % flavors.length];
    try { localStorage.setItem('flavor', next); } catch (e) {}
    applyFlavor(next);
  });
  applyFlavor(flavors.includes(root.dataset.flavor) ? root.dataset.flavor : 'mocha');

  /* ---------- Reveal on scroll ---------- */
  if (reduceMotion) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
