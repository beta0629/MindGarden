/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU UI 상수
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

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

/** 저장된 이미지 URL 이 404 등으로 안 열릴 때 */
export const ADMIN_SHOP_SKU_IMAGE_BROKEN = '이미지를 불러오지 못했어요 · 다시 올려 주세요';

export const ADMIN_SHOP_SKU_IMAGE_DROP_REJECTED_DEFAULT =
  'JPEG, PNG, WebP만 업로드할 수 있으며 최대 5MB입니다.';

/** OPS 시드·QA classpath placeholder (ShopCatalogSkuConstants.SEED_PLACEHOLDER_THUMBNAIL_PATH) */
export const ADMIN_SHOP_CATALOG_SEED_PLACEHOLDER_THUMBNAIL_PATH =
  '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png';

export const ADMIN_SHOP_DESCRIPTION_MAX_LENGTH = 4000;
export const ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE =
  '회기수는 1 이상의 양의 정수여야 합니다.';

/** 상품 분야 공통코드 그룹. CONSULTATION=SPECIALTY, ASSESSMENT=ASSESSMENT_TYPE. */
export const ADMIN_SHOP_FIELD_CODE_GROUP = Object.freeze({
  CONSULTATION: 'SPECIALTY',
  ASSESSMENT: 'ASSESSMENT_TYPE'
});

export const ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL = Object.freeze({
  CONSULTATION: '상담 분야',
  ASSESSMENT: '검사 종류'
});

export const ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE = '분야를 선택해 주세요.';

export const ADMIN_SHOP_CONSULTANT_REQUIRED_MESSAGE = '상담 선생님을 선택해 주세요.';

/** 상담사 목록. GET /api/v1/admin/consultants/with-stats */
export const ADMIN_SHOP_CONSULTANT_LIST_ROLE = 'CONSULTANT';
