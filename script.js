/* Vibrations Video Productions — site interactions */
(() => {
  'use strict';

  // ---- Site settings: edit these ---------------------------------------
  const CONTACT_EMAIL = 'akil@vibrationsvideoproductions.com';
  // ----------------------------------------------------------------------

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = new Date().getFullYear();
  $('#year').textContent = year;
  $('#year2').textContent = year;

  /* Mobile menu */
  const toggle = $('#navToggle'), links = $('#navLinks');
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
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.07}s`);
    io.observe(el);
  });

  /* Count up the headline stats when they scroll into view */
  if (!reduced) {
    const fmt = (el, v) => {
      const dec = el.dataset.count.includes('.') ? 1 : 0;
      return (el.dataset.prefix || '') + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
    };
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        statIO.unobserve(en.target);
        const el = en.target, end = parseFloat(el.dataset.count), start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / 1400), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(el, end * e);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => statIO.observe(el));
  }

  /* Photo lightbox */
  const box = $('#lightbox'), boxImg = $('#lightboxImg');
  $$('.shot').forEach((s) => s.addEventListener('click', () => {
    boxImg.src = s.dataset.full;
    boxImg.alt = $('img', s).alt;
    box.showModal();
  }));
  box.addEventListener('click', () => box.close());

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
