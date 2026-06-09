#!/usr/bin/env node
import { checkActiveScopedStableFinalGate, resolveRoot } from "../../lib/post_active_scoped_archive_and_general_readiness_autopilot.mjs";

const report = checkActiveScopedStableFinalGate(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
