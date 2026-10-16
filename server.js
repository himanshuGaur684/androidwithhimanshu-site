// Tiny static file server for the site. No dependencies: uses only Node's built-in modules.
// The hosting platform tells us which port to use through the PORT environment variable.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

// Server-side files that should never be downloadable
const PRIVATE = new Set(["/server.js", "/package.json", "/package-lock.json"]);

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

// Map a URL path to a file: /, /books/, /blog/first-ktor-api (clean URL) and /blog/first-ktor-api.html all work
function resolve(urlPath) {
  const base = path.join(ROOT, urlPath);
  if (base !== ROOT && !base.startsWith(ROOT + path.sep)) return null; // block ../ path tricks
  const candidates = urlPath.endsWith("/")
    ? [path.join(base, "index.html")]
    : [base, base + ".html", path.join(base, "index.html")];
  return candidates.find(isFile) || null;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }

  // Hidden files (like .htaccess) and server files stay private
  if (PRIVATE.has(urlPath) || urlPath.split("/").some((part) => part.startsWith("."))) {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    return;
  }

  const file = resolve(urlPath);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end('<h1>Page not found</h1><p><a href="/">Go to the homepage</a></p>');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    // Pages always revalidate so updates show up immediately; images can be cached for a day
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`Android with Himanshu is running on port ${PORT}`));
