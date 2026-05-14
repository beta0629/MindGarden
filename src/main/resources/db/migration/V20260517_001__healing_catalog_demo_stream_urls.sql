-- BW-3: 힐링 카탈로그 시드 중 스트림이 비어 있던 행에 공개 스트림 URL 설정.
--
-- 음원: Wikimedia Commons transcoded MP3 (Kevin MacLeod, CC BY 3.0).
-- 앱·웹에서 재생 시 저작자 표기: "Kevin MacLeod (incompetech.com)" 및
-- https://creativecommons.org/licenses/by/3.0/
--
-- @author MindGarden
-- @since 2026-05-17

UPDATE healing_content_catalog_items
SET
    content_url = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/67/Kevin_MacLeod_-_01_-_Meditation_Impromptu_01.ogg/Kevin_MacLeod_-_01_-_Meditation_Impromptu_01.ogg.mp3',
    duration_minutes = 4,
    updated_at = NOW(6)
WHERE is_deleted = 0
  AND UPPER(TRIM(media_type)) = 'MEDITATION'
  AND code = 'bw3-relax-meditation'
  AND (content_url IS NULL OR TRIM(content_url) = '');

UPDATE healing_content_catalog_items
SET
    content_url = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/58/Kevin_MacLeod_-_Carefree.ogg/Kevin_MacLeod_-_Carefree.ogg.mp3',
    duration_minutes = 4,
    updated_at = NOW(6)
WHERE is_deleted = 0
  AND UPPER(TRIM(media_type)) = 'AUDIO'
  AND code = 'bw3-focus-ambient'
  AND (content_url IS NULL OR TRIM(content_url) = '');
