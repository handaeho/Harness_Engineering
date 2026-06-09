#!/usr/bin/env node
import { checkAdapterCheckedCoverageCompletion, resolveRoot } from "../../lib/post_final_export_strict_claims_autopilot.mjs";
const report = checkAdapterCheckedCoverageCompletion(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
