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
export const ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT = '상품 내용';

export const ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE = '온라인 상품 노출';
export const ADMIN_SHOP_PACKAGE_FEE_PAGE_DESCRIPTION =
  '패키지 요금 관리에 등록된 상품 중 온라인 카탈로그에 노출할 항목을 고릅니다. '
  + '이름·단가·회기수는 요금 관리 값을 사용합니다.';
export const ADMIN_SHOP_PACKAGE_FEE_EMPTY =
  '패키지 요금 관리에 등록된 패키지가 없습니다.';
export const ADMIN_SHOP_PACKAGE_FEE_CONTENT_ACTION = '내용 등록';
export const ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON = '노출';
export const ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF = '비노출';
export const ADMIN_SHOP_PACKAGE_FEE_COLUMN_NAME = '상품명';
export const ADMIN_SHOP_PACKAGE_FEE_COLUMN_PRICE = '단가(원)';
export const ADMIN_SHOP_PACKAGE_FEE_COLUMN_EXPOSE = '카탈로그 노출';
export const ADMIN_SHOP_PACKAGE_FEE_COLUMN_ACTIONS = '동작';
export const ADMIN_SHOP_PACKAGE_FEE_IDENTITY_HINT =
  '이름·단가·회기수는 패키지 요금 관리에서 가져옵니다. '
  + '여기서는 설명과 대표 이미지만 등록합니다.';
export const ADMIN_SHOP_PACKAGE_FEE_NOT_READY_MESSAGE =
  '요금 관리에서 사용 중이 아니거나 가격·회기가 없는 패키지는 '
  + '온라인에 노출할 수 없습니다.';
export const ADMIN_SHOP_PACKAGE_FEE_LEGACY_TITLE = '기존 직접 등록 상품';
export const ADMIN_SHOP_PACKAGE_FEE_LEGACY_DESCRIPTION =
  '요금 관리에 연결되지 않은 상품입니다. 새로 등록하지 않고 노출만 끌 수 있습니다.';
export const ADMIN_SHOP_PACKAGE_FEE_CONTENT_SAVED = '상품 내용이 저장되었습니다.';
export const ADMIN_SHOP_PACKAGE_FEE_DESCRIPTION_LABEL = '설명(선택)';
export const ADMIN_SHOP_PACKAGE_FEE_SORT_LABEL = '정렬 순서';
export const ADMIN_SHOP_PACKAGE_FEE_PRICE_LABEL = '단가(원)';
export const ADMIN_SHOP_DESCRIPTION_MAX_LENGTH = 4000;
export const ADMIN_SHOP_SKU_FORM_SKU_CODE_LABEL = 'SKU 코드';
export const ADMIN_SHOP_SKU_FORM_SKU_CODE_PLACEHOLDER = '저장 후 자동 생성됩니다';
export const ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE = '대표 이미지를 등록해 주세요.';
export const ADMIN_SHOP_SKU_TITLE_REQUIRED_MESSAGE = '상품명은 필수입니다.';
export const ADMIN_SHOP_SKU_SESSION_COUNT_LABEL = '회기수';
export const ADMIN_SHOP_SKU_SESSION_COUNT_HINT = '결제 완료 시 매핑에 가산되는 회기수(양의 정수)';
export const ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE =
  '회기수는 1 이상의 양의 정수여야 합니다.';
export const ADMIN_SHOP_SKU_PACKAGE_TYPE_SINGLE_LABEL = '단회기';
export const ADMIN_SHOP_SKU_PACKAGE_TYPE_PACKAGE_LABEL = '패키지';
export const ADMIN_SHOP_SKU_LIST_SESSION_COUNT_COLUMN = '회기수';

/** E2E·Playwright data-testid */
export const ADMIN_SHOP_SKU_TEST_IDS = {
  FORM_PAGE: 'admin-shop-sku-form-page',
  FORM_LOADING: 'admin-sku-form-loading',
  TITLE_INPUT: 'admin-sku-title-input',
  TITLE_READONLY: 'admin-sku-title-readonly',
  PRICE_READONLY: 'admin-sku-price-readonly',
  PACKAGE_FEE_LIST: 'admin-shop-package-fee-list',
  PACKAGE_FEE_EXPOSE: 'admin-shop-package-fee-expose',
  PACKAGE_FEE_CONTENT: 'admin-shop-package-fee-content',
  SESSION_COUNT_INPUT: 'admin-sku-session-count-input',
  IMAGE_UPLOAD: 'admin-sku-image-upload',
  SAVE_BUTTON: 'admin-sku-save-button',
  SKU_CODE_READONLY: 'admin-sku-code-readonly'
};
