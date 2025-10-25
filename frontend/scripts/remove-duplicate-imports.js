#!/usr/bin/env node

/**
 * 중복된 MGButton import를 제거하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// Admin 컴포넌트 디렉토리
const adminDir = path.join(__dirname, '../src/components/admin');

// 중복 import 제거 함수
function removeDuplicateImports(content) {
    let updatedContent = content;
    
    // MGButton import 중복 제거
    const mgButtonImports = updatedContent.match(/import MGButton from ['"][^'"]+['"];?\n?/g);
    if (mgButtonImports && mgButtonImports.length > 1) {
        // 첫 번째 import만 남기고 나머지 제거
        updatedContent = updatedContent.replace(/import MGButton from ['"][^'"]+['"];?\n?/g, '');
        updatedContent = updatedContent.replace(
            /(import React[^;]+;)/,
            "$1\nimport MGButton from '../common/MGButton';"
        );
    }
    
    // 다른 중복 import들도 제거
    const importLines = updatedContent.split('\n');
    const seenImports = new Set();
    const cleanedLines = [];
    
    for (const line of importLines) {
        if (line.trim().startsWith('import ')) {
            const importKey = line.trim();
            if (!seenImports.has(importKey)) {
                seenImports.add(importKey);
                cleanedLines.push(line);
            }
        } else {
            cleanedLines.push(line);
        }
    }
    
    return cleanedLines.join('\n');
}

// 파일 처리 함수
function processFile(filePath) {
    try {
        console.log(`📝 처리 중: ${path.basename(filePath)}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = removeDuplicateImports(content);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ 완료: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⏭️  변경사항 없음: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 오류 발생: ${path.basename(filePath)}`, error.message);
        return false;
    }
}

// 메인 실행
function main() {
    console.log('🚀 중복 import 제거 시작...\n');
    
    const files = fs.readdirSync(adminDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(adminDir, file));
    
    let processedCount = 0;
    let updatedCount = 0;
    
    files.forEach(filePath => {
        processedCount++;
        if (processFile(filePath)) {
            updatedCount++;
        }
    });
    
    console.log(`\n📊 처리 완료:`);
    console.log(`   - 처리된 파일: ${processedCount}개`);
    console.log(`   - 업데이트된 파일: ${updatedCount}개`);
    console.log(`   - 변경사항 없음: ${processedCount - updatedCount}개`);
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { removeDuplicateImports, processFile };
