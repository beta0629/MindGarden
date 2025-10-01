import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

/**
 * 공통 프린트 훅
 * 
 * @param {Object} options - 프린트 옵션
 * @param {string} options.title - 프린트 제목
 * @param {Function} options.onBeforePrint - 프린트 전 콜백
 * @param {Function} options.onAfterPrint - 프린트 후 콜백
 * @param {Object} options.pageStyle - 페이지 스타일
 * @returns {Object} 프린트 관련 함수와 ref
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
const usePrint = (options = {}) => {
  const {
    title = "문서 출력",
    onBeforePrint,
    onAfterPrint,
    pageStyle = {}
  } = options;

  const printRef = useRef();

  // 기본 프린트 스타일
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
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
      },
      '.print-subtitle': {
        fontSize: 'var(--font-size-sm)',
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
      }
    }
  };

  // 프린트 핸들러 설정
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: title,
    onBeforePrint,
    onAfterPrint,
    pageStyle: Object.keys(defaultPrintStyle).map(selector => 
      `${selector} { ${Object.entries(defaultPrintStyle[selector]).map(([prop, value]) => 
        `${prop}: ${value}`
      ).join('; ')} }`
    ).join(' ')
  });

  return {
    printRef,
    handlePrint
  };
};

export default usePrint;
