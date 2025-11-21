/**
 * 학원 시스템 - 수강 등록/수정 폼 컴포넌트
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
import { ACADEMY_API, ACADEMY_MESSAGES } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import './Academy.css';

const EnrollmentForm = ({ enrollment, branchId, classId, consumerId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    branchId: branchId || null,
    classId: classId || '',
    consumerId: consumerId || null,
    enrollmentDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    tuitionPlanId: '',
    tuitionAmount: 0,
    paymentStatus: 'PENDING',
    status: 'ACTIVE',
    notes: '',
    settingsJson: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [consumers, setConsumers] = useState([]);

  // 반 목록 및 수강생 목록 로드
  useEffect(() => {
    if (branchId) {
      fetchClasses();
      fetchConsumers();
    }
  }, [branchId]);

  useEffect(() => {
    if (enrollment) {
      setFormData({
        branchId: enrollment.branchId || branchId || null,
        classId: enrollment.classId || classId || '',
        consumerId: enrollment.consumerId || consumerId || null,
        enrollmentDate: enrollment.enrollmentDate || new Date().toISOString().split('T')[0],
        startDate: enrollment.startDate || '',
        endDate: enrollment.endDate || '',
        tuitionPlanId: enrollment.tuitionPlanId || '',
        tuitionAmount: enrollment.tuitionAmount || 0,
        paymentStatus: enrollment.paymentStatus || 'PENDING',
        status: enrollment.status || 'ACTIVE',
        notes: enrollment.notes || '',
        settingsJson: enrollment.settingsJson || ''
      });
    }
  }, [enrollment, branchId, classId, consumerId]);

  const fetchClasses = async () => {
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.CLASS_LIST}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setClasses(data.data || []);
      }
    } catch (err) {
      console.error('반 목록 조회 실패:', err);
    }
  };

  const fetchConsumers = async () => {
    // 수강생 목록은 별도 API가 필요할 수 있음 (현재는 빈 배열)
    // TODO: 수강생 목록 API 연동
    setConsumers([]);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 유효성 검사
    if (!formData.branchId) {
      setError('지점을 선택해주세요.');
      setLoading(false);
      return;
    }

    if (!formData.classId) {
      setError('반을 선택해주세요.');
      setLoading(false);
      return;
    }

    if (!formData.enrollmentDate) {
      setError('등록일을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const url = enrollment 
        ? `${API_BASE_URL}${ACADEMY_API.ENROLLMENT_UPDATE(enrollment.enrollmentId)}`
        : `${API_BASE_URL}${ACADEMY_API.ENROLLMENT_CREATE}`;
      
      const method = enrollment ? 'PUT' : 'POST';

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
        if (onSave) {
          onSave(data.data);
        }
      } else {
        setError(data.message || ACADEMY_MESSAGES.ENROLLMENT_SAVE_FAILED);
      }
    } catch (err) {
      console.error('수강 등록 저장 실패:', err);
      setError(ACADEMY_MESSAGES.ENROLLMENT_SAVE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="academy-enrollment-form">
      <Card>
        <Card.Header>
          <h3>{enrollment ? '수강 등록 수정' : '수강 등록'}</h3>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            {/* 에러 메시지 */}
            {error && <ErrorState message={error} />}

            {/* 지점 ID */}
            <FormField
              type="number"
              label="지점 ID"
              name="branchId"
              value={formData.branchId || ''}
              onChange={handleChange}
              required
              disabled={!!branchId}
            />

            {/* 반 선택 */}
            <FormField
              type="select"
              label="반"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              required
              disabled={!!classId}
              options={[
                { value: '', label: '반을 선택하세요' },
                ...classes.map(cls => ({
                  value: cls.classId,
                  label: cls.name || cls.nameKo || cls.classId
                }))
              ]}
            />

            {/* 수강생 ID */}
            <FormField
              type="number"
              label="수강생 ID"
              name="consumerId"
              value={formData.consumerId || ''}
              onChange={handleChange}
            />

            {/* 등록일 */}
            <FormField
              type="date"
              label="등록일"
              name="enrollmentDate"
              value={formData.enrollmentDate}
              onChange={handleChange}
              required
            />

            {/* 수강 시작일 */}
            <FormField
              type="date"
              label="수강 시작일"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />

            {/* 수강 종료일 */}
            <FormField
              type="date"
              label="수강 종료일"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />

            {/* 수강료 플랜 ID */}
            <FormField
              type="text"
              label="수강료 플랜 ID"
              name="tuitionPlanId"
              value={formData.tuitionPlanId}
              onChange={handleChange}
            />

            {/* 수강료 금액 */}
            <FormField
              type="number"
              label="수강료 금액"
              name="tuitionAmount"
              value={formData.tuitionAmount}
              onChange={handleChange}
              min={0}
              step={0.01}
            />

            {/* 결제 상태 */}
            <FormField
              type="select"
              label="결제 상태"
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              options={[
                { value: 'PENDING', label: '대기중' },
                { value: 'PAID', label: '결제완료' },
                { value: 'PARTIAL', label: '부분결제' },
                { value: 'OVERDUE', label: '연체' },
                { value: 'CANCELLED', label: '취소' }
              ]}
            />

            {/* 수강 상태 */}
            <FormField
              type="select"
              label="수강 상태"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'DRAFT', label: '초안' },
                { value: 'ACTIVE', label: '수강중' },
                { value: 'PAUSED', label: '휴원' },
                { value: 'COMPLETED', label: '완료' },
                { value: 'CANCELLED', label: '취소' },
                { value: 'TRANSFERRED', label: '전원' }
              ]}
            />

            {/* 비고 */}
            <FormField
              type="textarea"
              label="비고"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />

            {/* 버튼 */}
            <div className="academy-form-actions">
              <MGButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {enrollment ? '수정' : '등록'}
              </MGButton>
              <MGButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </MGButton>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EnrollmentForm;
