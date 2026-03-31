-- 역할 템플릿에 기본 위젯 설정 추가 (메타 시스템)
-- 관리자 생성 시 기본 위젯을 DB 메타데이터에서 자동으로 가져오도록 개선
-- 재실행·부분 적용: default_widgets_json 컬럼이 이미 있으면 ADD 스킵 (V43와 동일 패턴)

SET @dbname = DATABASE();

-- 1. role_templates.default_widgets_json 추가 (없을 때만)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'role_templates' AND COLUMN_NAME = 'default_widgets_json') > 0,
    'SELECT 1',
    'ALTER TABLE role_templates ADD COLUMN default_widgets_json JSON NULL COMMENT ''역할별 기본 위젯 설정 (JSON)'''
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 기존 역할 템플릿에 기본 위젯 설정 추가
UPDATE role_templates
SET default_widgets_json = JSON_OBJECT(
    'version', '1.0',
    'layout', JSON_OBJECT(
        'type', 'grid',
        'columns', 3,
        'gap', 'md',
        'responsive', true
    ),
    'widgets', JSON_ARRAY(
        JSON_OBJECT(
            'type', 'welcome',
            'position', JSON_OBJECT('row', 0, 'col', 0, 'span', 3),
            'config', JSON_OBJECT('title', '환영합니다')
        ),
        JSON_OBJECT(
            'type', 'summary-statistics',
            'position', JSON_OBJECT('row', 1, 'col', 0, 'span', 3),
            'config', JSON_OBJECT('title', '통계 요약')
        ),
        JSON_OBJECT(
            'type', 'activity-list',
            'position', JSON_OBJECT('row', 2, 'col', 0, 'span', 3),
            'config', JSON_OBJECT('title', '최근 활동')
        )
    )
)
WHERE is_admin_role = TRUE
  AND (template_code LIKE '%ADMIN%' OR template_code LIKE '%관리자%');

-- 3. 학생 역할 템플릿 기본 위젯 설정
UPDATE role_templates
SET default_widgets_json = JSON_OBJECT(
    'version', '1.0',
    'layout', JSON_OBJECT(
        'type', 'grid',
        'columns', 3,
        'gap', 'md',
        'responsive', true
    ),
    'widgets', JSON_ARRAY(
        JSON_OBJECT(
            'type', 'schedule',
            'position', JSON_OBJECT('row', 0, 'col', 0, 'span', 2),
            'config', JSON_OBJECT('title', '내 일정')
        ),
        JSON_OBJECT(
            'type', 'notification',
            'position', JSON_OBJECT('row', 0, 'col', 2, 'span', 1),
            'config', JSON_OBJECT('title', '알림')
        )
    )
)
WHERE template_code LIKE '%STUDENT%' OR template_code LIKE '%학생%';

-- 4. 선생님 역할 템플릿 기본 위젯 설정
UPDATE role_templates
SET default_widgets_json = JSON_OBJECT(
    'version', '1.0',
    'layout', JSON_OBJECT(
        'type', 'grid',
        'columns', 3,
        'gap', 'md',
        'responsive', true
    ),
    'widgets', JSON_ARRAY(
        JSON_OBJECT(
            'type', 'schedule',
            'position', JSON_OBJECT('row', 0, 'col', 0, 'span', 2),
            'config', JSON_OBJECT('title', '일정')
        ),
        JSON_OBJECT(
            'type', 'summary-statistics',
            'position', JSON_OBJECT('row', 0, 'col', 2, 'span', 1),
            'config', JSON_OBJECT('title', '통계')
        )
    )
)
WHERE template_code LIKE '%TEACHER%' OR template_code LIKE '%선생님%' OR template_code LIKE '%교사%';

-- 5. 기본 위젯 설정 (기타 역할)
UPDATE role_templates
SET default_widgets_json = JSON_OBJECT(
    'version', '1.0',
    'layout', JSON_OBJECT(
        'type', 'grid',
        'columns', 3,
        'gap', 'md',
        'responsive', true
    ),
    'widgets', JSON_ARRAY(
        JSON_OBJECT(
            'type', 'welcome',
            'position', JSON_OBJECT('row', 0, 'col', 0, 'span', 2),
            'config', JSON_OBJECT('title', '환영합니다')
        ),
        JSON_OBJECT(
            'type', 'summary-statistics',
            'position', JSON_OBJECT('row', 0, 'col', 2, 'span', 1),
            'config', JSON_OBJECT('title', '통계')
        )
    )
)
WHERE default_widgets_json IS NULL;
