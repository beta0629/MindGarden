# 관리자 "알림·메시지 관리" 통합 화면 리뉴얼·고도화 기획서

**작성 일자**: 2026-03-17  
**목표**: `/admin/notifications` 단일 페이지를 **새 UI/UX·레이아웃**으로 리뉴얼하여, 탭만 통합된 현재 상태에서 **진짜 통합 화면**(공지·메시지 동일 목록/카드 패턴, 추출 블록 기반)으로 고도화한다.  
**참조**: `ADMIN_NOTIFICATIONS_INTEGRATED_UI_GAP_CHECK.md`, `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3, `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md`

---

## 1. 요구·배경

- **현재**: 라우트·탭만 통합되어 있고, 탭 본문은 `SystemNotificationManagement contentOnly` / `AdminMessages contentOnly` 로 **기존 단독 페이지 UI**가 그대로 임베드됨. 사용자 체감상 "통합이 아니라 기존 화면이 나온다"는 피드백과 일치.
- **목표**: 기획서(GAP_CHECK A안)대로 **공지/메시지 탭 본문을 Organism 추출·통일 스타일**로 리뉴얼. B0KlA·디자인 토큰·어드민 대시보드 샘플 스타일을 적용한 **새 레이아웃·UI/UX**로 통합 화면을 완성한다.

---

## 2. 범위·경계

| 구분 | 포함 | 제외 |
|------|------|------|
| **화면** | `/admin/notifications` 단일 페이지 리뉴얼. AdminCommonLayout + ContentHeader + 탭 + 탭별 본문(공지 블록 / 메시지 블록) | GNB 통합 알림(배지·드롭다운) 리뉴얼은 본 기획 범위 외(별도 Phase 가능) |
| **API** | 기존 유지. `/api/v1/system-notifications`, consultation-messages 등 **시그니처 변경 없음** | 신규 API 설계·백엔드 변경 없음 |
| **권한** | 기존 정책 유지. SYSTEM_NOTIFICATION_MANAGE 등 역할별 노출 | 권한 스키마 변경 없음 |
| **라우트** | `/admin/notifications` 단일 라우트·기존 `/admin/system-notifications`, `/admin/messages` 리다이렉트 유지 | URL 변경 없음 |

**영향 받는 컴포넌트**: `AdminNotificationsPage.js`, `SystemNotificationManagement.js`, `AdminMessages.js`. 신규/추출: `SystemNotificationListBlock`, `AdminMessageListBlock`, 공지 폼 모달(추출), 공통 헤더/필터/카드 패턴(제안에 따라 common 또는 admin 배치).

---

## 3. 의존성·순서

| 선행 | 내용 |
|------|------|
| 문서 | `GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3 참조 필수 |
| 레이아웃 | AdminCommonLayout, ContentHeader, B0KlA·`unified-design-tokens.css` 기존 사용 전제 |
| API·권한 | 기존 system-notifications·consultation-messages·권한 체계 변경 없음 |

---

## 4. 새 레이아웃 구조 (기획 방향)

### 4.1 블록 순서 (UI_SPEC §2.9 기준)

1. **AdminCommonLayout** (필수)
2. **메인**: ContentHeader(제목 "알림·메시지 관리" + 부제 + 우측 "공지 작성" 조건부)
3. **탭 바**: 시스템 공지 | 메시지 (B0KlA 탭 스타일, `?tab=system|messages` 권장)
4. **탭=공지**: 공지 목록 블록 → 필터(대상/상태) → 테이블/카드 목록 → (클릭) 공지 작성/수정 모달
5. **탭=메시지**: 메시지 목록 블록 → 검색/필터 → 메시지 카드 그리드 → (클릭) 메시지 상세 모달

### 4.2 공지·메시지 통일 방안

- **동일한 목록/카드 패턴**: 두 탭 모두 "섹션 블록(감싸기) → 블록 제목(선택) → 필터 → 목록(테이블 또는 카드)" 구조로 통일. 시각적으로 동일한 `mg-v2-ad-b0kla__section` 스타일 적용.
- **공통 추출**: 헤더·필터·카드 레이아웃은 COMPONENT_PROPOSAL §3.4에 따라 공통 Molecule/Organism(예: AdminSectionHeader, AdminFilterBar, AdminCardList) 추출 제안 — component-manager 산출 반영 후 확정.

