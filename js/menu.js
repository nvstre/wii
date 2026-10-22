(() => {
  const config = window.WIIU_CONFIG || {};
  const apps = config.apps || [];
  const dockItems = config.dock || [];
  const PER_PAGE = 15;

  const $ = (id) => document.getElementById(id);
  const track = $("track");
  const viewport = $("viewport");
  const dots = $("dots");
  const title = $("title");
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

  // ---- Icons ----

  const GLYPHS = {
    bubble: '<path d="M12 10h24a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H22l-8 7v-7h-2a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z"/>',
    bag: '<path d="M10 17h28l-2.5 24h-23zM17 17v-3a7 7 0 0 1 14 0v3h-3.5v-3a3.5 3.5 0 0 0-7 0v3z"/>',
    globe: '<path fill-rule="evenodd" d="M24 6a18 18 0 1 1 0 36 18 18 0 0 1 0-36zm-3.2 4a15 15 0 0 0-9.6 11.5h6.5c.4-4.4 1.5-8.4 3.1-11.5zm6.4 0c1.6 3.1 2.7 7.1 3.1 11.5h6.5A15 15 0 0 0 27.2 10zM24 9.6c-1.9 2.6-3.2 6.9-3.6 11.9h7.2c-.4-5-1.7-9.3-3.6-11.9zM11.2 26.5a15 15 0 0 0 9.6 11.5c-1.6-3.1-2.7-7.1-3.1-11.5zm9.2 0c.4 5 1.7 9.3 3.6 11.9 1.9-2.6 3.2-6.9 3.6-11.9zm9.9 0c-.4 4.4-1.5 8.4-3.1 11.5a15 15 0 0 0 9.6-11.5z"/>',
    tv: '<path fill-rule="evenodd" d="M10 12h28a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4zm1 4v16h26V16zM16 39h16v3H16z"/>',
    bell: '<path d="M24 6a3 3 0 0 1 3 3v1.3A12 12 0 0 1 36 22v8l4 5H8l4-5v-8a12 12 0 0 1 9-11.7V9a3 3 0 0 1 3-3zm-5 32h10a5 5 0 0 1-10 0z"/>',
  };

  const DEFAULT_AVATAR =
    '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<rect width="64" height="64" fill="#bfe6f7"/>' +
    '<ellipse cx="32" cy="36" rx="17" ry="19" fill="#f6d5b8"/>' +
    '<path d="M14 32c0-14 8-21 18-21s18 7 18 21c-3-6-8-9-18-9s-15 3-18 9z" fill="#5a3b2a"/>' +
    '<ellipse cx="25" cy="36" rx="2.2" ry="3.2" fill="#333"/>' +
    '<ellipse cx="39" cy="36" rx="2.2" ry="3.2" fill="#333"/>' +
    '<path d="M26 45q6 5 12 0" fill="none" stroke="#c0504a" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>";

  const iconMarkup = (item) => {
    if (item.icon) return `<img src="${item.icon}" alt="" draggable="false">`;
    if (item.glyph && GLYPHS[item.glyph]) return `<svg viewBox="0 0 48 48" aria-hidden="true">${GLYPHS[item.glyph]}</svg>`;
    return `<span class="label">${item.label || ""}</span>`;
  };

  // ---- Build ----

  const avatar = $("userAvatar");
  if (config.user && config.user.avatar) {
    avatar.innerHTML = `<img src="${config.user.avatar}" alt="" draggable="false">`;
  } else {
    avatar.innerHTML = DEFAULT_AVATAR;
  }
  if (config.user && config.user.name) $("user").setAttribute("aria-label", config.user.name);

  for (let p = 0; p < pageCount; p++) {
    const pageEl = document.createElement("div");
    pageEl.className = "page";
    pageEl.style.left = `${p * 100}%`;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (let i = 0; i < PER_PAGE; i++) {
      const index = p * PER_PAGE + i;
      const app = apps[index];
      let slot;
      if (app) {
        slot = document.createElement("button");
        slot.type = "button";
        slot.className = "slot app";
        slot.setAttribute("aria-label", app.title || "");
        slot.innerHTML = `<span class="icon" style="--c:${app.color || "#9a9a9a"}">${iconMarkup(app)}</span>`;
      } else {
        slot = document.createElement("div");
        slot.className = "slot empty";
      }
      slot.dataset.index = index;
      grid.appendChild(slot);
    }
    pageEl.appendChild(grid);
    track.appendChild(pageEl);

    const dot = document.createElement("span");
    dot.className = "dot";
    dots.appendChild(dot);
  }

  const slots = Array.from(track.querySelectorAll(".slot"));

  const dock = $("dock");
  dockItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dock-item";
    btn.style.setProperty("--c", item.color || "#9a9a9a");
    btn.setAttribute("aria-label", item.title || "");
    btn.innerHTML = iconMarkup(item);
    btn.addEventListener("mouseenter", () => showTitle(item.title));
    btn.addEventListener("mouseleave", () => showTitle(selectedApp() && selectedApp().title));
    btn.addEventListener("click", () => activate(item, btn));
    dock.appendChild(btn);
  });

  // ---- State ----

  const selectedApp = () => (selected >= 0 ? apps[selected] : null);

  function showTitle(text) {
    if (text) title.textContent = text;
    title.classList.toggle("show", Boolean(text));
  }

  function select(index, { sound = true } = {}) {
    if (selected >= 0) slots[selected].classList.remove("selected");
    selected = index;
    if (selected >= 0) {
      slots[selected].classList.add("selected");
      if (sound) apps[selected] ? sfx.select() : sfx.move();
    }
    showTitle(selectedApp() && selectedApp().title);
  }

  function goTo(p, { sound = true } = {}) {
    const next = Math.max(0, Math.min(pageCount - 1, p));
    if (next !== page && sound) sfx.page();
    page = next;
    track.style.transform = `translateX(${-page * 100}%)`;
    dots.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === page));
    prevBtn.hidden = page === 0;
    nextBtn.hidden = page === pageCount - 1;
  }

  function activate(item, el) {
    if (!item.url && !item.content) {
      sfx.none();
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      return;
    }
    sfx.open();
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
    if (!apps[index]) return select(-1, { sound: false });
    if (index === selected) activate(apps[index], slot);
    else select(index);
  });

  prevBtn.addEventListener("click", () => goTo(page - 1));
  nextBtn.addEventListener("click", () => goTo(page + 1));
  dots.addEventListener("click", (e) => {
    const i = Array.from(dots.children).indexOf(e.target);
    if (i >= 0) goTo(i);
  });

  $("swap").addEventListener("click", () => sfx.select());
  $("user").addEventListener("click", (e) => {
    const user = config.user || {};
    activate({ title: user.name, content: user.content }, e.currentTarget);
  });
  $("launchClose").addEventListener("click", closeApp);

  // Swipe between pages
  let dragStart = null;
  let dragX = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".arrow")) return;
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
    track.style.transform = `translateX(calc(${-page * 100}% + ${dragX}px))`;
  });

  const endDrag = () => {
    if (!dragStart) return;
    dragStart = null;
    track.classList.remove("dragging");
    if (!suppressClick) return;
    const threshold = viewport.clientWidth * 0.12;
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
    if (e.target.closest && e.target.closest(".dock, .topbar")) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
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
        if (selectedApp()) {
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
    if (target !== selected) {
      select(target);
      const tp = Math.floor(target / PER_PAGE);
      if (tp !== page) goTo(tp);
    }
  });

  goTo(0, { sound: false });
})();
