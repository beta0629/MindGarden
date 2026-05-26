import React from 'react';
import PrintComponent from './PrintComponent';
import { SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL } from '../../constants/salaryConstants';
import { buildSalaryCalculationComponentRows } from '../../utils/salaryCalculationDisplay';
import { useTranslation } from 'react-i18next';

/**
 * 급여 계산서 프린트 컴포넌트
 * 
/**
 * @param {Object} props - 컴포넌트 props
/**
 * @param {Object} props.salaryData - 급여 데이터
/**
 * @param {string} props.consultantName - 상담사 이름
/**
 * @param {string} props.period - 계산 기간
/**
 * @param {boolean} props.includeTaxDetails - 세금 내역 포함 여부
/**
 * @param {boolean} props.includeCalculationDetails - 계산 상세 포함 여부
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-11
 */
const SalaryPrintComponent = ({ 
  salaryData, 
  consultantName, 
  period,
  includeTaxDetails = true,
  includeCalculationDetails = true
}) => {
  const { t } = useTranslation();

  if (!salaryData) {
    return <div>{t('common:common.SalaryPrintComponent.t_f00ebcb0')}</div>;
  }

  const toNum = (value) => {
    if (value == null || value === '') {
      return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (amount) => {
    const n = toNum(amount);
    if (!n) {
      return '0원';
    }
    return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
  };

  const bonusEarnings = toNum(salaryData.bonusEarnings);
  const grossPreTax =
    salaryData.grossSalary != null && salaryData.grossSalary !== ''
      ? toNum(salaryData.grossSalary)
      : toNum(salaryData.totalSalary);
  const netSalary =
    salaryData.netSalary != null && salaryData.netSalary !== ''
      ? toNum(salaryData.netSalary)
      : toNum(salaryData.totalSalary) - toNum(salaryData.taxAmount);

  return (
    <PrintComponent
      title={`급여 계산서 - ${consultantName}`}
      printStyle={{
        '@media print': {
          '.salary-header': {
            textAlign: 'center',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'var(--mg-gray-100)',
            border: '2px solid var(--mg-color-text-main)'
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
            backgroundColor: 'var(--mg-color-border-main)',
            fontWeight: 'bold',
            padding: '12px 8px',
            border: '1px solid var(--mg-color-text-main)',
            textAlign: 'center'
          },
          '.salary-table td': {
            padding: '10px 8px',
            border: '1px solid var(--mg-color-text-main)',
            textAlign: 'right'
          },
          '.salary-table td.label': {
            textAlign: 'left',
            fontWeight: 'bold',
            backgroundColor: 'var(--mg-gray-100)'
          },
          '.total-row': {
            backgroundColor: '#e8f5e8',
            fontWeight: 'bold'
          },
          '.tax-row': {
            backgroundColor: 'var(--mg-color-warning-bg)'
          },
          '.net-row': {
            backgroundColor: 'var(--mg-color-success-100)',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-base)'
          }
        }
      }}
    >
      <div className="salary-header">
        <h1 className="salary-title">{t('common:common.SalaryPrintComponent.t_3974b882')}</h1>
        <div className="salary-subtitle">
          {period} 급여 지급 내역
        </div>
      </div>

      <div className="salary-info">
        <div>
          <strong>{t('common:common.SalaryPrintComponent.t_a30d6da9')}</strong> {consultantName}
        </div>
        <div>
          <strong>{t('common:common.SalaryPrintComponent.t_4a3e877f')}</strong> {period}
        </div>
        <div>
          <strong>{t('common:common.SalaryPrintComponent.t_dbc050d6')}</strong> {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      <table className="salary-table">
        <thead>
          <tr>
            <th className="salary-table-header salary-table-header--item">{t('common:common.SalaryPrintComponent.t_1e591967')}</th>
            <th className="salary-table-header salary-table-header--amount">{t('common:common.SalaryPrintComponent.t_64454827')}</th>
            <th className="salary-table-header salary-table-header--note">{t('common:common.SalaryPrintComponent.t_75cffa41')}</th>
          </tr>
        </thead>
        <tbody>
          {buildSalaryCalculationComponentRows(salaryData, toNum).map((row, idx) => (
            <tr key={`${row.label}-${idx}`}>
              <td className="label">{row.label}</td>
              <td>{formatCurrency(row.amount)}</td>
              <td>{idx === 0 ? `상담 ${salaryData.consultationCount || 0}건` : '-'}</td>
            </tr>
          ))}
          {bonusEarnings > 0 && (
            <tr>
              <td className="label">{SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL}</td>
              <td>+{formatCurrency(bonusEarnings)}</td>
              <td>-</td>
            </tr>
          )}
          <tr className="total-row">
            <td className="label">{t('common:common.SalaryPrintComponent.t_92a15637')}</td>
            <td>{formatCurrency(grossPreTax)}</td>
            <td>-</td>
          </tr>
          {includeTaxDetails && (
            <tr className="tax-row">
              <td className="label">{t('common:common.SalaryPrintComponent.t_315a1dfd')}</td>
              <td>-{formatCurrency(salaryData.taxAmount)}</td>
              <td>{t('common:common.SalaryPrintComponent.t_8f266fdc')}</td>
            </tr>
          )}
          <tr className="net-row">
            <td className="label">{t('common:common.SalaryPrintComponent.t_c3363939')}</td>
            <td>{formatCurrency(netSalary)}</td>
            <td>{t('common:common.SalaryPrintComponent.t_090d1302')}</td>
          </tr>
        </tbody>
      </table>

      {includeCalculationDetails && (
        <div className="salary-calculation-details">
          <h3 className="salary-calculation-title">{t('common:common.SalaryPrintComponent.t_d76f1031')}</h3>
          <table className="salary-table">
            <tbody>
              <tr>
                <td className="label salary-table-label">{t('common:common.SalaryPrintComponent.t_822f299d')}</td>
                <td className="salary-table-value">{salaryData.consultationCount || 0}건</td>
                <td className="salary-table-desc">
                  {period} 기간 중 완료된 상담 건수
                </td>
              </tr>
              <tr>
                <td className="label">{t('common:common.SalaryPrintComponent.t_e185943a')}</td>
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                <td>{salaryData.status || 'PENDING'}</td>
                <td className="salary-table-desc">{t('common:common.SalaryPrintComponent.t_a594214b')}</td>
              </tr>
              <tr>
                <td className="label">{t('common:common.SalaryPrintComponent.t_dc14e91c')}</td>
                <td>{salaryData.payDate || '-'}</td>
                <td className="salary-table-desc">{t('common:common.SalaryPrintComponent.t_e91bda46')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="salary-footer">
        <div className="salary-footer-text">
          {t('common:common.SalaryPrintComponent.t_92adb3f6')}
        </div>
        <div className="salary-footer-text">
          {t('common:common.SalaryPrintComponent.t_a7368a3f')}
        </div>
      </div>
    </PrintComponent>
  );
};

export default SalaryPrintComponent;
