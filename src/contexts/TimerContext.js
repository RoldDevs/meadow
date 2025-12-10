import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { showTimerNotification, dismissTimerNotification } from '../services/notificationService';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [phase, setPhase] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const notificationUpdateRef = useRef(null);

  const startTimer = (durationSeconds, phaseType) => {
    const newStartTime = Date.now();
    setDuration(durationSeconds);
    setStartTime(newStartTime);
    setPhase(phaseType);
    setRemainingTime(durationSeconds);

    if (intervalId) clearInterval(intervalId);
    
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - newStartTime) / 1000);
      const timeLeft = Math.max(durationSeconds - elapsed, 0);
      setRemainingTime(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(id);
      }
    }, 1000);
    
    setIntervalId(id);
  };

  const stopTimer = async () => {
    if (intervalId) clearInterval(intervalId);
    if (notificationUpdateRef.current) clearInterval(notificationUpdateRef.current);
    
    setStartTime(null);
    setDuration(0);
    setPhase('');
    setRemainingTime(0);
    
    // Dismiss notification when timer stops
    await dismissTimerNotification();
  };

  // Update notification every second when timer is running
  useEffect(() => {
    if (startTime && remainingTime > 0 && phase) {
      // Update notification immediately
      showTimerNotification(phase, remainingTime);
      
      // Clear previous notification update interval
      if (notificationUpdateRef.current) {
        clearInterval(notificationUpdateRef.current);
      }
      
      // Set up new interval to update notification every 5 seconds
      notificationUpdateRef.current = setInterval(() => {
        if (remainingTime > 0) {
          showTimerNotification(phase, remainingTime);
        }
      }, 5000);
    } else {
      // Clear notification update interval when timer is not running
      if (notificationUpdateRef.current) {
        clearInterval(notificationUpdateRef.current);
        notificationUpdateRef.current = null;
      }
    }

    return () => {
      if (notificationUpdateRef.current) {
        clearInterval(notificationUpdateRef.current);
      }
    };
  }, [startTime, remainingTime, phase]);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (notificationUpdateRef.current) clearInterval(notificationUpdateRef.current);
      dismissTimerNotification();
    };
  }, [intervalId]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        stopTimer,
        remainingTime,
        phase,
        duration,
        isRunning: startTime !== null && remainingTime > 0,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
