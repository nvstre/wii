// Everything you'd want to customize lives here.
window.WIIU_CONFIG = {
  user: {
    name: "Guest",
    avatar: null,          // path to an image, or null for the default face
    content: null,         // HTML shown when the user icon is opened, or null to do nothing
  },

  minPages: 2,             // pages shown even when there aren't enough tiles to fill them
  sounds: true,            // synthesized UI blips
  music: null,             // path to your own looping audio file, e.g. "audio/menu.mp3"

  // Grid tiles, filled in order, 15 per page. Each one can have:
  //   title    name shown in the top bar when selected
  //   icon     image path (square), or leave out and use color + label
  //   color    tile background when there's no icon
  //   label    short text drawn on the tile when there's no icon
  //   url      link to open, or
  //   content  HTML shown in the app window
  apps: [
    // { title: "About Me", color: "#2fa8e0", label: "ME", content: "<p>Hello!</p>" },
    // { title: "GitHub", icon: "img/github.png", url: "https://github.com/you" },
  ],

  // The five fixed shortcuts along the bottom. Same fields as apps,
  // plus "glyph": one of bubble, bag, globe, tv, bell.
  dock: [
    { title: "Community",        glyph: "bubble", color: "#5ac43f" },
    { title: "Shop",             glyph: "bag",    color: "#f39a1e" },
    { title: "Internet Browser", glyph: "globe",  color: "#2c8fd8" },
    { title: "Videos",           glyph: "tv",     color: "#7a4fb5" },
    { title: "Notifications",    glyph: "bell",   color: "#1fb3c7" },
  ],
};
