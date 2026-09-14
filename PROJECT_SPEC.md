# 機舖 PhoneShop

Static PWA: turn WhatsApp wholesale phone price messages into a customer shop with ordering + HK payment links. No backend.

## Files
- `index.html` + `shop.js` — customer storefront (繁中/EN, 光/暗黑/馬卡龍 themes). Loads `data/catalog.json`.
- `admin.html` + `admin.js` — owner tool. State in `localStorage["ps_admin"]` (includes cost prices, GitHub token). Never linked from the shop.
- `parser.js` — WhatsApp text → product rows (brand/model/storage/colours/cost/stock). Shared by both pages; runs in Node for tests.
- `data/catalog.json` — the published catalog (shop settings + payment info + products). **Cost prices are stripped on publish.**
- `style.css`, `manifest.json`, `sw.js`, `icons/`.

## Owner flow
1. `admin.html` → 貼上訊息: paste WhatsApp messages / chat export → 解析 → review table → 加入貨品清單.
2. 加價規則: percent or fixed markup, round to $10/50/100, optional 8/9 tail. Manually edited sell prices get 🔒 and survive recalcs.
3. 相片: drop WhatsApp photos → assign to product (compressed to 640px JPEG data URLs).
4. 舖頭 & 付款: name, WhatsApp number, notice, delivery options, PayMe link/QR, AlipayHK QR, FPS ID, bank, Octopus, WeChat Pay.
5. 發佈: (A) push `data/catalog.json` straight to GitHub via Contents API with a fine-grained token, or (B) download and commit manually. Backup/restore includes costs.

## Customer flow
Browse by brand → product sheet (colour, qty) → cart → delivery + name/phone → order no. `PS-YYMMDD-XXXX` → payment tabs → "WhatsApp 傳送訂單" (wa.me pre-filled text) → customer replies with payment screenshot. Orders kept in the customer's localStorage (我的訂單).

## Dev
`python3 -m http.server 8765 --directory ~/phone-shop-app` (or launch.json "phoneshop"). Parser test: `node scratch/test_parser.js`.
