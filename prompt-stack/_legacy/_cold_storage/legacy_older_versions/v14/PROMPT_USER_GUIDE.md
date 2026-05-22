```text
v14 프롬프트 스택 정리
- 원본 보관 폴더
- 실사용 폴더
- 목적별 폴더 구조
- 각 폴더/파일 설명
- 실제 운영 시 해석 방법

================================================================
1. 이 정리의 목적
================================================================

이 정리는 v14 프롬프트 스택을 실제로 오래 보관하고, 목적별로 바로 꺼내 쓰기 쉽게 정리하기 위한 폴더 구조 가이드입니다.

핵심 목적은 다음과 같습니다.

1) 원본 13개 문서를 역할별로 분리 보관
2) 플랫폼별(ChatGPT / Cursor / Codex)로 바로 꺼내 쓸 수 있게 구성
3) 목적별(일반 assistant / 코딩 agent / 설계 분석 / grounded research / memory / multi-agent / eval ops)로 바로 복사해서 쓸 수 있게 구성
4) base / overlay / example / governance 역할이 섞이지 않도록 구조화
5) 나중에 다시 봐도 “무슨 파일이 왜 여기에 있는지” 바로 이해 가능하게 정리

이 구조는 “새 문서를 상상해서 만드는 구조”가 아니라,
현재 실제 보유한 파일 13개만 기준으로 분류하고 복사 배치하는 구조입니다.

================================================================
2. 현재 실제 보유 파일 목록
================================================================

현재 실제 보유 파일은 아래 13개입니다.

[governance]
- PROMPT_v14_guideline.txt

[base execution prompts]
- PROMPT_v14_full.txt
- PROMPT_v14_light.txt
- PROMPT_v14_lightest.txt
- PROMPT_v14_standalone.txt

[examples]
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt

[overlays]
- PROMPT_v14_memory_adaptation_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_multi_agent_overlay.txt
- PROMPT_v14_search_reasoning_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_evaluation_monitoring_overlay.txt

즉, 아래 모든 폴더 구조는 이 13개 파일만 이동/복사해서 구성하는 방식입니다.

================================================================
3. 먼저 이해해야 할 기본 원칙
================================================================

이 v14 스택은 “문서 13개를 항상 한 번에 전부 넣는 구조”가 아닙니다.

핵심 원칙은 다음과 같습니다.

1) base prompt는 항상 1개만 선택
- PROMPT_v14_full.txt
- PROMPT_v14_light.txt
- PROMPT_v14_lightest.txt
- PROMPT_v14_standalone.txt

이 4개 중 하나만 base execution prompt로 사용합니다.

2) overlay는 필요한 것만 선택
- retrieval이 필요하면 retrieval_grounding_overlay
- reasoning depth / candidate comparison이 필요하면 search_reasoning_overlay
- tool / API / file / MCP가 필요하면 tool_protocol_overlay
- continuity / preference reuse가 필요하면 memory_adaptation_overlay
- role 분리 / handoff / specialist 구조가 필요하면 multi_agent_overlay
- regression / drift / release gate / scorecard가 필요하면 evaluation_monitoring_overlay

3) guideline은 실행 본체가 아니라 상위 설계 기준서
- 직접 매번 운영 프롬프트로 넣는 문서라기보다
- ownership / boundary / runtime model / release-quality 확인용 기준서입니다

4) example layer는 구조 보조 장치
- example_catalog = 구조 예시 데이터
- example_injection = 그 예시를 언제/어떻게 적용할지 결정하는 controller

5) example은 구조만 돕는다
- 사실을 정하지 않음
- 근거를 대체하지 않음
- 정책 권한을 가지지 않음
- tool choice를 정하지 않음

즉, 폴더 구조도 이 역할 분리를 그대로 반영하는 게 가장 좋습니다.

================================================================
4. 가장 권장하는 전체 루트 구조
================================================================

아래 구조가 가장 권장되는 최상위 구조입니다.

prompt-stack-v14/
├─ 00_governance/
│  └─ PROMPT_v14_guideline.txt
│
├─ 01_base/
│  ├─ PROMPT_v14_full.txt
│  ├─ PROMPT_v14_light.txt
│  ├─ PROMPT_v14_lightest.txt
│  └─ PROMPT_v14_standalone.txt
│
├─ 02_overlays/
│  ├─ PROMPT_v14_memory_adaptation_overlay.txt
│  ├─ PROMPT_v14_tool_protocol_overlay.txt
│  ├─ PROMPT_v14_multi_agent_overlay.txt
│  ├─ PROMPT_v14_search_reasoning_overlay.txt
│  ├─ PROMPT_v14_retrieval_grounding_overlay.txt
│  └─ PROMPT_v14_evaluation_monitoring_overlay.txt
│
├─ 03_examples/
│  ├─ PROMPT_v14_example_injection.txt
│  └─ PROMPT_v14_example_catalog.txt
│
├─ 10_chatgpt/
│  ├─ PROMPT_v14_light.txt
│  ├─ PROMPT_v14_retrieval_grounding_overlay.txt
│  └─ PROMPT_v14_tool_protocol_overlay.txt
│
├─ 11_cursor/
│  ├─ PROMPT_v14_standalone.txt
│  ├─ PROMPT_v14_tool_protocol_overlay.txt
│  ├─ PROMPT_v14_example_injection.txt
│  └─ PROMPT_v14_example_catalog.txt
│
├─ 12_codex/
│  ├─ PROMPT_v14_standalone.txt
│  ├─ PROMPT_v14_tool_protocol_overlay.txt
│  ├─ PROMPT_v14_example_injection.txt
│  └─ PROMPT_v14_example_catalog.txt
│
├─ 20_general_assistant/
│  ├─ PROMPT_v14_light.txt
│  ├─ PROMPT_v14_retrieval_grounding_overlay.txt
│  └─ PROMPT_v14_tool_protocol_overlay.txt
│
├─ 21_coding_agent/
│  ├─ PROMPT_v14_standalone.txt
│  ├─ PROMPT_v14_tool_protocol_overlay.txt
│  ├─ PROMPT_v14_example_injection.txt
│  └─ PROMPT_v14_example_catalog.txt
│
├─ 22_design_analysis/
│  ├─ PROMPT_v14_full.txt
│  ├─ PROMPT_v14_search_reasoning_overlay.txt
│  └─ PROMPT_v14_retrieval_grounding_overlay.txt
│
├─ 23_grounded_research/
│  ├─ PROMPT_v14_light.txt
│  ├─ PROMPT_v14_retrieval_grounding_overlay.txt
│  └─ PROMPT_v14_search_reasoning_overlay.txt
│
├─ 24_memory_enabled/
│  ├─ PROMPT_v14_light.txt
│  ├─ PROMPT_v14_memory_adaptation_overlay.txt
│  └─ PROMPT_v14_retrieval_grounding_overlay.txt
│
├─ 25_multi_agent/
│  ├─ PROMPT_v14_full.txt
│  ├─ PROMPT_v14_multi_agent_overlay.txt
│  ├─ PROMPT_v14_tool_protocol_overlay.txt
│  └─ PROMPT_v14_retrieval_grounding_overlay.txt
│
└─ 26_eval_ops/
   ├─ PROMPT_v14_full.txt
   ├─ PROMPT_v14_evaluation_monitoring_overlay.txt
   └─ PROMPT_v14_search_reasoning_overlay.txt

이 전체 구조는 크게 3층으로 이해하면 쉽습니다.

1) 00~03 = 원본 라이브러리
2) 10~12 = 플랫폼별 실사용 세트
3) 20~26 = 목적별 실사용 세트

================================================================
5. 원본 보관 폴더 상세 설명
================================================================

------------------------------------------------------------
5.1 00_governance/
------------------------------------------------------------

구성:
- PROMPT_v14_guideline.txt

의미:
- 이 폴더는 스택 전체의 상위 기준서를 보관하는 곳입니다.
- guideline은 실행 본체가 아니라 governance hub입니다.
- stack 정의, ownership boundary, runtime model canon, variant consistency, release-quality doctrine을 점검할 때 보는 문서입니다.

왜 따로 두는가:
- base prompt와 섞어두면 “이게 실행용인지 설계 기준서인지” 헷갈리기 쉽기 때문입니다.
- overlay와 같은 레벨로 놓으면 guideline도 항상 실행에 붙이는 문서처럼 오해하기 쉽습니다.

실무 해석:
- 매번 runtime에 직접 넣는 문서라기보다
- 프롬프트 설계 / 유지보수 / 리팩터링 / drift 점검 / ownership 점검 때 보는 문서입니다.

즉:
- 보관/참고용 최상위 설계 기준서
- 실행용 본체 아님

------------------------------------------------------------
5.2 01_base/
------------------------------------------------------------

구성:
- PROMPT_v14_full.txt
- PROMPT_v14_light.txt
- PROMPT_v14_lightest.txt
- PROMPT_v14_standalone.txt

의미:
- 이 폴더는 실제 base execution prompt만 모아두는 곳입니다.
- 여기 있는 문서들은 에이전트의 기본 성격과 실행 posture를 결정합니다.

각 파일 의미:

1) PROMPT_v14_full.txt
- 고정밀
- 고위험
- 다단계
- verification-heavy
- 설계/아키텍처/복합 디버깅/복합 의사결정에 적합

2) PROMPT_v14_light.txt
- 일반적인 실무용 기본값
- 기술 질의, 구현 가이드, 보통 수준의 디버깅, 일반 assistant에 적합
- 가장 범용성이 좋음

3) PROMPT_v14_lightest.txt
- 매우 단순한 작업
- 토큰/지연 제약이 큰 환경
- fallback 용도
- 설명보다 신속성과 최소 orchestration이 중요할 때

4) PROMPT_v14_standalone.txt
- 코딩 에이전트용 압축 실행 헌법
- Cursor / Codex / IDE patch agent 용도에 적합
- diff-first / bounded change / verify-before-claim 성격이 강함

가장 중요한 원칙:
- 이 4개는 동시에 쓰는 문서가 아닙니다.
- 항상 1개만 선택합니다.

즉:
- full 또는
- light 또는
- lightest 또는
- standalone

중 하나만 base로 사용합니다.

------------------------------------------------------------
5.3 02_overlays/
------------------------------------------------------------

구성:
- PROMPT_v14_memory_adaptation_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_multi_agent_overlay.txt
- PROMPT_v14_search_reasoning_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_evaluation_monitoring_overlay.txt

의미:
- 이 폴더는 기능 강화용 옵션 레이어를 보관하는 곳입니다.
- base prompt를 대체하는 것이 아니라, base에 필요한 기능만 추가하는 구조입니다.

각 overlay 의미:

1) memory_adaptation_overlay
- working/session/persistent memory
- continuity
- preference reuse
- validated adaptation
- 장기 대화, 사용자 선호, 반복 제약에 적합

2) tool_protocol_overlay
- tool/API/MCP/file/database/browser/external system 사용 규칙
- read/write/destructive classification
- parameter discipline
- result validation
- least privilege
- 외부 capability 사용할 때 핵심

3) multi_agent_overlay
- coordinator / specialist / critic / integrator 구조
- role topology
- handoff contract
- artifact exchange
- agent-as-tool vs multi-agent distinction
- 역할 분리된 협업형 구조에 사용

4) search_reasoning_overlay
- prioritization
- exploit/explore balance
- candidate generation
- pruning
- reasoning depth selection
- bounded search / discovery
- 여러 경로를 비교하거나 탐색이 필요한 문제에 적합

5) retrieval_grounding_overlay
- grounding need
- evidence target
- provenance
- freshness
- source conflict handling
- citation-grounded synthesis
- 문서 기반 분석, 최신 정보, 근거 중심 답변에 적합

6) evaluation_monitoring_overlay
- eval
- scorecard
- regression
- drift
- anomaly
- release gate
- prompt-version audit
- 운영/품질평가/릴리즈 검증에 적합

가장 중요한 원칙:
- overlay는 항상 전부 붙이지 않습니다.
- 필요한 것만 선택해서 base에 추가합니다.

------------------------------------------------------------
5.4 03_examples/
------------------------------------------------------------

구성:
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt

의미:
- 이 폴더는 example layer 전용 폴더입니다.
- 응답 구조를 안정화하거나 artifact shape를 잡고 싶을 때만 씁니다.

각 파일 의미:

1) PROMPT_v14_example_injection.txt
- example을 언제 쓸지
- 어떤 example이 맞는지
- skeleton으로 쓸지
- local patch only로 쓸지
- skip할지/prune할지
를 결정하는 controller 문서

2) PROMPT_v14_example_catalog.txt
- 구조 예시 registry
- static example data source
- 구조, section shape, verification pattern, artifact geometry 예시 저장소
- 실행 제어권은 없음

중요 원칙:
- example_catalog만 단독으로 넣는다고 구조 제어가 잘 되는 게 아닙니다.
- example_injection이 있어야 catalog를 구조적으로 해석할 수 있습니다.
- example은 구조만 돕고, 사실/근거/정책 권한은 가지지 않습니다.

================================================================
6. 실사용 폴더 상세 설명
================================================================

실사용 폴더는 원본을 훼손하지 않고, 실제 플랫폼에서 바로 꺼내 쓸 수 있게 복사해둔 폴더입니다.

즉:
- 00~03 = 라이브러리
- 10~12 = 바로 쓰는 세트

------------------------------------------------------------
6.1 10_chatgpt/
------------------------------------------------------------

구성:
- PROMPT_v14_light.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt

의미:
- ChatGPT 범용 실무형 기본 세트
- 가장 무난하고 실전적인 조합
- 일반 기술 assistant, 실무형 질의응답, grounded factual support, tool use까지 커버 가능

왜 이 조합인가:
- ChatGPT는 범용 assistant 성격이 강하므로 base는 light가 가장 적합
- retrieval_grounding_overlay를 붙이면 근거/출처/최신성 대응 가능
- tool_protocol_overlay를 붙이면 tool/API/file 등 외부 capability를 다룰 때 안전해짐

어떤 작업에 적합한가:
- 일반 기술 질문
- 구현 가이드
- 보통 수준의 디버깅
- 실무형 요약/설명
- 근거 기반 답변
- 외부 tool을 수반하는 practical assistant

필요 시 추가 가능:
- search_reasoning_overlay
- example_injection
- example_catalog
- memory_adaptation_overlay

하지만 기본 실사용 폴더는 과도하게 무겁지 않게 위 3개 정도가 가장 적당합니다.

------------------------------------------------------------
6.2 11_cursor/
------------------------------------------------------------

구성:
- PROMPT_v14_standalone.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt

의미:
- Cursor용 코딩 에이전트 기본 세트
- standalone을 base로 사용하는 코딩 중심 세트
- 파일 수정, patch, code review, bounded mutation에 적합

왜 이 조합인가:
- Cursor는 코딩 작업과 repo 문맥을 다루는 경우가 많음
- standalone은 코딩 agent에 맞는 압축 실행 헌법
- tool_protocol_overlay는 파일/실행/외부 상태/툴 사용 규칙을 강화
- example layer는 diff/review/verification 구조 안정화에 도움

어떤 작업에 적합한가:
- 코드 수정
- patch 제안
- 코드 리뷰
- narrow fix
- repo-safe mutation
- verify-before-claim 중심 코드 작업

필요 시 추가 가능:
- retrieval_grounding_overlay
- search_reasoning_overlay

예를 들어:
- 문서 근거 기반 변경
- 여러 수정 경로를 비교해야 하는 경우
에는 추가로 overlay를 복사해 넣어도 됩니다.

------------------------------------------------------------
6.3 12_codex/
------------------------------------------------------------

구성:
- PROMPT_v14_standalone.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt

의미:
- Codex용 코딩 에이전트 기본 세트
- base는 standalone 고정
- Cursor와 유사하지만 Codex 기준으로 더 직접적인 코딩 agent 세트

왜 이 조합인가:
- Codex는 코딩/patch/repo mutation 작업에 가장 잘 맞음
- standalone이 diff-first / bounded change / verify-before-claim 성격을 제공
- tool_protocol_overlay가 외부 상태와 tool 사용을 안전하게 다룸
- example layer는 structure-only support 제공

어떤 작업에 적합한가:
- 코드 생성
- 파일 수정
- patch
- repo-safe 변경
- local fix
- review-ready 제안

필요 시 추가 가능:
- retrieval_grounding_overlay

예:
- 특정 문서/사양/코드베이스 근거를 따라 구현해야 할 때

================================================================
7. 목적별 폴더 구조 상세 설명
================================================================

목적별 폴더는 “어떤 플랫폼에서 쓰느냐”가 아니라 “무슨 역할의 에이전트를 만들고 싶으냐” 기준으로 구성하는 복사본 세트입니다.

즉:
- 10~12는 플랫폼 중심
- 20~26은 목적 중심

------------------------------------------------------------
7.1 20_general_assistant/
------------------------------------------------------------

구성:
- PROMPT_v14_light.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt

의미:
- 일반 기술 assistant / 범용 실무 assistant 용도
- 가장 먼저 시작하기 좋은 기본 목적 폴더

왜 이 조합인가:
- light가 일반 실무에 가장 적합한 base
- retrieval_grounding_overlay로 근거 기반 답변 보강
- tool_protocol_overlay로 외부 상호작용을 안전하게 처리

적합한 작업:
- 기술 Q&A
- 구현 설명
- 일반 디버깅
- 실무형 답변
- grounded response
- practical assistant

한 줄 요약:
- 가장 범용적인 기본 조합

------------------------------------------------------------
7.2 21_coding_agent/
------------------------------------------------------------

구성:
- PROMPT_v14_standalone.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt

의미:
- 코딩 에이전트 전용 목적 폴더
- patch-first, diff-first, bounded change, verify-before-claim 중심

왜 이 조합인가:
- standalone이 코딩 작업의 기본 실행 헌법
- tool_protocol_overlay가 repo/file/tool 사용 규칙 강화
- example layer가 review/patch artifact shape를 필요 시 지원

적합한 작업:
- 코드 수정
- 코드 리뷰
- patch 작성
- local refactor
- bounded mutation
- implementation note
- verification-aware code task

한 줄 요약:
- 코딩용 기본 목적 폴더

------------------------------------------------------------
7.3 22_design_analysis/
------------------------------------------------------------

구성:
- PROMPT_v14_full.txt
- PROMPT_v14_search_reasoning_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt

의미:
- 설계 검토 / 아키텍처 비교 / 고난도 분석용 목적 폴더
- reasoning depth와 grounded comparison이 중요한 경우에 적합

왜 이 조합인가:
- full이 고정밀 execution depth를 제공
- search_reasoning_overlay가 candidate 비교, path selection, branch pruning을 강화
- retrieval_grounding_overlay가 근거 기반 판단과 citation-grounded synthesis를 보강

적합한 작업:
- 아키텍처 비교
- 설계 대안 검토
- trade-off analysis
- 복합 디버깅
- 다단계 분석
- design memo
- decision memo

한 줄 요약:
- 설계/분석/비교가 중요한 깊은 사고형 목적 폴더

------------------------------------------------------------
7.4 23_grounded_research/
------------------------------------------------------------

구성:
- PROMPT_v14_light.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_search_reasoning_overlay.txt

의미:
- 문서 기반 조사 / evidence-centered research / grounded summary 용도
- research assistant 또는 document-grounded assistant에 적합

왜 이 조합인가:
- light가 과도하게 무겁지 않은 실무형 base
- retrieval_grounding_overlay가 evidence / freshness / source conflict를 다룸
- search_reasoning_overlay가 조사 방향 선택과 bounded exploration을 보강

적합한 작업:
- 문서 조사
- 근거 기반 정리
- source-backed memo
- 비교 조사
- grounded report
- evidence synthesis

한 줄 요약:
- 문서/근거 중심 조사 작업용 목적 폴더

------------------------------------------------------------
7.5 24_memory_enabled/
------------------------------------------------------------

구성:
- PROMPT_v14_light.txt
- PROMPT_v14_memory_adaptation_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt

의미:
- continuity / user preference / stable constraints / long-running thread 중심 assistant 용도

왜 이 조합인가:
- light가 일반적인 assistant base로 적합
- memory_adaptation_overlay가 continuity와 preference reuse를 담당
- retrieval_grounding_overlay가 “기억”보다 “현재 근거”가 우선되도록 균형을 잡아줌

적합한 작업:
- 장기 세션 assistant
- 반복 제약을 기억하는 assistant
- 사용자 선호를 재사용하는 assistant
- continuity가 중요한 project assistant

한 줄 요약:
- 기억/지속성 강화 assistant 목적 폴더

------------------------------------------------------------
7.6 25_multi_agent/
------------------------------------------------------------

구성:
- PROMPT_v14_full.txt
- PROMPT_v14_multi_agent_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt

의미:
- coordinator / specialist / critic / integrator / handoff가 필요한 협업형 에이전트 용도

왜 이 조합인가:
- full이 복합 execution depth를 제공
- multi_agent_overlay가 topology / delegation / handoff / artifact exchange를 담당
- tool_protocol_overlay가 외부 capability 사용 시 통제를 제공
- retrieval_grounding_overlay가 여러 역할이 다루는 evidence quality를 보강

적합한 작업:
- 역할 분리형 협업
- critic-reviewer 구조
- multi-stage analysis
- specialist 분업
- orchestrated agent system

한 줄 요약:
- 역할 분리와 handoff가 필요한 협업형 목적 폴더

------------------------------------------------------------
7.7 26_eval_ops/
------------------------------------------------------------

구성:
- PROMPT_v14_full.txt
- PROMPT_v14_evaluation_monitoring_overlay.txt
- PROMPT_v14_search_reasoning_overlay.txt

의미:
- prompt 평가 / regression 테스트 / drift detection / release gate / scorecard 운영 목적 폴더

왜 이 조합인가:
- full이 깊은 execution/analysis baseline 제공
- evaluation_monitoring_overlay가 metric, scorecard, regression, drift, release gate를 담당
- search_reasoning_overlay가 비교/분석/우선순위화에 도움

적합한 작업:
- prompt version audit
- regression review
- release-readiness check
- evaluation memo
- scorecard generation
- drift/anomaly reasoning

한 줄 요약:
- 운영/평가/릴리즈 검증용 목적 폴더

================================================================
8. 원본 보관 폴더 vs 실사용 폴더 차이
================================================================

이 구조에서 제일 중요한 구분은 이것입니다.

------------------------------------------------------------
8.1 원본 보관 폴더
------------------------------------------------------------

해당:
- 00_governance
- 01_base
- 02_overlays
- 03_examples

용도:
- 원본 파일 보관
- 역할별 기준 정리
- 나중에 다시 꺼내어 조합할 기준 라이브러리
- 유지보수 시 기준점 역할

즉:
- master library
- source of truth

------------------------------------------------------------
8.2 실사용 폴더
------------------------------------------------------------

해당:
- 10_chatgpt
- 11_cursor
- 12_codex
- 20_general_assistant
- 21_coding_agent
- 22_design_analysis
- 23_grounded_research
- 24_memory_enabled
- 25_multi_agent
- 26_eval_ops

용도:
- 실제 플랫폼/목적에 맞춰 바로 꺼내 쓰는 세트
- 원본에서 필요한 파일만 복사한 묶음
- “이 역할로 쓸 때는 이 파일들을 꺼내면 된다”는 실무형 바로쓰기 폴더

즉:
- runtime-ready subsets
- convenience bundles

================================================================
9. 실제 운영 시 해석 방법
================================================================

실제로 프롬프트를 조립할 때는 이렇게 해석하면 됩니다.

1) 먼저 base를 고른다
- full
- light
- lightest
- standalone
중 하나

2) 필요한 overlay를 고른다
- retrieval 필요?
- search/reasoning 필요?
- tool/API/file 필요?
- memory/continuity 필요?
- multi-agent 필요?
- evaluation/monitoring 필요?

3) example layer가 필요한지 본다
- 구조 흔들림이 있는가?
- patch/review/report shape가 필요한가?
- verification section을 안정화해야 하는가?

4) guideline은 참고 기준으로 유지한다
- ownership이 애매할 때
- 어떤 문서를 바꿔야 할지 헷갈릴 때
- 전체 stack drift를 점검할 때 사용

================================================================
10. 가장 실전적인 최소 운영 조합
================================================================

아래 3개를 기본 출발점으로 생각하면 됩니다.

------------------------------------------------------------
10.1 일반 범용 assistant
------------------------------------------------------------

구성:
- PROMPT_v14_light.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt

설명:
- 가장 무난한 범용형
- 기술 assistant, practical assistant, grounded answer에 적합

------------------------------------------------------------
10.2 코딩 assistant
------------------------------------------------------------

구성:
- PROMPT_v14_standalone.txt
- PROMPT_v14_tool_protocol_overlay.txt

필요 시 추가:
- PROMPT_v14_example_injection.txt
- PROMPT_v14_example_catalog.txt
- PROMPT_v14_retrieval_grounding_overlay.txt

설명:
- diff-first / bounded change / verify-before-claim 중심
- Cursor / Codex / coding agent에서 가장 자연스러움

------------------------------------------------------------
10.3 고난도 분석 assistant
------------------------------------------------------------

구성:
- PROMPT_v14_full.txt
- PROMPT_v14_search_reasoning_overlay.txt
- PROMPT_v14_retrieval_grounding_overlay.txt
- PROMPT_v14_tool_protocol_overlay.txt

설명:
- 여러 경로 비교
- 근거 수집
- tool 사용
- 깊은 통제가 필요한 분석형 작업에 적합

================================================================
11. 최종 요약
================================================================

이 구조를 가장 짧게 요약하면 다음과 같습니다.

1) 원본 라이브러리
- 00_governance
- 01_base
- 02_overlays
- 03_examples

2) 플랫폼별 실사용 복사본
- 10_chatgpt
- 11_cursor
- 12_codex

3) 목적별 실사용 복사본
- 20_general_assistant
- 21_coding_agent
- 22_design_analysis
- 23_grounded_research
- 24_memory_enabled
- 25_multi_agent
- 26_eval_ops

4) base는 항상 1개만
- full / light / lightest / standalone 중 하나

5) overlay는 필요한 것만
- retrieval / search / tool / memory / multi-agent / evaluation 중 선택

6) guideline은 보관/참고용
- 실행 본체가 아니라 설계 기준서

7) example_catalog는 참조용
- example_injection과 함께 쓸 때 의미가 생김

즉, 이 전체 구조는
“13개 원본 문서를 역할별로 정리해 보관하고,
플랫폼별/목적별로 필요한 것만 복사해 바로 쓸 수 있게 만드는 구조”
라고 이해하면 됩니다.
```