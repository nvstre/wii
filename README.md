# Wii U Menu

A portfolio site styled after the Wii U Menu (GamePad screen). Plain HTML/CSS/JS, no build step, no dependencies.

## Run locally

Needs [Node.js](https://nodejs.org) (any recent version).

```sh
git clone https://github.com/nvstre/wii.git
cd wii
npm start
```

Then open http://localhost:8080. Use another port with `node server.js 3000`.

No Node? Double-click `index.html`, or run `python3 -m http.server 8080` in this folder.

## Customize

Tiles, bottom shortcuts, the user icon and sounds are all in `js/config.js`.

## Controls

- Click/tap a tile to select it, again to open it
- Arrow keys to move, Enter to open, Esc to close
- Swipe, scroll wheel, side arrows or page dots to change pages

All artwork and sounds are original placeholders. No Nintendo assets are included.
