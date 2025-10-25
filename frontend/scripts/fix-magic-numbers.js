#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Magic Numbers를 상수로 자동 수정하는 스크립트
 */

const SRC_DIR = path.join(__dirname, '../src');
const CONSTANTS_FILE = path.join(__dirname, '../src/constants/magicNumbers.js');

// Magic Numbers 매핑 규칙
const MAGIC_NUMBER_MAPPINGS = {
    // HTTP 상태 코드
    '401': 'HTTP_STATUS.UNAUTHORIZED',
    '403': 'HTTP_STATUS.FORBIDDEN',
    '404': 'HTTP_STATUS.NOT_FOUND',
    '500': 'HTTP_STATUS.INTERNAL_SERVER_ERROR',
    '400': 'HTTP_STATUS.BAD_REQUEST',
    
    // 시간 관련 (밀리초)
    '1000': 'TIME_CONSTANTS.SECOND',
    '60000': 'TIME_CONSTANTS.MINUTE',
    '3600000': 'TIME_CONSTANTS.HOUR',
    '86400000': 'TIME_CONSTANTS.DAY',
    '604800000': 'TIME_CONSTANTS.WEEK',
    '2592000000': 'TIME_CONSTANTS.MONTH',
    '31536000000': 'TIME_CONSTANTS.YEAR',
    
    // 시간 단위 (초)
    '60': 'TIME_UNITS.SECONDS_IN_MINUTE',
    '3600': 'TIME_UNITS.SECONDS_IN_HOUR',
    '86400': 'TIME_UNITS.SECONDS_IN_DAY',
    '604800': 'TIME_UNITS.SECONDS_IN_WEEK',
    '2592000': 'TIME_UNITS.SECONDS_IN_MONTH',
    '31536000': 'TIME_UNITS.SECONDS_IN_YEAR',
    
    // UI 관련
    '768': 'UI_CONSTANTS.MOBILE_BREAKPOINT',
    '1024': 'UI_CONSTANTS.TABLET_BREAKPOINT',
    '1200': 'UI_CONSTANTS.DESKTOP_BREAKPOINT',
    '250': 'UI_CONSTANTS.ANIMATION_DURATION',
    '3000': 'NOTIFICATION_CONSTANTS.SUCCESS_DURATION',
    '5000': 'NOTIFICATION_CONSTANTS.ERROR_DURATION',
    '1000': 'UI_CONSTANTS.MODAL_Z_INDEX',
    
    // 비즈니스 로직
    '3': 'BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS',
    '5': 'BUSINESS_CONSTANTS.CACHE_EXPIRY',
    '20': 'BUSINESS_CONSTANTS.PAGINATION_SIZE',
    '200000': 'BUSINESS_CONSTANTS.MAX_UPLOAD_SIZE',
    '8': 'BUSINESS_CONSTANTS.MIN_PASSWORD_LENGTH',
    '128': 'BUSINESS_CONSTANTS.MAX_PASSWORD_LENGTH',
    
    // 수학적 상수
    '0.5': 'COLOR_CONSTANTS.OPACITY_LOW',
    '0.2': 'COLOR_CONSTANTS.OPACITY_LOW',
    '0.8': 'COLOR_CONSTANTS.OPACITY_HIGH',
    '1': 'COLOR_CONSTANTS.ALPHA_OPAQUE',
    '0': 'COLOR_CONSTANTS.ALPHA_TRANSPARENT',
    
    // 네트워크 관련
    '10000': 'NETWORK_CONSTANTS.REQUEST_TIMEOUT',
    '5000': 'NETWORK_CONSTANTS.CONNECTION_TIMEOUT',
    
    // 폼 관련
    '2': 'FORM_CONSTANTS.MIN_INPUT_LENGTH',
    '100': 'FORM_CONSTANTS.MAX_INPUT_LENGTH',
    '10': 'FORM_CONSTANTS.MIN_TEXTAREA_LENGTH',
    '1000': 'FORM_CONSTANTS.MAX_TEXTAREA_LENGTH',
    '500': 'FORM_CONSTANTS.VALIDATION_DEBOUNCE',
    
    // 날짜 관련
    '7': 'DATE_CONSTANTS.DAYS_IN_WEEK',
    '4': 'DATE_CONSTANTS.WEEKS_IN_MONTH',
    '12': 'DATE_CONSTANTS.MONTHS_IN_YEAR',
    '365': 'DATE_CONSTANTS.DAYS_IN_YEAR',
    '366': 'DATE_CONSTANTS.LEAP_YEAR_DAYS',
    
    // 성능 관련
    '300': 'PERFORMANCE_CONSTANTS.DEBOUNCE_DELAY',
    '100': 'PERFORMANCE_CONSTANTS.THROTTLE_DELAY',
    '0.1': 'PERFORMANCE_CONSTANTS.LAZY_LOAD_THRESHOLD',
    
    // 보안 관련
    '15': 'SECURITY_CONSTANTS.LOCKOUT_DURATION',
    '24': 'SECURITY_CONSTANTS.TOKEN_EXPIRY',
    '30': 'SECURITY_CONSTANTS.SESSION_TIMEOUT',
    
    // 기본값
    '1': 'DEFAULT_VALUES.CURRENT_PAGE',
    
    // 알림 관련
    '4000': 'NOTIFICATION_CONSTANTS.WARNING_DURATION',
    '5': 'NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS',
    
    // 캐시 관련
    '100': 'CACHE_CONSTANTS.MAX_CACHE_SIZE',
    
    // API 관련
    '50': 'API_CONSTANTS.BATCH_SIZE',
    
    // 데이터베이스 관련
    '10': 'DATABASE_CONSTANTS.MAX_CONNECTIONS',
    '30000': 'DATABASE_CONSTANTS.CONNECTION_TIMEOUT',
    
    // 로깅 관련
    '5': 'LOGGING_CONSTANTS.MAX_LOG_FILES',
    
    // 메트릭 관련
    '60000': 'METRICS_CONSTANTS.COLLECTION_INTERVAL',
    '300000': 'METRICS_CONSTANTS.AGGREGATION_WINDOW'
};

