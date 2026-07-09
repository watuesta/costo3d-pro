# Costo 3D Pro — AGENTS.md

## Project

Vanilla HTML/CSS/JS web app — cost calculator for 3D printing in COP (Colombian Pesos).

**No build, no bundler, no package manager, no tests, no CI.** Static site served from the filesystem.

## Quick start

```sh
python3 -m http.server 8000    # or just open index.html directly
```

## Architecture

All code is global-scope, no modules, no imports:
- `index.html` — single entry point; loads all CDN deps and local files
- `js/main.js` (~547 lines) — every function is global (`calculate()`, `generatePdf()`, etc.)
- `css/styles.css` (~38 lines) — custom styles (Matrix theme); Tailwind classes used inline in HTML
- `favicon.svg` — SVG icon (neon green gradient)
- CDN deps loaded in `<head>` of `index.html`: Tailwind CSS, jsPDF, html2canvas, Google Fonts (Inter)

## Conventions

- UI language: **Spanish** (labels, buttons, alerts)
- Currency: **COP** — formatted with `es-CO` locale (`$ 1.234.567`)
- Time input: `h.m` format (e.g. `1.30` = 1h 30m)
- Printer presets: Bambulab A1 (95W), Bambulab P2S (180W); watts auto-sync from dropdown

## Development workflow

No tooling exists. Edit -> reload browser. Manual testing only.

## PDF export

`generatePdf()` renders a hidden DOM node via html2canvas, then creates a jsPDF A4 document. Requires `window.getProjectData()` to expose current calculation state.
- White background, dark text, neon green (`#16a34a`) accents
- Green-only gradient bars (dark → bright) for cost distribution chart
- Logo: "Costo" dark, "3D" green, "Pro" dark

## Key state

- `partsCount`, `plateCounter` — part row tracking
- `window.currentItemsInfo[]` — string summaries for export
- `wasteCost` — cached for markdown export

## UI patterns

- "Proyecto & Piezas" card: the **"+ Añadir Placa"** button is at the **bottom** of the parts list (inside `.mac-card`, after `#partsContainer`)
- Primary CTA "Calcular Todo" uses neon green (`#00ff41`); secondary "Nueva Cotización" uses rose (`rose-500`) — both are transparent bg + border style, fill on hover with glow
- Text sizes use `text-xs md:text-[10px]` pattern: readable 12px on mobile, compact 10px on desktop
- **Matrix / cyberpunk theme**: black background, `--neon-green: #00ff41` accent, subtle grid overlay (`background-image: repeating linear-gradient`), all buttons use `border + hover:bg + hover:shadow` glow pattern
- CSS variables in `styles.css`: `--neon-green`, `--neon-dim`, `--neon-glow`
- Progress bar + breakdown + remove button (×) all use **green-only shades** (`green-900` → `green-300`)
- PDF export uses dark theme (`#0a0a0a` bg, neon green accents, green gradient bars)
- **Project name is required** before `calculate()` proceeds (shows alert if empty)

## No linter, no typechecker, no test runner
