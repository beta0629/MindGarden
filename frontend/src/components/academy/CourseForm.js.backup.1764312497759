/**
 * 학원 시스템 - 강좌 등록/수정 폼 컴포넌트
 * 공통 컴포넌트 사용, CSS와 비즈니스 로직 분리, 인라인 스타일 금지, 상수 사용
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card/Card';
import MGButton from '../common/MGButton';
import { FormField, ErrorState } from './shared';
import { ACADEMY_API, ACADEMY_MESSAGES, PRICING_POLICY, PRICING_POLICY_LABELS, ACADEMY_DEFAULTS, ACADEMY_FILTERS } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import './Academy.css';

const CourseForm = ({ course, branchId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    branchId: branchId || null,
    name: '',
    nameKo: '',
    nameEn: '',
    description: '',
    descriptionKo: '',
    descriptionEn: '',
    category: '',
    level: '',
    subject: '',
    pricingPolicy: PRICING_POLICY.FIXED,
    basePrice: 0,
    currency: 'KRW',
    pricingDetailsJson: '',
    durationMonths: null,
    totalSessions: null,
    sessionDurationMinutes: null,
    isActive: true,
    displayOrder: ACADEMY_DEFAULTS.DISPLAY_ORDER,
    metadataJson: '',
    settingsJson: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (course) {
      setFormData({
        branchId: course.branchId || branchId || null,
        name: course.name || '',
        nameKo: course.nameKo || '',
        nameEn: course.nameEn || '',
        description: course.description || '',
        descriptionKo: course.descriptionKo || '',
        descriptionEn: course.descriptionEn || '',
        category: course.category || '',
        level: course.level || '',
        subject: course.subject || '',
        pricingPolicy: course.pricingPolicy || PRICING_POLICY.FIXED,
        basePrice: course.basePrice || 0,
        currency: course.currency || 'KRW',
        pricingDetailsJson: course.pricingDetailsJson || '',
        durationMonths: course.durationMonths || null,
        totalSessions: course.totalSessions || null,
        sessionDurationMinutes: course.sessionDurationMinutes || null,
        isActive: course.isActive !== undefined ? course.isActive : true,
        displayOrder: course.displayOrder || ACADEMY_DEFAULTS.DISPLAY_ORDER,
        metadataJson: course.metadataJson || '',
        settingsJson: course.settingsJson || ''
      });
    }
  }, [course, branchId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = course 
        ? `${API_BASE_URL}${ACADEMY_API.COURSE_UPDATE(course.courseId)}`
        : `${API_BASE_URL}${ACADEMY_API.COURSE_CREATE}`;
      
      const method = course ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(course ? ACADEMY_MESSAGES.COURSE_UPDATE_SUCCESS : ACADEMY_MESSAGES.COURSE_CREATE_SUCCESS);
        if (onSave) onSave(data.data);
      } else {
        setError(data.message || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('강좌 저장 실패:', err);
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="academy-course-form">
      <Card>
        <Card.Header>
          <h3>{course ? '강좌 수정' : '강좌 등록'}</h3>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="academy-form">
            {/* 에러 메시지 */}
            {error && <ErrorState message={error} />}

            {/* 기본 정보 */}
            <div className="academy-form-row">
              <FormField
                type="text"
                label="강좌명"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                type="text"
                label="강좌명 (한글)"
                name="nameKo"
                value={formData.nameKo}
                onChange={handleChange}
              />
            </div>

            <div className="academy-form-row">
              <FormField
                type="select"
                label="카테고리"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: '', label: '선택하세요' },
                  ...ACADEMY_FILTERS.CATEGORIES
                ]}
              />
              <FormField
                type="select"
                label="과목"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                options={[
                  { value: '', label: '선택하세요' },
                  ...ACADEMY_FILTERS.SUBJECTS
                ]}
              />
            </div>

            {/* 가격 정보 */}
            <div className="academy-form-row">
              <FormField
                type="select"
                label="가격 정책"
                name="pricingPolicy"
                value={formData.pricingPolicy}
                onChange={handleChange}
                required
                options={Object.entries(PRICING_POLICY_LABELS).map(([key, label]) => ({
                  value: key,
                  label
                }))}
              />
              <FormField
                type="number"
                label="기본 가격"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                min={0}
              />
            </div>

            {/* 수강 정보 */}
            <div className="academy-form-row">
              <FormField
                type="number"
                label="수강 기간 (월)"
                name="durationMonths"
                value={formData.durationMonths || ''}
                onChange={handleChange}
                min={1}
              />
              <FormField
                type="number"
                label="총 수업 횟수"
                name="totalSessions"
                value={formData.totalSessions || ''}
                onChange={handleChange}
                min={1}
              />
              <FormField
                type="number"
                label="수업 시간 (분)"
                name="sessionDurationMinutes"
                value={formData.sessionDurationMinutes || ''}
                onChange={handleChange}
                min={1}
              />
            </div>

            {/* 설명 */}
            <FormField
              type="textarea"
              label="강좌 설명"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />

            {/* 활성화 여부 */}
            <div className="academy-form-group">
              <label className="academy-form-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                활성화
              </label>
            </div>

            {/* 액션 버튼 */}
            <div className="academy-form-actions">
              {onCancel && (
                <MGButton
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  취소
                </MGButton>
              )}
              <MGButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {course ? '수정' : '등록'}
              </MGButton>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CourseForm;
