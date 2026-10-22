(() => {
  const config = window.WIIU_CONFIG || {};
  const Pages = window.WiiPages;
  const apps = config.apps || [];
  const dockItems = config.dock || [];
  const user = config.user || {};
  const PER_PAGE = 15;

  const $ = (id) => document.getElementById(id);
  const track = $("track");
  const viewport = $("viewport");
  const dots = $("dots");
  const prevBtn = $("prev");
  const nextBtn = $("next");
  const launchEl = $("launch");
  const launchTitle = $("launchTitle");
  const launchIcon = $("launchIcon");
  const launchSplash = $("launchSplash");
  const launchBody = $("launchBody");
  const folderView = $("folderView");
  const folderGrid = $("folderGrid");
  const tvEl = $("tv");

  const portrait = window.matchMedia("(max-aspect-ratio: 1/1)");
  const pageCount = Math.max(config.minPages || 1, Math.ceil(apps.length / PER_PAGE));

  let page = 0;
  let selected = -1;      // global slot index on the main grid, -1 = none
  let openFrom = null;    // element the app window grew out of

  const cols = () => (portrait.matches ? 3 : 5);
  const isFolder = (item) => Array.isArray(item.apps) || Boolean(item.folder);

  // ---- Sound: UI blips and the menu music share one context and one mute switch ----

  const audio = (() => {
    let ctx = null;
    let master = null;
    let muted = false;
    try {
      muted = localStorage.getItem("wiiu-muted") === "1";
    } catch (e) {}

    const context = () => {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain();
          master.gain.value = muted ? 0 : 1;
          master.connect(ctx.destination);
        } catch (e) {
          ctx = null;
        }
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    };

    const tone = (from, to, dur, { type = "sine", gain = 0.06, delay = 0 } = {}) => {
      if (!config.sounds || muted) return;
      const c = context();
      if (!c) return;
      const t = c.currentTime + delay;
      const osc = c.createOscillator();
      const amp = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp).connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };

    // Music is fetched up front but can only start after the visitor's first click or key press.
    const music = typeof config.music === "string" ? { src: config.music } : config.music;
    const musicData = music
      ? fetch(music.src).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
      : Promise.resolve(null);
    let musicStarted = false;

    async function startMusic() {
      if (musicStarted || !music) return;
      musicStarted = true;
      const c = context();
      const data = await musicData;
      if (!c || !data) return;
      try {
        const buffer = await new Promise((resolve, reject) => c.decodeAudioData(data, resolve, reject));
        const src = c.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        if (music.loopEnd) {
          src.loopStart = music.loopStart || 0;
          src.loopEnd = music.loopEnd;
        }
        const fade = c.createGain();
        fade.gain.setValueAtTime(0, c.currentTime);
        fade.gain.linearRampToValueAtTime(music.volume == null ? 0.35 : music.volume, c.currentTime + 2);
        src.connect(fade).connect(master);
        src.start(0, music.loopStart || 0);
      } catch (e) {}
    }

    const unlock = () => {
      context();
      startMusic();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);

    return {
      get muted() {
        return muted;
      },
      setMuted(on) {
        muted = on;
        try {
          localStorage.setItem("wiiu-muted", on ? "1" : "0");
        } catch (e) {}
        if (master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.05);
      },
      sfx: {
        select: () => tone(1500, 1900, 0.05, { gain: 0.05 }),
        move: () => tone(1100, 1200, 0.035, { gain: 0.03 }),
        page: () => tone(420, 760, 0.12, { type: "triangle", gain: 0.05 }),
        open: () => {
          tone(660, 660, 0.09);
          tone(990, 990, 0.12, { delay: 0.07 });
          tone(1320, 1320, 0.2, { delay: 0.14, gain: 0.05 });
        },
        back: () => tone(900, 500, 0.12, { type: "triangle", gain: 0.05 }),
        none: () => tone(220, 180, 0.08, { type: "square", gain: 0.02 }),
      },
    };
  })();
  const sfx = audio.sfx;

  // ---- Artwork ----

  const grad = (id, top, bottom) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

  const PEOPLE =
    '<circle cx="40" cy="19" r="9"/><rect x="31" y="30" width="18" height="22" rx="6"/><path d="M31 35l-7 11M49 35l7 11"/>' +
    '<rect x="33" y="50" width="5" height="16" rx="2.5"/><rect x="42" y="50" width="5" height="16" rx="2.5"/>' +
    '<circle cx="20" cy="31" r="7"/><rect x="13" y="39" width="14" height="16" rx="5"/>' +
    '<rect x="14.5" y="53" width="4" height="12" rx="2"/><rect x="21.5" y="53" width="4" height="12" rx="2"/>' +
    '<circle cx="60" cy="31" r="7"/><rect x="53" y="39" width="14" height="16" rx="5"/>' +
    '<rect x="54.5" y="53" width="4" height="12" rx="2"/><rect x="61.5" y="53" width="4" height="12" rx="2"/>';

  const BUBBLE_PATH = "M15 8h50a9 9 0 0 1 9 9v36a9 9 0 0 1-9 9H48l-8 10-8-10H15a9 9 0 0 1-9-9V17a9 9 0 0 1 9-9z";

  const GLYPHS = {
    friends:
      `<defs>${grad("i-fr", "#ffa63c", "#f27812")}${grad("i-fr2", "#ffffff", "#ebeae6")}</defs>` +
      '<rect x="6" y="12" width="68" height="62" rx="11" fill="#c2560b"/>' +
      '<rect x="6" y="6" width="68" height="62" rx="11" fill="url(#i-fr)"/>' +
      '<rect x="14" y="14" width="52" height="46" rx="5" fill="url(#i-fr2)"/>' +
      '<rect x="28" y="23" width="6" height="12" rx="3" fill="#f5891f"/>' +
      '<rect x="46" y="23" width="6" height="12" rx="3" fill="#f5891f"/>' +
      '<path d="M27 43q13 11 26 0" fill="none" stroke="#f5891f" stroke-width="5" stroke-linecap="round"/>',
    community:
      `<defs>${grad("i-cm", "#5fd63c", "#2da51b")}</defs>` +
      `<g transform="translate(0 4)" fill="#1d8510" stroke="#1d8510" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">${PEOPLE}</g>` +
      `<g fill="url(#i-cm)" stroke="url(#i-cm)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">${PEOPLE}</g>` +
      `<g fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${PEOPLE}</g>` +
      '<circle cx="36.5" cy="18" r="1.4" fill="#2aa31a"/><circle cx="43.5" cy="18" r="1.4" fill="#2aa31a"/>' +
      '<path d="M36 22q4 3 8 0" stroke="#2aa31a" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    shop:
      `<defs>${grad("i-sh", "#ffcc3d", "#f6a70c")}</defs>` +
      '<path d="M29 24v-7a11 11 0 0 1 22 0v7" fill="none" stroke="#e39a06" stroke-width="5"/>' +
      '<path d="M15 27h50l5 46H10z" fill="#c88400" stroke="#c88400" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M15 24h50l5 46H10z" fill="url(#i-sh)" stroke="url(#i-sh)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M15 24h50l2.2 20Q42 54 12.6 46z" fill="#fff" opacity=".2"/>',
    browser:
      `<defs>${grad("i-br", "#3786ff", "#0c45cc")}${grad("i-br2", "#ffffff", "#d5d9e0")}` +
      '<clipPath id="i-brc"><circle cx="40" cy="38" r="27"/></clipPath></defs>' +
      '<circle cx="40" cy="42" r="35" fill="#0a36a2"/>' +
      '<circle cx="40" cy="38" r="35" fill="url(#i-br)"/>' +
      '<circle cx="40" cy="38" r="27" fill="url(#i-br2)"/>' +
      '<g clip-path="url(#i-brc)" fill="none" stroke="#1a5fe6" stroke-width="5"><path d="M10 38h60M10 25h60M10 51h60"/><ellipse cx="40" cy="38" rx="12" ry="28"/></g>' +
      '<path d="M17 25a26 26 0 0 1 19-14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>',
    tv:
      `<defs>${grad("i-tv", "#ff4d55", "#e3202b")}${grad("i-tv2", "#ffffff", "#e9e9e9")}</defs>` +
      '<path d="M31 53h18v8h11a5 5 0 0 1 5 5v5H15v-5a5 5 0 0 1 5-5h11z" fill="#a8121b"/>' +
      '<path d="M31 50h18v8h11a5 5 0 0 1 5 5v5H15v-5a5 5 0 0 1 5-5h11z" fill="url(#i-tv)"/>' +
      '<rect x="6" y="11" width="68" height="44" rx="8" fill="#a8121b"/>' +
      '<rect x="6" y="7" width="68" height="44" rx="8" fill="url(#i-tv)"/>' +
      '<rect x="14" y="14" width="52" height="30" rx="2" fill="url(#i-tv2)"/>',
    notifications:
      `<defs>${grad("i-nt", "#46d6e6", "#12a7bf")}</defs>` +
      `<path d="${BUBBLE_PATH}" transform="translate(0 3)" fill="#0b7d90"/>` +
      `<path d="${BUBBLE_PATH}" fill="url(#i-nt)"/>` +
      '<rect x="14" y="15" width="52" height="40" rx="5" fill="#fff"/>' +
      '<path d="M23 25h34M23 35h34M23 45h34" stroke="#1fb3ca" stroke-width="5" stroke-linecap="round"/>',
    downloads:
      `<defs>${grad("i-dl", "#3fb2ff", "#0d6fe0")}</defs>` +
      '<g stroke-width="6" stroke-linejoin="round">' +
      '<path d="M66 38v26l-26 10V48z" fill="#0c5fc8" stroke="#0c5fc8"/>' +
      '<path d="M14 38v26l26 10V48z" fill="url(#i-dl)" stroke="url(#i-dl)"/>' +
      '<path d="M14 38l26-10 26 10-26 10z" fill="#6cc8ff" stroke="#6cc8ff"/></g>' +
      '<path d="M19 47l16 6v15l-16-6z" fill="#fff" opacity=".95"/>' +
      '<path d="M33 4h14v14h9L40 34 24 18h9z" fill="#e8e8e8" stroke="#22c3ee" stroke-width="3" stroke-linejoin="round"/>',
    usb:
      `<defs>${grad("i-us", "#4fdcec", "#13b5cc")}</defs>` +
      '<path d="M15 10h30l9 20v16a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V30z" fill="url(#i-us)"/>' +
      '<path d="M17 14h26l6.5 14h-39z" fill="#eafcff"/>' +
      '<path d="M19 41h22M37 38l4 3-4 3M25 41l3-4h4M29 41l3 3h3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="18" cy="41" r="2" fill="#fff"/>',
    swap:
      '<rect x="10" y="5" width="60" height="40" rx="4" fill="#7a7a7a"/>' +
      '<rect x="16" y="11" width="48" height="28" rx="1" fill="#f4f4f4"/>' +
      '<path d="M18 52h44a9 9 0 0 1 9 9v6a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7v-6a9 9 0 0 1 9-9z" fill="#7a7a7a"/>' +
      '<rect x="27" y="56" width="26" height="14" rx="1" fill="#f4f4f4"/>' +
      '<circle cx="18" cy="60" r="2.2" fill="#f4f4f4"/><circle cx="62" cy="67" r="1.6" fill="#f4f4f4"/>' +
      '<path d="M60 58.5v5M57.5 61h5" stroke="#f4f4f4" stroke-width="1.8"/>' +
      '<path d="M40 14l12 12h-7v30h7L40 68 28 56h7V26h-7z" fill="#17b5c6"/>',
  };

  const GLYPH_VIEWBOX = { usb: "0 0 60 60" };

  const DEFAULT_AVATAR =
    '<svg viewBox="0 0 96 96" aria-hidden="true">' +
    '<path d="M22 96c2-16 12-24 26-24s24 8 26 24z" fill="#3a7bd5"/>' +
    '<rect x="42" y="62" width="12" height="12" fill="#f2c9a0"/>' +
    '<ellipse cx="48" cy="46" rx="20" ry="23" fill="#f6d3b0"/>' +
    '<path d="M27 44c-1-17 9-27 21-27s23 9 21 27c-4-8-10-12-21-12s-17 4-21 12z" fill="#5b3a26"/>' +
    '<ellipse cx="40.5" cy="48" rx="2.3" ry="3.4" fill="#2b2b2b"/>' +
    '<ellipse cx="55.5" cy="48" rx="2.3" ry="3.4" fill="#2b2b2b"/>' +
    '<path d="M42 58q6 4 12 0" fill="none" stroke="#b5584f" stroke-width="2.2" stroke-linecap="round"/>' +
    "</svg>";

  const glyphSvg = (name) =>
    `<svg viewBox="${GLYPH_VIEWBOX[name] || "0 0 80 80"}" aria-hidden="true">${GLYPHS[name]}</svg>`;

  const iconMarkup = (item) => {
    if (item.icon) return `<img src="${item.icon}" alt="" draggable="false">`;
    if (item.glyph && GLYPHS[item.glyph]) return glyphSvg(item.glyph);
    return "";
  };

  // Background: two copies of the video crossfade near the end, so the loop has no visible jump.
  const bg = $("bg");
  const videos = Array.from(bg.querySelectorAll("video"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (config.backgroundPoster) bg.style.background = `url("${config.backgroundPoster}") center / cover`;
  const VIDEO_TYPES = { webm: 'video/webm; codecs="vp9"', mp4: 'video/mp4; codecs="avc1.640028"' };
  const sources = [].concat(config.background || []).filter((src) => {
    const type = VIDEO_TYPES[src.split(".").pop().toLowerCase()];
    return !type || videos[0].canPlayType(type) !== "";
  });
  if (!sources.length || reduceMotion) {
    videos.forEach((v) => v.remove());
  } else {
    const FADE = 1.5;
    let active = videos[0];
    const swap = () => {
      const next = videos.find((v) => v !== active);
      next.currentTime = 0;
      next.play().catch(() => {});
      next.classList.add("on");
      active.classList.remove("on");
      const old = active;
      active = next;
      setTimeout(() => old.pause(), FADE * 1000 + 200);
    };
    // A missing or broken file falls through to the next format
    let source = 0;
    const useSource = () => videos.forEach((v) => { v.src = sources[source]; });
    videos[0].addEventListener("error", () => {
      if (++source >= sources.length) return videos.forEach((v) => v.remove());
      useSource();
      active.play().catch(() => {});
    });
    useSource();
    videos.forEach((v) => {
      v.addEventListener("timeupdate", () => {
        if (v === active && v.duration && v.currentTime > v.duration - FADE) swap();
      });
      v.addEventListener("ended", () => { if (v === active) swap(); });
    });
    active.addEventListener("playing", () => active.classList.add("on"), { once: true });
    active.play().catch(() => {});
  }

  const avatarMarkup = () =>
    user.avatar ? `<img src="${Pages.esc(user.avatar)}" alt="" draggable="false">` : DEFAULT_AVATAR;

  const wellMarkup = (app) => {
    const label = app.label ? `<span class="label">${Pages.esc(app.label)}</span>` : "";
    if (app.icon) return `<span class="well"><img src="${Pages.esc(app.icon)}" alt="" draggable="false"></span>`;
    if (isFolder(app)) return `<span class="well">${'<span class="cell"></span>'.repeat(9)}${label}</span>`;
    return `<span class="well">${label}</span>`;
  };

  function makeSlot(app, index) {
    let slot;
    if (app) {
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = `slot glass app${isFolder(app) ? " folder" : ""}`;
      slot.setAttribute("aria-label", app.title || "");
      slot.style.setProperty("--c", app.color || "#9a9a9a");
      slot.innerHTML = wellMarkup(app);
    } else {
      slot = document.createElement("div");
      slot.className = "slot glass empty";
      slot.innerHTML = '<span class="well"></span>';
    }
    slot.dataset.index = index;
    return slot;
  }

  // ---- Routes: every page that can open in the app window, addressable as #/<id> ----

  const PAGE_TITLES = {
    contact: "Contact", blog: "Blog", services: "Services", links: "Links",
    videos: "Videos", news: "News", downloads: "Downloads", credits: "About This Site",
  };
  const routes = {};
  const routeOf = new Map();
  const slug = (s) =>
    String(s || "item").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-") || "item";

  // Each app window takes a theme colour, like the console's own apps
  const PAGE_COLORS = {
    about: "#14bfd6", contact: "#f28c26", blog: "#4cb51c", services: "#f39a12", links: "#2c74e8",
    videos: "#e3202b", news: "#14b3c7", downloads: "#1f86e8", credits: "#7b8786",
  };
  routes.about = { title: user.name || "About Me", icon: avatarMarkup(), color: PAGE_COLORS.about, render: () => Pages.about(user) };
  Object.keys(Pages.builtIn).forEach((name) => {
    routes[name] = {
      title: PAGE_TITLES[name] || name,
      icon: "",
      color: PAGE_COLORS[name],
      render: () => Pages.builtIn[name]((config.pages || {})[name] || {}, user),
    };
  });
  [...dockItems, config.cornerLeft].forEach((item) => {
    if (item && item.page && routes[item.page]) {
      routes[item.page].title = item.title || routes[item.page].title;
      routes[item.page].icon = iconMarkup(item);
    }
  });

  (function addProjects(list) {
    list.forEach((item) => {
      if (isFolder(item)) return addProjects(item.apps || []);
      if (item.url || item.page) return;
      let id = `p/${slug(item.title)}`;
      for (let n = 2; routes[id]; n++) id = `p/${slug(item.title)}-${n}`;
      routes[id] = {
        title: item.title || "",
        icon: Pages.tileArt(item),
        color: item.color,
        render: () => (item.content != null ? item.content : Pages.project(item)),
      };
      routeOf.set(item, id);
    });
  })(apps);

  // ---- Build ----

  $("userAvatar").innerHTML = avatarMarkup();
  if (user.name) $("user").setAttribute("aria-label", user.name);

  const pages = [];
  for (let p = 0; p < pageCount; p++) {
    const pageEl = document.createElement("div");
    pageEl.className = "page";
    pageEl.style.left = `calc(var(--page-pitch) * ${p} - var(--grid-w) / 2)`;
    for (let i = 0; i < PER_PAGE; i++) {
      const index = p * PER_PAGE + i;
      const slot = makeSlot(apps[index], index);
      slot.style.setProperty("--n", i);
      slot.style.setProperty("--col", i % cols());
      pageEl.appendChild(slot);
    }
    track.appendChild(pageEl);
    pages.push(pageEl);

    const dot = document.createElement("span");
    dot.className = "dot";
    dots.appendChild(dot);
  }

  const slots = Array.from(track.querySelectorAll(".slot"));

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const hoverBubble = document.createElement("div");
  hoverBubble.className = "bubble small";

  function hoverLabel(el, text) {
    el.addEventListener("mouseenter", () => {
      if (!text) return;
      hoverBubble.textContent = text;
      el.appendChild(hoverBubble);
    });
    el.addEventListener("mouseleave", () => hoverBubble.remove());
  }

  const dock = $("dock");
  dockItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dock-item";
    btn.setAttribute("aria-label", item.title || "");
    btn.innerHTML = iconMarkup(item);
    hoverLabel(btn, item.title);
    btn.addEventListener("click", () => activate(item, btn));
    btn.style.setProperty("--n", dock.children.length);
    dock.appendChild(btn);
  });

  [["cornerLeft", config.cornerLeft], ["cornerRight", config.cornerRight]].forEach(([id, item]) => {
    const btn = $(id);
    if (!item) return btn.remove();
    btn.setAttribute("aria-label", item.title || "");
    btn.innerHTML = iconMarkup(item);
    hoverLabel(btn, item.title);
    btn.addEventListener("click", () => activate(item, btn));
  });

  // ---- Selection ----

  const selectedApp = () => (selected >= 0 ? apps[selected] : null);

  // Shows the name bubble on a tile; below it when the tile is in the top row.
  function showBubble(slot, text, row) {
    bubble.remove();
    if (!text) return;
    bubble.textContent = text;
    bubble.classList.toggle("below", row === 0);
    slot.appendChild(bubble);
  }

  function select(index, { sound = true } = {}) {
    if (selected >= 0) slots[selected].classList.remove("selected");
    bubble.remove();
    selected = index;
    if (selected < 0) return;
    const slot = slots[selected];
    slot.classList.add("selected");
    const app = apps[selected];
    if (app) showBubble(slot, app.title, Math.floor((selected % PER_PAGE) / cols()));
    if (sound) app ? sfx.select() : sfx.move();
  }

  function goTo(p, { sound = true, keepSelection = false } = {}) {
    const next = Math.max(0, Math.min(pageCount - 1, p));
    if (next !== page) {
      if (sound) sfx.page();
      if (!keepSelection) select(-1, { sound: false });
    }
    if (next !== page && !reduceMotion) {
      track.dataset.dir = next > page ? "next" : "prev";
      track.classList.remove("paging");
      void track.offsetWidth;
      track.classList.add("paging");
      clearTimeout(goTo.timer);
      goTo.timer = setTimeout(() => track.classList.remove("paging"), 700);
    }
    page = next;
    track.style.transform = `translateX(calc(var(--page-pitch) * ${-page}))`;
    pages.forEach((el, i) => el.classList.toggle("current", i === page));
    Array.from(dots.children).forEach((d, i) => d.classList.toggle("active", i === page));
    prevBtn.classList.toggle("off", page === 0);
    nextBtn.classList.toggle("off", page === pageCount - 1);
  }

  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  // Whatever a tile, dock icon or bubble points at: a folder, a page, a link or the TV screen.
  function press(el) {
    if (el && !reduceMotion && el.animate) el.animate([{ scale: 1 }, { scale: 0.9 }, { scale: 1 }], { duration: 260, easing: "ease-out" });
  }

  function activate(item, el) {
    if (item.page || item.url || isFolder(item) || routeOf.has(item)) press(el);
    if (isFolder(item)) return openFolder(item, el);
    if (item.action === "tv") return toggleTv();
    if (item.page === "menu") return hideTv();
    if (item.url) {
      sfx.open();
      window.open(item.url, "_blank", "noopener");
      return;
    }
    const id = item.page || routeOf.get(item);
    if (id && routes[id]) return openRoute(id, el);
    sfx.none();
    if (el) bump(el);
  }

  // ---- App window ----

  let current = null;
  let stack = [];
  let zoomAnim = null;

  // The window zooms out of the tile it was opened from (or the screen centre) and back into it.
  function zoom(reverse) {
    if (zoomAnim) zoomAnim.cancel();
    zoomAnim = null;
    if (reduceMotion || !launchEl.animate) return null;
    let r = openFrom && document.contains(openFrom) ? openFrom.getBoundingClientRect() : null;
    if (!r || !r.width) r = { left: innerWidth / 2 - 60, top: innerHeight / 2 - 60, width: 120, height: 120 };
    const small = { transform: `translate(${r.left}px, ${r.top}px) scale(${r.width / innerWidth}, ${r.height / innerHeight})`, opacity: 0.4 };
    const full = { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1 };
    zoomAnim = launchEl.animate(
      reverse ? [full, small] : [small, full],
      reverse
        ? { duration: 360, delay: 90, easing: "cubic-bezier(0.55, 0, 0.75, 0.25)", fill: "forwards" }
        : { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    return zoomAnim;
  }

  // Containers whose children rise one by one instead of the container as a whole
  const RISE_GROUPS = ".project, .about, .list, .posts, .shop-grid, .videos";

  function render(id) {
    const route = routes[id];
    launchEl.style.setProperty("--app", route.color || "#14bfd6");
    launchTitle.textContent = route.title;
    launchIcon.innerHTML = route.icon || "";
    launchBody.innerHTML = route.render();
    launchBody.scrollTop = 0;
    // cards rise in one after another
    const parts = [];
    Array.from(launchBody.children).forEach((el) => {
      if (el.matches(RISE_GROUPS)) parts.push(...el.children);
      else parts.push(el);
    });
    parts.forEach((el, i) => {
      el.classList.add("rise");
      el.style.setProperty("--n", Math.min(i, 8));
    });
    Pages.mount(launchBody);
    document.title = `${route.title} · ${user.name || "Portfolio"}`;
  }

  // Moving between pages inside the window: old content slides away, new content slides in.
  let swapToken = 0;
  function swapTo(id, dir) {
    const token = ++swapToken;
    const done = () => {
      if (token !== swapToken) return;
      launchBody.dataset.dir = dir;
      launchBody.classList.add("swapping");
      render(id);
    };
    if (reduceMotion || !launchBody.animate) return done();
    const shift = dir === "back" ? 40 : -40;
    const out = { duration: 160, easing: "ease-in", fill: "forwards" };
    [launchBody, launchTitle, launchIcon].forEach((el) =>
      el.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: `${shift}px 0` }], out)
    );
    setTimeout(() => {
      [launchBody, launchTitle, launchIcon].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      done();
      [launchTitle, launchIcon].forEach((el) =>
        el.animate([{ opacity: 0, translate: `${-shift}px 0` }, { opacity: 1, translate: "0 0" }], { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
      );
    }, 160);
  }

  function openRoute(id, fromEl, { push = true } = {}) {
    if (!routes[id]) return;
    if (id === current) return;
    hoverBubble.remove();
    if (!launchEl.hidden && launchEl.classList.contains("open")) {
      swapTo(id, "fwd");
      stack.push(id);
      sfx.select();
    } else {
      launchBody.classList.remove("swapping");
      launchBody.dataset.dir = "";
      render(id);
      stack = [id];
      openFrom = fromEl || null;
      launchEl.hidden = false;
      launchEl.classList.remove("open");
      void launchEl.offsetWidth;
      launchEl.classList.add("open");
      zoom(false);
      if (!reduceMotion) {
        launchSplash.innerHTML = routes[id].icon || "";
        launchSplash.classList.remove("show");
        void launchSplash.offsetWidth;
        launchSplash.classList.add("show");
      }
      document.body.classList.add("app-open");
      sfx.open();
      if (fromEl) $("launchClose").focus({ preventScroll: true });
    }
    current = id;
    if (push && location.hash !== `#/${id}`) history.pushState(null, "", `#/${id}`);
  }

  function closeApp({ push = true } = {}) {
    if (launchEl.hidden) return;
    sfx.back();
    launchEl.classList.remove("open");
    document.body.classList.remove("app-open");
    current = null;
    stack = [];
    document.title = `${user.name || "Your Name"} · Portfolio`;
    if (push && location.hash) history.pushState(null, "", location.pathname + location.search);
    const finish = () => {
      launchEl.hidden = true;
      launchBody.innerHTML = "";
      if (zoomAnim) zoomAnim.cancel();
      zoomAnim = null;
      if (openFrom && document.contains(openFrom)) openFrom.focus({ preventScroll: true });
    };
    const shrink = zoom(true);
    // reopening mid-close cancels the shrink, and then nothing here runs
    if (shrink) shrink.finished.then(finish, () => {});
    else finish();
  }

  function back() {
    if (stack.length > 1) history.back();
    else closeApp();
  }

  const routeFromHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, ""));

  window.addEventListener("hashchange", () => {
    const id = routeFromHash();
    if (!id || !routes[id]) return closeApp({ push: false });
    if (id === current) return;
    if (stack.length > 1 && stack[stack.length - 2] === id) {
      stack.pop();
      swapTo(id, "back");
      current = id;
      sfx.back();
      return;
    }
    openRoute(id, null, { push: false });
  });

  $("launchBack").addEventListener("click", back);
  $("launchClose").addEventListener("click", () => closeApp());

  // ---- Folders ----

  let folderItems = [];
  let folderSel = -1;
  let folderFrom = null;

  const folderCols = () => (portrait.matches ? 3 : 5);

  function openFolder(item, el) {
    folderItems = item.apps || [];
    folderSel = -1;
    folderFrom = el || null;
    $("folderTitle").textContent = item.title || "";
    $("folderSwatch").style.setProperty("--c", item.color || "#9a9a9a");
    folderGrid.innerHTML = "";
    folderItems.forEach((app, i) => {
      const slot = makeSlot(app, i);
      slot.style.setProperty("--n", i);
      folderGrid.appendChild(slot);
    });
    if (!folderItems.length) folderGrid.innerHTML = '<p class="folder-empty">This folder is empty.</p>';
    bubble.remove();
    folderView.hidden = false;
    void folderView.offsetWidth;
    folderView.classList.add("open");
    document.body.classList.add("folder-open");
    morph(folderPanel, el, false);
    sfx.open();
    $("folderClose").focus({ preventScroll: true });
  }

  const folderPanel = folderView.querySelector(".folder-panel");

  // Animates the panel between the tile's box and its own (reverse = back into the tile).
  function morph(panel, tile, reverse) {
    if (reduceMotion || !tile || !panel.animate) return null;
    const a = tile.getBoundingClientRect();
    const b = panel.getBoundingClientRect();
    const from = {
      transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width}, ${a.height / b.height})`,
      opacity: 0.3,
    };
    const to = { transform: "none", opacity: 1 };
    return panel.animate(reverse ? [to, from] : [from, to], {
      duration: reverse ? 260 : 420,
      easing: reverse ? "cubic-bezier(0.4, 0, 0.8, 0.4)" : "cubic-bezier(0.34, 1.25, 0.64, 1)",
      fill: reverse ? "forwards" : "none",
    });
  }

  function closeFolder() {
    if (folderView.hidden) return;
    sfx.back();
    const shrink = morph(folderPanel, folderFrom && document.contains(folderFrom) ? folderFrom : null, true);
    folderView.classList.remove("open");
    document.body.classList.remove("folder-open");
    folderItems = [];
    setTimeout(() => {
      if (shrink) shrink.cancel();
      folderView.hidden = true;
      folderGrid.innerHTML = "";
      if (selected >= 0) select(selected, { sound: false });
      if (folderFrom && document.contains(folderFrom)) folderFrom.focus({ preventScroll: true });
    }, 270);
  }

  folderGrid.addEventListener("click", (e) => {
    const slot = e.target.closest(".slot.app");
    if (!slot) return;
    const index = Number(slot.dataset.index);
    if (index === folderSel) return activate(folderItems[index], slot);
    const prev = folderGrid.querySelector(".slot.selected");
    if (prev) prev.classList.remove("selected");
    folderSel = index;
    slot.classList.add("selected");
    showBubble(slot, folderItems[index].title, Math.floor(index / folderCols()));
    sfx.select();
  });

  folderView.addEventListener("click", (e) => {
    if (e.target === folderView) closeFolder();
  });
  $("folderClose").addEventListener("click", closeFolder);

  // ---- TV screen ----

  const tv = config.tv || {};
  $("tvMii").innerHTML = avatarMarkup();
  $("tvName").textContent = user.name || "";
  $("tvTagline").textContent = user.tagline || "";
  const SPOTS = [[2, 20], [72, 16], [2, 62], [72, 60], [38, 84], [38, 3]];
  (tv.bubbles || []).slice(0, SPOTS.length).forEach((b, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tv-bubble glass";
    btn.style.cssText = `left:${SPOTS[i][0]}%;top:${SPOTS[i][1]}%;--i:${i}`;
    btn.innerHTML = `<span class="post-mii">${avatarMarkup()}</span><span>${Pages.esc(b.text)}</span>`;
    btn.addEventListener("click", () => activate(b, btn));
    $("tvBubbles").appendChild(btn);
  });

  function showTv() {
    if (document.body.classList.contains("tv-mode")) return;
    tvEl.hidden = false;
    void tvEl.offsetWidth;
    document.body.classList.add("tv-mode");
    sfx.page();
  }

  function hideTv() {
    if (tvEl.hidden) return;
    document.body.classList.remove("tv-mode");
    sfx.page();
    setTimeout(() => { if (!document.body.classList.contains("tv-mode")) tvEl.hidden = true; }, 450);
  }

  function toggleTv() {
    document.body.classList.contains("tv-mode") ? hideTv() : showTv();
  }

  $("tvMenu").addEventListener("click", hideTv);

  // ---- Mute ----

  const muteBtn = $("mute");
  const paintMute = () => {
    muteBtn.classList.toggle("muted", audio.muted);
    muteBtn.setAttribute("aria-pressed", String(audio.muted));
    muteBtn.setAttribute("aria-label", audio.muted ? "Unmute sound" : "Mute sound");
  };
  muteBtn.addEventListener("click", () => {
    audio.setMuted(!audio.muted);
    paintMute();
    sfx.select();
  });
  paintMute();

  // ---- Input ----

  let suppressClick = false;

  track.addEventListener("click", (e) => {
    if (suppressClick) return;
    const slot = e.target.closest(".slot");
    if (!slot) return select(-1, { sound: false });
    const index = Number(slot.dataset.index);
    const slotPage = Math.floor(index / PER_PAGE);
    if (slotPage !== page) return goTo(slotPage);
    if (!apps[index]) return select(-1, { sound: false });
    if (index === selected) activate(apps[index], slot);
    else select(index);
  });

  prevBtn.addEventListener("click", () => goTo(page - 1));
  nextBtn.addEventListener("click", () => goTo(page + 1));
  dots.addEventListener("click", (e) => {
    const i = Array.from(dots.children).indexOf(e.target.closest(".dot"));
    if (i >= 0) goTo(i);
  });

  $("user").addEventListener("click", (e) => openRoute("about", e.currentTarget));
  hoverLabel($("user"), user.name);

  // Swipe between pages
  let dragStart = null;
  let dragX = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragX = 0;
    suppressClick = false;
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragStart || e.pointerId !== dragStart.id) return;
    const dx = e.clientX - dragStart.x;
    if (!suppressClick && Math.abs(dx) < 8) return;
    if (!suppressClick) {
      if (Math.abs(e.clientY - dragStart.y) > Math.abs(dx)) return (dragStart = null);
      suppressClick = true;
      track.classList.add("dragging");
      viewport.setPointerCapture(e.pointerId);
    }
    const atEdge = (dx > 0 && page === 0) || (dx < 0 && page === pageCount - 1);
    dragX = atEdge ? dx * 0.3 : dx;
    track.style.transform = `translateX(calc(var(--page-pitch) * ${-page} + ${dragX}px))`;
  });

  const endDrag = () => {
    if (!dragStart) return;
    dragStart = null;
    track.classList.remove("dragging");
    if (!suppressClick) return;
    const threshold = viewport.clientWidth * 0.08;
    if (dragX < -threshold) goTo(page + 1);
    else if (dragX > threshold) goTo(page - 1);
    else goTo(page, { sound: false });
    setTimeout(() => (suppressClick = false), 0);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  let wheelLock = 0;
  viewport.addEventListener("wheel", (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 10 || Date.now() < wheelLock) return;
    wheelLock = Date.now() + 450;
    goTo(page + (d > 0 ? 1 : -1));
  }, { passive: true });

  // D-pad style keyboard navigation over the grid; Esc backs out of whatever is on top.
  document.addEventListener("keydown", (e) => {
    if (!launchEl.hidden) {
      if (e.key === "Escape") back();
      return;
    }
    if (!folderView.hidden) {
      if (e.key === "Escape") closeFolder();
      return;
    }
    if (document.body.classList.contains("tv-mode")) {
      if (e.key === "Escape") hideTv();
      return;
    }
    const c = cols();
    const rows = PER_PAGE / c;
    if (selected < 0 && e.key.startsWith("Arrow")) {
      e.preventDefault();
      return select(page * PER_PAGE);
    }
    const p = Math.floor(selected / PER_PAGE);
    const i = selected % PER_PAGE;
    const row = Math.floor(i / c);
    const col = i % c;
    let target = selected;

    switch (e.key) {
      case "ArrowRight":
        if (col < c - 1) target = selected + 1;
        else if (p < pageCount - 1) target = (p + 1) * PER_PAGE + row * c;
        break;
      case "ArrowLeft":
        if (col > 0) target = selected - 1;
        else if (p > 0) target = (p - 1) * PER_PAGE + row * c + c - 1;
        break;
      case "ArrowDown":
        if (row < rows - 1) target = selected + c;
        break;
      case "ArrowUp":
        if (row > 0) target = selected - c;
        break;
      case "Enter":
      case " ":
        if (selectedApp() && document.activeElement === document.body) {
          e.preventDefault();
          activate(selectedApp(), slots[selected]);
        }
        return;
      case "Escape":
        return select(-1, { sound: false });
      default:
        return;
    }
    e.preventDefault();
    // Keep Enter going to the keyboard selection rather than a previously clicked tile.
    if (document.activeElement && document.activeElement.classList.contains("slot")) document.activeElement.blur();
    if (target !== selected) {
      const tp = Math.floor(target / PER_PAGE);
      if (tp !== page) goTo(tp, { keepSelection: true });
      select(target);
    }
  });

  portrait.addEventListener("change", () => {
    if (selected >= 0) select(selected, { sound: false });
  });

  goTo(0, { sound: false });

  // Start-up: tiles pop in, dock icons rise, like the console booting into the menu
  if (!reduceMotion) {
    document.body.classList.add("booting");
    setTimeout(() => document.body.classList.remove("booting"), 1800);
  }

  // Deep link (#/contact, #/p/project-one) or the TV intro on first load
  const initial = routeFromHash();
  if (initial && routes[initial]) openRoute(initial, null, { push: false });
  else if (config.startView === "tv") showTv();
})();
