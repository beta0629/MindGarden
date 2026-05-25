-- =============================================================================
-- WELLNESS_TEMPLATES — 회전 풀 8종 시드 (B3 핫픽스, 2026-05-25)
-- 진단: docs/project-management/2026-05-25/PROD_LOG_DIAGNOSIS_2026_05_25.md §7
-- 디자이너 핸드오프: docs/project-management/2026-05-25/WELLNESS_ROTATION_POOL_8_COPY_HANDOFF.md §3
--
-- 결함 B3 요약:
--   • wellness_templates 의 day_of_week × season 키 분포가 1~2 행에 그쳐 사용자가
--     매일 동일 본문(💚 마음 건강을 위한 시간 / 호흡 팁)을 노출 받음.
--   • findUnusedTemplatesByConditions 회전 로직이 빈 풀로 인해 무력화되고
--     AI 호출 실패 fallback 으로 정적 1종이 매일 반환됨.
--
-- 처리 방향:
--   • 핸드오프 §3 의 8가지 테마(호흡휴식 / 시작목표 / 산책자연 / 감사일기 /
--     마음기록 / 사람연결 / 자기격려 / 명상고요)를 day_of_week=0~7 + season
--     (SPRING/SUMMER/FALL/WINTER) 32 행으로 시드.
--   • day_of_week 매핑 (ISO `java.time.DayOfWeek.getValue()` 기준):
--       0 = Default/특별, 1 = 월, 2 = 화, 3 = 수, 4 = 목, 5 = 금, 6 = 토, 7 = 일.
--     스케줄러는 1~7 만 조회하지만 풀 인덱스 일관성 위해 0 도 포함한다.
--   • 본문은 핸드오프 §3 HTML 구조 (h3 + p + ul/li + 마무리 격언) 그대로 사용.
--   • tenant_id = NULL (전역/코어 row) — 회전 풀은 테넌트 비종속 정적 컨텐츠.
--     기존 common_codes 시드 (V20260528_001 / V20260331_002) 와 동일 패턴.
--
-- 멱등성:
--   • INSERT ... SELECT ... WHERE NOT EXISTS — created_by 마커로 재실행 차단.
--   • 마커: `ROTATION_POOL_SEED_V20260529_002`
--   • 재실행 시 행 수 변화 없음.
--
-- 보존 사항:
--   • 기존 운영 행 (3일치 동일 본문, id=4/5/12/14 등) 그대로 보존.
--     이번 마이그레이션은 신규 8 × 4 = 32 행만 추가하며, 중복 정리는 별도 합의.
--   • 솔라피 V20260528_003 미적용 보존 — Flyway 슬롯 충돌 없음.
--   • N3 마이그레이션 (`V20260529_001`) 슬롯과 충돌 회피 — 본 PR 은 `V20260529_002`.
--
-- 검증 쿼리:
--   SELECT day_of_week, season, COUNT(*) FROM wellness_templates
--    WHERE created_by = 'ROTATION_POOL_SEED_V20260529_002'
--    GROUP BY day_of_week, season ORDER BY season, day_of_week;
--   -- 기대: 4 계절 × 8 day_of_week = 32 행, 각 1건.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- index 0 : day_of_week=0 (Default/특별) — 호흡과 휴식 (🍃)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>🍃 마음 건강을 위한 시간</h3>',
        '<p>바쁘게 달려온 일주일, 오늘은 온전히 나를 위해 쉬어가는 날입니다. 편안한 자세로 앉아 깊게 숨을 들이마시고 내쉬며, 몸과 마음의 긴장을 부드럽게 풀어주세요.</p>',
        '<ul>',
        '<li>🌬️ 눈을 감고 3번 깊게 심호흡하기</li>',
        '<li>☕ 따뜻한 차 한 잔 마시며 여유 가지기</li>',
        '<li>🛋️ 가장 편안한 공간에서 10분간 아무것도 하지 않기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 충분한 휴식은 내일을 위한 가장 좋은 준비입니다.</p>'
    ),
    0, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 0
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 1 : day_of_week=1 (월요일) — 한 주 시작, 작은 목표 (☀️)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>☀️ 새로운 한 주를 여는 마음</h3>',
        '<p>새로운 한 주가 시작되었습니다. 완벽해야 한다는 부담감은 잠시 내려놓고, 오늘 하루 내가 할 수 있는 아주 작은 목표 하나에만 다정하게 집중해 보는 건 어떨까요?</p>',
        '<ul>',
        '<li>📝 오늘 실천할 수 있는 가장 작은 목표 1개 적어보기</li>',
        '<li>💪 아침에 일어나서 가볍게 기지개 켜기</li>',
        '<li>😊 거울 속 나에게 다정한 미소 지어주기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 작은 발걸음이 모여 당신의 아름다운 여정이 됩니다.</p>'
    ),
    1, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 1
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 2 : day_of_week=2 (화요일) — 산책과 자연 (🌱)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>🌱 자연이 주는 위로</h3>',
        '<p>실내에만 머물다 보면 마음도 답답해지기 쉽습니다. 잠시 밖으로 나가 뺨에 닿는 바람을 느끼고, 주변의 나무와 하늘을 바라보며 자연의 에너지를 채워보세요.</p>',
        '<ul>',
        '<li>🚶 점심시간이나 퇴근 후 15분 동안 가볍게 걷기</li>',
        '<li>☁️ 잠시 멈춰서 오늘의 하늘 올려다보기</li>',
        '<li>🌿 길가의 작은 풀꽃이나 나무 관찰하기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 자연은 언제나 당신을 말없이 품어줍니다.</p>'
    ),
    2, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 2
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 3 : day_of_week=3 (수요일) — 감사일기, 오늘의 작은 기쁨 (🌸)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>🌸 일상을 밝히는 감사의 힘</h3>',
        '<p>한 주의 중간, 지치기 쉬운 수요일입니다. 당연하게 여겼던 일상 속에서 작고 소소한 기쁨을 찾아보세요. 감사의 마음은 우리 내면을 단단하고 따뜻하게 만들어줍니다.</p>',
        '<ul>',
        '<li>📖 오늘 하루 감사했던 일 3가지 기록해보기</li>',
        '<li>🍽️ 맛있는 식사나 간식에 온전히 집중하며 음미하기</li>',
        '<li>💝 나에게 도움을 준 사람에게 고마움 표현하기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 행복은 크기가 아니라 발견하는 횟수에 있습니다.</p>'
    ),
    3, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 3
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 4 : day_of_week=4 (목요일) — 마음 기록, 감정 인정 (🌊)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>🌊 내 감정과 마주하기</h3>',
        '<p>마음속에 일어나는 파도를 억누르려 하지 말고 가만히 바라봐주세요. 기쁨, 슬픔, 불안, 분노 모두 당신의 소중한 일부입니다. 있는 그대로의 감정을 인정해주는 시간이 필요합니다.</p>',
        '<ul>',
        '<li>✍️ 지금 느끼는 감정을 솔직하게 단어로 적어보기</li>',
        '<li>🫂 ''그럴 수 있어''라고 내 마음 다독여주기</li>',
        '<li>🎵 현재 내 감정과 어울리는 음악 한 곡 듣기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 모든 감정은 흘러가는 구름처럼 자연스러운 것입니다.</p>'
    ),
    4, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 4
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 5 : day_of_week=5 (금요일) — 사람과 연결, 안부 묻기 (✨)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>✨ 따뜻한 마음 나누기</h3>',
        '<p>우리는 누군가와 연결되어 있다고 느낄 때 큰 위안을 얻습니다. 바쁜 일상 속에서 잠시 잊고 지냈던 소중한 사람에게 먼저 다가가 따뜻한 안부를 건네보는 건 어떨까요?</p>',
        '<ul>',
        '<li>📱 생각나는 사람에게 짧은 안부 메시지 보내기</li>',
        '<li>🗣️ 주변 사람에게 진심 어린 칭찬 한 마디 건네기</li>',
        '<li>🍵 누군가와 함께 차 한 잔 마시며 대화 나누기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 진심이 담긴 작은 인사가 누군가의 하루를 구원할 수 있습니다.</p>'
    ),
    5, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 5
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 6 : day_of_week=6 (토요일) — 자기 격려, 칭찬 한 마디 (💚)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>💚 나를 사랑하는 시간</h3>',
        '<p>치열하게 한 주를 살아낸 당신, 정말 고생 많으셨습니다. 타인에게는 관대하면서 나에게는 엄격하지 않았나요? 오늘은 나 자신을 가장 친한 친구처럼 다정하게 안아주세요.</p>',
        '<ul>',
        '<li>🏆 이번 주 내가 잘해낸 일 한 가지 찾아 칭찬하기</li>',
        '<li>🎁 나를 위한 작고 기분 좋은 보상 준비하기</li>',
        '<li>🛁 따뜻한 물로 샤워하며 몸의 피로 씻어내기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 당신은 이미 충분히 잘하고 있고, 사랑받을 자격이 있습니다.</p>'
    ),
    6, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 6
      AND w.season = season_seed.season_code
);

