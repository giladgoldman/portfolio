#!/usr/bin/env python3
"""Tiny static-site builder: wraps src/pages/*.html bodies in a shared header/footer.

Usage: python3 build.py     (writes the finished .html files next to this script)
Edit SITE below to change name, email or nav.
"""
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).parent
SITE = {
    "name": "Gilad Goldman",
    "short": "Construction × Technology",
    # Contact form posts JSON here (Formspree, Web3Forms, or any endpoint that emails you).
    # Leave empty and the form shows a "not connected yet" message instead of sending.
    "form_endpoint": "https://api.web3forms.com/submit",
    "form_access_key": "64d91210-2438-492f-b24b-106226c43913",   # Web3Forms public key (safe to publish)
    # CV request: URL of the deployed cv-mailer service and the public Cloudflare Turnstile site key.
    # Leave empty and the "Hire me" form shows a "not connected yet" message.
    "cv_endpoint": "https://cv-mailer.gilad-goldman91.workers.dev/api/cv",
    "turnstile_site_key": "0x4AAAAAAFo33zi2jqPi56BJ",   # public site key (the secret key lives only in Cloudflare)
    "url": "https://gld.gldmn.net",
    "year": "2026",
}

NAV = [
    ("index.html#register", "Work", "index.html"),
    ("services.html", "Services", "services.html"),
    ("about.html", "About", "about.html"),
]

HEAD = """<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{name}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0e0e0d">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/Archivo-100-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap">
    <a class="logo" href="index.html" aria-label="{name} home">{name}</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav id="nav" aria-label="Main">
      <ul>
{nav}
      </ul>
    </nav>
    <div class="right">
      <span class="clock" aria-hidden="true"></span>
      <a class="btn sm" href="contact.html">Get in touch <span class="arr">&rarr;</span></a>
    </div>
  </div>
</header>
<main id="main">
"""

FOOT = """</main>
<section class="cta">
  <div class="wrap">
    <p class="mono">Want to work together?</p>
    <a class="big display" href="contact.html">Get in touch<span class="arr u">&rarr;</span></a>
    <div class="row">
      <p style="max-width:40ch;margin:0">Send me a message about your project or problem.</p>
      <a class="btn" href="contact.html">Contact me <span class="arr">&rarr;</span></a>
    </div>
  </div>
</section>
<footer>
  <div class="wrap">
    <span>&copy; {year} {name}</span>
    <span>{short}</span>
    <span><a href="index.html#register">Work</a> &nbsp;/&nbsp; <a href="services.html">Services</a> &nbsp;/&nbsp; <a href="about.html">About</a> &nbsp;/&nbsp; <a href="contact.html">Contact</a></span>
  </div>
</footer>
<script src="js/main.js"></script>
</body>
</html>
"""


def build():
    sources = sorted((ROOT / "src" / "pages").glob("*.html"))
    for src in sources:                      # only clear pages this script generates
        (ROOT / src.name).unlink(missing_ok=True)
    for src in sources:
        raw = src.read_text()
        meta = dict(re.findall(r"<!--\s*(title|desc):\s*(.*?)\s*-->", raw))
        body = re.sub(r"<!--\s*(title|desc):.*?-->\s*", "", raw)
        fname = src.name
        nav = "\n".join(
            f'        <li><a href="{h}"{" aria-current=\"page\"" if page == fname or (page == "index.html" and fname in TOOL_PAGES) else ""}>{l}</a></li>'
            for h, l, page in NAV
        )
        title = meta.get("title", SITE["name"])
        title = title if fname == "index.html" else f"{title} · {SITE['name']}"
        html = (
            HEAD.format(title=escape(title), desc=escape(meta.get("desc", SITE["short"])), name=SITE["name"], nav=nav,
                        url=SITE["url"] + ("/" if fname == "index.html" else "/" + fname), image=SITE["url"] + "/img/portrait.jpg")
            + body
            + FOOT.format(name=SITE["name"], short=SITE["short"], year=SITE["year"])
        )
        html = html.replace("{{endpoint}}", SITE["form_endpoint"])
        html = html.replace("{{cv_endpoint}}", SITE["cv_endpoint"]).replace("{{turnstile_key}}", SITE["turnstile_site_key"])
        key = SITE["form_access_key"]
        html = html.replace("{{access_key}}", f'<input type="hidden" name="access_key" value="{key}">' if key else "")
        html = html.replace("{{boxing}}", BOXING if (ROOT / "img" / "boxing.jpg").exists() else "")
        if fname == "404.html":   # served from any path, so asset and page links must be root-relative
            html = re.sub(r'(href|src)="(?!https?:|#|/|mailto:)', r'\1="/', html).replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">', 1)
        (ROOT / fname).write_text(html)
        print("built", fname)


BOXING = """<section class="dark uc" style="padding:0">
  <div class="uc-flag" role="note"><div><b>Under construction</b><small>This section isn&rsquo;t finished yet</small></div></div>
  <div class="wrap" style="display:grid;grid-template-columns:1.2fr 1fr;gap:0;align-items:stretch" id="bx">
    <img src="img/boxing.jpg" alt="Gilad landing a jab in a boxing bout" loading="lazy" style="width:100%;height:100%;min-height:340px;object-fit:cover;filter:grayscale(1) contrast(1.2)">
    <div style="padding:clamp(24px,5vw,72px);align-self:center">
      <p class="mono mute">Stress test</p>
      <h2 class="display" style="font-size:clamp(2.4rem,6vw,5.5rem)">Decisive <span style="color:var(--accent-dark)">under pressure.</span></h2>
      <p class="mute">It says so on the CV. This is the evidence.</p>
    </div>
  </div>
</section>"""

TOOL_PAGES = {"accounts-ingestion.html", "methodology-builder.html", "tool-hub.html", "agents.html", "health-tracker.html"}

if __name__ == "__main__":
    build()
