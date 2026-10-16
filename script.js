(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: scrolled state, mobile menu, progress bar ---------- */
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
  nav.querySelectorAll(".nav__links a, .nav__cta a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Hero code window ---------- */
  const snippets = {
    shared: {
      file: "commonMain/CourseRepository.kt",
      note: "One repository. Every platform uses it.",
      code: `// commonMain: written once, runs everywhere
class CourseRepository(
    private val api: CourseApi,
    private val db: CourseDatabase,
) {
    fun courses(): Flow<List<Course>> =
        db.courseQueries.all()
            .asFlow()
            .mapToList(Dispatchers.IO)

    suspend fun refresh() {
        val fresh = api.fetchCourses()
        db.transaction {
            fresh.forEach(db.courseQueries::upsert)
        }
    }
}`,
    },
    android: {
      file: "androidApp/CourseScreen.kt",
      note: "Native Compose UI, powered by the shared module.",
      code: `@Composable
fun CourseScreen(
    vm: CourseViewModel = koinViewModel()
) {
    val courses by vm.courses
        .collectAsStateWithLifecycle()

    LazyColumn {
        items(courses) { course ->
            CourseCard(
                course = course,
                onClick = { vm.open(course.id) }
            )
        }
    }
}`,
    },
    ios: {
      file: "iosApp/CourseView.swift",
      note: "Same logic on iOS. Only the UI is native.",
      code: `// The same Kotlin repository, called from Swift
struct CourseView: View {
    @StateObject var vm = CourseViewModel()

    var body: some View {
        List(vm.courses, id: \\.id) { course in
            CourseRow(course: course)
        }
        .task { await vm.refresh() }
    }
}`,
    },
    server: {
      file: "server/Application.kt",
      note: "Your own backend, in the language you already know.",
      code: `fun Application.module() {
    install(ContentNegotiation) { json() }
    install(Authentication) { jwt { /* ... */ } }

    routing {
        get("/courses") {
            call.respond(courseService.all())
        }
        authenticate {
            post("/enroll") { /* ... */ }
        }
    }
}`,
    },
  };

  const KEYWORDS =
    "fun|val|var|class|struct|object|suspend|return|override|private|import|some|in|await|let|func|if|else|when";
  const TOKEN = new RegExp(
    `(\\/\\/.*$|\\/\\*.*?\\*\\/)|("(?:[^"\\\\]|\\\\.)*")|(@\\w+)|\\b(${KEYWORDS})\\b|\\b([A-Z]\\w*)\\b|\\b([a-z]\\w*)(?=\\s*[({])`,
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

  const codeBody = document.getElementById("code-body");
  const codeFile = document.getElementById("code-file");
  const codeNote = document.getElementById("code-note");
  const tabs = document.querySelectorAll(".code__tabs button");
  const order = Object.keys(snippets);
  let typingTimer = null;
  let autoTimer = null;
  let current = 0;
  let userTookOver = false;

  const show = (key) => {
    const snip = snippets[key];
    tabs.forEach((t) => {
      const active = t.dataset.snippet === key;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    codeFile.textContent = snip.file;
    codeNote.textContent = snip.note;
    clearTimeout(typingTimer);

    if (reduceMotion) {
      codeBody.innerHTML = highlight(snip.code);
      return;
    }
    let n = 0;
    const step = () => {
      n = Math.min(snip.code.length, n + 3);
      codeBody.innerHTML = highlight(snip.code.slice(0, n));
      if (n < snip.code.length) typingTimer = setTimeout(step, 14);
      else if (!userTookOver) autoTimer = setTimeout(next, 3800);
    };
    step();
  };
  const next = () => {
    current = (current + 1) % order.length;
    show(order[current]);
  };

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      userTookOver = true;
      clearTimeout(autoTimer);
      current = order.indexOf(t.dataset.snippet);
      show(t.dataset.snippet);
    })
  );
  show(order[0]);

  /* ---------- Path finder ---------- */
  const recommendations = {
    architecture: {
      title: "Android Architecture Mastery",
      why: "Learn the structure that keeps big apps clean: modules, layers, Hilt and tests.",
      book: ["android", "Core Android Interview Questions & Answers"],
    },
    offline: {
      title: "Offline-First Android App",
      why: "Make Room your source of truth and build a Ktor backend that syncs every device.",
      book: ["coroutines", "Kotlin Coroutines & Flow Interview Questions & Answers"],
    },
    cmp: {
      title: "Compose Multiplatform: Build Gamopedia",
      why: "You already know Kotlin. Now ship the same app on Android, iOS and Desktop.",
      book: ["compose", "Jetpack Compose Interview Questions & Answers"],
    },
    fullstack: {
      title: "Kotlin Multiplatform Full-Stack: Build Splitr",
      why: "In progress. Join the email list to hear first. Meanwhile, Offline-First is the best warm-up.",
      book: ["kotlin", "Kotlin Interview Questions & Answers"],
    },
  };
  const result = document.getElementById("path-result");
  document.querySelectorAll(".path").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".path").forEach((b) => b.setAttribute("aria-checked", "false"));
      btn.setAttribute("aria-checked", "true");
      const key = btn.dataset.course;
      const rec = recommendations[key];
      result.hidden = false;
      result.innerHTML = `
        <p><span class="dim">Start here →</span> <strong>${rec.title}</strong><br><span class="dim">${rec.why}</span>
        <br><span class="path__book">📘 Interview coming up? <a href="books/index.html#book-${rec.book[0]}">${rec.book[1].replace(/&/g, "&amp;")}</a></span></p>
        <a href="#course-${key}" class="btn btn--primary">See the course →</a>`;
      result.style.animation = "none";
      void result.offsetWidth;
      result.style.animation = "";

      document.querySelectorAll(".card").forEach((c) => c.classList.remove("is-highlight"));
      document.getElementById(`course-${key}`).classList.add("is-highlight");
      // On phones the result sits below the fold, so bring it into view
      if (window.matchMedia("(max-width: 860px)").matches) {
        result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      }
    })
  );

  /* ---------- Card spotlight + subtle tilt ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        const rx = ((y / r.height) - 0.5) * -5;
        const ry = ((x / r.width) - 0.5) * 5;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Architecture stack ---------- */
  const layers = {
    android: ["Android · Jetpack Compose", "Compose UI, MVVM, Hilt, Room, Retrofit and WorkManager in a clean, multi-module app."],
    ios: ["iOS & Desktop · Compose Multiplatform", "Share your UI with Compose Multiplatform and run the same app on iPhone and desktop."],
    shared: ["Shared KMP module", "Models, repositories, use cases, Ktor Client, SQLDelight and Koin. Write it once, test it once in commonTest."],
    server: ["Ktor server", "REST APIs, JWT auth, task versioning, change logs and cursor-based sync across devices."],
    db: ["Room · SQLDelight · MongoDB", "Local-first storage on the device, and MongoDB on the server with store-facts / compute-views modeling."],
  };
  const detail = document.getElementById("layer-detail");
  const layerBtns = document.querySelectorAll(".layer");
  // On narrow screens the stack sits below the text, so show the detail right under the stack
  const buildCopy = document.querySelector(".build__copy");
  const stack = document.querySelector(".stack");
  const narrow = window.matchMedia("(max-width: 1000px)");
  const placeDetail = () => (narrow.matches ? stack.after(detail) : buildCopy.append(detail));
  narrow.addEventListener("change", placeDetail);
  placeDetail();
  const activate = (btn) => {
    layerBtns.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const [t, d] = layers[btn.dataset.layer];
    detail.innerHTML = `<strong>${t}</strong><span>${d}</span>`;
    detail.style.borderLeftColor = getComputedStyle(btn).borderColor;
  };
  layerBtns.forEach((b) => {
    b.addEventListener("mouseenter", () => activate(b));
    b.addEventListener("focus", () => activate(b));
    b.addEventListener("click", () => activate(b));
  });

  /* ---------- Newsletter (demo until connected to an email provider) ---------- */
  document.getElementById("signup").addEventListener("submit", (e) => {
    e.preventDefault(); // REMOVE this handler once the form posts to your email provider
    document.getElementById("signup-msg").textContent = "You're in! 🎉 Check your inbox to confirm.";
    e.target.reset();
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
