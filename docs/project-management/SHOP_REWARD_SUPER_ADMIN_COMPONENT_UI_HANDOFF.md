# Shop·Reward 슈퍼어드민 컴포넌트 UI/UX 설계 (Handoff)

## 1. 화면 레이아웃 및 구조
**페이지 경로**: 슈퍼어드민 > 테넌트 관리 > 테넌트 컴포넌트 관리
**레이아웃 기준**: 마인드가든 어드민 대시보드 샘플 (다크 사이드바 + 밝은 메인 영역)

### 1.1 상단 바 (Top Bar)
- **브레드크럼**: `슈퍼어드민 > 테넌트 컴포넌트 관리`
- **페이지 제목**: `테넌트 컴포넌트 관리 (Shop & Reward)`
- **배경**: `var(--mg-bg-main)` (#FAF9F7)
- **하단 구분선**: 1px solid `var(--mg-border)` (#D4CFC8)

### 1.2 테넌트 검색 섹션 (Section Block)
- **컨테이너**: `mg-v2-section-block` (배경: #F5F3EF, 테두리: 1px #D4CFC8, radius: 16px, 패딩: 24px)
- **섹션 제목**: 좌측 악센트 바 (폭 4px, `var(--mg-primary)` #3D5246, radius 2px) + `테넌트 검색` (12px, 굵게)
- **입력 폼**:
  - Input Placeholder: `테넌트 ID를 입력하세요`
  - Button: `검색` (아웃라인 버튼, 테두리 #D4CFC8, 텍스트 #2C2C2C)

### 1.3 컴포넌트 상태 및 활성화 섹션 (Section Block)
- **컨테이너**: `mg-v2-section-block`
- **섹션 제목**: 좌측 악센트 바 + `Shop·Reward 번들 상태`
- **상태 카드**:
  - 3개 코드(`SHOP`, `REWARD`, `POINT`)의 현재 상태 표시.
  - 활성(Active): 텍스트 `var(--mg-primary)` (#3D5246), 배경 옅은 녹색 계열.
  - 미활성(Inactive): 텍스트 `var(--mg-text-sub)` (#5C6B61), 배경 `var(--mg-bg-main)`.
- **액션 버튼**:
  - 라벨: `Shop·Reward 번들 활성화`
  - 스타일: `mg-v2-btn-primary` (배경 #3D5246, 텍스트 #FAF9F7, radius 10px, height 40px)

## 2. 디자인 토큰 및 카피 (한국어)
- **Primary Color**: `var(--mg-primary)` (#3D5246)
- **Background**: `var(--mg-bg-surface)` (#F5F3EF), `var(--mg-bg-main)` (#FAF9F7)
- **Text**: `var(--mg-text-main)` (#2C2C2C), `var(--mg-text-sub)` (#5C6B61)
- **Border**: `var(--mg-border)` (#D4CFC8)

### 2.1 토스트 메시지 (Toast)
- **성공**: "Shop·Reward 컴포넌트가 성공적으로 활성화되었습니다."
- **에러**: "컴포넌트 활성화에 실패했습니다. 잠시 후 다시 시도해주세요."

## 3. core-coder 전달용 완료 조건 (Checklist)
1. **API 연동**: `POST /api/v1/super-admin/tenants/{tenantId}/components/shop-reward/activate` 호출 연동 완료.
2. **레이아웃 준수**: `mg-v2-section-block` 및 좌측 악센트 바(`mg-v2-accent-bar`)가 디자인 스펙대로 적용되었는지 확인.
3. **상태 렌더링**: 테넌트 검색 후 `SHOP`, `REWARD`, `POINT` 3개 컴포넌트의 상태가 정확히 화면에 표시되는지 확인.
4. **토스트 알림**: 활성화 성공/실패 시 지정된 한국어 카피의 토스트 메시지가 정상 노출되는지 확인.
5. **예외 처리**: API 호출 실패 시 버튼이 활성화 전 상태로 복구되며 로딩 상태가 해제되는지 확인.
