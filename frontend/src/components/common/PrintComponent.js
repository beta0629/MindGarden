import React, { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';

/**
 * 공통 프린트 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 프린트할 내용
 * @param {string} props.title - 프린트 제목
 * @param {Object} props.printStyle - 프린트 스타일
 * @param {Function} props.onBeforePrint - 프린트 전 콜백
 * @param {Function} props.onAfterPrint - 프린트 후 콜백
 * @param {string} props.pageStyle - 페이지 스타일
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
const PrintComponent = forwardRef(({ 
  children, 
  title = "문서 출력",
  printStyle = {},
  onBeforePrint,
  onAfterPrint,
  pageStyle = {}
}, ref) => {
  const internalRef = useRef();
  const printRef = ref || internalRef;
  
  // 프린트 스타일 기본값
  const defaultPrintStyle = {
    '@media print': {
      '@page': {
        margin: '20mm',
        size: 'A4',
        ...pageStyle
      },
      'body': {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        backgroundColor: '#fff'
      },
      '.print-header': {
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
      },
      '.print-title': {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
      },
      '.print-subtitle': {
        fontSize: '14px',
        color: '#666',
        margin: '0'
      },
      '.print-content': {
        marginTop: '20px'
      },
      '.print-footer': {
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#666',
        borderTop: '1px solid #ccc',
        paddingTop: '10px'
      },
      '.no-print': {
        display: 'none'
      },
      '.print-only': {
        display: 'block'
      },
      'table': {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '15px'
      },
      'th, td': {
        border: '1px solid #333',
        padding: '8px',
        textAlign: 'left'
      },
      'th': {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold'
      },
      '.text-right': {
        textAlign: 'right'
      },
      '.text-center': {
        textAlign: 'center'
      },
      '.font-bold': {
        fontWeight: 'bold'
      },
      '.text-lg': {
        fontSize: '16px'
      },
      '.text-xl': {
        fontSize: '18px'
      },
      '.mb-4': {
        marginBottom: '16px'
      },
      '.mt-4': {
        marginTop: '16px'
      },
      ...printStyle
    }
  };

  // 프린트 핸들러 설정
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: title,
    onBeforePrint: onBeforePrint,
    onAfterPrint: onAfterPrint,
    pageStyle: Object.keys(defaultPrintStyle).map(selector => 
      `${selector} { ${Object.entries(defaultPrintStyle[selector]).map(([prop, value]) => 
        `${prop}: ${value}`
      ).join('; ')} }`
    ).join(' ')
  });

  return (
    <div>
      {/* 프린트 버튼 */}
      <button 
        onClick={handlePrint}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          marginRight: '10px'
        }}
      >
        🖨️ 프린트
      </button>
      
      {/* 프린트할 내용 */}
      <div 
        ref={printRef}
        style={{ display: 'none' }}
      >
        <div className="print-header">
          <div className="print-title">{title}</div>
          <div className="print-subtitle">
            출력일: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
        
        <div className="print-content">
          {children}
        </div>
        
        <div className="print-footer">
          <div>마인드가든 통합 상담관리 시스템</div>
          <div>출력일: {new Date().toLocaleString('ko-KR')}</div>
        </div>
      </div>
    </div>
  );
});

PrintComponent.displayName = 'PrintComponent';

export default PrintComponent;
