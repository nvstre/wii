# Music

Drop audio files here and the Music app plays them.

- One folder per album works best: `music/2093/01 Song.mp3`, `music/2093/02 Other Song.mp3`
- MP3s use their own tags for title, album, track number and cover art.
- Other formats (m4a, ogg, wav, flac) use the folder name as the album and the file name as the title. A leading number like `01 ` sets the track order.
- Put a `cover.jpg` in an album folder to use it as that album's art.

`npm start` rebuilds the song list (`tracks.js`) every time it starts. Run `npm run music` to rebuild it without starting the server. Commit `tracks.js` and the `covers/` folder along with the songs.
