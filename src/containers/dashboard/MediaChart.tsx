import { Text } from "@/src/components/ui";
import { theme } from "@/src/styles";
import type { HistoryStat } from "@/src/containers/dashboard/stats";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const VB_W = 500;
const VB_H = 220;
const PAD_X = 45;
const PAD_Y = 40;
const MIN = 18;
const MAX = 30;

// Grafico dell'andamento della media ponderata, con punti selezionabili.
// Portato dalla web app (renderSVGChart) su react-native-svg.
export function MediaChart({
  history,
  selectedIndex,
  onSelect,
  emptyLabel,
}: {
  history: HistoryStat[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  emptyLabel: string;
}) {
  const [width, setWidth] = useState(0);
  const height = width * (VB_H / VB_W);

  if (history.length < 2) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  const points = history.map((item, idx) => {
    const x =
      PAD_X + (idx / (history.length - 1)) * (VB_W - PAD_X - 20);
    const y =
      VB_H -
      PAD_Y -
      ((item.mediaPonderata - MIN) / (MAX - MIN)) * (VB_H - PAD_Y - 15);
    return { x, y, idx };
  });

  const selectedIdx = selectedIndex ?? points.length - 1;

  let activePath = `M ${points[0].x} ${points[0].y} `;
  for (let i = 1; i <= selectedIdx; i++) {
    activePath += `L ${points[i].x} ${points[i].y} `;
  }

  let inactivePath = "";
  if (selectedIndex !== null && selectedIndex < points.length - 1) {
    inactivePath = `M ${points[selectedIndex].x} ${points[selectedIndex].y} `;
    for (let i = selectedIndex + 1; i < points.length; i++) {
      inactivePath += `L ${points[i].x} ${points[i].y} `;
    }
  }

  const areaPath = `${activePath} L ${points[selectedIdx].x} ${VB_H - PAD_Y} L ${points[0].x} ${VB_H - PAD_Y} Z`;

  const labelIndices: number[] = [0];
  if (points.length >= 3) {
    const mid = Math.floor(points.length / 2);
    if (mid !== 0 && mid !== points.length - 1) labelIndices.push(mid);
  }
  labelIndices.push(points.length - 1);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Defs>
            <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={theme.colors.primary} />
              <Stop offset="100%" stopColor={theme.colors.success} />
            </LinearGradient>
          </Defs>

          {[18, 20, 22, 24, 26, 28, 30].map((val) => {
            const y =
              VB_H - PAD_Y - ((val - MIN) / (MAX - MIN)) * (VB_H - PAD_Y - 15);
            return (
              <G key={val}>
                <Line
                  x1={PAD_X}
                  y1={y}
                  x2={VB_W - 20}
                  y2={y}
                  stroke={theme.colors.gray100}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={PAD_X - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={theme.colors.gray400}
                >
                  {val}
                </SvgText>
              </G>
            );
          })}

          <Path d={areaPath} fill="url(#chartGrad)" />
          <Path
            d={activePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {inactivePath ? (
            <Path
              d={inactivePath}
              fill="none"
              stroke={theme.colors.gray300}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {labelIndices.map((idx) => {
            const pt = points[idx];
            return (
              <SvgText
                key={`lbl-${idx}`}
                x={pt.x}
                y={VB_H - PAD_Y + 16}
                textAnchor={
                  idx === 0
                    ? "start"
                    : idx === points.length - 1
                      ? "end"
                      : "middle"
                }
                fontSize="9"
                fill={theme.colors.gray400}
              >
                {history[idx].date}
              </SvgText>
            );
          })}

          {points.map((pt) => {
            const isSelected = selectedIndex === pt.idx;
            const isPast = selectedIndex === null || pt.idx <= selectedIdx;
            return (
              <Circle
                key={pt.idx}
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 6 : 12}
                fill={
                  isSelected
                    ? theme.colors.white
                    : isPast
                      ? theme.colors.primary
                      : theme.colors.gray200
                }
                stroke={isSelected ? theme.colors.primary : theme.colors.white}
                strokeWidth={isSelected ? 3 : 1.5}
                onPress={() => onSelect(pt.idx)}
              />
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  empty: {
    fontSize: 13,
    color: theme.colors.gray500,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
});
