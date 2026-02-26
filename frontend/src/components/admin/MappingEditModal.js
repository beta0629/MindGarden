import React, { useState, useEffect } from 'react';
import { Edit3, XCircle, Package2, DollarSign, Calendar, AlertCircle, User, CalendarDays } from 'lucide-react';
import notificationManager from '../../utils/notification';
import { getMappingStatusKoreanNameSync } from '../../utils/codeHelper';
import UnifiedModal from '../common/modals/UnifiedModal';
import './MappingEditModal.css';

/**
 * 매칭 수정 모달 컴포넌트
 * - 매칭의 패키지명, 가격, 총 회기 수를 수정할 수 있음
 * - ERP 연동을 통한 자동 업데이트
 * - B0KlA 카드, 섹션 구분, 악센트 바, 금액·회기 강조 적용
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 * @updated 2025-02-22 - B0KlA 디자인 시스템 적용, 누락 정보 추가
 */
const MappingEditModal = ({ isOpen, onClose, mapping, onSuccess }) => {
  const [formData, setFormData] = useState({
    packageName: '',
    packagePrice: '',
    totalSessions: ''
  });
  const [packageOptions, setPackageOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getStatusBadgeClass = (status) => {
    const map = {
      ACTIVE: 'status-active',
      PENDING_PAYMENT: 'status-pending',
      PAYMENT_CONFIRMED: 'status-confirmed',
      TERMINATED: 'status-terminated',
      SESSIONS_EXHAUSTED: 'status-exhausted',
      INACTIVE: 'status-inactive',
      SUSPENDED: 'status-suspended'
    };
    return map[status] || 'status-default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // 매칭 데이터가 변경될 때 폼 초기화
  useEffect(() => {
    if (mapping && isOpen) {
      setFormData({
        packageName: mapping.packageName || '',
        packagePrice: mapping.packagePrice || '',
        totalSessions: mapping.totalSessions || ''
      });
      setErrors({});
    }
  }, [mapping, isOpen]);

  // 패키지 옵션 로드
  useEffect(() => {
    if (isOpen) {
      loadPackageOptions();
    }
  }, [isOpen]);

  /**
   * 패키지 옵션 로드
   */
  const loadPackageOptions = async () => {
    try {
      const { getTenantCodes } = await import('../../utils/commonCodeApi');
      const codes = await getTenantCodes('CONSULTATION_PACKAGE');

      const options = codes.map(code => ({
        value: code.codeValue,
        label: code.koreanName || code.codeLabel,
        sessions: getSessionCount(code.codeValue),
        price: getPackagePrice(code.codeValue)
      }));

      setPackageOptions(options);
    } catch (error) {
      console.error('패키지 옵션 로드 실패:', error);
      notificationManager.show('패키지 옵션을 불러오는데 실패했습니다.', 'error');
    }
  };

  /**
   * 패키지 코드에서 회기 수 추출
   */
  const getSessionCount = (codeValue) => {
    if (codeValue === 'BASIC' || codeValue === 'STANDARD' ||
        codeValue === 'PREMIUM' || codeValue === 'VIP') {
      return 20;
    }
    if (codeValue.startsWith('SINGLE_')) {
      return 1;
    }
    return 20;
  };

  /**
   * 패키지 코드에서 가격 추출
   */
  const getPackagePrice = (codeValue) => {
    const priceMap = {
      'BASIC': 200000,
      'STANDARD': 400000,
      'PREMIUM': 600000,
      'VIP': 1000000
    };

    if (priceMap[codeValue]) {
      return priceMap[codeValue];
    }
    if (codeValue.startsWith('SINGLE_')) {
      const priceStr = codeValue.replace('SINGLE_', '');
      const price = Number.parseInt(priceStr, 10);
      return Number.isNaN(price) ? 30000 : price;
    }
    return 200000;
  };

  /**
   * 패키지 카드 클릭 처리
   */
  const handlePackageSelect = (pkg) => {
    setFormData({
      packageName: pkg.value,
      packagePrice: pkg.price,
      totalSessions: pkg.sessions
    });
    if (errors.packageName) {
      setErrors(prev => ({ ...prev, packageName: '' }));
    }
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.packageName.trim()) {
      newErrors.packageName = '패키지를 선택해주세요.';
    }
    if (formData.packageName && (!formData.packagePrice || !formData.totalSessions)) {
      newErrors.packageName = '패키지 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 매칭 수정 처리
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/admin/mappings/${mapping.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: formData.packageName,
          packagePrice: Number.parseFloat(formData.packagePrice),
          totalSessions: Number.parseInt(formData.totalSessions, 10)
        })
      });

      const result = await response.json();

      if (result.success) {
        notificationManager.show(result.message || '매칭 정보가 성공적으로 수정되었습니다.', 'success');
        onSuccess && onSuccess(result.data);
        onClose();
      } else {
        notificationManager.show(result.message || '매칭 수정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('매칭 수정 실패:', error);
      notificationManager.show('매칭 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    if (!loading) {
      setFormData({ packageName: '', packagePrice: '', totalSessions: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !mapping) {
    return null;
  }

  const statusLabel = getMappingStatusKoreanNameSync(mapping.status);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="매칭 정보 수정"
      size="medium"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <button
            type="button"
            className="mg-v2-button mg-v2-button-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            <XCircle size={18} />
            취소
          </button>
          <button
            type="button"
            className="mg-v2-button mg-v2-button-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span>수정 중...</span>
            ) : (
              <>
                <Edit3 size={18} />
                수정 완료
              </>
            )}
          </button>
        </>
      }
    >
        <div className="mg-v2-modal-body">
          {/* 현재 매칭 정보 섹션 - B0KlA 카드, 섹션 제목, 악센트 바 */}
          <section className="mg-v2-ad-b0kla__card mg-v2-mapping-edit-modal__section">
            <h3 className="mg-v2-ad-b0kla__section-title">
              <Package2 size={18} className="mg-v2-mapping-edit-modal__section-title-icon" />
              현재 매칭 정보
            </h3>
            <div className="mg-v2-info-grid">
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label"><User size={14} className="mg-v2-mapping-edit-modal__section-title-icon" />상담사</span>
                <span className="mg-v2-info-value">{mapping.consultantName || '-'}</span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label"><User size={14} className="mg-v2-mapping-edit-modal__section-title-icon" />내담자</span>
                <span className="mg-v2-info-value">{mapping.clientName || '-'}</span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label">상태</span>
                <span className={`mg-v2-badge ${getStatusBadgeClass(mapping.status)}`}>
                  {statusLabel || mapping.status || '-'}
                </span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label">패키지</span>
                <span className="mg-v2-info-value">{mapping.packageName || '-'}</span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label"><DollarSign size={14} className="mg-v2-mapping-edit-modal__section-title-icon" />금액</span>
                <span className="mg-v2-mapping-edit-modal__value-emphasis">
                  {mapping.packagePrice == null ? '-' : `${Number(mapping.packagePrice).toLocaleString()}원`}
                </span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label"><Calendar size={14} className="mg-v2-mapping-edit-modal__section-title-icon" />회기수</span>
                <span className="mg-v2-mapping-edit-modal__value-emphasis">
                  {mapping.totalSessions == null ? '-' : `${mapping.totalSessions}회기`}
                </span>
              </div>
              <div className="mg-v2-info-row">
                <span className="mg-v2-info-label"><CalendarDays size={14} className="mg-v2-mapping-edit-modal__section-title-icon" />시작일</span>
                <span className="mg-v2-info-value">
                  {formatDate(mapping.startDate || mapping.createdAt)}
                </span>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit}>
            {/* 패키지 선택 - 카드형, 선택 시 좌측 악센트 */}
            <section className="mg-v2-ad-b0kla__card mg-v2-mapping-edit-modal__section">
              <h3 className="mg-v2-ad-b0kla__section-title">
              <Package2 size={18} className="mg-v2-mapping-edit-modal__section-title-icon" />
              패키지 변경
            </h3>
              <div className="mg-v2-mapping-edit-modal__package-grid">
                {packageOptions.map(pkg => (
                  <button
                    key={pkg.value}
                    type="button"
                    className={`mg-v2-mapping-edit-modal__package-card ${formData.packageName === pkg.value ? 'mg-v2-mapping-edit-modal__package-card--selected' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                    disabled={loading}
                  >
                    <span className="mg-v2-mapping-edit-modal__package-card-label">{pkg.label}</span>
                    <span className="mg-v2-mapping-edit-modal__package-card-meta">
                      {pkg.sessions}회기 · {pkg.price.toLocaleString()}원
                    </span>
                  </button>
                ))}
              </div>
              {errors.packageName && (
                <span className="mg-v2-form-error">{errors.packageName}</span>
              )}
            </section>

            {/* 선택된 패키지 요약 - 금액·회기수 강조 */}
            {(formData.packageName && (formData.packagePrice || formData.totalSessions)) && (
              <section className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent mg-v2-mapping-edit-modal__section mg-v2-mapping-edit-modal__change-summary">
                <h4 className="mg-v2-ad-b0kla__section-title mg-v2-mapping-edit-modal__change-summary-title">
                  변경 예정
                </h4>
                <div className="mg-v2-info-grid">
                  <div className="mg-v2-info-row">
                    <span className="mg-v2-info-label">패키지 가격</span>
                    <span className="mg-v2-mapping-edit-modal__value-emphasis">
                      {Number(formData.packagePrice || 0).toLocaleString()}원
                    </span>
                  </div>
                  <div className="mg-v2-info-row">
                    <span className="mg-v2-info-label">총 회기 수</span>
                    <span className="mg-v2-mapping-edit-modal__value-emphasis">
                      {formData.totalSessions}회기
                    </span>
                  </div>
                </div>
                <div className="mg-v2-form-help">
                  패키지 선택 시 자동으로 설정됩니다
                </div>
              </section>
            )}

            {/* 주의사항 */}
            <div className="mg-v2-alert mg-v2-alert--warning mg-v2-mapping-edit-modal__alert">
              <AlertCircle size={20} className="mg-v2-section-title-icon" />
              <div>
                <strong>주의사항:</strong>
                <ul>
                  <li>매칭 정보 수정 시 ERP 시스템의 모든 관련 데이터가 자동으로 업데이트됩니다.</li>
                  <li>회기 수 변경 시 남은 회기 수와 사용된 회기 수가 재계산됩니다.</li>
                  <li>가격 변경 시 회계 데이터가 자동으로 반영됩니다.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
    </UnifiedModal>
  );
};

export default MappingEditModal;
