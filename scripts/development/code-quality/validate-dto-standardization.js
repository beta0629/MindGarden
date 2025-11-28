#!/usr/bin/env node

/**
 * DTO 표준화 검증 스크립트
 * 
 * Phase 2.3 명확성 개선 검증:
 * - Deprecated DTO 사용 감지 (PaymentRequest, EmailRequest, AuthRequest)
 * - 새 표준 DTO 사용 권장 (PaymentCreateRequest, EmailSendRequest, LoginRequest)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 정의
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Deprecated DTO와 새 표준 DTO 매핑
const DEPRECATED_DTO_MAPPING = {
    'PaymentRequest': {
        deprecated: 'com.coresolution.consultation.dto.PaymentRequest',
        standard: 'com.coresolution.consultation.dto.PaymentCreateRequest',
        reason: 'PaymentRequest는 PaymentCreateRequest로 명확화되었습니다.'
    },
    'EmailRequest': {
        deprecated: 'com.coresolution.consultation.dto.EmailRequest',
        standard: 'com.coresolution.consultation.dto.EmailSendRequest',
        reason: 'EmailRequest는 EmailSendRequest로 명확화되었습니다.'
    },
    'AuthRequest': {
        deprecated: 'com.coresolution.consultation.dto.AuthRequest',
        standard: 'com.coresolution.consultation.dto.LoginRequest',
        reason: 'AuthRequest는 LoginRequest로 명확화되었습니다.'
    }
};

// 검사할 디렉토리
const JAVA_SOURCE_DIR = path.join(__dirname, '..', 'src', 'main', 'java');
const EXCLUDE_PATTERNS = [
    /node_modules/,
    /target/,
    /build/,
    /\.git/,
    /dto\/.*Request\.java$/,  // DTO 파일 자체는 제외
    /dto\/.*Response\.java$/,
    /dto\/.*Dto\.java$/
];

// 에러 수집
const errors = [];
const warnings = [];

/**
 * Java 파일에서 Deprecated DTO 사용 감지
 */
function checkDeprecatedDTOUsage(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    
    // DTO 파일 자체는 제외
    if (fileName.includes('Request.java') || fileName.includes('Response.java') || fileName.includes('Dto.java')) {
        return;
    }
    
    // 각 Deprecated DTO에 대해 검사
    Object.keys(DEPRECATED_DTO_MAPPING).forEach(deprecatedName => {
        const mapping = DEPRECATED_DTO_MAPPING[deprecatedName];
        
        // import 문에서 사용 감지
        const importPattern = new RegExp(`import\\s+${mapping.deprecated.replace(/\./g, '\\.')};`, 'g');
        if (importPattern.test(content)) {
            lines.forEach((line, index) => {
                if (importPattern.test(line)) {
                    errors.push({
                        file: filePath,
                        line: index + 1,
                        column: 1,
                        message: `[ERROR] Deprecated DTO 사용: ${deprecatedName}`,
                        detail: `${mapping.reason}\n  → ${mapping.standard} 사용을 권장합니다.`,
                        deprecated: deprecatedName,
                        standard: mapping.standard
                    });
                }
            });
        }
        
        // 타입 참조에서 사용 감지 (import 없이 전체 패키지명 사용)
        const fullTypePattern = new RegExp(`\\b${mapping.deprecated.replace(/\./g, '\\.')}\\b`, 'g');
        if (fullTypePattern.test(content)) {
            lines.forEach((line, index) => {
                if (fullTypePattern.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                    // import 문이 아닌 경우만 에러로 처리
                    if (!line.includes('import')) {
                        errors.push({
                            file: filePath,
                            line: index + 1,
                            column: line.indexOf(mapping.deprecated) + 1,
                            message: `[ERROR] Deprecated DTO 사용: ${deprecatedName}`,
                            detail: `${mapping.reason}\n  → ${mapping.standard} 사용을 권장합니다.`,
                            deprecated: deprecatedName,
                            standard: mapping.standard
                        });
                    }
                }
            });
        }
        
        // 변수 선언, 파라미터, 반환 타입에서 사용 감지
        const typeReferencePattern = new RegExp(`\\b${deprecatedName}\\b`, 'g');
        if (typeReferencePattern.test(content)) {
            lines.forEach((line, index) => {
                if (typeReferencePattern.test(line) && 
                    !line.trim().startsWith('//') && 
                    !line.trim().startsWith('*') &&
                    !line.includes('import') &&
                    !line.includes('@Deprecated') &&
                    !line.includes('deprecated')) {
                    
                    // 주석이 아닌 실제 코드에서 사용
                    const trimmedLine = line.trim();
                    if (trimmedLine.length > 0 && 
                        (trimmedLine.includes(deprecatedName + ' ') || 
                         trimmedLine.includes(deprecatedName + '>') ||
                         trimmedLine.includes(deprecatedName + ',') ||
                         trimmedLine.includes(deprecatedName + ')') ||
                         trimmedLine.includes(deprecatedName + ';'))) {
                        
                        errors.push({
                            file: filePath,
                            line: index + 1,
                            column: line.indexOf(deprecatedName) + 1,
                            message: `[ERROR] Deprecated DTO 사용: ${deprecatedName}`,
                            detail: `${mapping.reason}\n  → ${mapping.standard} 사용을 권장합니다.`,
                            deprecated: deprecatedName,
                            standard: mapping.standard
                        });
                    }
                }
            });
        }
    });
}

