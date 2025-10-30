import React from 'react';
import ReactDOM from 'react-dom';
import { Book, XCircle, Check, Info, Heart, Lightbulb, Phone, Wifi, Video, Battery, Headphones, Shield, Circle } from 'lucide-react';

const ConsultationGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const guideItems = [
    {
      icon: Check,
      text: '편안한 장소에서 조용한 환경을 준비해주세요'
    },
    {
      icon: Check,
      text: '상담 시간 10분 전에 미리 준비해주세요'
    },
    {
      icon: Check,
      text: '상담하고 싶은 주제나 고민을 미리 정리해보세요'
    },
    {
      icon: Check,
      text: '충분한 시간을 확보해주세요 (최소 50분)'
    }
  ];

  const precautions = [
    {
      icon: Shield,
      text: '솔직하고 진정성 있게 이야기해주세요'
    },
    {
      icon: Shield,
      text: '상담사님의 질문에 최대한 구체적으로 답변해주세요'
    },
    {
      icon: Shield,
      text: '궁금한 점이 있으면 언제든지 물어보세요'
    },
    {
      icon: Shield,
      text: '상담 내용은 비밀이 보장됩니다'
    }
  ];

  const tips = [
    {
      icon: Lightbulb,
      text: '상담 후 받은 조언을 일상에서 실천해보세요'
    },
    {
      icon: Lightbulb,
      text: '상담 일지를 작성해보세요'
    },
    {
      icon: Lightbulb,
      text: '규칙적인 상담을 통해 지속적인 변화를 만들어가세요'
    },
    {
      icon: Lightbulb,
      text: '상담사님과의 신뢰 관계를 쌓아가세요'
    }
  ];

  const technicalItems = [
    {
      icon: Wifi,
      text: '안정적인 인터넷 연결을 확인해주세요'
    },
    {
      icon: Video,
      text: '카메라와 마이크가 정상 작동하는지 확인해주세요'
    },
    {
      icon: Battery,
      text: '기기 배터리를 충분히 충전해주세요'
    },
    {
      icon: Headphones,
      text: '이어폰이나 헤드셋을 사용하면 더 좋습니다'
    }
  ];

  const faqs = [
    {
      question: '상담 시간을 변경할 수 있나요?',
      answer: '상담 시간 24시간 전까지는 변경 가능합니다. 상담사님께 메시지를 보내주세요.'
    },
    {
      question: '상담 내용이 비밀이 보장되나요?',
      answer: '네, 상담사님은 상담 내용에 대해 비밀을 지킬 의무가 있습니다.'
    },
    {
      question: '상담을 건너뛸 수 있나요?',
      answer: '상담을 건너뛰면 회기가 차감됩니다. 꼭 필요한 경우 상담사님께 미리 연락해주세요.'
    }
  ];

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <Book size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">상담 가이드</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
          {/* 상담 전 준비사항 */}
          <div className="mg-v2-form-section mg-v2-mb-lg">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              <Info size={20} className="mg-v2-section-title-icon" />
              상담 전 준비사항
            </h3>
            <ul className="mg-v2-list-bullet">
              {guideItems.map((item, index) => (
                <li key={index} className="mg-v2-list-bullet-item">
                  <item.icon size={16} className="mg-v2-color-success mg-v2-icon-inline" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* 상담 중 주의사항 */}
          <div className="mg-v2-form-section mg-v2-mb-lg">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              <Heart size={20} className="mg-v2-section-title-icon" />
              상담 중 주의사항
            </h3>
            <ul className="mg-v2-list-bullet">
              {precautions.map((item, index) => (
                <li key={index} className="mg-v2-list-bullet-item">
                  <item.icon size={16} className="mg-v2-color-success mg-v2-icon-inline" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* 효과적인 상담을 위한 팁 */}
          <div className="mg-v2-form-section mg-v2-mb-lg">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              <Lightbulb size={20} className="mg-v2-section-title-icon" />
              효과적인 상담을 위한 팁
            </h3>
            <ul className="mg-v2-list-bullet">
              {tips.map((item, index) => (
                <li key={index} className="mg-v2-list-bullet-item">
                  <item.icon size={16} className="mg-v2-color-success mg-v2-icon-inline" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* 기술적 준비사항 */}
          <div className="mg-v2-form-section mg-v2-mb-lg">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              <Phone size={20} className="mg-v2-section-title-icon" />
              기술적 준비사항
            </h3>
            <ul className="mg-v2-list-bullet">
              {technicalItems.map((item, index) => (
                <li key={index} className="mg-v2-list-bullet-item">
                  <item.icon size={16} className="mg-v2-color-success mg-v2-icon-inline" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* 자주 묻는 질문 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              <Info size={20} className="mg-v2-section-title-icon" />
              자주 묻는 질문
            </h3>
            <div className="mg-v2-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="mg-v2-info-box">
                  <div className="mg-v2-faq-title">
                    <Circle size={14} className="mg-v2-color-primary mg-v2-icon-inline" />
                    {faq.question}
                  </div>
                  <div className="mg-v2-faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mg-v2-modal-footer">
          <button 
            className="mg-v2-button mg-v2-button--primary"
            onClick={onClose}
          >
            <Check size={20} className="mg-v2-icon-inline" />
            확인했습니다
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default ConsultationGuideModal;
