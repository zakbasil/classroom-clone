import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  timeLimit: number; // in minutes
  startedAt: string; // ISO timestamp
  onExpire: () => void;
  className?: string;
}

export function QuizTimer({ timeLimit, startedAt, onExpire, className }: QuizTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + timeLimit * 60 * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  });

  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (remainingSeconds <= 0 && !hasExpired) {
      setHasExpired(true);
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, hasExpired, onExpire]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isLowTime = remainingSeconds <= 60; // Last minute
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60; // 1-5 minutes

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm font-mono transition-colors',
        isLowTime && 'bg-destructive/10 text-destructive border-destructive animate-pulse',
        isWarning && 'bg-secondary/10 text-secondary border-secondary',
        !isLowTime && !isWarning && 'bg-muted/50',
        className
      )}
    >
      {isLowTime ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span>{formatTime(remainingSeconds)}</span>
    </Badge>
  );
}

// Hook to check if quiz deadline has passed
export function useQuizDeadline(dueDate: string) {
  const [isPastDeadline, setIsPastDeadline] = useState(() => {
    const deadline = new Date(dueDate);
    return Date.now() > deadline.getTime();
  });

  useEffect(() => {
    const deadline = new Date(dueDate);
    const checkDeadline = () => {
      setIsPastDeadline(Date.now() > deadline.getTime());
    };

    // Check every second
    const interval = setInterval(checkDeadline, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  return isPastDeadline;
}

// Hook to calculate remaining time until deadline
export function useDeadlineCountdown(dueDate: string) {
  const [remainingTime, setRemainingTime] = useState(() => {
    const deadline = new Date(dueDate);
    return Math.max(0, deadline.getTime() - Date.now());
  });

  useEffect(() => {
    const deadline = new Date(dueDate);
    
    const updateRemaining = () => {
      setRemainingTime(Math.max(0, deadline.getTime() - Date.now()));
    };

    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  return remainingTime;
}
