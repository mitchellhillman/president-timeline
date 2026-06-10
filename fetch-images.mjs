// One-off: download each president's portrait thumbnail from Wikipedia into img/.
import { readFile, mkdir, writeFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("./data.json", import.meta.url)));
await mkdir(new URL("./img", import.meta.url), { recursive: true });

const UA = "president-timeline/1.0 (https://github.com/mitchellhillman; educational project)";

function title(wiki) {
  return decodeURIComponent(wiki.split("/wiki/")[1]);
}

async function thumbUrl(t) {
  const api =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1" +
    "&prop=pageimages&piprop=thumbnail&pithumbsize=500&titles=" +
    encodeURIComponent(t);
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  const json = await res.json();
  const pages = json.query.pages;
  const page = pages[Object.keys(pages)[0]];
  return page?.thumbnail?.source || null;
}

let ok = 0;
const missing = [];
for (const p of data) {
  const t = title(p.wiki);
  try {
    const url = await thumbUrl(t);
    if (!url) { missing.push(p.name); continue; }
    const img = await fetch(url, { headers: { "User-Agent": UA } });
    const buf = Buffer.from(await img.arrayBuffer());
    await writeFile(new URL("./" + p.img, import.meta.url), buf);
    ok++;
    console.log("✓", p.img, "←", url.split("/").pop());
  } catch (e) {
    missing.push(p.name + " (" + e.message + ")");
  }
}
console.log(`\nDownloaded ${ok}/${data.length}.`);
if (missing.length) console.log("Missing:", missing.join(", "));
