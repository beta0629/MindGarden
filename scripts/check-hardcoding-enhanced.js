#!/usr/bin/env node

/**
 * 하드코딩 검사 스크립트 (개선 버전)
 * Week 13 Day 1: 하드코딩 감지 시스템 구축
 * 
 * 개선 사항:
 * 1. 더 정확한 패턴 감지
 * 2. JSON 리포트 생성
 * 3. 빌드 통합 지원
 * 4. 상수 파일 자동 인식
 */

const fs = require('fs');
const path = require('path');

// 색상 정의
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// 검사 결과
let errorCount = 0;
let warningCount = 0;
const errors = [];
const report = {
    timestamp: new Date().toISOString(),
    totalFiles: 0,
    errors: [],
    warnings: [],
    summary: {
        errors: 0,
        warnings: 0
    }
};

// 상수 파일 경로 (자동 인식)
const constantsPaths = [
    'src/main/java/com/mindgarden/consultation/constant',
    'src/main/java/com/coresolution/core/constant',
    'frontend/src/constants',
    'frontend/src/utils/constants'
];

// 상수 파일 목록 (캐시)
let constantsFiles = new Set();

// 하드코딩 패턴 정의 (개선)
const patterns = [
    {
        name: '한글 문자열 하드코딩',
        pattern: /["']([가-힣]{2,})["']/g,
        message: '한글 문자열은 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,           // 주석 제외
            /\/\*[\s\S]*?\*\//, // 블록 주석 제외
            /@.*/,              // 어노테이션 제외
            /log\.(info|debug|warn|error)\(/, // 로그 메시지 제외 (경고만)
            /System\.out\.println\(/, // System.out.println 제외 (경고만)
            /@Value\s*\(/,      // @Value 어노테이션 제외
            /@ConfigurationProperties/, // 설정 속성 제외
        ],
        severity: 'warning',
        category: 'string'
    },
    {
        name: '영문 문자열 하드코딩 (긴 문자열)',
        pattern: /["']([A-Za-z\s]{20,})["']/g,
        message: '긴 영문 문자열은 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@.*/,
            /log\.(info|debug|warn|error)\(/,
            /System\.out\.println\(/,
            /@Value\s*\(/,
            /@ConfigurationProperties/,
        ],
        severity: 'warning',
        category: 'string'
    },
    {
        name: 'URL 하드코딩',
        pattern: /["'](https?:\/\/[^\s"']+)["']/g,
        message: 'URL은 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@.*/,
            /@Value\s*\(/,      // 환경 변수에서 가져오는 경우 제외
        ],
        severity: 'error',
        category: 'url'
    },
    {
        name: 'IP 주소 하드코딩',
        pattern: /["'](\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})["']/g,
        message: 'IP 주소는 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@Value\s*\(/,
            /127\.0\.0\.1|localhost/, // localhost IP 제외
        ],
        severity: 'error',
        category: 'network'
    },
    {
        name: '매직 넘버 (큰 숫자)',
        pattern: /\b([0-9]{4,})\b/g,
        message: '큰 숫자는 상수로 정의해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@.*/,
            /version\s*[:=]\s*/, // 버전 번호 제외
            /port\s*[:=]\s*/,    // 포트 번호 제외 (일부)
            /@Value\s*\(/,        // 환경 변수 제외
            /timestamp|time|date|year|month|day/i, // 시간 관련 제외
        ],
        severity: 'warning',
        category: 'number'
    },
    {
        name: '이메일 주소 하드코딩',
        pattern: /["']([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/g,
        message: '이메일 주소는 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@Value\s*\(/,
        ],
        severity: 'warning',
        category: 'email'
    },
    {
        name: '파일 경로 하드코딩',
        pattern: /["']([\/\\][^\s"']*\.(java|js|jsx|ts|tsx|css|html|xml|yml|yaml|properties|sql))["']/g,
        message: '파일 경로는 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /import\s+.*/,       // import 문 제외
            /require\s*\(/,       // require 문 제외
            /@Value\s*\(/,
        ],
        severity: 'warning',
        category: 'path'
    }
];

// 상수 파일 목록 수집
function collectConstantsFiles() {
    constantsPaths.forEach(constantsPath => {
        const fullPath = path.join(process.cwd(), constantsPath);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            files.forEach(file => {
                if (typeof file === 'string' && (file.endsWith('.java') || file.endsWith('.js') || file.endsWith('.ts'))) {
                    constantsFiles.add(path.join(fullPath, file));
                }
            });
        }
    });
}

// 파일이 상수 파일인지 확인
function isConstantsFile(filePath) {
    return Array.from(constantsFiles).some(constFile => {
        const relative = path.relative(process.cwd(), filePath);
        return relative.includes('constant') || relative.includes('constants');
    });
}

// 파일 검사
function checkFile(filePath) {
    // 상수 파일은 검사 제외
    if (isConstantsFile(filePath)) {
        return;
    }
    
    report.totalFiles++;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNumber - 1];
            
            // 제외 패턴 확인
            const shouldExclude = pattern.exclude.some(excludePattern => {
                const excludeRegex = new RegExp(excludePattern.source, excludePattern.flags);
                return excludeRegex.test(line);
            });
            
            if (!shouldExclude) {
                const error = {
                    file: relativePath,
                    line: lineNumber,
                    column: match.index - content.substring(0, match.index).lastIndexOf('\n'),
                    pattern: pattern.name,
                    category: pattern.category,
                    message: pattern.message,
                    severity: pattern.severity,
                    code: line.trim(),
                    match: match[1] || match[0]
                };
                
                errors.push(error);
                
                if (pattern.severity === 'error') {
                    errorCount++;
                    report.errors.push(error);
                    report.summary.errors++;
                } else {
                    warningCount++;
                    report.warnings.push(error);
                    report.summary.warnings++;
                }
            }
        }
    });
}

// 디렉토리 재귀 검사
function checkDirectory(dirPath, extensions = ['.java', '.js', '.jsx', '.ts', '.tsx']) {
    if (!fs.existsSync(dirPath)) {
        return;
    }
    
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        
        try {
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // node_modules, .git 등 제외
                if (!file.startsWith('.') && 
                    file !== 'node_modules' && 
                    file !== 'target' && 
                    file !== 'build' &&
                    file !== 'dist' &&
                    file !== '.git') {
                    checkDirectory(filePath, extensions);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(file);
                if (extensions.includes(ext)) {
                    checkFile(filePath);
                }
            }
        } catch (err) {
            // 권한 오류 등 무시
        }
    });
}

