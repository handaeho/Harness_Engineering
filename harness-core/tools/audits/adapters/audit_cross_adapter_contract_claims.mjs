#!/usr/bin/env node
import { resolveRoot, auditCrossAdapterContractClaims } from "../../lib/post_export_provider_adapter_coverage_hardening_autopilot.mjs";

const report = auditCrossAdapterContractClaims(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
