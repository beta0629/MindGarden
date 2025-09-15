import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ConsultationGuideModal.css';

const ConsultationGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="consultation-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="bi bi-book"></i>
            상담 가이드
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="guide-section">
            <h3>
              <i className="bi bi-info-circle"></i>
              상담 전 준비사항
            </h3>
            <ul className="guide-list">
              <li>
                <i className="bi bi-check-circle"></i>
                <span>편안한 장소에서 조용한 환경을 준비해주세요</span>
              </li>
              <li>
                <i className="bi bi-check-circle"></i>
                <span>상담 시간 10분 전에 미리 준비해주세요</span>
              </li>
              <li>
                <i className="bi bi-check-circle"></i>
                <span>상담하고 싶은 주제나 고민을 미리 정리해보세요</span>
              </li>
              <li>
                <i className="bi bi-check-circle"></i>
                <span>충분한 시간을 확보해주세요 (최소 50분)</span>
              </li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>
              <i className="bi bi-heart"></i>
              상담 중 주의사항
            </h3>
            <ul className="guide-list">
              <li>
                <i className="bi bi-shield-check"></i>
                <span>솔직하고 진정성 있게 이야기해주세요</span>
              </li>
              <li>
                <i className="bi bi-shield-check"></i>
                <span>상담사님의 질문에 최대한 구체적으로 답변해주세요</span>
              </li>
              <li>
                <i className="bi bi-shield-check"></i>
                <span>궁금한 점이 있으면 언제든지 물어보세요</span>
              </li>
              <li>
                <i className="bi bi-shield-check"></i>
                <span>상담 내용은 비밀이 보장됩니다</span>
              </li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>
              <i className="bi bi-lightbulb"></i>
              효과적인 상담을 위한 팁
            </h3>
            <ul className="guide-list">
              <li>
                <i className="bi bi-star"></i>
                <span>상담 후 받은 조언을 일상에서 실천해보세요</span>
              </li>
              <li>
                <i className="bi bi-star"></i>
                <span>상담 일지를 작성해보세요</span>
              </li>
              <li>
                <i className="bi bi-star"></i>
                <span>규칙적인 상담을 통해 지속적인 변화를 만들어가세요</span>
              </li>
              <li>
                <i className="bi bi-star"></i>
                <span>상담사님과의 신뢰 관계를 쌓아가세요</span>
              </li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>
              <i className="bi bi-telephone"></i>
              기술적 준비사항
            </h3>
            <ul className="guide-list">
              <li>
                <i className="bi bi-wifi"></i>
                <span>안정적인 인터넷 연결을 확인해주세요</span>
              </li>
              <li>
                <i className="bi bi-camera-video"></i>
                <span>카메라와 마이크가 정상 작동하는지 확인해주세요</span>
              </li>
              <li>
                <i className="bi bi-battery-full"></i>
                <span>기기 배터리를 충분히 충전해주세요</span>
              </li>
              <li>
                <i className="bi bi-headphones"></i>
                <span>이어폰이나 헤드셋을 사용하면 더 좋습니다</span>
              </li>
            </ul>
          </div>

          <div className="guide-section">
            <h3>
              <i className="bi bi-question-circle"></i>
              자주 묻는 질문
            </h3>
            <div className="faq-list">
              <div className="faq-item">
                <div className="faq-question">
                  <i className="bi bi-question-circle-fill"></i>
                  <span>상담 시간을 변경할 수 있나요?</span>
                </div>
                <div className="faq-answer">
                  상담 시간 24시간 전까지는 변경 가능합니다. 상담사님께 메시지를 보내주세요.
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <i className="bi bi-question-circle-fill"></i>
                  <span>상담 내용이 비밀이 보장되나요?</span>
                </div>
                <div className="faq-answer">
                  네, 상담사님은 상담 내용에 대해 비밀을 지킬 의무가 있습니다.
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-question">
                  <i className="bi bi-question-circle-fill"></i>
                  <span>상담을 건너뛸 수 있나요?</span>
                </div>
                <div className="faq-answer">
                  상담을 건너뛰면 회기가 차감됩니다. 꼭 필요한 경우 상담사님께 미리 연락해주세요.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            <i className="bi bi-check-lg"></i>
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationGuideModal;
