// Everything you'd want to customize lives here.
window.WIIU_CONFIG = {
  user: {
    name: "Guest",
    avatar: "img/avatar.png", // path to an image, or null for the default face
    content: null,         // HTML shown when the user icon is opened, or null to do nothing
  },

  minPages: 6,             // pages shown even when there aren't enough tiles to fill them
  sounds: true,            // synthesized UI blips
  music: null,             // path to your own looping audio file, e.g. "audio/menu.mp3"

  // Looping background video (first format the browser can play), or null for a plain gradient
  background: ["media/background.webm", "media/background.mp4"],
  backgroundPoster: "media/background.jpg",  // still frame shown while it loads (and with reduced motion)

  // Grid tiles, filled in order, 15 per page. Each one can have:
  //   title    name shown in the bubble when selected
  //   icon     square image path, or
  //   folder   true to draw a 3x3 folder tile using color + label, or
  //   color + label for a plain colored tile
  //   url      link to open, or
  //   content  HTML shown in the app window
  apps: [
    // { title: "Projects", folder: true, color: "#e9505c", label: "Projects", content: "<p>...</p>" },
    // { title: "GitHub", icon: "img/github.png", url: "https://github.com/you" },
  ],

  // Shortcuts along the bottom, spread evenly under the grid.
  // Same fields as apps, plus "glyph": friends, community, shop, browser, tv, notifications, downloads.
  dock: [
    { title: "Friend List",      glyph: "friends" },
    { title: "Community",        glyph: "community" },
    { title: "Shop",             glyph: "shop" },
    { title: "Internet Browser", glyph: "browser" },
    { title: "TV",               glyph: "tv" },
    { title: "Notifications",    glyph: "notifications" },
    { title: "Downloads",        glyph: "downloads" },
  ],

  // The two corner buttons.
  cornerLeft:  { title: "Storage",        glyph: "usb" },
  cornerRight: { title: "Switch Screens", glyph: "swap" },
};
