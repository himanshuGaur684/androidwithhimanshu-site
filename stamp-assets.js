// Adds a version tag to every CSS/JS link in the HTML pages, e.g. styles.css?v=3f2a1b9c.
// The tag is a fingerprint of the file's contents, so it only changes when the file changes.
// Browsers and GoDaddy's network cache CSS/JS for weeks; a new tag makes them fetch the new file.
// Run after editing any .css or .js file:  npm run stamp
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const fingerprint = (file) => crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 8);

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
})(ROOT);

let changed = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const updated = html.replace(/(href|src)="((?:\.\.\/)*[\w\/.-]+\.(?:css|js))(?:\?v=\w+)?"/g, (match, attr, ref) => {
    const target = path.resolve(path.dirname(file), ref);
    if (!fs.existsSync(target)) return match; // external or missing: leave alone
    return `${attr}="${ref}?v=${fingerprint(target)}"`;
  });
  if (updated !== html) {
    fs.writeFileSync(file, updated);
    changed++;
  }
}
console.log(`Stamped CSS/JS versions in ${changed} of ${htmlFiles.length} HTML files.`);