/**
 * 모든 Java 파일 검사
 */
function scanJavaFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // 제외 패턴 확인
        const shouldExclude = EXCLUDE_PATTERNS.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(filePath);
            }
            return filePath.includes(pattern);
        });
        
        if (shouldExclude) {
            return;
        }
        
        if (stat.isDirectory()) {
            scanJavaFiles(filePath, fileList);
        } else if (file.endsWith('.java')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

/**
 * 메인 실행 함수
 */
function main() {
    console.log(`${BLUE}========================================${RESET}`);
    console.log(`${BLUE}DTO 표준화 검증 시작${RESET}`);
    console.log(`${BLUE}========================================${RESET}\n`);
    
    if (!fs.existsSync(JAVA_SOURCE_DIR)) {
        console.error(`${RED}❌ Java 소스 디렉토리를 찾을 수 없습니다: ${JAVA_SOURCE_DIR}${RESET}`);
        process.exit(1);
    }
    
    console.log(`${BLUE}📁 Java 파일 스캔 중...${RESET}`);
    const javaFiles = scanJavaFiles(JAVA_SOURCE_DIR);
    console.log(`${GREEN}✅ ${javaFiles.length}개의 Java 파일 발견${RESET}\n`);
    
    console.log(`${BLUE}🔍 Deprecated DTO 사용 검사 중...${RESET}`);
    javaFiles.forEach(file => {
        checkDeprecatedDTOUsage(file);
    });
    
    // 결과 출력
    console.log(`\n${BLUE}========================================${RESET}`);
    console.log(`${BLUE}검증 결과${RESET}`);
    console.log(`${BLUE}========================================${RESET}\n`);
    
    if (errors.length === 0) {
        console.log(`${GREEN}✅ 모든 DTO가 표준화되었습니다!${RESET}\n`);
        process.exit(0);
    } else {
        console.log(`${RED}❌ ${errors.length}개의 Deprecated DTO 사용이 발견되었습니다.${RESET}\n`);
        
        // 에러별로 그룹화
        const errorsByFile = {};
        errors.forEach(error => {
            if (!errorsByFile[error.file]) {
                errorsByFile[error.file] = [];
            }
            errorsByFile[error.file].push(error);
        });
        
        // 파일별로 출력
        Object.keys(errorsByFile).forEach(file => {
            console.log(`${RED}📄 ${file}${RESET}`);
            errorsByFile[file].forEach(error => {
                console.log(`  ${RED}Line ${error.line}:${error.column}${RESET} - ${error.message}`);
                console.log(`    ${YELLOW}${error.detail}${RESET}`);
            });
            console.log('');
        });
        
        // 마이그레이션 가이드 출력
        console.log(`${BLUE}========================================${RESET}`);
        console.log(`${BLUE}마이그레이션 가이드${RESET}`);
        console.log(`${BLUE}========================================${RESET}\n`);
        
        Object.keys(DEPRECATED_DTO_MAPPING).forEach(deprecatedName => {
            const mapping = DEPRECATED_DTO_MAPPING[deprecatedName];
            console.log(`${YELLOW}${deprecatedName} → ${mapping.standard.split('.').pop()}${RESET}`);
            console.log(`  import ${mapping.deprecated};`);
            console.log(`  ↓`);
            console.log(`  import ${mapping.standard};`);
            console.log('');
        });
        
        console.log(`${YELLOW}⚠️  경고: Deprecated DTO 사용이 발견되었습니다.${RESET}`);
        console.log(`${YELLOW}   레거시 코드 마이그레이션 완료 후 수정이 필요합니다.${RESET}`);
        console.log(`${YELLOW}   현재는 경고만 표시하고 서버 실행을 계속합니다.${RESET}\n`);
        // 레거시 코드 마이그레이션 중이므로 경고만 표시하고 계속 진행
        process.exit(0);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { checkDeprecatedDTOUsage, scanJavaFiles, DEPRECATED_DTO_MAPPING };

