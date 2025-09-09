import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';
import { sessionManager } from '../../utils/sessionManager';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './ConsultantAvailability.css';

const ConsultantAvailability = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 디버깅을 위한 로그
  console.log('🔍 ConsultantAvailability 상태:', {
    user,
    isLoggedIn,
    sessionLoading,
    userRole: user?.role,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email
  });
  
  // 세션 매니저 상태도 확인
  console.log('🔍 sessionManager 상태:', {
    sessionManagerUser: sessionManager.getUser(),
    sessionManagerIsLoggedIn: sessionManager.isLoggedIn(),
    sessionManagerIsLoading: sessionManager.isLoading
  });

  // 세션 상태 상세 분석
  console.log('🔍 세션 상태 분석:', {
    'user 존재': !!user,
    'user.id': user?.id,
    'user.role': user?.role,
    'isLoggedIn 값': isLoggedIn,
    'sessionLoading 값': sessionLoading,
    'sessionManager.user': sessionManager.getUser(),
    'sessionManager.isLoggedIn()': sessionManager.isLoggedIn(),
    'sessionManager.isLoading': sessionManager.isLoading
  });

  // 요일 상수
  const DAYS_OF_WEEK = [
    { key: 'MONDAY', label: '월요일', short: '월' },
    { key: 'TUESDAY', label: '화요일', short: '화' },
    { key: 'WEDNESDAY', label: '수요일', short: '수' },
    { key: 'THURSDAY', label: '목요일', short: '목' },
    { key: 'FRIDAY', label: '금요일', short: '금' },
    { key: 'SATURDAY', label: '토요일', short: '토' },
    { key: 'SUNDAY', label: '일요일', short: '일' }
  ];

  // 시간 슬롯 생성 (30분 단위)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadAvailability();
    }
  }, [isLoggedIn, user?.id]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 상담 가능 시간 로드:', user.id);

      const response = await apiGet(`/api/consultant/${user.id}/availability`);
      
      if (response.success) {
        console.log('✅ 상담 가능 시간 로드 성공:', response.data);
        setAvailability(response.data || []);
      } else {
        console.error('❌ 상담 가능 시간 로드 실패:', response.message);
        setError(response.message || '상담 가능 시간을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 로드 중 오류:', err);
      setError('상담 가능 시간을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상담 가능 시간 추가
  const handleAddAvailability = async (formData) => {
    try {
      console.log('➕ 상담 가능 시간 추가:', formData);

      const response = await apiPost(`/api/consultant/${user.id}/availability`, formData);
      
      if (response.success) {
        console.log('✅ 상담 가능 시간 추가 성공');
        await loadAvailability();
        setShowAddModal(false);
      } else {
        console.error('❌ 상담 가능 시간 추가 실패:', response.message);
        setError(response.message || '상담 가능 시간 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 추가 중 오류:', err);
      setError('상담 가능 시간 추가 중 오류가 발생했습니다.');
    }
  };

  // 상담 가능 시간 수정
  const handleEditAvailability = async (id, formData) => {
    try {
      console.log('✏️ 상담 가능 시간 수정:', id, formData);

      const response = await apiPut(`/api/consultant/availability/${id}`, formData);
      
      if (response.success) {
        console.log('✅ 상담 가능 시간 수정 성공');
        await loadAvailability();
        setEditingSlot(null);
      } else {
        console.error('❌ 상담 가능 시간 수정 실패:', response.message);
        setError(response.message || '상담 가능 시간 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 수정 중 오류:', err);
      setError('상담 가능 시간 수정 중 오류가 발생했습니다.');
    }
  };

  // 상담 가능 시간 삭제
  const handleDeleteAvailability = async (id) => {
    try {
      console.log('🗑️ 상담 가능 시간 삭제:', id);

      const response = await apiDelete(`/api/consultant/availability/${id}`);
      
      if (response.success) {
        console.log('✅ 상담 가능 시간 삭제 성공');
        await loadAvailability();
      } else {
        console.error('❌ 상담 가능 시간 삭제 실패:', response.message);
        setError(response.message || '상담 가능 시간 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 삭제 중 오류:', err);
      setError('상담 가능 시간 삭제 중 오류가 발생했습니다.');
    }
  };

  // 요일별 상담 가능 시간 그룹화
  const groupedAvailability = availability.reduce((acc, slot) => {
    const day = slot.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {});

  // 세션 로딩 중
  if (sessionLoading) {
    return (
      <SimpleLayout>
        <div className="loading-container">
          <LoadingSpinner 
            text="세션 확인 중..." 
            size="medium"
            className="loading-spinner-inline"
          />
        </div>
      </SimpleLayout>
    );
  }

  // 세션 로딩이 완료된 후 권한 체크
  if (!sessionLoading) {
    // 세션 매니저에서 직접 사용자 정보 확인
    const sessionManagerUser = sessionManager.getUser();
    const sessionManagerIsLoggedIn = sessionManager.isLoggedIn();
    
    console.log('🔍 최종 세션 체크:', {
      'useSession user': user,
      'useSession isLoggedIn': isLoggedIn,
      'sessionManager user': sessionManagerUser,
      'sessionManager isLoggedIn': sessionManagerIsLoggedIn
    });

    // 로그인되지 않은 경우 (세션 매니저 기준으로 확인)
    if (!sessionManagerIsLoggedIn || !sessionManagerUser) {
      return (
        <SimpleLayout>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '30px', 
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }}></i>
              <h3 style={{ color: '#495057', marginBottom: '10px' }}>로그인이 필요합니다</h3>
              <p style={{ color: '#6c757d', marginBottom: '20px' }}>상담 가능 시간을 관리하려면 로그인해주세요.</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/login'}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                로그인하기
              </button>
            </div>
          </div>
        </SimpleLayout>
      );
    }

    // 권한 체크 (상담사 또는 관리자만 접근 가능)
    const userRole = sessionManagerUser?.role;
    const hasPermission = userRole === 'CONSULTANT' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!hasPermission) {
      return (
        <SimpleLayout>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ 
              background: '#fff3cd', 
              padding: '30px', 
              borderRadius: '10px',
              border: '1px solid #ffeaa7'
            }}>
              <i className="bi bi-shield-exclamation" style={{ fontSize: '48px', color: '#856404', marginBottom: '20px' }}></i>
              <h3 style={{ color: '#856404', marginBottom: '10px' }}>접근 권한이 없습니다</h3>
              <p style={{ color: '#856404', marginBottom: '20px' }}>상담 가능 시간 관리는 상담사 또는 관리자만 접근할 수 있습니다.</p>
              <p style={{ color: '#856404', marginBottom: '20px', fontSize: '14px' }}>
                현재 사용자 역할: {userRole || '없음'}
              </p>
              <button 
                className="btn btn-warning"
                onClick={() => window.history.back()}
              >
                <i className="bi bi-arrow-left"></i>
                이전 페이지로
              </button>
            </div>
          </div>
        </SimpleLayout>
      );
    }
  }

  return (
    <SimpleLayout>
      <div className="consultant-availability-container">
      {/* 헤더 */}
      <div className="availability-header">
        <h1 className="availability-title">
          <i className="bi bi-clock"></i>
          상담 가능 시간 관리
        </h1>
        <p className="availability-subtitle">
          상담 가능한 시간을 설정하여 내담자들이 예약할 수 있도록 합니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="availability-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle"></i>
          상담 가능 시간 추가
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={loadAvailability}
        >
          <i className="bi bi-arrow-clockwise"></i>
          새로고침
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p>상담 가능 시간을 불러오는 중...</p>
        </div>
      )}

      {/* 오류 상태 */}
      {error && (
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
        </div>
      )}

      {/* 상담 가능 시간 목록 */}
      {!loading && !error && (
        <div className="availability-content">
          {availability.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-clock"></i>
              <h3>설정된 상담 가능 시간이 없습니다</h3>
              <p>상담 가능한 시간을 추가해보세요.</p>
            </div>
          ) : (
            <div className="availability-grid">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.key} className="day-card">
                  <div className="day-header">
                    <h3 className="day-title">{day.label}</h3>
                    <span className="day-count">
                      {groupedAvailability[day.key]?.length || 0}개 시간
                    </span>
                  </div>
                  
                  <div className="time-slots">
                    {groupedAvailability[day.key]?.map(slot => (
                      <div key={slot.id} className="time-slot">
                        <div className="time-info">
                          <span className="time-range">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="time-duration">
                            {slot.duration}분
                          </span>
                        </div>
                        <div className="time-actions">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setEditingSlot(slot)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteAvailability(slot.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    )) || (
                      <div className="no-slots">
                        <i className="bi bi-dash-circle"></i>
                        <span>설정된 시간이 없습니다</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 상담 가능 시간 추가/수정 모달 */}
      {(showAddModal || editingSlot) && (
        <AvailabilityModal
          isOpen={showAddModal || !!editingSlot}
          onClose={() => {
            setShowAddModal(false);
            setEditingSlot(null);
          }}
          onSubmit={editingSlot ? 
            (data) => handleEditAvailability(editingSlot.id, data) : 
            handleAddAvailability
          }
          initialData={editingSlot}
          timeSlots={timeSlots}
          daysOfWeek={DAYS_OF_WEEK}
        />
      )}
      </div>
    </SimpleLayout>
  );
};

// 상담 가능 시간 모달 컴포넌트
const AvailabilityModal = ({ isOpen, onClose, onSubmit, initialData, timeSlots, daysOfWeek }) => {
  const [formData, setFormData] = useState({
    dayOfWeek: initialData?.dayOfWeek || 'MONDAY',
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '17:00',
    duration: initialData?.duration || 60,
    isActive: initialData?.isActive !== false
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startTime) {
      newErrors.startTime = '시작 시간을 선택해주세요.';
    }

    if (!formData.endTime) {
      newErrors.endTime = '종료 시간을 선택해주세요.';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다.';
      }
    }

    if (!formData.duration || formData.duration < 30) {
      newErrors.duration = '상담 시간은 최소 30분 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content availability-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="bi bi-clock"></i>
            {initialData ? '상담 가능 시간 수정' : '상담 가능 시간 추가'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">요일 *</label>
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              {daysOfWeek.map(day => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 시간 *</label>
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {errors.startTime && (
                <div className="invalid-feedback">{errors.startTime}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">종료 시간 *</label>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {errors.endTime && (
                <div className="invalid-feedback">{errors.endTime}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">상담 시간 (분) *</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
              required
            >
              <option value="30">30분</option>
              <option value="60">60분</option>
              <option value="90">90분</option>
              <option value="120">120분</option>
            </select>
            {errors.duration && (
              <div className="invalid-feedback">{errors.duration}</div>
            )}
          </div>

          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isActive: e.target.checked
                }))}
                className="form-check-input"
                id="isActive"
              />
              <label className="form-check-label" htmlFor="isActive">
                활성화
              </label>
            </div>
          </div>
        </form>
        
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            <i className="bi bi-x-circle"></i>
            취소
          </button>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
            <i className="bi bi-check-circle"></i>
            {initialData ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantAvailability;
