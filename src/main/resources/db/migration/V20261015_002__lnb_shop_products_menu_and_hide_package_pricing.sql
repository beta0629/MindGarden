-- LNB: 상품 구성 몰 기반 전환에 따른 관리자 메뉴 정리 (추가·변경형, 삭제 없음)
-- 1) ADM_SHOP_CATALOG: 이름 「상품 관리」, 경로 /admin/shop/products (부모·sort_order 유지)
-- 2) ADM_PACKAGE_PRICING: 비활성화만 (행 삭제·설정 메뉴 순서 변경 없음)
-- 멱등: 같은 값으로 다시 실행해도 결과 동일

UPDATE menus
SET menu_name = '상품 관리',
    menu_name_en = 'Products',
    menu_path = '/admin/shop/products',
    description = '쇼핑 상품 관리 (상품 구성 포함)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_SHOP_CATALOG';

UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PACKAGE_PRICING';
