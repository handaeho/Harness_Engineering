#!/usr/bin/env node
import path from "node:path";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { writeJsonReport } from "./lib/report_writer.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const outputPath = path.join(root, "evidence", "alpha", "prohibited_claim_scan.json");

const result = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git"
  ]
});

writeJsonReport(outputPath, result);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
