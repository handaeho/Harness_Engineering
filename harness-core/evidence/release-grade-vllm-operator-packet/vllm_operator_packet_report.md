# Release-grade vLLM Operator Packet

Status: pass

- Package report: hold
- Missing or incomplete vLLM artifacts: 7
- Stale or unordered vLLM artifacts: 0
- Claims opened by this packet: none
- Blockers: 0

## Full Command

```bash
npm run vllm-release-grade-evidence-gate
```

## Manual Command Sequence

1. `npm run preflight:vllm-operator-env`
2. `npm run preflight:vllm-live-canary`
3. `npm run canary:vllm-no-tool`
4. `npm run check:vllm-no-tool`
5. `npm run run:vllm-adapter-conformance`
6. `npm run check:vllm-adapter-conformance`
7. `npm run check:release-grade-adapter-vllm`
8. `npm run check:release-grade-vllm-evidence-package`
9. `npm run general-release-grade-gate`
10. `npm run check:release-grade-vllm-evidence-package`
11. `npm run apply:release-grade-claim-state-sync`
12. `npm run check:release-grade-claim-state-sync`
13. `npm run check:final-precommit-convergence`
14. `npm run general-release-grade-gate`
15. `npm run check:release-grade-vllm-evidence-package`
16. `npm run apply:release-grade-claim-state-sync`
17. `npm run check:release-grade-claim-state-sync`
18. `npm run check:final-precommit-convergence`
