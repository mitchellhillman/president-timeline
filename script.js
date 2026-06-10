/* ============================================================
   US Presidents — Lifespans & Terms in Office
   Renders the timeline into semantic HTML and wires interactions.
   ============================================================ */

(function () {
  "use strict";

  const TODAY = new Date();

  /* ---------- date / age helpers ---------------------------- */

  // ISO "YYYY-MM-DD" → Date (UTC, avoids timezone drift)
  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  // Date → decimal year, e.g. 1789-04-30 → 1789.33
  function decimalYear(date) {
    const y = date.getUTCFullYear();
    const start = Date.UTC(y, 0, 1);
    const end = Date.UTC(y + 1, 0, 1);
    return y + (date.getTime() - start) / (end - start);
  }

  // Whole years between two dates
  function yearsBetween(from, to) {
    let age = to.getUTCFullYear() - from.getUTCFullYear();
    const m = to.getUTCMonth() - from.getUTCMonth();
    if (m < 0 || (m === 0 && to.getUTCDate() < from.getUTCDate())) age--;
    return age;
  }

  // Age of a person on a given date, or null if not alive then
  function ageOn(person, date) {
    if (date < person._birth) return null;
    if (person._death && date > person._death) return null;
    return yearsBetween(person._birth, date);
  }

  /* ---------- bootstrap ------------------------------------- */

  fetch("data.json")
    .then((r) => r.json())
    .then(build)
    .catch((err) => {
      document.getElementById("chart-hint").textContent =
        "Could not load timeline data.";
      console.error(err);
    });

  function build(raw) {
    // Normalise each record once.
    const people = raw.map((p) => {
      const birth = parseDate(p.birth);
      const death = p.death ? parseDate(p.death) : null;
      const terms = p.terms.map((t) => ({
        start: parseDate(t.start),
        end: t.end ? parseDate(t.end) : TODAY,
        ongoing: !t.end,
      }));
      return { ...p, _birth: birth, _death: death, _terms: terms, _living: !death };
    });

    // Scale: floor below earliest birth → today.
    const minYear = Math.floor(
      Math.min(...people.map((p) => decimalYear(p._birth))) / 10
    ) * 10;
    const maxYear = decimalYear(TODAY);
    const span = maxYear - minYear;

    const plot = document.getElementById("plot");
    plot.style.setProperty("--min-year", minYear);
    plot.style.setProperty("--max-year", maxYear);
    plot.style.setProperty("--span", span.toFixed(4));

    renderGridAndAxis(minYear, maxYear);
    renderRows(people);
  }

  /* ---------- gridlines + axis ------------------------------ */

  function tickYears(minYear, maxYear) {
    const ticks = [];
    const first = Math.ceil(minYear / 25) * 25;
    for (let y = first; y <= maxYear; y += 25) ticks.push(y);
    return ticks;
  }

  function renderGridAndAxis(minYear, maxYear) {
    const grid = document.getElementById("gridlines");
    const axes = [
      document.getElementById("axis-top"),
      document.getElementById("axis"),
    ];
    const ticks = tickYears(minYear, maxYear);
    ticks.forEach((y, i) => {
      const line = document.createElement("div");
      line.className = "gridline";
      line.style.setProperty("--year", y);
      grid.appendChild(line);

      // Right-align the final label so it doesn't clip past the edge.
      const isEnd = i === ticks.length - 1 && maxYear - y < 12;
      axes.forEach((axis) => {
        const tick = document.createElement("span");
        tick.className = "tick" + (isEnd ? " tick--end" : "");
        tick.style.setProperty("--year", y);
        tick.textContent = y;
        axis.appendChild(tick);
      });
    });
  }

  /* ---------- president rows -------------------------------- */

  function renderRows(people) {
    const list = document.getElementById("timeline");

    people.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "president" + (p._living ? " is-living" : "");
      li.style.setProperty("--birth", decimalYear(p._birth).toFixed(4));
      li.style.setProperty(
        "--death",
        decimalYear(p._death || TODAY).toFixed(4)
      );

      const article = document.createElement("article");

      // Trigger button = the lifespan bar
      const bar = document.createElement("button");
      bar.type = "button";
      bar.className = "bar";
      bar.setAttribute("aria-haspopup", "dialog");
      const nameId = "p" + i + "-name";
      article.setAttribute("aria-labelledby", nameId);

      const name = document.createElement("h2");
      name.className = "bar__name";
      name.id = nameId;
      name.textContent = p.name;
      bar.appendChild(name);
      article.appendChild(bar);

      // Red term segments
      p._terms.forEach((t) => {
        const seg = document.createElement("span");
        seg.className = "term";
        seg.style.setProperty("--t-start", decimalYear(t.start).toFixed(4));
        seg.style.setProperty("--t-end", decimalYear(t.end).toFixed(4));
        article.appendChild(seg);
      });

      // Age labels: at first inauguration and at death / today
      const inaugAge = ageOn(p, p._terms[0].start);
      if (inaugAge != null) {
        const a = document.createElement("span");
        a.className = "age age--inaug";
        a.style.setProperty("--t-start", decimalYear(p._terms[0].start).toFixed(4));
        a.textContent = inaugAge;
        article.appendChild(a);
      }
      const endDate = p._death || TODAY;
      const endAge = yearsBetween(p._birth, endDate);
      const endLabel = document.createElement("span");
      endLabel.className = "age age--death";
      endLabel.style.setProperty("--death", decimalYear(endDate).toFixed(4));
      endLabel.textContent = p._living ? endAge + "·" : endAge;
      article.appendChild(endLabel);

      // Decide whether the name fits inside the bar; if too short, move it out.
      // (Width in % of plot; <7% of span is too tight for a name.)
      const widthPct =
        (decimalYear(p._death || TODAY) - decimalYear(p._birth)) /
        (parseFloat(getComputedStyle(plotEl()).getPropertyValue("--span")));
      if (widthPct < 0.06) {
        name.classList.add("bar__name--outside");
        name.style.setProperty("--death", decimalYear(p._death || TODAY).toFixed(4));
        // keep it in the article (absolute) rather than inside the clipped bar
        article.appendChild(name);
      }

      bar.addEventListener("click", () => openPopover(p));

      li.appendChild(article);
      list.appendChild(li);
    });
  }

  function plotEl() {
    return document.getElementById("plot");
  }

  /* ---------- popover --------------------------------------- */

  let pop, overlay;

  // Self-managed modal: a full-screen overlay sits above the chart and catches every
  // outside click, so a dismissing click physically can't reach a bar and reopen a
  // card. (Native popover light-dismiss let the same click close one card and open
  // another.) The card is layered above the overlay; only the close button, the
  // overlay, or Escape dismiss it.
  function ensurePopover() {
    if (pop) return pop;

    overlay = document.createElement("div");
    overlay.className = "popcard-overlay";
    overlay.addEventListener("click", closePopover);
    document.body.appendChild(overlay);

    pop = document.createElement("div");
    pop.className = "popcard";
    pop.id = "pop-card";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-modal", "true");
    document.body.appendChild(pop);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopover();
    });
    return pop;
  }

  function closePopover() {
    if (!pop) return;
    pop.classList.remove("is-open");
    overlay.classList.remove("is-open");
  }

  function fmtYears(p) {
    const b = p._birth.getUTCFullYear();
    if (p._living) {
      return b + " – present · age " + yearsBetween(p._birth, TODAY);
    }
    return b + " – " + p._death.getUTCFullYear() +
      " · died at " + yearsBetween(p._birth, p._death);
  }

  function openPopover(person) {
    const card = ensurePopover();

    const termsHtml = person._terms
      .map((t) => {
        const yrs = t.start.getUTCFullYear() + "–" +
          (t.ongoing ? "present" : t.end.getUTCFullYear());
        const a1 = yearsBetween(person._birth, t.start);
        const a2 = yearsBetween(person._birth, t.end);
        return (
          "<li><span>Age " + a1 + " → " + a2 + "</span>" +
          "<span class='yrs'>" + yrs + "</span></li>"
        );
      })
      .join("");

    card.innerHTML =
      "<button class='popcard__close' type='button' aria-label='Close'>&times;</button>" +
      "<div class='popcard__head'>" +
        "<img class='popcard__thumb' src='" + person.img + "' alt='" + person.name + "' " +
          "loading='lazy' onerror=\"this.style.visibility='hidden'\">" +
        "<div>" +
          "<p class='popcard__num'>President " + person.number + "</p>" +
          "<h3 class='popcard__name'><a href='" + person.wiki + "' rel='noopener'>" +
            person.name + "</a></h3>" +
          "<p class='popcard__life'>" + fmtYears(person) + "</p>" +
        "</div>" +
      "</div>" +
      "<div class='popcard__body'>" +
        "<ul class='popcard__terms'>" + termsHtml + "</ul>" +
      "</div>";

    card.querySelector(".popcard__close").addEventListener("click", closePopover);

    overlay.classList.add("is-open");
    card.classList.add("is-open");
  }
})();
