// Download each president's portrait thumbnail from Wikipedia into img/.
// Re-run safe: only fetches files that are missing or not a valid JPEG.
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("./data.json", import.meta.url)));
await mkdir(new URL("./img", import.meta.url), { recursive: true });

const UA = "president-timeline/1.0 (https://github.com/mitchellhillman; educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function isJpeg(buf) {
  return buf.length > 1000 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function alreadyValid(path) {
  try {
    const url = new URL("./" + path, import.meta.url);
    if ((await stat(url)).size < 1000) return false;
    const buf = await readFile(url);
    return isJpeg(buf);
  } catch {
    return false;
  }
}

let ok = 0, skipped = 0;
const failed = [];
for (const p of data) {
  if (await alreadyValid(p.img)) { skipped++; continue; }
  const t = title(p.wiki);
  try {
    const url = await thumbUrl(t);
    if (!url) { failed.push(p.name + " (no thumbnail)"); continue; }
    const img = await fetch(url, { headers: { "User-Agent": UA, Referer: p.wiki } });
    const buf = Buffer.from(await img.arrayBuffer());
    if (!isJpeg(buf)) { failed.push(p.name + " (not jpeg, " + buf.length + "b)"); await sleep(800); continue; }
    await writeFile(new URL("./" + p.img, import.meta.url), buf);
    ok++;
    console.log("✓", p.img, "(" + buf.length + "b)");
    await sleep(600); // be polite to the image CDN
  } catch (e) {
    failed.push(p.name + " (" + e.message + ")");
    await sleep(800);
  }
}
console.log(`\nDownloaded ${ok}, kept ${skipped} already-valid.`);
if (failed.length) console.log("Failed:", failed.join(", "));
