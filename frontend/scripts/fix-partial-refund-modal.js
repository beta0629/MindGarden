const fs = require('fs');
const path = require('path');

// 파일 경로
const jsFilePath = path.join(__dirname, '../src/components/admin/mapping/PartialRefundModal.js');

// JS 파일 수정
function updateJSFile() {
  let jsContent = fs.readFileSync(jsFilePath, 'utf8');
  
  // 인라인 스타일을 CSS 클래스로 변경
  const replacements = [
    // 모달 오버레이
    {
      from: 'className="partial-refund-modal-overlay"',
      to: 'className="mg-v2-partial-refund-modal-overlay"'
    },
    // 모달 컨테이너
    {
      from: `style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}`,
      to: 'className="mg-v2-partial-refund-modal"'
    },
    // 모달 헤더
    {
      from: `style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}`,
      to: 'className="mg-v2-partial-refund-modal-header"'
    },
    // 모달 제목
    {
      from: `style={{ margin: 0, color: '#dc3545', fontWeight: 'bold' }}`,
      to: 'className="mg-v2-partial-refund-modal-title"'
    },
    // 닫기 버튼
    {
      from: `style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--font-size-xxl)',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6c757d'
            }}`,
      to: 'className="mg-v2-partial-refund-modal-close"'
    },
    // 매핑 정보 박스
    {
      from: `style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}`,
      to: 'className="mg-v2-info-box"'
    },
    // 매핑 정보 제목
    {
      from: `style={{ margin: '0 0 12px 0', color: '#495057' }}`,
      to: 'className="mg-v2-info-box-title"'
    },
    // 매핑 정보 그리드
    {
      from: `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--font-size-sm)' }}`,
      to: 'className="mg-v2-info-grid"'
    },
    // 환불 대상 박스
    {
      from: `style={{
            backgroundColor: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}`,
      to: 'className="mg-v2-refund-target-box"'
    },
    // 환불 대상 제목
    {
      from: `style={{ margin: '0 0 12px 0', color: '#856404' }}`,
      to: 'className="mg-v2-refund-target-title"'
    },
    // 환불 대상 경고
    {
      from: `style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#ffeaa7', 
              borderRadius: '4px',
              fontSize: 'var(--font-size-xs)',
              color: '#856404'
            }}`,
      to: 'className="mg-v2-refund-target-warning"'
    },
    // 청약 철회 기간 박스
    {
      from: `style={{
            backgroundColor: withdrawalCheck.isValid ? '#d4edda' : '#f8d7da',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: \`1px solid \${withdrawalCheck.isValid ? '#c3e6cb' : '#f5c6cb'}\`
          }}`,
      to: `className={\`mg-v2-withdrawal-period-box mg-v2-withdrawal-period-box--\${withdrawalCheck.isValid ? 'valid' : 'invalid'}\`}`
    },
    // 청약 철회 기간 제목
    {
      from: `style={{ 
              margin: '0 0 8px 0', 
              color: withdrawalCheck.isValid ? '#155724' : '#721c24' 
            }}`,
      to: `className={\`mg-v2-withdrawal-period-title mg-v2-withdrawal-period-title--\${withdrawalCheck.isValid ? 'valid' : 'invalid'}\`}`
    },
    // 청약 철회 기간 메시지
    {
      from: `style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: withdrawalCheck.isValid ? '#155724' : '#721c24',
              fontWeight: '600'
            }}`,
      to: `className={\`mg-v2-withdrawal-period-message mg-v2-withdrawal-period-message--\${withdrawalCheck.isValid ? 'valid' : 'invalid'}\`}`
    },
    // 청약 철회 기간 날짜
    {
      from: `style={{ 
                fontSize: 'var(--font-size-xs)', 
                color: withdrawalCheck.isValid ? '#155724' : '#721c24',
                marginTop: '4px'
              }}`,
      to: `className={\`mg-v2-withdrawal-period-date mg-v2-withdrawal-period-date--\${withdrawalCheck.isValid ? 'valid' : 'invalid'}\`}`
    },
    // 청약 철회 기간 경고
    {
      from: `style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: '#f5c6cb', 
                borderRadius: '4px',
                fontSize: 'var(--font-size-xs)',
                color: '#721c24'
              }}`,
      to: 'className="mg-v2-withdrawal-period-warning"'
    },
    // 폼 그룹
    {
      from: `style={{ marginBottom: '20px' }}`,
      to: 'className="mg-v2-form-group"'
    },
    // 폼 라벨
    {
      from: `style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#495057'
            }}`,
      to: 'className="mg-v2-form-label"'
    },
    // 입력 필드
    {
      from: `style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}`,
      to: 'className="mg-v2-form-input"'
    },
    // 텍스트에어리어
    {
      from: `style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s'
              }}`,
      to: 'className="mg-v2-form-textarea"'
    },
    // 도움말 텍스트
    {
      from: `style={{ color: '#6c757d', fontSize: 'var(--font-size-xs)' }}`,
      to: 'className="mg-v2-form-help"'
    },
    // 환불 금액 미리보기
    {
      from: `style={{
            backgroundColor: '#e3f2fd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #bbdefb'
          }}`,
      to: 'className="mg-v2-refund-preview"'
    },
    // 환불 금액 제목
    {
      from: `style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}`,
      to: 'className="mg-v2-refund-preview-title"'
    },
    // 환불 금액
    {
      from: `style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#1976d2' }}`,
      to: 'className="mg-v2-refund-preview-amount"'
    },
    // 환불 금액 상세
    {
      from: `style={{ color: '#1976d2', fontSize: 'var(--font-size-xs)' }}`,
      to: 'className="mg-v2-refund-preview-detail"'
    },
    // 버튼 그룹
    {
      from: `style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}`,
      to: 'className="mg-v2-button-group"'
    },
    // 취소 버튼
    {
      from: `style={{
                padding: '12px 20px',
                border: '2px solid #6c757d',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#6c757d',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}`,
      to: 'className="mg-v2-button mg-v2-button--secondary"'
    },
    // 환불 버튼
    {
      from: `style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: loading || !reason.trim() || reason.trim().length < 5 ? '#6c757d' : 
                             !withdrawalCheck.isValid ? '#ffc107' : '#dc3545',
                color: 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                cursor: loading || !reason.trim() || reason.trim().length < 5 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}`,
      to: `className={\`mg-v2-button \${loading || !reason.trim() || reason.trim().length < 5 ? 'mg-v2-button--disabled' : 
                             !withdrawalCheck.isValid ? 'mg-v2-button--warning' : 'mg-v2-button--danger'}\`}`
    }
  ];
  
  // 교체 실행
  replacements.forEach(replacement => {
    jsContent = jsContent.replace(replacement.from, replacement.to);
  });
  
  // 추가 수정사항
  jsContent = jsContent.replace(
    '<span style={{ color: \'#dc3545\' }}>*</span>',
    '<span className="mg-v2-form-label-required">*</span>'
  );
  
  // onFocus, onBlur 이벤트 제거 (CSS로 처리)
  jsContent = jsContent.replace(/onFocus=\{\(e\) => e\.target\.style\.borderColor = '#007bff'\}/g, '');
  jsContent = jsContent.replace(/onBlur=\{\(e\) => e\.target\.style\.borderColor = '#dee2e6'\}/g, '');
  
  fs.writeFileSync(jsFilePath, jsContent);
  console.log('PartialRefundModal.js 업데이트 완료');
}

// 실행
updateJSFile();
console.log('PartialRefundModal 리팩토링 완료!');
