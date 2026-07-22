import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useTheme } from "../../../theme-system/useTheme";
import { type WaveTheme, STAT_CARD_THEMES } from "./StatCardThemes";

interface StatCardProps {
  title: string;
  value: string;
  currencySymbol?: string;
  change?: string;
  isPositive?: boolean;
  icon: IconType;
  theme: WaveTheme;
  waveIndex?: number;
}

const WAVE_AREAS = [
  "M0 100 Q40 70,80 80 T160 50 T240 30 T320 60 T400 40 L400 100 Z",
  "M0 100 Q50 85,100 75 T200 55 T300 65 T400 35 L400 100 Z",
  "M0 100 Q60 80,120 70 T240 45 T360 55 T400 28 L400 100 Z",
  "M0 100 Q40 60,80 70 T160 85 T240 50 T320 75 T400 45 L400 100 Z",
  "M0 100 Q80 75,160 65 T320 50 T400 55 L400 100 Z",
  "M0 100 Q50 70,100 80 T200 45 T300 60 T400 30 L400 100 Z",
  "M0 100 Q30 65,90 72 T210 40 T330 58 T400 38 L400 100 Z",
  "M0 100 Q45 78,110 68 T220 48 T340 62 T400 42 L400 100 Z",
];

const WAVE_LINES = [
  "M0 100 Q40 70,80 80 T160 50 T240 30 T320 60 T400 40",
  "M0 100 Q50 85,100 75 T200 55 T300 65 T400 35",
  "M0 100 Q60 80,120 70 T240 45 T360 55 T400 28",
  "M0 100 Q40 60,80 70 T160 85 T240 50 T320 75 T400 45",
  "M0 100 Q80 75,160 65 T320 50 T400 55",
  "M0 100 Q50 70,100 80 T200 45 T300 60 T400 30",
  "M0 100 Q30 65,90 72 T210 40 T330 58 T400 38",
  "M0 100 Q45 78,110 68 T220 48 T340 62 T400 42",
];

const WAVE_DOTS: { cx: number; cy: number }[][] = [
  [{ cx: 80, cy: 80 }, { cx: 160, cy: 50 }, { cx: 240, cy: 30 }, { cx: 320, cy: 60 }, { cx: 400, cy: 40 }],
  [{ cx: 100, cy: 75 }, { cx: 200, cy: 55 }, { cx: 300, cy: 65 }, { cx: 400, cy: 35 }],
  [{ cx: 120, cy: 70 }, { cx: 240, cy: 45 }, { cx: 360, cy: 55 }, { cx: 400, cy: 28 }],
  [{ cx: 80, cy: 70 }, { cx: 160, cy: 85 }, { cx: 240, cy: 50 }, { cx: 320, cy: 75 }, { cx: 400, cy: 45 }],
  [{ cx: 160, cy: 65 }, { cx: 320, cy: 50 }, { cx: 400, cy: 55 }],
  [{ cx: 100, cy: 80 }, { cx: 200, cy: 45 }, { cx: 300, cy: 60 }, { cx: 400, cy: 30 }],
  [{ cx: 90, cy: 72 }, { cx: 210, cy: 40 }, { cx: 330, cy: 58 }, { cx: 400, cy: 38 }],
  [{ cx: 110, cy: 68 }, { cx: 220, cy: 48 }, { cx: 340, cy: 62 }, { cx: 400, cy: 42 }],
];

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  currencySymbol,
  change,
  isPositive = true,
  icon: Icon,
  theme = STAT_CARD_THEMES.blue,
  waveIndex = 0,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.mode === "dark";
  const idx = waveIndex % WAVE_AREAS.length;
  const gradId = `wg-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border border-theme-border bg-theme-surface p-6 h-[160px] flex flex-col justify-between box-border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-w-0"
    >
      {/* Wave SVG — anchored to bottom, height reduced to ensure text clarity */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[35%] z-0 pointer-events-none transition-all duration-500 group-hover:opacity-100"
        style={{ opacity: isDark ? 0.5 : 0.9 }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              {/* ↓ top opacity adjusted for better visibility in both modes */}
              <stop offset="0%" stopColor={theme.waveFill} stopOpacity={isDark ? "0.15" : "0.30"} />
              <stop offset="100%" stopColor={theme.waveFill} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={WAVE_AREAS[idx]} fill={`url(#${gradId})`} />
          {/* stroke opacity — clearly visible as a trend line */}
          <path
            d={WAVE_LINES[idx]}
            fill="transparent"
            stroke={theme.waveStroke}
            strokeWidth="1.2"
            strokeOpacity={isDark ? "0.30" : "0.55"}
          />
          {/* dots radius — minimal visual noise but clearly defined */}
          {WAVE_DOTS[idx].map((pt) => (
            <circle
              key={pt.cx}
              cx={pt.cx}
              cy={pt.cy}
              r="1.8"
              fill={isDark ? theme.waveStroke : "#ffffff"}
              stroke={theme.waveStroke}
              strokeWidth="1"
              strokeOpacity={isDark ? "0.30" : "0.55"}
            />
          ))}
        </svg>
      </div>

      {/* Glow blob — adjusted for better blend and reduced weight in dark mode */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[32px] z-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: theme.glowBg,
          opacity: isDark ? 0.15 : 0.25,
        }}
      />

      {/* Top row: icon + badge */}
      <div className="relative z-[1] flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
          style={{
            background: theme.iconBg,
            boxShadow: isDark ? "none" : `0 8px 16px -4px ${theme.iconShadow}`,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {change && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-sm mr-1"
            style={{
              background: isPositive ? theme.badgePosBg : theme.badgeNegBg,
              color: isPositive ? theme.badgePosText : theme.badgeNegText,
              opacity: isDark ? 0.9 : 1,
            }}
          >
            {isPositive ? (
              <FaArrowUp className="w-2 h-2" />
            ) : (
              <FaArrowDown className="w-2 h-2" />
            )}
            {change}
          </span>
        )}
      </div>

      {/* Bottom row: title + value */}
      <div className="relative z-[1] mt-auto flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-theme-text/50 uppercase tracking-wider leading-tight">
          {title}
        </span>
        <h3 className="text-[24px] font-bold text-theme-text tracking-tight leading-none flex items-baseline gap-1.5 m-0">
          {currencySymbol && (
            <span className="text-[16px] font-semibold text-theme-text/30">
              {currencySymbol}
            </span>
          )}
          {value}
        </h3>
      </div>
    </div>
  );
};

export default StatCard;
