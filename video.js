// Lite YouTube player: pages show only a thumbnail, and the real player loads when someone clicks.
// Any link with data-yt="VIDEO_ID" opens the video in a pop-up. Without JavaScript it simply opens YouTube.
(() => {
  const links = document.querySelectorAll("[data-yt]");
  if (!links.length) return;

  const modal = document.createElement("dialog");
  modal.className = "vmodal";
  modal.innerHTML = `
    <div class="vmodal__box">
      <button type="button" class="vmodal__close" aria-label="Close video">✕</button>
      <div class="vmodal__frame"></div>
      <a class="vmodal__yt" target="_blank" rel="noopener">Watch on YouTube ↗</a>
    </div>`;
  document.body.appendChild(modal);
  const frame = modal.querySelector(".vmodal__frame");
  const ytLink = modal.querySelector(".vmodal__yt");

  const close = () => {
    frame.innerHTML = ""; // removing the iframe stops playback
    if (modal.open) modal.close();
  };

  links.forEach((link) =>
    link.addEventListener("click", (e) => {
      if (typeof modal.showModal !== "function") return; // very old browsers: just open YouTube
      e.preventDefault();
      const id = link.dataset.yt;
      const title = link.dataset.title || "YouTube video";
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
        title="${title.replace(/"/g, "&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      ytLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
      modal.showModal();
    })
  );

  modal.querySelector(".vmodal__close").addEventListener("click", close);
  modal.addEventListener("click", (e) => e.target === modal && close()); // click outside the video
  modal.addEventListener("cancel", (e) => {
    e.preventDefault(); // Esc key
    close();
  });

  // English / Hindi tabs on the homepage
  const tabs = document.querySelectorAll("[data-vtab]");
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      document.querySelectorAll("[data-vpanel]").forEach((p) => {
        p.hidden = p.dataset.vpanel !== tab.dataset.vtab;
        if (!p.hidden) p.classList.add("is-visible");
      });
    })
  );
})();
