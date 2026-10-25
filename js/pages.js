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

  // ---- Shared pieces ----

  const hueOf = (s) => [...String(s || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 11);
  const count = (n, one, many) => `${n} ${n === 1 ? one : many || `${one}s`}`;

  // A coloured banner across the top of a page, in the app's theme colour
  const banner = (site, name, { kicker = "", title = "", sub = "", actions = "" } = {}) => {
    const r = (site && site.route(name)) || {};
    return (
      `<header class="pg-banner">${fizz()}<span class="pg-orb">${r.icon || ""}</span>` +
      '<div class="pg-banner-text">' +
      (kicker ? `<small>${esc(kicker)}</small>` : "") +
      `<h2>${esc(title || r.title || "")}</h2>` +
      (sub ? `<p>${esc(sub)}</p>` : "") +
      (actions ? `<div class="actions">${actions}</div>` : "") +
      "</div></header>"
    );
  };

  // What a page shows when there's nothing in it yet
  const emptyState = (site, name, title, text) => {
    const r = (site && site.route(name)) || {};
    return `<div class="pg-empty card"><span class="pg-orb">${r.icon || ""}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  };

  // A row of tiles linking to other pages on the site
  const shelf = (title, items) =>
    items.length
      ? `<section class="card shelf"><h3>${esc(title)}</h3><div class="shelf-row stagger">` +
        items
          .map(
            (r) =>
              `<a class="shelf-tile" href="#/${esc(r.id)}"><span class="shelf-art">${r.icon || ""}</span>` +
              `<strong>${esc(r.title)}</strong>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</a>`
          )
          .join("") +
        "</div></section>"
      : "";

  const shortcuts = (site, ids) => ids.map((id) => site.route(id)).filter((r) => r && r.icon);

  // ---- Pages ----

  function project(p, site, id) {
    const images = p.images || [];
    const me = site.projects.find((x) => x.id === id) || {};
    const kind = p.game ? "Game" : me.folder || "Project";
    const meta = [p.year, p.role].filter(Boolean).map(esc).join(" · ");
    const art = images[0] ? `<img src="${esc(images[0])}" alt="">` : tileArt(p);
    const backdrop = p.icon || images[0];
    const links = p.links || [];

    // more from the same folder, or else more of the same kind
    let more = site.projects.filter((x) => x.id !== id && (p.game ? x.game : !x.game && x.folder === me.folder));
    if (!more.length) more = site.projects.filter((x) => x.id !== id && x.game === Boolean(p.game));
    if (!more.length) more = site.projects.filter((x) => x.id !== id);

    const details = [
      ["Category", kind],
      ["Year", p.year],
      [p.game ? "Developer" : "Role", p.role],
    ].filter(([, v]) => v);

    return (
      `<header class="pj-hero" style="--c:${esc(p.color || "#14bfd6")};--c2:${esc(p.color2 || p.color || "#0b8eab")}">` +
      (backdrop ? `<span class="pj-backdrop" style="background-image:url('${esc(fileUrl(backdrop))}')"></span>` : "") +
      fizz() +
      `<span class="pj-cover">${art}</span>` +
      '<div class="pj-hero-text">' +
      `<small>${esc(kind)}</small><h2>${esc(p.title)}</h2>` +
      (meta ? `<p>${meta}</p>` : "") +
      (links.length ? `<div class="actions">${links.map((l, i) => button(l, i === 0)).join("")}</div>` : "") +
      "</div></header>" +
      '<div class="pj-cols">' +
      `<div class="card"><h3>About</h3>${paras(p.description || p.summary) || '<p class="meta">More details coming soon.</p>'}</div>` +
      '<aside class="card pj-details"><h3>Details</h3>' +
      (details.length ? `<dl class="facts">${details.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "") +
      (p.tech && p.tech.length ? `<h4>${p.game ? "Tags" : "Built with"}</h4>${chips(p.tech)}` : "") +
      "</aside></div>" +
      (images.length > 1
        ? `<section class="card"><h3>Screenshots</h3><div class="gallery">${images
            .slice(1)
            .map((src) => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`)
            .join("")}</div></section>`
        : "") +
      shelf(p.game ? "More games" : `More from ${kind}`, more.slice(0, 8).map((x) => ({ ...x, sub: x.game ? "Game" : x.folder })))
    );
  }

  function about(user, site) {
    const facts = user.facts || [];
    const projects = site.projects.filter((x) => !x.game).length;
    const games = site.projects.filter((x) => x.game).length;
    const stats = [
      { n: projects, label: "Projects" },
      { n: games, label: "Games" },
      { n: site.songs, label: "Songs", href: "#/music" },
      { n: site.hobbies.length, label: "Hobbies", href: "#/hobbies" },
    ];
    return (
      '<header class="ab-hero">' +
      fizz() +
      `<div class="mii-frame">${avatar(user)}</div>` +
      '<div class="pg-banner-text">' +
      '<small>Profile</small>' +
      `<h2>${esc(user.name)}</h2>` +
      (user.tagline ? `<p>${esc(user.tagline)}</p>` : "") +
      '<span class="online">Online</span>' +
      '<div class="actions"><a class="pill primary" href="#/contact">Get in touch</a><a class="pill" href="#/hobbies">My hobbies</a></div>' +
      "</div></header>" +
      '<div class="stats stagger">' +
      stats
        .map((s) => {
          const inner = `<b>${s.n}</b><span>${esc(s.label)}</span>`;
          return s.href ? `<a class="stat" href="${s.href}">${inner}</a>` : `<div class="stat">${inner}</div>`;
        })
        .join("") +
      "</div>" +
      '<div class="pj-cols">' +
      `<div class="card"><h3>About me</h3>${paras(user.bio) || '<p class="meta">More about me coming soon.</p>'}</div>` +
      '<aside class="card">' +
      (user.skills && user.skills.length ? `<h3>Skills</h3>${chips(user.skills)}` : "") +
      (facts.length ? `<h3 class="spaced">Quick facts</h3><dl class="facts">${facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join("")}</dl>` : "") +
      "</aside></div>" +
      shelf("Explore", shortcuts(site, ["hobbies", "music", "contact", "blog", "links", "videos"]))
    );
  }

  function contact(data, user, site) {
    const friends = (data.friends || []).slice();
    if (data.email) friends.unshift({ name: "Email", handle: data.email, url: `mailto:${data.email}`, color: "#14bfd6" });
    return (
      banner(site, "contact", { kicker: user.name, sub: friends.length ? `${count(friends.length, "friend")} · say hi!` : "" }) +
      '<div class="fl-me card">' +
      `<span class="mii-frame">${avatar(user)}</span>` +
      `<div class="row-text"><strong>${esc(user.name)}</strong>${user.tagline ? `<small>${esc(user.tagline)}</small>` : ""}${paras(data.intro)}</div>` +
      '<span class="online">Online</span>' +
      "</div>" +
      (friends.length
        ? '<div class="fl-grid stagger">' +
          friends
            .map(
              (f) =>
                `<a class="fl-card" href="${esc(f.url)}"${external(f.url)} style="--c:${esc(f.color || "#14bfd6")}">` +
                `<span class="fl-head"></span><span class="fl-avatar">${initial(f.name)}</span>` +
                `<strong>${esc(f.name)}</strong><small>${esc(f.handle || host(f.url))}</small><span class="fl-go">Open</span></a>`
            )
            .join("") +
          "</div>"
        : emptyState(site, "contact", "No friends yet", "Links to my profiles will show up here."))
    );
  }

  function blog(data, user, site) {
    const posts = data.posts || [];
    const communities = site.hobbies.filter((h) => h.route);
    return (
      banner(site, "blog", { kicker: "Community", title: `${user.name}'s Posts`, sub: posts.length ? count(posts.length, "post") : "" }) +
      '<div class="mv-cols">' +
      (posts.length
        ? '<div class="posts">' +
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
        : `<div class="posts">${emptyState(site, "blog", "No posts yet", "Check back soon for updates.")}</div>`) +
      '<aside class="mv-side">' +
      `<div class="card mv-me"><span class="mii-frame">${avatar(user)}</span><strong>${esc(user.name)}</strong>` +
      `<div class="mv-counts"><span><b>${posts.length}</b>Posts</span><span><b>${communities.length}</b>Communities</span></div></div>` +
      (communities.length
        ? '<div class="card"><h3>Communities</h3><ul class="mv-comms">' +
          communities.map((h) => `<li><a href="#/${esc(h.route)}"><span class="mv-badge">${hobbyBadge(h)}</span>${esc(h.title)}</a></li>`).join("") +
          "</ul></div>"
        : "") +
      "</aside></div>"
    );
  }

  function services(data, user, site) {
    const items = data.items || [];
    return (
      banner(site, "services", { kicker: "Shop", title: "Services", sub: items.length ? count(items.length, "service") : "" }) +
      (data.intro ? `<div class="card intro">${paras(data.intro)}</div>` : "") +
      (items.length
        ? '<div class="sh-grid stagger">' +
          items
            .map((s) => {
              const h = hueOf(s.title);
              return (
                '<div class="sh-card">' +
                `<span class="sh-art" style="--c:hsl(${h} 80% 58%);--c2:hsl(${(h + 40) % 360} 75% 42%)">${fizz(2)}<b>${initial(s.title)}</b></span>` +
                `<div class="sh-body"><h3>${esc(s.title)}</h3>${paras(s.text)}` +
                `<div class="sh-foot">${s.price ? `<span class="price">${esc(s.price)}</span>` : ""}<a class="pill primary" href="#/contact">Get in touch</a></div>` +
                "</div></div>"
              );
            })
            .join("") +
          "</div>"
        : emptyState(site, "services", "Nothing on offer right now", "Check back soon."))
    );
  }

  function links(data, user, site) {
    const list = data.links || [];
    return (
      banner(site, "links", { kicker: "Internet Browser", title: "Bookmarks", sub: list.length ? count(list.length, "bookmark") : "" }) +
      (list.length
        ? '<div class="br-grid stagger">' +
          list
            .map((l) => {
              const name = l.title || host(l.url);
              const h = hueOf(host(l.url));
              return (
                `<a class="br-tile" href="${esc(l.url)}"${external(l.url)}>` +
                `<span class="br-thumb" style="--c:hsl(${h} 70% 55%);--c2:hsl(${(h + 35) % 360} 75% 40%)">` +
                `<span class="br-chrome"><i></i><i></i><i></i><em>${esc(host(l.url))}</em></span><b>${initial(name)}</b></span>` +
                `<strong>${esc(name)}</strong>${l.note ? `<small>${esc(l.note)}</small>` : `<small>${esc(host(l.url))}</small>`}</a>`
              );
            })
            .join("") +
          "</div>"
        : emptyState(site, "links", "No bookmarks yet", "Favourite links will show up here."))
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

  function videos(data, user, site) {
    const list = data.videos || [];
    return (
      banner(site, "videos", { kicker: "TV", title: "Videos", sub: list.length ? count(list.length, "video") : "" }) +
      (list.length
        ? '<div class="videos stagger">' +
          list.map((v) => `<div class="video card"><div class="video-frame">${embed(v.url)}</div><h3>${esc(v.title)}</h3>${paras(v.note)}</div>`).join("") +
          "</div>"
        : emptyState(site, "videos", "Nothing on TV yet", "Videos and clips will show up here."))
    );
  }

  function news(data, user, site) {
    const items = data.items || [];
    const r = site.route("news") || {};
    return (
      banner(site, "news", { kicker: "Notifications", title: "What's New", sub: items.length ? count(items.length, "update") : "" }) +
      (items.length
        ? '<ul class="nt-list stagger">' +
          items
            .map(
              (n, i) =>
                '<li class="nt-item card">' +
                `<span class="nt-icon">${r.icon || ""}</span>` +
                `<span class="row-text"><span class="nt-top"><small>${date(n.date)}</small>${i === 0 ? '<span class="nt-new">New</span>' : ""}</span>` +
                `<strong>${esc(n.title)}</strong>${paras(n.text)}</span>` +
                "</li>"
            )
            .join("") +
          "</ul>"
        : emptyState(site, "news", "You're all caught up", "There's no news right now."))
    );
  }

  function downloads(data, user, site) {
    const files = data.files || [];
    return (
      banner(site, "downloads", { kicker: "Files", title: "Downloads", sub: files.length ? count(files.length, "file") : "" }) +
      (files.length
        ? '<div class="dl-grid stagger">' +
          files
            .map((f) => {
              const ext = (String(f.file).split(".").pop() || "file").slice(0, 4).toUpperCase();
              return (
                '<div class="dl-card card">' +
                `<span class="dl-file" style="--c:hsl(${hueOf(ext)} 70% 52%)"><b>${esc(ext)}</b></span>` +
                `<span class="row-text"><strong>${esc(f.title)}</strong>${f.note ? `<small>${esc(f.note)}</small>` : ""}</span>` +
                `<a class="pill primary" href="${esc(f.file)}" download>Download</a>` +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : emptyState(site, "downloads", "Nothing to download yet", "Files like my résumé will show up here."))
    );
  }

  function text(data, user, site) {
    return (
      banner(site, "credits", { kicker: "System", sub: "How this site was made" }) +
      `<div class="card">${paras(data.text)}</div>` +
      '<div class="card"><h3>Built with</h3>' +
      chips(["HTML", "CSS", "JavaScript", "No frameworks"]) +
      "</div>"
    );
  }

  // ---- Music: your own songs, listed in music/tracks.js and played by js/player.js ----

  const fileUrl = (f) => String(f).split("/").map(encodeURIComponent).join("/");
  const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

  // Album art over a glossy aqua card carrying the album name (shown until there's art)
  const coverArt = (t) => {
    const h = 170 + (hue(t.album) % 60);
    return (
      `<span class="tile-art game" style="--c:hsl(${h} 75% 55%);--c2:hsl(${h + 20} 80% 26%)">${esc(t.album || t.title)}` +
      (t.cover ? `<img class="cover" src="${esc(fileUrl(t.cover))}" alt="" draggable="false">` : "") +
      "</span>"
    );
  };

  const ICON = {
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
    prev: '<path d="M6 5h2.5v14H6zM20 5.5v13L9.5 12z"/>',
    next: '<path d="M15.5 5H18v14h-2.5zM4 5.5v13L14.5 12z"/>',
    shuffle: '<path d="M3 7h3c2 0 3.2 1 4.4 2.8l2.2 3.4C13.8 15 15 16 17 16h3m0 0-2.5-2.5M20 16l-2.5 2.5M3 16h3c1.3 0 2.3-.4 3.1-1.2m4.3-6.6C14.2 7.4 15.2 7 16.5 7H20m0 0-2.5-2.5M20 7l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    repeat: '<path d="M5 11V9a3 3 0 0 1 3-3h10m0 0-3-3m3 3-3 3M19 13v2a3 3 0 0 1-3 3H6m0 0 3 3m-3-3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    home: '<path d="M12 3 3 11h3v9h4.5v-6h3v6H18v-9h3z"/>',
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;

  // The Music app's frame; js/player.js fills in the views, queue and player bar.
  function music(data) {
    const tracks = window.WIIU_TRACKS || [];
    if (!tracks.length) {
      return (
        '<section class="music"><div class="music-empty card">' +
        '<div class="disc" aria-hidden="true"><span>♪</span></div>' +
        "<h2>No songs yet</h2>" +
        '<ol class="steps">' +
        "<li>Put audio files in the <code>music</code> folder. One folder per album works best, like <code>music/2093/01 Song.mp3</code>.</li>" +
        "<li>Run <code>npm start</code> (or <code>npm run music</code>) to build the song list.</li>" +
        "<li>Refresh this page.</li>" +
        "</ol>" +
        (data.spotify ? `<div class="actions"><a class="pill primary" href="${esc(data.spotify)}" target="_blank" rel="noopener">Open in Spotify</a></div>` : "") +
        "</div></section>"
      );
    }
    const orb = (act, label, name, size) =>
      `<button class="orb${size ? ` ${size}` : ""}" type="button" data-act="${act}" aria-label="${label}">${name ? icon(name) : ""}</button>`;
    return (
      '<section class="music has-songs">' +
      '<nav class="mu-lib mu-panel" aria-label="Your library">' +
      `<button class="mu-lib-home" type="button" data-go="home" aria-label="Home">${icon("home")}</button>` +
      '<div class="mu-lib-list" data-lib></div>' +
      "</nav>" +
      '<div class="mu-main mu-panel">' +
      '<div class="mu-top">' +
      `<button class="mu-round" type="button" data-go="back" aria-label="Back">${icon("back")}</button>` +
      `<label class="mu-search">${icon("search")}<input type="search" placeholder="What do you want to play?" aria-label="Search songs" data-search></label>` +
      "</div>" +
      '<div class="mu-view" data-view></div>' +
      "</div>" +
      '<aside class="mu-queue mu-panel" aria-label="Queue">' +
      '<h3 class="mu-h">Now playing</h3>' +
      '<div class="mu-np-art" data-np-art></div>' +
      '<div class="mu-np-text"><strong data-np-title></strong><small data-np-sub></small></div>' +
      '<canvas class="viz" aria-hidden="true"></canvas>' +
      '<h3 class="mu-h" data-next-label>Next up</h3>' +
      '<ol class="mu-next" data-next></ol>' +
      "</aside>" +
      '<footer class="mu-bar mu-panel">' +
      '<div class="mu-bar-now"><span class="mu-thumb" data-bar-art></span>' +
      '<span class="row-text"><strong data-bar-title></strong><small data-bar-sub></small></span></div>' +
      '<div class="mu-bar-center">' +
      '<div class="np-controls">' +
      orb("shuffle", "Shuffle", "shuffle", "small") +
      orb("prev", "Previous", "prev") +
      `<button class="orb big" type="button" data-act="play" aria-label="Play"><span class="i-play">${icon("play")}</span><span class="i-pause">${icon("pause")}</span></button>` +
      orb("next", "Next", "next") +
      orb("repeat", "Repeat: all", "repeat", "small") +
      "</div>" +
      '<div class="mu-progress"><span data-cur>0:00</span>' +
      '<div class="seek" aria-label="Seek"><span class="seek-fill"><span class="seek-knob"></span></span></div>' +
      "<span data-dur>0:00</span></div>" +
      "</div>" +
      `<label class="vol">${icon("speaker")}<input type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume" data-vol></label>` +
      "</footer>" +
      "</section>"
    );
  }

  // ---- Hobbies ----

  const HOBBY_GLYPHS = {
    game: '<path fill-rule="evenodd" d="M7 7h10a5 5 0 0 1 4.9 6l-.8 4a2.6 2.6 0 0 1-4.5 1.2L14.8 16H9.2l-1.8 2.2A2.6 2.6 0 0 1 2.9 17l-.8-4A5 5 0 0 1 7 7zm0 3v1.5H5.5V13H7v1.5h1.5V13H10v-1.5H8.5V10zm8.8.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>',
    music: '<path d="M9 5.5 20 3v12.2a3 3 0 1 1-2-2.8V7.3l-7 1.6v8.3a3 3 0 1 1-2-2.8z"/>',
    code: '<path d="M8 7 3 12l5 5M16 7l5 5-5 5M13.5 4.5l-3 15" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    camera: '<path fill-rule="evenodd" d="M8.5 5h7l1.5 2H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
    ball: '<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 7.3l3.9 2.8-1.5 4.6H9.6l-1.5-4.6z"/>',
    book: '<path fill-rule="evenodd" d="M3 5h6.5A3 3 0 0 1 12 6.3 3 3 0 0 1 14.5 5H21v13h-6.5a2.5 2.5 0 0 0-2.5 1.5A2.5 2.5 0 0 0 9.5 18H3zm8 3a1.5 1.5 0 0 0-1.5-1H5v9h4.5c.5 0 1 .1 1.5.3zm2 0v8.3c.5-.2 1-.3 1.5-.3H19V7h-4.5A1.5 1.5 0 0 0 13 8z"/>',
    art: '<path fill-rule="evenodd" d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.4-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>',
    travel: '<path d="M21 15.5v-2L13.5 9V4.2a1.5 1.5 0 0 0-3 0V9L3 13.5v2l7.5-2.3v4.6L8.5 19.3V21l3.5-1 3.5 1v-1.7l-2-1.5v-4.6z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  };

  const hobbyColors = (h) => `--c:${esc(h.color || "#ff7a3d")};--c2:${esc(h.color2 || h.color || "#ff3d77")}`;

  const hobbyGlyph = (h) => {
    if (h.icon) return `<img src="${esc(h.icon)}" alt="" draggable="false">`;
    if (h.emoji) return `<span class="hb-emoji">${esc(h.emoji)}</span>`;
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${HOBBY_GLYPHS[h.glyph] || HOBBY_GLYPHS.star}</svg>`;
  };

  // the hobby's glyph on its colours, for the title bar and launch splash
  const hobbyBadge = (h) => `<span class="hb-badge" style="${hobbyColors(h)}">${hobbyGlyph(h)}</span>`;

  // soap bubbles floating in a banner (fewer on small cards, which come several to a page)
  const FIZZ = [
    "--x:78%;--y:24%;--s:30px;--d:-1.6s",
    "--x:14%;--y:62%;--s:22px;--d:0s",
    "--x:86%;--y:70%;--s:14px;--d:-2.9s",
    "--x:30%;--y:18%;--s:12px;--d:-0.8s",
  ];
  const fizz = (n = 4) => FIZZ.slice(0, n).map((st) => `<i class="hb-fizz" style="${st}"></i>`).join("");

  function hobbies(data, user) {
    const items = data.items || [];
    return (
      '<section class="hobbies">' +
      '<div class="hb-intro card">' +
      `<div class="mii-frame">${avatar(user)}</div>` +
      `<div class="row-text"><small>${esc(user.name || "")}</small><h2>My Hobbies</h2>${data.intro ? paras(data.intro) : ""}</div>` +
      "</div>" +
      (items.length
        ? '<div class="hb-grid">' +
          items
            .map(
              (h, n) =>
                `<a class="hb-card" href="#/${esc(h.route)}" style="${hobbyColors(h)};--n:${n}">` +
                `<span class="hb-banner">${fizz(2)}<span class="hb-orb">${hobbyGlyph(h)}</span></span>` +
                `<span class="hb-body"><strong>${esc(h.title)}</strong>${h.tagline ? `<small>${esc(h.tagline)}</small>` : ""}</span>` +
                "</a>"
            )
            .join("") +
          "</div>"
        : empty("No hobbies added yet."))
      + "</section>"
    );
  }

  function hobby(h, related) {
    const favs = h.favorites || [];
    const images = h.images || [];
    return (
      `<article class="hobby" style="${hobbyColors(h)}">` +
      `<header class="hb-hero">${fizz()}<span class="hb-orb big">${hobbyGlyph(h)}</span>` +
      `<div class="hb-hero-text"><small>Hobby</small><h2>${esc(h.title)}</h2>${h.tagline ? `<p>${esc(h.tagline)}</p>` : ""}` +
      (h.since ? `<span class="hb-since">Since ${esc(h.since)}</span>` : "") +
      "</div></header>" +
      '<div class="hb-cols">' +
      `<div class="card">${paras(h.description) || '<p class="meta">Nothing written yet.</p>'}` +
      (h.links && h.links.length ? `<div class="actions">${h.links.map((l, i) => button(l, i === 0)).join("")}</div>` : "") +
      "</div>" +
      (favs.length ? `<div class="card hb-favs"><h3>Favourites</h3><ul>${favs.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : "") +
      "</div>" +
      (related.length
        ? '<div class="card"><h3>On this site</h3><div class="hb-related">' +
          related.map((r) => `<a class="hb-rel" href="#/${esc(r.id)}"><span class="hb-rel-art">${r.icon}</span><strong>${esc(r.title)}</strong></a>`).join("") +
          "</div></div>"
        : "") +
      (images.length
        ? `<div class="gallery">${images.map((src) => `<a class="card" href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`).join("")}</div>`
        : "") +
      "</article>"
    );
  }

  const builtIn = { contact, blog, services, links, videos, news, downloads, music, hobbies, credits: text };

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

  return { esc, project, about, builtIn, mount, tileArt, coverArt, icon, hobby, hobbyBadge };
})();
