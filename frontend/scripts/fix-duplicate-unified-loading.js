#!/usr/bin/env node

/**
 * 중복된 UnifiedLoading import를 제거하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// 모든 컴포넌트 디렉토리
const componentDirs = [
    path.join(__dirname, '../src/components/admin'),
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

// 중복 import 제거 함수
function removeDuplicateUnifiedLoading(content) {
    let updatedContent = content;
    
    // UnifiedLoading import 라인들을 찾기
    const unifiedLoadingImports = updatedContent.match(/import\s+UnifiedLoading\s+from\s+['"][^'"]+['"];?\n?/g);
    
    if (unifiedLoadingImports && unifiedLoadingImports.length > 1) {
        // 모든 UnifiedLoading import 제거
        updatedContent = updatedContent.replace(/import\s+UnifiedLoading\s+from\s+['"][^'"]+['"];?\n?/g, '');
        
        // 첫 번째 import 다음에 UnifiedLoading import 추가
        const lines = updatedContent.split('\n');
        const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import '));
        
        if (firstImportIndex !== -1) {
            // 상대 경로 계산
            let relativePath = '../common/UnifiedLoading';
            if (updatedContent.includes('src/components/admin/')) {
                relativePath = '../common/UnifiedLoading';
            } else if (updatedContent.includes('src/components/consultant/') || 
                      updatedContent.includes('src/components/client/') ||
                      updatedContent.includes('src/components/schedule/') ||
                      updatedContent.includes('src/components/dashboard/') ||
                      updatedContent.includes('src/components/wellness/') ||
                      updatedContent.includes('src/components/consultation/') ||
                      updatedContent.includes('src/components/notifications/') ||
                      updatedContent.includes('src/components/mypage/') ||
                      updatedContent.includes('src/components/auth/') ||
                      updatedContent.includes('src/components/statistics/') ||
                      updatedContent.includes('src/components/compliance/') ||
                      updatedContent.includes('src/components/finance/') ||
                      updatedContent.includes('src/components/super-admin/') ||
                      updatedContent.includes('src/components/mindgarden/') ||
                      updatedContent.includes('src/components/layout/')) {
                relativePath = '../common/UnifiedLoading';
            } else if (updatedContent.includes('src/components/hq/') || 
                      updatedContent.includes('src/components/erp/')) {
                relativePath = '../common/UnifiedLoading';
            }
            
            lines.splice(firstImportIndex + 1, 0, `import UnifiedLoading from '${relativePath}';`);
            updatedContent = lines.join('\n');
        }
    }
    
    return updatedContent;
}

// 파일 처리 함수
function processFile(filePath) {
    try {
        console.log(`📝 처리 중: ${path.basename(filePath)}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = removeDuplicateUnifiedLoading(content);
        
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
    console.log('🚀 중복 UnifiedLoading import 제거 시작...\n');
    
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

module.exports = { removeDuplicateUnifiedLoading, processFile };
