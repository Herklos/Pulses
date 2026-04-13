import React from "react";
import { View, Text } from "react-native";

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#22c55e", // green
  "#3b82f6", // blue
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 44 }: Props) {
  const bg = colorForName(name || "?");
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize, fontWeight: "700" }}>
        {initials(name || "?")}
      </Text>
    </View>
  );
}
