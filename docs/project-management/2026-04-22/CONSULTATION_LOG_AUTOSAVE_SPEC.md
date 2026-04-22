# 상담일지 주기적 저장(자동·임시 저장) — 기획 스펙

**문서 ID**: `CONSULTATION_LOG_AUTOSAVE_SPEC`  
**상태**: 기획안 (구현 전)  
**최초**: 2026-04-22 — `core-planner` 산출물

## 목차

1. 목표·비목표  
2. 현행 맥락(코드베이스)  
3. 저장 전략 선택지  
4. 주기·트리거  
5. API·데이터 모델  
6. 충돌·합류  
7. UX  
8. 보안·준수  
9. 세션·401·자동저장의 관계  
10. 레거시 `ConsultationRecordScreen` 범위  
11. 위임 패키지(Phase·서브에이전트)  
12. 참조(프로젝트 문서·스킬 요약)

---

## 1. 목표·비목표

| 구분 | 내용 |
|------|------|
| **목표** | 상담일지 작성 중 네트워크 일시 끊김·탭 닫힘·브라우저 충돌 등으로 내용이 사라지지 않도록, **초안 수준의 주기적·안정적 보존**을 제공한다. |
| | 주 UI(`ConsultationLogModal` + `ConsultationLogFormPanel` 등)에서 입력 중 데이터가 **최대한 복구 가능**하다는 사용자 전제를 만족시킨다. |
| **비목표(초기)** | “최종 제출”과 동일한 비즈니스 완결을 자동저장만으로 보장(승인·감사 시점 확정 기록으로 간주)하지 않는다. |
| | 오프라인 풀 편집·동기화 충돌 병합(CRDT) — 1차 범위 밖. |
| | 다중 기기·동시 편집 실시간 병합 — 1차는 단일 탭/단일 편집자 가정이 현실적. |

---

## 2. 현행 맥락(코드베이스)

- **주 UI**: `frontend/src/components/consultant/ConsultationLogModal.js` — `UnifiedModal`, `handleSave`는 검증 후 `apiPost` `POST /api/v1/schedules/consultation-records` 또는 수정 시 `apiPut`, `memoDraft` / `memoDirty`·`persistClientNotesIfNeeded` 등.
- **폼**: `organisms/ConsultationLogFormPanel.js` 등 — 자동저장 트리거(입력 onChange, 필드 그룹) 늑점 정의.
- **레거시**: `ConsultationRecordScreen.js` — API 경로가 다를 수 있음 → §10.

---

## 3. 저장 전략 선택지

| | (A) 브라우저만 `localStorage` / `IndexedDB` | (B) 서버 `DRAFT` 또는 동일 리소스 PATCH | (C) 혼합 |
|---|----------------------------------|----------------------------------|-----------------------------|
| **장점** | 구현 빠름, 백엔드 변경 최소 | 단일 기기에서 복구·감사·테넌트 격리에 유리 | 오프라인/일시 실패 대비 + 서버 SSOT |
| **단점** | 기기·브라우저만, 정책·감사에 약 | API·DB·권한·Flyway 필요 | 복잡도·동기화 규칙 필요 |
| **PII** | 단말 저장 = 유출·공유PC 리스크 → TTL·암호화·최소 필드 검토 | 서버 측 기존 보존/삭제 정책에 편입 용이 | 양쪽 모두 정책 정의 필요 |
| **tenantId** | 키·메타에 tenant·스케줄 ID 스코핑 | 필수(멀티테넌트) | 둘 다 스코핑 + 서버 권한 |
| **감사 로그** | 어려움(클라이언트만) | draft 저장/확정 구분 권고 | 서버 이벤트 + 로컬은 비감사 |

**권고(기획)**: 1차 방향은 **(C) 혼합**; MVP는 **(A) 빠른 안전망** 또는 기존 DRAFT 개념이 있으면 **(B) 우선** — explore로 `consultation-records` 스키마·draft 필드 유무 확인 후 확정.

---

## 4. 주기·트리거

| 방식 | 설명 | 장단 |
|------|------|------|
| 디바운스 (입력 멈춤 N초) | 키 입력 직후 매 요청 방지 | API 비용↓, “저장됨” 체감 약간 지연 |
| 고정 주기 (예: 60초) | setInterval | 예측 가능, 미입력에도 호출 가능(스킵 조건 필요) |
| 포커스 이탈 / `visibilitychange` | 탭 전환·모달 밖으로 나갈 때 | 마지막 flush에 유효 |
| `beforeunload` | 보조(동기 sendBeacon 등은 제한적) | |

