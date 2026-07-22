import React from "react";
import { motion, type Variants } from "framer-motion";
import { useTheme } from "../../../theme-system/useTheme";

interface LoadingComponentProps {
  text?: string;
  dotCount?: number;
  className?: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  text = "Loading content...",
  dotCount = 3,
  className = "",
}) => {
  const { currentTheme } = useTheme();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } }, // Faster fade-in
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const dotVariants: Variants = {
    bouncing: (i: number) => ({
      y: [0, -10, 0],
      transition: {
        delay: i * 0.15,
        duration: 1.0,
        ease: "easeInOut",
        repeat: Infinity,
      },
    }),
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut", delay: 0.1 } },
  };

  // Inline styles for theme colors
  const backdropStyle = {
    backgroundColor: currentTheme.colors.surface ? `${currentTheme.colors.surface}bf` : 'rgba(240, 240, 240, 0.75)', // surface color with ~75% opacity
  };

  const dotStyle = {
    backgroundColor: currentTheme.colors.icon || '#007BFF', // Fallback to a default blue
  };

  const textStyle = {
    color: currentTheme.colors.text || '#333333', // Fallback to a default dark gray
  };

  return (
    <motion.div
      className={`flex fixed inset-0 z-50 flex-col justify-center items-center backdrop-blur-sm ${className}`}
      style={backdropStyle}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-label={text}
    >
      {/* Bouncing dots with theme color */}
      <div className="flex justify-center items-center space-x-2">
        {Array.from({ length: dotCount }).map((_, i) => (
          <motion.span
            key={i}
            className="w-4 h-4 rounded-full"
            style={dotStyle}
            variants={dotVariants}
            animate="bouncing"
            custom={i}
          />
        ))}
      </div>

      {/* Animated text with theme color */}
      <motion.p
        className="mt-5 text-lg font-medium text-center max-w-xs"
        style={textStyle}
        variants={textVariants}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

export default LoadingComponent;
