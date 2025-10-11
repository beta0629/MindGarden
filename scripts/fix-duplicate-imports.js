#!/usr/bin/env node

/**
 * 중복된 import 완전 제거 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixDuplicateImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 파일을 줄별로 분할
    const lines = content.split('\n');
    const newLines = [];
    const seenImports = new Set();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('import')) {
            // import 문에서 실제 import되는 이름 추출
            const match = trimmed.match(/import\s+(\w+)/);
            if (match) {
                const importName = match[1];
                
                if (seenImports.has(importName)) {
                    // 중복된 import는 건너뛰기
                    console.log(`🔄 중복 제거: ${importName} in ${filePath}`);
                    hasChanges = true;
                    continue;
                } else {
                    seenImports.add(importName);
                }
            }
        }
        
        newLines.push(line);
    }
    
    if (hasChanges) {
        newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 중복 제거 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllDuplicateImports() {
    console.log('🔧 중복된 import 완전 제거 시작...\n');
    
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
                if (fixDuplicateImports(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 중복 import 완전 제거 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllDuplicateImports();
}

module.exports = { fixDuplicateImports, fixAllDuplicateImports };

