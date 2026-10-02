(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Preloader ----------
  document.body.classList.add("loading");
  const started = performance.now();
  let revealed = false;
  function finishLoading() {
    if (revealed) return;
    revealed = true;
    const wait = Math.max(0, 1300 - (performance.now() - started));
    setTimeout(() => {
      $("#preloader").classList.add("done");
      document.body.classList.remove("loading");
      document.body.classList.add("ready");
      startHero();
    }, reduceMotion ? 0 : wait);
  }
  addEventListener("load", finishLoading);
  setTimeout(finishLoading, 2600); // never block the page on slow images

  // ---------- Contact info from projects.js ----------
  $$("[data-tel]").forEach(a => { a.href = `tel:${CONTACT.phone.tel}`; });
  $$("[data-tel-text]").forEach(el => { el.textContent = CONTACT.phone.display; });
  $$("[data-address]").forEach(el => { el.textContent = CONTACT.address; });
  $("#year").textContent = new Date().getFullYear();

  // ---------- LINE: QR code pop-up ----------
  const qrModal = $("#qrModal");
  let qrReturnFocus = null;
  const setQr = open => {
    qrModal.classList.toggle("open", open);
    qrModal.setAttribute("aria-hidden", !open);
    if (open) { qrReturnFocus = document.activeElement; $(".qr-close", qrModal).focus(); }
    else qrReturnFocus?.focus();
  };
  $$("[data-line]").forEach(btn => btn.addEventListener("click", () => setQr(true)));
  $(".qr-close", qrModal).addEventListener("click", () => setQr(false));
  qrModal.addEventListener("click", e => { if (e.target === qrModal) setQr(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && qrModal.classList.contains("open")) setQr(false); });

  // ---------- Service details pop-up ----------
  const svcModal = $("#svcModal");
  if (svcModal) {
    const items = $$(".svc-item");
    let svcIndex = 0, svcReturnFocus = null;
    const fill = i => {
      svcIndex = (i + items.length) % items.length;
      const it = items[svcIndex];
      $(".svc-modal-ico", svcModal).src = $(".svc-ico", it).src;
      $("#svcModalNo").textContent = $(".svc-no", it).textContent;
      $("#svcModalTitle").innerHTML = $(".svc-title", it).innerHTML;
      $("#svcModalDesc").innerHTML = $(".svc-desc", it).innerHTML;
    };
    const setSvc = (open, i) => {
      if (open) { fill(i); svcReturnFocus = document.activeElement; }
      svcModal.classList.toggle("open", open);
      svcModal.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) $(".svc-close", svcModal).focus(); else svcReturnFocus?.focus();
    };
    items.forEach((it, i) => $(".svc-open", it).addEventListener("click", () => setSvc(true, i)));
    $(".svc-close", svcModal).addEventListener("click", () => setSvc(false));
    $(".svc-prev", svcModal).addEventListener("click", () => fill(svcIndex - 1));
    $(".svc-next", svcModal).addEventListener("click", () => fill(svcIndex + 1));
    svcModal.addEventListener("click", e => { if (e.target === svcModal) setSvc(false); });
    document.addEventListener("keydown", e => {
      if (!svcModal.classList.contains("open")) return;
      if (e.key === "Escape") setSvc(false);
      if (e.key === "ArrowLeft") fill(svcIndex - 1);
      if (e.key === "ArrowRight") fill(svcIndex + 1);
    });
  }

  // ---------- Hero slideshow (home page only) ----------
  let startHero = () => {};
  const dotsEl = $("#heroDots");
  if (dotsEl) {
    const slides = $$(".hero-slide");
    const SLIDE_MS = 6000;
    let slideIndex = 0, slideTimer = null;
    dotsEl.innerHTML = slides.map((_, i) => `<button class="hero-dot" aria-label="ภาพที่ ${i + 1}"><i></i></button>`).join("");
    dotsEl.style.setProperty("--dur", `${SLIDE_MS}ms`);
    const dots = $$(".hero-dot", dotsEl);
    $("#heroTotal").textContent = String(slides.length).padStart(2, "0");

    const goSlide = i => {
      slideIndex = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("active", n === slideIndex));
      dots.forEach((d, n) => {
        d.classList.remove("active");
        d.classList.toggle("done", n < slideIndex);
      });
      void dotsEl.offsetWidth; // restart the fill animation
      dots[slideIndex].classList.add("active");
      $("#heroIndex").textContent = String(slideIndex + 1).padStart(2, "0");
      clearTimeout(slideTimer);
      if (!reduceMotion) slideTimer = setTimeout(() => goSlide(slideIndex + 1), SLIDE_MS);
    };
    startHero = () => goSlide(0);
    dots.forEach((d, i) => d.addEventListener("click", () => goSlide(i)));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearTimeout(slideTimer);
      else if (revealed) goSlide(slideIndex);
    });
  }

  // ---------- Header, scroll progress, back-to-top ring ----------
  const header = $("#header");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  let lastY = 0, ticking = false;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    header.classList.toggle("scrolled", y > 60);
    header.classList.toggle("hide", y > lastY && y > innerHeight * 0.8 && !document.body.classList.contains("menu-open"));
    progress.style.transform = `scaleX(${p})`;
    toTop.style.setProperty("--p", p);
    toTop.classList.toggle("hidden", y < innerHeight * 0.6);
    lastY = y;
    parallax();
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // Active nav link per section
  const navLinks = $$('#nav a[href^="#"]');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["hero", "about", "services", "work", "contact"]
    .map(id => document.getElementById(id)).filter(Boolean)
    .forEach(el => sectionObserver.observe(el));

  // ---------- Mobile menu ----------
  const toggle = $("#menuToggle");
  const setMenu = open => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "ปิดเมนู" : "เปิดเมนู");
  };
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("#nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });

  // ---------- Parallax ----------
  const parallaxEls = $$("[data-parallax]");
  function parallax() {
    if (reduceMotion) return;
    parallaxEls.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      // images are 120–130% of their frame, so cap travel at 10% of the frame height
      const limit = r.height * 0.1;
      const raw = (r.top + r.height / 2 - innerHeight / 2) * -parseFloat(el.dataset.parallax);
      const offset = Math.max(-limit, Math.min(limit, raw));
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  // ---------- Projects, project page and lightbox (home page only) ----------
  const projectsEl = $("#projects");
  if (projectsEl) {
  projectsEl.innerHTML = PROJECTS.map((p, i) => `
    <a class="project-card reveal" href="#project/${p.slug}" data-cursor="View">
      <img src="${p.cover}" alt="${p.title}" loading="lazy">
      <span class="project-info">
        <span class="project-no">${String(i + 1).padStart(2, "0")}</span>
        <span class="project-title">${p.title}</span>
        <span class="project-meta">${p.category} · ${p.location} · ${p.images.length} images</span>
      </span>
      <span class="project-cta">View project <i>→</i></span>
    </a>`).join("");

  // ---------- Project page (#project/<slug>) ----------
  const PAGE = 9;
  const view = $("#projectView");
  const pvGallery = $("#pvGallery");
  const baseTitle = document.title;
  let openSlug = null;
  let lbItems = []; // photos the lightbox steps through (the open project's)

  function cardHTML(img, i) {
    return `
      <button class="card" data-index="${i}" data-cursor="View" style="--d:${(i % 3) * 90}ms" aria-label="View ${img.caption}">
        <img src="${img.src}" alt="${img.caption}" loading="lazy">
        <span class="card-info"><span class="card-title">${img.caption}</span></span>
      </button>`;
  }
  // Photos are grouped into blocks of 9. Full blocks alternate between two mosaic
  // layouts (bento-a / bento-b); a short final block uses an even grid.
  function blocksHTML(images) {
    let html = "";
    for (let start = 0; start < images.length; start += PAGE) {
      const items = images.slice(start, start + PAGE);
      const layout = items.length < PAGE ? "bento-tail" : (start / PAGE) % 2 ? "bento-b" : "bento-a";
      html += `<div class="bento ${layout}">${items.map((img, n) => cardHTML(img, start + n)).join("")}</div>`;
    }
    return html;
  }
  function watchLoaded(root) {
    $$(".card:not(.loaded) img", root).forEach(img => {
      const done = () => img.closest(".card").classList.add("loaded");
      if (img.complete) done();
      else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
    });
  }

  function openProject(slug) {
    const i = PROJECTS.findIndex(p => p.slug === slug);
    if (i < 0) { closeProject(); return; }
    const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
    openSlug = slug;
    $("#pvMeta").textContent = `${p.category} · ${p.location}`;
    $("#pvTitle").textContent = p.title;
    $("#pvDesc").textContent = p.description;
    $("#pvCount").textContent = `${p.images.length} images`;
    lbItems = p.images.map(img => ({ src: img.src, title: img.caption, meta: p.title }));
    pvGallery.innerHTML = blocksHTML(p.images);
    watchLoaded(pvGallery);
    $("#pvNext").innerHTML = `<a href="#project/${next.slug}"><span>Next project</span><b>${next.title} <i>→</i></b></a>`;
    view.scrollTop = 0;
    view.classList.add("open");
    view.setAttribute("aria-hidden", "false");
    document.body.classList.add("view-open");
    document.title = `${p.title} — ${baseTitle}`;
    view.focus({ preventScroll: true });
  }
  function closeProject() {
    if (!openSlug) return;
    openSlug = null;
    view.classList.remove("open");
    view.setAttribute("aria-hidden", "true");
    document.body.classList.remove("view-open");
    document.title = baseTitle;
  }
  function route() {
    const m = location.hash.match(/^#project\/([\w-]+)$/);
    if (m) openProject(m[1]); else closeProject();
  }
  addEventListener("hashchange", route);
  pvGallery.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (card) openLightbox(+card.dataset.index);
  });

  // ---------- Lightbox ----------
  const lb = $("#lightbox");
  const lbImg = $(".lb-img", lb);
  const thumbs = $("#lbThumbs");
  let current = 0, lastFocus = null;

  function show(i) {
    current = (i + lbItems.length) % lbItems.length;
    const p = lbItems[current];
    lbImg.classList.remove("in");
    lbImg.src = p.src;
    lbImg.alt = p.title;
    $(".lb-title", lb).textContent = p.title;
    $(".lb-meta", lb).textContent = p.meta;
    $(".lb-count", lb).textContent = `${String(current + 1).padStart(2, "0")} / ${String(lbItems.length).padStart(2, "0")}`;
    $$(".lb-thumb", thumbs).forEach((t, n) => t.classList.toggle("active", n === current));
    $(".lb-thumb.active", thumbs)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
  lbImg.addEventListener("load", () => lbImg.classList.add("in"));

  function openLightbox(i) {
    lastFocus = document.activeElement;
    thumbs.innerHTML = lbItems.map((p, n) =>
      `<button class="lb-thumb" data-i="${n}" aria-label="${p.title}"><img src="${p.src}" alt="" loading="lazy"></button>`).join("");
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    show(i);
    $(".lb-close", lb).focus();
  }
  function closeLightbox() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus();
  }
  thumbs.addEventListener("click", e => { const t = e.target.closest(".lb-thumb"); if (t) show(+t.dataset.i); });
  $(".lb-close", lb).addEventListener("click", closeLightbox);
  $(".lb-prev", lb).addEventListener("click", () => show(current - 1));
  $(".lb-next", lb).addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", e => { if (e.target === lb || e.target === $(".lb-figure", lb)) closeLightbox(); });

  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) {
      if (e.key === "Escape" && openSlug && !qrModal.classList.contains("open")) location.hash = "work";
      return;
    }
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  let touchX = null;
  $(".lb-figure", lb).addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  $(".lb-figure", lb).addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  route();
  } // end home-page-only block

  // ---------- Reveal on scroll ----------
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 90}ms`;
    revealObserver.observe(el);
  });

  // ---------- Custom cursor ----------
  if (finePointer && !reduceMotion) {
    const cursor = $("#cursor");
    const label = $(".cursor-label", cursor);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add("visible");
      const target = e.target.closest("[data-cursor]");
      cursor.classList.toggle("has-label", !!target);
      if (target) label.textContent = target.dataset.cursor;
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("visible"));
    (function loop() {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  onScroll();
})();
