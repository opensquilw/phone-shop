/* 機舖 PhoneShop — customer storefront */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LS = { theme: "ps_theme", lang: "ps_lang", cart: "ps_cart", orders: "ps_orders", customer: "ps_customer" };

  const I18N = {
    zh: {
      search: "搜尋型號…", sortDefault: "預設排序", sortAsc: "價錢：低至高", sortDesc: "價錢：高至低", empty: "暫時未有貨品",
      askWa: "WhatsApp 查詢", viewCart: "查看購物車", cart: "購物車", myOrders: "我的訂單", all: "全部", items: "件貨品",
      inStock: "現貨", preorder: "預訂", soldOut: "缺貨", colour: "顏色", qty: "數量", addToCart: "加入購物車", added: "已加入購物車",
      cartEmpty: "購物車係空嘅", subtotal: "小計", deliveryFee: "運費", total: "合計", delivery: "收貨方式", name: "姓名", phone: "電話",
      address: "送貨地址", note: "備註（選填）", placeOrder: "確認落單", continueShopping: "繼續購物", required: "請填妥姓名同電話",
      orderCreated: "訂單已建立", orderNo: "訂單編號", payNow: "請選擇付款方式", payInstr: "付款後請 WhatsApp 傳送付款截圖，我哋會盡快確認。",
      openPayme: "開啟 PayMe 付款", scanQr: "用 App 掃描 QR Code 付款", fpsId: "FPS 轉數快 ID", payee: "收款人", bank: "銀行", account: "戶口號碼",
      copy: "複製", copied: "已複製", sendWa: "WhatsApp 傳送訂單", copyOrder: "複製訂單內容", step1: "選擇付款方式並完成付款",
      step2: "按下面掣，WhatsApp 傳送訂單俾我哋", step3: "回覆付款截圖，等我哋確認出貨", noOrders: "未有訂單", pending: "待付款",
      status: "狀態", viewPay: "查看付款資料", remove: "移除", updated: "價格更新", clear: "清空", octopus: "八達通",
      wechat: "WeChat Pay", alipay: "AlipayHK", payme: "PayMe", fps: "轉數快 FPS", bankT: "銀行轉帳", deleteOrder: "刪除",
      unit: "件", note2: "備註",
    },
    en: {
      search: "Search model…", sortDefault: "Default", sortAsc: "Price: low → high", sortDesc: "Price: high → low", empty: "No products yet",
      askWa: "Ask on WhatsApp", viewCart: "View cart", cart: "Cart", myOrders: "My orders", all: "All", items: "items",
      inStock: "In stock", preorder: "Pre-order", soldOut: "Sold out", colour: "Colour", qty: "Qty", addToCart: "Add to cart", added: "Added to cart",
      cartEmpty: "Your cart is empty", subtotal: "Subtotal", deliveryFee: "Delivery", total: "Total", delivery: "Delivery method", name: "Name", phone: "Phone",
      address: "Delivery address", note: "Note (optional)", placeOrder: "Place order", continueShopping: "Continue shopping", required: "Please fill in name and phone",
      orderCreated: "Order created", orderNo: "Order no.", payNow: "Choose a payment method", payInstr: "After paying, send the payment screenshot on WhatsApp and we'll confirm ASAP.",
      openPayme: "Open PayMe", scanQr: "Scan the QR code with the app to pay", fpsId: "FPS ID", payee: "Payee", bank: "Bank", account: "Account no.",
      copy: "Copy", copied: "Copied", sendWa: "Send order via WhatsApp", copyOrder: "Copy order text", step1: "Pick a payment method and pay",
      step2: "Tap below to send us the order on WhatsApp", step3: "Reply with the payment screenshot; we'll confirm and ship", noOrders: "No orders yet", pending: "Awaiting payment",
      status: "Status", viewPay: "View payment info", remove: "Remove", updated: "Prices updated", clear: "Clear", octopus: "Octopus",
      wechat: "WeChat Pay", alipay: "AlipayHK", payme: "PayMe", fps: "FPS", bankT: "Bank transfer", deleteOrder: "Delete",
      unit: "pcs", note2: "Note",
    },
  };
  const COLOUR_ZH = {
    "Natural Titanium": "原色鈦", "Desert Titanium": "沙漠鈦", "Black Titanium": "黑鈦", "White Titanium": "白鈦", "Titanium": "鈦色",
    "Space Black": "深空黑", "Space Gray": "太空灰", "Deep Blue": "深藍", "Cosmic Orange": "宇宙橙", "Starlight": "星光", "Midnight": "午夜",
    "Ultramarine": "群青", "Teal": "藍綠", "Desert": "沙漠色", "Phantom Black": "幻夜黑", "Obsidian": "曜石黑", "Glacier Blue": "冰川藍",
    "Mint": "薄荷綠", "Lavender": "薰衣草", "Light Green": "淺綠", "Light Blue": "淺藍", "Sky Blue": "天藍", "Mist Blue": "霧藍",
    "Cloud White": "雲白", "Pearl White": "珍珠白", "Rose Gold": "玫瑰金", "Champagne": "香檳金", "Graphite": "石墨", "Silver": "銀",
    "Gold": "金", "Black": "黑", "White": "白", "Blue": "藍", "Green": "綠", "Red": "紅", "Purple": "紫", "Pink": "粉紅", "Gray": "灰",
    "Orange": "橙", "Yellow": "黃", "Brown": "啡", "Beige": "米", "Cyan": "青",
  };
  const COLOUR_CSS = {
    "Natural Titanium": "#bdb5a8", "Desert Titanium": "#c4a887", "Black Titanium": "#3a3a3c", "White Titanium": "#e9e8e4", "Titanium": "#a8a7a3",
    "Space Black": "#1d1d1f", "Space Gray": "#5b5b5f", "Deep Blue": "#243a5e", "Cosmic Orange": "#f0682b", "Starlight": "#f1ede4", "Midnight": "#1f2634",
    "Ultramarine": "#5b6fd6", "Teal": "#4fa6a0", "Desert": "#c4a887", "Phantom Black": "#111", "Obsidian": "#2b2b2b", "Glacier Blue": "#a9d3e6",
    "Mint": "#b8e3c8", "Lavender": "#c9b7e3", "Light Green": "#c5e2b3", "Light Blue": "#b7d4ee", "Sky Blue": "#87c4f2", "Mist Blue": "#9fb3c8",
    "Cloud White": "#f4f4f4", "Pearl White": "#f2efe8", "Rose Gold": "#e6b8a8", "Champagne": "#e2d0a6", "Graphite": "#4a4a4d", "Silver": "#d6d6d8",
    "Gold": "#e3c68a", "Black": "#111", "White": "#f5f5f5", "Blue": "#3b6fd1", "Green": "#3f9a5e", "Red": "#d13b3b", "Purple": "#8b5cf6", "Pink": "#f0a6c0", "Gray": "#8e8e93",
    "Orange": "#f0882b", "Yellow": "#f2d24a", "Brown": "#8a5a3c", "Beige": "#e8dcc4", "Cyan": "#4fd0d8",
  };
  const BRAND_EMOJI = { Apple: "", Samsung: "", Xiaomi: "", Huawei: "", Google: "", Other: "" };

  let lang = localStorage.getItem(LS.lang) || "zh";
  let catalog = null;
  let cart = JSON.parse(localStorage.getItem(LS.cart) || "[]");
  let brandFilter = "all";
  let sortMode = "default";

  const t = (k) => (I18N[lang][k] ?? I18N.zh[k] ?? k);
  const money = (n) => (catalog?.shop.currency || "HK$") + Number(n).toLocaleString("en-HK");
  const colourName = (c) => (lang === "zh" ? COLOUR_ZH[c] || c : c);
  const stockLabel = (s) => ({ in: t("inStock"), order: t("preorder"), out: t("soldOut") }[s] || s);
  const stockClass = (s) => ({ in: "ok", order: "warn", out: "out" }[s] || "");
  const storageLabel = window.PhoneParser.storageLabel;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m) => { const el = $("#toast"); el.textContent = m; el.classList.add("show"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 1800); };

  // ---------- theme / lang ----------
  const THEMES = ["light", "dark", "macaron"];
  function applyTheme(th) { document.documentElement.setAttribute("data-theme", th); localStorage.setItem(LS.theme, th); $("#btnTheme").textContent = { light: "☀️", dark: "🌙", macaron: "🍬" }[th]; }
  applyTheme(localStorage.getItem(LS.theme) || "light");
  $("#btnTheme").onclick = () => applyTheme(THEMES[(THEMES.indexOf(document.documentElement.getAttribute("data-theme")) + 1) % 3]);
  function applyLang() {
    localStorage.setItem(LS.lang, lang);
    $("#btnLang").textContent = lang === "zh" ? "EN" : "中";
    document.documentElement.lang = lang === "zh" ? "zh-HK" : "en";
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    if (catalog) { renderShopMeta(); renderBrands(); renderGrid(); renderCartBar(); }
  }
  $("#btnLang").onclick = () => { lang = lang === "zh" ? "en" : "zh"; applyLang(); };

  // ---------- load ----------
  async function load() {
    try {
      const res = await fetch("data/catalog.json?t=" + Date.now(), { cache: "no-store" });
      catalog = await res.json();
    } catch (e) {
      const cached = localStorage.getItem("ps_catalog_cache");
      if (cached) catalog = JSON.parse(cached);
    }
    if (!catalog) { $("#empty").classList.remove("hidden"); return; }
    localStorage.setItem("ps_catalog_cache", JSON.stringify(catalog));
    catalog.products = (catalog.products || []).filter((p) => !p.hidden);
    renderShopMeta(); renderBrands(); renderGrid(); renderCartBar();
  }
  function renderShopMeta() {
    const s = catalog.shop;
    $("#shopName").textContent = lang === "zh" ? s.name : (s.nameEn || s.name);
    document.title = `${s.name} ${s.nameEn || ""}`.trim();
    const n = lang === "zh" ? s.notice : (s.noticeEn || s.notice);
    $("#notice").textContent = n || ""; $("#notice").classList.toggle("hidden", !n);
    $("#waFab").href = waLink(lang === "zh" ? `你好，我想查詢手機價錢。` : `Hi, I'd like to ask about phone prices.`);
    $("#updatedInfo").textContent = catalog.updated ? `${t("updated")}: ${catalog.updated}` : "";
  }
  function waLink(text) { return `https://wa.me/${(catalog.shop.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`; }

  // ---------- brands / grid ----------
  function renderBrands() {
    const brands = Array.from(new Set(catalog.products.map((p) => p.brand)));
    const el = $("#brands");
    el.innerHTML = [`<button class="chip ${brandFilter === "all" ? "on" : ""}" data-b="all">${t("all")}</button>`]
      .concat(brands.map((b) => `<button class="chip ${brandFilter === b ? "on" : ""}" data-b="${esc(b)}">${esc(b)}</button>`)).join("");
    $$(".chip", el).forEach((c) => (c.onclick = () => { brandFilter = c.dataset.b; renderBrands(); renderGrid(); }));
  }
  function visibleProducts() {
    const q = $("#q").value.trim().toLowerCase();
    let list = catalog.products.filter((p) => (brandFilter === "all" || p.brand === brandFilter) &&
      (!q || `${p.brand} ${p.model} ${storageLabel(p.storage)} ${p.colours.join(" ")} ${p.colours.map(colourName).join(" ")}`.toLowerCase().includes(q)));
    if (sortMode === "priceAsc") list = list.slice().sort((a, b) => a.price - b.price);
    if (sortMode === "priceDesc") list = list.slice().sort((a, b) => b.price - a.price);
    return list;
  }
  function photoHtml(p, cls = "") {
    return p.photo ? `<img class="${cls}" src="${esc(p.photo)}" alt="" loading="lazy">` : `<div class="ph ${cls}">📱</div>`;
  }
  function renderGrid() {
    const list = visibleProducts();
    $("#countInfo").textContent = `${list.length} ${t("items")}`;
    $("#empty").classList.toggle("hidden", list.length > 0);
    $("#grid").innerHTML = list.map((p) => `
      <div class="product ${p.stock === "out" ? "out" : ""}" data-id="${esc(p.id)}">
        <div class="photo">${photoHtml(p)}</div>
        <div class="body">
          <div class="row" style="justify-content:space-between"><span class="tag">${esc(p.brand)}</span><span class="tag ${stockClass(p.stock)}">${stockLabel(p.stock)}</span></div>
          <div class="name">${esc(p.model)}${p.storage ? " " + storageLabel(p.storage) : ""}</div>
          <div class="swatches">${p.colours.map((c) => `<span class="swatch" title="${esc(colourName(c))}" style="background:${COLOUR_CSS[c] || "#ccc"}"></span>`).join("")}</div>
          ${p.note ? `<div class="meta">${esc(p.note)}</div>` : ""}
          <div class="foot"><span class="price"><small>${esc(catalog.shop.currency)}</small>${Number(p.price).toLocaleString()}</span>
            <button class="add" data-add="${esc(p.id)}" ${p.stock === "out" ? "disabled" : ""}>+</button></div>
        </div>
      </div>`).join("");
    $$(".product").forEach((el) => (el.onclick = (e) => { if (e.target.closest("[data-add]")) return; openProduct(el.dataset.id); }));
    $$("[data-add]").forEach((b) => (b.onclick = () => openProduct(b.dataset.add)));
  }
  $("#q").oninput = renderGrid;
  $("#sort").onchange = (e) => { sortMode = e.target.value; renderGrid(); };

  // ---------- product sheet ----------
  function openSheet(id) { $(id).classList.add("open"); }
  function closeSheet(id) { $(id).classList.remove("open"); }
  $$(".sheet-bg").forEach((bg) => (bg.onclick = (e) => { if (e.target === bg) bg.classList.remove("open"); }));

  function openProduct(id) {
    const p = catalog.products.find((x) => x.id === id); if (!p) return;
    let colour = p.colours[0] || "", qty = 1;
    const body = $("#productBody");
    const draw = () => {
      body.innerHTML = `
        ${p.photo ? `<img class="hero" src="${esc(p.photo)}" alt="">` : ""}
        <div class="row" style="justify-content:space-between"><span class="tag">${esc(p.brand)}</span><span class="tag ${stockClass(p.stock)}">${stockLabel(p.stock)}</span></div>
        <h2 style="margin-top:8px">${esc(p.model)} ${p.storage ? storageLabel(p.storage) : ""}</h2>
        <div class="price" style="font-size:24px"><small>${esc(catalog.shop.currency)}</small>${Number(p.price).toLocaleString()}</div>
        ${p.note ? `<p class="muted small">${esc(p.note)}</p>` : ""}
        ${p.colours.length ? `<label>${t("colour")}</label><div class="opts">${p.colours.map((c) => `<button class="opt ${c === colour ? "on" : ""}" data-c="${esc(c)}"><span class="swatch" style="background:${COLOUR_CSS[c] || "#ccc"};display:inline-block;vertical-align:-2px;margin-right:6px"></span>${esc(colourName(c))}</button>`).join("")}</div>` : ""}
        <label>${t("qty")}</label>
        <div class="qty"><button id="qm">−</button><span id="qv">${qty}</span><button id="qp">+</button></div>
        <hr>
        <button class="btn primary block" id="addBtn" ${p.stock === "out" ? "disabled" : ""}>${p.stock === "out" ? t("soldOut") : t("addToCart") + " · " + money(p.price * qty)}</button>`;
      $$("[data-c]", body).forEach((b) => (b.onclick = () => { colour = b.dataset.c; draw(); }));
      $("#qm").onclick = () => { qty = Math.max(1, qty - 1); draw(); };
      $("#qp").onclick = () => { qty = Math.min(20, qty + 1); draw(); };
      $("#addBtn").onclick = () => { addToCart(p, colour, qty); closeSheet("#productSheet"); toast(t("added")); };
    };
    draw(); openSheet("#productSheet");
  }

  // ---------- cart ----------
  function saveCart() { localStorage.setItem(LS.cart, JSON.stringify(cart)); renderCartBar(); }
  function addToCart(p, colour, qty) {
    const line = cart.find((l) => l.id === p.id && l.colour === colour);
    if (line) line.qty += qty; else cart.push({ id: p.id, colour, qty });
    saveCart();
  }
  function cartLines() {
    return cart.map((l) => ({ ...l, p: catalog.products.find((x) => x.id === l.id) })).filter((l) => l.p);
  }
  function cartSubtotal() { return cartLines().reduce((s, l) => s + l.p.price * l.qty, 0); }
  function renderCartBar() {
    const lines = cartLines(); const n = lines.reduce((s, l) => s + l.qty, 0);
    $("#cartCount").textContent = n; $("#cartCount").classList.toggle("hidden", n === 0);
    $("#cartbar").classList.toggle("show", n > 0);
    $("#cartbarCount").textContent = `${n} ${t("items")}`;
    $("#cartbarTotal").textContent = money(cartSubtotal());
  }
  $("#btnCart").onclick = $("#cartbarBtn").onclick = () => { renderCart(); openSheet("#cartSheet"); };

  function renderCart() {
    const body = $("#cartBody"); const lines = cartLines();
    if (!lines.length) { body.innerHTML = `<div class="empty"><div class="big">🛒</div>${t("cartEmpty")}</div>`; return; }
    const cust = JSON.parse(localStorage.getItem(LS.customer) || "{}");
    const dlv = catalog.shop.delivery || [];
    body.innerHTML = `
      ${lines.map((l, i) => `<div class="cart-line">
        ${l.p.photo ? `<img src="${esc(l.p.photo)}" alt="">` : `<div class="ph">📱</div>`}
        <div class="info"><div class="n">${esc(l.p.model)} ${l.p.storage ? storageLabel(l.p.storage) : ""}</div>
          <div class="m">${l.colour ? colourName(l.colour) + " · " : ""}${money(l.p.price)}</div></div>
        <div class="qty"><button data-dec="${i}">−</button><span>${l.qty}</span><button data-inc="${i}">+</button></div>
      </div>`).join("")}
      <div class="totals"><span>${t("subtotal")}</span><span>${money(cartSubtotal())}</span></div>
      <label>${t("delivery")}</label>
      <select id="dlv">${dlv.map((d) => `<option value="${esc(d.id)}" ${cust.delivery === d.id ? "selected" : ""}>${esc(lang === "zh" ? d.zh : d.en || d.zh)}${d.fee ? ` (+${money(d.fee)})` : ""}</option>`).join("")}</select>
      <div class="totals"><span>${t("deliveryFee")}</span><span id="feeV"></span></div>
      <div class="totals grand"><span>${t("total")}</span><span id="totalV"></span></div>
      <label>${t("name")} *</label><input id="cName" value="${esc(cust.name || "")}" autocomplete="name">
      <label>${t("phone")} *</label><input id="cPhone" value="${esc(cust.phone || "")}" inputmode="tel" autocomplete="tel">
      <div id="addrWrap"><label>${t("address")}</label><input id="cAddr" value="${esc(cust.address || "")}"></div>
      <label>${t("note")}</label><textarea id="cNote" style="min-height:60px"></textarea>
      <div class="row" style="margin-top:14px"><button class="btn ghost grow" id="contShop">${t("continueShopping")}</button><button class="btn primary grow" id="placeOrder">${t("placeOrder")}</button></div>`;
    const recompute = () => {
      const d = dlv.find((x) => x.id === $("#dlv").value) || { fee: 0 };
      $("#feeV").textContent = money(d.fee || 0);
      $("#totalV").textContent = money(cartSubtotal() + (d.fee || 0));
      $("#addrWrap").classList.toggle("hidden", d.id === "pickup");
    };
    $("#dlv").onchange = recompute; recompute();
    $$("[data-dec]", body).forEach((b) => (b.onclick = () => { const l = cart[+b.dataset.dec]; l.qty--; if (l.qty <= 0) cart.splice(+b.dataset.dec, 1); saveCart(); renderCart(); }));
    $$("[data-inc]", body).forEach((b) => (b.onclick = () => { cart[+b.dataset.inc].qty++; saveCart(); renderCart(); }));
    $("#contShop").onclick = () => closeSheet("#cartSheet");
    $("#placeOrder").onclick = () => {
      const name = $("#cName").value.trim(), phone = $("#cPhone").value.trim();
      if (!name || !phone) { toast(t("required")); return; }
      const d = dlv.find((x) => x.id === $("#dlv").value) || { id: "", zh: "", en: "", fee: 0 };
      const cust2 = { name, phone, address: $("#cAddr").value.trim(), delivery: d.id };
      localStorage.setItem(LS.customer, JSON.stringify(cust2));
      const order = {
        no: makeOrderNo(), at: new Date().toISOString(), status: "pending",
        items: cartLines().map((l) => ({ brand: l.p.brand, model: l.p.model, storage: l.p.storage, colour: l.colour, qty: l.qty, price: l.p.price })),
        delivery: { id: d.id, zh: d.zh, en: d.en, fee: d.fee || 0 }, customer: cust2, note: $("#cNote").value.trim(),
        subtotal: cartSubtotal(), total: cartSubtotal() + (d.fee || 0), payment: "",
      };
      const orders = JSON.parse(localStorage.getItem(LS.orders) || "[]"); orders.unshift(order);
      localStorage.setItem(LS.orders, JSON.stringify(orders));
      cart = []; saveCart(); closeSheet("#cartSheet"); openOrder(order);
    };
  }
  function makeOrderNo() {
    const d = new Date(); const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PS-${ymd}-${rnd}`;
  }

  // ---------- order / payment ----------
  const PAY_ORDER = ["payme", "alipay", "fps", "bank", "octopus", "wechat"];
  const PAY_ICON = { payme: "💚", alipay: "💙", fps: "⚡", bank: "🏦", octopus: "🐙", wechat: "💬" };
  function payLabel(k) { return { payme: t("payme"), alipay: t("alipay"), fps: t("fps"), bank: t("bankT"), octopus: t("octopus"), wechat: t("wechat") }[k]; }

  function orderText(o) {
    const s = catalog.shop; const zh = lang === "zh";
    const lines = [];
    lines.push(`【${zh ? s.name : s.nameEn || s.name} ${zh ? "訂單" : "Order"} ${o.no}】`);
    o.items.forEach((it, i) => lines.push(`${i + 1}. ${it.model}${it.storage ? " " + storageLabel(it.storage) : ""}${it.colour ? " " + colourName(it.colour) : ""} x${it.qty} — ${money(it.price * it.qty)}`));
    lines.push(`${t("delivery")}: ${zh ? o.delivery.zh : o.delivery.en || o.delivery.zh}${o.delivery.fee ? ` (+${money(o.delivery.fee)})` : ""}`);
    lines.push(`${t("total")}: ${money(o.total)}`);
    lines.push(`${t("name")}: ${o.customer.name}`);
    lines.push(`${t("phone")}: ${o.customer.phone}`);
    if (o.customer.address && o.delivery.id !== "pickup") lines.push(`${t("address")}: ${o.customer.address}`);
    if (o.note) lines.push(`${t("note2")}: ${o.note}`);
    if (o.payment) lines.push(`${zh ? "付款方式" : "Payment"}: ${payLabel(o.payment)}`);
    lines.push(zh ? "（付款後會傳送截圖）" : "(Payment screenshot to follow)");
    return lines.join("\n");
  }
  function persistOrder(o) {
    const orders = JSON.parse(localStorage.getItem(LS.orders) || "[]");
    const i = orders.findIndex((x) => x.no === o.no); if (i >= 0) orders[i] = o; localStorage.setItem(LS.orders, JSON.stringify(orders));
  }

  function openOrder(o) {
    const pay = catalog.shop.payments || {};
    const methods = PAY_ORDER.filter((k) => pay[k] && pay[k].enabled);
    let cur = o.payment || methods[0] || "";
    const body = $("#orderBody");
    const draw = () => {
      const m = pay[cur] || {};
      let box = "";
      if (cur === "payme") box = `${m.qr ? `<img src="${esc(m.qr)}" alt="PayMe QR"><p class="small muted">${t("scanQr")}</p>` : ""}${m.link ? `<a class="btn primary block" href="${esc(m.link)}" target="_blank" rel="noopener">${t("openPayme")} · ${money(o.total)}</a>` : ""}`;
      else if (cur === "alipay" || cur === "wechat") box = `${m.qr ? `<img src="${esc(m.qr)}" alt="QR"><p class="small muted">${t("scanQr")}</p>` : ""}${m.id ? kv("ID", m.id) : ""}`;
      else if (cur === "fps") box = `${m.id ? kv(t("fpsId"), m.id) : ""}${m.name ? kv(t("payee"), m.name, false) : ""}${m.bank ? kv(t("bank"), m.bank, false) : ""}`;
      else if (cur === "bank") box = `${m.bank ? kv(t("bank"), m.bank, false) : ""}${m.account ? kv(t("account"), m.account) : ""}${m.holder ? kv(t("payee"), m.holder, false) : ""}`;
      else if (cur === "octopus") box = `${m.id ? kv("Octopus ID", m.id) : ""}${m.qr ? `<img src="${esc(m.qr)}" alt="QR">` : ""}`;
      body.innerHTML = `
        <div class="tag ok">${t("orderCreated")}</div>
        <div class="row" style="justify-content:space-between;margin:8px 0"><span class="muted">${t("orderNo")}</span><span class="orderno">${o.no}</span></div>
        ${o.items.map((it) => `<div class="order-item"><span>${esc(it.model)} ${it.storage ? storageLabel(it.storage) : ""} ${it.colour ? esc(colourName(it.colour)) : ""} ×${it.qty}</span><span>${money(it.price * it.qty)}</span></div>`).join("")}
        ${o.delivery.fee ? `<div class="order-item"><span>${t("deliveryFee")}</span><span>${money(o.delivery.fee)}</span></div>` : ""}
        <div class="totals grand"><span>${t("total")}</span><span>${money(o.total)}</span></div>
        <ol class="steps"><li>${t("step1")}</li><li>${t("step2")}</li><li>${t("step3")}</li></ol>
        <h3 style="font-size:15px;margin-top:6px">${t("payNow")}</h3>
        <div class="paytabs">${methods.map((k) => `<button class="paytab ${k === cur ? "on" : ""}" data-pay="${k}">${PAY_ICON[k]} ${payLabel(k)}</button>`).join("")}</div>
        ${cur ? `<div class="paybox"><div class="price" style="margin-bottom:8px">${money(o.total)}</div>${box}</div>` : ""}
        <p class="small muted">${t("payInstr")}</p>
        <a class="btn wa block" id="waSend" target="_blank" rel="noopener">💬 ${t("sendWa")}</a>
        <button class="btn ghost block" id="copyOrder" style="margin-top:8px">📋 ${t("copyOrder")}</button>`;
      $$("[data-pay]", body).forEach((b) => (b.onclick = () => { cur = b.dataset.pay; o.payment = cur; persistOrder(o); draw(); }));
      $$("[data-copy]", body).forEach((b) => (b.onclick = () => copyText(b.dataset.copy)));
      $("#waSend").href = waLink(orderText({ ...o, payment: cur }));
      $("#copyOrder").onclick = () => copyText(orderText({ ...o, payment: cur }));
    };
    draw(); openSheet("#orderSheet");
  }
  function kv(k, v, copyable = true) { return `<div class="kv"><span class="muted small">${esc(k)}</span><b>${esc(v)}</b>${copyable ? `<button class="copy" data-copy="${esc(v)}">${t("copy")}</button>` : ""}</div>`; }
  async function copyText(s) { try { await navigator.clipboard.writeText(s); toast(t("copied")); } catch { prompt("", s); } }

  // ---------- my orders ----------
  $("#btnOrders").onclick = () => {
    const orders = JSON.parse(localStorage.getItem(LS.orders) || "[]");
    const body = $("#ordersBody");
    body.innerHTML = orders.length ? orders.map((o, i) => `<div class="card" style="margin:10px 0;padding:12px">
      <div class="row" style="justify-content:space-between"><span class="orderno" style="font-size:15px">${o.no}</span><span class="tag warn">${t("pending")}</span></div>
      <div class="small muted">${new Date(o.at).toLocaleString()} · ${o.items.reduce((s, x) => s + x.qty, 0)} ${t("items")} · ${money(o.total)}</div>
      <div class="small">${o.items.map((it) => esc(it.model) + (it.storage ? " " + storageLabel(it.storage) : "")).join(", ")}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm primary" data-view="${i}">${t("viewPay")}</button><button class="btn sm danger" data-del="${i}">${t("deleteOrder")}</button></div>
    </div>`).join("") : `<div class="empty"><div class="big">🧾</div>${t("noOrders")}</div>`;
    $$("[data-view]", body).forEach((b) => (b.onclick = () => { closeSheet("#ordersSheet"); openOrder(orders[+b.dataset.view]); }));
    $$("[data-del]", body).forEach((b) => (b.onclick = () => { orders.splice(+b.dataset.del, 1); localStorage.setItem(LS.orders, JSON.stringify(orders)); $("#btnOrders").click(); }));
    openSheet("#ordersSheet");
  };

  // ---------- init ----------
  applyLang(); load();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
