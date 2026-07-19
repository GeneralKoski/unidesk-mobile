import { Text } from "@/src/components/ui";
import type { GradeDistribution } from "@/src/containers/dashboard/stats";
import { theme } from "@/src/styles";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const VB_W = 500;
const VB_H = 150;
const PAD_X = 30;
const PAD_Y = 20;

// Istogramma della distribuzione dei voti superati. Portato dalla web app.
export function GradeHistogram({
  distribution,
  emptyLabel,
}: {
  distribution: GradeDistribution;
  emptyLabel: string;
}) {
  const [width, setWidth] = useState(0);
  const height = width * (VB_H / VB_W);
  const { data, maxCount } = distribution;

  if (data.length === 0 || maxCount === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  const barWidth = (VB_W - PAD_X - 10) / data.length;

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Line
            x1={PAD_X}
            y1={VB_H - PAD_Y}
            x2={VB_W - 10}
            y2={VB_H - PAD_Y}
            stroke={theme.colors.gray300}
            strokeWidth="1"
          />
          {data.map((item, idx) => {
            const barHeight =
              maxCount > 0 ? (item.count / maxCount) * (VB_H - PAD_Y - 15) : 0;
            const x = PAD_X + idx * barWidth + 2;
            const y = VB_H - PAD_Y - barHeight;
            const w = barWidth - 4;
            const fill =
              item.grade === "30L"
                ? theme.colors.success
                : item.grade === "30"
                  ? theme.colors.primary
                  : "#36cfc9";
            return (
              <React.Fragment key={item.grade}>
                <Rect x={x} y={y} width={w} height={barHeight} fill={fill} rx="2" />
                {item.count > 0 ? (
                  <SvgText
                    x={x + w / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={theme.colors.gray700}
                  >
                    {item.count}
                  </SvgText>
                ) : null}
                <SvgText
                  x={x + w / 2}
                  y={VB_H - PAD_Y + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill={theme.colors.gray400}
                >
                  {item.grade}
                </SvgText>
              </React.Fragment>
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
