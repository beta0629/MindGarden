/**
 * 상담센터 랜딩페이지 - 연락처 섹션
 */

import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import MGCard from '../common/MGCard';

const CounselingContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // 폼 제출 로직
    console.log('상담 문의:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="counseling-contact">
      <div className="counseling-contact__container">
        <h2 className="counseling-contact__title">지금 시작해보세요</h2>
        <p className="counseling-contact__subtitle">
          MindGarden의 모든 서비스를 무료로 체험하고, 더 나은 상담 서비스를 경험해보세요
        </p>
        
        <div className="counseling-contact__content">
          <MGCard variant="glass" padding="large" className="counseling-contact__form-card">
            <h3>상담 문의하기</h3>
            <form onSubmit={handleSubmit} className="counseling-contact__form">
              <div className="counseling-contact__form-group">
                <label htmlFor="name">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="counseling-contact__form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="counseling-contact__form-group">
                <label htmlFor="phone">연락처</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="counseling-contact__form-group">
                <label htmlFor="message">문의 내용</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>
              
              <MGButton type="submit" variant="primary" size="large">
                문의하기
              </MGButton>
            </form>
          </MGCard>
          
          <div className="counseling-contact__info">
            <MGCard variant="glass" padding="large">
              <h3>연락처 정보</h3>
              <div className="counseling-contact__info-item">
                <strong>전화:</strong> 02-1234-5678
              </div>
              <div className="counseling-contact__info-item">
                <strong>이메일:</strong> info@mindgarden.com
              </div>
              <div className="counseling-contact__info-item">
                <strong>운영시간:</strong> 평일 9:00 - 18:00
              </div>
              <div className="counseling-contact__info-item">
                <strong>위치:</strong> 서울시 강남구 테헤란로 123
              </div>
            </MGCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounselingContact;



