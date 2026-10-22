# Wii Menu

A fan-made recreation of the Wii Menu that runs in the browser. It's a single file with no dependencies.

## Run

Open `index.html` in a browser. To serve it instead:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

It also runs as-is on GitHub Pages (Settings → Pages → deploy from branch).

## Features

- **Channel grid:** 4×3 channel grid across 4 pages, with the next page peeking in at the edge and arrows to switch pages
- **Selecting a channel:** a blue glow and a name label appear when you hover a channel
- **Pointer:** a Wii Remote hand pointer that tilts as it moves
- **Opening a channel:** the channel zooms into its preview screen, with **Wii Menu** and **Start** buttons and arrows to move between channels
- **Bottom bar:** a live clock with a blinking colon, the date, a Wii button (opens settings), an SD Card button, and a Message Board button with an unread indicator
- **Settings:** sound and 12- or 24-hour clock, saved in `localStorage`
- **Sounds:** sound effects synthesized with WebAudio. There are no audio files.

## Controls

| Input | Action |
| --- | --- |
| Mouse | Point, click, scroll wheel to change pages |
| Touch | Tap to open, swipe to change pages |
| Arrow keys | Move between channels (and between pages at the edges) |
| Enter / Space | Open the selected channel or press the focused button |
| `+` / `-`, PageUp / PageDown | Change pages |
| Esc | Back to the menu |

## Notes

All channel art is original and drawn in inline SVG. The games named on the tiles are made up. This project isn't affiliated with or endorsed by Nintendo.
