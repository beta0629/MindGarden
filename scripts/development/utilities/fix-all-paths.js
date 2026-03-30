#!/usr/bin/env node

/**
 * 모든 import 경로를 올바르게 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function getCorrectPath(filePath, targetFile) {
    const srcDir = path.join(__dirname, '../frontend/src');
    const relativePath = path.relative(srcDir, filePath);
    const fileDir = path.dirname(relativePath);
    
    // targetFile의 실제 위치 찾기
    const targetPath = path.join(srcDir, 'components/common', targetFile);
    if (fs.existsSync(targetPath + '.js')) {
        // 상대 경로 계산
        const fromDir = path.dirname(filePath);
        const toFile = path.join(srcDir, 'components/common', targetFile);
        const relative = path.relative(fromDir, toFile);
        return relative.startsWith('.') ? relative : './' + relative;
    }
    
    return null;
}

function fixFilePaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    const patterns = [
        'IPhone17Card',
        'IPhone17Button', 
        'IPhone17Modal',
        'IPhone17PageHeader',
        'CommonPageTemplate',
        'UnifiedHeader',
        'UnifiedNotification'
    ];
    
    patterns.forEach(pattern => {
        // 잘못된 import 패턴 찾기
        const wrongPattern = new RegExp(`from ['"]\\.\\.?/.*?/common/${pattern}['"]`, 'g');
        
        if (wrongPattern.test(newContent)) {
            // 올바른 경로 계산
            const correctPath = getCorrectPath(filePath, pattern);
            if (correctPath) {
                const correctImport = `from '${correctPath}'`;
                newContent = newContent.replace(wrongPattern, correctImport);
                hasChanges = true;
            }
        }
    });
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 수정됨: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllPaths() {
    console.log('🔧 모든 import 경로 수정 시작...\n');
    
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
                if (fixFilePaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllPaths();
}

module.exports = { fixFilePaths, fixAllPaths };

