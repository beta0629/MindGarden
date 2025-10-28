import React from 'react';
import ReactDOM from 'react-dom';
import { Users, XCircle, User, UserX, Check } from 'lucide-react';

/**
 * 상담사 목록 모달 컴포넌트
 */
const ConsultantListModal = ({ isOpen, onClose, consultantList }) => {
  if (!isOpen) return null;

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <Users size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">상담사 목록</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
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
                      <div className="mg-v2-list-item-title">{consultant.name}</div>
                      <div className="mg-v2-list-item-subtitle">{consultant.specialty || '상담 심리학'}</div>
                      {consultant.intro && (
                        <div className="mg-v2-list-item-description">{consultant.intro}</div>
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
                아직 연결된 상담사가 없습니다.<br/>
                상담사와 연결하여 상담을 시작해보세요.
              </p>
              <button
                className="mg-v2-btn mg-v2-btn--primary mg-v2-mt-md"
                onClick={onClose}
              >
                <Check size={20} className="mg-v2-icon-inline" />
                확인
              </button>
            </div>
          )}
        </div>

        <div className="mg-v2-modal-footer">
          <button 
            className="mg-v2-btn mg-v2-btn--ghost"
            onClick={onClose}
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            닫기
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default ConsultantListModal;
