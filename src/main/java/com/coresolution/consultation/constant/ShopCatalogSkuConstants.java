package com.coresolution.consultation.constant;

/**
 * 카탈로그 SKU 코드·썸네일 업로드 상수.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public final class ShopCatalogSkuConstants {

    /** 자동 발급 SKU 코드 접두사 (예: SHOP-20260523-001). */
    public static final String SKU_CODE_PREFIX = "SHOP";

    /** SKU 코드 일자 구간 길이 (yyyyMMdd). */
    public static final int SKU_CODE_DATE_PART_LENGTH = 8;

    /** 일자별 시퀀스 자릿수. */
    public static final int SKU_CODE_SEQ_WIDTH = 3;

    /** 자동 발급 충돌 시 최대 재시도. */
    public static final int SKU_CODE_GENERATION_MAX_ATTEMPTS = 5;

    public static final String THUMBNAIL_UPLOAD_DIR = "uploads/shop-catalog-thumbnails/";

    public static final String THUMBNAIL_URL_PREFIX_V1 = "/api/v1/files/shop-catalog-thumbnails/";

    public static final long THUMBNAIL_MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;

    public static final String[] THUMBNAIL_SUPPORTED_CONTENT_TYPES = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    };

    public static final String THUMBNAIL_REQUIRED_MESSAGE = "대표 이미지(thumbnailUrl)가 필요합니다.";

    public static final String THUMBNAIL_FILE_EMPTY_MESSAGE = "업로드 파일이 비어 있습니다.";

    public static final String THUMBNAIL_FILE_TOO_LARGE_MESSAGE =
            "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.";

    public static final String THUMBNAIL_UNSUPPORTED_TYPE_MESSAGE =
            "지원하지 않는 파일 형식입니다. PNG, JPG, WEBP 파일만 업로드 가능합니다.";

    public static final String DUPLICATE_SKU_CODE_MESSAGE = "이미 사용 중인 skuCode 입니다: ";

    /** OPS 시드·QA용 classpath placeholder 파일명. */
    public static final String SEED_PLACEHOLDER_THUMBNAIL_FILE_NAME = "placeholder-dev-consult-demo.png";

    /** OPS 시드·QA용 classpath placeholder 리소스 경로. */
    public static final String SEED_PLACEHOLDER_THUMBNAIL_CLASSPATH =
            "shop-catalog-thumbnails/" + SEED_PLACEHOLDER_THUMBNAIL_FILE_NAME;

    /** OPS 시드·QA용 상대 썸네일 URL (업로드 없을 때 classpath placeholder 서빙). */
    public static final String SEED_PLACEHOLDER_THUMBNAIL_PATH =
            THUMBNAIL_URL_PREFIX_V1 + SEED_PLACEHOLDER_THUMBNAIL_FILE_NAME;

    private ShopCatalogSkuConstants() {
    }
}
