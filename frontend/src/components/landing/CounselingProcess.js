/**
 * 상담센터 랜딩페이지 - 상담 과정 섹션
 */

import React from 'react';
import MGCard from '../common/MGCard';

const CounselingProcess = () => {
  const steps = [
    { number: 1, title: '초기 상담', description: '상담사와의 첫 만남으로 현재 상황을 파악합니다.' },
    { number: 2, title: '맞춤 계획', description: '개인에게 맞는 맞춤형 치료 계획을 수립합니다.' },
    { number: 3, title: '정기 상담', description: '규칙적인 상담을 통해 점진적인 변화를 이룹니다.' },
    { number: 4, title: '성장과 발전', description: '지속적인 성장과 발전을 위한 지원을 제공합니다.' }
  ];

  return (
    <section className="counseling-process">
      <div className="counseling-process__container">
        <h2 className="counseling-process__title">상담 과정</h2>
        <p className="counseling-process__subtitle">
          MindGarden과 함께하는 치유의 여정
        </p>
        
        <div className="counseling-process__steps">
          {steps.map((step, index) => (
            <MGCard key={index} variant="glass" padding="large" className="counseling-process__step">
              <div className="counseling-process__step-number">{step.number}</div>
              <h3 className="counseling-process__step-title">{step.title}</h3>
              <p className="counseling-process__step-description">{step.description}</p>
            </MGCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounselingProcess;



