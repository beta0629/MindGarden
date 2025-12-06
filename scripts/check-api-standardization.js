#!/usr/bin/env node

/**
 * API 표준화 검증 스크립트
 * 
 * 사용법: node scripts/check-api-standardization.js
 * 
 * 이 스크립트는 다음을 검증합니다:
 * 1. StandardizedApi 사용 여부
 * 2. 엔드포인트 버전 (/api/v1/) 확인
 * 3. 수동 tenantId 헤더 설정 금지
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');
const VIOLATIONS = [];

/**
 * 디렉토리 내 모든 .js, .jsx 파일 찾기
 */
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // node_modules, .git 등 제외
            if (!file.startsWith('.') && file !== 'node_modules') {
                findFiles(filePath, fileList);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

/**
 * 파일 내용 검증
 */
function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(FRONTEND_DIR, filePath);
    
    // 1. apiGet, apiPost 등을 직접 사용하는지 확인
    if (content.includes('apiGet') || content.includes('apiPost') || 
        content.includes('apiPut') || content.includes('apiDelete')) {
        // StandardizedApi를 import 했는지 확인
        if (!content.includes('standardizedApi') && !content.includes('StandardizedApi')) {
            // ajax.js 자체는 제외
            if (!relativePath.includes('ajax.js') && !relativePath.includes('standardizedApi.js')) {
                VIOLATIONS.push({
                    file: relativePath,
                    line: 'N/A',
                    rule: 'API_CALL_STANDARD',
                    message: 'apiGet/apiPost 등을 직접 사용하지 마세요. StandardizedApi를 사용하세요.'
                });
            }
        }
    }
    
    // 2. 수동 tenantId 헤더 설정 확인
    if (content.includes("'X-Tenant-Id'") || content.includes('"X-Tenant-Id"')) {
        // apiHeaders.js는 제외
        if (!relativePath.includes('apiHeaders.js') && !relativePath.includes('standardizedApi.js')) {
            VIOLATIONS.push({
                file: relativePath,
                line: 'N/A',
                rule: 'TENANT_ID_HEADER',
                message: '수동으로 X-Tenant-Id 헤더를 설정하지 마세요. StandardizedApi가 자동으로 처리합니다.'
            });
        }
    }
    
    // 3. 엔드포인트 버전 확인 (간단한 체크)
    const endpointRegex = /['"`]\/api\/(?!v\d+\/)/g;
    if (endpointRegex.test(content)) {
        VIOLATIONS.push({
            file: relativePath,
            line: 'N/A',
            rule: 'API_VERSION',
            message: '엔드포인트는 /api/v1/로 시작해야 합니다.'
        });
    }
}

/**
 * 메인 실행
 */
function main() {
    console.log('🔍 API 표준화 검증 시작...\n');
    
    const files = findFiles(FRONTEND_DIR);
    console.log(`📁 검사할 파일 수: ${files.length}\n`);
    
    files.forEach(file => {
        checkFile(file);
    });
    
    // 결과 출력
    if (VIOLATIONS.length === 0) {
        console.log('✅ 모든 파일이 표준을 준수합니다!\n');
        process.exit(0);
    } else {
        console.log(`❌ ${VIOLATIONS.length}개의 표준 위반 발견:\n`);
        
        VIOLATIONS.forEach((violation, index) => {
            console.log(`${index + 1}. [${violation.rule}] ${violation.file}`);
            console.log(`   ${violation.message}\n`);
        });
        
        console.log('\n📚 참조: docs/standards/API_CALL_STANDARD.md');
        process.exit(1);
    }
}

main();

