#!/usr/bin/env node

/**
 * 모든 컴포넌트의 기존 로딩 컴포넌트들을 UnifiedLoading으로 교체하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// 컴포넌트 디렉토리들
const componentDirs = [
    path.join(__dirname, '../src/components/consultant'),
    path.join(__dirname, '../src/components/client'),
    path.join(__dirname, '../src/components/schedule'),
    path.join(__dirname, '../src/components/dashboard'),
    path.join(__dirname, '../src/components/hq'),
    path.join(__dirname, '../src/components/erp'),
    path.join(__dirname, '../src/components/wellness'),
    path.join(__dirname, '../src/components/consultation'),
    path.join(__dirname, '../src/components/notifications'),
    path.join(__dirname, '../src/components/mypage'),
    path.join(__dirname, '../src/components/auth'),
    path.join(__dirname, '../src/components/statistics'),
    path.join(__dirname, '../src/components/compliance'),
    path.join(__dirname, '../src/components/finance'),
    path.join(__dirname, '../src/components/super-admin'),
    path.join(__dirname, '../src/components/mindgarden'),
    path.join(__dirname, '../src/components/layout')
];

// 교체할 로딩 컴포넌트들
const loadingComponents = [
    'LoadingSpinner',
    'CommonLoading', 
    'MGLoading',
    'FullscreenLoading',
    'InlineLoading',
    'PageLoading'
];

// 로딩 컴포넌트를 UnifiedLoading으로 교체하는 함수
function replaceLoadingWithUnified(content) {
    let updatedContent = content;
    
    // UnifiedLoading import 추가 (이미 있으면 스킵)
    if (!updatedContent.includes("import UnifiedLoading from '../common/UnifiedLoading';") && 
        !updatedContent.includes("import UnifiedLoading from '../common/UnifiedLoading';") &&
        !updatedContent.includes("import UnifiedLoading from '../../common/UnifiedLoading';") &&
        !updatedContent.includes("import UnifiedLoading from '../../../common/UnifiedLoading';")) {
        
        // 상대 경로 계산하여 UnifiedLoading import 추가
        const lines = updatedContent.split('\n');
        const importLines = lines.filter(line => line.trim().startsWith('import '));
        
        if (importLines.length > 0) {
            // 첫 번째 import 다음에 UnifiedLoading import 추가
            const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import '));
            if (firstImportIndex !== -1) {
                lines.splice(firstImportIndex + 1, 0, "import UnifiedLoading from '../common/UnifiedLoading';");
                updatedContent = lines.join('\n');
            }
        }
    }
    
    // 기존 로딩 컴포넌트 import 제거
    loadingComponents.forEach(component => {
        const importPattern = new RegExp(`import\\s+.*${component}.*from\\s+['"][^'"]+['"];?\\n?`, 'g');
        updatedContent = updatedContent.replace(importPattern, '');
    });
    
    // LoadingSpinner 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<LoadingSpinner\s+([^>]*)>/g,
        '<UnifiedLoading $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/LoadingSpinner>/g,
        '</UnifiedLoading>'
    );
    
    // CommonLoading 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<CommonLoading\s+([^>]*)>/g,
        '<UnifiedLoading $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/CommonLoading>/g,
        '</UnifiedLoading>'
    );
    
    // MGLoading 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<MGLoading\s+([^>]*)>/g,
        '<UnifiedLoading $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/MGLoading>/g,
        '</UnifiedLoading>'
    );
    
    // FullscreenLoading 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<FullscreenLoading\s+([^>]*)>/g,
        '<UnifiedLoading variant="fullscreen" $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/FullscreenLoading>/g,
        '</UnifiedLoading>'
    );
    
    // InlineLoading 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<InlineLoading\s+([^>]*)>/g,
        '<UnifiedLoading variant="inline" $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/InlineLoading>/g,
        '</UnifiedLoading>'
    );
    
    // PageLoading 사용을 UnifiedLoading으로 교체
    updatedContent = updatedContent.replace(
        /<PageLoading\s+([^>]*)>/g,
        '<UnifiedLoading variant="page" $1>'
    );
    updatedContent = updatedContent.replace(
        /<\/PageLoading>/g,
        '</UnifiedLoading>'
    );
    
    // 조건부 로딩 렌더링 패턴 교체
    updatedContent = updatedContent.replace(
        /loading\s*\?\s*<LoadingSpinner/g,
        'loading ? <UnifiedLoading'
    );
    updatedContent = updatedContent.replace(
        /loading\s*\?\s*<CommonLoading/g,
        'loading ? <UnifiedLoading'
    );
    updatedContent = updatedContent.replace(
        /loading\s*\?\s*<MGLoading/g,
        'loading ? <UnifiedLoading'
    );
    
    // 로딩 상태 체크 패턴 교체
    updatedContent = updatedContent.replace(
        /isLoading\s*\?\s*<LoadingSpinner/g,
        'isLoading ? <UnifiedLoading'
    );
    updatedContent = updatedContent.replace(
        /isLoading\s*\?\s*<CommonLoading/g,
        'isLoading ? <UnifiedLoading'
    );
    updatedContent = updatedContent.replace(
        /isLoading\s*\?\s*<MGLoading/g,
        'isLoading ? <UnifiedLoading'
    );
    
    return updatedContent;
}

// 파일 처리 함수
function processFile(filePath) {
    try {
        console.log(`📝 처리 중: ${path.basename(filePath)}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = replaceLoadingWithUnified(content);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ 완료: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⏭️  변경사항 없음: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 오류 발생: ${path.basename(filePath)}`, error.message);
        return false;
    }
}

// 디렉토리에서 파일들을 찾아서 처리
function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return { processed: 0, updated: 0 };
    }
    
    const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.js') && !file.includes('.test.') && !file.includes('.backup'))
        .map(file => path.join(dirPath, file));
    
    let processed = 0;
    let updated = 0;
    
    files.forEach(filePath => {
        processed++;
        if (processFile(filePath)) {
            updated++;
        }
    });
    
    return { processed, updated };
}

// 메인 실행
function main() {
    console.log('🚀 모든 컴포넌트 로딩 컴포넌트 → UnifiedLoading 교체 시작...\n');
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    
    componentDirs.forEach(dirPath => {
        console.log(`\n📁 디렉토리: ${path.basename(dirPath)}`);
        const { processed, updated } = processDirectory(dirPath);
        totalProcessed += processed;
        totalUpdated += updated;
    });
    
    console.log(`\n📊 전체 처리 완료:`);
    console.log(`   - 처리된 파일: ${totalProcessed}개`);
    console.log(`   - 업데이트된 파일: ${totalUpdated}개`);
    console.log(`   - 변경사항 없음: ${totalProcessed - totalUpdated}개`);
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { replaceLoadingWithUnified, processFile };
