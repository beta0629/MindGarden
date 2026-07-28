# 내담자별 패키지 결제 내역 — 기획 핸드오프

**작성**: core-planner  
**작성일**: 2026-07-28  
**상태**: 스펙·위임 확정 (구현 대기 — 사용자 명시 지시 후 Phase 실행)  
**관련**: 추가 패키지 ACTIVE 회기 합산 배포 이후, “회기는 합산되나 결제 건별 내역이 안 보임”

---

## 1. 한줄 결론

**데이터는 이미 저장된다** (추가 패키지 = TERMINATED 매핑 행 + notes + ERP `CONSULTANT_CLIENT_MAPPING_ADDITIONAL`, 회기추가 = `session_extension_requests`).  
문제는 **합산 후 TERMINATED를 조회에서 빼고**, **건별 이력 UI·전용 API가 없어** ACTIVE의 합산 회기만 보이는 것이다.  
→ **새 SSOT 테이블보다**, 기존 행을 묶는 **내담자별 패키지 결제 이력 API + 관리자 검토 UX**를 추가한다.

---

## 2. 목표·사용자 관점

| 항목 | 내용 |
|------|------|
| **목표** | 패키지·회기 추가할 때마다, 누가 언제 무엇을 결제했는지 **건별로 검토** 가능 |
| **1차 사용자** | **관리자(ADMIN/STAFF)** — 입금·추가 직후 검토 |
| **2차** | 내담자 `/client/payment-history` — 동일 데이터 축으로 보정 (TERMINATED 누락 해소) |
| **기준 축** | **내담자(clientId)** 타임라인. 상담사·매칭은 행 필드로 표시 (매칭 1건만 보면 추가 결제 행이 빠짐) |

### 사용성

- 추가 패키지/회기추가 **요청·입금확인·승인 직후** 같은 맥락에서 이력을 열 수 있어야 함.
- 목록은 **카드형·최신순**, 유형 뱃지(최초매칭 / 추가패키지 / 회기추가).

### 정보 노출

| 역할 | 노출 |
|------|------|
| ADMIN/STAFF | 전체 필드(금액·결제수단·참조·상태·상담사·매핑 ID) |
| CONSULTANT | 본인 담당 건만 (구현 Phase에서 권한 게이트) |
| CLIENT | 본인 건: 결제일·패키지명·회기·금액·유형·상태 (내부 notes/ID 최소화) |

### 레이아웃(배치) — 우선순위

| 우선 | 위치 | 역할 |
|------|------|------|
| **P0** | **통합스케줄** ACTIVE 카드 → Side Peek / UnifiedModal 「패키지 결제 내역」 | 추가·회기추가 직후 검토 |
| **P0** | **내담자 종합관리** Side Peek / 매칭 탭 하위 「결제 내역」 | 사용자별 전체 이력 |
| **P1** | 입금대기 큐 상세 / 승인 성공 토스트 → 「내역 보기」 딥링크 | 추가할 때마다 검토 루프 |
| **P1** | 내담자 `/client/payment-history` | TERMINATED·회기추가 포함하도록 API 교체 |
| **P2** | ERP 재무 화면 | 교차검증용 링크만 (주 UI 아님) |

와이어(텍스트):

```
[통합스케줄 카드] … [회기추가] [패키지내역]
                         ↓
              UnifiedModal / Side Peek
              ┌ 내담자명 · 상담사 ─────────┐
              │ 합산 요약: 총 N회 / 잔여 M  │
              │ ───────────────────────── │
              │ ● 2026-07-28  추가패키지   │
              │   10회 · 500,000원 · 승인  │
              │ ● 2026-06-01  최초매칭     │
              │   10회 · …                 │
              └───────────────────────────┘
```

---

## 3. 데이터 SSOT (신규 테이블 비권장)

| 소스 | 엔티티/테이블 | 역할 |
|------|---------------|------|
| **A. 매핑 행** | `consultant_client_mappings` | 최초 ACTIVE + **추가패키지 TERMINATED** 행이 건별 결제 원천. notes: `[추가 매칭]`, `[추가 패키지 병합 완료]` |
| **B. 회기추가** | `session_extension_requests` | 회기추가 건별 이력 (매핑과 별 플로우) |
| **C. ERP (교차검증)** | `financial_transactions` | `CONSULTANT_CLIENT_MAPPING` / `_ADDITIONAL` / refund. related_entity_id = 매핑 ID |
| **비권장** | 새 `client_packages` | 이중 기록 위험. 필요 시 이후 정규화 |
| **부적합(현재)** | `consultant_client_mapping_history` | `SESSION_ADDED` enum만 있고 추가패키지 merge에서 미기록 |

**유형 판별**

| 유형 | 판별 |
|------|------|
| 최초매칭 | 매핑 행 + notes에 추가 마커 없음 + (보통) ACTIVE 또는 정상 종료 |
| 추가패키지 | notes에 `NOTES_ADDITIONAL_MAPPING_MARKER` (`[추가 매칭]`) 또는 병합 완료 문구 |
| 회기추가 | `session_extension_requests` 행 |

**한 행 필드 (API 응답 DTO 후보)**

결제일, 패키지명, 회기수, 금액, 유형, 상태(매핑/결제/연장), 담당 상담사, mappingId / extensionRequestId, targetActiveMappingId(추가 시), paymentMethod/reference(관리자)

---

## 4. API

