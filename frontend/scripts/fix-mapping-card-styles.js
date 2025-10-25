const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/mapping/MappingCard.js');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 인라인 스타일을 CSS 클래스로 변환
const replacements = [
    // 메인 컨테이너
    {
        from: `style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0',
            margin: 'var(--spacing-sm)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column'
        }}`,
        to: 'className="mg-v2-mapping-card"'
    },
    // 헤더
    {
        from: `style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(139, 69, 19, 0.1)'
            }}`,
        to: 'className="mg-v2-mapping-card-header"'
    },
    // 헤더 왼쪽
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}`,
        to: 'className="mg-v2-mapping-card-header-left"'
    },
    // 상태 배지
    {
        from: `style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        backgroundColor: getStatusColor(mapping.status),
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}`,
        to: 'className="mg-v2-mapping-status-badge"'
    },
    // ERP 통합 배지
    {
        from: `style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            backgroundColor: 'var(--color-success)',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}`,
        to: 'className="mg-v2-mapping-erp-badge"'
    },
    // 바디
    {
        from: `style={{ padding: 'var(--spacing-md)', flex: 1 }}`,
        to: 'className="mg-v2-mapping-card-body"'
    },
    // 참여자 섹션
    {
        from: `style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}`,
        to: 'className="mg-v2-mapping-participants"'
    },
    // 참여자 아이템
    {
        from: `style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}`,
        to: 'className="mg-v2-mapping-participant"'
    },
    // 아이콘
    {
        from: `style={{ color: 'var(--olive-green)', flexShrink: 0 }}`,
        to: 'className="mg-v2-mapping-icon"'
    },
    // 참여자 정보
    {
        from: `style={{ minWidth: 0 }}`,
        to: 'className="mg-v2-mapping-participant-info"'
    },
    // 참여자 라벨
    {
        from: `style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}`,
        to: 'className="mg-v2-mapping-participant-label"'
    },
    // 참여자 이름
    {
        from: `style={{ fontSize: 'var(--font-size-sm)', color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word' }}`,
        to: 'className="mg-v2-mapping-participant-name"'
    },
    // 패키지 섹션
    {
        from: `style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}`,
        to: 'className="mg-v2-mapping-package-section"'
    },
    // 패키지 아이템
    {
        from: `style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}`,
        to: 'className="mg-v2-mapping-package-item"'
    },
    // 패키지 정보
    {
        from: `style={{ minWidth: 0 }}`,
        to: 'className="mg-v2-mapping-package-info"'
    },
    // 패키지 라벨
    {
        from: `style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}`,
        to: 'className="mg-v2-mapping-package-label"'
    },
    // 패키지 이름
    {
        from: `style={{ fontSize: 'var(--font-size-sm)', color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}`,
        to: 'className="mg-v2-mapping-package-name"'
    },
    // 금액
    {
        from: `style={{ fontSize: 'var(--font-size-sm)', color: 'var(--olive-green)', fontWeight: 'var(--font-weight-bold)' }}`,
        to: 'className="mg-v2-mapping-amount"'
    },
    // 날짜 섹션
    {
        from: `style={{ 
                    borderTop: '1px solid rgba(139, 69, 19, 0.1)', 
                    paddingTop: 'var(--spacing-sm)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)'
                }}`,
        to: 'className="mg-v2-mapping-dates"'
    },
    // 날짜 아이템
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}`,
        to: 'className="mg-v2-mapping-date-item"'
    },
    // 날짜 아이콘
    {
        from: `style={{ color: 'var(--medium-gray)' }}`,
        to: 'className="mg-v2-mapping-date-icon"'
    },
    // 날짜 라벨
    {
        from: `style={{ color: 'var(--medium-gray)', fontWeight: 'var(--font-weight-medium)' }}`,
        to: 'className="mg-v2-mapping-date-label"'
    },
    // 날짜 값
    {
        from: `style={{ color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}`,
        to: 'className="mg-v2-mapping-date-value"'
    },
    // 승인 아이콘
    {
        from: `style={{ color: 'var(--color-success)' }}`,
        to: 'className="mg-v2-mapping-approval-icon"'
    },
    // 푸터
    {
        from: `style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.2)',
                borderTop: '1px solid rgba(139, 69, 19, 0.1)',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap'
            }}`,
        to: 'className="mg-v2-mapping-card-footer"'
    },
    // 푸터 왼쪽
    {
        from: `style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}`,
        to: 'className="mg-v2-mapping-card-footer-left"'
    }
];

// 각 교체 작업 수행
replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// 파일 쓰기
fs.writeFileSync(filePath, content, 'utf8');

console.log('MappingCard.js 인라인 스타일 변환 완료');
