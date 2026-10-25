(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav, mobile menu, reading progress ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const bar = document.getElementById("progress-bar");
  const article = document.getElementById("article");

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
    const start = article.offsetTop;
    const end = start + article.offsetHeight - window.innerHeight;
    const pct = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
    bar.style.width = pct * 100 + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- Reading time ---------- */
  const words = article.innerText.trim().split(/\s+/).length;
  document.getElementById("read-time").textContent = `${Math.max(1, Math.round(words / 220))} min read`;

  /* ---------- Table of contents: highlight current section ---------- */
  const tocLinks = [...document.querySelectorAll(".toc a")];
  const sections = tocLinks.map((a) => document.querySelector(a.getAttribute("href")));
  const tocIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      }),
    { rootMargin: "-30% 0px -60% 0px" }
  );
  sections.forEach((s) => s && tocIO.observe(s));

  /* ---------- Syntax highlighting + copy buttons ---------- */
  const KEYWORDS =
    "fun|val|var|class|interface|object|data|suspend|return|private|override|expect|actual|by|if|else|when|try|catch|true|false|null|in|is|init|import|const";
  const TOKEN = new RegExp(
    `(\\/\\/.*$)|("(?:[^"\\\\]|\\\\.)*")|(@\\w+)|\\b(${KEYWORDS})\\b|\\b([A-Z]\\w*)\\b|\\b([a-z]\\w*)(?=\\s*[({])`,
    "gm"
  );
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const highlight = (src) => {
    let out = "";
    let last = 0;
    src.replace(TOKEN, (m, c, s, a, k, t, f, i) => {
      out += esc(src.slice(last, i));
      const cls = c ? "c" : s ? "s" : a ? "a" : k ? "k" : t ? "t" : "f";
      out += `<span class="tk-${cls}">${esc(m)}</span>`;
      last = i + m.length;
      return m;
    });
    return out + esc(src.slice(last));
  };
  document.querySelectorAll(".codeblock code").forEach((code) => {
    const raw = code.textContent;
    const lang = code.parentElement.dataset.lang;
    // Kotlin gets full highlighting; shell, Docker and JSON only get their comments dimmed
    code.innerHTML = lang === "kotlin" ? highlight(raw) : esc(raw).replace(/^(\s*#.*)$/gm, '<span class="tk-c">$1</span>');
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(raw);
        btn.textContent = "Copied ✓";
      } catch {
        btn.textContent = "Press ⌘C";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
    code.parentElement.appendChild(btn);
  });

  /* ---------- "See it visually" comparison ---------- */
  const NA = { na: true, label: "Not supported" };
  const modes = {
    compose: {
      rows: [
        { kind: "UI", cells: [{ label: "Jetpack Compose" }, NA, NA] },
        { kind: "Logic", cells: [{ label: "ViewModels & use cases" }, NA, NA] },
        { kind: "Data", cells: [{ label: "Retrofit · Room" }, NA, NA] },
      ],
      caption: "Android only. To reach iOS you'd build and maintain a second app from scratch, in Swift.",
    },
    kmp: {
      rows: [
        { kind: "UI", cells: [{ label: "Jetpack Compose" }, { label: "SwiftUI" }, { label: "Desktop UI" }] },
        { kind: "Logic · commonMain", shared: "Business logic, written once" },
        { kind: "Data · commonMain", shared: "Ktor Client · SQLDelight" },
      ],
      caption: "Logic and data are written once in Kotlin. Each platform keeps its own native UI.",
    },
    cmp: {
      rows: [
        { kind: "UI · commonMain", shared: "Compose Multiplatform UI" },
        { kind: "Logic · commonMain", shared: "Business logic, written once" },
        { kind: "Data · commonMain", shared: "Ktor Client · SQLDelight" },
      ],
      caption: "UI, logic and data all live in commonMain. One codebase, three apps.",
    },
  };
  const grid = document.querySelector(".approach__grid");
  if (grid) {
  const caption = document.getElementById("approach-caption");
  const tabs = document.querySelectorAll(".approach__tabs button");
  const render = (mode) => {
    const m = modes[mode];
    let html = ["Android", "iOS", "Desktop"].map((p) => `<span class="ap-head">${p}</span>`).join("");
    m.rows.forEach((row, r) => {
      const delay = reduceMotion ? 0 : r * 70;
      if (row.shared) {
        html += `<div class="ap-cell ap-cell--shared" style="animation-delay:${delay}ms"><small>${row.kind} · shared</small>${row.shared}</div>`;
      } else {
        html += row.cells
          .map((c) => `<div class="ap-cell${c.na ? " ap-cell--na" : ""}" style="animation-delay:${delay}ms">${c.na ? "" : `<small>${row.kind}</small>`}${c.label}</div>`)
          .join("");
      }
    });
    grid.innerHTML = html;
    caption.textContent = m.caption;
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.mode === mode)));
  };
  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.mode)));
  render("compose");
  }

  /* ---------- Code tabs (compare two versions of the same code) ---------- */
  document.querySelectorAll(".code-tabs").forEach((box) => {
    const btns = box.querySelectorAll("[data-tab]");
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        box.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
      })
    );
  });

  /* ---------- Offline-first demo: online-first vs offline-first ---------- */
  const demo = document.getElementById("offline-demo");
  if (demo) {
    const titles = ["Edit thumbnail", "Reply to comments", "Plan next video", "Update course notes", "Fix sync bug"];
    let next = 0;
    let online = true;
    const state = {
      onlineFirst: { server: ["Buy milk", "Record video"], view: ["Buy milk", "Record video"], error: "" },
      offlineFirst: { room: [{ t: "Buy milk", s: "synced" }, { t: "Record video", s: "synced" }] },
    };
    const toggleBtn = demo.querySelector(".net-toggle");
    const listA = demo.querySelector('[data-kind="online"] .phone__list');
    const listB = demo.querySelector('[data-kind="offline"] .phone__list');
    const toastA = demo.querySelector('[data-kind="online"] .phone__toast');
    const caption = demo.querySelector(".demo__caption");
    const say = (t) => (caption.textContent = t);
    const toast = (t) => {
      toastA.textContent = t;
      toastA.hidden = false;
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => (toastA.hidden = true), 2200);
    };
    const draw = () => {
      const a = state.onlineFirst;
      listA.innerHTML = a.error
        ? `<li class="phone__error">${a.error}</li>`
        : a.view.map((t) => `<li>${t}</li>`).join("");
      listB.innerHTML = state.offlineFirst.room
        .map((x) => `<li>${x.t}<span class="badge-s badge-s--${x.s}">${x.s === "pending" ? "⏳ pending" : "✓ synced"}</span></li>`)
        .join("");
      demo.classList.toggle("is-offline", !online);
      toggleBtn.textContent = online ? "📶 Online" : "✈️ Offline";
      toggleBtn.setAttribute("aria-pressed", String(!online));
    };
    const syncPending = () =>
      setTimeout(() => {
        if (!online) return;
        state.offlineFirst.room.forEach((x) => (x.s = "synced"));
        draw();
      }, 900);

    toggleBtn.addEventListener("click", () => {
      online = !online;
      if (online) {
        say("Back online. WorkManager pushes the pending tasks in the background. The online-first app has nothing to retry: those tasks were never saved.");
        syncPending();
      } else {
        say("You're offline. Now try adding a task, or reopening the app.");
      }
      draw();
    });
    demo.querySelector("#demo-add").addEventListener("click", () => {
      const t = titles[next++ % titles.length];
      state.offlineFirst.room.unshift({ t, s: "pending" });
      if (online) {
        state.onlineFirst.server.unshift(t);
        if (!state.onlineFirst.error) state.onlineFirst.view.unshift(t);
        say("Both apps saved it. The offline-first app wrote to Room first, then synced.");
        syncPending();
      } else {
        toast("❌ No internet. Task not saved.");
        say("The online-first app lost the task. The offline-first app saved it to Room and will sync it later.");
      }
      draw();
    });
    demo.querySelector("#demo-reopen").addEventListener("click", () => {
      const a = state.onlineFirst;
      if (online) {
        a.error = "";
        a.view = [...a.server];
        say("Both apps load fine while you're online.");
      } else {
        a.error = "⚠️ Couldn't load tasks. Check your connection.";
        say("Reopened offline: the online-first app has nothing to show. The offline-first app reads Room and opens instantly.");
      }
      draw();
    });
    draw();
    say("Tap “Online” to go offline, then add a task.");
  }

  /* ---------- Ktor API playground (simulated in the browser) ---------- */
  const pg = document.getElementById("playground");
  if (pg) {
    const tasks = new Map([["1", { id: "1", title: "Learn Ktor", done: false }]]);
    let nextId = 2;
    const reqEl = pg.querySelector(".pg__req");
    const statusEl = pg.querySelector(".pg__status");
    const bodyEl = pg.querySelector(".pg__body");
    const titleIn = pg.querySelector("#pg-title");
    const idIn = pg.querySelector("#pg-id");
    const show = (curl, code, text, body) => {
      reqEl.textContent = curl;
      statusEl.textContent = `${code} ${text}`;
      statusEl.dataset.ok = String(code < 400);
      bodyEl.textContent = body === undefined ? "(no body)" : JSON.stringify(body, null, 2);
    };
    const run = (action) => {
      const id = idIn.value.trim() || "1";
      const base = "curl http://localhost:8080";
      if (action === "list") return show(`${base}/tasks`, 200, "OK", [...tasks.values()]);
      if (action === "get") {
        const t = tasks.get(id);
        return t ? show(`${base}/tasks/${id}`, 200, "OK", t) : show(`${base}/tasks/${id}`, 404, "Not Found");
      }
      if (action === "post") {
        const title = titleIn.value.trim();
        const curl = `curl -X POST http://localhost:8080/tasks \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"${title}"}'`;
        if (!title) return show(curl, 400, "Bad Request", { error: "title is required" });
        const t = { id: String(nextId++), title, done: false };
        tasks.set(t.id, t);
        idIn.value = t.id;
        return show(curl, 201, "Created", t);
      }
      if (action === "delete") {
        const ok = tasks.delete(id);
        return show(`curl -X DELETE http://localhost:8080/tasks/${id}`, ok ? 204 : 404, ok ? "No Content" : "Not Found");
      }
    };
    pg.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => run(b.dataset.action)));
    run("list");
  }

  /* ---------- KMP module explorer: tap a module to see its allowed dependencies ---------- */
  const mexp = document.getElementById("module-explorer");
  if (mexp) {
    const MODS = {
      app: ["composeApp", "Entry points for Android, Desktop and the iOS framework. Owns navigation between features and starts Koin with every module.", "*"],
      "games-presentation": ["feature:games:presentation", "Compose Multiplatform screens and ViewModels for the games feature.", ["games-domain", "core-designsystem", "core-common"]],
      "games-domain": ["feature:games:domain", "Pure Kotlin: the Game model, the GameRepository interface and use cases. No frameworks.", ["core-common"]],
      "games-data": ["feature:games:data", "GameRepositoryImpl, API DTOs, database queries and the mappers between them.", ["games-domain", "core-network", "core-database", "core-common"]],
      "fav-presentation": ["feature:favorites:presentation", "Screens and ViewModels for favorites.", ["fav-domain", "core-designsystem", "core-common"]],
      "fav-domain": ["feature:favorites:domain", "Pure Kotlin: favorites models, repository interface and use cases.", ["core-common"]],
      "fav-data": ["feature:favorites:data", "Stores favorites locally with SQLDelight.", ["fav-domain", "core-database", "core-common"]],
      "core-designsystem": ["core:designsystem", "Theme, colors, typography and shared Compose components. Knows nothing about features.", []],
      "core-network": ["core:network", "The configured Ktor HttpClient: JSON, logging, timeouts, auth.", ["core-common"]],
      "core-database": ["core:database", "SQLDelight schema and the platform drivers (expect/actual).", ["core-common"]],
      "core-common": ["core:common", "Dispatchers, Result types and small utilities used everywhere.", []],
    };
    const buttons = mexp.querySelectorAll(".mexp__mod");
    const select = (key) => {
      const [name, what, deps] = MODS[key];
      const ok = deps === "*" ? Object.keys(MODS).filter((k) => k !== key) : deps;
      buttons.forEach((b) => {
        const k = b.dataset.mod;
        b.classList.toggle("is-sel", k === key);
        b.classList.toggle("is-ok", k !== key && ok.includes(k));
        b.classList.toggle("is-no", k !== key && !ok.includes(k));
        b.setAttribute("aria-pressed", String(k === key));
      });
      document.getElementById("mexp-name").textContent = name;
      const okNames = ok.map((k) => MODS[k][0]);
      document.getElementById("mexp-what").textContent =
        `${what} ${ok.length ? `Can depend on: ${deps === "*" ? "every module" : okNames.join(", ")}.` : "Depends on no other project module."}`;
    };
    buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.mod)));
    select("games-presentation");
  }

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
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
