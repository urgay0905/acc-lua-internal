// Shared behaviour for every Veyro Digital page
(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Sticky nav border
  const nav = document.getElementById("nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  // Mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      navLinks.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false");
    }));
  }

  // Scroll reveal
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("in"));
})();
