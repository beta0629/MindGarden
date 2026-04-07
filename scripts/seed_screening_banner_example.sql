-- 예시: 관리자 배너 테이블에 /screening 허브용 이미지 배너 1건 추가
-- 운영 DB에 직접 실행 전 백업·중복(title·기간) 확인 필요.
-- 이미지 URL은 관리자 업로드 경로로 교체하거나 `/assets/images/programs/adhd-testing.png` 등 공개 정적 경로 사용.

USE mindgarden_homepage;

INSERT INTO banners (
  title,
  content,
  image_url,
  link_url,
  start_datetime,
  end_datetime,
  is_active,
  priority
) VALUES (
  '주제별 간이 체크리스트(PTSD·경계선 성격·학교·직장·중독 등)',
  '',
  '/assets/images/programs/adhd-testing.png',
  '/screening',
  '2026-01-01 00:00:00',
  '2030-12-31 23:59:59',
  TRUE,
  10
);
