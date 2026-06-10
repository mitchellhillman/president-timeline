# President Timeline

An interactive timeline of every US president's **lifespan** and **time in office**, in the
visual language of *The Economist*.

Each horizontal bar is one president's life; the **red segment** marks their term(s) in
office. The name sits inside the bar, and small numbers show ages at key points. Hover or
focus a bar to drop a guide line at that president's inauguration and see how old every
other living president was at that moment. Click (or keyboard-activate) a bar for a card
with a portrait, term details, an ages-at-inauguration breakdown, and a link to the
president's Wikipedia article.

**Live site:** https://mitchellhillman.github.io/president-timeline/

## Highlights

- **45 presidents, 47 presidencies** — Grover Cleveland (#22 & #24) and Donald Trump
  (#45 & #47) each get two red term segments on a single lifespan bar.
- **Semantic HTML** — an ordered list of `<article>`s with `<time>` elements; bar geometry
  is driven entirely by CSS custom properties and `calc()`.
- **Responsive scale** — the timeline fits the window on desktop; on mobile it keeps a
  minimum width and scrolls horizontally.
- **No build step** — plain HTML, CSS, and vanilla JS.

## Data & assets

- Dates (births, deaths, inaugurations, term ends) are sourced from
  [Wikipedia](https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States) and
  live in [`data.json`](data.json).
- Portrait thumbnails in [`img/`](img/) were fetched from each president's Wikipedia page
  via the MediaWiki API using [`fetch-images.mjs`](fetch-images.mjs). To refresh them:

  ```sh
  node fetch-images.mjs
  ```

## Design

- **Typeface:** [Jost](https://fonts.google.com/specimen/Jost) — clean, geometric, stark.
- **Palette:** The Economist
  — accent red `#E3120B`, salmon `#F4A39E`, slate blue `#7E9DC9`, navy `#3B4BA0`,
  ink `#121212`, gridline grey `#C9CDD2`, caption grey `#8A8A8A`, paper `#FFFFFF`.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Served as static files at the repo root via **GitHub Pages** (branch `main`, root). No
Actions build is required.

---

*Portraits and biographical data © their respective sources, via Wikipedia / Wikimedia
Commons.*
