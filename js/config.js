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
  apps: [
    {
      title: "Web Projects", label: "Web", color: "#e9505c",
      apps: [
        {
          title: "Project One", label: "P1", color: "#2fa8e0", year: "2025", role: "Solo project",
          description: "Placeholder: what this project is, who it's for and what problem it solves.\n\nA second paragraph about how you built it and what you learned.",
          tech: ["JavaScript", "CSS"],
          links: [{ label: "Live site", url: "https://example.com" }, { label: "Source code", url: "https://github.com" }],
        },
        {
          title: "Project Two", label: "P2", color: "#7cc242", year: "2024", role: "Team of 3",
          description: "Placeholder: a short description of the project.",
          tech: ["React", "Node.js"],
          links: [{ label: "Source code", url: "https://github.com" }],
        },
      ],
    },
    {
      title: "Games", label: "Games", color: "#36a9e1",
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
    {
      title: "Featured Project", label: "★", color: "#14bfd6", year: "2025", role: "Solo project",
      description: "Placeholder: your best project gets its own tile on the front page.",
      tech: ["HTML", "CSS", "JavaScript"],
      links: [{ label: "Source code", url: "https://github.com" }],
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
