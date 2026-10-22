(() => {
  const config = window.WIIU_CONFIG || {};
  const apps = config.apps || [];
  const dockItems = config.dock || [];
  const PER_PAGE = 15;

  const $ = (id) => document.getElementById(id);
  const track = $("track");
  const viewport = $("viewport");
  const dots = $("dots");
  const prevBtn = $("prev");
  const nextBtn = $("next");
  const launchEl = $("launch");
  const launchTitle = $("launchTitle");
  const launchBody = $("launchBody");

  const portrait = window.matchMedia("(max-aspect-ratio: 1/1)");
  const pageCount = Math.max(config.minPages || 1, Math.ceil(apps.length / PER_PAGE));

  let page = 0;
  let selected = -1;      // global slot index, -1 = none
  let openFrom = null;    // element the app window grew out of

  const cols = () => (portrait.matches ? 3 : 5);

  // ---- Sound ----

  const sfx = (() => {
    let ctx = null;
    const ensure = () => {
      if (!config.sounds) return null;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
      } catch (e) {
        ctx = null;
      }
      return ctx;
    };
    const tone = (from, to, dur, { type = "sine", gain = 0.06, delay = 0 } = {}) => {
      const c = ensure();
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
      osc.connect(amp).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    return {
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
    };
  })();

  if (config.music) {
    const music = new Audio(config.music);
    music.loop = true;
    music.volume = 0.4;
    const start = () => {
      music.play().catch(() => {});
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
  }

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

  // Background hardware: the first shape is the body, "detail" shapes are drawn on top of it.
  const GHOST_ART = {
    pad: ["0 0 320 180", '<rect x="4" y="4" width="312" height="172" rx="60"/><rect class="detail" x="88" y="30" width="144" height="100" rx="8"/><circle class="detail" cx="44" cy="62" r="18"/><circle class="detail" cx="276" cy="62" r="18"/><path class="detail" d="M32 116h24M44 104v24"/><circle class="detail" cx="276" cy="116" r="8"/>'],
    remote: ["0 0 80 300", '<rect x="4" y="4" width="72" height="292" rx="30"/><circle class="detail" cx="40" cy="72" r="14"/><path class="detail" d="M28 34h24M40 22v24"/><circle class="detail" cx="40" cy="200" r="7"/><circle class="detail" cx="40" cy="226" r="7"/>'],
    disc: ["0 0 200 200", '<circle cx="100" cy="100" r="96"/><circle class="detail" cx="100" cy="100" r="20"/>'],
    button: ["0 0 160 70", '<rect x="4" y="4" width="152" height="62" rx="31"/>'],
    stylus: ["0 0 30 260", '<rect x="4" y="4" width="22" height="252" rx="11"/>'],
  };

  // z: 0 = far and sharp, 1 = near, blurry and moving most with the pointer
  const GHOSTS = [
    { art: "pad", x: 66, y: 2, w: 360, r: 14, z: 0.9, dx: -30, dy: 20, t: 46 },
    { art: "remote", x: 1, y: 28, w: 70, r: -38, z: 0.6, dx: 25, dy: -25, t: 38 },
    { art: "disc", x: 18, y: -14, w: 230, r: 0, z: 1, dx: 30, dy: 15, t: 52 },
    { art: "button", x: 83, y: 36, w: 170, r: 28, z: 0.5, dx: -20, dy: 25, t: 34 },
    { art: "stylus", x: 47, y: 68, w: 26, r: 62, z: 0.2, dx: 40, dy: -10, t: 42 },
    { art: "pad", x: 6, y: 74, w: 220, r: -16, z: 0.4, dx: 30, dy: -20, t: 48 },
    { art: "remote", x: 88, y: 70, w: 60, r: 20, z: 0.7, dx: -20, dy: -30, t: 40 },
  ];

  const ghostSvg = (art, id) => {
    const [viewBox, body] = GHOST_ART[art];
    return (
      `<svg viewBox="${viewBox}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef4f2"/><stop offset="1" stop-color="#cbd9d3"/>' +
      `</linearGradient></defs><g fill="url(#${id})">${body}</g></svg>`
    );
  };

  const glyphSvg = (name) =>
    `<svg viewBox="${GLYPH_VIEWBOX[name] || "0 0 80 80"}" aria-hidden="true">${GLYPHS[name]}</svg>`;

  const iconMarkup = (item) => {
    if (item.icon) return `<img src="${item.icon}" alt="" draggable="false">`;
    if (item.glyph && GLYPHS[item.glyph]) return glyphSvg(item.glyph);
    return "";
  };

  const wellMarkup = (app) => {
    const label = app.label ? `<span class="label">${app.label}</span>` : "";
    if (app.icon) return `<span class="well"><img src="${app.icon}" alt="" draggable="false"></span>`;
    if (app.folder) return `<span class="well">${'<span class="cell"></span>'.repeat(9)}${label}</span>`;
    return `<span class="well">${label}</span>`;
  };

  // ---- Build ----

  const bg = $("bg");
  GHOSTS.forEach((g, i) => {
    const el = document.createElement("div");
    el.className = "ghost";
    el.innerHTML = `<div class="ghost-in">${ghostSvg(g.art, `ghost-${i}`)}</div>`;
    el.style.cssText =
      `left:${g.x}%;top:${g.y}%;--w:calc(var(--u) * ${g.w});--r:${g.r}deg;--z:${g.z};--dx:${g.dx};--dy:${g.dy};--t:${g.t}s`;
    bg.appendChild(el);
  });

  // Parallax: nearer shapes shift further as the pointer moves
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let frame = 0;
    window.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        bg.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        bg.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    }, { passive: true });
  }

  const user = config.user || {};
  $("userAvatar").innerHTML = user.avatar ? `<img src="${user.avatar}" alt="" draggable="false">` : DEFAULT_AVATAR;
  if (user.name) $("user").setAttribute("aria-label", user.name);

  const pages = [];
  for (let p = 0; p < pageCount; p++) {
    const pageEl = document.createElement("div");
    pageEl.className = "page";
    pageEl.style.left = `calc(var(--page-pitch) * ${p} - var(--grid-w) / 2)`;
    for (let i = 0; i < PER_PAGE; i++) {
      const index = p * PER_PAGE + i;
      const app = apps[index];
      let slot;
      if (app) {
        slot = document.createElement("button");
        slot.type = "button";
        slot.className = `slot glass app${app.folder ? " folder" : ""}`;
        slot.setAttribute("aria-label", app.title || "");
        slot.style.setProperty("--c", app.color || "#9a9a9a");
        slot.innerHTML = wellMarkup(app);
      } else {
        slot = document.createElement("div");
        slot.className = "slot glass empty";
        slot.innerHTML = '<span class="well"></span>';
      }
      slot.dataset.index = index;
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
    dock.appendChild(btn);
  });

  [["cornerLeft", config.cornerLeft], ["cornerRight", config.cornerRight]].forEach(([id, item]) => {
    const btn = $(id);
    if (!item) return btn.remove();
    btn.setAttribute("aria-label", item.title || "");
    btn.innerHTML = iconMarkup(item);
    btn.addEventListener("click", () => activate(item, btn));
  });

  // ---- State ----

  const selectedApp = () => (selected >= 0 ? apps[selected] : null);

  function select(index, { sound = true } = {}) {
    if (selected >= 0) slots[selected].classList.remove("selected");
    bubble.remove();
    selected = index;
    if (selected < 0) return;
    const slot = slots[selected];
    slot.classList.add("selected");
    const app = apps[selected];
    if (app && app.title) {
      bubble.textContent = app.title;
      bubble.classList.toggle("below", Math.floor((selected % PER_PAGE) / cols()) === 0);
      slot.appendChild(bubble);
    }
    if (sound) app ? sfx.select() : sfx.move();
  }

  function goTo(p, { sound = true, keepSelection = false } = {}) {
    const next = Math.max(0, Math.min(pageCount - 1, p));
    if (next !== page) {
      if (sound) sfx.page();
      if (!keepSelection) select(-1, { sound: false });
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

  function activate(item, el) {
    if (!item.url && !item.content) {
      sfx.none();
      bump(el);
      return;
    }
    sfx.open();
    hoverBubble.remove();
    openFrom = el;
    const r = el.getBoundingClientRect();
    const s = launchEl.style;
    s.setProperty("--t", `${r.top}px`);
    s.setProperty("--l", `${r.left}px`);
    s.setProperty("--r", `${window.innerWidth - r.right}px`);
    s.setProperty("--b", `${window.innerHeight - r.bottom}px`);
    launchTitle.textContent = item.title || "";
    launchBody.innerHTML = item.content || "";
    launchEl.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => launchEl.classList.add("open")));
    if (item.url) setTimeout(() => window.location.assign(item.url), 450);
    else $("launchClose").focus({ preventScroll: true });
  }

  function closeApp() {
    if (launchEl.hidden) return;
    sfx.back();
    launchEl.classList.remove("open");
    const done = () => {
      launchEl.hidden = true;
      launchBody.innerHTML = "";
      if (openFrom) openFrom.focus({ preventScroll: true });
    };
    launchEl.addEventListener("transitionend", done, { once: true });
    setTimeout(() => { if (!launchEl.hidden) done(); }, 600);
  }

  // Coming back from a url tile via the back button shouldn't leave the window open.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      launchEl.classList.remove("open");
      launchEl.hidden = true;
    }
  });

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

  $("user").addEventListener("click", (e) => {
    activate({ title: user.name, content: user.content }, e.currentTarget);
  });
  hoverLabel($("user"), user.name);
  $("launchClose").addEventListener("click", closeApp);

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

  // D-pad style keyboard navigation over the grid
  document.addEventListener("keydown", (e) => {
    if (!launchEl.hidden) {
      if (e.key === "Escape" || e.key === "Backspace") closeApp();
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
})();
