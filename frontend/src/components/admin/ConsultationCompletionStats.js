import { useState, useEffect } from 'react';
import ConsultationCompletionStatsView from '../ui/Statistics/ConsultationCompletionStatsView';
import { apiGet } from '../../utils/ajax';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_STATISTICS_CONSULTATION_COMPLETION = '/api/v1/admin/statistics/consultation-completion';


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
    const { t } = useTranslation();
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
            const label = t('admin:ConsultationCompletionStats.t_180f1c39');
            options.push({ value: period, label });
        }
        
        return options;
    };

    const convertGradeToKorean = (grade) => {
        const gradeMap = {
            'CONSULTANT_JUNIOR': t('admin:ConsultationCompletionStats.t_d6ebcb35'),
            'CONSULTANT_SENIOR': t('admin:ConsultationCompletionStats.t_68a6a8b6'),
            'CONSULTANT_EXPERT': t('admin:ConsultationCompletionStats.t_de4b2ea8'),
            'CONSULTANT_MASTER': t('admin:ConsultationCompletionStats.t_5f6cf8e4')
        };
        return gradeMap[grade] || grade;
    };

    const convertSpecialtyToKorean = (specialty) => {
        if (!specialty) return t('admin:ConsultationCompletionStats.t_dd74ab3f');
        
        const specialtyMap = {
            'DEPRESSION': t('admin:ConsultationCompletionStats.t_ab01081f'),
            'ANXIETY': t('admin:ConsultationCompletionStats.t_dc470840'),
            'TRAUMA': t('admin:ConsultationCompletionStats.t_a7f0acf4'),
            'RELATIONSHIP': t('admin:ConsultationCompletionStats.t_5f7b31c3'),
            'FAMILY': t('admin:ConsultationCompletionStats.t_aaa928a6'),
            'COUPLE': t('admin:ConsultationCompletionStats.t_62b69843'),
            'CHILD': t('admin:ConsultationCompletionStats.t_a3a0c008'),
            'ADOLESCENT': t('admin:ConsultationCompletionStats.t_62dd9bfa'),
            'ADDICTION': t('admin:ConsultationCompletionStats.t_e00f86f0'),
            'EATING_DISORDER': t('admin:ConsultationCompletionStats.t_eadeca31'),
            'PERSONALITY': t('admin:ConsultationCompletionStats.t_64289520'),
            'BIPOLAR': t('admin:ConsultationCompletionStats.t_06ce7165'),
            'OCD': t('admin:ConsultationCompletionStats.t_d6006d9e'),
            'PTSD': t('admin:ConsultationCompletionStats.t_85fa51cf'),
            'GRIEF': t('admin:ConsultationCompletionStats.t_62d41eac'),
            'CAREER': t('admin:ConsultationCompletionStats.t_a9676d11'),
            'STRESS': t('admin:ConsultationCompletionStats.t_15a15b24'),
            'SLEEP': t('admin:ConsultationCompletionStats.t_4af66e7c'),
            'ANGER': t('admin:ConsultationCompletionStats.t_53166452'),
            'SELF_ESTEEM': t('admin:ConsultationCompletionStats.t_1544ba61'),
            'INDIVIDUAL': t('admin:ConsultationCompletionStats.t_efda14c0'),
            'GROUP': t('admin:ConsultationCompletionStats.t_607ecaca'),
            'INITIAL': t('admin:ConsultationCompletionStats.t_d90982dc')
        };
        
        if (specialty.includes(',')) {
            const specialties = specialty.split(',').map(s => s.trim());
            const koreanSpecialties = specialties.map(s => specialtyMap[s] || s);
            return koreanSpecialties.join(', ');
        }
        
        return specialtyMap[specialty] || specialty;
    };

    // ========== 데이터 로드 ==========
    const loadStatistics = async(period = '') => {
        try {
            setLoading(true);
            setError(null);
            
            const url = period 
                ? `/api/admin/statistics/consultation-completion?period=${period}`
                : API_ADMIN_STATISTICS_CONSULTATION_COMPLETION;
            
            const response = await apiGet(url);
            console.log('📊 상담 완료 통계 API 응답:', response);
            
            if (response && response.success) {
                console.log('📊 통계 데이터:', response.data);
                setStatistics(response.data || []);
            } else {
                console.error('❌ API 응답 실패:', response);
                setError(t('admin:ConsultationCompletionStats.t_fce1bb26'));
            }
        } catch (err) {
            console.error('상담 완료 건수 통계 로드 실패:', err);
            setError(t('admin:ConsultationCompletionStats.t_fce1bb26'));
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
