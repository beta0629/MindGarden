import React from 'react';
import './ConsultationGuideModal.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ConsultationGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="consultation-guide-overlay" onClick={onClose}>
      <div className="consultation-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div 
          className="consultation-guide-header"
        >
          <h2 
            className="consultation-guide-title"
          >
            <i className="bi bi-book" style={{ color: '#17a2b8', fontSize: 'var(--font-size-xl)' }}></i>
            상담 가이드
          </h2>
          <button 
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--font-size-xl)',
              color: '#6c757d',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#6c757d';
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div 
          style={{
            padding: '32px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h3 
              style={{
                margin: '0 0 16px 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}
            >
              <i className="bi bi-info-circle" style={{ fontSize: 'var(--font-size-base)' }}></i>
              상담 전 준비사항
            </h3>
            <ul 
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-check-circle" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>편안한 장소에서 조용한 환경을 준비해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-check-circle" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담 시간 10분 전에 미리 준비해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-check-circle" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담하고 싶은 주제나 고민을 미리 정리해보세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: 'none'
                }}
              >
                <i className="bi bi-check-circle" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>충분한 시간을 확보해주세요 (최소 50분)</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 
              style={{
                margin: '0 0 16px 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}
            >
              <i className="bi bi-heart" style={{ fontSize: 'var(--font-size-base)' }}></i>
              상담 중 주의사항
            </h3>
            <ul 
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-shield-check" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>솔직하고 진정성 있게 이야기해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-shield-check" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담사님의 질문에 최대한 구체적으로 답변해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-shield-check" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>궁금한 점이 있으면 언제든지 물어보세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: 'none'
                }}
              >
                <i className="bi bi-shield-check" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담 내용은 비밀이 보장됩니다</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 
              style={{
                margin: '0 0 16px 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}
            >
              <i className="bi bi-lightbulb" style={{ fontSize: 'var(--font-size-base)' }}></i>
              효과적인 상담을 위한 팁
            </h3>
            <ul 
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-star" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담 후 받은 조언을 일상에서 실천해보세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-star" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담 일지를 작성해보세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-star" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>규칙적인 상담을 통해 지속적인 변화를 만들어가세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: 'none'
                }}
              >
                <i className="bi bi-star" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>상담사님과의 신뢰 관계를 쌓아가세요</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 
              style={{
                margin: '0 0 16px 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}
            >
              <i className="bi bi-telephone" style={{ fontSize: 'var(--font-size-base)' }}></i>
              기술적 준비사항
            </h3>
            <ul 
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-wifi" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>안정적인 인터넷 연결을 확인해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-camera-video" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>카메라와 마이크가 정상 작동하는지 확인해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}
              >
                <i className="bi bi-battery-full" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>기기 배터리를 충분히 충전해주세요</span>
              </li>
              <li 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: 'none'
                }}
              >
                <i className="bi bi-headphones" style={{ color: '#28a745', fontSize: 'var(--font-size-base)', marginTop: '2px', flexShrink: 0 }}></i>
                <span style={{ color: '#495057', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>이어폰이나 헤드셋을 사용하면 더 좋습니다</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '0' }}>
            <h3 
              style={{
                margin: '0 0 16px 0',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}
            >
              <i className="bi bi-question-circle" style={{ fontSize: 'var(--font-size-base)' }}></i>
              자주 묻는 질문
            </h3>
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div 
                style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #17a2b8'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <i className="bi bi-question-circle-fill" style={{ color: '#17a2b8', fontSize: 'var(--font-size-sm)' }}></i>
                  <span>상담 시간을 변경할 수 있나요?</span>
                </div>
                <div 
                  style={{
                    color: '#6c757d',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.5',
                    marginLeft: '22px'
                  }}
                >
                  상담 시간 24시간 전까지는 변경 가능합니다. 상담사님께 메시지를 보내주세요.
                </div>
              </div>
              <div 
                style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #17a2b8'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <i className="bi bi-question-circle-fill" style={{ color: '#17a2b8', fontSize: 'var(--font-size-sm)' }}></i>
                  <span>상담 내용이 비밀이 보장되나요?</span>
                </div>
                <div 
                  style={{
                    color: '#6c757d',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.5',
                    marginLeft: '22px'
                  }}
                >
                  네, 상담사님은 상담 내용에 대해 비밀을 지킬 의무가 있습니다.
                </div>
              </div>
              <div 
                style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #17a2b8'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <i className="bi bi-question-circle-fill" style={{ color: '#17a2b8', fontSize: 'var(--font-size-sm)' }}></i>
                  <span>상담을 건너뛸 수 있나요?</span>
                </div>
                <div 
                  style={{
                    color: '#6c757d',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.5',
                    marginLeft: '22px'
                  }}
                >
                  상담을 건너뛰면 회기가 차감됩니다. 꼭 필요한 경우 상담사님께 미리 연락해주세요.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          style={{
            padding: '24px 32px',
            borderTop: '1px solid #e9ecef',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: 'var(--font-size-base)',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: '#17a2b8',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = '#138496';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#17a2b8';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <i className="bi bi-check-lg"></i>
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationGuideModal;
