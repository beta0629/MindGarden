-- PLP 카테고리 (상담 패키지 / 심리 검사)
-- @author MindGarden
-- @since 2026-05-19

ALTER TABLE shop_catalog_skus
    ADD COLUMN catalog_category VARCHAR(32) NULL COMMENT 'CONSULTATION|ASSESSMENT' AFTER sort_order;
