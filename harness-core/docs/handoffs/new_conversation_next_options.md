# 새 대화 다음 선택지

권장 기본값: `stop_or_archive_export`

1. `final_archive_export_package`
   - Stage: `v2.0.0-openai-only-stable-archive-export`
   - Operator signal: 불필요
   - 목적: 현재 OpenAI-only scoped archive를 export/package로 묶는다.

2. `local_endpoint_readiness_preflight`
   - Stage: `v2.0.0-post-stable-local-endpoint-readiness-preflight`
   - Operator signal: `local endpoint is ready`
   - 목적: operator가 endpoint 정보를 제공한 뒤 local endpoint path를 시작한다.

3. `strict_provider_diverse_path`
   - Stage: `v2.0.0-post-stable-provider-diverse-path`
   - Operator signal: `local endpoint or second provider evidence ready`
   - 목적: local/second provider evidence가 준비된 뒤 strict provider-diverse path를 시작한다.