### 4.3 반응형·접근성 방향

- **반응형**: UI_SPEC §2.8. 모바일 375px~ 탭 가로 스크롤 또는 2단 누적, 목록 1열, 필터 세로 쌓기, 터치 44px 이상. 태블릿 768px~ 목록 2열. 데스크톱 1280px~ 목록 3~4열(메시지 카드).
- **접근성**: 탭 `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `id` 연동 유지. 모달·버튼 `aria-label`. 키보드 탭 전환·포커스 순서 검토(코더 구현 시 반영).

---

## 5. 단계(Phase) 및 분배실행

### Phase 0 (선택) — 기획 정교화를 위한 병렬 의견 수집

**목적**: 기획서 확정 전, 컴포넌트 구성·디자인 방향을 수집해 기획서에 반영. **동시에 다음 두 서브에이전트를 호출할 수 있음.**

| 담당 | 전달할 태스크 설명(프롬프트) 요약 |
|------|-----------------------------------|
| **core-component-manager** | 기존 `SystemNotificationManagement.js`, `AdminMessages.js`에서 **추출·재사용할 블록** 정리, 중복 제거·적재적소 배치 제안서 작성. Organism/Molecule 목록 제안(SystemNotificationListBlock, AdminMessageListBlock, 공지 폼 모달 추출, AdminSectionHeader/AdminFilterBar 등). 코드 작성 없음. 참조: `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3. |
| **core-designer** | 마인드가든 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) 및 B0KlA·`unified-design-tokens.css`를 적용한 **관리자 통합 페이지(`/admin/notifications`) 전용** 새 UI/UX·비주얼·레이아웃 제안. ContentHeader·탭·필터·목록·카드·모달 관계, 공지·메시지 동일 목록/카드 패턴 통일 방안. 코드 작성 없음. 참조: `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2. |

**산출**: component-manager 제안서·디자이너 제안(스펙 보강 또는 시안). 기획이 이를 반영해 본 문서 §4·§6·§7 보강 가능.  
**체크포인트**: [ ] Phase 0 실행 여부 사용자 결정. 실행 시 산출 수신 후 기획서 §4·§6 갱신 여부 결정.

---

### Phase 1 — 디자인 (core-designer)

**목적**: 통합 페이지의 새 UI/UX·비주얼·레이아웃 시안(또는 스펙 보강) 확정.  
**의존**: Phase 0 미실행 시에도 UI_SPEC §2 기반으로 진행 가능. Phase 0 실행 시 디자이너 산출 참고.

| 항목 | 내용 |
|------|------|
| **담당** | core-designer |
| **전달 프롬프트** | 관리자 "알림·메시지 관리" 통합 페이지(`/admin/notifications`) 리뉴얼을 위해, 어드민 대시보드 샘플·B0KlA·`unified-design-tokens.css`를 적용한 **새 UI/UX·비주얼·레이아웃** 설계. (1) 사용성: 관리자가 한 화면에서 공지·메시지 탭 전환으로 관리, 자주 쓰는 동작(공지 작성·필터·읽음 처리) 배치 명시. (2) 정보 노출: 역할별 권한(SYSTEM_NOTIFICATION_MANAGE 등) 유지, 공지 CRUD·메시지 조회/필터 범위. (3) 레이아웃: AdminCommonLayout + ContentHeader + 탭(시스템 공지 \| 메시지) + 탭별 본문(필터·목록·모달) 블록 순서·배치. 공지 탭과 메시지 탭이 **동일한 목록/카드 패턴**으로 보이도록 구조 통일 방안. 반응형(모바일·태블릿·데스크톱)·접근성(aria, role) 방향 제시. 참조: `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3. 산출: 화면별 레이아웃·블록 구성·디자인 토큰·스펙 문서(또는 시안). 코드 작성 없음. |
| **참조 스킬** | `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-standardization` |

**산출**: 관리자 통합 페이지 UI/UX 스펙(보강) 또는 시안. 퍼블리셔·코더 구현 시 참조 문서.  
**체크포인트**: [ ] Phase 1 완료 산출물 검토 후 Phase 2 진행 승인.

---

### Phase 2 — 퍼블리싱 (core-publisher)

