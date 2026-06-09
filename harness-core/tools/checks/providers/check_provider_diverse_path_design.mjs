#!/usr/bin/env node
import { checkProviderDiversePathDesign, resolveRoot } from "../../lib/strict_paths_autopilot.mjs";

const report = checkProviderDiversePathDesign(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
