# [R4 트랙] 옵션 B 디러티 PENDING_PAYMENT 매칭 사이드바 취소 UI 시안 v1.0

**작성일**: 2026-05-28
**작성자**: core-designer
**관련**: R4 트랙 (옵션 B 디러티 매칭 정리)

## 1. UI 위치 및 Wireframe

### 권장안 선정: 옵션 A (별도 줄 텍스트 링크 형태)
- **근거**: 
  - **실수 클릭 방지**: "결제 대기" 상태에서 가장 중요한 메인 액션은 "결제 진행(Checkout)"입니다. 취소는 파괴적인(destructive) 액션이므로 메인 버튼과 동일한 선상(옵션 B)에 두면 오클릭 위험이 큽니다.
  - **B0KlA UX 일관성**: 파괴적인 보조 액션은 텍스트 링크 형태의 2차 버튼으로 하단에 배치하는 것이 당사 디자인 시스템의 일관된 패턴입니다.
  - **명확성**: 카드 상단 우측 dismiss 아이콘(옵션 C)은 단순 UI 숨김으로 오인될 수 있어 백엔드 취소 로직이 동반되는 본 기능에는 부적합합니다.

### Wireframe (As-Is vs To-Be)

**현행 (As-Is)**
```text
김선희 선생님 → 이재학 내담자
[결제 대기]  [0 회기 남음]
─────────────────────
[ 일정 등록 ]
[ Checkout Same Day Payment ]
```

**개선 (To-Be - 옵션 A 적용)**
```text
김선희 선생님 → 이재학 내담자
[결제 대기]  [0 회기 남음]
─────────────────────
[ 일정 등록 ]
[ Checkout Same Day Payment ]
        매칭 취소 (Danger Text Link)
```

## 2. 색상 토큰 (SSOT)

취소 버튼은 텍스트 링크 형태를 띄며, 파괴적 액션임을 나타내기 위해 Danger 토큰을 사용합니다.

- **기본 상태 (Default)**: `--mg-v2-text-danger` (또는 `--color-danger`)
- **Hover/Active 상태**: `--color-danger-hover` (또는 텍스트 밑줄 추가)
- **Disabled 상태**: `--color-text-secondary` (비활성화 시 회색 처리)
- **다크 모드 Cascade**: `--mg-v2-text-danger`는 다크 모드에서도 적절한 대비를 갖도록 설정되어 있으므로 그대로 상속(Cascade)받아 사용합니다.

**시각 시뮬레이션 (Light / Dark)**
- Light Mode: 흰색 배경(`--mg-bg_secondary`) 위 붉은색 텍스트(`#ef4444` 계열)
- Dark Mode: 어두운 배경(`--mg-color-background-secondary`) 위 밝은 붉은색 텍스트 (대비율 4.5:1 이상 유지)

## 3. 확인 모달 (UnifiedModal)

파괴적 액션이므로 반드시 재확인 모달을 제공합니다. 기존 `CLIENT_DELETE_MODAL_UX_REDESIGN_HANDOFF.md`의 `medium` 사이즈 규격을 재사용합니다.

- **Title**: 매칭을 취소하시겠습니까?
- **Body**: 결제 대기 중인 매칭과 연결된 가예약 일정이 함께 취소됩니다.
- **Icon**: `AlertTriangle` (경고 아이콘, `--mg-v2-warning-*` 또는 `--color-danger` 색상 적용)
- **Buttons**:
  - **Confirm (우측)**: "매칭 취소" (Danger 버튼, `--mg-v2-button-danger`)
  - **Cancel (좌측)**: "돌아가기" (Secondary 버튼, `--mg-v2-button-secondary`)
- **A11y**: 
  - `aria-label="매칭 취소 확인 모달"`
  - Focus Trap 적용 (모달 오픈 시 '돌아가기' 버튼에 기본 포커스)
- **다크 모드**: iOS dark 토큰 및 UnifiedModal의 기본 다크 모드 배경색 자동 적용

## 4. i18n 키 시드

`frontend/src/locales/ko/admin.json` 내 `mapping.card` 및 `mapping.cancel` namespace 준수.

```json
{
  "mapping": {
    "card": {
      "actions": {
        "cancel": "매칭 취소"
      }
    },
    "cancel": {
      "modal": {
        "title": "매칭을 취소하시겠습니까?",
        "body": "결제 대기 중인 매칭과 연결된 가예약 일정이 함께 취소됩니다.",
        "confirm": "매칭 취소",
        "cancel": "돌아가기"
      }
    }
  }
}
```

## 5. 노출 조건 매트릭스

| 매칭 상태 | paymentTiming | 취소 버튼 노출 | 비고 |
|---|---|---|---|
| `PENDING_PAYMENT` | `SAME_DAY_CARD` | **노출** | 디러티 정리 (본 목적) |
| `PENDING_PAYMENT` | `ADVANCE` / `NULL` | **노출** | 옵션 A 잔존 정리 |
| `ACTIVE` | (any) | 미노출 | 기존 종료 흐름 사용 |
| `TERMINATED` / `SUSPENDED` | (any) | 미노출 | 이미 종료/정지됨 |

## 6. 회귀 가드

- **레이아웃 유지**: 기존 카드 레이아웃(회기 라벨, 결제 대기 뱃지, 일정 등록 버튼)은 전혀 건드리지 않고 하단에 액션만 추가합니다.
- **하드코딩 금지**: 색상, 여백 등은 반드시 `unified-design-tokens.css`의 SSOT 토큰만을 사용하며, D11 하드코딩을 엄격히 금지합니다.
- **반응형 대응**: 사이드바 카드의 최소 폭(280-320px) 환경에서도 텍스트 링크가 줄바꿈되거나 영역을 벗어나지 않도록 `text-align: center` 및 적절한 `margin-top`을 부여합니다.
