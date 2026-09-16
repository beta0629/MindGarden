# 상담사 지급 상세 — 월 횟수 표시 (배치 9003)

**브랜치**: `cursor/salary-detail-monthly-session-count-9003` (base: develop)  
**정합**: `feat(erp): Clinic-OS TO-BE for 상담사 지급 (/erp/salary) (#894)`  
**기획**: core-planner · 2026-09-08

---

## 1. 목표

상담사 급여/지급 **상세** 뷰(웹 ADMIN·CONSULTANT + Expo CONSULTANT)에 **월 횟수**(monthly session count)를 SSOT 필드로 표시한다.  
List-only는 FAIL. 실적(실제 완료 회기)과 대사 가능한 ledger 수치만 사용.

## 2. 범위

| 포함 | 제외 |
|------|------|
| 웹 `/erp/salary` 상세·미리보기·인쇄/내보내기 라벨 정합 | 단가·요율 하드코딩 |
| 웹 상담사 `/consultant/salary-settlement` 카드 상세 | 목록-only 컬럼만 추가 |
| Expo `/(consultant)/(more)/salary-settlement` 카드 상세 | Designer/Publisher (필드 추가 수준) |
| 기존 API DTO 필드 소비 (`consultationCount`) | 신규 계산 로직 발명 |

**역할**: ADMIN finance(`/erp/salary`) + CONSULTANT self-view. Tenant isolation 유지.

## 3. Explore 인벤토리 (Phase 0 결과)

### SSOT (백엔드 — 갭 없음)

| 계층 | 필드 | 비고 |
|------|------|------|
| DB `salary_calculations` | `completed_consultations`, `total_consultations` | 완료/전체 회기 |
| `SalaryCalculationResponseMapper` | `consultationCount` ← `completedConsultations`, `completedConsultations`, `totalConsultations` | ADMIN·CONSULTANT 공용 DTO |
| Preview SP | `consultationCount` | `PlSqlSalaryManagementServiceImpl` |
| Export | `SalaryCalculationStatementRows.resolveConsultationCount` | `consultationCount` 우선 |

### 화면 현황

| 화면 | 경로 | 월 횟수 |
|------|------|--------|
| ADMIN 목록 | `SalaryCalculationTable` | 없음 (의도: list-only 금지 → 상세에 필수) |
| ADMIN 계산 미리보기 | `SalaryManagement` calc stage | `consultationCount` 표시, 라벨「상담 건수」 |
| ADMIN 인쇄 상세 | `SalaryPrintComponent` | 있음, 라벨「상담 완료 건수」등 |
| CONSULTANT 웹 상세 | `ConsultantSalarySettlement` | **없음 → 필수 패치** |
| Expo 상세 | `salary-settlement.tsx` | **없음 → 필수 패치** (타입에도 필드 미선언) |

### 갭 판정 (debugger 생략 가능)

API·엔티티에 SSOT 이미 존재. **FE 상세 미바인딩 + 라벨「월 횟수」정합**만 필요. 신규 API/DB 불필요.

## 4. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| 사용성 | ADMIN은 미리보기·인쇄/내보내기 상세에서 월 횟수로 실적 대사. CONSULTANT(웹·앱)는 정산 카드에서 기간별 월 횟수 확인. |
| 정보 노출 | ADMIN·본인 CONSULTANT만. 값 = `consultationCount` ?? `completedConsultations` (0 허용). 단가 비노출. |
| 레이아웃 | 기존 상세 행 패턴에「월 횟수 / N회」한 줄 추가. 목록 컬럼 추가 금지(또는 보조만; 상세 없으면 FAIL). |

## 5. Phase · 분배실행 표

| Phase | 담당 | 의존 | 목표 | 전달 프롬프트 요약 |
|-------|------|------|------|-------------------|
| 0 | explore (완료) | — | 인벤토리 | 위 §3 |
| 1 | core-debugger | 0 | 갭 문서화 | API OK → FE 바인딩만. 수정 제안만. |
| 2 | **core-coder** | 1 | 패치 | 아래 §6 전문 |
| 3 | **core-tester** | 2 | 게이트 | 아래 §7 전문 |

**병렬**: Phase 0 완료 후 1→2→3 순차. Designer/Publisher 생략.

### Phase 2 — core-coder 위임문

```
브랜치: cursor/salary-detail-monthly-session-count-9003
Goal: 급여/지급 상세에 월 횟수 표시 (SSOT consultationCount)

SSOT:
- API: consultationCount (= completedConsultations), fallback completedConsultations
- resolve: SalaryCalculationStatementRows.resolveConsultationCount 와 동일 우선순위
- 하드코딩 요율 금지. 운영 게이트 §17 / SETTINGS §1.3

구현:
1) frontend/src/utils/salaryCalculationDisplay.js
   - resolveSalaryMonthlySessionCount(row) 추가 (consultationCount ?? completedConsultations)
2) frontend/src/constants/salaryConstants.js 또는 consultantSalarySettlementStrings
   - LABEL_MONTHLY_SESSION_COUNT = '월 횟수' (상수)
3) frontend ConsultantSalarySettlement.js — 상세 카드에 월 횟수 행 (금액 행 앞 권장)
4) frontend SalaryPrintComponent / SalaryManagement preview — 라벨을 「월 횟수」로 정합 (값 동일 SSOT)
5) expo-app useConsultantSalarySettlements.ts — consultationCount?, completedConsultations? 타입
6) expo-app salary-settlement.tsx + consultantSalarySettlementCopy — 상세에 월 횟수
7) expo-app: docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md §5 체크리스트 완료
8) 단위 테스트: resolve helper + 상세 라벨 스모크(가능 시)

완료 조건:
- 웹 CONSULTANT 상세·ADMIN 상세(미리보기/인쇄)에 「월 횟수」
- Expo 상세에 「월 횟수」
- list-only 변경만으로 끝내지 말 것
- 하드코딩 색/요율 없음
```

### Phase 3 — core-tester 위임문

```
검증:
1) 상세에 월 횟수 표시 (웹 CONSULTANT, Expo, ADMIN preview/print)
2) list-only FAIL: SalaryCalculationTable에만 있고 상세에 없으면 FAIL
3) 값 = consultationCount/completedConsultations (발명 수치 금지)
4) 역할: ADMIN / CONSULTANT self
5) 기존 Clinic-OS salary chrome 회귀
6) Expo: §5 체크리스트 (tsc, verify:metro-mmkv, verify:bundle:ci 등)

증거: 테스트 로그 / 스크린 또는 단위 테스트 출력
```

## 6. 리스크·제약

- Preview i18n 키 `t_b193260c`가 「상담 건수」— 「월 횟수」로 바꾸면 다른 화면 공유 키인지 확인 후 상수/키 분리.
- Expo Metro alias — import 경로 혼용 금지.
- PR to develop only; do not merge.

## 7. 완료 기준 체크리스트

- [ ] 웹 상담사 정산 상세에 월 횟수
- [ ] Expo 정산 상세에 월 횟수
- [ ] ADMIN 상세(미리보기·인쇄) 라벨 정합
- [ ] SSOT 필드만 사용
- [ ] core-tester 게이트 PASS
- [ ] 변경 파일·검증 증거 최종 보고
