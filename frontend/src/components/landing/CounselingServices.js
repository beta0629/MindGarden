/**
 * 상담센터 랜딩페이지 - 서비스 섹션
 * 한글 번역 및 수채화 테마 적용
 */

import React from 'react';
import MGCard from '../common/MGCard';
import './CounselingServices.css';

const services = [
  {
    icon: '👤',
    title: '개인 상담',
    description: '개인의 고유한 필요와 목표에 맞춘 일대일 상담으로 개인적 성장과 치유를 돕습니다.',
  },
  {
    icon: '💕',
    title: '부부 상담',
    description: '개선된 소통과 깊은 이해를 통해 관계를 강화하는 상담 서비스입니다.',
  },
  {
    icon: '🏠',
    title: '가족 상담',
    description: '지지적인 환경에서 더 건강한 가족 역학을 구축하고 갈등을 해결합니다.',
  },
  {
    icon: '👥',
    title: '그룹 상담',
    description: '안전하고 지지적인 그룹 환경에서 비슷한 도전에 직면한 다른 사람들과 연결됩니다.',
  },
  {
    icon: '💻',
    title: '온라인 상담',
    description: '안전한 화상 상담을 통해 집에서 편안하게 전문적인 치료에 접근할 수 있습니다.',
  },
  {
    icon: '📅',
    title: '유연한 예약',
    description: '바쁜 일정에 맞춰 저녁과 주말 예약도 가능합니다.',
  },
];

const CounselingServices = () => {
  return (
    <section className="counseling-services">
      <div className="counseling-services__container">
        <div className="counseling-services__header">
          <h2 className="counseling-services__title">우리의 서비스</h2>
          <p className="counseling-services__subtitle">
            여러분의 고유한 여정에 맞춘 포괄적인 정신건강 지원
          </p>
        </div>

        <div className="counseling-services__grid">
          {services.map((service, index) => (
            <MGCard
              key={index}
              variant="glass"
              padding="large"
              className="counseling-services__card"
            >
              <div className="counseling-services__card-header">
                <div className="counseling-services__icon">
                  {service.icon}
                </div>
                <h3 className="counseling-services__card-title">{service.title}</h3>
              </div>
              <div className="counseling-services__card-content">
                <p className="counseling-services__description">{service.description}</p>
              </div>
            </MGCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounselingServices;



