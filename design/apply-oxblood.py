#!/usr/bin/env python3
"""Applies the Oxblood palette to the v1 site. Run once from the project folder, then run build.py.
Oxblood #6e1423 for fills and text on paper; lighter rose #e0707f wherever the accent sits on a dark background.
Also removes the green status styling (green is avoided; it is too close to BuildPass)."""
import glob, re
from pathlib import Path

ACCENT, ACCENT_DARK = "#6e1423", "#e0707f"

# ---------- CSS ----------
p = Path("css/style.css"); c = p.read_text()
c = c.replace("--orange-ink: #140700;", "--accent-ink: #ffffff;")
c = c.replace("--orange: #ff4d12;", f"--accent: {ACCENT};\n  --accent-dark: {ACCENT_DARK};")
c = c.replace("--ok: #1f9d55;", "--ok: #0e0e0d;")
c = c.replace("--orange-ink", "--accent-ink").replace("var(--orange)", "var(--accent)")

def dark(sel_fragment, old="var(--accent)", new="var(--accent-dark)"):
    """Within every CSS rule containing sel_fragment, switch the accent to its on-dark version."""
    global c
    out = []
    for line in c.split("\n"):
        out.append(line.replace(old, new) if sel_fragment in line else line)
    c = "\n".join(out)

for frag in [".xhair i", ".xhair b", ".tape {", ".nums .n {", ".rev tr:hover td:first-child", ".scr-bar i:first-child",
             ".scr-bar em", ".scr .bar b", ".scr .side > nav a.on", ".rng b", ".node.hold", ".gantt span i", ".msg.ai",
             ".cite", ".bars i.hi", ".skills h3", "footer a:hover", ".tag.o"]:
    dark(frag)
# text colour on those filled-on-dark elements should be ink, not white
c = c.replace("background: var(--accent-dark); color: var(--accent-ink); }", "background: var(--accent-dark); color: var(--ink); }")
c = c.replace(".node.hold { background: var(--accent-dark); color: var(--accent-ink); border-color: var(--accent-dark); }",
              ".node.hold { background: var(--accent-dark); color: var(--ink); border-color: var(--accent-dark); }")
c = c.replace(".tag.o { background: var(--accent-dark); color: var(--accent-ink); }", ".tag.o { background: var(--accent-dark); color: var(--ink); }")
c = c.replace("section.dark .sheet-label b { background: var(--accent); color: var(--accent-ink); }",
              "section.dark .sheet-label b { background: var(--accent-dark); color: var(--ink); }")
c = c.replace(".nums.light { border-top: 2px solid var(--ink); }", ".nums.light { border-top: 2px solid var(--ink); }\n.nums.light .n { color: var(--accent); }")
# rgba oranges and status colours
c = c.replace("rgba(255, 77, 18, .14)", "rgba(110, 20, 35, .12)").replace("rgba(255, 77, 18, .55)", "rgba(224, 112, 127, .55)")
c = re.sub(r"\.tag\.g \{[^}]*\}", ".tag.g { background: rgba(233, 231, 225, .14); color: #e9e7e1; }", c)
# on-dark helpers
c += '''
/* oxblood: accent text/lines on dark backgrounds use the lighter rose */
section.dark .caps li::before { color: var(--accent-dark); }
section.dark :focus-visible { outline-color: var(--accent-dark); }
.rev tr:hover a.ext::after, .rev tr:hover a.ext:hover { color: var(--accent-dark); }
.svc.free { color: var(--accent-ink); }
.svc.free .mono, .svc.free .svc-body .mono { color: var(--accent-ink); }
.svc.free .ticks li::before { background: var(--accent-ink); }
'''
p.write_text(c)

# ---------- pages and build.py ----------
for f in glob.glob("src/pages/*.html") + ["build.py"]:
    s = Path(f).read_text()
    n = s.replace("var(--orange)", "var(--accent-dark)").replace("#55d68c", "#e9e7e1")
    if n != s: Path(f).write_text(n)
# headline accents that sit on paper (not dark) go back to the solid accent
Path("img/favicon.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e0e0d"/><path d="M16 7 25 24H7z" fill="{ACCENT_DARK}"/></svg>\n')
print("oxblood applied")
