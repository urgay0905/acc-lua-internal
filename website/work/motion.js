// Motion for the Veyro Digital concept designs: smooth scroll, reveals,
// split headings, parallax photos and button pop. Uses GSAP, ScrollTrigger
// and Lenis from /vendor; the page still works if they fail to load.
(function () {
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
function setupUI() {
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const animate = !!(gsap && ST) && !reduce;
  const root = document.documentElement;
  if (!animate) root.classList.remove("js");
  let lenis = null;
  if (animate) {
    gsap.registerPlugin(ST);
    if (window.Lenis) {
      lenis = new window.Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // progress bar + nav
  const bar = document.createElement("div"); bar.className = "progress"; document.body.prepend(bar);
  const nav = $(".nav"); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle("scrolled", y > 10);
      if (y > 200 && y > lastY + 4) nav.classList.add("hide"); else if (y < lastY - 4 || y < 200) nav.classList.remove("hide");
    }
    lastY = y;
  };
  if (lenis) lenis.on("scroll", onScroll); else addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // anchor links
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#") { e.preventDefault(); return; }
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  // buttons: ripple, press + pop, magnetic
  $$(".btn").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
      const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
      const s = document.createElement("span"); s.className = "ripple";
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s); setTimeout(() => s.remove(), 750);
      if (animate) gsap.to(btn, { scale: .94, duration: .12, ease: "power2.out" });
    });
    const release = () => animate && gsap.to(btn, { scale: 1, duration: .7, ease: "elastic.out(1, .4)" });
    btn.addEventListener("pointerup", release); btn.addEventListener("pointercancel", release);
    if (animate && finePointer) {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .2, y: (e.clientY - r.top - r.height / 2) * .3, duration: .4, ease: "power3.out" });
      });
      btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, scale: 1, duration: .9, ease: "elastic.out(1, .4)" }));
    }
  });
  if (finePointer) $$(".card").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  if (!animate) return { lenis, animate };

  // split headings into words
  const split = el => {
    el.setAttribute("aria-label", el.textContent.trim());
    const walk = node => Array.from(node.childNodes).forEach(ch => {
      if (ch.nodeType === 3) {
        const f = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) return f.appendChild(document.createTextNode(p));
          const l = document.createElement("span"); l.className = "split-line"; l.setAttribute("aria-hidden", "true");
          const w = document.createElement("span"); w.className = "split-word"; w.textContent = p;
          if (ch.parentElement && ch.parentElement.closest(".grad")) w.classList.add("grad");
          l.appendChild(w); f.appendChild(l);
        });
        ch.replaceWith(f);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(el);
    $$(".grad", el).forEach(g => { if (!g.classList.contains("split-word")) g.className = g.className.replace(/\bgrad\b/, "").trim(); });
    return $$(".split-word", el);
  };

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from("body", { opacity: 0, duration: .5, ease: "power1.out" });
  if (nav) tl.from(nav, { y: -24, opacity: 0, duration: .9 }, .1);
  tl.from(".hero .chip", { y: 16, opacity: 0, duration: .8 }, .2);
  const h1 = $(".hero h1");
  if (h1) tl.from(split(h1), { yPercent: 115, rotate: 5, duration: 1.2, stagger: .07 }, .25);
  tl.from(".hero .lede, .hero .ctas > *, .hero-meta > div, .hero .search, .hero .quote", { y: 24, opacity: 0, duration: 1, stagger: .08 }, .7);
  if ($(".hero-media")) {
    tl.from(".hero-media", { clipPath: "inset(18% 14% 18% 14% round 28px)", duration: 1.8, ease: "expo.out" }, .3);
    tl.from(".hero-media img", { scale: 1.3, duration: 2.4, ease: "expo.out" }, .3);
    tl.from(".hero-badge", { y: 30, opacity: 0, duration: 1 }, 1.1);
    gsap.to(".hero-media img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (finePointer) {
      const hm = $(".hero-media");
      hm.addEventListener("pointermove", e => { const r = hm.getBoundingClientRect(); gsap.to(hm, { rotateY: ((e.clientX - r.left) / r.width - .5) * 6, rotateX: -((e.clientY - r.top) / r.height - .5) * 6, duration: .8, ease: "power3.out" }); });
      hm.addEventListener("pointerleave", () => gsap.to(hm, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "power3.out" }));
    }
  }

  $$("section h2").forEach(h => gsap.from(split(h), { yPercent: 115, duration: 1.1, stagger: .05, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 88%" } }));
  const rev = $$("[data-reveal]");
  gsap.set(rev, { y: 50, opacity: 0 });
  ST.batch(rev, { start: "top 90%", onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: .1, ease: "power3.out", overwrite: true }) });
  $$(".frame img, [data-parallax]").forEach(img => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
  $$(".gallery figure").forEach(f => gsap.fromTo(f, { clipPath: "inset(14% 8% 14% 8% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "top 45%", scrub: true } }));
  $$("[data-count]").forEach(el => {
    const end = parseFloat(el.dataset.count), pre = el.dataset.pre || "", suf = el.dataset.suf || "", o = { v: 0 };
    el.textContent = pre + "0" + suf;
    gsap.to(o, { v: end, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" }, onUpdate: () => { el.textContent = pre + Math.round(o.v).toLocaleString("en-GB") + suf; } });
  });
  $$(".cta-box").forEach(b => gsap.from(b, { scale: .92, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "top 55%", scrub: true } }));
  addEventListener("load", () => ST.refresh());
  return { lenis, animate };
}

window.__fx = true;
setupUI();
})();
