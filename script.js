/* Vibrations Video Productions — site interactions */
(() => {
  'use strict';

  // ---- Site settings: edit these ---------------------------------------
  const CONTACT_EMAIL = 'hello@vibrationsvideoproductions.com';
  // ----------------------------------------------------------------------

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* Nav */
  const nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Scroll reveal, staggered among siblings */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    io.observe(el);
  });

  /* Timecode HUD (24 fps) */
  const tc = $('#timecode');
  const pad = (n) => String(n).padStart(2, '0');
  const t0 = performance.now();
  if (!reduced) {
    setInterval(() => {
      const f = Math.floor(((performance.now() - t0) / 1000) * 24);
      tc.textContent = `${pad(Math.floor(f / 86400) % 24)}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
    }, 1000 / 24);
  }

  /* Equalizer bars */
  const eq = $('#eq');
  for (let i = 0; i < 28; i++) {
    const b = document.createElement('span');
    const env = Math.sin((i / 27) * Math.PI); // taller in the middle
    b.style.setProperty('--a', `${8 + Math.random() * 14}%`);
    b.style.setProperty('--b', `${28 + env * 50 + Math.random() * 22}%`);
    b.style.setProperty('--t', `${0.7 + Math.random() * 0.9}s`);
    b.style.setProperty('--dl', `${-Math.random() * 1.5}s`);
    eq.appendChild(b);
  }

  /* Hero: field of vibrating strings that swell around the pointer */
  const canvas = $('#waves');
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
  const ptr = { x: 0.72, y: 0.4, tx: 0.72, ty: 0.4, energy: 0 };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) draw(0);
  };

  const draw = (ms) => {
    const t = ms / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    ptr.energy *= 0.96;
    ctx.clearRect(0, 0, w, h);

    const lines = w < 700 ? 18 : 30;
    const top = h * 0.14, span = h * 0.72;
    const step = w < 700 ? 10 : 8;
    const px = ptr.x * w, py = ptr.y * h;
    const sigma = Math.max(w * 0.2, 180);

    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1);
      const y0 = top + k * span;
      const near = Math.exp(-((y0 - py) ** 2) / (2 * (h * 0.22) ** 2));
      const amp = (10 + 46 * near) * (1 + ptr.energy * 0.9);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(243,237,226,0)');
      grad.addColorStop(0.35, `rgba(255,179,71,${0.1 + near * 0.25})`);
      grad.addColorStop(0.75, `rgba(255,75,43,${0.3 + near * 0.6})`);
      grad.addColorStop(1, 'rgba(255,75,43,0.05)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + near * 1.1;
      ctx.beginPath();
      for (let x = 0; x <= w + step; x += step) {
        const env = Math.exp(-((x - px) ** 2) / (2 * sigma * sigma));
        const y = y0
          + Math.sin(x * 0.012 + t * 1.6 + i * 0.35) * amp * env
          + Math.sin(x * 0.031 - t * 2.3 + i * 0.9) * amp * 0.35 * env
          + Math.sin(x * 0.004 + t * 0.5 + i * 0.2) * 5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (!reduced && visible) raf = requestAnimationFrame(draw);
  };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    ptr.energy = Math.min(1, ptr.energy + Math.hypot(nx - ptr.tx, ny - ptr.ty) * 6);
    ptr.tx = nx; ptr.ty = ny;
  });
  hero.addEventListener('pointerleave', () => { ptr.tx = 0.72; ptr.ty = 0.4; });
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible && !reduced) raf = requestAnimationFrame(draw);
  }).observe(hero);
  addEventListener('resize', resize);
  resize();

  /* Showreel: loads the embed on click once a video ID is set in index.html */
  const frame = $('#reelFrame');
  $('#reelPlay').addEventListener('click', () => {
    const yt = frame.dataset.youtube, vm = frame.dataset.vimeo;
    const src = yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&rel=0`
      : vm ? `https://player.vimeo.com/video/${encodeURIComponent(vm)}?autoplay=1` : '';
    if (!src) { $('#reelNote').textContent = 'New reel coming soon'; return; }
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Vibrations Video Productions showreel';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
  });

  /* Contact: opens the visitor's mail app with the enquiry filled in */
  const mail = $('#contactMail');
  mail.textContent = CONTACT_EMAIL;
  mail.href = `mailto:${CONTACT_EMAIL}`;
  const form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('[required]', form);
    fields.forEach((f) => f.classList.toggle('invalid', !f.checkValidity()));
    const bad = fields.find((f) => !f.checkValidity());
    if (bad) { note.textContent = 'Please fill in your name, a valid email and a few words about the project.'; bad.focus(); return; }
    const d = new FormData(form);
    const subject = `New project enquiry — ${d.get('type')}`;
    const body = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\nProject type: ${d.get('type')}\n\n${d.get('message')}`;
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Opening your email app — just hit send.';
  });
})();
