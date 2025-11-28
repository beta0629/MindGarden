#!/usr/bin/env node

/**
 * src/ 디렉토리 밖으로 나가는 import를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixOutsideImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // src/ 디렉토리 밖으로 나가는 import 패턴들
    const pathFixes = [
        // 상위 디렉토리로 나가는 import 제거
        { from: "import { designSystemHelper } from '../utils/designSystemHelper';", to: "" },
        { from: "import { designSystemHelper } from '../../utils/designSystemHelper';", to: "" },
        { from: "import { designSystemHelper } from '../../../utils/designSystemHelper';", to: "" },
        { from: "import { designSystemHelper } from '../../../../utils/designSystemHelper';", to: "" },
        { from: "import { designSystemHelper } from '../../../../../utils/designSystemHelper';", to: "" },
        
        // 기타 상위 디렉토리 import 제거
        { from: "import {", to: "// import {" },
        { from: "} from '../utils/designSystemHelper';", to: "} from '../utils/designSystemHelper'; // 제거됨" },
        { from: "} from '../../utils/designSystemHelper';", to: "} from '../../utils/designSystemHelper'; // 제거됨" },
        { from: "} from '../../../utils/designSystemHelper';", to: "} from '../../../utils/designSystemHelper'; // 제거됨" },
        { from: "} from '../../../../utils/designSystemHelper';", to: "} from '../../../../utils/designSystemHelper'; // 제거됨" },
        { from: "} from '../../../../../utils/designSystemHelper';", to: "} from '../../../../../utils/designSystemHelper'; // 제거됨" }
    ];
    
    for (const fix of pathFixes) {
        if (content.includes(fix.from)) {
            newContent = newContent.replace(fix.from, fix.to);
            hasChanges = true;
            console.log(`🔄 import 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 상위 디렉토리 import 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllOutsideImports() {
    console.log('🔧 상위 디렉토리 import 수정 시작...\n');
    
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
                if (fixOutsideImports(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 상위 디렉토리 import 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllOutsideImports();
}

module.exports = { fixOutsideImports, fixAllOutsideImports };

