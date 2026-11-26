// Shared motion + 3D engine for the Veyro Digital concept designs.
// Each page calls start({ object, colors, ... }). Three.js is loaded as a module
// (see the importmap on each page); GSAP, ScrollTrigger and Lenis are loaded as
// normal scripts before this one.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

export function start(opts) {
  const ui = setupUI();
  try { setupScene(opts, ui); }
  catch (err) { console.warn("3D scene unavailable:", err); $("#scene")?.remove(); }
}

/* ------------------------------------------------------------------ UI */
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
  tl.from(".hero .lede, .hero .ctas > *, .hero-meta > div", { y: 24, opacity: 0, duration: 1, stagger: .08 }, .7);

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

/* ------------------------------------------------------------------ 3D */
function setupScene(opts, ui) {
  const canvas = $("#scene");
  if (!canvas) return;
  const C = opts.colors;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? .95;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = opts.envIntensity ?? .75;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // lights: two coloured orbiting lights give the glowing rim
  scene.add(new THREE.AmbientLight(0xffffff, .15));
  const l1 = new THREE.PointLight(C.accent, opts.lights ?? 9, 20); const l2 = new THREE.PointLight(C.accent2, opts.lights ?? 9, 20);
  const key = new THREE.DirectionalLight(0xffffff, opts.keyLight ?? .9); key.position.set(3, 4, 5);
  scene.add(l1, l2, key);

  // object
  const holder = new THREE.Group(); scene.add(holder);
  const built = BUILDERS[opts.object](C);
  const obj = built.group;
  const box = new THREE.Box3().setFromObject(obj); const sphere = box.getBoundingSphere(new THREE.Sphere());
  obj.position.sub(sphere.center); const norm = new THREE.Group(); norm.add(obj); norm.scale.setScalar(1 / sphere.radius);
  holder.add(norm);
  if (opts.baseTilt) holder.rotation.set(...opts.baseTilt);
  const spinner = new THREE.Group(); scene.add(spinner); spinner.add(holder);

  // floating dust for depth
  const N = 500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const ca = new THREE.Color(C.accent), cb = new THREE.Color(C.accent2);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - .5) * 26; pos[i * 3 + 1] = (Math.random() - .5) * 30; pos[i * 3 + 2] = -Math.random() * 14 + 2;
    const c = Math.random() < .5 ? ca : cb; col.set([c.r, c.g, c.b], i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); dg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: .035, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // post-processing: bloom = the glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), opts.bloom ?? .5, .45, opts.threshold ?? .78);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  // where the object sits as you scroll: hero stage, then each [data-obj] section
  let anchors = [];
  const view = () => { const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; return { h, w: h * camera.aspect }; };
  const narrow = () => innerWidth < 900;
  function measure() {
    anchors = [];
    const stage = $(".hero-stage");
    if (stage) {
      const r = stage.getBoundingClientRect(), top = r.top + scrollY;
      const cx = r.left + r.width / 2, cy = top + r.height / 2;
      anchors.push({ at: 0, x: (cx / innerWidth) * 2 - 1, y: -((cy / innerHeight) * 2 - 1), s: Math.min(r.width, r.height) / innerHeight * (opts.heroScale ?? .92) });
    }
    $$("[data-obj]").forEach(el => {
      const [x, y, s] = el.dataset.obj.split(/\s+/).map(Number);
      const r = el.getBoundingClientRect(); const at = r.top + scrollY + r.height / 2 - innerHeight / 2;
      anchors.push(narrow() ? { at, x: Math.sign(x) * Math.min(Math.abs(x) * 1.25, .95), y, s: s * .75 } : { at, x, y, s });
    });
    anchors.sort((a, b) => a.at - b.at);
  }
  const smooth = t => t * t * (3 - 2 * t);
  function target(y) {
    if (!anchors.length) return { x: 0, y: 0, s: .6 };
    if (y <= anchors[0].at) return anchors[0];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1];
      if (y <= b.at) { const t = smooth((y - a.at) / Math.max(1, b.at - a.at)); return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t }; }
    }
    return anchors[anchors.length - 1];
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix(); measure();
  }
  addEventListener("resize", resize); resize();
  addEventListener("load", measure);
  setTimeout(measure, 600);

  const mouse = { x: 0, y: 0 };
  if (finePointer) addEventListener("pointermove", e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

  const cur = { x: 0, y: 0, s: 0, ry: 0, rx: 0 };
  let first = true, last = performance.now(), running = true;
  const t0 = performance.now();
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(loop); } });

  function loop(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = now / 1000, sy = scrollY;
    const tg = target(sy), v = view();
    const spin = opts.spin ?? 1;
    const goal = {
      x: tg.x * v.w, y: tg.y * v.h, s: tg.s * v.h * 2 / 2,
      ry: (reduce ? 0 : t * .25 * spin) + sy * .0032 * spin + mouse.x * .6,
      rx: Math.sin(sy * .0011) * .35 + mouse.y * .4,
    };
    const k = first ? 1 : 1 - Math.pow(.0015, Math.min(.25, (now - (loop.prev || now)) / 1000));
    loop.prev = now;
    for (const key of Object.keys(cur)) cur[key] += (goal[key] - cur[key]) * k;
    first = false;
    const intro = Math.min(1, (now - t0) / 1800);
    const e = 1 - Math.pow(1 - intro, 4);
    spinner.position.set(cur.x, cur.y + Math.sin(t * 1.2) * .06 * (reduce ? 0 : 1) - (1 - e) * 1.2, 0);
    spinner.scale.setScalar(Math.max(.001, cur.s * (.6 + .4 * e)));
    spinner.rotation.set(cur.rx, cur.ry + (1 - e) * 2, 0);
    built.update?.(t, dt, sy);
    l1.position.set(Math.cos(t * .5) * 4 + cur.x, Math.sin(t * .7) * 3 + cur.y, 3);
    l2.position.set(Math.cos(t * .5 + Math.PI) * 4 + cur.x, Math.sin(t * .6 + 2) * 3 + cur.y, 2);
    dust.position.y = sy * .0018; dust.rotation.y = t * .01;
    composer.render();
    if (!reduce || first) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  if (reduce) { const once = () => requestAnimationFrame(loop); addEventListener("scroll", once, { passive: true }); }
}

