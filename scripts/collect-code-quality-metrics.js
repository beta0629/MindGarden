#!/usr/bin/env node

/**
 * 코드 품질 메트릭 수집 스크립트
 * Week 13 Day 1: 코드 품질 모니터링 대시보드 구축
 * 
 * 수집 항목:
 * 1. 코드 커버리지
 * 2. 코드 복잡도
 * 3. 기술 부채
 * 4. 하드코딩 통계
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 정의
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

// 리포트 구조
const report = {
    timestamp: new Date().toISOString(),
    metrics: {
        codeCoverage: null,
        codeComplexity: null,
        technicalDebt: null,
        hardcoding: null,
        testCount: null,
        fileCount: null,
        lineCount: null
    }
};

// 파일 수 및 라인 수 계산
function countFilesAndLines(dir, extensions = ['.java', '.js', '.jsx', '.ts', '.tsx']) {
    let fileCount = 0;
    let lineCount = 0;
    
    function traverse(currentDir) {
        if (!fs.existsSync(currentDir)) {
            return;
        }
        
        const files = fs.readdirSync(currentDir);
        
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            
            try {
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    if (!file.startsWith('.') && 
                        file !== 'node_modules' && 
                        file !== 'target' && 
                        file !== 'build' &&
                        file !== 'dist' &&
                        file !== '.git') {
                        traverse(filePath);
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(file);
                    if (extensions.includes(ext)) {
                        fileCount++;
                        const content = fs.readFileSync(filePath, 'utf8');
                        lineCount += content.split('\n').length;
                    }
                }
            } catch (err) {
                // 무시
            }
        });
    }
    
    traverse(dir);
    return { fileCount, lineCount };
}

// 테스트 수 계산
function countTests() {
    let testCount = 0;
    
    const testDirs = [
        path.join(process.cwd(), 'src', 'test'),
        path.join(process.cwd(), 'frontend', 'src', '__tests__'),
    ];
    
    testDirs.forEach(testDir => {
        if (fs.existsSync(testDir)) {
            function traverse(currentDir) {
                const files = fs.readdirSync(currentDir);
                
                files.forEach(file => {
                    const filePath = path.join(currentDir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        traverse(filePath);
                    } else if (stat.isFile()) {
                        const ext = path.extname(file);
                        if ((ext === '.java' && file.includes('Test')) || 
                            (ext === '.js' && file.includes('.test.')) ||
                            (ext === '.ts' && file.includes('.test.'))) {
                            testCount++;
                        }
                    }
                });
            }
            traverse(testDir);
        }
    });
    
    return testCount;
}

// 하드코딩 리포트 읽기
function readHardcodingReport() {
    const reportDir = path.join(process.cwd(), 'test-reports', 'hardcoding');
    if (!fs.existsSync(reportDir)) {
        return null;
    }
    
    const files = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('hardcoding-report-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        return null;
    }
    
    const latestReport = path.join(reportDir, files[0]);
    return JSON.parse(fs.readFileSync(latestReport, 'utf8'));
}

// 코드 커버리지 읽기 (Maven Surefire 리포트)
function readCodeCoverage() {
    const surefireDir = path.join(process.cwd(), 'target', 'surefire-reports');
    if (!fs.existsSync(surefireDir)) {
        return null;
    }
    
    // 간단한 구현: 테스트 실행 여부만 확인
    const files = fs.readdirSync(surefireDir)
        .filter(f => f.endsWith('.txt'));
    
    if (files.length === 0) {
        return null;
    }
    
    // 실제 커버리지는 JaCoCo 리포트를 읽어야 함
    // 여기서는 기본 정보만 반환
    return {
        testReports: files.length,
        note: 'JaCoCo 리포트를 통한 상세 커버리지는 별도 설정 필요'
    };
}

// 메인 실행
function main() {
    console.log(`${BLUE}📊 코드 품질 메트릭 수집 시작...${RESET}\n`);
    
    const rootDir = process.cwd();
    const srcDirs = [
        path.join(rootDir, 'src'),
        path.join(rootDir, 'frontend', 'src'),
    ];
    
    // 파일 수 및 라인 수 계산
    console.log(`${BLUE}📁 파일 및 라인 수 계산 중...${RESET}`);
    let totalFiles = 0;
    let totalLines = 0;
    
    srcDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const { fileCount, lineCount } = countFilesAndLines(dir);
            totalFiles += fileCount;
            totalLines += lineCount;
        }
    });
    
    report.metrics.fileCount = totalFiles;
    report.metrics.lineCount = totalLines;
    console.log(`  - 파일 수: ${totalFiles}개`);
    console.log(`  - 라인 수: ${totalLines}줄\n`);
    
    // 테스트 수 계산
    console.log(`${BLUE}🧪 테스트 수 계산 중...${RESET}`);
    const testCount = countTests();
    report.metrics.testCount = testCount;
    console.log(`  - 테스트 파일 수: ${testCount}개\n`);
    
    // 하드코딩 리포트 읽기
    console.log(`${BLUE}🔍 하드코딩 리포트 읽기 중...${RESET}`);
    const hardcodingReport = readHardcodingReport();
    if (hardcodingReport) {
        report.metrics.hardcoding = {
            errors: hardcodingReport.summary.errors,
            warnings: hardcodingReport.summary.warnings,
            totalFiles: hardcodingReport.totalFiles
        };
        console.log(`  - 오류: ${hardcodingReport.summary.errors}개`);
        console.log(`  - 경고: ${hardcodingReport.summary.warnings}개\n`);
    } else {
        console.log(`  - 하드코딩 리포트 없음\n`);
    }
    
    // 코드 커버리지 읽기
    console.log(`${BLUE}📈 코드 커버리지 확인 중...${RESET}`);
    const coverage = readCodeCoverage();
    if (coverage) {
        report.metrics.codeCoverage = coverage;
        console.log(`  - 테스트 리포트: ${coverage.testReports}개\n`);
    } else {
        console.log(`  - 커버리지 리포트 없음\n`);
    }
    
    // 리포트 저장
    const reportDir = path.join(process.cwd(), 'test-reports', 'code-quality');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `code-quality-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`${GREEN}✅ 코드 품질 메트릭 수집 완료${RESET}`);
    console.log(`${BLUE}📄 리포트 저장: ${reportPath}${RESET}\n`);
    
    // 요약 출력
    console.log(`${BLUE}📊 코드 품질 요약:${RESET}`);
    console.log(`  - 파일 수: ${totalFiles}개`);
    console.log(`  - 라인 수: ${totalLines}줄`);
    console.log(`  - 테스트 파일 수: ${testCount}개`);
    if (hardcodingReport) {
        console.log(`  - 하드코딩 오류: ${hardcodingReport.summary.errors}개`);
        console.log(`  - 하드코딩 경고: ${hardcodingReport.summary.warnings}개`);
    }
}

main();

