# Provider-Verified Claim Boundary

`provider-verified`는 release-grade provider-verified gate가 `pass`이고
`evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json`의
`provider_verified_allowed`가 `true`일 때만 허용됩니다.

현재 bare `provider-verified`는 해당 gate evidence로 열려 있습니다.
이 claim은 provider lane 증거만 의미하며 `adapter-checked`, bare `production-ready`,
bare `stable`, bare `release-gated`를 의미하지 않습니다.

`adapter-checked`, `production-ready`, `stable`, `release-gated`는 계속 blocked입니다.
