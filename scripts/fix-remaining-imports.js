#!/usr/bin/env node

/**
 * 남은 상위 디렉토리 import를 완전히 제거하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixRemainingImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 상위 디렉토리로 나가는 모든 import 패턴 제거
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // 상위 디렉토리로 나가는 import 라인 제거
        if (trimmed.includes('from \'../utils/designSystemHelper\'') || 
            trimmed.includes('from "../utils/designSystemHelper"') ||
            trimmed.includes('from \'../../utils/designSystemHelper\'') ||
            trimmed.includes('from "../../utils/designSystemHelper"') ||
            trimmed.includes('from \'../../../utils/designSystemHelper\'') ||
            trimmed.includes('from "../../../utils/designSystemHelper"') ||
            trimmed.includes('from \'../../../../utils/designSystemHelper\'') ||
            trimmed.includes('from "../../../../utils/designSystemHelper"') ||
            trimmed.includes('from \'../../../../../utils/designSystemHelper\'') ||
            trimmed.includes('from "../../../../../utils/designSystemHelper"')) {
            
            console.log(`🔄 import 라인 제거: ${line} in ${filePath}`);
            hasChanges = true;
            continue; // 이 라인은 건너뛰기
        }
        
        newLines.push(line);
    }
    
    if (hasChanges) {
        newContent = newLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 남은 import 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllRemainingImports() {
    console.log('🔧 남은 상위 디렉토리 import 완전 제거 시작...\n');
    
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
                if (fixRemainingImports(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 남은 import 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllRemainingImports();
}

module.exports = { fixRemainingImports, fixAllRemainingImports };

