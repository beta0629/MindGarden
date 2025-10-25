import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';

const FormShowcase = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    service: '',
    newsletter: false,
    gender: '',
    notifications: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <section className="mg-v2-section">
      <h2 className="mg-h2 mg-v2-text-center mg-mb-lg">폼 요소</h2>
      
      <div className="mg-card mg-p-xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form>
          {/* Text Input */}
          <div className="mg-mb-md">
            <label className="mg-v2-label">이름</label>
            <input
              type="text"
              name="name"
              className="mg-input"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          {/* Email Input */}
          <div className="mg-mb-md">
            <label className="mg-v2-label">이메일</label>
            <input
              type="email"
              name="email"
              className="mg-input"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          {/* Textarea */}
          <div className="mg-mb-md">
            <label className="mg-v2-label">메시지</label>
            <textarea
              name="message"
              className="mg-v2-textarea"
              placeholder="메시지를 입력하세요"
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          
          {/* Select */}
          <div className="mg-mb-md">
            <label className="mg-v2-label">서비스 선택</label>
            <select
              name="service"
              className="mg-select"
              value={formData.service}
              onChange={handleChange}
            >
              <option value="">서비스를 선택하세요</option>
              <option value="counseling">심리 상담</option>
              <option value="coaching">코칭</option>
              <option value="therapy">치료</option>
            </select>
          </div>
          
          {/* Checkbox */}
          <div className="mg-mb-md">
            <label className="mg-flex mg-gap-sm" style={{ alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="newsletter"
                className="mg-checkbox"
                checked={formData.newsletter}
                onChange={handleChange}
              />
              <span className="mg-body-medium">뉴스레터 구독</span>
            </label>
          </div>
          
          {/* Radio Buttons */}
          <div className="mg-mb-md">
            <label className="mg-v2-label">성별</label>
            <div className="mg-flex mg-gap-md">
              <label className="mg-flex mg-gap-sm" style={{ alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  className="mg-radio"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                <span className="mg-body-medium">남성</span>
              </label>
              <label className="mg-flex mg-gap-sm" style={{ alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  className="mg-radio"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                <span className="mg-body-medium">여성</span>
              </label>
              <label className="mg-flex mg-gap-sm" style={{ alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  className="mg-radio"
                  checked={formData.gender === 'other'}
                  onChange={handleChange}
                />
                <span className="mg-body-medium">기타</span>
              </label>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mg-flex mg-gap-md mg-mt-lg">
            <button type="submit" className="mg-button mg-button-primary" style={{ flex: 1 }}>
              제출하기
            </button>
            <button type="reset" className="mg-button mg-button-outline">
              초기화
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default FormShowcase;

