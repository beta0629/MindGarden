import React from 'react';
import './ConsultantListModal.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 상담사 목록 모달 컴포넌트
 */
const ConsultantListModal = ({ isOpen, onClose, consultantList }) => {
  if (!isOpen) return null;

  return (
    <div className="consultant-list-overlay">
      <div className="consultant-list-modal">
        {/* 헤더 */}
        <div className="consultant-list-modal-header">
          <h2 className="consultant-list-modal-title">
            상담사 목록
          </h2>
          <button
            onClick={onClose}
            className="consultant-list-modal-close"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* 상담사 목록 또는 안내 메시지 */}
        {consultantList && consultantList.length > 0 ? (
          <div>
            <div className="consultant-list-count">
              총 {consultantList.length}명의 상담사가 있습니다
            </div>
            
            <div className="consultant-list-items">
              {consultantList.map((consultant, index) => (
                <div
                  key={index}
                  className="consultant-list-item"
                >
                  <div className="consultant-list-avatar">
                    <i className="bi bi-person consultant-list-avatar-icon"></i>
                  </div>
                  
                  <div className="consultant-list-info">
                    <div className="consultant-list-name">
                      {consultant.name}
                    </div>
                    <div className="consultant-list-specialty">
                      {consultant.specialty || '상담 심리학'}
                    </div>
                    {consultant.intro && (
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#868e96',
                        marginTop: '4px',
                        lineHeight: '1.4'
                      }}>
                        {consultant.intro}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '2px solid #e9ecef'
            }}>
              <i className="bi bi-person-x" style={{
                fontSize: 'var(--font-size-xxxl)',
                color: '#6c757d'
              }}></i>
            </div>
            
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 8px 0'
            }}>
              상담사가 없습니다
            </h3>
            
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: '#6c757d',
              margin: '0 0 20px 0',
              lineHeight: '1.5'
            }}>
              아직 연결된 상담사가 없습니다.<br/>
              상담사와 연결하여 상담을 시작해보세요.
            </p>
            
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5a6fd8';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#667eea';
              }}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantListModal;