**목적**: 기획·디자인 산출물을 바탕으로 아토믹 디자인 기반 HTML 마크업 작성.  
**의존**: Phase 1 산출물(또는 UI_SPEC §2).

| 항목 | 내용 |
|------|------|
| **담당** | core-publisher |
| **전달 프롬프트** | 기획서 `docs/project-management/ADMIN_NOTIFICATIONS_RENEWAL_PLAN.md` 및 디자인 스펙(`GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, Phase 1 산출물)을 바탕으로 **관리자 통합 페이지** 아토믹 디자인 기반 HTML 마크업 작성. 대상: AdminCommonLayout 내부, ContentHeader + 탭(시스템 공지 \| 메시지) + 탭별 본문(공지 목록 블록, 메시지 목록 블록) 구조. 필터·목록·카드·모달 플레이스홀더 포함. BEM·시맨틱 HTML, `unified-design-tokens.css`·B0KlA 클래스 참조. JS/React·스타일 연동은 코더 담당으로 명시. 참조: `/core-solution-publisher`, `/core-solution-atomic-design`. |
| **참조 스킬** | `/core-solution-publisher`, `/core-solution-atomic-design` |

**산출**: 통합 페이지 구조의 HTML 마크업(또는 퍼블 가이드). 코더가 React 컴포넌트·스타일 연동 시 참조.  
**체크포인트**: [ ] Phase 2 마크업 검토 후 Phase 3 진행 승인.

---

### Phase 3 — 구현 (core-coder)

**목적**: 퍼블리셔·기획·디자인 산출물을 바탕으로 React 컴포넌트 구현·기존 API 연동·라우트 통합.  
**의존**: Phase 1·2 산출물. Phase 0 실행 시 component-manager 제안서도 참조.

| 항목 | 내용 |
|------|------|
| **담당** | core-coder |
| **전달 프롬프트** | 관리자 알림·메시지 관리 통합 페이지 리뉴얼 구현. (1) **레이아웃**: AdminCommonLayout 사용, 본문은 children, title "알림·메시지 관리", loading 등만 페이지별 지정. (2) **블록 도입**: SystemNotificationListBlock(공지 목록+필터+액션), AdminMessageListBlock(메시지 검색+필터+카드 그리드) 등 신규 Organism 도입. SystemNotificationManagement/AdminMessages는 contentOnly 제거 또는 리팩터 후, 통합 페이지에서는 위 블록만 사용. (3) **공지 폼 모달**: SystemNotificationManagement에서 작성/수정 모달을 Molecule/Organism으로 추출(예: SystemNotificationFormModal), 통합 페이지·블록에서 재사용. (4) **API·권한**: 기존 `/api/v1/system-notifications`, consultation-messages 시그니처 유지, SYSTEM_NOTIFICATION_MANAGE 등 기존 권한 유지. (5) **라우트**: `/admin/notifications` 단일 라우트·기존 리다이렉트 유지. (6) **스타일**: B0KlA·`unified-design-tokens.css`·Phase 1·2 산출물 반영. 반응형·접근성(aria, role) 적용. 참조: `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3, `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2, `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md`, `/core-solution-frontend`, `/core-solution-api`. |
| **참조 스킬** | `/core-solution-frontend`, `/core-solution-api`, `/core-solution-atomic-design`, `/core-solution-unified-modal` |

**산출**: `AdminNotificationsPage.js` 리뉴얼, SystemNotificationListBlock·AdminMessageListBlock 등 신규/추출 컴포넌트, 기존 API 연동·라우트 통합.  
**체크포인트**: [ ] Phase 3 구현 완료 후 QA·사용자 승인.

---

### Phase 4 (선택) — 테스트 (core-tester)

**목적**: 통합 페이지·권한·반응형·접근성 시나리오 검증.  
**의존**: Phase 3 완료 후.

| 항목 | 내용 |
|------|------|
| **담당** | core-tester |
| **전달 프롬프트** | 관리자 통합 페이지 `/admin/notifications` 리뉴얼에 대한 테스트 시나리오·검증. 대상: 탭 전환(공지/메시지), 공지 목록·필터·작성/수정/삭제, 메시지 목록·필터·상세 모달, 권한별 노출(SYSTEM_NOTIFICATION_MANAGE), 반응형(모바일·태블릿·데스크톱), 접근성(탭·모달 aria). 단위·통합·E2E 중 기획에서 정한 범위. 코드 구현 없음. 참조: `/core-solution-testing`. |
| **참조 스킬** | `/core-solution-testing` |

**산출**: 테스트 시나리오·실행 결과·체크리스트.  
**체크포인트**: [ ] Phase 4 실행 여부 및 범위 사용자 결정.

---

## 6. 리스크·제약

- **기존 API·권한**: 시그니처·정책 변경 없음. 프론트만 블록 분리·통일 스타일 적용.
- **SystemNotificationManagement / AdminMessages**: 단독 라우트는 리다이렉트만 유지하므로, 해당 페이지를 직접 쓰는 북마크·외부 링크는 `/admin/notifications`로 유도됨.
- **성능**: 탭 전환 시 컴포넌트 마운트/언마운트 또는 조건부 렌더링 선택은 코더 판단. 초기 로딩은 기존과 동일 API 호출 전제.

---

## 7. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| **0** | 의견 수집 완료, 기획서 반영 여부 결정 | [ ] component-manager 제안서 수신 [ ] designer 제안 수신 [ ] 기획서 §4·§6 갱신 여부 결정 |
| **1** | 디자인 스펙(또는 시안)으로 코더·퍼블 구현 가능 | [ ] ContentHeader·탭·필터·목록·모달 구조 명시 [ ] 공지·메시지 동일 패턴 방안 명시 [ ] B0KlA·토큰·반응형·접근성 방향 포함 |
| **2** | HTML 마크업으로 구조·클래스 확정 | [ ] 아토믹 계층·BEM·시맨틱 HTML [ ] 탭·필터·목록·카드·모달 플레이스홀더 [ ] 코더 연동 가능 형태 |
| **3** | 통합 페이지 동작·기존 API·권한 유지 | [ ] AdminCommonLayout·ContentHeader·탭 동작 [ ] SystemNotificationListBlock·AdminMessageListBlock 사용 [ ] contentOnly 제거 또는 리팩터 [ ] 공지/메시지 모달 재사용 [ ] `/admin/notifications`·리다이렉트 유지 [ ] 반응형·접근성 적용 |
| **4** | 테스트 시나리오·실행 결과 정리 | [ ] 시나리오·범위 확정 [ ] 실행 결과·이슈 정리 |

---

## 8. 실행 요청문 (사용자·부모 에이전트용)

1. **Phase 0 (선택)**: 기획 정교화가 필요하면 **동시에** core-component-manager, core-designer를 호출하여 위 §5 Phase 0 표의 프롬프트로 의견 수집. 산출 수신 후 기획서 §4·§6 보강 여부 결정.
2. **Phase 1**: core-designer를 §5 Phase 1 프롬프트로 호출 → 산출 검토 후 **체크포인트 승인**.
3. **Phase 2**: core-publisher를 §5 Phase 2 프롬프트로 호출(Phase 1 산출물 전달) → 마크업 검토 후 **체크포인트 승인**.
4. **Phase 3**: core-coder를 §5 Phase 3 프롬프트로 호출(Phase 1·2 산출물·기획서 전달) → 구현 완료 후 **QA·사용자 승인**.
5. **Phase 4 (선택)**: 필요 시 core-tester를 §5 Phase 4 프롬프트로 호출.

**실제 코더/퍼블/디자인 실행은 사용자 승인 후** 위 체크포인트 순서대로 진행한다.

---

## 9. 참고 파일

| 구분 | 파일 |
|------|------|
| 갭 분석 | `docs/project-management/ADMIN_NOTIFICATIONS_INTEGRATED_UI_GAP_CHECK.md` |
| 컴포넌트 제안 | `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3 |
| UI 스펙 | `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2 |
| 정책 | `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md` |
| 통합 페이지(현재) | `frontend/src/components/admin/AdminNotificationsPage.js` |
| 공지 관리(현재) | `frontend/src/components/admin/SystemNotificationManagement.js` |
| 메시지 관리(현재) | `frontend/src/components/admin/AdminMessages.js` |

---

*기획(core-planner) 산출. 서브에이전트 호출은 본 문서 §5·§8 분배실행 표와 체크포인트에 따라 수행.*
