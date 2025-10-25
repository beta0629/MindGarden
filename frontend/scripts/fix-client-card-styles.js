const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/ClientCard.js');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 인라인 스타일을 CSS 클래스로 변환
const replacements = [
    // 메인 카드 컨테이너
    {
        from: `style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px'
            }}`,
        to: `className={\`mg-v2-client-card \${isSelected ? 'mg-v2-client-card-selected' : ''}\`}`
    },
    // 카드 헤더
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '12px' }}`,
        to: 'className="mg-v2-client-card-header"'
    },
    // 아바타
    {
        from: `style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    flexShrink: 0
                }}`,
        to: 'className="mg-v2-client-avatar"'
    },
    // 클라이언트 정보
    {
        from: `style={{ flex: 1 }}`,
        to: 'className="mg-v2-client-info"'
    },
    // 클라이언트 이름
    {
        from: `style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#1f2937'
                    }}`,
        to: 'className="mg-v2-client-name"'
    },
    // 연락처 정보
    {
        from: `style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: '1.4' }}`,
        to: 'className="mg-v2-client-contact"'
    },
    // 연락처 아이템
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}`,
        to: 'className="mg-v2-contact-item mg-v2-contact-item-email"'
    },
    // 전화번호 아이템
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '6px' }}`,
        to: 'className="mg-v2-contact-item mg-v2-contact-item-phone"'
    },
    // 선택 아이콘
    {
        from: `style={{
                        color: '#10b981',
                        fontSize: '20px'
                    }}`,
        to: 'className="mg-v2-client-selected-icon"'
    },
    // 카드 푸터
    {
        from: `style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid #f3f4f6',
                fontSize: '14px',
                color: '#6B6B6B'
            }}`,
        to: 'className="mg-v2-client-card-footer"'
    },
    // 푸터 아이템들
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}`,
        to: 'className="mg-v2-footer-item mg-v2-footer-item-mapping"'
    },
    // 활성 매핑 아이템
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}`,
        to: 'className="mg-v2-footer-item mg-v2-footer-item-active"'
    },
    // 가입일 아이템
    {
        from: `style={{ display: 'flex', alignItems: 'center', gap: '6px' }}`,
        to: 'className="mg-v2-footer-item mg-v2-footer-item-registration"'
    }
];

// 각 교체 작업 수행
replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// 파일 쓰기
fs.writeFileSync(filePath, content, 'utf8');

console.log('ClientCard.js 인라인 스타일 변환 완료');
