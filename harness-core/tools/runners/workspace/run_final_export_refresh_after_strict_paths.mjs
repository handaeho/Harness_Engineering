#!/usr/bin/env node
import { resolveRoot, runFinalExportRefreshAfterStrictPaths } from "../../lib/post_final_export_strict_claims_autopilot.mjs";
const report = runFinalExportRefreshAfterStrictPaths(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
