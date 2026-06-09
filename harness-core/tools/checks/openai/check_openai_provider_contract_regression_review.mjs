#!/usr/bin/env node
import { resolveRoot, checkOpenAIProviderContractRegressionReview } from "../../lib/post_export_provider_adapter_coverage_hardening_autopilot.mjs";

const report = checkOpenAIProviderContractRegressionReview(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