/* ------------------------------------------------------------------ Objects */
const metal = (color, roughness = .2) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness });
const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity });
const glass = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, transmission: 1, thickness: 1.2, roughness: .04, ior: 1.45, metalness: 0, ...extra });
const edges = (geo, color, opacity = .9) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));

const BUILDERS = {
  // Stonecrest — architectural model of a modern house with glowing windows
  house(C) {
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: .6, metalness: .05 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: .8 });
    const gold = metal(C.accent, .25);
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.BoxGeometry(4.4, .16, 3.2), stone, 0, -.08, 0);
    add(new THREE.BoxGeometry(2.6, 1, 2), glow(0xffb866, 1.15), -.5, .5, 0);                 // glowing glass ground floor
    for (const x of [-1.78, -.5, .78]) for (const z of [-.98, .98]) add(new THREE.BoxGeometry(.06, 1, .06), gold, x, .5, z);
    add(new THREE.BoxGeometry(3.9, .14, 2.5), white, .35, 1.07, 0);                          // first floor slab
    add(new THREE.BoxGeometry(2.9, .9, 2.1), white, .6, 1.59, 0);                            // upper volume
    add(new THREE.BoxGeometry(2.94, .26, 2.14), glow(0xffc77a, 1.4), .6, 1.62, 0);           // ribbon window
    add(new THREE.BoxGeometry(3.3, .12, 2.5), white, .6, 2.1, 0);                            // roof
    add(new THREE.BoxGeometry(.5, 2.1, .5), stone, -1.55, 1.05, -.6);                         // chimney wall
    add(new THREE.BoxGeometry(1.5, .05, 1), glow(C.accent2, 1.3), 1.35, .02, .9);             // pool
    const wire = edges(new THREE.BoxGeometry(4.6, 2.5, 3.4), C.accent, .25); wire.position.set(0, 1.1, 0); g.add(wire);
    return { group: g };
  },

  // Fade Room — chrome-capped barber pole with spinning stripes
  pole(C) {
    const g = new THREE.Group();
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 512;
    const x = cv.getContext("2d"); x.fillStyle = "#f4efe6"; x.fillRect(0, 0, 256, 512);
    const cols = ["#d4282f", "#f4efe6", "#1f3f8f", "#f4efe6"];
    x.save(); x.translate(128, 256); x.rotate(-Math.PI / 5); x.translate(-400, -400);
    for (let i = 0; i < 40; i++) { x.fillStyle = cols[i % 4]; x.fillRect(0, i * 26, 800, 26); }
    x.restore();
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 2); tex.colorSpace = THREE.SRGBColorSpace;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 2.4, 64, 1, true),
      new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .55, roughness: .35 }));
    g.add(body);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 2.42, 64, 1, true), glass(0xffffff, { thickness: .3 })));
    const gold = metal(C.accent, .18);
    for (const s of [1, -1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .16, 64), gold); cap.position.y = s * 1.29; g.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.48, .035, 16, 64), glow(C.accent, 2.5)); ring.rotation.x = Math.PI / 2; ring.position.y = s * 1.38; g.add(ring);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .22, .22, 48), gold); neck.position.y = s * 1.48; g.add(neck);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.24, 48, 32), gold); ball.position.y = s * 1.72; g.add(ball);
    }
    return { group: g, update: (t, dt) => { tex.offset.y -= dt * .35; } };
  },

  // Northline — glass water drop with a warm glowing core and chrome rings
  drop(C) {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * Math.pow(Math.sin(a / 2), 1.6) * 1.05, Math.cos(a) * 1.35)); }
    pts.reverse();
    const drop = new THREE.Mesh(new THREE.LatheGeometry(pts, 128), glass(0xcfe6ff, { thickness: 2, roughness: .02, ior: 1.33, attenuationColor: new THREE.Color(C.accent2), attenuationDistance: 3 }));
    g.add(drop);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.28, 32, 32), glow(C.accent, 3)); core.position.y = -.5; g.add(core);
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.35, .055, 24, 160), metal(0xdfe6ee, .12)); r1.rotation.x = Math.PI / 2.3; g.add(r1);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, .014, 12, 160), glow(C.accent, 2.4)); r2.rotation.set(Math.PI / 2.8, .4, 0); g.add(r2);
    const r3 = new THREE.Mesh(new THREE.TorusGeometry(1.75, .01, 12, 160), glow(C.accent2, 2)); r3.rotation.set(-Math.PI / 3, -.3, 0); g.add(r3);
    return { group: g, update: t => { r1.rotation.z = t * .4; r2.rotation.z = -t * .3; r3.rotation.z = t * .2; core.scale.setScalar(1 + Math.sin(t * 2) * .08); } };
  },

  // Lumen — liquid iridescent blob with orbiting pearls
  blob(C) {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(1, 128, 128);
    const base = geo.attributes.position.array.slice();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xf3d3cb, roughness: .12, metalness: .15, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [200, 900], clearcoat: 1, clearcoatRoughness: .08, sheen: 1, sheenColor: new THREE.Color(C.accent) });
    const blob = new THREE.Mesh(geo, mat); g.add(blob);
    const pearls = [];
    [[C.accent, .16, 1.55, 0], [C.accent2, .11, 1.8, 2.1], [0xffffff, .08, 1.4, 4.2]].forEach(([c, r, d, ph]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: .15, clearcoat: 1, iridescence: .6 }));
      pearls.push({ m, d, ph }); g.add(m);
    });
    const p = geo.attributes.position;
    return { group: g, update: t => {
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const n = Math.sin(x * 2.1 + t * .9) * .07 + Math.sin(y * 2.6 + t * 1.1) * .07 + Math.sin(z * 2.3 + t * .7) * .06 + Math.sin((x + y + z) * 3.2 + t * 1.5) * .025;
        p.setXYZ(i, x * (1 + n), y * (1 + n), z * (1 + n));
      }
      p.needsUpdate = true; geo.computeVertexNormals();
      pearls.forEach(({ m, d, ph }, i) => m.position.set(Math.cos(t * .5 + ph) * d, Math.sin(t * .7 + ph) * .5, Math.sin(t * .5 + ph) * d));
    } };
  },

  // Pulse — neon-edged hex dumbbell
  dumbbell(C) {
    const g = new THREE.Group();
    const chrome = metal(0xd9dce2, .15), rubber = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: .55, metalness: .3 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, 3.2, 32), chrome); bar.rotation.z = Math.PI / 2; g.add(bar);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.3, 32), metal(0x8a8d95, .55)); grip.rotation.z = Math.PI / 2; g.add(grip);
    for (const s of [1, -1]) {
      [[.62, .24, .92], [.5, .18, 1.16], [.38, .14, 1.36]].forEach(([r, h, x]) => {
        const geo = new THREE.CylinderGeometry(r, r, h, 6); const m = new THREE.Mesh(geo, rubber);
        m.rotation.z = Math.PI / 2; m.position.x = s * x; g.add(m);
        const e = edges(geo, C.accent, 1); e.rotation.z = Math.PI / 2; e.position.x = s * x; e.scale.setScalar(1.002); g.add(e);
      });
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .1, 32), glow(C.accent, 2.6)); collar.rotation.z = Math.PI / 2; collar.position.x = s * .72; g.add(collar);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 32), chrome); cap.rotation.z = Math.PI / 2; cap.position.x = s * 1.6; g.add(cap);
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.9, .012, 12, 200), glow(C.accent2, 3)); halo.rotation.set(Math.PI / 2.2, 0, .3); g.add(halo);
    return { group: g, update: t => { halo.rotation.z = t * .3; } };
  },

  // Harbour — ornate gold key with a brass halo
  key(C) {
    const g = new THREE.Group();
    const gold = metal(C.accent, .2);
    const add = (geo, x, y, z = 0, mat = gold) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.TorusGeometry(.5, .1, 32, 96), 0, 1.05);
    add(new THREE.TorusGeometry(.26, .04, 24, 64), 0, 1.05);
    for (let i = 0; i < 4; i++) { const m = add(new THREE.CylinderGeometry(.025, .025, .5, 12), 0, 1.05); m.rotation.z = i * Math.PI / 4; }
    add(new THREE.SphereGeometry(.09, 32, 32), 0, 1.05);
    add(new THREE.CylinderGeometry(.075, .075, 1.9, 32), 0, -.35);
    add(new THREE.TorusGeometry(.11, .035, 16, 48), 0, .5).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(.1, .03, 16, 48), 0, .36).rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(.42, .14, .08), .22, -1.1);
    add(new THREE.BoxGeometry(.3, .11, .08), .16, -.86);
    add(new THREE.BoxGeometry(.12, .1, .08), .34, -.98);
    add(new THREE.SphereGeometry(.08, 24, 24), 0, -1.3);
    const halo = add(new THREE.TorusGeometry(1.55, .01, 12, 200), 0, 0, 0, glow(C.accent, 2.6)); halo.rotation.x = Math.PI / 2.4;
    const halo2 = add(new THREE.TorusGeometry(1.75, .008, 12, 200), 0, 0, 0, glow(C.accent2, 2)); halo2.rotation.set(-Math.PI / 2.6, .5, 0);
    return { group: g, update: t => { halo.rotation.z = t * .25; halo2.rotation.z = -t * .2; } };
  },
};
