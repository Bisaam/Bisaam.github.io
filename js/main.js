(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ---------- Year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Flavor switcher ---------- */
  const flavors = ['mocha', 'macchiato', 'frappe', 'latte'];
  const pretty = { mocha: 'Mocha', macchiato: 'Macchiato', frappe: 'Frappé', latte: 'Latte' };
  const flavorBtn = document.getElementById('flavor');
  const flavorName = flavorBtn.querySelector('.flavor__name');
  const ffFlavor = document.getElementById('ff-flavor');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const favicon = document.querySelector('link[rel="icon"]');

  // the original ">_" icon, redrawn in the active flavor's colors
  const setFavicon = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${css('--base')}'/>`
      + `<text x='16' y='22' font-family='monospace' font-size='16' font-weight='700' text-anchor='middle' fill='${css('--mauve')}'>&gt;_</text></svg>`;
    favicon.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  const applyFlavor = (f) => {
    root.dataset.flavor = f;
    flavorName.textContent = f === 'frappe' ? 'frappé' : f;
    ffFlavor.textContent = pretty[f];
    themeMeta.setAttribute('content', css('--base'));
    setFavicon();
    flavorBtn.setAttribute('aria-label', `Catppuccin ${pretty[f]}. Switch flavor`);
    grid.recolor();
  };
  flavorBtn.addEventListener('click', () => {
    const next = flavors[(flavors.indexOf(root.dataset.flavor) + 1) % flavors.length];
    try { localStorage.setItem('flavor', next); } catch (e) {}
    applyFlavor(next);
  });

  /* ---------- Hero dot grid: idle dots, with "packets" lighting up rows ---------- */
  const grid = (() => {
    const canvas = document.getElementById('grid');
    const ctx = canvas.getContext('2d');
    const GAP = 26;
    let w = 0, h = 0, cols = 0, rows = 0, dpr = 1;
    let base = '', palette = [];
    let packets = [], sparks = [], running = false, last = 0, raf = 0;

    const recolor = () => {
      base = css('--surface2');
      palette = ['--mauve', '--green', '--blue', '--peach', '--pink', '--teal'].map(css);
      if (!running) draw(performance.now());
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1; rows = Math.ceil(h / GAP) + 1;
      if (!running) draw(performance.now());
    };

    const spawn = (t) => {
      const dir = Math.random() < .5 ? 1 : -1;
      packets.push({
        row: Math.floor(Math.random() * rows),
        x: dir > 0 ? -2 : cols + 2, dir,
        speed: 6 + Math.random() * 10, // cells per second
        color: palette[Math.floor(Math.random() * palette.length)],
        born: t,
      });
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = .5;
      ctx.fillStyle = base;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) ctx.fillRect(x * GAP + GAP / 2 - 1, y * GAP + GAP / 2 - 1, 2, 2);

      // sparks: individual dots that flare and fade
      for (const s of sparks) {
        const life = (t - s.born) / s.dur;
        const a = life < .3 ? life / .3 : 1 - (life - .3) / .7;
        ctx.globalAlpha = Math.max(0, a) * .9;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x * GAP + GAP / 2 - 2, s.y * GAP + GAP / 2 - 2, 4, 4);
      }
      // packets: a bright head with a fading trail along a row
      for (const p of packets) {
        const head = Math.round(p.x);
        for (let i = 0; i < 7; i++) {
          const cx = head - i * p.dir;
          if (cx < 0 || cx >= cols) continue;
          ctx.globalAlpha = (1 - i / 7) * .95;
          ctx.fillStyle = p.color;
          const s = i === 0 ? 5 : 4;
          ctx.fillRect(cx * GAP + GAP / 2 - s / 2, p.row * GAP + GAP / 2 - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (t) => {
      if (!running) return;
      const dt = Math.min((t - last) / 1000, .05);
      last = t;
      if (packets.length < 5 && Math.random() < dt * 1.4) spawn(t);
      if (sparks.length < 18 && Math.random() < dt * 6) {
        sparks.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows),
          color: palette[Math.floor(Math.random() * palette.length)], born: t, dur: 1200 + Math.random() * 1600 });
      }
      for (const p of packets) p.x += p.dir * p.speed * dt;
      packets = packets.filter(p => p.x > -10 && p.x < cols + 10);
      sparks = sparks.filter(s => t - s.born < s.dur);
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    const start = () => { if (running || reduceMotion) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    recolor(); resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    return { recolor };
  })();

  applyFlavor(flavors.includes(root.dataset.flavor) ? root.dataset.flavor : 'mocha');

  /* ---------- Typed prompt, then fastfetch output ---------- */
  const typed = document.getElementById('typed');
  const ff = document.getElementById('ff');
  const text = typed.dataset.text;
  if (reduceMotion) {
    typed.textContent = text;
  } else {
    ff.classList.add('pending');
    let i = 0;
    const type = () => {
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(type, 70 + Math.random() * 70);
      else setTimeout(() => ff.classList.remove('pending'), 320);
    };
    setTimeout(type, 700);
  }

  /* ---------- Count-up stats ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count, prefix = el.dataset.prefix || '';
    if (reduceMotion) { el.textContent = prefix + target; return; }
    const dur = 1400, t0 = performance.now();
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = prefix + Math.round(target * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = prefix + '0';
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      el.classList.add('in');
      // once revealed, hand transitions back to the element (e.g. card hover glow)
      const settle = () => {
        el.removeEventListener('transitionend', onEnd);
        el.classList.remove('reveal', 'in');
        el.style.transitionDelay = '';
      };
      const onEnd = (ev) => { if (ev.target === el && ev.propertyName === 'opacity') settle(); };
      el.addEventListener('transitionend', onEnd);
      setTimeout(settle, 1400);
      const num = e.target.querySelector('[data-count]');
      if (num) countUp(num);
      io.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => {
    // stagger siblings inside grids / timelines
    const sibs = el.parentElement.querySelectorAll(':scope > .reveal');
    const idx = Array.prototype.indexOf.call(sibs, el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
    io.observe(el);
  });

  /* ---------- Active nav link ---------- */
  const links = [...document.querySelectorAll('.nav__links a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const navIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => s && navIO.observe(s));
})();
