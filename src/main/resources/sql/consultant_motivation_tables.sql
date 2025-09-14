-- 상담사 동기부여 시스템 테이블 생성
-- 상담사들의 힘든 업무에 힘이 되는 유머와 격려 메시지를 제공

-- 1. 오늘의 유머 테이블
CREATE TABLE IF NOT EXISTS daily_humor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL COMMENT '유머 내용',
    category VARCHAR(50) NOT NULL COMMENT '유머 카테고리 (WORK, LIFE, GENERAL)',
    consultant_role VARCHAR(50) COMMENT '특정 역할 대상 (NULL이면 전체)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_role (consultant_role),
    INDEX idx_active (is_active)
) COMMENT = '오늘의 유머';

-- 2. 따뜻한 말 한마디 테이블
CREATE TABLE IF NOT EXISTS warm_words (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL COMMENT '격려 메시지 내용',
    category VARCHAR(50) NOT NULL COMMENT '메시지 카테고리 (ENCOURAGEMENT, APPRECIATION, SUPPORT)',
    consultant_role VARCHAR(50) COMMENT '특정 역할 대상 (NULL이면 전체)',
    mood_type VARCHAR(50) COMMENT '기분 상태 (STRESSED, TIRED, OVERWHELMED, SUCCESS)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_role (consultant_role),
    INDEX idx_mood (mood_type),
    INDEX idx_active (is_active)
) COMMENT = '따뜻한 말 한마디';

-- 3. 상담사 기분 상태 추적 테이블
CREATE TABLE IF NOT EXISTS consultant_mood_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultant_id BIGINT NOT NULL COMMENT '상담사 ID',
    mood_type VARCHAR(50) NOT NULL COMMENT '기분 상태',
    stress_level INT DEFAULT 0 COMMENT '스트레스 레벨 (1-10)',
    workload_level INT DEFAULT 0 COMMENT '업무량 레벨 (1-10)',
    satisfaction_level INT DEFAULT 0 COMMENT '만족도 레벨 (1-10)',
    note TEXT COMMENT '추가 메모',
    recorded_date DATE NOT NULL COMMENT '기록 날짜',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_consultant (consultant_id),
    INDEX idx_date (recorded_date),
    UNIQUE KEY uk_consultant_date (consultant_id, recorded_date)
) COMMENT = '상담사 기분 상태 추적';

-- 샘플 데이터 삽입

-- 오늘의 유머 샘플 데이터
INSERT INTO daily_humor (content, category, consultant_role) VALUES
('상담사: "오늘은 어떤 기분이세요?"\n내담자: "좋지 않아요..."\n상담사: "그럼 좋지 않은 기분을 자세히 말씀해주세요."\n내담자: "상담사님이 너무 예뻐서 집중이 안 돼요."\n상담사: "...그럼 오늘은 여기까지 하겠습니다."', 'WORK', 'CONSULTANT'),
('상담사가 가장 많이 듣는 말 TOP 3:\n1. "상담사님은 항상 차분하시네요."\n2. "상담사님은 이해심이 많으시네요."\n3. "상담사님은 진짜 상담사 맞나요?"', 'WORK', 'CONSULTANT'),
('상담사: "우울할 때는 밝은 곳에 나가보세요."\n내담자: "상담사님 얼굴만 봐도 충분히 밝아져요!"\n상담사: "그럼 제가 조명을 끄고 상담하겠습니다."', 'WORK', 'CONSULTANT'),
('상담사 생활의 현실:\n- 아침: "오늘은 힘든 내담자 없이 평화로운 하루가 되길..."\n- 오후: "아, 오늘도 힘든 하루구나..."\n- 저녁: "내일은 더 좋은 하루가 될 거야..."', 'LIFE', 'CONSULTANT'),
('상담사가 가장 두려워하는 것:\n1. "상담사님도 힘드시죠?"\n2. "상담사님은 상담받으시나요?"\n3. "상담사님은 완벽하시네요."', 'LIFE', 'CONSULTANT'),

-- 내담자용 유머
('내담자가 가장 많이 하는 말 TOP 3:\n1. "상담사님은 이해하실 것 같아요."\n2. "이런 말씀 드려도 될까요?"\n3. "상담사님은 정말 신기해요."', 'WORK', 'CLIENT'),
('상담 첫날 내담자: "상담사님은 정말 신기해요."\n상담사: "어떤 점이 신기하신가요?"\n내담자: "제 마음을 다 알고 계시네요!"\n상담사: "저는 그냥 듣고 있을 뿐인데요..."', 'WORK', 'CLIENT'),
('내담자: "상담을 받으니까 마음이 편해져요."\n상담사: "그렇다니 다행이에요."\n내담자: "그런데 집에 가면 또 힘들어져요."\n상담사: "그럴 때마다 생각해보세요..."\n내담자: "생각하면 더 힘들어져요."', 'LIFE', 'CLIENT'),
('상담 받는 내담자의 마음:\n- 상담실 입장 전: "오늘은 진짜 열심히 해야지!"\n- 상담 중: "아, 또 울고 말았네..."\n- 상담 후: "역시 상담은 힘들어..."', 'LIFE', 'CLIENT'),
('내담자가 가장 두려워하는 것:\n1. "상담사님이 실망하실까봐..."\n2. "내 문제가 너무 사소할까봐..."\n3. "상담사님도 힘드실까봐..."', 'LIFE', 'CLIENT');

