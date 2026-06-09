#!/usr/bin/env node
import { checkAdapterCheckedFinalGate, resolveRoot } from "../../lib/post_final_export_strict_claims_autopilot.mjs";
const report = checkAdapterCheckedFinalGate(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
