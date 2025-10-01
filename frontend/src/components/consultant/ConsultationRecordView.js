import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';

/**
 * 상담일지 조회 전용 화면
 * 작성된 상담일지를 조회만 할 수 있는 화면
 */
const ConsultationRecordView = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  // 상담기록 데이터 로드
  useEffect(() => {
    if (recordId && user?.id) {
      loadRecord();
    }
  }, [recordId, user?.id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 상담기록 조회:', recordId);

      // 상담기록 상세 정보 조회
      const response = await apiGet(`/api/consultant/${user.id}/consultation-records/${recordId}`);
      
      if (response.success) {
        setRecord(response.data);
      } else {
        setError(response.message || '상담기록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('❌ 상담기록 조회 실패:', err);
      setError('상담기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SimpleLayout title="상담기록 조회">
        <div className="consultation-record-view-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout title="상담기록 조회">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => navigate('/consultant/consultation-records')}
          >
            <i className="bi bi-arrow-left"></i>
            목록으로 돌아가기
          </button>
        </div>
      </SimpleLayout>
    );
  }

  if (!record) {
    return (
      <SimpleLayout title="상담기록 조회">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h3>상담기록을 찾을 수 없습니다.</h3>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => navigate('/consultant/consultation-records')}
          >
            <i className="bi bi-arrow-left"></i>
            목록으로 돌아가기
          </button>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="상담기록 조회">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* 헤더 */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '600', 
            color: '#2c3e50', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="bi bi-journal-text"></i>
            {record.title || '상담기록'}
          </h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            상담사: {user?.name || '알 수 없음'} | 
            상담일: {record.consultationDate ? (() => {
              try {
                const date = new Date(record.consultationDate);
                return date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                });
              } catch (error) {
                return record.consultationDate;
              }
            })() : '날짜 정보 없음'}
          </p>
        </div>

        {/* 상담기록 내용 */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {/* 기본 정보 */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '15px',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '10px'
            }}>
              📋 기본 정보
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: '600', color: '#495057' }}>세션 번호</label>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>
                  {record.sessionNumber || '정보 없음'}
                </p>
              </div>
              
              <div>
                <label style={{ fontWeight: '600', color: '#495057' }}>상담 시간</label>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>
                  {record.startTime && record.endTime ? (() => {
                    try {
                      const startTime = record.startTime.includes('T') ? 
                        record.startTime.split('T')[1]?.slice(0,5) : 
                        record.startTime;
                      const endTime = record.endTime.includes('T') ? 
                        record.endTime.split('T')[1]?.slice(0,5) : 
                        record.endTime;
                      return `${startTime || '00:00'} - ${endTime || '00:00'}`;
                    } catch (error) {
                      return '시간 정보 없음';
                    }
                  })() : '시간 정보 없음'}
                </p>
              </div>
              
              <div>
                <label style={{ fontWeight: '600', color: '#495057' }}>상담 유형</label>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>
                  {record.consultationType || '개별 상담'}
                </p>
              </div>
              
              <div>
                <label style={{ fontWeight: '600', color: '#495057' }}>상태</label>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>
                  <span style={{
                    backgroundColor: record.isSessionCompleted ? '#d4edda' : '#fff3cd',
                    color: record.isSessionCompleted ? '#155724' : '#856404',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {record.isSessionCompleted ? '완료' : '대기'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 상담 내용 */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              color: '#2c3e50', 
              marginBottom: '15px',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '10px'
            }}>
              📝 상담 내용
            </h3>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              minHeight: '200px'
            }}>
              {record.notes ? (
                <p style={{ 
                  margin: 0, 
                  lineHeight: '1.6', 
                  whiteSpace: 'pre-wrap',
                  fontSize: '1rem'
                }}>
                  {record.notes}
                </p>
              ) : (
                <p style={{ 
                  margin: 0, 
                  color: '#6c757d', 
                  fontStyle: 'italic' 
                }}>
                  작성된 상담 내용이 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #e9ecef'
          }}>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/consultant/consultation-records')}
            >
              <i className="bi bi-arrow-left"></i>
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ConsultationRecordView;
