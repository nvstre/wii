// The Music app's player: plays the songs listed in music/tracks.js, draws the visualizer,
// and keeps its place while the app is closed. Pages.music renders the markup; mount() wires it up.
window.WiiPlayer = (() => {
  const tracks = (window.WIIU_TRACKS || []).slice();
  const el = new Audio();
  el.preload = "metadata";

  let index = -1;
  let shuffle = false;
  let repeat = "all"; // all → one → off
  let root = null;
  let frame = 0;
  let analyser = null;
  let bins = null;
  let bubbles = [];
  const durations = new Map();

  const src = (file) => file.split("/").map(encodeURIComponent).join("/");
  const clock = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
  const $ = (sel) => (root ? root.querySelector(sel) : null);

  // Route through the menu's audio graph so the mute button applies and the visualizer gets data.
  // (Browsers treat file:// audio as cross-origin, which would play silence, so skip it there.)
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
    if (index < 0) return load(0);
    connect();
    el.play().catch(() => {});
  }

  function load(i, autoplay = true) {
    if (!tracks.length) return;
    index = (i + tracks.length) % tracks.length;
    el.src = src(tracks[index].file);
    paint();
    if (autoplay) play();
  }

  function next(auto) {
    if (!tracks.length) return;
    if (shuffle && tracks.length > 1) {
      let n;
      do n = Math.floor(Math.random() * tracks.length);
      while (n === index);
      return load(n);
    }
    if (auto && repeat === "off" && index === tracks.length - 1) return el.pause();
    load(index + 1);
  }

  function prev() {
    if (el.currentTime > 3) el.currentTime = 0;
    else load(index - 1);
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

  // ---- Media keys / lock screen ----

  const session = navigator.mediaSession;
  if (session) {
    try {
      session.setActionHandler("play", play);
      session.setActionHandler("pause", () => el.pause());
      session.setActionHandler("previoustrack", prev);
      session.setActionHandler("nexttrack", () => next());
    } catch (e) {}
  }

  // ---- Drawing ----

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
    if (!t) return;
    const playing = !el.paused && index >= 0;
    $("[data-np-title]").textContent = t.title;
    $("[data-np-sub]").textContent = [t.artist, t.album].filter(Boolean).join(" · ");
    const art = $("[data-np-art]");
    if (art.dataset.file !== t.file) {
      art.dataset.file = t.file;
      art.innerHTML = window.WiiPages.coverArt(t);
      art.animate && art.animate([{ opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1 }], { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
    root.classList.toggle("is-playing", playing);
    const playBtn = $('[data-act="play"]');
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    playBtn.classList.toggle("playing", playing);
    $('[data-act="shuffle"]').setAttribute("aria-pressed", String(shuffle));
    const rep = $('[data-act="repeat"]');
    rep.setAttribute("aria-pressed", String(repeat !== "off"));
    rep.classList.toggle("one", repeat === "one");
    rep.setAttribute("aria-label", `Repeat: ${repeat}`);
    root.querySelectorAll(".song").forEach((row) => row.classList.toggle("current", Number(row.dataset.i) === index));
    progress();
  }

  function progress() {
    if (!root) return;
    const dur = el.duration || durations.get(index) || 0;
    const p = dur ? Math.min(1, el.currentTime / dur) : 0;
    $(".seek").style.setProperty("--p", `${p * 100}%`);
    $("[data-cur]").textContent = clock(el.currentTime);
    $("[data-dur]").textContent = clock(dur);
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
    if (!canvas) return;
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
    const count = 32;
    const floor = h * 0.68;
    const gap = 3;
    const bw = (w - gap * (count - 1)) / count;
    if (analyser && !el.paused) analyser.getByteFrequencyData(bins);
    const grad = g.createLinearGradient(0, 0, 0, floor);
    grad.addColorStop(0, "#f2fdff");
    grad.addColorStop(0.45, "#7fdcff");
    grad.addColorStop(1, "#1a9be6");
    for (let i = 0; i < count; i++) {
      let v;
      if (analyser && !el.paused) v = bins[Math.floor((i / count) * bins.length * 0.85)] / 255;
      else v = el.paused ? 0.06 + 0.04 * Math.sin(t / 700 + i / 2.5) : 0.3 + 0.25 * Math.sin(t / 180 + i);
      const bh = Math.max(3, v * floor * 0.95);
      const x = i * (bw + gap);
      g.fillStyle = grad;
      g.shadowColor = "rgba(90, 210, 255, 0.8)";
      g.shadowBlur = 8;
      roundRect(g, x, floor - bh, bw, bh, Math.min(4, bw / 2));
      g.shadowBlur = 0;
      g.fillStyle = "rgba(160, 230, 255, 0.22)";
      roundRect(g, x, floor + 3, bw, bh * 0.4, Math.min(4, bw / 2));
      if (!el.paused && v > 0.72 && Math.random() < 0.08 && bubbles.length < 40) {
        bubbles.push({ x: x + bw / 2, y: floor - bh, r: 2 + Math.random() * 4, vy: 0.4 + Math.random() * 0.8, life: 1 });
      }
    }
    bubbles = bubbles.filter((b) => b.life > 0);
    bubbles.forEach((b) => {
      b.y -= b.vy;
      b.x += Math.sin((b.y + b.r * 40) / 14) * 0.3;
      b.life -= 0.012;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * b.life})`;
      g.lineWidth = 1.2;
      g.stroke();
      g.fillStyle = `rgba(255, 255, 255, ${0.25 * b.life})`;
      g.fill();
    });
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.fill();
  }

  // Durations fill in one song at a time without playing anything
  function fetchDurations() {
    const todo = tracks.map((_, i) => i).filter((i) => !durations.has(i));
    const step = () => {
      const i = todo.shift();
      if (i == null || !root) return;
      const probe = new Audio();
      probe.preload = "metadata";
      const done = () => {
        if (Number.isFinite(probe.duration)) durations.set(i, probe.duration);
        const cell = root && root.querySelector(`[data-len="${i}"]`);
        if (cell && durations.has(i)) cell.textContent = clock(durations.get(i));
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

  function mount(container) {
    root = container.querySelector(".music");
    if (!root || !tracks.length) {
      root = null;
      return;
    }
    root.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]");
      if (act) {
        const a = act.dataset.act;
        if (a === "play") el.paused || index < 0 ? play() : el.pause();
        if (a === "next") next();
        if (a === "prev") prev();
        if (a === "shuffle") shuffle = !shuffle;
        if (a === "repeat") repeat = repeat === "all" ? "one" : repeat === "one" ? "off" : "all";
        paint();
        return;
      }
      const row = e.target.closest(".song");
      if (row) {
        const i = Number(row.dataset.i);
        i === index ? (el.paused ? play() : el.pause()) : load(i);
        return;
      }
      const albumBtn = e.target.closest("[data-play-album]");
      if (albumBtn) load(Number(albumBtn.dataset.playAlbum));
    });

    // seek by clicking or dragging along the bar
    const seek = root.querySelector(".seek");
    const seekTo = (e) => {
      const r = seek.getBoundingClientRect();
      const dur = el.duration || durations.get(index);
      if (!dur) return;
      el.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
      progress();
    };
    seek.addEventListener("pointerdown", (e) => {
      if (index < 0) load(0, false);
      seek.setPointerCapture(e.pointerId);
      seekTo(e);
      const move = (ev) => seekTo(ev);
      seek.addEventListener("pointermove", move);
      seek.addEventListener("pointerup", () => seek.removeEventListener("pointermove", move), { once: true });
    });

    const vol = root.querySelector("[data-vol]");
    vol.value = String(el.volume);
    vol.addEventListener("input", () => (el.volume = Number(vol.value)));

    document.addEventListener("keydown", onKey);
    root.querySelectorAll("[data-len]").forEach((cell) => {
      const d = durations.get(Number(cell.dataset.len));
      if (d) cell.textContent = clock(d);
    });
    fetchDurations();
    paint();
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
