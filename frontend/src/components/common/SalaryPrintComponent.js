import React from 'react';
import PrintComponent from './PrintComponent';

/**
 * 급여 계산서 프린트 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.salaryData - 급여 데이터
 * @param {string} props.consultantName - 상담사 이름
 * @param {string} props.period - 계산 기간
 * @param {boolean} props.includeTaxDetails - 세금 내역 포함 여부
 * @param {boolean} props.includeCalculationDetails - 계산 상세 포함 여부
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
const SalaryPrintComponent = ({ 
  salaryData, 
  consultantName, 
  period,
  includeTaxDetails = true,
  includeCalculationDetails = true
}) => {

  if (!salaryData) {
    return <div>급여 데이터가 없습니다.</div>;
  }

  // 금액 포맷팅 함수
  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 세금 계산 (총급여 - 실지급액)
  const taxAmount = (salaryData.totalSalary || 0) - (salaryData.totalSalary - (salaryData.taxAmount || 0));
  const netSalary = (salaryData.totalSalary || 0) - (salaryData.taxAmount || 0);

  return (
    <PrintComponent
      title={`급여 계산서 - ${consultantName}`}
      printStyle={{
        '@media print': {
          '.salary-header': {
            textAlign: 'center',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '2px solid #333'
          },
          '.salary-info': {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
            fontSize: 'var(--font-size-sm)'
          },
          '.salary-table': {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px'
          },
          '.salary-table th': {
            backgroundColor: '#e9ecef',
            fontWeight: 'bold',
            padding: '12px 8px',
            border: '1px solid #333',
            textAlign: 'center'
          },
          '.salary-table td': {
            padding: '10px 8px',
            border: '1px solid #333',
            textAlign: 'right'
          },
          '.salary-table td.label': {
            textAlign: 'left',
            fontWeight: 'bold',
            backgroundColor: '#f8f9fa'
          },
          '.total-row': {
            backgroundColor: '#e8f5e8',
            fontWeight: 'bold'
          },
          '.tax-row': {
            backgroundColor: '#fff3cd'
          },
          '.net-row': {
            backgroundColor: '#d4edda',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-base)'
          }
        }
      }}
    >
      <div className="salary-header">
        <h1 className="salary-title">급여 계산서</h1>
        <div className="salary-subtitle">
          {period} 급여 지급 내역
        </div>
      </div>

      <div className="salary-info">
        <div>
          <strong>상담사:</strong> {consultantName}
        </div>
        <div>
          <strong>계산 기간:</strong> {period}
        </div>
        <div>
          <strong>출력일:</strong> {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      <table className="salary-table">
        <thead>
          <tr>
            <th className="salary-table-header salary-table-header--item">항목</th>
            <th className="salary-table-header salary-table-header--amount">금액</th>
            <th className="salary-table-header salary-table-header--note">비고</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="label">기본 급여</td>
            <td>{formatCurrency(salaryData.baseSalary)}</td>
            <td>상담 {salaryData.consultationCount || 0}건</td>
          </tr>
          <tr>
            <td className="label">옵션 급여</td>
            <td>{formatCurrency(salaryData.optionSalary)}</td>
            <td>추가 옵션</td>
          </tr>
          <tr className="total-row">
            <td className="label">총 급여 (세전)</td>
            <td>{formatCurrency(salaryData.totalSalary)}</td>
            <td>-</td>
          </tr>
          {includeTaxDetails && (
            <tr className="tax-row">
              <td className="label">원천징수 (3.3%)</td>
              <td>-{formatCurrency(salaryData.taxAmount)}</td>
              <td>세금</td>
            </tr>
          )}
          <tr className="net-row">
            <td className="label">실지급액 (세후)</td>
            <td>{formatCurrency(netSalary)}</td>
            <td>최종 지급액</td>
          </tr>
        </tbody>
      </table>

      {includeCalculationDetails && (
        <div className="salary-calculation-details">
          <h3 className="salary-calculation-title">계산 상세</h3>
          <table className="salary-table">
            <tbody>
              <tr>
                <td className="label salary-table-label">상담 완료 건수</td>
                <td className="salary-table-value">{salaryData.consultationCount || 0}건</td>
                <td className="salary-table-desc">
                  {period} 기간 중 완료된 상담 건수
                </td>
              </tr>
              <tr>
                <td className="label">계산 상태</td>
                <td>{salaryData.status || 'PENDING'}</td>
                <td className="salary-table-desc">급여 계산 상태</td>
              </tr>
              <tr>
                <td className="label">지급 예정일</td>
                <td>{salaryData.payDate || '-'}</td>
                <td className="salary-table-desc">실제 지급 예정일</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="salary-footer">
        <div className="salary-footer-text">
          본 급여 계산서는 마인드가든 통합 상담관리 시스템에서 자동 생성되었습니다.
        </div>
        <div className="salary-footer-text">
          문의사항이 있으시면 관리자에게 연락해주세요.
        </div>
      </div>
    </PrintComponent>
  );
};

export default SalaryPrintComponent;
