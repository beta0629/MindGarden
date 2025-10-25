const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/ConsultationCompletionStats.js');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 인라인 스타일을 CSS 클래스로 변환
const replacements = [
    // 상담사 이름
    {
        from: `style={{
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '4px'
                                    }}`,
        to: 'className="mg-v2-consultant-name"'
    },
    // 상담사 ID
    {
        from: `style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: '#6c757d'
                                    }}`,
        to: 'className="mg-v2-consultant-id"'
    },
    // 등급 배지
    {
        from: `style={{
                                padding: '6px 12px',
                                backgroundColor: stat.grade ? '#e9ecef' : '#f8f9fa',
                                borderRadius: '20px',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '500',
                                color: '#6c757d'
                            }}`,
        to: 'className={`mg-v2-grade-badge ${stat.grade ? \'mg-v2-grade-badge-active\' : \'mg-v2-grade-badge-inactive\'}`}'
    },
    // 전문분야 섹션
    {
        from: `style={{
                            marginBottom: '16px'
                        }}`,
        to: 'className="mg-v2-specialty-section"'
    },
    // 전문분야 라벨
    {
        from: `style={{
                                fontSize: 'var(--font-size-xs)',
                                color: '#6c757d',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}`,
        to: 'className="mg-v2-specialty-label"'
    },
    // 전문분야 내용
    {
        from: `style={{
                                fontSize: 'var(--font-size-sm)',
                                color: '#495057',
                                lineHeight: '1.4'
                            }}`,
        to: 'className="mg-v2-specialty-content"'
    },
    // 통계 그리드
    {
        from: `style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                        }}`,
        to: 'className="mg-v2-stats-grid"'
    },
    // 통계 항목들
    {
        from: `style={{ textAlign: 'center' }}`,
        to: 'className="mg-v2-stat-item"'
    },
    // 완료 건수
    {
        from: `style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: '#28a745',
                                    marginBottom: '4px'
                                }}`,
        to: 'className="mg-v2-stat-number mg-v2-stat-number-success"'
    },
    // 총 건수
    {
        from: `style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: '#6c757d',
                                    marginBottom: '4px'
                                }}`,
        to: 'className="mg-v2-stat-number mg-v2-stat-number-secondary"'
    },
    // 완료율
    {
        from: `style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: stat.completionRate >= 80 ? '#28a745' : 
                                           stat.completionRate >= 60 ? '#ffc107' : '#dc3545',
                                    marginBottom: '4px'
                                }}`,
        to: `className={\`mg-v2-stat-number mg-v2-stat-number-rate \${stat.completionRate >= 80 ? 'mg-v2-stat-number-success' : 
                                           stat.completionRate >= 60 ? 'mg-v2-stat-number-warning' : 'mg-v2-stat-number-danger'}\`}`
    },
    // 통계 라벨들
    {
        from: `style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: '#6c757d',
                                    fontWeight: '500'
                                }}`,
        to: 'className="mg-v2-stat-label"'
    },
    // 빈 상태 컨테이너
    {
        from: `style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginTop: '20px'
                }}`,
        to: 'className="mg-v2-empty-state"'
    },
    // 빈 상태 아이콘
    {
        from: `style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px auto'
                    }}`,
        to: 'className="mg-v2-empty-icon"'
    },
    // 빈 상태 제목
    {
        from: `style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        color: '#495057',
                        marginBottom: '8px'
                    }}`,
        to: 'className="mg-v2-empty-title"'
    },
    // 빈 상태 설명
    {
        from: `style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#6c757d',
                        margin: 0
                    }}`,
        to: 'className="mg-v2-empty-description"'
    }
];

// 각 교체 작업 수행
replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// 파일 쓰기
fs.writeFileSync(filePath, content, 'utf8');

console.log('ConsultationCompletionStats.js 인라인 스타일 변환 완료');
