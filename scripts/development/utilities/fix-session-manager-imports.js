#!/usr/bin/env node

/**
 * sessionManager 상위 디렉토리 import를 제거하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixSessionManagerImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // sessionManager 상위 디렉토리 import 제거
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // sessionManager 상위 디렉토리 import 라인 제거
        if ((trimmed.includes('from \'../utils/sessionManager\'') || 
             trimmed.includes('from "../utils/sessionManager"')) &&
            (trimmed.includes('import') || trimmed.includes('const') || trimmed.includes('let'))) {
            
            console.log(`🔄 sessionManager import 라인 제거: ${line} in ${filePath}`);
            hasChanges = true;
            continue; // 이 라인은 건너뛰기
        }
        
        newLines.push(line);
    }
    
    if (hasChanges) {
        newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ sessionManager import 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllSessionManagerImports() {
    console.log('🔧 sessionManager 상위 디렉토리 import 제거 시작...\n');
    
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
                if (fixSessionManagerImports(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 sessionManager import 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllSessionManagerImports();
}

module.exports = { fixSessionManagerImports, fixAllSessionManagerImports };

