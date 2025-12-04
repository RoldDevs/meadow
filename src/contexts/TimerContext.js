import React, { createContext, useContext, useEffect, useState } from 'react';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [phase, setPhase] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const startTimer = (durationSeconds, phaseType) => {
    setDuration(durationSeconds);
    setStartTime(Date.now());
    setPhase(phaseType);

    setRemainingTime(durationSeconds);

    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const timeLeft = Math.max(durationSeconds - elapsed, 0);
      setRemainingTime(timeLeft);
      if (timeLeft <= 0) clearInterval(id);
    }, 1000);
    setIntervalId(id);
  };

  const stopTimer = () => {
    if (intervalId) clearInterval(intervalId);
    setStartTime(null);
    setDuration(0);
    setPhase('');
    setRemainingTime(0);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        stopTimer,
        remainingTime,
        phase,
        isRunning: startTime !== null && remainingTime > 0,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
