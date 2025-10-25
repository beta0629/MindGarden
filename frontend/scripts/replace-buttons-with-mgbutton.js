#!/usr/bin/env node

/**
 * Admin 컴포넌트의 모든 <button> 태그를 MGButton으로 교체하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// Admin 컴포넌트 디렉토리
const adminDir = path.join(__dirname, '../src/components/admin');

// MGButton import가 필요한 파일들
const filesToUpdate = [
    'AdminMessages.js',
    'ClientComprehensiveManagement.js',
    'ConsultationCompletionStats.js',
    'SystemNotificationManagement.js',
    'SessionManagement.js',
    'CommonCodeManagement.js',
    'ConsultantComprehensiveManagement.js',
    'MappingCard.js',
    'AdminDashboard.js',
    'UserManagement.js',
    'MappingManagement.js',
    'AccountManagement.js',
    'WellnessManagement.js',
    'VacationStatistics.js',
    'TodayStatistics.js',
    'StatisticsDashboard.js',
    'BranchManagement.js'
];

// button 태그를 MGButton으로 교체하는 함수
function replaceButtonsWithMGButton(content) {
    let updatedContent = content;
    
    // MGButton import 추가 (이미 있으면 스킵)
    if (!updatedContent.includes("import MGButton from '../common/MGButton';") && 
        !updatedContent.includes("import MGButton from '../common/MGButton';")) {
        // React import 다음에 MGButton import 추가
        updatedContent = updatedContent.replace(
            /(import React[^;]+;)/,
            "$1\nimport MGButton from '../common/MGButton';"
        );
    }
    
    // 일반적인 button 패턴들을 MGButton으로 교체
    const buttonPatterns = [
        // 기본 button 태그
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*([^<]+)\s*<\/button>/g,
            replacement: '<MGButton variant="primary" className="$1" onClick={$2}>$3</MGButton>'
        },
        // aria-label이 있는 button
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s+aria-label="([^"]*)"\s*>\s*([^<]+)\s*<\/button>/g,
            replacement: '<MGButton variant="primary" className="$1" onClick={$2} aria-label="$3">$4</MGButton>'
        },
        // disabled가 있는 button
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s+disabled=\{([^}]+)\}\s*>\s*([^<]+)\s*<\/button>/g,
            replacement: '<MGButton variant="primary" className="$1" onClick={$2} disabled={$3}>$4</MGButton>'
        },
        // 닫기 버튼 (×, ✕)
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*[×✕]\s*<\/button>/g,
            replacement: '<MGButton variant="outline" size="small" className="$1" onClick={$2}>×</MGButton>'
        },
        // 취소 버튼
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*취소\s*<\/button>/g,
            replacement: '<MGButton variant="outline" className="$1" onClick={$2}>취소</MGButton>'
        },
        // 닫기 버튼 (텍스트)
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*닫기\s*<\/button>/g,
            replacement: '<MGButton variant="outline" className="$1" onClick={$2}>닫기</MGButton>'
        },
        // 위험한 액션 버튼 (삭제, 제거 등)
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*(삭제|제거|삭제하기|제거하기)\s*<\/button>/g,
            replacement: '<MGButton variant="danger" className="$1" onClick={$2}>$3</MGButton>'
        },
        // 성공 액션 버튼 (저장, 등록, 생성 등)
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*(저장|등록|생성|추가|확인)\s*<\/button>/g,
            replacement: '<MGButton variant="success" className="$1" onClick={$2}>$3</MGButton>'
        },
        // 새로고침 버튼
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*🔄\s*새로고침\s*<\/button>/g,
            replacement: '<MGButton variant="secondary" className="$1" onClick={$2}>🔄 새로고침</MGButton>'
        },
        // 필터 초기화 버튼
        {
            pattern: /<button\s+className="([^"]*)"\s+onClick=\{([^}]+)\}\s*>\s*🔄\s*필터\s*초기화\s*<\/button>/g,
            replacement: '<MGButton variant="secondary" size="small" className="$1" onClick={$2}>🔄 필터 초기화</MGButton>'
        }
    ];
    
    // 각 패턴 적용
    buttonPatterns.forEach(({ pattern, replacement }) => {
        updatedContent = updatedContent.replace(pattern, replacement);
    });
    
    return updatedContent;
}

// 파일 처리 함수
function processFile(filePath) {
    try {
        console.log(`📝 처리 중: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = replaceButtonsWithMGButton(content);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ 완료: ${filePath}`);
            return true;
        } else {
            console.log(`⏭️  변경사항 없음: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 오류 발생: ${filePath}`, error.message);
        return false;
    }
}

// 메인 실행
function main() {
    console.log('🚀 Admin 컴포넌트 <button> → MGButton 교체 시작...\n');
    
    let processedCount = 0;
    let updatedCount = 0;
    
    filesToUpdate.forEach(fileName => {
        const filePath = path.join(adminDir, fileName);
        
        if (fs.existsSync(filePath)) {
            processedCount++;
            if (processFile(filePath)) {
                updatedCount++;
            }
        } else {
            console.log(`⚠️  파일 없음: ${filePath}`);
        }
    });
    
    console.log(`\n📊 처리 완료:`);
    console.log(`   - 처리된 파일: ${processedCount}개`);
    console.log(`   - 업데이트된 파일: ${updatedCount}개`);
    console.log(`   - 변경사항 없음: ${processedCount - updatedCount}개`);
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { replaceButtonsWithMGButton, processFile };
