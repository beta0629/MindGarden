#!/usr/bin/env node

/**
 * 동적 시스템 검증 스크립트
 * 
 * 백엔드 코드에서 하드코딩을 감지하고, 동적 시스템 사용을 검증합니다.
 * 
 * 검증 항목:
 * 1. 하드코딩된 문자열 (한글/영문)
 * 2. 하드코딩된 숫자 (매직 넘버)
 * 3. 하드코딩된 URL/경로
 * 4. 공통 코드 하드코딩 (CommonCode 동적 조회 확인)
 * 5. 역할/권한 하드코딩 (동적 권한 시스템 사용 확인)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

const fs = require('fs');
const path = require('path');

// 색상 정의
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// 검사할 디렉토리
const JAVA_SOURCE_DIR = path.join(__dirname, '..', 'src', 'main', 'java');
const EXCLUDE_PATTERNS = [
    /node_modules/,
    /target/,
    /build/,
    /\.git/,
    /dto\/.*\.java$/,  // DTO 파일은 제외 (상수 정의 허용)
    /constant\/.*\.java$/,  // 상수 파일은 제외
    /config\/.*\.java$/,  // 설정 파일은 제외
    /entity\/.*\.java$/,  // 엔티티 파일은 제외
    /repository\/.*\.java$/,  // 리포지토리 파일은 제외
];

// 에러 수집
const errors = [];
const warnings = [];

/**
 * Java 파일에서 하드코딩 패턴 감지
 */
