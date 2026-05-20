import React, { useState } from 'react';
import notificationManager from '../../utils/notification';
import UnifiedModal from './modals/UnifiedModal';
import {
  SALARY_MESSAGES,
  EXPORT_FORMAT,
  EXPORT_FORMAT_LABELS,
  SALARY_API_ENDPOINTS
} from '../../constants/salaryConstants';
import StandardizedApi from '../../utils/standardizedApi';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import './SalaryExportModal.css';

/**
 * 급여 출력 모달. 모든 출력 형식에서 상담사 등록 이메일로 발송 옵션 제공.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.salaryData
 * @param {string} props.consultantName
 * @param {string} props.period
 */
const SalaryExportModal = ({
  isOpen,
  onClose,
  salaryData,
  consultantName,
  period
}) => {
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMAT.PDF);
  const [includeTaxDetails, setIncludeTaxDetails] = useState(true);
  const [includeCalculationDetails, setIncludeCalculationDetails] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [includeAttachment, setIncludeAttachment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 출력 실행
  const handleExport = async() => {
    if (!salaryData) {
      setError('급여 데이터가 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exportData = {
        calculationId: salaryData.id,
        format: selectedFormat,
        includeTaxDetails,
        includeCalculationDetails,
        consultantName,
        period,
        emailAddress: null,
        notifyConsultantByEmail: sendEmail,
        includeAttachmentInEmail: sendEmail && includeAttachment
      };

      const exportEndpoint =
        selectedFormat === EXPORT_FORMAT.PDF
          ? SALARY_API_ENDPOINTS.EXPORT_PDF
          : selectedFormat === EXPORT_FORMAT.EXCEL
            ? SALARY_API_ENDPOINTS.EXPORT_EXCEL
            : SALARY_API_ENDPOINTS.EXPORT_CSV;
      const response = await StandardizedApi.post(exportEndpoint, exportData);

      if (response && (response.success !== false)) {
        const data = response.data ?? response;
        if (data && data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.filename || `급여계산서_${consultantName}_${period}.${selectedFormat.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        if (sendEmail) {
          if (data.emailSent === true) {
            const masked = data.recipientEmail;
            const lines = [
              SALARY_MESSAGES.EXPORT_SUCCESS,
              SALARY_MESSAGES.EMAIL_SENT_SUCCESS,
              '상담사 등록 메일로 발송되었습니다.'
            ];
            if (masked) {
              lines.push(`(${masked})`);
            }
            notificationManager.show(lines.join('\n'), 'success');
          } else if (data.emailSent === false) {
            const reason = data.emailMessage ? `\n${data.emailMessage}` : '';
            notificationManager.show(
              `${SALARY_MESSAGES.EXPORT_SUCCESS}\n이메일을 보내지 못했습니다.${reason}`,
              'warning'
            );
          } else {
            notificationManager.show(SALARY_MESSAGES.EXPORT_SUCCESS, 'success');
            notificationManager.show(
              '이메일 발송 여부를 확인할 수 없습니다. 서버 응답을 확인해 주세요.',
              'info'
            );
          }
        } else {
          notificationManager.show(SALARY_MESSAGES.EXPORT_SUCCESS, 'success');
        }

        onClose();
      } else {
        setError((response && response.message) || SALARY_MESSAGES.EXPORT_ERROR);
      }
    } catch (err) {
      console.error('출력 실패:', err);
      setError(SALARY_MESSAGES.EXPORT_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="급여 계산서 출력"
      size="large"
      loading={loading}
      backdropClick={!loading}
      actions={
        <>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn mg-v2-btn--outline'
            })}
            onClick={onClose}
            disabled={loading}
            variant="outline"
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            취소
          </MGButton>
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading,
              className: 'mg-v2-btn mg-v2-btn--primary'
            })}
            onClick={handleExport}
            disabled={loading}
            variant="primary"
            loading={loading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            출력
          </MGButton>
        </>
      }
    >
        <div className="mg-v2-modal-content">
          {/* 급여 정보 요약 */}
          <div className="mg-v2-card mg-v2-card--outlined">
            <h4 className="mg-v2-section-header">
              급여 정보
            </h4>
            <div className="mg-v2-form-grid">
              <div className="mg-v2-card-item">
                <div className="salary-export-modal__summary-emoji">👤</div>
                <div>
                  <div className="salary-export-modal__summary-label">상담사</div>
                  <div className="salary-export-modal__summary-value">{consultantName || '정보 없음'}</div>
                </div>
              </div>
              <div className="mg-v2-card-item">
                <div className="salary-export-modal__summary-emoji">📅</div>
                <div>
                  <div className="salary-export-modal__summary-label">기간</div>
                  <div className="salary-export-modal__summary-value">{period || '정보 없음'}</div>
                </div>
              </div>
              <div className="mg-v2-card-item">
                <div className="salary-export-modal__summary-emoji">💵</div>
                <div>
                  <div className="salary-export-modal__summary-label">총 급여</div>
                  <div className="salary-export-modal__summary-value salary-export-modal__summary-value--total">
                    {salaryData ? new Intl.NumberFormat('ko-KR').format(salaryData.totalSalary || 0) : 0}원
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 출력 옵션 */}
          <div className="salary-export-modal__option-section">
            <h4 className="salary-export-modal__option-heading">출력 옵션</h4>

            {/* 출력 형식 선택 */}
            <div className="salary-export-modal__option-section">
              <label className="salary-export-modal__option-label">
                출력 형식
              </label>
              <div className="salary-export-modal__radio-row">
                {Object.values(EXPORT_FORMAT).map(format => (
                  <label key={format} className="salary-export-modal__radio-item">
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                    />
                    <span>{EXPORT_FORMAT_LABELS[format]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 포함 내용 선택 */}
            <div className="salary-export-modal__option-section">
              <label className="salary-export-modal__option-label">
                포함 내용
              </label>
              <div className="salary-export-modal__checkbox-column">
                <label className="salary-export-modal__checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeTaxDetails}
                    onChange={(e) => setIncludeTaxDetails(e.target.checked)}
                  />
                  <span>세금 내역</span>
                </label>
                <label className="salary-export-modal__checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeCalculationDetails}
                    onChange={(e) => setIncludeCalculationDetails(e.target.checked)}
                  />
                  <span>계산 상세</span>
                </label>
              </div>
            </div>

            {/* 상담사 등록 이메일 발송 */}
            <div className="salary-export-modal__option-section">
              <label className="salary-export-modal__email-checkbox-item">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span>상담사 등록 이메일로 계산서 발송</span>
              </label>
              {sendEmail && (
                <label className="salary-export-modal__attachment-checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeAttachment}
                    onChange={(e) => setIncludeAttachment(e.target.checked)}
                  />
                  <span>첨부 파일 포함</span>
                </label>
              )}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="salary-export-modal__error">
              ❌ {error}
            </div>
          )}
        </div>
    </UnifiedModal>
  );
};

export default SalaryExportModal;
