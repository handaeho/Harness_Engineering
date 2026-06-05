#!/usr/bin/env node
import { checkProviderVerifiedGateDesign, resolveRoot } from "./lib/strict_paths_autopilot.mjs";

const report = checkProviderVerifiedGateDesign(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
