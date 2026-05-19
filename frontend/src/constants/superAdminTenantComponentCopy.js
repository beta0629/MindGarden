/**
 * 슈퍼어드민 — 테넌트 Shop·Reward 컴포넌트 UI 카피
 * @see docs/project-management/SHOP_REWARD_SUPER_ADMIN_COMPONENT_UI_HANDOFF.md
 *
 * @author CoreSolution
 * @since 2026-05-22
 */

import { PLATFORM_COMPONENT_CODES } from './tenantComponentApi';

export const SUPER_ADMIN_TENANT_COMPONENT_COPY = {
  BREADCRUMB: '슈퍼어드민 > 테넌트 컴포넌트 관리',
  PAGE_TITLE: '테넌트 컴포넌트 관리 (Shop & Reward)',
  PAGE_SUBTITLE: '대상 테넌트에 Shop·Reward 번들 컴포넌트를 활성화합니다.',
  SEARCH_SECTION_TITLE: '테넌트 검색',
  BUNDLE_SECTION_TITLE: 'Shop·Reward 번들 상태',
  TENANT_ID_LABEL: '테넌트 ID',
  TENANT_ID_PLACEHOLDER: '테넌트 ID를 입력하세요',
  SEARCH_BUTTON: '검색',
  ACTIVATE_BUTTON: 'Shop·Reward 번들 활성화',
  STATUS_ACTIVE: '활성',
  STATUS_INACTIVE: '미활성',
  STATUS_UNKNOWN: '미조회',
  TENANT_ID_REQUIRED: '테넌트 ID를 입력해주세요.',
  SEARCH_HINT: '검색 후 번들 상태를 확인하고 활성화할 수 있습니다.',
  TOAST_SUCCESS: 'Shop·Reward 컴포넌트가 성공적으로 활성화되었습니다.',
  TOAST_ERROR: '컴포넌트 활성화에 실패했습니다. 잠시 후 다시 시도해주세요.',
  ACTIVATED_COUNT: (count) => `신규 활성화: ${count}건`
};

/** Handoff §1.3 상태 카드 — {@link PlatformComponentCodes.SHOP_REWARD_BUNDLE} 표시 라벨 */
export const SHOP_REWARD_BUNDLE_STATUS_ITEMS = [
  {
    code: PLATFORM_COMPONENT_CODES.CLIENT_SHOP,
    shortLabel: 'SHOP',
    description: '내담자 쇼핑'
  },
  {
    code: PLATFORM_COMPONENT_CODES.CLIENT_REWARD,
    shortLabel: 'REWARD',
    description: '포인트·리워드'
  },
  {
    code: PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG,
    shortLabel: 'CATALOG',
    description: '어드민 카탈로그'
  }
];
