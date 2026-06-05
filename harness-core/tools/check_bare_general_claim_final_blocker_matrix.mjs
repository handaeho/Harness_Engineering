#!/usr/bin/env node
import { checkBareGeneralClaimFinalBlockerMatrix, resolveRoot } from "./lib/post_active_scoped_terminal_hardening_final_dossier_autopilot.mjs";

const report = checkBareGeneralClaimFinalBlockerMatrix(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
