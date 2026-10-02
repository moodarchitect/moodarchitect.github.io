(() => {
  const gallery = document.getElementById("gallery");
  const filtersEl = document.querySelector(".filters");
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector(".lb-img");
  const lbTitle = lb.querySelector(".lb-title");
  const lbCat = lb.querySelector(".lb-cat");
  const lbDesc = lb.querySelector(".lb-desc");
  const lbCount = lb.querySelector(".lb-count");

  let activeFilter = "ทั้งหมด";
  let visible = [];   // projects currently shown, used for lightbox navigation
  let current = 0;
  let lastFocus = null;

  document.getElementById("year").textContent = new Date().getFullYear();

  // Filters
  const categories = ["ทั้งหมด", ...new Set(PROJECTS.map(p => p.category))];
  filtersEl.innerHTML = categories.map(c =>
    `<button class="chip${c === activeFilter ? " active" : ""}" role="tab" data-cat="${c}">${c}</button>`
  ).join("");
  filtersEl.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeFilter = btn.dataset.cat;
    filtersEl.querySelectorAll(".chip").forEach(b => b.classList.toggle("active", b === btn));
    render();
  });

  // Gallery
  function render() {
    visible = activeFilter === "ทั้งหมด" ? PROJECTS : PROJECTS.filter(p => p.category === activeFilter);
    gallery.innerHTML = visible.map((p, i) => `
      <button class="card" data-index="${i}" style="--d:${i * 50}ms" aria-label="ดู ${p.title}">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="card-info">
          <span class="card-cat">${p.category} · ${p.year}</span>
          <span class="card-title">${p.title}</span>
        </span>
      </button>`).join("");
    gallery.querySelectorAll("img").forEach(img => {
      const done = () => img.closest(".card").classList.add("loaded");
      img.complete ? done() : img.addEventListener("load", done, { once: true });
    });
  }

  gallery.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (card) open(+card.dataset.index);
  });

  // Lightbox
  function show(i) {
    current = (i + visible.length) % visible.length;
    const p = visible[current];
    lbImg.classList.remove("in");
    lbImg.src = p.image;
    lbImg.alt = p.title;
    lbTitle.textContent = p.title;
    lbCat.textContent = `${p.category} · ${p.year}`;
    lbDesc.textContent = p.description || "";
    lbCount.textContent = `${current + 1} / ${visible.length}`;
  }
  lbImg.addEventListener("load", () => lbImg.classList.add("in"));

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus();
  }

  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", e => { if (e.target === lb) close(); });

  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  // Swipe on touch devices
  let startX = null;
  lb.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });

  // Header shadow on scroll
  const header = document.querySelector(".site-header");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });

  render();
})();
