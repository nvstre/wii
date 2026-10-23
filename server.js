// Zero-dependency static server: `npm start` or `node server.js [port]`.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 8080);

// Rebuild the Music app's song list from whatever is in music/
try {
  const songs = require("./scripts/scan-music").scan();
  console.log(`Music: ${songs} song${songs === 1 ? "" : "s"} in music/`);
} catch (e) {
  console.log(`Music: couldn't read music/ (${e.message})`);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }
      const headers = {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      };

      // Byte ranges, so video can stream and seek (Safari won't play video without them)
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      if (range && (range[1] || range[2])) {
        let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
        let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
        start = Math.max(0, start);
        end = Math.min(end, stat.size - 1);
        if (start > end) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
          return;
        }
        res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, { ...headers, "Content-Length": stat.size });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(port, () => console.log(`Wii U Menu running at http://localhost:${port}`));
