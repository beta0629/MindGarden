/**
 * 상담센터 랜딩페이지 - 후기 섹션
 */

import React from 'react';
import MGCard from '../common/MGCard';

const CounselingTestimonials = () => {
  return (
    <section className="counseling-testimonials">
      <div className="counseling-testimonials__container">
        <h2 className="counseling-testimonials__title">고객 후기</h2>
        <p className="counseling-testimonials__subtitle">
          MindGarden과 함께한 치유의 여정을 경험한 분들의 이야기
        </p>
        
        <div className="counseling-testimonials__grid">
          <MGCard variant="glass" padding="large">
            <p>"상담사님이 정말 따뜻하게 들어주셔서 마음이 편해졌어요."</p>
            <cite>- 김○○님</cite>
          </MGCard>
          
          <MGCard variant="glass" padding="large">
            <p>"온라인 상담도 정말 편리하고 효과적이었습니다."</p>
            <cite>- 이○○님</cite>
          </MGCard>
          
          <MGCard variant="glass" padding="large">
            <p>"가족 상담을 통해 관계가 많이 개선되었어요."</p>
            <cite>- 박○○님</cite>
          </MGCard>
        </div>
      </div>
    </section>
  );
};

export default CounselingTestimonials;



