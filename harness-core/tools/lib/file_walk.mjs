import fs from "node:fs";
import path from "node:path";

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

export function readJson(file) {
  return JSON.parse(readText(file));
}

export function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

export function walkFiles(root, options = {}) {
  const {
    excludedPaths = [],
    extensions = null
  } = options;
  const files = [];
  const absRoot = path.resolve(root);

  function isExcluded(absPath) {
    const rel = toPosix(path.relative(absRoot, absPath));
    return excludedPaths.some((excluded) => rel === excluded || rel.startsWith(`${excluded}/`));
  }

  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, item.name);
      if (isExcluded(abs)) continue;
      if (item.isDirectory()) {
        walk(abs);
      } else if (!extensions || extensions.some((ext) => item.name.endsWith(ext))) {
        files.push(abs);
      }
    }
  }

  walk(absRoot);
  return files;
}

export function relativeTo(root, file) {
  return toPosix(path.relative(path.resolve(root), path.resolve(file)));
}
