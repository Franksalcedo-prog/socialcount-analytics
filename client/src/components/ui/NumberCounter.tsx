import React, { useEffect, useState } from 'react';

interface NumberCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  duration = 800,
  formatter = (v) => v.toLocaleString('es-ES'),
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const initialValue = displayValue;
    const difference = value - initialValue;

    if (difference === 0) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(initialValue + difference * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
};
