# Local Endpoint 향후 단위/통합 검증 계획

## 목적

local endpoint가 나중에 준비되었을 때 단위 검증과 통합 검증을 빠르게 수행하기 위한 계획이다.

## 단위 검증

local endpoint 준비 후 먼저 아래를 확인한다.

- endpoint URL 형식 검증
- provider type 검증: vllm 또는 ollama
- model name 존재 확인
- auth 필요 여부 확인
- timeout 설정 확인
- local adapter config schema 검증
- request mapper dry-run
- response mapper dry-run
- trace/redaction policy 검증
- raw response 저장 금지 확인

## 통합 검증

단위 검증 이후 아래를 수행한다.

- local endpoint readiness probe
- local no-tool canary
- local response shape validation
- local trace schema validation
- local redaction audit
- no external side effect 확인
- provider capability matrix update
- claim boundary audit

## 통합 검증 후에도 자동 허용되지 않는 claim

아래 claim은 추가 gate 없이 자동 허용하지 않는다.

- provider-diverse
- local-model-verified
- provider-verified
- adapter-checked
- stable
- production-ready

## 실패 시 중단 조건

아래가 발생하면 즉시 중단한다.

- endpoint unreachable
- unsupported model response shape
- raw response storage detected
- secret logged
- unexpected external side effect
- local endpoint probe performed without operator readiness signal
