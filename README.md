# Gilad Goldman portfolio site (v1)

Static site, no dependencies. Local only: never pushed to GitHub. Full handoff notes live on the Notion page "Portfolio Space".

## Run it
- Preview: `python3 -m http.server 8000` then open http://localhost:8000
- Edit page text in `src/pages/*.html`, then run `python3 build.py` (regenerates the root .html files)
- Name, nav and the contact form endpoint are at the top of `build.py`
- Styles: `css/style.css` (Oxblood palette; tokens at the top). Fonts are self-hosted in `fonts/` (regenerate with the script on the Notion page).
- Single-file preview for the browser app: the bundler script is on the Notion page (bundle.py)

## Folder
- `src/pages/` page sources (edit these)  ·  `*.html` generated pages  ·  `css/` `js/` `fonts/` `img/`
- `design/` `apply-oxblood.py` (already applied). The palette sheets and the old preview moved to the private portfolio-assets repo (they embed the photos).
- `originals/` the original photos (only in the backup zip): used to recrop the hero portrait and re-make the web images

## Still open
Contact form endpoint (set `form_endpoint` in build.py), boxing photo (add `img/boxing.jpg`, opponent's face blurred), company link check, Copy options choices, Health Tracker AI confirmation, services pricing, tools section feedback.

## Photos
The site photos (`img/*.jpg`) live in the private `giladgoldman/portfolio-assets` repo, not here. The deploy workflow fetches them using the `ASSETS_TOKEN` Actions secret. To preview locally, copy that repo's `img/` files into `img/`.
