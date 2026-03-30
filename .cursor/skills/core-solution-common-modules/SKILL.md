---
name: core-solution-common-modules
description: 새 기능 구현 시 공통 모듈(UnifiedModal, ContentHeader, BadgeSelect, StandardizedApi 등) 우선 검토·사용. 없으면 추출 후 공통화 제안.
---

# 공통 모듈 사용 룰

새 기능을 구현하거나 기존 화면·API를 수정할 때 **공통 모듈을 우선 검토·사용**하세요. 디자이너·퍼블리셔·코더·컴포넌트 매니저 모두 이 스킬을 참조해 일관되게 적용합니다.

## When to Use

- 새 페이지·모달·폼·리스트·API 연동 추가·수정 시
- "어떤 컴포넌트/유틸을 쓸지" 결정할 때
- 공통화 후보 제안·적재적소 배치 검토 시 (core-component-manager)

## Rules (필수 준수)

### 1. 공통 모듈 우선

- **이미 있는 공통 모듈이 있으면 반드시 사용**한다.
- 같은 역할의 컴포넌트·유틸을 새로 만들지 않는다.
- 공통 모듈이 없으면 먼저 **검토·추출·공통화 제안**을 하고, 확정 후 common 등 표준 위치에 배치한다.

### 2. 반드시 쓸 공통 모듈

| 용도 | 모듈 | 참조 경로 |
|------|------|-----------|
| API 호출 | **StandardizedApi** | `utils/standardizedApi` |
| 모든 모달 쉘 | **UnifiedModal** | `components/common/modals/UnifiedModal` |
| 어드민·ERP 페이지 레이아웃 | **AdminCommonLayout** | `components/layout/AdminCommonLayout` |
| 본문 영역·제목·섹션 | **ContentArea, ContentHeader, ContentSection, ContentCard** | `components/dashboard-v2/content` |
| 알림 개수·목록 | **NotificationContext** (useNotification) | `contexts/NotificationContext` |
| 로딩 UI | **UnifiedLoading** | `components/common/UnifiedLoading` |

### 3. 상황별 추천

- **모달**: UnifiedModal만 사용. ConfirmModal은 확인/취소 2버튼만 필요할 때.
- **배지 선택(소수 옵션)**: BadgeSelect. 드롭다운이 필요하면 CustomSelect.
- **빈 목록/결과**: EmptyState. 리스트·테이블 뷰: ListTableView.
- **카드 하단 액션**: CardActionGroup, ActionButton. 상태 배지: StatusBadge.

### 4. 공통 모듈이 없을 때

1. **docs/standards/COMMON_MODULES_USAGE_GUIDE.md**와 **docs/project-management/COMPONENT_COMMONIZATION_CANDIDATES.md**에서 유사 모듈 여부 확인.
2. 없으면 **core-component-manager**에게 공통화 후보·적재적소 배치 제안 요청.
3. 기획·확정 후 **core-coder**가 추출·배치 수행.

## 참조하는 에이전트

이 스킬은 **core-designer**(설계 시 공통 컴포넌트 재사용 검토), **core-publisher**(마크업 시 공통 클래스 사용), **core-coder**(구현 시 공통 모듈 우선 사용), **core-component-manager**(공통화 후보·적재적소 배치 제안)가 반드시 참조합니다. 각 에이전트 정의(`.cursor/agents/core-*.md`)의 "반드시 참조할 스킬"에 포함되어 있어야 합니다.

## Reference

- **상세 목록·가이드**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- **공통화 후보·Phase**: `docs/project-management/COMPONENT_COMMONIZATION_CANDIDATES.md`
- **모달**: `/core-solution-unified-modal`, `docs/standards/MODAL_STANDARD.md`
- **API**: `/core-solution-api`, `docs/standards/API_CALL_STANDARD.md`
- **레이아웃**: `docs/layout/ADMIN_COMMON_LAYOUT.md`, `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
- **캡슐화·모듈화**: `/core-solution-encapsulation-modularization` — 공통화·재사용 원칙과 함께 적용
