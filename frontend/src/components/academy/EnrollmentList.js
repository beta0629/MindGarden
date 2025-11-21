/**
 * 학원 시스템 - 수강 등록 목록 컴포넌트
 * 공통 컴포넌트 사용, CSS와 비즈니스 로직 분리, 인라인 스타일 금지, 상수 사용
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card/Card';
import MGButton from '../common/MGButton';
import { DataTable, ErrorState } from './shared';
import { ACADEMY_API, ACADEMY_MESSAGES } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import './Academy.css';

const EnrollmentList = ({ branchId, classId, consumerId, onEnrollmentSelect, onCreateEnrollment }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 수강 등록 목록 조회
  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (classId) params.append('classId', classId);
      if (consumerId) params.append('consumerId', consumerId);
      
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.ENROLLMENT_LIST}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEnrollments(data.data || []);
      } else {
        setError(data.message || '수강 등록 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('수강 등록 목록 조회 실패:', err);
      setError('수강 등록 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [branchId, classId, consumerId]);

  // 수강 취소
  const handleCancel = async (enrollmentId) => {
    if (!window.confirm('정말 수강을 취소하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.ENROLLMENT_CANCEL(enrollmentId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(ACADEMY_MESSAGES.ENROLLMENT_CANCEL_SUCCESS);
        fetchEnrollments();
      } else {
        alert(data.message || '수강 취소에 실패했습니다.');
      }
    } catch (err) {
      console.error('수강 취소 실패:', err);
      alert('수강 취소 중 오류가 발생했습니다.');
    }
  };

  // 테이블 컬럼 정의
  const columns = [
    { key: 'enrollmentId', label: '등록 ID', render: (enrollment) => enrollment.enrollmentId || '-' },
    { key: 'classId', label: '반 ID', render: (enrollment) => enrollment.classId || '-' },
    { key: 'consumerId', label: '수강생 ID', render: (enrollment) => enrollment.consumerId || '-' },
    { key: 'enrollmentDate', label: '등록일', render: (enrollment) => enrollment.enrollmentDate || '-' },
    { key: 'startDate', label: '시작일', render: (enrollment) => enrollment.startDate || '-' },
    { key: 'endDate', label: '종료일', render: (enrollment) => enrollment.endDate || '-' },
    { key: 'status', label: '상태', render: (enrollment) => enrollment.status || '-' },
    { key: 'paymentStatus', label: '결제 상태', render: (enrollment) => enrollment.paymentStatus || '-' },
    { key: 'tuitionAmount', label: '수강료', render: (enrollment) => enrollment.tuitionAmount ? `${enrollment.tuitionAmount.toLocaleString()}원` : '-' },
    { key: 'actions', label: '작업', render: (enrollment) => (
      <div className="academy-actions">
        {enrollment.status !== 'CANCELLED' && (
          <MGButton
            variant="danger"
            size="small"
            onClick={() => handleCancel(enrollment.enrollmentId)}
          >
            취소
          </MGButton>
        )}
      </div>
    )}
  ];

  return (
    <div className="academy-enrollment-list">
      <Card>
        <Card.Header>
          <h3>수강 등록 목록</h3>
          {onCreateEnrollment && (
            <MGButton
              variant="primary"
              onClick={onCreateEnrollment}
            >
              수강 등록
            </MGButton>
          )}
        </Card.Header>
        <Card.Body>
          {/* 에러 상태 */}
          {error && !loading && (
            <ErrorState message={error} onRetry={fetchEnrollments} />
          )}

          {/* 데이터 테이블 */}
          {!error && (
            <DataTable
              columns={columns}
              data={enrollments}
              loading={loading}
              error={null}
              onRowClick={onEnrollmentSelect}
              emptyMessage="등록된 수강이 없습니다."
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default EnrollmentList;
