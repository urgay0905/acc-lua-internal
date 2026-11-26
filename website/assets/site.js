// Veyro Digital — shared behaviour and motion for every page.
// Uses GSAP + ScrollTrigger + Lenis (in /vendor). If they fail to load, the
// page still works: content is simply shown without animation.
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const animate = !!(gsap && ST) && !reduce;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Without animation, show everything right away.
  if (!animate) root.classList.remove("js");

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (animate && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    gsap.registerPlugin(ST);
    lenis.on("scroll", ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else if (animate) {
    gsap.registerPlugin(ST);
  }

  const navH = () => ($("#nav")?.offsetHeight || 0) + 8;
  function scrollToHash(hash, immediate) {
    const el = hash && hash.length > 1 && document.getElementById(hash.slice(1));
    if (!el) return false;
    if (lenis) lenis.scrollTo(el, { offset: -navH(), immediate, duration: 1.3 });
    else el.scrollIntoView({ behavior: reduce || immediate ? "auto" : "smooth" });
    return true;
  }

  // ---------- Nav: border, hide on scroll down, show on scroll up ----------
  const nav = $("#nav");
  const progress = document.createElement("div");
  progress.className = "progress";
  document.body.prepend(progress);
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle("scrolled", y > 8);
      const menuOpen = $("#navLinks")?.classList.contains("open");
      if (!menuOpen && y > 160 && y > lastY + 4) nav.classList.add("hide");
      else if (y < lastY - 4 || y < 160) nav.classList.remove("hide");
    }
    lastY = y;
  }
  if (lenis) lenis.on("scroll", onScroll); else window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      if (open && animate) gsap.fromTo(navLinks.children, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .04, ease: "power2.out" });
    });
  }

  // ---------- Links: smooth in-page scroll + fade between pages ----------
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.getAttribute("href"), location.href);
    if (url.protocol !== location.protocol || url.origin !== location.origin) return;
    if (navLinks) { navLinks.classList.remove("open"); menuBtn && menuBtn.setAttribute("aria-expanded", "false"); }
    const samePage = url.pathname === location.pathname;
    if (samePage && url.hash) {
      if (scrollToHash(url.hash)) { e.preventDefault(); history.replaceState(null, "", url.hash); }
      return;
    }
    if (!samePage && /\.html?$|\/$/.test(url.pathname) && animate) {
      e.preventDefault();
      gsap.to("body", { opacity: 0, y: -6, duration: .3, ease: "power2.in", onComplete: () => { location.href = url.href; } });
    }
  });
  window.addEventListener("pageshow", ev => { if (ev.persisted && gsap) gsap.set("body", { opacity: 1, y: 0 }); });

  // ---------- Buttons: ripple + pop on click, magnetic hover ----------
  function pop(el) {
    if (!animate) return;
    gsap.timeline()
      .to(el, { scale: .94, duration: .09, ease: "power2.out" })
      .to(el, { scale: 1, duration: .55, ease: "elastic.out(1, 0.45)" });
  }
  function shake(el) {
    if (!animate) return;
    gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-9, 8, -6, 5, -3, 0] }, duration: .45, ease: "power1.out" });
  }
  window.VeyroFX = { pop, shake };

  $$(".btn, .chip, .menu-btn").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
      if (animate) gsap.to(btn, { scale: .95, duration: .12, ease: "power2.out" });
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
    const release = () => { if (animate) gsap.to(btn, { scale: 1, duration: .6, ease: "elastic.out(1, 0.4)" }); };
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);

    if (animate && finePointer && btn.classList.contains("btn")) {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .28, duration: .4, ease: "power3.out" });
      });
      btn.addEventListener("pointerleave", () => {
        gsap.to(btn, { x: 0, y: 0, scale: 1, duration: .8, ease: "elastic.out(1, 0.4)" });
      });
    }
  });

  // ---------- Cards: cursor-follow glow ----------
  if (finePointer) {
    $$(".card, .step, .plan, .concept").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // ---------- FAQ: smooth open/close ----------
  $$("details").forEach(d => {
    const summary = $("summary", d);
    const body = $("p", d);
    if (!summary || !body) return;
    summary.addEventListener("click", e => {
      if (!animate) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, marginTop: 0, duration: .4, ease: "power2.inOut", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "all" }); ST.refresh(); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0, marginTop: 0 }, { height: "auto", opacity: 1, marginTop: 12, duration: .5, ease: "power3.out", onComplete: () => { gsap.set(body, { clearProps: "all" }); ST.refresh(); } });
      }
    });
  });

  // ---------- Concepts page: animated filter ----------
  const chips = $$(".chip[data-filter]");
  const conceptCards = $$(".concept");
  chips.forEach(chip => chip.addEventListener("click", () => {
    chips.forEach(c => c.setAttribute("aria-pressed", c === chip));
    const f = chip.dataset.filter;
    const show = card => f === "all" || card.dataset.cat === f;
    const apply = () => {
      conceptCards.forEach(card => { card.hidden = !show(card); });
      if (animate) {
        gsap.fromTo(conceptCards.filter(show), { opacity: 0, y: 24, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .6, stagger: .07, ease: "power3.out" });
        ST.refresh();
      }
    };
    if (animate) gsap.to(conceptCards.filter(c => !c.hidden), { opacity: 0, y: -10, duration: .2, ease: "power1.in", onComplete: apply });
    else apply();
  }));

  // Process timeline: cursor glow on the cards
  if (finePointer) $$(".tl-card").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));
  if (!animate) $$(".tl-step").forEach(s => s.classList.add("active"));

  if (!animate) {
    if (location.hash) scrollToHash(location.hash, true);
    return;
  }

  // ---------- Split headings into words ----------
  function splitWords(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const line = document.createElement("span"); line.className = "split-line";
            const word = document.createElement("span"); word.className = "split-word"; word.textContent = part;
            line.appendChild(word); frag.appendChild(line);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains("split-line")) {
          walk(child);
        }
      });
    };
    walk(el);
    return $$(".split-word", el);
  }

  // ---------- Intro (hero) ----------
  const heroH1 = $(".hero h1, .page-hero h1");
  const intro = gsap.timeline({ defaults: { ease: "power4.out" }, delay: .1 });
  intro.from("body", { opacity: 0, duration: .4, ease: "power1.out" });
  if (nav) intro.from(nav, { y: -20, opacity: 0, duration: .8 }, 0.05);
  const heroBits = $$(".hero .eyebrow, .page-hero .eyebrow");
  if (heroBits.length) intro.from(heroBits, { y: 16, opacity: 0, duration: .8 }, 0.15);
  if (heroH1) {
    heroH1.setAttribute("aria-label", heroH1.textContent.trim());
    intro.from(splitWords(heroH1), { yPercent: 110, rotate: 4, duration: 1.1, stagger: .06 }, 0.2);
  }
  const afterH1 = $$(".hero .lede, .page-hero .lede, .hero-ctas > *, .hero-points > *");
  if (afterH1.length) intro.from(afterH1, { y: 22, opacity: 0, duration: .9, stagger: .07 }, 0.6);
  const mock = $(".mock");
  if (mock) {
    intro.from(".hero-visual", { y: 60, opacity: 0, rotateX: 12, duration: 1.4, ease: "expo.out" }, 0.45);
    gsap.set(mock, { rotate: 1.2 });
    if (finePointer) {
      const hero = $(".hero");
      hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(mock, { rotateY: px * 10, rotateX: -py * 8, duration: .9, ease: "power3.out" });
      });
      hero.addEventListener("pointerleave", () => gsap.to(mock, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "power3.out" }));
    }
    gsap.to(".hero-visual", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  // ---------- Section headings ----------
  $$("section h2").forEach(h2 => {
    if (h2.closest(".hero, .page-hero")) return;
    h2.setAttribute("aria-label", h2.textContent.trim());
    gsap.from(splitWords(h2), { yPercent: 110, duration: 1, stagger: .045, ease: "power4.out",
      scrollTrigger: { trigger: h2, start: "top 88%" } });
  });

  // ---------- Reveals (staggered in batches) ----------
  const reveals = $$(".reveal").filter(el => !el.closest(".hero"));
  gsap.set(reveals, { y: 36, opacity: 0 });
  ST.batch(reveals, {
    start: "top 90%",
    onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 1, stagger: .09, ease: "power3.out", overwrite: true }),
  });
  // Images inside cards: gentle zoom-in as they appear
  $$(".shot img").forEach(img => {
    gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "center center", scrub: true } });
  });

  // ---------- Scroll showcase: pin, scroll each page inside its frame, slide to the next ----------
  $$(".showcase").forEach(sc => {
    const slides = $$(".sc-slide", sc), track = $(".sc-track", sc);
    if (slides.length < 2) return;
    sc.classList.add("is-live");
    const bar = $(".sc-progress span", sc), count = $(".sc-count b", sc), n = slides.length;
    gsap.set(slides.slice(1), { scale: .9, opacity: .35 });
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sc, start: "top top", end: () => "+=" + Math.round(n * innerHeight * 2.8),
        pin: true, scrub: 1.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => {
          bar.style.transform = `scaleX(${self.progress})`;
          count.textContent = String(Math.min(n, Math.floor(self.progress * n) + 1)).padStart(2, "0");
        },
      },
    });
    slides.forEach((s, i) => {
      const img = $(".sc-screen img", s), screen = $(".sc-screen", s);
      tl.to({}, { duration: .2 });  // short pause at the top of each page
      tl.to(img, { y: () => -Math.max(0, img.offsetHeight - screen.clientHeight), duration: 1.6, ease: "sine.inOut" });
      tl.to({}, { duration: .2 });  // and at the bottom
      if (i < n - 1) {
        tl.to(track, { x: () => -(slides[i + 1].offsetLeft - slides[0].offsetLeft), duration: .9, ease: "sine.inOut" }, ">");
        tl.to(s, { scale: .9, opacity: .35, duration: .9, ease: "sine.inOut" }, "<");
        tl.to(slides[i + 1], { scale: 1, opacity: 1, duration: .9, ease: "sine.inOut" }, "<");
      }
    });
    $$("img", sc).forEach(img => { if (!img.complete) img.addEventListener("load", () => ST.refresh(), { once: true }); });
  });

  // ---------- Process timeline: line fills, nodes light up, cards pop in ----------
  const tlEl = $(".tl-wrap");
  if (tlEl) {
    gsap.fromTo(".tl-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tlEl, start: "top 65%", end: "bottom 65%", scrub: .8 } });
    $$(".tl-step").forEach(s => {
      ST.create({ trigger: s, start: "top 65%", onEnter: () => s.classList.add("active"), onLeaveBack: () => s.classList.remove("active") });
      gsap.from($(".tl-card", s), { y: 50, scale: .95, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%" } });
      gsap.from($(".tl-node", s), { scale: .4, opacity: 0, duration: .9, ease: "back.out(2)", scrollTrigger: { trigger: s, start: "top 88%" } });
      gsap.from($$(".tl-list li", s), { x: -14, opacity: 0, duration: .7, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 75%" } });
    });
  }

  // ---------- Prices count up ----------
  $$(".price").forEach(el => {
    const tn = Array.from(el.childNodes).find(n => n.nodeType === 3 && /\d/.test(n.textContent));
    if (!tn) return;
    const m = tn.textContent.match(/^(\D*)([\d,]+)(.*)$/s);
    if (!m) return;
    const target = parseInt(m[2].replace(/,/g, ""), 10);
    const obj = { v: 0 };
    tn.textContent = m[1] + "0" + m[3];
    gsap.to(obj, { v: target, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => { tn.textContent = m[1] + Math.round(obj.v).toLocaleString("en-GB") + m[3]; } });
  });

  // ---------- Closing band: scale in ----------
  $$(".band").forEach(b => gsap.from(b, { scale: .94, borderRadius: 48, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "top 60%", scrub: true } }));

  window.addEventListener("load", () => {
    ST.refresh();
    if (location.hash) {
      // Let the browser's own jump settle, then land just below the nav bar.
      setTimeout(() => { if (lenis) lenis.resize(); scrollToHash(location.hash, true); onScroll(); nav && nav.classList.remove("hide"); }, 60);
    }
  });
})();