-- 따뜻한 말 한마디 샘플 데이터
INSERT INTO warm_words (content, category, consultant_role, mood_type) VALUES
('오늘도 힘든 마음들을 들어주느라 고생하셨어요. 당신의 따뜻한 마음이 많은 사람들에게 힘이 되고 있어요.', 'APPRECIATION', 'CONSULTANT', NULL),
('상담사님의 작은 한마디가 누군가에게는 큰 위로가 됩니다. 오늘도 소중한 일을 하고 계세요.', 'ENCOURAGEMENT', 'CONSULTANT', NULL),
('힘든 상담이 있어도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.', 'SUPPORT', 'CONSULTANT', 'STRESSED'),
('오늘 하루도 열심히 일한 당신에게 박수를 보냅니다. 당신의 노력이 세상을 더 따뜻하게 만들어요.', 'APPRECIATION', 'CONSULTANT', 'TIRED'),
('상담사님 덕분에 많은 사람들이 희망을 찾고 있어요. 당신은 정말 소중한 존재입니다.', 'SUPPORT', 'CONSULTANT', 'OVERWHELMED'),
('오늘도 따뜻한 마음으로 내담자들을 도와주셔서 감사해요. 당신의 선한 마음이 세상을 밝게 해요.', 'APPRECIATION', 'CONSULTANT', 'SUCCESS'),
('힘든 하루였을 수도 있지만, 당신이 한 번의 상담으로도 누군가의 인생을 바꿀 수 있어요.', 'ENCOURAGEMENT', 'CONSULTANT', 'STRESSED'),
('상담사님의 인내심과 이해심이 많은 사람들에게 희망을 주고 있어요. 당신은 정말 대단해요.', 'SUPPORT', 'CONSULTANT', 'TIRED'),
('오늘도 마음의 상처를 치유하는 소중한 일을 하고 계시는군요. 당신의 따뜻함에 감사합니다.', 'APPRECIATION', 'CONSULTANT', NULL),
('힘든 순간에도 포기하지 않는 당신의 모습이 정말 아름다워요. 당신은 훌륭한 상담사입니다.', 'ENCOURAGEMENT', 'CONSULTANT', 'OVERWHELMED');

-- 관리자용 따뜻한 말
INSERT INTO warm_words (content, category, consultant_role, mood_type) VALUES
('관리자로서 시스템을 잘 운영하고 계시는군요. 당신의 노고 덕분에 상담사들이 더 좋은 환경에서 일할 수 있어요.', 'APPRECIATION', 'ADMIN', NULL),
('복잡한 관리 업무를 차근차근 처리하시는 모습이 정말 대단해요. 당신의 세심함이 팀 전체의 힘이 됩니다.', 'ENCOURAGEMENT', 'ADMIN', 'STRESSED'),
('관리자님 덕분에 시스템이 안정적으로 운영되고 있어요. 당신의 전문성이 팀의 든든한 버팀목입니다.', 'SUPPORT', 'ADMIN', 'TIRED');

-- 지점 수퍼어드민용 따뜻한 말
INSERT INTO warm_words (content, category, consultant_role, mood_type) VALUES
('지점 운영을 위해 고생하시는 모습이 정말 멋져요. 당신의 리더십이 지점의 발전을 이끌고 있어요.', 'APPRECIATION', 'BRANCH_SUPER_ADMIN', NULL),
('복잡한 지점 관리 업무를 해결하시는 모습이 정말 대단해요. 당신의 판단력이 팀의 성공을 만들어가고 있어요.', 'ENCOURAGEMENT', 'BRANCH_SUPER_ADMIN', 'STRESSED'),
('지점 수퍼어드민님 덕분에 지점이 안정적으로 운영되고 있어요. 당신의 헌신이 지점의 미래를 밝게 해요.', 'SUPPORT', 'BRANCH_SUPER_ADMIN', 'TIRED');

-- 내담자용 따뜻한 말
INSERT INTO warm_words (content, category, consultant_role, mood_type) VALUES
('오늘도 마음을 열고 상담에 참여해주셔서 감사해요. 당신의 용기가 정말 대단해요.', 'APPRECIATION', 'CLIENT', NULL),
('힘든 마음을 털어놓아주셔서 고맙습니다. 당신의 솔직함이 치유의 첫걸음이에요.', 'ENCOURAGEMENT', 'CLIENT', 'STRESSED'),
('상담을 받으시느라 고생하셨어요. 당신의 노력이 분명 좋은 결과로 이어질 거예요.', 'SUPPORT', 'CLIENT', 'TIRED'),
('마음의 변화를 위해 노력하는 당신의 모습이 정말 아름다워요. 당신은 충분히 소중한 사람입니다.', 'ENCOURAGEMENT', 'CLIENT', 'OVERWHELMED'),
('상담을 통해 조금씩 나아가고 있는 당신이 자랑스러워요. 작은 변화도 큰 의미가 있어요.', 'APPRECIATION', 'CLIENT', 'SUCCESS'),
('힘든 순간에도 포기하지 않는 당신의 의지력이 정말 대단해요. 당신은 강한 사람이에요.', 'SUPPORT', 'CLIENT', 'STRESSED'),
('자신을 돌아보고 변화하려는 마음이 정말 고귀해요. 당신의 진심이 느껴져요.', 'ENCOURAGEMENT', 'CLIENT', 'TIRED'),
('마음의 상처를 치유하려는 용기가 정말 멋져요. 당신의 용기가 많은 사람들에게 힘이 될 거예요.', 'APPRECIATION', 'CLIENT', 'OVERWHELMED'),
('오늘도 마음을 열어주셔서 고맙습니다. 당신의 신뢰가 상담을 더 의미 있게 만들어요.', 'SUPPORT', 'CLIENT', NULL),
('자신을 돌아보고 성장하려는 마음이 정말 아름다워요. 당신은 이미 훌륭한 사람입니다.', 'ENCOURAGEMENT', 'CLIENT', 'SUCCESS');
