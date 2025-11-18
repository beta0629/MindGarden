#!/usr/bin/env node

/**
 * 하드코딩 검사 스크립트
 * Week 0 Day 5: 코드 품질 도구 설정
 * 
 * 검사 항목:
 * 1. 문자열 하드코딩 (한글/영문 문자열 직접 사용)
 * 2. 숫자 하드코딩 (매직 넘버)
 * 3. URL/경로 하드코딩
 * 4. IP 주소 하드코딩
 */

const fs = require('fs');
const path = require('path');

// 색상 정의
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// 검사 결과
let errorCount = 0;
let warningCount = 0;
const errors = [];

// 하드코딩 패턴 정의
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
        ],
        severity: 'warning'
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
        ],
        severity: 'warning'
    },
    {
        name: 'URL 하드코딩',
        pattern: /["'](https?:\/\/[^\s"']+)["']/g,
        message: 'URL은 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
            /@.*/,
        ],
        severity: 'error'
    },
    {
        name: 'IP 주소 하드코딩',
        pattern: /["'](\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})["']/g,
        message: 'IP 주소는 상수 파일에서 관리해야 합니다.',
        exclude: [
            /\/\/.*/,
            /\/\*[\s\S]*?\*\//,
        ],
        severity: 'error'
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
        ],
        severity: 'warning'
    }
];

// 파일 검사
function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
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
                    file: filePath,
                    line: lineNumber,
                    pattern: pattern.name,
                    message: pattern.message,
                    severity: pattern.severity,
                    code: line.trim()
                };
                
                errors.push(error);
                
                if (pattern.severity === 'error') {
                    errorCount++;
                } else {
                    warningCount++;
                }
            }
        }
    });
}

// 디렉토리 재귀 검사
function checkDirectory(dirPath, extensions = ['.java', '.js', '.jsx', '.ts', '.tsx']) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // node_modules, .git 등 제외
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'target' && file !== 'build') {
                checkDirectory(filePath, extensions);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                checkFile(filePath);
            }
        }
    });
}

// 메인 실행
function main() {
    console.log(`${YELLOW}🔍 하드코딩 검사 시작...${RESET}\n`);
    
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
    console.log(`  - 오류: ${RED}${errorCount}${RESET}`);
    console.log(`  - 경고: ${YELLOW}${warningCount}${RESET}\n`);
    
    if (errors.length > 0) {
        console.log(`${RED}하드코딩 감지:${RESET}\n`);
        
        errors.forEach((error, index) => {
            const severityColor = error.severity === 'error' ? RED : YELLOW;
            console.log(`${severityColor}[${error.severity.toUpperCase()}]${RESET} ${error.file}:${error.line}`);
            console.log(`  패턴: ${error.pattern}`);
            console.log(`  메시지: ${error.message}`);
            console.log(`  코드: ${error.code}`);
            console.log('');
        });
        
        if (errorCount > 0) {
            console.log(`${RED}❌ 하드코딩 검사 실패: ${errorCount}개의 오류가 발견되었습니다.${RESET}`);
            process.exit(1);
        } else {
            console.log(`${YELLOW}⚠️ 하드코딩 검사 경고: ${warningCount}개의 경고가 발견되었습니다.${RESET}`);
            process.exit(0);
        }
    } else {
        console.log(`${GREEN}✅ 하드코딩 검사 통과${RESET}`);
        process.exit(0);
    }
}

main();

