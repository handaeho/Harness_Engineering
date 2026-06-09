# Adapter conformance dependency install

상태: pass

- 승인 문구 확인: true
- 실행 명령: npm ci --ignore-scripts --no-audit --no-fund
- yaml import 가능: true
- node_modules는 source/evidence로 포함하지 않음
- package.json 수정 상태: true (기존 local script 변경으로 정당화)
- package-lock.json 수정 상태: false
- protected path 수정: false
