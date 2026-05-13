/**
 * SVG 기반 추이 꺾은선 차트 (감정 일기·자가검사 점수 공용)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMemo } from 'react';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme';

export interface LineTrendChartProps {
  readonly values: readonly number[];
  readonly labels: readonly string[];
  readonly maxValue: number;
  readonly width: number;
  readonly height: number;
}

const PADDING_X = 14;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 22;

export function LineTrendChart({
  values,
  labels,
  maxValue,
  width,
  height,
}: LineTrendChartProps) {
  const theme = useTheme();
  const plotW = Math.max(1, width - PADDING_X * 2);
  const plotH = Math.max(1, height - PADDING_TOP - PADDING_BOTTOM);
  const baseY = PADDING_TOP + plotH;

  const points = useMemo(() => {
    const n = values.length;
    if (n === 0) return '';
    const denom = n <= 1 ? 1 : n - 1;
    return values
      .map((v, i) => {
        const x = PADDING_X + (i / denom) * plotW;
        const ratio = maxValue > 0 ? Math.min(1, Math.max(0, v / maxValue)) : 0;
        const y = baseY - ratio * plotH;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values, maxValue, plotW, baseY, plotH]);

  const circles = useMemo(() => {
    const n = values.length;
    if (n === 0) return [];
    const denom = n <= 1 ? 1 : n - 1;
    return values.map((v, i) => {
      const x = PADDING_X + (i / denom) * plotW;
      const ratio = maxValue > 0 ? Math.min(1, Math.max(0, v / maxValue)) : 0;
      const y = baseY - ratio * plotH;
      return { x, y, v, i };
    });
  }, [values, maxValue, plotW, baseY, plotH]);

  if (values.length === 0) {
    return null;
  }

  return (
    <Svg width={width} height={height} accessibilityRole="image">
      <Line
        x1={PADDING_X}
        y1={baseY}
        x2={width - PADDING_X}
        y2={baseY}
        stroke={theme.colors.border}
        strokeWidth={1}
      />
      {values.length > 1 && (
        <Polyline
          points={points}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {circles.map(({ x, y, v, i }) => (
        <Circle
          key={`pt-${String(labels[i])}-${String(values[i])}`}
          cx={x}
          cy={y}
          r={5}
          fill={v > 0 ? theme.colors.primary : theme.colors.gray[200]}
          stroke={theme.colors.surface}
          strokeWidth={2}
        />
      ))}
      {labels.map((label, i) => {
        const n = values.length;
        const denom = n <= 1 ? 1 : n - 1;
        const x = PADDING_X + (i / denom) * plotW;
        return (
          <SvgText
            key={`lb-${String(labels[i])}-${String(values[i])}`}
            x={x}
            y={height - 4}
            fontSize={10}
            fill={theme.colors.textTertiary}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