| 항목 | 내용 |
|------|------|
| **현행 갭** | `GET /api/v1/admin/mappings/client?clientId=` → `findByClientIdAndStatusNot(..., TERMINATED)` → **추가 패키지 이력 누락** |
| **권장 신규** | `GET /api/v1/admin/clients/{clientId}/package-payment-history` (tenantId 필수) |
| **응답** | 최신순 타임라인 배열 + 선택적 합산 요약(총 결제액·총 추가 회기) |
| **구성** | TERMINATED 포함 매핑(유형 정규화) ∪ session_extension ∪ (선택) ERP ADDITIONAL 교차 |
| **기존 활용** | `clients/with-mapping-info`는 원천에 가깝지만 유형·타임라인 UX용 정규화 API로 부족 |

내담자 화면은 동일 축의 **클라이언트 스코프 API**(본인 clientId만) 또는 관리자 API를 역할 가드로 감싼 변형.

---

## 5. MindGarden 규칙 (구현 시)

- AdminCommonLayout / ContentHeader·Area, **UnifiedModal**, 아토믹·B0KlA
- `safeDisplay` / SafeText — React #130
- 하드코딩 금지(상태·라벨·색 → 공통코드·i18n·토큰)
- **tenantId** 전 레이어
- StandardizedApi, `/api/v1/`
- 공통모듈 우선 (`COMMON_MODULES_USAGE_GUIDE`)

참조: `CORE_PLANNER_DELEGATION_ORDER.md`, `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`,  
`AdminServiceImpl.mergeAdditionalPackageIntoActiveAndTerminate`, `NOTES_ADDITIONAL_MAPPING_*`

---

## 6. 분배실행 표

| Phase | 서브에이전트 | 병렬 | 목표·완료 조건 |
|-------|--------------|------|----------------|
| **0** | explore | — | ✅ 완료 (본 문서 §3–4). 재조사 불필요 unless 스키마 변경 |
| **1** | **core-designer** `model: gemini-3.1-pro` | — | P0 위치(통합스케줄 Peek/Modal + 내담자 Side Peek) 와이어·토큰·뱃지·빈상태. 산출: `docs/design-system/SCREEN_SPEC_CLIENT_PACKAGE_PAYMENT_HISTORY.md`. 코드 없음 |
| **2** | **core-coder** | Phase 1 후 | 이력 API + DTO + 관리자 UI + (P1) ClientPaymentHistory 연동. 테스트: TERMINATED 포함·유형 분류·tenant 격리 |
| **3** | **core-tester** | Phase 2 후 | 추가패키지 approve 후 이력 1행 노출, 회기추가 완료 행 노출, #130 0, 역할별 스모크 |
| **(선택)** | core-component-manager | Phase 1과 병행 가능 | 이력 리스트 Organism 재사용 위치 제안만 |

### Phase 1 전달 요약 (designer)

- 사용성: 추가/회기추가 직후 검토; 카드형 최신순
- 노출: §2 역할표
- 배치: §2 P0 와이어
- 참조: B0KlA, UnifiedModal, `SCREEN_SPEC_SESSION_EXTENSION_MODAL.md` 톤 정합

### Phase 2 전달 요약 (coder)

- API: §4 신규 + TERMINATED 포함 조회
- UI: Phase 1 스펙 경로
- 금지: ACTIVE packageName 덮어쓰기, 이중 ACTIVE, 하드코딩
- 표준: frontend/backend/api/multi-tenant/unified-modal 스킬 경로 명시

### Phase 3 전달 요약 (tester)

- 시나리오: 최초매칭 → 추가패키지 승인 → 이력 2행; 회기추가 완료 → 3행; 내담자 화면 동일 축
- 회귀: 합산 회기·이중 ACTIVE 없음·입금대기

---

## 7. 리스크·제약

| 리스크 | 대응 |
|--------|------|
| notes 문자열 파싱 의존 | 유형 enum/컬럼 정규화는 Phase 2 후속 검토; 1차는 마커 상수와 동일 파서 |
| ACTIVE packageName은 최초명 유지 | 이력 행은 **결제 당시 행**의 packageName 사용 |
| 회기추가 vs 추가패키지 이중 경로 | 타임라인에 유형으로 구분, 합산 요약은 중복 가산 주의 |
| 과거 데이터 notes 누락 | ERP ADDITIONAL·payment_date로 보강 표기 |

---

## 8. 완료 체크리스트 (배치)

- [ ] 디자이너 스펙 문서 존재
- [ ] `package-payment-history` API tenant 격리 + TERMINATED·extension 포함
- [ ] 통합스케줄·내담자 관리에서 이력 모달/Peek 열림
- [ ] 추가 직후 검토 진입점(버튼/딥링크) 존재
- [ ] ClientPaymentHistory가 추가 결제 건을 보여 줌
- [ ] core-tester 게이트 통과
- [ ] 운영 반영 전 하드코딩 게이트 (§17 / PRE_PRODUCTION)

---

## 9. 관련 코드·문서 (현황)

- `AdminServiceImpl` — createMapping 추가패키지, `mergeAdditionalPackageIntoActiveAndTerminate`, `getMappingsByClient`(TERMINATED 제외)
- `AdminServiceUserFacingMessages` — `NOTES_ADDITIONAL_MAPPING_*`
- `ConsultantClientMapping.addSessions`
- `SessionExtensionRequest` / `SessionExtensionController`
- `ClientPaymentHistory.js`, `ClientSidePeekContent.js`, `IntegratedMatchingSchedule.js`
- `docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`, `docs/project-management/REFUND_SESSION_LOGIC_AUDIT.md`

---

**다음 액션**: 사용자「디자인부터 진행」또는「구현 진행」지시 시 Phase 1(designer)부터 호출.
