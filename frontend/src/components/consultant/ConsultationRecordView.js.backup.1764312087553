import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import '../../styles/mindgarden-design-system.css';

/**
 * 상담일지 조회 전용 화면
 * 작성된 상담일지를 조회만 할 수 있는 화면
 * 디자인 시스템 v2.0 적용
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
        <UnifiedLoading text="상담기록을 불러오는 중..." />
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout title="상담기록 조회">
        <div className="mg-v2-empty-state">
          <div className="mg-v2-empty-state-icon">⚠️</div>
          <div className="mg-v2-empty-state-text">{error}</div>
          <button 
            className="mg-v2-button mg-v2-button--secondary mg-mt-md"
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
        <div className="mg-v2-empty-state">
          <div className="mg-v2-empty-state-icon">📋</div>
          <div className="mg-v2-empty-state-text">상담기록을 찾을 수 없습니다.</div>
          <button 
            className="mg-v2-button mg-v2-button--secondary mg-mt-md"
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
      <div className="mg-v2-record-view">
        {/* 기본 정보 카드 */}
        <div className="mg-v2-card">
          <h3 className="mg-v2-h3 mg-mb-md">기본 정보</h3>
          <div className="mg-v2-record-grid">
            <div className="mg-v2-record-item">
              <div className="mg-v2-record-label">세션 번호</div>
              <div className="mg-v2-record-value">{record.sessionNumber || '정보 없음'}</div>
            </div>
            <div className="mg-v2-record-item">
              <div className="mg-v2-record-label">상담 시간</div>
              <div className="mg-v2-record-value">
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
              </div>
            </div>
            <div className="mg-v2-record-item">
              <div className="mg-v2-record-label">상담 유형</div>
              <div className="mg-v2-record-value">{record.consultationType || '개별 상담'}</div>
            </div>
            <div className="mg-v2-record-item">
              <div className="mg-v2-record-label">상태</div>
              <div className="mg-v2-record-value">
                <span className={`mg-v2-badge ${record.isSessionCompleted ? 'mg-v2-badge-success' : 'mg-v2-badge-warning'}`}>
                  {record.isSessionCompleted ? '완료' : '대기'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 상담 내용 카드 */}
        <div className="mg-v2-card mg-mt-lg">
          <h3 className="mg-v2-h3 mg-mb-md">상담 내용</h3>
          <div className="mg-v2-record-content-box">
            {record.notes ? (
              <div className="mg-v2-record-notes">{record.notes}</div>
            ) : (
              <div className="mg-v2-record-empty">작성된 상담 내용이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mg-v2-record-actions mg-mt-lg">
          <button 
            className="mg-v2-button mg-v2-button--secondary"
            onClick={() => navigate('/consultant/consultation-records')}
          >
            <i className="bi bi-arrow-left"></i>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ConsultationRecordView;
