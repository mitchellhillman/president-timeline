# President Timeline

An interactive timeline of every US president's **lifespan** and **time in office**.

Each horizontal bar is one president's life; the **dark-blue segment** marks their term(s)
in office, and presidents who are still living have a **light-blue** bar. The name sits
inside the bar, and small numbers show ages at key points. Click (or keyboard-activate) a
bar for a card with a portrait, term details, and a link to the president's Wikipedia
article.

**Live site:** https://mitchellhillman.github.io/president-timeline/

## Highlights

- **45 presidents, 47 presidencies.** Grover Cleveland (#22 & #24) and Donald Trump
  (#45 & #47) each get two red term segments on a single lifespan bar.
- **Semantic HTML.** An ordered list of `<article>`s with `<time>` elements; bar geometry
  is driven entirely by CSS custom properties and `calc()`.
- **Responsive scale.** The timeline fits the window on desktop; on mobile it keeps a
  minimum width and scrolls horizontally. Year labels run along both the top and bottom.
- **No build step.** Plain HTML, CSS, and vanilla JS.

## Data & assets

- Dates (births, deaths, inaugurations, term ends) are sourced from
  [Wikipedia](https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States) and
  live in [`data.json`](data.json).
- Portrait thumbnails in [`img/`](img/) were fetched from each president's Wikipedia page
  via the MediaWiki API using [`fetch-images.mjs`](fetch-images.mjs), which validates each
  file is a real JPEG and is safe to re-run:

  ```sh
  node fetch-images.mjs
  ```

## Design

- **Typeface:** [Jost](https://fonts.google.com/specimen/Jost), a single semibold weight
  throughout for a clean, stark feel.
- **Palette:** monochrome white. Text and labels are a very dark grey (`#2B2B2B`) on white;
  lifespan bars are light grey (`#E2E4E7`). Color is used only with meaning: **dark blue**
  (`#21409A`) for time in office and **light blue** (`#A3C2E3`) for still-living presidents.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Served as static files at the repo root via **GitHub Pages** (branch `main`, root). No
Actions build is required.

---

*Portraits and biographical data are from Wikipedia / Wikimedia Commons.*
