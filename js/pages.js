// Renders the app windows (project pages and the built-in pages) as HTML strings.
window.WiiPages = (() => {
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const paras = (text) =>
    String(text || "")
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");

  const external = (url) => (/^(https?:)?\/\//.test(url) ? ' target="_blank" rel="noopener"' : "");
  const chips = (list) => (list && list.length ? `<ul class="chips">${list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "");
  const empty = (text) => `<div class="empty-note card">${esc(text)}</div>`;
  const initial = (s) => esc(String(s || "?").trim().charAt(0).toUpperCase());
  const host = (url) => {
    try {
      return new URL(url, location.href).hostname.replace(/^www\./, "");
    } catch (e) {
      return url;
    }
  };
  const date = (d) => {
    const t = Date.parse(d);
    return Number.isNaN(t) ? esc(d) : new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  const avatar = (user) =>
    user.avatar ? `<img src="${esc(user.avatar)}" alt="" draggable="false">` : `<span class="mii-fallback">${initial(user.name)}</span>`;

  const button = (link, primary) =>
    `<a class="pill${primary ? " primary" : ""}" href="${esc(link.url)}"${external(link.url)}>${esc(link.label || host(link.url))}</a>`;

  const tileArt = (item) =>
    item.icon && !item.game
      ? `<img src="${esc(item.icon)}" alt="" draggable="false">`
      : `<span class="tile-art${item.game ? " game" : ""}" style="--c:${esc(item.color || "#9a9a9a")};--c2:${esc(item.color2 || item.color || "#9a9a9a")}">` +
        `${esc(item.label || "").replace(/\n/g, "<br>")}` +
        (item.icon ? `<img class="cover" src="${esc(item.icon)}" alt="" draggable="false">` : "") +
        "</span>";

  // ---- Pages ----

  function project(p) {
    const images = p.images || [];
    const hero = images[0] ? `<img src="${esc(images[0])}" alt="">` : tileArt(p);
    const meta = [p.year, p.role].filter(Boolean).map(esc).join(" · ");
    const gallery = images.slice(1);
    return (
      '<article class="project">' +
      `<div class="project-hero card">${hero}</div>` +
      '<div class="project-info card">' +
      `<h2>${esc(p.title)}</h2>` +
      (meta ? `<p class="meta">${meta}</p>` : "") +
      paras(p.description || p.summary) +
      chips(p.tech) +
      (p.links && p.links.length ? `<div class="actions">${p.links.map((l, i) => button(l, i === 0)).join("")}</div>` : "") +
      "</div>" +
      (gallery.length
        ? `<div class="gallery">${gallery.map((src) => `<a class="card" href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`).join("")}</div>`
        : "") +
      "</article>"
    );
  }

  function about(user) {
    const facts = user.facts || [];
    return (
      '<section class="about">' +
      '<div class="about-head card">' +
      `<div class="mii-frame">${avatar(user)}</div>` +
      `<div><h2>${esc(user.name)}</h2>${user.tagline ? `<p class="meta">${esc(user.tagline)}</p>` : ""}</div>` +
      "</div>" +
      (user.bio ? `<div class="card">${paras(user.bio)}</div>` : "") +
      (user.skills && user.skills.length ? `<div class="card"><h3>Skills</h3>${chips(user.skills)}</div>` : "") +
      (facts.length
        ? `<div class="card"><dl class="facts">${facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join("")}</dl></div>`
        : "") +
      '<div class="actions"><a class="pill primary" href="#/contact">Get in touch</a></div>' +
      "</section>"
    );
  }

  function contact(data) {
    const friends = (data.friends || []).slice();
    if (data.email) friends.unshift({ name: "Email", handle: data.email, url: `mailto:${data.email}`, color: "#14bfd6" });
    return (
      (data.intro ? `<div class="card intro">${paras(data.intro)}</div>` : "") +
      (friends.length
        ? '<ul class="list friends">' +
          friends
            .map(
              (f) =>
                `<li><a class="row card" href="${esc(f.url)}"${external(f.url)}>` +
                `<span class="badge-icon" style="--c:${esc(f.color || "#14bfd6")}">${initial(f.name)}</span>` +
                `<span class="row-text"><strong>${esc(f.name)}</strong><small>${esc(f.handle || host(f.url))}</small></span>` +
                '<span class="pill">Open</span></a></li>'
            )
            .join("") +
          "</ul>"
        : empty("No friends added yet."))
    );
  }

  function blog(data, user) {
    const posts = data.posts || [];
    if (!posts.length) return empty("No posts yet.");
    return (
      '<div class="posts">' +
      posts
        .map(
          (post, i) =>
            '<article class="post card">' +
            `<header><span class="post-mii">${avatar(user)}</span><span class="row-text"><strong>${esc(user.name)}</strong><small>${date(post.date)}</small></span></header>` +
            (post.title ? `<h3>${esc(post.title)}</h3>` : "") +
            paras(post.text) +
            (post.image ? `<img class="post-image" src="${esc(post.image)}" alt="" loading="lazy">` : "") +
            `<footer><button class="yeah" type="button" data-yeah="${esc(post.id || post.title || i)}">Yeah!</button></footer>` +
            "</article>"
        )
        .join("") +
      "</div>"
    );
  }

  function services(data) {
    const items = data.items || [];
    return (
      (data.intro ? `<div class="card intro">${paras(data.intro)}</div>` : "") +
      (items.length
        ? '<div class="shop-grid">' +
          items
            .map(
              (s) =>
                '<div class="shop-item card">' +
                (s.price ? `<span class="price">${esc(s.price)}</span>` : "") +
                `<h3>${esc(s.title)}</h3>${paras(s.text)}` +
                '<div class="actions"><a class="pill primary" href="#/contact">Get in touch</a></div>' +
                "</div>"
            )
            .join("") +
          "</div>"
        : empty("Nothing on offer right now."))
    );
  }

  function links(data) {
    const list = data.links || [];
    if (!list.length) return empty("No bookmarks yet.");
    return (
      '<ul class="list">' +
      list
        .map(
          (l) =>
            `<li><a class="row card go" href="${esc(l.url)}"${external(l.url)}>` +
            `<span class="badge-icon globe">${initial(l.title || host(l.url))}</span>` +
            `<span class="row-text"><strong>${esc(l.title || host(l.url))}</strong><small>${esc(host(l.url))}${l.note ? ` · ${esc(l.note)}` : ""}</small></span>` +
            "</a></li>"
        )
        .join("") +
      "</ul>"
    );
  }

  function embed(url) {
    const yt = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
    if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    const vimeo = /vimeo\.com\/(\d+)/.exec(url);
    if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Video" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    if (/\.(mp4|webm|ogv)(\?|$)/i.test(url)) return `<video src="${esc(url)}" controls preload="metadata" playsinline></video>`;
    return `<a class="pill primary" href="${esc(url)}"${external(url)}>Watch</a>`;
  }

  function videos(data) {
    const list = data.videos || [];
    if (!list.length) return empty("No videos yet.");
    return (
      '<div class="videos">' +
      list.map((v) => `<div class="video card"><div class="video-frame">${embed(v.url)}</div><h3>${esc(v.title)}</h3>${paras(v.note)}</div>`).join("") +
      "</div>"
    );
  }

  function news(data) {
    const items = data.items || [];
    if (!items.length) return empty("No notifications.");
    return (
      '<ul class="list">' +
      items
        .map(
          (n) =>
            '<li class="row card news-item">' +
            '<span class="unread" aria-hidden="true"></span>' +
            `<span class="row-text"><small>${date(n.date)}</small><strong>${esc(n.title)}</strong>${paras(n.text)}</span>` +
            "</li>"
        )
        .join("") +
      "</ul>"
    );
  }

  function downloads(data) {
    const files = data.files || [];
    if (!files.length) return empty("Nothing to download yet.");
    return (
      '<ul class="list">' +
      files
        .map((f) => {
          const ext = (String(f.file).split(".").pop() || "file").slice(0, 4).toUpperCase();
          return (
            '<li class="row card">' +
            `<span class="badge-icon file">${esc(ext)}</span>` +
            `<span class="row-text"><strong>${esc(f.title)}</strong>${f.note ? `<small>${esc(f.note)}</small>` : ""}</span>` +
            `<a class="pill primary" href="${esc(f.file)}" download>Download</a>` +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function text(data) {
    return `<div class="card">${paras(data.text)}</div>`;
  }

  const builtIn = { contact, blog, services, links, videos, news, downloads, credits: text };

  // Wire up the bits of a rendered page that need behaviour.
  function mount(root) {
    root.querySelectorAll("[data-yeah]").forEach((btn) => {
      const key = `wiiu-yeah:${btn.dataset.yeah}`;
      const read = () => {
        try {
          return localStorage.getItem(key) === "1";
        } catch (e) {
          return false;
        }
      };
      const paint = (on) => {
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", String(on));
      };
      paint(read());
      btn.addEventListener("click", () => {
        const on = !btn.classList.contains("on");
        paint(on);
        try {
          localStorage.setItem(key, on ? "1" : "0");
        } catch (e) {}
      });
    });
  }

  return { esc, project, about, builtIn, mount, tileArt };
})();
