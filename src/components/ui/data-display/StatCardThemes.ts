export interface WaveTheme {
  waveFill: string;
  waveStroke: string;
  glowBg: string;
  iconBg: string;
  iconShadow: string;
  badgePosBg: string;
  badgeNegBg: string;
  badgePosText: string;
  badgeNegText: string;
}

export const STAT_CARD_THEMES: Record<string, WaveTheme> = {
  blue: {
    waveFill: "#3b82f6",
    waveStroke: "#3b82f6",
    glowBg: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
    iconBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    iconShadow: "rgba(59, 130, 246, 0.3)",
    badgePosBg: "rgba(34, 197, 94, 0.15)",
    badgeNegBg: "rgba(239, 68, 68, 0.15)",
    badgePosText: "#22c55e",
    badgeNegText: "#ef4444",
  },
  green: {
    waveFill: "#22c55e",
    waveStroke: "#22c55e",
    glowBg: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)",
    iconBg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    iconShadow: "rgba(34, 197, 94, 0.3)",
    badgePosBg: "rgba(34, 197, 94, 0.15)",
    badgeNegBg: "rgba(239, 68, 68, 0.15)",
    badgePosText: "#22c55e",
    badgeNegText: "#ef4444",
  },
  orange: {
    waveFill: "#f59e0b",
    waveStroke: "#f59e0b",
    glowBg: "radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)",
    iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    iconShadow: "rgba(245, 158, 11, 0.3)",
    badgePosBg: "rgba(34, 197, 94, 0.15)",
    badgeNegBg: "rgba(239, 68, 68, 0.15)",
    badgePosText: "#22c55e",
    badgeNegText: "#ef4444",
  },
  purple: {
    waveFill: "#8b5cf6",
    waveStroke: "#8b5cf6",
    glowBg: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
    iconBg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    iconShadow: "rgba(139, 92, 246, 0.3)",
    badgePosBg: "rgba(34, 197, 94, 0.15)",
    badgeNegBg: "rgba(239, 68, 68, 0.15)",
    badgePosText: "#22c55e",
    badgeNegText: "#ef4444",
  },
};