/**
 * 파일에서 Magic Numbers를 상수로 수정하는 함수
 */
function fixMagicNumbersInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Magic Numbers 매핑 적용
        for (const [magicNumber, constant] of Object.entries(MAGIC_NUMBER_MAPPINGS)) {
            // 숫자만 있는 경우 (문자열이나 변수명이 아닌 경우)
            const regex = new RegExp(`\\b${magicNumber}\\b(?![a-zA-Z_])`, 'g');
            const matches = content.match(regex);
            
            if (matches) {
                // 이미 상수로 변경된 경우는 제외
                if (!content.includes(constant)) {
                    content = content.replace(regex, constant);
                    modified = true;
                }
            }
        }
        
        if (modified) {
            // 상수 import 추가
            if (!content.includes('import') || !content.includes('magicNumbers')) {
                const importStatement = "import { HTTP_STATUS, TIME_CONSTANTS, TIME_UNITS, UI_CONSTANTS, BUSINESS_CONSTANTS, COLOR_CONSTANTS, NETWORK_CONSTANTS, FORM_CONSTANTS, DATE_CONSTANTS, PERFORMANCE_CONSTANTS, SECURITY_CONSTANTS, DEFAULT_VALUES, NOTIFICATION_CONSTANTS, CACHE_CONSTANTS, API_CONSTANTS, DATABASE_CONSTANTS, LOGGING_CONSTANTS, METRICS_CONSTANTS } from '../constants/magicNumbers';\n";
                
                // 첫 번째 import 문 다음에 추가
                const firstImportIndex = content.indexOf('import');
                if (firstImportIndex !== -1) {
                    const nextLineIndex = content.indexOf('\n', firstImportIndex);
                    content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
                } else {
                    content = importStatement + content;
                }
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 수정 완료: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ 오류 발생: ${filePath}`, error.message);
        return false;
    }
}

/**
 * 디렉토리를 재귀적으로 탐색하여 파일들을 수정
 */
function processDirectory(dirPath) {
    let totalFiles = 0;
    let modifiedFiles = 0;
    
    function walkDir(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                if (!itemPath.includes('node_modules') && !itemPath.includes('build')) {
                    walkDir(itemPath);
                }
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
                totalFiles++;
                if (fixMagicNumbersInFile(itemPath)) {
                    modifiedFiles++;
                }
            }
        }
    }
    
    walkDir(dirPath);
    
    return { totalFiles, modifiedFiles };
}

/**
 * 메인 실행 함수
 */
function main() {
    console.log('🚀 Magic Numbers 자동 수정 시작...\n');
    
    if (!fs.existsSync(SRC_DIR)) {
        console.error('❌ src 디렉토리를 찾을 수 없습니다.');
        process.exit(1);
    }
    
    if (!fs.existsSync(CONSTANTS_FILE)) {
        console.error('❌ 상수 파일을 찾을 수 없습니다.');
        process.exit(1);
    }
    
    const { totalFiles, modifiedFiles } = processDirectory(SRC_DIR);
    
    console.log(`\n📊 수정 완료 통계:`);
    console.log(`   전체 파일: ${totalFiles}개`);
    console.log(`   수정된 파일: ${modifiedFiles}개`);
    console.log(`   수정률: ${((modifiedFiles / totalFiles) * 100).toFixed(1)}%`);
    
    if (modifiedFiles > 0) {
        console.log('\n🎉 Magic Numbers 수정이 완료되었습니다!');
        console.log('💡 이제 npm run build를 실행하여 결과를 확인하세요.');
    } else {
        console.log('\nℹ️  수정할 파일이 없습니다.');
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { fixMagicNumbersInFile, processDirectory };
