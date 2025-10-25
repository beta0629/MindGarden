/**
 * 테마 선택기 컴포넌트
 * 사용자가 테마를 선택하고 미리보기할 수 있는 UI 컴포넌트
 */

import {useState, useEffect} from 'react';

import {useTheme} from '../../../contexts/ThemeContext';
import Button from '../Button/Button';
import Card from '../Card/Card';
import CardContent from '../Card/CardContent';
import Icon from '../Icon/Icon';
import './ThemeSelector.css';

const ThemeSelector = ({onThemeChange, 
  showPreview = true, 
  showCustomColors = false,
  className = ''}) => {const {currentTheme, 
    availableThemes, 
    changeTheme, 
    previewTheme, 
    cancelPreview,
    isLoading} = useTheme();

  const [selectedTheme, setSelectedTheme] = useState(currentTheme.type);
  const [previewedTheme, setPreviewedTheme] = useState(null);
  const [customColors, setCustomColors] = useState({});

  // 현재 테마가 변경되면 선택된 테마도 업데이트
  useEffect(() => {setSelectedTheme(currentTheme.type);}, [currentTheme]);

  // 테마 선택 핸들러
  const handleThemeSelect = (themeType) => {setSelectedTheme(themeType);
    
    if (showPreview) {const preview = previewTheme(themeType, customColors);
      setPreviewedTheme(preview);}};

  // 테마 적용 핸들러
  const handleApplyTheme = async() => {try {const result = await changeTheme(selectedTheme, customColors);
      
      if (result.success) {setPreviewedTheme(null);
        onThemeChange?.(result.theme);}} catch (error) {console.error('Failed to apply theme:', error);}};

  // 미리보기 취소 핸들러
  const handleCancelPreview = () => {cancelPreview();
    setPreviewedTheme(null);
    setSelectedTheme(currentTheme.type);};

  // 커스텀 색상 변경 핸들러
  const handleCustomColorChange = (colorKey, value) => {const newCustomColors = {...customColors, [colorKey]: value};
    setCustomColors(newCustomColors);
    
    if (showPreview && selectedTheme) {const preview = previewTheme(selectedTheme, newCustomColors);
      setPreviewedTheme(preview);}};

  return (<div className={`mg-v2-theme-selector ${className}`}>
      <Card variant="default">
        <CardContent>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md mg-v2-v2-v2-mb-lg">
            <Icon name="PALETTE" size="MD" color="PRIMARY" />
            <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary">테마 선택</h3>
          </div>

          {/* 테마 목록 */}
          <div className="mg-v2-v2-v2-theme-grid">
            {availableThemes.map((theme) => (<div
                key={theme.id}
                className={`mg-v2-theme-option ${selectedTheme === theme.id ? 'mg-v2-theme-option--selected' : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div 
                  className="mg-v2-v2-v2-theme-preview"
                  style={{backgroundColor: theme.preview}}
                />
                <div className="mg-v2-v2-v2-theme-info">
                  <h4 className="mg-v2-v2-v2-theme-name">{theme.name}</h4>
                  <p className="mg-v2-v2-v2-theme-description">{theme.description}</p>
                </div>
                {selectedTheme === theme.id && (<Icon name="CHECK" size="SM" color="SUCCESS" className="mg-v2-v2-v2-theme-check" />)}
              </div>))}
          </div>

          {/* 커스텀 색상 설정 */}
          {showCustomColors && (<div className="mg-v2-v2-v2-custom-colors">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-md">커스텀 색상</h4>
              <div className="mg-v2-v2-v2-color-inputs">
                {Object.entries(currentTheme.colors).map(([key, value]) => (<div key={key} className="mg-v2-v2-v2-color-input">
                    <label className="mg-v2-v2-v2-color-label">{key}</label>
                    <input
                      type="color"
                      value={customColors[key] || value.replace('var(', '').replace(')', '')}
                      onChange={(e) => handleCustomColorChange(key, e.target.value)}
                      className="mg-v2-v2-v2-color-picker"
                    />
                  </div>))}
              </div>
            </div>)}

          {/* 액션 버튼들 */}
          <div className="mg-v2-v2-v2-theme-actions">
            <Button
              variant="primary"
              onClick={handleApplyTheme}
              loading={isLoading}
              disabled={selectedTheme === currentTheme.type && Object.keys(customColors).length === COLOR_CONSTANTS.ALPHA_TRANSPARENT}
            >
              <Icon name="CHECK" size="SM" />
              적용하기
            </Button>
            
            {previewedTheme && (<Button
                variant="outline"
                onClick={handleCancelPreview}
              >
                <Icon name="X" size="SM" />
                미리보기 취소
              </Button>)}
          </div>

          {/* 현재 테마 정보 */}
          <div className="mg-v2-v2-v2-current-theme">
            <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-sm">현재 테마</h4>
            <div className="mg-v2-v2-v2-theme-info">
              <div 
                className="mg-v2-v2-v2-theme-preview mg-v2-v2-v2-theme-preview--current"
                style={{backgroundColor: currentTheme.colors.primary}}
              />
              <div>
                <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-font-medium">{currentTheme.name}</p>
                <p className="mg-v2-v2-v2-text-xs mg-v2-v2-v2-text-muted">{currentTheme.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);};

export default ThemeSelector;
