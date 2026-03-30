# 🎨 하드코딩된 색상값 상세 리포트

> **생성일**: 2025-11-28T06:31:42.569Z  
> **총 검사 파일**: 931개  
> **하드코딩 발견 파일**: 325개  
> **총 하드코딩 색상**: 5761개

---

## 📊 요약 통계

| 구분 | 수량 | 비율 |
|------|------|------|
| 총 파일 | 931개 | 100% |
| 영향받는 파일 | 325개 | 34.9% |
| 중요 파일 | 22개 | 2.4% |

### 색상 유형별 분포
- **HEX_3**: 268개
- **HEX_6**: 3595개
- **RGBA**: 1891개
- **RGB**: 7개

---

## 🔥 중요 파일 (즉시 수정 필요)

- `frontend/src/styles/mindgarden-design-system.css`
- `frontend/src/styles/themes/mobile-theme.css`
- `frontend/src/styles/themes/light-theme.css`
- `frontend/src/styles/themes/ios-theme.css`
- `frontend/src/styles/themes/high-contrast-theme.css`
- `frontend/src/styles/themes/dark-theme.css`
- `frontend/src/styles/01-settings/_theme-variables.css`
- `frontend/src/styles/01-settings/_colors.css`
- `frontend/src/components/ui/ThemeSelector/ThemeSelector.css`
- `frontend/src/components/admin/BrandingManagement.css`
- `frontend/src/utils/cssThemeHelper.js`
- `frontend/src/utils/colorUtils.js`
- `frontend/src/themes/defaultTheme.js`
- `frontend/src/hooks/useTheme.js`
- `frontend/src/constants/cssConstants.js`
- `frontend/src/constants/css-variables.js`
- `frontend/src/constants/css/headerConstants.js`
- `frontend/src/constants/css/commonStyles.js`
- `frontend/src/components/ui/ThemeSelector/ThemeSelector.test.js`
- `frontend/src/components/mindgarden/ColorPaletteShowcase.js`
- `frontend/src/components/admin/BrandingManagement.js`
- `frontend/src/tokens/colors.json`

---

## 📋 파일별 상세 내역

### 🔥 `frontend/src/styles/mindgarden-design-system.css` (CSS)

**하드코딩 색상**: 401개 - **즉시 수정 필요**

1. **HEX_3**: `#666` (라인 4726)
   ```
   color: var(--color-text-secondary, #666);
   ```

2. **HEX_3**: `#999` (라인 4755)
   ```
   color: var(--color-text-muted, #999);
   ```

3. **HEX_3**: `#eee` (라인 4772)
   ```
   border-bottom: 1px solid var(--color-border-light, #eee);
   ```

4. **HEX_3**: `#666` (라인 10529)
   ```
   color: #666;
   ```

5. **HEX_3**: `#666` (라인 15319)
   ```
   color: #666;
   ```

6. **HEX_3**: `#ddd` (라인 16091)
   ```
   border: 1px solid #ddd;
   ```

7. **HEX_6**: `#66b3ff` (라인 19)
   ```
   --color-primary-light: #66b3ff;
   ```

8. **HEX_6**: `#0056b3` (라인 20)
   ```
   --color-primary-dark: #0056b3;
   ```

9. **HEX_6**: `#9ca3af` (라인 25)
   ```
   --color-secondary-light: #9ca3af;
   ```

10. **HEX_6**: `#495057` (라인 26)
   ```
   --color-secondary-dark: #495057;
   ```

11. **HEX_6**: `#6cbb6d` (라인 31)
   ```
   --status-success-light: #6cbb6d;
   ```

12. **HEX_6**: `#1e7e34` (라인 32)
   ```
   --status-success-dark: #1e7e34;
   ```

13. **HEX_6**: `#f56565` (라인 36)
   ```
   --status-error-light: #f56565;
   ```

14. **HEX_6**: `#c82333` (라인 37)
   ```
   --status-error-dark: #c82333;
   ```

15. **HEX_6**: `#ffeaa7` (라인 41)
   ```
   --status-warning-light: #ffeaa7;
   ```

16. **HEX_6**: `#e0a800` (라인 42)
   ```
   --status-warning-dark: #e0a800;
   ```

17. **HEX_6**: `#856404` (라인 44)
   ```
   --color-warning-dark: #856404;
   ```

18. **HEX_6**: `#bbdefb` (라인 47)
   ```
   --status-info-light: #bbdefb;
   ```

19. **HEX_6**: `#138496` (라인 48)
   ```
   --status-info-dark: #138496;
   ```

20. **HEX_6**: `#fd7e14` (라인 51)
   ```
   --status-pending: #fd7e14;
   ```

21. **HEX_6**: `#ffa94d` (라인 52)
   ```
   --status-pending-light: #ffa94d;
   ```

22. **HEX_6**: `#e55a00` (라인 53)
   ```
   --status-pending-dark: #e55a00;
   ```

23. **HEX_6**: `#d1fae5` (라인 57)
   ```
   --status-success-bg: #d1fae5;
   ```

24. **HEX_6**: `#fee2e2` (라인 58)
   ```
   --status-error-bg: #fee2e2;
   ```

25. **HEX_6**: `#fef3c7` (라인 59)
   ```
   --status-warning-bg: #fef3c7;
   ```

26. **HEX_6**: `#dbeafe` (라인 60)
   ```
   --status-info-bg: #dbeafe;
   ```

27. **HEX_6**: `#fecaca` (라인 63)
   ```
   --status-error-border: #fecaca;
   ```

28. **HEX_6**: `#c3e6cb` (라인 64)
   ```
   --status-success-border: #c3e6cb;
   ```

29. **HEX_6**: `#e91e63` (라인 67)
   ```
   --color-accent: #e91e63;
   ```

30. **HEX_6**: `#795548` (라인 68)
   ```
   --color-brown: #795548;
   ```

31. **HEX_6**: `#6d3410` (라인 69)
   ```
   --color-brown-dark: #6d3410;
   ```

32. **HEX_6**: `#9e9e9e` (라인 70)
   ```
   --color-gray: #9e9e9e;
   ```

33. **HEX_6**: `#95a5a6` (라인 71)
   ```
   --color-gray-light: #95a5a6;
   ```

34. **HEX_6**: `#7f8c8d` (라인 72)
   ```
   --color-gray-dark: #7f8c8d;
   ```

35. **HEX_6**: `#7b1fa2` (라인 73)
   ```
   --color-purple: #7b1fa2;
   ```

36. **HEX_6**: `#f3e5f5` (라인 74)
   ```
   --color-purple-light: #f3e5f5;
   ```

37. **HEX_6**: `#e65100` (라인 75)
   ```
   --color-orange: #e65100;
   ```

38. **HEX_6**: `#fff3e0` (라인 76)
   ```
   --color-orange-light: #fff3e0;
   ```

39. **HEX_6**: `#c2185b` (라인 78)
   ```
   --color-pink: #c2185b;
   ```

40. **HEX_6**: `#fce4ec` (라인 79)
   ```
   --color-pink-light: #fce4ec;
   ```

41. **HEX_6**: `#a8a8a8` (라인 80)
   ```
   --color-border-dark: #a8a8a8;
   ```

42. **HEX_6**: `#212529` (라인 84)
   ```
   --color-dark: #212529;
   ```

43. **HEX_6**: `#2F2F2F` (라인 87)
   ```
   --dark-gray: #2F2F2F;
   ```

44. **HEX_6**: `#6B6B6B` (라인 88)
   ```
   --medium-gray: #6B6B6B;
   ```

45. **HEX_6**: `#FFFEF7` (라인 89)
   ```
   --light-cream: #FFFEF7;
   ```

46. **HEX_6**: `#6b7280` (라인 253)
   ```
   --status-completed: #6b7280;
   ```

47. **HEX_6**: `#FAFAFA` (라인 269)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

48. **HEX_6**: `#e9ecef` (라인 273)
   ```
   --color-border-light: #e9ecef;
   ```

49. **HEX_6**: `#2F2F2F` (라인 295)
   ```
   --dark-gray: #2F2F2F;
   ```

50. **HEX_6**: `#6B6B6B` (라인 296)
   ```
   --medium-gray: #6B6B6B;
   ```

51. **HEX_6**: `#FFFEF7` (라인 297)
   ```
   --light-cream: #FFFEF7;
   ```

52. **HEX_6**: `#FFF5EE` (라인 353)
   ```
   #FFF5EE 0%,      /* 연한 베이지 */
   ```

53. **HEX_6**: `#FFE4E1` (라인 354)
   ```
   #FFE4E1 30%,     /* 연분홍 */
   ```

54. **HEX_6**: `#FFFACD` (라인 355)
   ```
   #FFFACD 60%,     /* 레몬 시폰 (연노랑) */
   ```

55. **HEX_6**: `#FFE4E1` (라인 356)
   ```
   #FFE4E1 100%     /* 연분홍 */
   ```

56. **HEX_6**: `#6b7280` (라인 3785)
   ```
   --color-text-secondary: #6b7280; /* 회색 - 비활성 */
   ```

57. **HEX_6**: `#2F2F2F` (라인 3872)
   ```
   color: var(--dark-gray, #2F2F2F);
   ```

58. **HEX_6**: `#6B6B6B` (라인 3878)
   ```
   color: var(--medium-gray, #6B6B6B);
   ```

59. **HEX_6**: `#2F2F2F` (라인 3897)
   ```
   color: var(--dark-gray, #2F2F2F);
   ```

60. **HEX_6**: `#6B6B6B` (라인 3956)
   ```
   color: var(--medium-gray, #6B6B6B);
   ```

61. **HEX_6**: `#2F2F2F` (라인 3962)
   ```
   color: var(--dark-gray, #2F2F2F);
   ```

62. **HEX_6**: `#059669` (라인 5211)
   ```
   background: linear-gradient(135deg, var(--mg-success-500), #059669);
   ```

63. **HEX_6**: `#764ba2` (라인 5995)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

64. **HEX_6**: `#f5576c` (라인 6000)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

65. **HEX_6**: `#4facfe` (라인 6005)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

66. **HEX_6**: `#00f2fe` (라인 6005)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

67. **HEX_6**: `#fa709a` (라인 6010)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

68. **HEX_6**: `#fee140` (라인 6010)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

69. **HEX_6**: `#a8edea` (라인 6015)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

70. **HEX_6**: `#fed6e3` (라인 6015)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

71. **HEX_6**: `#ffecd2` (라인 6020)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

72. **HEX_6**: `#fcb69f` (라인 6020)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

73. **HEX_6**: `#764ba2` (라인 6025)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

74. **HEX_6**: `#4facfe` (라인 6030)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

75. **HEX_6**: `#00f2fe` (라인 6030)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

76. **HEX_6**: `#fa709a` (라인 6035)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

77. **HEX_6**: `#fee140` (라인 6035)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

78. **HEX_6**: `#764ba2` (라인 6040)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

79. **HEX_6**: `#ffecd2` (라인 6045)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

80. **HEX_6**: `#fcb69f` (라인 6045)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

81. **HEX_6**: `#a8edea` (라인 6050)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

82. **HEX_6**: `#fed6e3` (라인 6050)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

83. **HEX_6**: `#764ba2` (라인 8137)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

84. **HEX_6**: `#3f51b5` (라인 8189)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

85. **HEX_6**: `#1e3a8a` (라인 8189)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

86. **HEX_6**: `#a8e6a3` (라인 9225)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

87. **HEX_6**: `#7dd87a` (라인 9225)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

88. **HEX_6**: `#a8e6a3` (라인 9462)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

89. **HEX_6**: `#7dd87a` (라인 9462)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

90. **HEX_6**: `#0056b3` (라인 9752)
   ```
   background-color: var(--color-primary-dark, #0056b3);
   ```

91. **HEX_6**: `#545b62` (라인 9764)
   ```
   background-color: var(--color-secondary-dark, #545b62);
   ```

92. **HEX_6**: `#495057` (라인 9851)
   ```
   color: #495057;
   ```

93. **HEX_6**: `#495057` (라인 9889)
   ```
   color: #495057;
   ```

94. **HEX_6**: `#495057` (라인 10009)
   ```
   color: #495057;
   ```

95. **HEX_6**: `#e1e5e9` (라인 10302)
   ```
   border: 2px solid #e1e5e9;
   ```

96. **HEX_6**: `#495057` (라인 10306)
   ```
   color: #495057;
   ```

97. **HEX_6**: `#e9ecef` (라인 10397)
   ```
   border: 2px solid #e9ecef;
   ```

98. **HEX_6**: `#e9ecef` (라인 10410)
   ```
   border: 1px solid #e9ecef;
   ```

99. **HEX_6**: `#e9ecef` (라인 10434)
   ```
   background: #e9ecef;
   ```

100. **HEX_6**: `#e9ecef` (라인 10535)
   ```
   border: 1px solid #e9ecef;
   ```

101. **HEX_6**: `#495057` (라인 10556)
   ```
   color: #495057;
   ```

102. **HEX_6**: `#e5e7eb` (라인 10567)
   ```
   border: 1px solid #e5e7eb;
   ```

103. **HEX_6**: `#a8e6a3` (라인 10590)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

104. **HEX_6**: `#7dd87a` (라인 10590)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

105. **HEX_6**: `#1f2937` (라인 10608)
   ```
   color: #1f2937;
   ```

106. **HEX_6**: `#6B6B6B` (라인 10613)
   ```
   color: #6B6B6B;
   ```

107. **HEX_6**: `#f3f4f6` (라인 10635)
   ```
   border-top: 1px solid #f3f4f6;
   ```

108. **HEX_6**: `#6B6B6B` (라인 10637)
   ```
   color: #6B6B6B;
   ```

109. **HEX_6**: `#a8e6a3` (라인 10761)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

110. **HEX_6**: `#7dd87a` (라인 10761)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

111. **HEX_6**: `#a8e6a3` (라인 11159)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

112. **HEX_6**: `#7dd87a` (라인 11159)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

113. **HEX_6**: `#a8e6a3` (라인 11393)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

114. **HEX_6**: `#7dd87a` (라인 11393)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

115. **HEX_6**: `#a8e6a3` (라인 11512)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

116. **HEX_6**: `#7dd87a` (라인 11512)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

117. **HEX_6**: `#a8e6a3` (라인 12714)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

118. **HEX_6**: `#7dd87a` (라인 12714)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

119. **HEX_6**: `#764ba2` (라인 13951)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

120. **HEX_6**: `#0056b3` (라인 14277)
   ```
   background-color: #0056b3;
   ```

121. **HEX_6**: `#0056b3` (라인 14278)
   ```
   border-color: #0056b3;
   ```

122. **HEX_6**: `#FFE5E5` (라인 14702)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

123. **HEX_6**: `#FFF8E1` (라인 14702)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

124. **HEX_6**: `#FFE5E5` (라인 14736)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

125. **HEX_6**: `#FFF8E1` (라인 14736)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

126. **HEX_6**: `#FFD700` (라인 14769)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

127. **HEX_6**: `#FFA500` (라인 14769)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

128. **HEX_6**: `#FFB6C1` (라인 14803)
   ```
   background: #FFB6C1;
   ```

129. **HEX_6**: `#98E4D8` (라인 14807)
   ```
   background: #98E4D8;
   ```

130. **HEX_6**: `#A8D8EA` (라인 14811)
   ```
   background: #A8D8EA;
   ```

131. **HEX_6**: `#FFE5B4` (라인 14815)
   ```
   background: #FFE5B4;
   ```

132. **HEX_6**: `#FF69B4` (라인 14848)
   ```
   color: #FF69B4;
   ```

133. **HEX_6**: `#fbbf24` (라인 15226)
   ```
   .mg-v2-radio-color[data-color="#fbbf24"] {
   ```

134. **HEX_6**: `#fbbf24` (라인 15227)
   ```
   background-color: #fbbf24;
   ```

135. **HEX_6**: `#e9ecef` (라인 15325)
   ```
   border: 1px solid #e9ecef;
   ```

136. **HEX_6**: `#e9ecef` (라인 15351)
   ```
   border: 1px solid #e9ecef;
   ```

137. **HEX_6**: `#e9ecef` (라인 15363)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

138. **HEX_6**: `#e9ecef` (라인 15364)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

139. **HEX_6**: `#2c3e50` (라인 15393)
   ```
   color: #2c3e50;
   ```

140. **HEX_6**: `#e9ecef` (라인 15419)
   ```
   border: 1px solid #e9ecef;
   ```

141. **HEX_6**: `#2c3e50` (라인 15426)
   ```
   color: #2c3e50;
   ```

142. **HEX_6**: `#e9ecef` (라인 15454)
   ```
   border-top: 1px solid #e9ecef;
   ```

143. **HEX_6**: `#3498db` (라인 15470)
   ```
   border: 1px solid #3498db;
   ```

144. **HEX_6**: `#3498db` (라인 15472)
   ```
   color: #3498db;
   ```

145. **HEX_6**: `#3498db` (라인 15477)
   ```
   background: #3498db;
   ```

146. **HEX_6**: `#3498db` (라인 15490)
   ```
   border: 1px solid #3498db;
   ```

147. **HEX_6**: `#3498db` (라인 15492)
   ```
   color: #3498db;
   ```

148. **HEX_6**: `#3498db` (라인 15498)
   ```
   background: #3498db;
   ```

149. **HEX_6**: `#3498db` (라인 15504)
   ```
   color: #3498db;
   ```

150. **HEX_6**: `#059669` (라인 15526)
   ```
   .mg-v2-status-badge--completed { background-color: #059669; }
   ```

151. **HEX_6**: `#dc2626` (라인 15527)
   ```
   .mg-v2-status-badge--suspended { background-color: #dc2626; }
   ```

152. **HEX_6**: `#6b7280` (라인 15528)
   ```
   .mg-v2-status-badge--default { background-color: #6b7280; }
   ```

153. **HEX_6**: `#495057` (라인 15538)
   ```
   color: #495057;
   ```

154. **HEX_6**: `#495057` (라인 15569)
   ```
   color: #495057;
   ```

155. **HEX_6**: `#e9ecef` (라인 15571)
   ```
   background-color: #e9ecef;
   ```

156. **HEX_6**: `#495057` (라인 15599)
   ```
   color: #495057;
   ```

157. **HEX_6**: `#e9ecef` (라인 15635)
   ```
   border: 1px solid #e9ecef;
   ```

158. **HEX_6**: `#495057` (라인 15640)
   ```
   color: #495057;
   ```

159. **HEX_6**: `#e9ecef` (라인 15656)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

160. **HEX_6**: `#495057` (라인 15658)
   ```
   color: #495057;
   ```

161. **HEX_6**: `#495057` (라인 15672)
   ```
   color: #495057;
   ```

162. **HEX_6**: `#495057` (라인 15677)
   ```
   color: #495057;
   ```

163. **HEX_6**: `#e5e7eb` (라인 15694)
   ```
   border: 1px solid #e5e7eb;
   ```

164. **HEX_6**: `#0056b3` (라인 15710)
   ```
   color: #0056b3;
   ```

165. **HEX_6**: `#2c3e50` (라인 15765)
   ```
   color: #2c3e50;
   ```

166. **HEX_6**: `#dee2e6` (라인 15803)
   ```
   background-color: #dee2e6;
   ```

167. **HEX_6**: `#495057` (라인 15810)
   ```
   background-color: #495057;
   ```

168. **HEX_6**: `#e3f2fd` (라인 15824)
   ```
   background-color: #e3f2fd;
   ```

169. **HEX_6**: `#fff3cd` (라인 15829)
   ```
   background-color: #fff3cd;
   ```

170. **HEX_6**: `#e2e8f0` (라인 15848)
   ```
   border: 2px solid #e2e8f0;
   ```

171. **HEX_6**: `#f7fafc` (라인 15862)
   ```
   background-color: #f7fafc;
   ```

172. **HEX_6**: `#718096` (라인 15872)
   ```
   color: #718096;
   ```

173. **HEX_6**: `#f7fafc` (라인 15878)
   ```
   background-color: #f7fafc;
   ```

174. **HEX_6**: `#e2e8f0` (라인 15882)
   ```
   border: 1px solid #e2e8f0;
   ```

175. **HEX_6**: `#4a5568` (라인 15887)
   ```
   color: #4a5568;
   ```

176. **HEX_6**: `#764ba2` (라인 15898)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

177. **HEX_6**: `#cbd5e0` (라인 15912)
   ```
   background: #cbd5e0;
   ```

178. **HEX_6**: `#48bb78` (라인 15919)
   ```
   background-color: #48bb78;
   ```

179. **HEX_6**: `#2d3748` (라인 15959)
   ```
   color: #2d3748;
   ```

180. **HEX_6**: `#2d3748` (라인 15966)
   ```
   color: #2d3748;
   ```

181. **HEX_6**: `#718096` (라인 15972)
   ```
   color: #718096;
   ```

182. **HEX_6**: `#764ba2` (라인 15984)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

183. **HEX_6**: `#e1e5e9` (라인 16000)
   ```
   border: 2px solid #e1e5e9;
   ```

184. **HEX_6**: `#5a6268` (라인 16026)
   ```
   background-color: #5a6268;
   ```

185. **HEX_6**: `#2c3e50` (라인 16044)
   ```
   color: #2c3e50;
   ```

186. **HEX_6**: `#0056b3` (라인 16067)
   ```
   background-color: #0056b3;
   ```

187. **HEX_6**: `#e8f4fd` (라인 16118)
   ```
   background: #e8f4fd;
   ```

188. **HEX_6**: `#bee5eb` (라인 16119)
   ```
   border: 1px solid #bee5eb;
   ```

189. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 92)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

190. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 93)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

191. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 101)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

192. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 102)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

193. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 103)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

194. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 109)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

195. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 110)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

196. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 111)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

197. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 112)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

198. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 113)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

199. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 114)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

200. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 115)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

201. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 116)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

202. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 116)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

203. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 309)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

204. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 321)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

205. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 367)
   ```
   rgba(255, 192, 203, 0.15),  /* 연분홍 - 더 연하게 */
   ```

206. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 368)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

207. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 369)
   ```
   rgba(255, 192, 203, 0.15)   /* 연분홍 - 더 연하게 */
   ```

208. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 392)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

209. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 393)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

210. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 394)
   ```
   rgba(255, 223, 186, 0.12)  /* 복숭아 - 더 연하게 */
   ```

211. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 405)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

212. **RGBA**: `rgba(255, 250, 205, 0.08)` (라인 406)
   ```
   rgba(255, 250, 205, 0.08), /* 연노랑 - 더 연하게 */
   ```

213. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 407)
   ```
   rgba(255, 239, 213, 0.1)   /* 연한 복숭아 - 더 연하게 */
   ```

214. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 432)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

215. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 434)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

216. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 481)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

217. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 650)
   ```
   background: rgba(128, 128, 0, 0.1);
   ```

218. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 697)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

219. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 699)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

220. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 704)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

221. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 781)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

222. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 805)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

223. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 824)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

224. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 853)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

225. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 855)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

226. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 861)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

227. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 880)
   ```
   rgba(255, 255, 255, 0.1) 0%,
   ```

228. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 881)
   ```
   rgba(255, 255, 255, 0.05) 100%);
   ```

229. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 888)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

230. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 891)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

231. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 898)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

232. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 900)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

233. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 919)
   ```
   rgba(255, 255, 255, 0.3) 0%,
   ```

234. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 920)
   ```
   rgba(255, 255, 255, 0.1) 100%);
   ```

235. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 926)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

236. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 927)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

237. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 988)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

238. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 990)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

239. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 1026)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

240. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 1028)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

241. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 1042)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

242. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 1425)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

243. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1433)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

244. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 2862)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

245. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2864)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

246. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 2874)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

247. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 2876)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

248. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3107)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

249. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 3133)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

250. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 3134)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

251. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 3140)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

252. **RGBA**: `rgba(255, 149, 0, 0.1)` (라인 3148)
   ```
   background: rgba(255, 149, 0, 0.1);
   ```

253. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 3154)
   ```
   border: 1px solid rgba(255, 149, 0, 0.3);
   ```

254. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 3158)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

255. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 3160)
   ```
   border: 1px solid rgba(239, 68, 68, 0.3);
   ```

256. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3166)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

257. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 3168)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

258. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3211)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

259. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3233)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

260. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 3235)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

261. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 3270)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

262. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 3271)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

263. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 3277)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

264. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 3278)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

265. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 3284)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

266. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3310)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

267. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 3315)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

268. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 3329)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

269. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 3331)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

270. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 3342)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

271. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 3344)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

272. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 3552)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

273. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 3579)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

274. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 3581)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

275. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 3584)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

276. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 3591)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

277. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 3592)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

278. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 3655)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

279. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 3691)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

280. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 3693)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

281. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 3696)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

282. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 3703)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

283. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 3704)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

284. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 3788)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

285. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 3789)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

286. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 3790)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

287. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 3791)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

288. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 3833)
   ```
   background: var(--card-bg, rgba(255, 255, 255, 0.6));
   ```

289. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 3834)
   ```
   border: 1px solid var(--card-border, rgba(255, 255, 255, 0.5));
   ```

290. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 3858)
   ```
   border-bottom: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

291. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 3901)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

292. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 4281)
   ```
   border-top: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

293. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 4738)
   ```
   background: var(--mint-green-light, rgba(152, 251, 152, 0.2));
   ```

294. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4859)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

295. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 4901)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

296. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4919)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

297. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4946)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

298. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 4997)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

299. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4998)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

300. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 5009)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

301. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5053)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

302. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5055)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

303. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 5067)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

304. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5285)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

305. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 5323)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

306. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5343)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

307. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5345)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

308. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 5357)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

309. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5396)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

310. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 5438)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

311. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 5824)
   ```
   box-shadow: 0 2px 4px rgba(152, 251, 152, 0.1);
   ```

312. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6148)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

313. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6150)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

314. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 6157)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

315. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 6164)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

316. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 6166)
   ```
   box-shadow: 0 0 0 2px rgba(182, 229, 216, 0.3);
   ```

317. **RGBA**: `rgba(182, 229, 216, 0.4)` (라인 6229)
   ```
   box-shadow: 0 4px 12px rgba(182, 229, 216, 0.4);
   ```

318. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6237)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

319. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 6293)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

320. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6314)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

321. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6348)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

322. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6349)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

323. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 6356)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

324. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 6423)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

325. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 6429)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

326. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 6431)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

327. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 6435)
   ```
   background: rgba(182, 229, 216, 0.3);
   ```

328. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6441)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

329. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 6443)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

330. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 6447)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

331. **RGBA**: `rgba(107, 107, 107, 0.3)` (라인 6449)
   ```
   border: 1px solid rgba(107, 107, 107, 0.3);
   ```

332. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 6453)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

333. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 6455)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

334. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 6460)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

335. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 6462)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

336. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 6466)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

337. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6472)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

338. **RGBA**: `rgba(139, 69, 19, 0.4)` (라인 6474)
   ```
   border: 1px solid rgba(139, 69, 19, 0.4);
   ```

339. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 6478)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

340. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 6480)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

341. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6487)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

342. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6489)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

343. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6500)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

344. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 6508)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

345. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 6583)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

346. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 6625)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

347. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 6831)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

348. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 6872)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

349. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 7274)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

350. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 7393)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

351. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 8145)
   ```
   text-shadow: 0 1px 2px rgba(0, 123, 255, 0.3);
   ```

352. **RGBA**: `rgba(59, 130, 246, 0.05)` (라인 8568)
   ```
   background: rgba(59, 130, 246, 0.05) !important;
   ```

353. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 9754)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

354. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 9777)
   ```
   box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
   ```

355. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 9790)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

356. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 9802)
   ```
   box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
   ```

357. **RGBA**: `rgba(0,0,0,0.1)` (라인 9990)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

358. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 10068)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

359. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 10070)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

360. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 10086)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

361. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 10087)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

362. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 10202)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

363. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 10239)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

364. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 10240)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

365. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 10265)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

366. **RGBA**: `rgba(0,0,0,0.1)` (라인 10340)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

367. **RGBA**: `rgba(16, 185, 129, 0.15)` (라인 10577)
   ```
   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
   ```

368. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11080)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

369. **RGBA**: `rgba(23, 162, 184, 0.1)` (라인 11099)
   ```
   background-color: rgba(23, 162, 184, 0.1);
   ```

370. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 11104)
   ```
   background-color: rgba(220, 53, 69, 0.1);
   ```

371. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 11109)
   ```
   background-color: rgba(40, 167, 69, 0.1);
   ```

372. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11120)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

373. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 11220)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

374. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 11222)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

375. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 12399)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

376. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 12698)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

377. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 12739)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
   ```

378. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 13408)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

379. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 13639)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

380. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 13827)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.1);
   ```

381. **RGBA**: `rgba(227, 242, 253, 0.5)` (라인 13972)
   ```
   background: rgba(227, 242, 253, 0.5);
   ```

382. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 14059)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

383. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 14074)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

384. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 14266)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

385. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 14596)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

386. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 14715)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.2) 0%, transparent 70%);
   ```

387. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 14728)
   ```
   background: radial-gradient(circle, rgba(182, 229, 216, 0.2) 0%, transparent 70%);
   ```

388. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 14740)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

389. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 14762)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
   ```

390. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 14775)
   ```
   box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
   ```

391. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 14820)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

392. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 14828)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

393. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 14842)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.2);
   ```

394. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 14879)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.15);
   ```

395. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 14884)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

396. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 15006)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

397. **RGBA**: `rgba(220, 53, 69, 0.25)` (라인 15120)
   ```
   box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
   ```

398. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 15348)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

399. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 15858)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

400. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 15908)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
   ```

401. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 16069)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
   ```

---

### 🔥 `frontend/src/styles/themes/ios-theme.css` (CSS)

**하드코딩 색상**: 102개 - **즉시 수정 필요**

1. **HEX_6**: `#0056CC` (라인 7)
   ```
   --color-primary-hover: #0056CC;
   ```

2. **HEX_6**: `#004499` (라인 8)
   ```
   --color-primary-active: #004499;
   ```

3. **HEX_6**: `#E3F2FD` (라인 9)
   ```
   --color-primary-light: #E3F2FD;
   ```

4. **HEX_6**: `#003366` (라인 10)
   ```
   --color-primary-dark: #003366;
   ```

5. **HEX_6**: `#8E8E93` (라인 12)
   ```
   --color-secondary: #8E8E93;
   ```

6. **HEX_6**: `#6D6D70` (라인 13)
   ```
   --color-secondary-hover: #6D6D70;
   ```

7. **HEX_6**: `#48484A` (라인 14)
   ```
   --color-secondary-active: #48484A;
   ```

8. **HEX_6**: `#F2F2F7` (라인 15)
   ```
   --color-secondary-light: #F2F2F7;
   ```

9. **HEX_6**: `#1C1C1E` (라인 16)
   ```
   --color-secondary-dark: #1C1C1E;
   ```

10. **HEX_6**: `#FAFAFA` (라인 19)
   ```
   --color-bg-primary: #FAFAFA;
   ```

11. **HEX_6**: `#F5F5F7` (라인 20)
   ```
   --color-bg-secondary: #F5F5F7;
   ```

12. **HEX_6**: `#E8E8ED` (라인 22)
   ```
   --color-bg-accent: #E8E8ED;
   ```

13. **HEX_6**: `#1D1D1F` (라인 27)
   ```
   --color-text-primary: #1D1D1F;
   ```

14. **HEX_6**: `#424245` (라인 28)
   ```
   --color-text-secondary: #424245;
   ```

15. **HEX_6**: `#636366` (라인 29)
   ```
   --color-text-tertiary: #636366;
   ```

16. **HEX_6**: `#8E8E93` (라인 30)
   ```
   --color-text-muted: #8E8E93;
   ```

17. **HEX_6**: `#D1D1D6` (라인 34)
   ```
   --color-border-primary: #D1D1D6;
   ```

18. **HEX_6**: `#E8E8ED` (라인 35)
   ```
   --color-border-secondary: #E8E8ED;
   ```

19. **HEX_6**: `#A1A1A6` (라인 36)
   ```
   --color-border-accent: #A1A1A6;
   ```

20. **HEX_6**: `#D4F4DD` (라인 41)
   ```
   --color-success-light: #D4F4DD;
   ```

21. **HEX_6**: `#2AB346` (라인 42)
   ```
   --color-success-dark: #2AB346;
   ```

22. **HEX_6**: `#FFE5CC` (라인 45)
   ```
   --color-warning-light: #FFE5CC;
   ```

23. **HEX_6**: `#E6850E` (라인 46)
   ```
   --color-warning-dark: #E6850E;
   ```

24. **HEX_6**: `#FFE5E5` (라인 49)
   ```
   --color-error-light: #FFE5E5;
   ```

25. **HEX_6**: `#E63429` (라인 50)
   ```
   --color-error-dark: #E63429;
   ```

26. **HEX_6**: `#5AC8FA` (라인 52)
   ```
   --color-info: #5AC8FA;
   ```

27. **HEX_6**: `#E5F7FE` (라인 53)
   ```
   --color-info-light: #E5F7FE;
   ```

28. **HEX_6**: `#4BB5E6` (라인 54)
   ```
   --color-info-dark: #4BB5E6;
   ```

29. **HEX_6**: `#7ED321` (라인 57)
   ```
   --color-mindgarden: #7ED321;
   ```

30. **HEX_6**: `#B8E994` (라인 58)
   ```
   --color-mindgarden-light: #B8E994;
   ```

31. **HEX_6**: `#6BCF7F` (라인 59)
   ```
   --color-mindgarden-dark: #6BCF7F;
   ```

32. **HEX_6**: `#82CC6E` (라인 60)
   ```
   --color-mindgarden-accent: #82CC6E;
   ```

33. **HEX_6**: `#1D1D1F` (라인 74)
   ```
   --ios-text-primary: #1D1D1F;
   ```

34. **HEX_6**: `#424245` (라인 75)
   ```
   --ios-text-secondary: #424245;
   ```

35. **HEX_6**: `#1D1D1F` (라인 80)
   ```
   --header-text: #1D1D1F;
   ```

36. **HEX_6**: `#8E8E93` (라인 81)
   ```
   --header-text-muted: #8E8E93;
   ```

37. **HEX_6**: `#1D1D1F` (라인 107)
   ```
   --glass-text: #1D1D1F;
   ```

38. **HEX_6**: `#FAFAFA` (라인 124)
   ```
   --color-bg-primary: #FAFAFA !important;
   ```

39. **HEX_6**: `#F5F5F7` (라인 125)
   ```
   --color-bg-secondary: #F5F5F7 !important;
   ```

40. **HEX_6**: `#E8E8ED` (라인 127)
   ```
   --color-bg-accent: #E8E8ED !important;
   ```

41. **HEX_6**: `#1D1D1F` (라인 131)
   ```
   --color-text-primary: #1D1D1F !important;
   ```

42. **HEX_6**: `#424245` (라인 132)
   ```
   --color-text-secondary: #424245 !important;
   ```

43. **HEX_6**: `#636366` (라인 133)
   ```
   --color-text-tertiary: #636366 !important;
   ```

44. **HEX_6**: `#8E8E93` (라인 134)
   ```
   --color-text-muted: #8E8E93 !important;
   ```

45. **HEX_6**: `#D1D1D6` (라인 137)
   ```
   --color-border-primary: #D1D1D6 !important;
   ```

46. **HEX_6**: `#E8E8ED` (라인 138)
   ```
   --color-border-secondary: #E8E8ED !important;
   ```

47. **HEX_6**: `#A1A1A6` (라인 139)
   ```
   --color-border-accent: #A1A1A6 !important;
   ```

48. **HEX_6**: `#1D1D1F` (라인 144)
   ```
   --ios-text-primary: #1D1D1F !important;
   ```

49. **HEX_6**: `#424245` (라인 145)
   ```
   --ios-text-secondary: #424245 !important;
   ```

50. **HEX_6**: `#1D1D1F` (라인 149)
   ```
   --header-text: #1D1D1F !important;
   ```

51. **HEX_6**: `#8E8E93` (라인 150)
   ```
   --header-text-muted: #8E8E93 !important;
   ```

52. **HEX_6**: `#1D1D1F` (라인 164)
   ```
   --glass-text: #1D1D1F !important;
   ```

53. **HEX_6**: `#1D1D1F` (라인 167)
   ```
   --text-primary: #1D1D1F !important;
   ```

54. **HEX_6**: `#424245` (라인 168)
   ```
   --text-secondary: #424245 !important;
   ```

55. **HEX_6**: `#636366` (라인 169)
   ```
   --text-tertiary: #636366 !important;
   ```

56. **HEX_6**: `#FAFAFA` (라인 170)
   ```
   --bg-primary: #FAFAFA !important;
   ```

57. **HEX_6**: `#F5F5F7` (라인 171)
   ```
   --bg-secondary: #F5F5F7 !important;
   ```

58. **HEX_6**: `#7ED321` (라인 175)
   ```
   --color-mindgarden: #7ED321 !important;
   ```

59. **HEX_6**: `#B8E994` (라인 176)
   ```
   --color-mindgarden-light: #B8E994 !important;
   ```

60. **HEX_6**: `#6BCF7F` (라인 177)
   ```
   --color-mindgarden-dark: #6BCF7F !important;
   ```

61. **HEX_6**: `#82CC6E` (라인 178)
   ```
   --color-mindgarden-accent: #82CC6E !important;
   ```

62. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 23)
   ```
   --color-bg-glass: rgba(250, 250, 250, 0.8);
   ```

63. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 24)
   ```
   --color-bg-glass-strong: rgba(250, 250, 250, 0.95);
   ```

64. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 63)
   ```
   --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
   ```

65. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 64)
   ```
   --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.12);
   ```

66. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 65)
   ```
   --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.12);
   ```

67. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 66)
   ```
   --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
   ```

68. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 67)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

69. **RGBA**: `rgba(0, 0, 0, 0.24)` (라인 68)
   ```
   --shadow-glass-strong: 0 8px 32px rgba(0, 0, 0, 0.24);
   ```

70. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 71)
   ```
   --ios-bg-primary: rgba(250, 250, 250, 0.95);
   ```

71. **RGBA**: `rgba(245, 245, 247, 0.95)` (라인 72)
   ```
   --ios-bg-secondary: rgba(245, 245, 247, 0.95);
   ```

72. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 73)
   ```
   --ios-border: rgba(209, 209, 214, 0.8);
   ```

73. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 78)
   ```
   --header-bg: rgba(250, 250, 250, 0.95);
   ```

74. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 79)
   ```
   --header-border: rgba(209, 209, 214, 0.8);
   ```

75. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 84)
   ```
   --modal-bg: rgba(250, 250, 250, 0.98);
   ```

76. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 85)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.3);
   ```

77. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 86)
   ```
   --modal-border: rgba(209, 209, 214, 0.8);
   ```

78. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 90)
   ```
   --dropdown-bg: rgba(250, 250, 250, 0.98);
   ```

79. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 91)
   ```
   --dropdown-border: rgba(209, 209, 214, 0.8);
   ```

80. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 92)
   ```
   --dropdown-shadow: 0 10px 15px rgba(0, 0, 0, 0.08);
   ```

81. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 102)
   ```
   --glass-bg-light: rgba(250, 250, 250, 0.8);
   ```

82. **RGBA**: `rgba(250, 250, 250, 0.9)` (라인 103)
   ```
   --glass-bg-medium: rgba(250, 250, 250, 0.9);
   ```

83. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 104)
   ```
   --glass-bg-strong: rgba(250, 250, 250, 0.95);
   ```

84. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 105)
   ```
   --glass-border: rgba(255, 255, 255, 0.3);
   ```

85. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 106)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.4);
   ```

86. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 128)
   ```
   --color-bg-glass: rgba(250, 250, 250, 0.8) !important;
   ```

87. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 129)
   ```
   --color-bg-glass-strong: rgba(250, 250, 250, 0.95) !important;
   ```

88. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 141)
   ```
   --ios-bg-primary: rgba(250, 250, 250, 0.95) !important;
   ```

89. **RGBA**: `rgba(245, 245, 247, 0.95)` (라인 142)
   ```
   --ios-bg-secondary: rgba(245, 245, 247, 0.95) !important;
   ```

90. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 143)
   ```
   --ios-border: rgba(209, 209, 214, 0.8) !important;
   ```

91. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 147)
   ```
   --header-bg: rgba(250, 250, 250, 0.95) !important;
   ```

92. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 148)
   ```
   --header-border: rgba(209, 209, 214, 0.8) !important;
   ```

93. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 152)
   ```
   --modal-bg: rgba(250, 250, 250, 0.98) !important;
   ```

94. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 153)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.3) !important;
   ```

95. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 154)
   ```
   --modal-border: rgba(209, 209, 214, 0.8) !important;
   ```

96. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 156)
   ```
   --dropdown-bg: rgba(250, 250, 250, 0.98) !important;
   ```

97. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 157)
   ```
   --dropdown-border: rgba(209, 209, 214, 0.8) !important;
   ```

98. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 159)
   ```
   --glass-bg-light: rgba(250, 250, 250, 0.8) !important;
   ```

99. **RGBA**: `rgba(250, 250, 250, 0.9)` (라인 160)
   ```
   --glass-bg-medium: rgba(250, 250, 250, 0.9) !important;
   ```

100. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 161)
   ```
   --glass-bg-strong: rgba(250, 250, 250, 0.95) !important;
   ```

101. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 162)
   ```
   --glass-border: rgba(255, 255, 255, 0.3) !important;
   ```

102. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 163)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.4) !important;
   ```

---

### 🔥 `frontend/src/constants/css-variables.js` (JS)

**하드코딩 색상**: 68개 - **즉시 수정 필요**

1. **HEX_6**: `#764ba2` (라인 15)
   ```
   PRIMARY_DARK: '#764ba2',
   ```

2. **HEX_6**: `#764ba2` (라인 16)
   ```
   PRIMARY_GRADIENT: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

3. **HEX_6**: `#e9ecef` (라인 20)
   ```
   SECONDARY_LIGHT: '#e9ecef',
   ```

4. **HEX_6**: `#d4edda` (라인 24)
   ```
   SUCCESS_LIGHT: '#d4edda',
   ```

5. **HEX_6**: `#00a085` (라인 25)
   ```
   SUCCESS_DARK: '#00a085',
   ```

6. **HEX_6**: `#43e97b` (라인 26)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

7. **HEX_6**: `#38f9d7` (라인 26)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

8. **HEX_6**: `#f8d7da` (라인 30)
   ```
   DANGER_LIGHT: '#f8d7da',
   ```

9. **HEX_6**: `#ee5a24` (라인 31)
   ```
   DANGER_DARK: '#ee5a24',
   ```

10. **HEX_6**: `#ee5a24` (라인 32)
   ```
   DANGER_GRADIENT: 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

11. **HEX_6**: `#d1ecf1` (라인 36)
   ```
   INFO_LIGHT: '#d1ecf1',
   ```

12. **HEX_6**: `#0984e3` (라인 37)
   ```
   INFO_DARK: '#0984e3',
   ```

13. **HEX_6**: `#4facfe` (라인 38)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

14. **HEX_6**: `#00f2fe` (라인 38)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

15. **HEX_6**: `#fff3cd` (라인 42)
   ```
   WARNING_LIGHT: '#fff3cd',
   ```

16. **HEX_6**: `#f5576c` (라인 43)
   ```
   WARNING_DARK: '#f5576c',
   ```

17. **HEX_6**: `#f5576c` (라인 44)
   ```
   WARNING_GRADIENT: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

18. **HEX_6**: `#00a085` (라인 53)
   ```
   CLIENT_DARK: '#00a085',
   ```

19. **HEX_6**: `#00a085` (라인 54)
   ```
   CLIENT_GRADIENT: 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

20. **HEX_6**: `#27ae60` (라인 62)
   ```
   REVENUE: '#27ae60',
   ```

21. **HEX_6**: `#229954` (라인 63)
   ```
   REVENUE_DARK: '#229954',
   ```

22. **HEX_6**: `#27ae60` (라인 64)
   ```
   REVENUE_GRADIENT: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

23. **HEX_6**: `#229954` (라인 64)
   ```
   REVENUE_GRADIENT: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

24. **HEX_6**: `#e74c3c` (라인 67)
   ```
   EXPENSE: '#e74c3c',
   ```

25. **HEX_6**: `#c0392b` (라인 68)
   ```
   EXPENSE_DARK: '#c0392b',
   ```

26. **HEX_6**: `#e74c3c` (라인 69)
   ```
   EXPENSE_GRADIENT: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

27. **HEX_6**: `#c0392b` (라인 69)
   ```
   EXPENSE_GRADIENT: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

28. **HEX_6**: `#9b59b6` (라인 72)
   ```
   PAYMENT: '#9b59b6',
   ```

29. **HEX_6**: `#8e44ad` (라인 73)
   ```
   PAYMENT_DARK: '#8e44ad',
   ```

30. **HEX_6**: `#9b59b6` (라인 74)
   ```
   PAYMENT_GRADIENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

31. **HEX_6**: `#8e44ad` (라인 74)
   ```
   PAYMENT_GRADIENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

32. **HEX_6**: `#34495e` (라인 77)
   ```
   REPORT: '#34495e',
   ```

33. **HEX_6**: `#2c3e50` (라인 78)
   ```
   REPORT_DARK: '#2c3e50',
   ```

34. **HEX_6**: `#34495e` (라인 79)
   ```
   REPORT_GRADIENT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

35. **HEX_6**: `#2c3e50` (라인 79)
   ```
   REPORT_GRADIENT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

36. **HEX_6**: `#95a5a6` (라인 82)
   ```
   SETTINGS: '#95a5a6',
   ```

37. **HEX_6**: `#7f8c8d` (라인 83)
   ```
   SETTINGS_DARK: '#7f8c8d',
   ```

38. **HEX_6**: `#95a5a6` (라인 84)
   ```
   SETTINGS_GRADIENT: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
   ```

39. **HEX_6**: `#7f8c8d` (라인 84)
   ```
   SETTINGS_GRADIENT: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
   ```

40. **HEX_6**: `#2c3e50` (라인 88)
   ```
   BLACK: '#2c3e50',
   ```

41. **HEX_6**: `#495057` (라인 91)
   ```
   GRAY_DARK: '#495057',
   ```

42. **HEX_6**: `#e9ecef` (라인 92)
   ```
   BORDER: '#e9ecef',
   ```

43. **HEX_6**: `#2c3e50` (라인 93)
   ```
   TEXT_PRIMARY: '#2c3e50',
   ```

44. **HEX_6**: `#764ba2` (라인 321)
   ```
   PRIMARY: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

45. **HEX_6**: `#43e97b` (라인 322)
   ```
   SUCCESS: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

46. **HEX_6**: `#38f9d7` (라인 322)
   ```
   SUCCESS: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

47. **HEX_6**: `#ee5a24` (라인 323)
   ```
   DANGER: 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

48. **HEX_6**: `#4facfe` (라인 324)
   ```
   INFO: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

49. **HEX_6**: `#00f2fe` (라인 324)
   ```
   INFO: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

50. **HEX_6**: `#f5576c` (라인 325)
   ```
   WARNING: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

51. **HEX_6**: `#00a085` (라인 327)
   ```
   CLIENT: 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

52. **HEX_6**: `#27ae60` (라인 329)
   ```
   REVENUE: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

53. **HEX_6**: `#229954` (라인 329)
   ```
   REVENUE: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

54. **HEX_6**: `#e74c3c` (라인 330)
   ```
   EXPENSE: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

55. **HEX_6**: `#c0392b` (라인 330)
   ```
   EXPENSE: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

56. **HEX_6**: `#9b59b6` (라인 331)
   ```
   PAYMENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

57. **HEX_6**: `#8e44ad` (라인 331)
   ```
   PAYMENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

58. **HEX_6**: `#34495e` (라인 332)
   ```
   REPORT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

59. **HEX_6**: `#2c3e50` (라인 332)
   ```
   REPORT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

60. **HEX_6**: `#95a5a6` (라인 333)
   ```
   SETTINGS: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
   ```

61. **HEX_6**: `#7f8c8d` (라인 333)
   ```
   SETTINGS: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
   ```

62. **HEX_6**: `#FEE500` (라인 462)
   ```
   COLOR: '#FEE500',
   ```

63. **HEX_6**: `#03C75A` (라인 467)
   ```
   COLOR: '#03C75A',
   ```

64. **HEX_6**: `#6b7280` (라인 723)
   ```
   return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
   ```

65. **HEX_6**: `#6b7280` (라인 732)
   ```
   return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
   ```

66. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 145)
   ```
   LG: '0 4px 20px rgba(0, 0, 0, 0.08)',
   ```

67. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 146)
   ```
   XL: '0 8px 30px rgba(0, 0, 0, 0.12)',
   ```

68. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 148)
   ```
   MODAL: '0 10px 30px rgba(0, 0, 0, 0.2)'
   ```

---

### 🔥 `frontend/src/styles/themes/dark-theme.css` (CSS)

**하드코딩 색상**: 57개 - **즉시 수정 필요**

1. **HEX_6**: `#60a5fa` (라인 4)
   ```
   --color-primary: #60a5fa;
   ```

2. **HEX_6**: `#2563eb` (라인 6)
   ```
   --color-primary-active: #2563eb;
   ```

3. **HEX_6**: `#1e3a8a` (라인 7)
   ```
   --color-primary-light: #1e3a8a;
   ```

4. **HEX_6**: `#1e40af` (라인 8)
   ```
   --color-primary-dark: #1e40af;
   ```

5. **HEX_6**: `#9ca3af` (라인 10)
   ```
   --color-secondary: #9ca3af;
   ```

6. **HEX_6**: `#d1d5db` (라인 11)
   ```
   --color-secondary-hover: #d1d5db;
   ```

7. **HEX_6**: `#f3f4f6` (라인 12)
   ```
   --color-secondary-active: #f3f4f6;
   ```

8. **HEX_6**: `#374151` (라인 13)
   ```
   --color-secondary-light: #374151;
   ```

9. **HEX_6**: `#f9fafb` (라인 14)
   ```
   --color-secondary-dark: #f9fafb;
   ```

10. **HEX_6**: `#0f172a` (라인 17)
   ```
   --color-bg-primary: #0f172a;
   ```

11. **HEX_6**: `#1e293b` (라인 18)
   ```
   --color-bg-secondary: #1e293b;
   ```

12. **HEX_6**: `#334155` (라인 19)
   ```
   --color-bg-tertiary: #334155;
   ```

13. **HEX_6**: `#475569` (라인 20)
   ```
   --color-bg-accent: #475569;
   ```

14. **HEX_6**: `#f8fafc` (라인 25)
   ```
   --color-text-primary: #f8fafc;
   ```

15. **HEX_6**: `#e2e8f0` (라인 26)
   ```
   --color-text-secondary: #e2e8f0;
   ```

16. **HEX_6**: `#cbd5e1` (라인 27)
   ```
   --color-text-tertiary: #cbd5e1;
   ```

17. **HEX_6**: `#94a3b8` (라인 28)
   ```
   --color-text-muted: #94a3b8;
   ```

18. **HEX_6**: `#0f172a` (라인 29)
   ```
   --color-text-inverse: #0f172a;
   ```

19. **HEX_6**: `#334155` (라인 32)
   ```
   --color-border-primary: #334155;
   ```

20. **HEX_6**: `#475569` (라인 33)
   ```
   --color-border-secondary: #475569;
   ```

21. **HEX_6**: `#64748b` (라인 34)
   ```
   --color-border-accent: #64748b;
   ```

22. **HEX_6**: `#60a5fa` (라인 35)
   ```
   --color-border-focus: #60a5fa;
   ```

23. **HEX_6**: `#34d399` (라인 38)
   ```
   --color-success: #34d399;
   ```

24. **HEX_6**: `#064e3b` (라인 39)
   ```
   --color-success-light: #064e3b;
   ```

25. **HEX_6**: `#fbbf24` (라인 42)
   ```
   --color-warning: #fbbf24;
   ```

26. **HEX_6**: `#78350f` (라인 43)
   ```
   --color-warning-light: #78350f;
   ```

27. **HEX_6**: `#f87171` (라인 46)
   ```
   --color-error: #f87171;
   ```

28. **HEX_6**: `#7f1d1d` (라인 47)
   ```
   --color-error-light: #7f1d1d;
   ```

29. **HEX_6**: `#22d3ee` (라인 50)
   ```
   --color-info: #22d3ee;
   ```

30. **HEX_6**: `#083344` (라인 51)
   ```
   --color-info-light: #083344;
   ```

31. **HEX_6**: `#06b6d4` (라인 52)
   ```
   --color-info-dark: #06b6d4;
   ```

32. **HEX_6**: `#f8fafc` (라인 66)
   ```
   --ios-text-primary: #f8fafc;
   ```

33. **HEX_6**: `#e2e8f0` (라인 67)
   ```
   --ios-text-secondary: #e2e8f0;
   ```

34. **HEX_6**: `#f8fafc` (라인 72)
   ```
   --header-text: #f8fafc;
   ```

35. **HEX_6**: `#cbd5e1` (라인 73)
   ```
   --header-text-muted: #cbd5e1;
   ```

36. **RGBA**: `rgba(15, 23, 42, 0.8)` (라인 21)
   ```
   --color-bg-glass: rgba(15, 23, 42, 0.8);
   ```

37. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 22)
   ```
   --color-bg-glass-strong: rgba(15, 23, 42, 0.95);
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 55)
   ```
   --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
   ```

39. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
   ```

40. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
   ```

41. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
   ```

42. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
   ```

43. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
   ```

44. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
   ```

45. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
   ```

46. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
   ```

47. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 63)
   ```
   --ios-bg-primary: rgba(15, 23, 42, 0.95);
   ```

48. **RGBA**: `rgba(30, 41, 59, 0.95)` (라인 64)
   ```
   --ios-bg-secondary: rgba(30, 41, 59, 0.95);
   ```

49. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 65)
   ```
   --ios-border: rgba(51, 65, 85, 0.8);
   ```

50. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 70)
   ```
   --header-bg: rgba(15, 23, 42, 0.95);
   ```

51. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 71)
   ```
   --header-border: rgba(51, 65, 85, 0.8);
   ```

52. **RGBA**: `rgba(15, 23, 42, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(15, 23, 42, 0.98);
   ```

53. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 77)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.6);
   ```

54. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 78)
   ```
   --modal-border: rgba(51, 65, 85, 0.8);
   ```

55. **RGBA**: `rgba(15, 23, 42, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(15, 23, 42, 0.98);
   ```

56. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 83)
   ```
   --dropdown-border: rgba(51, 65, 85, 0.8);
   ```

57. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 84)
   ```
   --dropdown-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
   ```

---

### 🔥 `frontend/src/tokens/colors.json` (JSON)

**하드코딩 색상**: 54개 - **즉시 수정 필요**

1. **HEX_6**: `#F5F5DC` (라인 7)
   ```
   "value": "#F5F5DC",
   ```

2. **HEX_6**: `#FDF5E6` (라인 11)
   ```
   "value": "#FDF5E6",
   ```

3. **HEX_6**: `#8B4513` (라인 15)
   ```
   "value": "#8B4513",
   ```

4. **HEX_6**: `#808000` (라인 19)
   ```
   "value": "#808000",
   ```

5. **HEX_6**: `#98FB98` (라인 23)
   ```
   "value": "#98FB98",
   ```

6. **HEX_6**: `#B6E5D8` (라인 27)
   ```
   "value": "#B6E5D8",
   ```

7. **HEX_6**: `#007bff` (라인 32)
   ```
   "value": "#007bff",
   ```

8. **HEX_6**: `#66b3ff` (라인 33)
   ```
   "light": "#66b3ff",
   ```

9. **HEX_6**: `#0056b3` (라인 34)
   ```
   "dark": "#0056b3",
   ```

10. **HEX_6**: `#6c757d` (라인 38)
   ```
   "value": "#6c757d",
   ```

11. **HEX_6**: `#9ca3af` (라인 39)
   ```
   "light": "#9ca3af",
   ```

12. **HEX_6**: `#495057` (라인 40)
   ```
   "dark": "#495057",
   ```

13. **HEX_6**: `#28a745` (라인 45)
   ```
   "value": "#28a745",
   ```

14. **HEX_6**: `#6cbb6d` (라인 46)
   ```
   "light": "#6cbb6d",
   ```

15. **HEX_6**: `#1e7e34` (라인 47)
   ```
   "dark": "#1e7e34",
   ```

16. **HEX_6**: `#dc3545` (라인 51)
   ```
   "value": "#dc3545",
   ```

17. **HEX_6**: `#f56565` (라인 52)
   ```
   "light": "#f56565",
   ```

18. **HEX_6**: `#c82333` (라인 53)
   ```
   "dark": "#c82333",
   ```

19. **HEX_6**: `#ffc107` (라인 57)
   ```
   "value": "#ffc107",
   ```

20. **HEX_6**: `#ffd43b` (라인 58)
   ```
   "light": "#ffd43b",
   ```

21. **HEX_6**: `#e0a800` (라인 59)
   ```
   "dark": "#e0a800",
   ```

22. **HEX_6**: `#17a2b8` (라인 63)
   ```
   "value": "#17a2b8",
   ```

23. **HEX_6**: `#4dd0e1` (라인 64)
   ```
   "light": "#4dd0e1",
   ```

24. **HEX_6**: `#138496` (라인 65)
   ```
   "dark": "#138496",
   ```

25. **HEX_6**: `#fd7e14` (라인 69)
   ```
   "value": "#fd7e14",
   ```

26. **HEX_6**: `#ffa94d` (라인 70)
   ```
   "light": "#ffa94d",
   ```

27. **HEX_6**: `#e55a00` (라인 71)
   ```
   "dark": "#e55a00",
   ```

28. **HEX_6**: `#FFB6C1` (라인 79)
   ```
   "primary": "#FFB6C1",
   ```

29. **HEX_6**: `#FFC0CB` (라인 80)
   ```
   "primaryLight": "#FFC0CB",
   ```

30. **HEX_6**: `#FF69B4` (라인 81)
   ```
   "primaryDark": "#FF69B4",
   ```

31. **HEX_6**: `#FFE4E1` (라인 82)
   ```
   "secondary": "#FFE4E1",
   ```

32. **HEX_6**: `#FF1493` (라인 83)
   ```
   "accent": "#FF1493",
   ```

33. **HEX_6**: `#FFF0F5` (라인 84)
   ```
   "background": "#FFF0F5",
   ```

34. **HEX_6**: `#8B008B` (라인 85)
   ```
   "text": "#8B008B"
   ```

35. **HEX_6**: `#98FB98` (라인 90)
   ```
   "primary": "#98FB98",
   ```

36. **HEX_6**: `#90EE90` (라인 91)
   ```
   "primaryLight": "#90EE90",
   ```

37. **HEX_6**: `#32CD32` (라인 92)
   ```
   "primaryDark": "#32CD32",
   ```

38. **HEX_6**: `#F0FFF0` (라인 93)
   ```
   "secondary": "#F0FFF0",
   ```

39. **HEX_6**: `#00FF7F` (라인 94)
   ```
   "accent": "#00FF7F",
   ```

40. **HEX_6**: `#F5FFFA` (라인 95)
   ```
   "background": "#F5FFFA",
   ```

41. **HEX_6**: `#006400` (라인 96)
   ```
   "text": "#006400"
   ```

42. **HEX_6**: `#87CEEB` (라인 101)
   ```
   "primary": "#87CEEB",
   ```

43. **HEX_6**: `#B0E0E6` (라인 102)
   ```
   "primaryLight": "#B0E0E6",
   ```

44. **HEX_6**: `#4682B4` (라인 103)
   ```
   "primaryDark": "#4682B4",
   ```

45. **HEX_6**: `#F0F8FF` (라인 104)
   ```
   "secondary": "#F0F8FF",
   ```

46. **HEX_6**: `#1E90FF` (라인 105)
   ```
   "accent": "#1E90FF",
   ```

47. **HEX_6**: `#F8F9FA` (라인 106)
   ```
   "background": "#F8F9FA",
   ```

48. **HEX_6**: `#191970` (라인 107)
   ```
   "text": "#191970"
   ```

49. **HEX_6**: `#212529` (라인 112)
   ```
   "dark": "#212529",
   ```

50. **HEX_6**: `#2F2F2F` (라인 113)
   ```
   "darkGray": "#2F2F2F",
   ```

51. **HEX_6**: `#6B6B6B` (라인 114)
   ```
   "mediumGray": "#6B6B6B",
   ```

52. **HEX_6**: `#FFFEF7` (라인 115)
   ```
   "lightCream": "#FFFEF7"
   ```

53. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 118)
   ```
   "background": "rgba(255, 255, 255, 0.2)",
   ```

54. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 119)
   ```
   "border": "rgba(255, 255, 255, 0.2)",
   ```

---

### 🔥 `frontend/src/styles/themes/light-theme.css` (CSS)

**하드코딩 색상**: 51개 - **즉시 수정 필요**

1. **HEX_6**: `#2563eb` (라인 5)
   ```
   --color-primary-hover: #2563eb;
   ```

2. **HEX_6**: `#1d4ed8` (라인 6)
   ```
   --color-primary-active: #1d4ed8;
   ```

3. **HEX_6**: `#dbeafe` (라인 7)
   ```
   --color-primary-light: #dbeafe;
   ```

4. **HEX_6**: `#1e40af` (라인 8)
   ```
   --color-primary-dark: #1e40af;
   ```

5. **HEX_6**: `#6b7280` (라인 10)
   ```
   --color-secondary: #6b7280;
   ```

6. **HEX_6**: `#4b5563` (라인 11)
   ```
   --color-secondary-hover: #4b5563;
   ```

7. **HEX_6**: `#374151` (라인 12)
   ```
   --color-secondary-active: #374151;
   ```

8. **HEX_6**: `#f3f4f6` (라인 13)
   ```
   --color-secondary-light: #f3f4f6;
   ```

9. **HEX_6**: `#111827` (라인 14)
   ```
   --color-secondary-dark: #111827;
   ```

10. **HEX_6**: `#f8fafc` (라인 18)
   ```
   --color-bg-secondary: #f8fafc;
   ```

11. **HEX_6**: `#f1f5f9` (라인 19)
   ```
   --color-bg-tertiary: #f1f5f9;
   ```

12. **HEX_6**: `#e2e8f0` (라인 20)
   ```
   --color-bg-accent: #e2e8f0;
   ```

13. **HEX_6**: `#0f172a` (라인 25)
   ```
   --color-text-primary: #0f172a;
   ```

14. **HEX_6**: `#475569` (라인 26)
   ```
   --color-text-secondary: #475569;
   ```

15. **HEX_6**: `#64748b` (라인 27)
   ```
   --color-text-tertiary: #64748b;
   ```

16. **HEX_6**: `#94a3b8` (라인 28)
   ```
   --color-text-muted: #94a3b8;
   ```

17. **HEX_6**: `#e2e8f0` (라인 32)
   ```
   --color-border-primary: #e2e8f0;
   ```

18. **HEX_6**: `#cbd5e1` (라인 33)
   ```
   --color-border-secondary: #cbd5e1;
   ```

19. **HEX_6**: `#94a3b8` (라인 34)
   ```
   --color-border-accent: #94a3b8;
   ```

20. **HEX_6**: `#d1fae5` (라인 39)
   ```
   --color-success-light: #d1fae5;
   ```

21. **HEX_6**: `#059669` (라인 40)
   ```
   --color-success-dark: #059669;
   ```

22. **HEX_6**: `#fef3c7` (라인 43)
   ```
   --color-warning-light: #fef3c7;
   ```

23. **HEX_6**: `#d97706` (라인 44)
   ```
   --color-warning-dark: #d97706;
   ```

24. **HEX_6**: `#fee2e2` (라인 47)
   ```
   --color-error-light: #fee2e2;
   ```

25. **HEX_6**: `#dc2626` (라인 48)
   ```
   --color-error-dark: #dc2626;
   ```

26. **HEX_6**: `#06b6d4` (라인 50)
   ```
   --color-info: #06b6d4;
   ```

27. **HEX_6**: `#cffafe` (라인 51)
   ```
   --color-info-light: #cffafe;
   ```

28. **HEX_6**: `#0891b2` (라인 52)
   ```
   --color-info-dark: #0891b2;
   ```

29. **HEX_6**: `#1e293b` (라인 66)
   ```
   --ios-text-primary: #1e293b;
   ```

30. **HEX_6**: `#475569` (라인 67)
   ```
   --ios-text-secondary: #475569;
   ```

31. **HEX_6**: `#1e293b` (라인 72)
   ```
   --header-text: #1e293b;
   ```

32. **HEX_6**: `#64748b` (라인 73)
   ```
   --header-text-muted: #64748b;
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 21)
   ```
   --color-bg-glass: rgba(255, 255, 255, 0.8);
   ```

34. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 22)
   ```
   --color-bg-glass-strong: rgba(255, 255, 255, 0.95);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 55)
   ```
   --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

36. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

37. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

39. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

40. **RGBA**: `rgba(31, 38, 135, 0.6)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.6);
   ```

41. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 63)
   ```
   --ios-bg-primary: rgba(255, 255, 255, 0.95);
   ```

42. **RGBA**: `rgba(248, 250, 252, 0.95)` (라인 64)
   ```
   --ios-bg-secondary: rgba(248, 250, 252, 0.95);
   ```

43. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 65)
   ```
   --ios-border: rgba(226, 232, 240, 0.8);
   ```

44. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 70)
   ```
   --header-bg: rgba(255, 255, 255, 0.95);
   ```

45. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 71)
   ```
   --header-border: rgba(226, 232, 240, 0.8);
   ```

46. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(255, 255, 255, 0.98);
   ```

47. **RGBA**: `rgba(15, 23, 42, 0.3)` (라인 77)
   ```
   --modal-backdrop: rgba(15, 23, 42, 0.3);
   ```

48. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 78)
   ```
   --modal-border: rgba(226, 232, 240, 0.8);
   ```

49. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 79)
   ```
   --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

50. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(255, 255, 255, 0.98);
   ```

51. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 83)
   ```
   --dropdown-border: rgba(226, 232, 240, 0.8);
   ```

---

### 🔥 `frontend/src/styles/themes/high-contrast-theme.css` (CSS)

**하드코딩 색상**: 44개 - **즉시 수정 필요**

1. **HEX_6**: `#0000ff` (라인 4)
   ```
   --color-primary: #0000ff;
   ```

2. **HEX_6**: `#0000cc` (라인 5)
   ```
   --color-primary-hover: #0000cc;
   ```

3. **HEX_6**: `#000099` (라인 6)
   ```
   --color-primary-active: #000099;
   ```

4. **HEX_6**: `#e6e6ff` (라인 7)
   ```
   --color-primary-light: #e6e6ff;
   ```

5. **HEX_6**: `#000066` (라인 8)
   ```
   --color-primary-dark: #000066;
   ```

6. **HEX_6**: `#f0f0f0` (라인 13)
   ```
   --color-secondary-light: #f0f0f0;
   ```

7. **HEX_6**: `#f8f8f8` (라인 18)
   ```
   --color-bg-secondary: #f8f8f8;
   ```

8. **HEX_6**: `#f0f0f0` (라인 19)
   ```
   --color-bg-tertiary: #f0f0f0;
   ```

9. **HEX_6**: `#e8e8e8` (라인 20)
   ```
   --color-bg-accent: #e8e8e8;
   ```

10. **HEX_6**: `#0000ff` (라인 35)
   ```
   --color-border-focus: #0000ff;
   ```

11. **HEX_6**: `#006600` (라인 38)
   ```
   --color-success: #006600;
   ```

12. **HEX_6**: `#e6ffe6` (라인 39)
   ```
   --color-success-light: #e6ffe6;
   ```

13. **HEX_6**: `#004400` (라인 40)
   ```
   --color-success-dark: #004400;
   ```

14. **HEX_6**: `#cc6600` (라인 42)
   ```
   --color-warning: #cc6600;
   ```

15. **HEX_6**: `#fff2e6` (라인 43)
   ```
   --color-warning-light: #fff2e6;
   ```

16. **HEX_6**: `#994400` (라인 44)
   ```
   --color-warning-dark: #994400;
   ```

17. **HEX_6**: `#cc0000` (라인 46)
   ```
   --color-error: #cc0000;
   ```

18. **HEX_6**: `#ffe6e6` (라인 47)
   ```
   --color-error-light: #ffe6e6;
   ```

19. **HEX_6**: `#990000` (라인 48)
   ```
   --color-error-dark: #990000;
   ```

20. **HEX_6**: `#0066cc` (라인 50)
   ```
   --color-info: #0066cc;
   ```

21. **HEX_6**: `#e6f2ff` (라인 51)
   ```
   --color-info-light: #e6f2ff;
   ```

22. **HEX_6**: `#004499` (라인 52)
   ```
   --color-info-dark: #004499;
   ```

23. **HEX_6**: `#0000ff` (라인 89)
   ```
   --focus-ring-color: #0000ff;
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 21)
   ```
   --color-bg-glass: rgba(255, 255, 255, 0.95);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 22)
   ```
   --color-bg-glass-strong: rgba(255, 255, 255, 0.98);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 55)
   ```
   --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 56)
   ```
   --shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 56)
   ```
   --shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 57)
   ```
   --shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.4), 0 4px 8px 0 rgba(0, 0, 0, 0.3);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 57)
   ```
   --shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.4), 0 4px 8px 0 rgba(0, 0, 0, 0.3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 58)
   ```
   --shadow-xl: 0 12px 24px 0 var(--mg-overlay), 0 6px 12px 0 rgba(0, 0, 0, 0.4);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
   ```

34. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 63)
   ```
   --ios-bg-primary: rgba(255, 255, 255, 0.98);
   ```

35. **RGBA**: `rgba(248, 248, 248, 0.98)` (라인 64)
   ```
   --ios-bg-secondary: rgba(248, 248, 248, 0.98);
   ```

36. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 65)
   ```
   --ios-border: rgba(0, 0, 0, 0.9);
   ```

37. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 70)
   ```
   --header-bg: rgba(255, 255, 255, 0.98);
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 71)
   ```
   --header-border: rgba(0, 0, 0, 0.9);
   ```

39. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(255, 255, 255, 0.98);
   ```

40. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 77)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.8);
   ```

41. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 78)
   ```
   --modal-border: rgba(0, 0, 0, 0.9);
   ```

42. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 79)
   ```
   --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
   ```

43. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(255, 255, 255, 0.98);
   ```

44. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 83)
   ```
   --dropdown-border: rgba(0, 0, 0, 0.9);
   ```

---

### 🔥 `frontend/src/components/admin/BrandingManagement.css` (CSS)

**하드코딩 색상**: 40개 - **즉시 수정 필요**

1. **HEX_6**: `#1a202c` (라인 27)
   ```
   color: var(--color-text-primary, #1a202c);
   ```

2. **HEX_6**: `#718096` (라인 33)
   ```
   color: var(--color-text-secondary, #718096);
   ```

3. **HEX_6**: `#f7fafc` (라인 47)
   ```
   background: var(--color-background-secondary, #f7fafc);
   ```

4. **HEX_6**: `#e2e8f0` (라인 49)
   ```
   border: 1px solid var(--color-border-light, #e2e8f0);
   ```

5. **HEX_6**: `#1a202c` (라인 58)
   ```
   color: var(--color-text-primary, #1a202c);
   ```

6. **HEX_6**: `#cbd5e0` (라인 72)
   ```
   border: 2px dashed var(--color-border-medium, #cbd5e0);
   ```

7. **HEX_6**: `#718096` (라인 90)
   ```
   color: var(--color-text-secondary, #718096);
   ```

8. **HEX_6**: `#a0aec0` (라인 94)
   ```
   color: var(--color-text-tertiary, #a0aec0);
   ```

9. **HEX_6**: `#a0aec0` (라인 105)
   ```
   color: var(--color-text-tertiary, #a0aec0);
   ```

10. **HEX_6**: `#c82333` (라인 143)
   ```
   background: var(--color-danger-dark, #c82333);
   ```

11. **HEX_6**: `#1a202c` (라인 163)
   ```
   color: var(--color-text-primary, #1a202c);
   ```

12. **HEX_6**: `#cbd5e0` (라인 168)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

13. **HEX_6**: `#cbd5e0` (라인 199)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

14. **HEX_6**: `#a0aec0` (라인 217)
   ```
   color: var(--color-text-tertiary, #a0aec0);
   ```

15. **HEX_6**: `#e2e8f0` (라인 241)
   ```
   border-top: 1px solid var(--color-border-light, #e2e8f0);
   ```

16. **HEX_6**: `#138496` (라인 270)
   ```
   background: var(--color-info-dark, #138496);
   ```

17. **HEX_6**: `#5a6268` (라인 279)
   ```
   background: var(--color-secondary-dark, #5a6268);
   ```

18. **HEX_6**: `#218838` (라인 288)
   ```
   background: var(--color-success-dark, #218838);
   ```

19. **HEX_6**: `#718096` (라인 310)
   ```
   color: var(--color-text-secondary, #718096);
   ```

20. **HEX_6**: `#f7fafc` (라인 315)
   ```
   background: var(--color-background-secondary, #f7fafc);
   ```

21. **HEX_6**: `#1a202c` (라인 348)
   ```
   color: var(--color-text-primary, #1a202c);
   ```

22. **HEX_6**: `#718096` (라인 353)
   ```
   color: var(--color-text-secondary, #718096);
   ```

23. **HEX_6**: `#e2e8f0` (라인 373)
   ```
   border: 1px solid var(--color-border-light, #e2e8f0);
   ```

24. **HEX_6**: `#5a6268` (라인 394)
   ```
   background: var(--color-secondary-dark, #5a6268);
   ```

25. **HEX_6**: `#cbd5e0` (라인 414)
   ```
   border: 2px solid var(--color-border-medium, #cbd5e0);
   ```

26. **HEX_6**: `#cbd5e0` (라인 428)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

27. **HEX_6**: `#cbd5e0` (라인 448)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

28. **HEX_6**: `#f7fafc` (라인 461)
   ```
   background: var(--color-background-secondary, #f7fafc);
   ```

29. **HEX_6**: `#cbd5e0` (라인 472)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

30. **HEX_6**: `#1a202c` (라인 492)
   ```
   color: var(--color-text-primary, #1a202c);
   ```

31. **HEX_6**: `#1a202c` (라인 514)
   ```
   border-color: var(--color-text-primary, #1a202c);
   ```

32. **HEX_6**: `#cbd5e0` (라인 543)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

33. **HEX_6**: `#cbd5e0` (라인 561)
   ```
   border: 1px solid var(--color-border-medium, #cbd5e0);
   ```

34. **HEX_6**: `#e2e8f0` (라인 577)
   ```
   border-top: 1px solid var(--color-border-light, #e2e8f0);
   ```

35. **HEX_6**: `#5a6268` (라인 593)
   ```
   background: var(--color-secondary-dark, #5a6268);
   ```

36. **RGBA**: `rgba(0, 123, 255, 0.05)` (라인 85)
   ```
   background: var(--color-primary-light, rgba(0, 123, 255, 0.05));
   ```

37. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 178)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

38. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 186)
   ```
   box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
   ```

39. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 438)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

40. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 570)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

---

### 🔥 `frontend/src/utils/cssThemeHelper.js` (JS)

**하드코딩 색상**: 38개 - **즉시 수정 필요**

1. **HEX_6**: `#764ba2` (라인 199)
   ```
   PRIMARY_DARK: colors.PRIMARY_DARK || '#764ba2',
   ```

2. **HEX_6**: `#764ba2` (라인 200)
   ```
   PRIMARY_GRADIENT: colors.PRIMARY_GRADIENT || 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

3. **HEX_6**: `#e9ecef` (라인 204)
   ```
   SECONDARY_LIGHT: colors.SECONDARY_LIGHT || '#e9ecef',
   ```

4. **HEX_6**: `#d4edda` (라인 208)
   ```
   SUCCESS_LIGHT: colors.SUCCESS_LIGHT || '#d4edda',
   ```

5. **HEX_6**: `#00a085` (라인 209)
   ```
   SUCCESS_DARK: colors.SUCCESS_DARK || '#00a085',
   ```

6. **HEX_6**: `#43e97b` (라인 210)
   ```
   SUCCESS_GRADIENT: colors.SUCCESS_GRADIENT || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

7. **HEX_6**: `#38f9d7` (라인 210)
   ```
   SUCCESS_GRADIENT: colors.SUCCESS_GRADIENT || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

8. **HEX_6**: `#f8d7da` (라인 213)
   ```
   DANGER_LIGHT: colors.DANGER_LIGHT || '#f8d7da',
   ```

9. **HEX_6**: `#ee5a24` (라인 214)
   ```
   DANGER_DARK: colors.DANGER_DARK || '#ee5a24',
   ```

10. **HEX_6**: `#ee5a24` (라인 215)
   ```
   DANGER_GRADIENT: colors.DANGER_GRADIENT || 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

11. **HEX_6**: `#d1ecf1` (라인 218)
   ```
   INFO_LIGHT: colors.INFO_LIGHT || '#d1ecf1',
   ```

12. **HEX_6**: `#0984e3` (라인 219)
   ```
   INFO_DARK: colors.INFO_DARK || '#0984e3',
   ```

13. **HEX_6**: `#4facfe` (라인 220)
   ```
   INFO_GRADIENT: colors.INFO_GRADIENT || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

14. **HEX_6**: `#00f2fe` (라인 220)
   ```
   INFO_GRADIENT: colors.INFO_GRADIENT || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

15. **HEX_6**: `#fff3cd` (라인 223)
   ```
   WARNING_LIGHT: colors.WARNING_LIGHT || '#fff3cd',
   ```

16. **HEX_6**: `#f5576c` (라인 224)
   ```
   WARNING_DARK: colors.WARNING_DARK || '#f5576c',
   ```

17. **HEX_6**: `#f5576c` (라인 225)
   ```
   WARNING_GRADIENT: colors.WARNING_GRADIENT || 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

18. **HEX_6**: `#00a085` (라인 233)
   ```
   CLIENT_DARK: colors.CLIENT_DARK || '#00a085',
   ```

19. **HEX_6**: `#00a085` (라인 234)
   ```
   CLIENT_GRADIENT: colors.CLIENT_GRADIENT || 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

20. **HEX_6**: `#764ba2` (라인 252)
   ```
   PRIMARY_DARK: '#764ba2',
   ```

21. **HEX_6**: `#764ba2` (라인 253)
   ```
   PRIMARY_GRADIENT: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

22. **HEX_6**: `#e9ecef` (라인 255)
   ```
   SECONDARY_LIGHT: '#e9ecef',
   ```

23. **HEX_6**: `#d4edda` (라인 257)
   ```
   SUCCESS_LIGHT: '#d4edda',
   ```

24. **HEX_6**: `#00a085` (라인 258)
   ```
   SUCCESS_DARK: '#00a085',
   ```

25. **HEX_6**: `#43e97b` (라인 259)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

26. **HEX_6**: `#38f9d7` (라인 259)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

27. **HEX_6**: `#f8d7da` (라인 261)
   ```
   DANGER_LIGHT: '#f8d7da',
   ```

28. **HEX_6**: `#ee5a24` (라인 262)
   ```
   DANGER_DARK: '#ee5a24',
   ```

29. **HEX_6**: `#ee5a24` (라인 263)
   ```
   DANGER_GRADIENT: 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

30. **HEX_6**: `#d1ecf1` (라인 265)
   ```
   INFO_LIGHT: '#d1ecf1',
   ```

31. **HEX_6**: `#0984e3` (라인 266)
   ```
   INFO_DARK: '#0984e3',
   ```

32. **HEX_6**: `#4facfe` (라인 267)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

33. **HEX_6**: `#00f2fe` (라인 267)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

34. **HEX_6**: `#fff3cd` (라인 269)
   ```
   WARNING_LIGHT: '#fff3cd',
   ```

35. **HEX_6**: `#f5576c` (라인 270)
   ```
   WARNING_DARK: '#f5576c',
   ```

36. **HEX_6**: `#f5576c` (라인 271)
   ```
   WARNING_GRADIENT: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

37. **HEX_6**: `#00a085` (라인 276)
   ```
   CLIENT_DARK: '#00a085',
   ```

38. **HEX_6**: `#00a085` (라인 277)
   ```
   CLIENT_GRADIENT: 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

---

### 🔥 `frontend/src/components/admin/BrandingManagement.js` (JS)

**하드코딩 색상**: 38개 - **즉시 수정 필요**

1. **HEX_6**: `#6f42c1` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

2. **HEX_6**: `#e83e8c` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

3. **HEX_6**: `#fd7e14` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

4. **HEX_6**: `#20c997` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

5. **HEX_6**: `#6610f2` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

6. **HEX_6**: `#e21e80` (라인 535)
   ```
   '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#e21e80',
   ```

7. **HEX_6**: `#764ba2` (라인 538)
   ```
   'var(--mg-primary-500)', '#764ba2', 'var(--mg-warning-500)', '#f5576c', '#4facfe', '#00f2fe',
   ```

8. **HEX_6**: `#f5576c` (라인 538)
   ```
   'var(--mg-primary-500)', '#764ba2', 'var(--mg-warning-500)', '#f5576c', '#4facfe', '#00f2fe',
   ```

9. **HEX_6**: `#4facfe` (라인 538)
   ```
   'var(--mg-primary-500)', '#764ba2', 'var(--mg-warning-500)', '#f5576c', '#4facfe', '#00f2fe',
   ```

10. **HEX_6**: `#00f2fe` (라인 538)
   ```
   'var(--mg-primary-500)', '#764ba2', 'var(--mg-warning-500)', '#f5576c', '#4facfe', '#00f2fe',
   ```

11. **HEX_6**: `#43e97b` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

12. **HEX_6**: `#38f9d7` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

13. **HEX_6**: `#ffecd2` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

14. **HEX_6**: `#fcb69f` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

15. **HEX_6**: `#a8edea` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

16. **HEX_6**: `#fed6e3` (라인 539)
   ```
   '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
   ```

17. **HEX_6**: `#2c3e50` (라인 542)
   ```
   '#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1', 'var(--mg-finance-primary)',
   ```

18. **HEX_6**: `#34495e` (라인 542)
   ```
   '#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1', 'var(--mg-finance-primary)',
   ```

19. **HEX_6**: `#95a5a6` (라인 542)
   ```
   '#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1', 'var(--mg-finance-primary)',
   ```

20. **HEX_6**: `#bdc3c7` (라인 542)
   ```
   '#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1', 'var(--mg-finance-primary)',
   ```

21. **HEX_6**: `#ecf0f1` (라인 542)
   ```
   '#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1', 'var(--mg-finance-primary)',
   ```

22. **HEX_6**: `#d35400` (라인 543)
   ```
   'var(--mg-finance-dark)', '#d35400', '#c0392b', '#8e44ad', '#9b59b6', '#3498db',
   ```

23. **HEX_6**: `#c0392b` (라인 543)
   ```
   'var(--mg-finance-dark)', '#d35400', '#c0392b', '#8e44ad', '#9b59b6', '#3498db',
   ```

24. **HEX_6**: `#8e44ad` (라인 543)
   ```
   'var(--mg-finance-dark)', '#d35400', '#c0392b', '#8e44ad', '#9b59b6', '#3498db',
   ```

25. **HEX_6**: `#9b59b6` (라인 543)
   ```
   'var(--mg-finance-dark)', '#d35400', '#c0392b', '#8e44ad', '#9b59b6', '#3498db',
   ```

26. **HEX_6**: `#3498db` (라인 543)
   ```
   'var(--mg-finance-dark)', '#d35400', '#c0392b', '#8e44ad', '#9b59b6', '#3498db',
   ```

27. **HEX_6**: `#ffb3ba` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

28. **HEX_6**: `#ffdfba` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

29. **HEX_6**: `#ffffba` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

30. **HEX_6**: `#baffc9` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

31. **HEX_6**: `#bae1ff` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

32. **HEX_6**: `#d4baff` (라인 546)
   ```
   '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#d4baff',
   ```

33. **HEX_6**: `#ffb3ff` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

34. **HEX_6**: `#ffc9de` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

35. **HEX_6**: `#c9ffba` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

36. **HEX_6**: `#baffff` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

37. **HEX_6**: `#e6baff` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

38. **HEX_6**: `#ffbadc` (라인 547)
   ```
   '#ffb3ff', '#ffc9de', '#c9ffba', '#baffff', '#e6baff', '#ffbadc'
   ```

---

### 🔥 `frontend/src/styles/01-settings/_theme-variables.css` (CSS)

**하드코딩 색상**: 35개 - **즉시 수정 필요**

1. **HEX_6**: `#0056b3` (라인 19)
   ```
   --mood-accent-dark: #0056b3;
   ```

2. **HEX_6**: `#1d1d1f` (라인 25)
   ```
   --mood-text-primary: #1d1d1f;
   ```

3. **HEX_6**: `#86868b` (라인 26)
   ```
   --mood-text-secondary: #86868b;
   ```

4. **HEX_6**: `#ff6b35` (라인 32)
   ```
   --mood-accent: #ff6b35;
   ```

5. **HEX_6**: `#e55a2b` (라인 34)
   ```
   --mood-accent-dark: #e55a2b;
   ```

6. **HEX_6**: `#2d1810` (라인 40)
   ```
   --mood-text-primary: #2d1810;
   ```

7. **HEX_6**: `#1a3d1a` (라인 55)
   ```
   --mood-text-primary: #1a3d1a;
   ```

8. **HEX_6**: `#2d5a2d` (라인 56)
   ```
   --mood-text-secondary: #2d5a2d;
   ```

9. **HEX_6**: `#4a47a3` (라인 64)
   ```
   --mood-accent-dark: #4a47a3;
   ```

10. **HEX_6**: `#2d2d3a` (라인 70)
   ```
   --mood-text-primary: #2d2d3a;
   ```

11. **HEX_6**: `#6b6b7a` (라인 71)
   ```
   --mood-text-secondary: #6b6b7a;
   ```

12. **HEX_6**: `#ff2d92` (라인 77)
   ```
   --mood-accent: #ff2d92;
   ```

13. **HEX_6**: `#e0267d` (라인 79)
   ```
   --mood-accent-dark: #e0267d;
   ```

14. **HEX_6**: `#3a1a2d` (라인 85)
   ```
   --mood-text-primary: #3a1a2d;
   ```

15. **HEX_6**: `#7a3d5a` (라인 86)
   ```
   --mood-text-secondary: #7a3d5a;
   ```

16. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 18)
   ```
   --mood-accent-light: rgba(0, 122, 255, 0.1);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 21)
   ```
   --mood-card-bg: rgba(255, 255, 255, 0.95);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 22)
   ```
   --mood-card-border: rgba(0, 0, 0, 0.04);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 23)
   ```
   --mood-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

20. **RGBA**: `rgba(255, 107, 53, 0.1)` (라인 33)
   ```
   --mood-accent-light: rgba(255, 107, 53, 0.1);
   ```

21. **RGBA**: `rgba(255, 248, 245, 0.95)` (라인 36)
   ```
   --mood-card-bg: rgba(255, 248, 245, 0.95);
   ```

22. **RGBA**: `rgba(255, 107, 53, 0.08)` (라인 37)
   ```
   --mood-card-border: rgba(255, 107, 53, 0.08);
   ```

23. **RGBA**: `rgba(255, 107, 53, 0.12)` (라인 38)
   ```
   --mood-shadow: 0 2px 8px rgba(255, 107, 53, 0.12);
   ```

24. **RGBA**: `rgba(52, 199, 89, 0.1)` (라인 48)
   ```
   --mood-accent-light: rgba(52, 199, 89, 0.1);
   ```

25. **RGBA**: `rgba(245, 255, 248, 0.95)` (라인 51)
   ```
   --mood-card-bg: rgba(245, 255, 248, 0.95);
   ```

26. **RGBA**: `rgba(52, 199, 89, 0.08)` (라인 52)
   ```
   --mood-card-border: rgba(52, 199, 89, 0.08);
   ```

27. **RGBA**: `rgba(52, 199, 89, 0.12)` (라인 53)
   ```
   --mood-shadow: 0 2px 8px rgba(52, 199, 89, 0.12);
   ```

28. **RGBA**: `rgba(88, 86, 214, 0.1)` (라인 63)
   ```
   --mood-accent-light: rgba(88, 86, 214, 0.1);
   ```

29. **RGBA**: `rgba(248, 247, 255, 0.95)` (라인 66)
   ```
   --mood-card-bg: rgba(248, 247, 255, 0.95);
   ```

30. **RGBA**: `rgba(88, 86, 214, 0.08)` (라인 67)
   ```
   --mood-card-border: rgba(88, 86, 214, 0.08);
   ```

31. **RGBA**: `rgba(88, 86, 214, 0.12)` (라인 68)
   ```
   --mood-shadow: 0 2px 8px rgba(88, 86, 214, 0.12);
   ```

32. **RGBA**: `rgba(255, 45, 146, 0.1)` (라인 78)
   ```
   --mood-accent-light: rgba(255, 45, 146, 0.1);
   ```

33. **RGBA**: `rgba(255, 245, 252, 0.95)` (라인 81)
   ```
   --mood-card-bg: rgba(255, 245, 252, 0.95);
   ```

34. **RGBA**: `rgba(255, 45, 146, 0.08)` (라인 82)
   ```
   --mood-card-border: rgba(255, 45, 146, 0.08);
   ```

35. **RGBA**: `rgba(255, 45, 146, 0.12)` (라인 83)
   ```
   --mood-shadow: 0 2px 8px rgba(255, 45, 146, 0.12);
   ```

---

### 🔥 `frontend/src/constants/css/commonStyles.js` (JS)

**하드코딩 색상**: 32개 - **즉시 수정 필요**

1. **HEX_6**: `#5a4fcf` (라인 14)
   ```
   PRIMARY_DARK: '#5a4fcf',
   ```

2. **HEX_6**: `#f9fafb` (라인 22)
   ```
   GRAY_50: '#f9fafb',
   ```

3. **HEX_6**: `#f3f4f6` (라인 23)
   ```
   GRAY_100: '#f3f4f6',
   ```

4. **HEX_6**: `#e5e7eb` (라인 24)
   ```
   GRAY_200: '#e5e7eb',
   ```

5. **HEX_6**: `#d1d5db` (라인 25)
   ```
   GRAY_300: '#d1d5db',
   ```

6. **HEX_6**: `#9ca3af` (라인 26)
   ```
   GRAY_400: '#9ca3af',
   ```

7. **HEX_6**: `#6b7280` (라인 27)
   ```
   GRAY_500: '#6b7280',
   ```

8. **HEX_6**: `#4b5563` (라인 28)
   ```
   GRAY_600: '#4b5563',
   ```

9. **HEX_6**: `#374151` (라인 29)
   ```
   GRAY_700: '#374151',
   ```

10. **HEX_6**: `#1f2937` (라인 30)
   ```
   GRAY_800: '#1f2937',
   ```

11. **HEX_6**: `#111827` (라인 31)
   ```
   GRAY_900: '#111827',
   ```

12. **HEX_6**: `#2d3748` (라인 44)
   ```
   BG_DARK: '#2d3748',
   ```

13. **HEX_6**: `#dee2e6` (라인 50)
   ```
   BORDER_SECONDARY: '#dee2e6',
   ```

14. **HEX_6**: `#f0f0f0` (라인 51)
   ```
   BORDER_LIGHT: '#f0f0f0',
   ```

15. **HEX_6**: `#d1d5db` (라인 52)
   ```
   BORDER_DARK: '#d1d5db',
   ```

16. **HEX_6**: `#d4edda` (라인 56)
   ```
   SUCCESS_LIGHT: '#d4edda',
   ```

17. **HEX_6**: `#fff3cd` (라인 58)
   ```
   WARNING_LIGHT: '#fff3cd',
   ```

18. **HEX_6**: `#f8d7da` (라인 60)
   ```
   ERROR_LIGHT: '#f8d7da',
   ```

19. **HEX_6**: `#d1ecf1` (라인 62)
   ```
   INFO_LIGHT: '#d1ecf1',
   ```

20. **HEX_6**: `#fd79a8` (라인 67)
   ```
   BRAND_ACCENT: '#fd79a8',
   ```

21. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 12)
   ```
   PRIMARY_LIGHT: 'rgba(108, 92, 231, 0.1)',
   ```

22. **RGBA**: `rgba(108, 92, 231, 0.2)` (라인 13)
   ```
   PRIMARY_HOVER: 'rgba(108, 92, 231, 0.2)',
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 45)
   ```
   BG_HOVER: 'rgba(0, 0, 0, 0.05)',
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 126)
   ```
   XS: '0 1px 2px rgba(0, 0, 0, 0.05)',
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 127)
   ```
   SM: '0 1px 3px var(--mg-shadow-light), 0 1px 2px rgba(0, 0, 0, 0.06)',
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.07)` (라인 128)
   ```
   MD: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 128)
   ```
   MD: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 129)
   ```
   LG: '0 10px 15px var(--mg-shadow-light), 0 4px 6px rgba(0, 0, 0, 0.05)',
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 130)
   ```
   XL: '0 20px 25px var(--mg-shadow-light), 0 10px 10px rgba(0, 0, 0, 0.04)',
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 131)
   ```
   XXL: '0 25px 50px rgba(0, 0, 0, 0.25)',
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 132)
   ```
   INNER: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
   ```

32. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 133)
   ```
   OUTLINE: '0 0 0 3px rgba(108, 92, 231, 0.1)',
   ```

---

### 🔥 `frontend/src/styles/01-settings/_colors.css` (CSS)

**하드코딩 색상**: 21개 - **즉시 수정 필요**

1. **HEX_6**: `#ff2d92` (라인 11)
   ```
   --ios-pink: #ff2d92;
   ```

2. **HEX_6**: `#ffcc00` (라인 12)
   ```
   --ios-yellow: #ffcc00;
   ```

3. **HEX_6**: `#8e8e93` (라인 13)
   ```
   --ios-gray: #8e8e93;
   ```

4. **HEX_6**: `#ff2d92` (라인 21)
   ```
   --ipad-pink: #ff2d92;
   ```

5. **HEX_6**: `#ffcc00` (라인 22)
   ```
   --ipad-yellow: #ffcc00;
   ```

6. **HEX_6**: `#8e8e93` (라인 23)
   ```
   --ipad-gray: #8e8e93;
   ```

7. **HEX_6**: `#343a40` (라인 33)
   ```
   --color-dark: #343a40;
   ```

8. **HEX_6**: `#1d1d1f` (라인 36)
   ```
   --ios-text-primary: #1d1d1f;
   ```

9. **HEX_6**: `#86868b` (라인 37)
   ```
   --ios-text-secondary: #86868b;
   ```

10. **HEX_6**: `#c7c7cc` (라인 38)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

11. **HEX_6**: `#1d1d1f` (라인 41)
   ```
   --ipad-text-primary: #1d1d1f;
   ```

12. **HEX_6**: `#86868b` (라인 42)
   ```
   --ipad-text-secondary: #86868b;
   ```

13. **HEX_6**: `#c7c7cc` (라인 43)
   ```
   --ipad-text-tertiary: #c7c7cc;
   ```

14. **HEX_6**: `#f2f2f7` (라인 47)
   ```
   --ios-bg-secondary: #f2f2f7;
   ```

15. **HEX_6**: `#f2f2f7` (라인 52)
   ```
   --ipad-bg-secondary: #f2f2f7;
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 59)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 60)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.3);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 63)
   ```
   --ipad-card-bg: rgba(255, 255, 255, 0.9);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 64)
   ```
   --ipad-card-border: rgba(0, 0, 0, 0.05);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 65)
   ```
   --ipad-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

21. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 69)
   ```
   --ipad-btn-secondary: rgba(142, 142, 147, 0.12);
   ```

---

### 🔥 `frontend/src/themes/defaultTheme.js` (JS)

**하드코딩 색상**: 20개 - **즉시 수정 필요**

1. **HEX_6**: `#6B6B00` (라인 17)
   ```
   active: '#6B6B00',
   ```

2. **HEX_6**: `#FAFAFA` (라인 24)
   ```
   secondary: '#FAFAFA', // Light Gray
   ```

3. **HEX_6**: `#2F2F2F` (라인 31)
   ```
   primary: '#2F2F2F',   // Dark Gray
   ```

4. **HEX_6**: `#6B6B6B` (라인 32)
   ```
   secondary: '#6B6B6B', // Medium Gray
   ```

5. **HEX_6**: `#9CA3AF` (라인 33)
   ```
   tertiary: '#9CA3AF',
   ```

6. **HEX_6**: `#E5E5E7` (라인 40)
   ```
   light: '#E5E5E7',
   ```

7. **HEX_6**: `#D1D5DB` (라인 41)
   ```
   medium: '#D1D5DB',
   ```

8. **HEX_6**: `#9CA3AF` (라인 42)
   ```
   dark: '#9CA3AF',
   ```

9. **HEX_6**: `#d1fae5` (라인 49)
   ```
   successBg: '#d1fae5',
   ```

10. **HEX_6**: `#fef3c7` (라인 51)
   ```
   warningBg: '#fef3c7',
   ```

11. **HEX_6**: `#fee2e2` (라인 53)
   ```
   errorBg: '#fee2e2',
   ```

12. **HEX_6**: `#dbeafe` (라인 55)
   ```
   infoBg: '#dbeafe',
   ```

13. **HEX_6**: `#E5E5E7` (라인 62)
   ```
   disabled: '#E5E5E7',
   ```

14. **HEX_6**: `#9CA3AF` (라인 63)
   ```
   disabledText: '#9CA3AF',
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 60)
   ```
   hover: 'rgba(0, 0, 0, 0.05)',
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 68)
   ```
   background: 'rgba(255, 255, 255, 0.6)',
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 69)
   ```
   border: 'rgba(255, 255, 255, 0.5)',
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 128)
   ```
   sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 132)
   ```
   '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 133)
   ```
   inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
   ```

---

### 🔥 `frontend/src/constants/css/headerConstants.js` (JS)

**하드코딩 색상**: 11개 - **즉시 수정 필요**

1. **HEX_3**: `#333` (라인 48)
   ```
   TEXT_PRIMARY: '#333',
   ```

2. **HEX_3**: `#666` (라인 49)
   ```
   TEXT_SECONDARY: '#666',
   ```

3. **HEX_3**: `#999` (라인 50)
   ```
   TEXT_MUTED: '#999',
   ```

4. **HEX_6**: `#c82333` (라인 54)
   ```
   DANGER_HOVER: '#c82333',
   ```

5. **HEX_6**: `#e9ecef` (라인 56)
   ```
   NEUTRAL_HOVER: '#e9ecef',
   ```

6. **HEX_6**: `#dee2e6` (라인 57)
   ```
   BORDER_LIGHT: '#dee2e6',
   ```

7. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 44)
   ```
   PRIMARY_LIGHT: 'rgba(108, 92, 231, 0.1)',
   ```

8. **RGBA**: `rgba(108, 92, 231, 0.2)` (라인 45)
   ```
   PRIMARY_HOVER: 'rgba(108, 92, 231, 0.2)',
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 52)
   ```
   BACKGROUND_HOVER: 'rgba(0, 0, 0, 0.05)',
   ```

10. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 105)
   ```
   LOGOUT_BUTTON: '0 4px 15px rgba(220, 53, 69, 0.4)',
   ```

11. **RGBA**: `rgba(220, 53, 69, 0.6)` (라인 106)
   ```
   LOGOUT_BUTTON_HOVER: '0 6px 20px rgba(220, 53, 69, 0.6)',
   ```

---

### 🔥 `frontend/src/hooks/useTheme.js` (JS)

**하드코딩 색상**: 10개 - **즉시 수정 필요**

1. **HEX_6**: `#1a1a1a` (라인 77)
   ```
   root.style.setProperty('--theme-bg-primary', '#1a1a1a');
   ```

2. **HEX_6**: `#2a2a2a` (라인 78)
   ```
   root.style.setProperty('--theme-bg-secondary', '#2a2a2a');
   ```

3. **HEX_6**: `#3a3a3a` (라인 79)
   ```
   root.style.setProperty('--theme-bg-tertiary', '#3a3a3a');
   ```

4. **HEX_6**: `#b3b3b3` (라인 81)
   ```
   root.style.setProperty('--theme-text-secondary', '#b3b3b3');
   ```

5. **HEX_6**: `#f2f2f7` (라인 88)
   ```
   root.style.setProperty('--theme-bg-secondary', '#f2f2f7');
   ```

6. **HEX_6**: `#1d1d1f` (라인 90)
   ```
   root.style.setProperty('--theme-text-primary', '#1d1d1f');
   ```

7. **HEX_6**: `#86868b` (라인 91)
   ```
   root.style.setProperty('--theme-text-secondary', '#86868b');
   ```

8. **HEX_6**: `#c7c7cc` (라인 92)
   ```
   root.style.setProperty('--theme-text-tertiary', '#c7c7cc');
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)');
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 93)
   ```
   root.style.setProperty('--theme-border', 'rgba(0, 0, 0, 0.05)');
   ```

---

### 🔥 `frontend/src/styles/themes/mobile-theme.css` (CSS)

**하드코딩 색상**: 8개 - **즉시 수정 필요**

1. **HEX_6**: `#2563eb` (라인 5)
   ```
   --color-primary-hover: #2563eb;
   ```

2. **HEX_6**: `#1d4ed8` (라인 6)
   ```
   --color-primary-active: #1d4ed8;
   ```

3. **HEX_6**: `#dbeafe` (라인 7)
   ```
   --color-primary-light: #dbeafe;
   ```

4. **HEX_6**: `#1e40af` (라인 8)
   ```
   --color-primary-dark: #1e40af;
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 25)
   ```
   --shadow-xl: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 28)
   ```
   --mobile-bg-primary: rgba(255, 255, 255, 0.95);
   ```

7. **RGBA**: `rgba(248, 250, 252, 0.95)` (라인 29)
   ```
   --mobile-bg-secondary: rgba(248, 250, 252, 0.95);
   ```

8. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 30)
   ```
   --mobile-border: rgba(226, 232, 240, 0.8);
   ```

---

### 🔥 `frontend/src/constants/cssConstants.js` (JS)

**하드코딩 색상**: 6개 - **즉시 수정 필요**

1. **HEX_6**: `#343a40` (라인 25)
   ```
   DARK: '#343a40',
   ```

2. **HEX_6**: `#f0f0f0` (라인 41)
   ```
   LIGHT: '#f0f0f0',
   ```

3. **HEX_6**: `#cccccc` (라인 42)
   ```
   DARK: '#cccccc',
   ```

4. **HEX_6**: `#9E9E9E` (라인 49)
   ```
   INACTIVE: '#9E9E9E',
   ```

5. **HEX_6**: `#8BC34A` (라인 58)
   ```
   GOOD: '#8BC34A',
   ```

6. **HEX_6**: `#D32F2F` (라인 61)
   ```
   CRITICAL: '#D32F2F'
   ```

---

### 🔥 `frontend/src/components/ui/ThemeSelector/ThemeSelector.test.js` (JS)

**하드코딩 색상**: 5개 - **즉시 수정 필요**

1. **HEX_6**: `#87CEEB` (라인 16)
   ```
   colors: {primary: '#87CEEB',
   ```

2. **HEX_6**: `#F0F8FF` (라인 17)
   ```
   secondary: '#F0F8FF',
   ```

3. **HEX_6**: `#191970` (라인 19)
   ```
   text: '#191970'}},
   ```

4. **HEX_6**: `#FFB6C1` (라인 23)
   ```
   preview: '#FFB6C1'},
   ```

5. **HEX_6**: `#87CEEB` (라인 31)
   ```
   preview: '#87CEEB'}],
   ```

---

### 🔥 `frontend/src/utils/colorUtils.js` (JS)

**하드코딩 색상**: 4개 - **즉시 수정 필요**

1. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 42)
   ```
   return statusMap[status] || 'rgba(107, 114, 128, 0.1)';
   ```

2. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 106)
   ```
   return gradeMap[grade] || 'rgba(107, 114, 128, 0.1)';
   ```

3. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 140)
   ```
   return roleMap[role] || 'rgba(107, 114, 128, 0.1)';
   ```

4. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 173)
   ```
   return vacationMap[type] || 'rgba(107, 114, 128, 0.1)';
   ```

---

### 🔥 `frontend/src/components/mindgarden/ColorPaletteShowcase.js` (JS)

**하드코딩 색상**: 3개 - **즉시 수정 필요**

1. **HEX_6**: `#2F2F2F` (라인 15)
   ```
   { name: 'Dark Gray', var: '--dark-gray', hex: '#2F2F2F', usage: '주 텍스트' },
   ```

2. **HEX_6**: `#6B6B6B` (라인 16)
   ```
   { name: 'Medium Gray', var: '--medium-gray', hex: '#6B6B6B', usage: '보조 텍스트' },
   ```

3. **HEX_6**: `#FFFEF7` (라인 17)
   ```
   { name: 'Light Cream', var: '--light-cream', hex: '#FFFEF7', usage: '밝은 배경' }
   ```

---

### 🔥 `frontend/src/components/ui/ThemeSelector/ThemeSelector.css` (CSS)

**하드코딩 색상**: 2개 - **즉시 수정 필요**

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 57)
   ```
   rgba(255, 255, 255, 0.1) 25%,
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 60)
   ```
   rgba(255, 255, 255, 0.1) 75%
   ```

---

### 📁 `frontend/src/styles/unified-design-tokens.css` (CSS)

**하드코딩 색상**: 197개

1. **HEX_6**: `#0056b3` (라인 24)
   ```
   --color-primary-dark: #0056b3;
   ```

2. **HEX_6**: `#66b3ff` (라인 25)
   ```
   --color-primary-light: #66b3ff;
   ```

3. **HEX_6**: `#1d1d1f` (라인 30)
   ```
   --ios-text-primary: #1d1d1f;
   ```

4. **HEX_6**: `#1d1d1f` (라인 33)
   ```
   --ipad-text-primary: #1d1d1f;
   ```

5. **HEX_6**: `#764ba2` (라인 39)
   ```
   --mg-primary_dark: #764ba2;
   ```

6. **HEX_6**: `#2c3e50` (라인 40)
   ```
   --mg-text_primary: #2c3e50;
   ```

7. **HEX_6**: `#f2f2f7` (라인 45)
   ```
   --bg-secondary: #f2f2f7;
   ```

8. **HEX_6**: `#FAFAFA` (라인 47)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

9. **HEX_6**: `#495057` (라인 49)
   ```
   --color-secondary-dark: #495057;
   ```

10. **HEX_6**: `#9ca3af` (라인 50)
   ```
   --color-secondary-light: #9ca3af;
   ```

11. **HEX_6**: `#6b7280` (라인 52)
   ```
   --color-text-secondary: #6b7280;
   ```

12. **HEX_6**: `#f2f2f7` (라인 53)
   ```
   --ios-bg-secondary: #f2f2f7;
   ```

13. **HEX_6**: `#86868b` (라인 54)
   ```
   --ios-text-secondary: #86868b;
   ```

14. **HEX_6**: `#f2f2f7` (라인 55)
   ```
   --ipad-bg-secondary: #f2f2f7;
   ```

15. **HEX_6**: `#86868b` (라인 57)
   ```
   --ipad-text-secondary: #86868b;
   ```

16. **HEX_6**: `#dee2e6` (라인 59)
   ```
   --mg-border_secondary: #dee2e6;
   ```

17. **HEX_6**: `#e9ecef` (라인 62)
   ```
   --mg-secondary_light: #e9ecef;
   ```

18. **HEX_6**: `#00a085` (라인 73)
   ```
   --mg-success_dark: #00a085;
   ```

19. **HEX_6**: `#d4edda` (라인 74)
   ```
   --mg-success_light: #d4edda;
   ```

20. **HEX_6**: `#d1fae5` (라인 78)
   ```
   --status-success-bg: #d1fae5;
   ```

21. **HEX_6**: `#c3e6cb` (라인 79)
   ```
   --status-success-border: #c3e6cb;
   ```

22. **HEX_6**: `#1e7e34` (라인 80)
   ```
   --status-success-dark: #1e7e34;
   ```

23. **HEX_6**: `#6cbb6d` (라인 81)
   ```
   --status-success-light: #6cbb6d;
   ```

24. **HEX_6**: `#ee5a24` (라인 92)
   ```
   --mg-danger_dark: #ee5a24;
   ```

25. **HEX_6**: `#f8d7da` (라인 93)
   ```
   --mg-danger_light: #f8d7da;
   ```

26. **HEX_6**: `#f8d7da` (라인 95)
   ```
   --mg-error_light: #f8d7da;
   ```

27. **HEX_6**: `#fee2e2` (라인 97)
   ```
   --status-error-bg: #fee2e2;
   ```

28. **HEX_6**: `#fecaca` (라인 98)
   ```
   --status-error-border: #fecaca;
   ```

29. **HEX_6**: `#c82333` (라인 99)
   ```
   --status-error-dark: #c82333;
   ```

30. **HEX_6**: `#f56565` (라인 100)
   ```
   --status-error-light: #f56565;
   ```

31. **HEX_6**: `#e65100` (라인 104)
   ```
   --color-orange: #e65100;
   ```

32. **HEX_6**: `#fff3e0` (라인 106)
   ```
   --color-orange-light: #fff3e0;
   ```

33. **HEX_6**: `#856404` (라인 108)
   ```
   --color-warning-dark: #856404;
   ```

34. **HEX_6**: `#ffcc00` (라인 111)
   ```
   --ios-yellow: #ffcc00;
   ```

35. **HEX_6**: `#ffcc00` (라인 113)
   ```
   --ipad-yellow: #ffcc00;
   ```

36. **HEX_6**: `#f5576c` (라인 116)
   ```
   --mg-warning_dark: #f5576c;
   ```

37. **HEX_6**: `#fff3cd` (라인 117)
   ```
   --mg-warning_light: #fff3cd;
   ```

38. **HEX_6**: `#fef3c7` (라인 119)
   ```
   --status-warning-bg: #fef3c7;
   ```

39. **HEX_6**: `#e0a800` (라인 120)
   ```
   --status-warning-dark: #e0a800;
   ```

40. **HEX_6**: `#ffeaa7` (라인 121)
   ```
   --status-warning-light: #ffeaa7;
   ```

41. **HEX_6**: `#0984e3` (라인 131)
   ```
   --mg-info_dark: #0984e3;
   ```

42. **HEX_6**: `#d1ecf1` (라인 132)
   ```
   --mg-info_light: #d1ecf1;
   ```

43. **HEX_6**: `#dbeafe` (라인 134)
   ```
   --status-info-bg: #dbeafe;
   ```

44. **HEX_6**: `#138496` (라인 135)
   ```
   --status-info-dark: #138496;
   ```

45. **HEX_6**: `#bbdefb` (라인 136)
   ```
   --status-info-light: #bbdefb;
   ```

46. **HEX_6**: `#9e9e9e` (라인 140)
   ```
   --color-gray: #9e9e9e;
   ```

47. **HEX_6**: `#7f8c8d` (라인 141)
   ```
   --color-gray-dark: #7f8c8d;
   ```

48. **HEX_6**: `#95a5a6` (라인 142)
   ```
   --color-gray-light: #95a5a6;
   ```

49. **HEX_6**: `#2F2F2F` (라인 143)
   ```
   --dark-gray: #2F2F2F;
   ```

50. **HEX_6**: `#D0D0E8` (라인 145)
   ```
   --gradient-gray-end: #D0D0E8;
   ```

51. **HEX_6**: `#B8B8D0` (라인 146)
   ```
   --gradient-gray-start: #B8B8D0;
   ```

52. **HEX_6**: `#8e8e93` (라인 147)
   ```
   --ios-gray: #8e8e93;
   ```

53. **HEX_6**: `#8e8e93` (라인 148)
   ```
   --ipad-gray: #8e8e93;
   ```

54. **HEX_6**: `#6B6B6B` (라인 149)
   ```
   --medium-gray: #6B6B6B;
   ```

55. **HEX_6**: `#495057` (라인 150)
   ```
   --mg-gray_dark: #495057;
   ```

56. **HEX_6**: `#c7c7cc` (라인 158)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

57. **HEX_6**: `#c7c7cc` (라인 159)
   ```
   --ipad-text-tertiary: #c7c7cc;
   ```

58. **HEX_6**: `#c7c7cc` (라인 165)
   ```
   --text-tertiary: #c7c7cc;
   ```

59. **HEX_6**: `#1d1d1f` (라인 168)
   ```
   --bg-dark: #1d1d1f;
   ```

60. **HEX_6**: `#343a40` (라인 174)
   ```
   --color-background-dark: #343a40;
   ```

61. **HEX_6**: `#2d3748` (라인 191)
   ```
   --mg-bg_dark: #2d3748;
   ```

62. **HEX_6**: `#a8a8a8` (라인 227)
   ```
   --color-border-dark: #a8a8a8;
   ```

63. **HEX_6**: `#e9ecef` (라인 230)
   ```
   --color-border-light: #e9ecef;
   ```

64. **HEX_6**: `#e9ecef` (라인 240)
   ```
   --mg-border: #e9ecef;
   ```

65. **HEX_6**: `#d1d5db` (라인 241)
   ```
   --mg-border_dark: #d1d5db;
   ```

66. **HEX_6**: `#f0f0f0` (라인 242)
   ```
   --mg-border_light: #f0f0f0;
   ```

67. **HEX_6**: `#e91e63` (라인 432)
   ```
   --color-accent: #e91e63;
   ```

68. **HEX_6**: `#795548` (라인 433)
   ```
   --color-brown: #795548;
   ```

69. **HEX_6**: `#6d3410` (라인 434)
   ```
   --color-brown-dark: #6d3410;
   ```

70. **HEX_6**: `#212529` (라인 435)
   ```
   --color-dark: #212529;
   ```

71. **HEX_6**: `#D32F2F` (라인 438)
   ```
   --color-performance-critical: #D32F2F;
   ```

72. **HEX_6**: `#8BC34A` (라인 440)
   ```
   --color-performance-good: #8BC34A;
   ```

73. **HEX_6**: `#c2185b` (라인 442)
   ```
   --color-pink: #c2185b;
   ```

74. **HEX_6**: `#fce4ec` (라인 443)
   ```
   --color-pink-light: #fce4ec;
   ```

75. **HEX_6**: `#7b1fa2` (라인 444)
   ```
   --color-purple: #7b1fa2;
   ```

76. **HEX_6**: `#f3e5f5` (라인 445)
   ```
   --color-purple-light: #f3e5f5;
   ```

77. **HEX_6**: `#9E9E9E` (라인 449)
   ```
   --color-status-inactive: #9E9E9E;
   ```

78. **HEX_6**: `#6366f1` (라인 453)
   ```
   --consultant-color-10: #6366f1;
   ```

79. **HEX_6**: `#06b6d4` (라인 458)
   ```
   --consultant-color-6: #06b6d4;
   ```

80. **HEX_6**: `#84cc16` (라인 459)
   ```
   --consultant-color-7: #84cc16;
   ```

81. **HEX_6**: `#f97316` (라인 460)
   ```
   --consultant-color-8: #f97316;
   ```

82. **HEX_6**: `#ec4899` (라인 461)
   ```
   --consultant-color-9: #ec4899;
   ```

83. **HEX_6**: `#ffd700` (라인 497)
   ```
   --grade-expert: #ffd700;
   ```

84. **HEX_6**: `#cd7f32` (라인 498)
   ```
   --grade-junior: #cd7f32;
   ```

85. **HEX_6**: `#e5e4e2` (라인 499)
   ```
   --grade-master: #e5e4e2;
   ```

86. **HEX_6**: `#c0c0c0` (라인 500)
   ```
   --grade-senior: #c0c0c0;
   ```

87. **HEX_6**: `#FFA500` (라인 502)
   ```
   --gradient-gold-end: #FFA500;
   ```

88. **HEX_6**: `#FFD700` (라인 503)
   ```
   --gradient-gold-start: #FFD700;
   ```

89. **HEX_6**: `#B4E7CE` (라인 505)
   ```
   --gradient-mint-end: #B4E7CE;
   ```

90. **HEX_6**: `#98D8C8` (라인 506)
   ```
   --gradient-mint-start: #98D8C8;
   ```

91. **HEX_6**: `#FFA5C0` (라인 508)
   ```
   --gradient-peach-end: #FFA5C0;
   ```

92. **HEX_6**: `#FF6B9D` (라인 509)
   ```
   --gradient-peach-start: #FF6B9D;
   ```

93. **HEX_6**: `#FFC0CB` (라인 511)
   ```
   --gradient-pink-end: #FFC0CB;
   ```

94. **HEX_6**: `#FFB6C1` (라인 512)
   ```
   --gradient-pink-start: #FFB6C1;
   ```

95. **HEX_6**: `#B0E0E6` (라인 514)
   ```
   --gradient-sky-end: #B0E0E6;
   ```

96. **HEX_6**: `#87CEEB` (라인 515)
   ```
   --gradient-sky-start: #87CEEB;
   ```

97. **HEX_6**: `#ff2d92` (라인 533)
   ```
   --ios-pink: #ff2d92;
   ```

98. **HEX_6**: `#ff2d92` (라인 536)
   ```
   --ipad-pink: #ff2d92;
   ```

99. **HEX_6**: `#FFFEF7` (라인 539)
   ```
   --light-cream: #FFFEF7;
   ```

100. **HEX_6**: `#2c3e50` (라인 548)
   ```
   --mg-black: #2c3e50;
   ```

101. **HEX_6**: `#fd79a8` (라인 550)
   ```
   --mg-brand_accent: #fd79a8;
   ```

102. **HEX_6**: `#00a085` (라인 553)
   ```
   --mg-client_dark: #00a085;
   ```

103. **HEX_6**: `#FEE500` (라인 554)
   ```
   --mg-color: #FEE500;
   ```

104. **HEX_6**: `#D32F2F` (라인 558)
   ```
   --mg-critical: #D32F2F;
   ```

105. **HEX_6**: `#343a40` (라인 559)
   ```
   --mg-dark: #343a40;
   ```

106. **HEX_6**: `#e74c3c` (라인 562)
   ```
   --mg-expense: #e74c3c;
   ```

107. **HEX_6**: `#c0392b` (라인 563)
   ```
   --mg-expense_dark: #c0392b;
   ```

108. **HEX_6**: `#8BC34A` (라인 568)
   ```
   --mg-good: #8BC34A;
   ```

109. **HEX_6**: `#9E9E9E` (라인 569)
   ```
   --mg-inactive: #9E9E9E;
   ```

110. **HEX_6**: `#9b59b6` (라인 575)
   ```
   --mg-payment: #9b59b6;
   ```

111. **HEX_6**: `#8e44ad` (라인 576)
   ```
   --mg-payment_dark: #8e44ad;
   ```

112. **HEX_6**: `#34495e` (라인 580)
   ```
   --mg-report: #34495e;
   ```

113. **HEX_6**: `#2c3e50` (라인 581)
   ```
   --mg-report_dark: #2c3e50;
   ```

114. **HEX_6**: `#27ae60` (라인 582)
   ```
   --mg-revenue: #27ae60;
   ```

115. **HEX_6**: `#229954` (라인 583)
   ```
   --mg-revenue_dark: #229954;
   ```

116. **HEX_6**: `#95a5a6` (라인 585)
   ```
   --mg-settings: #95a5a6;
   ```

117. **HEX_6**: `#7f8c8d` (라인 586)
   ```
   --mg-settings_dark: #7f8c8d;
   ```

118. **HEX_6**: `#fbbf24` (라인 600)
   ```
   --payment-pending: #fbbf24;
   ```

119. **HEX_6**: `#6b7280` (라인 601)
   ```
   --payment-refunded: #6b7280;
   ```

120. **HEX_6**: `#6b7280` (라인 605)
   ```
   --role-client: #6b7280;
   ```

121. **HEX_6**: `#6b7280` (라인 634)
   ```
   --status-completed: #6b7280;
   ```

122. **HEX_6**: `#f97316` (라인 637)
   ```
   --status-no-show: #f97316;
   ```

123. **HEX_6**: `#fd7e14` (라인 638)
   ```
   --status-pending: #fd7e14;
   ```

124. **HEX_6**: `#e55a00` (라인 639)
   ```
   --status-pending-dark: #e55a00;
   ```

125. **HEX_6**: `#ffa94d` (라인 640)
   ```
   --status-pending-light: #ffa94d;
   ```

126. **HEX_6**: `#fbbf24` (라인 642)
   ```
   --status-requested: #fbbf24;
   ```

127. **HEX_6**: `#6b7280` (라인 656)
   ```
   --user-inactive: #6b7280;
   ```

128. **HEX_6**: `#fbbf24` (라인 657)
   ```
   --user-pending: #fbbf24;
   ```

129. **HEX_6**: `#ec4899` (라인 660)
   ```
   --vacation-maternity: #ec4899;
   ```

130. **HEX_6**: `#6b7280` (라인 661)
   ```
   --vacation-other: #6b7280;
   ```

131. **HEX_6**: `#06b6d4` (라인 662)
   ```
   --vacation-paternity: #06b6d4;
   ```

132. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 41)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

133. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 56)
   ```
   --ipad-btn-secondary: rgba(142, 142, 147, 0.12);
   ```

134. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 68)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

135. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 86)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

136. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 109)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

137. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 126)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

138. **RGBA**: `rgba(230, 245, 255, 0.5)` (라인 169)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

139. **RGBA**: `rgba(240, 250, 255, 0.5)` (라인 169)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

140. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 170)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

141. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 170)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

142. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 171)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

143. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 171)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

144. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 172)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

145. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 172)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

146. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 177)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

147. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 178)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

148. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 180)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

149. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 181)
   ```
   --glass-bg-light: rgba(0, 0, 0, 0.25);
   ```

150. **RGBA**: `rgba(0, 0, 0, 0.35)` (라인 182)
   ```
   --glass-bg-medium: rgba(0, 0, 0, 0.35);
   ```

151. **RGBA**: `rgba(0, 0, 0, 0.45)` (라인 183)
   ```
   --glass-bg-strong: rgba(0, 0, 0, 0.45);
   ```

152. **RGBA**: `rgba(255, 215, 0, 0.1)` (라인 184)
   ```
   --grade-expert-bg: rgba(255, 215, 0, 0.1);
   ```

153. **RGBA**: `rgba(205, 127, 50, 0.1)` (라인 185)
   ```
   --grade-junior-bg: rgba(205, 127, 50, 0.1);
   ```

154. **RGBA**: `rgba(229, 228, 226, 0.1)` (라인 186)
   ```
   --grade-master-bg: rgba(229, 228, 226, 0.1);
   ```

155. **RGBA**: `rgba(192, 192, 192, 0.1)` (라인 187)
   ```
   --grade-senior-bg: rgba(192, 192, 192, 0.1);
   ```

156. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 190)
   ```
   --ipad-card-bg: rgba(255, 255, 255, 0.9);
   ```

157. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 193)
   ```
   --role-admin-bg: rgba(59, 130, 246, 0.1);
   ```

158. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 194)
   ```
   --role-client-bg: rgba(107, 114, 128, 0.1);
   ```

159. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 195)
   ```
   --role-consultant-bg: rgba(139, 92, 246, 0.1);
   ```

160. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 196)
   ```
   --status-assigned-bg: rgba(139, 92, 246, 0.1);
   ```

161. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 197)
   ```
   --status-cancelled-bg: rgba(239, 68, 68, 0.1);
   ```

162. **RGBA**: `rgba(5, 150, 105, 0.1)` (라인 198)
   ```
   --status-completed-bg: rgba(5, 150, 105, 0.1);
   ```

163. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 199)
   ```
   --status-confirmed-bg: rgba(59, 130, 246, 0.1);
   ```

164. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 200)
   ```
   --status-in-progress-bg: rgba(16, 185, 129, 0.1);
   ```

165. **RGBA**: `rgba(251, 191, 36, 0.1)` (라인 201)
   ```
   --status-requested-bg: rgba(251, 191, 36, 0.1);
   ```

166. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 202)
   ```
   --vacation-annual-bg: rgba(59, 130, 246, 0.1);
   ```

167. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 203)
   ```
   --vacation-personal-bg: rgba(139, 92, 246, 0.1);
   ```

168. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 204)
   ```
   --vacation-sick-bg: rgba(239, 68, 68, 0.1);
   ```

169. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 207)
   ```
   --border-pink-light: rgba(255, 182, 193, 0.2);
   ```

170. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 208)
   ```
   --border-pink-medium: rgba(255, 182, 193, 0.4);
   ```

171. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 219)
   ```
   --border-sky-light: rgba(135, 206, 235, 0.2);
   ```

172. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 231)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

173. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 232)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

174. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 233)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.2);
   ```

175. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 239)
   ```
   --ipad-card-border: rgba(0, 0, 0, 0.05);
   ```

176. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 251)
   ```
   --ipad-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

177. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 252)
   ```
   --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

178. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 255)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

179. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 256)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.5);
   ```

180. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 257)
   ```
   --shadow-gold: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

181. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 258)
   ```
   --shadow-gold-sm: 0 2px 8px rgba(255, 215, 0, 0.3);
   ```

182. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 262)
   ```
   --shadow-mint-sm: 0 2px 8px rgba(152, 216, 200, 0.3);
   ```

183. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 264)
   ```
   --shadow-peach: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

184. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 265)
   ```
   --shadow-pink-sm: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

185. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 266)
   ```
   --shadow-sky: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

186. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 267)
   ```
   --shadow-sky-sm: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

187. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 269)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

188. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 270)
   ```
   --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

189. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 478)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

190. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 479)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

191. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 480)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

192. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 481)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

193. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 482)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

194. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 483)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

195. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 484)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

196. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 485)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

197. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 485)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

---

### 📁 `frontend/src/pages/AdvancedDesignSample.css` (CSS)

**하드코딩 색상**: 105개

1. **HEX_6**: `#718096` (라인 71)
   ```
   color: #718096;
   ```

2. **HEX_6**: `#4a5568` (라인 90)
   ```
   color: #4a5568;
   ```

3. **HEX_6**: `#764ba2` (라인 102)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#1a202c` (라인 144)
   ```
   color: #1a202c;
   ```

5. **HEX_6**: `#718096` (라인 150)
   ```
   color: #718096;
   ```

6. **HEX_6**: `#4a5568` (라인 159)
   ```
   color: #4a5568;
   ```

7. **HEX_6**: `#1a202c` (라인 186)
   ```
   color: #1a202c;
   ```

8. **HEX_6**: `#4a5568` (라인 193)
   ```
   color: #4a5568;
   ```

9. **HEX_6**: `#4a5568` (라인 216)
   ```
   color: #4a5568;
   ```

10. **HEX_6**: `#718096` (라인 222)
   ```
   color: #718096;
   ```

11. **HEX_6**: `#764ba2` (라인 232)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

12. **HEX_6**: `#1a202c` (라인 250)
   ```
   color: #1a202c;
   ```

13. **HEX_6**: `#4a5568` (라인 257)
   ```
   color: #4a5568;
   ```

14. **HEX_6**: `#4a5568` (라인 353)
   ```
   background: #4a5568;
   ```

15. **HEX_6**: `#4a5568` (라인 408)
   ```
   color: #4a5568;
   ```

16. **HEX_6**: `#764ba2` (라인 423)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

17. **HEX_6**: `#16a34a` (라인 453)
   ```
   color: #16a34a;
   ```

18. **HEX_6**: `#dc2626` (라인 459)
   ```
   color: #dc2626;
   ```

19. **HEX_6**: `#d97706` (라인 465)
   ```
   color: #d97706;
   ```

20. **HEX_6**: `#7c3aed` (라인 621)
   ```
   color: #7c3aed;
   ```

21. **HEX_6**: `#a0aec0` (라인 625)
   ```
   color: #a0aec0;
   ```

22. **HEX_6**: `#a0aec0` (라인 633)
   ```
   color: #a0aec0;
   ```

23. **HEX_6**: `#a0aec0` (라인 637)
   ```
   color: #a0aec0;
   ```

24. **HEX_6**: `#a0aec0` (라인 641)
   ```
   color: #a0aec0;
   ```

25. **HEX_6**: `#a0aec0` (라인 655)
   ```
   color: #a0aec0;
   ```

26. **HEX_6**: `#7c3aed` (라인 664)
   ```
   color: #7c3aed;
   ```

27. **HEX_6**: `#a0aec0` (라인 670)
   ```
   color: #a0aec0;
   ```

28. **HEX_6**: `#7c3aed` (라인 675)
   ```
   color: #7c3aed;
   ```

29. **HEX_6**: `#7c3aed` (라인 679)
   ```
   background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
   ```

30. **HEX_6**: `#5b21b6` (라인 679)
   ```
   background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
   ```

31. **HEX_6**: `#2d3748` (라인 729)
   ```
   color: #2d3748;
   ```

32. **HEX_6**: `#6b8dbd` (라인 852)
   ```
   color: #6b8dbd;
   ```

33. **HEX_6**: `#8b7cb8` (라인 857)
   ```
   color: #8b7cb8;
   ```

34. **HEX_6**: `#c4a484` (라인 862)
   ```
   color: #c4a484;
   ```

35. **HEX_6**: `#d4a5b8` (라인 867)
   ```
   color: #d4a5b8;
   ```

36. **HEX_6**: `#6ba06b` (라인 883)
   ```
   color: #6ba06b;
   ```

37. **HEX_6**: `#d4a5a5` (라인 888)
   ```
   color: #d4a5a5;
   ```

38. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 40)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

39. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 47)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

40. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 85)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

41. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 92)
   ```
   border: 1px solid rgba(226, 232, 240, 0.5);
   ```

42. **RGBA**: `rgba(255, 255, 255, 1)` (라인 96)
   ```
   background: rgba(255, 255, 255, 1);
   ```

43. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 104)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
   ```

44. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 119)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

45. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 125)
   ```
   border-color: rgba(102, 126, 234, 0.3);
   ```

46. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 152)
   ```
   background: rgba(226, 232, 240, 0.5);
   ```

47. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 168)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

48. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 171)
   ```
   border: 1px solid rgba(102, 126, 234, 0.2);
   ```

49. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 176)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

50. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 178)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

51. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 223)
   ```
   background: rgba(226, 232, 240, 0.5);
   ```

52. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 238)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

53. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 240)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

54. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 290)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

55. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 292)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

56. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 339)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

57. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 376)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

58. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 378)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

59. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 403)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

60. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 404)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

61. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 415)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

62. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 417)
   ```
   border-color: rgba(102, 126, 234, 0.3);
   ```

63. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 426)
   ```
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
   ```

64. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 452)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

65. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 454)
   ```
   border: 1px solid rgba(34, 197, 94, 0.2);
   ```

66. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 458)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

67. **RGBA**: `rgba(239, 68, 68, 0.2)` (라인 460)
   ```
   border: 1px solid rgba(239, 68, 68, 0.2);
   ```

68. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 464)
   ```
   background: rgba(245, 158, 11, 0.1);
   ```

69. **RGBA**: `rgba(245, 158, 11, 0.2)` (라인 466)
   ```
   border: 1px solid rgba(245, 158, 11, 0.2);
   ```

70. **RGBA**: `rgba(74, 85, 104, 0.5)` (라인 642)
   ```
   background: rgba(74, 85, 104, 0.5);
   ```

71. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 646)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

72. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 647)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

73. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 659)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

74. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 660)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

75. **RGBA**: `rgba(45, 55, 72, 0.8)` (라인 668)
   ```
   background: rgba(45, 55, 72, 0.8);
   ```

76. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 669)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

77. **RGBA**: `rgba(124, 58, 237, 0.1)` (라인 674)
   ```
   background: rgba(124, 58, 237, 0.1);
   ```

78. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 684)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

79. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 685)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

80. **RGBA**: `rgba(200, 220, 240, 0.9)` (라인 722)
   ```
   rgba(200, 220, 240, 0.9) 0%,
   ```

81. **RGBA**: `rgba(210, 215, 235, 0.95)` (라인 723)
   ```
   rgba(210, 215, 235, 0.95) 25%,
   ```

82. **RGBA**: `rgba(220, 210, 245, 0.9)` (라인 724)
   ```
   rgba(220, 210, 245, 0.9) 50%,
   ```

83. **RGBA**: `rgba(200, 225, 245, 0.95)` (라인 725)
   ```
   rgba(200, 225, 245, 0.95) 75%,
   ```

84. **RGBA**: `rgba(215, 230, 250, 0.9)` (라인 726)
   ```
   rgba(215, 230, 250, 0.9) 100%);
   ```

85. **RGBA**: `rgba(180, 200, 240, 0.6)` (라인 742)
   ```
   radial-gradient(ellipse at 30% 20%, rgba(180, 200, 240, 0.6) 0%, transparent 60%),
   ```

86. **RGBA**: `rgba(190, 210, 245, 0.5)` (라인 743)
   ```
   radial-gradient(ellipse at 70% 80%, rgba(190, 210, 245, 0.5) 0%, transparent 50%),
   ```

87. **RGBA**: `rgba(200, 220, 250, 0.4)` (라인 744)
   ```
   radial-gradient(ellipse at 20% 70%, rgba(200, 220, 250, 0.4) 0%, transparent 40%),
   ```

88. **RGBA**: `rgba(175, 195, 235, 0.55)` (라인 745)
   ```
   radial-gradient(ellipse at 80% 30%, rgba(175, 195, 235, 0.55) 0%, transparent 45%);
   ```

89. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 795)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

90. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 796)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

91. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 800)
   ```
   0 4px 20px rgba(0, 0, 0, 0.05),
   ```

92. **RGBA**: `rgba(220, 230, 255, 0.3)` (라인 801)
   ```
   0 2px 8px rgba(220, 230, 255, 0.3),
   ```

93. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 802)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

94. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 808)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

95. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 810)
   ```
   0 8px 25px rgba(0, 0, 0, 0.08),
   ```

96. **RGBA**: `rgba(220, 230, 255, 0.4)` (라인 811)
   ```
   0 4px 12px rgba(220, 230, 255, 0.4),
   ```

97. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 812)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.5);
   ```

98. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 818)
   ```
   background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
   ```

99. **RGBA**: `rgba(200, 220, 255, 0.4)` (라인 851)
   ```
   background: rgba(200, 220, 255, 0.4);
   ```

100. **RGBA**: `rgba(220, 200, 255, 0.4)` (라인 856)
   ```
   background: rgba(220, 200, 255, 0.4);
   ```

101. **RGBA**: `rgba(255, 235, 205, 0.4)` (라인 861)
   ```
   background: rgba(255, 235, 205, 0.4);
   ```

102. **RGBA**: `rgba(255, 210, 225, 0.4)` (라인 866)
   ```
   background: rgba(255, 210, 225, 0.4);
   ```

103. **RGBA**: `rgba(200, 230, 200, 0.4)` (라인 882)
   ```
   background: rgba(200, 230, 200, 0.4);
   ```

104. **RGBA**: `rgba(255, 210, 210, 0.4)` (라인 887)
   ```
   background: rgba(255, 210, 210, 0.4);
   ```

105. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 903)
   ```
   color: rgba(255, 255, 255, 0.6);
   ```

---

### 📁 `frontend/src/styles/glassmorphism.css` (CSS)

**하드코딩 색상**: 86개

1. **HEX_6**: `#2e7d32` (라인 284)
   ```
   color: #2e7d32;
   ```

2. **HEX_6**: `#c62828` (라인 290)
   ```
   color: #c62828;
   ```

3. **HEX_6**: `#af52de` (라인 376)
   ```
   .management-icon.mappings { background: #af52de; }
   ```

4. **HEX_6**: `#30d158` (라인 378)
   ```
   .management-icon.revenue { background: #30d158; }
   ```

5. **HEX_6**: `#64d2ff` (라인 380)
   ```
   .management-icon.payment { background: #64d2ff; }
   ```

6. **HEX_6**: `#bf5af2` (라인 381)
   ```
   .management-icon.reports { background: #bf5af2; }
   ```

7. **HEX_6**: `#32d74b` (라인 383)
   ```
   .management-icon.recurring-expense { background: #32d74b; }
   ```

8. **HEX_6**: `#764ba2` (라인 792)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

9. **HEX_6**: `#f5576c` (라인 797)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

10. **HEX_6**: `#2c3e50` (라인 802)
   ```
   background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
   ```

11. **HEX_6**: `#3498db` (라인 802)
   ```
   background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 44)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 67)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 85)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 97)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 103)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 142)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

18. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 151)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 153)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

20. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 154)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

21. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 158)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

22. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 160)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

23. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 164)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 166)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

25. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 171)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

26. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 201)
   ```
   rgba(102, 126, 234, 0.8),
   ```

27. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 202)
   ```
   rgba(118, 75, 162, 0.8));
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 230)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

29. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 232)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 237)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 263)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

32. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 283)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

33. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 285)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

34. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 289)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

35. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 291)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

36. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 318)
   ```
   rgba(102, 126, 234, 0.8),
   ```

37. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 319)
   ```
   rgba(118, 75, 162, 0.8));
   ```

38. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 343)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

39. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 344)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

40. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 360)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
   ```

41. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 362)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

42. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 367)
   ```
   box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
   ```

43. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 400)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

44. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 486)
   ```
   box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
   ```

45. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 496)
   ```
   box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
   ```

46. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 510)
   ```
   box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
   ```

47. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 605)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

48. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 607)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

49. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 630)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

50. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 635)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

51. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 638)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

52. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 639)
   ```
   box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
   ```

53. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 645)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

54. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 648)
   ```
   border: 1px solid rgba(255, 255, 255, 0.1);
   ```

55. **RGBA**: `rgba(31, 38, 135, 0.2)` (라인 649)
   ```
   box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.2);
   ```

56. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 655)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

57. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 658)
   ```
   border: 1px solid rgba(59, 130, 246, 0.2);
   ```

58. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 659)
   ```
   box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.3);
   ```

59. **RGBA**: `rgba(147, 51, 234, 0.1)` (라인 663)
   ```
   background: rgba(147, 51, 234, 0.1);
   ```

60. **RGBA**: `rgba(147, 51, 234, 0.2)` (라인 666)
   ```
   border: 1px solid rgba(147, 51, 234, 0.2);
   ```

61. **RGBA**: `rgba(147, 51, 234, 0.3)` (라인 667)
   ```
   box-shadow: 0 8px 32px 0 rgba(147, 51, 234, 0.3);
   ```

62. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 671)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

63. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 674)
   ```
   border: 1px solid rgba(34, 197, 94, 0.2);
   ```

64. **RGBA**: `rgba(34, 197, 94, 0.3)` (라인 675)
   ```
   box-shadow: 0 8px 32px 0 rgba(34, 197, 94, 0.3);
   ```

65. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 679)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

66. **RGBA**: `rgba(239, 68, 68, 0.2)` (라인 682)
   ```
   border: 1px solid rgba(239, 68, 68, 0.2);
   ```

67. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 683)
   ```
   box-shadow: 0 8px 32px 0 rgba(239, 68, 68, 0.3);
   ```

68. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 688)
   ```
   background: rgba(0, 0, 0, 0.25);
   ```

69. **RGBA**: `rgba(255, 255, 255, 0.125)` (라인 691)
   ```
   border: 1px solid rgba(255, 255, 255, 0.125);
   ```

70. **RGBA**: `rgba(0, 0, 0, 0.37)` (라인 692)
   ```
   box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
   ```

71. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 697)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

72. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 700)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

73. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 710)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

74. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 711)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

75. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 713)
   ```
   box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
   ```

76. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 718)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

77. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 721)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

78. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 724)
   ```
   box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

79. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 729)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

80. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 732)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

81. **RGBA**: `rgba(31, 38, 135, 0.6)` (라인 734)
   ```
   box-shadow: 0 20px 60px 0 rgba(31, 38, 135, 0.6);
   ```

82. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 739)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

83. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 742)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

84. **RGBA**: `rgba(31, 38, 135, 0.3)` (라인 743)
   ```
   box-shadow: 0 4px 20px 0 rgba(31, 38, 135, 0.3);
   ```

85. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 771)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

86. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 772)
   ```
   border: 1px solid rgba(255, 255, 255, 0.9);
   ```

---

### 📁 `frontend/src/pages/IOSCardSample.css` (CSS)

**하드코딩 색상**: 85개

1. **HEX_6**: `#f5f7fa` (라인 5)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 5)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#1d1d1f` (라인 26)
   ```
   color: #1d1d1f;
   ```

4. **HEX_6**: `#86868b` (라인 33)
   ```
   color: #86868b;
   ```

5. **HEX_6**: `#1d1d1f` (라인 45)
   ```
   color: #1d1d1f;
   ```

6. **HEX_6**: `#1a1a1a` (라인 112)
   ```
   color: #1a1a1a;
   ```

7. **HEX_6**: `#1a1a1a` (라인 222)
   ```
   color: #1a1a1a;
   ```

8. **HEX_6**: `#1a1a1a` (라인 294)
   ```
   color: #1a1a1a;
   ```

9. **HEX_6**: `#2e7d32` (라인 327)
   ```
   color: #2e7d32;
   ```

10. **HEX_6**: `#c62828` (라인 333)
   ```
   color: #c62828;
   ```

11. **HEX_6**: `#1a1a1a` (라인 416)
   ```
   color: #1a1a1a;
   ```

12. **HEX_6**: `#ff2d92` (라인 435)
   ```
   .management-icon.finance { background: #ff2d92; }
   ```

13. **HEX_6**: `#bf5af2` (라인 436)
   ```
   .management-icon.reports { background: #bf5af2; }
   ```

14. **HEX_6**: `#2e7d32` (라인 448)
   ```
   color: #2e7d32;
   ```

15. **HEX_6**: `#f57c00` (라인 466)
   ```
   color: #f57c00;
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 16)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 76)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 83)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 90)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 96)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.6);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 97)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 101)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 102)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

24. **RGBA**: `rgba(26, 26, 26, 0.7)` (라인 120)
   ```
   color: rgba(26, 26, 26, 0.7);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 123)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 139)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

27. **RGBA**: `rgba(26, 26, 26, 0.8)` (라인 147)
   ```
   color: rgba(26, 26, 26, 0.8);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 151)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

29. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 155)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

30. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 156)
   ```
   border-top: 1px solid rgba(255, 255, 255, 0.2);
   ```

31. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 192)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

32. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 201)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 203)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

34. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 204)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

35. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 208)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

36. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 210)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

37. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 214)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

38. **RGBA**: `rgba(26, 26, 26, 0.8)` (라인 215)
   ```
   color: rgba(26, 26, 26, 0.8);
   ```

39. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 216)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

40. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 221)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

41. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 229)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

42. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 236)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

43. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 253)
   ```
   rgba(102, 126, 234, 0.8),
   ```

44. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 254)
   ```
   rgba(118, 75, 162, 0.8));
   ```

45. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 259)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

46. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 265)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.6);
   ```

47. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 280)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

48. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 283)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

49. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 288)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
   ```

50. **RGBA**: `rgba(26, 26, 26, 0.7)` (라인 302)
   ```
   color: rgba(26, 26, 26, 0.7);
   ```

51. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 307)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

52. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 321)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

53. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 326)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

54. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 328)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

55. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 332)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

56. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 334)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

57. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 339)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

58. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 346)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

59. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 363)
   ```
   rgba(102, 126, 234, 0.8),
   ```

60. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 364)
   ```
   rgba(118, 75, 162, 0.8));
   ```

61. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 375)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

62. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 381)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.6);
   ```

63. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 382)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

64. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 386)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

65. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 387)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

66. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 403)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
   ```

67. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 405)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

68. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 410)
   ```
   box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
   ```

69. **RGBA**: `rgba(26, 26, 26, 0.7)` (라인 424)
   ```
   color: rgba(26, 26, 26, 0.7);
   ```

70. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 427)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

71. **RGBA**: `rgba(40, 167, 69, 0.15)` (라인 440)
   ```
   background: rgba(40, 167, 69, 0.15);
   ```

72. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 441)
   ```
   border: 1px solid rgba(40, 167, 69, 0.3);
   ```

73. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 443)
   ```
   0 8px 32px rgba(40, 167, 69, 0.1),
   ```

74. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 444)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

75. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 453)
   ```
   background: rgba(40, 167, 69, 0.1);
   ```

76. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 454)
   ```
   border-bottom-color: rgba(40, 167, 69, 0.2);
   ```

77. **RGBA**: `rgba(255, 193, 7, 0.15)` (라인 458)
   ```
   background: rgba(255, 193, 7, 0.15);
   ```

78. **RGBA**: `rgba(255, 193, 7, 0.3)` (라인 459)
   ```
   border: 1px solid rgba(255, 193, 7, 0.3);
   ```

79. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 461)
   ```
   0 8px 32px rgba(255, 193, 7, 0.1),
   ```

80. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 462)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

81. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 471)
   ```
   background: rgba(255, 193, 7, 0.1);
   ```

82. **RGBA**: `rgba(255, 193, 7, 0.2)` (라인 472)
   ```
   border-bottom-color: rgba(255, 193, 7, 0.2);
   ```

83. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 477)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

84. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 478)
   ```
   border: 1px solid rgba(0, 122, 255, 0.3);
   ```

85. **RGBA**: `rgba(0, 122, 255, 0.8)` (라인 495)
   ```
   color: rgba(0, 122, 255, 0.8);
   ```

---

### 📁 `frontend/src/styles/common/variables.css` (CSS)

**하드코딩 색상**: 83개

1. **HEX_6**: `#B8E6B8` (라인 8)
   ```
   --color-primary: #B8E6B8;        /* 부드러운 민트 그린 */
   ```

2. **HEX_6**: `#D4F0D4` (라인 9)
   ```
   --color-primary-light: #D4F0D4;  /* 밝은 민트 */
   ```

3. **HEX_6**: `#9CD69C` (라인 10)
   ```
   --color-primary-dark: #9CD69C;   /* 진한 민트 */
   ```

4. **HEX_6**: `#7c8ef0` (라인 22)
   ```
   --dashboard-consultant-primary-light: #7c8ef0;
   ```

5. **HEX_6**: `#5a67d8` (라인 23)
   ```
   --dashboard-consultant-primary-dark: #5a67d8;
   ```

6. **HEX_6**: `#A8E6A8` (라인 26)
   ```
   --dashboard-client-primary: #A8E6A8;        /* 연한 연두색 */
   ```

7. **HEX_6**: `#C4F0C4` (라인 27)
   ```
   --dashboard-client-primary-light: #C4F0C4;  /* 밝은 연두색 */
   ```

8. **HEX_6**: `#8CD68C` (라인 28)
   ```
   --dashboard-client-primary-dark: #8CD68C;   /* 진한 연두색 */
   ```

9. **HEX_6**: `#FFB3BA` (라인 31)
   ```
   --color-secondary: #FFB3BA;      /* 부드러운 파스텔 핑크 */
   ```

10. **HEX_6**: `#FFD1D6` (라인 32)
   ```
   --color-secondary-light: #FFD1D6; /* 밝은 파스텔 핑크 */
   ```

11. **HEX_6**: `#FF9AA2` (라인 33)
   ```
   --color-secondary-dark: #FF9AA2;  /* 진한 파스텔 핑크 */
   ```

12. **HEX_6**: `#B8D4FF` (라인 36)
   ```
   --color-accent: #B8D4FF;         /* 부드러운 파스텔 블루 */
   ```

13. **HEX_6**: `#D4E6FF` (라인 37)
   ```
   --color-accent-light: #D4E6FF;   /* 밝은 파스텔 블루 */
   ```

14. **HEX_6**: `#9CC2FF` (라인 38)
   ```
   --color-accent-dark: #9CC2FF;    /* 진한 파스텔 블루 */
   ```

15. **HEX_6**: `#FFE5B3` (라인 41)
   ```
   --color-tertiary: #FFE5B3;       /* 부드러운 파스텔 옐로우 */
   ```

16. **HEX_6**: `#FFF0D4` (라인 42)
   ```
   --color-tertiary-light: #FFF0D4; /* 밝은 파스텔 옐로우 */
   ```

17. **HEX_6**: `#FFD699` (라인 43)
   ```
   --color-tertiary-dark: #FFD699;  /* 진한 파스텔 옐로우 */
   ```

18. **HEX_6**: `#F0F0F0` (라인 46)
   ```
   --color-neutral: #F0F0F0;        /* 매우 연한 그레이 */
   ```

19. **HEX_6**: `#F8F8F8` (라인 47)
   ```
   --color-neutral-light: #F8F8F8;  /* 거의 흰색 */
   ```

20. **HEX_6**: `#FAFAFA` (라인 51)
   ```
   --color-background: #FAFAFA;     /* 매우 연한 크림 */
   ```

21. **HEX_6**: `#4A4A4A` (라인 56)
   ```
   --color-text-primary: #4A4A4A;   /* 진한 그레이 */
   ```

22. **HEX_6**: `#6B6B6B` (라인 57)
   ```
   --color-text-secondary: #6B6B6B; /* 중간 그레이 */
   ```

23. **HEX_6**: `#9B9B9B` (라인 58)
   ```
   --color-text-muted: #9B9B9B;     /* 연한 그레이 */
   ```

24. **HEX_6**: `#C8E6C9` (라인 62)
   ```
   --color-success: #C8E6C9;        /* 부드러운 그린 */
   ```

25. **HEX_6**: `#FFE0B2` (라인 63)
   ```
   --color-warning: #FFE0B2;        /* 부드러운 오렌지 */
   ```

26. **HEX_6**: `#FFCDD2` (라인 64)
   ```
   --color-error: #FFCDD2;          /* 부드러운 레드 */
   ```

27. **HEX_6**: `#BBDEFB` (라인 65)
   ```
   --color-info: #BBDEFB;           /* 부드러운 블루 */
   ```

28. **HEX_6**: `#FEF2F2` (라인 68)
   ```
   --color-red-50: #FEF2F2;
   ```

29. **HEX_6**: `#FECACA` (라인 69)
   ```
   --color-red-200: #FECACA;
   ```

30. **HEX_6**: `#DC2626` (라인 71)
   ```
   --color-red-600: #DC2626;
   ```

31. **HEX_6**: `#B91C1C` (라인 72)
   ```
   --color-red-700: #B91C1C;
   ```

32. **HEX_6**: `#2d3748` (라인 90)
   ```
   --toast-dark-bg: #2d3748;
   ```

33. **HEX_6**: `#e2e8f0` (라인 91)
   ```
   --toast-dark-color: #e2e8f0;
   ```

34. **HEX_6**: `#e2e8f0` (라인 92)
   ```
   --toast-dark-message-color: #e2e8f0;
   ```

35. **HEX_6**: `#a0aec0` (라인 93)
   ```
   --toast-dark-close-color: #a0aec0;
   ```

36. **HEX_6**: `#4a5568` (라인 94)
   ```
   --toast-dark-close-hover-bg: #4a5568;
   ```

37. **HEX_6**: `#e2e8f0` (라인 95)
   ```
   --toast-dark-close-hover-color: #e2e8f0;
   ```

38. **HEX_6**: `#6B7280` (라인 172)
   ```
   --toast-message-color: #6B7280;  /* 회색 글자색상으로 통일 */
   ```

39. **HEX_6**: `#0056b3` (라인 190)
   ```
   --toast-progress-bar-bg: linear-gradient(90deg, var(--mg-primary-500), #0056b3);
   ```

40. **HEX_6**: `#1e7e34` (라인 191)
   ```
   --toast-success-progress-bg: linear-gradient(90deg, var(--mg-success-500), #1e7e34);
   ```

41. **HEX_6**: `#c82333` (라인 192)
   ```
   --toast-error-progress-bg: linear-gradient(90deg, var(--mg-error-500), #c82333);
   ```

42. **HEX_6**: `#e0a800` (라인 193)
   ```
   --toast-warning-progress-bg: linear-gradient(90deg, var(--mg-warning-500), #e0a800);
   ```

43. **HEX_6**: `#138496` (라인 194)
   ```
   --toast-info-progress-bg: linear-gradient(90deg, var(--mg-info-500), #138496);
   ```

44. **HEX_6**: `#059669` (라인 195)
   ```
   --toast-system-progress-bg: linear-gradient(90deg, var(--mg-success-500), #059669);  /* 시스템은 녹색 사용 */
   ```

45. **HEX_6**: `#2d3748` (라인 211)
   ```
   --toast-dark-bg: #2d3748;
   ```

46. **HEX_6**: `#e2e8f0` (라인 212)
   ```
   --toast-dark-color: #e2e8f0;
   ```

47. **HEX_6**: `#e2e8f0` (라인 213)
   ```
   --toast-dark-message-color: #e2e8f0;
   ```

48. **HEX_6**: `#a0aec0` (라인 214)
   ```
   --toast-dark-close-color: #a0aec0;
   ```

49. **HEX_6**: `#4a5568` (라인 215)
   ```
   --toast-dark-close-hover-bg: #4a5568;
   ```

50. **HEX_6**: `#e2e8f0` (라인 216)
   ```
   --toast-dark-close-hover-color: #e2e8f0;
   ```

51. **HEX_6**: `#ff8a80` (라인 251)
   ```
   --transfer-btn-danger-hover-bg: #ff8a80;
   ```

52. **HEX_6**: `#e9ecef` (라인 452)
   ```
   --chart-container-border: #e9ecef;
   ```

53. **HEX_6**: `#2c3e50` (라인 461)
   ```
   --chart-title-color: #2c3e50;
   ```

54. **HEX_6**: `#343a40` (라인 478)
   ```
   --chart-color-dark: #343a40;
   ```

55. **HEX_6**: `#e9ecef` (라인 487)
   ```
   --dashboard-card-border: #e9ecef;
   ```

56. **HEX_6**: `#e9ecef` (라인 495)
   ```
   --dashboard-header-border: #e9ecef;
   ```

57. **HEX_6**: `#2c3e50` (라인 503)
   ```
   --dashboard-title-color: #2c3e50;
   ```

58. **HEX_6**: `#e9ecef` (라인 514)
   ```
   --filter-section-border: #e9ecef;
   ```

59. **HEX_6**: `#495057` (라인 526)
   ```
   --filter-label-color: #495057;
   ```

60. **HEX_6**: `#ced4da` (라인 531)
   ```
   --filter-input-border: #ced4da;
   ```

61. **HEX_6**: `#80bdff` (라인 532)
   ```
   --filter-input-focus-border: #80bdff;
   ```

62. **HEX_6**: `#0056b3` (라인 541)
   ```
   --filter-btn-hover-bg: #0056b3;
   ```

63. **HEX_6**: `#0056b3` (라인 542)
   ```
   --filter-btn-hover-border: #0056b3;
   ```

64. **HEX_6**: `#e9ecef` (라인 549)
   ```
   --table-border: #e9ecef;
   ```

65. **HEX_6**: `#495057` (라인 556)
   ```
   --table-header-color: #495057;
   ```

66. **HEX_6**: `#dee2e6` (라인 559)
   ```
   --table-header-border: #dee2e6;
   ```

67. **HEX_6**: `#dee2e6` (라인 563)
   ```
   --table-cell-border: #dee2e6;
   ```

68. **HEX_6**: `#495057` (라인 564)
   ```
   --table-cell-color: #495057;
   ```

69. **HEX_6**: `#dee2e6` (라인 568)
   ```
   --table-row-border: #dee2e6;
   ```

70. **HEX_6**: `#f8d7da` (라인 576)
   ```
   --error-message-bg: #f8d7da;
   ```

71. **HEX_6**: `#721c24` (라인 577)
   ```
   --error-message-color: #721c24;
   ```

72. **HEX_6**: `#f5c6cb` (라인 578)
   ```
   --error-message-border: #f5c6cb;
   ```

73. **HEX_6**: `#e3f2fd` (라인 603)
   ```
   --card-color-primary-light: #e3f2fd;
   ```

74. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 96)
   ```
   --toast-dark-progress-bg: rgba(255, 255, 255, 0.1);
   ```

75. **RGBA**: `rgba(184, 230, 184, 0.15)` (라인 103)
   ```
   --shadow-soft: 0 2px 8px rgba(184, 230, 184, 0.15);
   ```

76. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 104)
   ```
   --shadow-medium: 0 4px 16px rgba(184, 230, 184, 0.2);
   ```

77. **RGBA**: `rgba(184, 230, 184, 0.25)` (라인 105)
   ```
   --shadow-large: 0 8px 32px rgba(184, 230, 184, 0.25);
   ```

78. **RGBA**: `rgba(184, 230, 184, 0.3)` (라인 106)
   ```
   --shadow-hover: 0 6px 20px rgba(184, 230, 184, 0.3);
   ```

79. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 158)
   ```
   --toast-hover-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
   ```

80. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 217)
   ```
   --toast-dark-progress-bg: rgba(255, 255, 255, 0.1);
   ```

81. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 271)
   ```
   --transfer-form-input-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

82. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 283)
   ```
   --transfer-select-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

83. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 406)
   ```
   --schedule-search-input-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

---

### 📁 `frontend/src/components/test/IntegrationTest.js` (JS)

**하드코딩 색상**: 80개

1. **HEX_6**: `#1f2937` (라인 209)
   ```
   color: '#1f2937',
   ```

2. **HEX_6**: `#6b7280` (라인 229)
   ```
   backgroundColor: '#6b7280',
   ```

3. **HEX_6**: `#4b5563` (라인 242)
   ```
   e.target.style.backgroundColor = '#4b5563';
   ```

4. **HEX_6**: `#6b7280` (라인 246)
   ```
   e.target.style.backgroundColor = '#6b7280';
   ```

5. **HEX_6**: `#e5e7eb` (라인 263)
   ```
   border: '1px solid #e5e7eb'
   ```

6. **HEX_6**: `#1f2937` (라인 269)
   ```
   color: '#1f2937',
   ```

7. **HEX_6**: `#2563eb` (라인 303)
   ```
   e.target.style.backgroundColor = '#2563eb';
   ```

8. **HEX_6**: `#059669` (라인 338)
   ```
   e.target.style.backgroundColor = '#059669';
   ```

9. **HEX_6**: `#6b7280` (라인 357)
   ```
   backgroundColor: '#6b7280',
   ```

10. **HEX_6**: `#4b5563` (라인 373)
   ```
   e.target.style.backgroundColor = '#4b5563';
   ```

11. **HEX_6**: `#6b7280` (라인 379)
   ```
   e.target.style.backgroundColor = '#6b7280';
   ```

12. **HEX_6**: `#dc2626` (라인 408)
   ```
   e.target.style.backgroundColor = '#dc2626';
   ```

13. **HEX_6**: `#e5e7eb` (라인 436)
   ```
   border: '1px solid #e5e7eb',
   ```

14. **HEX_6**: `#e5e7eb` (라인 442)
   ```
   border: '4px solid #e5e7eb',
   ```

15. **HEX_6**: `#6b7280` (라인 452)
   ```
   color: '#6b7280'
   ```

16. **HEX_6**: `#e5e7eb` (라인 465)
   ```
   border: '1px solid #e5e7eb'
   ```

17. **HEX_6**: `#1f2937` (라인 471)
   ```
   color: '#1f2937',
   ```

18. **HEX_6**: `#f0f9ff` (라인 481)
   ```
   backgroundColor: testResults.success ? '#f0f9ff' : '#fef2f2',
   ```

19. **HEX_6**: `#fef2f2` (라인 481)
   ```
   backgroundColor: testResults.success ? '#f0f9ff' : '#fef2f2',
   ```

20. **HEX_6**: `#1f2937` (라인 496)
   ```
   color: '#1f2937'
   ```

21. **HEX_6**: `#6b7280` (라인 515)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

22. **HEX_6**: `#374151` (라인 516)
   ```
   <strong style={{ color: '#374151' }}>시작 시간:</strong> {formatDateTime(testResults.startTime)}
   ```

23. **HEX_6**: `#6b7280` (라인 518)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

24. **HEX_6**: `#374151` (라인 519)
   ```
   <strong style={{ color: '#374151' }}>종료 시간:</strong> {formatDateTime(testResults.endTime)}
   ```

25. **HEX_6**: `#6b7280` (라인 521)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

26. **HEX_6**: `#374151` (라인 522)
   ```
   <strong style={{ color: '#374151' }}>실행 시간:</strong> {testResults.executionTimeMs}ms
   ```

27. **HEX_6**: `#6b7280` (라인 524)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
   ```

28. **HEX_6**: `#374151` (라인 525)
   ```
   <strong style={{ color: '#374151' }}>메시지:</strong> {testResults.message || testResults.errorMessage}
   ```

29. **HEX_6**: `#e5e7eb` (라인 535)
   ```
   border: '1px solid #e5e7eb'
   ```

30. **HEX_6**: `#1f2937` (라인 541)
   ```
   color: '#1f2937'
   ```

31. **HEX_6**: `#f0f9ff` (라인 551)
   ```
   backgroundColor: result.success ? '#f0f9ff' : '#fef2f2',
   ```

32. **HEX_6**: `#fef2f2` (라인 551)
   ```
   backgroundColor: result.success ? '#f0f9ff' : '#fef2f2',
   ```

33. **HEX_6**: `#1f2937` (라인 565)
   ```
   color: '#1f2937'
   ```

34. **HEX_6**: `#6b7280` (라인 582)
   ```
   color: '#6b7280'
   ```

35. **HEX_6**: `#9ca3af` (라인 586)
   ```
   color: '#9ca3af'
   ```

36. **HEX_6**: `#e5e7eb` (라인 606)
   ```
   border: '1px solid #e5e7eb'
   ```

37. **HEX_6**: `#1f2937` (라인 612)
   ```
   color: '#1f2937',
   ```

38. **HEX_6**: `#f0f9ff` (라인 622)
   ```
   backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? '#f0f9ff' : '#fef2f2',
   ```

39. **HEX_6**: `#fef2f2` (라인 622)
   ```
   backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? '#f0f9ff' : '#fef2f2',
   ```

40. **HEX_6**: `#1f2937` (라인 637)
   ```
   color: '#1f2937'
   ```

41. **HEX_6**: `#6b7280` (라인 656)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

42. **HEX_6**: `#374151` (라인 657)
   ```
   <strong style={{ color: '#374151' }}>확인 시간:</strong> {formatDateTime(healthStatus.timestamp)}
   ```

43. **HEX_6**: `#6b7280` (라인 659)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

44. **HEX_6**: `#374151` (라인 660)
   ```
   <strong style={{ color: '#374151' }}>사용자 수:</strong> {healthStatus.userCount}
   ```

45. **HEX_6**: `#6b7280` (라인 662)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
   ```

46. **HEX_6**: `#374151` (라인 663)
   ```
   <strong style={{ color: '#374151' }}>메시지:</strong> {healthStatus.message}
   ```

47. **HEX_6**: `#e5e7eb` (라인 672)
   ```
   border: '1px solid #e5e7eb'
   ```

48. **HEX_6**: `#1f2937` (라인 678)
   ```
   color: '#1f2937'
   ```

49. **HEX_6**: `#e5e7eb` (라인 701)
   ```
   border: '1px solid #e5e7eb'
   ```

50. **HEX_6**: `#374151` (라인 706)
   ```
   color: '#374151'
   ```

51. **HEX_6**: `#e5e7eb` (라인 734)
   ```
   border: '1px solid #e5e7eb'
   ```

52. **HEX_6**: `#1f2937` (라인 740)
   ```
   color: '#1f2937',
   ```

53. **HEX_6**: `#f0f9ff` (라인 750)
   ```
   backgroundColor: performanceResults.success ? '#f0f9ff' : '#fef2f2',
   ```

54. **HEX_6**: `#fef2f2` (라인 750)
   ```
   backgroundColor: performanceResults.success ? '#f0f9ff' : '#fef2f2',
   ```

55. **HEX_6**: `#1f2937` (라인 765)
   ```
   color: '#1f2937'
   ```

56. **HEX_6**: `#6b7280` (라인 786)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

57. **HEX_6**: `#374151` (라인 787)
   ```
   <strong style={{ color: '#374151' }}>평균 응답 시간:</strong> {performanceResults.averageResponseTime?.toFixed(2)}ms
   ```

58. **HEX_6**: `#6b7280` (라인 789)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

59. **HEX_6**: `#374151` (라인 790)
   ```
   <strong style={{ color: '#374151' }}>최대 응답 시간:</strong> {performanceResults.maxResponseTime}ms
   ```

60. **HEX_6**: `#6b7280` (라인 792)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

61. **HEX_6**: `#374151` (라인 793)
   ```
   <strong style={{ color: '#374151' }}>최소 응답 시간:</strong> {performanceResults.minResponseTime}ms
   ```

62. **HEX_6**: `#e5e7eb` (라인 801)
   ```
   border: '1px solid #e5e7eb'
   ```

63. **HEX_6**: `#1f2937` (라인 807)
   ```
   color: '#1f2937'
   ```

64. **HEX_6**: `#e5e7eb` (라인 819)
   ```
   border: '1px solid #e5e7eb',
   ```

65. **HEX_6**: `#374151` (라인 821)
   ```
   color: '#374151',
   ```

66. **HEX_6**: `#6b7280` (라인 832)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

67. **HEX_6**: `#374151` (라인 833)
   ```
   <strong style={{ color: '#374151' }}>오류:</strong> {performanceResults.error}
   ```

68. **HEX_6**: `#e5e7eb` (라인 849)
   ```
   border: '1px solid #e5e7eb'
   ```

69. **HEX_6**: `#1f2937` (라인 855)
   ```
   color: '#1f2937',
   ```

70. **HEX_6**: `#f0f9ff` (라인 865)
   ```
   backgroundColor: securityResults.success ? '#f0f9ff' : '#fef2f2',
   ```

71. **HEX_6**: `#fef2f2` (라인 865)
   ```
   backgroundColor: securityResults.success ? '#f0f9ff' : '#fef2f2',
   ```

72. **HEX_6**: `#1f2937` (라인 880)
   ```
   color: '#1f2937'
   ```

73. **HEX_6**: `#e5e7eb` (라인 906)
   ```
   border: '1px solid #e5e7eb'
   ```

74. **HEX_6**: `#374151` (라인 908)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

75. **HEX_6**: `#e5e7eb` (라인 929)
   ```
   border: '1px solid #e5e7eb'
   ```

76. **HEX_6**: `#374151` (라인 931)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

77. **HEX_6**: `#e5e7eb` (라인 952)
   ```
   border: '1px solid #e5e7eb',
   ```

78. **HEX_6**: `#374151` (라인 955)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

79. **HEX_6**: `#6b7280` (라인 972)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

80. **HEX_6**: `#374151` (라인 973)
   ```
   <strong style={{ color: '#374151' }}>오류:</strong> {securityResults.error}
   ```

---

### 📁 `frontend/src/styles/00-core/_variables.css` (CSS)

**하드코딩 색상**: 70개

1. **HEX_6**: `#FFD700` (라인 148)
   ```
   --gradient-gold-start: #FFD700;
   ```

2. **HEX_6**: `#FFA500` (라인 149)
   ```
   --gradient-gold-end: #FFA500;
   ```

3. **HEX_6**: `#87CEEB` (라인 153)
   ```
   --gradient-sky-start: #87CEEB;
   ```

4. **HEX_6**: `#B0E0E6` (라인 154)
   ```
   --gradient-sky-end: #B0E0E6;
   ```

5. **HEX_6**: `#98D8C8` (라인 158)
   ```
   --gradient-mint-start: #98D8C8;
   ```

6. **HEX_6**: `#B4E7CE` (라인 159)
   ```
   --gradient-mint-end: #B4E7CE;
   ```

7. **HEX_6**: `#FFB6C1` (라인 163)
   ```
   --gradient-pink-start: #FFB6C1;
   ```

8. **HEX_6**: `#FFC0CB` (라인 164)
   ```
   --gradient-pink-end: #FFC0CB;
   ```

9. **HEX_6**: `#FF6B9D` (라인 168)
   ```
   --gradient-peach-start: #FF6B9D;
   ```

10. **HEX_6**: `#FFA5C0` (라인 169)
   ```
   --gradient-peach-end: #FFA5C0;
   ```

11. **HEX_6**: `#B8B8D0` (라인 173)
   ```
   --gradient-gray-start: #B8B8D0;
   ```

12. **HEX_6**: `#D0D0E8` (라인 174)
   ```
   --gradient-gray-end: #D0D0E8;
   ```

13. **HEX_6**: `#fbbf24` (라인 200)
   ```
   --status-requested: #fbbf24;      /* 상담 요청 - 노란색 */
   ```

14. **HEX_6**: `#059669` (라인 204)
   ```
   --status-completed: #059669;      /* 완료 - 진한 초록 */
   ```

15. **HEX_6**: `#f97316` (라인 206)
   ```
   --status-no-show: #f97316;        /* 노쇼 - 주황색 */
   ```

16. **HEX_6**: `#fbbf24` (라인 209)
   ```
   --payment-pending: #fbbf24;       /* 대기 - 노란색 */
   ```

17. **HEX_6**: `#6b7280` (라인 212)
   ```
   --payment-refunded: #6b7280;      /* 환불 - 회색 */
   ```

18. **HEX_6**: `#6b7280` (라인 216)
   ```
   --user-inactive: #6b7280;         /* 비활성 - 회색 */
   ```

19. **HEX_6**: `#fbbf24` (라인 218)
   ```
   --user-pending: #fbbf24;          /* 대기 - 노란색 */
   ```

20. **HEX_6**: `#cd7f32` (라인 221)
   ```
   --grade-junior: #cd7f32;          /* 주니어 - 브론즈 */
   ```

21. **HEX_6**: `#c0c0c0` (라인 222)
   ```
   --grade-senior: #c0c0c0;          /* 시니어 - 실버 */
   ```

22. **HEX_6**: `#ffd700` (라인 223)
   ```
   --grade-expert: #ffd700;          /* 전문가 - 골드 */
   ```

23. **HEX_6**: `#e5e4e2` (라인 224)
   ```
   --grade-master: #e5e4e2;          /* 마스터 - 플래티넘 */
   ```

24. **HEX_6**: `#6b7280` (라인 227)
   ```
   --role-client: #6b7280;           /* 내담자 - 회색 */
   ```

25. **HEX_6**: `#ec4899` (라인 238)
   ```
   --vacation-maternity: #ec4899;    /* 출산 - 핑크 */
   ```

26. **HEX_6**: `#06b6d4` (라인 239)
   ```
   --vacation-paternity: #06b6d4;    /* 육아 - 청록색 */
   ```

27. **HEX_6**: `#6b7280` (라인 240)
   ```
   --vacation-other: #6b7280;        /* 기타 - 회색 */
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 106)
   ```
   --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 107)
   ```
   --shadow-sm: 0 1px 3px 0 var(--mg-shadow-light), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 108)
   ```
   --shadow-md: 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 109)
   ```
   --shadow-lg: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 110)
   ```
   --shadow-xl: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 111)
   ```
   --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 112)
   ```
   --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
   ```

35. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 115)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

36. **RGBA**: `rgba(31, 38, 135, 0.6)` (라인 116)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.6);
   ```

37. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 178)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

38. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 178)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

39. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 179)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

40. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 179)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

41. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 180)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

42. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 180)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

43. **RGBA**: `rgba(230, 245, 255, 0.5)` (라인 181)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

44. **RGBA**: `rgba(240, 250, 255, 0.5)` (라인 181)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

45. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 184)
   ```
   --border-pink-light: rgba(255, 182, 193, 0.2);
   ```

46. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 185)
   ```
   --border-pink-medium: rgba(255, 182, 193, 0.4);
   ```

47. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 186)
   ```
   --border-sky-light: rgba(135, 206, 235, 0.2);
   ```

48. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 189)
   ```
   --shadow-gold: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

49. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 190)
   ```
   --shadow-gold-sm: 0 2px 8px rgba(255, 215, 0, 0.3);
   ```

50. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 191)
   ```
   --shadow-sky: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

51. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 192)
   ```
   --shadow-sky-sm: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

52. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 193)
   ```
   --shadow-mint-sm: 0 2px 8px rgba(152, 216, 200, 0.3);
   ```

53. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 194)
   ```
   --shadow-pink-sm: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

54. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 195)
   ```
   --shadow-peach: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

55. **RGBA**: `rgba(251, 191, 36, 0.1)` (라인 243)
   ```
   --status-requested-bg: rgba(251, 191, 36, 0.1);
   ```

56. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 244)
   ```
   --status-assigned-bg: rgba(139, 92, 246, 0.1);
   ```

57. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 245)
   ```
   --status-confirmed-bg: rgba(59, 130, 246, 0.1);
   ```

58. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 246)
   ```
   --status-in-progress-bg: rgba(16, 185, 129, 0.1);
   ```

59. **RGBA**: `rgba(5, 150, 105, 0.1)` (라인 247)
   ```
   --status-completed-bg: rgba(5, 150, 105, 0.1);
   ```

60. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 248)
   ```
   --status-cancelled-bg: rgba(239, 68, 68, 0.1);
   ```

61. **RGBA**: `rgba(205, 127, 50, 0.1)` (라인 250)
   ```
   --grade-junior-bg: rgba(205, 127, 50, 0.1);
   ```

62. **RGBA**: `rgba(192, 192, 192, 0.1)` (라인 251)
   ```
   --grade-senior-bg: rgba(192, 192, 192, 0.1);
   ```

63. **RGBA**: `rgba(255, 215, 0, 0.1)` (라인 252)
   ```
   --grade-expert-bg: rgba(255, 215, 0, 0.1);
   ```

64. **RGBA**: `rgba(229, 228, 226, 0.1)` (라인 253)
   ```
   --grade-master-bg: rgba(229, 228, 226, 0.1);
   ```

65. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 255)
   ```
   --role-client-bg: rgba(107, 114, 128, 0.1);
   ```

66. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 256)
   ```
   --role-consultant-bg: rgba(139, 92, 246, 0.1);
   ```

67. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 257)
   ```
   --role-admin-bg: rgba(59, 130, 246, 0.1);
   ```

68. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 259)
   ```
   --vacation-annual-bg: rgba(59, 130, 246, 0.1);
   ```

69. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 260)
   ```
   --vacation-sick-bg: rgba(239, 68, 68, 0.1);
   ```

70. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 261)
   ```
   --vacation-personal-bg: rgba(139, 92, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/TenantCodeManagement.css` (CSS)

**하드코딩 색상**: 64개

1. **HEX_6**: `#d1fae5` (라인 21)
   ```
   --tenant-light: var(--mg-color-success-100, #d1fae5);
   ```

2. **HEX_6**: `#a7f3d0` (라인 22)
   ```
   --tenant-border: var(--mg-color-success-300, #a7f3d0);
   ```

3. **HEX_6**: `#065f46` (라인 23)
   ```
   --tenant-text: var(--mg-color-success-800, #065f46);
   ```

4. **HEX_6**: `#fef3c7` (라인 27)
   ```
   --core-light: var(--mg-color-warning-100, #fef3c7);
   ```

5. **HEX_6**: `#fde68a` (라인 28)
   ```
   --core-border: var(--mg-color-warning-300, #fde68a);
   ```

6. **HEX_6**: `#92400e` (라인 29)
   ```
   --core-text: var(--mg-color-warning-800, #92400e);
   ```

7. **HEX_6**: `#d1fae5` (라인 32)
   ```
   --status-active-bg: var(--mg-color-success-100, #d1fae5);
   ```

8. **HEX_6**: `#065f46` (라인 33)
   ```
   --status-active-text: var(--mg-color-success-800, #065f46);
   ```

9. **HEX_6**: `#fee2e2` (라인 34)
   ```
   --status-inactive-bg: var(--mg-color-error-100, #fee2e2);
   ```

10. **HEX_6**: `#991b1b` (라인 35)
   ```
   --status-inactive-text: var(--mg-color-error-800, #991b1b);
   ```

11. **HEX_6**: `#f9fafb` (라인 39)
   ```
   --tenant-surface: var(--mg-color-gray-50, #f9fafb);
   ```

12. **HEX_6**: `#e5e7eb` (라인 40)
   ```
   --tenant-border-default: var(--mg-color-gray-200, #e5e7eb);
   ```

13. **HEX_6**: `#d1d5db` (라인 41)
   ```
   --tenant-border-hover: var(--mg-color-gray-300, #d1d5db);
   ```

14. **HEX_6**: `#1f2937` (라인 42)
   ```
   --tenant-text-primary: var(--mg-color-gray-900, #1f2937);
   ```

15. **HEX_6**: `#6b7280` (라인 43)
   ```
   --tenant-text-secondary: var(--mg-color-gray-600, #6b7280);
   ```

16. **HEX_6**: `#9ca3af` (라인 44)
   ```
   --tenant-text-muted: var(--mg-color-gray-500, #9ca3af);
   ```

17. **HEX_6**: `#eff6ff` (라인 194)
   ```
   background: #eff6ff;
   ```

18. **HEX_6**: `#f3f4f6` (라인 220)
   ```
   background: #f3f4f6;
   ```

19. **HEX_6**: `#f3f4f6` (라인 266)
   ```
   border-top: 1px solid #f3f4f6;
   ```

20. **HEX_6**: `#e5e7eb` (라인 279)
   ```
   border: 1px solid #e5e7eb;
   ```

21. **HEX_6**: `#6b7280` (라인 289)
   ```
   color: #6b7280;
   ```

22. **HEX_6**: `#6b7280` (라인 310)
   ```
   color: #6b7280;
   ```

23. **HEX_6**: `#e5e7eb` (라인 316)
   ```
   border: 2px solid #e5e7eb;
   ```

24. **HEX_6**: `#e5e7eb` (라인 330)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

25. **HEX_6**: `#f9fafb` (라인 331)
   ```
   background: #f9fafb;
   ```

26. **HEX_6**: `#1f2937` (라인 347)
   ```
   color: #1f2937;
   ```

27. **HEX_6**: `#d1fae5` (라인 365)
   ```
   background: #d1fae5;
   ```

28. **HEX_6**: `#a7f3d0` (라인 367)
   ```
   border: 1px solid #a7f3d0;
   ```

29. **HEX_6**: `#fef3c7` (라인 371)
   ```
   background: #fef3c7;
   ```

30. **HEX_6**: `#fde68a` (라인 373)
   ```
   border: 1px solid #fde68a;
   ```

31. **HEX_6**: `#6b7280` (라인 391)
   ```
   color: #6b7280;
   ```

32. **HEX_6**: `#d1d5db` (라인 397)
   ```
   border: 1px solid #d1d5db;
   ```

33. **HEX_6**: `#6b7280` (라인 426)
   ```
   color: #6b7280;
   ```

34. **HEX_6**: `#e5e7eb` (라인 441)
   ```
   border: 1px solid #e5e7eb;
   ```

35. **HEX_6**: `#d1d5db` (라인 449)
   ```
   border-color: #d1d5db;
   ```

36. **HEX_6**: `#f9fafb` (라인 455)
   ```
   background: #f9fafb;
   ```

37. **HEX_6**: `#f3f4f6` (라인 476)
   ```
   background: #f3f4f6;
   ```

38. **HEX_6**: `#374151` (라인 481)
   ```
   color: #374151;
   ```

39. **HEX_6**: `#d1fae5` (라인 494)
   ```
   background: #d1fae5;
   ```

40. **HEX_6**: `#065f46` (라인 495)
   ```
   color: #065f46;
   ```

41. **HEX_6**: `#fee2e2` (라인 499)
   ```
   background: #fee2e2;
   ```

42. **HEX_6**: `#991b1b` (라인 500)
   ```
   color: #991b1b;
   ```

43. **HEX_6**: `#1f2937` (라인 506)
   ```
   color: #1f2937;
   ```

44. **HEX_6**: `#6b7280` (라인 512)
   ```
   color: #6b7280;
   ```

45. **HEX_6**: `#f3f4f6` (라인 523)
   ```
   border-top: 1px solid #f3f4f6;
   ```

46. **HEX_6**: `#6b7280` (라인 531)
   ```
   color: #6b7280;
   ```

47. **HEX_6**: `#e5e7eb` (라인 545)
   ```
   border: 1px solid #e5e7eb;
   ```

48. **HEX_6**: `#6b7280` (라인 548)
   ```
   color: #6b7280;
   ```

49. **HEX_6**: `#d1d5db` (라인 554)
   ```
   border-color: #d1d5db;
   ```

50. **HEX_6**: `#f9fafb` (라인 555)
   ```
   background: #f9fafb;
   ```

51. **HEX_6**: `#e5e7eb` (라인 601)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

52. **HEX_6**: `#1f2937` (라인 610)
   ```
   color: #1f2937;
   ```

53. **HEX_6**: `#6b7280` (라인 619)
   ```
   color: #6b7280;
   ```

54. **HEX_6**: `#f3f4f6` (라인 625)
   ```
   background: #f3f4f6;
   ```

55. **HEX_6**: `#374151` (라인 626)
   ```
   color: #374151;
   ```

56. **HEX_6**: `#374151` (라인 651)
   ```
   color: #374151;
   ```

57. **HEX_6**: `#d1d5db` (라인 658)
   ```
   border: 1px solid #d1d5db;
   ```

58. **HEX_6**: `#e5e7eb` (라인 687)
   ```
   border-top: 1px solid #e5e7eb;
   ```

59. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 122)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

60. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 129)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

61. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 189)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

62. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 195)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

63. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 406)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

64. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 667)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantClientList.css` (CSS)

**하드코딩 색상**: 60개

1. **HEX_3**: `#666` (라인 125)
   ```
   color: #666;
   ```

2. **HEX_6**: `#2c3e50` (라인 38)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#3498db` (라인 47)
   ```
   color: #3498db;
   ```

4. **HEX_6**: `#7f8c8d` (라인 51)
   ```
   color: #7f8c8d;
   ```

5. **HEX_6**: `#e9ecef` (라인 67)
   ```
   border: 1px solid #e9ecef;
   ```

6. **HEX_6**: `#7f8c8d` (라인 84)
   ```
   color: #7f8c8d;
   ```

7. **HEX_6**: `#e9ecef` (라인 92)
   ```
   border: 2px solid #e9ecef;
   ```

8. **HEX_6**: `#2c3e50` (라인 97)
   ```
   color: #2c3e50;
   ```

9. **HEX_6**: `#3498db` (라인 102)
   ```
   border-color: #3498db;
   ```

10. **HEX_6**: `#e9ecef` (라인 133)
   ```
   border: 2px solid #e9ecef;
   ```

11. **HEX_6**: `#2c3e50` (라인 139)
   ```
   color: #2c3e50;
   ```

12. **HEX_6**: `#3498db` (라인 156)
   ```
   border-color: #3498db;
   ```

13. **HEX_6**: `#3498db` (라인 163)
   ```
   border-color: #3498db;
   ```

14. **HEX_6**: `#7f8c8d` (라인 181)
   ```
   color: #7f8c8d;
   ```

15. **HEX_6**: `#7f8c8d` (라인 212)
   ```
   color: #7f8c8d;
   ```

16. **HEX_6**: `#2c3e50` (라인 223)
   ```
   color: #2c3e50;
   ```

17. **HEX_6**: `#e9ecef` (라인 246)
   ```
   border: 1px solid #e9ecef;
   ```

18. **HEX_6**: `#3498db` (라인 256)
   ```
   border-color: #3498db;
   ```

19. **HEX_6**: `#e9ecef` (라인 264)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

20. **HEX_6**: `#e9ecef` (라인 265)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

21. **HEX_6**: `#d4edda` (라인 308)
   ```
   background: #d4edda;
   ```

22. **HEX_6**: `#155724` (라인 309)
   ```
   color: #155724;
   ```

23. **HEX_6**: `#f8d7da` (라인 313)
   ```
   background: #f8d7da;
   ```

24. **HEX_6**: `#721c24` (라인 314)
   ```
   color: #721c24;
   ```

25. **HEX_6**: `#fff3cd` (라인 318)
   ```
   background: #fff3cd;
   ```

26. **HEX_6**: `#856404` (라인 319)
   ```
   color: #856404;
   ```

27. **HEX_6**: `#d1ecf1` (라인 323)
   ```
   background: #d1ecf1;
   ```

28. **HEX_6**: `#0c5460` (라인 324)
   ```
   color: #0c5460;
   ```

29. **HEX_6**: `#f8d7da` (라인 328)
   ```
   background: #f8d7da;
   ```

30. **HEX_6**: `#721c24` (라인 329)
   ```
   color: #721c24;
   ```

31. **HEX_6**: `#2c3e50` (라인 342)
   ```
   color: #2c3e50;
   ```

32. **HEX_6**: `#2c3e50` (라인 367)
   ```
   color: #2c3e50;
   ```

33. **HEX_6**: `#3498db` (라인 372)
   ```
   color: #3498db;
   ```

34. **HEX_6**: `#e9ecef` (라인 379)
   ```
   border-top: 1px solid #e9ecef;
   ```

35. **HEX_6**: `#e9ecef` (라인 380)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

36. **HEX_6**: `#3498db` (라인 395)
   ```
   border: 2px solid #3498db;
   ```

37. **HEX_6**: `#3498db` (라인 397)
   ```
   color: #3498db;
   ```

38. **HEX_6**: `#3498db` (라인 403)
   ```
   background: #3498db;
   ```

39. **HEX_6**: `#e9ecef` (라인 444)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

40. **HEX_6**: `#e9ecef` (라인 445)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

41. **HEX_6**: `#2c3e50` (라인 452)
   ```
   color: #2c3e50;
   ```

42. **HEX_6**: `#3498db` (라인 460)
   ```
   color: #3498db;
   ```

43. **HEX_6**: `#e9ecef` (라인 480)
   ```
   background: #e9ecef;
   ```

44. **HEX_6**: `#2c3e50` (라인 481)
   ```
   color: #2c3e50;
   ```

45. **HEX_6**: `#2c3e50` (라인 508)
   ```
   color: #2c3e50;
   ```

46. **HEX_6**: `#e9ecef` (라인 514)
   ```
   border: 2px solid #e9ecef;
   ```

47. **HEX_6**: `#3498db` (라인 523)
   ```
   border-color: #3498db;
   ```

48. **HEX_6**: `#e9ecef` (라인 548)
   ```
   border-top: 1px solid #e9ecef;
   ```

49. **HEX_6**: `#3498db` (라인 566)
   ```
   background: #3498db;
   ```

50. **HEX_6**: `#2980b9` (라인 571)
   ```
   background: #2980b9;
   ```

51. **HEX_6**: `#5a6268` (라인 581)
   ```
   background: #5a6268;
   ```

52. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 66)
   ```
   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
   ```

53. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 104)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
   ```

54. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 145)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

55. **RGBA**: `rgba(52, 152, 219, 0.15)` (라인 158)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15), 0 4px 8px var(--mg-shadow-light);
   ```

56. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 243)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

57. **RGBA**: `rgba(52, 152, 219, 0.3)` (라인 406)
   ```
   box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
   ```

58. **RGBA**: `rgba(52, 152, 219, 0.3)` (라인 411)
   ```
   box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
   ```

59. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 432)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

60. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 524)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
   ```

---

### 📁 `frontend/src/components/erp/ErpCommon.css` (CSS)

**하드코딩 색상**: 59개

1. **HEX_6**: `#764ba2` (라인 27)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#2c3e50` (라인 58)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#e9ecef` (라인 82)
   ```
   border: 1px solid #e9ecef;
   ```

4. **HEX_6**: `#764ba2` (라인 103)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

5. **HEX_6**: `#2c3e50` (라인 118)
   ```
   color: #2c3e50;
   ```

6. **HEX_6**: `#e9ecef` (라인 128)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

7. **HEX_6**: `#2c3e50` (라인 134)
   ```
   color: #2c3e50;
   ```

8. **HEX_6**: `#764ba2` (라인 148)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

9. **HEX_6**: `#e9ecef` (라인 174)
   ```
   border: 1px solid #e9ecef;
   ```

10. **HEX_6**: `#2c3e50` (라인 195)
   ```
   color: #2c3e50;
   ```

11. **HEX_6**: `#d4edda` (라인 209)
   ```
   background: #d4edda;
   ```

12. **HEX_6**: `#155724` (라인 210)
   ```
   color: #155724;
   ```

13. **HEX_6**: `#fff3cd` (라인 214)
   ```
   background: #fff3cd;
   ```

14. **HEX_6**: `#856404` (라인 215)
   ```
   color: #856404;
   ```

15. **HEX_6**: `#f8d7da` (라인 219)
   ```
   background: #f8d7da;
   ```

16. **HEX_6**: `#721c24` (라인 220)
   ```
   color: #721c24;
   ```

17. **HEX_6**: `#2c3e50` (라인 271)
   ```
   color: #2c3e50;
   ```

18. **HEX_6**: `#e9ecef` (라인 288)
   ```
   background: #e9ecef;
   ```

19. **HEX_6**: `#764ba2` (라인 295)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

20. **HEX_6**: `#ee5a52` (라인 301)
   ```
   background: linear-gradient(90deg, var(--mg-error-500) 0%, #ee5a52 100%);
   ```

21. **HEX_6**: `#e9ecef` (라인 318)
   ```
   border: 2px dashed #e9ecef;
   ```

22. **HEX_6**: `#dee2e6` (라인 323)
   ```
   color: #dee2e6;
   ```

23. **HEX_6**: `#adb5bd` (라인 334)
   ```
   color: #adb5bd;
   ```

24. **HEX_6**: `#2c3e50` (라인 348)
   ```
   color: #2c3e50;
   ```

25. **HEX_6**: `#e9ecef` (라인 367)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

26. **HEX_6**: `#495057` (라인 386)
   ```
   color: #495057;
   ```

27. **HEX_6**: `#2c3e50` (라인 408)
   ```
   color: #2c3e50;
   ```

28. **HEX_6**: `#e9ecef` (라인 411)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

29. **HEX_6**: `#e9ecef` (라인 425)
   ```
   border: 1px solid #e9ecef;
   ```

30. **HEX_6**: `#2c3e50` (라인 447)
   ```
   color: #2c3e50;
   ```

31. **HEX_6**: `#495057` (라인 477)
   ```
   color: #495057;
   ```

32. **HEX_6**: `#2c3e50` (라인 482)
   ```
   color: #2c3e50;
   ```

33. **HEX_6**: `#495057` (라인 509)
   ```
   color: #495057;
   ```

34. **HEX_6**: `#e9ecef` (라인 513)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

35. **HEX_6**: `#e9ecef` (라인 518)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

36. **HEX_6**: `#d4edda` (라인 537)
   ```
   background-color: #d4edda;
   ```

37. **HEX_6**: `#155724` (라인 538)
   ```
   color: #155724;
   ```

38. **HEX_6**: `#fff3cd` (라인 542)
   ```
   background-color: #fff3cd;
   ```

39. **HEX_6**: `#856404` (라인 543)
   ```
   color: #856404;
   ```

40. **HEX_6**: `#f8d7da` (라인 547)
   ```
   background-color: #f8d7da;
   ```

41. **HEX_6**: `#721c24` (라인 548)
   ```
   color: #721c24;
   ```

42. **HEX_6**: `#d1ecf1` (라인 552)
   ```
   background-color: #d1ecf1;
   ```

43. **HEX_6**: `#0c5460` (라인 553)
   ```
   color: #0c5460;
   ```

44. **HEX_6**: `#fff3cd` (라인 557)
   ```
   background-color: #fff3cd;
   ```

45. **HEX_6**: `#856404` (라인 558)
   ```
   color: #856404;
   ```

46. **HEX_6**: `#d4edda` (라인 562)
   ```
   background-color: #d4edda;
   ```

47. **HEX_6**: `#155724` (라인 563)
   ```
   color: #155724;
   ```

48. **HEX_6**: `#f8d7da` (라인 567)
   ```
   background-color: #f8d7da;
   ```

49. **HEX_6**: `#721c24` (라인 568)
   ```
   color: #721c24;
   ```

50. **HEX_6**: `#d1ecf1` (라인 572)
   ```
   background-color: #d1ecf1;
   ```

51. **HEX_6**: `#0c5460` (라인 573)
   ```
   color: #0c5460;
   ```

52. **HEX_6**: `#d4edda` (라인 577)
   ```
   background-color: #d4edda;
   ```

53. **HEX_6**: `#155724` (라인 578)
   ```
   color: #155724;
   ```

54. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 81)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
   ```

55. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 161)
   ```
   box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
   ```

56. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 173)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
   ```

57. **RGBA**: `rgba(0,0,0,0.1)` (라인 428)
   ```
   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
   ```

58. **RGBA**: `rgba(0,0,0,0.15)` (라인 434)
   ```
   box-shadow: 0 4px 20px rgba(0,0,0,0.15);
   ```

59. **RGBA**: `rgba(0,0,0,0.1)` (라인 498)
   ```
   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/admin/ConsultantComprehensiveManagement.css` (CSS)

**하드코딩 색상**: 57개

1. **HEX_6**: `#f8fafc` (라인 59)
   ```
   background: #f8fafc;
   ```

2. **HEX_6**: `#1f2937` (라인 84)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 93)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#6b7280` (라인 102)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#374151` (라인 111)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#9ca3af` (라인 120)
   ```
   color: #9ca3af;
   ```

7. **HEX_6**: `#6b7280` (라인 126)
   ```
   color: #6b7280;
   ```

8. **HEX_6**: `#2563eb` (라인 158)
   ```
   background: #2563eb;
   ```

9. **HEX_6**: `#dc2626` (라인 168)
   ```
   background: #dc2626;
   ```

10. **HEX_6**: `#f0f9ff` (라인 205)
   ```
   background: #f0f9ff;
   ```

11. **HEX_6**: `#1e40af` (라인 206)
   ```
   color: #1e40af;
   ```

12. **HEX_6**: `#374151` (라인 220)
   ```
   color: #374151;
   ```

13. **HEX_6**: `#9ca3af` (라인 240)
   ```
   color: #9ca3af;
   ```

14. **HEX_6**: `#1f2937` (라인 272)
   ```
   color: #1f2937;
   ```

15. **HEX_6**: `#6b7280` (라인 295)
   ```
   color: #6b7280;
   ```

16. **HEX_6**: `#1f2937` (라인 302)
   ```
   color: #1f2937;
   ```

17. **HEX_6**: `#2563eb` (라인 333)
   ```
   background: #2563eb;
   ```

18. **HEX_6**: `#6b7280` (라인 337)
   ```
   background: #6b7280;
   ```

19. **HEX_6**: `#4b5563` (라인 342)
   ```
   background: #4b5563;
   ```

20. **HEX_6**: `#f8fafc` (라인 350)
   ```
   background: #f8fafc;
   ```

21. **HEX_6**: `#f0f9ff` (라인 386)
   ```
   background: #f0f9ff;
   ```

22. **HEX_6**: `#1f2937` (라인 399)
   ```
   color: #1f2937;
   ```

23. **HEX_6**: `#6b7280` (라인 406)
   ```
   color: #6b7280;
   ```

24. **HEX_6**: `#1f2937` (라인 419)
   ```
   color: #1f2937;
   ```

25. **HEX_6**: `#d1d5db` (라인 431)
   ```
   border: 1px solid #d1d5db;
   ```

26. **HEX_6**: `#9ca3af` (라인 445)
   ```
   color: #9ca3af;
   ```

27. **HEX_6**: `#1f2937` (라인 460)
   ```
   color: #1f2937;
   ```

28. **HEX_6**: `#6b7280` (라인 468)
   ```
   color: #6b7280;
   ```

29. **HEX_6**: `#f3f4f6` (라인 488)
   ```
   background: #f3f4f6;
   ```

30. **HEX_6**: `#6b7280` (라인 489)
   ```
   color: #6b7280;
   ```

31. **HEX_6**: `#2563eb` (라인 502)
   ```
   background: #2563eb;
   ```

32. **HEX_6**: `#1f2937` (라인 514)
   ```
   color: #1f2937;
   ```

33. **HEX_6**: `#6b7280` (라인 521)
   ```
   color: #6b7280;
   ```

34. **HEX_6**: `#2563eb` (라인 551)
   ```
   background: #2563eb;
   ```

35. **HEX_6**: `#6b7280` (라인 555)
   ```
   background: #6b7280;
   ```

36. **HEX_6**: `#4b5563` (라인 560)
   ```
   background: #4b5563;
   ```

37. **HEX_6**: `#1f2937` (라인 634)
   ```
   color: #1f2937;
   ```

38. **HEX_6**: `#6b7280` (라인 644)
   ```
   color: #6b7280;
   ```

39. **HEX_6**: `#374151` (라인 675)
   ```
   color: #374151;
   ```

40. **HEX_6**: `#f0f9ff` (라인 677)
   ```
   background: #f0f9ff;
   ```

41. **HEX_6**: `#e0f2fe` (라인 680)
   ```
   border: 1px solid #e0f2fe;
   ```

42. **HEX_6**: `#374151` (라인 720)
   ```
   color: #374151;
   ```

43. **HEX_6**: `#f0f9ff` (라인 722)
   ```
   background: #f0f9ff;
   ```

44. **HEX_6**: `#e0f2fe` (라인 725)
   ```
   border: 1px solid #e0f2fe;
   ```

45. **HEX_6**: `#9ca3af` (라인 760)
   ```
   color: #9ca3af;
   ```

46. **HEX_6**: `#6b7280` (라인 776)
   ```
   color: #6b7280;
   ```

47. **HEX_6**: `#374151` (라인 782)
   ```
   color: #374151;
   ```

48. **HEX_6**: `#2563eb` (라인 814)
   ```
   background: #2563eb;
   ```

49. **HEX_6**: `#dc2626` (라인 825)
   ```
   background: #dc2626;
   ```

50. **HEX_6**: `#dc2626` (라인 831)
   ```
   background: #dc2626;
   ```

51. **HEX_6**: `#6b7280` (라인 838)
   ```
   color: #6b7280;
   ```

52. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 191)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

53. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 233)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

54. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 441)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

55. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 623)
   ```
   box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
   ```

56. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 816)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
   ```

57. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 827)
   ```
   box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/components/hq/BranchManagement.js` (JS)

**하드코딩 색상**: 57개

1. **HEX_6**: `#e3f2fd` (라인 269)
   ```
   background: selectedBranch?.id === branch.id ? '#e3f2fd' : 'var(--mg-white)',
   ```

2. **HEX_6**: `#e9ecef` (라인 270)
   ```
   borderLeft: selectedBranch?.id === branch.id ? '4px solid var(--mg-primary-500)' : '4px solid #e9ecef',
   ```

3. **HEX_6**: `#e9ecef` (라인 290)
   ```
   e.target.style.borderLeftColor = '#e9ecef';
   ```

4. **HEX_6**: `#495057` (라인 302)
   ```
   color: selectedBranch?.id === branch.id ? 'var(--mg-primary-500)' : '#495057',
   ```

5. **HEX_6**: `#e9ecef` (라인 351)
   ```
   border: '1px solid #e9ecef',
   ```

6. **HEX_6**: `#e9ecef` (라인 358)
   ```
   borderBottom: '1px solid #e9ecef',
   ```

7. **HEX_6**: `#495057` (라인 363)
   ```
   color: '#495057',
   ```

8. **HEX_6**: `#e9ecef` (라인 381)
   ```
   border: '1px solid #e9ecef'
   ```

9. **HEX_6**: `#e9ecef` (라인 406)
   ```
   border: '1px solid #e9ecef'
   ```

10. **HEX_6**: `#e9ecef` (라인 431)
   ```
   border: '1px solid #e9ecef'
   ```

11. **HEX_6**: `#e9ecef` (라인 456)
   ```
   border: '1px solid #e9ecef'
   ```

12. **HEX_6**: `#e9ecef` (라인 481)
   ```
   border: '1px solid #e9ecef'
   ```

13. **HEX_6**: `#e9ecef` (라인 506)
   ```
   border: '1px solid #e9ecef'
   ```

14. **HEX_6**: `#e9ecef` (라인 533)
   ```
   border: '1px solid #e9ecef',
   ```

15. **HEX_6**: `#e9ecef` (라인 540)
   ```
   borderBottom: '1px solid #e9ecef',
   ```

16. **HEX_6**: `#495057` (라인 547)
   ```
   color: '#495057',
   ```

17. **HEX_6**: `#6f42c1` (라인 553)
   ```
   <FaUsers style={{ marginRight: '8px', color: '#6f42c1' }} />
   ```

18. **HEX_6**: `#e9ecef` (라인 598)
   ```
   border: '1px solid #e9ecef'
   ```

19. **HEX_6**: `#ced4da` (라인 605)
   ```
   border: '1px solid #ced4da',
   ```

20. **HEX_6**: `#ced4da` (라인 616)
   ```
   border: '1px solid #ced4da',
   ```

21. **HEX_6**: `#ced4da` (라인 629)
   ```
   border: '1px solid #ced4da',
   ```

22. **HEX_6**: `#495057` (라인 649)
   ```
   color: '#495057'
   ```

23. **HEX_6**: `#b8daff` (라인 681)
   ```
   border: '1px solid #b8daff',
   ```

24. **HEX_6**: `#d1ecf1` (라인 682)
   ```
   background: '#d1ecf1',
   ```

25. **HEX_6**: `#0c5460` (라인 683)
   ```
   color: '#0c5460'
   ```

26. **HEX_6**: `#e9ecef` (라인 691)
   ```
   border: '1px solid #e9ecef',
   ```

27. **HEX_6**: `#dee2e6` (라인 711)
   ```
   <FaUsers style={{ fontSize: '2rem', marginBottom: '12px', color: '#dee2e6' }} />
   ```

28. **HEX_6**: `#e9ecef` (라인 723)
   ```
   borderBottom: '2px solid #e9ecef'
   ```

29. **HEX_6**: `#495057` (라인 730)
   ```
   color: '#495057',
   ```

30. **HEX_6**: `#e9ecef` (라인 732)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

31. **HEX_6**: `#495057` (라인 744)
   ```
   color: '#495057',
   ```

32. **HEX_6**: `#e9ecef` (라인 746)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

33. **HEX_6**: `#495057` (라인 752)
   ```
   color: '#495057',
   ```

34. **HEX_6**: `#e9ecef` (라인 754)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

35. **HEX_6**: `#495057` (라인 760)
   ```
   color: '#495057',
   ```

36. **HEX_6**: `#e9ecef` (라인 762)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

37. **HEX_6**: `#495057` (라인 768)
   ```
   color: '#495057',
   ```

38. **HEX_6**: `#e9ecef` (라인 770)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

39. **HEX_6**: `#495057` (라인 776)
   ```
   color: '#495057',
   ```

40. **HEX_6**: `#e9ecef` (라인 778)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

41. **HEX_6**: `#e9ecef` (라인 788)
   ```
   borderBottom: '1px solid #e9ecef'
   ```

42. **HEX_6**: `#495057` (라인 810)
   ```
   color: '#495057',
   ```

43. **HEX_6**: `#e9ecef` (라인 882)
   ```
   border: '1px solid #e9ecef',
   ```

44. **HEX_6**: `#e9ecef` (라인 889)
   ```
   borderBottom: '1px solid #e9ecef',
   ```

45. **HEX_6**: `#495057` (라인 894)
   ```
   color: '#495057',
   ```

46. **HEX_6**: `#6f42c1` (라인 900)
   ```
   <FaExchangeAlt style={{ marginRight: '8px', color: '#6f42c1' }} />
   ```

47. **HEX_6**: `#b8daff` (라인 908)
   ```
   border: '1px solid #b8daff',
   ```

48. **HEX_6**: `#d1ecf1` (라인 909)
   ```
   background: '#d1ecf1',
   ```

49. **HEX_6**: `#0c5460` (라인 910)
   ```
   color: '#0c5460'
   ```

50. **HEX_6**: `#c3e6cb` (라인 923)
   ```
   border: '1px solid #c3e6cb',
   ```

51. **HEX_6**: `#d4edda` (라인 924)
   ```
   background: '#d4edda',
   ```

52. **HEX_6**: `#155724` (라인 925)
   ```
   color: '#155724'
   ```

53. **RGBA**: `rgba(0,123,255,0.15)` (라인 277)
   ```
   boxShadow: selectedBranch?.id === branch.id ? '0 2px 8px rgba(0,123,255,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
   ```

54. **RGBA**: `rgba(0,0,0,0.1)` (라인 277)
   ```
   boxShadow: selectedBranch?.id === branch.id ? '0 2px 8px rgba(0,123,255,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
   ```

55. **RGBA**: `rgba(0,0,0,0.1)` (라인 353)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

56. **RGBA**: `rgba(0,0,0,0.1)` (라인 535)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

57. **RGBA**: `rgba(0,0,0,0.1)` (라인 884)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

---

### 📁 `frontend/src/components/ops/PgApprovalManagement.css` (CSS)

**하드코딩 색상**: 54개

1. **HEX_3**: `#666` (라인 30)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#999` (라인 54)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

3. **HEX_3**: `#999` (라인 67)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

4. **HEX_3**: `#666` (라인 129)
   ```
   color: var(--mg-text-secondary, #666);
   ```

5. **HEX_3**: `#999` (라인 151)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

6. **HEX_3**: `#666` (라인 164)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 257)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 361)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_3**: `#666` (라인 426)
   ```
   color: var(--mg-text-secondary, #666);
   ```

10. **HEX_3**: `#999` (라인 442)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

11. **HEX_3**: `#999` (라인 534)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

12. **HEX_3**: `#666` (라인 585)
   ```
   color: var(--mg-text-secondary, #666);
   ```

13. **HEX_3**: `#666` (라인 638)
   ```
   color: var(--mg-text-secondary, #666);
   ```

14. **HEX_3**: `#666` (라인 661)
   ```
   color: var(--mg-text-secondary, #666);
   ```

15. **HEX_6**: `#1a1a1a` (라인 25)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

16. **HEX_6**: `#1a1a1a` (라인 63)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

17. **HEX_6**: `#1a1a1a` (라인 82)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

18. **HEX_6**: `#4a90e2` (라인 88)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

19. **HEX_6**: `#1a1a1a` (라인 98)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

20. **HEX_6**: `#4a90e2` (라인 105)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

21. **HEX_6**: `#fff3cd` (라인 114)
   ```
   background: #fff3cd;
   ```

22. **HEX_6**: `#856404` (라인 117)
   ```
   color: #856404;
   ```

23. **HEX_6**: `#1a1a1a` (라인 159)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

24. **HEX_6**: `#4a90e2` (라인 187)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

25. **HEX_6**: `#1a1a1a` (라인 207)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

26. **HEX_6**: `#fff3cd` (라인 229)
   ```
   background: #fff3cd;
   ```

27. **HEX_6**: `#856404` (라인 230)
   ```
   color: #856404;
   ```

28. **HEX_6**: `#d1ecf1` (라인 234)
   ```
   background: #d1ecf1;
   ```

29. **HEX_6**: `#0c5460` (라인 235)
   ```
   color: #0c5460;
   ```

30. **HEX_6**: `#1a1a1a` (라인 262)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

31. **HEX_6**: `#d4edda` (라인 290)
   ```
   background: #d4edda;
   ```

32. **HEX_6**: `#155724` (라인 291)
   ```
   color: #155724;
   ```

33. **HEX_6**: `#f8d7da` (라인 295)
   ```
   background: #f8d7da;
   ```

34. **HEX_6**: `#721c24` (라인 296)
   ```
   color: #721c24;
   ```

35. **HEX_6**: `#1a1a1a` (라인 395)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

36. **HEX_6**: `#1a1a1a` (라인 431)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

37. **HEX_6**: `#d4edda` (라인 457)
   ```
   background: #d4edda;
   ```

38. **HEX_6**: `#155724` (라인 458)
   ```
   color: #155724;
   ```

39. **HEX_6**: `#f8d7da` (라인 462)
   ```
   background: #f8d7da;
   ```

40. **HEX_6**: `#721c24` (라인 463)
   ```
   color: #721c24;
   ```

41. **HEX_6**: `#4a90e2` (라인 485)
   ```
   accent-color: var(--mg-primary, #4a90e2);
   ```

42. **HEX_6**: `#1a1a1a` (라인 498)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

43. **HEX_6**: `#1a1a1a` (라인 521)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

44. **HEX_6**: `#4a90e2` (라인 528)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

45. **HEX_6**: `#1a1a1a` (라인 563)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

46. **HEX_6**: `#1a1a1a` (라인 592)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

47. **HEX_6**: `#4a90e2` (라인 603)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

48. **HEX_6**: `#1a1a1a` (라인 619)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

49. **HEX_6**: `#1a1a1a` (라인 680)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

50. **HEX_6**: `#4a90e2` (라인 686)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

51. **HEX_6**: `#357abd` (라인 696)
   ```
   background: #357abd;
   ```

52. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 89)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

53. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 331)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

54. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 529)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

---

### 📁 `frontend/src/components/hq/ErdManagement.css` (CSS)

**하드코딩 색상**: 54개

1. **HEX_3**: `#666` (라인 58)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#fee` (라인 97)
   ```
   background-color: #fee;
   ```

3. **HEX_3**: `#fcc` (라인 98)
   ```
   border: 1px solid #fcc;
   ```

4. **HEX_3**: `#c33` (라인 100)
   ```
   color: #c33;
   ```

5. **HEX_3**: `#666` (라인 117)
   ```
   color: var(--mg-text-secondary, #666);
   ```

6. **HEX_3**: `#999` (라인 124)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

7. **HEX_3**: `#666` (라인 179)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 226)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_3**: `#999` (라인 239)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

10. **HEX_3**: `#666` (라인 351)
   ```
   color: var(--mg-text-secondary, #666);
   ```

11. **HEX_3**: `#666` (라인 447)
   ```
   color: var(--mg-text-secondary, #666);
   ```

12. **HEX_3**: `#666` (라인 475)
   ```
   color: var(--mg-text-secondary, #666);
   ```

13. **HEX_3**: `#666` (라인 570)
   ```
   color: var(--mg-text-secondary, #666);
   ```

14. **HEX_3**: `#999` (라인 575)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

15. **HEX_3**: `#666` (라인 582)
   ```
   color: var(--mg-text-secondary, #666);
   ```

16. **HEX_3**: `#666` (라인 621)
   ```
   color: var(--mg-text-secondary, #666);
   ```

17. **HEX_6**: `#1a1a1a` (라인 29)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

18. **HEX_6**: `#4a90e2` (라인 35)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

19. **HEX_6**: `#4a90e2` (라인 72)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

20. **HEX_6**: `#4a90e2` (라인 88)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

21. **HEX_6**: `#1a1a1a` (라인 169)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

22. **HEX_6**: `#e3f2fd` (라인 183)
   ```
   background-color: #e3f2fd;
   ```

23. **HEX_6**: `#f3e5f5` (라인 188)
   ```
   background-color: #f3e5f5;
   ```

24. **HEX_6**: `#7b1fa2` (라인 189)
   ```
   color: #7b1fa2;
   ```

25. **HEX_6**: `#e8f5e9` (라인 193)
   ```
   background-color: #e8f5e9;
   ```

26. **HEX_6**: `#388e3c` (라인 194)
   ```
   color: #388e3c;
   ```

27. **HEX_6**: `#fff3e0` (라인 198)
   ```
   background-color: #fff3e0;
   ```

28. **HEX_6**: `#f57c00` (라인 199)
   ```
   color: #f57c00;
   ```

29. **HEX_6**: `#e8f5e9` (라인 210)
   ```
   background-color: #e8f5e9;
   ```

30. **HEX_6**: `#388e3c` (라인 211)
   ```
   color: #388e3c;
   ```

31. **HEX_6**: `#ffebee` (라인 215)
   ```
   background-color: #ffebee;
   ```

32. **HEX_6**: `#c62828` (라인 216)
   ```
   color: #c62828;
   ```

33. **HEX_6**: `#1a1a1a` (라인 284)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

34. **HEX_6**: `#1a1a1a` (라인 388)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

35. **HEX_6**: `#4a90e2` (라인 404)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

36. **HEX_6**: `#388e3c` (라인 428)
   ```
   color: #388e3c;
   ```

37. **HEX_6**: `#c62828` (라인 432)
   ```
   color: #c62828;
   ```

38. **HEX_6**: `#f57c00` (라인 436)
   ```
   color: #f57c00;
   ```

39. **HEX_6**: `#1a1a1a` (라인 483)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

40. **HEX_6**: `#c62828` (라인 487)
   ```
   color: #c62828;
   ```

41. **HEX_6**: `#f57c00` (라인 491)
   ```
   color: #f57c00;
   ```

42. **HEX_6**: `#c62828` (라인 518)
   ```
   border-left-color: #c62828;
   ```

43. **HEX_6**: `#ffebee` (라인 519)
   ```
   background-color: #ffebee;
   ```

44. **HEX_6**: `#f57c00` (라인 523)
   ```
   border-left-color: #f57c00;
   ```

45. **HEX_6**: `#fff3e0` (라인 524)
   ```
   background-color: #fff3e0;
   ```

46. **HEX_6**: `#e3f2fd` (라인 529)
   ```
   background-color: #e3f2fd;
   ```

47. **HEX_6**: `#1a1a1a` (라인 542)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

48. **HEX_6**: `#c62828` (라인 553)
   ```
   background-color: #c62828;
   ```

49. **HEX_6**: `#f57c00` (라인 558)
   ```
   background-color: #f57c00;
   ```

50. **HEX_6**: `#4a90e2` (라인 616)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

51. **HEX_6**: `#4a90e2` (라인 647)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

52. **HEX_6**: `#4a90e2` (라인 656)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

53. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 146)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

54. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 325)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/auth/TabletLogin.css` (CSS)

**하드코딩 색상**: 50개

1. **HEX_6**: `#f8fafc` (라인 4)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

2. **HEX_6**: `#e2e8f0` (라인 4)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

3. **HEX_6**: `#64748b` (라인 45)
   ```
   color: #64748b;
   ```

4. **HEX_6**: `#f1f5f9` (라인 54)
   ```
   background: #f1f5f9;
   ```

5. **HEX_6**: `#e2e8f0` (라인 58)
   ```
   border: 1px solid #e2e8f0;
   ```

6. **HEX_6**: `#64748b` (라인 66)
   ```
   color: #64748b;
   ```

7. **HEX_6**: `#475569` (라인 80)
   ```
   color: #475569;
   ```

8. **HEX_6**: `#1e293b` (라인 85)
   ```
   color: #1e293b;
   ```

9. **HEX_6**: `#374151` (라인 107)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#6b7280` (라인 117)
   ```
   color: #6b7280;
   ```

11. **HEX_6**: `#d1d5db` (라인 129)
   ```
   border: 1px solid #d1d5db;
   ```

12. **HEX_6**: `#374151` (라인 132)
   ```
   color: #374151;
   ```

13. **HEX_6**: `#9ca3af` (라인 145)
   ```
   color: #9ca3af;
   ```

14. **HEX_6**: `#6b7280` (라인 153)
   ```
   color: #6b7280;
   ```

15. **HEX_6**: `#f3f4f6` (라인 164)
   ```
   background: #f3f4f6;
   ```

16. **HEX_6**: `#374151` (라인 165)
   ```
   color: #374151;
   ```

17. **HEX_6**: `#2563eb` (라인 203)
   ```
   background: #2563eb;
   ```

18. **HEX_6**: `#059669` (라인 212)
   ```
   background: #059669;
   ```

19. **HEX_6**: `#6b7280` (라인 221)
   ```
   background: #6b7280;
   ```

20. **HEX_6**: `#4b5563` (라인 234)
   ```
   background: #4b5563;
   ```

21. **HEX_6**: `#d1d5db` (라인 239)
   ```
   background: #d1d5db;
   ```

22. **HEX_6**: `#9ca3af` (라인 240)
   ```
   color: #9ca3af;
   ```

23. **HEX_6**: `#d1d5db` (라인 254)
   ```
   border: 1px solid #d1d5db;
   ```

24. **HEX_6**: `#374151` (라인 259)
   ```
   color: #374151;
   ```

25. **HEX_6**: `#059669` (라인 283)
   ```
   background: #059669;
   ```

26. **HEX_6**: `#e5e7eb` (라인 302)
   ```
   background: #e5e7eb;
   ```

27. **HEX_6**: `#6b7280` (라인 308)
   ```
   color: #6b7280;
   ```

28. **HEX_6**: `#e5e7eb` (라인 322)
   ```
   border: 1px solid #e5e7eb;
   ```

29. **HEX_6**: `#fef01b` (라인 347)
   ```
   background: #fef01b;
   ```

30. **HEX_6**: `#fef01b` (라인 349)
   ```
   border-color: #fef01b;
   ```

31. **HEX_6**: `#f4e800` (라인 353)
   ```
   background: #f4e800;
   ```

32. **HEX_6**: `#f4e800` (라인 354)
   ```
   border-color: #f4e800;
   ```

33. **HEX_6**: `#03c75a` (라인 358)
   ```
   background: #03c75a;
   ```

34. **HEX_6**: `#03c75a` (라인 360)
   ```
   border-color: #03c75a;
   ```

35. **HEX_6**: `#02b351` (라인 364)
   ```
   background: #02b351;
   ```

36. **HEX_6**: `#02b351` (라인 365)
   ```
   border-color: #02b351;
   ```

37. **HEX_6**: `#6b7280` (라인 378)
   ```
   color: #6b7280;
   ```

38. **HEX_6**: `#2563eb` (라인 398)
   ```
   color: #2563eb;
   ```

39. **HEX_6**: `#dc2626` (라인 416)
   ```
   background: #dc2626;
   ```

40. **HEX_6**: `#d1d5db` (라인 421)
   ```
   background: #d1d5db;
   ```

41. **HEX_6**: `#9ca3af` (라인 422)
   ```
   color: #9ca3af;
   ```

42. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 15)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

43. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 25)
   ```
   border: 1px solid rgba(226, 232, 240, 0.5);
   ```

44. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 79)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

45. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 135)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

46. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 141)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

47. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 183)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

48. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 267)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

49. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 399)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

50. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 432)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/samples/ComplexDashboardSample.css` (CSS)

**하드코딩 색상**: 50개

1. **HEX_6**: `#f2f2f7` (라인 13)
   ```
   background: #f2f2f7;
   ```

2. **HEX_6**: `#1d1d1f` (라인 34)
   ```
   color: #1d1d1f;
   ```

3. **HEX_6**: `#86868b` (라인 41)
   ```
   color: #86868b;
   ```

4. **HEX_6**: `#d1d1d6` (라인 55)
   ```
   border: 1px solid #d1d1d6;
   ```

5. **HEX_6**: `#1d1d1f` (라인 58)
   ```
   color: #1d1d1f;
   ```

6. **HEX_6**: `#f2f2f7` (라인 66)
   ```
   background: #f2f2f7;
   ```

7. **HEX_6**: `#1d1d1f` (라인 134)
   ```
   color: #1d1d1f;
   ```

8. **HEX_6**: `#86868b` (라인 141)
   ```
   color: #86868b;
   ```

9. **HEX_6**: `#1d1d1f` (라인 164)
   ```
   color: #1d1d1f;
   ```

10. **HEX_6**: `#86868b` (라인 171)
   ```
   color: #86868b;
   ```

11. **HEX_6**: `#f2f2f7` (라인 192)
   ```
   border-bottom: 1px solid #f2f2f7;
   ```

12. **HEX_6**: `#1d1d1f` (라인 201)
   ```
   color: #1d1d1f;
   ```

13. **HEX_6**: `#f2f2f7` (라인 210)
   ```
   background: #f2f2f7;
   ```

14. **HEX_6**: `#86868b` (라인 211)
   ```
   color: #86868b;
   ```

15. **HEX_6**: `#f2f2f7` (라인 236)
   ```
   border-bottom: 1px solid #f2f2f7;
   ```

16. **HEX_6**: `#1d1d1f` (라인 265)
   ```
   color: #1d1d1f;
   ```

17. **HEX_6**: `#f2f2f7` (라인 273)
   ```
   background: linear-gradient(135deg, #f2f2f7 0%, #e5e5ea 100%);
   ```

18. **HEX_6**: `#e5e5ea` (라인 273)
   ```
   background: linear-gradient(135deg, #f2f2f7 0%, #e5e5ea 100%);
   ```

19. **HEX_6**: `#d1d1d6` (라인 278)
   ```
   border: 2px dashed #d1d1d6;
   ```

20. **HEX_6**: `#86868b` (라인 280)
   ```
   color: #86868b;
   ```

21. **HEX_6**: `#ff6b35` (라인 398)
   ```
   --mood-accent: #ff6b35;
   ```

22. **HEX_6**: `#ff2d92` (라인 416)
   ```
   --mood-accent: #ff2d92;
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 25)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 27)
   ```
   box-shadow: 0 2px var(--border-radius-md) rgba(0, 0, 0, 0.08);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 28)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 104)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 107)
   ```
   box-shadow: 0 2px var(--border-radius-md) rgba(0, 0, 0, 0.08);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 108)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 115)
   ```
   box-shadow: 0 var(--border-radius-md) var(--spacing-xl) rgba(0, 0, 0, 0.12);
   ```

30. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 128)
   ```
   box-shadow: 0 4px var(--border-radius-lg) rgba(0, 122, 255, 0.3);
   ```

31. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 148)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 150)
   ```
   box-shadow: 0 2px var(--border-radius-md) rgba(0, 0, 0, 0.08);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 151)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

34. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 157)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 158)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

36. **RGBA**: `rgba(52, 199, 89, 0.1)` (라인 215)
   ```
   background: rgba(52, 199, 89, 0.1);
   ```

37. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 220)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

38. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 252)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

39. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 256)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

40. **RGBA**: `rgba(255, 149, 0, 0.1)` (라인 260)
   ```
   background: rgba(255, 149, 0, 0.1);
   ```

41. **RGBA**: `rgba(255, 248, 245, 0.95)` (라인 399)
   ```
   --mood-card-bg: rgba(255, 248, 245, 0.95);
   ```

42. **RGBA**: `rgba(255, 107, 53, 0.12)` (라인 400)
   ```
   --mood-shadow: 0 2px var(--border-radius-md) rgba(255, 107, 53, 0.12);
   ```

43. **RGBA**: `rgba(245, 255, 248, 0.95)` (라인 405)
   ```
   --mood-card-bg: rgba(245, 255, 248, 0.95);
   ```

44. **RGBA**: `rgba(52, 199, 89, 0.12)` (라인 406)
   ```
   --mood-shadow: 0 2px var(--border-radius-md) rgba(52, 199, 89, 0.12);
   ```

45. **RGBA**: `rgba(248, 247, 255, 0.95)` (라인 411)
   ```
   --mood-card-bg: rgba(248, 247, 255, 0.95);
   ```

46. **RGBA**: `rgba(88, 86, 214, 0.12)` (라인 412)
   ```
   --mood-shadow: 0 2px var(--border-radius-md) rgba(88, 86, 214, 0.12);
   ```

47. **RGBA**: `rgba(255, 245, 252, 0.95)` (라인 417)
   ```
   --mood-card-bg: rgba(255, 245, 252, 0.95);
   ```

48. **RGBA**: `rgba(255, 45, 146, 0.12)` (라인 418)
   ```
   --mood-shadow: 0 2px var(--border-radius-md) rgba(255, 45, 146, 0.12);
   ```

49. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 424)
   ```
   background: var(--mood-card-bg, rgba(255, 255, 255, 0.95));
   ```

50. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 425)
   ```
   box-shadow: var(--mood-shadow, 0 2px var(--border-radius-md) rgba(0, 0, 0, 0.08));
   ```

---

### 📁 `frontend/src/styles/modules/schedule-modal.css` (CSS)

**하드코딩 색상**: 48개

1. **HEX_6**: `#E8E8ED` (라인 97)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

2. **HEX_6**: `#1D1D1F` (라인 113)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

3. **HEX_6**: `#424245` (라인 123)
   ```
   color: var(--color-text-secondary, #424245);
   ```

4. **HEX_6**: `#8E8E93` (라인 136)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

5. **HEX_6**: `#E8E8ED` (라인 149)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

6. **HEX_6**: `#1D1D1F` (라인 150)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

7. **HEX_6**: `#424245` (라인 172)
   ```
   color: var(--color-text-secondary, #424245);
   ```

8. **HEX_6**: `#F5F5F7` (라인 198)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

9. **HEX_6**: `#A1A1A6` (라인 204)
   ```
   background: var(--color-border-accent, #A1A1A6);
   ```

10. **HEX_6**: `#8E8E93` (라인 210)
   ```
   background: var(--color-text-muted, #8E8E93);
   ```

11. **HEX_6**: `#FAFAFA` (라인 216)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

12. **HEX_6**: `#E8E8ED` (라인 217)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

13. **HEX_6**: `#E3F2FD` (라인 237)
   ```
   background: var(--color-primary-light, #E3F2FD);
   ```

14. **HEX_6**: `#F5F5F7` (라인 243)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

15. **HEX_6**: `#E8E8ED` (라인 247)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

16. **HEX_6**: `#D1D1D6` (라인 254)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

17. **HEX_6**: `#FAFAFA` (라인 257)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

18. **HEX_6**: `#1D1D1F` (라인 258)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

19. **HEX_6**: `#D1D1D6` (라인 270)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

20. **HEX_6**: `#FAFAFA` (라인 273)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

21. **HEX_6**: `#1D1D1F` (라인 274)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

22. **HEX_6**: `#D1D1D6` (라인 287)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

23. **HEX_6**: `#FAFAFA` (라인 289)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

24. **HEX_6**: `#424245` (라인 290)
   ```
   color: var(--color-text-secondary, #424245);
   ```

25. **HEX_6**: `#E8E8ED` (라인 297)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

26. **HEX_6**: `#A1A1A6` (라인 298)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

27. **HEX_6**: `#E8E8ED` (라인 309)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

28. **HEX_6**: `#FAFAFA` (라인 311)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

29. **HEX_6**: `#424245` (라인 312)
   ```
   color: var(--color-text-secondary, #424245);
   ```

30. **HEX_6**: `#E8E8ED` (라인 322)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

31. **HEX_6**: `#1D1D1F` (라인 323)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

32. **HEX_6**: `#FFFEF7` (라인 329)
   ```
   background: var(--light-cream, #FFFEF7);
   ```

33. **HEX_6**: `#8E8E93` (라인 364)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

34. **HEX_6**: `#E8E8ED` (라인 378)
   ```
   border-top: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

35. **HEX_6**: `#0056CC` (라인 403)
   ```
   background: var(--color-primary-hover, #0056CC);
   ```

36. **HEX_6**: `#8E8E93` (라인 409)
   ```
   background: var(--color-text-muted, #8E8E93);
   ```

37. **HEX_6**: `#424245` (라인 417)
   ```
   color: var(--color-text-secondary, #424245);
   ```

38. **HEX_6**: `#D1D1D6` (라인 418)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

39. **HEX_6**: `#E8E8ED` (라인 422)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

40. **HEX_6**: `#1D1D1F` (라인 423)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

41. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 61)
   ```
   background: var(--modal-backdrop, rgba(0, 0, 0, 0.3));
   ```

42. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 74)
   ```
   background: var(--modal-bg, rgba(250, 250, 250, 0.98));
   ```

43. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 77)
   ```
   border: 1px solid var(--modal-border, rgba(209, 209, 214, 0.8));
   ```

44. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 230)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
   ```

45. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 238)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
   ```

46. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 265)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

47. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 334)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

48. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 405)
   ```
   box-shadow: var(--shadow-hover-primary, 0 4px 12px rgba(0, 122, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationDetail.css` (CSS)

**하드코딩 색상**: 43개

1. **HEX_3**: `#666` (라인 120)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#666` (라인 177)
   ```
   color: var(--mg-text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 200)
   ```
   color: var(--mg-text-secondary, #666);
   ```

4. **HEX_3**: `#999` (라인 243)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

5. **HEX_3**: `#666` (라인 291)
   ```
   color: var(--mg-text-secondary, #666);
   ```

6. **HEX_3**: `#666` (라인 332)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 337)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 356)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_3**: `#666` (라인 406)
   ```
   color: var(--mg-text-secondary, #666);
   ```

10. **HEX_6**: `#1a1a1a` (라인 30)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

11. **HEX_6**: `#d4edda` (라인 57)
   ```
   background: #d4edda;
   ```

12. **HEX_6**: `#155724` (라인 58)
   ```
   color: #155724;
   ```

13. **HEX_6**: `#fff3cd` (라인 62)
   ```
   background: #fff3cd;
   ```

14. **HEX_6**: `#856404` (라인 63)
   ```
   color: #856404;
   ```

15. **HEX_6**: `#f8d7da` (라인 67)
   ```
   background: #f8d7da;
   ```

16. **HEX_6**: `#721c24` (라인 68)
   ```
   color: #721c24;
   ```

17. **HEX_6**: `#e2e3e5` (라인 72)
   ```
   background: #e2e3e5;
   ```

18. **HEX_6**: `#383d41` (라인 73)
   ```
   color: #383d41;
   ```

19. **HEX_6**: `#d1ecf1` (라인 77)
   ```
   background: #d1ecf1;
   ```

20. **HEX_6**: `#0c5460` (라인 78)
   ```
   color: #0c5460;
   ```

21. **HEX_6**: `#1a1a1a` (라인 94)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

22. **HEX_6**: `#1a1a1a` (라인 127)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

23. **HEX_6**: `#4a90e2` (라인 138)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

24. **HEX_6**: `#1a1a1a` (라인 159)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

25. **HEX_6**: `#1a1a1a` (라인 219)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

26. **HEX_6**: `#4a90e2` (라인 225)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

27. **HEX_6**: `#357abd` (라인 235)
   ```
   background: #357abd;
   ```

28. **HEX_6**: `#1a1a1a` (라인 299)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

29. **HEX_6**: `#4a90e2` (라인 314)
   ```
   border-left: 3px solid var(--mg-primary, #4a90e2);
   ```

30. **HEX_6**: `#1a1a1a` (라인 326)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

31. **HEX_6**: `#1a1a1a` (라인 343)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

32. **HEX_6**: `#1a1a1a` (라인 427)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

33. **HEX_6**: `#fff3cd` (라인 458)
   ```
   background: #fff3cd;
   ```

34. **HEX_6**: `#856404` (라인 463)
   ```
   color: #856404;
   ```

35. **HEX_6**: `#d4edda` (라인 468)
   ```
   background: #d4edda;
   ```

36. **HEX_6**: `#155724` (라인 473)
   ```
   color: #155724;
   ```

37. **HEX_6**: `#f8d7da` (라인 478)
   ```
   background: #f8d7da;
   ```

38. **HEX_6**: `#721c24` (라인 483)
   ```
   color: #721c24;
   ```

39. **HEX_6**: `#856404` (라인 497)
   ```
   color: #856404;
   ```

40. **HEX_6**: `#856404` (라인 507)
   ```
   color: #856404;
   ```

41. **HEX_6**: `#4a90e2` (라인 517)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

42. **HEX_6**: `#4a90e2` (라인 522)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

43. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 384)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/hq/BranchDetail.css` (CSS)

**하드코딩 색상**: 43개

1. **HEX_6**: `#e9ecef` (라인 19)
   ```
   border: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#764ba2` (라인 25)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

3. **HEX_6**: `#e9ecef` (라인 78)
   ```
   border: 1px solid #e9ecef;
   ```

4. **HEX_6**: `#e9ecef` (라인 85)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

5. **HEX_6**: `#495057` (라인 90)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#495057` (라인 113)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#e9ecef` (라인 120)
   ```
   border: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#e9ecef` (라인 128)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

9. **HEX_6**: `#e9ecef` (라인 143)
   ```
   background: #e9ecef;
   ```

10. **HEX_6**: `#495057` (라인 144)
   ```
   color: #495057;
   ```

11. **HEX_6**: `#e9ecef` (라인 162)
   ```
   border: 1px solid #e9ecef;
   ```

12. **HEX_6**: `#0056b3` (라인 188)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #0056b3 100%);
   ```

13. **HEX_6**: `#1e7e34` (라인 192)
   ```
   background: linear-gradient(135deg, var(--mg-success-500) 0%, #1e7e34 100%);
   ```

14. **HEX_6**: `#117a8b` (라인 196)
   ```
   background: linear-gradient(135deg, var(--mg-info-500) 0%, #117a8b 100%);
   ```

15. **HEX_6**: `#e0a800` (라인 200)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #e0a800 100%);
   ```

16. **HEX_6**: `#495057` (라인 206)
   ```
   color: #495057;
   ```

17. **HEX_6**: `#e9ecef` (라인 223)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

18. **HEX_6**: `#495057` (라인 225)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#f8f9ff` (라인 236)
   ```
   background: #f8f9ff;
   ```

20. **HEX_6**: `#e9ecef` (라인 244)
   ```
   border: 1px solid #e9ecef;
   ```

21. **HEX_6**: `#495057` (라인 248)
   ```
   color: #495057;
   ```

22. **HEX_6**: `#e9ecef` (라인 258)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

23. **HEX_6**: `#495057` (라인 267)
   ```
   color: #495057;
   ```

24. **HEX_6**: `#e9ecef` (라인 274)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

25. **HEX_6**: `#495057` (라인 279)
   ```
   color: #495057;
   ```

26. **HEX_6**: `#e9ecef` (라인 288)
   ```
   border-top: 1px solid #e9ecef;
   ```

27. **HEX_6**: `#d1ecf1` (라인 298)
   ```
   background: #d1ecf1;
   ```

28. **HEX_6**: `#0c5460` (라인 299)
   ```
   color: #0c5460;
   ```

29. **HEX_6**: `#fff3cd` (라인 304)
   ```
   background: #fff3cd;
   ```

30. **HEX_6**: `#856404` (라인 305)
   ```
   color: #856404;
   ```

31. **HEX_6**: `#f8d7da` (라인 310)
   ```
   background: #f8d7da;
   ```

32. **HEX_6**: `#721c24` (라인 311)
   ```
   color: #721c24;
   ```

33. **HEX_6**: `#f1f1f1` (라인 463)
   ```
   background: #f1f1f1;
   ```

34. **HEX_6**: `#c1c1c1` (라인 468)
   ```
   background: #c1c1c1;
   ```

35. **HEX_6**: `#a8a8a8` (라인 473)
   ```
   background: #a8a8a8;
   ```

36. **RGBA**: `rgba(0,0,0,0.1)` (라인 21)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

37. **RGBA**: `rgba(255,255,255,0.2)` (라인 44)
   ```
   background: rgba(255,255,255,0.2);
   ```

38. **RGBA**: `rgba(0,0,0,0.15)` (라인 73)
   ```
   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
   ```

39. **RGBA**: `rgba(0,0,0,0.1)` (라인 80)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

40. **RGBA**: `rgba(0,0,0,0.1)` (라인 122)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

41. **RGBA**: `rgba(0,0,0,0.1)` (라인 172)
   ```
   box-shadow: 0 4px 16px rgba(0,0,0,0.1);
   ```

42. **RGBA**: `rgba(0,123,255,0.25)` (라인 420)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

43. **RGBA**: `rgba(0,123,255,0.25)` (라인 454)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

---

### 📁 `frontend/src/components/client/ClientDashboard.css` (CSS)

**하드코딩 색상**: 43개

1. **HEX_6**: `#FFB6C1` (라인 6)
   ```
   --client-primary: #FFB6C1;      /* 연한 핑크 */
   ```

2. **HEX_6**: `#98E4D8` (라인 8)
   ```
   --client-success: #98E4D8;      /* 연한 청록 */
   ```

3. **HEX_6**: `#A8D8EA` (라인 9)
   ```
   --client-info: #A8D8EA;         /* 연한 하늘색 */
   ```

4. **HEX_6**: `#FFE5B4` (라인 10)
   ```
   --client-warning: #FFE5B4;      /* 연한 피치 */
   ```

5. **HEX_6**: `#FFE5E5` (라인 11)
   ```
   --client-gradient-1: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

6. **HEX_6**: `#FFF8E1` (라인 11)
   ```
   --client-gradient-1: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

7. **HEX_6**: `#E8F5E9` (라인 12)
   ```
   --client-gradient-2: linear-gradient(135deg, #E8F5E9 0%, #E1F5FE 100%);
   ```

8. **HEX_6**: `#E1F5FE` (라인 12)
   ```
   --client-gradient-2: linear-gradient(135deg, #E8F5E9 0%, #E1F5FE 100%);
   ```

9. **HEX_6**: `#FFF3E0` (라인 13)
   ```
   --client-gradient-3: linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 100%);
   ```

10. **HEX_6**: `#FCE4EC` (라인 13)
   ```
   --client-gradient-3: linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 100%);
   ```

11. **HEX_6**: `#FFF5F8` (라인 22)
   ```
   background: linear-gradient(135deg, #FFF5F8 0%, #F0FDF4 50%, #F0F9FF 100%);
   ```

12. **HEX_6**: `#F0FDF4` (라인 22)
   ```
   background: linear-gradient(135deg, #FFF5F8 0%, #F0FDF4 50%, #F0F9FF 100%);
   ```

13. **HEX_6**: `#F0F9FF` (라인 22)
   ```
   background: linear-gradient(135deg, #FFF5F8 0%, #F0FDF4 50%, #F0F9FF 100%);
   ```

14. **HEX_6**: `#FFD700` (라인 115)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

15. **HEX_6**: `#FFA500` (라인 115)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

16. **HEX_6**: `#FF69B4` (라인 139)
   ```
   color: #FF69B4;
   ```

17. **HEX_6**: `#FF69B4` (라인 140)
   ```
   background: linear-gradient(135deg, #FF69B4, #FFB6C1);
   ```

18. **HEX_6**: `#FFB6C1` (라인 140)
   ```
   background: linear-gradient(135deg, #FF69B4, #FFB6C1);
   ```

19. **HEX_6**: `#FFB6C1` (라인 276)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FF69B4);
   ```

20. **HEX_6**: `#FF69B4` (라인 276)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FF69B4);
   ```

21. **HEX_6**: `#98E4D8` (라인 280)
   ```
   background: linear-gradient(135deg, #98E4D8, #4DD0E1);
   ```

22. **HEX_6**: `#4DD0E1` (라인 280)
   ```
   background: linear-gradient(135deg, #98E4D8, #4DD0E1);
   ```

23. **HEX_6**: `#A8D8EA` (라인 284)
   ```
   background: linear-gradient(135deg, #A8D8EA, #64B5F6);
   ```

24. **HEX_6**: `#64B5F6` (라인 284)
   ```
   background: linear-gradient(135deg, #A8D8EA, #64B5F6);
   ```

25. **HEX_6**: `#FFE5B4` (라인 288)
   ```
   background: linear-gradient(135deg, #FFE5B4, #FFD54F);
   ```

26. **HEX_6**: `#FFD54F` (라인 288)
   ```
   background: linear-gradient(135deg, #FFE5B4, #FFD54F);
   ```

27. **HEX_6**: `#FF69B4` (라인 337)
   ```
   color: #FF69B4;
   ```

28. **HEX_6**: `#FF69B4` (라인 381)
   ```
   color: #FF69B4;
   ```

29. **HEX_6**: `#FF69B4` (라인 461)
   ```
   color: #FF69B4;
   ```

30. **HEX_6**: `#4DD0E1` (라인 465)
   ```
   color: #4DD0E1;
   ```

31. **HEX_6**: `#64B5F6` (라인 469)
   ```
   color: #64B5F6;
   ```

32. **HEX_6**: `#FFD54F` (라인 473)
   ```
   color: #FFD54F;
   ```

33. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 14)
   ```
   --client-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

34. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 15)
   ```
   --client-shadow-hover: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

35. **RGBA**: `rgba(255, 182, 193, 0.5)` (라인 36)
   ```
   repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 182, 193, 0.5) 35px, rgba(255, 182, 193, 0.5) 70px),
   ```

36. **RGBA**: `rgba(255, 182, 193, 0.5)` (라인 36)
   ```
   repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 182, 193, 0.5) 35px, rgba(255, 182, 193, 0.5) 70px),
   ```

37. **RGBA**: `rgba(182, 229, 216, 0.5)` (라인 37)
   ```
   repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(182, 229, 216, 0.5) 35px, rgba(182, 229, 216, 0.5) 70px);
   ```

38. **RGBA**: `rgba(182, 229, 216, 0.5)` (라인 37)
   ```
   repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(182, 229, 216, 0.5) 35px, rgba(182, 229, 216, 0.5) 70px);
   ```

39. **RGBA**: `rgba(255, 182, 193, 0.08)` (라인 54)
   ```
   radial-gradient(circle at 20% 50%, rgba(255, 182, 193, 0.08) 0%, transparent 50%),
   ```

40. **RGBA**: `rgba(182, 229, 216, 0.08)` (라인 55)
   ```
   radial-gradient(circle at 80% 20%, rgba(182, 229, 216, 0.08) 0%, transparent 50%),
   ```

41. **RGBA**: `rgba(168, 216, 234, 0.08)` (라인 56)
   ```
   radial-gradient(circle at 40% 80%, rgba(168, 216, 234, 0.08) 0%, transparent 50%);
   ```

42. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 121)
   ```
   box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
   ```

43. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 160)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/components/schedule/UnifiedScheduleComponent_backup.js` (JS)

**하드코딩 색상**: 42개

1. **HEX_6**: `#6b7280` (라인 83)
   ```
   color: '#6b7280',
   ```

2. **HEX_6**: `#059669` (라인 102)
   ```
   { value: 'COMPLETED', label: '완료됨', icon: '🎉', color: '#059669', description: '완료된 일정' },
   ```

3. **HEX_6**: `#6b7280` (라인 104)
   ```
   { value: 'BLOCKED', label: '차단됨', icon: '🚫', color: '#6b7280', description: '차단된 시간' }
   ```

4. **HEX_6**: `#FF5722` (라인 291)
   ```
   backgroundColor = '#FF5722';
   ```

5. **HEX_6**: `#FF7043` (라인 311)
   ```
   backgroundColor = '#FF7043';
   ```

6. **HEX_6**: `#FF7043` (라인 318)
   ```
   backgroundColor = '#FF7043';
   ```

7. **HEX_6**: `#9C27B0` (라인 326)
   ```
   backgroundColor = '#9C27B0';
   ```

8. **HEX_6**: `#9C27B0` (라인 331)
   ```
   backgroundColor = '#9C27B0';
   ```

9. **HEX_6**: `#06b6d4` (라인 392)
   ```
   '#06b6d4', // 청록색
   ```

10. **HEX_6**: `#84cc16` (라인 393)
   ```
   '#84cc16', // 라임색
   ```

11. **HEX_6**: `#f97316` (라인 394)
   ```
   '#f97316', // 오렌지색
   ```

12. **HEX_6**: `#ec4899` (라인 395)
   ```
   '#ec4899', // 핑크색
   ```

13. **HEX_6**: `#6366f1` (라인 396)
   ```
   '#6366f1'  // 인디고색
   ```

14. **HEX_6**: `#e5e7eb` (라인 757)
   ```
   <span className="legend-color" style={{ backgroundColor: '#e5e7eb' }}></span>
   ```

15. **HEX_6**: `#2c3e50` (라인 866)
   ```
   <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
   ```

16. **HEX_6**: `#e9ecef` (라인 884)
   ```
   border: '2px solid #e9ecef',
   ```

17. **HEX_6**: `#f8f9ff` (라인 894)
   ```
   e.target.style.background = '#f8f9ff';
   ```

18. **HEX_6**: `#e9ecef` (라인 897)
   ```
   e.target.style.borderColor = '#e9ecef';
   ```

19. **HEX_6**: `#e9ecef` (라인 915)
   ```
   border: '2px solid #e9ecef',
   ```

20. **HEX_6**: `#fffbf0` (라인 925)
   ```
   e.target.style.background = '#fffbf0';
   ```

21. **HEX_6**: `#e9ecef` (라인 928)
   ```
   e.target.style.borderColor = '#e9ecef';
   ```

22. **HEX_6**: `#5a6268` (라인 954)
   ```
   e.target.style.background = '#5a6268';
   ```

23. **HEX_6**: `#f8fafc` (라인 993)
   ```
   background: #f8fafc;
   ```

24. **HEX_6**: `#2563eb` (라인 1024)
   ```
   background: #2563eb;
   ```

25. **HEX_6**: `#1d4ed8` (라인 1029)
   ```
   background: #1d4ed8;
   ```

26. **HEX_6**: `#1e293b` (라인 1034)
   ```
   color: #1e293b;
   ```

27. **HEX_6**: `#475569` (라인 1055)
   ```
   color: #475569;
   ```

28. **HEX_6**: `#64748b` (라인 1075)
   ```
   color: #64748b;
   ```

29. **HEX_6**: `#e5e7eb` (라인 1085)
   ```
   .legend-color.available { background-color: #e5e7eb; }
   ```

30. **HEX_6**: `#6b7280` (라인 1088)
   ```
   .legend-color.completed { background-color: #6b7280; }
   ```

31. **HEX_6**: `#f8fafc` (라인 1117)
   ```
   background: #f8fafc;
   ```

32. **HEX_6**: `#e2e8f0` (라인 1118)
   ```
   border-bottom: 1px solid #e2e8f0;
   ```

33. **HEX_6**: `#1e293b` (라인 1124)
   ```
   color: #1e293b;
   ```

34. **HEX_6**: `#2563eb` (라인 1139)
   ```
   background: #2563eb;
   ```

35. **HEX_6**: `#1d4ed8` (라인 1144)
   ```
   background: #1d4ed8;
   ```

36. **HEX_6**: `#1d4ed8` (라인 1150)
   ```
   background: #1d4ed8;
   ```

37. **HEX_6**: `#1d4ed8` (라인 1151)
   ```
   border-color: #1d4ed8;
   ```

38. **HEX_6**: `#64748b` (라인 1180)
   ```
   color: #64748b;
   ```

39. **HEX_6**: `#374151` (라인 1185)
   ```
   color: #374151;
   ```

40. **HEX_6**: `#fef3c7` (라인 1189)
   ```
   background-color: #fef3c7;
   ```

41. **HEX_6**: `#d97706` (라인 1193)
   ```
   color: #d97706;
   ```

42. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 1098)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/components/erp/FinancialCalendarView.js` (JS)

**하드코딩 색상**: 40개

1. **HEX_3**: `#333` (라인 205)
   ```
   color: isToday ? '#856404' : '#333',
   ```

2. **HEX_6**: `#fff3cd` (라인 191)
   ```
   backgroundColor: isToday ? '#fff3cd' : 'white',
   ```

3. **HEX_6**: `#856404` (라인 205)
   ```
   color: isToday ? '#856404' : '#333',
   ```

4. **HEX_6**: `#d4edda` (라인 219)
   ```
   backgroundColor: '#d4edda',
   ```

5. **HEX_6**: `#155724` (라인 220)
   ```
   color: '#155724',
   ```

6. **HEX_6**: `#f8d7da` (라인 233)
   ```
   backgroundColor: '#f8d7da',
   ```

7. **HEX_6**: `#721c24` (라인 234)
   ```
   color: '#721c24',
   ```

8. **HEX_6**: `#d4edda` (라인 316)
   ```
   backgroundColor: '#d4edda',
   ```

9. **HEX_6**: `#155724` (라인 320)
   ```
   <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#155724' }}>
   ```

10. **HEX_6**: `#155724` (라인 323)
   ```
   <div style={{ fontSize: 'var(--font-size-xs)', color: '#155724' }}>💰 총 수입</div>
   ```

11. **HEX_6**: `#f8d7da` (라인 328)
   ```
   backgroundColor: '#f8d7da',
   ```

12. **HEX_6**: `#721c24` (라인 332)
   ```
   <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#721c24' }}>
   ```

13. **HEX_6**: `#721c24` (라인 335)
   ```
   <div style={{ fontSize: 'var(--font-size-xs)', color: '#721c24' }}>💸 총 지출</div>
   ```

14. **HEX_6**: `#cce7ff` (라인 340)
   ```
   backgroundColor: '#cce7ff',
   ```

15. **HEX_6**: `#004085` (라인 344)
   ```
   <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#004085' }}>
   ```

16. **HEX_6**: `#004085` (라인 347)
   ```
   <div style={{ fontSize: 'var(--font-size-xs)', color: '#004085' }}>💎 순이익</div>
   ```

17. **HEX_6**: `#495057` (라인 353)
   ```
   <h4 style={{ marginBottom: '12px', color: '#495057' }}>
   ```

18. **HEX_6**: `#d4edda` (라인 378)
   ```
   backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
   ```

19. **HEX_6**: `#f8d7da` (라인 378)
   ```
   backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
   ```

20. **HEX_6**: `#155724` (라인 379)
   ```
   color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
   ```

21. **HEX_6**: `#721c24` (라인 379)
   ```
   color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
   ```

22. **HEX_6**: `#e3f2fd` (라인 389)
   ```
   backgroundColor: '#e3f2fd',
   ```

23. **HEX_6**: `#495057` (라인 441)
   ```
   <h3 style={{ marginBottom: '15px', color: '#495057' }}>
   ```

24. **HEX_6**: `#d4edda` (라인 459)
   ```
   backgroundColor: '#d4edda',
   ```

25. **HEX_6**: `#155724` (라인 463)
   ```
   <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#155724' }}>
   ```

26. **HEX_6**: `#155724` (라인 466)
   ```
   <div style={{ fontSize: 'var(--font-size-sm)', color: '#155724' }}>💰 월 총 수입</div>
   ```

27. **HEX_6**: `#f8d7da` (라인 471)
   ```
   backgroundColor: '#f8d7da',
   ```

28. **HEX_6**: `#721c24` (라인 475)
   ```
   <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#721c24' }}>
   ```

29. **HEX_6**: `#721c24` (라인 478)
   ```
   <div style={{ fontSize: 'var(--font-size-sm)', color: '#721c24' }}>💸 월 총 지출</div>
   ```

30. **HEX_6**: `#cce7ff` (라인 483)
   ```
   backgroundColor: monthlyProfit >= 0 ? '#cce7ff' : '#ffe6e6',
   ```

31. **HEX_6**: `#ffe6e6` (라인 483)
   ```
   backgroundColor: monthlyProfit >= 0 ? '#cce7ff' : '#ffe6e6',
   ```

32. **HEX_6**: `#004085` (라인 490)
   ```
   color: monthlyProfit >= 0 ? '#004085' : '#721c24'
   ```

33. **HEX_6**: `#721c24` (라인 490)
   ```
   color: monthlyProfit >= 0 ? '#004085' : '#721c24'
   ```

34. **HEX_6**: `#004085` (라인 496)
   ```
   color: monthlyProfit >= 0 ? '#004085' : '#721c24'
   ```

35. **HEX_6**: `#721c24` (라인 496)
   ```
   color: monthlyProfit >= 0 ? '#004085' : '#721c24'
   ```

36. **HEX_6**: `#e2e3e5` (라인 504)
   ```
   backgroundColor: '#e2e3e5',
   ```

37. **HEX_6**: `#383d41` (라인 508)
   ```
   <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#383d41' }}>
   ```

38. **HEX_6**: `#383d41` (라인 511)
   ```
   <div style={{ fontSize: 'var(--font-size-sm)', color: '#383d41' }}>📊 총 거래</div>
   ```

39. **RGBA**: `rgba(0,0,0,0.1)` (라인 282)
   ```
   boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
   ```

40. **RGBA**: `rgba(0,0,0,0.5)` (라인 525)
   ```
   backgroundColor: 'rgba(0,0,0,0.5)',
   ```

---

### 📁 `frontend/src/styles/common/tablet-profile-edit.css` (CSS)

**하드코딩 색상**: 39개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#DCFCE7` (라인 25)
   ```
   background: #DCFCE7;
   ```

4. **HEX_6**: `#16A34A` (라인 26)
   ```
   color: #16A34A;
   ```

5. **HEX_6**: `#A7F3D0` (라인 30)
   ```
   border: 1px solid #A7F3D0;
   ```

6. **HEX_6**: `#E5E7EB` (라인 42)
   ```
   border-top: 1px solid #E5E7EB;
   ```

7. **HEX_6**: `#7C3AED` (라인 58)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500) 0%, #7C3AED 100%);
   ```

8. **HEX_6**: `#7C3AED` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

9. **HEX_6**: `#6D28D9` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

10. **HEX_6**: `#6B7280` (라인 69)
   ```
   background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
   ```

11. **HEX_6**: `#4B5563` (라인 69)
   ```
   background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
   ```

12. **HEX_6**: `#4B5563` (라인 74)
   ```
   background: linear-gradient(135deg, #4B5563 0%, #374151 100%);
   ```

13. **HEX_6**: `#374151` (라인 74)
   ```
   background: linear-gradient(135deg, #4B5563 0%, #374151 100%);
   ```

14. **HEX_6**: `#F3F4F6` (라인 79)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

15. **HEX_6**: `#E5E7EB` (라인 79)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

16. **HEX_6**: `#374151` (라인 80)
   ```
   color: #374151;
   ```

17. **HEX_6**: `#D1D5DB` (라인 81)
   ```
   border: 1px solid #D1D5DB;
   ```

18. **HEX_6**: `#E5E7EB` (라인 85)
   ```
   background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
   ```

19. **HEX_6**: `#D1D5DB` (라인 85)
   ```
   background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
   ```

20. **HEX_6**: `#374151` (라인 109)
   ```
   color: #374151;
   ```

21. **HEX_6**: `#E5E7EB` (라인 116)
   ```
   border: 2px solid #E5E7EB;
   ```

22. **HEX_6**: `#F9FAFB` (라인 120)
   ```
   background: #F9FAFB;
   ```

23. **HEX_6**: `#D1D5DB` (라인 153)
   ```
   border: 3px dashed #D1D5DB;
   ```

24. **HEX_6**: `#F9FAFB` (라인 159)
   ```
   background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
   ```

25. **HEX_6**: `#F3F4F6` (라인 159)
   ```
   background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
   ```

26. **HEX_6**: `#F3F4F6` (라인 169)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

27. **HEX_6**: `#E5E7EB` (라인 169)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

28. **HEX_6**: `#9CA3AF` (라인 183)
   ```
   color: #9CA3AF;
   ```

29. **HEX_6**: `#DC2626` (라인 196)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #DC2626 100%);
   ```

30. **HEX_6**: `#6B7280` (라인 225)
   ```
   color: #6B7280;
   ```

31. **HEX_6**: `#6B7280` (라인 247)
   ```
   color: #6B7280;
   ```

32. **RGBA**: `rgba(139, 92, 246, 0.3)` (라인 65)
   ```
   box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 97)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

34. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
   ```

35. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 133)
   ```
   box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
   ```

36. **RGBA**: `rgba(139, 92, 246, 0.2)` (라인 171)
   ```
   box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
   ```

37. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 207)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 213)
   ```
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
   ```

39. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 243)
   ```
   text-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGStats.css` (CSS)

**하드코딩 색상**: 39개

1. **HEX_6**: `#2563eb` (라인 47)
   ```
   color: #2563eb;
   ```

2. **HEX_6**: `#ea580c` (라인 52)
   ```
   color: #ea580c;
   ```

3. **HEX_6**: `#16a34a` (라인 57)
   ```
   color: #16a34a;
   ```

4. **HEX_6**: `#9333ea` (라인 62)
   ```
   color: #9333ea;
   ```

5. **HEX_6**: `#15803d` (라인 78)
   ```
   color: #15803d;
   ```

6. **HEX_6**: `#dc2626` (라인 83)
   ```
   color: #dc2626;
   ```

7. **HEX_6**: `#111827` (라인 105)
   ```
   color: #111827;
   ```

8. **HEX_6**: `#6b7280` (라인 111)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#2563eb` (라인 137)
   ```
   stroke: #2563eb;
   ```

10. **HEX_6**: `#ea580c` (라인 142)
   ```
   stroke: #ea580c;
   ```

11. **HEX_6**: `#16a34a` (라인 147)
   ```
   stroke: #16a34a;
   ```

12. **HEX_6**: `#9333ea` (라인 152)
   ```
   stroke: #9333ea;
   ```

13. **HEX_6**: `#60a5fa` (라인 267)
   ```
   color: #60a5fa;
   ```

14. **HEX_6**: `#fb923c` (라인 272)
   ```
   color: #fb923c;
   ```

15. **HEX_6**: `#4ade80` (라인 277)
   ```
   color: #4ade80;
   ```

16. **HEX_6**: `#a78bfa` (라인 282)
   ```
   color: #a78bfa;
   ```

17. **HEX_6**: `#4ade80` (라인 287)
   ```
   color: #4ade80;
   ```

18. **HEX_6**: `#f87171` (라인 292)
   ```
   color: #f87171;
   ```

19. **HEX_6**: `#f9fafb` (라인 296)
   ```
   color: #f9fafb;
   ```

20. **HEX_6**: `#9ca3af` (라인 300)
   ```
   color: #9ca3af;
   ```

21. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 8)
   ```
   border: 1px solid rgba(226, 232, 240, 0.8);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 10)
   ```
   box-shadow: 0 1px 3px 0 var(--mg-shadow-light), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

24. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 46)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

25. **RGBA**: `rgba(249, 115, 22, 0.1)` (라인 51)
   ```
   background: rgba(249, 115, 22, 0.1);
   ```

26. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 56)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

27. **RGBA**: `rgba(147, 51, 234, 0.1)` (라인 61)
   ```
   background: rgba(147, 51, 234, 0.1);
   ```

28. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 77)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

29. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 82)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

30. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 256)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

31. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 257)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 258)
   ```
   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 var(--mg-shadow-medium);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 262)
   ```
   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px var(--mg-shadow-medium);
   ```

34. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 266)
   ```
   background: rgba(59, 130, 246, 0.2);
   ```

35. **RGBA**: `rgba(249, 115, 22, 0.2)` (라인 271)
   ```
   background: rgba(249, 115, 22, 0.2);
   ```

36. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 276)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

37. **RGBA**: `rgba(147, 51, 234, 0.2)` (라인 281)
   ```
   background: rgba(147, 51, 234, 0.2);
   ```

38. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 286)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

39. **RGBA**: `rgba(239, 68, 68, 0.2)` (라인 291)
   ```
   background: rgba(239, 68, 68, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard/ClientMessageSection.css` (CSS)

**하드코딩 색상**: 38개

1. **HEX_6**: `#B8B8D0` (라인 108)
   ```
   background: linear-gradient(135deg, #B8B8D0, #D0D0E8);
   ```

2. **HEX_6**: `#D0D0E8` (라인 108)
   ```
   background: linear-gradient(135deg, #B8B8D0, #D0D0E8);
   ```

3. **HEX_6**: `#87CEEB` (라인 112)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

4. **HEX_6**: `#B0E0E6` (라인 112)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

5. **HEX_6**: `#98D8C8` (라인 116)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

6. **HEX_6**: `#B4E7CE` (라인 116)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

7. **HEX_6**: `#FFD700` (라인 120)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

8. **HEX_6**: `#FFA500` (라인 120)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

9. **HEX_6**: `#FF6B9D` (라인 124)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

10. **HEX_6**: `#FFA5C0` (라인 124)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

11. **HEX_6**: `#87CEEB` (라인 128)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

12. **HEX_6**: `#B0E0E6` (라인 128)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

13. **HEX_6**: `#FFB6C1` (라인 244)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

14. **HEX_6**: `#FFC0CB` (라인 244)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

15. **RGBA**: `rgba(255, 245, 235, 0.6)` (라인 53)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.6), rgba(255, 250, 240, 0.6));
   ```

16. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 53)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.6), rgba(255, 250, 240, 0.6));
   ```

17. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 54)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

18. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 62)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.1);
   ```

19. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 67)
   ```
   box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
   ```

20. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 68)
   ```
   border-color: rgba(255, 182, 193, 0.4);
   ```

21. **RGBA**: `rgba(255, 240, 245, 0.8)` (라인 72)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.8), rgba(255, 245, 250, 0.8));
   ```

22. **RGBA**: `rgba(255, 245, 250, 0.8)` (라인 72)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.8), rgba(255, 245, 250, 0.8));
   ```

23. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 73)
   ```
   border-color: rgba(255, 182, 193, 0.4);
   ```

24. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 74)
   ```
   box-shadow: 0 2px 12px rgba(255, 182, 193, 0.2);
   ```

25. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 78)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
   ```

26. **RGBA**: `rgba(230, 245, 255, 0.6)` (라인 82)
   ```
   background: linear-gradient(135deg, rgba(230, 245, 255, 0.6), rgba(240, 250, 255, 0.6));
   ```

27. **RGBA**: `rgba(240, 250, 255, 0.6)` (라인 82)
   ```
   background: linear-gradient(135deg, rgba(230, 245, 255, 0.6), rgba(240, 250, 255, 0.6));
   ```

28. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 83)
   ```
   border-color: rgba(135, 206, 235, 0.3);
   ```

29. **RGBA**: `rgba(135, 206, 235, 0.5)` (라인 87)
   ```
   border-color: rgba(135, 206, 235, 0.5);
   ```

30. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 88)
   ```
   box-shadow: 0 4px 12px rgba(135, 206, 235, 0.2);
   ```

31. **RGBA**: `rgba(255, 107, 157, 0.5)` (라인 180)
   ```
   box-shadow: 0 0 8px rgba(255, 107, 157, 0.5);
   ```

32. **RGBA**: `rgba(255, 245, 235, 0.4)` (라인 228)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

33. **RGBA**: `rgba(255, 250, 240, 0.4)` (라인 228)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

34. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 229)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

35. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 248)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
   ```

36. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 323)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

37. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 323)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

38. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 326)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGHeader.css` (CSS)

**하드코딩 색상**: 38개

1. **HEX_6**: `#4a5568` (라인 70)
   ```
   color: #4a5568;
   ```

2. **HEX_6**: `#4a5568` (라인 126)
   ```
   background: #4a5568;
   ```

3. **HEX_6**: `#1a202c` (라인 187)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#718096` (라인 193)
   ```
   color: #718096;
   ```

5. **HEX_6**: `#4a5568` (라인 219)
   ```
   color: #4a5568;
   ```

6. **HEX_6**: `#764ba2` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

7. **HEX_6**: `#4a5568` (라인 281)
   ```
   color: #4a5568;
   ```

8. **HEX_6**: `#718096` (라인 286)
   ```
   color: #718096;
   ```

9. **HEX_6**: `#764ba2` (라인 321)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

10. **HEX_6**: `#1a202c` (라인 344)
   ```
   color: #1a202c;
   ```

11. **HEX_6**: `#718096` (라인 350)
   ```
   color: #718096;
   ```

12. **HEX_6**: `#4a5568` (라인 367)
   ```
   color: #4a5568;
   ```

13. **HEX_6**: `#1a202c` (라인 426)
   ```
   color: #1a202c;
   ```

14. **HEX_6**: `#1a202c` (라인 475)
   ```
   color: #1a202c;
   ```

15. **HEX_6**: `#718096` (라인 481)
   ```
   color: #718096;
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 10)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

17. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 12)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

18. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 80)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

19. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 85)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

20. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 112)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

21. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 151)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

22. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 171)
   ```
   border-top: 1px solid rgba(226, 232, 240, 0.6);
   ```

23. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 172)
   ```
   background: rgba(102, 126, 234, 0.05);
   ```

24. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 214)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

25. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 255)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

26. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 303)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

27. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 313)
   ```
   background: rgba(102, 126, 234, 0.05);
   ```

28. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 314)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

29. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 375)
   ```
   background: rgba(102, 126, 234, 0.1);
   ```

30. **RGBA**: `rgba(229, 62, 62, 0.1)` (라인 384)
   ```
   background: rgba(229, 62, 62, 0.1);
   ```

31. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 396)
   ```
   background: rgba(226, 232, 240, 0.6);
   ```

32. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 409)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

33. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 419)
   ```
   background: rgba(102, 126, 234, 0.05);
   ```

34. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 420)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

35. **RGBA**: `rgba(226, 232, 240, 0.3)` (라인 449)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.3);
   ```

36. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 455)
   ```
   background: rgba(102, 126, 234, 0.05);
   ```

37. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 487)
   ```
   background: rgba(102, 126, 234, 0.05);
   ```

38. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 488)
   ```
   border-top: 1px solid rgba(226, 232, 240, 0.6);
   ```

---

### 📁 `frontend/src/components/admin/ModernDashboardEditor.css` (CSS)

**하드코딩 색상**: 38개

1. **HEX_6**: `#dbeafe` (라인 15)
   ```
   --widget-category-common-bg: var(--mg-primary-light, #dbeafe);
   ```

2. **HEX_6**: `#ede9fe` (라인 17)
   ```
   --widget-category-admin-bg: var(--mg-purple-light, #ede9fe);
   ```

3. **HEX_6**: `#fef3c7` (라인 19)
   ```
   --widget-category-consultation-bg: var(--mg-amber-light, #fef3c7);
   ```

4. **HEX_6**: `#d1fae5` (라인 21)
   ```
   --widget-category-academy-bg: var(--mg-emerald-light, #d1fae5);
   ```

5. **HEX_6**: `#fee2e2` (라인 23)
   ```
   --widget-category-erp-bg: var(--mg-red-light, #fee2e2);
   ```

6. **HEX_6**: `#f8fafc` (라인 45)
   ```
   background: var(--mg-bg-gradient-light, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%));
   ```

7. **HEX_6**: `#f1f5f9` (라인 45)
   ```
   background: var(--mg-bg-gradient-light, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%));
   ```

8. **HEX_6**: `#764ba2` (라인 61)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

9. **HEX_6**: `#e5e7eb` (라인 182)
   ```
   border: 1px solid var(--mg-border-color, #e5e7eb); /* 테두리 얇게 */
   ```

10. **HEX_6**: `#f8fafc` (라인 224)
   ```
   background: var(--mg-icon-bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
   ```

11. **HEX_6**: `#e2e8f0` (라인 224)
   ```
   background: var(--mg-icon-bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
   ```

12. **HEX_6**: `#1f2937` (라인 243)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

13. **HEX_6**: `#22c55e` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

14. **HEX_6**: `#16a34a` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

15. **HEX_6**: `#4ade80` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

16. **HEX_6**: `#22c55e` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

17. **HEX_6**: `#fafbfc` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

18. **HEX_6**: `#f4f6f8` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

19. **HEX_6**: `#dbeafe` (라인 331)
   ```
   background: var(--mg-drop-zone-bg, linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%));
   ```

20. **HEX_6**: `#bfdbfe` (라인 331)
   ```
   background: var(--mg-drop-zone-bg, linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%));
   ```

21. **HEX_6**: `#6b7280` (라인 358)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

22. **HEX_6**: `#1f2937` (라인 371)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

23. **HEX_6**: `#e5e7eb` (라인 394)
   ```
   border: 2px solid var(--mg-border-color, #e5e7eb);
   ```

24. **HEX_6**: `#6b7280` (라인 431)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

25. **HEX_6**: `#f9fafb` (라인 461)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

26. **HEX_6**: `#1f2937` (라인 476)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

27. **HEX_6**: `#f9fafb` (라인 489)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

28. **HEX_6**: `#9ca3af` (라인 505)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

29. **HEX_6**: `#2563eb` (라인 541)
   ```
   background: var(--mg-info-dark, #2563eb);
   ```

30. **HEX_6**: `#dc2626` (라인 551)
   ```
   background: var(--mg-danger-dark, #dc2626);
   ```

31. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 81)
   ```
   background: var(--mg-input-overlay-bg, rgba(255, 255, 255, 0.2));
   ```

32. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 88)
   ```
   color: var(--mg-placeholder-on-dark, rgba(255, 255, 255, 0.8));
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 99)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-overlay-light, rgba(255, 255, 255, 0.3));
   ```

34. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 111)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.2));
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 217)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
   ```

36. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 311)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

37. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 341)
   ```
   background: var(--mg-drop-zone-overlay, rgba(59, 130, 246, 0.1));
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 412)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
   ```

---

### 📁 `frontend/src/styles/auth/social-signup-modal.css` (CSS)

**하드코딩 색상**: 37개

1. **HEX_6**: `#764ba2` (라인 32)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#f8fafc` (라인 80)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

3. **HEX_6**: `#e2e8f0` (라인 80)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

4. **HEX_6**: `#e2e8f0` (라인 84)
   ```
   border: 1px solid #e2e8f0;
   ```

5. **HEX_6**: `#f1f5f9` (라인 98)
   ```
   background: #f1f5f9;
   ```

6. **HEX_6**: `#1e293b` (라인 108)
   ```
   color: #1e293b;
   ```

7. **HEX_6**: `#64748b` (라인 114)
   ```
   color: #64748b;
   ```

8. **HEX_6**: `#374151` (라인 133)
   ```
   color: #374151;
   ```

9. **HEX_6**: `#e5e7eb` (라인 140)
   ```
   border: 1px solid #e5e7eb;
   ```

10. **HEX_6**: `#374151` (라인 143)
   ```
   color: #374151;
   ```

11. **HEX_6**: `#f9fafb` (라인 155)
   ```
   background-color: #f9fafb;
   ```

12. **HEX_6**: `#6b7280` (라인 156)
   ```
   color: #6b7280;
   ```

13. **HEX_6**: `#f8fafc` (라인 166)
   ```
   background-color: #f8fafc;
   ```

14. **HEX_6**: `#64748b` (라인 167)
   ```
   color: #64748b;
   ```

15. **HEX_6**: `#fef2f2` (라인 183)
   ```
   background-color: #fef2f2;
   ```

16. **HEX_6**: `#fecaca` (라인 184)
   ```
   border: 1px solid #fecaca;
   ```

17. **HEX_6**: `#dc2626` (라인 187)
   ```
   color: #dc2626;
   ```

18. **HEX_6**: `#6b7280` (라인 197)
   ```
   color: #6b7280;
   ```

19. **HEX_6**: `#6b7280` (라인 212)
   ```
   color: #6b7280;
   ```

20. **HEX_6**: `#374151` (라인 220)
   ```
   color: #374151;
   ```

21. **HEX_6**: `#f3f4f6` (라인 221)
   ```
   background-color: #f3f4f6;
   ```

22. **HEX_6**: `#764ba2` (라인 246)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

23. **HEX_6**: `#f3f4f6` (라인 262)
   ```
   background-color: #f3f4f6;
   ```

24. **HEX_6**: `#374151` (라인 263)
   ```
   color: #374151;
   ```

25. **HEX_6**: `#e5e7eb` (라인 264)
   ```
   border: 1px solid #e5e7eb;
   ```

26. **HEX_6**: `#e5e7eb` (라인 268)
   ```
   background-color: #e5e7eb;
   ```

27. **HEX_6**: `#e9ecef` (라인 307)
   ```
   border: 1px solid #e9ecef;
   ```

28. **HEX_6**: `#495057` (라인 316)
   ```
   color: #495057;
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 8)
   ```
   background-color: rgba(0, 0, 0, 0.6);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 25)
   ```
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
   ```

31. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 25)
   ```
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
   ```

32. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 55)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 70)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

34. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 151)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

35. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 162)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

36. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 252)
   ```
   box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
   ```

37. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 377)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/schedule/steps/ConsultantSelectionStep.css` (CSS)

**하드코딩 색상**: 36개

1. **HEX_6**: `#1D1D1F` (라인 18)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

2. **HEX_6**: `#424245` (라인 29)
   ```
   color: var(--color-text-secondary, #424245);
   ```

3. **HEX_6**: `#F5F5F7` (라인 35)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

4. **HEX_6**: `#E8E8ED` (라인 38)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

5. **HEX_6**: `#D1D1D6` (라인 47)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

6. **HEX_6**: `#FAFAFA` (라인 50)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

7. **HEX_6**: `#1D1D1F` (라인 51)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

8. **HEX_6**: `#FAFAFA` (라인 60)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#424245` (라인 80)
   ```
   color: var(--color-text-secondary, #424245);
   ```

10. **HEX_6**: `#D1D1D6` (라인 86)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

11. **HEX_6**: `#FAFAFA` (라인 89)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

12. **HEX_6**: `#1D1D1F` (라인 90)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

13. **HEX_6**: `#E8E8ED` (라인 103)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

14. **HEX_6**: `#FAFAFA` (라인 105)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

15. **HEX_6**: `#424245` (라인 106)
   ```
   color: var(--color-text-secondary, #424245);
   ```

16. **HEX_6**: `#E8E8ED` (라인 116)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

17. **HEX_6**: `#1D1D1F` (라인 117)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

18. **HEX_6**: `#D1D1D6` (라인 118)
   ```
   border-color: var(--color-border-primary, #D1D1D6);
   ```

19. **HEX_6**: `#D1D1D6` (라인 129)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

20. **HEX_6**: `#FAFAFA` (라인 131)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

21. **HEX_6**: `#424245` (라인 132)
   ```
   color: var(--color-text-secondary, #424245);
   ```

22. **HEX_6**: `#E8E8ED` (라인 140)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

23. **HEX_6**: `#A1A1A6` (라인 141)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

24. **HEX_6**: `#424245` (라인 152)
   ```
   color: var(--color-text-secondary, #424245);
   ```

25. **HEX_6**: `#8E8E93` (라인 167)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

26. **HEX_6**: `#E3F2FD` (라인 180)
   ```
   background: var(--color-primary-light, #E3F2FD);
   ```

27. **HEX_6**: `#8E8E93` (라인 221)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

28. **HEX_6**: `#F5F5F7` (라인 223)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

29. **HEX_6**: `#E8E8ED` (라인 225)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

30. **HEX_6**: `#424245` (라인 234)
   ```
   color: var(--color-text-secondary, #424245);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 39)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

32. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 59)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

33. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 98)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
   ```

34. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 185)
   ```
   box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
   ```

35. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 203)
   ```
   background: var(--mint-green-light, rgba(152, 251, 152, 0.2));
   ```

36. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 207)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationList.css` (CSS)

**하드코딩 색상**: 35개

1. **HEX_3**: `#666` (라인 33)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#999` (라인 57)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

3. **HEX_3**: `#999` (라인 70)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

4. **HEX_3**: `#666` (라인 116)
   ```
   color: var(--mg-text-secondary, #666);
   ```

5. **HEX_3**: `#999` (라인 138)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

6. **HEX_3**: `#666` (라인 151)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 259)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 321)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_6**: `#1a1a1a` (라인 28)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

10. **HEX_6**: `#1a1a1a` (라인 66)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

11. **HEX_6**: `#1a1a1a` (라인 85)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

12. **HEX_6**: `#4a90e2` (라인 92)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

13. **HEX_6**: `#fff3cd` (라인 101)
   ```
   background: #fff3cd;
   ```

14. **HEX_6**: `#856404` (라인 104)
   ```
   color: #856404;
   ```

15. **HEX_6**: `#1a1a1a` (라인 146)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

16. **HEX_6**: `#4a90e2` (라인 174)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

17. **HEX_6**: `#1a1a1a` (라인 194)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

18. **HEX_6**: `#d4edda` (라인 216)
   ```
   background: #d4edda;
   ```

19. **HEX_6**: `#155724` (라인 217)
   ```
   color: #155724;
   ```

20. **HEX_6**: `#fff3cd` (라인 221)
   ```
   background: #fff3cd;
   ```

21. **HEX_6**: `#856404` (라인 222)
   ```
   color: #856404;
   ```

22. **HEX_6**: `#f8d7da` (라인 226)
   ```
   background: #f8d7da;
   ```

23. **HEX_6**: `#721c24` (라인 227)
   ```
   color: #721c24;
   ```

24. **HEX_6**: `#e2e3e5` (라인 231)
   ```
   background: #e2e3e5;
   ```

25. **HEX_6**: `#383d41` (라인 232)
   ```
   color: #383d41;
   ```

26. **HEX_6**: `#d1ecf1` (라인 236)
   ```
   background: #d1ecf1;
   ```

27. **HEX_6**: `#0c5460` (라인 237)
   ```
   color: #0c5460;
   ```

28. **HEX_6**: `#1a1a1a` (라인 264)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

29. **HEX_6**: `#1a1a1a` (라인 342)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

30. **HEX_6**: `#4a90e2` (라인 364)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

31. **HEX_6**: `#fff3cd` (라인 461)
   ```
   background: #fff3cd;
   ```

32. **HEX_6**: `#856404` (라인 462)
   ```
   color: #856404;
   ```

33. **HEX_6**: `#f8d7da` (라인 467)
   ```
   background: #f8d7da;
   ```

34. **HEX_6**: `#721c24` (라인 468)
   ```
   color: #721c24;
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 299)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/dashboard/dashboard.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#e9ecef` (라인 91)
   ```
   border: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#2d3748` (라인 121)
   ```
   color: #2d3748;
   ```

3. **HEX_6**: `#4a5568` (라인 126)
   ```
   color: #4a5568;
   ```

4. **HEX_6**: `#e9ecef` (라인 143)
   ```
   border: 1px solid #e9ecef;
   ```

5. **HEX_6**: `#e9ecef` (라인 188)
   ```
   background: #e9ecef;
   ```

6. **HEX_6**: `#495057` (라인 226)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#e9ecef` (라인 235)
   ```
   border: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#495057` (라인 242)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#e9ecef` (라인 271)
   ```
   border: 1px solid #e9ecef;
   ```

10. **HEX_6**: `#495057` (라인 276)
   ```
   color: #495057;
   ```

11. **HEX_6**: `#e9ecef` (라인 282)
   ```
   background: #e9ecef;
   ```

12. **HEX_6**: `#495057` (라인 286)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#5a67d8` (라인 302)
   ```
   color: #5a67d8;
   ```

14. **HEX_6**: `#e9ecef` (라인 318)
   ```
   border: 1px solid #e9ecef;
   ```

15. **HEX_6**: `#495057` (라인 325)
   ```
   color: #495057;
   ```

16. **HEX_6**: `#e9ecef` (라인 351)
   ```
   border: 1px solid #e9ecef;
   ```

17. **HEX_6**: `#e9ecef` (라인 355)
   ```
   background: #e9ecef;
   ```

18. **HEX_6**: `#495057` (라인 385)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#adb5bd` (라인 404)
   ```
   color: #adb5bd;
   ```

20. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 20)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 90)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 97)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

25. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 109)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 142)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 150)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

28. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 204)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 234)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

30. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 285)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
   ```

31. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 292)
   ```
   box-shadow: 0 1px 4px rgba(102, 126, 234, 0.15);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 317)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

33. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

34. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 370)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleModal.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#0056CC` (라인 7)
   ```
   --schedule-modal-primary-dark: var(--color-primary-hover, #0056CC);
   ```

2. **HEX_6**: `#0056CC` (라인 8)
   ```
   --schedule-modal-primary-gradient: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)) 0%, var(--color-primary-hover, #0056CC) 100%);
   ```

3. **HEX_6**: `#8E8E93` (라인 13)
   ```
   --schedule-modal-gray: var(--color-text-muted, #8E8E93);
   ```

4. **HEX_6**: `#F5F5F7` (라인 14)
   ```
   --schedule-modal-light-gray: var(--color-bg-secondary, #F5F5F7);
   ```

5. **HEX_6**: `#E8E8ED` (라인 15)
   ```
   --schedule-modal-border: var(--color-border-secondary, #E8E8ED);
   ```

6. **HEX_6**: `#1D1D1F` (라인 16)
   ```
   --schedule-modal-text: var(--color-text-primary, #1D1D1F);
   ```

7. **HEX_6**: `#424245` (라인 17)
   ```
   --schedule-modal-text-light: var(--color-text-secondary, #424245);
   ```

8. **HEX_6**: `#FAFAFA` (라인 18)
   ```
   --schedule-modal-white: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#D1D1D6` (라인 95)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

10. **HEX_6**: `#F5F5F7` (라인 187)
   ```
   background: linear-gradient(135deg, var(--color-bg-secondary, #F5F5F7) 0%, var(--color-bg-tertiary, var(--mg-gray-100)) 100%);
   ```

11. **HEX_6**: `#d4edda` (라인 538)
   ```
   background: var(--color-success-light, #d4edda);
   ```

12. **HEX_6**: `#c3e6cb` (라인 540)
   ```
   border: 1px solid var(--color-success-border, #c3e6cb);
   ```

13. **HEX_6**: `#fff3cd` (라인 544)
   ```
   background: var(--color-warning-light, #fff3cd);
   ```

14. **HEX_6**: `#856404` (라인 545)
   ```
   color: var(--color-warning-dark, #856404);
   ```

15. **HEX_6**: `#ffeaa7` (라인 546)
   ```
   border: 1px solid var(--color-warning-border, #ffeaa7);
   ```

16. **HEX_6**: `#f8d7da` (라인 550)
   ```
   background: var(--color-danger-light, #f8d7da);
   ```

17. **HEX_6**: `#f5c6cb` (라인 552)
   ```
   border: 1px solid var(--color-danger-border, #f5c6cb);
   ```

18. **HEX_6**: `#5a6268` (라인 663)
   ```
   background: var(--color-gray-dark, #5a6268);
   ```

19. **HEX_6**: `#5a6268` (라인 664)
   ```
   border-color: var(--color-gray-dark, #5a6268);
   ```

20. **HEX_6**: `#218838` (라인 676)
   ```
   background: var(--color-success-dark, #218838);
   ```

21. **HEX_6**: `#218838` (라인 677)
   ```
   border-color: var(--color-success-dark, #218838);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 20)
   ```
   --schedule-modal-shadow-hover: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.2));
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 165)
   ```
   background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.2));
   ```

24. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 253)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

25. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 270)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

26. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 353)
   ```
   box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
   ```

27. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 405)
   ```
   background: var(--color-primary-light, rgba(0, 122, 255, 0.1));
   ```

28. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 407)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
   ```

29. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 422)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 560)
   ```
   box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
   ```

31. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 567)
   ```
   background: var(--color-primary-light, rgba(0, 122, 255, 0.1));
   ```

32. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 653)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
   ```

33. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 666)
   ```
   box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
   ```

34. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 679)
   ```
   box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
   ```

---

### 📁 `frontend/src/components/admin/system/SystemTools.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#FAFBFF` (라인 13)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #FAFBFF 100%);
   ```

2. **HEX_6**: `#E8EBFF` (라인 14)
   ```
   border: 1px solid #E8EBFF;
   ```

3. **HEX_6**: `#B8BCFF` (라인 25)
   ```
   border-color: #B8BCFF;
   ```

4. **HEX_6**: `#6B73FF` (라인 73)
   ```
   color: #6B73FF;
   ```

5. **HEX_6**: `#6B73FF` (라인 82)
   ```
   color: #6B73FF;
   ```

6. **HEX_6**: `#B8BCFF` (라인 83)
   ```
   border-color: #B8BCFF;
   ```

7. **HEX_6**: `#F0F2FF` (라인 84)
   ```
   background: linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%);
   ```

8. **HEX_6**: `#E8EBFF` (라인 84)
   ```
   background: linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%);
   ```

9. **HEX_6**: `#6B73FF` (라인 88)
   ```
   background: linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%);
   ```

10. **HEX_6**: `#5A63E8` (라인 88)
   ```
   background: linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%);
   ```

11. **HEX_6**: `#6B73FF` (라인 90)
   ```
   border-color: #6B73FF;
   ```

12. **HEX_6**: `#FF9F43` (라인 94)
   ```
   color: #FF9F43;
   ```

13. **HEX_6**: `#FFD4A3` (라인 95)
   ```
   border-color: #FFD4A3;
   ```

14. **HEX_6**: `#FFF5E6` (라인 96)
   ```
   background: linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%);
   ```

15. **HEX_6**: `#FFE8CC` (라인 96)
   ```
   background: linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%);
   ```

16. **HEX_6**: `#FF9F43` (라인 100)
   ```
   background: linear-gradient(135deg, #FF9F43 0%, #FF8C2B 100%);
   ```

17. **HEX_6**: `#FF8C2B` (라인 100)
   ```
   background: linear-gradient(135deg, #FF9F43 0%, #FF8C2B 100%);
   ```

18. **HEX_6**: `#FF9F43` (라인 102)
   ```
   border-color: #FF9F43;
   ```

19. **HEX_6**: `#FF6B9D` (라인 106)
   ```
   color: #FF6B9D;
   ```

20. **HEX_6**: `#FFB3D1` (라인 107)
   ```
   border-color: #FFB3D1;
   ```

21. **HEX_6**: `#FFE8F0` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

22. **HEX_6**: `#FFD6E8` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

23. **HEX_6**: `#FF6B9D` (라인 112)
   ```
   background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%);
   ```

24. **HEX_6**: `#FF5A8A` (라인 112)
   ```
   background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%);
   ```

25. **HEX_6**: `#FF6B9D` (라인 114)
   ```
   border-color: #FF6B9D;
   ```

26. **HEX_6**: `#4ECDC4` (라인 118)
   ```
   color: #4ECDC4;
   ```

27. **HEX_6**: `#A6E6E1` (라인 119)
   ```
   border-color: #A6E6E1;
   ```

28. **HEX_6**: `#E8F8F7` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

29. **HEX_6**: `#D6F2F0` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

30. **HEX_6**: `#4ECDC4` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

31. **HEX_6**: `#3BB5AC` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

32. **HEX_6**: `#4ECDC4` (라인 126)
   ```
   border-color: #4ECDC4;
   ```

33. **RGBA**: `rgba(107, 115, 255, 0.08)` (라인 17)
   ```
   box-shadow: 0 2px 8px rgba(107, 115, 255, 0.08);
   ```

34. **RGBA**: `rgba(107, 115, 255, 0.15)` (라인 24)
   ```
   box-shadow: 0 4px 16px rgba(107, 115, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/common/SalaryExportModal.js` (JS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#6b7280` (라인 144)
   ```
   color: '#6b7280',
   ```

2. **HEX_6**: `#1f2937` (라인 150)
   ```
   color: '#1f2937',
   ```

3. **HEX_6**: `#6b7280` (라인 160)
   ```
   color: '#6b7280',
   ```

4. **HEX_6**: `#1f2937` (라인 166)
   ```
   color: '#1f2937',
   ```

5. **HEX_6**: `#6b7280` (라인 176)
   ```
   color: '#6b7280',
   ```

6. **HEX_6**: `#059669` (라인 182)
   ```
   color: '#059669',
   ```

7. **HEX_6**: `#d1d5db` (라인 263)
   ```
   border: '1px solid #d1d5db',
   ```

8. **HEX_6**: `#dc2626` (라인 270)
   ```
   color: '#dc2626',
   ```

9. **HEX_6**: `#dc2626` (라인 285)
   ```
   color: '#dc2626',
   ```

10. **HEX_6**: `#fef2f2` (라인 286)
   ```
   backgroundColor: '#fef2f2',
   ```

11. **HEX_6**: `#e5e7eb` (라인 299)
   ```
   borderTop: '1px solid #e5e7eb',
   ```

12. **HEX_6**: `#f8fafc` (라인 303)
   ```
   backgroundColor: '#f8fafc'
   ```

13. **HEX_6**: `#d1d5db` (라인 311)
   ```
   border: '1px solid #d1d5db',
   ```

14. **HEX_6**: `#374151` (라인 313)
   ```
   color: '#374151',
   ```

15. **HEX_6**: `#e5e7eb` (라인 367)
   ```
   borderBottom: '1px solid #e5e7eb',
   ```

16. **HEX_6**: `#f8fafc` (라인 371)
   ```
   backgroundColor: '#f8fafc'
   ```

17. **HEX_6**: `#1f2937` (라인 378)
   ```
   color: '#1f2937'
   ```

18. **HEX_6**: `#6b7280` (라인 386)
   ```
   color: '#6b7280',
   ```

19. **HEX_6**: `#f8fafc` (라인 404)
   ```
   backgroundColor: '#f8fafc',
   ```

20. **HEX_6**: `#e5e7eb` (라인 406)
   ```
   border: '1px solid #e5e7eb'
   ```

21. **HEX_6**: `#d1d5db` (라인 466)
   ```
   border: '1px solid #d1d5db',
   ```

22. **HEX_6**: `#dc2626` (라인 472)
   ```
   color: '#dc2626',
   ```

23. **HEX_6**: `#dc2626` (라인 478)
   ```
   color: '#dc2626',
   ```

24. **HEX_6**: `#fef2f2` (라인 479)
   ```
   backgroundColor: '#fef2f2',
   ```

25. **HEX_6**: `#e5e7eb` (라인 487)
   ```
   borderTop: '1px solid #e5e7eb',
   ```

26. **HEX_6**: `#f8fafc` (라인 491)
   ```
   backgroundColor: '#f8fafc'
   ```

27. **HEX_6**: `#d1d5db` (라인 497)
   ```
   border: '1px solid #d1d5db',
   ```

28. **HEX_6**: `#374151` (라인 499)
   ```
   color: '#374151',
   ```

29. **HEX_6**: `#6b7280` (라인 518)
   ```
   color: '#6b7280'
   ```

30. **HEX_6**: `#1f2937` (라인 536)
   ```
   color: '#1f2937'
   ```

31. **HEX_6**: `#e5e7eb` (라인 546)
   ```
   border: '1px solid #e5e7eb'
   ```

32. **HEX_6**: `#6b7280` (라인 556)
   ```
   color: '#6b7280',
   ```

33. **HEX_6**: `#1f2937` (라인 564)
   ```
   color: '#1f2937',
   ```

34. **HEX_6**: `#059669` (라인 571)
   ```
   color: '#059669',
   ```

---

### 📁 `frontend/src/styles/01-settings/_iphone17-tokens.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#F2F2F7` (라인 12)
   ```
   --ios-bg-secondary: #F2F2F7;
   ```

2. **HEX_6**: `#6D6D70` (라인 17)
   ```
   --ios-text-secondary: #6D6D70;
   ```

3. **HEX_6**: `#8E8E93` (라인 18)
   ```
   --ios-text-tertiary: #8E8E93;
   ```

4. **HEX_6**: `#8E8E93` (라인 21)
   ```
   --ios-system-gray: #8E8E93;
   ```

5. **HEX_6**: `#AEAEB2` (라인 22)
   ```
   --ios-system-gray2: #AEAEB2;
   ```

6. **HEX_6**: `#C7C7CC` (라인 23)
   ```
   --ios-system-gray3: #C7C7CC;
   ```

7. **HEX_6**: `#D1D1D6` (라인 24)
   ```
   --ios-system-gray4: #D1D1D6;
   ```

8. **HEX_6**: `#E5E5EA` (라인 25)
   ```
   --ios-system-gray5: #E5E5EA;
   ```

9. **HEX_6**: `#F2F2F7` (라인 26)
   ```
   --ios-system-gray6: #F2F2F7;
   ```

10. **HEX_6**: `#1C1C1E` (라인 89)
   ```
   --ios-bg-secondary: #1C1C1E;
   ```

11. **HEX_6**: `#2C2C2E` (라인 90)
   ```
   --ios-bg-tertiary: #2C2C2E;
   ```

12. **HEX_6**: `#8E8E93` (라인 94)
   ```
   --ios-text-secondary: #8E8E93;
   ```

13. **HEX_6**: `#6D6D70` (라인 95)
   ```
   --ios-text-tertiary: #6D6D70;
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.12)` (라인 29)
   ```
   --glass-bg-primary: rgba(255, 255, 255, 0.12);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 30)
   ```
   --glass-bg-secondary: rgba(255, 255, 255, 0.08);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.04)` (라인 31)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.04);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 32)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 74)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 74)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.07)` (라인 75)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 75)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 76)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.16)` (라인 77)
   ```
   --shadow-floating: 0 16px 48px rgba(0, 0, 0, 0.16);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.06)` (라인 98)
   ```
   --glass-bg-primary: rgba(255, 255, 255, 0.06);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.04)` (라인 99)
   ```
   --glass-bg-secondary: rgba(255, 255, 255, 0.04);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.02)` (라인 100)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.02);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.12)` (라인 101)
   ```
   --glass-border: rgba(255, 255, 255, 0.12);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.16)` (라인 102)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.16);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 105)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 105)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 106)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.3);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 106)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.3);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 107)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/dashboard/ClientPaymentSessionsSection.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#FFB6C1` (라인 64)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

2. **HEX_6**: `#FFC0CB` (라인 64)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

3. **HEX_6**: `#98D8C8` (라인 73)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

4. **HEX_6**: `#B4E7CE` (라인 73)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

5. **HEX_6**: `#FFD700` (라인 82)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

6. **HEX_6**: `#FFA500` (라인 82)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

7. **HEX_6**: `#87CEEB` (라인 91)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

8. **HEX_6**: `#B0E0E6` (라인 91)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

9. **HEX_6**: `#FFB6C1` (라인 169)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

10. **HEX_6**: `#FFC0CB` (라인 169)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

11. **HEX_6**: `#FFB6C1` (라인 247)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

12. **HEX_6**: `#FFC0CB` (라인 247)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

13. **HEX_6**: `#FFB6C1` (라인 283)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

14. **HEX_6**: `#FFC0CB` (라인 283)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

15. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 65)
   ```
   box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
   ```

16. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 74)
   ```
   box-shadow: 0 4px 12px rgba(152, 216, 200, 0.3);
   ```

17. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 83)
   ```
   box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

18. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 92)
   ```
   box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

19. **RGBA**: `rgba(255, 245, 235, 0.6)` (라인 148)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.6), rgba(255, 250, 240, 0.6));
   ```

20. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 148)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.6), rgba(255, 250, 240, 0.6));
   ```

21. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 149)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

22. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 156)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.1);
   ```

23. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 161)
   ```
   box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
   ```

24. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 162)
   ```
   border-color: rgba(255, 182, 193, 0.4);
   ```

25. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 174)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

26. **RGBA**: `rgba(255, 245, 235, 0.4)` (라인 231)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

27. **RGBA**: `rgba(255, 250, 240, 0.4)` (라인 231)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

28. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 232)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

29. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 251)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
   ```

30. **RGBA**: `rgba(255, 240, 245, 0.4)` (라인 267)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.4), rgba(255, 245, 250, 0.4));
   ```

31. **RGBA**: `rgba(255, 245, 250, 0.4)` (라인 267)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.4), rgba(255, 245, 250, 0.4));
   ```

32. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 268)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

33. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 287)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantAvailability.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#2c3e50` (라인 17)
   ```
   color: #2c3e50;
   ```

2. **HEX_6**: `#3498db` (라인 26)
   ```
   color: #3498db;
   ```

3. **HEX_6**: `#7f8c8d` (라인 30)
   ```
   color: #7f8c8d;
   ```

4. **HEX_6**: `#3498db` (라인 57)
   ```
   background: #3498db;
   ```

5. **HEX_6**: `#2980b9` (라인 62)
   ```
   background: #2980b9;
   ```

6. **HEX_6**: `#7f8c8d` (라인 90)
   ```
   color: #7f8c8d;
   ```

7. **HEX_6**: `#7f8c8d` (라인 115)
   ```
   color: #7f8c8d;
   ```

8. **HEX_6**: `#2c3e50` (라인 126)
   ```
   color: #2c3e50;
   ```

9. **HEX_6**: `#e9ecef` (라인 149)
   ```
   border: 1px solid #e9ecef;
   ```

10. **HEX_6**: `#e9ecef` (라인 162)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

11. **HEX_6**: `#e9ecef` (라인 163)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

12. **HEX_6**: `#2c3e50` (라인 169)
   ```
   color: #2c3e50;
   ```

13. **HEX_6**: `#3498db` (라인 174)
   ```
   background: #3498db;
   ```

14. **HEX_6**: `#e9ecef` (라인 197)
   ```
   border: 1px solid #e9ecef;
   ```

15. **HEX_6**: `#e9ecef` (라인 202)
   ```
   background: #e9ecef;
   ```

16. **HEX_6**: `#2c3e50` (라인 218)
   ```
   color: #2c3e50;
   ```

17. **HEX_6**: `#3498db` (라인 246)
   ```
   color: #3498db;
   ```

18. **HEX_6**: `#3498db` (라인 247)
   ```
   border: 1px solid #3498db;
   ```

19. **HEX_6**: `#3498db` (라인 251)
   ```
   background: #3498db;
   ```

20. **HEX_6**: `#e9ecef` (라인 317)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

21. **HEX_6**: `#e9ecef` (라인 318)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

22. **HEX_6**: `#3498db` (라인 333)
   ```
   color: #3498db;
   ```

23. **HEX_6**: `#e9ecef` (라인 353)
   ```
   background: #e9ecef;
   ```

24. **HEX_6**: `#2c3e50` (라인 354)
   ```
   color: #2c3e50;
   ```

25. **HEX_6**: `#e9ecef` (라인 383)
   ```
   border: 2px solid #e9ecef;
   ```

26. **HEX_6**: `#3498db` (라인 393)
   ```
   border-color: #3498db;
   ```

27. **HEX_6**: `#e9ecef` (라인 434)
   ```
   border-top: 1px solid #e9ecef;
   ```

28. **HEX_6**: `#3498db` (라인 452)
   ```
   background: #3498db;
   ```

29. **HEX_6**: `#2980b9` (라인 457)
   ```
   background: #2980b9;
   ```

30. **HEX_6**: `#5a6268` (라인 467)
   ```
   background: #5a6268;
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 146)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 304)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

33. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 394)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
   ```

---

### 📁 `frontend/src/components/erd/ErdDetailPage.css` (CSS)

**하드코딩 색상**: 32개

1. **HEX_3**: `#333` (라인 28)
   ```
   color: var(--text-primary, #333);
   ```

2. **HEX_3**: `#333` (라인 50)
   ```
   color: var(--text-primary, #333);
   ```

3. **HEX_3**: `#666` (라인 63)
   ```
   color: var(--text-secondary, #666);
   ```

4. **HEX_3**: `#999` (라인 82)
   ```
   background: var(--text-secondary, #999);
   ```

5. **HEX_3**: `#666` (라인 88)
   ```
   color: var(--text-secondary, #666);
   ```

6. **HEX_3**: `#333` (라인 151)
   ```
   color: var(--text-primary, #333);
   ```

7. **HEX_3**: `#666` (라인 174)
   ```
   color: var(--text-secondary, #666);
   ```

8. **HEX_3**: `#333` (라인 251)
   ```
   color: var(--text-primary, #333);
   ```

9. **HEX_3**: `#666` (라인 260)
   ```
   background: var(--text-secondary, #666);
   ```

10. **HEX_3**: `#333` (라인 270)
   ```
   background: var(--text-primary, #333);
   ```

11. **HEX_3**: `#333` (라인 291)
   ```
   color: var(--text-primary, #333);
   ```

12. **HEX_3**: `#333` (라인 334)
   ```
   color: var(--text-primary, #333);
   ```

13. **HEX_3**: `#666` (라인 372)
   ```
   color: var(--text-secondary, #666);
   ```

14. **HEX_3**: `#333` (라인 378)
   ```
   color: var(--text-primary, #333);
   ```

15. **HEX_3**: `#666` (라인 480)
   ```
   color: var(--text-secondary, #666);
   ```

16. **HEX_3**: `#333` (라인 506)
   ```
   color: var(--text-primary, #333);
   ```

17. **HEX_3**: `#333` (라인 533)
   ```
   color: var(--text-primary, #333);
   ```

18. **HEX_3**: `#666` (라인 540)
   ```
   color: var(--text-secondary, #666);
   ```

19. **HEX_3**: `#666` (라인 553)
   ```
   color: var(--text-secondary, #666);
   ```

20. **HEX_3**: `#999` (라인 561)
   ```
   color: var(--text-secondary, #999);
   ```

21. **HEX_3**: `#333` (라인 574)
   ```
   color: var(--text-primary, #333);
   ```

22. **HEX_6**: `#f0f0f0` (라인 38)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

23. **HEX_6**: `#f0f0f0` (라인 62)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

24. **HEX_6**: `#0056b3` (라인 120)
   ```
   background: var(--primary-hover, #0056b3);
   ```

25. **HEX_6**: `#f0f0f0` (라인 156)
   ```
   background-color: var(--bg-hover, #f0f0f0);
   ```

26. **HEX_6**: `#0056b3` (라인 243)
   ```
   background: var(--primary-hover, #0056b3);
   ```

27. **HEX_6**: `#f0f0f0` (라인 301)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

28. **HEX_6**: `#c82333` (라인 395)
   ```
   background: var(--error-hover, #c82333);
   ```

29. **HEX_6**: `#0056b3` (라인 639)
   ```
   background: var(--primary-hover, #0056b3);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 198)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 352)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationHistory.css` (CSS)

**하드코딩 색상**: 32개

1. **HEX_6**: `#e9ecef` (라인 9)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 38)
   ```
   background: #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 39)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#495057` (라인 46)
   ```
   color: #495057;
   ```

5. **HEX_6**: `#f0f0f0` (라인 68)
   ```
   border: 1px solid #f0f0f0;
   ```

6. **HEX_6**: `#2c3e50` (라인 85)
   ```
   color: #2c3e50;
   ```

7. **HEX_6**: `#e9ecef` (라인 92)
   ```
   border: 2px solid #e9ecef;
   ```

8. **HEX_6**: `#fafbfc` (라인 95)
   ```
   background: #fafbfc;
   ```

9. **HEX_6**: `#495057` (라인 97)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#f0f0f0` (라인 141)
   ```
   border: 1px solid #f0f0f0;
   ```

11. **HEX_6**: `#0056b3` (라인 154)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500), #0056b3);
   ```

12. **HEX_6**: `#495057` (라인 181)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#d4edda` (라인 194)
   ```
   background: #d4edda;
   ```

14. **HEX_6**: `#155724` (라인 195)
   ```
   color: #155724;
   ```

15. **HEX_6**: `#cce5ff` (라인 199)
   ```
   background: #cce5ff;
   ```

16. **HEX_6**: `#004085` (라인 200)
   ```
   color: #004085;
   ```

17. **HEX_6**: `#d1ecf1` (라인 204)
   ```
   background: #d1ecf1;
   ```

18. **HEX_6**: `#0c5460` (라인 205)
   ```
   color: #0c5460;
   ```

19. **HEX_6**: `#f8d7da` (라인 209)
   ```
   background: #f8d7da;
   ```

20. **HEX_6**: `#721c24` (라인 210)
   ```
   color: #721c24;
   ```

21. **HEX_6**: `#fff3cd` (라인 214)
   ```
   background: #fff3cd;
   ```

22. **HEX_6**: `#856404` (라인 215)
   ```
   color: #856404;
   ```

23. **HEX_6**: `#e9ecef` (라인 219)
   ```
   background: #e9ecef;
   ```

24. **HEX_6**: `#495057` (라인 220)
   ```
   color: #495057;
   ```

25. **HEX_6**: `#e9ecef` (라인 252)
   ```
   border-top: 1px solid #e9ecef;
   ```

26. **HEX_6**: `#495057` (라인 283)
   ```
   color: #495057;
   ```

27. **HEX_6**: `#0056b3` (라인 304)
   ```
   background: #0056b3;
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 67)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

29. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 105)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

30. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 126)
   ```
   box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 140)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 161)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/admin/BranchManagement.css` (CSS)

**하드코딩 색상**: 32개

1. **HEX_6**: `#2563eb` (라인 5)
   ```
   --branch-primary-color: #2563eb;
   ```

2. **HEX_6**: `#16a34a` (라인 6)
   ```
   --branch-success-color: #16a34a;
   ```

3. **HEX_6**: `#d97706` (라인 7)
   ```
   --branch-warning-color: #d97706;
   ```

4. **HEX_6**: `#dc2626` (라인 8)
   ```
   --branch-error-color: #dc2626;
   ```

5. **HEX_6**: `#f3f4f6` (라인 9)
   ```
   --branch-gray-100: #f3f4f6;
   ```

6. **HEX_6**: `#e5e7eb` (라인 10)
   ```
   --branch-gray-200: #e5e7eb;
   ```

7. **HEX_6**: `#d1d5db` (라인 11)
   ```
   --branch-gray-300: #d1d5db;
   ```

8. **HEX_6**: `#6b7280` (라인 12)
   ```
   --branch-gray-500: #6b7280;
   ```

9. **HEX_6**: `#4b5563` (라인 13)
   ```
   --branch-gray-600: #4b5563;
   ```

10. **HEX_6**: `#374151` (라인 14)
   ```
   --branch-gray-700: #374151;
   ```

11. **HEX_6**: `#1f2937` (라인 15)
   ```
   --branch-gray-800: #1f2937;
   ```

12. **HEX_6**: `#111827` (라인 16)
   ```
   --branch-gray-900: #111827;
   ```

13. **HEX_6**: `#1d4ed8` (라인 97)
   ```
   background-color: #1d4ed8;
   ```

14. **HEX_6**: `#1d4ed8` (라인 186)
   ```
   color: #1d4ed8;
   ```

15. **HEX_6**: `#92400e` (라인 201)
   ```
   color: #92400e;
   ```

16. **HEX_6**: `#1e40af` (라인 206)
   ```
   color: #1e40af;
   ```

17. **HEX_6**: `#047857` (라인 211)
   ```
   color: #047857;
   ```

18. **HEX_6**: `#fce7f3` (라인 215)
   ```
   background-color: #fce7f3;
   ```

19. **HEX_6**: `#be185d` (라인 216)
   ```
   color: #be185d;
   ```

20. **HEX_6**: `#f3f4f6` (라인 230)
   ```
   background-color: #f3f4f6;
   ```

21. **HEX_6**: `#374151` (라인 231)
   ```
   color: #374151;
   ```

22. **HEX_6**: `#92400e` (라인 236)
   ```
   color: #92400e;
   ```

23. **HEX_6**: `#047857` (라인 241)
   ```
   color: #047857;
   ```

24. **HEX_6**: `#fed7d7` (라인 245)
   ```
   background-color: #fed7d7;
   ```

25. **HEX_6**: `#c53030` (라인 246)
   ```
   color: #c53030;
   ```

26. **HEX_6**: `#6b7280` (라인 251)
   ```
   color: #6b7280;
   ```

27. **HEX_6**: `#1d4ed8` (라인 339)
   ```
   background-color: #1d4ed8;
   ```

28. **HEX_6**: `#f87171` (라인 367)
   ```
   border: 1px solid #f87171;
   ```

29. **HEX_6**: `#b91c1c` (라인 392)
   ```
   background-color: #b91c1c;
   ```

30. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 81)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

31. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 439)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

32. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 648)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/pages/AdvancedDesignSample.js` (JS)

**하드코딩 색상**: 32개

1. **HEX_6**: `#6b8dbd` (라인 61)
   ```
   return '#6b8dbd';
   ```

2. **HEX_6**: `#8b7cb8` (라인 63)
   ```
   return '#8b7cb8';
   ```

3. **HEX_6**: `#c4a484` (라인 65)
   ```
   return '#c4a484';
   ```

4. **HEX_6**: `#d4a5b8` (라인 67)
   ```
   return '#d4a5b8';
   ```

5. **HEX_6**: `#6b8dbd` (라인 69)
   ```
   return '#6b8dbd';
   ```

6. **HEX_6**: `#764ba2` (라인 268)
   ```
   gradient: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

7. **HEX_6**: `#f5576c` (라인 275)
   ```
   gradient: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

8. **HEX_6**: `#4facfe` (라인 282)
   ```
   gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

9. **HEX_6**: `#00f2fe` (라인 282)
   ```
   gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

10. **HEX_6**: `#43e97b` (라인 289)
   ```
   gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

11. **HEX_6**: `#38f9d7` (라인 289)
   ```
   gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

12. **HEX_6**: `#1a202c` (라인 576)
   ```
   <h4 style={{ margin: '0 0 16px 0', color: '#1a202c' }}>로딩바 데모</h4>
   ```

13. **HEX_6**: `#f0f9ff` (라인 586)
   ```
   <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px', width: '100%', maxWidth: '800px' }}>
   ```

14. **HEX_6**: `#1a202c` (라인 587)
   ```
   <h4 style={{ margin: '0 0 16px 0', color: '#1a202c' }}>모달 테스트</h4>
   ```

15. **HEX_6**: `#1a202c` (라인 995)
   ```
   <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
   ```

16. **HEX_6**: `#4a5568` (라인 998)
   ```
   <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
   ```

17. **HEX_6**: `#e2e8f0` (라인 1005)
   ```
   border: '1px solid #e2e8f0',
   ```

18. **HEX_6**: `#f8fafc` (라인 1007)
   ```
   backgroundColor: '#f8fafc'
   ```

19. **HEX_6**: `#1a202c` (라인 1009)
   ```
   <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>기능 1</h4>
   ```

20. **HEX_6**: `#4a5568` (라인 1010)
   ```
   <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
   ```

21. **HEX_6**: `#e2e8f0` (라인 1017)
   ```
   border: '1px solid #e2e8f0',
   ```

22. **HEX_6**: `#f8fafc` (라인 1019)
   ```
   backgroundColor: '#f8fafc'
   ```

23. **HEX_6**: `#1a202c` (라인 1021)
   ```
   <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>기능 2</h4>
   ```

24. **HEX_6**: `#4a5568` (라인 1022)
   ```
   <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
   ```

25. **HEX_6**: `#718096` (라인 1032)
   ```
   <span style={{ fontSize: '12px', color: '#718096', marginLeft: '8px' }}>로딩 중...</span>
   ```

26. **RGB**: `rgb(102, 126, 234)` (라인 182)
   ```
   borderColor: 'rgb(102, 126, 234)',
   ```

27. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 183)
   ```
   backgroundColor: 'rgba(102, 126, 234, 0.1)',
   ```

28. **RGBA**: `rgba(54, 162, 235, 0.6)` (라인 878)
   ```
   backgroundColor: 'rgba(54, 162, 235, 0.6)',
   ```

29. **RGBA**: `rgba(54, 162, 235, 1)` (라인 879)
   ```
   borderColor: 'rgba(54, 162, 235, 1)',
   ```

30. **RGBA**: `rgba(255, 99, 132, 0.8)` (라인 895)
   ```
   'rgba(255, 99, 132, 0.8)',
   ```

31. **RGBA**: `rgba(54, 162, 235, 0.8)` (라인 896)
   ```
   'rgba(54, 162, 235, 0.8)',
   ```

32. **RGBA**: `rgba(255, 205, 86, 0.8)` (라인 897)
   ```
   'rgba(255, 205, 86, 0.8)'
   ```

---

### 📁 `frontend/src/components/onboarding/OnboardingStatus.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_3**: `#333` (라인 26)
   ```
   color: #333;
   ```

2. **HEX_3**: `#eee` (라인 55)
   ```
   border-bottom: 1px solid #eee;
   ```

3. **HEX_3**: `#333` (라인 60)
   ```
   color: #333;
   ```

4. **HEX_3**: `#ddd` (라인 65)
   ```
   border: 1px solid #ddd;
   ```

5. **HEX_3**: `#fee` (라인 71)
   ```
   background: #fee;
   ```

6. **HEX_3**: `#fcc` (라인 72)
   ```
   border: 1px solid #fcc;
   ```

7. **HEX_3**: `#c33` (라인 73)
   ```
   color: #c33;
   ```

8. **HEX_3**: `#666` (라인 83)
   ```
   color: #666;
   ```

9. **HEX_3**: `#333` (라인 103)
   ```
   color: #333;
   ```

10. **HEX_3**: `#ddd` (라인 104)
   ```
   border-bottom: 2px solid #ddd;
   ```

11. **HEX_3**: `#eee` (라인 109)
   ```
   border-bottom: 1px solid #eee;
   ```

12. **HEX_3**: `#333` (라인 118)
   ```
   color: #333;
   ```

13. **HEX_3**: `#666` (라인 123)
   ```
   color: #666;
   ```

14. **HEX_3**: `#eee` (라인 204)
   ```
   border-bottom: 1px solid #eee;
   ```

15. **HEX_3**: `#333` (라인 210)
   ```
   color: #333;
   ```

16. **HEX_3**: `#666` (라인 217)
   ```
   color: #666;
   ```

17. **HEX_3**: `#333` (라인 229)
   ```
   color: #333;
   ```

18. **HEX_3**: `#333` (라인 243)
   ```
   color: #333;
   ```

19. **HEX_3**: `#666` (라인 248)
   ```
   color: #666;
   ```

20. **HEX_6**: `#4a90e2` (라인 41)
   ```
   background: #4a90e2;
   ```

21. **HEX_6**: `#357abd` (라인 46)
   ```
   background: #357abd;
   ```

22. **HEX_6**: `#f9f9f9` (라인 113)
   ```
   background: #f9f9f9;
   ```

23. **HEX_6**: `#e8f5e9` (라인 136)
   ```
   background: #e8f5e9;
   ```

24. **HEX_6**: `#2e7d32` (라인 137)
   ```
   color: #2e7d32;
   ```

25. **HEX_6**: `#fff3e0` (라인 141)
   ```
   background: #fff3e0;
   ```

26. **HEX_6**: `#e65100` (라인 142)
   ```
   color: #e65100;
   ```

27. **HEX_6**: `#ffebee` (라인 146)
   ```
   background: #ffebee;
   ```

28. **HEX_6**: `#c62828` (라인 147)
   ```
   color: #c62828;
   ```

29. **HEX_6**: `#4a90e2` (라인 163)
   ```
   background: #4a90e2;
   ```

30. **HEX_6**: `#357abd` (라인 173)
   ```
   background: #357abd;
   ```

31. **HEX_6**: `#f9f9f9` (라인 250)
   ```
   background: #f9f9f9;
   ```

---

### 📁 `frontend/src/components/layout/SimpleHamburgerMenu.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_3**: `#333` (라인 264)
   ```
   color: #333;
   ```

2. **HEX_3**: `#333` (라인 338)
   ```
   color: #333;
   ```

3. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

4. **HEX_6**: `#764ba2` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

5. **HEX_6**: `#2c3e50` (라인 96)
   ```
   color: #2c3e50;
   ```

6. **HEX_6**: `#e9ecef` (라인 106)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

7. **HEX_6**: `#764ba2` (라인 114)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

8. **HEX_6**: `#e9ecef` (라인 138)
   ```
   border-left: 3px solid #e9ecef;
   ```

9. **HEX_6**: `#495057` (라인 144)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#e9ecef` (라인 168)
   ```
   background: linear-gradient(90deg, transparent, #e9ecef, transparent);
   ```

11. **HEX_6**: `#f8d7da` (라인 178)
   ```
   border: 1px solid #f8d7da;
   ```

12. **HEX_6**: `#c82333` (라인 185)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #c82333 100%);
   ```

13. **HEX_6**: `#e9ecef` (라인 314)
   ```
   border-color: #e9ecef;
   ```

14. **HEX_6**: `#e3f2fd` (라인 318)
   ```
   background: #e3f2fd;
   ```

15. **HEX_6**: `#bbdefb` (라인 319)
   ```
   border-color: #bbdefb;
   ```

16. **HEX_6**: `#e9ecef` (라인 350)
   ```
   border-left: 2px solid #e9ecef;
   ```

17. **HEX_6**: `#f1f3f5` (라인 365)
   ```
   background: #f1f3f5;
   ```

18. **HEX_6**: `#495057` (라인 384)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#dee2e6` (라인 391)
   ```
   border-top: 2px solid #dee2e6;
   ```

20. **HEX_6**: `#c82333` (라인 421)
   ```
   background: #c82333;
   ```

21. **HEX_6**: `#0056b3` (라인 463)
   ```
   background: #0056b3;
   ```

22. **HEX_6**: `#212529` (라인 469)
   ```
   color: #212529;
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 57)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 73)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 109)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

26. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 117)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 181)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

29. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 188)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
   ```

30. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 287)
   ```
   box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
   ```

31. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 293)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
   ```

---

### 📁 `frontend/src/components/billing/SubscriptionManagement.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#e5e7eb` (라인 17)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 24)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#1f2937` (라인 46)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#6b7280` (라인 52)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#f9fafb` (라인 66)
   ```
   background: #f9fafb;
   ```

6. **HEX_6**: `#e5e7eb` (라인 67)
   ```
   border: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#1f2937` (라인 76)
   ```
   color: #1f2937;
   ```

8. **HEX_6**: `#6b7280` (라인 82)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#1f2937` (라인 103)
   ```
   color: #1f2937;
   ```

10. **HEX_6**: `#f9fafb` (라인 115)
   ```
   background: #f9fafb;
   ```

11. **HEX_6**: `#e5e7eb` (라인 116)
   ```
   border: 2px solid #e5e7eb;
   ```

12. **HEX_6**: `#eff6ff` (라인 129)
   ```
   background: #eff6ff;
   ```

13. **HEX_6**: `#1f2937` (라인 135)
   ```
   color: #1f2937;
   ```

14. **HEX_6**: `#6b7280` (라인 148)
   ```
   color: #6b7280;
   ```

15. **HEX_6**: `#fef3c7` (라인 157)
   ```
   background: #fef3c7;
   ```

16. **HEX_6**: `#fcd34d` (라인 158)
   ```
   border: 1px solid #fcd34d;
   ```

17. **HEX_6**: `#92400e` (라인 160)
   ```
   color: #92400e;
   ```

18. **HEX_6**: `#f9fafb` (라인 172)
   ```
   background: #f9fafb;
   ```

19. **HEX_6**: `#e5e7eb` (라인 173)
   ```
   border: 1px solid #e5e7eb;
   ```

20. **HEX_6**: `#1f2937` (라인 187)
   ```
   color: #1f2937;
   ```

21. **HEX_6**: `#d1fae5` (라인 201)
   ```
   background: #d1fae5;
   ```

22. **HEX_6**: `#065f46` (라인 202)
   ```
   color: #065f46;
   ```

23. **HEX_6**: `#fef3c7` (라인 206)
   ```
   background: #fef3c7;
   ```

24. **HEX_6**: `#92400e` (라인 207)
   ```
   color: #92400e;
   ```

25. **HEX_6**: `#fee2e2` (라인 211)
   ```
   background: #fee2e2;
   ```

26. **HEX_6**: `#991b1b` (라인 212)
   ```
   color: #991b1b;
   ```

27. **HEX_6**: `#6b7280` (라인 221)
   ```
   color: #6b7280;
   ```

28. **HEX_6**: `#fef2f2` (라인 241)
   ```
   background: #fef2f2;
   ```

29. **HEX_6**: `#fecaca` (라인 242)
   ```
   border: 1px solid #fecaca;
   ```

30. **HEX_6**: `#dc2626` (라인 244)
   ```
   color: #dc2626;
   ```

31. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 124)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/auth/AccountIntegrationModal.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#e5e7eb` (라인 30)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 37)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 44)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#f3f4f6` (라인 52)
   ```
   background-color: #f3f4f6;
   ```

5. **HEX_6**: `#374151` (라인 53)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#f8fafc` (라인 69)
   ```
   background-color: #f8fafc;
   ```

7. **HEX_6**: `#e2e8f0` (라인 71)
   ```
   border: 1px solid #e2e8f0;
   ```

8. **HEX_6**: `#374151` (라인 76)
   ```
   color: #374151;
   ```

9. **HEX_6**: `#6b7280` (라인 82)
   ```
   color: #6b7280;
   ```

10. **HEX_6**: `#f0f9ff` (라인 98)
   ```
   background-color: #f0f9ff;
   ```

11. **HEX_6**: `#bae6fd` (라인 99)
   ```
   border: 1px solid #bae6fd;
   ```

12. **HEX_6**: `#0369a1` (라인 107)
   ```
   color: #0369a1;
   ```

13. **HEX_6**: `#374151` (라인 118)
   ```
   color: #374151;
   ```

14. **HEX_6**: `#6b7280` (라인 122)
   ```
   color: #6b7280;
   ```

15. **HEX_6**: `#374151` (라인 136)
   ```
   color: #374151;
   ```

16. **HEX_6**: `#d1d5db` (라인 142)
   ```
   border: 1px solid #d1d5db;
   ```

17. **HEX_6**: `#6b7280` (라인 155)
   ```
   color: #6b7280;
   ```

18. **HEX_6**: `#f0fdf4` (라인 165)
   ```
   background-color: #f0fdf4;
   ```

19. **HEX_6**: `#bbf7d0` (라인 166)
   ```
   border: 1px solid #bbf7d0;
   ```

20. **HEX_6**: `#166534` (라인 174)
   ```
   color: #166534;
   ```

21. **HEX_6**: `#dcfce7` (라인 185)
   ```
   background-color: #dcfce7;
   ```

22. **HEX_6**: `#16a34a` (라인 194)
   ```
   color: #16a34a;
   ```

23. **HEX_6**: `#16a34a` (라인 201)
   ```
   color: #16a34a;
   ```

24. **HEX_6**: `#374151` (라인 206)
   ```
   color: #374151;
   ```

25. **HEX_6**: `#2563eb` (라인 243)
   ```
   background-color: #2563eb;
   ```

26. **HEX_6**: `#f3f4f6` (라인 247)
   ```
   background-color: #f3f4f6;
   ```

27. **HEX_6**: `#374151` (라인 248)
   ```
   color: #374151;
   ```

28. **HEX_6**: `#d1d5db` (라인 249)
   ```
   border: 1px solid #d1d5db;
   ```

29. **HEX_6**: `#e5e7eb` (라인 253)
   ```
   background-color: #e5e7eb;
   ```

30. **HEX_6**: `#2563eb` (라인 264)
   ```
   color: #2563eb;
   ```

31. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 151)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/WellnessManagement.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#87CEEB` (라인 18)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 18)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FFB6C1` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

4. **HEX_6**: `#FFC0CB` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

5. **HEX_6**: `#FFA0B0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

6. **HEX_6**: `#FFB0C0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

7. **HEX_6**: `#FFD700` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

8. **HEX_6**: `#FFA500` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

9. **HEX_6**: `#87CEEB` (라인 151)
   ```
   background: linear-gradient(135deg, #87CEEB, #4682B4);
   ```

10. **HEX_6**: `#4682B4` (라인 151)
   ```
   background: linear-gradient(135deg, #87CEEB, #4682B4);
   ```

11. **HEX_6**: `#98D8C8` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

12. **HEX_6**: `#6BCF7F` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

13. **HEX_6**: `#DDA0DD` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

14. **HEX_6**: `#BA55D3` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

15. **HEX_6**: `#87CEEB` (라인 226)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

16. **HEX_6**: `#B0E0E6` (라인 226)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

17. **HEX_6**: `#FFB6C1` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

18. **HEX_6**: `#FFC0CB` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

20. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 147)
   ```
   box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

21. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 152)
   ```
   box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

22. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 157)
   ```
   box-shadow: 0 4px 12px rgba(152, 216, 200, 0.3);
   ```

23. **RGBA**: `rgba(221, 160, 221, 0.3)` (라인 162)
   ```
   box-shadow: 0 4px 12px rgba(221, 160, 221, 0.3);
   ```

24. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

25. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

26. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

27. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

28. **RGBA**: `rgba(255, 182, 193, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

29. **RGBA**: `rgba(255, 192, 203, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

30. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

31. **RGBA**: `rgba(255, 192, 203, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeList.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#d1d5db` (라인 24)
   ```
   border: 1px solid #d1d5db;
   ```

2. **HEX_6**: `#6b7280` (라인 31)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#f9fafb` (라인 43)
   ```
   background: #f9fafb;
   ```

4. **HEX_6**: `#1f2937` (라인 49)
   ```
   color: #1f2937;
   ```

5. **HEX_6**: `#fef2f2` (라인 78)
   ```
   background-color: #fef2f2;
   ```

6. **HEX_6**: `#f3f4f6` (라인 88)
   ```
   border-bottom: 1px solid #f3f4f6;
   ```

7. **HEX_6**: `#f8fafc` (라인 89)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
   ```

8. **HEX_6**: `#f1f5f9` (라인 89)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
   ```

9. **HEX_6**: `#1f2937` (라인 100)
   ```
   color: #1f2937;
   ```

10. **HEX_6**: `#6b7280` (라인 134)
   ```
   color: #6b7280;
   ```

11. **HEX_6**: `#1f2937` (라인 143)
   ```
   color: #1f2937;
   ```

12. **HEX_6**: `#1d4ed8` (라인 147)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

13. **HEX_6**: `#f3f4f6` (라인 158)
   ```
   background: #f3f4f6;
   ```

14. **HEX_6**: `#1f2937` (라인 159)
   ```
   color: #1f2937;
   ```

15. **HEX_6**: `#6b7280` (라인 169)
   ```
   color: #6b7280;
   ```

16. **HEX_6**: `#f3f4f6` (라인 176)
   ```
   background: #f3f4f6;
   ```

17. **HEX_6**: `#6b7280` (라인 177)
   ```
   color: #6b7280;
   ```

18. **HEX_6**: `#065f46` (라인 200)
   ```
   color: #065f46;
   ```

19. **HEX_6**: `#991b1b` (라인 205)
   ```
   color: #991b1b;
   ```

20. **HEX_6**: `#6b7280` (라인 215)
   ```
   color: #6b7280;
   ```

21. **HEX_6**: `#6b7280` (라인 223)
   ```
   color: #6b7280;
   ```

22. **HEX_6**: `#f9fafb` (라인 225)
   ```
   background: #f9fafb;
   ```

23. **HEX_6**: `#f3f4f6` (라인 234)
   ```
   border-top: 1px solid #f3f4f6;
   ```

24. **HEX_6**: `#fafbfc` (라인 235)
   ```
   background: #fafbfc;
   ```

25. **HEX_6**: `#f3f4f6` (라인 294)
   ```
   border: 4px solid #f3f4f6;
   ```

26. **HEX_6**: `#6b7280` (라인 307)
   ```
   color: #6b7280;
   ```

27. **HEX_6**: `#374151` (라인 327)
   ```
   color: #374151;
   ```

28. **HEX_6**: `#6b7280` (라인 332)
   ```
   color: #6b7280;
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 66)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

30. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 269)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

31. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 282)
   ```
   box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/styles/06-components/_buttons.css` (CSS)

**하드코딩 색상**: 30개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 38)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 51)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 56)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 58)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 59)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 63)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 65)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

8. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 69)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 71)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 76)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.8)` (라인 83)
   ```
   background: rgba(52, 199, 89, 0.8);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 85)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 86)
   ```
   box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
   ```

14. **RGBA**: `rgba(52, 199, 89, 0.9)` (라인 90)
   ```
   background: rgba(52, 199, 89, 0.9);
   ```

15. **RGBA**: `rgba(52, 199, 89, 0.4)` (라인 92)
   ```
   box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
   ```

16. **RGBA**: `rgba(255, 149, 0, 0.8)` (라인 96)
   ```
   background: rgba(255, 149, 0, 0.8);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 98)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

18. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 99)
   ```
   box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
   ```

19. **RGBA**: `rgba(255, 149, 0, 0.9)` (라인 103)
   ```
   background: rgba(255, 149, 0, 0.9);
   ```

20. **RGBA**: `rgba(255, 149, 0, 0.4)` (라인 105)
   ```
   box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
   ```

21. **RGBA**: `rgba(255, 59, 48, 0.8)` (라인 109)
   ```
   background: rgba(255, 59, 48, 0.8);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 111)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(255, 59, 48, 0.3)` (라인 112)
   ```
   box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
   ```

24. **RGBA**: `rgba(255, 59, 48, 0.9)` (라인 116)
   ```
   background: rgba(255, 59, 48, 0.9);
   ```

25. **RGBA**: `rgba(255, 59, 48, 0.4)` (라인 118)
   ```
   box-shadow: 0 8px 25px rgba(255, 59, 48, 0.4);
   ```

26. **RGBA**: `rgba(88, 86, 214, 0.8)` (라인 122)
   ```
   background: rgba(88, 86, 214, 0.8);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 124)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

28. **RGBA**: `rgba(88, 86, 214, 0.3)` (라인 125)
   ```
   box-shadow: 0 4px 15px rgba(88, 86, 214, 0.3);
   ```

29. **RGBA**: `rgba(88, 86, 214, 0.9)` (라인 129)
   ```
   background: rgba(88, 86, 214, 0.9);
   ```

30. **RGBA**: `rgba(88, 86, 214, 0.4)` (라인 131)
   ```
   box-shadow: 0 8px 25px rgba(88, 86, 214, 0.4);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_buttons.css` (CSS)

**하드코딩 색상**: 30개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 33)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 46)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 51)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 53)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 54)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 58)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 60)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

8. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 64)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 66)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 71)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.8)` (라인 78)
   ```
   background: rgba(52, 199, 89, 0.8);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 80)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 81)
   ```
   box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
   ```

14. **RGBA**: `rgba(52, 199, 89, 0.9)` (라인 85)
   ```
   background: rgba(52, 199, 89, 0.9);
   ```

15. **RGBA**: `rgba(52, 199, 89, 0.4)` (라인 87)
   ```
   box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
   ```

16. **RGBA**: `rgba(255, 149, 0, 0.8)` (라인 91)
   ```
   background: rgba(255, 149, 0, 0.8);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 93)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

18. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 94)
   ```
   box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
   ```

19. **RGBA**: `rgba(255, 149, 0, 0.9)` (라인 98)
   ```
   background: rgba(255, 149, 0, 0.9);
   ```

20. **RGBA**: `rgba(255, 149, 0, 0.4)` (라인 100)
   ```
   box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
   ```

21. **RGBA**: `rgba(255, 59, 48, 0.8)` (라인 104)
   ```
   background: rgba(255, 59, 48, 0.8);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 106)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(255, 59, 48, 0.3)` (라인 107)
   ```
   box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
   ```

24. **RGBA**: `rgba(255, 59, 48, 0.9)` (라인 111)
   ```
   background: rgba(255, 59, 48, 0.9);
   ```

25. **RGBA**: `rgba(255, 59, 48, 0.4)` (라인 113)
   ```
   box-shadow: 0 8px 25px rgba(255, 59, 48, 0.4);
   ```

26. **RGBA**: `rgba(88, 86, 214, 0.8)` (라인 117)
   ```
   background: rgba(88, 86, 214, 0.8);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 119)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

28. **RGBA**: `rgba(88, 86, 214, 0.3)` (라인 120)
   ```
   box-shadow: 0 4px 15px rgba(88, 86, 214, 0.3);
   ```

29. **RGBA**: `rgba(88, 86, 214, 0.9)` (라인 124)
   ```
   background: rgba(88, 86, 214, 0.9);
   ```

30. **RGBA**: `rgba(88, 86, 214, 0.4)` (라인 126)
   ```
   box-shadow: 0 8px 25px rgba(88, 86, 214, 0.4);
   ```

---

### 📁 `frontend/src/styles/00-core/_component-variables.css` (CSS)

**하드코딩 색상**: 29개

1. **HEX_6**: `#FEE500` (라인 278)
   ```
   --mypage-kakao-bg: #FEE500;
   ```

2. **HEX_6**: `#FDD835` (라인 279)
   ```
   --mypage-kakao-bg-hover: #FDD835;
   ```

3. **HEX_6**: `#03C75A` (라인 281)
   ```
   --mypage-naver-bg: #03C75A;
   ```

4. **HEX_6**: `#02B351` (라인 282)
   ```
   --mypage-naver-bg-hover: #02B351;
   ```

5. **HEX_6**: `#4285F4` (라인 284)
   ```
   --mypage-google-color: #4285F4;
   ```

6. **HEX_6**: `#d1fae5` (라인 390)
   ```
   --notification-success-icon-bg-start: #d1fae5;
   ```

7. **HEX_6**: `#a7f3d0` (라인 391)
   ```
   --notification-success-icon-bg-end: #a7f3d0;
   ```

8. **HEX_6**: `#059669` (라인 392)
   ```
   --notification-success-icon-color: #059669;
   ```

9. **HEX_6**: `#fecaca` (라인 397)
   ```
   --notification-error-icon-bg-start: #fecaca;
   ```

10. **HEX_6**: `#fca5a5` (라인 398)
   ```
   --notification-error-icon-bg-end: #fca5a5;
   ```

11. **HEX_6**: `#dc2626` (라인 399)
   ```
   --notification-error-icon-color: #dc2626;
   ```

12. **HEX_6**: `#fef3c7` (라인 404)
   ```
   --notification-warning-icon-bg-start: #fef3c7;
   ```

13. **HEX_6**: `#fde68a` (라인 405)
   ```
   --notification-warning-icon-bg-end: #fde68a;
   ```

14. **HEX_6**: `#dbeafe` (라인 411)
   ```
   --notification-info-icon-bg-start: #dbeafe;
   ```

15. **HEX_6**: `#bfdbfe` (라인 412)
   ```
   --notification-info-icon-bg-end: #bfdbfe;
   ```

16. **HEX_6**: `#2563eb` (라인 413)
   ```
   --notification-info-icon-color: #2563eb;
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 308)
   ```
   --notification-toast-bg: rgba(255, 255, 255, 0.95);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 309)
   ```
   --notification-toast-border-color: rgba(255, 255, 255, 0.3);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 345)
   ```
   --notification-modal-bg: rgba(255, 255, 255, 0.95);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 346)
   ```
   --notification-modal-border-color: rgba(255, 255, 255, 0.3);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 353)
   ```
   --notification-header-border-color: rgba(0, 0, 0, 0.08);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 354)
   ```
   --notification-header-bg: rgba(255, 255, 255, 0.9);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 371)
   ```
   --notification-actions-border-color: rgba(0, 0, 0, 0.08);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 372)
   ```
   --notification-actions-bg: rgba(255, 255, 255, 0.9);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 378)
   ```
   --notification-banner-border-color: rgba(255, 255, 255, 0.3);
   ```

26. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 416)
   ```
   --notification-banner-success-bg: rgba(34, 197, 94, 0.1);
   ```

27. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 417)
   ```
   --notification-banner-error-bg: rgba(239, 68, 68, 0.1);
   ```

28. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 418)
   ```
   --notification-banner-warning-bg: rgba(245, 158, 11, 0.1);
   ```

29. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 419)
   ```
   --notification-banner-info-bg: rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/super-admin/PaymentManagement.css` (CSS)

**하드코딩 색상**: 29개

1. **HEX_6**: `#e9ecef` (라인 13)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#2c3e50` (라인 18)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#764ba2` (라인 37)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#f5576c` (라인 50)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

5. **HEX_6**: `#4facfe` (라인 54)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

6. **HEX_6**: `#00f2fe` (라인 54)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

7. **HEX_6**: `#43e97b` (라인 58)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

8. **HEX_6**: `#38f9d7` (라인 58)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

9. **HEX_6**: `#495057` (라인 94)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#ced4da` (라인 101)
   ```
   border: 1px solid #ced4da;
   ```

11. **HEX_6**: `#495057` (라인 137)
   ```
   color: #495057;
   ```

12. **HEX_6**: `#dee2e6` (라인 138)
   ```
   border-bottom: 2px solid #dee2e6;
   ```

13. **HEX_6**: `#dee2e6` (라인 144)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

14. **HEX_6**: `#212529` (라인 165)
   ```
   color: #212529;
   ```

15. **HEX_6**: `#343a40` (라인 189)
   ```
   background-color: #343a40;
   ```

16. **HEX_6**: `#495057` (라인 195)
   ```
   color: #495057;
   ```

17. **HEX_6**: `#0056b3` (라인 229)
   ```
   background-color: #0056b3;
   ```

18. **HEX_6**: `#1e7e34` (라인 238)
   ```
   background-color: #1e7e34;
   ```

19. **HEX_6**: `#c82333` (라인 247)
   ```
   background-color: #c82333;
   ```

20. **HEX_6**: `#212529` (라인 252)
   ```
   color: #212529;
   ```

21. **HEX_6**: `#e0a800` (라인 256)
   ```
   background-color: #e0a800;
   ```

22. **HEX_6**: `#dee2e6` (라인 272)
   ```
   border-top: 1px solid #dee2e6;
   ```

23. **HEX_6**: `#495057` (라인 277)
   ```
   color: #495057;
   ```

24. **HEX_6**: `#721c24` (라인 297)
   ```
   color: #721c24;
   ```

25. **HEX_6**: `#f8d7da` (라인 298)
   ```
   background-color: #f8d7da;
   ```

26. **HEX_6**: `#f5c6cb` (라인 299)
   ```
   border-color: #f5c6cb;
   ```

27. **HEX_6**: `#dee2e6` (라인 311)
   ```
   border: 1px solid #dee2e6;
   ```

28. **HEX_6**: `#495057` (라인 316)
   ```
   color: #495057;
   ```

29. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 111)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/styles/06-components/_cards.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#af52de` (라인 231)
   ```
   .card__icon--mappings { background: #af52de; }
   ```

2. **HEX_6**: `#30d158` (라인 233)
   ```
   .card__icon--revenue { background: #30d158; }
   ```

3. **HEX_6**: `#64d2ff` (라인 235)
   ```
   .card__icon--payment { background: #64d2ff; }
   ```

4. **HEX_6**: `#bf5af2` (라인 236)
   ```
   .card__icon--reports { background: #bf5af2; }
   ```

5. **HEX_6**: `#32d74b` (라인 238)
   ```
   .card__icon--recurring-expense { background: #32d74b; }
   ```

6. **HEX_6**: `#2e7d32` (라인 326)
   ```
   color: #2e7d32;
   ```

7. **HEX_6**: `#c62828` (라인 332)
   ```
   color: #c62828;
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 111)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 160)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 172)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 177)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 203)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 271)
   ```
   rgba(102, 126, 234, 0.8),
   ```

15. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 272)
   ```
   rgba(118, 75, 162, 0.8));
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 305)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

17. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 325)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

18. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 327)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

19. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 331)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

20. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 333)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

21. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 360)
   ```
   rgba(102, 126, 234, 0.8),
   ```

22. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 361)
   ```
   rgba(118, 75, 162, 0.8));
   ```

23. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 385)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

24. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 386)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 405)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 592)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 594)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

28. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 617)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_cards.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#af52de` (라인 231)
   ```
   .card__icon--mappings { background: #af52de; }
   ```

2. **HEX_6**: `#30d158` (라인 233)
   ```
   .card__icon--revenue { background: #30d158; }
   ```

3. **HEX_6**: `#64d2ff` (라인 235)
   ```
   .card__icon--payment { background: #64d2ff; }
   ```

4. **HEX_6**: `#bf5af2` (라인 236)
   ```
   .card__icon--reports { background: #bf5af2; }
   ```

5. **HEX_6**: `#32d74b` (라인 238)
   ```
   .card__icon--recurring-expense { background: #32d74b; }
   ```

6. **HEX_6**: `#2e7d32` (라인 326)
   ```
   color: #2e7d32;
   ```

7. **HEX_6**: `#c62828` (라인 332)
   ```
   color: #c62828;
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 111)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 160)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 172)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 177)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 203)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 271)
   ```
   rgba(102, 126, 234, 0.8),
   ```

15. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 272)
   ```
   rgba(118, 75, 162, 0.8));
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 305)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

17. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 325)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

18. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 327)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

19. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 331)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

20. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 333)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

21. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 360)
   ```
   rgba(102, 126, 234, 0.8),
   ```

22. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 361)
   ```
   rgba(118, 75, 162, 0.8));
   ```

23. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 385)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

24. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 386)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 405)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 592)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 594)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

28. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 617)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/common/DuplicateLoginAlert.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#fef3c7` (라인 46)
   ```
   background: linear-gradient(135deg, #fef3c7, #fde68a);
   ```

2. **HEX_6**: `#fde68a` (라인 46)
   ```
   background: linear-gradient(135deg, #fef3c7, #fde68a);
   ```

3. **HEX_6**: `#1f2937` (라인 58)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#374151` (라인 68)
   ```
   color: #374151;
   ```

5. **HEX_6**: `#6b7280` (라인 75)
   ```
   color: #6b7280;
   ```

6. **HEX_6**: `#f3f4f6` (라인 100)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#374151` (라인 101)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#d1d5db` (라인 102)
   ```
   border: 1px solid #d1d5db;
   ```

9. **HEX_6**: `#9ca3af` (라인 107)
   ```
   border-color: #9ca3af;
   ```

10. **HEX_6**: `#dc2626` (라인 116)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #dc2626);
   ```

11. **HEX_6**: `#dc2626` (라인 118)
   ```
   border: 1px solid #dc2626;
   ```

12. **HEX_6**: `#dc2626` (라인 122)
   ```
   background: linear-gradient(135deg, #dc2626, #b91c1c);
   ```

13. **HEX_6**: `#b91c1c` (라인 122)
   ```
   background: linear-gradient(135deg, #dc2626, #b91c1c);
   ```

14. **HEX_6**: `#b91c1c` (라인 123)
   ```
   border-color: #b91c1c;
   ```

15. **HEX_6**: `#dc2626` (라인 142)
   ```
   background: linear-gradient(90deg, var(--mg-error-500), #dc2626);
   ```

16. **HEX_6**: `#1f2937` (라인 238)
   ```
   background: #1f2937;
   ```

17. **HEX_6**: `#f9fafb` (라인 239)
   ```
   color: #f9fafb;
   ```

18. **HEX_6**: `#374151` (라인 243)
   ```
   border-bottom-color: #374151;
   ```

19. **HEX_6**: `#f9fafb` (라인 247)
   ```
   color: #f9fafb;
   ```

20. **HEX_6**: `#9ca3af` (라인 255)
   ```
   color: #9ca3af;
   ```

21. **HEX_6**: `#374151` (라인 259)
   ```
   background-color: #374151;
   ```

22. **HEX_6**: `#f9fafb` (라인 260)
   ```
   color: #f9fafb;
   ```

23. **HEX_6**: `#4b5563` (라인 261)
   ```
   border-color: #4b5563;
   ```

24. **HEX_6**: `#4b5563` (라인 265)
   ```
   background-color: #4b5563;
   ```

25. **HEX_6**: `#6b7280` (라인 266)
   ```
   border-color: #6b7280;
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 9)
   ```
   background-color: rgba(0, 0, 0, 0.6);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 24)
   ```
   box-shadow: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 155)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

---

### 📁 `frontend/src/components/auth/BranchLogin.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#2563eb` (라인 5)
   ```
   --branch-login-primary: #2563eb;
   ```

2. **HEX_6**: `#16a34a` (라인 6)
   ```
   --branch-login-success: #16a34a;
   ```

3. **HEX_6**: `#d97706` (라인 7)
   ```
   --branch-login-warning: #d97706;
   ```

4. **HEX_6**: `#dc2626` (라인 8)
   ```
   --branch-login-error: #dc2626;
   ```

5. **HEX_6**: `#f3f4f6` (라인 9)
   ```
   --branch-login-gray-100: #f3f4f6;
   ```

6. **HEX_6**: `#e5e7eb` (라인 10)
   ```
   --branch-login-gray-200: #e5e7eb;
   ```

7. **HEX_6**: `#d1d5db` (라인 11)
   ```
   --branch-login-gray-300: #d1d5db;
   ```

8. **HEX_6**: `#6b7280` (라인 12)
   ```
   --branch-login-gray-500: #6b7280;
   ```

9. **HEX_6**: `#4b5563` (라인 13)
   ```
   --branch-login-gray-600: #4b5563;
   ```

10. **HEX_6**: `#374151` (라인 14)
   ```
   --branch-login-gray-700: #374151;
   ```

11. **HEX_6**: `#1f2937` (라인 15)
   ```
   --branch-login-gray-800: #1f2937;
   ```

12. **HEX_6**: `#111827` (라인 16)
   ```
   --branch-login-gray-900: #111827;
   ```

13. **HEX_6**: `#764ba2` (라인 25)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

14. **HEX_6**: `#1d4ed8` (라인 174)
   ```
   background: #1d4ed8;
   ```

15. **HEX_6**: `#1d4ed8` (라인 240)
   ```
   color: #1d4ed8;
   ```

16. **HEX_6**: `#f8fafc` (라인 346)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

17. **HEX_6**: `#e2e8f0` (라인 346)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

18. **HEX_6**: `#dbeafe` (라인 388)
   ```
   background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
   ```

19. **HEX_6**: `#bfdbfe` (라인 388)
   ```
   background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
   ```

20. **HEX_6**: `#1d4ed8` (라인 458)
   ```
   background: #1d4ed8;
   ```

21. **HEX_6**: `#374151` (라인 526)
   ```
   background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
   ```

22. **HEX_6**: `#4b5563` (라인 526)
   ```
   background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
   ```

23. **HEX_6**: `#1e3a8a` (라인 549)
   ```
   background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
   ```

24. **HEX_6**: `#1e40af` (라인 549)
   ```
   background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
   ```

25. **HEX_6**: `#fca5a5` (라인 557)
   ```
   color: #fca5a5;
   ```

26. **RGBA**: `rgba(37, 99, 235, 0.2)` (라인 93)
   ```
   box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
   ```

27. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 129)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

28. **RGBA**: `rgba(37, 99, 235, 0.3)` (라인 176)
   ```
   box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
   ```

---

### 📁 `frontend/src/styles/homepage/index.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#764ba2` (라인 225)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#f8f9ff` (라인 248)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #f8f9ff 100%);
   ```

3. **HEX_6**: `#2d3748` (라인 284)
   ```
   color: #2d3748;
   ```

4. **HEX_6**: `#718096` (라인 292)
   ```
   color: #718096;
   ```

5. **HEX_6**: `#764ba2` (라인 496)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

6. **HEX_6**: `#f5576c` (라인 500)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

7. **HEX_6**: `#4facfe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

8. **HEX_6**: `#00f2fe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

9. **HEX_6**: `#fa709a` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

10. **HEX_6**: `#fee140` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 19)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 26)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 128)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 134)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 259)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 485)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 492)
   ```
   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 514)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 534)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 646)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 648)
   ```
   box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
   ```

22. **RGBA**: `rgba(255, 255, 255, 1)` (라인 652)
   ```
   background: rgba(255, 255, 255, 1);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 654)
   ```
   box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 658)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 660)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 665)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 666)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationList.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#FF6B9D` (라인 26)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

2. **HEX_6**: `#FFA5C0` (라인 26)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

3. **HEX_6**: `#87CEEB` (라인 81)
   ```
   background: linear-gradient(180deg, #87CEEB, #B0E0E6);
   ```

4. **HEX_6**: `#B0E0E6` (라인 81)
   ```
   background: linear-gradient(180deg, #87CEEB, #B0E0E6);
   ```

5. **HEX_6**: `#87CEEB` (라인 89)
   ```
   border-color: #87CEEB;
   ```

6. **HEX_6**: `#FF6B9D` (라인 101)
   ```
   background: linear-gradient(180deg, #FF6B9D, #FFA5C0);
   ```

7. **HEX_6**: `#FFA5C0` (라인 101)
   ```
   background: linear-gradient(180deg, #FF6B9D, #FFA5C0);
   ```

8. **HEX_6**: `#FF8E8E` (라인 105)
   ```
   background: linear-gradient(180deg, var(--mg-error-500), #FF8E8E);
   ```

9. **HEX_6**: `#FF6B9D` (라인 128)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

10. **HEX_6**: `#FFA5C0` (라인 128)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

11. **HEX_6**: `#FF8E8E` (라인 133)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

12. **HEX_6**: `#FFD700` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

13. **HEX_6**: `#FFA500` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

14. **HEX_6**: `#87CEEB` (라인 151)
   ```
   color: #87CEEB;
   ```

15. **HEX_6**: `#87CEEB` (라인 198)
   ```
   color: #87CEEB;
   ```

16. **HEX_6**: `#87CEEB` (라인 206)
   ```
   color: #87CEEB;
   ```

17. **HEX_6**: `#87CEEB` (라인 237)
   ```
   color: #87CEEB;
   ```

18. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

19. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

20. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 16)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

21. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 32)
   ```
   box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
   ```

22. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

23. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

24. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

25. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

26. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 233)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

27. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 233)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationDetail.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#87CEEB` (라인 41)
   ```
   border-color: #87CEEB;
   ```

2. **HEX_6**: `#FF6B9D` (라인 65)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

3. **HEX_6**: `#FFA5C0` (라인 65)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FF8E8E` (라인 71)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

5. **HEX_6**: `#98D8C8` (라인 82)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

6. **HEX_6**: `#B4E7CE` (라인 82)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

7. **HEX_6**: `#FF8E8E` (라인 87)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

8. **HEX_6**: `#FFD700` (라인 92)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

9. **HEX_6**: `#FFA500` (라인 92)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

10. **HEX_6**: `#87CEEB` (라인 97)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

11. **HEX_6**: `#B0E0E6` (라인 97)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

12. **HEX_6**: `#87CEEB` (라인 129)
   ```
   color: #87CEEB;
   ```

13. **HEX_6**: `#87CEEB` (라인 173)
   ```
   border-left: 4px solid #87CEEB;
   ```

14. **HEX_6**: `#87CEEB` (라인 236)
   ```
   color: #87CEEB;
   ```

15. **HEX_6**: `#6BB6D8` (라인 242)
   ```
   color: #6BB6D8;
   ```

16. **HEX_6**: `#87CEEB` (라인 255)
   ```
   border-left: 4px solid #87CEEB;
   ```

17. **HEX_6**: `#FF6B9D` (라인 308)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

18. **HEX_6**: `#FFA5C0` (라인 308)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

19. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 40)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

20. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 40)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

21. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 67)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

22. **RGBA**: `rgba(255, 107, 107, 0.3)` (라인 73)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
   ```

23. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 172)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

24. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 172)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

25. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 256)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

26. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 256)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

27. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 313)
   ```
   box-shadow: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

---

### 📁 `frontend/src/components/schedule/components/ConsultantFilter.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#F5F5F7` (라인 4)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

2. **HEX_6**: `#E8E8ED` (라인 7)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

3. **HEX_6**: `#424245` (라인 44)
   ```
   color: var(--color-text-secondary, #424245);
   ```

4. **HEX_6**: `#D1D1D6` (라인 50)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

5. **HEX_6**: `#FAFAFA` (라인 53)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

6. **HEX_6**: `#1D1D1F` (라인 54)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

7. **HEX_6**: `#FAFAFA` (라인 63)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

8. **HEX_6**: `#8E8E93` (라인 67)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

9. **HEX_6**: `#D1D1D6` (라인 72)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

10. **HEX_6**: `#FAFAFA` (라인 75)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

11. **HEX_6**: `#1D1D1F` (라인 76)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

12. **HEX_6**: `#E8E8ED` (라인 90)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

13. **HEX_6**: `#FAFAFA` (라인 92)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

14. **HEX_6**: `#424245` (라인 93)
   ```
   color: var(--color-text-secondary, #424245);
   ```

15. **HEX_6**: `#E8E8ED` (라인 104)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

16. **HEX_6**: `#1D1D1F` (라인 105)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

17. **HEX_6**: `#D1D1D6` (라인 106)
   ```
   border-color: var(--color-border-primary, #D1D1D6);
   ```

18. **HEX_6**: `#424245` (라인 111)
   ```
   color: var(--color-text-secondary, #424245);
   ```

19. **HEX_6**: `#E8E8ED` (라인 118)
   ```
   border-top: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

20. **HEX_6**: `#D1D1D6` (라인 137)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

21. **HEX_6**: `#FAFAFA` (라인 139)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

22. **HEX_6**: `#424245` (라인 140)
   ```
   color: var(--color-text-secondary, #424245);
   ```

23. **HEX_6**: `#E8E8ED` (라인 151)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

24. **HEX_6**: `#A1A1A6` (라인 152)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 8)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

26. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 62)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

27. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 85)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/compliance/ComplianceMenu.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_3**: `#333` (라인 152)
   ```
   color: #333;
   ```

2. **HEX_3**: `#666` (라인 158)
   ```
   color: #666;
   ```

3. **HEX_3**: `#ccc` (라인 164)
   ```
   color: #ccc;
   ```

4. **HEX_3**: `#333` (라인 194)
   ```
   color: #333;
   ```

5. **HEX_3**: `#666` (라인 207)
   ```
   color: #666;
   ```

6. **HEX_3**: `#666` (라인 225)
   ```
   color: #666;
   ```

7. **HEX_3**: `#333` (라인 235)
   ```
   color: #333;
   ```

8. **HEX_6**: `#764ba2` (라인 13)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

9. **HEX_6**: `#764ba2` (라인 74)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

10. **HEX_6**: `#f5576c` (라인 82)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

11. **HEX_6**: `#f5576c` (라인 86)
   ```
   border-color: #f5576c;
   ```

12. **HEX_6**: `#4facfe` (라인 90)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

13. **HEX_6**: `#00f2fe` (라인 90)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

14. **HEX_6**: `#4facfe` (라인 94)
   ```
   border-color: #4facfe;
   ```

15. **HEX_6**: `#ee5a52` (라인 98)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a52 100%);
   ```

16. **HEX_6**: `#0984e3` (라인 106)
   ```
   background: linear-gradient(135deg, var(--mg-info-500) 0%, #0984e3 100%);
   ```

17. **HEX_6**: `#00a085` (라인 114)
   ```
   background: linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%);
   ```

18. **HEX_6**: `#fdcb6e` (라인 122)
   ```
   background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
   ```

19. **HEX_6**: `#e17055` (라인 122)
   ```
   background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
   ```

20. **HEX_6**: `#fdcb6e` (라인 126)
   ```
   border-color: #fdcb6e;
   ```

21. **HEX_6**: `#2d3436` (라인 130)
   ```
   background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
   ```

22. **HEX_6**: `#636e72` (라인 130)
   ```
   background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
   ```

23. **HEX_6**: `#2d3436` (라인 134)
   ```
   border-color: #2d3436;
   ```

24. **HEX_6**: `#f0f0f0` (라인 195)
   ```
   border-bottom: 2px solid #f0f0f0;
   ```

25. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 16)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 44)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 186)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/components/admin/DashboardManagement.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#e5e7eb` (라인 19)
   ```
   border-bottom: var(--mg-border-width-thick, 2px) solid var(--mg-border-color, #e5e7eb);
   ```

2. **HEX_6**: `#1f2937` (라인 32)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

3. **HEX_6**: `#6b7280` (라인 68)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

4. **HEX_6**: `#e5e7eb` (라인 76)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

5. **HEX_6**: `#6b7280` (라인 95)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

6. **HEX_6**: `#1f2937` (라인 104)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

7. **HEX_6**: `#6b7280` (라인 133)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

8. **HEX_6**: `#9ca3af` (라인 140)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

9. **HEX_6**: `#e5e7eb` (라인 158)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

10. **HEX_6**: `#f9fafb` (라인 172)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

11. **HEX_6**: `#e5e7eb` (라인 186)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

12. **HEX_6**: `#1f2937` (라인 205)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

13. **HEX_6**: `#6b7280` (라인 211)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

14. **HEX_6**: `#dbeafe` (라인 231)
   ```
   background: var(--mg-primary-light, #dbeafe);
   ```

15. **HEX_6**: `#d1fae5` (라인 236)
   ```
   background: var(--mg-success-light, #d1fae5);
   ```

16. **HEX_6**: `#f3f4f6` (라인 241)
   ```
   background: var(--mg-gray-light, #f3f4f6);
   ```

17. **HEX_6**: `#6b7280` (라인 242)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

18. **HEX_6**: `#6b7280` (라인 262)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

19. **HEX_6**: `#1f2937` (라인 267)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

20. **HEX_6**: `#6b7280` (라인 272)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

21. **HEX_6**: `#e5e7eb` (라인 281)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

22. **HEX_6**: `#f9fafb` (라인 302)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

23. **HEX_6**: `#e5e7eb` (라인 304)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

24. **HEX_6**: `#6b7280` (라인 316)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

25. **HEX_6**: `#1f2937` (라인 323)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

26. **HEX_6**: `#6b7280` (라인 331)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

27. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 85)
   ```
   box-shadow: var(--mg-shadow-focus, 0 0 0 3px rgba(59, 130, 246, 0.1));
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_modals.css` (CSS)

**하드코딩 색상**: 26개

1. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 35)
   ```
   border: 1px solid rgba(255, 255, 255, 0.4);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 38)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.2),
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 82)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 123)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 131)
   ```
   border-top: 1px solid rgba(0, 0, 0, 0.08);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 132)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 139)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 144)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 148)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 152)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 157)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 257)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 337)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

17. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 382)
   ```
   background: rgba(255, 193, 7, 0.1);
   ```

18. **RGBA**: `rgba(255, 193, 7, 0.2)` (라인 384)
   ```
   border: 1px solid rgba(255, 193, 7, 0.2);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 420)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 422)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 427)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 429)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

23. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 444)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

24. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 445)
   ```
   box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
   ```

25. **RGBA**: `rgba(248, 249, 250, 0.9)` (라인 451)
   ```
   background: rgba(248, 249, 250, 0.9);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 457)
   ```
   border-color: rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/components/academy/Academy.css` (CSS)

**하드코딩 색상**: 26개

1. **HEX_3**: `#ddd` (라인 30)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

2. **HEX_3**: `#333` (라인 34)
   ```
   color: var(--color-text, #333);
   ```

3. **HEX_3**: `#666` (라인 63)
   ```
   color: var(--color-text-secondary, #666);
   ```

4. **HEX_3**: `#333` (라인 95)
   ```
   color: var(--color-text, #333);
   ```

5. **HEX_3**: `#666` (라인 117)
   ```
   color: var(--color-text-secondary, #666);
   ```

6. **HEX_3**: `#ddd` (라인 129)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

7. **HEX_3**: `#333` (라인 133)
   ```
   color: var(--color-text, #333);
   ```

8. **HEX_3**: `#333` (라인 171)
   ```
   color: var(--color-text, #333);
   ```

9. **HEX_3**: `#ddd` (라인 178)
   ```
   border-bottom: 2px solid var(--color-border, #ddd);
   ```

10. **HEX_3**: `#666` (라인 188)
   ```
   color: var(--color-text-secondary, #666);
   ```

11. **HEX_3**: `#333` (라인 220)
   ```
   color: var(--color-text, #333);
   ```

12. **HEX_3**: `#666` (라인 227)
   ```
   color: var(--color-text-secondary, #666);
   ```

13. **HEX_3**: `#333` (라인 276)
   ```
   color: #333;
   ```

14. **HEX_3**: `#ddd` (라인 277)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

15. **HEX_3**: `#666` (라인 294)
   ```
   color: var(--color-text-secondary, #666);
   ```

16. **HEX_3**: `#ddd` (라인 302)
   ```
   border-bottom: 1px solid var(--color-border, #ddd);
   ```

17. **HEX_6**: `#FEE500` (라인 253)
   ```
   background-color: #FEE500;
   ```

18. **HEX_6**: `#FEE500` (라인 255)
   ```
   border: 1px solid #FEE500;
   ```

19. **HEX_6**: `#FDD835` (라인 259)
   ```
   background-color: #FDD835;
   ```

20. **HEX_6**: `#FDD835` (라인 260)
   ```
   border-color: #FDD835;
   ```

21. **HEX_6**: `#03C75A` (라인 264)
   ```
   background-color: #03C75A;
   ```

22. **HEX_6**: `#03C75A` (라인 266)
   ```
   border: 1px solid #03C75A;
   ```

23. **HEX_6**: `#02B350` (라인 270)
   ```
   background-color: #02B350;
   ```

24. **HEX_6**: `#02B350` (라인 271)
   ```
   border-color: #02B350;
   ```

25. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 46)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

26. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 142)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/test/PaymentTest.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#e9ecef` (라인 13)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#2c3e50` (라인 18)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#fef7f0` (라인 30)
   ```
   background: #fef7f0;
   ```

4. **HEX_6**: `#f5e6d3` (라인 34)
   ```
   border: 1px solid #f5e6d3;
   ```

5. **HEX_6**: `#495057` (라인 39)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#495057` (라인 57)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#ced4da` (라인 64)
   ```
   border: 1px solid #ced4da;
   ```

8. **HEX_6**: `#495057` (라인 84)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#0056b3` (라인 118)
   ```
   background-color: #0056b3;
   ```

10. **HEX_6**: `#545b62` (라인 127)
   ```
   background-color: #545b62;
   ```

11. **HEX_6**: `#1e7e34` (라인 136)
   ```
   background-color: #1e7e34;
   ```

12. **HEX_6**: `#138496` (라인 145)
   ```
   background-color: #138496;
   ```

13. **HEX_6**: `#212529` (라인 150)
   ```
   color: #212529;
   ```

14. **HEX_6**: `#e0a800` (라인 154)
   ```
   background-color: #e0a800;
   ```

15. **HEX_6**: `#c82333` (라인 163)
   ```
   background-color: #c82333;
   ```

16. **HEX_6**: `#f3f3f3` (라인 181)
   ```
   border: 2px solid #f3f3f3;
   ```

17. **HEX_6**: `#dee2e6` (라인 204)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

18. **HEX_6**: `#495057` (라인 205)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#dee2e6` (라인 223)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

20. **HEX_6**: `#2c3e50` (라인 250)
   ```
   color: #2c3e50;
   ```

21. **HEX_6**: `#495057` (라인 275)
   ```
   color: #495057;
   ```

22. **HEX_6**: `#f8d7da` (라인 281)
   ```
   background: #f8d7da;
   ```

23. **HEX_6**: `#721c24` (라인 282)
   ```
   color: #721c24;
   ```

24. **HEX_6**: `#f5c6cb` (라인 286)
   ```
   border: 1px solid #f5c6cb;
   ```

25. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 74)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantSchedule.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#45a049` (라인 36)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

2. **HEX_6**: `#764ba2` (라인 54)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #764ba2);
   ```

3. **HEX_6**: `#F57C00` (라인 72)
   ```
   background: linear-gradient(135deg, var(--color-warning), #F57C00);
   ```

4. **HEX_6**: `#ffb300` (라인 183)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #ffb300 100%);
   ```

5. **HEX_6**: `#ffb300` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

6. **HEX_6**: `#ffa000` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

7. **HEX_6**: `#764ba2` (라인 286)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

8. **HEX_6**: `#45a049` (라인 387)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

9. **RGB**: `rgb(76, 175, 80)` (라인 156)
   ```
   .fc-event[style*="background-color: rgb(76, 175, 80)"] {
   ```

10. **RGB**: `rgb(33, 150, 243)` (라인 162)
   ```
   .fc-event[style*="background-color: rgb(33, 150, 243)"] {
   ```

11. **RGB**: `rgb(255, 152, 0)` (라인 168)
   ```
   .fc-event[style*="background-color: rgb(255, 152, 0)"] {
   ```

12. **RGB**: `rgb(244, 67, 54)` (라인 174)
   ```
   .fc-event[style*="background-color: rgb(244, 67, 54)"] {
   ```

13. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 45)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

14. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 50)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
   ```

16. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 68)
   ```
   box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
   ```

17. **RGBA**: `rgba(255, 152, 0, 0.3)` (라인 81)
   ```
   box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
   ```

18. **RGBA**: `rgba(255, 152, 0, 0.4)` (라인 86)
   ```
   box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
   ```

19. **RGBA**: `rgba(255, 193, 7, 0.4)` (라인 185)
   ```
   box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 188)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
   ```

21. **RGBA**: `rgba(255, 193, 7, 0.5)` (라인 196)
   ```
   box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 318)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

24. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 389)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

25. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 394)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

---

### 📁 `frontend/src/components/admin/Dashboard3DPreview.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#f9fafb` (라인 11)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

2. **HEX_6**: `#e5e7eb` (라인 13)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#e5e7eb` (라인 38)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

4. **HEX_6**: `#1f2937` (라인 51)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

5. **HEX_6**: `#f9fafb` (라인 68)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

6. **HEX_6**: `#e5e7eb` (라인 69)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#6b7280` (라인 73)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

8. **HEX_6**: `#f3f4f6` (라인 78)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

9. **HEX_6**: `#6b7280` (라인 85)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

10. **HEX_6**: `#764ba2` (라인 97)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

11. **HEX_6**: `#f9fafb` (라인 142)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

12. **HEX_6**: `#e5e7eb` (라인 143)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

13. **HEX_6**: `#e5e7eb` (라인 162)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

14. **HEX_6**: `#1f2937` (라인 172)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

15. **HEX_6**: `#9ca3af` (라인 185)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

16. **HEX_6**: `#6b7280` (라인 196)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

17. **HEX_6**: `#f9fafb` (라인 197)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

18. **HEX_6**: `#e5e7eb` (라인 199)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

19. **HEX_6**: `#e5e7eb` (라인 212)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

20. **HEX_6**: `#6b7280` (라인 218)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 113)
   ```
   radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 114)
   ```
   radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 132)
   ```
   0 20px 25px -5px rgba(0, 0, 0, 0.3),
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 133)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.2),
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 134)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/common/common.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#4A90E2` (라인 13)
   ```
   --primary-color: #4A90E2;
   ```

2. **HEX_6**: `#357ABD` (라인 14)
   ```
   --primary-dark: #357ABD;
   ```

3. **HEX_6**: `#7BB3F0` (라인 15)
   ```
   --primary-light: #7BB3F0;
   ```

4. **HEX_6**: `#F5A623` (라인 16)
   ```
   --secondary-color: #F5A623;
   ```

5. **HEX_6**: `#D68910` (라인 17)
   ```
   --secondary-dark: #D68910;
   ```

6. **HEX_6**: `#F7C653` (라인 18)
   ```
   --secondary-light: #F7C653;
   ```

7. **HEX_6**: `#F9FAFB` (라인 22)
   ```
   --gray-50: #F9FAFB;
   ```

8. **HEX_6**: `#F3F4F6` (라인 23)
   ```
   --gray-100: #F3F4F6;
   ```

9. **HEX_6**: `#E5E7EB` (라인 24)
   ```
   --gray-200: #E5E7EB;
   ```

10. **HEX_6**: `#D1D5DB` (라인 25)
   ```
   --gray-300: #D1D5DB;
   ```

11. **HEX_6**: `#9CA3AF` (라인 26)
   ```
   --gray-400: #9CA3AF;
   ```

12. **HEX_6**: `#6B7280` (라인 27)
   ```
   --gray-500: #6B7280;
   ```

13. **HEX_6**: `#4B5563` (라인 28)
   ```
   --gray-600: #4B5563;
   ```

14. **HEX_6**: `#374151` (라인 29)
   ```
   --gray-700: #374151;
   ```

15. **HEX_6**: `#1F2937` (라인 30)
   ```
   --gray-800: #1F2937;
   ```

16. **HEX_6**: `#111827` (라인 31)
   ```
   --gray-900: #111827;
   ```

17. **HEX_6**: `#f3f4f6` (라인 297)
   ```
   border: 4px solid #f3f4f6;
   ```

18. **HEX_6**: `#6b7280` (라인 307)
   ```
   color: #6b7280;
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 57)
   ```
   --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 58)
   ```
   --shadow-md: 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 59)
   ```
   --shadow-lg: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 60)
   ```
   --shadow-xl: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 273)
   ```
   background-color: rgba(255, 255, 255, 0.9);
   ```

---

### 📁 `frontend/src/components/onboarding/OnboardingRequest.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_3**: `#333` (라인 20)
   ```
   color: #333;
   ```

2. **HEX_3**: `#666` (라인 24)
   ```
   color: #666;
   ```

3. **HEX_3**: `#fee` (라인 30)
   ```
   background: #fee;
   ```

4. **HEX_3**: `#fcc` (라인 31)
   ```
   border: 1px solid #fcc;
   ```

5. **HEX_3**: `#c33` (라인 32)
   ```
   color: #c33;
   ```

6. **HEX_3**: `#333` (라인 52)
   ```
   color: #333;
   ```

7. **HEX_3**: `#e33` (라인 57)
   ```
   color: #e33;
   ```

8. **HEX_3**: `#ddd` (라인 70)
   ```
   border: 1px solid #ddd;
   ```

9. **HEX_3**: `#333` (라인 73)
   ```
   color: #333;
   ```

10. **HEX_3**: `#666` (라인 94)
   ```
   color: #666;
   ```

11. **HEX_3**: `#ddd` (라인 99)
   ```
   border: 1px solid #ddd;
   ```

12. **HEX_3**: `#666` (라인 117)
   ```
   color: #666;
   ```

13. **HEX_3**: `#eee` (라인 128)
   ```
   border-top: 1px solid #eee;
   ```

14. **HEX_3**: `#333` (라인 157)
   ```
   color: #333;
   ```

15. **HEX_6**: `#4a90e2` (라인 81)
   ```
   border-color: #4a90e2;
   ```

16. **HEX_6**: `#f0f7ff` (라인 82)
   ```
   background: #f0f7ff;
   ```

17. **HEX_6**: `#4a90e2` (라인 86)
   ```
   border-color: #4a90e2;
   ```

18. **HEX_6**: `#4a90e2` (라인 87)
   ```
   background: #4a90e2;
   ```

19. **HEX_6**: `#4a90e2` (라인 107)
   ```
   border-color: #4a90e2;
   ```

20. **HEX_6**: `#4a90e2` (라인 147)
   ```
   background: #4a90e2;
   ```

21. **HEX_6**: `#357abd` (라인 152)
   ```
   background: #357abd;
   ```

22. **HEX_6**: `#e5e5e5` (라인 161)
   ```
   background: #e5e5e5;
   ```

23. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 108)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

---

### 📁 `frontend/src/components/mypage/components/PasswordResetModal.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#20c997` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-success-500) 0%, #20c997 100%);
   ```

3. **HEX_6**: `#495057` (라인 108)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#e9ecef` (라인 119)
   ```
   border: 2px solid #e9ecef;
   ```

5. **HEX_6**: `#fff3cd` (라인 156)
   ```
   background-color: #fff3cd;
   ```

6. **HEX_6**: `#ffeaa7` (라인 157)
   ```
   border: 1px solid #ffeaa7;
   ```

7. **HEX_6**: `#856404` (라인 159)
   ```
   color: #856404;
   ```

8. **HEX_6**: `#5a6268` (라인 196)
   ```
   background-color: #5a6268;
   ```

9. **HEX_6**: `#545b62` (라인 197)
   ```
   border-color: #545b62;
   ```

10. **HEX_6**: `#20c997` (라인 203)
   ```
   background: linear-gradient(135deg, var(--mg-success-500) 0%, #20c997 100%);
   ```

11. **HEX_6**: `#218838` (라인 209)
   ```
   background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
   ```

12. **HEX_6**: `#1ea085` (라인 209)
   ```
   background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
   ```

13. **HEX_6**: `#495057` (라인 279)
   ```
   color: #495057;
   ```

14. **HEX_6**: `#20c997` (라인 331)
   ```
   background: linear-gradient(135deg, var(--mg-success-500) 0%, #20c997 100%);
   ```

15. **HEX_6**: `#218838` (라인 337)
   ```
   background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
   ```

16. **HEX_6**: `#1ea085` (라인 337)
   ```
   background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 19)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 79)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

19. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 128)
   ```
   box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
   ```

20. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 134)
   ```
   box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
   ```

21. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 211)
   ```
   box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
   ```

22. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 327)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.15);
   ```

23. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 339)
   ```
   box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
   ```

---

### 📁 `frontend/src/components/hq/BranchForm.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#764ba2` (라인 8)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#e9ecef` (라인 37)
   ```
   border-top: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#e9ecef` (라인 47)
   ```
   border: 1px solid #e9ecef;
   ```

4. **HEX_6**: `#495057` (라인 55)
   ```
   color: #495057;
   ```

5. **HEX_6**: `#ced4da` (라인 68)
   ```
   border: 1px solid #ced4da;
   ```

6. **HEX_6**: `#495057` (라인 96)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#495057` (라인 126)
   ```
   color: #495057;
   ```

8. **HEX_6**: `#e9ecef` (라인 138)
   ```
   border: 1px solid #e9ecef;
   ```

9. **HEX_6**: `#198754` (라인 149)
   ```
   background-color: #198754;
   ```

10. **HEX_6**: `#198754` (라인 150)
   ```
   border-color: #198754;
   ```

11. **HEX_6**: `#0056b3` (라인 172)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #0056b3 100%);
   ```

12. **HEX_6**: `#0056b3` (라인 177)
   ```
   background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
   ```

13. **HEX_6**: `#004085` (라인 177)
   ```
   background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
   ```

14. **HEX_6**: `#545b62` (라인 181)
   ```
   background: linear-gradient(135deg, var(--mg-secondary-500) 0%, #545b62 100%);
   ```

15. **HEX_6**: `#545b62` (라인 186)
   ```
   background: linear-gradient(135deg, #545b62 0%, #3d4449 100%);
   ```

16. **HEX_6**: `#3d4449` (라인 186)
   ```
   background: linear-gradient(135deg, #545b62 0%, #3d4449 100%);
   ```

17. **HEX_6**: `#f1f1f1` (라인 281)
   ```
   background: #f1f1f1;
   ```

18. **HEX_6**: `#c1c1c1` (라인 287)
   ```
   background: #c1c1c1;
   ```

19. **HEX_6**: `#a8a8a8` (라인 292)
   ```
   background: #a8a8a8;
   ```

20. **RGBA**: `rgba(0,123,255,0.25)` (라인 79)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

21. **RGBA**: `rgba(220,53,69,0.25)` (라인 90)
   ```
   box-shadow: 0 0 0 0.2rem rgba(220,53,69,0.25);
   ```

22. **RGBA**: `rgba(0,123,255,0.25)` (라인 121)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

23. **RGBA**: `rgba(0,0,0,0.15)` (라인 164)
   ```
   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationReport.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#e9ecef` (라인 9)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 38)
   ```
   background: #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 39)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#495057` (라인 46)
   ```
   color: #495057;
   ```

5. **HEX_6**: `#f0f0f0` (라인 68)
   ```
   border: 1px solid #f0f0f0;
   ```

6. **HEX_6**: `#2c3e50` (라인 85)
   ```
   color: #2c3e50;
   ```

7. **HEX_6**: `#e9ecef` (라인 91)
   ```
   border: 2px solid #e9ecef;
   ```

8. **HEX_6**: `#fafbfc` (라인 94)
   ```
   background: #fafbfc;
   ```

9. **HEX_6**: `#495057` (라인 96)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#e9ecef` (라인 126)
   ```
   border: 1px solid #e9ecef;
   ```

11. **HEX_6**: `#0056b3` (라인 142)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #0056b3);
   ```

12. **HEX_6**: `#495057` (라인 165)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#e9ecef` (라인 180)
   ```
   border: 1px solid #e9ecef;
   ```

14. **HEX_6**: `#495057` (라인 187)
   ```
   color: #495057;
   ```

15. **HEX_6**: `#e9ecef` (라인 188)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

16. **HEX_6**: `#495057` (라인 208)
   ```
   color: #495057;
   ```

17. **HEX_6**: `#495057` (라인 227)
   ```
   color: #495057;
   ```

18. **HEX_6**: `#495057` (라인 255)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#495057` (라인 290)
   ```
   color: #495057;
   ```

20. **HEX_6**: `#0056b3` (라인 311)
   ```
   background: #0056b3;
   ```

21. **HEX_6**: `#e9ecef` (라인 351)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 67)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

23. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 103)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/test/UnifiedHeaderTest.js` (JS)

**하드코딩 색상**: 23개

1. **HEX_3**: `#ddd` (라인 49)
   ```
   style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
   ```

2. **HEX_3**: `#ddd` (라인 64)
   ```
   style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
   ```

3. **HEX_6**: `#1f2937` (라인 109)
   ```
   <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
   ```

4. **HEX_6**: `#374151` (라인 114)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

5. **HEX_6**: `#6b7280` (라인 117)
   ```
   <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
   ```

6. **HEX_6**: `#6b7280` (라인 120)
   ```
   <ul style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', paddingLeft: '20px' }}>
   ```

7. **HEX_6**: `#374151` (라인 130)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

8. **HEX_6**: `#f9fafb` (라인 134)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

9. **HEX_6**: `#e5e7eb` (라인 134)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

10. **HEX_6**: `#6b7280` (라인 136)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>표준 높이와 패딩</p>
   ```

11. **HEX_6**: `#f9fafb` (라인 138)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

12. **HEX_6**: `#e5e7eb` (라인 138)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

13. **HEX_6**: `#6b7280` (라인 140)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>작은 높이와 패딩</p>
   ```

14. **HEX_6**: `#f9fafb` (라인 142)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

15. **HEX_6**: `#e5e7eb` (라인 142)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

16. **HEX_6**: `#6b7280` (라인 144)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>투명 배경과 테두리</p>
   ```

17. **HEX_6**: `#374151` (라인 150)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

18. **HEX_6**: `#6b7280` (라인 153)
   ```
   <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
   ```

19. **HEX_6**: `#f3f4f6` (라인 159)
   ```
   <div style={{ height: '200vh', background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)', margin: '0 -20px', padding: '40px 20px' }}>
   ```

20. **HEX_6**: `#e5e7eb` (라인 159)
   ```
   <div style={{ height: '200vh', background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)', margin: '0 -20px', padding: '40px 20px' }}>
   ```

21. **HEX_6**: `#374151` (라인 161)
   ```
   <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

22. **HEX_6**: `#6b7280` (라인 164)
   ```
   <p style={{ fontSize: '18px', color: '#6b7280' }}>
   ```

23. **RGBA**: `rgba(0,0,0,0.1)` (라인 37)
   ```
   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/Widget.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_3**: `#333` (라인 34)
   ```
   color: #333;
   ```

2. **HEX_3**: `#ddd` (라인 166)
   ```
   border: 1px solid #ddd;
   ```

3. **HEX_3**: `#ddd` (라인 217)
   ```
   border: 1px solid #ddd;
   ```

4. **HEX_6**: `#f8d7da` (라인 48)
   ```
   background: #f8d7da;
   ```

5. **HEX_6**: `#f8d7da` (라인 230)
   ```
   background: #f8d7da;
   ```

6. **HEX_6**: `#d4edda` (라인 238)
   ```
   background: #d4edda;
   ```

7. **HEX_6**: `#e9ecef` (라인 293)
   ```
   border: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#495057` (라인 298)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#e9ecef` (라인 303)
   ```
   background: #e9ecef;
   ```

10. **HEX_6**: `#fef2f2` (라인 414)
   ```
   background-color: var(--mg-error-50, #fef2f2);
   ```

11. **HEX_6**: `#fecaca` (라인 415)
   ```
   border: 1px solid var(--mg-error-200, #fecaca);
   ```

12. **HEX_6**: `#b91c1c` (라인 416)
   ```
   color: var(--mg-error-700, #b91c1c);
   ```

13. **HEX_6**: `#fef2f2` (라인 768)
   ```
   background-color: var(--mg-error-50, #fef2f2);
   ```

14. **HEX_6**: `#fecaca` (라인 769)
   ```
   border: 1px solid var(--mg-error-200, #fecaca);
   ```

15. **HEX_6**: `#b91c1c` (라인 770)
   ```
   color: var(--mg-error-700, #b91c1c);
   ```

16. **HEX_6**: `#fef2f2` (라인 931)
   ```
   background-color: var(--mg-error-50, #fef2f2);
   ```

17. **HEX_6**: `#fecaca` (라인 932)
   ```
   border: 1px solid var(--mg-error-200, #fecaca);
   ```

18. **HEX_6**: `#b91c1c` (라인 933)
   ```
   color: var(--mg-error-700, #b91c1c);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 449)
   ```
   --widget-shadow: var(--mg-shadow-dark-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 803)
   ```
   --widget-shadow: var(--mg-shadow-dark-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 966)
   ```
   --widget-shadow: var(--mg-shadow-dark-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
   ```

---

### 📁 `frontend/src/components/admin/DashboardLayoutEditor.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#f9fafb` (라인 16)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

2. **HEX_6**: `#e5e7eb` (라인 18)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#e5e7eb` (라인 26)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

4. **HEX_6**: `#1f2937` (라인 33)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

5. **HEX_6**: `#6b7280` (라인 40)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

6. **HEX_6**: `#e5e7eb` (라인 139)
   ```
   border: var(--mg-border-width, 2px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#f9fafb` (라인 156)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

8. **HEX_6**: `#f9fafb` (라인 176)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

9. **HEX_6**: `#e5e7eb` (라인 177)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

10. **HEX_6**: `#9ca3af` (라인 182)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

11. **HEX_6**: `#1f2937` (라인 197)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

12. **HEX_6**: `#6b7280` (라인 209)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

13. **HEX_6**: `#f3f4f6` (라인 220)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

14. **HEX_6**: `#1f2937` (라인 221)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

15. **HEX_6**: `#1f2937` (라인 249)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

16. **HEX_6**: `#9ca3af` (라인 254)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

17. **HEX_6**: `#6b7280` (라인 261)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

18. **HEX_6**: `#e5e7eb` (라인 264)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 150)
   ```
   box-shadow: var(--mg-shadow-md, 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 162)
   ```
   box-shadow: var(--mg-shadow-lg, 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
   ```

21. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 225)
   ```
   background: var(--mg-danger-alpha, rgba(239, 68, 68, 0.1));
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantMessageScreen.js` (JS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#e9ecef` (라인 56)
   ```
   border: '1px solid #e9ecef'
   ```

2. **HEX_6**: `#2c3e50` (라인 61)
   ```
   color: '#2c3e50',
   ```

3. **HEX_6**: `#e9ecef` (라인 78)
   ```
   border: '1px solid #e9ecef'
   ```

4. **HEX_6**: `#2c3e50` (라인 83)
   ```
   color: '#2c3e50',
   ```

5. **HEX_6**: `#2c3e50` (라인 108)
   ```
   color: '#2c3e50',
   ```

6. **HEX_6**: `#e9ecef` (라인 116)
   ```
   border: '1px solid #e9ecef'
   ```

7. **HEX_6**: `#2c3e50` (라인 121)
   ```
   color: '#2c3e50',
   ```

8. **HEX_6**: `#495057` (라인 140)
   ```
   color: '#495057',
   ```

9. **HEX_6**: `#e9ecef` (라인 145)
   ```
   border: '2px solid #e9ecef',
   ```

10. **HEX_6**: `#e9ecef` (라인 153)
   ```
   border: '2px solid #e9ecef',
   ```

11. **HEX_6**: `#e9ecef` (라인 164)
   ```
   border: '2px solid #e9ecef',
   ```

12. **HEX_6**: `#495057` (라인 194)
   ```
   color: '#495057',
   ```

13. **HEX_6**: `#e9ecef` (라인 204)
   ```
   border: '2px solid #e9ecef',
   ```

14. **HEX_6**: `#f8f9ff` (라인 213)
   ```
   backgroundColor: '#f8f9ff'
   ```

15. **HEX_6**: `#495057` (라인 222)
   ```
   color: '#495057'
   ```

16. **HEX_6**: `#e9ecef` (라인 230)
   ```
   borderTop: '1px solid #e9ecef'
   ```

17. **RGBA**: `rgba(0,0,0,0.1)` (라인 55)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

18. **RGBA**: `rgba(0,0,0,0.1)` (라인 77)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

19. **RGBA**: `rgba(0,0,0,0.1)` (라인 115)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

20. **RGBA**: `rgba(0,123,255,0.1)` (라인 173)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
   ```

21. **RGBA**: `rgba(0,0,0,0.5)` (라인 262)
   ```
   backgroundColor: 'rgba(0,0,0,0.5)',
   ```

---

### 📁 `frontend/src/components/common/MGForm.js` (JS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#D2B48C` (라인 27)
   ```
   card: "bg-[var(--mg-cream)] p-6 rounded-xl border border-[#D2B48C]/20 shadow-sm space-y-4",
   ```

2. **HEX_6**: `#D2B48C` (라인 54)
   ```
   <div className="animate-spin text-[#D2B48C]">⟳</div>
   ```

3. **HEX_6**: `#6B7C32` (라인 77)
   ```
   <label className="block text-sm font-medium text-[#6B7C32]">
   ```

4. **HEX_6**: `#9CAF88` (라인 86)
   ```
   <div className="text-xs text-[#9CAF88]">
   ```

5. **HEX_6**: `#9CAF88` (라인 130)
   ```
   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
   ```

6. **HEX_6**: `#D2B48C` (라인 144)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

7. **HEX_6**: `#6B7C32` (라인 145)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

8. **HEX_6**: `#6B7C32` (라인 145)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

9. **HEX_6**: `#6B7C32` (라인 146)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

10. **HEX_6**: `#9CAF88` (라인 146)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

11. **HEX_6**: `#9CAF88` (라인 157)
   ```
   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
   ```

12. **HEX_6**: `#D2B48C` (라인 202)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

13. **HEX_6**: `#6B7C32` (라인 203)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

14. **HEX_6**: `#6B7C32` (라인 203)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

15. **HEX_6**: `#6B7C32` (라인 204)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

16. **HEX_6**: `#9CAF88` (라인 204)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

17. **HEX_6**: `#D2B48C` (라인 251)
   ```
   w-full px-3 py-2 pr-10 rounded-lg border border-[#D2B48C]
   ```

18. **HEX_6**: `#6B7C32` (라인 252)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

19. **HEX_6**: `#6B7C32` (라인 252)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

20. **HEX_6**: `#6B7C32` (라인 253)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32]
   ```

21. **HEX_6**: `#9CAF88` (라인 268)
   ```
   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88] pointer-events-none">▼</div>
   ```

---

### 📁 `frontend/src/pages/PremiumDesignSample.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#764ba2` (라인 8)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#feca57` (라인 43)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #feca57);
   ```

3. **HEX_6**: `#48cae4` (라인 52)
   ```
   background: linear-gradient(135deg, #48cae4, #023e8a);
   ```

4. **HEX_6**: `#023e8a` (라인 52)
   ```
   background: linear-gradient(135deg, #48cae4, #023e8a);
   ```

5. **HEX_6**: `#ff9ff3` (라인 61)
   ```
   background: linear-gradient(135deg, #ff9ff3, #f368e0);
   ```

6. **HEX_6**: `#f368e0` (라인 61)
   ```
   background: linear-gradient(135deg, #ff9ff3, #f368e0);
   ```

7. **HEX_6**: `#1a202c` (라인 180)
   ```
   color: #1a202c;
   ```

8. **HEX_6**: `#718096` (라인 186)
   ```
   color: #718096;
   ```

9. **HEX_6**: `#38a169` (라인 201)
   ```
   color: #38a169;
   ```

10. **HEX_6**: `#1a202c` (라인 242)
   ```
   color: #1a202c;
   ```

11. **HEX_6**: `#4a5568` (라인 248)
   ```
   color: #4a5568;
   ```

12. **HEX_6**: `#1a202c` (라인 268)
   ```
   color: #1a202c;
   ```

13. **HEX_6**: `#1a202c` (라인 303)
   ```
   color: #1a202c;
   ```

14. **HEX_6**: `#718096` (라인 309)
   ```
   color: #718096;
   ```

15. **HEX_6**: `#1a202c` (라인 330)
   ```
   color: #1a202c;
   ```

16. **HEX_6**: `#4a5568` (라인 336)
   ```
   color: #4a5568;
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 125)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 151)
   ```
   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 152)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

20. **RGBA**: `rgba(72, 187, 120, 0.1)` (라인 200)
   ```
   background: rgba(72, 187, 120, 0.1);
   ```

---

### 📁 `frontend/src/components/test/IntegrationTest.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_3**: `#eee` (라인 29)
   ```
   border-bottom: 1px solid #eee;
   ```

2. **HEX_3**: `#333` (라인 34)
   ```
   color: #333;
   ```

3. **HEX_3**: `#666` (라인 43)
   ```
   color: #666;
   ```

4. **HEX_3**: `#eee` (라인 80)
   ```
   border-top: 1px solid #eee;
   ```

5. **HEX_3**: `#333` (라인 85)
   ```
   color: #333;
   ```

6. **HEX_3**: `#333` (라인 118)
   ```
   color: #333;
   ```

7. **HEX_3**: `#666` (라인 123)
   ```
   color: #666;
   ```

8. **HEX_3**: `#999` (라인 128)
   ```
   color: #999;
   ```

9. **HEX_3**: `#eee` (라인 135)
   ```
   border-top: 1px solid #eee;
   ```

10. **HEX_3**: `#333` (라인 140)
   ```
   color: #333;
   ```

11. **HEX_3**: `#333` (라인 161)
   ```
   color: #333;
   ```

12. **HEX_3**: `#333` (라인 170)
   ```
   color: #333;
   ```

13. **HEX_3**: `#666` (라인 180)
   ```
   color: #666;
   ```

14. **HEX_3**: `#666` (라인 187)
   ```
   color: #666;
   ```

15. **HEX_6**: `#dee2e6` (라인 8)
   ```
   border: 1px solid #dee2e6;
   ```

16. **HEX_6**: `#212529` (라인 68)
   ```
   color: #212529;
   ```

17. **HEX_6**: `#e9ecef` (라인 95)
   ```
   border: 1px solid #e9ecef;
   ```

18. **HEX_6**: `#e9ecef` (라인 156)
   ```
   border: 1px solid #e9ecef;
   ```

19. **HEX_6**: `#f3f3f3` (라인 193)
   ```
   border: 4px solid #f3f3f3;
   ```

20. **RGBA**: `rgba(0,0,0,0.1)` (라인 12)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/schedule/steps/ClientSelectionStep.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#1D1D1F` (라인 16)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

2. **HEX_6**: `#424245` (라인 23)
   ```
   color: var(--color-text-secondary, #424245);
   ```

3. **HEX_6**: `#E3F2FD` (라인 31)
   ```
   background: var(--color-primary-light, #E3F2FD);
   ```

4. **HEX_6**: `#424245` (라인 51)
   ```
   color: var(--color-text-secondary, #424245);
   ```

5. **HEX_6**: `#E8F5E8` (라인 61)
   ```
   background: var(--color-success-light, #E8F5E8);
   ```

6. **HEX_6**: `#155724` (라인 81)
   ```
   color: var(--color-success-dark, #155724);
   ```

7. **HEX_6**: `#FFF3CD` (라인 142)
   ```
   background: var(--color-warning-light, #FFF3CD);
   ```

8. **HEX_6**: `#856404` (라인 159)
   ```
   color: var(--color-warning-dark, #856404);
   ```

9. **HEX_6**: `#856404` (라인 166)
   ```
   color: var(--color-warning-dark, #856404);
   ```

10. **HEX_6**: `#0056CC` (라인 205)
   ```
   background-color: var(--color-primary-hover, #0056CC);
   ```

11. **HEX_6**: `#E8E8ED` (라인 216)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

12. **HEX_6**: `#A1A1A6` (라인 221)
   ```
   background: var(--color-border-accent, #A1A1A6);
   ```

13. **HEX_6**: `#8E8E93` (라인 226)
   ```
   background: var(--color-text-muted, #8E8E93);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 34)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

15. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 53)
   ```
   background-color: var(--color-bg-primary, rgba(250, 250, 250, 0.8));
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 64)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

17. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 83)
   ```
   background-color: var(--color-bg-primary, rgba(250, 250, 250, 0.8));
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 145)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 193)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

20. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 207)
   ```
   box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 122, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/hq/BranchList.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#e9ecef` (라인 9)
   ```
   border: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 17)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 23)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#e9ecef` (라인 39)
   ```
   border: 1px solid #e9ecef;
   ```

5. **HEX_6**: `#e9ecef` (라인 55)
   ```
   border: 1px solid #e9ecef;
   ```

6. **HEX_6**: `#f8f9ff` (라인 72)
   ```
   background: #f8f9ff;
   ```

7. **HEX_6**: `#e9ecef` (라인 93)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#e9ecef` (라인 119)
   ```
   background: #e9ecef;
   ```

9. **HEX_6**: `#495057` (라인 120)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#495057` (라인 135)
   ```
   color: #495057;
   ```

11. **HEX_6**: `#e83e8c` (라인 162)
   ```
   color: #e83e8c;
   ```

12. **HEX_6**: `#495057` (라인 184)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#e9ecef` (라인 188)
   ```
   border: 1px solid #e9ecef;
   ```

14. **HEX_6**: `#e9ecef` (라인 201)
   ```
   border-top: 1px solid #e9ecef;
   ```

15. **HEX_6**: `#ced4da` (라인 296)
   ```
   border: 1px solid #ced4da;
   ```

16. **RGBA**: `rgba(0,0,0,0.1)` (라인 11)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

17. **RGBA**: `rgba(0,0,0,0.1)` (라인 41)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

18. **RGBA**: `rgba(0,123,255,0.15)` (라인 66)
   ```
   box-shadow: 0 4px 16px rgba(0,123,255,0.15);
   ```

19. **RGBA**: `rgba(0,123,255,0.2)` (라인 73)
   ```
   box-shadow: 0 4px 16px rgba(0,123,255,0.2);
   ```

20. **RGBA**: `rgba(0,123,255,0.25)` (라인 303)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

---

### 📁 `frontend/src/components/common/MGLoading.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#718096` (라인 16)
   ```
   color: #718096;
   ```

2. **HEX_6**: `#48cae4` (라인 56)
   ```
   border-top-color: #48cae4;
   ```

3. **HEX_6**: `#ff9ff3` (라인 61)
   ```
   border-top-color: #ff9ff3;
   ```

4. **HEX_6**: `#48cae4` (라인 102)
   ```
   background: #48cae4;
   ```

5. **HEX_6**: `#ff9ff3` (라인 106)
   ```
   background: #ff9ff3;
   ```

6. **HEX_6**: `#48cae4` (라인 146)
   ```
   background: #48cae4;
   ```

7. **HEX_6**: `#ff9ff3` (라인 150)
   ```
   background: #ff9ff3;
   ```

8. **HEX_6**: `#f0f0f0` (라인 166)
   ```
   background: linear-gradient(90deg, #f0f0f0 25%, var(--mg-gray-300) 50%, #f0f0f0 75%);
   ```

9. **HEX_6**: `#f0f0f0` (라인 166)
   ```
   background: linear-gradient(90deg, #f0f0f0 25%, var(--mg-gray-300) 50%, #f0f0f0 75%);
   ```

10. **HEX_6**: `#f0f0f0` (라인 203)
   ```
   background: #f0f0f0;
   ```

11. **HEX_6**: `#764ba2` (라인 220)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

12. **HEX_6**: `#4a5568` (라인 240)
   ```
   color: #4a5568;
   ```

13. **HEX_6**: `#718096` (라인 246)
   ```
   color: #718096;
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 26)
   ```
   border: 3px solid rgba(102, 126, 234, 0.2);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 52)
   ```
   border-color: rgba(102, 126, 234, 0.2);
   ```

16. **RGBA**: `rgba(72, 202, 228, 0.2)` (라인 57)
   ```
   border-color: rgba(72, 202, 228, 0.2);
   ```

17. **RGBA**: `rgba(255, 159, 243, 0.2)` (라인 62)
   ```
   border-color: rgba(255, 159, 243, 0.2);
   ```

18. **RGBA**: `rgba(255, 107, 107, 0.2)` (라인 67)
   ```
   border-color: rgba(255, 107, 107, 0.2);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 234)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 258)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/MappingManagement.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#FAFAFA` (라인 15)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#1D1D1F` (라인 25)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

3. **HEX_6**: `#0056CC` (라인 26)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)) 0%, var(--color-primary-hover, #0056CC) 100%);
   ```

4. **HEX_6**: `#424245` (라인 35)
   ```
   color: var(--color-text-secondary, #424245);
   ```

5. **HEX_6**: `#FAFAFA` (라인 40)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

6. **HEX_6**: `#424245` (라인 59)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#1D1D1F` (라인 72)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

8. **HEX_6**: `#FAFAFA` (라인 86)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#F5F5F7` (라인 94)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

10. **HEX_6**: `#1D1D1F` (라인 98)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

11. **HEX_6**: `#0056CC` (라인 130)
   ```
   background-color: var(--color-primary-hover, #0056CC);
   ```

12. **HEX_6**: `#5a6268` (라인 141)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

13. **HEX_6**: `#218838` (라인 151)
   ```
   background-color: var(--color-success-dark, #218838);
   ```

14. **HEX_6**: `#c82333` (라인 161)
   ```
   background-color: var(--color-danger-dark, #c82333);
   ```

15. **HEX_6**: `#1D1D1F` (라인 167)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

16. **HEX_6**: `#e0a800` (라인 171)
   ```
   background-color: var(--color-warning-dark, #e0a800);
   ```

17. **HEX_6**: `#138496` (라인 181)
   ```
   background-color: var(--color-info-dark, #138496);
   ```

18. **HEX_6**: `#F5F5F7` (라인 280)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

19. **HEX_6**: `#F5F5F7` (라인 293)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

20. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 132)
   ```
   box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 123, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeForm.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#d1d5db` (라인 14)
   ```
   border: 1px solid #d1d5db;
   ```

2. **HEX_6**: `#1f2937` (라인 68)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 76)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#f3f4f6` (라인 84)
   ```
   background: #f3f4f6;
   ```

5. **HEX_6**: `#374151` (라인 85)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#374151` (라인 108)
   ```
   color: #374151;
   ```

7. **HEX_6**: `#f9fafb` (라인 123)
   ```
   background-color: #f9fafb;
   ```

8. **HEX_6**: `#fef2f2` (라인 137)
   ```
   background-color: #fef2f2;
   ```

9. **HEX_6**: `#374151` (라인 152)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#6b7280` (라인 192)
   ```
   color: #6b7280;
   ```

11. **HEX_6**: `#f9fafb` (라인 197)
   ```
   background: #f9fafb;
   ```

12. **HEX_6**: `#d1d5db` (라인 198)
   ```
   border-color: #d1d5db;
   ```

13. **HEX_6**: `#374151` (라인 199)
   ```
   color: #374151;
   ```

14. **HEX_6**: `#1d4ed8` (라인 203)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

15. **HEX_6**: `#1d4ed8` (라인 208)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

16. **HEX_6**: `#1e40af` (라인 208)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

17. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 30)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 53)
   ```
   box-shadow: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

19. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 131)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

20. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 210)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultationRecordScreen.js` (JS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#fd7e14` (라인 52)
   ```
   { value: 'HIGH', label: '높음', icon: '🟠', color: '#fd7e14', description: '높은 우선순위' },
   ```

2. **HEX_6**: `#6f42c1` (라인 54)
   ```
   { value: 'CRITICAL', label: '위험', icon: '🚨', color: '#6f42c1', description: '위험 우선순위' }
   ```

3. **HEX_6**: `#e9ecef` (라인 119)
   ```
   border: '1px solid #e9ecef'
   ```

4. **HEX_6**: `#2c3e50` (라인 124)
   ```
   color: '#2c3e50',
   ```

5. **HEX_6**: `#e9ecef` (라인 141)
   ```
   border: '1px solid #e9ecef'
   ```

6. **HEX_6**: `#2c3e50` (라인 146)
   ```
   color: '#2c3e50',
   ```

7. **HEX_6**: `#2c3e50` (라인 171)
   ```
   color: '#2c3e50',
   ```

8. **HEX_6**: `#e9ecef` (라인 179)
   ```
   border: '1px solid #e9ecef'
   ```

9. **HEX_6**: `#2c3e50` (라인 184)
   ```
   color: '#2c3e50',
   ```

10. **HEX_6**: `#495057` (라인 203)
   ```
   color: '#495057',
   ```

11. **HEX_6**: `#e9ecef` (라인 208)
   ```
   border: '2px solid #e9ecef',
   ```

12. **HEX_6**: `#e9ecef` (라인 216)
   ```
   border: '2px solid #e9ecef',
   ```

13. **HEX_6**: `#e9ecef` (라인 227)
   ```
   border: '2px solid #e9ecef',
   ```

14. **HEX_6**: `#e9ecef` (라인 244)
   ```
   borderTop: '1px solid #e9ecef'
   ```

15. **HEX_6**: `#e9ecef` (라인 281)
   ```
   backgroundColor: '#e9ecef',
   ```

16. **RGBA**: `rgba(0,0,0,0.1)` (라인 118)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

17. **RGBA**: `rgba(0,0,0,0.1)` (라인 140)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

18. **RGBA**: `rgba(0,0,0,0.1)` (라인 178)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

19. **RGBA**: `rgba(0,123,255,0.1)` (라인 236)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
   ```

20. **RGBA**: `rgba(0,0,0,0.5)` (라인 297)
   ```
   backgroundColor: 'rgba(0,0,0,0.5)',
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationForm.css` (CSS)

**하드코딩 색상**: 19개

1. **HEX_3**: `#666` (라인 29)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#666` (라인 176)
   ```
   color: var(--mg-text-secondary, #666);
   ```

3. **HEX_3**: `#999` (라인 217)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

4. **HEX_3**: `#999` (라인 224)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

5. **HEX_6**: `#1a1a1a` (라인 24)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

6. **HEX_6**: `#d1ecf1` (라인 45)
   ```
   background: #d1ecf1;
   ```

7. **HEX_6**: `#bee5eb` (라인 46)
   ```
   border: 1px solid #bee5eb;
   ```

8. **HEX_6**: `#0c5460` (라인 47)
   ```
   color: #0c5460;
   ```

9. **HEX_6**: `#fff3cd` (라인 51)
   ```
   background: #fff3cd;
   ```

10. **HEX_6**: `#856404` (라인 53)
   ```
   color: #856404;
   ```

11. **HEX_6**: `#1a1a1a` (라인 101)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

12. **HEX_6**: `#1a1a1a` (라인 126)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

13. **HEX_6**: `#4a90e2` (라인 133)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

14. **HEX_6**: `#4a90e2` (라인 181)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

15. **HEX_6**: `#4a90e2` (라인 186)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

16. **HEX_6**: `#4a90e2` (라인 201)
   ```
   accent-color: var(--mg-primary, #4a90e2);
   ```

17. **HEX_6**: `#4a90e2` (라인 257)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

18. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 134)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

19. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 146)
   ```
   box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGForm.css` (CSS)

**하드코딩 색상**: 19개

1. **HEX_6**: `#4a5568` (라인 86)
   ```
   color: #4a5568;
   ```

2. **HEX_6**: `#718096` (라인 129)
   ```
   color: #718096;
   ```

3. **HEX_6**: `#e2e8f0` (라인 143)
   ```
   border: 2px solid #e2e8f0;
   ```

4. **HEX_6**: `#1a202c` (라인 148)
   ```
   color: #1a202c;
   ```

5. **HEX_6**: `#e2e8f0` (라인 195)
   ```
   border: 2px solid #e2e8f0;
   ```

6. **HEX_6**: `#1a202c` (라인 200)
   ```
   color: #1a202c;
   ```

7. **HEX_6**: `#e2e8f0` (라인 238)
   ```
   border: 2px solid #e2e8f0;
   ```

8. **HEX_6**: `#1a202c` (라인 243)
   ```
   color: #1a202c;
   ```

9. **HEX_6**: `#718096` (라인 277)
   ```
   color: #718096;
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 13)
   ```
   box-shadow: 0 8px 32px var(--mg-shadow-light), 0 4px 16px rgba(0, 0, 0, 0.05);
   ```

11. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 14)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

13. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 156)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

14. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 174)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 210)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

16. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 220)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

17. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 253)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

18. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 263)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

19. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 308)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/mypage/components/ProfileImageUpload.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_3**: `#333` (라인 365)
   ```
   color: #333;
   ```

2. **HEX_6**: `#e9ecef` (라인 22)
   ```
   --profile-image-border: 3px solid #e9ecef;
   ```

3. **HEX_6**: `#0056b3` (라인 43)
   ```
   --upload-btn-hover-bg: #0056b3;
   ```

4. **HEX_6**: `#343a40` (라인 55)
   ```
   --close-btn-hover-color: #343a40;
   ```

5. **HEX_6**: `#218838` (라인 67)
   ```
   --crop-btn-hover-bg: #218838;
   ```

6. **HEX_6**: `#5a6268` (라인 70)
   ```
   --cancel-btn-hover-bg: #5a6268;
   ```

7. **HEX_6**: `#e9ecef` (라인 360)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#495057` (라인 386)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#e9ecef` (라인 421)
   ```
   border: 2px solid #e9ecef;
   ```

10. **HEX_6**: `#218838` (라인 446)
   ```
   background: #218838;
   ```

11. **HEX_6**: `#5a6268` (라인 462)
   ```
   background: #5a6268;
   ```

12. **HEX_6**: `#c82333` (라인 489)
   ```
   background-color: #c82333;
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 26)
   ```
   --image-badge-bg: rgba(0, 0, 0, 0.7);
   ```

14. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 31)
   ```
   --drag-overlay-bg: rgba(0, 123, 255, 0.8);
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 44)
   ```
   --crop-overlay-bg: rgba(0, 0, 0, 0.8);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 192)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 337)
   ```
   background: rgba(0, 0, 0, 0.7);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 351)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/hq/BranchUserTransfer.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#764ba2` (라인 9)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#e3f2fd` (라인 30)
   ```
   background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
   ```

3. **HEX_6**: `#f3e5f5` (라인 30)
   ```
   background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
   ```

4. **HEX_6**: `#bbdefb` (라인 31)
   ```
   border: 1px solid #bbdefb;
   ```

5. **HEX_6**: `#e8f5e8` (라인 36)
   ```
   background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
   ```

6. **HEX_6**: `#f1f8e9` (라인 36)
   ```
   background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
   ```

7. **HEX_6**: `#c8e6c9` (라인 37)
   ```
   border: 1px solid #c8e6c9;
   ```

8. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border: 2px solid #e9ecef;
   ```

9. **HEX_6**: `#495057` (라인 68)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#e9ecef` (라인 75)
   ```
   border-top: 1px solid #e9ecef;
   ```

11. **HEX_6**: `#764ba2` (라인 89)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

12. **HEX_6**: `#5a6fd8` (라인 96)
   ```
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   ```

13. **HEX_6**: `#6a4190` (라인 96)
   ```
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   ```

14. **HEX_6**: `#5a6268` (라인 113)
   ```
   background-color: #5a6268;
   ```

15. **HEX_6**: `#545b62` (라인 114)
   ```
   border-color: #545b62;
   ```

16. **RGBA**: `rgba(102, 126, 234, 0.25)` (라인 52)
   ```
   box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
   ```

17. **RGBA**: `rgba(220, 53, 69, 0.25)` (라인 62)
   ```
   box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
   ```

18. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 98)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

---

### 📁 `frontend/src/components/common/MGModal.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#1a202c` (라인 88)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#718096` (라인 96)
   ```
   color: #718096;
   ```

3. **HEX_6**: `#4a5568` (라인 110)
   ```
   color: #4a5568;
   ```

4. **HEX_6**: `#4a5568` (라인 127)
   ```
   color: #4a5568;
   ```

5. **HEX_6**: `#764ba2` (라인 157)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

6. **HEX_6**: `#4a5568` (라인 168)
   ```
   color: #4a5568;
   ```

7. **HEX_6**: `#feca57` (라인 179)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #feca57 100%);
   ```

8. **HEX_6**: `#4a5568` (라인 208)
   ```
   color: #4a5568;
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 25)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

10. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 81)
   ```
   border-bottom: 1px solid rgba(226, 232, 240, 0.6);
   ```

11. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 109)
   ```
   background: rgba(226, 232, 240, 0.5);
   ```

12. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 135)
   ```
   border-top: 1px solid rgba(226, 232, 240, 0.6);
   ```

13. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 163)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 167)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

15. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 169)
   ```
   border: 2px solid rgba(226, 232, 240, 0.8);
   ```

16. **RGBA**: `rgba(255, 255, 255, 1)` (라인 173)
   ```
   background: rgba(255, 255, 255, 1);
   ```

17. **RGBA**: `rgba(255, 107, 107, 0.4)` (라인 185)
   ```
   box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
   ```

18. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 200)
   ```
   border: 4px solid rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/client/RatableConsultationsSection.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#FFB6C1` (라인 92)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

2. **HEX_6**: `#FFC0CB` (라인 92)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

3. **HEX_6**: `#FFB6C1` (라인 185)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

4. **HEX_6**: `#FFC0CB` (라인 185)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

5. **HEX_6**: `#FFD700` (라인 197)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

6. **HEX_6**: `#FFA500` (라인 197)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

7. **RGBA**: `rgba(255, 240, 245, 0.6)` (라인 71)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.6), rgba(255, 245, 250, 0.6));
   ```

8. **RGBA**: `rgba(255, 245, 250, 0.6)` (라인 71)
   ```
   background: linear-gradient(135deg, rgba(255, 240, 245, 0.6), rgba(255, 245, 250, 0.6));
   ```

9. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 72)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.3);
   ```

10. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 79)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.15);
   ```

11. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 84)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.25);
   ```

12. **RGBA**: `rgba(255, 182, 193, 0.5)` (라인 85)
   ```
   border-color: rgba(255, 182, 193, 0.5);
   ```

13. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 97)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

14. **RGBA**: `rgba(255, 245, 235, 0.4)` (라인 169)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

15. **RGBA**: `rgba(255, 250, 240, 0.4)` (라인 169)
   ```
   background: linear-gradient(135deg, rgba(255, 245, 235, 0.4), rgba(255, 250, 240, 0.4));
   ```

16. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 170)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

17. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 189)
   ```
   box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
   ```

18. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 198)
   ```
   box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/samples/ComplexDashboardSample.js` (JS)

**하드코딩 색상**: 18개

1. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 172)
   ```
   background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 180)
   ```
   e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 203)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 207)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 237)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 241)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 271)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 275)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 306)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 310)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 351)
   ```
   borderBottom: index < 2 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
   ```

12. **RGBA**: `rgba(0, 122, 255, 0.04)` (라인 356)
   ```
   e.target.style.background = 'rgba(0, 122, 255, 0.04)';
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 390)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 394)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 434)
   ```
   borderBottom: index < 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
   ```

16. **RGBA**: `rgba(0, 122, 255, 0.04)` (라인 439)
   ```
   e.target.style.background = 'rgba(0, 122, 255, 0.04)';
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 485)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 489)
   ```
   e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
   ```

---

### 📁 `frontend/src/components/erp/PurchaseRequestForm.js` (JS)

**하드코딩 색상**: 18개

1. **HEX_3**: `#333` (라인 302)
   ```
   color: '#333',
   ```

2. **HEX_3**: `#ddd` (라인 339)
   ```
   border: '1px solid #ddd',
   ```

3. **HEX_3**: `#ddd` (라인 360)
   ```
   border: '1px solid #ddd',
   ```

4. **HEX_3**: `#ddd` (라인 372)
   ```
   border: '1px solid #ddd',
   ```

5. **HEX_3**: `#ddd` (라인 405)
   ```
   border: '1px solid #ddd',
   ```

6. **HEX_3**: `#333` (라인 422)
   ```
   <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
   ```

7. **HEX_3**: `#666` (라인 509)
   ```
   <p style={{ color: '#666', marginBottom: '24px' }}>
   ```

8. **HEX_6**: `#e9ecef` (라인 200)
   ```
   border: isItemSelected(item) ? '2px solid var(--mg-primary-500)' : '1px solid #e9ecef',
   ```

9. **HEX_6**: `#f8f9ff` (라인 203)
   ```
   backgroundColor: isItemSelected(item) ? '#f8f9ff' : '#fff',
   ```

10. **HEX_6**: `#212529` (라인 250)
   ```
   color: '#212529',
   ```

11. **HEX_6**: `#e9ecef` (라인 322)
   ```
   border: '1px solid #e9ecef'
   ```

12. **HEX_6**: `#e9ecef` (라인 420)
   ```
   border: '1px solid #e9ecef'
   ```

13. **HEX_6**: `#e9ecef` (라인 437)
   ```
   border: '1px solid #e9ecef'
   ```

14. **HEX_6**: `#e3f2fd` (라인 451)
   ```
   backgroundColor: '#e3f2fd',
   ```

15. **HEX_6**: `#f8d7da` (라인 472)
   ```
   backgroundColor: '#f8d7da',
   ```

16. **HEX_6**: `#721c24` (라인 473)
   ```
   color: '#721c24',
   ```

17. **HEX_6**: `#f5c6cb` (라인 474)
   ```
   border: '1px solid #f5c6cb',
   ```

18. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 206)
   ```
   ? '0 4px 12px rgba(0, 123, 255, 0.15)'
   ```

---

### 📁 `frontend/src/styles/auth/UnifiedLogin.css` (CSS)

**하드코딩 색상**: 17개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#d1d5db` (라인 60)
   ```
   border: 1px solid #d1d5db;
   ```

4. **HEX_6**: `#fee2e2` (라인 96)
   ```
   background-color: #fee2e2;
   ```

5. **HEX_6**: `#991b1b` (라인 97)
   ```
   color: #991b1b;
   ```

6. **HEX_6**: `#fecaca` (라인 98)
   ```
   border: 1px solid #fecaca;
   ```

7. **HEX_6**: `#d1fae5` (라인 102)
   ```
   background-color: #d1fae5;
   ```

8. **HEX_6**: `#065f46` (라인 103)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#6ee7b7` (라인 104)
   ```
   border: 1px solid #6ee7b7;
   ```

10. **HEX_6**: `#fef3c7` (라인 108)
   ```
   background-color: #fef3c7;
   ```

11. **HEX_6**: `#92400e` (라인 109)
   ```
   color: #92400e;
   ```

12. **HEX_6**: `#fde68a` (라인 110)
   ```
   border: 1px solid #fde68a;
   ```

13. **HEX_6**: `#e5e7eb` (라인 151)
   ```
   background-color: #e5e7eb;
   ```

14. **HEX_6**: `#FEE500` (라인 194)
   ```
   background-color: #FEE500;
   ```

15. **HEX_6**: `#03C75A` (라인 199)
   ```
   background-color: #03C75A;
   ```

16. **HEX_6**: `#d1d5db` (라인 206)
   ```
   border: 1px solid #d1d5db;
   ```

17. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 69)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/06-components/_modals.css` (CSS)

**하드코딩 색상**: 17개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 140)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 145)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 149)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 153)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 158)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 288)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 368)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

8. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 413)
   ```
   background: rgba(255, 193, 7, 0.1);
   ```

9. **RGBA**: `rgba(255, 193, 7, 0.2)` (라인 415)
   ```
   border: 1px solid rgba(255, 193, 7, 0.2);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 451)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 453)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 458)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 460)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

14. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 475)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

15. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 476)
   ```
   box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
   ```

16. **RGBA**: `rgba(248, 249, 250, 0.9)` (라인 482)
   ```
   background: rgba(248, 249, 250, 0.9);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 488)
   ```
   border-color: rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/styles/06-components/_header.css` (CSS)

**하드코딩 색상**: 17개

1. **RGB**: `rgb(34, 197, 94)` (라인 619)
   ```
   color: rgb(34, 197, 94);
   ```

2. **RGB**: `rgb(239, 68, 68)` (라인 624)
   ```
   color: rgb(239, 68, 68);
   ```

3. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 5)
   ```
   background: var(--header-bg, rgba(250, 250, 250, 0.95)) !important;
   ```

4. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 8)
   ```
   border-bottom: 1px solid var(--header-border, rgba(209, 209, 214, 0.8));
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 9)
   ```
   box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 60)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 83)
   ```
   box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 312)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

9. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 329)
   ```
   box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
   ```

10. **RGBA**: `rgba(20, 20, 20, 0.95)` (라인 367)
   ```
   background: rgba(20, 20, 20, 0.95);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 368)
   ```
   border-bottom-color: rgba(255, 255, 255, 0.1);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 465)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

13. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 482)
   ```
   box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
   ```

14. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 566)
   ```
   background: var(--color-primary-light, rgba(0, 123, 255, 0.1));
   ```

15. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 571)
   ```
   background: var(--color-primary-light, rgba(0, 123, 255, 0.15));
   ```

16. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 618)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

17. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 623)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/ClientCard.css` (CSS)

**하드코딩 색상**: 17개

1. **HEX_6**: `#1a1a1a` (라인 73)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 7)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 14)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 25)
   ```
   0 8px 24px rgba(0, 122, 255, 0.15),
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 26)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 30)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

9. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 33)
   ```
   0 8px 24px rgba(0, 122, 255, 0.2),
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 34)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

12. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 109)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 115)
   ```
   border-top: 1px solid rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 131)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 133)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

16. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 147)
   ```
   background: rgba(52, 199, 89, 0.2);
   ```

17. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 150)
   ```
   border: 1px solid rgba(52, 199, 89, 0.3);
   ```

---

### 📁 `frontend/src/components/erp/FinancialManagement.js` (JS)

**하드코딩 색상**: 17개

1. **HEX_3**: `#666` (라인 1068)
   ```
   <div style={{ textAlign: 'center', color: '#666' }}>
   ```

2. **HEX_6**: `#2563eb` (라인 591)
   ```
   <div style={{ fontWeight: '500', color: '#2563eb' }}>
   ```

3. **HEX_6**: `#16a34a` (라인 594)
   ```
   <div style={{ marginTop: '4px', color: '#16a34a' }}>
   ```

4. **HEX_6**: `#9ca3af` (라인 599)
   ```
   <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>-</span>
   ```

5. **HEX_6**: `#d4edda` (라인 935)
   ```
   backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
   ```

6. **HEX_6**: `#f8d7da` (라인 935)
   ```
   backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
   ```

7. **HEX_6**: `#155724` (라인 936)
   ```
   color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
   ```

8. **HEX_6**: `#721c24` (라인 936)
   ```
   color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
   ```

9. **HEX_6**: `#e3f2fd` (라인 971)
   ```
   backgroundColor: '#e3f2fd',
   ```

10. **HEX_6**: `#d4edda` (라인 1034)
   ```
   backgroundColor: mappingDetail.isConsistent ? '#d4edda' : '#f8d7da',
   ```

11. **HEX_6**: `#f8d7da` (라인 1034)
   ```
   backgroundColor: mappingDetail.isConsistent ? '#d4edda' : '#f8d7da',
   ```

12. **HEX_6**: `#155724` (라인 1035)
   ```
   color: mappingDetail.isConsistent ? '#155724' : '#721c24'
   ```

13. **HEX_6**: `#721c24` (라인 1035)
   ```
   color: mappingDetail.isConsistent ? '#155724' : '#721c24'
   ```

14. **HEX_6**: `#f1f3f4` (라인 1055)
   ```
   backgroundColor: '#f1f3f4',
   ```

15. **HEX_6**: `#fff3cd` (라인 1078)
   ```
   backgroundColor: '#fff3cd',
   ```

16. **HEX_6**: `#856404` (라인 1084)
   ```
   <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-size-base)', color: '#856404' }}>
   ```

17. **HEX_6**: `#dee2e6` (라인 1106)
   ```
   borderTop: '1px solid #dee2e6'
   ```

---

### 📁 `frontend/src/components/erd/ErdDetailPage.js` (JS)

**하드코딩 색상**: 17개

1. **HEX_3**: `#333` (라인 100)
   ```
   primaryTextColor: '#333',
   ```

2. **HEX_3**: `#666` (라인 102)
   ```
   lineColor: '#666',
   ```

3. **HEX_3**: `#333` (라인 108)
   ```
   textColor: '#333',
   ```

4. **HEX_3**: `#ccc` (라인 111)
   ```
   clusterBorder: '#ccc',
   ```

5. **HEX_3**: `#666` (라인 112)
   ```
   defaultLinkColor: '#666',
   ```

6. **HEX_3**: `#333` (라인 113)
   ```
   titleColor: '#333',
   ```

7. **HEX_3**: `#333` (라인 116)
   ```
   actorTextColor: '#333',
   ```

8. **HEX_3**: `#333` (라인 118)
   ```
   signalColor: '#333',
   ```

9. **HEX_3**: `#333` (라인 119)
   ```
   signalTextColor: '#333',
   ```

10. **HEX_3**: `#333` (라인 122)
   ```
   labelTextColor: '#333',
   ```

11. **HEX_3**: `#333` (라인 123)
   ```
   loopTextColor: '#333',
   ```

12. **HEX_3**: `#333` (라인 126)
   ```
   noteTextColor: '#333',
   ```

13. **HEX_6**: `#f0f0f0` (라인 103)
   ```
   secondaryColor: '#f0f0f0',
   ```

14. **HEX_6**: `#e3f2fd` (라인 115)
   ```
   actorBkg: '#e3f2fd',
   ```

15. **HEX_6**: `#fff3cd` (라인 125)
   ```
   noteBkgColor: '#fff3cd',
   ```

16. **HEX_6**: `#e3f2fd` (라인 128)
   ```
   activationBkgColor: '#e3f2fd',
   ```

17. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 243)
   ```
   table.style.filter = 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))';
   ```

---

### 📁 `frontend/src/components/tenant/TenantProfile.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_3**: `#666` (라인 32)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

2. **HEX_3**: `#666` (라인 81)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 128)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

4. **HEX_3**: `#333` (라인 134)
   ```
   color: var(--mg-color-text, #333);
   ```

5. **HEX_3**: `#666` (라인 188)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

6. **HEX_3**: `#666` (라인 261)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 301)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

8. **HEX_6**: `#d4edda` (라인 47)
   ```
   background: var(--mg-color-success-light, #d4edda);
   ```

9. **HEX_6**: `#fff3cd` (라인 52)
   ```
   background: var(--mg-color-warning-light, #fff3cd);
   ```

10. **HEX_6**: `#f8d7da` (라인 57)
   ```
   background: var(--mg-color-danger-light, #f8d7da);
   ```

11. **HEX_6**: `#e2e3e5` (라인 62)
   ```
   background: var(--mg-color-secondary-light, #e2e3e5);
   ```

12. **HEX_6**: `#dee2e6` (라인 70)
   ```
   border-bottom: 2px solid var(--mg-color-border, #dee2e6);
   ```

13. **HEX_6**: `#d4edda` (라인 164)
   ```
   background: var(--mg-color-success-light, #d4edda);
   ```

14. **HEX_6**: `#dee2e6` (라인 234)
   ```
   border: 1px solid var(--mg-color-border, #dee2e6);
   ```

15. **HEX_6**: `#dee2e6` (라인 277)
   ```
   border: 1px solid var(--mg-color-border, #dee2e6);
   ```

16. **HEX_6**: `#f8d7da` (라인 289)
   ```
   background: var(--mg-color-danger-light, #f8d7da);
   ```

---

### 📁 `frontend/src/components/mypage/components/PasswordChangeModal.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#764ba2` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

3. **HEX_6**: `#495057` (라인 100)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#e9ecef` (라인 118)
   ```
   border: 2px solid #e9ecef;
   ```

5. **HEX_6**: `#495057` (라인 154)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#e9ecef` (라인 201)
   ```
   border-top: 1px solid #e9ecef;
   ```

7. **HEX_6**: `#5a6268` (라인 224)
   ```
   background-color: #5a6268;
   ```

8. **HEX_6**: `#545b62` (라인 225)
   ```
   border-color: #545b62;
   ```

9. **HEX_6**: `#764ba2` (라인 231)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

10. **HEX_6**: `#5a6fd8` (라인 237)
   ```
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   ```

11. **HEX_6**: `#6a4190` (라인 237)
   ```
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 19)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 79)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 127)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

15. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 133)
   ```
   box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
   ```

16. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 239)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

---

### 📁 `frontend/src/components/hq/HQBranchManagement.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#764ba2` (라인 17)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#e9ecef` (라인 57)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 77)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#dee2e6` (라인 109)
   ```
   border: 2px dashed #dee2e6;
   ```

5. **HEX_6**: `#f1f1f1` (라인 242)
   ```
   background: #f1f1f1;
   ```

6. **HEX_6**: `#c1c1c1` (라인 247)
   ```
   background: #c1c1c1;
   ```

7. **HEX_6**: `#a8a8a8` (라인 252)
   ```
   background: #a8a8a8;
   ```

8. **HEX_6**: `#764ba2` (라인 268)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

9. **HEX_6**: `#e9ecef` (라인 291)
   ```
   border: 1px solid #e9ecef;
   ```

10. **RGBA**: `rgba(0,0,0,0.1)` (라인 22)
   ```
   box-shadow: 0 4px 16px rgba(0,0,0,0.1);
   ```

11. **RGBA**: `rgba(255,255,255,0.2)` (라인 46)
   ```
   background: rgba(255,255,255,0.2);
   ```

12. **RGBA**: `rgba(255,255,255,0.3)` (라인 52)
   ```
   border: 1px solid rgba(255,255,255,0.3);
   ```

13. **RGBA**: `rgba(0,0,0,0.1)` (라인 98)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

14. **RGBA**: `rgba(0,123,255,0.25)` (라인 218)
   ```
   box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 280)
   ```
   background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
   ```

16. **RGBA**: `rgba(118, 75, 162, 0.1)` (라인 280)
   ```
   background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
   ```

---

### 📁 `frontend/src/components/admin/SearchFilterSection.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1a1a1a` (라인 39)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

2. **HEX_6**: `#1a1a1a` (라인 74)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

3. **HEX_6**: `#1a1a1a` (라인 100)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 33)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 43)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 51)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 53)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 68)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 71)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 79)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 91)
   ```
   background-color: rgba(255, 255, 255, 0.3);
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 93)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 95)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/DashboardFormModal.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_3**: `#666` (라인 360)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

2. **HEX_3**: `#666` (라인 364)
   ```
   color: var(--mg-text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 497)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

4. **HEX_3**: `#666` (라인 531)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

5. **HEX_6**: `#764ba2` (라인 219)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

6. **HEX_6**: `#e5e7eb` (라인 225)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#764ba2` (라인 267)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

8. **HEX_6**: `#e5e7eb` (라인 319)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

9. **HEX_6**: `#0056b3` (라인 459)
   ```
   background-color: var(--mg-color-primary-dark, #0056b3);
   ```

10. **HEX_6**: `#0056b3` (라인 460)
   ```
   border-color: var(--mg-color-primary-dark, #0056b3);
   ```

11. **HEX_6**: `#c82333` (라인 484)
   ```
   background-color: var(--mg-color-danger-dark, #c82333);
   ```

12. **HEX_6**: `#c82333` (라인 485)
   ```
   border-color: var(--mg-color-danger-dark, #c82333);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 9)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7)) !important;
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 237)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7));
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 255)
   ```
   box-shadow: var(--mg-shadow-xl, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 301)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeFilters.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1f2937` (라인 20)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#374151` (라인 43)
   ```
   color: #374151;
   ```

3. **HEX_6**: `#f9fafb` (라인 54)
   ```
   background-color: #f9fafb;
   ```

4. **HEX_6**: `#6b7280` (라인 78)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#6b7280` (라인 93)
   ```
   color: #6b7280;
   ```

6. **HEX_6**: `#f3f4f6` (라인 102)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#374151` (라인 103)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#1d4ed8` (라인 125)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

9. **HEX_6**: `#1d4ed8` (라인 130)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

10. **HEX_6**: `#1e40af` (라인 130)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

11. **HEX_6**: `#6b7280` (라인 137)
   ```
   color: #6b7280;
   ```

12. **HEX_6**: `#f9fafb` (라인 142)
   ```
   background: #f9fafb;
   ```

13. **HEX_6**: `#d1d5db` (라인 143)
   ```
   border-color: #d1d5db;
   ```

14. **HEX_6**: `#374151` (라인 144)
   ```
   color: #374151;
   ```

15. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 62)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

16. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 132)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

---

### 📁 `frontend/src/constants/mapping.js` (JS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#fd7e14` (라인 40)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#fd7e14',
   ```

2. **HEX_6**: `#6f42c1` (라인 42)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#6f42c1'
   ```

3. **HEX_6**: `#fff3cd` (라인 48)
   ```
   [MAPPING_STATUS.PENDING_PAYMENT]: '#fff3cd',
   ```

4. **HEX_6**: `#d1ecf1` (라인 49)
   ```
   [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#d1ecf1',
   ```

5. **HEX_6**: `#d4edda` (라인 50)
   ```
   [MAPPING_STATUS.ACTIVE]: '#d4edda',
   ```

6. **HEX_6**: `#ffeaa7` (라인 52)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#ffeaa7',
   ```

7. **HEX_6**: `#f8d7da` (라인 53)
   ```
   [MAPPING_STATUS.TERMINATED]: '#f8d7da',
   ```

8. **HEX_6**: `#e2e3f1` (라인 54)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#e2e3f1'
   ```

9. **HEX_6**: `#6f42c1` (라인 159)
   ```
   TOTAL: '#6f42c1',
   ```

10. **HEX_6**: `#fd7e14` (라인 161)
   ```
   SESSIONS_EXHAUSTED: '#fd7e14'
   ```

11. **HEX_6**: `#fff3cd` (라인 167)
   ```
   PENDING: '#fff3cd',
   ```

12. **HEX_6**: `#d4edda` (라인 168)
   ```
   ACTIVE: '#d4edda',
   ```

13. **HEX_6**: `#d1ecf1` (라인 169)
   ```
   PAYMENT_CONFIRMED: '#d1ecf1',
   ```

14. **HEX_6**: `#e2e3f1` (라인 170)
   ```
   TOTAL: '#e2e3f1',
   ```

15. **HEX_6**: `#f8d7da` (라인 171)
   ```
   TERMINATED: '#f8d7da',
   ```

16. **HEX_6**: `#ffeaa7` (라인 172)
   ```
   SESSIONS_EXHAUSTED: '#ffeaa7'
   ```

---

### 📁 `frontend/src/components/common/DetailedStatsGrid.js` (JS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#7B68EE` (라인 56)
   ```
   backgroundColor: '#7B68EE',
   ```

2. **HEX_6**: `#495057` (라인 69)
   ```
   color: '#495057'
   ```

3. **HEX_6**: `#7B68EE` (라인 74)
   ```
   color: '#7B68EE',
   ```

4. **HEX_6**: `#7B68EE` (라인 119)
   ```
   backgroundColor: '#7B68EE',
   ```

5. **HEX_6**: `#495057` (라인 132)
   ```
   color: '#495057'
   ```

6. **HEX_6**: `#7B68EE` (라인 137)
   ```
   color: '#7B68EE',
   ```

7. **HEX_6**: `#495057` (라인 195)
   ```
   color: '#495057'
   ```

8. **HEX_6**: `#FFE0DB` (라인 224)
   ```
   backgroundColor: '#FFE0DB',
   ```

9. **HEX_6**: `#FFCDD2` (라인 228)
   ```
   border: '1px solid #FFCDD2',
   ```

10. **HEX_6**: `#495057` (라인 251)
   ```
   color: '#495057'
   ```

11. **HEX_6**: `#FFE8D1` (라인 280)
   ```
   backgroundColor: '#FFE8D1',
   ```

12. **HEX_6**: `#FFCCBC` (라인 284)
   ```
   border: '1px solid #FFCCBC',
   ```

13. **HEX_6**: `#495057` (라인 307)
   ```
   color: '#495057'
   ```

14. **HEX_6**: `#E3F2FD` (라인 336)
   ```
   backgroundColor: '#E3F2FD',
   ```

15. **HEX_6**: `#BBDEFB` (라인 340)
   ```
   border: '1px solid #BBDEFB',
   ```

16. **HEX_6**: `#495057` (라인 363)
   ```
   color: '#495057'
   ```

---

### 📁 `frontend/src/components/layout/SimpleHeader.css` (CSS)

**하드코딩 색상**: 15개

1. **HEX_3**: `#333` (라인 10)
   ```
   --header-text-primary: #333;
   ```

2. **HEX_3**: `#666` (라인 11)
   ```
   --header-text-secondary: #666;
   ```

3. **HEX_3**: `#999` (라인 12)
   ```
   --header-text-muted: #999;
   ```

4. **HEX_6**: `#c82333` (라인 16)
   ```
   --header-danger-hover: #c82333;
   ```

5. **HEX_6**: `#e9ecef` (라인 18)
   ```
   --header-neutral-hover: #e9ecef;
   ```

6. **HEX_6**: `#dee2e6` (라인 19)
   ```
   --header-border-light: #dee2e6;
   ```

7. **HEX_6**: `#5a4fcf` (라인 346)
   ```
   background: #5a4fcf;
   ```

8. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 8)
   ```
   --header-primary-light: rgba(108, 92, 231, 0.1);
   ```

9. **RGBA**: `rgba(108, 92, 231, 0.2)` (라인 9)
   ```
   --header-primary-hover: rgba(108, 92, 231, 0.2);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 14)
   ```
   --header-bg-hover: rgba(0, 0, 0, 0.05);
   ```

11. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 262)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
   ```

12. **RGBA**: `rgba(220, 53, 69, 0.6)` (라인 269)
   ```
   box-shadow: 0 6px 20px rgba(220, 53, 69, 0.6);
   ```

13. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 276)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
   ```

14. **RGBA**: `rgba(220, 53, 69, 0.6)` (라인 280)
   ```
   box-shadow: 0 6px 20px rgba(220, 53, 69, 0.6);
   ```

15. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 284)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
   ```

---

### 📁 `frontend/src/components/common/CustomSelect.css` (CSS)

**하드코딩 색상**: 15개

1. **HEX_3**: `#666` (라인 57)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 145)
   ```
   color: #666;
   ```

3. **HEX_6**: `#E8E8ED` (라인 96)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

4. **HEX_6**: `#F5F5F7` (라인 157)
   ```
   background-color: var(--color-bg-secondary, #F5F5F7);
   ```

5. **HEX_6**: `#E8E8ED` (라인 166)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 18)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 30)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
   ```

8. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 37)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
   ```

9. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 42)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 71)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 76)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

12. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 110)
   ```
   box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 124)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

14. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 132)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

15. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 137)
   ```
   background-color: rgba(0, 123, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/admin/MappingCreationModal.css` (CSS)

**하드코딩 색상**: 15개

1. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 30)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

2. **RGBA**: `rgba(139, 69, 19, 0.2)` (라인 38)
   ```
   border: 2px solid rgba(139, 69, 19, 0.2);
   ```

3. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 197)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 356)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 360)
   ```
   background: rgba(255, 255, 255, 0.2) !important;
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 366)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 387)
   ```
   background: rgba(255, 255, 255, 0.3) !important;
   ```

8. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 389)
   ```
   0 8px 24px rgba(182, 229, 216, 0.3),
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 390)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3),
   ```

10. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 391)
   ```
   0 0 0 3px rgba(182, 229, 216, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 420)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 423)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 429)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 437)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

15. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 450)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/DashboardWidgetEditor.css` (CSS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#1f2937` (라인 23)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

2. **HEX_6**: `#e5e7eb` (라인 25)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#f9fafb` (라인 43)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

4. **HEX_6**: `#e5e7eb` (라인 44)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

5. **HEX_6**: `#f3f4f6` (라인 66)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

6. **HEX_6**: `#6b7280` (라인 83)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

7. **HEX_6**: `#e5e7eb` (라인 101)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

8. **HEX_6**: `#9ca3af` (라인 115)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

9. **HEX_6**: `#1f2937` (라인 144)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

10. **HEX_6**: `#6b7280` (라인 149)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

11. **HEX_6**: `#6b7280` (라인 167)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

12. **HEX_6**: `#f9fafb` (라인 168)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

13. **HEX_6**: `#e5e7eb` (라인 170)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 69)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 108)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/utils/codeHelper.js` (JS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#6b7280` (라인 141)
   ```
   return '#6b7280';
   ```

2. **HEX_6**: `#6b7280` (라인 151)
   ```
   return defaultColorMap[codeValue] || '#6b7280';
   ```

3. **HEX_6**: `#6b7280` (라인 235)
   ```
   return { color: '#6b7280', icon: '📋' };
   ```

4. **HEX_6**: `#6b7280` (라인 244)
   ```
   color: code.colorCode || '#6b7280',
   ```

5. **HEX_6**: `#e5e7eb` (라인 296)
   ```
   'AVAILABLE': '#e5e7eb',
   ```

6. **HEX_6**: `#6b7280` (라인 302)
   ```
   'BLOCKED': '#6b7280',
   ```

7. **HEX_6**: `#f97316` (라인 303)
   ```
   'UNDER_REVIEW': '#f97316',
   ```

8. **HEX_6**: `#06b6d4` (라인 304)
   ```
   'VACATION': '#06b6d4',
   ```

9. **HEX_6**: `#dc2626` (라인 305)
   ```
   'NO_SHOW': '#dc2626',
   ```

10. **HEX_6**: `#6b7280` (라인 306)
   ```
   'MAINTENANCE': '#6b7280',
   ```

11. **HEX_6**: `#fd7e14` (라인 313)
   ```
   'SUSPENDED': '#fd7e14',
   ```

12. **HEX_6**: `#6f42c1` (라인 315)
   ```
   'SESSIONS_EXHAUSTED': '#6f42c1',
   ```

13. **HEX_6**: `#6b7280` (라인 318)
   ```
   'PENDING': '#6b7280',
   ```

14. **HEX_6**: `#6b7280` (라인 329)
   ```
   return defaultColorMap[codeValue] || '#6b7280';
   ```

15. **HEX_6**: `#6b7280` (라인 825)
   ```
   color = '#6b7280';
   ```

---

### 📁 `frontend/src/components/common/StatsCardGrid.js` (JS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#e9ecef` (라인 85)
   ```
   border: '1px solid #e9ecef',
   ```

2. **HEX_6**: `#E8E0FF` (라인 115)
   ```
   backgroundColor: '#E8E0FF',
   ```

3. **HEX_6**: `#D1C4E9` (라인 119)
   ```
   border: '1px solid #D1C4E9',
   ```

4. **HEX_6**: `#7B68EE` (라인 129)
   ```
   backgroundColor: '#7B68EE',
   ```

5. **HEX_6**: `#495057` (라인 139)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

6. **HEX_6**: `#7B68EE` (라인 142)
   ```
   <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#7B68EE', margin: '0 0 4px 0' }}>
   ```

7. **HEX_6**: `#FFE8D1` (라인 153)
   ```
   backgroundColor: '#FFE8D1',
   ```

8. **HEX_6**: `#FFCCBC` (라인 157)
   ```
   border: '1px solid #FFCCBC',
   ```

9. **HEX_6**: `#495057` (라인 177)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

10. **HEX_6**: `#D4F1E0` (라인 191)
   ```
   backgroundColor: '#D4F1E0',
   ```

11. **HEX_6**: `#C8E6C9` (라인 195)
   ```
   border: '1px solid #C8E6C9',
   ```

12. **HEX_6**: `#495057` (라인 215)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

13. **HEX_6**: `#FFE0DB` (라인 229)
   ```
   backgroundColor: '#FFE0DB',
   ```

14. **HEX_6**: `#FFCDD2` (라인 233)
   ```
   border: '1px solid #FFCDD2',
   ```

15. **HEX_6**: `#495057` (라인 253)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

---

### 📁 `frontend/src/components/schedule/ConsultantStatus.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#E8E8ED` (라인 19)
   ```
   border: 2px solid var(--color-border-secondary, #E8E8ED);
   ```

2. **HEX_6**: `#FAFAFA` (라인 24)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

3. **HEX_6**: `#0056CC` (라인 62)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

4. **HEX_6**: `#1D1D1F` (라인 81)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

5. **HEX_6**: `#424245` (라인 87)
   ```
   color: var(--color-text-secondary, #424245);
   ```

6. **HEX_6**: `#424245` (라인 93)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#424245` (라인 99)
   ```
   color: var(--color-text-secondary, #424245);
   ```

8. **HEX_6**: `#065f46` (라인 118)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#92400e` (라인 123)
   ```
   color: #92400e;
   ```

10. **HEX_6**: `#991b1b` (라인 128)
   ```
   color: #991b1b;
   ```

11. **HEX_6**: `#9ca3af` (라인 133)
   ```
   color: #9ca3af;
   ```

12. **HEX_6**: `#424245` (라인 147)
   ```
   color: var(--color-text-secondary, #424245);
   ```

13. **HEX_6**: `#9ca3af` (라인 156)
   ```
   color: #9ca3af;
   ```

14. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 30)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingFilters.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#FAFAFA` (라인 4)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#E8E8ED` (라인 8)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

3. **HEX_6**: `#E8E8ED` (라인 20)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

4. **HEX_6**: `#1D1D1F` (라인 26)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

5. **HEX_6**: `#1D1D1F` (라인 47)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

6. **HEX_6**: `#424245` (라인 57)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#D1D1D6` (라인 66)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

8. **HEX_6**: `#FAFAFA` (라인 68)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#1D1D1F` (라인 69)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

10. **HEX_6**: `#A1A1A6` (라인 82)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

11. **HEX_6**: `#424245` (라인 102)
   ```
   color: var(--color-text-secondary, #424245);
   ```

12. **HEX_6**: `#F5F5F7` (라인 116)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

13. **HEX_6**: `#5a6268` (라인 157)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 77)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/VacationStatistics.js` (JS)

**하드코딩 색상**: 14개

1. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 200)
   ```
   '연차': 'rgba(52, 199, 89, 0.2)',        // 연한 초록 (연차)
   ```

2. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 201)
   ```
   '반차': 'rgba(255, 149, 0, 0.2)',         // 연한 노랑 (반차)
   ```

3. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 202)
   ```
   '반반차': 'rgba(0, 122, 255, 0.2)',       // 연한 파랑 (반반차)
   ```

4. **RGBA**: `rgba(88, 86, 214, 0.2)` (라인 203)
   ```
   '개인사정': 'rgba(88, 86, 214, 0.2)',     // 연한 보라 (개인사정)
   ```

5. **RGBA**: `rgba(255, 59, 48, 0.2)` (라인 204)
   ```
   '병가': 'rgba(255, 59, 48, 0.2)',         // 연한 빨강 (병가)
   ```

6. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 205)
   ```
   '하루 종일 휴가': 'rgba(52, 199, 89, 0.2)',  // 연한 초록 (종일 휴가)
   ```

7. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 206)
   ```
   '사용자 정의 휴가': 'rgba(0, 122, 255, 0.15)', // 연한 하늘색 (사용자 정의)
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 208)
   ```
   '오전 반반차 1 (09:00-11:00)': 'rgba(0, 122, 255, 0.2)',
   ```

9. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 209)
   ```
   '오전 반반차 2 (11:00-13:00)': 'rgba(0, 122, 255, 0.2)',
   ```

10. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 210)
   ```
   '오후 반반차 1 (14:00-16:00)': 'rgba(0, 122, 255, 0.2)',
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 211)
   ```
   '오후 반반차 2 (16:00-18:00)': 'rgba(0, 122, 255, 0.2)',
   ```

12. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 212)
   ```
   '오전반차': 'rgba(255, 149, 0, 0.2)',
   ```

13. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 213)
   ```
   '오후반차': 'rgba(255, 149, 0, 0.2)'
   ```

14. **RGBA**: `rgba(248, 249, 250, 0.5)` (라인 215)
   ```
   return colors[type] || 'rgba(248, 249, 250, 0.5)'; // 기본 연한 회색
   ```

---

### 📁 `frontend/src/styles/auth/TenantSelection.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#e5e7eb` (라인 49)
   ```
   border: 2px solid #e5e7eb;
   ```

4. **HEX_6**: `#eff6ff` (라인 63)
   ```
   background-color: #eff6ff;
   ```

5. **HEX_6**: `#eff6ff` (라인 68)
   ```
   background-color: #eff6ff;
   ```

6. **HEX_6**: `#f3f4f6` (라인 91)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#d1fae5` (라인 102)
   ```
   background-color: #d1fae5;
   ```

8. **HEX_6**: `#065f46` (라인 103)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#fee2e2` (라인 107)
   ```
   background-color: #fee2e2;
   ```

10. **HEX_6**: `#991b1b` (라인 108)
   ```
   color: #991b1b;
   ```

11. **HEX_6**: `#e5e7eb` (라인 125)
   ```
   border: 2px solid #e5e7eb;
   ```

12. **HEX_6**: `#d1d5db` (라인 135)
   ```
   border-color: #d1d5db;
   ```

13. **HEX_6**: `#f9fafb` (라인 136)
   ```
   background-color: #f9fafb;
   ```

---

### 📁 `frontend/src/styles/06-components/_session-management.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_3**: `#ccc` (라인 422)
   ```
   border: 1px solid #ccc;
   ```

2. **RGBA**: `rgba(52, 199, 89, 0.15)` (라인 217)
   ```
   background: rgba(52, 199, 89, 0.15);
   ```

3. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 222)
   ```
   border: 0.5px solid rgba(52, 199, 89, 0.3);
   ```

4. **RGBA**: `rgba(142, 142, 147, 0.15)` (라인 227)
   ```
   background: rgba(142, 142, 147, 0.15);
   ```

5. **RGBA**: `rgba(142, 142, 147, 0.3)` (라인 232)
   ```
   border: 0.5px solid rgba(142, 142, 147, 0.3);
   ```

6. **RGBA**: `rgba(255, 149, 0, 0.15)` (라인 237)
   ```
   background: rgba(255, 149, 0, 0.15);
   ```

7. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 242)
   ```
   border: 0.5px solid rgba(255, 149, 0, 0.3);
   ```

8. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 378)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 379)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

10. **RGBA**: `rgba(45, 45, 50, 0.6)` (라인 383)
   ```
   background: rgba(45, 45, 50, 0.6);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 384)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

12. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 388)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 389)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/01-settings/_glassmorphism.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#ff2d92` (라인 34)
   ```
   --ios-pink: #ff2d92;
   ```

2. **HEX_6**: `#ffcc00` (라인 35)
   ```
   --ios-yellow: #ffcc00;
   ```

3. **HEX_6**: `#8e8e93` (라인 36)
   ```
   --ios-gray: #8e8e93;
   ```

4. **HEX_6**: `#1d1d1f` (라인 39)
   ```
   --ios-text-primary: #1d1d1f;
   ```

5. **HEX_6**: `#86868b` (라인 40)
   ```
   --ios-text-secondary: #86868b;
   ```

6. **HEX_6**: `#c7c7cc` (라인 41)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 9)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.15);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 15)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 16)
   ```
   --glass-border-light: rgba(255, 255, 255, 0.1);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 17)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.3);
   ```

11. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 19)
   ```
   --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 20)
   ```
   --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

13. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 21)
   ```
   --glass-shadow-hover: 0 20px 40px rgba(31, 38, 135, 0.5);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleModalOld.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#e9ecef` (라인 48)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#764ba2` (라인 49)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

3. **HEX_6**: `#545b62` (라인 169)
   ```
   background-color: #545b62;
   ```

4. **HEX_6**: `#1e7e34` (라인 180)
   ```
   background-color: #1e7e34;
   ```

5. **HEX_6**: `#ced4da` (라인 203)
   ```
   border: 1px solid #ced4da;
   ```

6. **HEX_6**: `#e3f2fd` (라인 230)
   ```
   background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
   ```

7. **HEX_6**: `#f3e5f5` (라인 230)
   ```
   background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
   ```

8. **HEX_6**: `#ced4da` (라인 274)
   ```
   border: 1px solid #ced4da;
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 108)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

10. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 160)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

11. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 171)
   ```
   box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
   ```

12. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 182)
   ```
   box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
   ```

13. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 215)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/mypage/components/PrivacyConsentSection.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#e9ecef` (라인 32)
   ```
   border: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 44)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 51)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#d4edda` (라인 63)
   ```
   background-color: #d4edda;
   ```

5. **HEX_6**: `#155724` (라인 64)
   ```
   color: #155724;
   ```

6. **HEX_6**: `#c3e6cb` (라인 65)
   ```
   border: 1px solid #c3e6cb;
   ```

7. **HEX_6**: `#f8d7da` (라인 69)
   ```
   background-color: #f8d7da;
   ```

8. **HEX_6**: `#721c24` (라인 70)
   ```
   color: #721c24;
   ```

9. **HEX_6**: `#f5c6cb` (라인 71)
   ```
   border: 1px solid #f5c6cb;
   ```

10. **HEX_6**: `#e9ecef` (라인 87)
   ```
   border: 1px solid #e9ecef;
   ```

11. **HEX_6**: `#495057` (라인 104)
   ```
   color: #495057;
   ```

12. **HEX_6**: `#e9ecef` (라인 124)
   ```
   border-top: 1px solid #e9ecef;
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 35)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/erp/IntegratedFinanceDashboard.css` (CSS)

**하드코딩 색상**: 13개

1. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 56)
   ```
   background: rgba(128, 128, 0, 0.1);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 479)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 481)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 496)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 506)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 577)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
   ```

7. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 609)
   ```
   background: rgba(128, 128, 0, 0.1);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 632)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 634)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 678)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 680)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 833)
   ```
   background: rgba(0, 0, 0, 0.3);
   ```

13. **RGBA**: `rgba(128, 128, 0, 0.2)` (라인 862)
   ```
   background: rgba(128, 128, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/erp/refund/ErpSyncStatus.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#d4edda` (라인 15)
   ```
   background-color: #d4edda;
   ```

2. **HEX_6**: `#c3e6cb` (라인 16)
   ```
   border-color: #c3e6cb;
   ```

3. **HEX_6**: `#f8d7da` (라인 20)
   ```
   background-color: #f8d7da;
   ```

4. **HEX_6**: `#f5c6cb` (라인 21)
   ```
   border-color: #f5c6cb;
   ```

5. **HEX_6**: `#d1ecf1` (라인 25)
   ```
   background-color: #d1ecf1;
   ```

6. **HEX_6**: `#bee5eb` (라인 26)
   ```
   border-color: #bee5eb;
   ```

7. **HEX_6**: `#fff3cd` (라인 30)
   ```
   background-color: #fff3cd;
   ```

8. **HEX_6**: `#ffeaa7` (라인 31)
   ```
   border-color: #ffeaa7;
   ```

9. **HEX_6**: `#155724` (라인 46)
   ```
   color: #155724;
   ```

10. **HEX_6**: `#721c24` (라인 50)
   ```
   color: #721c24;
   ```

11. **HEX_6**: `#0c5460` (라인 54)
   ```
   color: #0c5460;
   ```

12. **HEX_6**: `#856404` (라인 58)
   ```
   color: #856404;
   ```

13. **HEX_6**: `#e9ecef` (라인 64)
   ```
   background-color: #e9ecef;
   ```

---

### 📁 `frontend/src/components/erd/ErdListPage.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_3**: `#333` (라인 16)
   ```
   color: var(--text-primary, #333);
   ```

2. **HEX_3**: `#666` (라인 22)
   ```
   color: var(--text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 39)
   ```
   color: var(--text-secondary, #666);
   ```

4. **HEX_3**: `#666` (라인 121)
   ```
   color: var(--text-secondary, #666);
   ```

5. **HEX_3**: `#333` (라인 159)
   ```
   color: var(--text-primary, #333);
   ```

6. **HEX_3**: `#999` (라인 178)
   ```
   background: var(--text-secondary, #999);
   ```

7. **HEX_3**: `#666` (라인 188)
   ```
   color: var(--text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 210)
   ```
   color: var(--text-secondary, #666);
   ```

9. **HEX_3**: `#333` (라인 216)
   ```
   color: var(--text-primary, #333);
   ```

10. **HEX_6**: `#f0f0f0` (라인 47)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

11. **HEX_6**: `#0056b3` (라인 109)
   ```
   background: var(--primary-hover, #0056b3);
   ```

12. **HEX_6**: `#0056b3` (라인 238)
   ```
   background: var(--primary-hover, #0056b3);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 140)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/common/MGLayout.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#f8fafc` (라인 14)
   ```
   background: #f8fafc;
   ```

2. **HEX_6**: `#1a202c` (라인 18)
   ```
   background: #1a202c;
   ```

3. **HEX_6**: `#764ba2` (라인 23)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#f8fafc` (라인 63)
   ```
   .mg-section--bg-gray { background: #f8fafc; }
   ```

5. **HEX_6**: `#764ba2` (라인 64)
   ```
   .mg-section--bg-primary { background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%); }
   ```

6. **HEX_6**: `#f5576c` (라인 65)
   ```
   .mg-section--bg-secondary { background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%); }
   ```

7. **HEX_6**: `#e2e8f0` (라인 153)
   ```
   background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
   ```

8. **HEX_6**: `#e2e8f0` (라인 158)
   ```
   background: repeating-linear-gradient(90deg, #e2e8f0 0px, #e2e8f0 8px, transparent 8px, transparent 16px);
   ```

9. **HEX_6**: `#e2e8f0` (라인 158)
   ```
   background: repeating-linear-gradient(90deg, #e2e8f0 0px, #e2e8f0 8px, transparent 8px, transparent 16px);
   ```

10. **HEX_6**: `#764ba2` (라인 163)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500), #764ba2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 38)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 46)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 48)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/WidgetConfigModal.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#e5e7eb` (라인 59)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

2. **HEX_6**: `#1f2937` (라인 66)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

3. **HEX_6**: `#6b7280` (라인 73)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

4. **HEX_6**: `#f3f4f6` (라인 84)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

5. **HEX_6**: `#1f2937` (라인 85)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

6. **HEX_6**: `#1f2937` (라인 107)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

7. **HEX_6**: `#e5e7eb` (라인 116)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

8. **HEX_6**: `#f9fafb` (라인 134)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

9. **HEX_6**: `#9ca3af` (라인 145)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

10. **HEX_6**: `#6b7280` (라인 164)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

11. **HEX_6**: `#e5e7eb` (라인 174)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 33)
   ```
   box-shadow: var(--mg-shadow-lg, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

13. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 3px var(--mg-primary-alpha, rgba(59, 130, 246, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/SecurityMonitoringDashboard.css` (CSS)

**하드코딩 색상**: 13개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 44)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 45)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 51)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 79)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 101)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 123)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 131)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 156)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 157)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 162)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 166)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 167)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 172)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/schedule/UnifiedScheduleComponent.js` (JS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#06b6d4` (라인 82)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
   ```

2. **HEX_6**: `#84cc16` (라인 82)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
   ```

3. **HEX_6**: `#f97316` (라인 82)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
   ```

4. **HEX_6**: `#ec4899` (라인 82)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
   ```

5. **HEX_6**: `#6366f1` (라인 82)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
   ```

6. **HEX_6**: `#FF5722` (라인 104)
   ```
   backgroundColor = '#FF5722';
   ```

7. **HEX_6**: `#FF7043` (라인 124)
   ```
   backgroundColor = '#FF7043';
   ```

8. **HEX_6**: `#FF7043` (라인 131)
   ```
   backgroundColor = '#FF7043';
   ```

9. **HEX_6**: `#9C27B0` (라인 139)
   ```
   backgroundColor = '#9C27B0';
   ```

10. **HEX_6**: `#9C27B0` (라인 144)
   ```
   backgroundColor = '#9C27B0';
   ```

11. **HEX_6**: `#6b7280` (라인 218)
   ```
   color: '#6b7280',
   ```

12. **HEX_6**: `#059669` (라인 236)
   ```
   { value: 'COMPLETED', label: '완료됨', icon: '🎉', color: '#059669', description: '완료된 일정' },
   ```

13. **HEX_6**: `#6b7280` (라인 238)
   ```
   { value: 'BLOCKED', label: '차단됨', icon: '🚫', color: '#6b7280', description: '차단된 시간' }
   ```

---

### 📁 `frontend/src/pages/billing/BillingCallback.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#1f2937` (라인 40)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#6b7280` (라인 45)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#1f2937` (라인 73)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#6b7280` (라인 79)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#f9fafb` (라인 87)
   ```
   background: #f9fafb;
   ```

6. **HEX_6**: `#e5e7eb` (라인 97)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#374151` (라인 106)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#6b7280` (라인 110)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#fef2f2` (라인 118)
   ```
   background: #fef2f2;
   ```

10. **HEX_6**: `#fecaca` (라인 119)
   ```
   border: 1px solid #fecaca;
   ```

11. **HEX_6**: `#dc2626` (라인 129)
   ```
   color: #dc2626;
   ```

12. **HEX_6**: `#991b1b` (라인 133)
   ```
   color: #991b1b;
   ```

---

### 📁 `frontend/src/components/schedule/components/StepIndicator.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#FAFAFA` (라인 4)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#E8E8ED` (라인 6)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

3. **HEX_6**: `#E8E8ED` (라인 52)
   ```
   background-color: var(--color-bg-accent, #E8E8ED);
   ```

4. **HEX_6**: `#8E8E93` (라인 53)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

5. **HEX_6**: `#E8E8ED` (라인 54)
   ```
   border-color: var(--color-border-secondary, #E8E8ED);
   ```

6. **HEX_6**: `#8E8E93` (라인 71)
   ```
   color: var(--color-text-muted, #8E8E93);
   ```

7. **HEX_6**: `#E8E8ED` (라인 89)
   ```
   background-color: var(--color-border-secondary, #E8E8ED);
   ```

8. **HEX_6**: `#E8E8ED` (라인 94)
   ```
   background-color: var(--color-bg-accent, #E8E8ED);
   ```

9. **HEX_6**: `#0056CC` (라인 102)
   ```
   background: linear-gradient(90deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 7)
   ```
   box-shadow: var(--shadow-glass, 0 4px 12px rgba(0, 0, 0, 0.08));
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 48)
   ```
   box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
   ```

12. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 104)
   ```
   box-shadow: 0 1px 3px rgba(0, 122, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/erp/QuickExpenseForm.js` (JS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#e74c3c` (라인 45)
   ```
   { categoryCode: 'SALARY', subcategoryCode: 'CONSULTANT_SALARY', icon: '💰', color: '#e74c3c' },
   ```

2. **HEX_6**: `#3498db` (라인 48)
   ```
   { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'WATER', icon: '💧', color: '#3498db' },
   ```

3. **HEX_6**: `#e74c3c` (라인 49)
   ```
   { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'GAS', icon: '🔥', color: '#e74c3c' },
   ```

4. **HEX_6**: `#9b59b6` (라인 50)
   ```
   { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'INTERNET', icon: '🌐', color: '#9b59b6' },
   ```

5. **HEX_6**: `#9b59b6` (라인 51)
   ```
   { categoryCode: 'TAX', subcategoryCode: 'INCOME_TAX', icon: '📋', color: '#9b59b6' },
   ```

6. **HEX_6**: `#8e44ad` (라인 52)
   ```
   { categoryCode: 'TAX', subcategoryCode: 'CORPORATE_TAX', icon: '📊', color: '#8e44ad' },
   ```

7. **HEX_6**: `#3498db` (라인 53)
   ```
   { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'STATIONERY', icon: '📝', color: '#3498db' },
   ```

8. **HEX_6**: `#2c3e50` (라인 54)
   ```
   { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'EQUIPMENT', icon: '🖥️', color: '#2c3e50' },
   ```

9. **HEX_6**: `#1abc9c` (라인 55)
   ```
   { categoryCode: 'MARKETING', subcategoryCode: 'ONLINE_ADS', icon: '📢', color: '#1abc9c' },
   ```

10. **HEX_6**: `#27ae60` (라인 56)
   ```
   { categoryCode: 'MARKETING', subcategoryCode: 'PROMOTION', icon: '📈', color: '#27ae60' }
   ```

11. **RGBA**: `rgba(0,0,0,0.2)` (라인 173)
   ```
   e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
   ```

12. **RGBA**: `rgba(0,0,0,0.1)` (라인 179)
   ```
   e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
   ```

---

### 📁 `frontend/src/components/ui/Button/Button.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 76)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 81)
   ```
   box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
   ```

3. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 94)
   ```
   box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
   ```

4. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 107)
   ```
   box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
   ```

5. **RGBA**: `rgba(255, 193, 7, 0.3)` (라인 120)
   ```
   box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
   ```

6. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 133)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
   ```

7. **RGBA**: `rgba(23, 162, 184, 0.3)` (라인 146)
   ```
   box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
   ```

8. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 159)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
   ```

9. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 169)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 271)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

11. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 380)
   ```
   background-color: rgba(0, 123, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/erp/refund/RefundStatsCards.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_3**: `#666` (라인 26)
   ```
   color: #666;
   ```

2. **HEX_6**: `#6f42c1` (라인 18)
   ```
   color: #6f42c1;
   ```

3. **HEX_6**: `#fd7e14` (라인 22)
   ```
   color: #fd7e14;
   ```

4. **HEX_6**: `#d4edda` (라인 39)
   ```
   background-color: #d4edda;
   ```

5. **HEX_6**: `#c3e6cb` (라인 40)
   ```
   border-color: #c3e6cb;
   ```

6. **HEX_6**: `#f8d7da` (라인 44)
   ```
   background-color: #f8d7da;
   ```

7. **HEX_6**: `#f5c6cb` (라인 45)
   ```
   border-color: #f5c6cb;
   ```

8. **HEX_6**: `#155724` (라인 55)
   ```
   color: #155724;
   ```

9. **HEX_6**: `#721c24` (라인 59)
   ```
   color: #721c24;
   ```

10. **HEX_6**: `#155724` (라인 68)
   ```
   color: #155724;
   ```

11. **HEX_6**: `#721c24` (라인 72)
   ```
   color: #721c24;
   ```

---

### 📁 `frontend/src/components/dashboard/WelcomeSection.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#87CEEB` (라인 244)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 244)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FF6B9D` (라인 249)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FFA5C0` (라인 249)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 108)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(128, 128, 0, 0.2)` (라인 240)
   ```
   box-shadow: 0 2px 8px rgba(128, 128, 0, 0.2);
   ```

8. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 245)
   ```
   box-shadow: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

9. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 250)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

10. **RGBA**: `rgba(139, 69, 19, 0.2)` (라인 255)
   ```
   box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 266)
   ```
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/dashboard/RecentActivities.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#8b9dc3` (라인 26)
   ```
   color: #8b9dc3;
   ```

2. **HEX_6**: `#5a6c7d` (라인 32)
   ```
   color: #5a6c7d;
   ```

3. **HEX_6**: `#f8f9ff` (라인 33)
   ```
   background: #f8f9ff;
   ```

4. **HEX_6**: `#8b9dc3` (라인 37)
   ```
   color: #8b9dc3;
   ```

5. **HEX_6**: `#e9ecef` (라인 54)
   ```
   border: 1px solid #e9ecef;
   ```

6. **HEX_6**: `#e9ecef` (라인 58)
   ```
   background: #e9ecef;
   ```

7. **HEX_6**: `#495057` (라인 94)
   ```
   color: #495057;
   ```

8. **HEX_6**: `#adb5bd` (라인 113)
   ```
   color: #adb5bd;
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 61)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

10. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 73)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

11. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 79)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
   ```

---

### 📁 `frontend/src/components/common/NotificationBadge.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 80)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 148)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 171)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 195)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 233)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 237)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 250)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 270)
   ```
   color: rgba(255, 255, 255, 0.7);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 274)
   ```
   color: rgba(255, 255, 255, 0.5);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 288)
   ```
   color: rgba(255, 255, 255, 0.5);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 293)
   ```
   color: rgba(255, 255, 255, 0.7);
   ```

---

### 📁 `frontend/src/components/common/MGChart.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 9)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px var(--mg-shadow-light);
   ```

2. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 10)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

3. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 29)
   ```
   rgba(102, 126, 234, 0.05) 0%,
   ```

4. **RGBA**: `rgba(118, 75, 162, 0.05)` (라인 30)
   ```
   rgba(118, 75, 162, 0.05) 100%);
   ```

5. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 31)
   ```
   border: 1px solid rgba(102, 126, 234, 0.2);
   ```

6. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 32)
   ```
   box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15), 0 4px 16px var(--mg-shadow-light);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 46)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

8. **RGBA**: `rgba(26, 32, 44, 0.9)` (라인 122)
   ```
   background: rgba(26, 32, 44, 0.9);
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 127)
   ```
   rgba(102, 126, 234, 0.1) 0%,
   ```

10. **RGBA**: `rgba(118, 75, 162, 0.1)` (라인 128)
   ```
   rgba(118, 75, 162, 0.1) 100%);
   ```

11. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 129)
   ```
   border-color: rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/common/LoadingSpinnerDemo.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#1f2937` (라인 9)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#374151` (라인 17)
   ```
   color: #374151;
   ```

3. **HEX_6**: `#e5e7eb` (라인 21)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

4. **HEX_6**: `#4b5563` (라인 26)
   ```
   color: #4b5563;
   ```

5. **HEX_6**: `#2563eb` (라인 72)
   ```
   background: linear-gradient(135deg, #2563eb, #7c3aed);
   ```

6. **HEX_6**: `#7c3aed` (라인 72)
   ```
   background: linear-gradient(135deg, #2563eb, #7c3aed);
   ```

7. **HEX_6**: `#f8fafc` (라인 78)
   ```
   background: #f8fafc;
   ```

8. **HEX_6**: `#e2e8f0` (라인 79)
   ```
   border: 1px solid #e2e8f0;
   ```

9. **HEX_6**: `#374151` (라인 91)
   ```
   color: #374151;
   ```

10. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 68)
   ```
   box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
   ```

11. **RGBA**: `rgba(59, 130, 246, 0.4)` (라인 74)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
   ```

---

### 📁 `frontend/src/components/client/ClientSessionManagement.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(248, 249, 250, 0.3)` (라인 6)
   ```
   background: rgba(248, 249, 250, 0.3);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 19)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 23)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 43)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 68)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 72)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 141)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 144)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 194)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 197)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/constants/charts.js` (JS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#343a40` (라인 30)
   ```
   DARK: '#343a40',
   ```

2. **HEX_6**: `#0056b3` (라인 37)
   ```
   PRIMARY: ['var(--mg-primary-500)', '#0056b3'],
   ```

3. **HEX_6**: `#1e7e34` (라인 38)
   ```
   SUCCESS: ['var(--mg-success-500)', '#1e7e34'],
   ```

4. **HEX_6**: `#e0a800` (라인 39)
   ```
   WARNING: ['var(--mg-warning-500)', '#e0a800'],
   ```

5. **HEX_6**: `#c82333` (라인 40)
   ```
   DANGER: ['var(--mg-error-500)', '#c82333'],
   ```

6. **HEX_6**: `#138496` (라인 41)
   ```
   INFO: ['var(--mg-info-500)', '#138496'],
   ```

7. **HEX_6**: `#545b62` (라인 42)
   ```
   SECONDARY: ['var(--mg-secondary-500)', '#545b62']
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 73)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 76)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 129)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 132)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

---

### 📁 `frontend/src/components/ui/Table/Table.stories.js` (JS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#d4edda` (라인 29)
   ```
   backgroundColor: value === 'active' ? '#d4edda' : value === 'inactive' ? '#f8d7da' : '#fff3cd',
   ```

2. **HEX_6**: `#f8d7da` (라인 29)
   ```
   backgroundColor: value === 'active' ? '#d4edda' : value === 'inactive' ? '#f8d7da' : '#fff3cd',
   ```

3. **HEX_6**: `#fff3cd` (라인 29)
   ```
   backgroundColor: value === 'active' ? '#d4edda' : value === 'inactive' ? '#f8d7da' : '#fff3cd',
   ```

4. **HEX_6**: `#155724` (라인 30)
   ```
   color: value === 'active' ? '#155724' : value === 'inactive' ? '#721c24' : '#856404'}}>
   ```

5. **HEX_6**: `#721c24` (라인 30)
   ```
   color: value === 'active' ? '#155724' : value === 'inactive' ? '#721c24' : '#856404'}}>
   ```

6. **HEX_6**: `#856404` (라인 30)
   ```
   color: value === 'active' ? '#155724' : value === 'inactive' ? '#721c24' : '#856404'}}>
   ```

7. **HEX_6**: `#d1ecf1` (라인 38)
   ```
   backgroundColor: value === 'admin' ? '#d1ecf1' : value === 'moderator' ? '#e2e3e5' : 'var(--mg-gray-100)',
   ```

8. **HEX_6**: `#e2e3e5` (라인 38)
   ```
   backgroundColor: value === 'admin' ? '#d1ecf1' : value === 'moderator' ? '#e2e3e5' : 'var(--mg-gray-100)',
   ```

9. **HEX_6**: `#0c5460` (라인 39)
   ```
   color: value === 'admin' ? '#0c5460' : value === 'moderator' ? '#383d41' : 'var(--mg-secondary-500)'}}>
   ```

10. **HEX_6**: `#383d41` (라인 39)
   ```
   color: value === 'admin' ? '#0c5460' : value === 'moderator' ? '#383d41' : 'var(--mg-secondary-500)'}}>
   ```

11. **HEX_6**: `#e9ecef` (라인 173)
   ```
   {clickedCell && (<div style={{marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px'}}>
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleCalendar/ScheduleCalendarUtils.js` (JS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#6b7280` (라인 52)
   ```
   if (!consultantId) return '#6b7280';
   ```

2. **HEX_6**: `#06b6d4` (라인 57)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
   ```

3. **HEX_6**: `#84cc16` (라인 57)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
   ```

4. **HEX_6**: `#f97316` (라인 57)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
   ```

5. **HEX_6**: `#ec4899` (라인 57)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
   ```

6. **HEX_6**: `#6366f1` (라인 57)
   ```
   '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
   ```

7. **HEX_6**: `#14b8a6` (라인 58)
   ```
   '#14b8a6', '#a855f7', '#22c55e', '#eab308', 'var(--mg-error-500)'
   ```

8. **HEX_6**: `#a855f7` (라인 58)
   ```
   '#14b8a6', '#a855f7', '#22c55e', '#eab308', 'var(--mg-error-500)'
   ```

9. **HEX_6**: `#22c55e` (라인 58)
   ```
   '#14b8a6', '#a855f7', '#22c55e', '#eab308', 'var(--mg-error-500)'
   ```

10. **HEX_6**: `#eab308` (라인 58)
   ```
   '#14b8a6', '#a855f7', '#22c55e', '#eab308', 'var(--mg-error-500)'
   ```

11. **HEX_6**: `#6b7280` (라인 84)
   ```
   return statusColors[status] || '#6b7280';
   ```

---

### 📁 `frontend/src/components/consultant/ConsultationLogModal.js` (JS)

**하드코딩 색상**: 11개

1. **HEX_3**: `#666` (라인 560)
   ```
   color: '#666',
   ```

2. **HEX_3**: `#666` (라인 602)
   ```
   color: '#666',
   ```

3. **HEX_6**: `#fd7e14` (라인 53)
   ```
   { value: 'HIGH', label: '높음', icon: '🟠', color: '#fd7e14', description: '높은 우선순위' },
   ```

4. **HEX_6**: `#6f42c1` (라인 55)
   ```
   { value: 'CRITICAL', label: '위험', icon: '🚨', color: '#6f42c1', description: '위험 우선순위' }
   ```

5. **HEX_6**: `#ced4da` (라인 582)
   ```
   borderColor: validationErrors.sessionDurationMinutes ? 'var(--mg-error-500)' : '#ced4da'
   ```

6. **HEX_6**: `#ced4da` (라인 628)
   ```
   borderColor: validationErrors.clientCondition ? 'var(--mg-error-500)' : '#ced4da'
   ```

7. **HEX_6**: `#ced4da` (라인 650)
   ```
   borderColor: validationErrors.mainIssues ? 'var(--mg-error-500)' : '#ced4da'
   ```

8. **HEX_6**: `#ced4da` (라인 672)
   ```
   borderColor: validationErrors.interventionMethods ? 'var(--mg-error-500)' : '#ced4da'
   ```

9. **HEX_6**: `#ced4da` (라인 694)
   ```
   borderColor: validationErrors.clientResponse ? 'var(--mg-error-500)' : '#ced4da'
   ```

10. **HEX_6**: `#ced4da` (라인 751)
   ```
   borderColor: validationErrors.riskAssessment ? 'var(--mg-error-500)' : '#ced4da'
   ```

11. **HEX_6**: `#ced4da` (라인 803)
   ```
   borderColor: validationErrors.progressEvaluation ? 'var(--mg-error-500)' : '#ced4da'
   ```

---

### 📁 `frontend/src/components/hq/ConsolidatedFinancial.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#e3e6f0` (라인 9)
   ```
   border: 1px solid #e3e6f0;
   ```

2. **HEX_6**: `#f8f9fc` (라인 13)
   ```
   background-color: #f8f9fc;
   ```

3. **HEX_6**: `#e3e6f0` (라인 14)
   ```
   border-bottom: 1px solid #e3e6f0;
   ```

4. **HEX_6**: `#f8f9fc` (라인 18)
   ```
   background-color: #f8f9fc;
   ```

5. **HEX_6**: `#e9ecef` (라인 28)
   ```
   background-color: #e9ecef;
   ```

6. **HEX_6**: `#f8f9fc` (라인 69)
   ```
   background-color: #f8f9fc;
   ```

7. **HEX_6**: `#e3e6f0` (라인 70)
   ```
   border-color: #e3e6f0;
   ```

8. **HEX_6**: `#e3e6f0` (라인 75)
   ```
   border-color: #e3e6f0;
   ```

9. **RGBA**: `rgba(0,0,0,0.1)` (라인 8)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

10. **RGBA**: `rgba(0,0,0,0.1)` (라인 24)
   ```
   box-shadow: 0 4px 8px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/compliance/ComplianceDashboard.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#0051d5` (라인 47)
   ```
   background: #0051d5;
   ```

2. **HEX_6**: `#0051d5` (라인 237)
   ```
   background: #0051d5;
   ```

3. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 16)
   ```
   background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(88, 86, 214, 0.1) 100%);
   ```

4. **RGBA**: `rgba(88, 86, 214, 0.1)` (라인 16)
   ```
   background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(88, 86, 214, 0.1) 100%);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 54)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 102)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

7. **RGBA**: `rgba(52, 199, 89, 0.1)` (라인 165)
   ```
   background: rgba(52, 199, 89, 0.1);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 170)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

9. **RGBA**: `rgba(255, 149, 0, 0.1)` (라인 175)
   ```
   background: rgba(255, 149, 0, 0.1);
   ```

10. **RGBA**: `rgba(255, 59, 48, 0.1)` (라인 180)
   ```
   background: rgba(255, 59, 48, 0.1);
   ```

---

### 📁 `frontend/src/components/billing/PaymentMethodRegistration.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#e5e7eb` (라인 20)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 27)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#4b5563` (라인 36)
   ```
   color: #4b5563;
   ```

4. **HEX_6**: `#6b7280` (라인 41)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#fef2f2` (라인 51)
   ```
   background: #fef2f2;
   ```

6. **HEX_6**: `#fecaca` (라인 52)
   ```
   border: 1px solid #fecaca;
   ```

7. **HEX_6**: `#dc2626` (라인 54)
   ```
   color: #dc2626;
   ```

8. **HEX_6**: `#f9fafb` (라인 63)
   ```
   background: #f9fafb;
   ```

9. **HEX_6**: `#374151` (라인 75)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#6b7280` (라인 79)
   ```
   color: #6b7280;
   ```

---

### 📁 `frontend/src/components/admin/TodayStatistics.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#f0f0f0` (라인 109)
   ```
   border: 1px solid #f0f0f0;
   ```

2. **HEX_6**: `#E8E0FF` (라인 132)
   ```
   background: #E8E0FF; /* 파스텔 보라색 */
   ```

3. **HEX_6**: `#D1C4E9` (라인 133)
   ```
   border-color: #D1C4E9;
   ```

4. **HEX_6**: `#7B68EE` (라인 137)
   ```
   color: #7B68EE; /* 진한 보라색 */
   ```

5. **HEX_6**: `#D4F1E0` (라인 141)
   ```
   background: #D4F1E0; /* 파스텔 민트색 */
   ```

6. **HEX_6**: `#C8E6C9` (라인 142)
   ```
   border-color: #C8E6C9;
   ```

7. **HEX_6**: `#FFE8D1` (라인 150)
   ```
   background: #FFE8D1; /* 파스텔 오렌지색 */
   ```

8. **HEX_6**: `#FFCCBC` (라인 151)
   ```
   border-color: #FFCCBC;
   ```

9. **HEX_6**: `#FFE0DB` (라인 159)
   ```
   background: #FFE0DB; /* 파스텔 코랄색 */
   ```

10. **HEX_6**: `#FFCDD2` (라인 160)
   ```
   border-color: #FFCDD2;
   ```

---

### 📁 `frontend/src/components/schedule/TimeSlotGrid.js` (JS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#e9ecef` (라인 724)
   ```
   border: '2px solid #e9ecef',
   ```

2. **HEX_6**: `#fff8e1` (라인 738)
   ```
   baseStyle.backgroundColor = '#fff8e1';
   ```

3. **HEX_6**: `#e9ecef` (라인 741)
   ```
   baseStyle.backgroundColor = '#e9ecef';
   ```

4. **HEX_6**: `#adb5bd` (라인 742)
   ```
   baseStyle.color = '#adb5bd';
   ```

5. **HEX_6**: `#dee2e6` (라인 745)
   ```
   baseStyle.border = '1px solid #dee2e6';
   ```

6. **HEX_6**: `#f8fff9` (라인 748)
   ```
   baseStyle.backgroundColor = '#f8fff9';
   ```

7. **HEX_6**: `#fff5f5` (라인 754)
   ```
   baseStyle.backgroundColor = '#fff5f5';
   ```

8. **HEX_6**: `#f8f9ff` (라인 770)
   ```
   backgroundColor: '#f8f9ff',
   ```

9. **RGBA**: `rgba(40, 167, 69, 0.25)` (라인 749)
   ```
   baseStyle.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.25)';
   ```

10. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 772)
   ```
   boxShadow: '0 4px 8px rgba(0, 123, 255, 0.15)'
   ```

---

### 📁 `frontend/src/components/admin/CommonCodeManagement.js` (JS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#e1e5e9` (라인 649)
   ```
   onBlur={ (e) => e.target.style.borderColor = '#e1e5e9' }
   ```

2. **HEX_6**: `#e9ecef` (라인 805)
   ```
   border: '2px solid #e9ecef'
   ```

3. **HEX_6**: `#e9ecef` (라인 822)
   ```
   border: '2px solid #e9ecef'
   ```

4. **HEX_6**: `#e9ecef` (라인 839)
   ```
   border: '2px solid #e9ecef'
   ```

5. **HEX_6**: `#e9ecef` (라인 892)
   ```
   border: '2px solid #e9ecef',
   ```

6. **HEX_6**: `#e9ecef` (라인 905)
   ```
   background: '#e9ecef',
   ```

7. **HEX_6**: `#d4edda` (라인 918)
   ```
   backgroundColor: code.isActive ? '#d4edda' : '#f8d7da',
   ```

8. **HEX_6**: `#f8d7da` (라인 918)
   ```
   backgroundColor: code.isActive ? '#d4edda' : '#f8d7da',
   ```

9. **HEX_6**: `#155724` (라인 919)
   ```
   color: code.isActive ? '#155724' : '#721c24'
   ```

10. **HEX_6**: `#721c24` (라인 919)
   ```
   color: code.isActive ? '#155724' : '#721c24'
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_header.css` (CSS)

**하드코딩 색상**: 9개

1. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 5)
   ```
   background: var(--header-bg, rgba(250, 250, 250, 0.95)) !important;
   ```

2. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 8)
   ```
   border-bottom: 1px solid var(--header-border, rgba(209, 209, 214, 0.8));
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 9)
   ```
   box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 59)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 82)
   ```
   box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 309)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 326)
   ```
   box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
   ```

8. **RGBA**: `rgba(20, 20, 20, 0.95)` (라인 364)
   ```
   background: rgba(20, 20, 20, 0.95);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 365)
   ```
   border-bottom-color: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/schedule/SchedulePage.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#f5f7fa` (라인 6)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 6)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#764ba2` (라인 42)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#545b62` (라인 98)
   ```
   background-color: #545b62;
   ```

5. **HEX_6**: `#212529` (라인 105)
   ```
   color: #212529;
   ```

6. **HEX_6**: `#e0a800` (라인 109)
   ```
   background-color: #e0a800;
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 89)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

8. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 100)
   ```
   box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
   ```

9. **RGBA**: `rgba(255, 193, 7, 0.3)` (라인 111)
   ```
   box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
   ```

---

### 📁 `frontend/src/components/landing/CounselingServices.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#1a202c` (라인 26)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 45)
   ```
   color: #4a5568;
   ```

3. **HEX_6**: `#1a202c` (라인 109)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#4a5568` (라인 120)
   ```
   color: #4a5568;
   ```

5. **RGBA**: `rgba(200, 220, 240, 0.1)` (라인 8)
   ```
   background: rgba(200, 220, 240, 0.1);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 78)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.04),
   ```

7. **RGBA**: `rgba(200, 220, 255, 0.4)` (라인 79)
   ```
   0 4px 12px rgba(200, 220, 255, 0.4);
   ```

8. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 93)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

9. **RGBA**: `rgba(200, 220, 255, 0.5)` (라인 102)
   ```
   background: rgba(200, 220, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/landing/CounselingHero.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#1a202c` (라인 83)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 101)
   ```
   color: #4a5568;
   ```

3. **RGBA**: `rgba(180, 200, 240, 0.6)` (라인 19)
   ```
   radial-gradient(ellipse at 30% 20%, rgba(180, 200, 240, 0.6) 0%, transparent 60%),
   ```

4. **RGBA**: `rgba(190, 210, 245, 0.5)` (라인 20)
   ```
   radial-gradient(ellipse at 70% 80%, rgba(190, 210, 245, 0.5) 0%, transparent 50%),
   ```

5. **RGBA**: `rgba(200, 220, 250, 0.4)` (라인 21)
   ```
   radial-gradient(ellipse at 20% 70%, rgba(200, 220, 250, 0.4) 0%, transparent 40%),
   ```

6. **RGBA**: `rgba(175, 195, 235, 0.55)` (라인 22)
   ```
   radial-gradient(ellipse at 80% 30%, rgba(175, 195, 235, 0.55) 0%, transparent 45%);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 156)
   ```
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

8. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 177)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

9. **RGBA**: `rgba(175, 195, 235, 0.3)` (라인 185)
   ```
   background: rgba(175, 195, 235, 0.3);
   ```

---

### 📁 `frontend/src/components/erp/refund/RefundAccountingStatus.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#d4edda` (라인 15)
   ```
   background-color: #d4edda;
   ```

2. **HEX_6**: `#c3e6cb` (라인 16)
   ```
   border-color: #c3e6cb;
   ```

3. **HEX_6**: `#fff3cd` (라인 20)
   ```
   background-color: #fff3cd;
   ```

4. **HEX_6**: `#ffeaa7` (라인 21)
   ```
   border-color: #ffeaa7;
   ```

5. **HEX_6**: `#e2e3e5` (라인 25)
   ```
   background-color: #e2e3e5;
   ```

6. **HEX_6**: `#d6d8db` (라인 26)
   ```
   border-color: #d6d8db;
   ```

7. **HEX_6**: `#155724` (라인 41)
   ```
   color: #155724;
   ```

8. **HEX_6**: `#856404` (라인 45)
   ```
   color: #856404;
   ```

9. **HEX_6**: `#383d41` (라인 49)
   ```
   color: #383d41;
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/common/HeaderWidget.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_3**: `#333` (라인 29)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

2. **HEX_3**: `#333` (라인 52)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

3. **HEX_3**: `#666` (라인 72)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

4. **HEX_3**: `#666` (라인 109)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

5. **HEX_3**: `#333` (라인 121)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

6. **HEX_3**: `#666` (라인 126)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

7. **HEX_6**: `#c82333` (라인 144)
   ```
   background-color: var(--mg-color-danger-dark, #c82333);
   ```

8. **HEX_6**: `#0056b3` (라인 161)
   ```
   background-color: var(--mg-color-primary-dark, #0056b3);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 7)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingDetailModal.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#fd7e14` (라인 271)
   ```
   color: #fd7e14;
   ```

2. **HEX_6**: `#d4edda` (라인 318)
   ```
   background: #d4edda;
   ```

3. **HEX_6**: `#d4edda` (라인 341)
   ```
   background: #d4edda;
   ```

4. **HEX_6**: `#5a6268` (라인 470)
   ```
   background: #5a6268;
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 49)
   ```
   background: rgba(0, 0, 0, 0.02);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 127)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 173)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 210)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

9. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 230)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

---

### 📁 `frontend/src/constants/stats.js` (JS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#8B7ED8` (라인 59)
   ```
   [STATS_TYPES.TOTAL_SCHEDULES]: '#8B7ED8',        // 부드러운 보라색
   ```

2. **HEX_6**: `#F4A261` (라인 60)
   ```
   [STATS_TYPES.BOOKED_SCHEDULES]: '#F4A261',       // 부드러운 오렌지색
   ```

3. **HEX_6**: `#7BC4A4` (라인 62)
   ```
   [STATS_TYPES.COMPLETED_SCHEDULES]: '#7BC4A4',    // 부드러운 민트색
   ```

4. **HEX_6**: `#E76F51` (라인 63)
   ```
   [STATS_TYPES.CANCELLED_SCHEDULES]: '#E76F51',    // 부드러운 코랄색
   ```

5. **HEX_6**: `#8B7ED8` (라인 64)
   ```
   [STATS_TYPES.IN_PROGRESS_SCHEDULES]: '#8B7ED8',  // 부드러운 보라색
   ```

6. **HEX_6**: `#8B7ED8` (라인 65)
   ```
   [STATS_TYPES.TODAY_TOTAL]: '#8B7ED8',            // 부드러운 보라색
   ```

7. **HEX_6**: `#7BC4A4` (라인 66)
   ```
   [STATS_TYPES.TODAY_COMPLETED]: '#7BC4A4',        // 부드러운 민트색
   ```

8. **HEX_6**: `#E76F51` (라인 68)
   ```
   [STATS_TYPES.TODAY_CANCELLED]: '#E76F51',        // 부드러운 코랄색
   ```

9. **HEX_6**: `#F4A261` (라인 69)
   ```
   [STATS_TYPES.TODAY_BOOKED]: '#F4A261',           // 부드러운 오렌지색
   ```

---

### 📁 `frontend/src/components/test/UnifiedLoadingTest.js` (JS)

**하드코딩 색상**: 9개

1. **HEX_3**: `#ddd` (라인 81)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
   ```

2. **HEX_3**: `#ddd` (라인 94)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
   ```

3. **HEX_3**: `#ddd` (라인 107)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
   ```

4. **HEX_3**: `#ddd` (라인 136)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

5. **HEX_3**: `#ddd` (라인 148)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

6. **HEX_3**: `#ddd` (라인 160)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

7. **HEX_6**: `#6f42c1` (라인 59)
   ```
   style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
   ```

8. **HEX_6**: `#fd7e14` (라인 66)
   ```
   style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
   ```

9. **HEX_6**: `#20c997` (라인 73)
   ```
   style={{ padding: '10px 20px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
   ```

---

### 📁 `frontend/src/components/erp/ItemManagement.js` (JS)

**하드코딩 색상**: 9개

1. **HEX_3**: `#ddd` (라인 371)
   ```
   border: '1px solid #ddd',
   ```

2. **HEX_3**: `#ddd` (라인 503)
   ```
   border: '1px solid #ddd',
   ```

3. **HEX_6**: `#f97316` (라인 67)
   ```
   { value: 'MEDICAL_SUPPLIES', label: '의료용품', icon: '🏥', color: '#f97316', description: '의료 및 건강 관련 용품' },
   ```

4. **HEX_6**: `#06b6d4` (라인 68)
   ```
   { value: 'CLEANING_SUPPLIES', label: '청소용품', icon: '🧽', color: '#06b6d4', description: '청소 및 위생용품' },
   ```

5. **HEX_6**: `#6b7280` (라인 69)
   ```
   { value: 'OTHER', label: '기타', icon: '📦', color: '#6b7280', description: '기타 아이템' }
   ```

6. **HEX_6**: `#74c0fc` (라인 264)
   ```
   border: '1px solid #74c0fc',
   ```

7. **HEX_6**: `#f8d7da` (라인 274)
   ```
   backgroundColor: '#f8d7da',
   ```

8. **HEX_6**: `#721c24` (라인 275)
   ```
   color: '#721c24',
   ```

9. **HEX_6**: `#f5c6cb` (라인 276)
   ```
   border: '1px solid #f5c6cb',
   ```

---

### 📁 `frontend/src/styles/08-utilities/_responsive.css` (CSS)

**하드코딩 색상**: 8개

1. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 13)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 20)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

3. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 24)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 36)
   ```
   background: rgba(0, 0, 0, 0.02);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 65)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

6. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 77)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 78)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 285)
   ```
   background: rgba(0, 0, 0, 0.02);
   ```

---

### 📁 `frontend/src/styles/06-components/_glass-components.css` (CSS)

**하드코딩 색상**: 8개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 75)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 81)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 134)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

4. **RGBA**: `rgba(0, 122, 255, 0.8)` (라인 143)
   ```
   background: rgba(0, 122, 255, 0.8);
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 146)
   ```
   box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.9)` (라인 150)
   ```
   background: rgba(0, 122, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 122, 255, 0.4)` (라인 152)
   ```
   box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 207)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/06-components/_dropdowns.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#2c2c2e` (라인 258)
   ```
   background: var(--ios-bg-secondary-dark, #2c2c2e);
   ```

2. **HEX_6**: `#38383a` (라인 259)
   ```
   border-color: var(--ios-border-dark, #38383a);
   ```

3. **HEX_6**: `#3a3a3c` (라인 264)
   ```
   background: var(--ios-bg-tertiary-dark, #3a3a3c);
   ```

4. **HEX_6**: `#48484a` (라인 265)
   ```
   border-color: var(--ios-border-hover-dark, #48484a);
   ```

5. **HEX_6**: `#1c1c1e` (라인 269)
   ```
   background: var(--ios-bg-primary-dark, #1c1c1e);
   ```

6. **HEX_6**: `#38383a` (라인 270)
   ```
   border-color: var(--ios-border-dark, #38383a);
   ```

7. **HEX_6**: `#2c2c2e` (라인 278)
   ```
   background: var(--ios-bg-secondary-dark, #2c2c2e);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 75)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/schedule/TodayStats.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#374151` (라인 13)
   ```
   color: #374151;
   ```

2. **HEX_6**: `#f3f4f6` (라인 27)
   ```
   background-color: #f3f4f6;
   ```

3. **HEX_6**: `#f8fafc` (라인 42)
   ```
   background-color: #f8fafc;
   ```

4. **HEX_6**: `#e2e8f0` (라인 44)
   ```
   border: 1px solid #e2e8f0;
   ```

5. **HEX_6**: `#f1f5f9` (라인 49)
   ```
   background-color: #f1f5f9;
   ```

6. **HEX_6**: `#cbd5e1` (라인 50)
   ```
   border-color: #cbd5e1;
   ```

7. **HEX_6**: `#1e40af` (라인 56)
   ```
   color: #1e40af;
   ```

8. **HEX_6**: `#64748b` (라인 63)
   ```
   color: #64748b;
   ```

---

### 📁 `frontend/src/components/erp/ErpDashboard.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#fbbf24` (라인 55)
   ```
   background: linear-gradient(135deg, var(--status-warning), #fbbf24);
   ```

2. **HEX_6**: `#f87171` (라인 59)
   ```
   background: linear-gradient(135deg, var(--color-danger), #f87171);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 20)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 22)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 95)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 102)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 103)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/constants/adminDashboard.js` (JS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#5ac8fa` (라인 175)
   ```
   INFO: '#5ac8fa',
   ```

2. **HEX_6**: `#f2f2f7` (라인 176)
   ```
   LIGHT: '#f2f2f7',
   ```

3. **HEX_6**: `#1c1c1e` (라인 177)
   ```
   DARK: '#1c1c1e',
   ```

4. **HEX_6**: `#1d1d1f` (라인 180)
   ```
   TEXT_PRIMARY: '#1d1d1f',
   ```

5. **HEX_6**: `#86868b` (라인 181)
   ```
   TEXT_SECONDARY: '#86868b',
   ```

6. **HEX_6**: `#c7c7cc` (라인 182)
   ```
   TEXT_TERTIARY: '#c7c7cc',
   ```

7. **HEX_6**: `#f2f2f7` (라인 186)
   ```
   BG_SECONDARY: '#f2f2f7',
   ```

8. **HEX_6**: `#e5e5ea` (라인 187)
   ```
   BG_TERTIARY: '#e5e5ea'
   ```

---

### 📁 `frontend/src/components/super-admin/PaymentManagement.js` (JS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#6b7280` (라인 75)
   ```
   { value: 'CANCELLED', label: '취소됨', icon: '🚫', color: '#6b7280', description: '결제 취소' },
   ```

2. **HEX_6**: `#f97316` (라인 76)
   ```
   { value: 'REFUNDED', label: '환불됨', icon: '↩️', color: '#f97316', description: '결제 환불' },
   ```

3. **HEX_6**: `#374151` (라인 77)
   ```
   { value: 'EXPIRED', label: '만료됨', icon: '⏰', color: '#374151', description: '결제 만료' },
   ```

4. **HEX_6**: `#0064FF` (라인 106)
   ```
   { value: 'TOSS', label: '토스페이먼츠', icon: '💙', color: '#0064FF', description: '토스페이먼츠 결제' },
   ```

5. **HEX_6**: `#34495E` (라인 107)
   ```
   { value: 'IAMPORT', label: '아임포트', icon: '🏦', color: '#34495E', description: '아임포트 결제' },
   ```

6. **HEX_6**: `#FEE500` (라인 108)
   ```
   { value: 'KAKAO', label: '카카오페이', icon: '💛', color: '#FEE500', description: '카카오페이 결제' },
   ```

7. **HEX_6**: `#03C75A` (라인 109)
   ```
   { value: 'NAVER', label: '네이버페이', icon: '💚', color: '#03C75A', description: '네이버페이 결제' },
   ```

8. **HEX_6**: `#0070BA` (라인 110)
   ```
   { value: 'PAYPAL', label: '페이팔', icon: '💳', color: '#0070BA', description: '페이팔 결제' }
   ```

---

### 📁 `frontend/src/components/samples/ResponsiveDataTable.js` (JS)

**하드코딩 색상**: 8개

1. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 268)
   ```
   border: '1px solid rgba(0, 0, 0, 0.04)',
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 477)
   ```
   e.target.style.background = 'rgba(0, 122, 255, 0.1)';
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 501)
   ```
   borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
   ```

4. **RGBA**: `rgba(0, 122, 255, 0.05)` (라인 504)
   ```
   background: selectedRows.includes(row.id) ? 'rgba(0, 122, 255, 0.05)' : 'transparent'
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 508)
   ```
   e.target.style.background = 'rgba(0, 0, 0, 0.02)';
   ```

6. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 697)
   ```
   background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
   ```

7. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 705)
   ```
   e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 738)
   ```
   e.target.style.boxShadow = '0 0 0 3px var(--mood-accent, rgba(0, 122, 255, 0.1))';
   ```

---

### 📁 `frontend/src/components/admin/DashboardWidgetEditor.js` (JS)

**하드코딩 색상**: 8개

1. **HEX_3**: `#ddd` (라인 319)
   ```
   border: '1px solid #ddd',
   ```

2. **HEX_3**: `#666` (라인 327)
   ```
   color: '#666'
   ```

3. **HEX_6**: `#e3f2fd` (라인 158)
   ```
   backgroundColor: '#e3f2fd',
   ```

4. **HEX_6**: `#9ca3af` (라인 196)
   ```
   color: 'var(--mg-text-tertiary, #9ca3af)'
   ```

5. **HEX_6**: `#fff3e0` (라인 217)
   ```
   backgroundColor: '#fff3e0',
   ```

6. **HEX_6**: `#e65100` (라인 218)
   ```
   color: '#e65100',
   ```

7. **HEX_6**: `#fff8f0` (라인 250)
   ```
   backgroundColor: '#fff8f0',
   ```

8. **HEX_6**: `#9ca3af` (라인 260)
   ```
   color: 'var(--mg-text-tertiary, #9ca3af)'
   ```

---

### 📁 `frontend/src/styles/tablet/index.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#1877F2` (라인 19)
   ```
   --tablet-social-facebook-bg: #1877F2;
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 169)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 785)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 1287)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1317)
   ```
   border: 3px solid rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(184, 230, 184, 0.1)` (라인 1696)
   ```
   box-shadow: 0 0 0 3px rgba(184, 230, 184, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1830)
   ```
   border: 3px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/mypage/components/SocialAccountsSection.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_3**: `#333` (라인 31)
   ```
   color: #333;
   ```

2. **HEX_3**: `#333` (라인 87)
   ```
   color: #333;
   ```

3. **HEX_6**: `#e9ecef` (라인 14)
   ```
   border: 1px solid #e9ecef;
   ```

4. **HEX_6**: `#c82333` (라인 68)
   ```
   background: #c82333;
   ```

5. **HEX_6**: `#dee2e6` (라인 80)
   ```
   border: 2px dashed #dee2e6;
   ```

6. **HEX_6**: `#FEE500` (라인 115)
   ```
   background: #FEE500;
   ```

7. **HEX_6**: `#03C75A` (라인 120)
   ```
   background: #03C75A;
   ```

---

### 📁 `frontend/src/components/dashboard/SummaryPanels.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#495057` (라인 107)
   ```
   color: #495057;
   ```

2. **HEX_6**: `#e9ecef` (라인 124)
   ```
   border: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#e9ecef` (라인 129)
   ```
   background: #e9ecef;
   ```

4. **HEX_6**: `#e9ecef` (라인 140)
   ```
   border: 2px solid #e9ecef;
   ```

5. **HEX_6**: `#495057` (라인 150)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#e9ecef` (라인 188)
   ```
   border-top: 1px solid #e9ecef;
   ```

7. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 85)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/WidgetCardWrapper.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#dee2e6` (라인 46)
   ```
   border: 1px solid #dee2e6;
   ```

2. **HEX_6**: `#dee2e6` (라인 63)
   ```
   border: 1px solid #dee2e6;
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 24)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 29)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 126)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 138)
   ```
   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/common/Chart.css` (CSS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 207)
   ```
   background: rgba(0, 0, 0, 0.8);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 208)
   ```
   border: 1px solid rgba(255, 255, 255, 0.1);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 261)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

4. **RGBA**: `rgba(248, 215, 218, 0.9)` (라인 275)
   ```
   background: rgba(248, 215, 218, 0.9);
   ```

5. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 285)
   ```
   box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
   ```

6. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 291)
   ```
   box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
   ```

7. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 297)
   ```
   box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
   ```

---

### 📁 `frontend/src/components/client/ClientSchedule.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#87CEEB` (라인 28)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 28)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FF6B9D` (라인 92)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FFA5C0` (라인 92)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

5. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 18)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

6. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 18)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

7. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 19)
   ```
   border: var(--border-width) solid rgba(255, 182, 193, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard.new.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#1a1a1a` (라인 331)
   ```
   --mg-color-background: #1a1a1a;
   ```

2. **HEX_6**: `#2d2d2d` (라인 332)
   ```
   --mg-color-surface: #2d2d2d;
   ```

3. **HEX_6**: `#b3b3b3` (라인 334)
   ```
   --mg-color-text-secondary: #b3b3b3;
   ```

4. **HEX_6**: `#808080` (라인 335)
   ```
   --mg-color-text-muted: #808080;
   ```

5. **HEX_6**: `#4f46e5` (라인 336)
   ```
   --mg-color-primary: #4f46e5;
   ```

6. **HEX_6**: `#3730a3` (라인 337)
   ```
   --mg-color-primary-light: #3730a3;
   ```

7. **HEX_6**: `#312e81` (라인 338)
   ```
   --mg-color-primary-dark: #312e81;
   ```

---

### 📁 `frontend/src/constants/onboarding.js` (JS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#9e9e9e` (라인 26)
   ```
   ON_HOLD: '#9e9e9e',
   ```

2. **HEX_6**: `#2e7d32` (라인 27)
   ```
   LOW: '#2e7d32',
   ```

3. **HEX_6**: `#e65100` (라인 28)
   ```
   MEDIUM: '#e65100',
   ```

4. **HEX_6**: `#c62828` (라인 29)
   ```
   HIGH: '#c62828'
   ```

5. **HEX_6**: `#e8f5e9` (라인 34)
   ```
   LOW: '#e8f5e9',
   ```

6. **HEX_6**: `#fff3e0` (라인 35)
   ```
   MEDIUM: '#fff3e0',
   ```

7. **HEX_6**: `#ffebee` (라인 36)
   ```
   HIGH: '#ffebee'
   ```

---

### 📁 `frontend/src/components/samples/DataTableSample.js` (JS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 364)
   ```
   background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 372)
   ```
   e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
   ```

3. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 405)
   ```
   e.target.style.boxShadow = '0 0 0 3px var(--mood-accent, rgba(0, 122, 255, 0.1))';
   ```

4. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 477)
   ```
   e.target.style.background = 'rgba(0, 122, 255, 0.1)';
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 501)
   ```
   borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.05)` (라인 504)
   ```
   background: selectedRows.includes(row.id) ? 'rgba(0, 122, 255, 0.05)' : 'transparent'
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 508)
   ```
   e.target.style.background = 'rgba(0, 0, 0, 0.02)';
   ```

---

### 📁 `frontend/src/components/common/SalaryPrintComponent.js` (JS)

**하드코딩 색상**: 7개

1. **HEX_3**: `#333` (라인 49)
   ```
   border: '2px solid #333'
   ```

2. **HEX_3**: `#333` (라인 66)
   ```
   border: '1px solid #333',
   ```

3. **HEX_3**: `#333` (라인 71)
   ```
   border: '1px solid #333',
   ```

4. **HEX_6**: `#e9ecef` (라인 63)
   ```
   backgroundColor: '#e9ecef',
   ```

5. **HEX_6**: `#e8f5e8` (라인 80)
   ```
   backgroundColor: '#e8f5e8',
   ```

6. **HEX_6**: `#fff3cd` (라인 84)
   ```
   backgroundColor: '#fff3cd'
   ```

7. **HEX_6**: `#d4edda` (라인 87)
   ```
   backgroundColor: '#d4edda',
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeForm.js` (JS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#06b6d4` (라인 61)
   ```
   { value: 'ROLE', label: '역할', icon: '👑', color: '#06b6d4', description: '사용자 역할' },
   ```

2. **HEX_6**: `#f97316` (라인 62)
   ```
   { value: 'STATUS', label: '상태', icon: '🔄', color: '#f97316', description: '일반적인 상태' },
   ```

3. **HEX_6**: `#dc2626` (라인 63)
   ```
   { value: 'PRIORITY', label: '우선순위', icon: '⚡', color: '#dc2626', description: '우선순위 구분' },
   ```

4. **HEX_6**: `#7c3aed` (라인 64)
   ```
   { value: 'NOTIFICATION_TYPE', label: '알림 유형', icon: '🔔', color: '#7c3aed', description: '알림의 유형' },
   ```

5. **HEX_6**: `#059669` (라인 65)
   ```
   { value: 'STATUS', label: '일정 상태', icon: '📅', color: '#059669', description: '일정의 상태' }
   ```

6. **HEX_6**: `#6b7280` (라인 325)
   ```
   value={formData.colorCode || '#6b7280'}
   ```

7. **HEX_6**: `#6b7280` (라인 334)
   ```
   placeholder="#6b7280"
   ```

---

### 📁 `frontend/src/pages/CounselingCenterLanding.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#2d3748` (라인 16)
   ```
   color: #2d3748;
   ```

2. **RGBA**: `rgba(240, 248, 255, 0.8)` (라인 9)
   ```
   rgba(240, 248, 255, 0.8) 0%,
   ```

3. **RGBA**: `rgba(245, 245, 250, 0.9)` (라인 10)
   ```
   rgba(245, 245, 250, 0.9) 25%,
   ```

4. **RGBA**: `rgba(250, 248, 255, 0.8)` (라인 11)
   ```
   rgba(250, 248, 255, 0.8) 50%,
   ```

5. **RGBA**: `rgba(240, 248, 255, 0.9)` (라인 12)
   ```
   rgba(240, 248, 255, 0.9) 75%,
   ```

6. **RGBA**: `rgba(245, 250, 255, 0.8)` (라인 13)
   ```
   rgba(245, 250, 255, 0.8) 100%);
   ```

---

### 📁 `frontend/src/components/test/NotificationTest.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#374151` (라인 257)
   ```
   background: #374151;
   ```

2. **HEX_6**: `#4a5568` (라인 258)
   ```
   border-color: #4a5568;
   ```

3. **HEX_6**: `#2d3748` (라인 274)
   ```
   background: #2d3748;
   ```

4. **HEX_6**: `#4a5568` (라인 275)
   ```
   border-color: #4a5568;
   ```

5. **HEX_6**: `#2d3748` (라인 285)
   ```
   background: #2d3748;
   ```

6. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 190)
   ```
   box-shadow: 0 0 0 3px rgba(184, 230, 184, 0.2);
   ```

---

### 📁 `frontend/src/components/common/MGCard.css` (CSS)

**하드코딩 색상**: 6개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 9)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 10)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 21)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px var(--mg-shadow-light);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 53)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 55)
   ```
   0 4px 16px rgba(0, 0, 0, 0.05),
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 56)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/common/HelpPage.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#f8f9ff` (라인 5)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

2. **HEX_6**: `#e8f2ff` (라인 5)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 51)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 91)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 137)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/client/ClientMessageScreen.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#f8f9ff` (라인 146)
   ```
   background: #f8f9ff;
   ```

2. **HEX_6**: `#fff3cd` (라인 151)
   ```
   background: #fff3cd;
   ```

3. **HEX_6**: `#f8d7da` (라인 156)
   ```
   background: #f8d7da;
   ```

4. **HEX_6**: `#f8f9ff` (라인 504)
   ```
   background: #f8f9ff;
   ```

5. **HEX_6**: `#fff3cd` (라인 509)
   ```
   background: #fff3cd;
   ```

6. **HEX_6**: `#f8d7da` (라인 514)
   ```
   background: #f8d7da;
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeStats.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#1d4ed8` (라인 40)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

2. **HEX_6**: `#059669` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-success-500), #059669);
   ```

3. **HEX_6**: `#dc2626` (라인 48)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #dc2626);
   ```

4. **HEX_6**: `#7c3aed` (라인 52)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500), #7c3aed);
   ```

5. **HEX_6**: `#1f2937` (라인 62)
   ```
   color: #1f2937;
   ```

6. **HEX_6**: `#6b7280` (라인 69)
   ```
   color: #6b7280;
   ```

---

### 📁 `frontend/src/pages/PremiumDesignSample.js` (JS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#764ba2` (라인 37)
   ```
   color: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)'
   ```

2. **HEX_6**: `#f5576c` (라인 43)
   ```
   color: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)'
   ```

3. **HEX_6**: `#4facfe` (라인 49)
   ```
   color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
   ```

4. **HEX_6**: `#00f2fe` (라인 49)
   ```
   color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
   ```

5. **HEX_6**: `#43e97b` (라인 55)
   ```
   color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
   ```

6. **HEX_6**: `#38f9d7` (라인 55)
   ```
   color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
   ```

---

### 📁 `frontend/src/components/samples/MobileUISample.js` (JS)

**하드코딩 색상**: 6개

1. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 171)
   ```
   background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 179)
   ```
   e.target.style.boxShadow = '0 4px 8px var(--mood-accent, rgba(0, 122, 255, 0.2))';
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 209)
   ```
   border: '1px solid rgba(0, 0, 0, 0.04)',
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 220)
   ```
   e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
   ```

5. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 295)
   ```
   background: 'rgba(142, 142, 147, 0.12)',
   ```

6. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 395)
   ```
   button.type === 'secondary' ? 'rgba(142, 142, 147, 0.12)' :
   ```

---

### 📁 `frontend/src/components/common/PrivacyPolicy.js` (JS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#fff3cd` (라인 97)
   ```
   background: '#fff3cd',
   ```

2. **HEX_6**: `#ffeaa7` (라인 98)
   ```
   border: '1px solid #ffeaa7',
   ```

3. **HEX_6**: `#856404` (라인 103)
   ```
   <p className="mg-v2-text-sm mg-v2-m-0" style={{ color: '#856404' }}>
   ```

4. **HEX_6**: `#e8f4fd` (라인 186)
   ```
   background: '#e8f4fd',
   ```

5. **HEX_6**: `#bee5eb` (라인 187)
   ```
   border: '1px solid #bee5eb',
   ```

6. **HEX_6**: `#0c5460` (라인 192)
   ```
   <p style={{ margin: '0', fontSize: 'var(--font-size-sm)', color: '#0c5460' }}>
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingStats.js` (JS)

**하드코딩 색상**: 6개

1. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 161)
   ```
   bgColor: 'var(--color-warning-light, rgba(255, 193, 7, 0.1))',
   ```

2. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 170)
   ```
   bgColor: 'var(--color-success-light, rgba(40, 167, 69, 0.1))',
   ```

3. **RGBA**: `rgba(23, 162, 184, 0.1)` (라인 179)
   ```
   bgColor: 'var(--color-info-light, rgba(23, 162, 184, 0.1))',
   ```

4. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 188)
   ```
   bgColor: 'var(--color-primary-light, rgba(0, 122, 255, 0.1))',
   ```

5. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 197)
   ```
   bgColor: 'var(--color-danger-light, rgba(220, 53, 69, 0.1))',
   ```

6. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 206)
   ```
   bgColor: 'var(--color-warning-light, rgba(255, 193, 7, 0.1))',
   ```

---

### 📁 `frontend/src/components/landing/CounselingAbout.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#1a202c` (라인 23)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 30)
   ```
   color: #4a5568;
   ```

3. **HEX_6**: `#1a202c` (라인 60)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#4a5568` (라인 66)
   ```
   color: #4a5568;
   ```

5. **RGBA**: `rgba(245, 250, 255, 0.3)` (라인 7)
   ```
   background: rgba(245, 250, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/erp/common/ErpCard.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 12)
   ```
   background-color: rgba(255, 255, 255, 0.1);
   ```

2. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 15)
   ```
   box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 16)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 21)
   ```
   border-bottom: 2px solid rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(31, 38, 135, 0.45)` (라인 55)
   ```
   box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45);
   ```

---

### 📁 `frontend/src/components/admin/ImprovedCommonCodeManagement.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#f1f3f4` (라인 401)
   ```
   background: #f1f3f4;
   ```

2. **HEX_6**: `#d4edda` (라인 435)
   ```
   background: #d4edda;
   ```

3. **HEX_6**: `#212529` (라인 538)
   ```
   color: #212529;
   ```

4. **HEX_6**: `#f3f3f3` (라인 664)
   ```
   border: 4px solid #f3f3f3;
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 319)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/AccountManagement.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#e9ecef` (라인 13)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 196)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

3. **HEX_6**: `#d4edda` (라인 219)
   ```
   background: #d4edda;
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 105)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   ```

5. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 148)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/widgets/SecurityMonitoringWidget.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 115)
   ```
   background: rgba(76, 175, 80, 0.1);
   ```

2. **RGBA**: `rgba(139, 195, 74, 0.1)` (라인 120)
   ```
   background: rgba(139, 195, 74, 0.1);
   ```

3. **RGBA**: `rgba(255, 152, 0, 0.1)` (라인 125)
   ```
   background: rgba(255, 152, 0, 0.1);
   ```

4. **RGBA**: `rgba(244, 67, 54, 0.1)` (라인 130)
   ```
   background: rgba(244, 67, 54, 0.1);
   ```

5. **RGBA**: `rgba(255, 152, 0, 0.1)` (라인 303)
   ```
   background: rgba(255, 152, 0, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingActions.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#e1e8ed` (라인 9)
   ```
   border-top: 1px solid #e1e8ed;
   ```

2. **HEX_6**: `#218838` (라인 73)
   ```
   background-color: #218838;
   ```

3. **HEX_6**: `#212529` (라인 89)
   ```
   color: #212529;
   ```

4. **HEX_6**: `#e0a800` (라인 93)
   ```
   background-color: #e0a800;
   ```

5. **HEX_6**: `#5a6268` (라인 113)
   ```
   background-color: #5a6268;
   ```

---

### 📁 `frontend/src/hooks/usePrint.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_3**: `#333` (라인 45)
   ```
   borderBottom: '2px solid #333',
   ```

2. **HEX_3**: `#666` (라인 55)
   ```
   color: '#666',
   ```

3. **HEX_3**: `#666` (라인 65)
   ```
   color: '#666',
   ```

4. **HEX_3**: `#ccc` (라인 66)
   ```
   borderTop: '1px solid #ccc',
   ```

5. **HEX_3**: `#333` (라인 81)
   ```
   border: '1px solid #333',
   ```

---

### 📁 `frontend/src/components/test/UnifiedModalTest.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_3**: `#ddd` (라인 146)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
   ```

2. **HEX_3**: `#ddd` (라인 154)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
   ```

3. **HEX_3**: `#ddd` (라인 161)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
   ```

4. **HEX_6**: `#6f42c1` (라인 60)
   ```
   style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
   ```

5. **HEX_6**: `#fd7e14` (라인 67)
   ```
   style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
   ```

---

### 📁 `frontend/src/components/homepage/Homepage.js` (JS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 295)
   ```
   background: 'rgba(255, 255, 255, 0.1)',
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 305)
   ```
   background: 'rgba(255, 255, 255, 0.08)',
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 314)
   ```
   backgroundColor: 'var(--color-bg-glass, rgba(255, 255, 255, 0.2))',
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 318)
   ```
   border: '1px solid rgba(255, 255, 255, 0.3)'
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 323)
   ```
   color: 'rgba(255, 255, 255, 0.95)',
   ```

---

### 📁 `frontend/src/components/common/PrintComponent.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_3**: `#333` (라인 48)
   ```
   borderBottom: '2px solid #333',
   ```

2. **HEX_3**: `#666` (라인 58)
   ```
   color: '#666',
   ```

3. **HEX_3**: `#666` (라인 68)
   ```
   color: '#666',
   ```

4. **HEX_3**: `#ccc` (라인 69)
   ```
   borderTop: '1px solid #ccc',
   ```

5. **HEX_3**: `#333` (라인 84)
   ```
   border: '1px solid #333',
   ```

---

### 📁 `frontend/src/components/auth/ResetPassword.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#48bb78` (라인 271)
   ```
   backgroundColor: '#48bb78',
   ```

2. **HEX_6**: `#2d3748` (라인 286)
   ```
   color: '#2d3748',
   ```

3. **HEX_6**: `#718096` (라인 294)
   ```
   color: '#718096',
   ```

4. **HEX_6**: `#764ba2` (라인 311)
   ```
   background: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

5. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 320)
   ```
   e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
   ```

---

### 📁 `frontend/src/components/admin/PaymentConfirmationModal.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#fee500` (라인 112)
   ```
   { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: '#fee500', description: '카카오페이 간편결제' },
   ```

2. **HEX_6**: `#03c75a` (라인 113)
   ```
   { value: 'NAVER_PAY', label: '네이버페이', icon: '💚', color: '#03c75a', description: '네이버페이 간편결제' },
   ```

3. **HEX_6**: `#0064ff` (라인 114)
   ```
   { value: 'TOSS', label: '토스', icon: '🔷', color: '#0064ff', description: '토스 간편결제' },
   ```

4. **HEX_6**: `#0070ba` (라인 115)
   ```
   { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: '#0070ba', description: '페이팔 결제' },
   ```

5. **HEX_6**: `#6b7280` (라인 116)
   ```
   { value: 'OTHER', label: '기타', icon: '💱', color: '#6b7280', description: '기타 결제 방법' }
   ```

---

### 📁 `frontend/src/styles/index.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 48)
   ```
   background: var(--modal-backdrop, rgba(0, 0, 0, 0.3));
   ```

2. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 58)
   ```
   background: var(--modal-bg, rgba(250, 250, 250, 0.98));
   ```

3. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 65)
   ```
   border: 1px solid var(--modal-border, rgba(209, 209, 214, 0.8));
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 125)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-buttons.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 30)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 85)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

3. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 90)
   ```
   background: rgba(0, 122, 255, 0.2);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 189)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/wellness/MindfulnessGuide.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(152, 216, 200, 0.2)` (라인 182)
   ```
   border: 1px solid rgba(152, 216, 200, 0.2);
   ```

2. **RGBA**: `rgba(152, 216, 200, 0.15)` (라인 211)
   ```
   border-bottom: 1px solid rgba(152, 216, 200, 0.15);
   ```

3. **RGBA**: `rgba(152, 216, 200, 0.1)` (라인 514)
   ```
   border-color: rgba(152, 216, 200, 0.1);
   ```

4. **RGBA**: `rgba(152, 216, 200, 0.08)` (라인 523)
   ```
   border-bottom-color: rgba(152, 216, 200, 0.08);
   ```

---

### 📁 `frontend/src/components/ui/MultiSelectCheckbox.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 27)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
   ```

2. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 32)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
   ```

3. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 107)
   ```
   box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
   ```

4. **RGBA**: `rgba(76, 175, 80, 0.2)` (라인 219)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
   ```

---

### 📁 `frontend/src/components/layout/DashboardSection.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#e9ecef` (라인 14)
   ```
   border: var(--border-width-thin) solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 23)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

3. **HEX_6**: `#2c3e50` (라인 42)
   ```
   color: #2c3e50;
   ```

4. **HEX_6**: `#2c3e50` (라인 61)
   ```
   color: #2c3e50;
   ```

---

### 📁 `frontend/src/components/erp/QuickExpenseForm.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_3**: `#fee` (라인 70)
   ```
   background-color: #fee;
   ```

2. **HEX_3**: `#c33` (라인 71)
   ```
   color: #c33;
   ```

3. **HEX_3**: `#c33` (라인 75)
   ```
   border-left: 4px solid #c33;
   ```

4. **RGBA**: `rgba(0,0,0,0.1)` (라인 110)
   ```
   box-shadow: 0 4px 15px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantRecords.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 92)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 115)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 236)
   ```
   background: rgba(0, 123, 255, 0.1);
   ```

4. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 239)
   ```
   border: var(--border-width) solid rgba(0, 123, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/common/MGStatistics.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 75)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 247)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 308)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

4. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 376)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/common/MGFilter.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 103)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

3. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 132)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

4. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 250)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/common/LoadingSpinner.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#0056CC` (라인 62)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

2. **HEX_6**: `#0056CC` (라인 86)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

3. **HEX_6**: `#0056CC` (라인 114)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

4. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 231)
   ```
   background: var(--color-bg-glass-strong, rgba(250, 250, 250, 0.95));
   ```

---

### 📁 `frontend/src/components/common/CommonLoading.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 18)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 30)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 92)
   ```
   background: rgba(0, 0, 0, 0.8);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 96)
   ```
   background: rgba(0, 0, 0, 0.6);
   ```

---

### 📁 `frontend/src/components/common/AutoResponsiveWrapper.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 39)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

2. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 52)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 53)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 110)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/client/ClientSettings.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f8f9ff` (라인 7)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

2. **HEX_6**: `#e8f2ff` (라인 7)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 19)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/SystemConfigManagement.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 24)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 149)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 211)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 245)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/utils/ratingHelper.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#ffd700` (라인 85)
   ```
   return { grade: 'S', color: '#ffd700', label: '최고' };
   ```

2. **HEX_6**: `#4ecdc4` (라인 89)
   ```
   return { grade: 'B', color: '#4ecdc4', label: '양호' };
   ```

3. **HEX_6**: `#45b7d1` (라인 91)
   ```
   return { grade: 'C', color: '#45b7d1', label: '보통' };
   ```

4. **HEX_6**: `#f9ca24` (라인 93)
   ```
   return { grade: 'D', color: '#f9ca24', label: '미흡' };
   ```

---

### 📁 `frontend/src/constants/magicNumbers.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6f42c1` (라인 223)
   ```
   PRIMARY_COLORS: ['var(--mg-primary-500)', 'var(--mg-success-500)', 'var(--mg-warning-500)', 'var(--mg-error-500)', '#6f42c1'],
   ```

2. **HEX_6**: `#fd7e14` (라인 224)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

3. **HEX_6**: `#20c997` (라인 224)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

4. **HEX_6**: `#e83e8c` (라인 224)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleModal.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#ec4899` (라인 101)
   ```
   { value: 'COUPLE', label: '부부상담', icon: null, color: '#ec4899', durationMinutes: 80 },
   ```

2. **HEX_6**: `#ec4899` (라인 154)
   ```
   { value: '80_MIN', label: '80분', icon: null, color: '#ec4899', durationMinutes: 80, description: '80분 상담' },
   ```

3. **HEX_6**: `#f97316` (라인 156)
   ```
   { value: '100_MIN', label: '100분', icon: null, color: '#f97316', durationMinutes: 100, description: '100분 상담' },
   ```

4. **HEX_6**: `#6b7280` (라인 158)
   ```
   { value: 'CUSTOM', label: '사용자 정의', icon: null, color: '#6b7280', durationMinutes: 0, description: '사용자가 직접 설정하는 상담 시간' }
   ```

---

### 📁 `frontend/src/components/hq/ConsolidatedFinancial.js` (JS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 220)
   ```
   backgroundColor: 'rgba(40, 167, 69, 0.2)',
   ```

2. **RGBA**: `rgba(40, 167, 69, 1)` (라인 221)
   ```
   borderColor: 'rgba(40, 167, 69, 1)',
   ```

3. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 228)
   ```
   backgroundColor: 'rgba(220, 53, 69, 0.2)',
   ```

4. **RGBA**: `rgba(220, 53, 69, 1)` (라인 229)
   ```
   borderColor: 'rgba(220, 53, 69, 1)',
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantClientList.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6b7280` (라인 184)
   ```
   { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
   ```

2. **HEX_6**: `#059669` (라인 186)
   ```
   { value: 'COMPLETED', label: '완료', icon: '✅', color: '#059669', description: '완료된 사용자' },
   ```

3. **HEX_6**: `#dc2626` (라인 187)
   ```
   { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#dc2626', description: '일시정지된 사용자' }
   ```

4. **HEX_6**: `#6b7280` (라인 418)
   ```
   color: '#6b7280'
   ```

---

### 📁 `frontend/src/components/common/MGCard.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#D2B48C` (라인 19)
   ```
   default: "bg-[var(--mg-cream)] shadow-sm border border-[#D2B48C]/20",
   ```

2. **HEX_6**: `#D2B48C` (라인 20)
   ```
   elevated: "bg-[var(--mg-cream)] shadow-lg border border-[#D2B48C]/20",
   ```

3. **HEX_6**: `#D2B48C` (라인 21)
   ```
   outlined: "bg-[var(--mg-cream)] border-2 border-[#D2B48C]",
   ```

4. **HEX_6**: `#D2B48C` (라인 22)
   ```
   glass: "bg-[var(--mg-cream)]/25 backdrop-blur-md border border-[#D2B48C]/18",
   ```

---

### 📁 `frontend/src/components/auth/TabletLogin.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#5a67d8` (라인 744)
   ```
   e.target.style.color = '#5a67d8';
   ```

2. **HEX_6**: `#e9ecef` (라인 914)
   ```
   border: '1px solid #e9ecef',
   ```

3. **HEX_6**: `#495057` (라인 926)
   ```
   color: '#495057',
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 905)
   ```
   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
   ```

---

### 📁 `frontend/src/components/admin/MappingManagement.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6f42c1` (라인 223)
   ```
   'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
   ```

2. **HEX_6**: `#fd7e14` (라인 225)
   ```
   'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
   ```

3. **HEX_6**: `#6f42c1` (라인 237)
   ```
   'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
   ```

4. **HEX_6**: `#fd7e14` (라인 239)
   ```
   'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
   ```

---

### 📁 `frontend/src/styles/06-components/_notifications.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 220)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 232)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 242)
   ```
   background: rgba(0, 0, 0, 0.6);
   ```

---

### 📁 `frontend/src/styles/06-components/_complex-data/_data-card.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 122, 255, 0.05)` (라인 91)
   ```
   background: rgba(0, 122, 255, 0.05);
   ```

2. **RGBA**: `rgba(255, 59, 48, 0.05)` (라인 96)
   ```
   background: rgba(255, 59, 48, 0.05);
   ```

3. **RGBA**: `rgba(52, 199, 89, 0.05)` (라인 101)
   ```
   background: rgba(52, 199, 89, 0.05);
   ```

---

### 📁 `frontend/src/styles/02-tools/_mixins.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 10)
   ```
   border: 1px solid rgba(255, 255, 255, 0.18);
   ```

2. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 12)
   ```
   0 8px 32px rgba(31, 38, 135, 0.37),
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 13)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

---

### 📁 `frontend/src/styles/01-settings/_shadows.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 5)
   ```
   --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
   ```

2. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 11)
   ```
   --shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.37);
   ```

3. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 12)
   ```
   --shadow-glass-strong: 0 12px 40px rgba(31, 38, 135, 0.5);
   ```

---

### 📁 `frontend/src/pages/ComponentTestPage.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#2c3e50` (라인 19)
   ```
   color: #2c3e50;
   ```

2. **HEX_6**: `#2c3e50` (라인 40)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

---

### 📁 `frontend/src/components/mypage/components/SettingsSection.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 21)
   ```
   color: #333;
   ```

2. **HEX_6**: `#e9ecef` (라인 14)
   ```
   border: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#5a6268` (라인 40)
   ```
   background: #5a6268;
   ```

---

### 📁 `frontend/src/components/mypage/components/SecuritySection.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 21)
   ```
   color: #333;
   ```

2. **HEX_6**: `#e9ecef` (라인 14)
   ```
   border: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#c82333` (라인 40)
   ```
   background: #c82333;
   ```

---

### 📁 `frontend/src/components/mypage/components/AddressInput.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#0056b3` (라인 23)
   ```
   --address-search-btn-hover-bg: #0056b3;
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 10)
   ```
   --address-select-focus-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 16)
   ```
   --address-input-focus-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/hq/FinancialReports.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 325)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.1);
   ```

2. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 342)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.1);
   ```

3. **RGBA**: `rgba(128, 128, 0, 0.2)` (라인 556)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/homepage/Homepage.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#f5f7fa` (라인 5)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 5)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 12)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/NavigationMenuWidget.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 37)
   ```
   color: #333;
   ```

2. **HEX_6**: `#e7f3ff` (라인 51)
   ```
   background-color: #e7f3ff;
   ```

3. **HEX_6**: `#e5e5e5` (라인 93)
   ```
   border-left: 2px solid #e5e5e5;
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/erp/ErpWidget.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 103)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

2. **HEX_3**: `#666` (라인 108)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

3. **HEX_6**: `#e3f2fd` (라인 94)
   ```
   background: var(--mg-color-primary-light, #e3f2fd);
   ```

---

### 📁 `frontend/src/components/common/StatsCardGrid.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 123, 255, 0.02)` (라인 146)
   ```
   rgba(0, 123, 255, 0.02) 0%,
   ```

2. **RGBA**: `rgba(40, 167, 69, 0.02)` (라인 147)
   ```
   rgba(40, 167, 69, 0.02) 50%,
   ```

3. **RGBA**: `rgba(255, 193, 7, 0.02)` (라인 148)
   ```
   rgba(255, 193, 7, 0.02) 100%);
   ```

---

### 📁 `frontend/src/components/common/StatsCard.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 96)
   ```
   background: rgba(40, 167, 69, 0.1);
   ```

2. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 101)
   ```
   background: rgba(220, 53, 69, 0.1);
   ```

3. **RGBA**: `rgba(220, 53, 69, 0.05)` (라인 203)
   ```
   background: rgba(220, 53, 69, 0.05);
   ```

---

### 📁 `frontend/src/components/common/SalaryPrintComponent.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#666` (라인 169)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 191)
   ```
   color: #666;
   ```

3. **HEX_6**: `#f9f9f9` (라인 186)
   ```
   background: #f9f9f9;
   ```

---

### 📁 `frontend/src/components/common/MGPagination.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 40)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 191)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

3. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 258)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/constants/vacation.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#FF5722` (라인 31)
   ```
   [VACATION_TYPES.AFTERNOON]: '#FF5722',    // 딥오렌지
   ```

2. **HEX_6**: `#FF7043` (라인 34)
   ```
   [VACATION_TYPES.AFTERNOON_HALF]: '#FF7043', // 딥오렌지
   ```

3. **HEX_6**: `#9C27B0` (라인 35)
   ```
   [VACATION_TYPES.CUSTOM_TIME]: '#9C27B0'   // 퍼플
   ```

---

### 📁 `frontend/src/components/erp/refund/RefundHistoryTable.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#666` (라인 98)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>
   ```

2. **HEX_3**: `#666` (라인 116)
   ```
   color: '#666',
   ```

3. **HEX_6**: `#6f42c1` (라인 18)
   ```
   'CONFIRMED': { text: '확인완료', color: '#6f42c1' }
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationHistory.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#059669` (라인 56)
   ```
   { value: 'COMPLETED', label: '완료', icon: '🎉', color: '#059669' },
   ```

2. **HEX_6**: `#dc2626` (라인 58)
   ```
   { value: 'NO_SHOW', label: '무단결석', icon: '🚫', color: '#dc2626' },
   ```

3. **HEX_6**: `#f97316` (라인 59)
   ```
   { value: 'RESCHEDULED', label: '재예약', icon: '🔄', color: '#f97316' }
   ```

---

### 📁 `frontend/src/components/common/ScheduleList.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#6b7280` (라인 76)
   ```
   { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 일정' },
   ```

2. **HEX_6**: `#059669` (라인 81)
   ```
   { value: 'COMPLETED', label: '완료된 일정', icon: '✅', color: '#059669', description: '완료된 일정' }
   ```

3. **HEX_6**: `#06b6d4` (라인 111)
   ```
   { value: 'STATUS_DESC', label: '상태 내림차순', icon: '🔄', color: '#06b6d4', description: '상태 내림차순 정렬' }
   ```

---

### 📁 `frontend/src/index.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#333` (라인 17)
   ```
   color: #333;
   ```

2. **HEX_6**: `#0056b3` (라인 246)
   ```
   background: #0056b3;
   ```

---

### 📁 `frontend/src/styles/common/index.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 159)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 225)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/styles/common/components.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 491)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

2. **RGBA**: `rgba(124, 58, 237, 0.1)` (라인 625)
   ```
   box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
   ```

---

### 📁 `frontend/src/styles/03-generic/_reset.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 75)
   ```
   background: rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 80)
   ```
   background: rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/ui/Modal/Modal.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 38)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 312)
   ```
   background-color: rgba(0, 0, 0, 0.7);
   ```

---

### 📁 `frontend/src/components/erp/SalaryManagement.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#059669` (라인 403)
   ```
   background: #059669;
   ```

2. **HEX_6**: `#dc2626` (라인 414)
   ```
   background: #dc2626;
   ```

---

### 📁 `frontend/src/components/erp/refund/RefundReasonStats.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#666` (라인 28)
   ```
   color: #666;
   ```

2. **HEX_6**: `#e9ecef` (라인 11)
   ```
   border: 1px solid #e9ecef;
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantMessages.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 72)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 88)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/common/Modal.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#545b62` (라인 185)
   ```
   background: #545b62;
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 19)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/common/MGTable.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 124)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(26, 32, 44, 0.9)` (라인 208)
   ```
   background: rgba(26, 32, 44, 0.9);
   ```

---

### 📁 `frontend/src/components/common/MGButton.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 176)
   ```
   background: var(--droplet-bg, rgba(255, 255, 255, 0.7));
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 194)
   ```
   background: var(--droplet-bg-dark, rgba(0, 0, 0, 0.8));
   ```

---

### 📁 `frontend/src/components/common/FormInput.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 56)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

2. **RGBA**: `rgba(255, 59, 48, 0.1)` (라인 61)
   ```
   box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
   ```

---

### 📁 `frontend/src/components/auth/AuthPageCommon.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(156, 214, 156, 0.2)` (라인 160)
   ```
   box-shadow: 0 0 0 4px rgba(156, 214, 156, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 209)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/admin/PermissionManagement.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 6)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 183)
   ```
   box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/CacheMonitoringDashboard.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#ccc` (라인 89)
   ```
   background: #ccc;
   ```

2. **HEX_6**: `#D32F2F` (라인 104)
   ```
   background: #D32F2F;
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 128)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 130)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/academy/shared/EmptyState.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#666` (라인 21)
   ```
   color: var(--color-text-secondary, #666);
   ```

2. **HEX_6**: `#0056b3` (라인 39)
   ```
   background: var(--color-primary-dark, #0056b3);
   ```

---

### 📁 `frontend/src/utils/consultantHelper.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 28)
   ```
   color: code.colorCode || '#6b7280',
   ```

2. **HEX_6**: `#dc2626` (라인 43)
   ```
   'CONSULTANT_MASTER': { color: '#dc2626', icon: '👑', label: '마스터 상담사' }
   ```

---

### 📁 `frontend/src/components/mypage/components/ProfileSection.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#ec4899` (라인 40)
   ```
   { value: 'FEMALE', label: '여성', icon: '♀️', color: '#ec4899' },
   ```

2. **HEX_6**: `#6b7280` (라인 41)
   ```
   { value: 'OTHER', label: '기타', icon: '⚧', color: '#6b7280' }
   ```

---

### 📁 `frontend/src/components/mindgarden/TableShowcase.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 28)
   ```
   case '비활성': return '#6b7280';
   ```

2. **HEX_6**: `#6b7280` (라인 29)
   ```
   default: return '#6b7280';
   ```

---

### 📁 `frontend/src/components/mindgarden/ClientCardShowcase.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 48)
   ```
   case '완료': return '#6b7280';
   ```

2. **HEX_6**: `#6b7280` (라인 49)
   ```
   default: return '#6b7280';
   ```

---

### 📁 `frontend/src/components/erp/SuperAdminApprovalDashboard.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#ddd` (라인 305)
   ```
   border: '1px solid #ddd',
   ```

2. **HEX_3**: `#ddd` (라인 373)
   ```
   border: '1px solid #ddd',
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantRecords.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 33)
   ```
   { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상담기록' },
   ```

2. **HEX_6**: `#6b7280` (라인 49)
   ```
   { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상담기록' },
   ```

---

### 📁 `frontend/src/components/compliance/ComplianceDashboard.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#8BC34A` (라인 72)
   ```
   case '양호': return '#8BC34A';
   ```

2. **HEX_6**: `#9E9E9E` (라인 76)
   ```
   default: return '#9E9E9E';
   ```

---

### 📁 `frontend/src/components/auth/TabletRegister.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#ec4899` (라인 89)
   ```
   { value: 'FEMALE', label: '여성', icon: '♀️', color: '#ec4899' },
   ```

2. **HEX_6**: `#6b7280` (라인 90)
   ```
   { value: 'OTHER', label: '기타', icon: '⚧', color: '#6b7280' }
   ```

---

### 📁 `frontend/src/components/auth/SocialSignupModal.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#FEE500` (라인 370)
   ```
   data-provider-color={socialUser?.provider === 'KAKAO' ? '#FEE500' : '#03C75A'}></i>
   ```

2. **HEX_6**: `#03C75A` (라인 370)
   ```
   data-provider-color={socialUser?.provider === 'KAKAO' ? '#FEE500' : '#03C75A'}></i>
   ```

---

### 📁 `frontend/src/components/admin/VacationManagementModal.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#fbbf24` (라인 99)
   ```
   { value: 'MORNING_HALF_1', label: '오전 반반차 1 (09:00-11:00)', icon: '☀️', color: '#fbbf24', description: '오전 첫 번째 반반차 (09:00-11:00)' },
   ```

2. **HEX_6**: `#60a5fa` (라인 101)
   ```
   { value: 'AFTERNOON_HALF_1', label: '오후 반반차 1 (14:00-16:00)', icon: '🌤️', color: '#60a5fa', description: '오후 첫 번째 반반차 (14:00-16:00)' },
   ```

---

### 📁 `frontend/src/components/admin/TenantCodeManagement.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 332)
   ```
   style={{ color: code.colorCode || '#6b7280' }}
   ```

2. **HEX_6**: `#6b7280` (라인 479)
   ```
   value={formData.colorCode || '#6b7280'}
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard_backup.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#666` (라인 1339)
   ```
   color: '#666'
   ```

2. **HEX_6**: `#e9ecef` (라인 1349)
   ```
   border: '1px solid #e9ecef',
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeList.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6b7280` (라인 58)
   ```
   {code.icon && <span className="code-icon" style={{ color: code.colorCode || '#6b7280' }}>{code.icon}</span>}
   ```

2. **HEX_6**: `#6b7280` (라인 105)
   ```
   <span className="code-icon-display" style={{ color: code.colorCode || '#6b7280' }}>
   ```

---

### 📁 `frontend/src/components/admin/ClientComprehensiveManagement/ClientStatisticsTab.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#6f42c1` (라인 134)
   ```
   {renderChartData('등급별 내담자 분포', clientsByGrade, '#6f42c1')}
   ```

2. **HEX_6**: `#fd7e14` (라인 137)
   ```
   renderChartData('월별 상담 수', consultationsByMonth, '#fd7e14')
   ```

---

### 📁 `frontend/src/styles/06-components/_loading.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_loading.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-page-header.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#ccc` (라인 179)
   ```
   border: 1px solid #ccc;
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-modals.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 13)
   ```
   background: rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/settings/UserSettings.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 153)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleCalendar.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#212529` (라인 209)
   ```
   color: #212529;
   ```

---

### 📁 `frontend/src/components/layout/SimpleLayout.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 122)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/erp/SalaryProfileFormModal.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#dc2626` (라인 168)
   ```
   background: #dc2626;
   ```

---

### 📁 `frontend/src/components/erp/SalaryConfigModal.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 145)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

---

### 📁 `frontend/src/components/erp/ConsultantProfileModal.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 219)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

---

### 📁 `frontend/src/components/erp/refund/RefundFilters.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#ddd` (라인 20)
   ```
   border: 2px solid #ddd;
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/common/ErpCardWidget.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#666` (라인 16)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

---

### 📁 `frontend/src/components/common/StatCard.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#e9ecef` (라인 10)
   ```
   border: var(--border-width-thin) solid #e9ecef;
   ```

---

### 📁 `frontend/src/components/common/ComingSoon.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/widgets/ApiPerformanceWidget.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(244, 67, 54, 0.1)` (라인 238)
   ```
   background: rgba(244, 67, 54, 0.1);
   ```

---

### 📁 `frontend/src/components/academy/shared/LoadingState.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#666` (라인 16)
   ```
   color: var(--color-text-secondary, #666);
   ```

---

### 📁 `frontend/src/components/academy/shared/FormField.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#333` (라인 13)
   ```
   color: var(--color-text-primary, #333);
   ```

---

### 📁 `frontend/src/components/academy/shared/ErrorState.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#0056b3` (라인 38)
   ```
   background: var(--color-primary-dark, #0056b3);
   ```

---

### 📁 `frontend/src/components/academy/shared/DataTable.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 16)
   ```
   background-color: var(--color-hover, rgba(0, 123, 255, 0.1));
   ```

---

### 📁 `frontend/src/pages/iPhone17DesignSystemSample.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#00C7BE` (라인 21)
   ```
   { id: 'cool', name: '시원한', color: '#00C7BE' },
   ```

---

### 📁 `frontend/src/constants/schedule.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#b8b8b8` (라인 35)
   ```
   [STATUS.COMPLETED]: '#b8b8b8',    // 연한 회색 (완료된 상태)
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleDetailModal.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 53)
   ```
   let color = '#6b7280';
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleCalendar.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 90)
   ```
   color: code.colorCode || '#6b7280',
   ```

---

### 📁 `frontend/src/components/schedule/components/ConsultantFilter.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#424245` (라인 35)
   ```
   { value: 'all', label: '전체', color: 'var(--color-text-secondary, #424245)' },
   ```

---

### 📁 `frontend/src/components/mypage/components/ProfileImageUpload.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#f0f0f0` (라인 50)
   ```
   <circle cx="60" cy="60" r="60" fill="#f0f0f0"/>
   ```

---

### 📁 `frontend/src/components/mypage/components/AddressInput.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 51)
   ```
   { value: 'OTHER', label: '기타', icon: '📍', color: '#6b7280', description: '기타 주소' }
   ```

---

### 📁 `frontend/src/components/mindgarden/ConsultantCardShowcase.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 55)
   ```
   default: return '#6b7280';
   ```

---

### 📁 `frontend/src/components/common/MGChart.js` (JS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 53)
   ```
   backgroundColor: 'rgba(0, 0, 0, 0.8)',
   ```

---

### 📁 `frontend/src/components/common/Chart.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#2c3e50` (라인 101)
   ```
   color: '#2c3e50'
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeFilters.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 53)
   ```
   { value: '', label: '전체 상태', icon: '📋', color: '#6b7280', description: '모든 상태' },
   ```

---

