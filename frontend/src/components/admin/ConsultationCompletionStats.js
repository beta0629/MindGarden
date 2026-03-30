import { useState, useEffect } from 'react';
import ConsultationCompletionStatsView from '../ui/Statistics/ConsultationCompletionStatsView';
import { apiGet } from '../../utils/ajax';

/**
 * 상담 완료 통계 컨테이너 컴포넌트
/**
 * - 비즈니스 로직만 담당
/**
 * - 상태 관리, 데이터 로드
/**
 * - Presentational 컴포넌트에 데이터와 핸들러 전달
/**
 * 
/**
 * @version 2.0.0 (Presentational/Container 분리)
 */
const ConsultationCompletionStats = () => {
    // ========== 상태 관리 ==========
    const [statistics, setStatistics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const getCurrentPeriod = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

    // ========== 유틸리티 함수 ==========
    const generatePeriodOptions = () => {
        const options = [];
        const now = new Date();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const period = `${year}-${month}`;
            const label = `${year}년 ${month}월`;
            options.push({ value: period, label });
        }
        
        return options;
    };

    const convertGradeToKorean = (grade) => {
        const gradeMap = {
            'CONSULTANT_JUNIOR': '주니어',
            'CONSULTANT_SENIOR': '시니어',
            'CONSULTANT_EXPERT': '엑스퍼트',
            'CONSULTANT_MASTER': '마스터'
        };
        return gradeMap[grade] || grade;
    };

    const convertSpecialtyToKorean = (specialty) => {
        if (!specialty) return '전문분야 미설정';
        
        const specialtyMap = {
            'DEPRESSION': '우울증',
            'ANXIETY': '불안장애',
            'TRAUMA': '트라우마',
            'RELATIONSHIP': '관계상담',
            'FAMILY': '가족상담',
            'COUPLE': '부부상담',
            'CHILD': '아동상담',
            'ADOLESCENT': '청소년상담',
            'ADDICTION': '중독상담',
            'EATING_DISORDER': '섭식장애',
            'PERSONALITY': '성격장애',
            'BIPOLAR': '양극성장애',
            'OCD': '강박장애',
            'PTSD': '외상후스트레스장애',
            'GRIEF': '상실상담',
            'CAREER': '진로상담',
            'STRESS': '스트레스관리',
            'SLEEP': '수면장애',
            'ANGER': '분노조절',
            'SELF_ESTEEM': '자존감',
            'INDIVIDUAL': '개인상담',
            'GROUP': '그룹상담',
            'INITIAL': '초기상담'
        };
        
        if (specialty.includes(',')) {
            const specialties = specialty.split(',').map(s => s.trim());
            const koreanSpecialties = specialties.map(s => specialtyMap[s] || s);
            return koreanSpecialties.join(', ');
        }
        
        return specialtyMap[specialty] || specialty;
    };

    // ========== 데이터 로드 ==========
    const loadStatistics = async (period = '') => {
        try {
            setLoading(true);
            setError(null);
            
            const url = period 
                ? `/api/admin/statistics/consultation-completion?period=${period}`
                : '/api/v1/admin/statistics/consultation-completion';
            
            const response = await apiGet(url);
            console.log('📊 상담 완료 통계 API 응답:', response);
            
            if (response && response.success) {
                console.log('📊 통계 데이터:', response.data);
                setStatistics(response.data || []);
            } else {
                console.error('❌ API 응답 실패:', response);
                setError('통계 데이터를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('상담 완료 건수 통계 로드 실패:', err);
            setError('통계 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // ========== 이벤트 핸들러 ==========
    const handlePeriodChange = (event) => {
        const period = event.target.value;
        setSelectedPeriod(period);
        loadStatistics(period);
    };

    const handleRetry = () => {
        loadStatistics(selectedPeriod);
    };

    // ========== 효과 ==========
    useEffect(() => {
        loadStatistics(selectedPeriod);
    }, []);

    // ========== 렌더링 (Presentational 컴포넌트 사용) ==========
    return (
        <ConsultationCompletionStatsView
            statistics={statistics}
            loading={loading}
            error={error}
            selectedPeriod={selectedPeriod}
            periodOptions={generatePeriodOptions()}
            onPeriodChange={handlePeriodChange}
            onRetry={handleRetry}
            convertGradeToKorean={convertGradeToKorean}
            convertSpecialtyToKorean={convertSpecialtyToKorean}
        />
    );
};

export default ConsultationCompletionStats;
