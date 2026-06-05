# Git Commit After HARNESS Core Rename

HARNESS Core rename은 파일 시스템과 tracked path 기준으로 정리되어 있다.

단, git commit 전에는 staged rename source가 status/diff에 표시될 수 있다.
이 표시를 없애려면 실제 commit이 필요하다.

필수 승인 문구:

```text
I approve committing the HARNESS Core rename and final surface cleanup.
```

승인 문구가 없으면 commit하지 않는다.
