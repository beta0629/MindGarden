# 화면설계서 — 회기 승계 (Session Succession)

**문서 버전**: 1.1 (디자인 개정 반영)  
**작성일**: 2026-08-22  
**작성**: core-planner (`/core-solution-planning` §0.4·§0.5)  
**기획 SSOT**: [SESSION_SUCCESSION_PLAN.md](../project-management/SESSION_SUCCESSION_PLAN.md)  
**디자인 핸드오프**: [DESIGN_SPEC_SESSION_SUCCESSION.md](./DESIGN_SPEC_SESSION_SUCCESSION.md) (B0KlA 어드민 대시보드 샘플 기반 전면 개정)  
**권장 라우트**: `/admin/integrated-schedule` (신규 전용 페이지 없음 — 모달 마법사)

---

## 1. 화면 개요

| 항목 | 내용 |
|------|------|
| 화면명 | 회기 승계 마법사 |
| 접근 권한 | ADMIN, STAFF |
| 진입 | 통합 스케줄 좌측 매칭 카드 → **「회기 승계」** |
| 셸 | 페이지는 기존 `AdminCommonLayout` + `IntegratedMatchingSchedule`. 기능 UI는 **`UnifiedModal` 스텝 마법사** |
| 주요 동작 | 수혜자 선택/등록 → 상담사·횟수 → 확인 → 실행 |

---

## 2. 사용성 (편하게 사용)

- **누가**: 어드민/스태프가 다건 등록·이전을 빠르게 처리.
- **목적**: 스케줄에 안 묶인 잔여만 수혜자(실제 상담 당사자)에게 넘긴다.
- **흐름**: 카드에서 1클릭 → 모달에서 최소 입력 → 미리보기로 N·점유 건수 확인 → 확정.
- **우선 동작**: 기존 CLIENT 검색 선택; 없으면 동일 모달에서 신규 등록.
- **기본값**: 타깃 상담사 = 소스 상담사; 횟수 = 승계가능(전량) 또는 사용자가 줄여 부분.
- **금지 UX**: 스케줄 일괄 이전 UI, 알림 수신자 이중 설정(1차 out-of-scope).

---

## 3. 정보 노출 범위

| 역할 | 노출 | 비노출 |
|------|------|--------|
| ADMIN/STAFF | 소스 내담자·상담사·패키지·remaining·점유 스케줄 건수·승계가능·타깃 미리보기·사유 | ERP 원장 편집, 타 테넌트 데이터 |
| CONSULTANT/CLIENT | 본 기능 진입 없음 | — |
| 결제 정보 | “원 매핑 결제·영수증은 이전되지 않음” 안내 문구만 | 거래 금액 수정 |

마스킹: 전화번호는 기존 어드민 내담자 표시 규칙 따름.

---

## 4. 레이아웃 (배치)

### 4.1 페이지 (변경 최소)

```
AdminCommonLayout
└─ IntegratedMatchingSchedule
   ├─ 캘린더/메인
   └─ MatchingScheduleSidebar
      └─ MappingScheduleCard
         └─ CardActionGroup  ← 「회기 승계」버튼 추가 (ACTIVE 등, 「회기 추가」인근)
```

- 본문은 기존 통합 스케줄 유지. **새 LNB 메뉴 없음.**

### 4.2 모달 마법사 (`UnifiedModal`, B0KlA)

| 스텝 | 제목 | 본문 블록(위→아래) |
|------|------|-------------------|
| 1 | 수혜자 | 소스 요약(읽기) → 수혜자 모드 탭(기존/신규) → 검색 Select 또는 신규 폼 |
| 2 | 상담사·회기 | 상담사 Select(변경 가능) → 승계가능 표시 → N stepper → 전량 버튼 |
| 3 | 확인 | 이전 요약(소스 remaining 전→후, 타깃, N, 점유 제외 안내, 결제 비이전 안내) → 사유(선택) |
| — | 완료 | 성공 토스트/인모달 결과 → 닫기 시 사이드바 갱신 |

반응형: 모달 `medium`~`large`, 모바일에서도 스텝 수직 스크롤. 목록형 검색은 드롭다운/`CustomSelect` 우선(타이핑 최소화).

---

## 5. 영역·컴포넌트

| 영역 | 컴포넌트(재사용 우선) |
|------|----------------------|
| 페이지 레이아웃 | `AdminCommonLayout` |
| 카드 액션 | `CardActionGroup`, `MappingMatchActions`, `MGButton` |
| 모달 | `UnifiedModal` (커스텀 오버레이 금지) |
| 선택 | `CustomSelect` / 기존 내담자·상담사 검색 패턴 |
| 숫자 | Number stepper / FormInput type number |
| 신규 내담자 | 기존 Client 등록 필드 최소 세트 재사용(확인 후) |
| 토큰·테마 | `mg-v2-ad-b0kla`, `unified-design-tokens.css` |

아토믹: Organism `SessionSuccessionWizardModal` · Molecules 스텝 뷰 · Atoms 버튼/인풋.

---

## 6. 색상·토큰 참조

- `var(--mg-primary-*)`, `var(--mg-color-text-main)`, `var(--mg-color-border-main)`, `var(--mg-spacing-*)`
- 하드코딩 HEX 금지(디자인 스펙도 토큰만).
- 상세 토큰·상태: DESIGN_SPEC.

---

## 7. 카피·안내 (필수)

- 스텝 2/3: 「스케줄에 이미 등록된 N건은 승계되지 않고 이전 당사자에게 남습니다.」
- 스텝 3: 「결제·입금·영수증 정보는 원 매핑에 남습니다.」
- 승계가능 0: 버튼 비활성 + 「스케줄에 묶인 회기만 남아 승계할 수 없습니다.」

---

## 8. 완료 기준 (디자이너·코더)

- [ ] 통합 스케줄 카드에서만 진입 가능(권한 맞는 역할).
- [ ] 기존/신규 수혜자, 상담사 변경, 전량·부분(N≤승계가능) 가능.
- [ ] 스케줄 이전 UI 없음; 점유 건수·승계가능이 미리보기에 노출.
- [ ] UnifiedModal + AdminCommonLayout 전제 준수.
- [ ] PLAN §3.2 산식·ERP 비재작성 안내와 모순 없음.

---

## 9. 참조

- `frontend/src/components/admin/mapping-management/integrated-schedule/`
- `docs/design-system/SCREEN_SPEC_SESSION_EXTENSION_MODAL.md` (유사 모달 패턴)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- `/core-solution-unified-modal`, `/core-solution-atomic-design`
