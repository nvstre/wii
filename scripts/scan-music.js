// Builds music/tracks.js from the audio files in music/. `npm start` runs it automatically;
// `npm run music` runs it on its own. Titles, albums and covers come from the files' tags
// (MP3/ID3), then from folder and file names: music/<Album>/<01 Title>.mp3, plus an optional cover.jpg.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const root = path.join(__dirname, "..");
const dir = path.join(root, "music");
const coversDir = path.join(dir, "covers");
const AUDIO = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i;
const FOLDER_COVER = /^(cover|folder|front|album)\.(jpe?g|png|webp)$/i;

const syncsafe = (b, o) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);

function decodeText(data) {
  if (!data.length) return "";
  const enc = data[0];
  let body = data.subarray(1);
  let text;
  if (enc === 1 || enc === 2) {
    let littleEndian = enc === 1;
    if (body[0] === 0xff && body[1] === 0xfe) {
      littleEndian = true;
      body = body.subarray(2);
    } else if (body[0] === 0xfe && body[1] === 0xff) {
      littleEndian = false;
      body = body.subarray(2);
    }
    if (!littleEndian) {
      body = Buffer.from(body);
      for (let i = 0; i + 1 < body.length; i += 2) [body[i], body[i + 1]] = [body[i + 1], body[i]];
    }
    text = body.toString("utf16le");
  } else {
    text = body.toString(enc === 3 ? "utf8" : "latin1");
  }
  return text.split("\0")[0].trim();
}

function readPicture(data) {
  const enc = data[0];
  let p = data.indexOf(0, 1);
  const mime = data.toString("latin1", 1, p);
  p += 2; // terminator + picture type
  if (enc === 1 || enc === 2) {
    while (p + 1 < data.length && !(data[p] === 0 && data[p + 1] === 0)) p += 2;
    p += 2;
  } else {
    p = data.indexOf(0, p) + 1;
  }
  return { mime: mime || "image/jpeg", data: data.subarray(p) };
}

// ID3v2.3 / v2.4 text frames and the first embedded picture
function readTags(file) {
  if (!/\.mp3$/i.test(file)) return {};
  const fd = fs.openSync(file, "r");
  try {
    const head = Buffer.alloc(10);
    if (fs.readSync(fd, head, 0, 10, 0) < 10 || head.toString("latin1", 0, 3) !== "ID3") return {};
    const version = head[3];
    if (version !== 3 && version !== 4) return {};
    const buf = Buffer.alloc(syncsafe(head, 6));
    fs.readSync(fd, buf, 0, buf.length, 10);
    let pos = 0;
    if (head[5] & 0x40) pos += version === 4 ? syncsafe(buf, 0) : buf.readUInt32BE(0) + 4;
    const tags = {};
    while (pos + 10 <= buf.length) {
      const id = buf.toString("latin1", pos, pos + 4);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const len = version === 4 ? syncsafe(buf, pos + 4) : buf.readUInt32BE(pos + 4);
      const data = buf.subarray(pos + 10, pos + 10 + len);
      pos += 10 + len;
      if (id[0] === "T" && id !== "TXXX") tags[id] = decodeText(data);
      else if (id === "APIC" && !tags.APIC) tags.APIC = readPicture(data);
    }
    return tags;
  } catch (e) {
    return {};
  } finally {
    fs.closeSync(fd);
  }
}

function audioFiles(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || entry.name === "covers") return [];
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) return audioFiles(full);
    return AUDIO.test(entry.name) ? [full] : [];
  });
}

// NFC everywhere: macOS hands back names like "ë" as e + ¨, but git stores the composed form,
// so a decomposed path in tracks.js would 404 once the site is on a normal web host.
const nfc = (s) => String(s || "").normalize("NFC");
const rel = (file) => nfc(path.relative(root, file).split(path.sep).join("/"));
const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function scan() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/config.js"), "utf8"), sandbox);
  const musicCfg = ((sandbox.window.WIIU_CONFIG || {}).pages || {}).music || {};
  const knownCovers = new Map(
    (musicCfg.albums || [])
      .filter((a) => a.icon && fs.existsSync(path.join(root, a.icon)))
      .map((a) => [norm(a.title), a.icon])
  );

  const usedCovers = new Set();
  const tracks = audioFiles(dir).map((file) => {
    const tags = readTags(file);
    const folder = path.dirname(file);
    const base = path.basename(file).replace(AUDIO, "");
    const numbered = /^(\d{1,3})[\s._-]+(.+)$/.exec(base);
    const album = tags.TALB || (folder === dir ? "Singles" : path.basename(folder));

    let cover = "";
    if (tags.APIC && tags.APIC.data.length > 100) {
      const ext = /png/i.test(tags.APIC.mime) ? "png" : /webp/i.test(tags.APIC.mime) ? "webp" : "jpg";
      const name = `${crypto.createHash("sha1").update(tags.APIC.data).digest("hex").slice(0, 12)}.${ext}`;
      fs.mkdirSync(coversDir, { recursive: true });
      const out = path.join(coversDir, name);
      if (!fs.existsSync(out)) fs.writeFileSync(out, tags.APIC.data);
      cover = rel(out);
      usedCovers.add(name);
    } else {
      const local = fs.readdirSync(folder).find((n) => FOLDER_COVER.test(n));
      cover = local ? rel(path.join(folder, local)) : knownCovers.get(norm(album)) || "";
    }

    return {
      file: rel(file),
      title: nfc(tags.TIT2 || (numbered ? numbered[2] : base)),
      artist: nfc(tags.TPE1 || musicCfg.artist || ""),
      album: nfc(album),
      track: parseInt(tags.TRCK, 10) || (numbered ? Number(numbered[1]) : 0),
      year: (tags.TYER || tags.TDRC || "").slice(0, 4),
      cover,
    };
  });

  // albums in release order, songs in track order
  const albumYear = new Map();
  tracks.forEach((t) => {
    const y = Number(t.year) || 9999;
    albumYear.set(t.album, Math.min(albumYear.get(t.album) || 9999, y));
  });
  tracks.sort((a, b) =>
    albumYear.get(a.album) - albumYear.get(b.album) || a.album.localeCompare(b.album) || a.track - b.track || a.title.localeCompare(b.title)
  );

  // drop covers no song uses any more
  if (fs.existsSync(coversDir)) {
    fs.readdirSync(coversDir).forEach((n) => {
      if (!usedCovers.has(n)) fs.rmSync(path.join(coversDir, n));
    });
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "tracks.js"),
    "// Generated from the files in music/ by scripts/scan-music.js. Run `npm run music` after adding songs.\n" +
      `window.WIIU_TRACKS = ${JSON.stringify(tracks, null, 2)};\n`
  );
  return tracks.length;
}

module.exports = { scan };

if (require.main === module) {
  const n = scan();
  console.log(`${n} song${n === 1 ? "" : "s"} found in music/ -> music/tracks.js`);
}
