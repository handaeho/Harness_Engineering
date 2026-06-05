#!/usr/bin/env node
import { draftFinalExportPackage, resolveRoot } from "./lib/strict_paths_autopilot.mjs";

const report = draftFinalExportPackage(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
