import React from 'react';
import { Users, UserX, User, Check } from 'lucide-react';
import UnifiedModal from './modals/UnifiedModal';
import SafeText from './SafeText';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * 상담사 목록 모달 컴포넌트
 */
const ConsultantListModal = ({ isOpen, onClose, consultantList }) => {
  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="상담사 목록"
      size="auto"
      backdropClick={true}
      showCloseButton={true}
      actions={
        <button
          className="mg-v2-button mg-v2-button--ghost"
          onClick={onClose}
        >
          닫기
        </button>
      }
    >
      {consultantList && consultantList.length > 0 ? (
        <div className="mg-v2-form-section">
          <div className="mg-v2-info-box mg-v2-mb-md">
            <p className="mg-v2-text-sm mg-v2-text-secondary">
              총 <strong className="mg-v2-color-primary">{consultantList.length}명</strong>의 상담사가 있습니다
            </p>
          </div>
          <div className="mg-v2-list-container">
            {consultantList.map((consultant, index) => (
              <div key={index} className="mg-v2-list-item">
                <div className="mg-v2-list-item-avatar">
                  <User size={24} />
                </div>
                <div className="mg-v2-list-item-content">
                  <SafeText className="mg-v2-list-item-title" tag="div">{consultant.name}</SafeText>
                  <div className="mg-v2-list-item-subtitle">
                    {toDisplayString(
                      consultant.specialty || consultant.specialization || '상담 심리학'
                    )}
                  </div>
                  {consultant.intro && (
                    <div className="mg-v2-list-item-description">
                      {toDisplayString(consultant.intro)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mg-v2-empty-state">
          <UserX size={48} />
          <h3 className="mg-v2-text-lg mg-v2-font-semibold mg-v2-mt-md">상담사가 없습니다</h3>
          <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-mt-xs">
            아직 연결된 상담사가 없습니다.<br />
            상담사와 연결하여 상담을 시작해보세요.
          </p>
          <button
            className="mg-v2-button mg-v2-button--primary mg-v2-mt-md"
            onClick={onClose}
          >
            <Check size={20} className="mg-v2-icon-inline" />
            확인
          </button>
        </div>
      )}
    </UnifiedModal>
  );
};

export default ConsultantListModal;
