# 내담자 삭제 (어드민 hard delete) 모달 UX 재설계 핸드오프

**작성일**: 2026-05-28
**작성자**: core-designer
**관련 PR/이슈**: P1 버그 (누적 지표 노출) 및 UX 개선

## 1. 현재 GAP 매트릭스

| 항목 | 현재 (As-Is) | 개선 (To-Be) | 비고 |
|---|---|---|---|
| **모달 크기** | `UnifiedModal` `size="large"` (900px) | `size="medium"` (600px) | 단순 Confirm 모달에 맞게 축소 |
| **누적 지표 노출** | `delete` 분기에서도 빈 ContentSection 렌더링 | `delete` 분기에서 렌더링 제외 | P1 버그 수정 |
| **시각적 강조** | `⚠️` 이모지 텍스트 반복 사용 | 96px 위험 경고 일러스트/아이콘 중앙 배치 | 시각적 위계 개선 |
| **카드 중첩 구조** | `modal_body` > `.mg-v2-delete-confirmation` > `.mg-v2-client-info` | 단일 요약 카드 (`--mg-bg-secondary`) | 불필요한 뎁스 제거 |
| **텍스트/메시지** | H3, p 태그 직접 사용, "영구적으로 삭제됩니다" | SSOT Typography 적용, "삭제 후 7일 유예" 명시 | 정책(Phase 5 v1.2) 반영 |
| **접근성(a11y)** | 기본 `dialog` 롤 | `role="alertdialog"`, `aria-describedby` 연결 | 파괴적 액션에 대한 스크린리더 지원 강화 |
| **포커스 트랩** | 기본 포커스 | 첫 액션 "취소" 버튼으로 포커스 이동 | 실수로 인한 삭제 방지 |

## 2. 신규 디자인 도식 (ASCII)

```text
┌────────────────────────────────────────────────────────────┐
│  내담자 삭제                                           [×] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                  [ AlertTriangle 96px ]                    │
│                  (color: --mg-danger-500)                  │
│                                                            │
│                 정말로 삭제하시겠습니까?                   │
│               이 작업은 되돌릴 수 없습니다.                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 이름         이재학                                  │  │
│  │ 이메일       beta0629@example.com                    │  │
│  │ 전화번호     010-8632-****                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [ i ] 삭제 요청 시 7일 후 자동 익명화되며, 일부 데이터는  │
│        관련 법령에 따라 최대 3년간 보존될 수 있습니다.     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                           [ 취소 ] [ 삭제 (Danger) ]       │
└────────────────────────────────────────────────────────────┘
```

## 3. 사용할 SSOT 토큰 목록

- **색상 (Colors)**
  - 일러스트/아이콘: `--mg-danger-500` (또는 `--mg-warning-500`)
  - 헤더 텍스트: `--mg-text-primary`
  - 보조 텍스트: `--mg-text-secondary`
  - 요약 카드 배경: `--mg-bg-secondary` 또는 `--mg-surface-elevated`
  - 정보 배너 배경: `--mg-bg-info-light` (또는 `--mg-surface-muted`)
- **타이포그래피 (Typography)**
  - H3 (Confirm Title): `20px`, `font-weight: 600`
  - 본문 (Description): `16px`, `font-weight: 400`
  - 보조/안내 (Grace Period Hint): `13px`, `font-weight: 400`
- **간격 (Spacing)**
  - 요소 간 간격: `--mg-spacing-4` (16px), `--mg-spacing-6` (24px)
- **일러스트**
  - `lucide-react`의 `AlertTriangle` (size=96, color=danger-500) 활용 권장. (별도 B0KlA 위험 일러스트 에셋이 있다면 해당 SVG 컴포넌트 사용)

## 4. i18n 시드 추가/변경 키 목록

**대상 파일**: `frontend/src/locales/ko/admin.json` (및 기타 언어 파일)

| 키 | 변경/추가 | 내용 |
|---|---|---|
| `admin.clientModal.delete.confirmTitle` | 유지/확인 | "정말로 삭제하시겠습니까?" |
| `admin.clientModal.delete.description` | 변경 | "이 작업은 되돌릴 수 없습니다." |
| `admin.clientModal.delete.warning` | 변경 | 이모지(`⚠️`) 제거 후 텍스트만 유지 |
| `admin.clientModal.delete.gracePeriodHint` | **신규** | "삭제 요청 시 7일 후 자동 익명화되며, 일부 데이터는 관련 법령에 따라 최대 3년간 보존될 수 있습니다." |

