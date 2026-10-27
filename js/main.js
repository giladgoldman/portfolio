document.documentElement.classList.add('js');

// Mobile nav
const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('#nav');
if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

// Contact form: POSTs JSON to the endpoint set in build.py. No email address lives on the page.
const form = document.querySelector('#contact-form');
if (form) {
  // ?topic=startup|tools|iso|strategy|hiring|other preselects the dropdown (links from the Services page)
  const want = new URLSearchParams(location.search).get('topic');
  const sel = form.querySelector('select[name=topic]');
  if (want && sel) [...sel.options].forEach((o) => { if (o.dataset.k === want) sel.value = o.value; });
  const status = document.querySelector('#form-status');
  const say = (msg, ok) => { status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data._gotcha) return;                       // honeypot: bots fill this in
    if (!data.name || !data.email || !data.message) return say('Please fill in your name, email and a message.', false);
    const endpoint = form.dataset.endpoint;
    if (!endpoint) return say('This form is not connected yet (preview only), so nothing was sent.', false);
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; say('Sending...', true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      form.reset(); say('Thanks! Your message is on its way. I\'ll reply within a couple of business days.', true);
    } catch (err) { say('Something went wrong sending that. Please try again in a moment.', false); }
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
  addEventListener('mousemove', (e) => {
    x.classList.add('on');
    h.style.top = e.clientY + 'px'; v.style.left = e.clientX + 'px';
    b.style.transform = `translate(${e.clientX + 12}px, ${e.clientY + 12}px)`;
    b.textContent = `X ${String(e.clientX).padStart(4, '0')}  Y ${String(Math.round(e.clientY + scrollY)).padStart(4, '0')}`;
  });
  document.addEventListener('mouseleave', () => x.classList.remove('on'));
}
