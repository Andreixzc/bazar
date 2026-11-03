/* Bazar de Mudança: renders products.js into the page. No build step, no dependencies. */
(() => {
  "use strict";

  const { whatsapp, updated, categories, products } = window.BAZAR;
  const $ = (sel, el = document) => el.querySelector(sel);

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const money = (v) => brl.format(v);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const photo = (p, n) => `img/${p.id}/${n}.jpg`;
  const pageUrl = location.href.split("#")[0];
  const itemUrl = (p) => `${pageUrl}#${p.id}`;
  const wa = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  function waMessage(p) {
    const ask =
      p.status === "reserved" ? "Vi que está reservado. Se não for pra frente, me avisa?"
      : p.photos ? "Ainda está disponível?"
      : "Pode me mandar umas fotos?";
    return `Olá! Vi no seu bazar e tenho interesse em: *${p.name}* (${money(p.price)}). ${ask}\n${itemUrl(p)}`;
  }

  function card(p, n) {
    const sold = p.status === "sold";
    const reserved = p.status === "reserved";
    const dropped = p.previousPrice > p.price;
    const badge = sold ? ["sold", "Vendido"] : reserved ? ["reserved", "Reservado"] : dropped ? ["drop", "Baixou!"] : null;
    const focus = p.focus ? ` style="object-position:${esc(p.focus)}"` : "";

    const imgs = Array.from({ length: p.photos }, (_, k) =>
      `<img src="${photo(p, k + 1)}" alt="${esc(p.name)}, foto ${k + 1} de ${p.photos}" data-index="${k}"` +
      ` decoding="async" loading="${n < 3 && k === 0 ? "eager" : "lazy"}"${k === 0 ? focus : ""}>`
    ).join("");

    const media = p.photos
      ? `<div class="track" tabindex="0" aria-label="Fotos: ${esc(p.name)}">${imgs}</div>` +
        (p.photos > 1
          ? `<button class="nav prev" type="button" aria-label="Foto anterior">${icon("left")}</button>` +
            `<button class="nav next" type="button" aria-label="Próxima foto">${icon("right")}</button>` +
            `<span class="count">1/${p.photos}</span>`
          : "")
      : `<div class="no-photo">${icon("monitor")}<span>Fotos sob pedido</span><small>peça pelo WhatsApp</small></div>`;

    const cta = sold
      ? `<span class="btn btn-sold">Vendido</span>`
      : `<a class="btn btn-wa" href="${esc(wa(waMessage(p)))}" target="_blank" rel="noopener">` +
        `${icon("wa")}<span>${p.photos ? "Chamar no WhatsApp" : "Pedir fotos no WhatsApp"}</span></a>`;

    return `
      <article class="card${sold ? " is-sold" : ""}" id="${esc(p.id)}" data-category="${esc(p.category)}">
        <div class="gallery">${media}${badge ? `<span class="badge badge-${badge[0]}">${badge[1]}</span>` : ""}</div>
        <div class="body">
          <p class="cat">${esc(categories[p.category] || "")}</p>
          <h2 class="name"><a href="#${esc(p.id)}">${esc(p.name)}</a></h2>
          <p class="summary">${esc(p.summary)}</p>
          <p class="price-row">
            <span class="price">${money(p.price)}</span>
            ${dropped ? `<s class="was">${money(p.previousPrice)}</s>` : ""}
            ${p.newPrice ? `<span class="ref">Novo: ~${money(p.newPrice)}</span>` : ""}
          </p>
          <ul class="specs">${p.specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
          <div class="actions">
            ${cta}
            <button class="btn-icon share" type="button" aria-label="Compartilhar ${esc(p.name)}">${icon("share")}</button>
          </div>
        </div>
      </article>`;
  }

  /* ---- render ---- */
  const grid = $("#grid");
  const items = products
    .map((p, order) => ({ ...p, order }))
    .sort((a, b) => (a.status === "sold") - (b.status === "sold") || a.order - b.order);
  grid.innerHTML = items.map(card).join("");

  const forSale = products.filter((p) => p.status !== "sold").length;
  $("#stock").textContent =
    forSale === 0 ? "Tudo vendido, obrigado!"
    : forSale === products.length ? `${forSale} itens à venda`
    : `${forSale} de ${products.length} itens ainda à venda`;

  const hello = wa("Olá! Vi o seu bazar de mudança e queria tirar uma dúvida.");
  for (const id of ["cta", "fab", "foot-wa"]) document.getElementById(id).href = hello;

  const [y, m, d] = updated.split("-").map(Number);
  $("#updated").textContent = `Atualizado em ${new Date(y, m - 1, d).toLocaleDateString("pt-BR", { dateStyle: "long" })}.`;

  /* ---- category filters ---- */
  const filters = $("#filters");
  const counts = {};
  for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;
  filters.innerHTML = [["all", "Tudo", products.length]]
    .concat(Object.entries(categories).filter(([k]) => counts[k]).map(([k, label]) => [k, label, counts[k]]))
    .map(([k, label, n]) =>
      `<button class="chip" type="button" data-cat="${k}" aria-pressed="${k === "all"}">${esc(label)} <span>${n}</span></button>`)
    .join("");

  function setFilter(cat) {
    for (const b of filters.querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.cat === cat));
    for (const c of grid.querySelectorAll(".card")) c.hidden = cat !== "all" && c.dataset.category !== cat;
  }
  filters.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) setFilter(chip.dataset.cat);
  });

  /* ---- photo carousels (swipe on touch, arrows on desktop) ---- */
  const indexOf = (track) => Math.round(track.scrollLeft / track.clientWidth);
  const step = (track, dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: smooth });

  function syncNav(track, box, counter, format) {
    const i = indexOf(track);
    const n = track.children.length;
    if (counter) counter.textContent = format(i + 1, n);
    const prev = $(".prev", box);
    const next = $(".next", box);
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i >= n - 1;
  }

  for (const track of grid.querySelectorAll(".track")) {
    const box = track.parentElement;
    const sync = () => syncNav(track, box, $(".count", box), (i, n) => `${i}/${n}`);
    track.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  grid.addEventListener("click", (e) => {
    const nav = e.target.closest(".nav");
    if (nav) return step($(".track", nav.parentElement), nav.classList.contains("next") ? 1 : -1);
    const img = e.target.closest(".track img");
    if (img) return openLightbox(byId[img.closest(".card").id], Number(img.dataset.index));
    const share = e.target.closest(".share");
    if (share) shareItem(byId[share.closest(".card").id]);
  });

  /* ---- full-screen photo viewer ---- */
  const lb = $("#lightbox");
  const lbTrack = $(".lb-track", lb);
  const syncLightbox = () => syncNav(lbTrack, lb, $(".lb-count", lb), (i, n) => `${i} / ${n}`);

  function openLightbox(p, start) {
    $(".lb-title", lb).textContent = `${p.name} · ${money(p.price)}`;
    lbTrack.innerHTML = Array.from({ length: p.photos }, (_, k) =>
      `<img src="${photo(p, k + 1)}" alt="${esc(p.name)}, foto ${k + 1} de ${p.photos}">`).join("");
    lb.showModal();
    document.documentElement.classList.add("lock");
    lbTrack.scrollLeft = start * lbTrack.clientWidth;
    syncLightbox();
  }

  lbTrack.addEventListener("scroll", syncLightbox, { passive: true });
  lb.addEventListener("close", () => document.documentElement.classList.remove("lock"));
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-close")) return lb.close();
    const nav = e.target.closest(".nav");
    if (nav) step(lbTrack, nav.classList.contains("next") ? 1 : -1);
  });
  lb.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    step(lbTrack, e.key === "ArrowRight" ? 1 : -1);
  });

  /* ---- share an item (native share sheet, or copy the link) ---- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  async function shareItem(p) {
    const url = itemUrl(p);
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text: `${p.name} por ${money(p.price)}`, url });
      } catch {
        /* share sheet dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiado!");
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  /* ---- direct links: …/#pc-gamer scrolls to and highlights that item ---- */
  function showHash() {
    const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el || !el.classList.contains("card")) return;
    if (el.hidden) setFilter("all");
    el.scrollIntoView({ behavior: smooth, block: "start" });
    el.classList.remove("flash");
    void el.offsetWidth; // restart the highlight animation
    el.classList.add("flash");
  }
  addEventListener("hashchange", showHash);
  showHash();
})();
