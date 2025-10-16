/**
 * 평점 관련 유틸리티 함수들
 * - 상담사 평점 계산 및 포맷팅
 * - 리뷰 수 처리
 * - 평점 표시 관련 공통 로직
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-15
 */

/**
 * 상담사 평점 정보를 가져오는 공통 함수
 * @param {Object} consultant - 상담사 객체
 * @returns {Object} 평점 정보 객체
 */
export const getConsultantRatingInfo = (consultant) => {
    if (!consultant) {
        return {
            rating: 0,
            reviewCount: 0,
            formattedRating: '0.0',
            formattedReviewCount: '0명',
            hasRating: false
        };
    }

    // 평점 계산 (다양한 필드명 지원)
    const rating = consultant.averageRating || 
                   consultant.avgRating || 
                   consultant.rating || 
                   consultant.score || 
                   consultant.heartScore || 
                   0;

    // 리뷰 수 계산 (다양한 필드명 지원)
    const reviewCount = consultant.reviewCount || 
                       consultant.totalReviews || 
                       consultant.evaluationCount || 
                       consultant.totalRatings || 
                       consultant.ratingCount || 
                       0;

    // 평점 포맷팅 (소수점 1자리)
    const formattedRating = typeof rating === 'number' ? rating.toFixed(1) : '0.0';
    
    // 리뷰 수 포맷팅
    const formattedReviewCount = `${reviewCount}명`;

    return {
        rating: rating,
        reviewCount: reviewCount,
        formattedRating: formattedRating,
        formattedReviewCount: formattedReviewCount,
        hasRating: reviewCount > 0
    };
};

/**
 * 평점을 별표로 표시하는 함수
 * @param {number} rating - 평점 (0-5)
 * @param {number} maxStars - 최대 별 개수 (기본값: 5)
 * @returns {string} 별표 문자열
 */
export const getRatingStars = (rating, maxStars = 5) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
};

/**
 * 평점 등급을 반환하는 함수
 * @param {number} rating - 평점
 * @returns {Object} 등급 정보
 */
export const getRatingGrade = (rating) => {
    const numRating = parseFloat(rating) || 0;
    
    if (numRating >= 4.5) {
        return { grade: 'S', color: '#ffd700', label: '최고' };
    } else if (numRating >= 4.0) {
        return { grade: 'A', color: '#ff6b6b', label: '우수' };
    } else if (numRating >= 3.5) {
        return { grade: 'B', color: '#4ecdc4', label: '양호' };
    } else if (numRating >= 3.0) {
        return { grade: 'C', color: '#45b7d1', label: '보통' };
    } else if (numRating >= 2.0) {
        return { grade: 'D', color: '#f9ca24', label: '미흡' };
    } else {
        return { grade: 'F', color: '#6c757d', label: '부족' };
    }
};

/**
 * 평점 히스토리를 계산하는 함수 (최근 N개월)
 * @param {Array} ratings - 평점 배열
 * @param {number} months - 기간 (개월)
 * @returns {Object} 히스토리 정보
 */
export const getRatingHistory = (ratings, months = 6) => {
    if (!Array.isArray(ratings) || ratings.length === 0) {
        return {
            averageRating: 0,
            trend: 'stable',
            changeRate: 0,
            period: `${months}개월`
        };
    }

    // 최근 N개월 데이터 필터링
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const recentRatings = ratings.filter(rating => 
        new Date(rating.ratedAt) >= cutoffDate
    );

    if (recentRatings.length === 0) {
        return {
            averageRating: 0,
            trend: 'stable',
            changeRate: 0,
            period: `${months}개월`
        };
    }

    // 평균 평점 계산
    const averageRating = recentRatings.reduce((sum, rating) => 
        sum + (rating.heartScore || rating.rating || 0), 0
    ) / recentRatings.length;

    // 트렌드 계산 (이전 기간과 비교)
    const midPoint = Math.floor(recentRatings.length / 2);
    const firstHalf = recentRatings.slice(0, midPoint);
    const secondHalf = recentRatings.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, rating) => 
        sum + (rating.heartScore || rating.rating || 0), 0
    ) / firstHalf.length;

    const secondHalfAvg = secondHalf.reduce((sum, rating) => 
        sum + (rating.heartScore || rating.rating || 0), 0
    ) / secondHalf.length;

    const changeRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    let trend = 'stable';
    if (changeRate > 5) trend = 'up';
    else if (changeRate < -5) trend = 'down';

    return {
        averageRating: parseFloat(averageRating.toFixed(1)),
        trend: trend,
        changeRate: parseFloat(changeRate.toFixed(1)),
        period: `${months}개월`,
        totalRatings: recentRatings.length
    };
};

/**
 * 평점 통계를 계산하는 함수
 * @param {Array} ratings - 평점 배열
 * @returns {Object} 통계 정보
 */
export const getRatingStatistics = (ratings) => {
    if (!Array.isArray(ratings) || ratings.length === 0) {
        return {
            average: 0,
            median: 0,
            mode: 0,
            distribution: {},
            totalCount: 0
        };
    }

    const ratingValues = ratings.map(rating => 
        rating.heartScore || rating.rating || 0
    ).filter(value => value > 0);

    if (ratingValues.length === 0) {
        return {
            average: 0,
            median: 0,
            mode: 0,
            distribution: {},
            totalCount: 0
        };
    }

    // 평균
    const average = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;

    // 중앙값
    const sortedRatings = [...ratingValues].sort((a, b) => a - b);
    const median = sortedRatings.length % 2 === 0
        ? (sortedRatings[sortedRatings.length / 2 - 1] + sortedRatings[sortedRatings.length / 2]) / 2
        : sortedRatings[Math.floor(sortedRatings.length / 2)];

    // 최빈값
    const frequency = {};
    ratingValues.forEach(rating => {
        const roundedRating = Math.round(rating);
        frequency[roundedRating] = (frequency[roundedRating] || 0) + 1;
    });
    const mode = Object.keys(frequency).reduce((a, b) => 
        frequency[a] > frequency[b] ? a : b
    );

    // 분포
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
        distribution[i] = ratingValues.filter(rating => Math.round(rating) === i).length;
    }

    return {
        average: parseFloat(average.toFixed(1)),
        median: parseFloat(median.toFixed(1)),
        mode: parseInt(mode),
        distribution: distribution,
        totalCount: ratingValues.length
    };
};

/**
 * 평점을 한국어로 설명하는 함수
 * @param {number} rating - 평점
 * @returns {string} 설명 텍스트
 */
export const getRatingDescription = (rating) => {
    const numRating = parseFloat(rating) || 0;
    
    if (numRating >= 4.5) {
        return '매우 만족스러운 상담사입니다';
    } else if (numRating >= 4.0) {
        return '만족스러운 상담사입니다';
    } else if (numRating >= 3.5) {
        return '양호한 상담사입니다';
    } else if (numRating >= 3.0) {
        return '보통 수준의 상담사입니다';
    } else if (numRating >= 2.0) {
        return '개선이 필요한 상담사입니다';
    } else {
        return '평점 정보가 부족합니다';
    }
};

export default {
    getConsultantRatingInfo,
    getRatingStars,
    getRatingGrade,
    getRatingHistory,
    getRatingStatistics,
    getRatingDescription
};
