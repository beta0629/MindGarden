-- blog_posts 테이블의 content 필드를 TEXT에서 MEDIUMTEXT로 변경
-- base64 이미지가 포함된 content를 저장하기 위해 필요

USE core_solution;

-- blog_posts 테이블이 존재하는지 확인 후 content 필드 타입 변경
ALTER TABLE blog_posts MODIFY COLUMN content MEDIUMTEXT NOT NULL;

-- popups 테이블의 content 필드도 MEDIUMTEXT로 변경 (base64 이미지 지원)
ALTER TABLE popups MODIFY COLUMN content MEDIUMTEXT;

-- banners 테이블의 content 필드도 MEDIUMTEXT로 변경 (base64 이미지 지원)
ALTER TABLE banners MODIFY COLUMN content MEDIUMTEXT;
