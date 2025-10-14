import React from 'react';
import { Star } from 'lucide-react';

const CardShowcase = () => {
  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">카드 스타일</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Basic Card */}
        <div className="mg-card">
          <h4 className="mg-h4">Basic Card</h4>
          <p className="mg-body-medium">기본 카드 스타일입니다. 깔끔하고 심플한 디자인을 제공합니다.</p>
          <button className="mg-button mg-button-primary mg-mt-md">자세히 보기</button>
        </div>
        
        {/* Glass Card */}
        <div className="mg-card mg-card-glass">
          <h4 className="mg-h4">Glass Card</h4>
          <p className="mg-body-medium">글라스모피즘 효과가 적용된 카드입니다. 배경이 흐릿하게 보입니다.</p>
          <button className="mg-button mg-button-outline mg-mt-md">자세히 보기</button>
        </div>
        
        {/* Gradient Card */}
        <div className="mg-card mg-card-gradient">
          <h4 className="mg-h4">Gradient Card</h4>
          <p className="mg-body-medium">그라데이션 배경이 적용된 카드입니다. 시선을 끄는 디자인입니다.</p>
          <button className="mg-button mg-button-secondary mg-mt-md">자세히 보기</button>
        </div>
        
        {/* Floating Card */}
        <div className="mg-card mg-card-floating">
          <h4 className="mg-h4">Floating Card</h4>
          <p className="mg-body-medium">강한 그림자 효과로 떠있는 느낌을 주는 카드입니다.</p>
          <button className="mg-button mg-button-primary mg-mt-md">자세히 보기</button>
        </div>
        
        {/* Border Card */}
        <div className="mg-card mg-card-border">
          <h4 className="mg-h4">Border Card</h4>
          <p className="mg-body-medium">테두리가 강조된 카드입니다. 명확한 구분을 제공합니다.</p>
          <button className="mg-button mg-button-outline mg-mt-md">자세히 보기</button>
        </div>
        
        {/* Animated Card with Icon */}
        <div className="mg-card">
          <div className="mg-flex-center mg-gap-sm mg-mb-sm">
            <Star size={24} color="#808000" fill="#808000" />
            <h4 className="mg-h4" style={{ margin: 0 }}>Featured Card</h4>
          </div>
          <p className="mg-body-medium">호버 시 애니메이션 효과가 있는 카드입니다.</p>
          <button className="mg-button mg-button-primary mg-mt-md">자세히 보기</button>
        </div>
      </div>
    </section>
  );
};

export default CardShowcase;

