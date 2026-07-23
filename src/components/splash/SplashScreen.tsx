import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
  'Initializing system...',
  'Loading modules...',
  'Connecting database...',
  'Preparing workspace...',
  'Almost ready...',
];

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 2000 }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1));
      setProgress(prev => {
        const next = prev + Math.random() * 15 + 5;
        return Math.min(next, 90);
      });
    }, 400);

    const finishTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(onFinish, 500);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimer);
    };
  }, [onFinish, minDuration]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-theme-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center max-w-xs w-full px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" className="fill-theme-icon" />
            <text x="32" y="42" textAnchor="middle" className="fill-white font-bold" fontSize="28">D</text>
          </svg>
        </motion.div>

        <div className="w-full bg-theme-border/20 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-theme-icon rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="h-6 mt-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              className="text-xs text-theme-text/50"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {LOADING_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-theme-text/20 mt-6">DevOS v0.1.0</p>
      </div>
    </motion.div>
  );
}