// JSON 리포트 생성
function generateReport() {
    const reportDir = path.join(process.cwd(), 'test-reports', 'hardcoding');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `hardcoding-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`${BLUE}📄 리포트 생성: ${reportPath}${RESET}\n`);
    
    return reportPath;
}

// 메인 실행
function main() {
    console.log(`${YELLOW}🔍 하드코딩 검사 시작 (개선 버전)...${RESET}\n`);
    
    // 상수 파일 수집
    collectConstantsFiles();
    console.log(`${BLUE}📋 상수 파일 ${constantsFiles.size}개 인식${RESET}\n`);
    
    const rootDir = process.cwd();
    const srcDirs = [
        path.join(rootDir, 'src'),
        path.join(rootDir, 'frontend', 'src'),
    ];
    
    srcDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            checkDirectory(dir);
        }
    });
    
    // 결과 출력
    console.log(`\n${YELLOW}검사 결과:${RESET}`);
    console.log(`  - 검사 파일: ${report.totalFiles}개`);
    console.log(`  - 오류: ${RED}${errorCount}${RESET}`);
    console.log(`  - 경고: ${YELLOW}${warningCount}${RESET}\n`);
    
    if (errors.length > 0) {
        console.log(`${RED}하드코딩 감지:${RESET}\n`);
        
        // 오류 먼저 출력
        const errorList = errors.filter(e => e.severity === 'error');
        const warningList = errors.filter(e => e.severity === 'warning');
        
        if (errorList.length > 0) {
            console.log(`${RED}오류 (${errorList.length}개):${RESET}\n`);
            errorList.slice(0, 10).forEach((error, index) => {
                console.log(`${RED}[ERROR]${RESET} ${error.file}:${error.line}:${error.column}`);
                console.log(`  패턴: ${error.pattern}`);
                console.log(`  메시지: ${error.message}`);
                console.log(`  코드: ${error.code}`);
                console.log(`  매칭: ${error.match}`);
                console.log('');
            });
            if (errorList.length > 10) {
                console.log(`${RED}... ${errorList.length - 10}개 더 있음${RESET}\n`);
            }
        }
        
        if (warningList.length > 0 && errorList.length === 0) {
            console.log(`${YELLOW}경고 (${warningList.length}개):${RESET}\n`);
            warningList.slice(0, 10).forEach((error, index) => {
                console.log(`${YELLOW}[WARNING]${RESET} ${error.file}:${error.line}:${error.column}`);
                console.log(`  패턴: ${error.pattern}`);
                console.log(`  메시지: ${error.message}`);
                console.log(`  코드: ${error.code}`);
                console.log('');
            });
            if (warningList.length > 10) {
                console.log(`${YELLOW}... ${warningList.length - 10}개 더 있음${RESET}\n`);
            }
        }
        
        // 리포트 생성
        generateReport();
        
        if (errorCount > 0) {
            console.log(`${RED}❌ 하드코딩 검사 실패: ${errorCount}개의 오류가 발견되었습니다.${RESET}`);
            process.exit(1);
        } else {
            console.log(`${YELLOW}⚠️ 하드코딩 검사 경고: ${warningCount}개의 경고가 발견되었습니다.${RESET}`);
            process.exit(0);
        }
    } else {
        console.log(`${GREEN}✅ 하드코딩 검사 통과${RESET}`);
        generateReport();
        process.exit(0);
    }
}

main();