**권고**: **디바운스(예: 3~10초) + `visibilitychange` 시 즉시 flush(더티만) + (선택) 최대 60초 하한 백업**.

---

## 5. API·데이터 모델

- **옵션 1**: 기존 `consultation-records` 확장 — 상태 `DRAFT` / `SUBMITTED` 또는 `isDraft` 플래그.
- **옵션 2**: 별도 `.../draft` 또는 `.../auto-save` — 최종 `PUT` 시 draft 삭제/머지 규칙 명시.
- **백엔드 시**: Flyway, 역할·스코프 권한, **`tenantId` 전 레이어 필수**.
- **프론트**: StandardizedApi + `/api/v1/` — 신규 자동저장 API는 StandardizedApi로 작성; 기존 `apiPost`/`apiPut`는 리팩터 시 정합.

---

## 6. 충돌·합류

- 최종 저장 시: 서버 `updatedAt` 또는 `version` 비교(낙관적 락) — 초안이 옛날이면 사용자 분기.
- `isEditMode`: 기존 기록 id 존재 시 자동저장은 같은 id에 PATCH 또는 별도 draft 슬롯; 신규 작성은 임시 id와 서버 생성 id 매핑.
- 규칙: **“최종 저장이 항상 이김”** + 자동저장은 **초안 계층**.

---

## 7. UX

- 상태: “저장 중… / 저장됨(시간) / 재시도 / 오프라인” — `UnifiedModal` 내 한 줄 고정 권고.
- 실패: 토스트 + 다음 자동 시도/수동 “다시 저장”(PII 전문 미노출).
- 모달 닫기: 더티일 때 확인; 자동저장 성공 시 닫기 완화 정책과 정합.
- 복구: 다음 진입 시 “미완성 초안이 있습니다. 불러올까요?”
- 표시 경계: `safeDisplay`·`SafeErrorDisplay` 계열 준수.

---

## 8. 보안·준수

- 상담 내용: localStorage 평문 비권고; IndexedDB+최소 필드 또는 서버 DRAFT 우선.
- 공유 PC: 짧은 TTL·세션 끊기 시 키 삭제.
- 감사: 서버 DRAFT 저장 시 누가·언제·어느 스케줄 id(내용 전문 로그는 별도 정책).

---

## 9. 세션·401·자동저장의 관계

- 자동저장은 **세션 연장을 대체하지 않음**. 401 시 갱신 실패하면 자동저장도 실패 → 로컬 큐 또는 “로그인 후 동기화”(범위는 MVP에서 축소 가능).
- 정책: “자동저장 성공 = 로그인 유지”가 아님; “인증 유효할 때만 서버 DRAFT, 실패 시 로컬만(짧은 TTL)”.

---

## 10. 레거시 `ConsultationRecordScreen` 범위

| 결정(기획 권고) | 내용 |
|-----------------|------|
| 1차 | 모달·신규 표준 API 경로에 집중. |
| 레거시 | 동일 자동저장 UX는 API 정합 + 중복 제거 — **별도 Phase** 또는 **명시적 제외**. |

---

## 11. 위임 패키지(Phase·서브에이전트)

| Phase | 담당 | 목표 |
|-------|------|------|
| 0 | explore(선택) | `ConsultationLogModal`·`consultation-records`·DRAFT 필드 유무, SessionIdle/401 처리 위치 인벤토리 |
| 1 | core-coder(FE) | 더티·디바운스·visibilitychange, 저장 UI, 스펙 확정분 구현, StandardizedApi 정합 |
| 2 | core-coder(BE, 필요 시) | DRAFT 필드/엔드포인트, Flyway, tenantId·권한·감사 |
| 3 | core-tester | 수동 시나리오(탭 닫힘, 오프라인, 401, 복구), API/스모크 |

**완료 기준 샘플**: 더티 이탈 후 복구; 401 시 로컬만(해당 시) + 에러 UI; PII 로그·토스트에 본문 미노출; tenantId·권한 누락 0.

---

## 12. 참조

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` — 위임 순서·테스터 게이트.
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` — 표시 경계·`safeDisplay`.
- `.cursor/skills/core-solution-api/SKILL.md` — StandardizedApi, `/api/v1/`, tenantId.
