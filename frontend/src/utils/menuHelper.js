import { apiGet } from './ajax';

/**
 * 메뉴 관련 유틸리티 함수들
 * 동적 메뉴 로딩 및 권한 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */

// 메뉴 구조 캐시
let menuStructureCache = null;
let lastMenuCacheTime = 0;
const MENU_CACHE_DURATION = 10 * 60 * 1000; // 10분

/**
 * 사용자 권한에 따른 메뉴 구조 로드 (캐시 적용)
 */
export const loadMenuStructure = async () => {
    const now = Date.now();
    
    // 캐시가 유효한 경우 캐시된 데이터 반환
    if (menuStructureCache && (now - lastMenuCacheTime) < MENU_CACHE_DURATION) {
        console.log('📋 메뉴 구조 캐시 사용');
        return menuStructureCache;
    }
    
    try {
        console.log('🔄 서버에서 메뉴 구조 로드 중...');
        const response = await apiGet('/api/menu/structure');
        
        if (response.success && response.data) {
            menuStructureCache = response.data;
            lastMenuCacheTime = now;
            
            console.log('✅ 메뉴 구조 로드 성공:', {
                role: response.data.userRole,
                totalMenus: response.data.totalMenus
            });
            
            return menuStructureCache;
        } else {
            throw new Error(response.message || '메뉴 구조 로드 실패');
        }
        
    } catch (error) {
        console.error('❌ 메뉴 구조 로드 실패:', error);
        
        // API 실패 시 기본 구조 반환
        return {
            menus: [],
            totalMenus: 0,
            userRole: 'CLIENT',
            roleDisplayName: '내담자'
        };
    }
};

/**
 * 공통 메뉴 로드
 */
export const loadCommonMenus = async () => {
    try {
        console.log('📋 공통 메뉴 로드 중...');
        const response = await apiGet('/api/menu/common');
        
        if (response.success && response.data) {
            console.log('✅ 공통 메뉴 로드 성공:', response.data.length + '개');
            return response.data;
        } else {
            throw new Error(response.message || '공통 메뉴 로드 실패');
        }
        
    } catch (error) {
        console.error('❌ 공통 메뉴 로드 실패:', error);
        return [];
    }
};

/**
 * 역할별 메뉴 로드
 */
export const loadRoleMenus = async () => {
    try {
        console.log('📋 역할별 메뉴 로드 중...');
        const response = await apiGet('/api/menu/by-role');
        
        if (response.success && response.data) {
            console.log('✅ 역할별 메뉴 로드 성공:', {
                role: response.role,
                menus: response.data.length + '개'
            });
            return response.data;
        } else {
            throw new Error(response.message || '역할별 메뉴 로드 실패');
        }
        
    } catch (error) {
        console.error('❌ 역할별 메뉴 로드 실패:', error);
        return [];
    }
};

/**
 * 메뉴 접근 권한 확인
 */
export const checkMenuPermission = async (menuId) => {
    try {
        console.log('🔒 메뉴 권한 확인:', menuId);
        const response = await apiGet(`/api/menu/check-permission?menuId=${menuId}`);
        
        if (response.success) {
            console.log('✅ 메뉴 권한 확인 완료:', {
                menuId: response.menuId,
                hasPermission: response.hasPermission
            });
            return response.hasPermission;
        } else {
            throw new Error(response.message || '메뉴 권한 확인 실패');
        }
        
    } catch (error) {
        console.error('❌ 메뉴 권한 확인 실패:', error);
        return false; // 오류 시 권한 없음으로 처리
    }
};

/**
 * 메뉴 구조를 React 컴포넌트에서 사용할 수 있는 형태로 변환
 */
export const transformMenuStructure = (menuStructure) => {
    if (!menuStructure || !menuStructure.menus) {
        return { mainMenus: [], subMenus: {} };
    }
    
    const mainMenus = [];
    const subMenus = {};
    
    menuStructure.menus.forEach(menu => {
        // 메인 메뉴 추가
        const mainMenu = {
            id: menu.id,
            label: menu.label,
            path: menu.path,
            icon: menu.icon,
            hasSubMenu: menu.hasSubMenu || (menu.subMenus && menu.subMenus.length > 0)
        };
        
        mainMenus.push(mainMenu);
        
        // 서브 메뉴가 있는 경우 추가
        if (menu.subMenus && menu.subMenus.length > 0) {
            subMenus[menu.id] = menu.subMenus.map(subMenu => ({
                id: subMenu.id,
                label: subMenu.label,
                path: subMenu.path,
                icon: subMenu.icon,
                parent: subMenu.parent || menu.id
            }));
        }
    });
    
    return { mainMenus, subMenus };
};

/**
 * 메뉴 트리에서 특정 메뉴 찾기
 */
export const findMenuById = (menuStructure, menuId) => {
    if (!menuStructure || !menuStructure.menus) {
        return null;
    }
    
    for (const menu of menuStructure.menus) {
        // 메인 메뉴 확인
        if (menu.id === menuId) {
            return menu;
        }
        
        // 서브 메뉴 확인
        if (menu.subMenus && menu.subMenus.length > 0) {
            const subMenu = menu.subMenus.find(sub => sub.id === menuId);
            if (subMenu) {
                return subMenu;
            }
        }
    }
    
    return null;
};

/**
 * 메뉴 경로 유효성 검증
 */
export const validateMenuPath = async (path) => {
    try {
        const menuStructure = await loadMenuStructure();
        
        // 경로가 메뉴 구조에 존재하는지 확인
        const menuExists = menuStructure.menus.some(menu => {
            if (menu.path === path) return true;
            
            if (menu.subMenus && menu.subMenus.length > 0) {
                return menu.subMenus.some(subMenu => subMenu.path === path);
            }
            
            return false;
        });
        
        console.log('🔍 메뉴 경로 검증:', { path, exists: menuExists });
        return menuExists;
        
    } catch (error) {
        console.error('❌ 메뉴 경로 검증 실패:', error);
        return false;
    }
};

/**
 * 메뉴 캐시 초기화
 */
export const clearMenuCache = () => {
    console.log('🗑️ 메뉴 캐시 초기화');
    menuStructureCache = null;
    lastMenuCacheTime = 0;
};

/**
 * 메뉴 디버깅 정보 출력
 */
export const debugMenuStructure = (menuStructure) => {
    if (!menuStructure) {
        console.log('❌ 메뉴 구조가 없습니다.');
        return;
    }
    
    console.group('🛠️ 메뉴 구조 디버깅');
    console.log('사용자 역할:', menuStructure.userRole);
    console.log('역할 표시명:', menuStructure.roleDisplayName);
    console.log('총 메뉴 수:', menuStructure.totalMenus);
    console.log('메뉴 구조:', menuStructure.menus);
    
    // 메뉴별 상세 정보
    menuStructure.menus.forEach((menu, index) => {
        console.group(`메뉴 ${index + 1}: ${menu.label}`);
        console.log('ID:', menu.id);
        console.log('경로:', menu.path);
        console.log('아이콘:', menu.icon);
        console.log('서브메뉴 수:', menu.subMenus ? menu.subMenus.length : 0);
        
        if (menu.subMenus && menu.subMenus.length > 0) {
            console.log('서브메뉴:', menu.subMenus.map(sub => `${sub.label} (${sub.path})`));
        }
        
        console.groupEnd();
    });
    
    console.groupEnd();
};
