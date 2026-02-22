# 모달 표준 (MgModal)

> B0KlA 스타일 공통 모달 컴포넌트 사용 가이드  
> @author MindGarden | @since 2025-02-22

## 개요

모달은 **MgModal** 컴포넌트를 사용하고, 용도에 따라 `size` prop으로 크기를 지정합니다.  
한 개의 공통 컴포넌트로 full / medium / small 세 가지 모달 크기를 지원합니다.

## size 옵션

| size | max-width | 용도 |
|------|-----------|------|
| **full** | 1000px | 다단계 스케줄 생성, 매칭 생성 등 폼이 긴 모달 |
| **medium** | 520px | 인디케이터/스텝, 상세 정보, 리스트 선택 |
| **small** | 400px | 날짜 선택, 확인 다이얼로그, 단일 선택 |

## 사용법

```jsx
import MgModal from '@/components/ui/MgModal';

// 1. 기본 (title + subtitle)
<MgModal isOpen={open} onClose={close} title="제목" subtitle="부제목" size="medium">
  <p>본문 내용</p>
</MgModal>

// 2. 소형 확인 모달
<MgModal isOpen={open} onClose={close} title="확인" size="small">
  <p>정말 삭제하시겠습니까?</p>
  <div className="mg-v2-ad-modal__footer">
    <button className="mg-v2-btn--outline" onClick={close}>취소</button>
    <button className="mg-v2-btn--primary" onClick={handleConfirm}>확인</button>
  </div>
</MgModal>

// 3. 커스텀 header/footer
<MgModal
  isOpen={open}
  onClose={close}
  size="small"
  header={<div>커스텀 헤더</div>}
  footer={<div>커스텀 푸터</div>}
>
  내용
</MgModal>
```

## MgModal Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| isOpen | boolean | false | 모달 표시 여부 |
| onClose | function | — | 닫기 핸들러 |
| children | node | — | 본문 내용 |
| size | 'full' \| 'medium' \| 'small' | 'medium' | 모달 크기 |
| title | string | '' | 헤더 제목 |
| subtitle | string | '' | 헤더 부제목 |
| showCloseButton | boolean | true | 닫기 버튼 표시 |
| closeOnOverlayClick | boolean | true | 배경 클릭 시 닫기 |
| closeOnEscape | boolean | true | ESC 키로 닫기 |
| header | node | — | 커스텀 헤더 (title 대체) |
| footer | node | — | 커스텀 푸터 |

## 상황별 size 선택 가이드 (에이전트용)

| 상황 | size |
|------|------|
| 다단계 폼 (4단계 이상), Stepper 인디케이터 + 큰 폼 | full |
| 상세 정보 표시, 리스트 선택, 2~3단계 폼 | medium |
| 확인/취소, 날짜 선택, 단일 액션 선택 | small |

## CSS 클래스

- `.mg-v2-ad-modal-backdrop` — 오버레이
- `.mg-v2-ad-modal` — 모달 컨테이너
- `.mg-v2-ad-modal--full` — full 사이즈
- `.mg-v2-ad-modal--medium` — medium 사이즈
- `.mg-v2-ad-modal--small` — small 사이즈
- `.mg-v2-ad-modal__header` — 헤더
- `.mg-v2-ad-modal__body` — 본문 (overflow-y: auto)
- `.mg-v2-ad-modal__footer` — 푸터
- `.mg-v2-ad-modal__close-btn` — 닫기 버튼

## 참조

- 컴포넌트: `frontend/src/components/ui/MgModal/`
- 스타일: `frontend/src/components/ui/MgModal/MgModal.css`
- B0KlA 모달 스펙: `frontend/src/components/schedule/ScheduleB0KlA.css`
- 아토믹 디자인: `mindgarden-design-system.pen` — Modal (full/medium/small)
