#!/usr/bin/env node
import { refreshActiveScopedArchiveState, resolveRoot } from "../../lib/post_active_scoped_archive_and_general_readiness_autopilot.mjs";

const report = refreshActiveScopedArchiveState(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
