#!/usr/bin/env node
import { resolveRoot, checkOllamaReplayRegressionSmoke } from "../../lib/post_export_provider_adapter_coverage_hardening_autopilot.mjs";

const report = checkOllamaReplayRegressionSmoke(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
