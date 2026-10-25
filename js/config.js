// Everything you'd want to customize lives here. Text marked "placeholder" is yours to replace.
window.WIIU_CONFIG = {
  user: {
    name: "Your Name",
    avatar: "img/avatar.png",
    tagline: "Developer · Designer · Wii U enjoyer",
    bio: "Placeholder: write two or three sentences about who you are and what you make.\n\nA second paragraph about what you're looking for, or what you're working on right now.",
    skills: ["JavaScript", "HTML & CSS", "UI Design", "Game Dev"],
    facts: [
      { label: "Based in", value: "Your city" },
      { label: "Currently", value: "Building this site" },
      { label: "Favourite console", value: "Wii U, obviously" },
    ],
  },

  minPages: 6,               // pages shown even when there aren't enough tiles to fill them
  sounds: true,              // synthesized UI blips
  startView: "menu",         // "menu", or "tv" to open on the TV screen intro

  // Menu music: loops gaplessly between loopStart and loopEnd (seconds). Starts on the first click.
  music: { src: "media/music.mp3", loopStart: 1, loopEnd: 181, volume: 0.35 },

  // Looping background video (first format the browser can play), or null for a plain gradient
  background: ["media/background.webm", "media/background.mp4"],
  backgroundPoster: "media/background.jpg",

  // Grid tiles, filled in order, 15 per page.
  //   Project tile: title, label + color (or icon: "img/x.png"), year, role, description,
  //                 tech: [...], images: [...], links: [{ label, url }]
  //   Folder tile:  title, label, color, apps: [ ...project tiles ]
  //   Link tile:    title, label + color (or icon), url   (opens in a new tab)
  //   Game tile:    game: true, icon (cover image), label ("\n" for a line break) and color + color2
  //                 for the title card shown until the cover exists. `npm run covers` downloads them.
  apps: [
    {
      title: "Web Projects", label: "Web", color: "#e9505c",
      apps: [
        {
          title: "LeonidaLink", icon: "img/projects/leonidalink.jpg", color: "#d23d9f",
          description: "Placeholder: what LeonidaLink is, who it's for and what it does.",
          // links: [{ label: "Visit site", url: "https://..." }],
        },
        {
          title: "UtopiaRPG", icon: "img/projects/utopiarpg.jpg", color: "#4f9fd9",
          description: "Placeholder: what UtopiaRPG is, who it's for and what it does.",
          // links: [{ label: "Visit site", url: "https://..." }],
        },
        {
          title: "GDMP", icon: "img/projects/gdmp.jpg", color: "#1f7ae0",
          description: "Placeholder: what GDMP is, who it's for and what it does.",
          // links: [{ label: "Visit site", url: "https://..." }],
        },
      ],
    },
    {
      title: "My Games", label: "My Games", color: "#36a9e1",
      apps: [
        {
          title: "Game One", label: "G1", color: "#9b59b6", year: "2025", role: "Programming & art",
          description: "Placeholder: what kind of game it is and what makes it fun.",
          tech: ["Godot", "GDScript"],
          links: [{ label: "Play it", url: "https://itch.io" }],
        },
      ],
    },
    {
      title: "Design", label: "Design", color: "#f28c26",
      apps: [
        {
          title: "Design One", label: "D1", color: "#ef4f6a", year: "2024", role: "UI design",
          description: "Placeholder: the brief, your process and the result.",
          tech: ["Figma"],
        },
      ],
    },
    { title: "Music", icon: "img/music-app.svg", page: "music" },
    { title: "Hobbies", icon: "img/hobbies-app.svg", page: "hobbies" },
    // ---- Wii U games ----
    {
      title: "Mario Kart 8", game: true, icon: "img/games/mario-kart-8-icon.jpg", label: "Mario\nKart 8", color: "#e4262a", color2: "#8f0f14",
      year: "2014", role: "Nintendo EAD · Racing",
      description: "Anti-gravity kart racing with 32 tracks, split-screen for four and twelve-player online races. The best-selling game on Wii U.",
      tech: ["Racing", "Multiplayer"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mario_Kart_8" }],
    },
    {
      title: "Splatoon", game: true, icon: "img/games/splatoon-icon.png", label: "Splatoon", color: "#7316ff", color2: "#3d0a99",
      year: "2015", role: "Nintendo EAD · Shooter",
      description: "Four-on-four shooter where you win by covering the stage in your team's ink, not by knocking out the other side.",
      tech: ["Shooter", "Online"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Splatoon_(video_game)" }],
    },
  ],

  // Shortcuts along the bottom. "page" opens one of the built-in pages below.
  dock: [
    { title: "Friend List",      glyph: "friends",       page: "contact" },
    { title: "Community",        glyph: "community",     page: "blog" },
    { title: "Shop",             glyph: "shop",          page: "services" },
    { title: "Internet Browser", glyph: "browser",       page: "links" },
    { title: "TV",               glyph: "tv",            page: "videos" },
    { title: "Notifications",    glyph: "notifications", page: "news" },
    { title: "Downloads",        glyph: "downloads",     page: "downloads" },
  ],

  cornerLeft:  { title: "About This Site", glyph: "usb", page: "credits" },
  cornerRight: { title: "Switch Screens",  glyph: "swap", action: "tv" },

  pages: {
    // Hobbies app. Each hobby gets its own page.
    //   glyph: game, music, code, camera, ball, book, art, travel, star  (or emoji: "🛹", or icon: "img/x.png")
    //   color + color2: the hobby's colours
    //   favorites: a short list of favourite things
    //   related: other pages on this site, like "p/mario-kart-8" or "music"
    //   links: [{ label, url }], images: ["img/..."]
    hobbies: {
      intro: "Placeholder: a sentence about what you get up to when you're not building things.",
      items: [
        {
          title: "Gaming", glyph: "game", color: "#ff4d55", color2: "#7316ff",
          tagline: "Placeholder: Mario Kart, Splatoon and late-night online matches",
          description: "Placeholder: what you play, how long you've been gaming and what you love about it.",
          favorites: ["Mario Kart 8", "Splatoon"],
          related: ["p/mario-kart-8", "p/splatoon"],
        },
        {
          title: "Music", glyph: "music", color: "#1aa7ec", color2: "#2fbf5a",
          tagline: "Placeholder: Yeat on repeat",
          description: "Placeholder: what you listen to, and when.",
          favorites: ["Yeat", "Luh Leakyz Vol. 1"],
          related: ["music"],
        },
        {
          title: "Coding", glyph: "code", color: "#2a5bd7", color2: "#14bfd6",
          tagline: "Placeholder: building websites and tools for fun",
          description: "Placeholder: how you got into programming and what you like to build.",
          favorites: ["JavaScript", "Web design"],
          related: ["p/leonidalink", "p/utopiarpg", "p/gdmp"],
        },
      ],
    },
    // Music app: plays the songs you put in the music/ folder (see music/README.md).
    // "albums" are only used for covers: `npm run covers` fetches them from Wikipedia,
    // and songs from those albums without their own artwork use them.
    music: {
      artist: "Yeat",
      spotify: "",   // optional: a Spotify link shown while there are no songs yet
      albums: [
        { title: "Up 2 Më", wiki: "Up_2_Më", icon: "img/music/up-2-me.jpg" },
        { title: "2 Alivë", wiki: "2_Alivë", icon: "img/music/2-alive.jpg" },
        { title: "AftërLyfe", wiki: "AftërLyfe", icon: "img/music/afterlyfe.jpg" },
        { title: "2093", wiki: "2093_(album)", icon: "img/music/2093.jpg" },
        { title: "Lyfestyle", wiki: "Lyfestyle", icon: "img/music/lyfestyle.jpg" },
      ],
    },
    contact: {
      intro: "Placeholder: the best way to reach me is…",
      email: "you@example.com",
      friends: [
        { name: "GitHub", handle: "@yourname", url: "https://github.com", color: "#333333" },
        { name: "Discord", handle: "yourname", url: "https://discord.com", color: "#5865f2" },
        { name: "Instagram", handle: "@yourname", url: "https://instagram.com", color: "#e1306c" },
      ],
    },
    blog: {
      posts: [
        { title: "Hello, world!", date: "2025-01-01", text: "Placeholder: your first dev log post. Write about what you're building or learning." },
      ],
    },
    services: {
      intro: "Placeholder: what you offer, if you take commissions or freelance work.",
      items: [
        { title: "Websites", price: "From $—", text: "Placeholder: a short description of this service." },
        { title: "UI Design", price: "From $—", text: "Placeholder: a short description of this service." },
      ],
    },
    links: {
      links: [
        { title: "GitHub", url: "https://github.com", note: "My code" },
        { title: "itch.io", url: "https://itch.io", note: "My games" },
      ],
    },
    videos: {
      videos: [
        // { title: "Demo reel", url: "https://www.youtube.com/watch?v=VIDEO_ID", note: "What I made this year" },
      ],
    },
    news: {
      items: [
        { date: "2025-01-01", title: "New site!", text: "Placeholder: the portfolio is live." },
      ],
    },
    downloads: {
      files: [
        // { title: "Résumé", file: "files/resume.pdf", note: "PDF, updated 2025" },
      ],
    },
    credits: {
      text: "This site is a fan-made tribute to the Wii U Menu, built with plain HTML, CSS and JavaScript.\n\nNot affiliated with or endorsed by Nintendo. Wii U is a trademark of Nintendo.",
    },
  },

  // Speech bubbles floating around the TV screen intro
  tv: {
    bubbles: [
      { text: "Hi! Want to know more about me?", page: "about" },
      { text: "Check out what I've been making", page: "menu" },
      { text: "Say hello on my Friend List", page: "contact" },
      { text: "Latest posts from my dev log", page: "blog" },
      { text: "Grab my résumé", page: "downloads" },
    ],
  },
};
