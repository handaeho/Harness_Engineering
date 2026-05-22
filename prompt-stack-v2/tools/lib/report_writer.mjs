import { writeJson, writeText } from "./file_walk.mjs";

export function writeJsonReport(file, report) {
  writeJson(file, report);
}

export function writeMarkdownReport(file, title, report, sections = []) {
  const lines = [`# ${title}`, "", `Status: ${report.status}`, ""];
  for (const section of sections) {
    lines.push(`## ${section.title}`, "");
    lines.push(section.body || "- none", "");
  }
  writeText(file, lines.join("\n"));
}
