# D5 P4 i18n Phase 2 - 3차 청크 P3 종합 회귀 검수 보고서

## §0 메타
- **검수 대상 (HEAD)**: `develop` (`bfa8bb322`)
- **운영 main**: `cb2f218c8`
- **검수 도구**: core-tester (Gemini 3.1 Pro)
- **검수 일자**: 2026-05-26

## §1 commit 시퀀스 (`cb2f218c8..bfa8bb322`)
1. `a011a8a44` 2차 청크 P4 운영 push 정착 보고서 (docs)
2. `f7e87f32e` P0-inv-c3 3차 청크 인벤토리 (docs)
3. `d7a7af2d2` PR-G Wave-1 FRESH 9 파일 + Wave-2 auth namespace
4. `7f164b275` PR-H 4 클러스터 caller 마이그 (IFS/FMG/CommonCode×2)
5. `21d6d6c07` PR-I notificationManager 23/23 useConfirm 마이그
6. `ec39d2e85` PR-J 트랙 B 9 파일 흡수 (settings/statistics/report 확장)
7. `646dba645` PR-J 보강 5 파일 추가 흡수
8. `bfa8bb322` PR-K ESLint warning 221 → 0 (광역 정합)

## §2 빌드/Lint 게이트 검증 결과
- `npm run lint:codemod-mappings`: **57/57 PASS**
- `npm run build`: **PASS**

## §3 KPI 매트릭스
| KPI | 목표 | 2차 청크 종료 | 3차 청크 종료 (재측정) | 도달 여부 |
|---|---|---:|---:|---|
| ko leaves | ≥1,500 | 2,854 | 3,247 | **Y** |
| 한국어 라인 | ≤15,000 | 29,798 | 20,481 | **N** (추세 지속) |
| t() 호출 | ≥3,000 | 2,135 | 2,803 | **N** (추세 지속) |
| useTranslation 파일 | ≥500 | 293 | 300 | **N** (추세 지속) |
| window.alert/confirm 운영 | 0 | 0 | 2 | **N** |
| bare alert/confirm 운영 | 0 | 0 | 27 | **N** |
| notificationManager 호출 | 0 (PR-I 흡수) | 23 | 0 | **Y** |
| MEDIUM 회귀 | 0 | 1 (notificationManager) | 1 | **N** |
| lint:codemod-mappings | 57/57 PASS | 57/57 | 57/57 PASS | **Y** |
| Production Build | PASS | PASS | PASS | **Y** |
| ESLint warning (3종) | 0 | 0 | 6 | **N** |

## §4 회귀 판정
- **HIGH (1건)**: 1·2차 청크 정착물 수정 발생 (`PR-K`에서 `TenantAwareApiClient.js`, `TenantSelector.js` 등 다수의 1·2차 청크 파일이 ESLint 수정 명목으로 변경됨)
- **MEDIUM (1건)**: 한국어 라인, t() 호출, useTranslation 파일 수 목표 미달 (단, 긍정적 추세는 지속됨)
- **LOW (1건)**: ESLint `comma-dangle` warning 6건 잔존 (`AdminOnboarding.jsx`)

## §5 i18n 표면 검증
- `window.alert/confirm`: 2건 잔존 (`frontend/src/utils/notification.js`)
- `bare alert/confirm`: 27건 검출 (대부분 `useConfirm` 훅의 `confirm` 호출로 확인됨)
- `notificationManager.alert/confirm`: 0건 (PR-I를 통해 완벽히 마이그레이션 됨)

## §6 운영 push 권고
**NO-GO**
- **사유**: HIGH 회귀 1건 발생 (1·2차 청크 정착물 수정). PR-K의 광역 ESLint 정합 과정에서 기존에 안정화된 1·2차 청크 파일들이 다수 수정되었습니다. 이는 무수정 원칙에 위배되므로 운영 push를 보류합니다.

## §7 후속 라운드 트리거
- **4차 청크 PR-L 필요성**: 
  1. PR-K에서 수정된 1·2차 청크 정착물들에 대한 롤백 또는 안전성 재검증 필요.
  2. `AdminOnboarding.jsx`에 잔존하는 `comma-dangle` warning 6건 해결 필요.
