import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import notificationManager from '../../utils/notification';
import {
  SALARY_CSS_CLASSES,
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
  
  // 프린트용 ref
  const printRef = useRef();

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

  if (!isOpen) return null;

  return (
    <div className={`${SALARY_CSS_CLASSES.MODAL} modal-overlay`}>
      <div className="modal-content">
        {/* 헤더 */}
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">
            급여 계산서 출력
          </h3>
          <button 
            onClick={onClose}
            aria-label="닫기"
            className="mg-v2-modal-close"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
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

        {/* 푸터 */}
        <div style={{
          padding: '15px 20px',
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8fafc -> var(--mg-custom-f8fafc)
          backgroundColor: '#f8fafc'
        }}>
          <button 
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #d1d5db -> var(--mg-custom-d1d5db)
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
              color: '#374151',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            취소
          </button>
          <button 
            onClick={handleExport}
            disabled={loading || (sendEmail && (!emailAddress || !isEmailValid(emailAddress)))}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid var(--mg-primary-500)',
              backgroundColor: 'var(--mg-primary-500)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            {loading ? '처리 중...' : '출력'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 인라인 스타일 정의
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--mg-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '90%',
  maxWidth: 'min(90vw, 800px)',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 4px 20px var(--mg-shadow-medium)'
};

const modalHeaderStyle = {
  padding: '20px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8fafc -> var(--mg-custom-f8fafc)
  backgroundColor: '#f8fafc'
};

const modalTitleStyle = {
  margin: 0,
  fontSize: 'var(--font-size-lg)',
  fontWeight: '600',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
  color: '#1f2937'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: 'var(--font-size-xxl)',
  cursor: 'pointer',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
  color: '#6b7280',
  padding: '0',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalBodyStyle = {
  padding: '20px',
  maxHeight: '60vh',
  overflowY: 'auto'
};

const summaryStyle = {
  marginBottom: '20px',
  padding: '15px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8fafc -> var(--mg-custom-f8fafc)
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
  border: '1px solid #e5e7eb'
};

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px',
  marginTop: '10px'
};

const optionsStyle = {
  marginBottom: '20px'
};

const formGroupStyle = {
  marginBottom: '20px'
};

const formatOptionsStyle = {
  display: 'flex',
  gap: '15px',
  marginTop: '8px'
};

const formatOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer'
};

const includeOptionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '8px'
};

const includeOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer'
};

const emailOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  marginBottom: '10px'
};

const emailInputContainerStyle = {
  marginTop: '10px'
};

const emailInputStyle = {
  width: '100%',
  padding: '8px 12px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #d1d5db -> var(--mg-custom-d1d5db)
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: 'var(--font-size-sm)'
};

const emailErrorStyle = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
  color: '#dc2626',
                      fontSize: 'var(--font-size-xs)',
  marginTop: '4px'
};

const errorStyle = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
  color: '#dc2626',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
  backgroundColor: '#fef2f2',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '10px'
};

const modalFooterStyle = {
  padding: '15px 20px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8fafc -> var(--mg-custom-f8fafc)
  backgroundColor: '#f8fafc'
};

const footerButtonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #d1d5db -> var(--mg-custom-d1d5db)
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
  color: '#374151',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)'
};

// 새로 추가된 스타일들
const headerContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const headerIconStyle = {
  fontSize: 'var(--font-size-xxl)'
};

const modalSubtitleStyle = {
  margin: '4px 0 0 0',
  fontSize: 'var(--font-size-sm)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
  color: '#6b7280'
};

const summaryHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '15px'
};

const summaryIconStyle = {
  fontSize: 'var(--font-size-xl)'
};

const summaryTitleStyle = {
  margin: 0,
                    fontSize: 'var(--font-size-base)',
  fontWeight: '600',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
  color: '#1f2937'
};

const summaryItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '8px',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
  border: '1px solid #e5e7eb'
};

const summaryItemIconStyle = {
  fontSize: 'var(--font-size-lg)'
};

const summaryLabelStyle = {
  display: 'block',
                      fontSize: 'var(--font-size-xs)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
  color: '#6b7280',
  fontWeight: '500',
  marginBottom: '2px'
};

const summaryValueStyle = {
  display: 'block',
  fontSize: 'var(--font-size-sm)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
  color: '#1f2937',
  fontWeight: '600'
};

const summaryAmountStyle = {
  display: 'block',
                    fontSize: 'var(--font-size-base)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #059669 -> var(--mg-custom-059669)
  color: '#059669',
  fontWeight: '700'
};

export default SalaryExportModal;
