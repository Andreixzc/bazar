# Bazar de Mudança

Moving-sale catalogue: photos, prices, specs and a WhatsApp button per item.
Live at **https://andreixzc.github.io/bazar/**

## Updating the site

Everything the site shows comes from `products.js`. Edit it and push, or edit it
right on GitHub (works from the phone):
https://github.com/Andreixzc/bazar/edit/main/products.js
The site updates about a minute after the commit.

- **Sold or reserved:** set `status: "sold"` or `status: "reserved"`. Sold items turn grey and move to the end.
- **Lower a price:** set `previousPrice` to the old price and `price` to the new one. The old price shows struck through with a "Baixou!" badge.
- **Add photos:** put them in `img/<id>/` named `1.jpg`, `2.jpg`, … (`1.jpg` is the cover) and set `photos` to the count.
  Easiest way to get web-ready photos: send them to yourself on WhatsApp and download them. That shrinks them and strips the GPS location from the file.
- **Link to one item:** `https://andreixzc.github.io/bazar/#<id>`, e.g. `#tv-lg-oled-c4`. The share button on each card gives the same link.

## What stays private

`.gitignore` is an allowlist: only the site files get committed. `prices_and_specs.txt`
(with your floor prices) and the original photo folders never leave this computer.
If you add a new top-level file the site needs, add a `!/filename` line for it.

## Preview locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