-- -----------------------------------------------------------------------------
-- index 7 : day_of_week=7 (일요일/대체) — 명상과 고요 (🌙)
-- -----------------------------------------------------------------------------
INSERT INTO wellness_templates (
    tenant_id, title, content, day_of_week, season, category,
    is_active, is_important, usage_count, last_used_at,
    created_at, updated_at, created_by
)
SELECT
    NULL, '오늘의 마음 건강 팁',
    CONCAT(
        '<h3>🌙 내면의 고요함 찾기</h3>',
        '<p>외부의 소음과 자극에서 잠시 벗어나, 내 안의 고요한 공간으로 들어가 보세요. 아무런 판단 없이 그저 지금 이 순간에 머무르는 것만으로도 마음은 평온을 되찾습니다.</p>',
        '<ul>',
        '<li>🧘 조용한 곳에서 5분 동안 눈 감고 명상하기</li>',
        '<li>📵 잠들기 전 30분 동안 스마트폰 멀리하기</li>',
        '<li>🕯️ 은은한 조명 아래서 차분한 시간 보내기</li>',
        '</ul>',
        '<p><strong>기억하세요:</strong> 고요함 속에서 당신의 진짜 목소리를 들을 수 있습니다.</p>'
    ),
    7, season_seed.season_code, 'GENERAL',
    TRUE, FALSE, 0, NULL,
    NOW(), NOW(), 'ROTATION_POOL_SEED_V20260529_002'
FROM (
    SELECT 'SPRING' AS season_code UNION ALL
    SELECT 'SUMMER' UNION ALL
    SELECT 'FALL' UNION ALL
    SELECT 'WINTER'
) AS season_seed
WHERE NOT EXISTS (
    SELECT 1 FROM wellness_templates w
    WHERE w.created_by = 'ROTATION_POOL_SEED_V20260529_002'
      AND w.day_of_week = 7
      AND w.season = season_seed.season_code
);
