import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import UnifiedModal from './modals/UnifiedModal';
import {
  SALARY_MESSAGES,
  EXPORT_FORMAT,
  EXPORT_FORMAT_LABELS,
  SALARY_API_ENDPOINTS
} from '../../constants/salaryConstants';
import StandardizedApi from '../../utils/standardizedApi';
import { useSession } from '../../contexts/SessionContext';

/**
 * 급여 출력 모달 컴포넌트
 * 
/**
 * @param {Object} props - 컴포넌트 props
/**
 * @param {boolean} props.isOpen - 모달 열림 상태
/**
 * @param {Function} props.onClose - 모달 닫기 함수
/**
 * @param {Object} props.salaryData - 급여 데이터
/**
 * @param {string} props.consultantName - 상담사 이름
/**
 * @param {string} props.period - 계산 기간
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-11
 */
const SalaryExportModal = ({ 
  isOpen, 
  onClose, 
  salaryData, 
  consultantName, 
  period 
}) => {
  const { user } = useSession();
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMAT.PDF);
  const [includeTaxDetails, setIncludeTaxDetails] = useState(true);
  const [includeCalculationDetails, setIncludeCalculationDetails] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 모달이 열릴 때 사용자 이메일 자동 설정
  useEffect(() => {
    if (isOpen && user?.email) {
      setEmailAddress(user.email);
      setSendEmail(true);
    }
  }, [isOpen, user?.email]);

  // 출력 실행
  const handleExport = async () => {
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
        emailAddress: sendEmail ? emailAddress : null
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

        if (sendEmail && emailAddress) {
          notificationManager.show(`${SALARY_MESSAGES.EMAIL_SENT_SUCCESS}\n수신자: ${emailAddress}`, 'info');
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

  // 이메일 유효성 검사
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
          <button
            type="button"
            className="mg-v2-btn mg-v2-btn--outline"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="mg-v2-btn mg-v2-btn--primary"
            onClick={handleExport}
            disabled={
              loading || (sendEmail && (!emailAddress || !isEmailValid(emailAddress)))
            }
          >
            출력
          </button>
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
                <div style={{ fontSize: 'var(--font-size-lg)' }}>👤</div>
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                    color: '#6b7280',
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>상담사</div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>{consultantName || '정보 없음'}</div>
                </div>
              </div>
              <div className="mg-v2-card-item">
                <div style={{ fontSize: 'var(--font-size-lg)' }}>📅</div>
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                    color: '#6b7280',
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>기간</div>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>{period || '정보 없음'}</div>
                </div>
              </div>
              <div className="mg-v2-card-item">
                <div style={{ fontSize: 'var(--font-size-lg)' }}>💵</div>
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                    color: '#6b7280',
                    fontWeight: '500',
                    marginBottom: '2px'
                  }}>총 급여</div>
                  <div style={{
                    fontSize: 'var(--font-size-base)',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #059669 -> var(--mg-custom-059669)
                    color: '#059669',
                    fontWeight: '700'
                  }}>
                    {salaryData ? new Intl.NumberFormat('ko-KR').format(salaryData.totalSalary || 0) : 0}원
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 출력 옵션 */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>출력 옵션</h4>
            
            {/* 출력 형식 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                출력 형식
              </label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                {Object.values(EXPORT_FORMAT).map(format => (
                  <label key={format} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                포함 내용
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeTaxDetails}
                    onChange={(e) => setIncludeTaxDetails(e.target.checked)}
                  />
                  <span>세금 내역</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeCalculationDetails}
                    onChange={(e) => setIncludeCalculationDetails(e.target.checked)}
                  />
                  <span>계산 상세</span>
                </label>
              </div>
            </div>

            {/* 이메일 발송 옵션 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span>이메일로 발송</span>
              </label>
              
              {sendEmail && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #d1d5db -> var(--mg-custom-d1d5db)
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                  {emailAddress && !isEmailValid(emailAddress) && (
                    <p style={{
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
                      color: '#dc2626',
                      fontSize: 'var(--font-size-xs)',
                      marginTop: '4px'
                    }}>
                      올바른 이메일 주소를 입력해주세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div style={{
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
              color: '#dc2626',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
              backgroundColor: '#fef2f2',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              ❌ {error}
            </div>
          )}
        </div>
    </UnifiedModal>
  );
};

export default SalaryExportModal;
