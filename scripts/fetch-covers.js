// Downloads cover art for the game tiles from their Wikipedia pages.
// Run `npm run covers` (add --force to re-download). Needs Node 18+ and an internet connection.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const force = process.argv.includes("--force");
const UA = "wiiu-menu-portfolio/1.0 (cover fetch script)";

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js/config.js"), "utf8"), sandbox);

const games = [];
(function walk(list) {
  (list || []).forEach((item) => {
    if (Array.isArray(item.apps)) walk(item.apps);
    const wiki = (item.links || []).find((l) => /wikipedia\.org\/wiki\//.test(l.url));
    if (item.game && item.icon && wiki) games.push({ title: item.title, file: item.icon, page: decodeURIComponent(wiki.url.split("/wiki/")[1]) });
  });
})(sandbox.window.WIIU_CONFIG.apps);

async function coverUrl(page) {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  Object.entries({
    action: "query", format: "json", redirects: "1", titles: page.replace(/_/g, " "),
    prop: "pageimages", piprop: "thumbnail|original", pithumbsize: "512", pilicense: "any",
  }).forEach(([k, v]) => api.searchParams.set(k, v));
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const pages = Object.values((await res.json()).query.pages || {});
  const p = pages[0] || {};
  return (p.thumbnail || p.original || {}).source;
}

(async () => {
  let ok = 0;
  for (const g of games) {
    const out = path.join(root, g.file);
    if (!force && fs.existsSync(out)) {
      console.log(`skip   ${g.title} (already have ${g.file})`);
      ok++;
      continue;
    }
    try {
      const url = await coverUrl(g.page);
      if (!url) throw new Error("no image on its Wikipedia page");
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`download ${res.status}`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      console.log(`saved  ${g.title} -> ${g.file}`);
      ok++;
    } catch (e) {
      console.log(`failed ${g.title}: ${e.message}`);
    }
  }
  console.log(`\n${ok}/${games.length} covers ready. Tiles without a cover keep their title card.`);
})();
