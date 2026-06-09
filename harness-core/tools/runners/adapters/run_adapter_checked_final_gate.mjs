#!/usr/bin/env node
import { runAdapterCheckedFinalGate, resolveRoot } from "../../lib/post_final_export_strict_claims_autopilot.mjs";
const report = runAdapterCheckedFinalGate(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" || report.status === "blocked_by_adapter_checked_coverage_not_ready" ? 0 : 1);
