import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSessionTimeoutProps {
  inactivityTimeout: number; // ms until warning
  warningTimeout: number; // ms until auto-logout after warning
  onTimeout: () => void;
}

export function useSessionTimeout({
  inactivityTimeout,
  warningTimeout,
  onTimeout,
}: UseSessionTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);

    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.floor(warningTimeout / 1000));

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set final logout timer
      warningTimerRef.current = setTimeout(() => {
        onTimeout();
      }, warningTimeout);
    }, inactivityTimeout);
  }, [inactivityTimeout, warningTimeout, onTimeout, clearAllTimers]);

  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [resetTimer, showWarning, clearAllTimers]);

  return {
    showWarning,
    countdown,
    stayLoggedIn,
  };
}
