-- BW-3: 심리교육·힐링(명상 등) 테넌트별 콘텐츠 마스터 + 초기 시드(테넌트별 1회)
-- @author MindGarden
-- @since 2026-05-15

CREATE TABLE IF NOT EXISTS psycho_education_articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    slug VARCHAR(128) NOT NULL COMMENT '테넌트 내 고유 슬러그',
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(600) NOT NULL,
    body MEDIUMTEXT NOT NULL,
    category VARCHAR(32) NOT NULL,
    category_label VARCHAR(64) NOT NULL,
    read_minutes INT NOT NULL,
    pages_json JSON NOT NULL COMMENT '카드뉴스 페이지 [{title,body}, ...]',
    is_published TINYINT(1) NOT NULL DEFAULT 1 COMMENT '클라이언트 노출',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_pea_tenant_slug (tenant_id, slug),
    INDEX idx_pea_tenant_pub_sort (tenant_id, is_published, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='심리교육 카드뉴스(테넌트 마스터, WA-3 노출·순서)';

CREATE TABLE IF NOT EXISTS healing_content_catalog_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    code VARCHAR(64) NOT NULL COMMENT '테넌트 내 고유 코드',
    title VARCHAR(200) NOT NULL,
    description VARCHAR(600) NULL,
    category VARCHAR(64) NOT NULL,
    media_type VARCHAR(32) NOT NULL COMMENT 'MEDITATION | ARTICLE | AUDIO | VIDEO',
    thumbnail_url VARCHAR(512) NULL,
    content_url VARCHAR(512) NULL,
    duration_minutes INT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1 COMMENT '클라이언트 노출',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_hcci_tenant_code (tenant_id, code),
    INDEX idx_hcci_tenant_pub_sort (tenant_id, is_published, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='힐링 카탈로그(명상·글 등, 테넌트 마스터)';

-- 힐링 카탈로그 시드 (기존 정적 시드와 동등한 4건, 테넌트별)
INSERT INTO healing_content_catalog_items (
    tenant_id, code, title, description, category, media_type, thumbnail_url, content_url,
    duration_minutes, is_published, sort_order, created_at, updated_at, is_deleted, version
)
SELECT t.tenant_id, v.code, v.title, v.description, v.category, v.media_type, NULL, NULL,
    v.duration_minutes, 1, v.sort_order, NOW(6), NOW(6), 0, 0
FROM tenants t
CROSS JOIN (
    SELECT 10 AS sort_order, 'bw3-relax-meditation' AS code, '호흡과 바디 스캔' AS title,
        '짧은 가이드 명상으로 긴장을 낮춥니다.' AS description, 'RELAXATION' AS category,
        'MEDITATION' AS media_type, 5 AS duration_minutes
    UNION ALL SELECT 20, 'bw3-sleep-rhythm', '수면 리듬 점검', '취침 전 루틴을 정리하는 짧은 글 모음입니다.', 'SLEEP', 'ARTICLE', NULL
    UNION ALL SELECT 30, 'bw3-focus-ambient', '집중을 위한 앰비언트', '배경 소리로 주의를 한곳에 모아 보세요.', 'FOCUS', 'AUDIO', 10
    UNION ALL SELECT 40, 'bw3-neck-stretch', '어깨·목 스트레칭', '의자에서 할 수 있는 가벼운 영상 가이드입니다.', 'MOVEMENT', 'VIDEO', 8
) v
WHERE COALESCE(t.is_deleted, 0) = 0;

-- 심리교육 시드: 핵심 2편(전체 8편은 어드민 CRUD로 확장). pages_json은 JSON 함수로 구성
INSERT INTO psycho_education_articles (
    tenant_id, slug, title, summary, body, category, category_label, read_minutes, pages_json,
    is_published, sort_order, created_at, updated_at, is_deleted, version
)
SELECT t.tenant_id, 'bw3-stress-breathing-5', '불안을 다스리는 5가지 호흡법',
    '긴장되는 순간, 간단한 호흡법으로 마음을 가라앉힐 수 있습니다.',
    '불안은 누구나 경험하는 자연스러운 감정입니다. 하지만 그것이 일상을 방해할 때, 우리는 이를 관리하는 방법을 배워야 합니다.',
    'STRESS', '스트레스 관리', 3,
    JSON_ARRAY(
        JSON_OBJECT('title', '불안은 자연스러운 감정', 'body', '불안은 누구나 경험하는 자연스러운 감정입니다. 하지만 그것이 일상을 방해할 때, 우리는 이를 관리하는 방법을 배워야 합니다.'),
        JSON_OBJECT('title', '4-7-8 호흡법', 'body', '코로 4초 들이쉬고, 7초 참고, 8초 내쉽니다. 이 방법은 부교감 신경을 활성화하여 빠르게 긴장을 완화합니다.'),
        JSON_OBJECT('title', '복식호흡', 'body', '배에 손을 얹고 배가 부풀어 오르도록 깊이 호흡합니다. 가슴이 아닌 배로 호흡하면 더 깊은 이완이 됩니다.')
    ),
    1, 10, NOW(6), NOW(6), 0, 0
FROM tenants t
WHERE COALESCE(t.is_deleted, 0) = 0;

INSERT INTO psycho_education_articles (
    tenant_id, slug, title, summary, body, category, category_label, read_minutes, pages_json,
    is_published, sort_order, created_at, updated_at, is_deleted, version
)
SELECT t.tenant_id, 'bw3-stress-grounding-54321', '그라운딩 기법: 5-4-3-2-1',
    '지금 이 순간으로 돌아오는 감각 기반 안정화 기법입니다.',
    '패닉이나 강한 불안이 찾아올 때, 감각에 집중하면 "지금 여기"로 돌아올 수 있습니다.',
    'STRESS', '스트레스 관리', 3,
    JSON_ARRAY(
        JSON_OBJECT('title', '현재로 돌아오기', 'body', '패닉이나 강한 불안이 찾아올 때, 감각에 집중하면 "지금 여기"로 돌아올 수 있습니다.'),
        JSON_OBJECT('title', '5가지 보이는 것', 'body', '주변에서 보이는 것 5가지를 하나씩 소리 내어 말합니다. 색상, 모양, 크기를 구체적으로 관찰하세요.'),
        JSON_OBJECT('title', '4가지 촉감 + 3가지 소리', 'body', '만질 수 있는 것 4개의 질감을 느끼고, 들리는 소리 3개에 귀를 기울입니다.')
    ),
    1, 20, NOW(6), NOW(6), 0, 0
FROM tenants t
WHERE COALESCE(t.is_deleted, 0) = 0;
