const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/admin/ClientComprehensiveManagement.js');

// CSS 클래스 매핑
const classMappings = {
    'client-comp-container': 'mg-v2-client-comp-container',
    'client-comp-header': 'mg-v2-client-comp-header',
    'client-comp-main-tab-buttons': 'mg-v2-client-comp-main-tab-buttons',
    'client-comp-stats-overview': 'mg-v2-client-comp-stats-overview',
    'client-comp-stat-card': 'mg-v2-client-comp-stat-card',
    'client-comp-stat-icon': 'mg-v2-client-comp-stat-icon',
    'client-comp-stat-content': 'mg-v2-client-comp-stat-content',
    'client-comp-stat-number': 'mg-v2-client-comp-stat-number',
    'client-comp-stat-label': 'mg-v2-client-comp-stat-label',
    'client-comp-client-list-section': 'mg-v2-client-comp-client-list-section',
    'client-comp-section-header': 'mg-v2-client-comp-section-header',
    'client-comp-filters': 'mg-v2-client-comp-filters',
    'client-comp-search-input': 'mg-v2-client-comp-search-input',
    'client-comp-filter-select': 'mg-v2-client-comp-filter-select',
    'client-comp-client-grid': 'mg-v2-client-comp-client-grid',
    'client-comp-client-avatar': 'mg-v2-client-comp-client-avatar',
    'client-comp-client-info': 'mg-v2-client-comp-client-info',
    'client-comp-client-status': 'mg-v2-client-comp-client-status',
    'client-comp-client-name': 'mg-v2-client-comp-client-name',
    'client-comp-client-email': 'mg-v2-client-comp-client-email',
    'client-detail-section': 'mg-v2-client-detail-section',
    'detail-header': 'mg-v2-detail-header',
    'tab-buttons': 'mg-v2-tab-buttons',
    'detail-content': 'mg-v2-detail-content',
    'overview-tab': 'mg-v2-overview-tab',
    'overview-grid': 'mg-v2-overview-grid',
    'overview-card': 'mg-v2-overview-card',
    'info-list': 'mg-v2-info-list',
    'info-item': 'mg-v2-info-item',
    'label': 'mg-v2-info-label',
    'value': 'mg-v2-info-value',
    'mapping-tab': 'mg-v2-mapping-tab',
    'mapping-details': 'mg-v2-mapping-details',
    'mapping-info': 'mg-v2-mapping-info',
    'no-mapping': 'mg-v2-no-mapping',
    'consultations-tab': 'mg-v2-consultations-tab',
    'consultations-list': 'mg-v2-consultations-list',
    'consultation-item': 'mg-v2-consultation-item',
    'consultation-date': 'mg-v2-consultation-date',
    'consultation-time': 'mg-v2-consultation-time',
    'consultation-status': 'mg-v2-consultation-status',
    'no-consultations': 'mg-v2-no-consultations',
    'sessions-tab': 'mg-v2-sessions-tab',
    'sessions-info': 'mg-v2-sessions-info',
    'session-stats': 'mg-v2-session-stats',
    'session-stat': 'mg-v2-session-stat',
    'stat-number': 'mg-v2-session-stat-number',
    'stat-label': 'mg-v2-session-stat-label',
    'session-progress': 'mg-v2-session-progress',
    'progress-bar': 'mg-v2-session-progress-bar',
    'progress-fill': 'mg-v2-session-progress-fill',
    'progress-text': 'mg-v2-session-progress-text',
    'no-sessions': 'mg-v2-no-sessions',
    'basic-management-tab': 'mg-v2-basic-management-tab',
    'basic-management-content': 'mg-v2-basic-management-content',
    'basic-actions': 'mg-v2-basic-actions',
    'client-comp-filter-container': 'mg-v2-client-comp-filter-container',
    'client-comp-filter-content': 'mg-v2-client-comp-filter-content',
    'status-badge': 'mg-v2-status-badge',
    'client-phone': 'mg-v2-client-phone',
    'client-grade': 'mg-v2-client-grade',
    'client-date': 'mg-v2-client-date',
    'client-sessions': 'mg-v2-client-sessions'
};

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 각 클래스 매핑에 대해 교체
    Object.entries(classMappings).forEach(([oldClass, newClass]) => {
        // className="oldClass" 패턴 교체
        const classNamePattern = new RegExp(`className="([^"]*\\s)?${oldClass}(\\s[^"]*)?"`, 'g');
        content = content.replace(classNamePattern, (match, before, after) => {
            const beforeStr = before || '';
            const afterStr = after || '';
            return `className="${beforeStr}${newClass}${afterStr}"`;
        });
        
        // className='oldClass' 패턴 교체
        const classNamePatternSingle = new RegExp(`className='([^']*\\s)?${oldClass}(\\s[^']*)?'`, 'g');
        content = content.replace(classNamePatternSingle, (match, before, after) => {
            const beforeStr = before || '';
            const afterStr = after || '';
            return `className='${beforeStr}${newClass}${afterStr}'`;
        });
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ ClientComprehensiveManagement.js CSS 클래스 접두사 변경 완료');
    
} catch (error) {
    console.error('❌ 오류 발생:', error.message);
}
