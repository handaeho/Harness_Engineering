# Active Scoped Repair Plan

Status: `planned`

- qwen3:14b structured-output primary retry: 2 calls.
- qwen3:14b native diagnostic path: max 2 calls.
- qwen3:14b replay/regression retry: 2 calls.
- 동일 실패에 대해 1회 초과 repair가 필요하면 hard stop입니다.
