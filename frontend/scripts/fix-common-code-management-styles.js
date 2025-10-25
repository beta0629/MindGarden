const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/CommonCodeManagement.js');

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 인라인 스타일을 CSS 클래스로 변환
const replacements = [
    // 필터 컨테이너
    {
        from: `style={ { flexWrap: 'wrap' }}`,
        to: 'className="mg-v2-filter-container"'
    },
    // 검색 입력 그룹
    {
        from: `style={ { position: 'relative', flex: 1, minWidth: '250px' }}`,
        to: 'className="mg-v2-search-group"'
    },
    // 카테고리 필터
    {
        from: `style={{
                            padding: '10px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            backgroundColor: '#fff',
                            color: '#495057',
                            minWidth: '150px',
                            cursor: 'pointer'
                        }}`,
        to: 'className="mg-v2-category-filter"'
    },
    // 초기화 버튼
    {
        from: `style={{
                                padding: '10px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}`,
        to: 'className="mg-v2-reset-button"'
    },
    // 필터 상태 표시
    {
        from: `style={{
                            fontSize: 'var(--font-size-sm)',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px'
                }}`,
        to: 'className="mg-v2-filter-status"'
    },
    // 코드 관리 헤더
    {
        from: `style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '80px'
            }}`,
        to: 'className="mg-v2-code-management-header"'
    },
    // 뒤로가기 버튼
    {
        from: `style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}`,
        to: 'className="mg-v2-back-button"'
    },
    // 그룹 정보
    {
        from: `style={{
                    flex: 1,
                    minWidth: 0,
                    margin: '0 16px'
                }}`,
        to: 'className="mg-v2-group-info"'
    },
    // 그룹 제목
    {
        from: `style={{
                        color: '#2c3e50',
                        margin: '0 0 4px 0',
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: '600'
                    }}`,
        to: 'className="mg-v2-group-title"'
    },
    // 그룹 설명
    {
        from: `style={{
                        color: '#6c757d',
                        margin: '0',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: '1.4'
                    }}`,
        to: 'className="mg-v2-group-description"'
    },
    // 새 코드 추가 버튼
    {
        from: `style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}`,
        to: 'className="mg-v2-add-code-button"'
    },
    // 폼 입력 필드들
    {
        from: `style={{
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        border: '2px solid #e9ecef'
                                    }}`,
        to: 'className="mg-v2-form-input"'
    },
    // 코드 그리드
    {
        from: `style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px'
                    }}`,
        to: 'className="mg-v2-code-grid"'
    },
    // 코드 카드
    {
        from: `style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid #e9ecef',
                                    opacity: !code.isActive ? 0.6 : 1
                                }}`,
        to: 'className={`mg-v2-code-card ${!code.isActive ? \'mg-v2-code-card-inactive\' : \'\'}`}'
    },
    // 코드 카드 헤더
    {
        from: `style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}`,
        to: 'className="mg-v2-code-card-header"'
    },
    // 코드 라벨
    {
        from: `style={{
                                            color: '#2c3e50',
                                            margin: '0 0 4px 0',
                                            fontSize: 'var(--font-size-base)',
                                            fontWeight: '600'
                                        }}`,
        to: 'className="mg-v2-code-label"'
    },
    // 코드 값
    {
        from: `style={{
                                            color: '#6c757d',
                                            fontSize: 'var(--font-size-xs)',
                                            background: '#e9ecef',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontWeight: '500'
                                        }}`,
        to: 'className="mg-v2-code-value"'
    },
    // 상태 배지
    {
        from: `style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: '600',
                                        backgroundColor: code.isActive ? '#d4edda' : '#f8d7da',
                                        color: code.isActive ? '#155724' : '#721c24'
                                    }}`,
        to: `className={\`mg-v2-status-badge \${code.isActive ? 'mg-v2-status-badge-active' : 'mg-v2-status-badge-inactive'}\`}`
    },
    // 코드 설명
    {
        from: `style={{ marginBottom: '12px' }}`,
        to: 'className="mg-v2-code-description-container"'
    },
    // 코드 설명 텍스트
    {
        from: `style={{
                                            color: '#6c757d',
                                            margin: '0',
                                            fontSize: 'var(--font-size-sm)',
                                            lineHeight: '1.4'
                                        }}`,
        to: 'className="mg-v2-code-description"'
    },
    // 코드 카드 푸터
    {
        from: `style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}`,
        to: 'className="mg-v2-code-card-footer"'
    },
    // 정렬 순서
    {
        from: `style={{
                                        color: '#6c757d',
                                        fontSize: 'var(--font-size-xs)'
                                    }}`,
        to: 'className="mg-v2-sort-order"'
    },
    // 액션 버튼들
    {
        from: `style={{
                                        display: 'flex',
                                        gap: '6px'
                                    }}`,
        to: 'className="mg-v2-code-actions"'
    },
    // 편집 버튼
    {
        from: `style={{
                                                padding: '6px 10px',
                                                border: '2px solid #007bff',
                                                borderRadius: '6px',
                                                backgroundColor: '#fff',
                                                color: '#007bff',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}`,
        to: 'className="mg-v2-edit-button"'
    },
    // 토글 버튼
    {
        from: `style={{
                                                padding: '6px 10px',
                                                border: \`2px solid \${code.isActive ? '#ffc107' : '#28a745'}\`,
                                                borderRadius: '6px',
                                                backgroundColor: '#fff',
                                                color: code.isActive ? '#ffc107' : '#28a745',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}`,
        to: `className={\`mg-v2-toggle-button \${code.isActive ? 'mg-v2-toggle-button-pause' : 'mg-v2-toggle-button-play'}\`}`
    },
    // 삭제 버튼
    {
        from: `style={{
                                                padding: '6px 10px',
                                                border: '2px solid #dc3545',
                                                borderRadius: '6px',
                                                backgroundColor: '#fff',
                                                color: '#dc3545',
                                                fontSize: 'var(--font-size-xs)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}`,
        to: 'className="mg-v2-delete-button"'
    }
];

// 각 교체 작업 수행
replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
});

// 파일 쓰기
fs.writeFileSync(filePath, content, 'utf8');

console.log('CommonCodeManagement.js 인라인 스타일 변환 완료');
