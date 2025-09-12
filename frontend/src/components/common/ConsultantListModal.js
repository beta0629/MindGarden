import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 상담사 목록 모달 컴포넌트
 */
const ConsultantListModal = ({ isOpen, onClose, consultantList }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            상담사 목록
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* 상담사 목록 또는 안내 메시지 */}
        {consultantList && consultantList.length > 0 ? (
          <div>
            <div style={{
              fontSize: '14px',
              color: '#6c757d',
              marginBottom: '16px'
            }}>
              총 {consultantList.length}명의 상담사가 있습니다
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {consultantList.map((consultant, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <i className="bi bi-person" style={{
                      color: 'white',
                      fontSize: '16px'
                    }}></i>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '4px'
                    }}>
                      {consultant.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      {consultant.specialty || '상담 심리학'}
                    </div>
                    {consultant.intro && (
                      <div style={{
                        fontSize: '13px',
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
                fontSize: '32px',
                color: '#6c757d'
              }}></i>
            </div>
            
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 8px 0'
            }}>
              상담사가 없습니다
            </h3>
            
            <p style={{
              fontSize: '14px',
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
                fontSize: '14px',
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
