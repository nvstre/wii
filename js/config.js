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
    {
      title: "Featured Project", label: "★", color: "#14bfd6", year: "2025", role: "Solo project",
      description: "Placeholder: your best project gets its own tile on the front page.",
      tech: ["HTML", "CSS", "JavaScript"],
      links: [{ label: "Source code", url: "https://github.com" }],
    },
    // ---- Popular Wii U games ----
    {
      title: "Mario Kart 8", game: true, icon: "img/games/mario-kart-8.jpg", label: "Mario\nKart 8", color: "#e4262a", color2: "#8f0f14",
      year: "2014", role: "Nintendo EAD · Racing",
      description: "Anti-gravity kart racing with 32 tracks, split-screen for four and twelve-player online races. The best-selling game on Wii U.",
      tech: ["Racing", "Multiplayer"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mario_Kart_8" }],
    },
    {
      title: "Super Smash Bros. for Wii U", game: true, icon: "img/games/super-smash-bros.jpg", label: "Super Smash\nBros.", color: "#2a5bd7", color2: "#0b1a45",
      year: "2014", role: "Bandai Namco & Sora · Fighting",
      description: "Nintendo's all-star fighter, with a mode for up to eight players at once and characters from across Nintendo's history.",
      tech: ["Fighting", "Multiplayer"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Super_Smash_Bros._for_Nintendo_3DS_and_Wii_U" }],
    },
    {
      title: "Splatoon", game: true, icon: "img/games/splatoon.jpg", label: "Splatoon", color: "#f5a400", color2: "#6b2ad6",
      year: "2015", role: "Nintendo EAD · Shooter",
      description: "Four-on-four shooter where you win by covering the stage in your team's ink, not by knocking out the other side.",
      tech: ["Shooter", "Online"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Splatoon_(video_game)" }],
    },
    {
      title: "Super Mario 3D World", game: true, icon: "img/games/super-mario-3d-world.jpg", label: "Super Mario\n3D World", color: "#ffc61a", color2: "#e2401b",
      year: "2013", role: "Nintendo EAD Tokyo · Platformer",
      description: "Co-op 3D platformer for up to four players, best known for the Cat Mario power-up.",
      tech: ["Platformer", "Co-op"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Super_Mario_3D_World" }],
    },
    {
      title: "The Legend of Zelda: Breath of the Wild", game: true, icon: "img/games/breath-of-the-wild.jpg", label: "Breath of\nthe Wild", color: "#3a8fb7", color2: "#163545",
      year: "2017", role: "Nintendo EPD · Action-adventure",
      description: "An open-world Hyrule you can explore in any order. It came out on Wii U and Nintendo Switch on the same day.",
      tech: ["Open world", "Adventure"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Breath_of_the_Wild" }],
    },
    {
      title: "Super Mario Maker", game: true, icon: "img/games/super-mario-maker.jpg", label: "Mario\nMaker", color: "#ffb400", color2: "#d9480f",
      year: "2015", role: "Nintendo EAD · Level creation",
      description: "Build your own Mario levels on the GamePad touch screen and play levels made by people all over the world.",
      tech: ["Platformer", "Creation"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Super_Mario_Maker" }],
    },
    {
      title: "Nintendo Land", game: true, icon: "img/games/nintendo-land.jpg", label: "Nintendo\nLand", color: "#3ab0e8", color2: "#e8448f",
      year: "2012", role: "Nintendo EAD · Party",
      description: "The launch-day theme park of minigames, built to show off GamePad play where one player sees something the others can't.",
      tech: ["Party", "Multiplayer"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nintendo_Land" }],
    },
    {
      title: "New Super Mario Bros. U", game: true, icon: "img/games/new-super-mario-bros-u.jpg", label: "New Super\nMario Bros. U", color: "#36a3ea", color2: "#1747a6",
      year: "2012", role: "Nintendo EAD · Platformer",
      description: "Side-scrolling Mario at launch, where an extra player can help by placing blocks on the GamePad.",
      tech: ["Platformer", "Co-op"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/New_Super_Mario_Bros._U" }],
    },
    {
      title: "Donkey Kong Country: Tropical Freeze", game: true, icon: "img/games/tropical-freeze.jpg", label: "Tropical\nFreeze", color: "#5cc8ef", color2: "#123f78",
      year: "2014", role: "Retro Studios · Platformer",
      description: "A tough, beautiful side-scroller from Retro Studios, with a soundtrack by David Wise.",
      tech: ["Platformer", "Co-op"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Donkey_Kong_Country:_Tropical_Freeze" }],
    },
    {
      title: "Bayonetta 2", game: true, icon: "img/games/bayonetta-2.jpg", label: "Bayonetta 2", color: "#8c1d40", color2: "#1c1029",
      year: "2014", role: "PlatinumGames · Action",
      description: "Stylish, over-the-top action from PlatinumGames. The Wii U release also came with the first Bayonetta.",
      tech: ["Action", "Hack and slash"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bayonetta_2" }],
    },
    {
      title: "Xenoblade Chronicles X", game: true, icon: "img/games/xenoblade-chronicles-x.jpg", label: "Xenoblade\nChronicles X", color: "#3f8fbf", color2: "#0a2440",
      year: "2015", role: "Monolith Soft · RPG",
      description: "A huge open-world RPG on the alien planet Mira, where you eventually pilot giant mechs called Skells.",
      tech: ["RPG", "Open world"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Xenoblade_Chronicles_X" }],
    },
    {
      title: "Pikmin 3", game: true, icon: "img/games/pikmin-3.jpg", label: "Pikmin 3", color: "#8bd04e", color2: "#256b2c",
      year: "2013", role: "Nintendo EAD · Strategy",
      description: "Lead swarms of little plant creatures to gather fruit and survive on a strange planet.",
      tech: ["Strategy", "Co-op"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Pikmin_3" }],
    },
    {
      title: "The Legend of Zelda: The Wind Waker HD", game: true, icon: "img/games/wind-waker-hd.jpg", label: "The Wind\nWaker HD", color: "#4cc3ee", color2: "#0f5f99",
      year: "2013", role: "Nintendo EAD · Action-adventure",
      description: "An HD remake of the cel-shaded sailing adventure, with the map and items moved to the GamePad.",
      tech: ["Adventure", "Remake"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_The_Wind_Waker_HD" }],
    },
    {
      title: "Captain Toad: Treasure Tracker", game: true, icon: "img/games/captain-toad.jpg", label: "Captain\nToad", color: "#f6d24a", color2: "#d4552a",
      year: "2014", role: "Nintendo EAD Tokyo · Puzzle",
      description: "Bite-sized diorama levels you turn around to find the path to each Power Star.",
      tech: ["Puzzle", "Platformer"],
      links: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Captain_Toad:_Treasure_Tracker" }],
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