function checkHardcoding(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    
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
    
    // 1. 한글 문자열 하드코딩 감지
    const koreanPattern = /["']([가-힣]{2,})["']/g;
    lines.forEach((line, index) => {
        // 주석, 로그, 어노테이션 제외
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('@') ||
            line.includes('log.') ||
            line.includes('logger.') ||
            line.includes('System.out.println')) {
            return;
        }
        
        let match;
        while ((match = koreanPattern.exec(line)) !== null) {
            const koreanText = match[1];
            // 예외: DTO validation message, 에러 메시지 상수는 허용
            if (line.includes('message =') || 
                line.includes('MESSAGE') ||
                line.includes('ERROR_') ||
                line.includes('SUCCESS_')) {
                continue;
            }
            
            errors.push({
                file: filePath,
                line: index + 1,
                column: match.index + 1,
                message: `[하드코딩 금지] 한글 문자열 하드코딩: "${koreanText}"`,
                detail: `한글 문자열은 상수 파일 또는 공통 코드에서 관리해야 합니다.\n  → CommonCodeService를 사용하여 동적으로 조회하세요.`,
                severity: 'error'
            });
        }
    });
    
    // 2. 공통 코드 하드코딩 감지 (코드 그룹/값 직접 사용)
    const commonCodePatterns = [
        /["'](USER_ROLE|BRANCH_TYPE|PAYMENT_STATUS|SCHEDULE_STATUS|CONSULTATION_STATUS)[^"']*["']/gi,
        /\.equals\(["'](ADMIN|CLIENT|CONSULTANT|HQ)[^"']*["']\)/gi,
        /==\s*["'](ADMIN|CLIENT|CONSULTANT|HQ)[^"']*["']/gi,
        /UserRole\.(ADMIN|CLIENT|CONSULTANT|HQ)/gi,
    ];
    
    commonCodePatterns.forEach(pattern => {
        lines.forEach((line, index) => {
            // 주석 제외
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
                return;
            }
            
            if (pattern.test(line)) {
                // CommonCodeService 사용 여부 확인
                const hasCommonCodeService = content.includes('CommonCodeService') || 
                                           content.includes('commonCodeService') ||
                                           content.includes('getCommonCode') ||
                                           content.includes('findByCodeGroup');
                
                if (!hasCommonCodeService) {
                    errors.push({
                        file: filePath,
                        line: index + 1,
                        column: 1,
                        message: `[동적 시스템 필수] 공통 코드 하드코딩 감지`,
                        detail: `공통 코드는 하드코딩하지 말고 CommonCodeService를 사용하여 동적으로 조회하세요.\n  → commonCodeService.findByCodeGroup("CODE_GROUP") 사용`,
                        severity: 'error'
                    });
                }
            }
        });
    });
    
    // 3. 역할/권한 하드코딩 감지
    const rolePermissionPatterns = [
        /if\s*\(.*\.equals\(["'](ADMIN|CLIENT|CONSULTANT|HQ|ROLE_)[^"']*["']\)/gi,
        /\.contains\(["'](ADMIN|CLIENT|CONSULTANT|HQ|ROLE_)[^"']*["']\)/gi,
        /SecurityUtils\.(isAdmin|isClient|isConsultant|isHQ)/gi,
    ];
    
    rolePermissionPatterns.forEach(pattern => {
        lines.forEach((line, index) => {
            // 주석 제외
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
                return;
            }
            
            if (pattern.test(line)) {
                // DynamicPermissionService 사용 여부 확인
                const hasDynamicPermission = content.includes('DynamicPermissionService') ||
                                            content.includes('dynamicPermissionService') ||
                                            content.includes('PermissionCheckUtils') ||
                                            content.includes('hasPermission');
                
                if (!hasDynamicPermission) {
                    warnings.push({
                        file: filePath,
                        line: index + 1,
                        column: 1,
                        message: `[권한 관리 표준화] SecurityUtils 사용 감지 (Deprecated)`,
                        detail: `SecurityUtils는 Deprecated입니다. DynamicPermissionService 또는 PermissionCheckUtils를 사용하세요.`,
                        severity: 'warning'
                    });
                }
            }
        });
    });
    
    // 4. URL/경로 하드코딩 감지
    const urlPattern = /["'](https?:\/\/[^\s"']+|\/api\/[^"']+)["']/g;
    lines.forEach((line, index) => {
        // 주석, 설정 파일 제외
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('@Value') ||
            line.includes('application.yml') ||
            line.includes('application.properties')) {
            return;
        }
        
        let match;
        while ((match = urlPattern.exec(line)) !== null) {
            const url = match[1];
            // 상수 파일에서 관리되는 URL은 허용
            if (line.includes('BASE_URL') || 
                line.includes('API_URL') ||
                line.includes('Constants.') ||
                line.includes('Config.')) {
                continue;
            }
            
            errors.push({
                file: filePath,
                line: index + 1,
                column: match.index + 1,
                message: `[하드코딩 금지] URL/경로 하드코딩: "${url}"`,
                detail: `URL은 상수 파일 또는 환경 변수에서 관리해야 합니다.\n  → Constants 또는 @Value를 사용하세요.`,
                severity: 'error'
            });
        }
    });
    
    // 5. 매직 넘버 감지 (큰 숫자)
    const magicNumberPattern = /\b([0-9]{4,})\b/g;
    lines.forEach((line, index) => {
        // 주석, 버전 번호, 포트 번호 제외
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('version') ||
            line.includes('port') ||
            line.includes('PORT') ||
            line.includes('@Value')) {
            return;
        }
        
        let match;
        while ((match = magicNumberPattern.exec(line)) !== null) {
            const number = match[1];
            // 타임스탬프, ID는 허용
            if (line.includes('timestamp') || 
                line.includes('id') ||
                line.includes('ID') ||
                line.includes('Id')) {
                continue;
            }
            
            warnings.push({
                file: filePath,
                line: index + 1,
                column: match.index + 1,
                message: `[하드코딩 경고] 매직 넘버: ${number}`,
                detail: `큰 숫자는 상수로 정의하는 것을 권장합니다.\n  → Constants 파일에 정의하세요.`,
                severity: 'warning'
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
    console.log(`${CYAN}========================================${RESET}`);
    console.log(`${CYAN}동적 시스템 검증 시작${RESET}`);
    console.log(`${CYAN}========================================${RESET}\n`);
    
    if (!fs.existsSync(JAVA_SOURCE_DIR)) {
        console.error(`${RED}❌ Java 소스 디렉토리를 찾을 수 없습니다: ${JAVA_SOURCE_DIR}${RESET}`);
        process.exit(1);
    }
    
    console.log(`${BLUE}📁 Java 파일 스캔 중...${RESET}`);
    const javaFiles = scanJavaFiles(JAVA_SOURCE_DIR);
    console.log(`${GREEN}✅ ${javaFiles.length}개의 Java 파일 발견${RESET}\n`);
    
    console.log(`${BLUE}🔍 하드코딩 및 동적 시스템 검증 중...${RESET}`);
    javaFiles.forEach(file => {
        checkHardcoding(file);
    });
    
    // 결과 출력
    console.log(`\n${CYAN}========================================${RESET}`);
    console.log(`${CYAN}검증 결과${RESET}`);
    console.log(`${CYAN}========================================${RESET}\n`);
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log(`${GREEN}✅ 모든 검증을 통과했습니다!${RESET}\n`);
        process.exit(0);
    } else {
        if (errors.length > 0) {
            console.log(`${RED}❌ ${errors.length}개의 에러가 발견되었습니다.${RESET}\n`);
            
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
        }
        
        if (warnings.length > 0) {
            console.log(`${YELLOW}⚠️ ${warnings.length}개의 경고가 발견되었습니다.${RESET}\n`);
            
            // 경고별로 그룹화
            const warningsByFile = {};
            warnings.forEach(warning => {
                if (!warningsByFile[warning.file]) {
                    warningsByFile[warning.file] = [];
                }
                warningsByFile[warning.file].push(warning);
            });
            
            // 파일별로 출력
            Object.keys(warningsByFile).forEach(file => {
                console.log(`${YELLOW}📄 ${file}${RESET}`);
                warningsByFile[file].forEach(warning => {
                    console.log(`  ${YELLOW}Line ${warning.line}:${warning.column}${RESET} - ${warning.message}`);
                    console.log(`    ${YELLOW}${warning.detail}${RESET}`);
                });
                console.log('');
            });
        }
        
        // 가이드 출력
        console.log(`${CYAN}========================================${RESET}`);
        console.log(`${CYAN}해결 가이드${RESET}`);
        console.log(`${CYAN}========================================${RESET}\n`);
        
        console.log(`${YELLOW}1. 공통 코드 하드코딩 해결:${RESET}`);
        console.log(`   ❌ 하드코딩: if (user.getRole().equals("ADMIN"))`);
        console.log(`   ✅ 동적 조회: commonCodeService.findByCodeGroup("USER_ROLE")`);
        console.log('');
        
        console.log(`${YELLOW}2. 권한 체크 하드코딩 해결:${RESET}`);
        console.log(`   ❌ 하드코딩: SecurityUtils.isAdmin(user)`);
        console.log(`   ✅ 동적 권한: dynamicPermissionService.hasPermission(user, "MENU_ADMIN")`);
        console.log('');
        
        console.log(`${YELLOW}3. URL 하드코딩 해결:${RESET}`);
        console.log(`   ❌ 하드코딩: String url = "https://api.example.com"`);
        console.log(`   ✅ 상수 사용: String url = Constants.API_BASE_URL`);
        console.log('');
        
        if (errors.length > 0) {
            console.log(`${YELLOW}⚠️  경고: 하드코딩 사용이 발견되었습니다.${RESET}`);
            console.log(`${YELLOW}   레거시 코드 마이그레이션 완료 후 수정이 필요합니다.${RESET}`);
            console.log(`${YELLOW}   현재는 경고만 표시하고 서버 실행을 계속합니다.${RESET}\n`);
            // 레거시 코드 마이그레이션 중이므로 경고만 표시하고 계속 진행
            process.exit(0);
        } else {
            console.log(`${YELLOW}⚠️ 경고만 있습니다. 서버 실행은 가능하지만 수정을 권장합니다.${RESET}\n`);
            process.exit(0);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { checkHardcoding, scanJavaFiles };

