/**
 * 학원 시스템 - 강좌 목록 컴포넌트
/**
 * 공통 컴포넌트 사용, CSS와 비즈니스 로직 분리, 인라인 스타일 금지, 상수 사용
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0
/**
 * @since 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { DataTable, FilterBar, ErrorState } from './shared';
import { ACADEMY_API, ACADEMY_MESSAGES, PRICING_POLICY_LABELS, ACADEMY_FILTERS } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import notificationManager from '../../utils/notification';
import './Academy.css';

const CourseList = ({ branchId, onCourseSelect, onCreateCourse, onEditCourse, onDeleteCourse }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    subject: ''
  });

  // 강좌 목록 조회
  const fetchCourses = async() => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (filters.category) params.append('category', filters.category);
      if (filters.subject) params.append('subject', filters.subject);
      
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.COURSE_LIST}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data || []);
      } else {
        setError(data.message || ACADEMY_MESSAGES.COURSE_NOT_FOUND);
      }
    } catch (err) {
      console.error('강좌 목록 조회 실패:', err);
      setError(ACADEMY_MESSAGES.COURSE_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [branchId, filters.category, filters.subject]);

  // 강좌 삭제
  const handleDelete = async(courseId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${ACADEMY_API.COURSE_DELETE(courseId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        notificationManager.success(ACADEMY_MESSAGES.COURSE_DELETE_SUCCESS);
        fetchCourses();
        if (onDeleteCourse) onDeleteCourse(courseId);
      } else {
        notificationManager.error(data.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('강좌 삭제 실패:', err);
      notificationManager.error('삭제 중 오류가 발생했습니다.');
    }
  };

  // 필터 설정
  const filterConfig = [
    {
      name: 'category',
      label: '카테고리',
      type: 'select',
      options: [
        { value: '', label: '전체 카테고리' },
        ...ACADEMY_FILTERS.CATEGORIES
      ]
    },
    {
      name: 'subject',
      label: '과목',
      type: 'select',
      options: [
        { value: '', label: '전체 과목' },
        ...ACADEMY_FILTERS.SUBJECTS
      ]
    }
  ];

  // 테이블 컬럼 정의
  const columns = [
    { key: 'name', label: '강좌명', render: (course) => course.name || course.nameKo || '-' },
    { key: 'category', label: '카테고리', render: (course) => course.category || '-' },
    { key: 'subject', label: '과목', render: (course) => course.subject || '-' },
    { key: 'pricingPolicy', label: '가격 정책', render: (course) => PRICING_POLICY_LABELS[course.pricingPolicy] || course.pricingPolicy || '-' },
    { key: 'basePrice', label: '가격', render: (course) => course.basePrice ? `${course.basePrice.toLocaleString()}원` : '-' },
    { key: 'isActive', label: '상태', render: (course) => course.isActive ? '활성' : '비활성' },
    { key: 'actions', label: '작업', render: (course) => (
      <div className="academy-actions">
        {onEditCourse && (
          <MGButton
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => onEditCourse(course)}
          >
            수정
          </MGButton>
        )}
        {onDeleteCourse && (
          <MGButton
            variant="danger"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'danger',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => handleDelete(course.courseId)}
          >
            삭제
          </MGButton>
        )}
      </div>
    ) }
  ];

  return (
    <div className="academy-course-list">
      <div className="mg-card">
        <div className="mg-card__header">
          <h3>강좌 목록</h3>
          {onCreateCourse && (
            <MGButton
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onCreateCourse}
            >
              강좌 등록
            </MGButton>
          )}
        </div>
        <div className="mg-card__body">
          {/* 필터 */}
          <FilterBar
            filters={filterConfig}
            values={filters}
            onChange={setFilters}
          />

          {/* 에러 상태 */}
          {error && !loading && (
            <ErrorState message={error} onRetry={fetchCourses} />
          )}

          {/* 데이터 테이블 */}
          {!error && (
            <DataTable
              columns={columns}
              data={courses}
              loading={loading}
              error={null}
              onRowClick={onCourseSelect}
              emptyMessage="등록된 강좌가 없습니다."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseList;
