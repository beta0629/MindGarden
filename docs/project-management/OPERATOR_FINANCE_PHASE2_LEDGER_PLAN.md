# Operator Finance Phase 2 — ONE operator ledger (기획서)

**브랜치**: `cursor/operator-finance-ledger-phase2-5cd5` (base: develop)  
**PR base**: develop only · prod-deploy 금지 · money cockpit 병렬 PR과 파일 비겹침  
**주관**: core-planner · 구현 core-coder · 검증 core-tester · (필요) 스펙 core-designer

---

## 1. 목표

운영자가 쓰는 **하나의 장부**를 `/erp/financial`에 둔다. 클리닉 언어 **들어온 돈 · 나간 돈**.  
회계 도구(분개·원장·재무제표 등)는 앞문이 아니라 `세무사용 자료` 뒤로.

## 2. 범위

### 포함

- Canonical: `/erp/financial` — FinancialManagement 슬림/재구성
- `/admin/erp/financial` → `RedirectWithSearch` → `/erp/financial` (query 보존)
- Quiet header / summary strip / 필터 가능 목록(기본 테이블) / 달력 토글 / CTA `돈 기록`
- 금액 `formatKrw` (ko-KR + 원)
- IntegratedFinanceDashboard 탭 UI를 홈에서 제거; statement 컴포넌트는 `세무사용 자료`에서 import 가능하도록 extract/reachable
- `docs/design/OPERATOR_FINANCE_IA.md` Phase 2 상태 additive 갱신
- 단위·E2E 테스트 갱신

### 제외 / 절대 금지

- `frontend/src/components/erp/organisms/moneyCockpit/**`
- `frontend/src/constants/operatorFinanceDashboardStrings.js` (링크 라벨 꼭 필요할 때만)
- `/erp/dashboard` (ErpDashboard money cockpit) 재작성
- main 머지 · prod deploy
- 신규 팔레트 · sprites · 4-step type 축소

## 3. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | 센터장/원장. 기간 고르고 합계 보고, 목록에서 들어옴/나감 확인, `돈 기록` 한 흐름으로 등록. 탭 10개·회계 용어 앞에서 막지 않음. |
| **정보 노출** | 운영자: 일자·내용·들어온/나간 금액·(선택) 카테고리 secondary. 숨김/후순위: 차변·대변·계정과목·대차대조표·손익·현금흐름·분개·원장·정산규칙·일월연 리포트 → `세무사용 자료`. |
| **레이아웃** | 1 Quiet header → 2 Compact summary strip → 3 필터+테이블(기본) / 달력 토글 → 4 Disclosure `세무사용 자료`. AdminCommonLayout children. |

## 4. 의존성·순서

1. (선택 단축) core-designer 스펙 → 없으면 Target UX + Clinic-OS IA로 coder 직행 가능  
2. core-coder 구현 + 커밋·푸시  
3. core-tester 게이트 (미통과 시 coder 재위임)  
4. 기획 취합 최종 보고

## 5. Phase / 분배실행

| Phase | Agent | 병렬 | 목표 |
|-------|--------|------|------|
| P1 | core-designer | — | Quiet header·summary·table·disclosure 스펙 (moneyCockpit 파일 수정 금지) |
| P2 | core-coder | P1 후 | 라우트 redirect + ledger UX + extract + 테스트 코드 + IA checkbox |
| P3 | core-tester | P2 후 | 필수 4항목 + 스모크; fail → P2 재위임 |
| P4 | core-planner | P3 후 | 취합 보고 (파일·테스트·커밋 해시·비겹침) |

상세 프롬프트는 오케스트레이터 응답 / 부모 Task 호출용 본문에 둠.

## 6. 완료 기준

- [x] `/erp/financial` 타이틀 `들어온 돈 · 나간 돈`
- [x] `/admin/erp/financial` → `/erp/financial` (query 보존)
- [x] 기본 뷰에 차변/대변/대차대조표 equal-tab 없음
- [x] 금액에 `원` + ko-KR grouping (`formatKrw`)
- [x] moneyCockpit 경로 미수정
- [ ] core-tester 통과
- [ ] PR → develop

## 7. 리스크

- FinancialManagement ~2600L / IntegratedFinanceDashboard ~3723L 슬림 시 회귀
- Statement 탭 inline extract 누락 시 세무 자료 단절
- money cockpit 병렬 PR 문자열/라우트 충돌
- E2E 타이틀 문자열 하드코딩 갱신 필요
