// The Music app: a Spotify-style home for the songs in music/tracks.js. Pages.music renders the
// frame; this fills in the views (home, album, search), the library rail, the queue and the
// player bar, and keeps playing state while you move between views.
window.WiiPlayer = (() => {
  const tracks = (window.WIIU_TRACKS || []).slice();
  const all = tracks.map((_, i) => i);
  const el = new Audio();
  el.preload = "metadata";

  // Albums, newest first
  const albums = [];
  tracks.forEach((t, i) => {
    let a = albums.find((x) => x.name === t.album);
    if (!a) albums.push((a = { name: t.album, year: t.year, artist: t.artist, songs: [] }));
    if (!a.year && t.year) a.year = t.year;
    a.songs.push(i);
  });
  albums.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  const artist = (tracks[0] && tracks[0].artist) || "";
  const albumNamed = (name) => albums.find((a) => a.name === name);
  const coverOf = (a) => tracks[a.songs.find((i) => tracks[i].cover) ?? a.songs[0]];

  let index = -1;          // song playing
  let queue = [];          // what plays next, in order
  let base = [];           // the same list unshuffled
  let qpos = -1;
  let context = "";
  let shuffle = false;
  let repeat = "all";      // all → one → off
  let view = { name: "home" };
  let history = [];
  let chip = "all";
  let query = "";
  let root = null;
  let frame = 0;
  let analyser = null;
  let bins = null;
  let bubbles = [];
  const durations = new Map();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const P = () => window.WiiPages;
  const esc = (s) => P().esc(s);
  const src = (file) => file.split("/").map(encodeURIComponent).join("/");
  const clock = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "");
  const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const $ = (sel) => (root ? root.querySelector(sel) : null);

  // ---- Playback ----

  // Through the menu's audio graph, so the mute switch applies and the visualizer gets data.
  // (file:// audio counts as cross-origin and would play silence, so skip it there.)
  function connect() {
    if (analyser || location.protocol === "file:" || !window.WiiAudio) return;
    const ctx = window.WiiAudio.context();
    if (!ctx) return;
    try {
      const source = ctx.createMediaElementSource(el);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      analyser.connect(window.WiiAudio.output());
      bins = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      analyser = null;
    }
  }

  function play() {
    if (index < 0) return playList(all, 0, "All songs");
    connect();
    el.play().catch(() => {});
  }

  function load(i) {
    index = i;
    el.src = src(tracks[i].file);
    paint();
    play();
  }

  const shuffled = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function playList(list, start = 0, label = "") {
    if (!list.length) return;
    base = list.slice();
    context = label;
    const first = base[start];
    queue = shuffle ? [first, ...shuffled(base.filter((_, k) => k !== start))] : base.slice();
    qpos = queue.indexOf(first);
    load(first);
  }

  function setShuffle(on) {
    shuffle = on;
    if (index < 0 || !base.length) return;
    queue = shuffle ? [index, ...shuffled(base.filter((i) => i !== index))] : base.slice();
    qpos = queue.indexOf(index);
  }

  function next(auto) {
    if (!queue.length) return playList(all, 0, "All songs");
    if (qpos < queue.length - 1) qpos++;
    else if (auto && repeat === "off") return el.pause();
    else qpos = 0;
    load(queue[qpos]);
  }

  function prev() {
    if (el.currentTime > 3 || qpos <= 0) {
      el.currentTime = 0;
      return;
    }
    qpos--;
    load(queue[qpos]);
  }

  el.addEventListener("ended", () => {
    if (repeat === "one") {
      el.currentTime = 0;
      play();
    } else next(true);
  });
  el.addEventListener("play", () => { paint(); loop(); });
  el.addEventListener("pause", paint);
  el.addEventListener("loadedmetadata", () => {
    if (index >= 0) durations.set(index, el.duration);
    paint();
  });

  // Media keys and the lock screen
  const session = navigator.mediaSession;
  if (session) {
    try {
      session.setActionHandler("play", play);
      session.setActionHandler("pause", () => el.pause());
      session.setActionHandler("previoustrack", prev);
      session.setActionHandler("nexttrack", () => next());
    } catch (e) {}
  }

  // ---- Views ----

  const cover = (t) => P().coverArt(t);
  const playIcon = () => P().icon("play");

  // Up to four album covers in a 2x2 square, for the "All songs" style cards
  function collage() {
    const picks = albums.slice(0, 4).map(coverOf);
    while (picks.length < 4 && picks.length) picks.push(picks[picks.length % albums.length]);
    return `<span class="mu-collage">${picks.map((t) => `<span>${cover(t)}</span>`).join("")}</span>`;
  }

  function section(title, body, extra = "") {
    return `<section class="mu-section"><div class="mu-section-head"><h2>${esc(title)}</h2>${extra}</div>${body}</section>`;
  }

  function albumCard(a) {
    return (
      `<button class="mu-acard" type="button" data-open-album="${esc(a.name)}">` +
      `<span class="mu-aart">${cover(coverOf(a))}<span class="mu-hover-play" data-play-album="${esc(a.name)}">${playIcon()}</span></span>` +
      `<strong>${esc(a.name)}</strong><small>${esc([a.year, "Album"].filter(Boolean).join(" · "))}</small></button>`
    );
  }

  function songList(list, label, { album = false } = {}) {
    return (
      `<ol class="mu-songs${album ? " in-album" : ""}" data-list="${list.join(",")}" data-label="${esc(label)}">` +
      list
        .map((i, n) => {
          const t = tracks[i];
          return (
            `<li><button class="mu-song" type="button" data-i="${i}" data-n="${n}">` +
            `<span class="mu-num">${album && t.track ? t.track : n + 1}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>` +
            `<span class="mu-thumb">${cover(t)}</span>` +
            `<span class="row-text"><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span>` +
            `<span class="mu-col">${esc(t.album)}</span>` +
            `<span class="mu-len" data-len="${i}">${clock(durations.get(i))}</span></button></li>`
          );
        })
        .join("") +
      "</ol>"
    );
  }

  function homeView() {
    const names = { all: "All", albums: "Albums", songs: "Songs" };
    let html =
      '<div class="mu-chips">' +
      Object.keys(names).map((c) => `<button class="mu-chip${chip === c ? " on" : ""}" type="button" data-chip="${c}">${names[c]}</button>`).join("") +
      "</div>";

    if (chip === "all") {
      const quick = [
        { kind: "all", name: "All Songs", art: collage() },
        { kind: "shuffle", name: `Shuffle ${artist}`.trim(), art: collage() },
        ...albums.map((a) => ({ kind: "album", name: a.name, art: cover(coverOf(a)) })),
      ].slice(0, 8);
      html +=
        '<div class="mu-quick">' +
        quick
          .map(
            (q) =>
              `<button class="mu-qcard" type="button" data-quick="${q.kind}"${q.kind === "album" ? ` data-open-album="${esc(q.name)}"` : ""}>` +
              `<span class="mu-qart">${q.art}</span><strong>${esc(q.name)}</strong>` +
              `<span class="mu-hover-play"${q.kind === "album" ? ` data-play-album="${esc(q.name)}"` : ""}>${playIcon()}</span></button>`
          )
          .join("") +
        "</div>";

      const latest = albums[0];
      if (latest) {
        html +=
          '<div class="mu-spot">' +
          `<button class="mu-spot-art" type="button" data-open-album="${esc(latest.name)}" aria-label="${esc(latest.name)}">${cover(coverOf(latest))}</button>` +
          '<div class="mu-spot-text">' +
          `<small>Latest release from</small><h2>${esc(artist)}</h2>` +
          `<p>${esc([latest.year, "Album", `${latest.songs.length} song${latest.songs.length === 1 ? "" : "s"}`].filter(Boolean).join(" · "))}</p>` +
          `<h3>${esc(latest.name)}</h3>` +
          '<div class="mu-actions">' +
          `<button class="orb" type="button" data-play-album="${esc(latest.name)}" aria-label="Play ${esc(latest.name)}">${playIcon()}</button>` +
          `<button class="pill" type="button" data-open-album="${esc(latest.name)}">View album</button>` +
          "</div></div></div>";
      }
    }

    if (chip !== "songs") html += section(chip === "albums" ? "Albums" : `Albums by ${artist}`.trim(), `<div class="mu-shelf">${albums.map(albumCard).join("")}</div>`);
    if (chip !== "albums") {
      const list = chip === "songs" ? all : all.slice(0, 8);
      const more = chip === "all" && all.length > 8 ? '<button class="mu-link" type="button" data-chip="songs">Show all</button>' : "";
      html += section(chip === "songs" ? "All songs" : "Songs", songList(list, "All songs"), more);
    }
    return html;
  }

  function albumView(name) {
    const a = albumNamed(name);
    if (!a) return homeView();
    return (
      '<div class="mu-hero">' +
      `<span class="mu-hero-art">${cover(coverOf(a))}</span>` +
      '<div class="mu-hero-text">' +
      `<small>Album</small><h2>${esc(a.name)}</h2>` +
      `<p>${esc([a.artist, a.year, `${a.songs.length} song${a.songs.length === 1 ? "" : "s"}`].filter(Boolean).join(" · "))}</p>` +
      '<div class="mu-actions">' +
      `<button class="orb big" type="button" data-play-album="${esc(a.name)}" aria-label="Play ${esc(a.name)}">${playIcon()}</button>` +
      `<button class="pill" type="button" data-shuffle-album="${esc(a.name)}">Shuffle</button>` +
      "</div></div></div>" +
      songList(a.songs, a.name, { album: true })
    );
  }

  function searchView(q) {
    const n = norm(q);
    const songs = all.filter((i) => norm(tracks[i].title).includes(n) || norm(tracks[i].album).includes(n));
    const found = albums.filter((a) => norm(a.name).includes(n));
    if (!songs.length && !found.length) return `<p class="mu-empty">No results for “${esc(q)}”</p>`;
    return (
      (found.length ? section("Albums", `<div class="mu-shelf">${found.map(albumCard).join("")}</div>`) : "") +
      (songs.length ? section("Songs", songList(songs, `Search: ${q}`)) : "")
    );
  }

  function render() {
    if (!root) return;
    const box = $("[data-view]");
    box.innerHTML = view.name === "album" ? albumView(view.album) : view.name === "search" ? searchView(query) : homeView();
    box.scrollTop = 0;
    $('[data-go="back"]').disabled = !history.length;
    if (!reduceMotion && box.animate) {
      box.animate([{ opacity: 0, translate: "0 10px" }, { opacity: 1, translate: "0 0" }], { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
    paint();
  }

  function go(next) {
    if (next.name === view.name && next.album === view.album) return;
    history.push(view);
    view = next;
    render();
  }

  function back() {
    if (!history.length) return;
    view = history.pop();
    if (view.name !== "search") {
      query = "";
      $("[data-search]").value = "";
    }
    render();
  }

  // ---- Painting the live parts ----

  function paint() {
    if (session && index >= 0 && window.MediaMetadata) {
      const t = tracks[index];
      session.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        album: t.album,
        artwork: t.cover ? [{ src: new URL(src(t.cover), location.href).href }] : [],
      });
    }
    if (!root) return;
    const t = tracks[Math.max(index, 0)];
    const playing = !el.paused && index >= 0;
    const sub = [t.artist, t.album].filter(Boolean).join(" · ");

    $("[data-np-title]").textContent = t.title;
    $("[data-np-sub]").textContent = sub;
    $("[data-bar-title]").textContent = index >= 0 ? t.title : "Pick a song";
    $("[data-bar-sub]").textContent = index >= 0 ? sub : artist;
    swapArt($("[data-np-art]"), t);
    swapArt($("[data-bar-art]"), t);

    root.classList.toggle("is-playing", playing);
    const playBtn = $('[data-act="play"]');
    playBtn.classList.toggle("playing", playing);
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    $('[data-act="shuffle"]').setAttribute("aria-pressed", String(shuffle));
    const rep = $('[data-act="repeat"]');
    rep.setAttribute("aria-pressed", String(repeat !== "off"));
    rep.classList.toggle("one", repeat === "one");
    rep.setAttribute("aria-label", `Repeat: ${repeat}`);

    root.querySelectorAll(".mu-song").forEach((row) => row.classList.toggle("current", Number(row.dataset.i) === index));
    root.querySelectorAll("[data-lib-album]").forEach((b) => b.classList.toggle("current", index >= 0 && b.dataset.libAlbum === t.album));

    // queue panel: what's coming up
    $("[data-next-label]").textContent = context ? `Next from: ${context}` : "Next up";
    // queue positions coming up; with repeat on, the list wraps back to the start
    let upcoming;
    if (queue.length) {
      upcoming = queue.map((_, k) => k).slice(qpos + 1);
      if (repeat === "all") upcoming.push(...queue.map((_, k) => k).slice(0, qpos));
      upcoming = upcoming.slice(0, 10).map((k) => [k, queue[k]]);
    } else {
      upcoming = all.slice(1, 11).map((i) => [-1, i]);
    }
    $("[data-next]").innerHTML =
      upcoming
        .map(([k, i]) => {
          const u = tracks[i];
          return (
            `<li><button class="mu-qrow" type="button" data-q="${k}" data-i="${i}">` +
            `<span class="mu-thumb">${cover(u)}</span><span class="row-text"><strong>${esc(u.title)}</strong><small>${esc(u.artist)}</small></span></button></li>`
          );
        })
        .join("") || '<li class="mu-empty">Nothing queued</li>';
    progress();
  }

  function swapArt(box, t) {
    if (!box || box.dataset.file === t.file) return;
    box.dataset.file = t.file;
    box.innerHTML = cover(t);
    if (!reduceMotion && box.animate) box.animate([{ opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1 }], { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }

  function progress() {
    if (!root) return;
    const dur = el.duration || durations.get(index) || 0;
    $(".seek").style.setProperty("--p", `${dur ? Math.min(100, (el.currentTime / dur) * 100) : 0}%`);
    $("[data-cur]").textContent = clock(el.currentTime) || "0:00";
    $("[data-dur]").textContent = clock(dur) || "0:00";
  }

  function loop() {
    cancelAnimationFrame(frame);
    const tick = (t) => {
      if (!root) return;
      progress();
      draw(t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  // Aqua bars with a mirror reflection; loud bars let bubbles go
  function draw(t) {
    const canvas = $(".viz");
    if (!canvas || !canvas.clientWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const count = 24;
    const floor = h * 0.68;
    const gap = 3;
    const bw = (w - gap * (count - 1)) / count;
    const live = analyser && !el.paused;
    if (live) analyser.getByteFrequencyData(bins);
    const grad = g.createLinearGradient(0, 0, 0, floor);
    grad.addColorStop(0, "#f2fdff");
    grad.addColorStop(0.45, "#7fdcff");
    grad.addColorStop(1, "#1a9be6");
    for (let i = 0; i < count; i++) {
      let v;
      if (live) v = bins[Math.floor((i / count) * bins.length * 0.85)] / 255;
      else v = el.paused ? 0.06 + 0.04 * Math.sin(t / 700 + i / 2.5) : 0.3 + 0.25 * Math.sin(t / 180 + i);
      const bh = Math.max(3, v * floor * 0.95);
      const x = i * (bw + gap);
      g.fillStyle = grad;
      g.shadowColor = "rgba(90, 210, 255, 0.8)";
      g.shadowBlur = 8;
      bar(g, x, floor - bh, bw, bh);
      g.shadowBlur = 0;
      g.fillStyle = "rgba(160, 230, 255, 0.22)";
      bar(g, x, floor + 3, bw, bh * 0.4);
      if (live && v > 0.72 && Math.random() < 0.08 && bubbles.length < 30) {
        bubbles.push({ x: x + bw / 2, y: floor - bh, r: 2 + Math.random() * 3.5, vy: 0.4 + Math.random() * 0.8, life: 1 });
      }
    }
    bubbles = bubbles.filter((b) => b.life > 0);
    bubbles.forEach((b) => {
      b.y -= b.vy;
      b.x += Math.sin((b.y + b.r * 40) / 14) * 0.3;
      b.life -= 0.014;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * b.life})`;
      g.lineWidth = 1.2;
      g.stroke();
      g.fillStyle = `rgba(255, 255, 255, ${0.25 * b.life})`;
      g.fill();
    });
  }

  function bar(g, x, y, w, h) {
    const r = Math.min(4, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.fill();
  }

  // Song lengths fill in one at a time, without playing anything
  function fetchDurations() {
    const todo = all.filter((i) => !durations.has(i));
    const step = () => {
      const i = todo.shift();
      if (i == null || !root) return;
      const probe = new Audio();
      probe.preload = "metadata";
      const done = () => {
        if (Number.isFinite(probe.duration)) durations.set(i, probe.duration);
        if (root) root.querySelectorAll(`[data-len="${i}"]`).forEach((c) => (c.textContent = clock(durations.get(i))));
        probe.removeAttribute("src");
        step();
      };
      probe.addEventListener("loadedmetadata", done, { once: true });
      probe.addEventListener("error", done, { once: true });
      probe.src = src(tracks[i].file);
    };
    step();
  }

  // ---- Wiring ----

  function onKey(e) {
    if (e.key === " " && !(e.target.closest && e.target.closest("input, button, a"))) {
      e.preventDefault();
      el.paused ? play() : el.pause();
    }
  }

  function onClick(e) {
    const t = e.target;
    const act = t.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "play") el.paused || index < 0 ? play() : el.pause();
      if (a === "next") next();
      if (a === "prev") prev();
      if (a === "shuffle") setShuffle(!shuffle);
      if (a === "repeat") repeat = repeat === "all" ? "one" : repeat === "one" ? "off" : "all";
      return paint();
    }
    const playAlbum = t.closest("[data-play-album]");
    if (playAlbum) {
      const a = albumNamed(playAlbum.dataset.playAlbum);
      return a && playList(a.songs, 0, a.name);
    }
    const shuffleAlbum = t.closest("[data-shuffle-album]");
    if (shuffleAlbum) {
      const a = albumNamed(shuffleAlbum.dataset.shuffleAlbum);
      if (!a) return;
      setShuffle(true);
      return playList(a.songs, Math.floor(Math.random() * a.songs.length), a.name);
    }
    const quick = t.closest("[data-quick]");
    if (quick && quick.dataset.quick !== "album") {
      if (quick.dataset.quick === "shuffle") setShuffle(true);
      return playList(all, quick.dataset.quick === "shuffle" ? Math.floor(Math.random() * all.length) : 0, "All songs");
    }
    const open = t.closest("[data-open-album]");
    if (open) return go({ name: "album", album: open.dataset.openAlbum });
    const nav = t.closest("[data-go]");
    if (nav) {
      if (nav.dataset.go === "back") return back();
      query = "";
      $("[data-search]").value = "";
      chip = "all";
      return go({ name: "home" });
    }
    const c = t.closest("[data-chip]");
    if (c) {
      chip = c.dataset.chip;
      return render();
    }
    const song = t.closest(".mu-song");
    if (song) {
      const i = Number(song.dataset.i);
      if (i === index) return el.paused ? play() : el.pause();
      const list = song.closest(".mu-songs");
      return playList(list.dataset.list.split(",").map(Number), Number(song.dataset.n), list.dataset.label);
    }
    const q = t.closest(".mu-qrow");
    if (q) {
      const k = Number(q.dataset.q);
      if (k < 0) return playList(all, Number(q.dataset.i), "All songs");
      qpos = k;
      load(queue[qpos]);
    }
  }

  function mount(container) {
    root = container.querySelector(".music.has-songs");
    if (!root) return;
    root.addEventListener("click", onClick);

    $("[data-lib]").innerHTML = albums
      .map((a) => `<button class="mu-lib-item" type="button" data-open-album="${esc(a.name)}" data-lib-album="${esc(a.name)}" title="${esc(a.name)}">${cover(coverOf(a))}</button>`)
      .join("");

    const search = $("[data-search]");
    search.value = query;
    search.addEventListener("input", () => {
      query = search.value.trim();
      if (query) {
        if (view.name !== "search") {
          history.push(view);
          view = { name: "search" };
        }
        render();
      } else if (view.name === "search") back();
    });

    // seek by clicking or dragging along the bar
    const seek = $(".seek");
    const seekTo = (e) => {
      const r = seek.getBoundingClientRect();
      const dur = el.duration || durations.get(index);
      if (!dur) return;
      el.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
      progress();
    };
    seek.addEventListener("pointerdown", (e) => {
      if (index < 0) return;
      seek.setPointerCapture(e.pointerId);
      seekTo(e);
      const move = (ev) => seekTo(ev);
      seek.addEventListener("pointermove", move);
      seek.addEventListener("pointerup", () => seek.removeEventListener("pointermove", move), { once: true });
    });

    const vol = $("[data-vol]");
    vol.value = String(el.volume);
    vol.addEventListener("input", () => (el.volume = Number(vol.value)));

    document.addEventListener("keydown", onKey);
    render();
    fetchDurations();
    loop();
  }

  // Closing the app stops the music, like quitting software on the console
  function unmount() {
    if (!root) return;
    el.pause();
    document.removeEventListener("keydown", onKey);
    cancelAnimationFrame(frame);
    root = null;
  }

  return { mount, unmount, tracks };
})();
