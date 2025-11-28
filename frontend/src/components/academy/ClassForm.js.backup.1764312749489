/**
 * 학원 시스템 - 반 등록/수정 폼 컴포넌트
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
import { ACADEMY_API, ACADEMY_MESSAGES, CLASS_STATUS, CLASS_STATUS_LABELS, ACADEMY_DEFAULTS } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import './Academy.css';

const ClassForm = ({ classItem, branchId, courseId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    branchId: branchId || null,
    courseId: courseId || '',
    name: '',
    nameKo: '',
    nameEn: '',
    description: '',
    teacherId: null,
    teacherName: '',
    capacity: ACADEMY_DEFAULTS.CLASS_CAPACITY,
    startDate: '',
    endDate: '',
    room: '',
    status: CLASS_STATUS.DRAFT,
    isActive: true,
    optionsJson: '',
    settingsJson: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (classItem) {
      setFormData({
        branchId: classItem.branchId || branchId || null,
        courseId: classItem.courseId || courseId || '',
        name: classItem.name || '',
        nameKo: classItem.nameKo || '',
        nameEn: classItem.nameEn || '',
        description: classItem.description || '',
        teacherId: classItem.teacherId || null,
        teacherName: classItem.teacherName || '',
        capacity: classItem.capacity || ACADEMY_DEFAULTS.CLASS_CAPACITY,
        startDate: classItem.startDate || '',
        endDate: classItem.endDate || '',
        room: classItem.room || '',
        status: classItem.status || CLASS_STATUS.DRAFT,
        isActive: classItem.isActive !== undefined ? classItem.isActive : true,
        optionsJson: classItem.optionsJson || '',
        settingsJson: classItem.settingsJson || ''
      });
    }
  }, [classItem, branchId, courseId]);

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

    // 유효성 검사
    if (!formData.branchId) {
      setError(ACADEMY_MESSAGES.BRANCH_REQUIRED);
      setLoading(false);
      return;
    }

    if (!formData.courseId) {
      setError('강좌를 선택해주세요.');
      setLoading(false);
      return;
    }

    if (formData.capacity < 1) {
      setError(ACADEMY_MESSAGES.CAPACITY_INVALID);
      setLoading(false);
      return;
    }

    try {
      const url = classItem 
        ? `${API_BASE_URL}${ACADEMY_API.CLASS_UPDATE(classItem.classId)}`
        : `${API_BASE_URL}${ACADEMY_API.CLASS_CREATE}`;
      
      const method = classItem ? 'PUT' : 'POST';

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
        alert(classItem ? ACADEMY_MESSAGES.CLASS_UPDATE_SUCCESS : ACADEMY_MESSAGES.CLASS_CREATE_SUCCESS);
        if (onSave) onSave(data.data);
      } else {
        setError(data.message || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('반 저장 실패:', err);
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="academy-class-form">
      <Card>
        <Card.Header>
          <h3>{classItem ? '반 수정' : '반 등록'}</h3>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="academy-form">
            {/* 에러 메시지 */}
            {error && <ErrorState message={error} />}

            {/* 기본 정보 */}
            <div className="academy-form-row">
              <FormField
                type="text"
                label="반명"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                type="text"
                label="강좌 ID"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                disabled={!!courseId}
              />
            </div>

            {/* 강사 정보 */}
            <div className="academy-form-row">
              <FormField
                type="text"
                label="강사명"
                name="teacherName"
                value={formData.teacherName}
                onChange={handleChange}
              />
              <FormField
                type="text"
                label="강의실"
                name="room"
                value={formData.room}
                onChange={handleChange}
              />
            </div>

            {/* 정원 및 날짜 */}
            <div className="academy-form-row">
              <FormField
                type="number"
                label="정원"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min={1}
                required
              />
              <FormField
                type="date"
                label="시작일"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
              <FormField
                type="date"
                label="종료일"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            {/* 상태 */}
            <div className="academy-form-row">
              <FormField
                type="select"
                label="상태"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                options={Object.entries(CLASS_STATUS_LABELS).map(([key, label]) => ({
                  value: key,
                  label
                }))}
              />
            </div>

            {/* 설명 */}
            <FormField
              type="textarea"
              label="반 설명"
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
                {classItem ? '수정' : '등록'}
              </MGButton>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ClassForm;
