/* 機舖 admin — paste WhatsApp → catalog */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const KEY = "ps_admin";
  const P = window.PhoneParser;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m) => { const el = $("#toast"); el.textContent = m; el.classList.add("show"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2000); };
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const today = () => new Date().toISOString().slice(0, 10);
  const BRANDS = P.BRANDS.concat(["Other"]);
  const PAY_DEFS = [
    { k: "payme", label: "PayMe", fields: [["link", "PayMe 收款連結（https://payme.hsbc/…）"]], qr: true },
    { k: "alipay", label: "AlipayHK", fields: [["id", "AlipayHK 帳號（電話／電郵，選填）"]], qr: true },
    { k: "fps", label: "轉數快 FPS", fields: [["id", "FPS ID／電話／電郵"], ["name", "收款人名稱"], ["bank", "銀行"]] },
    { k: "bank", label: "銀行轉帳", fields: [["bank", "銀行"], ["account", "戶口號碼"], ["holder", "戶口名稱"]] },
    { k: "octopus", label: "八達通", fields: [["id", "八達通 ID／商戶號碼"]], qr: true },
    { k: "wechat", label: "WeChat Pay HK", fields: [["id", "WeChat ID（選填）"]], qr: true },
  ];

  // ---------- state ----------
  let S = null;
  function defaults() {
    return { shop: { name: "機舖", nameEn: "PhoneShop", whatsapp: "", notice: "", noticeEn: "", currency: "HK$", delivery: [{ id: "pickup", zh: "門市自取／面交", en: "Pickup / meet-up", fee: 0 }], payments: {} },
      products: [], costs: {}, markup: { mode: "percent", value: 8, round: 10, tail: 0 }, minPrice: 500, github: { owner: "opensquilw", repo: "phone-shop", branch: "main", path: "data/catalog.json", token: "" }, pool: [], review: [], dirty: false, liveUpdated: "" };
  }
  function save(markDirty = true) {
    if (markDirty) S.dirty = true;
    S.products.forEach((p) => { if (p.cost != null) S.costs[p.id] = p.cost; });
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("⚠️ 儲存失敗：資料太大（相片太多）。請減少相片。"); } updateStat();
  }
  async function fetchLive(name) { return (await fetch(`data/${name}?t=` + Date.now(), { cache: "no-store" })).json(); }
  async function init() {
    const raw = localStorage.getItem(KEY);
    S = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    // Always look at the live catalog: the phone→GitHub sync may have changed it since last time
    try {
      const live = await fetchLive("catalog.json");
      if (!S.dirty) { importCatalog(live); S.liveUpdated = live.updated || ""; }
      else if ((live.updated || "") > (S.liveUpdated || "")) showLiveBanner(live);
      try { const rv = await fetchLive("review.json"); S.review = rv.items || []; } catch {}
      try { const ru = await fetchLive("rules.json"); if (!S.dirty && ru.markup) { S.markup = ru.markup; S.minPrice = ru.minPrice || 500; } } catch {}
    } catch {}
    save(false);
    bindTabs(); bindPaste(); renderProducts(); renderPool(); renderSettings(); bindPublish(); updateStat(); updateExample(); renderReview();
  }
  function importCatalog(c) {
    S.shop = Object.assign(S.shop, c.shop || {});
    S.products = (c.products || []).map((p) => ({ ...p, cost: S.costs[p.id] ?? null, priceLocked: !!(p.locked ?? p.priceLocked) }));
    S.liveUpdated = c.updated || "";
  }
  function showLiveBanner(live) {
    const b = document.createElement("div"); b.className = "notice"; b.style.margin = "0 0 12px";
    b.innerHTML = `📲 網上 catalog 已經由自動同步更新（${esc(live.updated)}），而你本機有未發佈嘅修改。 <button class="btn sm primary" id="bannerLoad">載入最新（放棄本機修改）</button> <button class="btn sm" id="bannerKeep">保留本機，稍後發佈會覆蓋</button>`;
    $("main").prepend(b);
    $("#bannerLoad").onclick = () => { importCatalog(live); S.dirty = false; save(false); b.remove(); renderProducts(); renderSettings(); toast("已載入最新"); };
    $("#bannerKeep").onclick = () => b.remove();
  }
  function updateStat() { const n = S.products.filter((p) => !p.hidden).length; $("#statCount").textContent = `${n} 件上架 / ${S.products.length} 總數`; }

  // ---------- theme ----------
  const THEMES = ["light", "dark", "macaron"];
  const applyTheme = (th) => { document.documentElement.setAttribute("data-theme", th); localStorage.setItem("ps_theme", th); $("#btnTheme").textContent = { light: "☀️", dark: "🌙", macaron: "🍬" }[th]; };
  applyTheme(localStorage.getItem("ps_theme") || "light");
  $("#btnTheme").onclick = () => applyTheme(THEMES[(THEMES.indexOf(document.documentElement.getAttribute("data-theme")) + 1) % 3]);

  // ---------- tabs ----------
  function bindTabs() {
    $$(".tabs button").forEach((b) => (b.onclick = () => {
      $$(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
      $$("main > section").forEach((s) => (s.hidden = s.id !== "tab-" + b.dataset.tab));
      if (b.dataset.tab === "publish") updateSize();
    }));
  }

  // ---------- markup ----------
  function sellPrice(cost) {
    if (cost == null || isNaN(cost)) return null;
    const m = S.markup; let v = m.mode === "percent" ? cost * (1 + m.value / 100) : cost + Number(m.value);
    const r = Number(m.round) || 1; v = Math.ceil(v / r) * r;
    if (Number(m.tail)) { v = Math.floor(v / 10) * 10 + Number(m.tail); if (v < cost) v += 10; }
    return Math.round(v);
  }
  function readMarkup() { S.markup = { mode: $("#mkMode").value, value: +$("#mkValue").value || 0, round: +$("#mkRound").value, tail: +$("#mkTail").value }; S.minPrice = +$("#minPrice").value || 500; save(); updateExample(); }
  function updateExample() {
    $("#minPrice").value = S.minPrice || 500;
    $("#mkMode").value = S.markup.mode; $("#mkValue").value = S.markup.value; $("#mkRound").value = S.markup.round; $("#mkTail").value = S.markup.tail || 0;
    $("#mkExample").textContent = "$" + (sellPrice(9200) || 0).toLocaleString();
  }
  ["mkMode", "mkValue", "mkRound", "mkTail", "minPrice"].forEach((id) => ($("#" + id).onchange = readMarkup));

  // ---------- paste / parse ----------
  let parsed = [];
  function bindPaste() {
    $("#btnClearPaste").onclick = () => { $("#pasteBox").value = ""; };
    $("#btnParse").onclick = () => {
      const r = P.parse($("#pasteBox").value, { minPrice: +$("#minPrice").value || 500 });
      parsed = r.rows.map((x) => ({ ...x, sel: true, price: sellPrice(x.cost) }));
      $("#parseInfo").textContent = `解析到 ${parsed.length} 件貨品，略過 ${r.skipped.length} 行。`;
      $("#skippedBox").textContent = r.skipped.join("\n") || "—";
      $("#parsedCard").hidden = parsed.length === 0;
      renderParsed();
    };
    $("#btnSelAll").onclick = () => { const all = parsed.every((x) => x.sel); parsed.forEach((x) => (x.sel = !all)); renderParsed(); };
    $("#btnMerge").onclick = mergeParsed;
  }
  function renderReview() {
    const el = $("#reviewList"); if (!el) return;
    el.hidden = !S.review.length;
    el.innerHTML = `<h3>⚠️ 待審核（自動同步認唔清嘅訊息）</h3>` + S.review.map((it, i) => `<div class="row" style="margin:6px 0"><code class="grow" style="white-space:pre-wrap">${esc(it.raw)}</code><button class="btn sm" data-rv="${i}">貼入解析箱</button><button class="btn sm danger" data-rvdel="${i}">✕</button></div>`).join("");
    $$("[data-rv]", el).forEach((b) => (b.onclick = () => { const it = S.review.splice(+b.dataset.rv, 1)[0]; $("#pasteBox").value = ($("#pasteBox").value + "\n" + it.raw).trim(); save(); renderReview(); }));
    $$("[data-rvdel]", el).forEach((b) => (b.onclick = () => { S.review.splice(+b.dataset.rvdel, 1); save(); renderReview(); }));
  }
  function existingMatch(row) {
    return S.products.find((p) => p.brand === row.brand && p.model.toLowerCase() === row.model.toLowerCase() && (p.storage || null) === (row.storage || null));
  }
  function renderParsed() {
    const tbl = $("#parsedTbl");
    tbl.innerHTML = `<tr><th></th><th>品牌</th><th>型號</th><th>容量</th><th>顏色</th><th>成本</th><th>售價</th><th>存貨</th><th>狀態</th></tr>` +
      parsed.map((r, i) => {
        const ex = existingMatch(r);
        return `<tr class="${r.ambiguous ? "ambig" : ""}" title="${esc(r.raw)}">
          <td><input type="checkbox" data-i="${i}" data-f="sel" ${r.sel ? "checked" : ""} style="width:auto"></td>
          <td>${brandSelect(r.brand, i)}</td>
          <td><input data-i="${i}" data-f="model" value="${esc(r.model)}" style="min-width:150px"></td>
          <td><input class="short" data-i="${i}" data-f="storage" value="${esc(P.storageLabel(r.storage))}" placeholder="256GB"></td>
          <td><input data-i="${i}" data-f="colours" value="${esc(r.colours.join(", "))}" style="min-width:120px"></td>
          <td><input class="num" type="number" data-i="${i}" data-f="cost" value="${r.cost}"></td>
          <td><input class="num" type="number" data-i="${i}" data-f="price" value="${r.price}"></td>
          <td>${stockSelect(r.stock, i)}</td>
          <td class="small">${r.ambiguous ? "⚠️ 多個價錢，請核對" : ex ? `🔁 更新現有（$${ex.cost ?? "?"}→$${r.cost}）` : "🆕 新增"}</td></tr>`;
      }).join("");
    $$("input,select", tbl).forEach((el) => (el.onchange = () => {
      const r = parsed[+el.dataset.i], f = el.dataset.f;
      if (f === "sel") r.sel = el.checked;
      else if (f === "storage") r.storage = parseStorage(el.value);
      else if (f === "colours") r.colours = el.value.split(/[,，/、]/).map((s) => s.trim()).filter(Boolean);
      else if (f === "cost") { r.cost = +el.value; r.price = sellPrice(r.cost); renderParsed(); }
      else if (f === "price") r.price = +el.value;
      else r[f] = el.value;
    }));
  }
  function parseStorage(v) { const m = String(v).match(/(\d+(?:\.\d+)?)\s*(T|G)?/i); if (!m) return null; let n = parseFloat(m[1]); if (/t/i.test(m[2] || "") || n <= 4) n *= 1024; return n; }
  function brandSelect(v, i, f = "brand") { return `<select data-i="${i}" data-f="${f}">${BRANDS.map((b) => `<option ${b === v ? "selected" : ""}>${b}</option>`).join("")}</select>`; }
  function stockSelect(v, i, f = "stock") { return `<select data-i="${i}" data-f="${f}"><option value="in" ${v === "in" ? "selected" : ""}>現貨</option><option value="order" ${v === "order" ? "selected" : ""}>預訂</option><option value="out" ${v === "out" ? "selected" : ""}>缺貨</option></select>`; }
  function mergeParsed() {
    let added = 0, updated = 0;
    parsed.filter((r) => r.sel).forEach((r) => {
      const ex = existingMatch(r);
      if (ex) { ex.cost = r.cost; if (!ex.priceLocked) ex.price = r.price; ex.colours = Array.from(new Set([...(ex.colours || []), ...r.colours])); ex.stock = r.stock; ex.updated = today(); ex.hidden = false; updated++; }
      else { S.products.push({ id: uid(), brand: r.brand, model: r.model, storage: r.storage, colours: r.colours, cost: r.cost, price: r.price, priceLocked: false, stock: r.stock, photo: "", note: "", hidden: false, updated: today() }); added++; }
    });
    save(); renderProducts(); toast(`已加入 ${added} 件新貨，更新 ${updated} 件`);
    $("#parsedCard").hidden = true; parsed = []; $("#parseInfo").textContent = "已加入貨品清單。";
    $$(".tabs button")[1].click();
  }

  // ---------- products table ----------
  function renderProducts() {
    const q = ($("#pq").value || "").toLowerCase(); const bf = $("#pBrand").value;
    const brands = Array.from(new Set(S.products.map((p) => p.brand)));
    $("#pBrand").innerHTML = `<option value="">全部品牌</option>` + brands.map((b) => `<option ${b === bf ? "selected" : ""}>${esc(b)}</option>`).join("");
    const tbl = $("#prodTbl");
    tbl.innerHTML = `<tr><th>相</th><th>品牌</th><th>型號</th><th>容量</th><th>顏色（逗號分隔）</th><th>成本</th><th>售價</th><th>利潤</th><th>存貨</th><th>備註</th><th>隱藏</th><th></th></tr>` +
      S.products.map((p, i) => {
        if (bf && p.brand !== bf) return "";
        if (q && !`${p.brand} ${p.model} ${p.colours.join(" ")}`.toLowerCase().includes(q)) return "";
        const margin = p.cost != null ? p.price - p.cost : null;
        return `<tr class="${p.hidden ? "hiddenrow" : ""}" data-row="${i}">
          <td><div class="thumb" data-thumb="${i}" title="撳一下上載相片，或拖相片入嚟">${p.photo ? `<img src="${p.photo}" alt="">` : "📷"}</div></td>
          <td>${brandSelect(p.brand, i)}</td>
          <td><input data-i="${i}" data-f="model" value="${esc(p.model)}" style="min-width:150px"></td>
          <td><input class="short" data-i="${i}" data-f="storage" value="${esc(P.storageLabel(p.storage))}"></td>
          <td><input data-i="${i}" data-f="colours" value="${esc((p.colours || []).join(", "))}" style="min-width:130px"></td>
          <td><input class="num" type="number" data-i="${i}" data-f="cost" value="${p.cost ?? ""}"></td>
          <td class="row" style="gap:2px"><input class="num" type="number" data-i="${i}" data-f="price" value="${p.price}"><button class="btn sm" data-lock="${i}" title="${p.priceLocked ? "已鎖定，撳解鎖" : "跟加價規則"}">${p.priceLocked ? "🔒" : "🔓"}</button></td>
          <td class="small ${margin != null && margin < 0 ? "" : ""}" style="color:${margin != null && margin < 0 ? "var(--danger)" : "var(--ok)"}">${margin != null ? "$" + margin : "—"}</td>
          <td>${stockSelect(p.stock, i)}</td>
          <td><input data-i="${i}" data-f="note" value="${esc(p.note || "")}" style="min-width:110px"></td>
          <td><input type="checkbox" data-i="${i}" data-f="hidden" ${p.hidden ? "checked" : ""} style="width:auto"></td>
          <td><button class="btn sm danger" data-del="${i}">🗑</button></td></tr>`;
      }).join("");
    $$("input,select", tbl).forEach((el) => (el.onchange = () => {
      const p = S.products[+el.dataset.i], f = el.dataset.f; if (!p) return;
      if (f === "storage") p.storage = parseStorage(el.value);
      else if (f === "colours") p.colours = el.value.split(/[,，/、]/).map((s) => s.trim()).filter(Boolean);
      else if (f === "cost") { p.cost = el.value === "" ? null : +el.value; if (!p.priceLocked && p.cost != null) p.price = sellPrice(p.cost); }
      else if (f === "price") { p.price = +el.value; p.priceLocked = true; }
      else if (f === "hidden") p.hidden = el.checked;
      else p[f] = el.value;
      p.updated = today(); save(); renderProducts();
    }));
    $$("[data-lock]", tbl).forEach((b) => (b.onclick = () => { const p = S.products[+b.dataset.lock]; p.priceLocked = !p.priceLocked; if (!p.priceLocked && p.cost != null) p.price = sellPrice(p.cost); save(); renderProducts(); }));
    $$("[data-del]", tbl).forEach((b) => (b.onclick = () => { if (confirm("刪除呢件貨品？")) { S.products.splice(+b.dataset.del, 1); save(); renderProducts(); } }));
    $$("[data-thumb]", tbl).forEach((d) => {
      d.onclick = () => pickFiles(false, async (files) => { S.products[+d.dataset.thumb].photo = await compress(files[0], 640, 0.78); save(); renderProducts(); });
      d.ondragover = (e) => { e.preventDefault(); d.style.outline = "2px solid var(--accent)"; };
      d.ondragleave = () => (d.style.outline = "");
      d.ondrop = async (e) => { e.preventDefault(); d.style.outline = ""; const f = e.dataTransfer.files[0]; if (f) { S.products[+d.dataset.thumb].photo = await compress(f, 640, 0.78); save(); renderProducts(); } };
    });
    updateStat();
  }
  $("#pq").oninput = renderProducts; $("#pBrand").onchange = renderProducts;
  $("#btnAddRow").onclick = () => { S.products.unshift({ id: uid(), brand: "Apple", model: "", storage: null, colours: [], cost: null, price: 0, priceLocked: false, stock: "in", photo: "", note: "", hidden: false, updated: today() }); save(); renderProducts(); };
  $("#btnRecalc").onclick = () => { S.products.forEach((p) => { if (!p.priceLocked && p.cost != null) p.price = sellPrice(p.cost); }); save(); renderProducts(); toast("已重算售價"); };
  $("#btnDelDemo").onclick = () => { S.products = S.products.filter((p) => !/^d\d$/.test(p.id)); save(); renderProducts(); toast("已刪除示範貨品"); };
  $("#btnDelAll").onclick = () => { if (confirm("清空全部貨品？（建議先備份）")) { S.products = []; save(); renderProducts(); } };

  // ---------- photos pool ----------
  function pickFiles(multiple, cb) { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = multiple; inp.onchange = () => cb(Array.from(inp.files)); inp.click(); }
  function compress(file, max, q) {
    return new Promise((res) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", q));
      };
      img.src = url;
    });
  }
  async function addToPool(files) {
    for (const f of files) if (f.type.startsWith("image/")) S.pool.push({ id: uid(), data: await compress(f, 640, 0.78), name: f.name });
    save(); renderPool();
  }
  $("#photoInput").onchange = (e) => addToPool(Array.from(e.target.files));
  const dz = $("#photoDrop");
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("over"); }; dz.ondragleave = () => dz.classList.remove("over");
  dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("over"); addToPool(Array.from(e.dataTransfer.files)); };
  document.addEventListener("paste", (e) => { const fs = Array.from(e.clipboardData?.files || []); if (fs.length && !$("#tab-photos").hidden) addToPool(fs); });
  function renderPool() {
    const el = $("#photoPool");
    el.innerHTML = S.pool.length ? S.pool.map((ph, i) => `<div class="card" style="padding:8px">
      <img src="${ph.data}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px" alt="">
      <select data-assign="${i}" style="margin-top:6px;font-size:12.5px"><option value="">— 指定貨品 —</option>${S.products.map((p) => `<option value="${p.id}">${esc(p.brand)} ${esc(p.model)} ${P.storageLabel(p.storage)}</option>`).join("")}</select>
      <button class="btn sm danger block" data-pdel="${i}" style="margin-top:6px">移除</button></div>`).join("") : `<p class="help">未有相片。</p>`;
    $$("[data-assign]", el).forEach((s) => (s.onchange = () => {
      const p = S.products.find((x) => x.id === s.value); if (!p) return;
      p.photo = S.pool[+s.dataset.assign].data; S.pool.splice(+s.dataset.assign, 1); save(); renderPool(); renderProducts(); toast(`已加到 ${p.model}`);
    }));
    $$("[data-pdel]", el).forEach((b) => (b.onclick = () => { S.pool.splice(+b.dataset.pdel, 1); save(); renderPool(); }));
  }

  // ---------- settings ----------
  function renderSettings() {
    const s = S.shop;
    $("#sName").value = s.name || ""; $("#sNameEn").value = s.nameEn || ""; $("#sWa").value = s.whatsapp || ""; $("#sCur").value = s.currency || "HK$";
    $("#sNotice").value = s.notice || ""; $("#sNoticeEn").value = s.noticeEn || "";
    $("#dlvList").innerHTML = (s.delivery || []).map((d, i) => `<div class="row" style="margin:6px 0"><input data-d="${i}" data-f="zh" value="${esc(d.zh)}" placeholder="中文"><input data-d="${i}" data-f="en" value="${esc(d.en || "")}" placeholder="English"><input data-d="${i}" data-f="fee" type="number" value="${d.fee || 0}" style="width:80px" placeholder="運費"><button class="btn sm danger" data-ddel="${i}">🗑</button></div>`).join("");
    $$("[data-ddel]").forEach((b) => (b.onclick = () => { s.delivery.splice(+b.dataset.ddel, 1); renderSettings(); }));
    s.payments = s.payments || {};
    $("#payList").innerHTML = PAY_DEFS.map((d) => {
      const m = s.payments[d.k] || {};
      return `<div class="card" style="margin:8px 0;padding:10px 12px;box-shadow:none;border:1px solid var(--line)">
        <label class="row" style="margin:0;font-size:15px;color:var(--ink)"><input type="checkbox" data-pay="${d.k}" data-f="enabled" ${m.enabled ? "checked" : ""} style="width:auto"> ${d.label}</label>
        <div class="${m.enabled ? "" : "hidden"}" data-paybody="${d.k}">
          ${d.fields.map(([f, lab]) => `<label>${lab}</label><input data-pay="${d.k}" data-f="${f}" value="${esc(m[f] || "")}">`).join("")}
          ${d.qr ? `<label>收款 QR Code 圖片</label><div class="row"><img class="qrprev" src="${m.qr || ""}" alt="" ${m.qr ? "" : "hidden"} data-qrprev="${d.k}"><button class="btn sm" data-qr="${d.k}">上載 QR</button>${m.qr ? `<button class="btn sm danger" data-qrdel="${d.k}">移除</button>` : ""}</div>` : ""}
        </div></div>`;
    }).join("");
    $$("[data-pay][data-f=enabled]").forEach((c) => (c.onchange = () => { (s.payments[c.dataset.pay] = s.payments[c.dataset.pay] || {}).enabled = c.checked; $(`[data-paybody="${c.dataset.pay}"]`).classList.toggle("hidden", !c.checked); }));
    $$("[data-qr]").forEach((b) => (b.onclick = () => pickFiles(false, async (fs) => { (s.payments[b.dataset.qr] = s.payments[b.dataset.qr] || {}).qr = await compress(fs[0], 600, 0.9); renderSettings(); })));
    $$("[data-qrdel]").forEach((b) => (b.onclick = () => { s.payments[b.dataset.qrdel].qr = ""; renderSettings(); }));
  }
  $("#btnAddDlv").onclick = () => { readSettings(); S.shop.delivery.push({ id: uid(), zh: "", en: "", fee: 0 }); renderSettings(); };
  function readSettings() {
    const s = S.shop;
    s.name = $("#sName").value.trim(); s.nameEn = $("#sNameEn").value.trim(); s.whatsapp = $("#sWa").value.replace(/\D/g, ""); s.currency = $("#sCur").value || "HK$";
    s.notice = $("#sNotice").value.trim(); s.noticeEn = $("#sNoticeEn").value.trim();
    $$("[data-d]").forEach((el) => { const d = s.delivery[+el.dataset.d]; if (!d) return; d[el.dataset.f] = el.dataset.f === "fee" ? +el.value || 0 : el.value.trim(); });
    $$("[data-pay]").forEach((el) => { if (el.dataset.f === "enabled") return; (s.payments[el.dataset.pay] = s.payments[el.dataset.pay] || {})[el.dataset.f] = el.value.trim(); });
  }
  $("#btnSaveSettings").onclick = () => { readSettings(); save(); toast("已儲存設定"); };

  // ---------- publish ----------
  function publicCatalog() {
    readSettings();
    return {
      version: 1, updated: today(), shop: S.shop,
      products: S.products.filter((p) => p.model).map(({ cost, priceLocked, raw, sender, ambiguous, ...p }) => ({ ...p, locked: !!priceLocked })),
    };
  }
  const publicRules = () => ({ markup: S.markup, minPrice: S.minPrice || 500, autoPublish: true });
  const download = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); };
  function bindPublish() {
    const g = S.github;
    $("#ghOwner").value = g.owner; $("#ghRepo").value = g.repo; $("#ghBranch").value = g.branch || "main"; $("#ghPath").value = g.path || "data/catalog.json"; $("#ghToken").value = g.token || "";
    ["ghOwner", "ghRepo", "ghBranch", "ghPath", "ghToken"].forEach((id) => ($("#" + id).onchange = () => { S.github = { owner: $("#ghOwner").value.trim(), repo: $("#ghRepo").value.trim(), branch: $("#ghBranch").value.trim() || "main", path: $("#ghPath").value.trim() || "data/catalog.json", token: $("#ghToken").value.trim() }; save(false); }));
    $("#btnDownload").onclick = () => download("catalog.json", JSON.stringify(publicCatalog(), null, 2));
    $("#btnBackup").onclick = () => download(`phoneshop-backup-${today()}.json`, JSON.stringify(S));
    $("#restoreInput").onchange = async (e) => { try { S = Object.assign(defaults(), JSON.parse(await e.target.files[0].text())); save(); renderProducts(); renderPool(); renderSettings(); bindPublish(); updateExample(); toast("已還原"); } catch { toast("檔案無效"); } };
    $("#btnPullLive").onclick = async () => { try { importCatalog(await fetchLive("catalog.json")); S.dirty = false; save(false); renderProducts(); renderSettings(); toast("已載入"); } catch { toast("載入失敗"); } };
    $("#btnPublish").onclick = publishGitHub;
  }
  async function publishGitHub() {
    const g = S.github; const st = $("#pubStatus");
    if (!g.owner || !g.repo || !g.token) { toast("請填妥 GitHub 資料同 token"); return; }
    const headers = { Authorization: `Bearer ${g.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
    const put = async (path, obj, msg) => {
      const url = `https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path}`;
      let sha; const r0 = await fetch(`${url}?ref=${g.branch}`, { headers }); if (r0.ok) sha = (await r0.json()).sha;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2) + "\n")));
      const r = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ message: msg, content, branch: g.branch, sha }) });
      if (!r.ok) throw new Error((await r.json()).message || r.status);
    };
    st.textContent = "發佈中…";
    try {
      const dir = g.path.replace(/[^/]*$/, "");
      await put(g.path, publicCatalog(), `Update catalog ${today()} [skip ci]`);
      await put(dir + "rules.json", publicRules(), `Update rules ${today()} [skip ci]`);
      await put(dir + "review.json", { items: S.review }, `Update review ${today()} [skip ci]`);
      S.dirty = false; S.liveUpdated = today(); save(false);
      st.textContent = "✅ 已發佈 " + new Date().toLocaleTimeString(); toast("已發佈到 GitHub");
    } catch (e) { st.textContent = "❌ " + e.message; }
  }
  function updateSize() {
    const c = JSON.stringify(publicCatalog()).length; const a = (localStorage.getItem(KEY) || "").length;
    $("#sizeInfo").textContent = `catalog.json 約 ${(c / 1024).toFixed(0)} KB · 後台資料約 ${(a / 1024).toFixed(0)} KB（瀏覽器上限約 5,000 KB）`;
  }

  init();
})();
