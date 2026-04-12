'use client';

import { useState } from 'react';

interface ConsultationFormData {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: 'phone' | 'email' | 'kakao';
  inquiryType: 'general' | 'adhd' | 'coaching' | 'family';
  referralSource: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
  tags: string[]; // 해시태그 배열 추가
}

// 기본 해시태그 옵션
const DEFAULT_TAGS = [
  'ADHD',
  '주의력 결핍',
  '과잉행동',
  '충동성',
  '학습 문제',
  '정서 조절',
  '대인관계',
  '가족 상담',
  '부모 상담',
  '코칭',
  '심리검사',
  '기타',
];

export default function ConsultationForm() {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<ConsultationFormData>({
    name: '',
    phone: '',
    email: '',
    preferredContactMethod: 'phone',
    inquiryType: 'general',
    referralSource: '',
    message: '',
    preferredDate: getTodayDate(), // 오늘 날짜를 기본값으로 설정
    preferredTime: '',
    tags: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // 폼 초기화
        setFormData({
          name: '',
          phone: '',
          email: '',
          preferredContactMethod: 'phone',
          inquiryType: 'general',
          referralSource: '',
          message: '',
          preferredDate: getTodayDate(), // 초기화 시에도 오늘 날짜로 설정
          preferredTime: '',
          tags: [],
        });
        // 5초 후 성공 메시지 숨기기
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || '상담 문의 접수에 실패했습니다.');
      }
    } catch (err) {
      setError('상담 문의 접수 중 오류가 발생했습니다.');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="consultation-form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {success && (
        <div className="form-success">
          상담 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            이름 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="form-input"
            placeholder="홍길동"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            전화번호 <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="form-input"
            placeholder="010-1234-5678"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            이메일
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="form-input"
            placeholder="example@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="preferredContactMethod" className="form-label">
            선호 연락 방법
          </label>
          <select
            id="preferredContactMethod"
            value={formData.preferredContactMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredContactMethod: e.target.value as any }))}
            className="form-input"
          >
            <option value="phone">전화</option>
            <option value="email">이메일</option>
            <option value="kakao">카카오톡</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="inquiryType" className="form-label">
            문의 유형
          </label>
          <select
            id="inquiryType"
            value={formData.inquiryType}
            onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value as any }))}
            className="form-input"
          >
            <option value="general">일반 상담</option>
            <option value="adhd">ADHD 개인 상담</option>
            <option value="coaching">코칭(실행 전략)</option>
            <option value="family">가족/부모 상담</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="referralSource" className="form-label">
            유입 경로
          </label>
          <select
            id="referralSource"
            value={formData.referralSource}
            onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
            className="form-input"
          >
            <option value="">선택 안함</option>
            <option value="homepage">홈페이지</option>
            <option value="search_google">검색엔진 (구글)</option>
            <option value="search_naver">검색엔진 (네이버)</option>
            <option value="sns_instagram">SNS (인스타그램)</option>
            <option value="sns_facebook">SNS (페이스북)</option>
            <option value="sns_kakao">SNS (카카오톡)</option>
            <option value="blog">블로그</option>
            <option value="mom_cafe">맘카페</option>
            <option value="referral">지인 소개</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="preferredDate" className="form-label">
            희망 상담 일자
          </label>
          <input
            type="date"
            id="preferredDate"
            value={formData.preferredDate}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label htmlFor="preferredTime" className="form-label">
            희망 상담 시간
          </label>
          <select
            id="preferredTime"
            value={formData.preferredTime}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
            className="form-input"
          >
            <option value="">선택 안함</option>
            <option value="morning">오전 (9시-12시)</option>
            <option value="afternoon">오후 (12시-6시)</option>
            <option value="evening">저녁 (6시-9시)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          문의 내용
        </label>
        
        {/* 해시태그 선택 영역 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-sub)',
            marginBottom: '12px',
          }}>
            기본사항을 선택하세요 (다중 선택 가능)
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {DEFAULT_TAGS.map((tag) => {
              const isSelected = formData.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      // 해시태그 제거
                      setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag),
                      }));
                    } else {
                      // 해시태그 추가
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag],
                      }));
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--accent-sky)' : 'var(--border-soft)'}`,
                    backgroundColor: isSelected ? 'rgba(89, 142, 62, 0.2)' : 'var(--surface-0)',
                    color: isSelected ? 'var(--accent-sky)' : 'var(--text-main)',
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--accent-sky)';
                      e.currentTarget.style.backgroundColor = 'rgba(89, 142, 62, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-soft)';
                      e.currentTarget.style.backgroundColor = 'var(--surface-0)';
                    }
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 해시태그 표시 */}
        {formData.tags.length > 0 && (
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-pastel-1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-soft)',
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              marginBottom: '8px',
            }}>
              선택된 항목:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 문의 내용 텍스트 영역 */}
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          className="form-input"
          rows={5}
          placeholder="상담하고 싶은 내용을 자유롭게 작성해주세요."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="form-submit"
      >
        {submitting ? '접수 중...' : '상담 문의 접수'}
      </button>
    </form>
  );
}

