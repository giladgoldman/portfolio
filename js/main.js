document.documentElement.classList.add('js');

// Google Analytics events (gtag is loaded in the page head; no-ops if it is blocked or switched off)
const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); };
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (/^https?:/.test(href) && a.hostname !== location.hostname) {
    // career-table links are company names; the icon links in the contact section carry an aria-label
    const social = a.getAttribute('aria-label');
    track(social ? 'social_click' : 'outbound_click', { link_text: social || a.textContent.trim(), link_url: a.href });
  } else if (/(^|\/)contact\.html/.test(href) && !a.closest('nav')) {
    track('cta_click', { link_text: a.textContent.replace(/\s+/g, ' ').trim(), page_path: location.pathname });
  }
});

// Mobile nav
const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('#nav');
if (btn && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
  };
  btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
}

// Contact form: POSTs JSON to the endpoint set in build.py. No email address lives on the page.
const form = document.querySelector('#contact-form');
if (form) {
  // ?topic=startup|tools|iso|customer-success|strategy|hiring|other preselects the dropdown (links from the Services page)
  const want = new URLSearchParams(location.search).get('topic');
  const sel = document.querySelector('#topic');
  if (want && sel) [...sel.options].forEach((o) => { if (o.dataset.k === want) sel.value = o.value; });
  const status = document.querySelector('#form-status');
  const say = (msg, ok) => { status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data._gotcha) return;                       // honeypot: bots fill this in
    if (!data.name || !data.email || !data.message) return say('Please fill in your name, email and a message.', false);
    const cap = form.querySelector('textarea[name=h-captcha-response]');
    if (cap && !cap.value) return say('Please tick the "I am human" box first.', false);
    const endpoint = form.dataset.endpoint;
    if (!endpoint) return say('This form is not connected yet (preview only), so nothing was sent.', false);
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; say('Sending...', true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      track('generate_lead', { method: 'contact_form', topic: data.topic });
      form.reset(); say('Thanks! Your message is on its way. I\'ll reply within a couple of business days.', true);
    } catch (err) { track('form_error', { form: 'contact_form' }); say('Something went wrong sending that. Please try again in a moment.', false); }
    btn.disabled = false;
  });
}

// Melbourne clock
const clock = document.querySelector('.clock');
if (clock) {
  const tick = () => {
    const t = new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Australia/Melbourne' }).format(new Date());
    clock.textContent = `Melbourne ${t}`;
  };
  tick(); setInterval(tick, 30000);
}

// Scroll reveal
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 })
  : null;
document.querySelectorAll('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

// CAD crosshair with live coordinates (fine pointers, motion allowed)
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const x = document.createElement('div');
  x.className = 'xhair';
  x.setAttribute('aria-hidden', 'true');
  x.innerHTML = '<i class="h"></i><i class="v"></i><b></b>';
  document.body.appendChild(x);
  const h = x.querySelector('.h'), v = x.querySelector('.v'), b = x.querySelector('b');
  let mx = 0, my = 0, queued = false;
  const draw = () => {   // one DOM write per frame, not per mouse event
    queued = false;
    h.style.transform = `translateY(${my}px)`; v.style.transform = `translateX(${mx}px)`;
    b.style.transform = `translate(${mx + 12}px, ${my + 12}px)`;
    b.textContent = `X ${String(mx).padStart(4, '0')}  Y ${String(Math.round(my + scrollY)).padStart(4, '0')}`;
  };
  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    x.classList.add('on');
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => x.classList.remove('on'));
}

// "Hiring me" swaps the message form for a short "email me your CV" form (served by the cv-mailer service)
const cvForm = document.querySelector('#cv-form');
const topic = document.querySelector('#topic');
if (cvForm && topic && form) {
  const cvStatus = document.querySelector('#cv-status');
  const cvSay = (msg, ok) => { cvStatus.textContent = msg; cvStatus.className = 'form-status ' + (ok ? 'ok' : 'err'); };
  let tsId = null;
  const loadTurnstile = () => {
    const key = cvForm.dataset.sitekey;
    if (!key || tsId !== null) return;
    tsId = -1;
    const draw = () => { tsId = window.turnstile.render('#cv-ts', { sitekey: key }); };
    if (window.turnstile) return draw();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = draw; document.head.appendChild(s);
  };
  const sync = () => {
    const hiring = topic.options[topic.selectedIndex].dataset.k === 'hiring';
    form.hidden = hiring; cvForm.hidden = !hiring;
    if (hiring) { loadTurnstile(); track('cv_form_open'); }
  };
  topic.addEventListener('change', sync);
  document.querySelector('#cv-back').addEventListener('click', (e) => { e.preventDefault(); topic.value = [...topic.options].find((o) => o.dataset.k === 'other').value; sync(); });
  sync();
  cvForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(cvForm));
    if (d.website) return;                                  // honeypot
    if (!d.audience) return cvSay('Please choose which CV you would like.', false);
    if (!d.email || !cvForm.email.checkValidity()) return cvSay('Please enter a valid email address.', false);
    const endpoint = cvForm.dataset.endpoint;
    if (!endpoint || !cvForm.dataset.sitekey) return cvSay('This form is not connected yet, so nothing was sent.', false);
    const token = d['cf-turnstile-response'];
    if (!token) return cvSay('Please complete the human check first.', false);
    const btn = cvForm.querySelector('button[type=submit]');
    btn.disabled = true; cvSay('Sending...', true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: d.email, audience: d.audience, token }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || res.status);
      track('generate_lead', { method: 'cv_request', audience: d.audience });
      cvForm.reset(); cvSay('Done! Check your inbox for my CV (and your spam folder, just in case).', true);
    } catch (err) { track('form_error', { form: 'cv_form' }); cvSay(err.message && isNaN(err.message) ? err.message : 'Something went wrong sending that. Please try again in a moment.', false); }
    if (window.turnstile && tsId !== null && tsId !== -1) window.turnstile.reset(tsId);
    btn.disabled = false;
  });
}
