#!/usr/bin/env node

/**
 * 브랜치 코드 사용 현황 분석 스크립트
 * 표준화 작업: 브랜치 코드 완전 제거
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../..');

// 브랜치 코드 패턴
const BRANCH_PATTERNS = [
    /branchCode/gi,
    /branchId/gi,
    /branch_code/gi,
    /branch_id/gi,
    /BranchCode/gi,
    /BranchId/gi,
    /BRANCH_CODE/gi,
    /BRANCH_ID/gi,
];

// 제외할 파일/디렉토리
const EXCLUDE_PATTERNS = [
    'node_modules',
    'target',
    '.git',
    'backup',
    '.backup',
    'migration',  // 마이그레이션 파일은 제외
    'V2__',       // 브랜치 마이그레이션 파일 제외
    'V3__',       // 브랜치 마이그레이션 파일 제외
];

// 결과 저장
const results = {
    backend: [],
    frontend: [],
    total: 0
};

/**
 * 파일이 제외 대상인지 확인
 */
function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * 파일에서 브랜치 코드 사용 검사
 */
function checkFile(filePath) {
    if (shouldExclude(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = [];
        
        BRANCH_PATTERNS.forEach(pattern => {
            const regex = new RegExp(pattern, 'g');
            let match;
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                if (regex.test(line)) {
                    // 주석인지 확인
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*') && !trimmedLine.startsWith('/*')) {
                        matches.push({
                            pattern: pattern.toString(),
                            line: index + 1,
                            content: line.trim()
                        });
                    }
                }
            });
        });
        
        if (matches.length > 0) {
            return {
                file: filePath,
                matches: matches,
                count: matches.length
            };
        }
    } catch (error) {
        // 파일 읽기 실패 (권한 등)
        return null;
    }
    
    return null;
}

/**
 * 디렉토리 재귀 검색
 */
function searchDirectory(dirPath, relativePath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (shouldExclude(fullPath)) {
            continue;
        }
        
        if (entry.isDirectory()) {
            searchDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
            // Java 파일
            if (entry.name.endsWith('.java')) {
                const result = checkFile(fullPath);
                if (result) {
                    results.backend.push(result);
                    results.total += result.count;
                }
            }
            // JavaScript/JSX 파일
            else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
                const result = checkFile(fullPath);
                if (result) {
                    results.frontend.push(result);
                    results.total += result.count;
                }
            }
        }
    }
}

// 메인 실행
console.log('🔍 브랜치 코드 사용 현황 분석 시작...\n');

// Backend 검색
console.log('📂 Backend 검색 중...');
const backendDirs = [
    'src/main/java'
];
backendDirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
        searchDirectory(fullPath, dir);
    }
});

// Frontend 검색
console.log('📂 Frontend 검색 중...');
const frontendDirs = [
    'frontend/src'
];
frontendDirs.forEach(dir => {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
        searchDirectory(fullPath, dir);
    }
});

// 결과 출력
console.log('\n========================================');
console.log('📊 브랜치 코드 사용 현황 분석 결과');
console.log('========================================\n');

console.log(`총 발견: ${results.total}개 사용\n`);

console.log(`📁 Backend: ${results.backend.length}개 파일, ${results.backend.reduce((sum, r) => sum + r.count, 0)}개 사용`);
console.log(`📁 Frontend: ${results.frontend.length}개 파일, ${results.frontend.reduce((sum, r) => sum + r.count, 0)}개 사용\n`);

// 상세 결과
console.log('🔍 Backend 상세:');
console.log('---------------------------------------------------');
results.backend.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   사용 횟수: ${result.count}`);
    const uniqueLines = [...new Set(result.matches.map(m => m.line))];
    console.log(`   라인: ${uniqueLines.slice(0, 5).join(', ')}${uniqueLines.length > 5 ? '...' : ''}`);
});

console.log('\n🔍 Frontend 상세:');
console.log('---------------------------------------------------');
results.frontend.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   사용 횟수: ${result.count}`);
    const uniqueLines = [...new Set(result.matches.map(m => m.line))];
    console.log(`   라인: ${uniqueLines.slice(0, 5).join(', ')}${uniqueLines.length > 5 ? '...' : ''}`);
});

// JSON 결과 파일 저장
const reportPath = path.join(PROJECT_ROOT, 'docs/project-management/2025-12-04/BRANCH_CODE_USAGE_REPORT.json');
const reportDir = path.dirname(reportPath);
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\n📄 상세 결과 저장: ${reportPath}`);

// 요약 파일 생성
const summaryPath = path.join(PROJECT_ROOT, 'docs/project-management/2025-12-04/BRANCH_CODE_USAGE_SUMMARY.md');
let summary = `# 브랜치 코드 사용 현황 분석 결과

**분석 일시**: ${new Date().toLocaleString('ko-KR')}

## 📊 전체 현황

- **총 사용 횟수**: ${results.total}개
- **Backend 파일**: ${results.backend.length}개
- **Frontend 파일**: ${results.frontend.length}개

## 📁 Backend 파일 목록

`;

results.backend.forEach((result, index) => {
    summary += `${index + 1}. \`${result.file}\` - ${result.count}개 사용\n`;
});

summary += `\n## 📁 Frontend 파일 목록\n\n`;

results.frontend.forEach((result, index) => {
    summary += `${index + 1}. \`${result.file}\` - ${result.count}개 사용\n`;
});

summary += `\n---\n\n**상세 내용**: \`BRANCH_CODE_USAGE_REPORT.json\` 참조\n`;

fs.writeFileSync(summaryPath, summary, 'utf8');
console.log(`📄 요약 파일 저장: ${summaryPath}`);

console.log('\n✅ 분석 완료!');

