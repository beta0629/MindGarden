/**
 * 학원 시스템 - 반 목록 컴포넌트
 * 공통 컴포넌트 사용, CSS와 비즈니스 로직 분리, 인라인 스타일 금지, 상수 사용
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card/Card';
import MGButton from '../common/MGButton';
import { DataTable, FilterBar, ErrorState } from './shared';
import { ACADEMY_API, ACADEMY_MESSAGES, CLASS_STATUS, CLASS_STATUS_LABELS } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import './Academy.css';

const ClassList = ({ branchId, courseId, onClassSelect, onCreateClass, onEditClass, onDeleteClass }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // 반 목록 조회
  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (courseId) params.append('courseId', courseId);
      if (statusFilter) params.append('status', statusFilter);
      
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
      } else {
        setError(data.message || '반 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('반 목록 조회 실패:', err);
      setError('반 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [branchId, courseId, statusFilter]);

  // 반 삭제
  const handleDelete = async (classId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.CLASS_DELETE(classId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(ACADEMY_MESSAGES.CLASS_DELETE_SUCCESS);
        fetchClasses();
        if (onDeleteClass) onDeleteClass(classId);
      } else {
        alert(data.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('반 삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 필터 설정
  const filterConfig = [
    {
      name: 'status',
      label: '상태',
      type: 'select',
      options: [
        { value: '', label: '전체 상태' },
        ...Object.entries(CLASS_STATUS_LABELS).map(([key, label]) => ({
          value: key,
          label
        }))
      ]
    }
  ];

  // 테이블 컬럼 정의
  const columns = [
    { key: 'name', label: '반명', render: (classItem) => classItem.name || classItem.nameKo || '-' },
    { key: 'courseId', label: '강좌 ID', render: (classItem) => classItem.courseId || '-' },
    { key: 'teacherName', label: '강사', render: (classItem) => classItem.teacherName || '-' },
    { key: 'capacity', label: '정원', render: (classItem) => `${classItem.currentEnrollment || 0}/${classItem.capacity || 0}` },
    { key: 'status', label: '상태', render: (classItem) => CLASS_STATUS_LABELS[classItem.status] || classItem.status || '-' },
    { key: 'startDate', label: '시작일', render: (classItem) => classItem.startDate || '-' },
    { key: 'endDate', label: '종료일', render: (classItem) => classItem.endDate || '-' },
    { key: 'room', label: '강의실', render: (classItem) => classItem.room || '-' },
    { key: 'actions', label: '작업', render: (classItem) => (
      <div className="academy-actions">
        {onEditClass && (
          <MGButton
            variant="outline"
            size="small"
            onClick={() => onEditClass(classItem)}
          >
            수정
          </MGButton>
        )}
        {onDeleteClass && (
          <MGButton
            variant="danger"
            size="small"
            onClick={() => handleDelete(classItem.classId)}
          >
            삭제
          </MGButton>
        )}
      </div>
    )}
  ];

  return (
    <div className="academy-class-list">
      <Card>
        <Card.Header>
          <h3>반 목록</h3>
          {onCreateClass && (
            <MGButton
              variant="primary"
              onClick={onCreateClass}
            >
              반 등록
            </MGButton>
          )}
        </Card.Header>
        <Card.Body>
          {/* 필터 */}
          <FilterBar
            filters={filterConfig}
            values={{ status: statusFilter }}
            onChange={(values) => setStatusFilter(values.status || '')}
          />

          {/* 에러 상태 */}
          {error && !loading && (
            <ErrorState message={error} onRetry={fetchClasses} />
          )}

          {/* 데이터 테이블 */}
          {!error && (
            <DataTable
              columns={columns}
              data={classes}
              loading={loading}
              error={null}
              onRowClick={onClassSelect}
              emptyMessage="등록된 반이 없습니다."
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ClassList;
