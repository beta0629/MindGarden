/**
 * API 경로 표준화 테스트 스크립트
 * 
 * 사용법:
 * node scripts/testing/test_api_standardization.js
 * 
 * 또는 Jest로 실행:
 * npm test -- test_api_standardization.js
 */

const fs = require('fs');
const path = require('path');

// 테스트 결과
const testResults = {
    pass: 0,
    fail: 0,
    total: 0,
    errors: []
};

/**
 * Java 파일에서 API 경로 확인
 */
function testJavaApiPaths() {
    console.log('=== Java Controller API 경로 테스트 ===');
    
    const controllersDir = path.join(__dirname, '../../src/main/java/com/coresolution/consultation/controller');
    
    if (!fs.existsSync(controllersDir)) {
        console.log('⚠️  Controller 디렉토리를 찾을 수 없습니다.');
        return;
    }

    const files = fs.readdirSync(controllersDir)
        .filter(file => file.endsWith('Controller.java'));

    files.forEach(file => {
        const filePath = path.join(controllersDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // @RequestMapping, @GetMapping, @PostMapping 등에서 경로 추출
        const pathPatterns = [
            /@RequestMapping\s*\(\s*["']([^"']+)["']/g,
            /@GetMapping\s*\(\s*["']([^"']+)["']/g,
            /@PostMapping\s*\(\s*["']([^"']+)["']/g,
            /@PutMapping\s*\(\s*["']([^"']+)["']/g,
            /@DeleteMapping\s*\(\s*["']([^"']+)["']/g,
        ];

        pathPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const apiPath = match[1];
                testResults.total++;
                
                if (apiPath.startsWith('/api/v1/')) {
                    testResults.pass++;
                    console.log(`✅ ${file}: ${apiPath}`);
                } else if (apiPath.startsWith('/api/') && !apiPath.startsWith('/api/v1/')) {
                    testResults.fail++;
                    testResults.errors.push({
                        file,
                        path: apiPath,
                        message: '레거시 API 경로 사용 (/api/v1/ 사용 필요)'
                    });
                    console.log(`❌ ${file}: ${apiPath} (레거시 경로)`);
                }
            }
        });
    });
}

/**
 * JavaScript 파일에서 API 경로 확인
 */
function testJavaScriptApiPaths() {
    console.log('\n=== JavaScript API 경로 테스트 ===');
    
    const apiConstantsFile = path.join(__dirname, '../../frontend/src/constants/api.js');
    
    if (!fs.existsSync(apiConstantsFile)) {
        console.log('⚠️  API 상수 파일을 찾을 수 없습니다.');
        return;
    }

    const content = fs.readFileSync(apiConstantsFile, 'utf-8');
    
    // API 경로 패턴 찾기
    const pathPattern = /['"`]([^'"`]*\/api\/[^'"`]*)['"`]/g;
    let match;
    
    while ((match = pathPattern.exec(content)) !== null) {
        const apiPath = match[1];
        testResults.total++;
        
        if (apiPath.startsWith('/api/v1/')) {
            testResults.pass++;
            console.log(`✅ ${apiPath}`);
        } else if (apiPath.startsWith('/api/') && !apiPath.startsWith('/api/v1/')) {
            testResults.fail++;
            testResults.errors.push({
                file: 'api.js',
                path: apiPath,
                message: '레거시 API 경로 사용 (/api/v1/ 사용 필요)'
            });
            console.log(`❌ ${apiPath} (레거시 경로)`);
        }
    }
}

/**
 * 테스트 결과 출력
 */
function printResults() {
    console.log('\n=== 테스트 결과 ===');
    console.log(`통과: ${testResults.pass}`);
    console.log(`실패: ${testResults.fail}`);
    console.log(`전체: ${testResults.total}`);
    console.log(`통과률: ${((testResults.pass / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n=== 발견된 오류 ===');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.file}: ${error.path}`);
            console.log(`   ${error.message}`);
        });
    }
}

// 테스트 실행
function runTests() {
    console.log('API 경로 표준화 테스트 시작...\n');
    
    testJavaApiPaths();
    testJavaScriptApiPaths();
    printResults();
    
    // 실패가 있으면 종료 코드 1 반환
    process.exit(testResults.fail > 0 ? 1 : 0);
}

// 스크립트 직접 실행 시
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testResults };

