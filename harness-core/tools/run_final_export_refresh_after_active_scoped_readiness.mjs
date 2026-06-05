#!/usr/bin/env node
import { resolveRoot, runFinalExportRefreshAfterActiveScopedReadiness } from "./lib/post_active_scoped_archive_and_general_readiness_autopilot.mjs";

const report = runFinalExportRefreshAfterActiveScopedReadiness(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
