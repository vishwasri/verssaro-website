# VERSSARO — Website v5 (static, dark & gold)

A single-page, fully static site: plain HTML, CSS and JavaScript. No WordPress, PHP, database, Node or build step. Everything (fonts, 3D garment textures, logo) is bundled inside the `htdocs` folder.

## Run it locally

**Quickest:** open `htdocs/index.html` in Chrome, Edge, Firefox or Safari (double-click). Everything works from disk, including the 3D studio.

**Recommended (closest to the live site):** start a tiny local server.
- Windows: double-click `START-LOCAL-WINDOWS.bat`
- macOS: double-click `START-LOCAL-MAC.command` (first time: right-click → Open)
- Or in a terminal: `cd htdocs && python -m http.server 8000`, then visit http://localhost:8000

## Upload to InfinityFree

1. In the InfinityFree control panel open **Online File Manager** (or use FileZilla with your FTP details).
2. Open the `htdocs` folder of your domain. Delete the default `index2.html` / placeholder files.
3. Upload **everything inside** this package's `htdocs` folder (`index.html`, `.htaccess`, `assets/`) into the server's `htdocs`. `index.html` must sit directly in `htdocs`.
4. Visit your domain. Hard-refresh (Ctrl/Cmd + Shift + R) if you see an old version.

Tip: FileZilla hides `.htaccess` by default (Server → Force showing hidden files). The site works without it; it just adds caching and compression.

## Edit content — `htdocs/assets/js/config.js`

- `products`: names, two-line selector titles (`t1` / `t2`), story, details, sizes, photos, accent colour.
- `price`: leave `null` to show "Price on enquiry", or set a number (e.g. `6500`).
- `orderWhatsapp`: digits with country code (e.g. `'94771234567'`) to enable "Send via WhatsApp" in the enquiry list.
- `orderEmail`: an address to enable "Send by email".
- With neither set, visitors copy their enquiry and message you on Instagram.

## What's on the page

1. **Preloader** — the six emblem arms assemble, the wordmark appears, the lockup glides into the header and the screen opens like doors from a gold centre seam.
2. **Hero** — a three-panel campaign stage (pointer depth, auto-play, click a side panel to bring it forward) with a halftone **HERITAGE** title whose dots part around the cursor, warm on contact and ripple on click. Scrolling scatters the dots and pushes the stage away.
3. **Marquee** that speeds and skews with scroll velocity.
4. **The emblem** — a pinned section where the six arms fly in and lock together as you scroll while the manifesto lights up word by word.
5. **Collection** — four products, hover-swap to lifestyle shots, tilt and light-follow, quick view with gallery and sizes.
6. **Selector** — the orbit carousel, converted from food to fashion: pinned, scroll-driven, garments swing on an orbit inside an arched frame, two-weight title wipes, story/details card, sizes, thumbnails, arrows, keyboard and swipe.
7. **Studio** — a live WebGL cloth simulation of each tee on a hanger: drag the fabric, tap for ripples, breeze and light sliders, pause/reset, design switcher.
8. **Lookbook** — vertical scroll drives a horizontal gallery with parallax.
9. **Craft** — stacking packaging cards using the measurements from the packaging board.
10. **Enquire** + a compact footer with the emblem printed in interactive halftone dots (no oversized title above the footer).

## Brand

- Logo geometry and wordmark letterforms come directly from the supplied vector files (`assets/brand/`, unchanged). The site inlines the same paths so each arm and letter can animate.
- The logo is shown in the site gold `#D9B25C` for a brighter, richer gold. To use the official heritage gold instead, change `color: var(--gold)` to `color: #C2A464` on `.hdr__logo .vs-logo`, `.loader__logo` and `.ftr__logo` in `assets/css/main.css`.
- Palette: 60% black `#0A0A0A`, 30% ivory `#F3ECDE` / charcoal, 10% gold `#D9B25C`. Type: Montserrat (wide-tracked display) + Inter (body).
- The supplied campaign images had AI-drawn logos baked into their top areas; those areas were cropped or painted out so only the official vector logo appears on the site.

## Notes

- This is an enquiry catalogue: no payments or live stock. Prices and availability are confirmed by message.
- The 3D studio is a fabric simulation for exploring the artwork; product photos show exact garment detail.
- `prefers-reduced-motion` is respected; WebGL pauses when off-screen and falls back to a photo if WebGL is unavailable.
