import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const AccordionShowcase = () => {
  const [openItems, setOpenItems] = useState([0]); // 첫 번째 아이템만 열림

  const accordionData = [
    {
      title: 'MindGarden이란 무엇인가요?',
      content: 'MindGarden은 정신 건강 지원을 위한 통합 플랫폼입니다. 전문 상담사와 클라이언트를 연결하고, 체계적인 상담 관리를 제공합니다.'
    },
    {
      title: '상담은 어떻게 진행되나요?',
      content: '온라인 예약 시스템을 통해 원하는 날짜와 시간을 선택하실 수 있습니다. 대면 또는 비대면 상담 중 선택 가능하며, 상담 전 간단한 사전 설문을 작성하게 됩니다.'
    },
    {
      title: '비용은 얼마인가요?',
      content: '상담 유형과 상담사의 경력에 따라 비용이 다릅니다. 일반 상담은 회당 50,000원부터 시작하며, 패키지 할인도 제공하고 있습니다.'
    },
    {
      title: '개인정보는 안전한가요?',
      content: '모든 개인정보는 암호화되어 저장되며, 상담 내용은 엄격한 비밀 보장 원칙에 따라 관리됩니다. GDPR 및 개인정보보호법을 준수합니다.'
    }
  ];

  const toggleItem = (index) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">아코디언</h2>
      
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="mg-accordion">
          {accordionData.map((item, index) => (
            <div key={index} className="mg-accordion-item">
              <button 
                className="mg-accordion-header"
                onClick={() => toggleItem(index)}
              >
                <span className="mg-accordion-title">{item.title}</span>
                <ChevronDown 
                  size={20} 
                  className={`mg-accordion-icon ${openItems.includes(index) ? 'open' : ''}`}
                />
              </button>
              <div className={`mg-accordion-content ${openItems.includes(index) ? 'open' : ''}`}>
                <div className="mg-accordion-body">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mg-card" style={{ marginTop: 'var(--spacing-xl)', background: 'var(--light-cream)' }}>
          <h4 className="mg-h4 mg-mb-sm">사용 가이드</h4>
          <ul style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: 1.8, color: 'var(--medium-gray)' }}>
            <li>각 항목을 클릭하면 내용이 펼쳐집니다</li>
            <li>여러 항목을 동시에 열 수 있습니다</li>
            <li>열린 항목을 다시 클릭하면 접힙니다</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AccordionShowcase;

