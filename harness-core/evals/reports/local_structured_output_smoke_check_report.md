# Local Structured-output Smoke Canary Check

Status: pass

- Stage: v2.0.0-post-stable-local-structured-output-smoke-canary
- New local generation calls: 4
- Can proceed to tool-calling mock smoke: true
- Unresolved items: 0

## Checks

- pass: local_structured_output_smoke_report.json exists
- pass: local_structured_output_response_mapping.json exists
- pass: local_structured_output_redaction_report.json exists
- pass: local_structured_output_claim_boundary.json exists
- pass: local_structured_output_blocker_update.json exists
- pass: local_structured_output_gate_report.json exists
- pass: unresolved_items.json exists
- pass: stage matches
- pass: status pass
- pass: new local generation call count bounded
- pass: models covered
- pass: cases passed
- pass: all json parse checks passed
- pass: raw request/response not stored
- pass: redaction passed
- pass: protected paths unmodified
- pass: strong claims blocked
- pass: prohibited claim scan pass
- pass: local blocked positive claims absent
