#!/usr/bin/env node
import { resolveRoot, auditActiveAdaptersCheckedClaims } from "../../lib/post_export_provider_adapter_coverage_hardening_autopilot.mjs";

const report = auditActiveAdaptersCheckedClaims(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