## 5. 컴포넌트 변경 명세

**대상 컴포넌트**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js`

1. **`UnifiedModal` Props 변경**
   - `type === 'delete'` 일 때 `size="medium"`으로 설정 (기존 `large`)
   - `variant="confirm"` 추가 (UnifiedModal 지원 시)
2. **`renderSummaryStrip` 조건부 렌더링 수정**
   - 현재 `type === 'create' || !client?.id` 일 때만 `null` 반환
   - 수정: `type === 'delete'` 일 때도 `null` 반환하도록 가드 추가 (P1 버그 해결)
3. **`renderDeleteContent` 구조 재설계**
   - 상단에 `AlertTriangle` 아이콘 (96px, danger 색상) 중앙 정렬 배치
   - `mg-v2-delete-confirmation` 내부의 중첩 카드 구조를 단일 요약 카드(`mg-v2-client-info`에 `--mg-bg-secondary` 적용)로 단순화
   - 이모지 하드코딩 제거 및 신규 i18n 키(`gracePeriodHint`)를 활용한 정보 배너 추가

## 6. a11y (접근성) 체크리스트

- [ ] `UnifiedModal`에 파괴적 액션임을 알리는 `role="alertdialog"` 속성 적용 확인
- [ ] 모달 설명 텍스트와 `aria-describedby` 연결 (삭제 시 영향 안내를 스크린리더가 읽을 수 있도록)
- [ ] 모달 오픈 시 포커스가 "취소" 버튼으로 가도록 포커스 트랩 설정 (실수로 인한 "삭제" 엔터 입력 방지)
- [ ] 아이콘에 `aria-hidden="true"` 적용 (텍스트로 이미 설명되므로 중복 읽기 방지)

## 7. 반응형 가이드

- **데스크탑 (PC)**: `size="medium"` (최대 폭 600px)
- **태블릿**: `width: 90vw`, 중앙 정렬 유지
- **모바일**: 화면 전체(`full-screen`) 또는 하단 시트(`bottom-sheet`) 형태로 표시 (UnifiedModal 내부 반응형 정책 준수)

## 8. 상담사 삭제 모달 동일 적용 권고

- **대상 파일**: `frontend/src/components/admin/ConsultantComprehensiveManagement.js`
- **현황**: 내담자 모달과 동일하게 `modalType === 'delete'` 시 `size="large"`를 사용하고 있으며, 텍스트와 카드 중첩 패턴이 유사함.
- **권고**: 본 핸드오프의 UX 패턴(중앙 아이콘, medium 사이즈, 단일 요약 카드, a11y 적용)을 상담사 삭제 모달에도 동일하게 적용하여 어드민 시스템 내 Confirm 모달의 일관성을 확보할 것.

## 9. 코더 위임 명세 (core-coder 전달용)

다음 단계 작업을 위해 `core-coder`에게 아래 내용을 위임합니다.

- **수정 대상 파일**:
  - `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js`
  - `frontend/src/components/admin/ConsultantComprehensiveManagement.js`
  - `frontend/src/locales/ko/admin.json`
- **주요 변경 사항**:
  1. `ClientModal.js`의 `renderSummaryStrip` 함수 첫 줄에 `if (type === 'delete') return null;` 추가 (P1 핫픽스)
  2. 두 모달 컴포넌트에서 `delete` 타입일 경우 `UnifiedModal`의 `size`를 `medium`으로 변경
  3. `renderDeleteContent` (또는 해당 렌더링 블록)을 본 문서의 ASCII 도식에 맞게 재구성 (Lucide `AlertTriangle` 96px 사용, 이모지 제거, 신규 i18n 힌트 추가)
  4. `admin.json`에 `admin.clientModal.delete.gracePeriodHint` 및 상담사용 힌트 텍스트 신규 추가
- **단위 테스트 보강**:
  - `delete` 타입으로 모달 렌더링 시 `ContentSection`(누적 지표)이 렌더링되지 않는지 확인하는 테스트 케이스 추가
  - "취소" 버튼에 기본 포커스가 가는지 확인 (가능한 경우)

---
*본 문서는 디자인 스펙 및 UX 개선을 위한 핸드오프 문서입니다. 위임받은 코더는 본 문서의 가이드를 준수하여 코드를 구현해 주시기 바랍니다.*