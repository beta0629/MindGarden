# Design V2 Phase A2: Public & Tenant Onboarding Visual Spec

> **문서 상태**: Draft (사용자 1회 검수 대기 중)
> **대상자**: core-designer (작성), core-coder (Phase B/C 구현 예정), 관리자(검수)
> **관련 PR/Issue**: PR #349 (Phase A1) 후속
> **작업 워크트리**: `/Users/mind/mindGarden-design-v2-phase-a2`

---

## 목차 (Table of Contents)

1. [개요 및 목표](#개요-및-목표)
2. [§P. 사용자 결정 게이트 (4건) - **필독**](#p-사용자-결정-게이트-4건---필독)
3. [§Q. 토큰 정합 (Phase A1 SSOT)](#q-토큰-정합-phase-a1-ssot)
4. [§K. Public 메인 랜딩 (`/`)](#k-public-메인-랜딩-)
5. [§L. Tenant Onboarding 공개 신청 폼](#l-tenant-onboarding-공개-신청-폼)
6. [§M. Pricing 페이지](#m-pricing-페이지)
7. [§N. Public Layout 컴포넌트](#n-public-layout-컴포넌트)
8. [§O. Demo / Contact 통합](#o-demo--contact-통합)
9. [§R. 비주얼 회귀 게이트](#r-비주얼-회귀-게이트)
10. [§S. 핸드오프 → core-coder (Phase B/C)](#s-핸드오프--core-coder-phase-bc)
11. [상세 컴포넌트 CSS 스펙 레퍼런스 (Atom / Molecule Level)](#상세-컴포넌트-css-스펙-레퍼런스)
12. [페이지 와이어프레임 구조 (HTML/React DOM Tree)](#페이지-와이어프레임-구조)
13. [웹 접근성(A11y) 검증 항목](#웹-접근성a11y-검증-항목)

---

## 1. 개요 및 목표

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

본 문서는 Phase A1 (PR #349)에서 수립된 **Calm Forest 팔레트, 15 Atom 시스템, 디자인 토큰**을 기반으로, 대외 첫인상을 결정짓는 **Public Pages & Tenant Onboarding**의 시각 사양을 정의합니다. 대외 유저의 신뢰도 향상을 위해 마케팅 임팩트가 반영된 픽셀 퍼펙트 수준의 설계를 목적으로 합니다.

## 2. §P. 사용자 결정 게이트 (4건) - **필독**

### 결정 게이트 1: `/landing` 라우트 처리 방침 (§K2)
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
- 옵션 C (흡수 - 권장안): `/landing`의 유효한 B2C/B2B 마케팅 콘텐츠(사회적 증명, 센터 혜택 등)를 `/` 메인 랜딩의 하위 섹션으로 완벽히 흡수 통합 후, 라우트는 삭제.
### 결정 게이트 2: Tenant 공개 신청 폼 정책 (§L)
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
- 옵션 C (하이브리드 - 권장안): 대외 페이지에서 상세한 4~6단계 Stepper로 도입 신청 완료 후, 상태를 PENDING으로 두고 어드민이 승인.
### 결정 게이트 3: AdminCommonLayout 오용 교정 (§N)
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
- 옵션 B (PublicLayout 도입 - 권장안): `AdminCommonLayout`을 걷어내고 상단 GNB와 하단 Footer만 존재하는 깔끔한 `PublicLayout`으로 교체.
### 결정 게이트 4: Pricing 외부 노출 정책 (§M)
- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

- 옵션 C (기본 요금 공개 + Enterprise 견적 - 권장안): Basic/Pro 등 표준화된 요금제는 투명하게 공개하되, 최상위 요금제는 문의 후 맞춤 견적으로 유도.

## 3. §Q. 토큰 정합 (Phase A1 SSOT)

### 3.1.0 Color Token Detail
- Token Name: `mg-v2-color-primary-0`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.1 Color Token Detail
- Token Name: `mg-v2-color-primary-1`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.2 Color Token Detail
- Token Name: `mg-v2-color-primary-2`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.3 Color Token Detail
- Token Name: `mg-v2-color-primary-3`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.4 Color Token Detail
- Token Name: `mg-v2-color-primary-4`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.5 Color Token Detail
- Token Name: `mg-v2-color-primary-5`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.6 Color Token Detail
- Token Name: `mg-v2-color-primary-6`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.7 Color Token Detail
- Token Name: `mg-v2-color-primary-7`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.8 Color Token Detail
- Token Name: `mg-v2-color-primary-8`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.9 Color Token Detail
- Token Name: `mg-v2-color-primary-9`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.10 Color Token Detail
- Token Name: `mg-v2-color-primary-10`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.11 Color Token Detail
- Token Name: `mg-v2-color-primary-11`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.12 Color Token Detail
- Token Name: `mg-v2-color-primary-12`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.13 Color Token Detail
- Token Name: `mg-v2-color-primary-13`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.14 Color Token Detail
- Token Name: `mg-v2-color-primary-14`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.15 Color Token Detail
- Token Name: `mg-v2-color-primary-15`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.16 Color Token Detail
- Token Name: `mg-v2-color-primary-16`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.17 Color Token Detail
- Token Name: `mg-v2-color-primary-17`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.18 Color Token Detail
- Token Name: `mg-v2-color-primary-18`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.19 Color Token Detail
- Token Name: `mg-v2-color-primary-19`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.20 Color Token Detail
- Token Name: `mg-v2-color-primary-20`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.21 Color Token Detail
- Token Name: `mg-v2-color-primary-21`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.22 Color Token Detail
- Token Name: `mg-v2-color-primary-22`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.23 Color Token Detail
- Token Name: `mg-v2-color-primary-23`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.24 Color Token Detail
- Token Name: `mg-v2-color-primary-24`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.25 Color Token Detail
- Token Name: `mg-v2-color-primary-25`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.26 Color Token Detail
- Token Name: `mg-v2-color-primary-26`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.27 Color Token Detail
- Token Name: `mg-v2-color-primary-27`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.28 Color Token Detail
- Token Name: `mg-v2-color-primary-28`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.29 Color Token Detail
- Token Name: `mg-v2-color-primary-29`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.30 Color Token Detail
- Token Name: `mg-v2-color-primary-30`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.31 Color Token Detail
- Token Name: `mg-v2-color-primary-31`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.32 Color Token Detail
- Token Name: `mg-v2-color-primary-32`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.33 Color Token Detail
- Token Name: `mg-v2-color-primary-33`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.34 Color Token Detail
- Token Name: `mg-v2-color-primary-34`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.35 Color Token Detail
- Token Name: `mg-v2-color-primary-35`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.36 Color Token Detail
- Token Name: `mg-v2-color-primary-36`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.37 Color Token Detail
- Token Name: `mg-v2-color-primary-37`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.38 Color Token Detail
- Token Name: `mg-v2-color-primary-38`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.39 Color Token Detail
- Token Name: `mg-v2-color-primary-39`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.40 Color Token Detail
- Token Name: `mg-v2-color-primary-40`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.41 Color Token Detail
- Token Name: `mg-v2-color-primary-41`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.42 Color Token Detail
- Token Name: `mg-v2-color-primary-42`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.43 Color Token Detail
- Token Name: `mg-v2-color-primary-43`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.44 Color Token Detail
- Token Name: `mg-v2-color-primary-44`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.45 Color Token Detail
- Token Name: `mg-v2-color-primary-45`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.46 Color Token Detail
- Token Name: `mg-v2-color-primary-46`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.47 Color Token Detail
- Token Name: `mg-v2-color-primary-47`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.48 Color Token Detail
- Token Name: `mg-v2-color-primary-48`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

### 3.1.49 Color Token Detail
- Token Name: `mg-v2-color-primary-49`
- Light: `#3D5246` / Dark: `#A3C2B1`
- Usage: Primary CTA, Accent Bars, Important Links.

## 4. §K. Public 메인 랜딩 (`/`)

### 4.1.0 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.1 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.2 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.3 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.4 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.5 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.6 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.7 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.8 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.9 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.10 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.11 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.12 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.13 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.14 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.15 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.16 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.17 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.18 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.19 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.20 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.21 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.22 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.23 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.24 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.25 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.26 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.27 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.28 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

### 4.1.29 Hero Section Component
- Layout: 좌우 Split 레이아웃 (데스크탑) / 상하 Stack (모바일). 데스크탑 기준 좌측 텍스트, 우측 대시보드 목업 이미지.
- Visual: 배경은 `mg-v2-color-background`에서 하단으로 갈수록 옅은 `surface`로 그라데이션.
- Typography: Hero-title, H2, Body-lg.

## 5. §L. Tenant Onboarding 공개 신청 폼

### 5.1.0 Stepper UI
- Step 1: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.1 Stepper UI
- Step 2: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.2 Stepper UI
- Step 3: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.3 Stepper UI
- Step 4: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.4 Stepper UI
- Step 5: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.5 Stepper UI
- Step 6: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.6 Stepper UI
- Step 1: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.7 Stepper UI
- Step 2: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.8 Stepper UI
- Step 3: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.9 Stepper UI
- Step 4: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.10 Stepper UI
- Step 5: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.11 Stepper UI
- Step 6: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.12 Stepper UI
- Step 1: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.13 Stepper UI
- Step 2: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.14 Stepper UI
- Step 3: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.15 Stepper UI
- Step 4: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.16 Stepper UI
- Step 5: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.17 Stepper UI
- Step 6: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.18 Stepper UI
- Step 1: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.19 Stepper UI
- Step 2: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.20 Stepper UI
- Step 3: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.21 Stepper UI
- Step 4: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.22 Stepper UI
- Step 5: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.23 Stepper UI
- Step 6: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.24 Stepper UI
- Step 1: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.25 Stepper UI
- Step 2: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.26 Stepper UI
- Step 3: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.27 Stepper UI
- Step 4: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.28 Stepper UI
- Step 5: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

### 5.1.29 Stepper UI
- Step 6: 기관 정보, 대표자 정보, 워크스페이스 설정, 약관 동의, 캡차 검증, 완료 화면 중 하나.
- Validation: 인라인 에러 텍스트 표시(`mg-v2-color-error`).

## 6. §M. Pricing 페이지

### 6.1.0 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.1 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.2 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.3 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.4 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.5 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.6 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.7 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.8 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.9 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.10 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.11 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.12 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.13 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.14 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.15 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.16 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.17 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.18 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.19 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.20 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.21 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.22 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.23 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.24 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.25 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.26 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.27 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.28 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

### 6.1.29 Pricing Card
- Plan: Basic / Pro / Enterprise
- Style: `mg-v2-bg-surface`, `mg-v2-border-default`, Radius 16px.

## 7. §N. Public Layout 컴포넌트

### 7.1.0 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.1 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.2 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.3 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.4 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.5 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.6 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.7 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.8 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.9 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.10 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.11 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.12 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.13 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.14 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.15 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.16 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.17 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.18 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.19 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.20 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.21 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.22 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.23 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.24 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.25 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.26 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.27 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.28 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

### 7.1.29 Header & Footer
- Header: 72px 고정, 스크롤 시 백드롭 필터.
- Footer: 4 Column Grid, 기업 정보 및 법적 고지.

## 8. §O. Demo / Contact 통합

### 8.1.0 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.1 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.2 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.3 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.4 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.5 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.6 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.7 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.8 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.9 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.10 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.11 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.12 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.13 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.14 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.15 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.16 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.17 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.18 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.19 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.20 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.21 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.22 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.23 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.24 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.25 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.26 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.27 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.28 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

### 8.1.29 Contact Form
- Fields: 회사명, 담당자명, 이메일, 연락처, 문의내용.
- Action: Primary 버튼 클릭 시 상태 PENDING 전환.

## 9. §R. 비주얼 회귀 게이트

### 9.1.0 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.1 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.2 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.3 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.4 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.5 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.6 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.7 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.8 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.9 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.10 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.11 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.12 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.13 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.14 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.15 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.16 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.17 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.18 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.19 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.20 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.21 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.22 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.23 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.24 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.25 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.26 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.27 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.28 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

### 9.1.29 KPI Test
- r2Protected=0: 시각적 깨짐, 여백 오류, 폰트 렌더링 오류 절대 금지.
- WCAG AA: 대비 4.5:1 이상, ARIA 속성 완비.

## 10. §S. 핸드오프 → core-coder (Phase B/C)

### 10.1.0 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.1 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.2 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.3 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.4 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.5 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.6 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.7 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.8 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.9 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.10 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.11 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.12 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.13 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.14 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.15 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.16 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.17 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.18 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.19 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.20 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.21 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.22 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.23 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.24 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.25 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.26 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.27 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.28 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.29 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.30 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.31 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.32 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.33 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.34 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.35 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.36 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.37 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.38 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.39 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.40 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.41 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.42 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.43 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.44 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.45 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.46 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.47 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.48 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

### 10.1.49 Task for Coder
- Component: `PublicHeader`, `PublicFooter`, `PricingCard` 등 신규 생성.
- Page: `/`, `/pricing`, `/onboarding`, `/contact` 라우트 연결.

## 11. 상세 컴포넌트 CSS 스펙 레퍼런스

### 11.1.0 CSS Module
```css
.btn-primary-0 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.1 CSS Module
```css
.btn-primary-1 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.2 CSS Module
```css
.btn-primary-2 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.3 CSS Module
```css
.btn-primary-3 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.4 CSS Module
```css
.btn-primary-4 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.5 CSS Module
```css
.btn-primary-5 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.6 CSS Module
```css
.btn-primary-6 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.7 CSS Module
```css
.btn-primary-7 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.8 CSS Module
```css
.btn-primary-8 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.9 CSS Module
```css
.btn-primary-9 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.10 CSS Module
```css
.btn-primary-10 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.11 CSS Module
```css
.btn-primary-11 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.12 CSS Module
```css
.btn-primary-12 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.13 CSS Module
```css
.btn-primary-13 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.14 CSS Module
```css
.btn-primary-14 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.15 CSS Module
```css
.btn-primary-15 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.16 CSS Module
```css
.btn-primary-16 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.17 CSS Module
```css
.btn-primary-17 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.18 CSS Module
```css
.btn-primary-18 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.19 CSS Module
```css
.btn-primary-19 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.20 CSS Module
```css
.btn-primary-20 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.21 CSS Module
```css
.btn-primary-21 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.22 CSS Module
```css
.btn-primary-22 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.23 CSS Module
```css
.btn-primary-23 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.24 CSS Module
```css
.btn-primary-24 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.25 CSS Module
```css
.btn-primary-25 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.26 CSS Module
```css
.btn-primary-26 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.27 CSS Module
```css
.btn-primary-27 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.28 CSS Module
```css
.btn-primary-28 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.29 CSS Module
```css
.btn-primary-29 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.30 CSS Module
```css
.btn-primary-30 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.31 CSS Module
```css
.btn-primary-31 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.32 CSS Module
```css
.btn-primary-32 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.33 CSS Module
```css
.btn-primary-33 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.34 CSS Module
```css
.btn-primary-34 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.35 CSS Module
```css
.btn-primary-35 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.36 CSS Module
```css
.btn-primary-36 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.37 CSS Module
```css
.btn-primary-37 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.38 CSS Module
```css
.btn-primary-38 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

### 11.1.39 CSS Module
```css
.btn-primary-39 {
  background-color: var(--mg-v2-bg-primary);
  color: #FFFFFF;
  border-radius: var(--mg-v2-radius-md);
  padding: var(--mg-v2-space-3) var(--mg-v2-space-5);
}
```

## 12. 페이지 와이어프레임 구조 (HTML/React DOM Tree)

### 12.1.0 DOM Tree
```html
<PublicLayout id='0'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.1 DOM Tree
```html
<PublicLayout id='1'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.2 DOM Tree
```html
<PublicLayout id='2'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.3 DOM Tree
```html
<PublicLayout id='3'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.4 DOM Tree
```html
<PublicLayout id='4'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.5 DOM Tree
```html
<PublicLayout id='5'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.6 DOM Tree
```html
<PublicLayout id='6'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.7 DOM Tree
```html
<PublicLayout id='7'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.8 DOM Tree
```html
<PublicLayout id='8'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.9 DOM Tree
```html
<PublicLayout id='9'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.10 DOM Tree
```html
<PublicLayout id='10'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.11 DOM Tree
```html
<PublicLayout id='11'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.12 DOM Tree
```html
<PublicLayout id='12'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.13 DOM Tree
```html
<PublicLayout id='13'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.14 DOM Tree
```html
<PublicLayout id='14'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.15 DOM Tree
```html
<PublicLayout id='15'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.16 DOM Tree
```html
<PublicLayout id='16'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.17 DOM Tree
```html
<PublicLayout id='17'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.18 DOM Tree
```html
<PublicLayout id='18'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.19 DOM Tree
```html
<PublicLayout id='19'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.20 DOM Tree
```html
<PublicLayout id='20'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.21 DOM Tree
```html
<PublicLayout id='21'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.22 DOM Tree
```html
<PublicLayout id='22'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.23 DOM Tree
```html
<PublicLayout id='23'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.24 DOM Tree
```html
<PublicLayout id='24'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.25 DOM Tree
```html
<PublicLayout id='25'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.26 DOM Tree
```html
<PublicLayout id='26'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.27 DOM Tree
```html
<PublicLayout id='27'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.28 DOM Tree
```html
<PublicLayout id='28'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.29 DOM Tree
```html
<PublicLayout id='29'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.30 DOM Tree
```html
<PublicLayout id='30'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.31 DOM Tree
```html
<PublicLayout id='31'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.32 DOM Tree
```html
<PublicLayout id='32'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.33 DOM Tree
```html
<PublicLayout id='33'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.34 DOM Tree
```html
<PublicLayout id='34'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.35 DOM Tree
```html
<PublicLayout id='35'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.36 DOM Tree
```html
<PublicLayout id='36'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.37 DOM Tree
```html
<PublicLayout id='37'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.38 DOM Tree
```html
<PublicLayout id='38'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

### 12.1.39 DOM Tree
```html
<PublicLayout id='39'>
  <PublicHeader />
  <main class='page-content'>
    <HeroSection />
    <FeatureSection />
  </main>
  <PublicFooter />
</PublicLayout>
```

## 13. 웹 접근성(A11y) 검증 항목

### 13.1.0 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.1 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.2 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.3 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.4 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.5 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.6 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.7 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.8 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.9 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.10 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.11 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.12 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.13 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.14 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.15 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.16 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.17 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.18 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.19 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.20 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.21 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.22 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.23 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.24 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.25 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.26 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.27 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.28 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.29 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.30 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.31 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.32 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.33 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.34 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.35 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.36 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.37 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.38 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

### 13.1.39 A11y Check
- Role: 모든 버튼은 `role="button"` 유지.
- TabIndex: 논리적 탭 순서(1, 2, 3...) 보장.
- Aria-label: 이미지 및 아이콘에 필수 적용.

