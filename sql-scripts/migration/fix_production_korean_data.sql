-- 운영 환경 한글 데이터 수정 스크립트
-- UTF-8 인코딩으로 저장해야 함

-- 기존 CLIENT용 데이터 삭제
DELETE FROM daily_humor WHERE consultant_role = 'CLIENT';
DELETE FROM warm_words WHERE consultant_role = 'CLIENT';

-- 올바른 한글 daily_humor 데이터 삽입
INSERT INTO daily_humor (content, category, consultant_role, is_active, created_at, updated_at) VALUES
('내담자가 가장 많이 하는 말 TOP 3:\n1. "상담사님은 이해하실 것 같아요."\n2. "이런 말씀 드려도 될까요?"\n3. "상담사님은 정말 신기해요."', 'WORK', 'CLIENT', 1, NOW(), NOW()),
('상담 첫날 내담자: "상담사님은 정말 신기해요."\n상담사: "어떤 점이 신기하신가요?"\n내담자: "제 마음을 다 알고 계시네요!"\n상담사: "저는 그냥 듣고 있을 뿐인데요..."', 'WORK', 'CLIENT', 1, NOW(), NOW()),
('내담자: "상담을 받으니까 마음이 편해져요."\n상담사: "그렇다니 다행이에요."\n내담자: "그런데 집에 가면 또 힘들어져요."\n상담사: "그럴 때마다 생각해보세요..."\n내담자: "생각하면 더 힘들어져요."', 'LIFE', 'CLIENT', 1, NOW(), NOW()),
('상담 받는 내담자의 마음:\n- 상담실 입장 전: "오늘은 진짜 열심히 해야지!"\n- 상담 중: "아, 또 울고 말았네..."\n- 상담 후: "역시 상담은 힘들어..."', 'LIFE', 'CLIENT', 1, NOW(), NOW()),
('내담자가 가장 두려워하는 것:\n1. "상담사님이 실망하실까봐..."\n2. "내 문제가 너무 사소할까봐..."\n3. "상담사님도 힘드실까봐..."', 'LIFE', 'CLIENT', 1, NOW(), NOW()),
('상담을 통해 조금씩 나아가고 있는 당신이 자랑스러워요. 작은 변화도 큰 의미가 있어요.', 'GENERAL', 'CLIENT', 1, NOW(), NOW()),
('힘든 순간에도 포기하지 않는 당신의 의지력이 정말 대단해요. 당신은 강한 사람이에요.', 'GENERAL', 'CLIENT', 1, NOW(), NOW()),
('자신을 돌아보고 변화하려는 마음이 정말 고귀해요. 당신의 진심이 느껴져요.', 'GENERAL', 'CLIENT', 1, NOW(), NOW());

-- 올바른 한글 warm_words 데이터 삽입
INSERT INTO warm_words (content, category, consultant_role, mood_type, is_active, created_at, updated_at) VALUES
('오늘도 마음을 열고 상담에 참여해주셔서 감사해요. 당신의 용기가 정말 대단해요.', 'APPRECIATION', 'CLIENT', NULL, 1, NOW(), NOW()),
('힘든 마음을 털어놓아주셔서 고맙습니다. 당신의 솔직함이 치유의 첫걸음이에요.', 'ENCOURAGEMENT', 'CLIENT', 'STRESSED', 1, NOW(), NOW()),
('상담을 받으시느라 고생하셨어요. 당신의 노력이 분명 좋은 결과로 이어질 거예요.', 'SUPPORT', 'CLIENT', 'TIRED', 1, NOW(), NOW()),
('마음의 변화를 위해 노력하는 당신의 모습이 정말 아름다워요. 당신은 충분히 소중한 사람입니다.', 'ENCOURAGEMENT', 'CLIENT', 'OVERWHELMED', 1, NOW(), NOW()),
('상담을 통해 조금씩 나아가고 있는 당신이 자랑스러워요. 작은 변화도 큰 의미가 있어요.', 'APPRECIATION', 'CLIENT', 'SUCCESS', 1, NOW(), NOW()),
('힘든 순간에도 포기하지 않는 당신의 의지력이 정말 대단해요. 당신은 강한 사람이에요.', 'SUPPORT', 'CLIENT', 'STRESSED', 1, NOW(), NOW()),
('자신을 돌아보고 변화하려는 마음이 정말 고귀해요. 당신의 진심이 느껴져요.', 'ENCOURAGEMENT', 'CLIENT', 'TIRED', 1, NOW(), NOW()),
('마음의 상처를 치유하려는 용기가 정말 멋져요. 당신의 용기가 많은 사람들에게 힘이 될 거예요.', 'APPRECIATION', 'CLIENT', 'OVERWHELMED', 1, NOW(), NOW()),
('오늘도 마음을 열어주셔서 고맙습니다. 당신의 신뢰가 상담을 더 의미 있게 만들어요.', 'SUPPORT', 'CLIENT', NULL, 1, NOW(), NOW()),
('자신을 돌아보고 성장하려는 마음이 정말 아름다워요. 당신은 이미 훌륭한 사람입니다.', 'ENCOURAGEMENT', 'CLIENT', 'SUCCESS', 1, NOW(), NOW());

-- 데이터 확인
SELECT 'daily_humor CLIENT 데이터' as table_info, COUNT(*) as count FROM daily_humor WHERE consultant_role = 'CLIENT' AND is_active = 1
UNION ALL
SELECT 'warm_words CLIENT 데이터' as table_info, COUNT(*) as count FROM warm_words WHERE consultant_role = 'CLIENT' AND is_active = 1;
