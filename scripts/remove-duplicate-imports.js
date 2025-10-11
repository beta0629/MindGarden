#!/usr/bin/env node

/**
 * 중복된 import 제거 스크립트
 */

const fs = require('fs');
const path = require('path');

function removeDuplicateImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // import 문들을 찾아서 중복 제거
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    
    if (importLines.length > 0) {
        // 중복 제거
        const uniqueImports = [];
        const seenImports = new Set();
        
        importLines.forEach(line => {
            const trimmed = line.trim();
            if (!seenImports.has(trimmed)) {
                seenImports.add(trimmed);
                uniqueImports.push(line);
            }
        });
        
        // 파일 내용을 다시 구성
        const lines = content.split('\n');
        const nonImportLines = lines.filter(line => !line.trim().startsWith('import'));
        
        // import가 있었던 위치 찾기
        const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));
        
        if (firstImportIndex !== -1) {
            // import 문들을 unique한 것들로 교체
            const newLines = [];
            
            // import 이전의 내용
            newLines.push(...lines.slice(0, firstImportIndex));
            
            // unique import들
            newLines.push(...uniqueImports);
            
            // import 이후의 내용 (빈 줄 하나 추가)
            const afterImports = lines.slice(firstImportIndex + importLines.length);
            if (afterImports.length > 0 && afterImports[0].trim() !== '') {
                newLines.push('');
            }
            newLines.push(...afterImports);
            
            newContent = newLines.join('\n');
            
            if (newContent !== content) {
                hasChanges = true;
            }
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 중복 제거됨: ${filePath}`);
        return true;
    }
    
    return false;
}

function removeAllDuplicateImports() {
    console.log('🔧 중복된 import 제거 시작...\n');
    
    const srcDir = path.join(__dirname, '../frontend/src');
    let totalFiles = 0;
    let fixedFiles = 0;
    
    function processDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                totalFiles++;
                if (removeDuplicateImports(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 중복 import 제거 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    removeAllDuplicateImports();
}

module.exports = { removeDuplicateImports, removeAllDuplicateImports };

