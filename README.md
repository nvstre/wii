# Wii U Menu Portfolio

A personal portfolio presented as the Wii U Menu. Plain HTML/CSS/JS, no build step, no dependencies.

## Run locally

Needs [Node.js](https://nodejs.org) (any recent version).

```sh
git clone https://github.com/nvstre/wii.git
cd wii
npm start
```

Then open http://localhost:8080. Use another port with `node server.js 3000`.

No Node? Run `python3 -m http.server 8080` in this folder. (Opening `index.html` directly works too, but the music needs a server.)

## Make it yours

Everything lives in `js/config.js`. Anything marked "Placeholder" is yours to replace.

| On screen | What it is | Where to edit |
|---|---|---|
| Mii icon (top left) | About Me page | `user` |
| Grid tiles | Projects, links | `apps` |
| Folder tiles | Groups of projects (add an `apps` list) | `apps` |
| Music tile | Music app playing your songs from `music/` | `pages.music`, `music/` |
| Hobbies tile | Hobbies app, one page per hobby | `pages.hobbies` |
| Friend List | Contact / socials | `pages.contact` |
| Community | Blog / dev log | `pages.blog` |
| Shop | Services | `pages.services` |
| Internet Browser | Links | `pages.links` |
| TV | Videos (YouTube, Vimeo or .mp4) | `pages.videos` |
| Notifications | News | `pages.news` |
| Downloads | Résumé and other files | `pages.downloads` |
| Storage icon (bottom left) | About this site | `pages.credits` |
| Switch-screens button | TV screen intro | `tv` |

- Music: drop audio files into `music/` (one folder per album, see `music/README.md`). `npm start` builds the song list automatically; `npm run music` does it on its own. Commit the songs together with `music/tracks.js` and `music/covers/`. The menu music fades out while the Music or Videos app is open, and closing the Music app stops the song.
- Game and album covers: run `npm run covers` once (needs internet). It downloads each cover from its Wikipedia page into `img/games/` and `img/music/`. Any game without a cover shows its coloured title card instead. To use your own picture, save it over the file in `img/games/`.
- Project screenshots: put images in `img/` and list them in the project's `images` (the first one is the big picture).
- Your Mii: replace `img/avatar.png` (square, transparent background looks best).
- Résumé: put the file in `files/` and add it to `pages.downloads.files`.
- Every page has its own link to share, like `yoursite/#/contact` or `yoursite/#/p/project-one`.
- Also update the name and description in the `<head>` of `index.html` (used for search results and link previews).

## Put it online (GitHub Pages, free)

1. Merge your work into the `main` branch.
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
3. After a minute it's live at `https://<your-username>.github.io/wii/`.

Optional: add your own domain on the same Pages settings screen.

## Controls

- Click/tap a tile to select it, again to open it
- Arrow keys to move, Enter to open, Esc to go back
- Swipe, scroll wheel, side arrows or page dots to change pages
- Speaker button (top right) mutes music and sounds

## Credits

The background video and menu music in `media/` come from a capture of the Wii U Menu, and game covers downloaded into `img/games/` belong to their publishers. All other artwork is original. Fan-made; not affiliated with Nintendo.
