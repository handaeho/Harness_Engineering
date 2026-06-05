#!/usr/bin/env node
import { resolveRoot, repairQwen3StructuredOutputSmoke } from "./lib/post_export_active_scoped_coverage_repair_autopilot.mjs";

const report = await repairQwen3StructuredOutputSmoke(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
