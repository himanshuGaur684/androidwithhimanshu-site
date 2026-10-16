(() => {
  /* ---------- Nav, mobile menu, scroll progress ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const bar = document.getElementById("progress-bar");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- Search + topic filter ---------- */
  const grid = document.getElementById("posts");
  const search = document.getElementById("search");
  const chips = document.querySelectorAll(".chip");
  const empty = document.getElementById("empty");
  const soon = document.getElementById("soon"); // optional "Coming soon" list
  const soonItems = soon ? soon.querySelectorAll("li") : [];

  // Newest first, regardless of the order in the HTML
  const posts = [...grid.querySelectorAll(".post")].sort((a, b) => b.dataset.date.localeCompare(a.dataset.date));
  posts.forEach((p) => grid.appendChild(p));

  let filter = "all";
  const matches = (el, query) => {
    const tagOk = filter === "all" || el.dataset.tags.split(" ").includes(filter);
    const textOk = !query || el.textContent.toLowerCase().includes(query);
    return tagOk && textOk;
  };

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    posts.forEach((p) => {
      const ok = matches(p, query);
      p.classList.toggle("is-hidden", !ok);
      p.classList.remove("post--featured");
      if (ok) shown++;
    });
    // The newest article is featured only on the unfiltered view
    if (filter === "all" && !query && posts[0]) posts[0].classList.add("post--featured");
    empty.hidden = shown > 0;

    let soonShown = 0;
    soonItems.forEach((li) => {
      const ok = matches(li, query);
      li.classList.toggle("is-hidden", !ok);
      if (ok) soonShown++;
    });
    if (soon) soon.hidden = soonShown === 0;
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      chips.forEach((c) => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-pressed", String(c === chip));
      });
      apply();
    })
  );
  search.addEventListener("input", apply);
  document.getElementById("reset").addEventListener("click", () => {
    search.value = "";
    chips[0].click();
  });

  // Press "/" to jump to search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== search && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      search.focus();
    }
  });
  apply();

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Newsletter (demo until connected to an email provider) ---------- */
  document.getElementById("signup").addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("signup-msg").textContent = "You're in! 🎉 Check your inbox to confirm.";
    e.target.reset();
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
