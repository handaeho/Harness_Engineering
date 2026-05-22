# Current Package Hard Cleanup Inventory

## Summary
- total_files: 127
- total_dirs: 914
- empty_dirs: 530
- raw_evidence_dirs: sources, archive, 04_upgraded_prompt_assets, records/actor_outputs, records/actor_packets, validation/runs
- cleanup_record_files: 8
- cleanup_report_files: 2

## Top-level Entries
| name | mode | files | dirs |
|---|---|---:|---:|
| 04_upgraded_prompt_assets | d----- | 0 | 0 |
| AGENTS.md | -a---- | 1 | 0 |
| archive | d----- | 0 | 10 |
| autonomous | d----- | 39 | 10 |
| codex | d----- | 10 | 9 |
| docs | d----- | 15 | 7 |
| harness | d----- | 7 | 0 |
| lifecycle | d----- | 5 | 0 |
| MASTER_PROMPT_ROUTER.md | -a---- | 1 | 0 |
| PROMPT_USER_GUIDE.md | -a---- | 1 | 0 |
| README.md | -a---- | 1 | 0 |
| records | d----- | 20 | 12 |
| reports | d----- | 7 | 0 |
| sources | d----- | 0 | 852 |
| state | d----- | 6 | 0 |
| validation | d----- | 6 | 1 |
| verification | d----- | 8 | 0 |

## Verdict
active package에 빈 evidence directory와 cleanup/process 산출물이 남아 있다. hard cleanup은 파일을 삭제하지 않고 cleanup/process 파일을 _evidence/active-package/로 이동하고, 빈 디렉터리만 제거한다.
