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
    const axis = document.getElementById("axis");
    const ticks = tickYears(minYear, maxYear);
    ticks.forEach((y, i) => {
      const line = document.createElement("div");
      line.className = "gridline";
      line.style.setProperty("--year", y);
      grid.appendChild(line);

      const tick = document.createElement("span");
      tick.className = "tick";
      // Right-align the final label so it doesn't clip past the edge.
      if (i === ticks.length - 1 && maxYear - y < 12) tick.className += " tick--end";
      tick.style.setProperty("--year", y);
      tick.textContent = y;
      axis.appendChild(tick);
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

      bar.addEventListener("click", () => openPopover(p, people));
      bar.addEventListener("mouseenter", () => showGuide(p, people));
      bar.addEventListener("mouseleave", hideGuide);
      bar.addEventListener("focus", () => showGuide(p, people));
      bar.addEventListener("blur", hideGuide);

      li.appendChild(article);
      list.appendChild(li);
    });
  }

  function plotEl() {
    return document.getElementById("plot");
  }

  /* ---------- hover guide line + age badges ----------------- */

  let badgeNodes = [];

  function showGuide(target, people) {
    const inaug = target._terms[0].start;
    const guide = document.getElementById("guide");
    const yr = decimalYear(inaug);
    guide.style.setProperty("--year", yr);
    guide.style.left =
      "calc((" + yr.toFixed(4) +
      " - var(--min-year)) / var(--span) * 100%)";
    guide.classList.add("is-on");

    hideBadges();
    const rows = document.querySelectorAll(".president");
    people.forEach((p, i) => {
      const age = ageOn(p, inaug);
      if (age == null) return;
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = age;
      badge.style.left =
        "calc((" + yr.toFixed(4) +
        " - var(--min-year)) / var(--span) * 100%)";
      badge.style.top = i * rowHeight() + (rowHeight() - 12) / 2 + "px";
      document.getElementById("guide").parentElement.appendChild(badge);
      badgeNodes.push(badge);
    });
  }

  function rowHeight() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--row-h");
    return parseFloat(v) || 30;
  }

  function hideBadges() {
    badgeNodes.forEach((b) => b.remove());
    badgeNodes = [];
  }

  function hideGuide() {
    document.getElementById("guide").classList.remove("is-on");
    hideBadges();
  }

  /* ---------- popover --------------------------------------- */

  let pop;

  function ensurePopover() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "popcard";
    pop.setAttribute("popover", "auto");
    pop.id = "pop-card";
    document.body.appendChild(pop);
    return pop;
  }

  function fmtYears(p) {
    const b = p._birth.getUTCFullYear();
    if (p._living) {
      return b + " – present · age " + yearsBetween(p._birth, TODAY);
    }
    return b + " – " + p._death.getUTCFullYear() +
      " · died at " + yearsBetween(p._birth, p._death);
  }

  function openPopover(person, people) {
    const card = ensurePopover();
    const inaug = person._terms[0].start;

    const others = people
      .map((p) => ({ p, age: ageOn(p, inaug) }))
      .filter((o) => o.age != null)
      .sort((a, b) => b.age - a.age);

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

    const othersHtml = others
      .map((o) => {
        const self = o.p === person ? " is-self" : "";
        return (
          "<li class='" + self.trim() + "'><span>" + o.p.name + "</span>" +
          "<span class='age-n'>" + o.age + "</span></li>"
        );
      })
      .join("");

    card.innerHTML =
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
        "<p class='popcard__inaug-h'>At this inauguration (" +
          inaug.getUTCFullYear() + "), ages were</p>" +
        "<ul class='popcard__others'>" + othersHtml + "</ul>" +
      "</div>";

    if (typeof card.showPopover === "function") {
      card.showPopover();
    } else {
      card.setAttribute("data-open", "true");
      card.style.position = "fixed";
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.transform = "translate(-50%, -50%)";
      card.style.display = "block";
    }
  }
})();
