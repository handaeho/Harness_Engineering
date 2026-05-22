import fs from "node:fs";
import path from "node:path";
import { readText } from "./file_walk.mjs";

export function loadJsonl(file) {
  return readText(file)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => ({
      line: index + 1,
      value: JSON.parse(line)
    }));
}

export function loadAdapterFixtures(root) {
  const fixtureDir = path.join(root, "evals", "fixtures", "adapters");
  const files = fs.readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .map((file) => path.join(fixtureDir, file));
  const cases = [];
  for (const file of files) {
    for (const record of loadJsonl(file)) {
      cases.push({
        file,
        line: record.line,
        ...record.value
      });
    }
  }
  return cases;
}
