import { useState, useEffect } from 'react';
import { differenceInSeconds, addHours } from 'date-fns';

export const useTreatmentCountdown = (firstDoseAt: string | null, targetOffsetHours: number) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!firstDoseAt) {
      setSecondsLeft(null);
      return;
    }
    const target = addHours(new Date(firstDoseAt), targetOffsetHours);

    const tick = () => {
      const diff = differenceInSeconds(target, new Date());
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [firstDoseAt, targetOffsetHours]);

  return secondsLeft;
};
