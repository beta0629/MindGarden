/**
 * MindGarden 상담센터 랜딩페이지
 * v0.dev에서 생성된 상담센터 템플릿을 한글로 번역하고 수채화 테마 적용
 */

import React from 'react';
import CounselingHero from '../components/landing/CounselingHero';
import CounselingServices from '../components/landing/CounselingServices';
import CounselingAbout from '../components/landing/CounselingAbout';
import CounselingTestimonials from '../components/landing/CounselingTestimonials';
import CounselingProcess from '../components/landing/CounselingProcess';
import CounselingContact from '../components/landing/CounselingContact';
import './CounselingCenterLanding.css';

const CounselingCenterLanding = () => {
  return (
    <div className="counseling-landing">
      <CounselingHero />
      <CounselingServices />
      <CounselingAbout />
      <CounselingTestimonials />
      <CounselingProcess />
      <CounselingContact />
    </div>
  );
};

export default CounselingCenterLanding;



