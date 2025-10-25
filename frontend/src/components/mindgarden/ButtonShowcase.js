import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { Heart, Download, Settings } from 'lucide-react';

const ButtonShowcase = () => {
  return (
    <section className="mg-v2-section">
      <h2 className="mg-h2 mg-v2-text-center mg-mb-lg">버튼 스타일</h2>
      
      <div className="mg-card mg-p-xl">
        <div className="mg-mb-lg">
          <h4 className="mg-h4 mg-mb-md">버튼 변형</h4>
          <div className="mg-flex mg-gap-md" style={{ flexWrap: 'wrap' }}>
            <button className="mg-button mg-button-primary">Primary Button</button>
            <button className="mg-button mg-button-secondary">Secondary Button</button>
            <button className="mg-button mg-button-danger">Danger Button</button>
            <button className="mg-button mg-button-outline">Outline Button</button>
            <button className="mg-button mg-button-ghost">Ghost Button</button>
          </div>
        </div>
        
        <div className="mg-mb-lg">
          <h4 className="mg-h4 mg-mb-md">버튼 크기</h4>
          <div className="mg-flex mg-gap-md" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="mg-button mg-button-primary mg-button-small">Small</button>
            <button className="mg-button mg-button-primary">Medium</button>
            <button className="mg-button mg-button-primary mg-button-large">Large</button>
          </div>
        </div>
        
        <div className="mg-mb-lg">
          <h4 className="mg-h4 mg-mb-md">아이콘 버튼</h4>
          <div className="mg-flex mg-gap-md" style={{ flexWrap: 'wrap' }}>
            <button className="mg-button mg-button-primary">
              <Heart size={20} />
              좋아요
            </button>
            <button className="mg-button mg-button-secondary">
              <Download size={20} />
              다운로드
            </button>
            <button className="mg-button mg-button-outline">
              <Settings size={20} />
              설정
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="mg-h4 mg-mb-md">비활성 상태</h4>
          <div className="mg-flex mg-gap-md" style={{ flexWrap: 'wrap' }}>
            <button className="mg-button mg-button-primary" disabled>Disabled Primary</button>
            <button className="mg-button mg-button-secondary" disabled>Disabled Secondary</button>
            <button className="mg-button mg-button-outline" disabled>Disabled Outline</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ButtonShowcase;

