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
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Warm-up quiz ---------- */
  const questions = [
    {
      topic: "Kotlin",
      book: "book-kotlin",
      q: "Which of these can <code>lateinit</code> NOT be used with?",
      opts: [
        "A <code>var</code> of type <code>String</code>",
        "A <code>var</code> holding a custom class",
        "A <code>val</code> property, or a primitive type like <code>Int</code>",
        "A property inside a class body",
      ],
      answer: 2,
      why: "<code>lateinit</code> only works on mutable (<code>var</code>), non-null, non-primitive properties. For a <code>val</code>, use <code>by lazy</code>; for primitives, use a default value or <code>Delegates.notNull()</code>.",
    },
    {
      topic: "Jetpack Compose",
      book: "book-compose",
      q: "Which API keeps a piece of UI state across a configuration change like screen rotation?",
      opts: [
        "<code>remember { mutableStateOf(...) }</code>",
        "<code>rememberSaveable { mutableStateOf(...) }</code>",
        "<code>mutableStateOf(...)</code> on its own",
        "<code>LaunchedEffect(Unit) { ... }</code>",
      ],
      answer: 1,
      why: "<code>remember</code> survives recomposition, but the Activity is recreated on rotation, so the value is lost. <code>rememberSaveable</code> stores it in the saved instance state, so it survives configuration changes (and process death, for saveable types).",
    },
    {
      topic: "Coroutines & Flow",
      book: "book-coroutines",
      q: "Inside <code>coroutineScope { }</code>, one child coroutine throws an exception. What happens to its sibling coroutines?",
      opts: [
        "They keep running normally",
        "They're cancelled, and the exception propagates to the caller",
        "The exception is silently swallowed",
        "Only the failing child stops; nothing else is affected",
      ],
      answer: 1,
      why: "That's structured concurrency: a failing child cancels its parent scope, which cancels all siblings, and the exception is rethrown. If you want siblings to keep running, use <code>supervisorScope</code> instead.",
    },
    {
      topic: "Core Android",
      book: "book-android",
      q: "You're creating a singleton that lives as long as the app (like a database). Which Context should it hold?",
      opts: [
        "The Activity that created it",
        "The Application context",
        "A Fragment's <code>requireContext()</code>",
        "Any View's <code>context</code>",
      ],
      answer: 1,
      why: "A singleton outlives every Activity. Holding an Activity (or a Fragment or View context, which point to the Activity) leaks it and everything it references. The Application context lives exactly as long as the app.",
    },
  ];
  const bookNames = {
    "book-kotlin": "Kotlin Interview Questions & Answers",
    "book-compose": "Jetpack Compose Interview Questions & Answers",
    "book-coroutines": "Kotlin Coroutines & Flow Interview Questions & Answers",
    "book-android": "Core Android Interview Questions & Answers",
  };

  const quiz = document.getElementById("quiz");
  if (quiz) {
    const el = (id) => document.getElementById(id);
    let i = 0;
    let score = 0;
    const missed = [];

    const render = () => {
      const q = questions[i];
      el("quiz-step").textContent = `Question ${i + 1} of ${questions.length}`;
      el("quiz-bar").style.width = `${(i / questions.length) * 100}%`;
      el("quiz-topic").textContent = q.topic;
      el("quiz-q").innerHTML = q.q;
      el("quiz-explain").hidden = true;
      el("quiz-next").hidden = true;
      el("quiz-opts").innerHTML = q.opts
        .map((o, n) => `<button type="button" class="quiz__opt" data-n="${n}"><span class="quiz__letter">${"ABCD"[n]}</span><span>${o}</span></button>`)
        .join("");
      el("quiz-opts").querySelectorAll(".quiz__opt").forEach((b) => b.addEventListener("click", () => pick(Number(b.dataset.n))));
    };

    const pick = (n) => {
      const q = questions[i];
      const right = n === q.answer;
      if (right) score++;
      else missed.push(q.book);
      el("quiz-opts").querySelectorAll(".quiz__opt").forEach((b, k) => {
        b.disabled = true;
        if (k === q.answer) b.classList.add("is-right");
        else if (k === n) b.classList.add("is-wrong");
      });
      el("quiz-explain").innerHTML =
        `<strong>${right ? "✅ Correct!" : "❌ Not quite."}</strong> ${q.why} ` +
        `<a href="#${q.book}">More like this in the ${q.topic} book →</a>`;
      el("quiz-explain").hidden = false;
      const btn = el("quiz-next");
      btn.textContent = i === questions.length - 1 ? "See my score →" : "Next question →";
      btn.hidden = false;
      btn.focus({ preventScroll: true });
    };

    el("quiz-next").addEventListener("click", () => {
      i++;
      if (i < questions.length) return render();
      el("quiz-bar").style.width = "100%";
      el("quiz-step").textContent = "Done";
      const rec = missed[0];
      const msg =
        score === questions.length
          ? "Perfect score. You know your stuff. The books go much deeper, with the follow-up questions senior interviews love."
          : `A good start. The topic to work on first: <strong>${bookNames[rec]}</strong>.`;
      quiz.querySelector(".quiz__topic").textContent = "";
      el("quiz-q").textContent = "";
      el("quiz-opts").innerHTML = `
        <div class="quiz__result">
          <div class="quiz__score">${score}/${questions.length}</div>
          <p>${msg}</p>
          <div class="hero__ctas">
            <a href="#${rec || "books"}" class="btn btn--primary">${rec ? "See that book →" : "Browse the books →"}</a>
            <button type="button" class="btn btn--ghost" id="quiz-again">Try again</button>
          </div>
        </div>`;
      el("quiz-explain").hidden = true;
      el("quiz-next").hidden = true;
      el("quiz-again").addEventListener("click", () => {
        i = 0;
        score = 0;
        missed.length = 0;
        render();
      });
    });
    render();
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
