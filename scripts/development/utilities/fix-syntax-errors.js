#!/usr/bin/env node

/**
 * 구문 오류를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixSyntaxErrors(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 파일을 줄별로 분할
    const lines = content.split('\n');
    const newLines = [];
    let inImportSection = true;
    let seenImports = new Set();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('import')) {
            if (inImportSection) {
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
                newLines.push(line);
            } else {
                // import 섹션이 끝났는데 import가 나타나면 제거
                console.log(`🔄 잘못된 위치의 import 제거: ${filePath}`);
                hasChanges = true;
                continue;
            }
        } else if (trimmed.startsWith('const') || trimmed.startsWith('function') || trimmed.startsWith('export') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
            // import 섹션이 끝남
            inImportSection = false;
            newLines.push(line);
        } else {
            newLines.push(line);
        }
    }
    
    if (hasChanges) {
        newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 구문 오류 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllSyntaxErrors() {
    console.log('🔧 구문 오류 수정 시작...\n');
    
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
                if (fixSyntaxErrors(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 구문 오류 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllSyntaxErrors();
}

module.exports = { fixSyntaxErrors, fixAllSyntaxErrors };

