/* WhatsApp price-list parser → product rows.
   Works as a browser global (window.PhoneParser) and as a Node module (for tests). */
(function (root) {
  const BRANDS = [
    { key: "Apple",    re: /\b(iphone|ipad|apple|airpods)\b/i },
    { key: "Samsung",  re: /samsung|galaxy|三星|\bs\d{2}\b|\bz ?(fold|flip)\d*/i },
    { key: "Xiaomi",   re: /xiaomi|小米|redmi|紅米|红米|poco/i },
    { key: "Huawei",   re: /huawei|華為|华为|\bmate ?\d|\bpura\b|\bnova ?\d/i },
    { key: "Google",   re: /pixel|google/i },
    { key: "OPPO",     re: /oppo|\breno\d*|\bfind ?[xn]\d*/i },
    { key: "vivo",     re: /vivo|iqoo/i },
    { key: "OnePlus",  re: /oneplus|一加/i },
    { key: "Honor",    re: /honor|榮耀|荣耀|\bmagic ?\d/i },
    { key: "Sony",     re: /sony|xperia/i },
    { key: "Nothing",  re: /nothing ?phone|\bcmf\b/i },
    { key: "ASUS",     re: /asus|rog ?phone|zenfone/i },
    { key: "Motorola", re: /motorola|\bmoto\b|razr/i },
    { key: "realme",   re: /realme/i },
    { key: "Nubia",    re: /nubia|努比亞|red ?magic/i },
  ];

  // Longest-first so "沙漠鈦" beats "鈦"
  const COLOURS = [
    ["原色鈦金屬", "Natural Titanium"], ["沙漠色鈦金屬", "Desert Titanium"], ["黑色鈦金屬", "Black Titanium"], ["白色鈦金屬", "White Titanium"],
    ["原色鈦", "Natural Titanium"], ["沙漠鈦", "Desert Titanium"], ["黑鈦", "Black Titanium"], ["白鈦", "White Titanium"],
    ["宇宙橙", "Cosmic Orange"], ["深藍色", "Deep Blue"], ["深藍", "Deep Blue"], ["深空黑", "Space Black"], ["星光色", "Starlight"], ["星光", "Starlight"],
    ["午夜色", "Midnight"], ["午夜", "Midnight"], ["群青色", "Ultramarine"], ["群青", "Ultramarine"], ["藍綠色", "Teal"], ["藍綠", "Teal"],
    ["沙漠色", "Desert"], ["沙漠", "Desert"], ["鈦金屬", "Titanium"], ["鈦色", "Titanium"], ["幻夜黑", "Phantom Black"], ["曜石黑", "Obsidian"],
    ["冰川藍", "Glacier Blue"], ["薄荷綠", "Mint"], ["薰衣草", "Lavender"], ["淺綠", "Light Green"], ["淺藍", "Light Blue"], ["天藍", "Sky Blue"],
    ["霧藍", "Mist Blue"], ["雲白", "Cloud White"], ["珍珠白", "Pearl White"], ["玫瑰金", "Rose Gold"], ["香檳金", "Champagne"],
    ["石墨", "Graphite"], ["銀色", "Silver"], ["金色", "Gold"], ["黑色", "Black"], ["白色", "White"], ["藍色", "Blue"], ["綠色", "Green"],
    ["紅色", "Red"], ["紫色", "Purple"], ["粉色", "Pink"], ["粉紅", "Pink"], ["灰色", "Gray"], ["橙色", "Orange"], ["黃色", "Yellow"],
    ["啡色", "Brown"], ["棕色", "Brown"], ["米色", "Beige"], ["青色", "Cyan"],
    ["黑", "Black"], ["白", "White"], ["藍", "Blue"], ["綠", "Green"], ["紅", "Red"], ["紫", "Purple"], ["粉", "Pink"], ["灰", "Gray"],
    ["金", "Gold"], ["銀", "Silver"], ["橙", "Orange"], ["黃", "Yellow"], ["啡", "Brown"], ["棕", "Brown"], ["青", "Cyan"], ["鈦", "Titanium"],
    // English
    ["natural titanium", "Natural Titanium"], ["desert titanium", "Desert Titanium"], ["black titanium", "Black Titanium"], ["white titanium", "White Titanium"],
    ["space black", "Space Black"], ["space gray", "Space Gray"], ["space grey", "Space Gray"], ["deep blue", "Deep Blue"], ["cosmic orange", "Cosmic Orange"],
    ["sky blue", "Sky Blue"], ["light blue", "Light Blue"], ["light green", "Light Green"], ["rose gold", "Rose Gold"], ["phantom black", "Phantom Black"],
    ["ultramarine", "Ultramarine"], ["starlight", "Starlight"], ["midnight", "Midnight"], ["graphite", "Graphite"], ["titanium", "Titanium"],
    ["obsidian", "Obsidian"], ["lavender", "Lavender"], ["mint", "Mint"], ["teal", "Teal"], ["desert", "Desert"], ["silver", "Silver"],
    ["black", "Black"], ["white", "White"], ["blue", "Blue"], ["green", "Green"], ["red", "Red"], ["purple", "Purple"], ["pink", "Pink"],
    ["gray", "Gray"], ["grey", "Gray"], ["gold", "Gold"], ["orange", "Orange"], ["yellow", "Yellow"], ["brown", "Brown"], ["beige", "Beige"],
  ];

  const STORAGE_VALUES = new Set([32, 64, 128, 256, 512, 1024, 2048]);

  // WhatsApp export prefixes:  "[14/9/2026, 10:23:45] Name: msg"  or  "14/09/2026, 10:23 - Name: msg"
  const WA_PREFIX = /^\s*(?:\[?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\]?\s*(?:-\s*)?)?([^:\n]{1,40}):\s+(?=\S)/i;
  const SYSTEM_LINE = /(joined using|added|left$|changed the (group|subject)|created group|end-to-end encrypted|<Media omitted>|image omitted|圖片已略去|已加入|已離開|訊息和通話都經過端對端加密)/i;

  const STOCK_RE = [
    [/缺貨|冇貨|無貨|售罄|sold ?out|out of stock/i, "out"],
    [/預訂|預定|訂貨|落單|pre-?order|backorder|等貨/i, "order"],
    [/現貨|有貨|即日|in stock|ready/i, "in"],
  ];

  function stripPrefix(line) {
    const m = line.match(WA_PREFIX);
    if (m) return { sender: m[1].trim(), text: line.slice(m[0].length) };
    return { sender: null, text: line };
  }

  function detectBrand(text) {
    for (const b of BRANDS) if (b.re.test(text)) return b.key;
    return null;
  }

  function extractStorages(text) {
    const found = [];
    let s = text;
    // 128GB / 256G / 1TB / 1T
    s = s.replace(/(\d+(?:\.\d+)?)\s*(TB|GB|T\b|G\b)/gi, (m, n, u) => {
      let v = parseFloat(n);
      if (/^t/i.test(u)) v = v * 1024;
      if (STORAGE_VALUES.has(v)) { found.push(v); return " "; }
      return m; // e.g. 5G network
    });
    // bare 128/256/512 tokens (also inside 128/256/512 groups)
    s = s.replace(/(?<![\d.,$])(64|128|256|512|1024)(?![\d,.])(?!\s*(?:蚊|元|HKD|hkd))/g, (m, n) => {
      found.push(parseInt(n, 10)); return " ";
    });
    return { storages: found, rest: s };
  }

  function extractPrices(text, minPrice) {
    const found = [];
    let s = text;
    // $8,999 / HK$8999 / 8999蚊 / 8999元 / bare 4-5 digit numbers
    s = s.replace(/(?:HK\$|HKD|港幣|\$|＄)\s*(\d{1,3}(?:,\d{3})+|\d{3,6})(?:\s*(?:蚊|元|HKD))?/gi, (m, n) => { found.push(+n.replace(/,/g, "")); return " "; });
    s = s.replace(/(\d{1,3}(?:,\d{3})+|\d{3,6})\s*(?:蚊|元|HKD|hkd)/g, (m, n) => { found.push(+n.replace(/,/g, "")); return " "; });
    s = s.replace(/(?<![\d.,])(\d{4,6})(?![\d,.])/g, (m, n) => {
      const v = +n;
      // years like 2026 are ambiguous; only accept ≥ minPrice and not a plausible model year token
      if (v >= minPrice && !(v >= 2015 && v <= 2035 && /年|\/|-/.test(text))) { found.push(v); return " "; }
      return m;
    });
    // 3-digit bare price only if line has a currency hint elsewhere handled above; skip otherwise
    return { prices: found, rest: s };
  }

  function extractColours(text) {
    const found = [];
    let s = text;
    for (const [tok, en] of COLOURS) {
      const isAscii = /^[a-z ]+$/i.test(tok);
      const re = isAscii ? new RegExp("\\b" + tok.replace(/ /g, "\\s*") + "\\b", "gi") : new RegExp(tok, "g");
      s = s.replace(re, () => { if (!found.includes(en)) found.push(en); return " "; });
    }
    return { colours: found, rest: s };
  }

  function detectStock(text) {
    for (const [re, v] of STOCK_RE) if (re.test(text)) return v;
    return null;
  }

  function cleanModel(text) {
    return text
      .replace(/現貨|有貨|即日|缺貨|冇貨|無貨|售罄|預訂|預定|訂貨|落單|等貨|全新|未開封|港行|港版|水貨|國行|美版|日版|行貨|大量|急放|平放|靚價|批發|來料|收|放|出|有|色|各|同價|共|港元/g, " ")
      .replace(/\b(in stock|sold out|pre-?order|brand new|sealed|hk version|new|price|each|only|available)\b/gi, " ")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ")
      .replace(/[:：\-–—|｜\/,，、;；()（）\[\]【】*#@~•·。.!！?？"“”'']+/g, " ")
      .replace(/\b(x|X)\s*\d+\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function looksLikeModel(text) {
    if (!text || text.length < 2 || text.length > 40) return false;
    if (/[A-Za-z]/.test(text)) return true;
    // Chinese brand + number, e.g. 小米15 / 華為Mate70 / 榮耀200
    return /[\u4e00-\u9fff]/.test(text) && /\d/.test(text) && !!detectBrand(text);
  }

  /**
   * parse(text, {minPrice=500}) → { rows:[{brand,model,storage,colours,cost,stock,raw,sender}], skipped:[lines] }
   */
  function parse(text, opts) {
    const minPrice = (opts && opts.minPrice) || 500;
    const rows = [];
    const skipped = [];
    let ctxModel = null, ctxBrand = null, ctxStock = null;

    const lines = text.replace(/\r/g, "").split("\n");
    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;
      const { sender, text: body } = stripPrefix(rawLine);
      if (SYSTEM_LINE.test(body)) continue;

      const stock = detectStock(body);
      const p = extractPrices(body, minPrice);
      const st = extractStorages(p.rest);
      const co = extractColours(st.rest);
      const modelText = cleanModel(co.rest);
      const brandHere = detectBrand(body);

      if (p.prices.length === 0) {
        // No price: maybe a heading ("iPhone 17 Pro Max") that sets context
        if (looksLikeModel(modelText) || brandHere) {
          ctxModel = modelText || ctxModel;
          ctxBrand = brandHere || ctxBrand;
          ctxStock = stock;
        } else {
          skipped.push(rawLine);
        }
        continue;
      }

      let model = modelText;
      let brand = brandHere;
      if (!looksLikeModel(model)) { model = ctxModel; brand = brand || ctxBrand; }
      else if (!brand && ctxBrand && !detectBrand(model)) {
        // "S25 Ultra" under a "Samsung" heading — detectBrand handles most; else inherit
        brand = ctxBrand;
      }
      if (!model) { skipped.push(rawLine); continue; }
      brand = brand || detectBrand(model) || "Other";

      const storages = st.storages.length ? st.storages : [null];
      const prices = p.prices;
      const stockV = stock || ctxStock || "in";

      if (storages.length === prices.length && storages.length > 1) {
        storages.forEach((s, i) => rows.push(mk(brand, model, s, co.colours, prices[i], stockV, rawLine, sender)));
      } else if (prices.length === 1) {
        storages.forEach((s) => rows.push(mk(brand, model, s, co.colours, prices[0], stockV, rawLine, sender)));
      } else {
        // multiple prices, unclear mapping: take the lowest as cost, keep raw for manual fix
        rows.push(mk(brand, model, storages[0], co.colours, Math.min(...prices), stockV, rawLine, sender, true));
      }
      if (looksLikeModel(modelText)) { ctxModel = modelText; ctxBrand = brand; }
    }

    // Dedupe: same brand+model+storage → latest wins (price updates later in the chat)
    const map = new Map();
    for (const r of rows) {
      const k = [r.brand, r.model.toLowerCase(), r.storage].join("|");
      const prev = map.get(k);
      if (prev) { r.colours = Array.from(new Set([...prev.colours, ...r.colours])); }
      map.set(k, r);
    }
    return { rows: Array.from(map.values()), skipped };
  }

  function mk(brand, model, storage, colours, cost, stock, raw, sender, ambiguous) {
    return { brand, model, storage, colours: colours.slice(), cost, stock, raw: raw.trim(), sender, ambiguous: !!ambiguous };
  }

  function storageLabel(v) {
    if (!v) return "";
    return v >= 1024 ? (v / 1024) + "TB" : v + "GB";
  }

  const api = { parse, storageLabel, BRANDS: BRANDS.map((b) => b.key), COLOURS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PhoneParser = api;
})(typeof window !== "undefined" ? window : globalThis);
