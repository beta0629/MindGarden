#!/usr/bin/env node

/**
 * 코드 품질 리포트 자동 생성 스크립트
 * Week 13 Day 4: 코드 품질 리포트 자동 생성
 * 
 * 리포트 항목:
 * 1. 코드 커버리지
 * 2. 하드코딩 통계
 * 3. 코드 복잡도
 * 4. 기술 부채
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 정의
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// 리포트 구조
const report = {
    timestamp: new Date().toISOString(),
    period: 'weekly', // weekly, monthly
    summary: {
        codeCoverage: null,
        hardcoding: null,
        testCount: null,
        fileCount: null,
        lineCount: null,
        technicalDebt: null
    },
    details: {}
};

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

// 코드 품질 메트릭 읽기
function readCodeQualityMetrics() {
    const reportDir = path.join(process.cwd(), 'test-reports', 'code-quality');
    if (!fs.existsSync(reportDir)) {
        return null;
    }
    
    const files = fs.readdirSync(reportDir)
        .filter(f => f.startsWith('code-quality-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        return null;
    }
    
    const latestReport = path.join(reportDir, files[0]);
    return JSON.parse(fs.readFileSync(latestReport, 'utf8'));
}

// 기술 부채 추정 (간단한 추정)
function estimateTechnicalDebt(hardcodingReport, codeQualityMetrics) {
    let debtScore = 0;
    const issues = [];
    
    if (hardcodingReport) {
        const errorCount = hardcodingReport.summary.errors || 0;
        const warningCount = hardcodingReport.summary.warnings || 0;
        
        debtScore += errorCount * 10; // 오류당 10점
        debtScore += Math.min(warningCount / 10, 50); // 경고는 최대 50점
        
        if (errorCount > 0) {
            issues.push({
                type: 'hardcoding_errors',
                count: errorCount,
                severity: 'high',
                description: '하드코딩 오류가 발견되었습니다.'
            });
        }
        
        if (warningCount > 100) {
            issues.push({
                type: 'hardcoding_warnings',
                count: warningCount,
                severity: 'medium',
                description: '하드코딩 경고가 다수 발견되었습니다.'
            });
        }
    }
    
    // 테스트 커버리지 기반 부채 추정
    if (codeQualityMetrics && codeQualityMetrics.metrics) {
        const testCount = codeQualityMetrics.metrics.testCount || 0;
        const fileCount = codeQualityMetrics.metrics.fileCount || 0;
        
        if (fileCount > 0) {
            const testRatio = testCount / fileCount;
            if (testRatio < 0.1) {
                debtScore += 20;
                issues.push({
                    type: 'low_test_coverage',
                    testRatio: testRatio,
                    severity: 'medium',
                    description: '테스트 커버리지가 낮습니다.'
                });
            }
        }
    }
    
    return {
        score: debtScore,
        level: debtScore < 20 ? 'low' : debtScore < 50 ? 'medium' : 'high',
        issues: issues
    };
}

// 메인 실행
function main() {
    console.log(`${BLUE}📊 코드 품질 리포트 생성 시작...${RESET}\n`);
    
    // 하드코딩 리포트 읽기
    console.log(`${BLUE}🔍 하드코딩 리포트 읽기 중...${RESET}`);
    const hardcodingReport = readHardcodingReport();
    if (hardcodingReport) {
        report.summary.hardcoding = {
            errors: hardcodingReport.summary.errors,
            warnings: hardcodingReport.summary.warnings,
            totalFiles: hardcodingReport.totalFiles
        };
        report.details.hardcoding = hardcodingReport;
        console.log(`  - 오류: ${hardcodingReport.summary.errors}개`);
        console.log(`  - 경고: ${hardcodingReport.summary.warnings}개\n`);
    } else {
        console.log(`  - 하드코딩 리포트 없음\n`);
    }
    
    // 코드 품질 메트릭 읽기
    console.log(`${BLUE}📈 코드 품질 메트릭 읽기 중...${RESET}`);
    const codeQualityMetrics = readCodeQualityMetrics();
    if (codeQualityMetrics) {
        report.summary.codeCoverage = codeQualityMetrics.metrics.codeCoverage;
        report.summary.testCount = codeQualityMetrics.metrics.testCount;
        report.summary.fileCount = codeQualityMetrics.metrics.fileCount;
        report.summary.lineCount = codeQualityMetrics.metrics.lineCount;
        report.details.codeQuality = codeQualityMetrics;
        console.log(`  - 파일 수: ${codeQualityMetrics.metrics.fileCount}개`);
        console.log(`  - 테스트 파일 수: ${codeQualityMetrics.metrics.testCount}개\n`);
    } else {
        console.log(`  - 코드 품질 메트릭 없음\n`);
    }
    
    // 기술 부채 추정
    console.log(`${BLUE}💳 기술 부채 추정 중...${RESET}`);
    const technicalDebt = estimateTechnicalDebt(hardcodingReport, codeQualityMetrics);
    report.summary.technicalDebt = technicalDebt;
    console.log(`  - 부채 점수: ${technicalDebt.score}`);
    console.log(`  - 부채 수준: ${technicalDebt.level}`);
    console.log(`  - 이슈 수: ${technicalDebt.issues.length}개\n`);
    
    // 리포트 저장
    const reportDir = path.join(process.cwd(), 'test-reports', 'code-quality-reports');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `code-quality-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`${GREEN}✅ 코드 품질 리포트 생성 완료${RESET}`);
    console.log(`${BLUE}📄 리포트 저장: ${reportPath}${RESET}\n`);
    
    // 요약 출력
    console.log(`${BLUE}📊 코드 품질 리포트 요약:${RESET}`);
    console.log(`  - 하드코딩 오류: ${report.summary.hardcoding?.errors || 0}개`);
    console.log(`  - 하드코딩 경고: ${report.summary.hardcoding?.warnings || 0}개`);
    console.log(`  - 테스트 파일 수: ${report.summary.testCount || 0}개`);
    console.log(`  - 기술 부채 수준: ${technicalDebt.level}`);
    console.log(`  - 기술 부채 점수: ${technicalDebt.score}`);
}

main();

