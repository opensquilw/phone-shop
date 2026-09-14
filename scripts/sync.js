#!/usr/bin/env node
/* Merge WhatsApp chat exports in data/inbox/ into data/catalog.json.
   Run by GitHub Actions (or locally: node scripts/sync.js). No dependencies. */
const fs = require("fs"), path = require("path");
const P = require("../parser.js");
const ROOT = path.join(__dirname, "..");
const F = (n) => path.join(ROOT, "data", n);
const readJ = (n, d) => { try { return JSON.parse(fs.readFileSync(F(n), "utf8")); } catch { return d; } };
const writeJ = (n, o) => fs.writeFileSync(F(n), JSON.stringify(o, null, 2) + "\n");
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

const rules = readJ("rules.json", { markup: { mode: "percent", value: 8, round: 10, tail: 0 }, minPrice: 500 });
const catalog = readJ("catalog.json", null);
if (!catalog) { console.error("data/catalog.json missing"); process.exit(1); }
const state = readJ("sync-state.json", { lastTs: null, processed: [] });
const review = readJ("review.json", { items: [] });

function sellPrice(cost) {
  const m = rules.markup; let v = m.mode === "percent" ? cost * (1 + m.value / 100) : cost + Number(m.value);
  const r = Number(m.round) || 1; v = Math.ceil(v / r) * r;
  if (Number(m.tail)) { v = Math.floor(v / 10) * 10 + Number(m.tail); if (v < cost) v += 10; }
  return Math.round(v);
}

// 1. collect inbox text (txt files; zips are extracted by the workflow beforehand)
const inbox = path.join(ROOT, "data", "inbox");
const files = fs.existsSync(inbox) ? fs.readdirSync(inbox).filter((f) => /\.txt$/i.test(f)).sort() : [];
if (!files.length) { console.log("inbox empty — nothing to do"); process.exit(0); }
const text = files.map((f) => fs.readFileSync(path.join(inbox, f), "utf8")).join("\n");

// 2. parse, keep only rows newer than the last sync (rows without timestamps are always applied)
const { rows, skipped } = P.parse(text, { minPrice: rules.minPrice || 500 });
const lastTs = state.lastTs ? new Date(state.lastTs) : null;
let newest = lastTs;
const fresh = rows.filter((r) => {
  const d = P.parseTs(r.ts);
  if (d && (!newest || d > newest)) newest = d;
  return !d || !lastTs || d > lastTs;
});

// 3. merge
let added = 0, updated = 0, queued = 0;
const key = (b, m, s) => [b, String(m).toLowerCase().trim(), s || null].join("|");
const byKey = new Map(catalog.products.map((p) => [key(p.brand, p.model, p.storage), p]));
for (const r of fresh) {
  if (r.ambiguous) { review.items.push({ raw: r.raw, sender: r.sender, ts: r.ts, seen: today() }); queued++; continue; }
  const ex = byKey.get(key(r.brand, r.model, r.storage));
  if (ex) {
    if (!ex.locked) ex.price = sellPrice(r.cost);
    ex.stock = r.stock; ex.colours = Array.from(new Set([...(ex.colours || []), ...r.colours])); ex.updated = today(); updated++;
  } else {
    const p = { id: uid(), brand: r.brand, model: r.model, storage: r.storage, colours: r.colours, price: sellPrice(r.cost), stock: r.stock, photo: "", note: "", hidden: false, locked: false, updated: today() };
    catalog.products.push(p); byKey.set(key(p.brand, p.model, p.storage), p); added++;
  }
}
// keep review list short and unique
const seen = new Set(); review.items = review.items.filter((i) => !seen.has(i.raw) && seen.add(i.raw)).slice(-50);

// 4. write + clean inbox
catalog.updated = today();
writeJ("catalog.json", catalog); writeJ("review.json", review);
writeJ("sync-state.json", { lastTs: newest ? newest.toISOString() : state.lastTs, lastRun: new Date().toISOString(), processed: files.slice(-20) });
files.forEach((f) => fs.unlinkSync(path.join(inbox, f)));
console.log(`parsed ${rows.length} rows (${fresh.length} new) → added ${added}, updated ${updated}, queued for review ${queued}, skipped lines ${skipped.length}`);
