/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU UI 상수
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

/** @type {Readonly<{ changedAt: string, unitPrice: string, currency: string, changedBy: string }>} */
export const ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS = {
  changedAt: '변경 일시',
  unitPrice: '단가',
  currency: '통화',
  changedBy: '변경자'
};

export const ADMIN_SHOP_PRICE_HISTORY_MODAL_TITLE = '가격 이력';
export const ADMIN_SHOP_PRICE_HISTORY_EMPTY_MESSAGE = '가격 변경 이력이 없습니다.';
export const ADMIN_SHOP_PRICE_HISTORY_ACTION_LABEL = '가격 이력';

/** 대표 이미지 업로드 — MIME·용량 (백엔드 검증과 동일 목표) */
export const ADMIN_SHOP_SKU_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** @type {Readonly<Record<string, string[]>>} */
export const ADMIN_SHOP_SKU_IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

export const ADMIN_SHOP_SKU_IMAGE_UPLOAD_HINT =
  '클릭하거나 이미지를 끌어다 놓으세요 (1:1, 최대 5MB)';

export const ADMIN_SHOP_SKU_IMAGE_FORMAT_HINT =
  '지원 형식: JPEG, PNG, WebP / 파일당 최대 5MB';

export const ADMIN_SHOP_SKU_IMAGE_SELECTION_NONE = '선택된 파일 없음';

export const ADMIN_SHOP_SKU_IMAGE_DROP_REJECTED_DEFAULT =
  'JPEG, PNG, WebP만 업로드할 수 있으며 최대 5MB입니다.';

/** OPS 시드·QA classpath placeholder (ShopCatalogSkuConstants.SEED_PLACEHOLDER_THUMBNAIL_PATH) */
export const ADMIN_SHOP_CATALOG_SEED_PLACEHOLDER_THUMBNAIL_PATH =
  '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png';

export const ADMIN_SHOP_SKU_FORM_PAGE_TITLE_CREATE = '상품 등록';
export const ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT = '상품 수정';
export const ADMIN_SHOP_SKU_FORM_SKU_CODE_LABEL = 'SKU 코드';
export const ADMIN_SHOP_SKU_FORM_SKU_CODE_PLACEHOLDER = '저장 후 자동 생성됩니다';
export const ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE = '대표 이미지를 등록해 주세요.';
export const ADMIN_SHOP_SKU_TITLE_REQUIRED_MESSAGE = '상품명은 필수입니다.';

/** E2E·Playwright data-testid */
export const ADMIN_SHOP_SKU_TEST_IDS = {
  FORM_PAGE: 'admin-shop-sku-form-page',
  FORM_LOADING: 'admin-sku-form-loading',
  TITLE_INPUT: 'admin-sku-title-input',
  IMAGE_UPLOAD: 'admin-sku-image-upload',
  SAVE_BUTTON: 'admin-sku-save-button',
  SKU_CODE_READONLY: 'admin-sku-code-readonly'
};
