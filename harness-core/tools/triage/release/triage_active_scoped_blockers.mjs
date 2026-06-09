#!/usr/bin/env node
import { resolveRoot, triageActiveScopedBlockers } from "../../lib/post_export_active_scoped_coverage_repair_autopilot.mjs";

const report = triageActiveScopedBlockers(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
