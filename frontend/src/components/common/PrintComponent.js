import React, { useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './PrintComponent.css';

/**
 * 공통 프린트 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
/**
 * @param {React.ReactNode} props.children - 프린트할 내용
/**
 * @param {string} props.title - 프린트 제목
/**
 * @param {Object} props.printStyle - 프린트 스타일
/**
 * @param {Function} props.onBeforePrint - 프린트 전 콜백
/**
 * @param {Function} props.onAfterPrint - 프린트 후 콜백
/**
 * @param {string} props.pageStyle - 페이지 스타일
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
        fontSize: 'var(--font-size-xs)',
        lineHeight: '1.4',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #000 -> var(--mg-custom-000)
        color: '#000',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
        backgroundColor: '#fff'
      },
      '.print-header': {
        textAlign: 'center',
        marginBottom: '20px',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
      },
      '.print-title': {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
      },
      '.print-subtitle': {
        fontSize: 'var(--font-size-sm)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
        color: '#666',
        margin: '0'
      },
      '.print-content': {
        marginTop: '20px'
      },
      '.print-footer': {
        marginTop: '30px',
        textAlign: 'center',
        fontSize: 'var(--font-size-xs)',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
        color: '#666',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ccc -> var(--mg-custom-ccc)
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
        border: '1px solid #333',
        padding: '8px',
        textAlign: 'left'
      },
      'th': {
        backgroundColor: 'var(--mg-gray-100)',
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
        fontSize: 'var(--font-size-base)'
      },
      '.text-xl': {
        fontSize: 'var(--font-size-lg)'
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
      <MGButton
        type="button"
        variant="primary"
        onClick={handlePrint}
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'md',
          loading: false,
          className: 'print-button'
        })}
        preventDoubleClick={false}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      >
        프린트
      </MGButton>
      
      {/* 프린트할 내용 */}
      <div 
        ref={printRef}
        className="print-content-hidden"
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
          <div>Core Solution 통합 상담관리 시스템</div>
          <div>출력일: {new Date().toLocaleString('ko-KR')}</div>
        </div>
      </div>
    </div>
  );
});

PrintComponent.displayName = 'PrintComponent';

export default PrintComponent;
