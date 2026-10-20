(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.getElementById("top");
  const heroSlides = document.getElementById("heroSlides");

  /* Intro : tuiles terracotta -> photo -> hero */
  const root = document.documentElement;
  const intro = document.getElementById("intro");
  if (intro && root.classList.contains("intro-on")) {
    const timers = [];
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      intro.classList.add("is-out");
      root.classList.remove("intro-on");
      setTimeout(() => intro.remove(), 700);
    };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    /* contours de la figure (tracés en px selon la taille d'écran) */
    const lines = document.getElementById("introLines");
    const W = window.innerWidth, H = window.innerHeight, R = Math.max(32, W * 0.05);
    const bt = H * 0.3664, bb = H * 0.634, gl = W * 0.7585, gr = W * 0.7685;
    const d = [
      `M0 ${bt}H${gl - R}A${R} ${R} 0 0 0 ${gl} ${bt - R}V0`,
      `M${W} ${bt}H${gr + R}A${R} ${R} 0 0 1 ${gr} ${bt - R}V0`,
      `M0 ${bb}H${gl - R}A${R} ${R} 0 0 1 ${gl} ${bb + R}V${H}`,
      `M${W} ${bb}H${gr + R}A${R} ${R} 0 0 0 ${gr} ${bb + R}V${H}`
    ];
    lines.setAttribute("viewBox", `0 0 ${W} ${H}`);
    lines.innerHTML = d.map((p, k) => `<path pathLength="1" style="--k:${k}" d="${p}"/>`).join("");
    at(250, () => intro.classList.add("is-lines"));
    at(1650, () => intro.classList.add("is-fill"));
    at(2150, () => intro.classList.add("is-logo"));
    at(3700, () => intro.classList.add("is-step2"));
    at(4800, () => intro.classList.add("is-step3"));
    at(5600, finish);
    document.getElementById("introSkip").addEventListener("click", finish);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });
  }

  /* Hero : diaporama rotatif (la barre de progression pilote le rythme) */
  const slides = [...heroSlides.querySelectorAll(".hero__slide")];
  const dots = [...hero.querySelectorAll(".dot")];
  const pattern = document.getElementById("heroPattern");
  const pauseBtn = document.getElementById("heroPause");
  let current = 0;
  let userPaused = reduce;
  const setPaused = (p) => {
    userPaused = p;
    hero.classList.toggle("is-paused", p);
    hero.classList.toggle("is-static", reduce);
    pauseBtn.setAttribute("aria-pressed", String(p));
    pauseBtn.setAttribute("aria-label", p ? "Reprendre le diaporama" : "Mettre le diaporama en pause");
  };
  const show = (n, replay = true) => {
    const prev = current;
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      if (i === current) { s.classList.remove("is-leaving"); s.classList.add("is-active"); }
      else if (s.classList.contains("is-active")) {
        s.classList.remove("is-active"); s.classList.add("is-leaving");
        clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("is-leaving"), 2800);
      }
    });
    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.remove("is-active", "is-done");
      if (!active && i < current) d.classList.add("is-done");
      if (active) { void d.offsetWidth; d.classList.add("is-active"); d.setAttribute("aria-current", "true"); } else d.removeAttribute("aria-current");
    });
    if (replay && prev !== current && pattern && !reduce) {
      pattern.classList.add("is-out");
      clearTimeout(pattern._t);
      pattern._t = setTimeout(() => {
        pattern.classList.remove("is-draw", "is-out"); void pattern.getBoundingClientRect(); pattern.classList.add("is-draw");
      }, 650);
    }
  };
  dots.forEach((d) => d.addEventListener("click", () => show(Number(d.dataset.go))));
  pauseBtn.addEventListener("click", () => setPaused(!userPaused));
  hero.addEventListener("animationend", (e) => {
    if (e.animationName === "fill" && !userPaused) show(current + 1);
  });
  /* Pause automatique hors écran / onglet masqué */
  const autoPause = (hidden) => hero.classList.toggle("is-paused", hidden || userPaused);
  document.addEventListener("visibilitychange", () => autoPause(document.hidden));
  if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => autoPause(!en.isIntersecting), { threshold: 0.2 }).observe(hero);
  setPaused(userPaused);
  show(0, false);
  if (pattern && !reduce) pattern.classList.add("is-draw");

})();
