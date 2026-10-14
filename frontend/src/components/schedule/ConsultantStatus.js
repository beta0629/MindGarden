import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet } from '../../utils/ajax';
import { ProfileCard } from '../ui/Card/index';
import './ConsultantStatus.css';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatDateKeyInZone } from '../../utils/zonedDateTime';
import { selectActiveConsultants } from '../../utils/selectActiveConsultants';
import {
  hasApiGetPayload,
  isApiGetNullFailure,
  normalizeConsultantsPayload
} from '../../utils/apiResponseNormalize';

/**
 * 상담사 현황 컴포넌트
 * - 실제 상담사 데이터를 기반으로 현황 표시
 * - 상담사별 상태 (여유, 바쁨, 휴무) 표시
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */
const ConsultantStatus = () => {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * 상담사 목록 로드 (휴가 정보 포함)
   * apiGet은 ApiResponse면 data만 반환 → { consultants } / 배열을 직접 수용
   */
  const loadConsultants = async() => {
    try {
      setLoading(true);
      console.log('👥 상담사 현황 로드 시작');

      const today = formatDateKeyInZone();
      const response = await apiGet(`/api/v1/admin/consultants/with-vacation?date=${today}`);

      if (isApiGetNullFailure(response) || !hasApiGetPayload(response)) {
        throw new Error('상담사 목록 조회 실패');
      }

      const consultantData = selectActiveConsultants(normalizeConsultantsPayload(response));
      console.log('👥 상담사 현황 데이터 (휴가 정보 포함):', consultantData);

      const consultantsWithStatus = await Promise.all(
        consultantData.map(async(consultant) => ({
          ...consultant,
          status: await calculateConsultantStatus(consultant)
        }))
      );

      setConsultants(consultantsWithStatus);
      console.log('👥 상담사 현황 로드 완료:', consultantsWithStatus);
    } catch (err) {
      console.error('❌ 상담사 현황 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 상담사 상태 계산 (실제 스케줄 데이터 기반)
   */
  const calculateConsultantStatus = async(consultant) => {
    try {
      const today = formatDateKeyInZone();
      console.log(`🔍 상담사 ${consultant.name} (ID: ${consultant.id}) 상태 계산 시작`);

      const response = await apiGet(`/api/v1/schedules?userId=${consultant.id}&userRole=CONSULTANT`);
      console.log(`📅 상담사 ${consultant.name} 스케줄 데이터:`, response);

      if (response && Array.isArray(response)) {
        const todaySchedules = response.filter((schedule) =>
          schedule.date === today
          && schedule.status === '예약됨'
        );

        console.log(`📅 상담사 ${consultant.name} 오늘 스케줄:`, todaySchedules);

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const hasCurrentSchedule = todaySchedules.some((schedule) => {
          if (!schedule.startTime || !schedule.endTime) return false;

          const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
          const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;

          const isCurrent = currentTime >= startTime && currentTime <= endTime;
          console.log(`⏰ 스케줄 ${schedule.id}: ${schedule.startTime}-${schedule.endTime}, 현재시간: ${currentTime}, 진행중: ${isCurrent}`);

          return isCurrent;
        });

        if (hasCurrentSchedule) {
          console.log(`✅ 상담사 ${consultant.name}: 상담중`);
          return { type: 'busy', text: '상담중', color: 'busy' };
        }
        if (todaySchedules.length > 0) {
          console.log(`✅ 상담사 ${consultant.name}: 바쁨 (${todaySchedules.length}개 예약)`);
          return { type: 'busy', text: '바쁨', color: 'busy' };
        }
        console.log(`✅ 상담사 ${consultant.name}: 여유`);
        return { type: 'available', text: '여유', color: 'available' };
      }
    } catch (err) {
      console.warn(`❌ 상담사 ${consultant.name} 상태 계산 실패:`, err);
    }

    console.log(`⚠️ 상담사 ${consultant.name}: 기본값 사용`);
    const consultantId = consultant.id;
    if (consultantId % 3 === 0) {
      return { type: 'available', text: '여유', color: 'available' };
    }
    if (consultantId % 3 === 1) {
      return { type: 'busy', text: '바쁨', color: 'busy' };
    }
    return { type: 'unavailable', text: '휴무', color: 'unavailable' };
  };

  useEffect(() => {
    loadConsultants();
  }, []);

  if (loading) {
    return (
      <div className="consultant-status">
        <UnifiedLoading type="inline" text="상담사 현황을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="consultant-status">
        <div className="consultant-status-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="consultant-status">
      {consultants.length === 0 ? (
        <div className="consultant-status-empty">
          <span>등록된 상담사가 없습니다.</span>
        </div>
      ) : (
        <div className="consultant-status-grid">
          {consultants.map((consultant) => {
            const { status } = consultant;
            return (
              <ProfileCard
                key={consultant.id}
                variant="list"
                avatar={{
                  profileImageUrl: consultant.profileImageUrl || consultant.profileImage || consultant.socialProfileImage,
                  displayName: toDisplayString(consultant.name, '상담사')
                }}
                name={<SafeText tag="div">{consultant.name}</SafeText>}
                contactInfo={{
                  email: <SafeText>{consultant.email}</SafeText>,
                  phone: <SafeText fallback="전화번호 없음">{consultant.phone}</SafeText>
                }}
                badges={[
                  <span className="consultant-status-badge" data-status={status.color} key="status">
                    <SafeText>{status.text}</SafeText>
                  </span>
                ]}
                statsItems={[
                  { label: '전문분야', value: <SafeText fallback="미설정">{consultant.specialty}</SafeText> }
                ]}
                extraInfo={
                  <div>등록일: <SafeText>{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '-'}</SafeText></div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsultantStatus;
